/* Browser-only archive preview: no community or external video requests. */
(() => {
  'use strict';
  const copy = {
    ko_KR: { label:'PC 베타 · 백과사전 전용 미리보기', backSite:'사이트로 돌아가기', backArchive:'백과사전 홈으로',
      title:'온라인 기능은 이 PC 베타에 연결되지 않았습니다.',
      body:'챔피언, 아이템, 특성, 주문, 룬, 새소식과 로컬 설정을 둘러볼 수 있습니다. 자유게시판은 Android 앱에서 이용해 주세요.',
      settingsNote:'룬·특성·빌드 선택은 이 브라우저에 저장됩니다. PC 베타에서는 온라인 커뮤니티를 이용할 수 없습니다.',
      aboutNote:'PC 베타에서는 챔피언·스킬·아이템·특성·소환사 주문·룬 정보를 살펴보고 룬과 특성 편성을 브라우저에 저장할 수 있습니다. 온라인 커뮤니티는 Android 앱에서 이용할 수 있습니다.' },
    ja_JP: { label:'PC ベータ · 百科事典プレビュー', backSite:'サイトに戻る', backArchive:'百科事典のホームへ',
      title:'この PC ベータではオンライン機能を利用できません。',
      body:'チャンピオン、アイテム、マスタリー、サモナースペル、ルーン、ニュース、ローカル設定を閲覧できます。掲示板は Android アプリでご利用ください。',
      settingsNote:'ルーン、マスタリー、ビルドの選択はこのブラウザに保存されます。PC ベータではオンラインコミュニティを利用できません。',
      aboutNote:'PC ベータではチャンピオン、スキル、アイテム、マスタリー、サモナースペル、ルーンを閲覧し、ルーンとマスタリーの編成をブラウザに保存できます。オンラインコミュニティは Android アプリで利用できます。' },
    en_US: { label:'PC Beta · Archive-only preview', backSite:'Back to site', backArchive:'Back to archive',
      title:'Online features are not connected in this PC Beta.',
      body:'Explore champions, items, masteries, spells, runes, news, and local settings. Use the Android app for the community.',
      settingsNote:'Rune, mastery, and build choices are stored in this browser. The online community is unavailable in the PC Beta.',
      aboutNote:'The PC Beta lets you browse champions, abilities, items, masteries, spells, and runes, and save rune and mastery choices in this browser. The online community is available in the Android app.' }
  };
  const ui = () => copy[window.ClassicLocale?.getLocale?.()] || copy.en_US;
  const unavailable = () => {
    const t = ui();
    return `<section class="pcBetaUnavailable"><h2>${t.title}</h2><p>${t.body}</p><button type="button" data-go="home">${t.backArchive}</button></section>`;
  };
  board = unavailable;
  post = unavailable;
  const androidSettings = settings;
  settings = function () {
    const old = localized('룬·특성·빌드 및 오프라인 게시판 데이터는 기기에 저장됩니다. 온라인 닉네임·글·댓글·추천·신고·차단·버그 신고는 커뮤니티 서버에서 처리됩니다.');
    return androidSettings().replace(`<p class="hint">${old}</p>`, `<p class="hint">${ui().settingsNote}</p>`);
  };
  const androidAbout = about;
  about = function () {
    const old = localized('챔피언·스킬·아이템·특성·소환사 주문·룬 정보를 살펴보고, 룬과 특성 편성을 기기에 저장할 수 있습니다. 익명 온라인 커뮤니티에서는 게시글·댓글·추천·신고·차단과 프로필 삭제 기능을 제공합니다.');
    return androidAbout().replace(old, ui().aboutNote);
  };
  const originalHomeFeed = homeFeed;
  homeFeed = function (tab) {
    if (tab === '커뮤니티' || tab === '영상')
      return `<li class="hmFeedEmpty"><span class="hmFeedStatus">${ui().title}</span></li>`;
    return originalHomeFeed(tab);
  };
  loadLolVideos = async () => {};
  const publicDocuments = Object.freeze({
    'document/contact':'../contact.html',
    'document/terms':'../terms.html',
    'document/privacy':'../privacy.html',
    'document/deletion':'../delete-account.html',
    'online-delete':'../delete-account.html'
  });
  const archiveGo = go;
  go = function (route) {
    if (publicDocuments[route]) {
      location.assign(publicDocuments[route]);
      return;
    }
    return archiveGo(route);
  };
  if (publicDocuments[location.hash.slice(1)]) {
    location.replace(publicDocuments[location.hash.slice(1)]);
    return;
  }
  document.body.classList.add('pcBetaWeb');
  const banner = document.createElement('aside');
  banner.className = 'pcBetaBanner';
  banner.innerHTML = '<strong></strong><a href="../index.html"></a>';
  document.querySelector('.app').before(banner);
  const syncBannerHeight = () => {
    const height = `${banner.getBoundingClientRect().height}px`;
    if (document.documentElement.style.getPropertyValue('--pc-beta-banner-height') !== height)
      document.documentElement.style.setProperty('--pc-beta-banner-height', height);
  };
  const update = () => {
    banner.querySelector('strong').textContent = ui().label;
    banner.querySelector('a').textContent = ui().backSite;
    syncBannerHeight();
  };
  update();
  window.addEventListener('classic-locale-change', update);
  window.addEventListener('resize', syncBannerHeight);
  new ResizeObserver(syncBannerHeight).observe(banner);
})();
