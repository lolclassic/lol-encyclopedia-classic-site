(function (global) {
  'use strict';
  let catalog = null, audio = null, audioUrl = null, ticket = 0, activeChampion = null, selectionPlayback = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ui = (ko, ja, en) => ({ ja_JP: ja, en_US: en })[global.ClassicLocale?.getLocale()] || ko;
  const championName = champion => global.ClassicLocale?.name('champions', champion) || champion.ko;
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const equal = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
  const check = value => { if (!value) throw new Error('Unverified Classic voice edition'); };
  const policyHash = 'f88026d87061ec1eaa2d5b60dcec404f5fe5177e0988de18fd7ef55fb3babf67';
  const captureHash = 'd832fe975616494d866e2f4ac4a9066fec6884a138320b97c38d7f0b090be5da';
  const candidateHash = '9c14d4e8fe94a61601c7ec3d341b5f89f5f4d510f5d1a4c9d194c1efb3323e4b';
  // Generated from the reviewed edition policy, never inferred from a Skin0 name.
  const restored = {
  "Jade_Ahri": "58b10fc2a51657d41329fe6acfb30a9a20283473f0928fa2f04753a93c9d7c4d",
  "Jade_DrMundo": "035083202eb115290a72dd43ae5a46878f0623bdcf089b73b3f2663d314afe19",
  "Jade_Evelynn": "3b6c122cb2473940bcc1dc4833c4efbbbd0d3147b427d9a88ce8931206e10b05",
  "Jade_Ezreal": "d79fdf34b799de060718bceff0db8b9fe65f6545f8d62f8c453b8212d8f3f272",
  "Jade_Fiddlesticks": "24aa8a98d8ea6831c3f4739a057eed37bca36f32a8dd699bf5c6652c2a5686e8",
  "Jade_Gangplank": "a5aad3d383d314beee53666455bf55cf6dbf08680e8399f9eb487f42282b1eca",
  "Jade_Heimerdinger": "a76dd736e4c90ee519d0a503ecdf69d284d7970516aeb06bf2abef515eda292c",
  "Jade_Jax": "71e20d068d6c2dad2f10ff1f387d63d1939c7aa2d023b6f2494dea01704087fd",
  "Jade_Karthus": "3abe86f3e99e09be96c11f54655ba87fe1c2e430074d4b124f2905171f04909d",
  "Jade_Kayle": "2f70561851bf973228c81a3f63db52e9fbc05c2347e650bcbde4aacb544cd95e",
  "Jade_LeeSin": "3463d9b09f008a4ed56f4bec75a8bb3f471e747d34b946f9b57372bc7bb989e5",
  "Jade_Morgana": "10e3638c4c046984fd3313ccd46ca4c971e23d09b1f6ab400de185adb2a4239c",
  "Jade_Nasus": "745d57f48352a8296615745b790bf1c466978f13909414bf42d7e337c139d5e3",
  "Jade_Nidalee": "15880069cdd67b19fc2a66be8b3348ff29ec82260c7bf9706a16afff0cbd985b",
  "Jade_Nunu": "1329154c42e61c450281e491f660519d64082788475c1415472b125c3c77549e",
  "Jade_Pantheon": "7832fd7f48e5b56ce2f936cf6043030262180af4e832f30ad013ce99a019cd24",
  "Jade_Ryze": "42ded5d8ee7ad15f25aad39a07342589d871caf09713e9ab47ee5dfd53848095",
  "Jade_Sion": "64b634c2777e18a93c23eef76db43c4d142a28a90ff97f961633a81ddff22b50",
  "Jade_Skarner": "f4d56d5585e798a04f372690e498da59126df774365a8cb1e4bda6c260ea8c46",
  "Jade_Taric": "3bc6bd66d811d3922c90895b908e942532279c8bc040f6b8c62796341ff555f3",
  "Jade_Teemo": "8f947f5b57b67bb1f6a11dbeabdcefec55fee09c8d7c697ad3feb67b5b50f75e",
  "Jade_Tristana": "5d074123700a6e1c2c3382615ad9f71150d3b0ace78838ca491accc7101d962f",
  "Jade_Twitch": "de3e27c643f3536af58dbde4bc6fdafa9bc867d5c448ee7ef646859d5f5f2b94",
  "Jade_Warwick": "3a1bcf45e21f689f75734303870e81406f1f09d0c5c8b8b93f8f5839a49d37e3"
};
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }
  async function metadataHash(value) {
    const bytes = new TextEncoder().encode(canonical(value));
    const result = await global.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2,'0')).join('');
  }
  async function validateChampion(id, row, reference) {
    check(/^Jade_[A-Za-z0-9]+$/.test(id) && row && reference.sourceUrl === 'https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/mode/classic/champion/' + id + '.json'
      && hash(reference.sourceSha256) && Array.isArray(row.clips) && Array.isArray(row.voiceBanks)
      && Array.isArray(row.skinBindings) && Array.isArray(row.voiceGroups) && Array.isArray(row.missingAudio) && !row.missingAudio.length);
    const spec = restored[id];
    if (!spec) {
      check(row.status === 'unavailable' && row.unavailable?.code === 'CLASSIC_VOICE_NOT_VERIFIED'
        && row.unavailable.reason === '클래식 시기의 음성 원본을 확인 중입니다.'
        && row.defaultGroupId === null && row.defaultClipId === null
        && Array.isArray(row.availableLocales) && !row.availableLocales.length
        && !row.clips.length && !row.voiceBanks.length && !row.skinBindings.length && !row.voiceGroups.length);
      return row;
    }
    // The build-time edition policy approves the complete row, including every
    // bank, skin, group and clip binding. Group count is data, not a limit of one.
    check(hash(spec) && await metadataHash(row) === spec);
    const bankIds = new Set(row.voiceBanks.map(bank => bank.id));
    const clipIds = new Set(row.clips.map(clip => clip.id));
    const groupIds = new Set(row.voiceGroups.map(group => group.id));
    check(row.status === 'available' && row.unavailable === null
      && equal(row.availableLocales, ['ko_KR']) && row.defaultGroupId === 'base'
      && bankIds.size === row.voiceBanks.length && clipIds.size === row.clips.length
      && groupIds.size === row.voiceGroups.length && groupIds.has(row.defaultGroupId));
    for (const group of row.voiceGroups) {
      check(group.locale === 'ko_KR' && group.bankIds.length > 0 && group.clipIds.length > 0
        && group.bankIds.every(id => bankIds.has(id)) && group.clipIds.every(id => clipIds.has(id))
        && new Set(group.clipIds).size === group.clipIds.length
        && Array.isArray(group.missingAudio) && !group.missingAudio.length
        && group.eraProof?.proofKind === 'MODE_CLASSIC_NAMED_SKIN_DEDICATED_RESTORED_VO'
        && group.eraProof.classicDetailSha256 === reference.sourceSha256);
      if (group.id === row.defaultGroupId) check(group.role === 'champion' && group.label === row.name && group.clipIds.includes(row.defaultClipId));
      else check(group.role === 'skin');
    }
    check(equal([...new Set(row.voiceGroups.flatMap(group => group.clipIds))], [...clipIds]));
    for (const skin of row.skinBindings) {
      check(skin.classicDetailSha256 === reference.sourceSha256
        && skin.sourcePath === 'data/characters/' + id.toLowerCase() + '/skins/skin' + skin.num + '.bin'
        && skin.objectPath === 'Characters/' + id + '/Skins/Skin' + skin.num
        && skin.bankIds.length > 0 && skin.bankIds.every(bank => bankIds.has(bank)));
    }
    for (const clip of row.clips) {
      check(clip.id === 'skin-' + clip.sourceSha256.slice(0,16) && hash(clip.sourceSha256) && hash(clip.sha256)
        && clip.file === 'audio/classic-voices/shared/' + clip.sourceSha256 + '.ogg'
        && clip.mediaKind === 'localized-vo' && clip.sourceLocale === 'ko_KR'
        && clip.sourceBindings.length && clip.sourceBindings.every(binding => bankIds.has(binding.bankId) && binding.sourceLocale === 'ko_KR'));
    }
    return row;
  }
  const restoredReady = Promise.all(['classic-voice-library','mode-classic-runtime-16.17.1'].map(name => fetch('data/' + name + '.json').then(response => {
    if (!response.ok) throw new Error('Classic voice library unavailable');
    return response.json();
  }))).then(async ([data, runtime]) => {
    check(data.schemaVersion === 3 && data.classification === 'VERIFIED_CLASSIC_RESTORED_VOICE'
      && data.scope === 'VERIFIED_CLASSIC_VOICE_EDITIONS' && data.sourceSkinSupplementSha256 === captureHash
      && data.sourceCaptureSha256 === 'dbc00232468133869589b638dd6a38489dc16a7214a0f40645de8644f7eb05da'
      && data.sourceSupplementSha256 === 'fb81a1ba9a8265fa40264aa32644d05cd2f8dcfda9339418a1508603b3b11783'
      && data.sourceCandidateCatalogSha256 === candidateHash && data.sourceEraPolicySha256 === policyHash
      && data.locale === 'ko_KR' && equal(data.availableLocales, ['ko_KR']) && data.version === '16.17.1'
      && data.ordinaryChampionFallback === false && data.otherLanguageFallback === false
      && runtime.classification === 'DIRECT_MODE_CLASSIC_RUNTIME' && Object.keys(runtime.champions || {}).length === 63);
    const accepted = {};
    // Shape/hash failures remain isolated to the affected champion.
    await Promise.all(Object.entries(runtime.champions).map(async ([id, reference]) => {
      try { accepted[id] = await validateChampion(id, data.champions[id], reference); }
      catch (_) { /* Opening this champion explains the unavailable data. */ }
    }));
    catalog = { ...data, champions: accepted };
    return Object.keys(accepted).length > 0;
  }).catch(() => false);

  // Only these reviewed Classic banks may extend the Korean edition catalog.
  // The mixed-edition local archive itself never drives playback.
  const localizedCatalogHash = '4c47760b75b84c4aabb618015aa879222b6bcb0831ff80b81b51af0ab01b6b22';
  const localizedReady = fetch('data/classic-voice-locale-26195.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2,'0')).join('') === localizedCatalogHash);
    const data = JSON.parse(raw);
    check(data.schemaVersion === 1 && data.classification === 'VERIFIED_CLASSIC_NAMED_SKIN_LOCALIZED_VO'
      && data.sourcePatch === '26.18' && data.sourcePolicySha256 === policyHash
      && data.sourceCatalogSha256 === 'e61f7862542cbc6f8ef67d27226c29907a30db72b7e136f63a494a394feea51e'
      && data.sourceReviewedKoreanCatalogSha256 === 'f5de9cce4ce0b688eb9d95465da080cb5facd6e5962700c06beac8ca79c4aa72'
      && data.sourceManifestSha256?.ja_JP === '494ff19c0fe7217a1262338de1c879dde53e33a736c17f9608fd9cec489f6dab'
      && data.sourceManifestSha256?.en_US === 'b03985c1119c15bd944e5a0a650d7f703e9c0a3f33c787953a104aab5c82255e'
      && data.coverage?.ja_JP?.clipRefs === 455 && data.coverage?.en_US?.clipRefs === 475
      && equal(data.locales, ['ja_JP','en_US']) && Object.keys(data.champions || {}).length === 18);
    const accepted = {};
    for (const [id, row] of Object.entries(data.champions)) {
      check(/^Jade_[A-Za-z0-9]+$/.test(id) && row.appId === id.slice(5).toLowerCase()
        && Number.isInteger(row.championId) && row.championId > 0);
      const groups = row.groups, clips = row.clips;
      check(Array.isArray(groups) && groups.length === 2 && Array.isArray(clips) && clips.length > 0);
      const clipById = new Map(clips.map(clip => [clip.id, clip]));
      const clipIds = new Set(clipById.keys());
      check(clipIds.size === clips.length && groups.map(group => group.locale).sort().join(',') === 'en_US,ja_JP');
      for (const group of groups) {
        const bank = group.sourceBank;
        const path = String(bank?.path || '').replaceAll('\\', '/').toLowerCase();
        check(group.id === group.locale + '-' + bank?.sha256?.slice(0,16)
          && group.label === '클래식 음성' && group.proofKind === 'MODE_CLASSIC_NAMED_SKIN_DEDICATED_RESTORED_VO'
          && group.sourceSkinNum === (id === 'Jade_Kayle' ? 302 : 301)
          && bank?.mode === 'classic' && hash(bank?.sha256) && Number.isInteger(bank.bytes) && bank.bytes > 0
          && path.includes('/characters/' + row.appId + '/skins/skin301/') && path.endsWith('_audio.wpk')
          && String(bank?.sourceWadName || '').toLowerCase() === (id.slice(5) + '.' + group.locale + '.wad.client').toLowerCase()
          && Array.isArray(group.clipIds) && group.clipIds.length > 0
          && new Set(group.clipIds).size === group.clipIds.length
          && group.clipIds.every(clipId => clipById.get(clipId)?.locale === group.locale));
      }
      check(equal([...new Set(groups.flatMap(group => group.clipIds))], [...clipIds]));
      for (const clip of clips) {
        check(['ja_JP','en_US'].includes(clip.locale) && clip.sourceLocale === clip.locale
          && clipIds.has(clip.id) && clip.id === 'local-' + clip.locale + '-' + clip.sourceSha256
          && hash(clip.sourceSha256) && hash(clip.sha256)
          && clip.file === 'audio/classic-voices/localized-26195/' + clip.locale + '/' + clip.sourceSha256 + '.ogg'
          && Number.isInteger(clip.bytes) && clip.bytes > 4 && Array.isArray(clip.events)
          && clip.events.every(event => typeof event === 'string' && !/pick|select|choose|ban/i.test(event)));
      }
      accepted[id] = {appId:row.appId,groups,clips};
    }
    return accepted;
  }).catch(() => null);

  const cdnCatalogHash = 'cd15faae4413094404f559481ea4726a95343cadc55d0ecb0a3b27e5ecd8fce3';
  const cdnReady = fetch('data/classic-voice-locale-cdn-26195.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2,'0')).join('') === cdnCatalogHash);
    const data = JSON.parse(raw);
    check(data.schemaVersion === 1 && data.classification === 'VERIFIED_CLASSIC_NAMED_SKIN_LOCALIZED_VO'
      && data.sourcePatch === '26.19' && data.sourceClientVersion === '16.19.8217343'
      && data.sourcePolicySha256 === policyHash
      && data.sourceReviewedKoreanCatalogSha256 === 'f5de9cce4ce0b688eb9d95465da080cb5facd6e5962700c06beac8ca79c4aa72'
      && data.sourceRmanManifestSha256 === '0a0259f58391f509038915212d961b33f51f75786bec83831739d2cc714e3c84'
      && data.sourceRmanManifestUrl === 'https://lol.secure.dyn.riotcdn.net/channels/public/releases/0FD60FCF49C0F665.manifest'
      && equal(data.locales, ['ja_JP','en_US'])
      && data.coverage?.ja_JP?.clipRefs === 235 && data.coverage?.en_US?.clipRefs === 251
      && data.coverage?.ja_JP?.omittedNearSilentRefs === 16
      && data.omittedNearSilentMedia?.sourceWemSha256 === 'ac364f56b4cd2d67fa9be85e2372202d95bf170dea3e44d09d5956856ae7a068'
      && data.omittedNearSilentMedia?.mediaRefs?.length === 16
      && Object.keys(data.champions || {}).length === 6);
    const approved = new Set(['Jade_Ahri','Jade_Ezreal','Jade_LeeSin','Jade_Nidalee','Jade_Pantheon','Jade_Skarner']);
    const accepted = {};
    for (const [id, row] of Object.entries(data.champions)) {
      check(approved.has(id) && row.appId === id.slice(5).toLowerCase()
        && Number.isInteger(row.championId) && row.championId > 0
        && Array.isArray(row.groups) && row.groups.length === 2
        && Array.isArray(row.clips) && row.clips.length > 0);
      const clipById = new Map(row.clips.map(clip => [clip.id,clip]));
      check(clipById.size === row.clips.length
        && equal(row.groups.map(group => group.locale), ['ja_JP','en_US']));
      for (const group of row.groups) {
        const bank = group.sourceBank;
        const champion = id.slice(5);
        check(group.id === group.locale + '-' + bank?.sha256?.slice(0,16)
          && group.label === '클래식 음성' && group.role === 'champion'
          && group.proofKind === 'MODE_CLASSIC_NAMED_SKIN_DEDICATED_RESTORED_VO'
          && group.sourceSkinNum === 301 && hash(group.sourceSkinSha256)
          && bank?.mode === 'classic' && bank.name === champion + '_Skin301_VO'
          && hash(bank.sha256) && Number.isInteger(bank.bytes) && bank.bytes > 0
          && bank.path === 'assets/sounds/wwise2016/vo/en_us/characters/' + row.appId + '/skins/skin301/' + row.appId + '_skin301_vo_audio.wpk'
          && bank.sourceWadName === champion + '.' + group.locale + '.wad.client'
          && bank.sourceWadManifestFile === 'DATA/FINAL/Champions/' + bank.sourceWadName
          && bank.sourceRmanSha256 === data.sourceRmanManifestSha256
          && bank.eventGraphMatchesReviewedKorean === true
          && hash(bank.reviewedKoEventSha256) && hash(bank.reviewedKoWpkSha256)
          && Array.isArray(bank.files) && bank.files.length === 3
          && bank.files.every(file => hash(file.sha256) && Number.isInteger(file.bytes) && file.bytes > 0
            && file.path.startsWith('assets/sounds/wwise2016/vo/en_us/characters/' + row.appId + '/skins/skin301/'))
          && Array.isArray(group.clipIds) && group.clipIds.length > 0
          && new Set(group.clipIds).size === group.clipIds.length
          && group.clipIds.every(clipId => clipById.get(clipId)?.locale === group.locale));
      }
      check(equal([...new Set(row.groups.flatMap(group => group.clipIds))], [...clipById.keys()]));
      for (const clip of row.clips) {
        const group = row.groups.find(value => value.locale === clip.locale);
        check(['ja_JP','en_US'].includes(clip.locale) && clip.sourceLocale === clip.locale
          && clip.id === 'local-' + clip.locale + '-' + clip.sourceSha256
          && hash(clip.sourceSha256) && hash(clip.sha256)
          && clip.file === 'audio/classic-voices/localized-26195-cdn-1619/' + clip.locale + '/' + clip.sourceSha256 + '.ogg'
          && clip.sourceBankSha256 === group?.sourceBank.sha256
          && Number.isInteger(clip.bytes) && clip.bytes > 4
          && clip.sourceToOutput?.oggSha256 === clip.sha256
          && clip.sourceToOutput?.oggBytes === clip.bytes
          && clip.sourceToOutput?.wemSha256 === clip.sourceSha256
          && Array.isArray(clip.events) && clip.events.length > 0
          && clip.events.every(event => typeof event === 'string'
            && /_(?:Move2DStandard|Attack2DGeneral|Spell3D(?:Basic|[QWER]Cast)|Joke3DGeneral|Taunt3DGeneral|Laugh3DGeneral|Death3D)$/.test(event)));
      }
      accepted[id] = {appId:row.appId, groups:row.groups, clips:row.clips};
    }
    return accepted;
  }).catch(() => null);
  const garenCatalogHash = '51496da530bc64cf4553efdeda64d4ca7615a13019e54f7d3b277d66b3112681';
  const garenReady = fetch('data/classic-garen-base-26195.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('') === garenCatalogHash);
    const data = JSON.parse(raw);
    check(data.schemaVersion === 1 && data.classification === 'GAREN_CLASSIC_MODE_BASE_AND_OLD_EN_ARCHIVE_ESTIMATES'
      && data.classicId === 'Jade_Garen' && data.appId === 'garen' && data.championId === 86
      && data.classicModeBinding?.bank === 'Garen_Base_VO'
      && data.classicModeBinding?.installedSkinBinSha256 === '9bcc581f5e55cb2cdeee5599a7187ff2a5f77804c7bb4d19e04993b9f23ef5e5'
      && data.classicModeBinding?.metadataSha256 === '9f8a3c347510eba8b5dbd54852e4acdc731fe10053af8f1ca7d0527766a11236'
      && data.oldEnglishArchive?.categoryUrl === 'https://leagueoflegends.fandom.com/wiki/Category:Garen_old_voice-overs'
      && Array.isArray(data.groups) && data.groups.length === 3
      && Array.isArray(data.clips) && data.clips.length === 186);
    const expectedGroups = [
      ['ja_JP-garen-classic-mode-base','ja_JP','CLASSIC_MODE_BASE_VO_26_18_ESTIMATE',71],
      ['en_US-garen-old-fan-archive','en_US','OLD_EN_FAN_ARCHIVE_ESTIMATE',44],
      ['en_US-garen-classic-mode-base','en_US','CLASSIC_MODE_BASE_VO_26_18_ESTIMATE',71],
    ];
    const clips = new Map(data.clips.map(clip => [clip.id, clip]));
    check(clips.size === data.clips.length && data.groups.every((group, index) => {
      const [id, locale, sourceKind, count] = expectedGroups[index];
      return group.id === id && group.locale === locale && group.sourceKind === sourceKind
        && group.clipIds?.length === count && new Set(group.clipIds).size === count
        && group.clipIds.every(clipId => clips.get(clipId)?.locale === locale);
    }) && equal([...new Set(data.groups.flatMap(group => group.clipIds))], [...clips.keys()]));
    for (const clip of data.clips) {
      const archive = clip.id.startsWith('archive-en_US-');
      check(['ja_JP','en_US'].includes(clip.locale) && clip.sourceLocale === clip.locale
        && hash(clip.sha256) && hash(clip.sourceSha256) && Number.isInteger(clip.bytes) && clip.bytes > 4
        && ['이동','공격','스킬','농담','도발','웃음','사망','특수'].includes(clip.category)
        && Array.isArray(clip.categories) && clip.categories.length > 0
        && clip.category === clip.categories[0]
        && new Set(clip.categories).size === clip.categories.length
        && clip.categories.every(label => ['이동','공격','스킬','농담','도발','웃음','사망','특수'].includes(label))
        && Array.isArray(clip.events) && (archive ? clip.events.length === 0 : clip.events.length > 0)
        && (archive
          ? clip.locale === 'en_US' && clip.id === 'archive-en_US-' + clip.sourceSha256
            && clip.file === 'audio/classic-voices/garen-old-en-26195/' + clip.sourceSha256 + '.ogg'
            && clip.sourceUrl?.startsWith('https://static.wikia.nocookie.net/leagueoflegends/images/')
          : clip.id === 'local-' + clip.locale + '-' + clip.sourceSha256
            && clip.file === 'audio/classic-voices/classic-mode-base-26195/' + clip.locale + '/' + clip.sourceSha256 + '.ogg'
            && clip.sourceBankSha256 === (clip.locale === 'ja_JP'
              ? '0951a6c64980382614f50ca513eba438cfa257665239cb4d45fd92b643ab90f7'
              : '6353156b1642151d72109282d29fdb5bc7b3d70457422900468dd260c2c784f8')));
    }
    return data;
  }).catch(() => null);
  const baseCatalogHash = 'ed7b44967d9212893951ab18cbf8c2dc554b3125f41d19c49a2c4ffab404e224';
  const baseReady = fetch('data/classic-voice-locale-base-26195.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('') === baseCatalogHash);
    const data = JSON.parse(raw);
    check(data.schemaVersion === 1 && data.classification === 'CLASSIC_MODE_BASE_VO_LOCALIZED_ESTIMATES'
      && data.sourcePatch === '26.18' && data.modePatch === '26.19'
      && data.sourceLocalCatalogSha256 === 'e61f7862542cbc6f8ef67d27226c29907a30db72b7e136f63a494a394feea51e'
      && data.sourcePickCatalogSha256 === '661df0b9326ce9611fcaba89fb83f8ef86f0669d89f7351f12379e0bc5f2dcae'
      && equal(data.locales, ['ja_JP','en_US'])
      && equal(data.excludedDedicated, ['Jade_Akali','Jade_Galio','Jade_Poppy','Jade_Shyvana','Jade_XinZhao'])
      && equal(data.missingArchive, [])
      && data.coverage?.ja_JP?.clipRefs === 1833 && data.coverage?.en_US?.clipRefs === 1818
      && data.coverage?.ja_JP?.classifiedRefs === 1833 && data.coverage?.en_US?.classifiedRefs === 1818
      && Object.keys(data.champions || {}).length === 42);
    const accepted = {};
    for (const [id, row] of Object.entries(data.champions)) {
      check(/^Jade_[A-Za-z0-9]+$/.test(id) && row.appId === id.slice(5).toLowerCase()
        && Number.isInteger(row.championId) && row.championId > 0
        && Array.isArray(row.groups) && row.groups.length === 2
        && Array.isArray(row.clips) && row.clips.length > 0);
      const clientName = id === 'Jade_Wukong' ? 'monkeyking' : row.appId;
      const clips = new Map(row.clips.map(clip => [clip.id,clip]));
      check(clips.size === row.clips.length && equal(row.groups.map(group => group.locale), ['ja_JP','en_US']));
      for (const group of row.groups) {
        const proof = group.bindingProof;
        const bank = group.sourceBank;
        check(group.id === group.locale + '-' + bank?.sha256?.slice(0,16)
          && group.role === 'champion' && group.label === '클래식 모드 기본 음성'
          && group.sourceKind === 'CLASSIC_MODE_BASE_VO_26_18_ESTIMATE'
          && group.verification === 'estimated' && group.sourcePatch === '26.18' && group.modePatch === '26.19'
          && ['JADE_SKIN0_BASE_VO_NO_SKIN301','CLASSIC_SKIN301_BASE_VO'].includes(proof?.proofKind)
          && proof.bank?.toLowerCase() === (clientName + '_base_vo').toLowerCase()
          && proof.modePatch === '26.19' && hash(proof.modeSkinBinSha256)
          && hash(proof.jadeSkin0BinSha256) && proof.sourceWad?.toLowerCase() === (clientName + '.wad.client').toLowerCase()
          && bank.name === proof.bank && hash(bank.sha256) && hash(bank.eventBankSha256)
          && Number.isInteger(bank.bytes) && bank.bytes > 0
          && bank.path.toLowerCase().startsWith('assets/sounds/wwise2016/vo/en_us/characters/' + clientName + '/skins/base/')
          && bank.path.toLowerCase().endsWith('_base_vo_audio.wpk')
          && bank.sourceWadName?.toLowerCase() === (clientName + '.' + group.locale + '.wad.client').toLowerCase()
          && Number.isInteger(bank.matchedJadeEvents) && bank.matchedJadeEvents >= 0
          && Number.isInteger(bank.jadeEventCount) && bank.jadeEventCount > 0
          && Array.isArray(group.clipIds) && group.clipIds.length > 0
          && new Set(group.clipIds).size === group.clipIds.length
          && group.clipIds.every(clipId => clips.get(clipId)?.locale === group.locale));
      }
      check(equal([...new Set(row.groups.flatMap(group => group.clipIds))], [...clips.keys()]));
      for (const clip of row.clips) {
        const bank = row.groups.find(group => group.locale === clip.locale)?.sourceBank;
        check(['ja_JP','en_US'].includes(clip.locale) && clip.sourceLocale === clip.locale
          && clip.id === 'local-' + clip.locale + '-' + clip.sourceSha256
          && hash(clip.sourceSha256) && hash(clip.sha256) && clip.sourceBankSha256 === bank?.sha256
          && clip.file === 'audio/classic-voices/classic-mode-base-26195/' + clip.locale + '/' + clip.sourceSha256 + '.ogg'
          && Number.isInteger(clip.bytes) && clip.bytes > 4
          && Array.isArray(clip.events) && clip.events.every(event => typeof event === 'string' && !/(?:^|_)(?:pick|select|choose|ban)(?:$|_)/i.test(event))
          && Array.isArray(clip.categories) && clip.categories.length > 0
          && clip.categories[0] === clip.category
          && clip.categories.every(label => ['이동','공격','스킬','농담','도발','웃음','사망','특수','상황 미분류 음성'].includes(label)));
      }
      accepted[id] = {appId:row.appId, groups:row.groups, clips:row.clips};
    }
    return accepted;
  }).catch(() => null);
  const skin301EstimateCatalogHash = '65f1b5508e661f5350b255a3e32d3584a35c555246208c98d1b1a6a3e836c528';
  const skin301EstimateReady = fetch('data/classic-voice-locale-skin301-estimate-26195.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('') === skin301EstimateCatalogHash);
    const data = JSON.parse(raw);
    check(data.schemaVersion === 1 && data.classification === 'CLASSIC_MODE_SKIN301_LOCALIZED_VO_26_19_ESTIMATES'
      && data.sourcePatch === '26.19' && data.sourceClientVersion === '16.19.8217343'
      && data.sourceRmanManifestUrl === 'https://lol.secure.dyn.riotcdn.net/channels/public/releases/0FD60FCF49C0F665.manifest'
      && data.sourceRmanManifestSha256 === '0a0259f58391f509038915212d961b33f51f75786bec83831739d2cc714e3c84'
      && data.sourcePickCatalogSha256 === '661df0b9326ce9611fcaba89fb83f8ef86f0669d89f7351f12379e0bc5f2dcae'
      && equal(data.locales, ['ja_JP','en_US'])
      && data.coverage?.ja_JP?.clipRefs === 233 && data.coverage?.en_US?.clipRefs === 239
      && data.coverage?.ja_JP?.classifiedRefs === 233 && data.coverage?.en_US?.classifiedRefs === 239
      && equal(Object.keys(data.champions || {}), ['Jade_Akali','Jade_Galio','Jade_Poppy','Jade_Shyvana','Jade_XinZhao']));
    const accepted = {};
    for (const [id, row] of Object.entries(data.champions)) {
      check(row.appId === id.slice(5).toLowerCase() && Number.isInteger(row.championId) && row.championId > 0
        && Array.isArray(row.groups) && row.groups.length === 2
        && Array.isArray(row.clips) && row.clips.length > 0);
      const clips = new Map(row.clips.map(clip => [clip.id,clip]));
      check(clips.size === row.clips.length && equal(row.groups.map(group => group.locale), ['ja_JP','en_US']));
      for (const group of row.groups) {
        const proof = group.bindingProof;
        const bank = group.sourceBank;
        const stem = row.appId + '_skin301_vo_';
        check(group.id === group.locale + '-' + bank?.sha256?.slice(0,16)
          && group.label === '클래식 모드 전용 음성' && group.role === 'champion'
          && group.sourceKind === 'CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE'
          && group.verification === 'mode_binding_verified_recording_age_unverified'
          && group.sourcePatch === '26.19'
          && proof?.proofKind === 'CLASSIC_SKIN301_DEDICATED_VO_26_19'
          && proof.bank?.toLowerCase() === (id.slice(5) + '_Skin301_VO').toLowerCase()
          && proof.modePatch === '26.19' && hash(proof.modeSkinBinSha256)
          && proof.sourceWad?.toLowerCase() === (id.slice(5) + '.wad.client').toLowerCase()
          && bank.name === proof.bank && hash(bank.sha256) && hash(bank.eventBankSha256)
          && hash(bank.audioBankSha256) && hash(bank.sourceWadHeaderSha256)
          && bank.sourceRmanManifestSha256 === data.sourceRmanManifestSha256
          && bank.path === 'assets/sounds/wwise2016/vo/en_us/characters/' + row.appId + '/skins/skin301/' + stem + 'audio.wpk'
          && bank.sourceWadName === id.slice(5) + '.' + group.locale + '.wad.client'
          && bank.sourceWadManifestFile === 'DATA/FINAL/Champions/' + bank.sourceWadName
          && Number.isInteger(bank.bytes) && bank.bytes > 0
          && Number.isInteger(bank.matchedClassicEvents) && bank.matchedClassicEvents > 0
          && Number.isInteger(bank.classicEventCount) && bank.classicEventCount > 0
          && Array.isArray(group.clipIds) && group.clipIds.length > 0
          && new Set(group.clipIds).size === group.clipIds.length
          && group.clipIds.every(clipId => clips.get(clipId)?.locale === group.locale));
      }
      check(equal([...new Set(row.groups.flatMap(group => group.clipIds))], [...clips.keys()]));
      for (const clip of row.clips) {
        const bank = row.groups.find(group => group.locale === clip.locale)?.sourceBank;
        check(['ja_JP','en_US'].includes(clip.locale) && clip.sourceLocale === clip.locale
          && clip.id === 'local-' + clip.locale + '-' + clip.sourceSha256
          && hash(clip.sourceSha256) && hash(clip.sha256) && clip.sourceBankSha256 === bank?.sha256
          && clip.file === 'audio/classic-voices/localized-26195-cdn-1619-estimate/' + clip.locale + '/' + clip.sourceSha256 + '.ogg'
          && Number.isInteger(clip.bytes) && clip.bytes > 4
          && Number.isInteger(clip.sourceWemBytes) && clip.sourceWemBytes > 4
          && Array.isArray(clip.sourceMediaIds) && clip.sourceMediaIds.length > 0
          && clip.sourceMediaIds.every(value => Number.isInteger(value) && value > 0)
          && Array.isArray(clip.events) && clip.events.length > 0
          && clip.events.every(event => typeof event === 'string' && !/(?:^|_)(?:pick|select|choose|ban)(?:$|_)/i.test(event))
          && Array.isArray(clip.categories) && clip.categories.length > 0
          && clip.categories[0] === clip.category
          && clip.categories.every(label => ['이동','공격','스킬','농담','도발','웃음','사망','특수'].includes(label)));
      }
      accepted[id] = {appId:row.appId, groups:row.groups, clips:row.clips};
    }
    return accepted;
  }).catch(() => null);
  const koreanEstimateCatalogHash = 'c1f738094d7e15128031028d3e942a01289effe33955a725c0e526f940ec4676';
  const koreanEstimateReady = fetch('data/classic-voice-locale-ko-estimate-26195.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('') === koreanEstimateCatalogHash);
    const data = JSON.parse(raw);
    check(data.schemaVersion === 1 && data.classification === 'CLASSIC_MODE_KOREAN_VO_ESTIMATES'
      && data.locale === 'ko_KR' && data.baseSourcePatch === '26.18' && data.dedicatedSourcePatch === '26.19'
      && data.sourcePickCatalogSha256 === '661df0b9326ce9611fcaba89fb83f8ef86f0669d89f7351f12379e0bc5f2dcae'
      && hash(data.sourceVerifiedCatalogSha256)
      && data.coverage?.champions === 48 && data.coverage?.baseChampions === 43
      && data.coverage?.dedicatedChampions === 5 && data.coverage?.clipRefs === 2139
      && data.coverage?.classifiedRefs === 2139 && Object.keys(data.champions || {}).length === 48
      && Object.hasOwn(data.champions, 'Jade_Garen'));
    const accepted = {};
    let baseCount = 0, dedicatedCount = 0, clipCount = 0, classifiedCount = 0;
    for (const [id, row] of Object.entries(data.champions)) {
      check(/^Jade_[A-Za-z0-9]+$/.test(id) && !Object.hasOwn(restored, id)
        && row.appId === id.slice(5).toLowerCase() && Number.isInteger(row.championId) && row.championId > 0
        && Array.isArray(row.groups) && row.groups.length === 1
        && Array.isArray(row.clips) && row.clips.length > 0);
      const group = row.groups[0], bank = group.sourceBank, proof = group.bindingProof;
      const isBase = group.sourceKind === 'CLASSIC_MODE_BASE_VO_26_18_ESTIMATE';
      const isDedicated = group.sourceKind === 'CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE';
      const clientName = id === 'Jade_Wukong' ? 'monkeyking' : row.appId;
      check((isBase || isDedicated) && group.locale === 'ko_KR' && group.role === 'champion'
        && group.id === 'ko_KR-' + bank?.sha256?.slice(0, 16)
        && group.label === (isBase ? '클래식 모드 기본 음성' : '클래식 모드 전용 음성')
        && group.verification === (isBase ? 'estimated' : 'mode_binding_verified_recording_age_unverified')
        && group.sourcePatch === (isBase ? '26.18' : '26.19')
        && proof?.proofKind === (isDedicated ? 'CLASSIC_SKIN301_DEDICATED_VO_26_19' : proof?.proofKind)
        && ['JADE_SKIN0_BASE_VO_NO_SKIN301','CLASSIC_SKIN301_BASE_VO','CLASSIC_SKIN301_DEDICATED_VO_26_19'].includes(proof?.proofKind)
        && proof.modePatch === '26.19' && hash(proof.modeSkinBinSha256)
        && bank.name === proof.bank && hash(bank.sha256) && hash(bank.eventBankSha256)
        && Number.isInteger(bank.bytes) && bank.bytes > 0
        && bank.sourceWadName.toLowerCase() === clientName + '.ko_kr.wad.client'
        && bank.path.toLowerCase().startsWith('assets/sounds/wwise2016/vo/en_us/characters/' + clientName + '/skins/' + (isBase ? 'base/' : 'skin301/'))
        && bank.path.toLowerCase().endsWith('_vo_audio.wpk')
        && (isBase ? group.modePatch === '26.19' && hash(proof.jadeSkin0BinSha256)
          : bank.sourceOrigin === 'INSTALLED_26_19_KO_WAD' && hash(bank.sourceWadSha256) && hash(bank.audioBankSha256))
        && Array.isArray(group.clipIds) && group.clipIds.length === row.clips.length
        && new Set(group.clipIds).size === group.clipIds.length);
      const clips = new Map(row.clips.map(clip => [clip.id, clip]));
      check(clips.size === row.clips.length && group.clipIds.every(id => clips.has(id)));
      for (const clip of row.clips) {
        check(clip.locale === 'ko_KR' && clip.sourceLocale === 'ko_KR'
          && clip.id === 'local-ko_KR-' + clip.sourceSha256
          && hash(clip.sourceSha256) && hash(clip.sha256) && clip.sourceBankSha256 === bank.sha256
          && clip.file === 'audio/classic-voices/' + (isBase ? 'classic-mode-base-26195' : 'classic-mode-skin301-ko-26195') + '/ko_KR/' + clip.sourceSha256 + '.ogg'
          && Number.isInteger(clip.bytes) && clip.bytes > 4
          && Array.isArray(clip.sourceMediaIds) && clip.sourceMediaIds.length > 0
          && clip.sourceMediaIds.every(value => Number.isInteger(value) && value > 0)
          && Array.isArray(clip.events) && clip.events.every(event => typeof event === 'string' && !/(?:^|_)(?:pick|select|choose|ban)(?:$|_)/i.test(event))
          && Array.isArray(clip.categories) && clip.categories.length > 0
          && clip.category === clip.categories[0]
          && clip.categories.every(label => ['이동','공격','스킬','농담','도발','웃음','사망','특수','상황 미분류 음성'].includes(label)));
        classifiedCount += clip.category !== '상황 미분류 음성';
      }
      clipCount += row.clips.length;
      if (isBase) baseCount++; else dedicatedCount++;
      accepted[id] = {appId:row.appId,groups:row.groups,clips:row.clips};
    }
    check(baseCount === 43 && dedicatedCount === 5 && clipCount === 2139 && classifiedCount === 2139);
    return accepted;
  }).catch(() => null);
  // New editions add separate rows; none of the 72 frozen classifications are rewritten.
  const new2620Ids = ['Jade_Aatrox','Jade_Caitlyn','Jade_Irelia','Jade_Karma','Jade_Quinn'];
  const supplemental2620Hash = 'd04def69d40f187b5f47acdc743550811733ba62508cf7a5a35eef35ee9098b3';
  const supplemental2620Ready = fetch('data/classic-voice-2620.json').then(async response => {
    if (!response.ok) return null;
    const raw = await response.text();
    const bytes = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    check(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('') === supplemental2620Hash);
    const data = JSON.parse(raw), languages = ['ko_KR','ja_JP','en_US'];
    check(data.schemaVersion === 1 && data.classification === 'CLASSIC_MODE_26_20_SUPPLEMENTAL_VOICE'
      && data.patch === '26.20' && data.sourceClientVersion === '16.20.8248524+branch.releases-16-20.content.release'
      && equal(data.locales, languages) && equal(Object.keys(data.champions || {}), new2620Ids)
      && hash(data.sourceRmanManifestSha256) && data.listeningVerification === 'NOT_PERFORMED');
    const accepted = {};
    for (const [id, row] of Object.entries(data.champions)) {
      check(row.appId === id.slice(5).toLowerCase() && row.classicKey === row.championId + 60000
        && Array.isArray(row.groups) && row.groups.length === 3 && Array.isArray(row.clips) && row.clips.length > 0
        && equal(row.groups.map(group => group.locale), languages));
      const clips = new Map(row.clips.map(clip => [clip.id, clip]));
      check(clips.size === row.clips.length);
      for (const group of row.groups) {
        const bank = group.sourceBank, proof = group.bindingProof;
        check(group.sourceKind === 'CLASSIC_MODE_VO_26_20' && group.sourcePatch === '26.20'
          && group.role === 'champion' && group.verification === 'mode_binding_and_locale_source_verified_listening_unverified'
          && proof?.proofKind === 'INSTALLED_JADE_VO_BINDING_26_20' && proof.modePatch === '26.20'
          && hash(proof.modeSkinBinSha256) && bank?.name === proof.bank && hash(bank.sha256)
          && hash(bank.eventBankSha256) && hash(bank.audioBankSha256)
          && bank.sourceWadName === id.slice(5) + '.' + group.locale + '.wad.client'
          && bank.sourceRmanManifestSha256 === data.sourceRmanManifestSha256
          && Array.isArray(group.clipIds) && group.clipIds.length > 0
          && new Set(group.clipIds).size === group.clipIds.length
          && group.clipIds.every(clipId => clips.get(clipId)?.locale === group.locale));
      }
      check(equal(row.groups.flatMap(group => group.clipIds), [...clips.keys()]));
      for (const clip of row.clips) {
        check(languages.includes(clip.locale) && clip.sourceLocale === clip.locale
          && hash(clip.sourceSha256) && hash(clip.sha256)
          && clip.id === 'classic2620-' + clip.locale + '-' + clip.sourceSha256
          && clip.file === 'audio/classic-voices/classic-mode-2620/' + clip.locale + '/' + clip.sourceSha256 + '.ogg'
          && Number.isInteger(clip.bytes) && clip.bytes > 4
          && clip.sourceBankSha256 === row.groups.find(group => group.locale === clip.locale).sourceBank.sha256
          && Array.isArray(clip.sourceMediaIds) && clip.sourceMediaIds.length > 0
          && clip.sourceMediaIds.every(value => Number.isInteger(value) && value > 0)
          && Array.isArray(clip.events) && clip.events.every(value => typeof value === 'string')
          && Array.isArray(clip.categories) && clip.categories.length > 0 && clip.category === clip.categories[0]
          && clip.categories.every(label => ['이동','공격','스킬','농담','도발','웃음','사망','특수','상황 미분류 음성'].includes(label)));
      }
      accepted[id] = row;
    }
    return accepted;
  }).catch(() => null);
  const ready = Promise.all([restoredReady, localizedReady, cdnReady, garenReady, baseReady, skin301EstimateReady, koreanEstimateReady, supplemental2620Ready]).then(([restoredAvailable, localized, cdn, garen, base, skin301Estimate, koreanEstimate, supplemental2620]) => {
    if (!restoredAvailable) return false;
    const supplements = [localized, cdn];
    for (const supplement of supplements) {
      if (!supplement || !Object.entries(supplement).every(([id, extension]) => {
        const row = catalog.champions[id];
        if (row?.status !== 'available' || extension.appId !== id.slice(5).toLowerCase()
            || row.availableLocales.includes('ja_JP') || row.availableLocales.includes('en_US')) return false;
        return extension.groups.every(group => row.voiceBanks.some(bank =>
          bank.name === group.sourceBank.name
          && (!group.sourceBank.reviewedKoWpkSha256
            || (bank.files.some(file => file.sha256 === group.sourceBank.reviewedKoWpkSha256)
              && bank.files.some(file => file.sha256 === group.sourceBank.reviewedKoEventSha256)))));
      })) continue;
      for (const [id, extension] of Object.entries(supplement)) {
        const row = catalog.champions[id];
        catalog.champions[id] = {...row,
          availableLocales:[...row.availableLocales, 'ja_JP', 'en_US'],
          voiceGroups:[...row.voiceGroups, ...extension.groups],
          clips:[...row.clips, ...extension.clips]};
      }
    }
    const row = catalog.champions.Jade_Garen;
    if (garen && row?.status === 'unavailable' && !row.clips.length && !row.voiceGroups.length) {
      catalog.champions.Jade_Garen = {...row, status:'available', unavailable:null,
        availableLocales:['ja_JP','en_US'], voiceGroups:garen.groups, clips:garen.clips};
    }
    if (base && Object.entries(base).every(([id, extension]) => {
      const existing = catalog.champions[id];
      return (!existing || (existing.status === 'unavailable' && !existing.clips.length && !existing.voiceGroups.length))
        && extension.appId === id.slice(5).toLowerCase();
    })) {
      for (const [id, extension] of Object.entries(base)) {
        catalog.champions[id] = {...catalog.champions[id], status:'available', unavailable:null,
          availableLocales:['ja_JP','en_US'], voiceGroups:extension.groups, clips:extension.clips};
      }
    }
    if (skin301Estimate && Object.entries(skin301Estimate).every(([id, extension]) => {
      const existing = catalog.champions[id];
      return (!existing || (existing.status === 'unavailable' && !existing.clips.length && !existing.voiceGroups.length))
        && extension.appId === id.slice(5).toLowerCase();
    })) {
      for (const [id, extension] of Object.entries(skin301Estimate)) {
        catalog.champions[id] = {...catalog.champions[id], status:'available', unavailable:null,
          availableLocales:['ja_JP','en_US'], voiceGroups:extension.groups, clips:extension.clips};
      }
    }
    if (koreanEstimate && Object.entries(koreanEstimate).every(([id, extension]) => {
      const existing = catalog.champions[id];
      const empty = !existing || (existing.status === 'unavailable'
        && !existing.voiceGroups.length && !existing.clips.length);
      return (empty || existing.status === 'available')
        && extension.appId === id.slice(5).toLowerCase()
        && !(existing?.availableLocales || []).includes('ko_KR')
        && !(existing?.voiceGroups || []).some(group => group.locale === 'ko_KR')
        && !(existing?.clips || []).some(clip => clip.sourceLocale === 'ko_KR');
    })) {
      for (const [id, extension] of Object.entries(koreanEstimate)) {
        const existing = catalog.champions[id];
        catalog.champions[id] = {...existing, status:'available', unavailable:null,
          availableLocales:[...(existing?.availableLocales || []), 'ko_KR'],
          voiceGroups:[...(existing?.voiceGroups || []), ...extension.groups],
          clips:[...(existing?.clips || []), ...extension.clips]};
      }
    }
    if (supplemental2620 && new2620Ids.every(id => !Object.hasOwn(catalog.champions, id))) {
      for (const [id, extension] of Object.entries(supplemental2620)) {
        catalog.champions[id] = {status:'available', unavailable:null,
          availableLocales:['ko_KR','ja_JP','en_US'], defaultGroupId:extension.groups[0].id,
          defaultClipId:extension.groups[0].clipIds[0], voiceGroups:extension.groups, clips:extension.clips};
      }
    }
    return true;
  });

  function stop() {
    ticket++;
    selectionPlayback = false;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    document.querySelectorAll('[data-classic-voice-clip]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      const icon = button.querySelector('.classicVoicePlay');
      if (icon) icon.textContent = '▶';
    });
  }
  async function play(id, clipId, options = {}) {
    if (global.ClassicPickVoice?.suspended) { stop(); return false; }
    global.ClassicPickVoice?.stop();
    stop();
    const current = ticket;
    if (typeof clipId !== 'string' || !clipId) return false;
    if ((!catalog && !await ready) || current !== ticket) return false;
    const row = catalog?.champions[id];
    const clip = row?.status === 'available' ? row.clips.find(value => value.id === clipId) : null;
    if (!clip || clip.sourceLocale !== (global.ClassicPickVoice?.getLocale() || 'ko_KR')) return false;
    selectionPlayback = !document.getElementById('modal')?.open;
    try {
      let source = clip.file;
      if (clip.file.startsWith('audio/classic-voices/shared/')
          || clip.file.startsWith('audio/classic-voices/localized-26195/')
          || clip.file.startsWith('audio/classic-voices/localized-26195-cdn-1619/')
          || clip.file.startsWith('audio/classic-voices/localized-26195-cdn-1619-estimate/')
          || clip.file.startsWith('audio/classic-voices/classic-mode-skin301-ko-26195/')
          || clip.file.startsWith('audio/classic-voices/classic-mode-base-26195/')
          || clip.file.startsWith('audio/classic-voices/garen-old-en-26195/')
          || clip.file.startsWith('audio/classic-voices/classic-mode-2620/')) {
        const response = await fetch(clip.file);
        if (!response.ok) throw new Error('Classic voice audio unavailable');
        const bytes = await response.arrayBuffer();
        const digest = Array.from(new Uint8Array(await global.crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
        if (bytes.byteLength !== clip.bytes || digest !== clip.sha256) throw new Error('Classic voice audio integrity mismatch');
        if (current !== ticket) return false;
        source = URL.createObjectURL(new Blob([bytes], {type:'audio/ogg'}));
        audioUrl = source;
      }
      const player = new Audio(source);
      audio = player; player.volume = global.ClassicPickVoice?.volume() ?? 0.55;
      player.addEventListener('ended', () => { if (audio === player) stop(); }, { once: true });
      player.addEventListener('error', () => {
        if (audio !== player) return;
        stop();
        if (!options.silentError && typeof toast === 'function') toast(ui('음성을 재생하지 못했습니다. 다시 눌러 주세요.', '音声を再生できませんでした。もう一度タップしてください。', 'Could not play the voice line. Tap again.'));
      }, { once: true });
      await player.play();
      if (current !== ticket) { player.pause(); return false; }
      document.querySelectorAll('[data-classic-voice-clip="' + clip.id + '"]').forEach(button => {
        button.setAttribute('aria-pressed','true');
        const icon = button.querySelector('.classicVoicePlay');
        if (icon) icon.textContent = '■';
      });
      return true;
    } catch (_) {
      if (current !== ticket) return false;
      stop();
      if (!options.silentError && typeof toast === 'function') toast(ui('음성을 재생하지 못했습니다. 다시 눌러 주세요.', '音声を再生できませんでした。もう一度タップしてください。', 'Could not play the voice line. Tap again.'));
      return false;
    }
  }
  const eventCategories = new Map([
    ['Move2DStandard','이동'], ['Attack2DGeneral','공격'], ['Spell3DBasic','스킬'],
    ['Spell3DQCast','스킬'], ['Spell3DWCast','스킬'], ['Spell3DECast','스킬'], ['Spell3DRCast','스킬'],
    ['Joke3DGeneral','농담'], ['Taunt3DGeneral','도발'], ['Laugh3DGeneral','웃음'], ['Death3D','사망']
  ]);
  function category(clip) {
    if (['이동','공격','스킬','농담','도발','웃음','사망','특수'].includes(clip.category)) return clip.category;
    const labels = [...new Set(clip.events.map(event => eventCategories.get(event.slice(event.lastIndexOf('_') + 1))).filter(Boolean))];
    if (labels.length === 1) return labels[0];
    if (labels.length === 2 && labels.includes('이동') && labels.includes('공격')) return '이동·공격';
    return '상황 미분류 음성';
  }
  const specialEvents = [
    [/^FirstEncounter[23]D/, '첫 만남'], [/^Kill[23]D/, '처치'],
    [/^UseItem2D/, '아이템 사용'], [/^Respawn2D/, '부활'], [/^Dance3D/, '춤']
  ];
  const clipCategories = (clip, group) => {
    const labels = Array.isArray(clip.categories) ? clip.categories : [category(clip)];
    if (!['CLASSIC_MODE_BASE_VO_26_18_ESTIMATE', 'CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE', 'CLASSIC_MODE_VO_26_20'].includes(group?.sourceKind)
        || !labels.includes('특수')) return labels;
    const events = Array.isArray(clip.events) ? clip.events.map(event => event.slice(event.lastIndexOf('_') + 1)) : [];
    const finer = specialEvents.filter(([pattern]) => events.some(event => pattern.test(event))).map(([, label]) => label);
    return labels.flatMap(label => label === '특수' ? (finer.length ? finer : ['특수']) : [label]);
  };
  const categoryOrder = ['이동','공격','이동·공격','첫 만남','처치','스킬','농담','도발','웃음','춤','아이템 사용','부활','사망','특수','상황 미분류 음성'];
  function getPreviewClip(id, locale) {
    const row = catalog?.champions[id];
    if (row?.status !== 'available' || !['ko_KR','ja_JP', 'en_US'].includes(locale)) return null;
    if (locale === 'ko_KR' && !row.voiceGroups.some(value => value.locale === locale && value.sourceKind === 'CLASSIC_MODE_VO_26_20')) return null;
    const group = row.voiceGroups.find(value => value.locale === locale && value.sourceKind === 'OLD_EN_FAN_ARCHIVE_ESTIMATE')
      || row.voiceGroups.find(value => value.locale === locale && value.label === '클래식 음성')
      || row.voiceGroups.find(value => value.locale === locale && value.sourceKind === 'CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE')
      || row.voiceGroups.find(value => value.locale === locale && value.sourceKind === 'CLASSIC_MODE_BASE_VO_26_18_ESTIMATE')
      || row.voiceGroups.find(value => value.locale === locale && value.sourceKind === 'CLASSIC_MODE_VO_26_20');
    if (!group) return null;
    const ids = new Set(group.clipIds);
    const clips = row.clips.filter(clip => ids.has(clip.id) && clip.sourceLocale === locale);
    return clips.find(clip => clipCategories(clip).includes('이동'))
      || clips[0] || null;
  }
  function groupName(group, champion) {
    if (group.sourceKind === 'OLD_EN_FAN_ARCHIVE_ESTIMATE') return ui('예전 영어 음성 자료', '旧英語ボイス資料', 'Old English voice archive');
    if (group.sourceKind === 'CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE') return ui('클래식 모드 전용 음성 (추정)', 'クラシックモード専用ボイス（推定）', 'Classic mode dedicated voice (estimated)');
    if (group.sourceKind === 'CLASSIC_MODE_BASE_VO_26_18_ESTIMATE') return ui('클래식 모드 기본 음성 (추정)', 'クラシックモードの基本ボイス（推定）', 'Classic mode base voice (estimated)');
    if (group.role === 'champion') return championName(champion);
    if (group.label === '기본 음성') return ui('기본 음성', '通常ボイス', 'Base voice');
    if (group.label === '클래식 음성') return ui('클래식 음성', 'クラシックボイス', 'Classic voice');
    const additional = group.label.match(/^추가 음성 (\d+)$/);
    if (additional) return ui(group.label, `追加ボイス ${additional[1]}`, `Additional voice ${additional[1]}`);
    return global.ClassicLocale?.text(group.label) || group.label;
  }
  const categoryName = label => ({
    '이동':ui('이동', '移動', 'Movement'), '공격':ui('공격', '攻撃', 'Attack'),
    '이동·공격':ui('이동·공격', '移動・攻撃', 'Movement · Attack'),
    '스킬':ui('스킬', 'スキル', 'Ability'), '농담':ui('농담', 'ジョーク', 'Joke'),
    '도발':ui('도발', '挑発', 'Taunt'), '웃음':ui('웃음', '笑い', 'Laugh'),
    '첫 만남':ui('첫 만남', '初遭遇', 'First encounter'), '처치':ui('처치', 'キル', 'Kill'),
    '아이템 사용':ui('아이템 사용', 'アイテム使用', 'Item use'), '부활':ui('부활', '復活', 'Respawn'),
    '춤':ui('춤', 'ダンス', 'Dance'), '사망':ui('사망', '死亡', 'Death'),
    '특수':ui('특수', '特殊', 'Special'),
    '상황 미분류 음성':ui('미분류', '未分類', 'Unclassified')
  })[label] || label;
  const voiceLanguageName = locale => ({
    ko_KR:ui('한국어', '韓国語', 'Korean'),
    ja_JP:ui('일본어', '日本語', 'Japanese'),
    en_US:ui('영어', '英語', 'English')
  })[locale] || ui('언어 미기재', '言語未記載', 'Language unspecified');
  function render(champion, row, groupId = row?.defaultGroupId, preserveScroll = false) {
    const pick = global.ClassicPickVoice;
    const locale = pick?.getLocale() || 'ko_KR';
    const pickId = pick?.championId(champion);
    const verifiedPickClip = pick?.getVerifiedClip(pickId);
    const candidatePickClip = locale === 'ko_KR' ? null : pick?.getClip?.(pickId, locale);
    const supplementalPickClip = pick?.getSupplementalPickClip?.(pickId, locale);
    const supplementalPickStatus = pick?.getSupplementalPickAvailability?.(pickId, locale);
    const group = row?.voiceGroups.find(value => value.id === groupId && value.locale === locale)
      || row?.voiceGroups.find(value => value.locale === locale && value.label === '기본 음성')
      || row?.voiceGroups.find(value => value.locale === locale);
    const modal = document.getElementById('modal');
    const previousScroll = preserveScroll && modal.open ? modal.scrollTop : 0;
    if (!group && !verifiedPickClip && !supplementalPickClip && !row?.availableLocales?.length) {
      const message = row?.status === 'unavailable'
        ? ui(row.unavailable.reason, 'クラシック当時の音声原本を確認中です。', 'The original Classic voice audio is being verified.')
        : ui('음성 데이터를 불러오지 못했습니다. 잠시 후 다시 열어 주세요.', '音声データを読み込めませんでした。しばらくしてからもう一度開いてください。', 'Could not load voice data. Please open it again shortly.');
      document.getElementById('modalBody').innerHTML = '<section class="classicDocument classicVoiceDocument"><h2>' + esc(championName(champion)) + ' · ' + ui('음성대사', 'ボイス', 'Voice lines') + '</h2><p class="classicVoiceAvailability" role="status">' + esc(message) + '</p></section>';
    } else {
      const selected = new Set(group?.clipIds || []);
      const clips = (row?.clips || []).filter(clip => selected.has(clip.id));
      const categories = new Map();
      for (const clip of clips) {
        for (const label of clipCategories(clip, group)) {
          if (!categories.has(label)) categories.set(label, []);
          categories.get(label).push(clip);
        }
      }
      const groups = (row?.voiceGroups || []).filter(value => value.locale === locale);
      const controls = groups.length > 1 ? '<label class="classicVoiceGroupControl"><span>' + (champion.riotId === 'Jade_Garen' ? ui('자료별 음성', '資料別ボイス', 'Voice by source') : ui('스킨별 음성', 'スキン別ボイス', 'Voice by skin')) + '</span><select data-classic-voice-group data-classic-voice-champion="' + esc(champion.riotId) + '">' + groups.map(value => '<option value="' + esc(value.id) + '"' + (value.id === group?.id ? ' selected' : '') + '>' + esc(groupName(value, champion)) + '</option>').join('') + '</select></label>' : '<p class="classicVoiceGroupName">' + esc(group ? groupName(group, champion) : championName(champion)) + '</p>';
      const locales = pick?.locales || row?.availableLocales || [];
      const voiceCount = clips.length;
      const voiceCountLabel = ['CLASSIC_MODE_BASE_VO_26_18_ESTIMATE','CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE','OLD_EN_FAN_ARCHIVE_ESTIMATE','CLASSIC_MODE_VO_26_20'].includes(group?.sourceKind)
        ? ui(` · 현지어 음성 ${voiceCount}개`, ` · 現地語ボイス${voiceCount}件`, ` · ${voiceCount} localized voice clips`)
        : ui(` · 검증된 현지 클래식 음성 ${voiceCount}개`, ` · 確認済みの現地クラシックボイス${voiceCount}件`, ` · ${voiceCount} verified localized Classic clips`);
      const languageTabs = groups.length || verifiedPickClip || candidatePickClip || supplementalPickStatus || clips.length ? '<div class="classicVoiceLocales" role="tablist" aria-label="' + ui('음성 언어', '音声言語', 'Voice language') + '">' + locales.map(lang => '<button type="button" role="tab" data-classic-voice-locale="' + lang + '" aria-selected="' + (lang === locale) + '">' + ({ko_KR:'한국어',ja_JP:'日本語',en_US:'English'}[lang] || esc(lang)) + '</button>').join('') + '<span>' + voiceCountLabel + '</span></div>' : '';
      const listen = ui('듣기', '再生', 'Play');
      const candidatePickItem = candidatePickClip ? '<li><button type="button" data-classic-candidate-pick-clip="' + pickId + '" aria-pressed="false"><span class="classicVoicePlay" aria-hidden="true">▶</span><span>' + ui('현지어 픽 대사 · 클래식 연결 추정 자료', '現地語のピックボイス・クラシック関連の推定資料', 'Localized pick line · estimated Classic link') + '</span><span class="classicVoiceLanguage">' + voiceLanguageName(candidatePickClip.locale) + '</span><span class="classicVoiceListen">' + listen + '</span></button></li>' : '';
      const verifiedPickItem = verifiedPickClip ? '<li><button type="button" data-classic-verified-pick-clip="' + pickId + '" aria-pressed="false"><span class="classicVoicePlay" aria-hidden="true">▶</span><span>' + (verifiedPickClip.assessedLanguage
        ? ui('26.19 클래식 픽 · 음원 언어 분석', '26.19クラシック選択ボイス・音声言語分析', '26.19 Classic pick · audio language assessment')
        : ui('26.19 클래식 픽 · 원본 언어 미기재', '26.19クラシック選択ボイス・原語未記載', '26.19 Classic pick · language unspecified')) + '</span><span class="classicVoiceLanguage">' + voiceLanguageName(verifiedPickClip.assessedLanguage || verifiedPickClip.sourceLanguage) + '</span><span class="classicVoiceListen">' + listen + '</span></button></li>' : '';
      const supplementalPickItem = supplementalPickClip ? '<li><button type="button" data-classic-supplemental-pick-clip="' + pickId + '" aria-pressed="false"><span class="classicVoicePlay" aria-hidden="true">▶</span><span>' + ui('옛 픽 원본', '旧ピック原音', 'Archived pick') + '</span><span class="classicVoiceLanguage">' + voiceLanguageName(supplementalPickClip.locale) + '</span><span class="classicVoiceListen">' + listen + '</span></button></li>' : '';
      const pickNote = supplementalPickStatus === 'HISTORICAL_SOURCE_NOT_ACQUIRED'
        ? '<p class="classicVoiceCategoryHint" role="status">' + ui('이 언어의 클래식 픽 원본을 찾고 있습니다. 확보 전까지 다른 음성으로 대신 재생하지 않습니다.', 'この言語のクラシック選択原音を調査中です。確保するまでは別のボイスで代用しません。', 'The original Classic pick in this language is being located. No other voice line is substituted.') + '</p>' : '';
      const pickSection = candidatePickItem || verifiedPickItem || supplementalPickItem || supplementalPickStatus ? '<section class="classicVoiceCategory classicVoicePickCategory"><h3>' + ui('픽 대사', 'ピック時のセリフ', 'Pick line') + '</h3>' + pickNote + '<ul class="classicVoiceList">' + supplementalPickItem + candidatePickItem + verifiedPickItem + '</ul></section>' : '';
      const categorySections = categoryOrder.filter(label => categories.has(label)).map(label => {
        const items = categories.get(label);
        const unclassified = label === '상황 미분류 음성';
        const expanded = !unclassified || categories.size === 1 ? ' open' : '';
        return '<details class="classicVoiceCategory" data-classic-voice-category="' + esc(label) + '"' + expanded + '><summary><strong>' + esc(categoryName(label)) + '</strong><small>' + ui(`${items.length}개`, `${items.length}件`, `${items.length} clips`) + '</small></summary>'
          + (unclassified ? '<p class="classicVoiceCategoryHint">' + ui('재생 상황을 확인할 수 없어 분류하지 않았습니다.', '再生状況を確認できなかったため、分類していません。', 'The playback context could not be verified, so these lines remain unclassified.') + '</p>' : '')
          + '<ul class="classicVoiceList">' + items.map((clip, index) => '<li><button type="button" data-classic-voice-clip="' + clip.id + '" data-classic-voice-champion="' + esc(champion.riotId) + '" data-classic-audio-kind="localized-vo" aria-pressed="false"><span class="classicVoicePlay" aria-hidden="true">▶</span><span>' + esc(categoryName(label)) + ' ' + (index + 1) + '</span><span class="classicVoiceLanguage">' + voiceLanguageName(clip.sourceLocale) + '</span><span class="classicVoiceListen">' + listen + '</span></button></li>').join('') + '</ul></details>';
      }).join('');
      const garenSourceNote = group?.sourceKind === 'OLD_EN_FAN_ARCHIVE_ESTIMATE'
        ? ui('외부 보관 자료에서 예전 음성으로 분류한 파일입니다. 원본 녹음 시기는 확인되지 않았습니다.', '外部アーカイブで旧音声に分類された資料です。元の収録時期は未確認です。', 'These files are labeled old voice in a community archive. Their original recording date is unverified.')
        : group?.sourceKind === 'CLASSIC_MODE_SKIN301_VO_26_19_ESTIMATE'
          ? ui('26.19 클래식 모드 전용 음성 지정과 현지어 음원은 확인했습니다. 옛날 녹음인지 여부는 확인되지 않아 추정 자료로 표시합니다.', '26.19クラシックモード専用の音声指定と現地語の音源は確認済みです。旧録音かどうかは未確認のため推定資料として表示します。', 'The 26.19 Classic mode dedicated voice binding and localized audio are confirmed. Recording age remains unverified, so this is labeled an estimate.')
        : group?.sourceKind === 'CLASSIC_MODE_BASE_VO_26_18_ESTIMATE'
          ? ui('26.19 클래식 챔피언의 기본 음성 바인딩에 맞춘 26.18 현지어 음성 추정 자료입니다. 26.19 음원과 같은 파일인지, 옛날 녹음인지는 확인되지 않았습니다.', '26.19クラシックチャンピオンの基本ボイス指定に合わせた26.18の現地語推定資料です。26.19の音源と同一か、旧録音かどうかは未確認です。', 'Estimated 26.18 localized base voice matched to a 26.19 Classic champion base-voice binding. Byte identity with 26.19 audio and recording age are unverified.') : '';
      const source2620Note = group?.sourceKind === 'CLASSIC_MODE_VO_26_20'
        ? ui('26.20 클래식 모드가 지정한 현지어 음성입니다. 항목을 누르면 한 번 재생합니다.', '26.20クラシックモードで指定された現地語ボイスです。項目をタップすると1回再生します。', 'Localized audio bound by the 26.20 Classic mode. Tap an entry to play once.') : '';
      const availability = source2620Note || garenSourceNote || (clips.length ? ui('항목을 누르면 해당 음성을 한 번 재생합니다.', '項目をタップすると音声を1回再生します。', 'Tap an entry to play its voice line once.')
        : candidatePickClip ? ui('이 언어로 검증된 클래식 게임 음성은 없습니다. 아래 현지어 픽 대사는 클래식 연결 추정 자료입니다.', 'この言語で確認済みのクラシックゲーム音声はありません。下の現地語ピックボイスはクラシック関連の推定資料です。', 'No Classic game voice is verified in this language. The localized pick below is an estimated Classic-linked source.')
          : ui('이 언어로 검증된 클래식 음성은 없습니다. 원본 언어가 기록되지 않은 픽 대사만 재생할 수 있습니다.', 'この言語で確認済みのクラシックボイスはありません。原音声の言語が未記載のピックボイスのみ再生できます。', 'No Classic voice lines are verified in this language. Only the pick line with an unspecified source language is available.'));
      document.getElementById('modalBody').innerHTML = '<section class="classicDocument classicVoiceDocument"><h2>' + esc(championName(champion)) + ' · ' + ui('음성대사', 'ボイス', 'Voice lines') + '</h2>' + controls + languageTabs + '<p class="classicVoiceHint">' + availability + '</p>' + pickSection + categorySections + '</section>';
    }
    if (!modal.open) modal.showModal();
    modal.scrollTop = previousScroll;
  }
  async function open(champion) {
    global.ClassicPickVoice?.stop();
    stop();
    if (global.ClassicPickVoice?.suspended) {
      document.getElementById('modalBody').innerHTML = '<section class="classicDocument classicVoiceDocument"><h2>' + ui('챔피언 음성', 'チャンピオンのボイス', 'Champion voices') + '</h2><p role="status">' + ui('음성 기능을 잠시 꺼두었습니다.', '音声機能は一時的に停止しています。', 'Voice playback is temporarily disabled.') + '</p></section>';
      const modal = document.getElementById('modal');
      if (!modal.open) modal.showModal();
      return;
    }
    const current = ticket, route = location.hash;
    await Promise.all([ready, global.ClassicPickVoice?.ready]);
    if (current !== ticket || route !== location.hash) return;
    activeChampion = champion;
    render(champion, catalog?.champions[champion.riotId]);
  }
  document.addEventListener('click', event => {
    const language = event.target.closest?.('[data-classic-voice-locale]');
    if (language && activeChampion) {
      if (global.ClassicPickVoice?.setLocale(language.dataset.classicVoiceLocale)) render(activeChampion, catalog?.champions[activeChampion.riotId], undefined, true);
      else if (typeof toast === 'function') toast(ui('음성 언어를 저장하지 못했습니다. 다시 눌러 주세요.', '音声言語を保存できませんでした。もう一度タップしてください。', 'Could not save the voice language. Tap again.'));
      return;
    }
    const verifiedPickButton = event.target.closest?.('[data-classic-verified-pick-clip]');
    const supplementalPickButton = event.target.closest?.('[data-classic-supplemental-pick-clip]');
    if (supplementalPickButton && activeChampion) {
      global.ClassicPickVoice?.playSupplemental(Number(supplementalPickButton.dataset.classicSupplementalPickClip), activeChampion.id, true);
      return;
    }
    if (verifiedPickButton && activeChampion) {
      global.ClassicPickVoice?.playVerified(Number(verifiedPickButton.dataset.classicVerifiedPickClip), activeChampion.id, true);
      return;
    }
    const candidatePickButton = event.target.closest?.('[data-classic-candidate-pick-clip]');
    if (candidatePickButton && activeChampion) {
      global.ClassicPickVoice?.playCandidate(Number(candidatePickButton.dataset.classicCandidatePickClip), activeChampion.id, true);
      return;
    }
    const button = event.target.closest?.('[data-classic-voice-clip]');
    if (!button) return;
    play(button.dataset.classicVoiceChampion, button.dataset.classicVoiceClip);
  });
  document.addEventListener('change', event => {
    const select = event.target.closest?.('select[data-classic-voice-group]');
    if (!select || !activeChampion || select.dataset.classicVoiceChampion !== activeChampion.riotId) return;
    stop();
    render(activeChampion, catalog?.champions[activeChampion.riotId], select.value, true);
  });
  const stopAll = () => { stop(); global.ClassicPickVoice?.stop(); };
  document.getElementById('modal')?.addEventListener('close', () => {
    // close is queued: it must not cancel a new detail's autoplay or a reopened dialog.
    if (document.getElementById('modal')?.open) return;
    if (!selectionPlayback) { stop(); global.ClassicPickVoice?.stopManual(); }
  });
  document.getElementById('modal')?.addEventListener('cancel', stopAll);
  global.addEventListener('pagehide', stopAll);
  global.addEventListener('hashchange', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  global.ClassicVoiceLibrary = Object.freeze({ ready, play, open, stop, getPreviewClip });
})(window);
