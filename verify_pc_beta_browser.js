/* Browser smoke test for the reviewed, locally served PC Beta export.
 * Requires Playwright. Set PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE if needed.
 */
'use strict';

const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const target = new URL(process.argv[2]);
  assert.match(target.pathname, /\/pc-beta\/index\.html$/);
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
  });
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  const observe = current => {
    current.on('pageerror', error => errors.push(String(error)));
    current.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    current.on('request', request => {
      const url = request.url();
      if (/^https?:/i.test(url) && new URL(url).origin !== target.origin) externalRequests.push(url);
    });
    current.on('requestfailed', request => errors.push(`${request.failure()} ${request.url()}`));
    current.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
  };
  observe(page);
  try {
    await page.goto(target.href, { waitUntil: 'networkidle', timeout: 60000 });
    assert.equal(await page.title(), 'LoL Classic Encyclopedia');
    assert.equal(await page.evaluate(() => window.ClassicLocale?.getLocale?.()), 'en_US');
    assert.equal(await page.evaluate(() => window.__LOLCLASSIC_CONFIG__?.webBeta), true);
    assert.match(await page.locator('.pcBetaBanner').innerText(), /PC Beta/);
    for (const route of ['champions', 'items', 'mastery', 'spells', 'runes', 'settings', 'about', 'board']) {
      await page.evaluate(value => go(value), route);
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} overflow`);
      if (route === 'settings') assert.match(await page.locator('#view').innerText(), /stored in this browser/);
      if (route === 'about') assert.match(await page.locator('#view').innerText(), /PC Beta lets you browse/);
    }
    assert.match(await page.locator('#view').innerText(), /Online features are not connected/);
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => go('items'));
      const bounds = await page.evaluate(() => ({
        itemBottom: document.querySelector('.itemPage').getBoundingClientRect().bottom,
        dockTop: document.querySelector('#persistentArchiveDock').getBoundingClientRect().top,
      }));
      assert.ok(bounds.itemBottom <= bounds.dockTop,
        `${width}px item list overlaps archive dock: ${JSON.stringify(bounds)}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => go('champions'));
    await page.locator('.classicPortraitGrid [data-classic-id]').filter({ hasText: 'Garen' }).first().click();
    assert.match(await page.locator('#view').innerText(), /Garen/);
    assert.match(await page.locator('.classicRecommendations').innerText(), /Suggested build/);
    const effect = page.locator('.classicSkillEffect[data-classic-effect]').first();
    assert.ok(await effect.count() > 0, 'Missing linked ability effects');
    await effect.click();
    assert.equal(await page.locator('.classicSkillEffectPopup').getAttribute('lang'), 'en');
    assert.ok((await page.locator('#classicSkillEffectPopupDescription').innerText()).trim().length > 10);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.classicSkillEffectPopup').count(), 0);
    await page.evaluate(() => { S.tab = '새소식'; go('home'); render(); });
    await page.locator('[data-article="0"]').first().click();
    assert.match(await page.locator('#modalBody').innerText(), /26\.19/);
    assert.deepEqual(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(rows => rows.map(row => row.scope))), []);

    for (const [locale, name, voiceLocale] of [
      ['en-US', 'Garen', 'en_US'], ['ja-JP', 'ガレン', 'ja_JP'],
    ]) {
      const voiceContext = await browser.newContext({ locale, viewport: { width: 1280, height: 850 } });
      await voiceContext.addInitScript(() => {
        window.__pcBetaPlayAttempts = [];
        const originalPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          const attempt = { src: this.currentSrc || this.src, playing: false, currentTime: 0 };
          window.__pcBetaPlayAttempts.push(attempt);
          this.addEventListener('playing', () => { attempt.playing = true; }, { once: true });
          this.addEventListener('timeupdate', () => { attempt.currentTime = this.currentTime; });
          return originalPlay.call(this);
        };
      });
      const voicePage = await voiceContext.newPage();
      observe(voicePage);
      const audioResponses = [];
      voicePage.on('response', response => {
        if (response.url().includes('/audio/')) audioResponses.push({ url: response.url(), status: response.status() });
      });
      await voicePage.goto(new URL('index.html#champions', target).href, { waitUntil: 'networkidle' });
      assert.equal(await voicePage.title(), voiceLocale === 'ja_JP' ? 'LoL クラシック百科事典' : 'LoL Classic Encyclopedia');
      assert.equal(await voicePage.locator('.pcBetaBanner').evaluate(element => Math.round(element.getBoundingClientRect().y)), 0);
      assert.equal(await voicePage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const previewNamespace = voiceLocale === 'en_US' ? 'garen-old-en-26195' : `classic-mode-base-26195/${voiceLocale}`;
      const previewResponse = voicePage.waitForResponse(response => new RegExp(`/audio/classic-voices/${previewNamespace}/[a-f0-9]{64}\\.ogg$`).test(response.url()));
      await voicePage.locator('.classicPortraitGrid [data-classic-id]').filter({ hasText: name }).first().click();
      assert.equal((await previewResponse).status(), 200, `${voiceLocale} portrait voice HTTP status`);
      await voicePage.waitForFunction(() => window.__pcBetaPlayAttempts.some(row => row.playing && row.currentTime > 0), null, { timeout: 5000 });
      await voicePage.locator('[data-act="classicVoices:garen"]').click();
      assert.equal(await voicePage.locator(`[data-classic-voice-locale="${voiceLocale}"]`).getAttribute('aria-selected'), 'true');
      const verifiedPick = voicePage.locator('#modalBody [data-classic-verified-pick-clip="86"]');
      assert.equal(await verifiedPick.count(), 1);
      assert.equal(await verifiedPick.locator('.classicVoiceLanguage').innerText(),
        voiceLocale === 'ja_JP' ? '韓国語' : 'Korean', `${voiceLocale} verified pick language badge`);
      assert.equal(await voicePage.locator('[data-classic-candidate-pick-clip="86"]').count(), 1);
      const previousPickPlays = await voicePage.evaluate(() => window.__pcBetaPlayAttempts.length);
      await voicePage.locator('[data-classic-candidate-pick-clip="86"]').click();
      await voicePage.waitForFunction(before => window.__pcBetaPlayAttempts.slice(before).some(row => row.playing && row.currentTime > 0), previousPickPlays, { timeout: 5000 });
      assert.ok(audioResponses.some(row => row.status === 200 && row.url.endsWith(`/audio/champion-pick/${voiceLocale}/86_Garen.ogg`)), `${voiceLocale} pick audio missing`);

      const playGarenClip = async (namespace, count) => {
        assert.equal(await voicePage.locator('#modalBody [data-classic-voice-clip]').evaluateAll(rows => new Set(rows.map(row => row.dataset.classicVoiceClip)).size), count);
        const previousPlays = await voicePage.evaluate(() => window.__pcBetaPlayAttempts.length);
        const clipResponse = voicePage.waitForResponse(response => new RegExp(`/audio/classic-voices/${namespace}/[a-f0-9]{64}\\.ogg$`).test(response.url()));
        await voicePage.locator('#modalBody [data-classic-voice-clip]').first().click();
        assert.equal((await clipResponse).status(), 200, `${voiceLocale} ${namespace} HTTP status`);
        await voicePage.waitForFunction(before => window.__pcBetaPlayAttempts.slice(before).some(row => row.playing && row.currentTime > 0), previousPlays, { timeout: 5000 });
      };
      if (voiceLocale === 'en_US') {
        assert.match(await voicePage.locator('.classicVoiceHint').innerText(), /recording date is unverified/);
        await playGarenClip('garen-old-en-26195', 44);
        await voicePage.locator('select[data-classic-voice-group]').selectOption('en_US-garen-classic-mode-base');
      }
      assert.match(await voicePage.locator('.classicVoiceHint').innerText(), voiceLocale === 'ja_JP' ? /26\.19の音源と同一か、旧録音かどうかは未確認/ : /Byte identity with 26\.19 audio and recording age are unverified/);
      await playGarenClip(`classic-mode-base-26195/${voiceLocale}`, 71);

      await voicePage.locator('#close').click();
      await voicePage.evaluate(() => go('champions'));
      await voicePage.locator('.classicPortraitGrid [data-classic-id]').filter({ hasText: locale === 'ja-JP' ? 'イブリン' : 'Evelynn' }).first().click();
      await voicePage.locator('[data-act="classicVoices:evelynn"]').click();
      const classicClip = voicePage.locator('#modalBody [data-classic-voice-clip]').first();
      assert.match(await classicClip.innerText(), locale === 'ja-JP' ? /移動/ : /Movement/);
      const previousPlays = await voicePage.evaluate(() => window.__pcBetaPlayAttempts.length);
      const clipResponse = voicePage.waitForResponse(response => new RegExp(`/audio/classic-voices/localized-26195/${voiceLocale}/[a-f0-9]{64}\\.ogg$`).test(response.url()));
      await classicClip.click();
      assert.equal((await clipResponse).status(), 200, `${voiceLocale} Classic clip HTTP status`);
      await voicePage.waitForFunction(before => window.__pcBetaPlayAttempts.slice(before).some(row => row.playing && row.currentTime > 0), previousPlays, { timeout: 5000 });
      assert.ok(audioResponses.some(row => row.status === 200 && new RegExp(`/audio/classic-voices/localized-26195/${voiceLocale}/[a-f0-9]{64}\\.ogg$`).test(row.url)), `${voiceLocale} localized Classic clip missing`);
      await voicePage.locator('#close').click();
      await voicePage.evaluate(() => go('champions'));
      const nunuName = voiceLocale === 'ja_JP' ? 'ヌヌ' : 'Nunu';
      const nunuCard = voicePage.locator('.classicPortraitGrid [data-classic-id="nunu"]');
      assert.equal(await nunuCard.innerText(), nunuName);
      const previousNunuPlays = await voicePage.evaluate(() => window.__pcBetaPlayAttempts.length);
      const nunuPortraitAudio = voicePage.waitForResponse(response =>
        new RegExp(`/audio/classic-voices/localized-26195/${voiceLocale}/[a-f0-9]{64}\\.ogg$`).test(response.url()));
      await nunuCard.click();
      assert.equal((await voicePage.locator('#view').innerText()).split('\n')[1], voiceLocale === 'en_US' ? 'Nunu' : 'ヌヌ · Nunu');
      assert.equal((await nunuPortraitAudio).status(), 200, `${voiceLocale} Nunu Classic portrait audio HTTP status`);
      await voicePage.waitForFunction(before => window.__pcBetaPlayAttempts.slice(before).some(row => row.playing && row.currentTime > 0), previousNunuPlays, { timeout: 5000 });
      await voicePage.evaluate(() => go('settings'));
      assert.match(await voicePage.locator('#view').innerText(), locale === 'ja-JP' ? /このブラウザに保存/ : /stored in this browser/);
      await voiceContext.close();
    }

    const koreanContext = await browser.newContext({ locale: 'ko-KR', viewport: { width: 1280, height: 850 } });
    await koreanContext.addInitScript(() => {
      window.__koreanVoicePlayed = false;
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        this.addEventListener('playing', () => { window.__koreanVoicePlayed = true; }, { once: true });
        return originalPlay.call(this);
      };
    });
    const koreanPage = await koreanContext.newPage();
    observe(koreanPage);
    await koreanPage.goto(new URL('index.html#champions', target).href, { waitUntil: 'networkidle' });
    assert.equal(await koreanPage.title(), '롤 백과사전 클래식');
    await koreanPage.locator('.classicPortraitGrid [data-classic-id]').filter({ hasText: '피오라' }).first().click();
    await koreanPage.locator('[data-act="classicVoices:fiora"]').click();
    assert.equal(await koreanPage.locator('[data-classic-voice-locale="ko_KR"]').getAttribute('aria-selected'), 'true');
    const koreanAudio = koreanPage.waitForResponse(response =>
      /\/audio\/classic-voices\/classic-mode-base-26195\/ko_KR\/[a-f0-9]{64}\.ogg$/.test(response.url()));
    await koreanPage.locator('#modalBody [data-classic-voice-clip]').first().click();
    assert.equal((await koreanAudio).status(), 200, 'Korean Classic estimated audio HTTP status');
    await koreanPage.waitForFunction(() => window.__koreanVoicePlayed, null, { timeout: 5000 });
    await koreanPage.locator('#close').click();
    await koreanPage.evaluate(() => { go('champions'); window.__koreanVoicePlayed = false; });
    const koreanNunu = koreanPage.locator('.classicPortraitGrid [data-classic-id="nunu"]');
    assert.equal(await koreanNunu.innerText(), '누누');
    const koreanNunuAudio = koreanPage.waitForResponse(response =>
      response.url().endsWith('/audio/champion-pick/verified-26.19/nunu.mp3'));
    await koreanNunu.click();
    assert.equal((await koreanPage.locator('#view').innerText()).split('\n')[1], '누누 · Nunu');
    assert.equal((await koreanNunuAudio).status(), 200, 'Korean Nunu Classic portrait audio HTTP status');
    await koreanPage.waitForFunction(() => window.__koreanVoicePlayed, null, { timeout: 5000 });
    await koreanContext.close();

    await page.evaluate(() => go('settings'));
    await page.locator('[data-go="document/contact"]').first().click();
    await page.waitForURL(/\/contact\.html$/);
    assert.match(await page.title(), /Contact/);
    const policyPage = await context.newPage();
    observe(policyPage);
    await policyPage.goto(new URL('index.html#document/product', target).href, { waitUntil: 'networkidle' });
    await policyPage.locator('[data-go="document/deletion"]').first().click();
    await policyPage.waitForURL(/\/delete-account\.html$/);
    assert.match(await policyPage.title(), /삭제/);
    for (const [route, destination] of [
      ['document/terms', 'terms.html'], ['document/privacy', 'privacy.html'],
      ['online-delete', 'delete-account.html'],
    ]) {
      await policyPage.goto(new URL(`index.html#${route}`, target).href, { waitUntil: 'load' });
      await policyPage.waitForURL(new RegExp(`/${destination.replace('.', '\\.')}$`));
    }
    await policyPage.close();
    const desktop = await browser.newPage({ locale: 'en-US', viewport: { width: 1280, height: 850 } });
    observe(desktop);
    await desktop.goto(target.href, { waitUntil: 'networkidle' });
    assert.equal(await desktop.locator('.pcBetaBanner').evaluate(element => Math.round(element.getBoundingClientRect().y)), 0);
    assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await desktop.close();
    assert.deepEqual(externalRequests, [], 'External HTTP(S) request');
    assert.deepEqual(errors, [], 'Browser error or missing resource');
    console.log(JSON.stringify({ result: 'PASS', routes: 8, desktopVoiceLocales: 3, externalRequests: 0, browserErrors: 0 }));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
