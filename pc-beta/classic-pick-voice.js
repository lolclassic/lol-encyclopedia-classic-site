(() => {
  'use strict';
  // Keep the user-verified pick, localized Classic game VO, and estimated
  // localized selection audio distinct in both playback and presentation.
  const suspended = false;
  const library = window.ClassicVoiceLibrary;
  let audio = null, audioUrl = null, ticket = 0, target = '', catalog = {}, activeDetail = null, manualPlayback = false;
  let languageAssessment = null, supplementalPreview = {}, supplementalPicks = {};
  const supplemental2620 = {266:'Jade_Aatrox',51:'Jade_Caitlyn',39:'Jade_Irelia',43:'Jade_Karma',133:'Jade_Quinn'};
  const locales = ['ko_KR', 'ja_JP', 'en_US'];
  const sourceLocales = ['ko_KR', 'ja_JP', 'en_US'];
  const labels = {
    ko_KR: { voice:'챔피언 음성', paused:'일시 비활성화', pausedHint:'음성 기능을 잠시 꺼두었습니다.',
      archived:'음성 언어', pick:'챔피언 선택 대사', volume:'음성 음량',
      hint:'기존 한국어 픽 대사는 직접 확인한 원본을 유지합니다. 신규 챔피언의 픽 대사는 클래식 당시 원본만 사용하며, 해당 언어의 원본을 확보하지 못하면 재생하지 않습니다.',
      saveError:'설정을 저장하지 못했습니다. 다시 시도해 주세요.',
      playError:'음성을 재생하지 못했습니다. 다시 눌러 주세요.' },
    ja_JP: { voice:'チャンピオンボイス', paused:'一時停止', pausedHint:'音声機能は一時的に無効です。',
      archived:'ボイスの言語', pick:'チャンピオン選択ボイス', volume:'音量',
      hint:'既存の韓国語ピックボイスは直接確認した原音を維持します。新規チャンピオンはクラシック当時の選択音声のみ使用し、選んだ言語の原音を確保できない場合は再生しません。',
      saveError:'設定を保存できませんでした。もう一度お試しください。',
      playError:'音声を再生できませんでした。もう一度タップしてください。' },
    en_US: { voice:'Champion voices', paused:'Temporarily unavailable', pausedHint:'The voice feature is temporarily disabled.',
      archived:'Voice language', pick:'Champion selection voice', volume:'Voice volume',
      hint:'Existing Korean picks retain their directly checked recordings. New champions use only archived Classic-era selection audio. A pick will not play until its original audio is available in the selected language.',
      saveError:'Could not save the setting. Please try again.',
      playError:'Could not play the voice line. Tap again.' },
  };
  const ui = () => labels[window.ClassicLocale?.getLocale?.()] || labels.ko_KR;
  const read = (key, fallback) => { try { return window.ClassicPreferenceStore ? window.ClassicPreferenceStore.get(key, fallback) : localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } };
  const write = (key, value) => { try { if (window.ClassicPreferenceStore) return window.ClassicPreferenceStore.set(key, value); localStorage.setItem(key, String(value)); return true; } catch (_) { return false; } };
  const enabled = () => !suspended && read('classicPickVoiceEnabled', 'true') === 'true';
  const volume = () => { const value = Number(read('classicVoiceVolume', '0.55')); return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.55; };
  function stop() {
    ticket++; target = ''; manualPlayback = false;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
  }
  function stopManual() { if (manualPlayback) stop(); }
  const languageAssessmentReady = fetch('data/classic-pick-language-assessment-26195.json')
    .then(response => response.ok ? response.json() : null).catch(() => null);
  const legacyReady = Promise.all(['classic-pick-voice', 'mode-classic-runtime'].map(name => fetch('data/' + name + '.json').then(response => {
    if (!response.ok) throw new Error('Pick catalog or Classic roster unavailable');
    return response.json();
  })).concat(languageAssessmentReady)).then(([data, runtime, assessment]) => {
    if (data.schemaVersion !== 3 || data.classification !== 'CHAMPION_SELECTION_VOICE'
      || JSON.stringify(data.locales) !== JSON.stringify(sourceLocales)
      || data.verifiedSource?.classification !== 'CLASSIC_CHAMPION_SELECTION_VOICE'
      || data.verifiedSource?.verificationMethod !== 'USER_MANUAL_AUDIO_COMPARISON'
      || data.verifiedSource?.result !== '72/72 MATCH'
      || data.verifiedSource?.sourceLanguage !== 'und'
      || Object.keys(data.champions || {}).length !== 72
      || runtime.schemaVersion !== 1 || runtime.classification !== 'DIRECT_MODE_CLASSIC_RUNTIME'
      || ![72,77].includes(Object.keys(runtime.champions || {}).length)) return false;
    const legacy = data.legacyLocalizedSource;
    const addition = data.localizedAdditionSource;
    const added = addition?.classicClientBinding?.champions || {};
    const legacyIds = new Set(legacy?.championIds || []);
    if (data.sourceScope !== 'USER_VERIFIED_CLASSIC_PICK_WITH_SEPARATE_LOCALIZED_CLIENT_SELECTION_VOICE'
      || legacy?.classification !== 'ORDINARY_CHAMPION_PICK_NOT_VERIFIED_FOR_CLASSIC'
      || legacy.patch !== '26.18' || legacy.clipCount !== 204
      || JSON.stringify(legacy.locales) !== JSON.stringify(sourceLocales)
      || legacyIds.size !== 68 || Object.keys(added).length !== 4
      || addition.classification !== 'LEAGUE_CLIENT_CHAMPION_SELECTION_VOICE'
      || addition.patch !== '16.19' || addition.classicSelectionVerified !== false
      || addition.classicClientBinding.classification !== 'JADE_CLASSIC_CLIENT_RELATED_PRIME_ITEM_ID'
      || Object.keys(data.champions).some(id => legacyIds.has(Number(id)) === Object.hasOwn(added, id))) return false;
    catalog = Object.fromEntries(Object.entries(data.champions || {}).filter(([id, row]) =>
      /^[1-9][0-9]*$/.test(id) && row.classicSelectionVerified === true && row.userApprovedPlayback === true
      && row.championId === Number(id) && row.classicKey === Number(id) + 60000
      && /^Jade_[A-Za-z0-9]+$/.test(row.classicId) && /^[a-z0-9]+$/.test(row.appId)
      && row.verifiedClip?.category === 'PICK' && row.verifiedClip.index === 1
      && row.verifiedClip.sourceLanguage === 'und'
      && row.verifiedClip.file === 'audio/champion-pick/verified-26.19/' + row.appId + '.mp3'
      && Number.isInteger(row.verifiedClip.bytes) && row.verifiedClip.bytes > 4
      && /^[a-f0-9]{64}$/.test(row.verifiedClip.sha256)
      && row.clips && typeof row.clips === 'object' && !Array.isArray(row.clips)
      && (Object.keys(row.clips).length === 0 || (Object.keys(row.clips).length === sourceLocales.length && sourceLocales.every(locale => {
        const clip = row.clips?.[locale];
        return clip?.category === 'PICK' && clip.index === 1 && clip.locale === locale
          && new RegExp('^audio/champion-pick/' + locale + '/' + id + '_[A-Za-z0-9]+\\.ogg$').test(clip.file)
          && Number.isInteger(clip.bytes) && clip.bytes > 4 && /^[a-f0-9]{64}$/.test(clip.sha256);
      })))));
    const rows = Object.values(catalog);
    const byClassicId = new Map(rows.map(row => [row.classicId, row]));
    const localizedSourcesValid = Object.entries(catalog).every(([id, row]) =>
      Object.keys(row.clips).length === sourceLocales.length && sourceLocales.every(locale => {
        const clip = row.clips[locale];
        if (!clip) return false;
        if (legacyIds.has(Number(id))) return !clip.sourceClassification && !clip.sourceUrl;
        return clip.sourceClassification === 'LEAGUE_CLIENT_CHAMPION_SELECTION_VOICE'
          && clip.sourcePatch === '16.19'
          && clip.sourceUrl === `https://raw.communitydragon.org/16.19/plugins/rcp-be-lol-game-data/global/${{ko_KR:'ko_kr',ja_JP:'ja_jp',en_US:'default'}[locale]}/v1/champion-choose-vo/${id}.ogg`
          && added[id]?.classicId === row.classicId
          && added[id]?.classicKey === row.classicKey
          && added[id]?.relatedPrimeItemId === Number(id);
      }));
    if (rows.length !== 72 || new Set(rows.map(row => row.classicId)).size !== 72
      || new Set(rows.map(row => row.appId)).size !== 72
      || !localizedSourcesValid
      || rows.some(row => runtime.champions[row.classicId]?.routeId !== row.appId)
      || Object.entries(runtime.champions).some(([id, row]) => {
        if (byClassicId.has(id)) return byClassicId.get(id).appId !== row.routeId;
        return runtime.version !== '16.20.1' || !Object.values(supplemental2620).includes(id)
          || row.routeId !== id.slice(5).toLowerCase()
          || row.sourceUrl !== 'https://ddragon.leagueoflegends.com/cdn/16.20.1/data/ko_KR/mode/classic/champion/' + id + '.json'
          || !/^[a-f0-9]{64}$/.test(row.sourceSha256);
      })) {
      catalog = {};
      return false;
    }
    if (assessment?.schemaVersion === 1
        && assessment.classification === 'OFFLINE_CLASSIC_PICK_LANGUAGE_ASSESSMENT'
        && assessment.method === 'LOCAL_FASTER_WHISPER_LARGE_V3'
        && assessment.detectedLanguage === 'ko_KR' && assessment.assessedCount === 72
        && assessment.sourceCatalogSha256 === '661df0b9326ce9611fcaba89fb83f8ef86f0669d89f7351f12379e0bc5f2dcae'
        && Object.keys(assessment.clips || {}).length === 72
        && Object.entries(catalog).every(([id, row]) => assessment.clips[id] === row.verifiedClip.sha256)) {
      languageAssessment = assessment;
    }
    return true;
  }).catch(() => false);
  // A separate, hash-bound supplement cannot relabel or invalidate the frozen 72 picks.
  const supplementalReady = Promise.all([
    fetch('data/classic-pick-voice-2620.json').then(async response => {
      if (!response.ok) throw new Error('Supplemental pick catalog unavailable');
      const raw = await response.text();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))].map(x=>x.toString(16).padStart(2,'0')).join('');
      if (digest !== '164ec6c2b0704987a7fa44f98c95943f9ee9d46d6dc411d51faa9ad5b384e5bd') throw new Error('Supplemental pick catalog integrity mismatch');
      return JSON.parse(raw);
    }),
    fetch('data/mode-classic-runtime.json').then(response => response.ok ? response.json() : null)
  ]).then(([data, runtime]) => {
    const rows = data.champions || {};
    const valid = data.schemaVersion === 1 && data.classification === 'CLASSIC_ARCHIVED_CHAMPION_SELECTION_VOICE'
      && data.version === '26.20' && data.currentClassicClientSelectionVerified === false && data.userListeningVerified === false
      && data.championCount === 5 && Number.isInteger(data.audioCount) && data.audioCount > 0 && data.audioCount <= 15
      && JSON.stringify(data.locales) === JSON.stringify(locales) && Object.keys(rows).length === 5
      && Object.entries(supplemental2620).every(([id, classicId]) => {
        const row = rows[id];
        return row?.championId === Number(id) && row.classicKey === Number(id) + 60000
          && row.classicId === classicId && row.appId === classicId.slice(5).toLowerCase()
          && row.currentClassicClientSelectionVerified === false
          && row.userListeningVerified === false && row.userApprovedPlayback === true
          && (!runtime?.champions?.[classicId] || runtime.champions[classicId].routeId === row.appId)
          && row.clips && Object.keys(row.clips).every(locale => locales.includes(locale)) && locales.every(locale => {
            const clip = row.clips[locale];
            const status = row.availability?.[locale];
            if (!clip) return status === 'HISTORICAL_SOURCE_NOT_ACQUIRED';
            return clip?.category === 'PICK' && clip.index === 1 && clip.locale === locale && clip.sourceLocale === locale
              && status === 'AVAILABLE' && ['mp3','ogg'].some(extension => clip.file === `audio/champion-pick/classic-archive-2620/${locale}/${id}_${classicId.slice(5)}.${extension}`)
              && Number.isInteger(clip.bytes) && clip.bytes > 4 && /^[a-f0-9]{64}$/.test(clip.sha256)
              && clip.sourceClassification === 'ARCHIVED_CLASSIC_CHAMPION_SELECTION_VOICE'
              && clip.historicalSelectionIdentityVerified === true && clip.currentClassicClientSelectionVerified === false
              && clip.userListeningVerified === false;
          });
      }) && Object.values(rows).reduce((count, row) => count + Object.keys(row.clips || {}).length, 0) === data.audioCount;
    if (!valid) return false;
    supplementalPicks = rows;
    supplementalPreview = rows;
    return true;
  }).catch(() => false);
  const ready = Promise.all([legacyReady, supplementalReady]).then(([legacy, supplemental]) => legacy || supplemental);
  function championId(champion) {
    const id = Number(champion?.riotKey) - 60000;
    const row = catalog[id] || supplementalPreview[id];
    return row && row.classicId === champion.riotId && row.appId === champion.id ? id : null;
  }
  function getClip(id, locale = getLocale()) { return catalog[id]?.clips?.[locale] || null; }
  function getSupplementalPickClip(id, locale = getLocale()) { return supplementalPicks[id]?.clips?.[locale] || null; }
  function getSupplementalPickAvailability(id, locale = getLocale()) { return supplementalPicks[id]?.availability?.[locale] || null; }
  function getVerifiedClip(id) {
    const clip = catalog[id]?.verifiedClip;
    return clip && languageAssessment?.clips?.[id] === clip.sha256
      ? {...clip, assessedLanguage:languageAssessment.detectedLanguage} : clip || null;
  }
  async function playClip(id, appId, manual, kind = 'selection') {
    stop(); library.stop();
    if ((!manual && !enabled()) || (kind === 'candidate' && !manual) || volume() === 0) return false;
    manualPlayback = manual;
    target = '#champion/' + String(appId || '').toLowerCase() + '/';
    const current = ticket;
    await ready;
    const row = catalog[id] || supplementalPreview[id];
    if (!row || current !== ticket || row.appId !== appId) return false;
    const locale = getLocale();
    if (kind === 'selection' && locale !== 'ko_KR' && !supplementalPicks[id]) {
      await library.ready;
      if (current !== ticket) return false;
      const preview = library.getPreviewClip?.(row.classicId, locale);
      if (!preview) {
        if (manual && typeof toast === 'function') toast(ui().playError);
        return false;
      }
      // The ordinary client pick remains an explicitly requested candidate, never an automatic substitute.
      return library.play(row.classicId, preview.id, { silentError: !manual });
    }
    const clip = kind === 'supplemental' || (kind === 'selection' && supplementalPicks[id])
      ? getSupplementalPickClip(id, locale)
      : kind === 'verified' || (kind === 'selection' && locale === 'ko_KR')
        ? getVerifiedClip(id) : getClip(id, locale);
    if (!clip || (kind === 'candidate' && locale === 'ko_KR')) return false;
    try {
      const response = await fetch(clip.file);
      if (!response.ok) throw new Error('Pick audio unavailable');
      if (current !== ticket) return false;
      const bytes = await response.arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
      if (digest !== clip.sha256 || bytes.byteLength !== clip.bytes) throw new Error('Pick audio integrity mismatch');
      if (current !== ticket) return false;
      audioUrl = URL.createObjectURL(new Blob([bytes], {type:clip.file.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'}));
      const player = new Audio(audioUrl); audio = player; player.volume = volume();
      player.addEventListener('ended', () => { if (audio === player) stop(); }, {once:true});
      player.addEventListener('error', () => {
        if (audio !== player) return;
        stop();
        if (manual && typeof toast === 'function') toast(ui().playError);
      }, {once:true});
      await player.play();
      if (current !== ticket) { player.pause(); return false; }
      return true;
    } catch (_) {
      if (current === ticket) {
        stop();
        if (manual && typeof toast === 'function') toast(ui().playError);
      }
      return false;
    }
  }
  function play(id, appId, manual = false) { return playClip(id, appId, manual); }
  function playVerified(id, appId, manual = false) { return playClip(id, appId, manual, 'verified'); }
  function playCandidate(id, appId, manual = false) { return playClip(id, appId, manual, 'candidate'); }
  function playSupplemental(id, appId, manual = false) { return playClip(id, appId, manual, 'supplemental'); }
  function enter(champion) {
    // Rendering the same detail (tabs, CMS updates, closing a dialog) is not a new entry.
    const identity = champion?.riotKey || null;
    if (identity === activeDetail) return;
    activeDetail = identity;
    stop(); library.stop();
    if (!champion) return;
    const current = ticket;
    ready.then(() => {
      if (current !== ticket || activeDetail !== identity) return;
      const id = championId(champion);
      if (id !== null) play(id, champion.id);
    });
  }
  function getLocale() {
    const selected = read('classicPickVoiceLocale', '');
    if (locales.includes(selected)) return selected;
    const appLocale = window.ClassicLocale?.getLocale?.();
    return locales.includes(appLocale) ? appLocale : 'ko_KR';
  }
  function setLocale(locale) {
    if (!locales.includes(locale)) return false;
    stop(); library.stop();
    return write('classicPickVoiceLocale', locale);
  }
  function settingsMarkup() {
    const text = ui();
    if (suspended) return `<div class="cmsDelivery voicePaused"><b>${text.voice}</b><span>${text.paused}</span><small>${text.pausedHint}</small></div>`;
    return '<label class="set" for="classicPickVoiceLocale"><span>' + text.archived + '</span><select id="classicPickVoiceLocale" aria-label="' + text.archived + '">' + locales.map(locale => '<option value="' + locale + '"' + (getLocale() === locale ? ' selected' : '') + '>' + ({ko_KR:'한국어',ja_JP:'日本語',en_US:'English'}[locale]) + '</option>').join('') + '</select></label>'
      + '<label class="set"><span>' + text.pick + '</span><input id="classicPickVoiceEnabled" type="checkbox"' + (enabled() ? ' checked' : '') + '></label>'
      + '<label class="set"><span>' + text.volume + '</span><input id="classicVoiceVolume" type="range" min="0" max="1" step="0.05" value="' + volume() + '"></label>'
      + '<p class="hint">' + text.hint + '</p>';
  }
  function replayPortrait(event) {
    if (!event.target.closest?.('#view .cvHead > .cvimg')) return;
    const row = catalog[Number(activeDetail) - 60000] || supplementalPreview[Number(activeDetail) - 60000];
    if (!row) return;
    event.preventDefault();
    play(row.championId, row.appId, true);
  }
  document.addEventListener('click', replayPortrait);
  document.addEventListener('change', event => {
    if (event.target.id === 'classicPickVoiceLocale' && !setLocale(event.target.value)) { event.target.value = getLocale(); window.alert(ui().saveError); }
    if (event.target.id === 'classicPickVoiceEnabled') { if (!write('classicPickVoiceEnabled', event.target.checked)) { event.target.checked = enabled(); window.alert(ui().saveError); } if (!enabled()) stop(); }
    if (event.target.id === 'classicVoiceVolume') { if (!write('classicVoiceVolume', event.target.value)) { event.target.value = volume(); window.alert(ui().saveError); } if (audio) audio.volume = volume(); if (!volume()) { stop(); library.stop(); } }
  });
  window.addEventListener('hashchange', () => { if (target && !location.hash.startsWith(target)) stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  window.ClassicPickVoice = Object.freeze({ play, playVerified, playCandidate, playSupplemental, stop, stopManual, getLocale, setLocale, settingsMarkup, ready, enabled, volume, suspended, enter, championId, getClip, getVerifiedClip, getSupplementalPickClip, getSupplementalPickAvailability, locales });
})();
