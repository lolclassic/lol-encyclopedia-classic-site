/* Capture the English 26.19.5 browser preview from locally served Android www.
 * Set PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE when using bundled runtimes.
 * The script stages every asset before replacing the site preview files.
 */
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const site = __dirname;
const assets = path.join(site, 'assets');
const target = new URL(process.argv[2] || 'http://127.0.0.1:8765/index.html#home');
const edgeExecutable = process.env.CHROMIUM_EXECUTABLE;
const names = [
  'home', 'champions', 'garen', 'items', 'masteries',
  'spells', 'runes', 'patch-news', 'settings', 'about',
];
assert.match(target.pathname, /\/index\.html$/);
assert.equal(target.hostname, '127.0.0.1', 'Only a local Android www server may be captured');
assert.ok(edgeExecutable && /^msedge(?:\.exe)?$/i.test(path.basename(edgeExecutable)),
  'CHROMIUM_EXECUTABLE must point to Microsoft Edge for this provenance record');

const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const metadata = file => ({ sha256: digest(file), bytes: fs.statSync(file).size });
const snapshot = async (page, stage, name) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.ClassicLocale?.getLocale?.()), 'en_US');
  await page.screenshot({ path: path.join(stage, `preview-26195-en-${name}.png`), animations: 'disabled' });
};
const route = (page, name) => page.evaluate(value => go(value), name);

async function main() {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'lolclassic-preview-26195-'));
  const browser = await chromium.launch({
    headless: true, executablePath: edgeExecutable,
  });
  try {
    const context = await browser.newContext({
      locale: 'en-US', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    const blocked = [];
    await context.route('**/*', request => {
      if (/^https?:/.test(request.request().url()) && new URL(request.request().url()).origin !== target.origin) {
        blocked.push(request.request().url());
        return request.abort();
      }
      return request.continue();
    });
    const page = await context.newPage();
    await page.goto(target.href, { waitUntil: 'networkidle', timeout: 60000 });
    await snapshot(page, stage, 'home');
    await route(page, 'champions');
    await snapshot(page, stage, 'champions');
    await page.locator('.classicPortraitGrid [data-classic-id]').filter({ hasText: 'Garen' }).first().click();
    await snapshot(page, stage, 'garen');
    for (const [name, appRoute] of [
      ['items', 'items'], ['masteries', 'mastery'], ['spells', 'spells'], ['runes', 'runes'],
    ]) {
      await route(page, appRoute);
      await snapshot(page, stage, name);
    }
    await page.evaluate(() => { S.tab = '새소식'; go('home'); render(); });
    await page.locator('[data-article="0"]').first().click();
    assert.match(await page.locator('#modalBody').innerText(), /26\.19/);
    await snapshot(page, stage, 'patch-news');
    await page.locator('#close').click();
    await route(page, 'settings');
    await snapshot(page, stage, 'settings');
    await route(page, 'about');
    await snapshot(page, stage, 'about');
    await context.close();

    const videoContext = await browser.newContext({
      locale: 'en-US', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
      reducedMotion: 'reduce', serviceWorkers: 'block',
      recordVideo: { dir: stage, size: { width: 390, height: 844 } },
    });
    await videoContext.route('**/*', request => {
      if (/^https?:/.test(request.request().url()) && new URL(request.request().url()).origin !== target.origin) {
        blocked.push(request.request().url());
        return request.abort();
      }
      return request.continue();
    });
    const videoPage = await videoContext.newPage();
    await videoPage.goto(target.href, { waitUntil: 'networkidle', timeout: 60000 });
    assert.equal(await videoPage.evaluate(() => window.ClassicLocale?.getLocale?.()), 'en_US');
    await videoPage.waitForTimeout(1000);
    for (const appRoute of ['champions', 'items', 'mastery', 'spells', 'runes']) {
      await route(videoPage, appRoute);
      await videoPage.waitForTimeout(1200);
    }
    await videoPage.evaluate(() => { S.tab = '새소식'; go('home'); render(); });
    await videoPage.locator('[data-article="0"]').first().click();
    await videoPage.waitForTimeout(1200);
    const webm = await videoPage.video().path();
    await videoContext.close();
    const mp4 = path.join(stage, 'preview-26195-en-tour.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-an',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', mp4], { stdio: 'pipe' });

    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error',
      '-show_entries', 'format=duration:stream=codec_type,width,height',
      '-of', 'json', mp4], { encoding: 'utf8' }));
    assert.ok(probe.streams.some(stream => stream.codec_type === 'video' &&
      stream.width === 390 && stream.height === 844));
    assert.ok(!probe.streams.some(stream => stream.codec_type === 'audio'));
    const exportManifest = JSON.parse(fs.readFileSync(path.join(site, 'pc-beta', 'export-manifest.json')));
    for (const [name, expected] of [
      ['index.html', exportManifest.sourceIndexSha256],
      ['app.js', exportManifest.sourceAppJsSha256],
    ]) {
      const response = await fetch(new URL(name, target));
      assert.equal(response.status, 200, `Local capture source missing: ${name}`);
      assert.equal(crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),
        expected, `Local capture source differs from PC export: ${name}`);
    }
    const source = {
      sourceIndexSha256: exportManifest.sourceIndexSha256,
      sourceAppJsSha256: exportManifest.sourceAppJsSha256,
      sourceVoiceLibraryJsSha256: exportManifest.files['classic-voice-library.js'].sha256,
      sourcePickVoiceJsSha256: exportManifest.files['classic-pick-voice.js'].sha256,
      sourceGarenCatalogSha256: exportManifest.files['data/classic-garen-base-26195.json'].sha256,
      sourceNostalgiaJsSha256: exportManifest.files['nostalgia-218-fidelity.js'].sha256,
      sourceKoreanVoiceCatalogSha256: exportManifest.files['data/classic-voice-locale-ko-estimate-26195.json'].sha256,
      sourceSkillEffectsCatalogSha256: exportManifest.files['data/classic-skill-effects-26195.json'].sha256,
      sourceRecommendationsCatalogSha256: exportManifest.files['data/classic-recommendations-26195.json'].sha256,
      sourceSkillEffectsJsSha256: exportManifest.files['classic-skill-effects-26195.js'].sha256,
      sourceSkillEffectsCssSha256: exportManifest.files['classic-skill-effects-26195.css'].sha256,
      sourceRecommendationsJsSha256: exportManifest.files['classic-recommendations-ui.js'].sha256,
      sourceRecommendationsCssSha256: exportManifest.files['classic-recommendations-ui.css'].sha256,
      sourceLocaleJsSha256: exportManifest.files['classic-locale-26195.js'].sha256,
    };
    const files = {};
    for (const name of names) {
      const filename = `preview-26195-en-${name}.png`;
      files[filename] = { ...metadata(path.join(stage, filename)), pixels: [780, 1688] };
    }
    files['preview-26195-en-tour.mp4'] = {
      ...metadata(mp4), durationSeconds: Number(Number(probe.format.duration).toFixed(2)),
      audioTrack: false,
    };
    const provenance = {
      schemaVersion: 1,
      classification: 'ENGLISH_BROWSER_RENDERING_NOT_PHYSICAL_DEVICE_OR_PLAY_SCREENSHOT',
      appVersion: '26.19.5',
      sourceIndexSha256: source.sourceIndexSha256,
      sourceAppJsSha256: source.sourceAppJsSha256,
      screenshotCapture: {
        browser: 'Microsoft Edge via Playwright', locale: 'en-US',
        viewportCssPixels: [390, 844], deviceScaleFactor: 2,
        source: 'local Android development WebView assets served by HTTP',
      },
      videoCapture: {
        browser: 'Microsoft Edge via Playwright', locale: 'en-US',
        viewportCssPixels: [390, 844], deviceScaleFactor: 1, audio: false,
      },
      files,
      sourceVoiceLibraryJsSha256: source.sourceVoiceLibraryJsSha256,
      sourcePickVoiceJsSha256: source.sourcePickVoiceJsSha256,
      sourceGarenCatalogSha256: source.sourceGarenCatalogSha256,
      sourceNostalgiaJsSha256: source.sourceNostalgiaJsSha256,
      sourceKoreanVoiceCatalogSha256: source.sourceKoreanVoiceCatalogSha256,
      sourceSkillEffectsCatalogSha256: source.sourceSkillEffectsCatalogSha256,
      sourceRecommendationsCatalogSha256: source.sourceRecommendationsCatalogSha256,
      sourceSkillEffectsJsSha256: source.sourceSkillEffectsJsSha256,
      sourceSkillEffectsCssSha256: source.sourceSkillEffectsCssSha256,
      sourceRecommendationsJsSha256: source.sourceRecommendationsJsSha256,
      sourceRecommendationsCssSha256: source.sourceRecommendationsCssSha256,
      sourceLocaleJsSha256: source.sourceLocaleJsSha256,
    };
    const allowedBlockedOrigins = new Set([
      'https://lolclassic-video-service.lolflix-7313.workers.dev',
      'https://i.ytimg.com',
    ]);
    assert.deepEqual(blocked.filter(url => !allowedBlockedOrigins.has(new URL(url).origin)), [],
      'Unexpected external request attempted during preview capture');
    if (process.argv.includes('--stage-only')) {
      console.log(JSON.stringify({ result: 'STAGED', screenshots: names.length,
        videoSeconds: files['preview-26195-en-tour.mp4'].durationSeconds,
        sourceIndexSha256: source.sourceIndexSha256, stage }));
      return;
    }
    for (const filename of Object.keys(files)) {
      fs.copyFileSync(path.join(stage, filename), path.join(assets, filename));
    }
    fs.writeFileSync(path.join(assets, 'preview-26195-en-provenance.json'),
      JSON.stringify(provenance, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ result: 'CAPTURED', screenshots: names.length,
      videoSeconds: files['preview-26195-en-tour.mp4'].durationSeconds,
      sourceIndexSha256: source.sourceIndexSha256, stage }));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
