(() => {
  'use strict';

  const VERSION = '2.0.4.30';
  const ui = value => window.ClassicLocale?.text(value) || value;

  const HIDDEN_HOME_ROUTES = new Set([
    'terms',
    'settings',
  ]);


  /* ==========================================================
     BASIC HELPERS
     ========================================================== */

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(
      root.querySelectorAll(selector)
    );
  }

  function textOf(element) {
    return String(
      element?.textContent || ''
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  function ensureChampionInterfaceControls() {
    const page = qs('.clsPage');
    document.body.classList.toggle('device218ChampionList', Boolean(page));
    if (!page) return;
    const grid = qs('.classicPortraitGrid', page);
    if (grid && !grid.children.length && !qs('.historicalChampionEmpty', page)) {
      const empty = document.createElement('p');
      empty.className = 'hint2 historicalChampionEmpty';
      empty.setAttribute('role', 'status');
      empty.textContent = ui('검색 결과가 없습니다.');
      grid.after(empty);
    }
  }

  function ensureDevice218HomeSurface() {
    const home = qs('#view > .hm');
    if (!home) return;

    const label = qs('.hmLogo b', home);
    const sublabel = qs('.hmLogo small', home);
    const managedHome = window.__lolCmsShared?.home?.[0];
    if (label) label.textContent = ui(managedHome?.title || '클래식 챔피언');
    if (sublabel) sublabel.textContent = ui(managedHome?.subtitle ?? '좌우로 넘겨보세요 ›');

    const rotation = qs('.hmRot', home);
    if (!rotation || typeof cards !== 'function') return;

    const classicPool =
      typeof classicChampions === 'function'
        ? classicChampions()
        : [];

    const championCount = classicPool.length;
    const previewCount = championCount;

    if (
      previewCount > 0
      && qsa('.rotC[data-classic-id]', rotation).length !== previewCount
    ) {
      const template = document.createElement('template');
      template.innerHTML = cards(previewCount);
      rotation.replaceChildren(template.content);
    }

    rotation.classList.add('finalClassicChampionCarousel');
    rotation.classList.remove('finalClassicChampionGrid');
    rotation.dataset.classicChampionCount = String(previewCount);
    rotation.dataset.classicChampionTotal = String(championCount);
    rotation.setAttribute('tabindex', '0');
    rotation.setAttribute(
      'aria-label',
      `${ui('클래식 챔피언')} ${previewCount}. ${ui('좌우로 넘겨 다른 챔피언을 볼 수 있습니다.')}`,
    );
  }

  function currentRoute() {
    return location.hash.slice(1) || 'home';
  }

  function isHome() {
    return !!qs('#view > .hm');
  }

  function isBoardDetail() {
    return !!qs('#view .onlineBoard .bdBody');
  }

  function isBoardList() {
    return !!qs('#view .brows .brow');
  }

  function activeHomeTab() {
    const active =
      qs('.hmTabs button.on');

    const text = active?.dataset.news || textOf(active);


    return text;
  }


  /* ==========================================================
     LEGAL FOOTER
     ========================================================== */

  function ensureLegalFooter() {
    /*
     * 사용자가 하단의 반복 팬 프로젝트 고지를 숨기도록 요청했다.
     * 영문 비보증 고지와 상표 안내는 이 앱에 대하여 화면에
     * 그대로 남기고, 모든 경로에 반복되던 인라인/고정 표면만 제거한다.
     */
    qsa('#view .disc')
      .forEach(element => {
        element.classList.add(
          'finalOriginalDiscHidden'
        );
        element.hidden = true;
        element.setAttribute(
          'aria-hidden',
          'true'
        );
      });

    const footer =
      qs('#floatingLegalFooter');

    if (footer) {
      footer.remove();
    }

    document.body.classList.remove(
      'finalHasLegalFooter'
    );

    document.documentElement.style.setProperty(
      '--final-footer-height',
      '0px'
    );
  }

  function removeClassicSourcePrompts() {
    qsa('#view .clsPage .classicSources')
      .forEach(element => element.remove());

    qsa('#view .clsPage .hint2')
      .filter(element => textOf(element).includes(
        '클래식 자료의 출처는 아래 공식 데이터 링크에서 확인할 수 있습니다.'
      ))
      .forEach(element => element.remove());
  }


  /* ==========================================================
     DRAWER
     ========================================================== */

  /* ==========================================================
     HOME BASIC CLEANUP
     ========================================================== */

  function enforceHomeBasics() {
    const hm =
      qs('#view > .hm');

    if (!hm) return;

    /*
     * 용어 사전과 설정은 서랍/직접 경로에는 남기고
     * 홈의 여섯 개 주요 바로가기에서는 제외한다.
     */
    qsa(
      '.hmBtn[data-go]',
      hm
    ).forEach(button => {
      if (
        HIDDEN_HOME_ROUTES.has(
          button.dataset.go
        )
      ) {
        button.remove();
      }
    });

    /* 자유게시판을 여섯 번째이자 마지막 quick button으로 유지한다. */
    const quick =
      qs('.hmQuick', hm);

    const board =
      qs(
        '.hmBtn[data-go="board"]',
        hm
      );

    if (
      quick &&
      board &&
      board.parentElement !== quick
    ) {
      quick.appendChild(board);
    }

    /* The approved six quick buttons stay reachable in the home grid. */


    /*
     * 오프라인 역사 아카이브...
     * 전 탭에서 완전 제거
     */
    qsa(
      '.hmAd',
      hm
    ).forEach(
      element => element.remove()
    );
  }


  /* ==========================================================
     HOME 7 ROWS
     ========================================================== */

  function makeEmptyRow() {
    const li =
      document.createElement('li');

    li.className =
      'hmFeedEmpty finalEmptyHomeRow';

    li.setAttribute(
      'aria-hidden',
      'true'
    );

    return li;
  }


  function normalizeSevenRows() {
    const feed =
      qs('#view .hm > .hmNews');

    if (!feed) return;

    const tab =
      activeHomeTab();

    if (
      tab !== '새소식' &&
      tab !== '커뮤니티'
    ) {
      return;
    }

    feed.dataset.finalTab =
      tab;

    let rows =
      Array.from(feed.children)
        .filter(
          element =>
            element.tagName === 'LI'
        );

    /*
     * 반드시 7개까지만
     */
    if (rows.length > 7) {
      rows
        .slice(7)
        .forEach(
          element => element.remove()
        );
    }

    rows =
      Array.from(feed.children)
        .filter(
          element =>
            element.tagName === 'LI'
        );

    /*
     * 부족하면 흰색 빈 row 추가
     */
    while (rows.length < 7) {
      const empty =
        makeEmptyRow();

      feed.appendChild(
        empty
      );

      rows.push(
        empty
      );
    }

    rows.forEach(
      (row, index) => {
        const title =
          qs('b', row);

        const titleText =
          textOf(title);

        const hasContent =
          titleText.length > 0;

        if (!hasContent) {
          row.classList.add(
            'finalEmptyHomeRow'
          );

          row.classList.remove(
            'finalHomeOperatorRow',
            'finalHomeUserRow'
          );

          return;
        }

        row.classList.remove(
          'finalEmptyHomeRow'
        );

        const marker = qs('.hmFeedDot', row);
        const user = row.classList.contains('hmCommunityUser')
          || !!marker?.classList.contains('hmFeedDotUser');
        const notice = !user && (row.classList.contains('hmPatchNotice')
          || row.classList.contains('hmCommunityNotice')
          || !!marker?.classList.contains('hmFeedDotNotice'));
        row.classList.toggle('finalHomeOperatorRow', notice);
        row.classList.toggle('finalHomeUserRow', user);

        let dot =
          qs('.hmFeedDot', row);

        if (!dot) {
          const button =
            qs('button', row);

          if (button) {
            dot =
              document.createElement(
                'span'
              );

            dot.className =
              'hmFeedDot';

            dot.setAttribute(
              'aria-hidden',
              'true'
            );

            button.prepend(
              dot
            );
          }
        }
      }
    );
  }


  /* ==========================================================
     HOME VIEWPORT / FEATURE POSITION
     ========================================================== */

  function configureHomeViewport() {
    const view = qs('#view');
    const hm = qs('#view > .hm');

    if (!view || !hm) {
      document.body.classList.remove(
        'finalHomeNoScroll'
      );

      document.documentElement.classList.remove(
        'finalHomeNoScroll'
      );

      if (view) {
        view.style.removeProperty('height');
        view.style.removeProperty('max-height');
        view.style.removeProperty('min-height');
      }

      return;
    }

    document.body.classList.add(
      'finalHomeNoScroll'
    );

    document.documentElement.classList.add(
      'finalHomeNoScroll'
    );

    /*
     * 중요:
     * 홈 높이는 CSS layout이 전담한다.
     * 여기서는 절대로 px 높이를 계산하지 않는다.
     */
    view.style.removeProperty('height');
    view.style.removeProperty('max-height');
    view.style.removeProperty('min-height');

    /*
     * 예전 JS 계산값도 제거.
     * 새 CSS의 clamp()가 feature 높이를 결정한다.
     */
    document.documentElement.style.removeProperty(
      '--final-feature-height'
    );
  }


  /* ==========================================================
     VIDEO DATA
     ========================================================== */

  /*
   * 중요:
   *
   * lolVideoItems가 top-level let/const라면
   * window.lolVideoItems로는 안 잡힐 수 있다.
   *
   * 그래서 lexical global 이름을 직접 확인한다.
   *
   * 이전 "영상을 찾을 수 없습니다"의 가장 중요한
   * 보정 포인트.
   */
  function currentVideoItems() {
    try {
      if (
        typeof lolVideoItems !==
          'undefined' &&
        Array.isArray(
          lolVideoItems
        )
      ) {
        return lolVideoItems;
      }
    }
    catch (_) {}

    if (
      Array.isArray(
        window.lolVideoItems
      )
    ) {
      return window.lolVideoItems;
    }

    return [];
  }


  function videoListHasSettled() {
    return typeof lolVideoLoading !== 'undefined' && !lolVideoLoading
      && ((typeof lolVideoLoaded !== 'undefined' && lolVideoLoaded)
        || (typeof lolVideoError !== 'undefined' && Boolean(lolVideoError)));
  }

  function requestVideoData() {
    if (
      currentVideoItems().length > 0 || videoListHasSettled()
    ) {
      return Promise.resolve();
    }

    if (
      window.__finalVideoLoadPending
    ) {
      return window.__finalVideoLoadPending;
    }

    try {
      if (
        typeof loadLolVideos !==
        'function'
      ) {
        return;
      }

      const result =
        loadLolVideos();

      window.__finalVideoLoadPending = Promise.resolve(result)
        .catch(() => {})
        .finally(() => {
          window.__finalVideoLoadPending =
            false;

          setTimeout(
            schedule,
            0
          );
        });
      return window.__finalVideoLoadPending;
    }
    catch (_) {
      window.__finalVideoLoadPending =
        false;
    }
  }


  function extractYoutubeId(raw) {
    const value =
      String(raw || '').trim();

    if (!value) {
      return '';
    }

    if (
      /^[A-Za-z0-9_-]{11}$/.test(
        value
      )
    ) {
      return value;
    }

    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    ];

    for (
      const pattern of patterns
    ) {
      const match =
        value.match(pattern);

      if (
        match &&
        match[1]
      ) {
        return match[1];
      }
    }

    return '';
  }


  function normalizeVideoItem(item) {
    if (!item) return null;

    const youtubeId =
      extractYoutubeId(
        item.youtubeId
      ) ||
      extractYoutubeId(
        item.youtubeUrl
      ) ||
      extractYoutubeId(
        item.youtube_url
      ) ||
      extractYoutubeId(
        item.externalUrl
      ) ||
      extractYoutubeId(
        item.url
      ) ||
      extractYoutubeId(
        item.link
      ) ||
      extractYoutubeId(
        item.videoUrl
      ) ||
      extractYoutubeId(
        item.watchUrl
      ) ||
      extractYoutubeId(
        item.watch_url
      );

    const mediaUrl =
      String(
        item.mediaUrl ||
        item.fileUrl ||
        item.src ||
        ''
      ).trim();

    const thumbnail =
      String(
        item.thumbnailUrl ||
        item.thumbnail ||
        item.thumbUrl ||
        item.posterUrl ||
        item.poster ||
        ''
      ).trim();

    if (!youtubeId && !mediaUrl) return null;

    return {
      original: item,
      id: String(
        item.id || youtubeId || mediaUrl
      ),
      title: window.ClassicVideoPlayback.title(item).label,
      youtubeId,
      mediaUrl,
      thumbnail,
    };
  }


  let videoPreloadStarted = false;
  const primedVideoImages = new Map();
  function videoPreviewKey(item) {
    return JSON.stringify([item.id, item.youtubeId, safeHttps(item.mediaUrl), safeHttps(item.thumbnail)]);
  }

  function prepareVideoPreview(item) {
    const key = videoPreviewKey(item);
    if (primedVideoImages.has(key)) return primedVideoImages.get(key);
    const entry = {key, status: 'loading', visual: null, ready: null};
    primedVideoImages.set(key, entry);
    entry.ready = new Promise(resolve => {
      const finish = visual => {
        if (entry.status !== 'loading') return;
        entry.visual = visual;
        entry.status = visual ? 'ready' : 'error';
        if (visual) {
          visual.dataset.thumbnailLoaded = 'true';
          visual.dataset.videoPreviewKey = key;
        }
        resolve(Boolean(visual));
        schedule();
      };
      const base = item.youtubeId ? 'https://i.ytimg.com/vi/' + encodeURIComponent(item.youtubeId) + '/' : '';
      const candidates = [safeHttps(item.thumbnail), ... (base
        ? [base + 'mqdefault.jpg', base + 'hqdefault.jpg', base + 'maxresdefault.jpg'] : [])]
        .filter((src, index, all) => src && all.indexOf(src) === index);
      const tryImage = index => {
        if (index >= candidates.length) {
          const media = safeHttps(item.mediaUrl);
          if (!item.youtubeId && media) {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.addEventListener('loadeddata', () => finish(video), {once: true});
            video.addEventListener('error', () => finish(null), {once: true});
            video.src = media;
          } else finish(null);
          return;
        }
        const image = new Image();
        image.alt = `${item.title} 썸네일`;
        image.loading = 'eager';
        image.fetchPriority = 'high';
        image.decoding = 'sync';
        image.addEventListener('error', () => tryImage(index + 1), {once: true});
        image.addEventListener('load', async () => {
          try {
            await image.decode();
            if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty thumbnail');
            finish(image);
          } catch (_) { tryImage(index + 1); }
        }, {once: true});
        image.src = candidates[index];
      };
      tryImage(0);
    });
    return entry;
  }

  function primeVideoPreview() {
    if (!videoPreloadStarted) {
      videoPreloadStarted = true;
      requestVideoData();
    }
    const first = firstVideoItem();
    if (first) prepareVideoPreview(first);
    if (pendingVideoTab && isHome() && activeHomeTab() === pendingVideoTab.tab) {
      qs('#view [data-news="영상"]')?.setAttribute('aria-busy', 'true');
    }
  }

  // Keep the current feed until the selected video's real image has decoded.
  // A later navigation cancels the pending transition, not the useful preload.
  let pendingVideoTab = null;
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-news]');
    if (!button || button.dataset.news !== '영상' || !isHome()) {
      if (pendingVideoTab) pendingVideoTab.button.removeAttribute('aria-busy');
      qs('#view [data-news="영상"]')?.removeAttribute('aria-busy');
      pendingVideoTab = null;
      return;
    }
    const current = firstVideoItem();
    if ((current && prepareVideoPreview(current).status === 'ready') || (!current && videoListHasSettled())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pendingVideoTab?.button === button) return;
    const pending = {button, tab: activeHomeTab()};
    pendingVideoTab = pending;
    button.setAttribute('aria-busy', 'true');
    if (typeof toast === 'function') toast('영상 썸네일을 불러오는 중…');
    await requestVideoData();
    const item = firstVideoItem();
    if (item && prepareVideoPreview(item).status === 'error') primedVideoImages.delete(videoPreviewKey(item));
    const ready = item ? await prepareVideoPreview(item).ready : videoListHasSettled();
    if (pendingVideoTab !== pending) return;
    pendingVideoTab = null;
    button.removeAttribute('aria-busy');
    const currentButton = qs('#view [data-news="영상"]');
    currentButton?.removeAttribute('aria-busy');
    if (!currentButton || !isHome() || activeHomeTab() !== pending.tab) return;
    const first = firstVideoItem();
    if (ready && ((!item && !first) || (first && item && videoPreviewKey(first) === videoPreviewKey(item)))) currentButton.click();
    else if (typeof toast === 'function') toast('영상 썸네일을 불러오지 못했습니다. 다시 눌러 주세요.');
  }, true);

  function firstVideoItem() {
    const items =
      currentVideoItems()
        .map(normalizeVideoItem)
        .filter(Boolean);

    return items[0] || null;
  }


  function findVideoItem(id) {
    const wanted =
      String(id || '');

    const items =
      currentVideoItems()
        .map(normalizeVideoItem)
        .filter(Boolean);

    if (wanted) {
      const found =
        items.find(item =>
          item.id === wanted ||
          item.youtubeId === wanted
        );

      if (found) {
        return found;
      }
    }

    return items[0] || null;
  }


  function safeHttps(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';

    try {
      const url =
        new URL(
          value,
          location.href
        );

      return url.protocol === 'https:'
        ? url.href
        : '';
    }
    catch (_) {
      return '';
    }
  }


  function detectLegacyVideoId(
    element
  ) {
    if (!element) return '';

    const card =
      element.closest(
        '.lolVideoCard'
      );

    const nodes = [
      element,
      element.closest(
        '.lolVideoPreview'
      ),
      card,
    ].filter(Boolean);

    if (card) {
      nodes.push(
        ...qsa(
          '[data-act],[data-arg],[data-id],[data-video-id]',
          card
        )
      );
    }

    for (const node of nodes) {
      const act =
        String(
          node.getAttribute?.(
            'data-act'
          ) || ''
        );

      if (
        act.startsWith(
          'videoPlay:'
        )
      ) {
        return act.slice(
          'videoPlay:'.length
        );
      }

      const arg =
        String(
          node.dataset?.arg || ''
        );

      if (arg) return arg;

      const id =
        String(
          node.dataset?.id || ''
        );

      if (id) return id;

      const dataVideo =
        String(
          node.getAttribute?.(
            'data-video-id'
          ) || ''
        );

      if (dataVideo) {
        return dataVideo;
      }
    }

    return '';
  }


  /* ==========================================================
     VIDEO STAGE
     ========================================================== */

  function buildPlayIcon() {
    const icon =
      document.createElement('span');

    icon.className =
      'finalVideoPlayIcon';

    icon.setAttribute(
      'aria-hidden',
      'true'
    );

    return icon;
  }


  function buildYoutubeThumbnail(item) {
    const visual = prepareVideoPreview(item).visual;
    if (visual) visual.className = 'finalYoutubeThumbnail';
    return visual;
  }

  function fitVideoStage(feed) {
    if (!feed || !feed.isConnected) return;

    const stage = qs(
      '.finalVideoPreview, .finalVideoPlayer',
      feed
    );

    if (!stage) return;

    if (stage.classList.contains('finalVideoPlayer')) {
      // Playback keeps readable official controls; the feed can scroll below it.
      const playerWidth = Math.max(200, feed.clientWidth - 8);
      stage.style.setProperty('width', `${playerWidth}px`, 'important');
      stage.style.setProperty('height', `${Math.max(200, Math.ceil(playerWidth * 9 / 16))}px`, 'important');
      stage.style.setProperty('flex-shrink', '0', 'important');
      return;
    }

    // The thumbnail preview uses an uncropped 16:9 viewport.
    const availableWidth = Math.max(0, feed.clientWidth - 8);
    const availableHeight = Math.max(0, feed.clientHeight - 8);
    if (!availableWidth || !availableHeight) return;

    const width = Math.max(
      1,
      Math.floor(Math.min(availableWidth, availableHeight * (16 / 9)))
    );
    const height = Math.max(1, Math.floor(width * (9 / 16)));

    stage.style.setProperty('width', `${width}px`, 'important');
    stage.style.setProperty('height', `${height}px`, 'important');
    stage.style.setProperty('min-height', '0', 'important');
    stage.style.setProperty('max-height', '100%', 'important');
    stage.dataset.finalAspectRatio = '16:9';
  }


  function buildFileThumbnail(item) {
    const visual = prepareVideoPreview(item).visual;
    if (visual) {
      visual.className = visual.tagName === 'VIDEO' ? 'finalVideoPosterFrame' : 'finalYoutubeThumbnail';
      if (visual.tagName === 'VIDEO') {
        visual.pause();
        visual.controls = false;
        visual.autoplay = false;
        visual.muted = true;
      }
    }
    return visual;
  }

  function renderVideoStage() {
    if (
      !isHome() ||
      activeHomeTab() !== '영상'
    ) {
      return;
    }

    const feed =
      qs('#view .hm > .hmNews');

    if (!feed) return;

    feed.classList.add(
      'finalVideoMode'
    );

    /*
     * 이미 재생 중이면 render로 덮지 않는다.
     */
    if (
      feed.dataset.finalVideoPlaying ===
      '1'
    ) {
      return;
    }

    const item =
      firstVideoItem();

    if (!item) {
      requestVideoData();
      return;
    }

    const entry = prepareVideoPreview(item);
    if (entry.status !== 'ready') {
      if (feed.dataset.videoPreviewState === entry.status && qs('.finalVideoStatus', feed)) return;
      feed.dataset.videoPreviewState = entry.status;
      const status = document.createElement('li');
      status.className = 'finalVideoStatus';
      status.setAttribute('role', 'status');
      status.textContent = entry.status === 'error'
        ? '영상 썸네일을 불러오지 못했습니다.' : '영상 썸네일을 불러오는 중…';
      feed.replaceChildren(status);
      return;
    }
    if (
      feed.dataset.finalVideoKey === entry.key &&
      qs(
        '.finalVideoStageItem',
        feed
      )
    ) {
      fitVideoStage(feed);
      return;
    }

    feed.dataset.finalVideoId =
      item.id;
    feed.dataset.finalVideoKey = entry.key;
    feed.dataset.videoPreviewState = 'ready';

    const li =
      document.createElement('li');

    li.className =
      'finalVideoStageItem';

    const button =
      document.createElement('button');

    button.type =
      'button';

    button.className =
      'finalVideoPreview';

    button.setAttribute(
      'aria-label',
      '영상 재생'
    );

    let visual = null;

    if (item.youtubeId) {
      visual =
        buildYoutubeThumbnail(
          item
        );
    }
    else {
      visual =
        buildFileThumbnail(
          item
        );
    }

    if (visual) {
      button.appendChild(
        visual
      );
    }

    button.appendChild(
      buildPlayIcon()
    );

    button.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();

        playVideoItem(
          item
        );
      }
    );

    li.appendChild(
      button
    );

    feed.replaceChildren(
      li
    );

    requestAnimationFrame(() => fitVideoStage(feed));
  }


  function playVideoItem(item) {
    const feed =
      qs('#view .hm > .hmNews');

    if (!feed || !item) {
      requestVideoData();
      return;
    }

    const entry = prepareVideoPreview(item);
    if (entry.status !== 'ready') {
      entry.ready.then(ready => {
        if (ready && feed.isConnected && isHome() && activeHomeTab() === '영상'
            && firstVideoItem() && videoPreviewKey(firstVideoItem()) === entry.key) playVideoItem(item);
      });
      return;
    }
    const li =
      document.createElement('li');

    li.className =
      'finalVideoStageItem finalVideoPlaying';

    const player =
      document.createElement('div');

    player.className =
      'finalVideoPlayer';

    // Move the decoded image itself; a newly created image can paint empty first.
    const loadingPoster = entry.visual.tagName === 'IMG' ? entry.visual : null;
    if (loadingPoster) {
      loadingPoster.className = 'videoLoadingPoster';
      player.appendChild(loadingPoster);
    }

    if (item.youtubeId) {
      const iframe =
        document.createElement(
          'iframe'
        );

      iframe.src =
        'https://www.youtube-nocookie.com/embed/' +
        encodeURIComponent(
          item.youtubeId
        ) +
        '?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';

      iframe.title =
        item.title;
      // The decoded thumbnail precedes the player; it must never cover YouTube controls.
      loadingPoster?.remove();

      iframe.setAttribute(
        'allow',
        'autoplay; encrypted-media; picture-in-picture; fullscreen'
      );

      iframe.setAttribute(
        'allowfullscreen',
        ''
      );

      player.appendChild(
        iframe
      );
      window.ClassicVideoPlayback.mount(iframe, item, li);
    }
    else {
      const media =
        safeHttps(
          item.mediaUrl
        );

      if (!media) {
        requestVideoData();
        return;
      }

      const video = entry.visual.tagName === 'VIDEO' ? entry.visual : document.createElement('video');
      if (video.src !== media) video.src = media;
      video.className = 'finalVideoPosterFrame';
      video.muted = false;

      video.controls =
        true;

      video.autoplay =
        true;

      video.playsInline =
        true;

      video.preload =
        'auto';
      if (loadingPoster) video.poster = loadingPoster.currentSrc || loadingPoster.src;
      video.addEventListener('loadeddata', () => loadingPoster?.remove(), { once: true });

      player.appendChild(
        video
      );

      requestAnimationFrame(() => {
        const promise =
          video.play();

        if (
          promise &&
          typeof promise.catch ===
            'function'
        ) {
          promise.catch(() => {});
        }
      });
    }

    li.appendChild(
      player
    );

    feed.dataset.finalVideoPlaying =
      '1';

    feed.replaceChildren(
      li
    );

    requestAnimationFrame(() => fitVideoStage(feed));
  }


  /*
   * 구 lolVideoPreview를 사용자가
   * 아주 빠르게 누른 경우에도
   * 기존 "영상을 찾을 수 없습니다" 로직으로
   * 넘어가지 않게 capture 단계에서 차단.
   */
  function installLegacyVideoInterceptor() {
    if (
      window.__finalVideoInterceptorInstalled
    ) {
      return;
    }

    window.__finalVideoInterceptorInstalled =
      true;

    document.addEventListener(
      'click',
      event => {
        if (
          !isHome() ||
          activeHomeTab() !== '영상'
        ) {
          return;
        }

        const target =
          event.target.closest(
            '.lolVideoPreview,' +
            '.lolVideoPlayBadge,' +
            '[data-act^="videoPlay:"]'
          );

        if (!target) {
          return;
        }

        const feed =
          qs('#view .hm > .hmNews');

        if (
          !feed ||
          !feed.contains(target)
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (
          typeof event
            .stopImmediatePropagation ===
          'function'
        ) {
          event.stopImmediatePropagation();
        }

        const id =
          detectLegacyVideoId(
            target
          );

        const item =
          findVideoItem(id);

        if (item) {
          playVideoItem(item);
        }
        else {
          requestVideoData();

          setTimeout(
            () => {
              const loaded =
                findVideoItem(id);

              if (loaded) {
                playVideoItem(
                  loaded
                );
              }
            },
            500
          );
        }
      },
      true
    );
  }


  /*
   * 기존 함수가 직접 호출되는 경우도 보정.
   */
  function overrideLegacyPlayFunction() {
    try {
      if (
        typeof openLolVideoPlayer ===
        'function'
      ) {
        openLolVideoPlayer =
          function finalInlineVideoPlayer(
            id
          ) {
            const item =
              findVideoItem(id);

            if (item) {
              playVideoItem(item);
              return;
            }

            requestVideoData();

            setTimeout(
              () => {
                const loaded =
                  findVideoItem(id);

                if (loaded) {
                  playVideoItem(
                    loaded
                  );
                }
              },
              500
            );
          };
      }
    }
    catch (_) {}
  }


  /* ==========================================================
     BOARD DETAIL
     ========================================================== */

  function patchBoardDetail() {
    const board =
      qs('#view .onlineBoard');

    if (!board) return;

    const rows =
      qsa(
        '.bdBody .frow',
        board
      );

    rows.forEach(row => {
      const label =
        qs('.fl', row);

      const value =
        qs('.fv', row);

      if (!label || !value) {
        return;
      }

      const labelText =
        textOf(label);

      /*
       * 아이디: -> 닉네임:
       */
      if (
        /^아이디\s*:/.test(
          labelText
        )
      ) {
        if (
          label.textContent !==
          '닉네임:'
        ) {
          label.textContent =
            '닉네임:';
        }

        row.classList.add(
          'finalNicknameRow'
        );
      }

      /*
       * 제 목 : -> 제목:
       */
      if (
        /^제\s*목\s*:/.test(
          labelText
        ) ||
        /^제목\s*:/.test(
          labelText
        )
      ) {
        if (
          label.textContent !==
          '제목:'
        ) {
          label.textContent =
            '제목:';
        }

        row.classList.add(
          'finalTitleRow'
        );

        /*
         * [공지] 앞에 빨간 원
         */
        if (
          textOf(value).includes(
            '[공지]'
          ) &&
          !qs(
            '.finalDetailNoticeDot',
            value
          )
        ) {
          const dot =
            document.createElement(
              'span'
            );

          dot.className =
            'finalDetailNoticeDot';

          dot.setAttribute(
            'aria-hidden',
            'true'
          );

          value.prepend(
            dot
          );
        }
      }
    });


    /*
     * 이전글은 왼쪽,
     * 다음글은 오른쪽.
     *
     * 기존 pg.prev / pg.next의 arrow icon은
     * 원래 CSS를 그대로 이용.
     */
    const move =
      qs('.bdMove', board);

    if (move) {
      const prevButton =
        qs('.pg.prev', move);

      const nextButton =
        qs('.pg.next', move);

      const prev =
        prevButton?.closest(
          '.mv'
        );

      const next =
        nextButton?.closest(
          '.mv'
        );

      if (
        prev &&
        next &&
        move.firstElementChild !== prev
      ) {
        move.insertBefore(
          prev,
          next
        );
      }

      if (prev) {
        prev.classList.remove(
          'r'
        );

        const em =
          qs('em', prev);

        if (
          em &&
          textOf(em) !== ui('이전글')
        ) {
          em.textContent =
            ui('이전글');
        }
      }

      if (next) {
        next.classList.add(
          'r'
        );

        const em =
          qs('em', next);

        if (
          em &&
          textOf(em) !== ui('다음글')
        ) {
          em.textContent =
            ui('다음글');
        }
      }
    }
  }


  /* ==========================================================
     BOARD LIST
     ========================================================== */

  function patchBoardList() {
    if (!isBoardList()) {
      return;
    }

    /*
     * 과거 override가 별도 원을 추가했다면
     * DOM을 계속 삭제/재생성하면서 observer가
     * 싸우지 않도록 CSS로 숨긴다.
     *
     * 원본 .bic 자체를 둥글게 만드는 방식 사용.
     */
    qsa(
      '.brow',
      qs('#view')
    ).forEach(row => {
      row.classList.add(
        'finalBoardRow'
      );
    });
  }


  /* ==========================================================
     STYLES
     ========================================================== */

  function installStyles() {
    const old =
      qs('#final-ui-hotfix-style');

    if (old) {
      return;
    }

    const style =
      document.createElement('style');

    style.id =
      'final-ui-hotfix-style';

    style.textContent = `
      :root {
        --final-feature-height: 150px;
        --final-footer-height: 0px;
      }


      /* ======================================================
         GLOBAL LEGAL FOOTER
         ====================================================== */

      .finalOriginalDiscHidden {
        display: none !important;
      }

      #floatingLegalFooter {
        position: fixed !important;

        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;

        z-index: 99999 !important;

        display: none !important;

        background:
          linear-gradient(
            180deg,
            #10192a,
            #07101f
          ) !important;

        border-top:
          1px solid #1d2942 !important;

        box-shadow:
          0 -1px 0 rgba(0,0,0,.3) !important;
      }

      #floatingLegalFooter
      .finalLegalInner {
        box-sizing: border-box !important;

        display: flex !important;

        align-items: center !important;
        justify-content: space-between !important;

        gap: 10px !important;

        width: 100% !important;

        min-height: 50px !important;

        padding:
          6px 16px !important;
      }

      #floatingLegalFooter
      .finalLegalText {
        flex: 1 1 auto !important;

        min-width: 0 !important;

        color: #b8bec8 !important;

        font-size: 10px !important;
        line-height: 14px !important;
      }

      #floatingLegalFooter
      .finalLegalButton {
        box-sizing: border-box !important;

        flex: 0 0 auto !important;

        min-width: 58px !important;
        min-height: 30px !important;

        margin: 0 !important;
        padding: 2px 9px !important;

        white-space: nowrap !important;

        color: #d8c675 !important;

        background:
          transparent !important;

        border:
          1px solid #7f7441 !important;

        font-size: 10px !important;
        line-height: 20px !important;
      }

      body.finalHasLegalFooter:not(.finalHomeNoScroll)
      #view {
        padding-bottom:
          calc(
            var(--final-footer-height)
            + 8px
          ) !important;
      }


      /* ======================================================
         HOME NO-SCROLL
         ====================================================== */

      html.finalHomeNoScroll,
      body.finalHomeNoScroll {
        overflow: hidden !important;

        overscroll-behavior:
          none !important;
      }

      body.finalHomeNoScroll
      #view {
        box-sizing: border-box !important;

        display: flex !important;
        flex-direction: column !important;

        min-height: 0 !important;

        padding-bottom:
          0 !important;

        overflow:
          hidden !important;
      }

      body.finalHomeNoScroll
      #view > .hm {
        box-sizing: border-box !important;

        display: flex !important;
        flex-direction: column !important;

        flex: 1 1 auto !important;

        width: 100% !important;
        height: 100% !important;

        min-height: 0 !important;

        padding-bottom:
          0 !important;

        overflow:
          hidden !important;
      }

      /*
       * top sections = 고정
       */
      body.finalHomeNoScroll
      .hm > .hmStrip,

      body.finalHomeNoScroll
      .hm > .hmSearch,

      body.finalHomeNoScroll
      .hm > .hmLogo,

      body.finalHomeNoScroll
      .hm > .hmRot,

      body.finalHomeNoScroll
      .hm > .hmTabs {
        flex:
          0 0 auto !important;
      }


      /* ======================================================
         TABS
         ====================================================== */

      .hm > .hmTabs {
        display: grid !important;

        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          ) !important;

        width: 100% !important;

        height: 39px !important;
        min-height: 39px !important;

        margin-top:
          4px !important;

        border:
          1px solid #b8b8b8 !important;

        border-bottom:
          0 !important;
      }

      .hm > .hmTabs button {
        height: 38px !important;

        color: #666 !important;

        background:
          #ededed !important;

        border:
          0 !important;

        border-right:
          1px solid #c4c4c4 !important;

        font-size:
          13px !important;

        line-height:
          36px !important;

        font-weight:
          700 !important;
      }

      .hm > .hmTabs button.on {
        color: #111 !important;

        background:
          #fff !important;

        border-bottom:
          3px solid #777 !important;
      }


      /* ======================================================
         HOME FEED = REMAINING HEIGHT
         ====================================================== */

      .hm > .hmNews {
        box-sizing: border-box !important;

        flex:
          1 1 0 !important;

        width: 100% !important;

        height: auto !important;

        min-height:
          118px !important;

        max-height:
          none !important;

        margin:
          0 !important;

        padding:
          0 !important;

        overflow:
          hidden !important;

        background:
          #fff !important;

        border:
          1px solid #b8b8b8 !important;
      }


      /* ======================================================
         새소식 / 커뮤니티 = 반드시 7줄
         ====================================================== */

      .hm > .hmNews:not(.lolVideoMode) {
        display: grid !important;

        grid-template-rows:
          repeat(
            7,
            minmax(0,1fr)
          ) !important;
      }

      .hm > .hmNews:not(.lolVideoMode)
      > li {
        box-sizing:
          border-box !important;

        min-height:
          0 !important;

        background:
          #fff !important;

        border-bottom:
          1px solid #d4d4d4 !important;
      }

      .hm > .hmNews:not(.lolVideoMode)
      > li:last-child {
        border-bottom:
          0 !important;
      }

      .hm > .hmNews:not(.lolVideoMode)
      button {
        box-sizing:
          border-box !important;

        display:
          grid !important;

        grid-template-columns:
          24px
          minmax(0,1fr)
          auto !important;

        align-items:
          center !important;

        gap:
          7px !important;

        width:
          100% !important;

        height:
          100% !important;

        padding:
          2px 10px !important;

        color:
          #151515 !important;

        background:
          #fff !important;

        border:
          0 !important;

        text-align:
          left !important;
      }

      .hm > .hmNews:not(.lolVideoMode)
      b {
        min-width:
          0 !important;

        overflow:
          hidden !important;

        color:
          #151515 !important;

        font-size:
          11.5px !important;

        line-height:
          15px !important;

        text-overflow:
          ellipsis !important;

        white-space:
          nowrap !important;
      }

      .hm > .hmNews:not(.lolVideoMode)
      small {
        color:
          #777 !important;

        font-size:
          9.5px !important;

        line-height:
          12px !important;
      }

      .hmFeedDot {
        box-sizing:
          border-box !important;

        display:
          block !important;

        width:
          13px !important;

        height:
          13px !important;

        justify-self:
          center !important;

        border-radius:
          50% !important;

        box-shadow:
          none !important;
      }

      /*
       * 실제 상단 운영자/공지 row
       */
      .finalHomeOperatorRow
      .hmFeedDot {
        opacity:
          1 !important;

        background:
          #df4b50 !important;

        border:
          1px solid #b72e34 !important;
      }

      /*
       * 실제 하단 사용자 row
       */
      .finalHomeUserRow
      .hmFeedDot {
        opacity:
          1 !important;

        background:
          #407bd9 !important;

        border:
          1px solid #285cae !important;
      }

      /*
       * 비어있는 글은:
       * - 흰색
       * - dot 없음
       * - 텍스트 없음
       */
      .finalEmptyHomeRow,
      .finalEmptyHomeRow button,

      .hmFeedEmpty,
      .hmFeedEmpty button {
        background:
          #fff !important;
      }

      .finalEmptyHomeRow
      .hmFeedDot,

      .hmFeedEmpty
      .hmFeedDot {
        opacity:
          0 !important;

        visibility:
          hidden !important;

        background:
          transparent !important;

        border:
          0 !important;
      }


      /* ======================================================
         VIDEO
         ====================================================== */

      .hm > .hmNews.finalVideoMode {
        display:
          block !important;

        position:
          relative !important;

        background:
          #0a0a0a !important;
      }

      /*
       * 구 영상 내부 title / 시간 여행 제거
       */
      .hm > .hmNews.finalVideoMode
      .lolVideoIntro,

      .hm > .hmNews.finalVideoMode
      .lolVideoCard > h3,

      .hm > .hmNews.finalVideoMode
      .lolVideoCard > p,

      .hm > .hmNews.finalVideoMode
      .lolVideoMeta,

      .hm > .hmNews.finalVideoMode
      .lolVideoTitle {
        display:
          none !important;
      }

      .finalVideoStageItem {
        box-sizing:
          border-box !important;

        display:
          block !important;

        width:
          100% !important;

        height:
          100% !important;

        margin:
          0 !important;

        padding:
          0 !important;

        list-style:
          none !important;

        background:
          #111 !important;

        border:
          0 !important;
      }

      .finalVideoPreview {
        box-sizing:
          border-box !important;

        position:
          relative !important;

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          center !important;

        width:
          100% !important;

        height:
          100% !important;

        margin:
          0 !important;

        padding:
          0 !important;

        overflow:
          hidden !important;

        background:
          #000 !important;

        border:
          1px solid #777 !important;
      }

      /*
       * 영상 thumbnail이 16:9 무대를 여백 없이 채우도록 cover.
       * 실제 재생 영상/iframe의 화면비 규칙과는 분리한다.
       */
      .finalYoutubeThumbnail,
      .finalVideoPosterFrame {
        position:
          absolute !important;

        inset:
          0 !important;

        width:
          100% !important;

        height:
          100% !important;

        z-index:
          1 !important;

        display:
          block !important;

        object-fit:
          cover !important;

        visibility:
          visible !important;

        opacity:
          1 !important;

        background:
          #000 !important;

        pointer-events:
          none !important;
      }

      /*
       * 글자 "재생" 대신
       * 중앙 재생 아이콘만.
       */
      .finalVideoPlayIcon {
        position:
          absolute !important;

        left:
          50% !important;

        top:
          50% !important;

        z-index:
          2 !important;

        width:
          62px !important;

        height:
          62px !important;

        transform:
          translate(-50%,-50%) !important;

        border-radius:
          50% !important;

        background:
          rgba(0,0,0,.58) !important;

        border:
          2px solid rgba(255,255,255,.9) !important;

        box-shadow:
          0 2px 12px rgba(0,0,0,.45) !important;
      }

      .finalVideoPlayIcon::after {
        content:
          '' !important;

        position:
          absolute !important;

        left:
          24px !important;

        top:
          17px !important;

        width:
          0 !important;

        height:
          0 !important;

        border-top:
          13px solid transparent !important;

        border-bottom:
          13px solid transparent !important;

        border-left:
          20px solid #fff !important;
      }

      .finalVideoPlayer {
        box-sizing:
          border-box !important;

        display:
          block !important;

        width:
          100% !important;

        height:
          100% !important;

        overflow:
          hidden !important;

        background:
          #000 !important;

        border:
          1px solid #777 !important;
      }

      .finalVideoPlayer iframe,
      .finalVideoPlayer video {
        display:
          block !important;

        width:
          100% !important;

        height:
          100% !important;

        margin:
          0 !important;

        padding:
          0 !important;

        border:
          0 !important;

        background:
          #000 !important;

        object-fit:
          contain !important;
      }


      /* ======================================================
         FEATURE = SAME POSITION ON ALL TABS
         ====================================================== */

      .hm > .hmFeature {
        box-sizing:
          border-box !important;

        display:
          grid !important;

        flex:
          0 0
          var(--final-feature-height) !important;

        width:
          100% !important;

        height:
          var(--final-feature-height) !important;

        min-height:
          var(--final-feature-height) !important;

        max-height:
          var(--final-feature-height) !important;

        margin:
          5px 0 0 !important;

        padding-bottom:
          0 !important;
      }

      /*
       * 모든 탭에서 poster / 6button 위치 동일.
       */
      .hm > .hmFeature
      > .hmPoster,

      .hm > .hmFeature
      > .hmQuick {
        height:
          100% !important;

        min-height:
          0 !important;

        max-height:
          none !important;
      }

      /*
       * 구 오프라인 역사 아카이브 제거
       */
      .hm > .hmAd {
        display:
          none !important;
      }


      /* ======================================================
         BOARD DETAIL
         ====================================================== */

      /*
       * 닉네임: 운영자
       * 제목: ● [공지] ...
       *
       * 기존 .fl width:55px 때문에 생기던
       * 과도한 간격 제거.
       */
      .onlineBoard
      .bdBody
      .frow {
        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          flex-start !important;

        gap:
          .28em !important;

        padding:
          0 8px !important;
      }

      .onlineBoard
      .bdBody
      .frow
      .fl {
        flex:
          0 0 auto !important;

        width:
          auto !important;

        min-width:
          0 !important;

        margin:
          0 !important;

        padding:
          0 !important;
      }

      .onlineBoard
      .bdBody
      .frow
      .fv {
        display:
          inline-flex !important;

        align-items:
          center !important;

        flex:
          0 1 auto !important;

        width:
          auto !important;

        min-width:
          0 !important;

        margin:
          0 !important;

        padding:
          0 !important;
      }

      /*
       * 이전 override에서 들어갔을 수 있는
       * 빨간 문자형 dot은 숨김.
       */
      .onlineBoard
      .noticeDotInjected {
        display:
          none !important;
      }

      /*
       * 실제 공지 red circle
       */
      .finalDetailNoticeDot {
        box-sizing:
          border-box !important;

        display:
          inline-block !important;

        flex:
          0 0 auto !important;

        width:
          11px !important;

        height:
          11px !important;

        margin-right:
          .28em !important;

        border-radius:
          50% !important;

        background:
          #df4b50 !important;

        border:
          1px solid #b72e34 !important;
      }

      /*
       * 신고하기:
       * 외곽선 button 형태 유지.
       */
      .onlineBoard
      .authorActions
      .reportBtn {
        box-sizing:
          border-box !important;

        min-width:
          68px !important;

        min-height:
          25px !important;

        padding:
          2px 6px !important;

        color:
          #333 !important;

        background:
          linear-gradient(
            #fff,
            #eee
          ) !important;

        border:
          1px solid #b3b3b3 !important;

        border-radius:
          2px !important;

        box-shadow:
          none !important;
      }

      /*
       * 신고하기와 cwarn 사이에서 보이던
       * 마름모 의사요소 완전 제거.
       */
      .onlineBoard
      .authorActions::before,

      .onlineBoard
      .authorActions::after,

      .onlineBoard
      .cwarn::before,

      .onlineBoard
      .cwarn::after {
        content:
          none !important;

        display:
          none !important;

        width:
          0 !important;

        height:
          0 !important;

        border:
          0 !important;
      }


      /* ======================================================
         BOARD LIST
         ====================================================== */

      /*
       * 원본 board icon은 .bic.
       *
       * 기존 빨강/파랑 네모를 삭제하고
       * 바로 그 요소를 원으로 만든다.
       */
      .brow .bic {
        box-sizing:
          border-box !important;

        display:
          block !important;

        width:
          11px !important;

        height:
          11px !important;

        flex:
          0 0 11px !important;

        border-radius:
          50% !important;

        background:
          #5d7bd6 !important;

        border:
          1px solid #3f5aa8 !important;
      }

      /*
       * 운영자/공지
       */
      .brow .bic.no {
        background:
          #e0473c !important;

        border-color:
          #a8281f !important;
      }

      /*
       * 이전 hotfix가 만든 중복 원은 숨김.
       * 따라서 화면에는 원이 정확히 1개만 남는다.
       */
      .brow .boardRoleDot {
        display:
          none !important;
      }
    `;

    document.head.appendChild(
      style
    );
  }


  /* ==========================================================
     FINAL ENFORCE
     ========================================================== */

  function enforce() {


    ensureLegalFooter();

    removeClassicSourcePrompts();

    configureHomeViewport();

    ensureChampionInterfaceControls();


    document.body.classList.add(
      'historicalApkReference'
    );

    const archiveLabel =
      qs('.hmStrip span');

    const archiveState =
      qs('.hmStrip b');

    if (archiveLabel) {
      archiveLabel.textContent =
        '클래식 기록실';
    }

    if (archiveState) {
      archiveState.textContent =
        '클래식 백과';
    }

    /*
     * Device-observed 218 interface adaptation.
     *
     * Keep the current records and routes intact while presenting the same
     * compact visual grammar as the installed historical app.  The rate bars
     * and spell-detail affordances are derived from already-rendered current
     * text; no historical data or binary UI artwork is introduced here.
     */
    qsa('.dossierRates .cvRate').forEach(rate => {
      const value = Number.parseInt(textOf(qs('b', rate)), 10);
      const bounded = Number.isFinite(value)
        ? Math.max(0, Math.min(10, value))
        : 0;

      rate.style.setProperty(
        '--historical-rate',
        `${bounded * 10}%`
      );
    });

    qsa('.spellRows .spellRow').forEach(row => {
      if (row.dataset.historicalDetailReady === 'true') return;

      const heading = textOf(qs('h4', row));
      const description = textOf(qs('p', row));
      const detail = [heading, description].filter(Boolean).join('\n\n');

      row.dataset.historicalDetailReady = 'true';
      row.dataset.modal = detail;
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', `${heading || '소환사 주문'} 상세 정보`);
      row.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        row.click();
      });
    });

    const masteryLead =
      qs('.masteryShell.masteryEditorial .archiveLead');

    if (masteryLead) {
      masteryLead.textContent =
        '클래식 공격·방어·보조 특성을 전환하고 원하는 조합을 편성할 수 있습니다.';
    }

    const masteryEyebrow =
      qs('.masteryShell.masteryEditorial .archiveSectionHeader small');

    if (masteryEyebrow) {
      masteryEyebrow.textContent =
        '클래식 특성';
    }

    const masteryGrid =
      qs('.masteryEditorialGrid');

    if (
      masteryGrid &&
      !masteryGrid.previousElementSibling?.classList.contains('historicalMasteryTabs')
    ) {
      const sections =
        qsa('.masteryEditorialSection', masteryGrid);

      const tabs =
        document.createElement('nav');

      tabs.className =
        'historicalMasteryTabs';

      tabs.setAttribute(
        'aria-label',
        '특성 분류'
      );

      sections.forEach((section, index) => {
        const branch =
          section.dataset.masteryBranch || String(index);

        const title =
          textOf(qs('h4', section)) || branch;

        const button =
          document.createElement('button');

        button.type = 'button';
        button.dataset.historicalMasteryTab = branch;
        button.textContent = title;

        button.addEventListener('click', () => {
          sections.forEach(candidate => {
            const selected =
              candidate.dataset.masteryBranch === branch;

            candidate.hidden =
              !selected;
          });

          qsa('button', tabs).forEach(candidate => {
            const selected =
              candidate === button;

            candidate.classList.toggle('on', selected);
            candidate.setAttribute('aria-selected', String(selected));
          });
        });

        tabs.appendChild(button);

        section.hidden =
          index !== 0;

        button.classList.toggle(
          'on',
          index === 0
        );

        button.setAttribute(
          'aria-selected',
          String(index === 0)
        );
      });

      masteryGrid.before(tabs);
    }

    if (isHome()) {
      primeVideoPreview();
      enforceHomeBasics();

      ensureDevice218HomeSurface();

      const tab =
        activeHomeTab();

      if (
        tab === '새소식' ||
        tab === '커뮤니티'
      ) {
        normalizeSevenRows();
      }

      if (tab === '영상') {
        renderVideoStage();
      }
    }

    patchBoardDetail();

    patchBoardList();
  }


  /* ==========================================================
     BOOT
     ========================================================== */

  installStyles();

  installLegacyVideoInterceptor();
  window.ClassicVideoPreview = Object.freeze({render: renderVideoStage, prime: primeVideoPreview});

  overrideLegacyPlayFunction();

  let queued = false;

  function schedule() {
    if (queued) return;

    queued = true;

    requestAnimationFrame(() => {
      queued = false;

      enforce();
    });
  }

  const observer =
    new MutationObserver(
      schedule
    );

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true,
    }
  );

  window.addEventListener(
    'load',
    schedule
  );

  window.addEventListener(
    'pageshow',
    schedule
  );

  window.addEventListener(
    'resize',
    schedule
  );

  window.addEventListener(
    'orientationchange',
    schedule
  );

  window.addEventListener(
    'hashchange',
    schedule
  );

  setTimeout(
    schedule,
    0
  );

  window.__LOL_FINAL_UI_HOTFIX__ =
    VERSION;
})();


/* FINAL_LAYOUT_REPAIR_2031_BEGIN */
(() => {
  'use strict';

  if (
    document.getElementById(
      'final-layout-repair-2031'
    )
  ) {
    return;
  }

  const style =
    document.createElement('style');

  style.id =
    'final-layout-repair-2031';

  style.textContent = `

    /*
     * ========================================================
     * 1. HOME 전체 세로 구조
     * ========================================================
     *
     * 홈에서만:
     *
     * BODY
     * ├─ APP       = 남는 전체 높이
     * └─ FOOTER    = 실제 높이
     *
     * APP
     * ├─ HEADER    = 45px
     * └─ VIEW      = 나머지
     *
     * VIEW/HOME
     * ├─ 상단 검색/챔피언 = auto
     * ├─ tabs              = auto
     * ├─ hmNews            = 남는 높이 전부
     * └─ hmFeature         = 고정 responsive 높이
     *
     * footer 높이를 JS로 계산하지 않으므로
     * tab 전환 시 snap/flicker가 발생하지 않는다.
     * ========================================================
     */

    html.finalHomeNoScroll {
      width: 100% !important;
      height: 100% !important;

      overflow:
        hidden !important;
    }


    body.finalHomeNoScroll.finalHasLegalFooter {
      box-sizing:
        border-box !important;

      display:
        grid !important;

      grid-template-columns:
        minmax(0,1fr) !important;

      grid-template-rows:
        minmax(0,1fr)
        auto !important;

      width:
        100% !important;

      height:
        100vh !important;

      min-height:
        0 !important;

      margin:
        0 !important;

      padding:
        0 !important;

      overflow:
        hidden !important;

      background:
        #08111a !important;
    }


    @supports (height: 100dvh) {
      body.finalHomeNoScroll.finalHasLegalFooter {
        height:
          100dvh !important;
      }
    }


    /*
     * ========================================================
     * 2. APP = footer 위 공간 정확히 전부 사용
     * ========================================================
     */

    body.finalHomeNoScroll.finalHasLegalFooter
    > .app {
      box-sizing:
        border-box !important;

      grid-row:
        1 !important;

      display:
        grid !important;

      grid-template-columns:
        minmax(0,1fr) !important;

      grid-template-rows:
        45px
        minmax(0,1fr) !important;

      align-self:
        stretch !important;

      width:
        100% !important;

      height:
        100% !important;

      min-height:
        0 !important;

      max-height:
        100% !important;

      margin:
        0 auto !important;

      padding:
        0 !important;

      overflow:
        hidden !important;

      background:
        #08111a !important;
    }


    body.finalHomeNoScroll
    .app > header {
      grid-row:
        1 !important;

      position:
        relative !important;

      top:
        auto !important;

      flex:
        none !important;

      width:
        100% !important;

      height:
        45px !important;
    }


    /*
     * ========================================================
     * 3. VIEW = header 밑부터 footer 직전까지
     * ========================================================
     */

    body.finalHomeNoScroll
    .app > #view {
      box-sizing:
        border-box !important;

      grid-row:
        2 !important;

      display:
        block !important;

      width:
        100% !important;

      height:
        100% !important;

      min-height:
        0 !important;

      max-height:
        100% !important;

      margin:
        0 !important;

      padding:
        0 !important;

      overflow:
        hidden !important;

      background:
        #eeeeee !important;
    }


    /*
     * ========================================================
     * 4. HOME = FLEX COLUMN
     *
     * Grid를 사용하지 않는다.
     * DOM 종류가 달라져도 implicit row가 생성되지 않는다.
     * ========================================================
     */

    body.finalHomeNoScroll
    #view > .hm {
      box-sizing:
        border-box !important;

      display:
        flex !important;

      flex-direction:
        column !important;

      align-items:
        stretch !important;

      justify-content:
        flex-start !important;

      width:
        100% !important;

      height:
        100% !important;

      min-height:
        0 !important;

      max-height:
        100% !important;

      margin:
        0 !important;

      padding:
        0 !important;

      overflow:
        hidden !important;

      background:
        #eeeeee !important;
    }


    /*
     * hmNews와 hmFeature를 제외한 모든 홈 직접 자식은
     * 자연 높이만 차지한다.
     *
     * 미래 DOM 요소가 생겨도 안전.
     */
    body.finalHomeNoScroll
    #view > .hm
    > :not(.hmNews):not(.hmFeature) {
      flex:
        0 0 auto !important;

      min-height:
        0 !important;
    }


    /*
     * ========================================================
     * 5. TAB CONTENT
     *
     * 새소식/영상/커뮤니티 모두
     * 반드시 똑같은 영역을 사용.
     * ========================================================
     */

    body.finalHomeNoScroll
    #view > .hm
    > .hmNews {
      box-sizing:
        border-box !important;

      flex:
        1 1 0% !important;

      width:
        100% !important;

      height:
        auto !important;

      min-height:
        0 !important;

      max-height:
        none !important;

      margin:
        0 !important;

      padding:
        0 !important;

      overflow:
        hidden !important;

      background:
        #ffffff !important;
    }


    /*
     * ========================================================
     * 6. FEATURE
     *
     * 소나 + 6버튼은
     * 모든 탭에서 항상 같은 크기 / 같은 위치.
     *
     * 짧은 스마트폰에서는 자동 축소.
     * ========================================================
     */

    body.finalHomeNoScroll
    #view > .hm
    > .hmFeature {
      --final-feature-height:
        clamp(
          108px,
          18dvh,
          132px
        );

      box-sizing:
        border-box !important;

      flex:
        0 0
        var(--final-feature-height) !important;

      display:
        grid !important;

      width:
        100% !important;

      height:
        var(--final-feature-height) !important;

      min-height:
        var(--final-feature-height) !important;

      max-height:
        var(--final-feature-height) !important;

      margin:
        5px 0 0 !important;

      padding:
        0 !important;

      overflow:
        hidden !important;
    }


    body.finalHomeNoScroll
    .hmFeature > .hmPoster,

    body.finalHomeNoScroll
    .hmFeature > .hmQuick {
      box-sizing:
        border-box !important;

      height:
        100% !important;

      min-height:
        0 !important;

      max-height:
        100% !important;

      margin:
        0 !important;
    }


    /*
     * ========================================================
     * 7. LEGAL FOOTER
     *
     * 홈에서는 FIXED overlay가 아님.
     * 실제 body 2번째 행.
     *
     * 그러므로 footer 위의 빈 검은 공간이 생길 수 없다.
     * ========================================================
     */

    body.finalHomeNoScroll.finalHasLegalFooter
    > #floatingLegalFooter {
      box-sizing:
        border-box !important;

      grid-row:
        2 !important;

      position:
        relative !important;

      left:
        auto !important;

      right:
        auto !important;

      top:
        auto !important;

      bottom:
        auto !important;

      width:
        100% !important;

      height:
        auto !important;

      min-height:
        0 !important;

      margin:
        0 !important;

      z-index:
        99999 !important;

      display:
        block !important;
    }


    body.finalHomeNoScroll.finalHasLegalFooter
    #floatingLegalFooter
    .finalLegalInner {
      box-sizing:
        border-box !important;

      min-height:
        0 !important;

      padding:
        6px 14px !important;
    }


    /*
     * 기존 footer reservation 완전 무효화.
     * body grid 자체가 footer 공간을 확보한다.
     */
    body.finalHomeNoScroll.finalHasLegalFooter
    #view {
      padding-bottom:
        0 !important;
    }


    /*
     * ========================================================
     * 8. VIDEO
     *
     * 현재 정상 재생 로직은 건드리지 않는다.
     *
     * hmNews 전체 면적을 영상 stage가 사용하게만 한다.
     * ========================================================
     */

    body.finalHomeNoScroll
    .hm > .hmNews.finalVideoMode,

    body.finalHomeNoScroll
    .hm > .hmNews.lolVideoMode {
      display:
        block !important;

      width:
        100% !important;

      height:
        auto !important;

      min-height:
        0 !important;

      max-height:
        none !important;

      margin:
        0 !important;

      padding:
        0 !important;

      overflow:
        hidden !important;

      background:
        #000 !important;
    }


    body.finalHomeNoScroll
    .hmNews.finalVideoMode
    .finalVideoStageItem {
      box-sizing:
        border-box !important;

      display:
        block !important;

      width:
        100% !important;

      height:
        100% !important;

      min-height:
        100% !important;

      max-height:
        100% !important;

      margin:
        0 !important;

      padding:
        0 !important;
    }


    body.finalHomeNoScroll
    .hmNews.finalVideoMode
    .finalVideoPreview,

    body.finalHomeNoScroll
    .hmNews.finalVideoMode
    .finalVideoPlayer {
      box-sizing:
        border-box !important;

      width:
        100% !important;

      height:
        100% !important;

      min-height:
        100% !important;

      max-height:
        100% !important;

      margin:
        0 !important;
    }


    body.finalHomeNoScroll
    .hmNews.finalVideoMode
    .finalYoutubeThumbnail,

    body.finalHomeNoScroll
    .hmNews.finalVideoMode
    .finalVideoPosterFrame {
      width:
        100% !important;

      height:
        100% !important;

      object-fit:
        cover !important;

      object-position:
        center center !important;

      background:
        #eee5ce url('images/branding/app-icon-512.png') center / contain no-repeat !important;
    }


    /*
     * ========================================================
     * 9. 새소식 / 커뮤니티 = 7행
     * ========================================================
     */

    body.finalHomeNoScroll
    .hm > .hmNews:not(.lolVideoMode)
    {
      display:
        grid !important;

      grid-template-columns:
        minmax(0,1fr) !important;

      grid-template-rows:
        repeat(
          7,
          minmax(0,1fr)
        ) !important;
    }


    /*
     * 각 행 경계선
     */
    body.finalHomeNoScroll
    .hm > .hmNews:not(.lolVideoMode)
    > li {
      box-sizing:
        border-box !important;

      min-height:
        0 !important;

      margin:
        0 !important;

      background:
        #ffffff !important;

      border:
        0 !important;

      border-bottom:
        1px solid #d6d6d6 !important;
    }


    body.finalHomeNoScroll
    .hm > .hmNews:not(.lolVideoMode)
    > li:last-child {
      border-bottom:
        0 !important;
    }


    /*
     * 버튼/행 흰색 강제
     */
    body.finalHomeNoScroll
    .hm > .hmNews:not(.lolVideoMode)
    > li > button {
      width:
        100% !important;

      height:
        100% !important;

      color:
        #171717 !important;

      background:
        #ffffff !important;

      opacity:
        1 !important;

      border:
        0 !important;
    }


    /*
     * 글 제목:
     * 흰 배경에서도 확실한 검정.
     */
    body.finalHomeNoScroll
    .hm > .hmNews
    b {
      color:
        #181818 !important;

      opacity:
        1 !important;

      font-weight:
        750 !important;

      text-shadow:
        none !important;
    }


    /*
     * 작성자:
     * 너무 옅지 않게.
     */
    body.finalHomeNoScroll
    .hm > .hmNews
    small {
      color:
        #595959 !important;

      opacity:
        1 !important;

      font-weight:
        500 !important;

      text-shadow:
        none !important;
    }


    /*
     * 운영자 빨간 원
     */
    body.finalHomeNoScroll
    .hmNews
    .finalHomeOperatorRow
    .hmFeedDot {
      box-sizing:
        border-box !important;

      opacity:
        1 !important;

      visibility:
        visible !important;

      background:
        #df4650 !important;

      border:
        1px solid #a9242e !important;

      box-shadow:
        0 0 0 1px rgba(255,255,255,.95) !important;
    }


    /*
     * 사용자 파란 원
     */
    body.finalHomeNoScroll
    .hmNews
    .finalHomeUserRow
    .hmFeedDot {
      box-sizing:
        border-box !important;

      opacity:
        1 !important;

      visibility:
        visible !important;

      background:
        #3979db !important;

      border:
        1px solid #2057ad !important;

      box-shadow:
        0 0 0 1px rgba(255,255,255,.95) !important;
    }


    /*
     * 빈 줄:
     * 흰 배경 + 약한 실선.
     * 원/글씨 없음.
     */
    body.finalHomeNoScroll
    .hmNews
    .finalEmptyHomeRow {
      background:
        #ffffff !important;

      border-bottom:
        1px solid #dedede !important;
    }


    body.finalHomeNoScroll
    .hmNews
    .finalEmptyHomeRow
    .hmFeedDot {
      opacity:
        0 !important;

      visibility:
        hidden !important;

      background:
        transparent !important;

      border:
        0 !important;

      box-shadow:
        none !important;
    }


    /*
     * ========================================================
     * 10. 제거하기로 한 홈 보조 문구
     * ========================================================
     */

    .hm > .hmAd {
      display:
        none !important;
    }


    /*
     * ========================================================
     * 11. 매우 낮은 화면
     *
     * 영상/feature를 줄여서 메인 스크롤 금지 유지.
     * ========================================================
     */

    @media (max-height: 640px) {

      body.finalHomeNoScroll
      #view > .hm
      > .hmFeature {
        --final-feature-height:
          112px;
      }

      body.finalHomeNoScroll
      .hm > .hmTabs {
        height:
          35px !important;

        min-height:
          35px !important;
      }

      body.finalHomeNoScroll
      .hm > .hmTabs button {
        height:
          34px !important;

        line-height:
          32px !important;
      }
    }


    @media (max-height: 560px) {

      body.finalHomeNoScroll
      #view > .hm
      > .hmFeature {
        --final-feature-height:
          100px;
      }
    }

    /* Phase 2B-2A: final runtime layer for the project-owned archive system. */
    #floatingLegalFooter {
      background:#183647 !important;
      background-image:none !important;
      border-top:1px solid #31586b !important;
      box-shadow:none !important;
    }
    #floatingLegalFooter .finalLegalText { color:#d7e7ed !important; }
    #floatingLegalFooter .finalLegalButton {
      color:#fff !important;
      background:transparent !important;
      border:1px solid #78aab7 !important;
      border-radius:7px !important;
      box-shadow:none !important;
    }
    body.finalHomeNoScroll.finalHasLegalFooter > .app,
    body.finalHomeNoScroll #view > .hm,
    body.finalHomeNoScroll .app > #view {
      background:#f7f9fa !important;
    }
    body.finalHomeNoScroll .app > header {
      background:#183647 !important;
      background-image:none !important;
      border-bottom:3px solid #42a3aa !important;
      box-shadow:none !important;
    }
    body.finalHomeNoScroll .hmStrip {
      background:#e4f2f3 !important;
      border:0 !important;
      color:#35626a !important;
    }
    body.finalHomeNoScroll .hmSearch,
    body.finalHomeNoScroll .hmLogo,
    body.finalHomeNoScroll .hmTabs {
      background:#fff !important;
      background-image:none !important;
      border-color:#d7e0e5 !important;
      color:#17242d !important;
      box-shadow:none !important;
      text-shadow:none !important;
    }
    body.finalHomeNoScroll .hmTabs button {
      background:#fff !important;
      background-image:none !important;
      border:0 !important;
      border-bottom:3px solid transparent !important;
      color:#60717c !important;
      box-shadow:none !important;
    }
    body.finalHomeNoScroll .hmTabs button.on {
      border-bottom-color:#197a86 !important;
      color:#197a86 !important;
    }
    body.finalHomeNoScroll .hmFeature > .hmPoster {
      background:#e4f2f3 !important;
      background-image:none !important;
      border:1px solid #b7cbd0 !important;
      box-shadow:none !important;
      color:#17242d !important;
      text-shadow:none !important;
    }
    body.finalHomeNoScroll .hmQuick .hmBtn,
    body.finalHomeNoScroll .hmGrid .hmBtn {
      background:#fff !important;
      background-image:none !important;
      border:1px solid #c5d1d7 !important;
      border-radius:7px !important;
      box-shadow:none !important;
      color:#17242d !important;
      text-shadow:none !important;
    }

    /*
     * ========================================================
     * PROJECT-OWNED CLASSIC FANTASY ARCHIVE DESIGN SYSTEM
     * ========================================================
     * Original LOLFLIX UI chrome built only from CSS geometry,
     * gradients, rules, and typography. It intentionally avoids
     * historical Riot client frames, rune sockets, emblems, and
     * extracted textures.
     */
    :root {
      --cf-void:#040912;
      --cf-night:#081323;
      --cf-night-2:#0d1c31;
      --cf-charcoal:#191c1d;
      --cf-charcoal-2:#22251f;
      --cf-panel:#101a28;
      --cf-panel-raised:#17263a;
      --cf-parchment:#d7c696;
      --cf-parchment-deep:#bca66f;
      --cf-ivory:#f2ead2;
      --cf-ink:#241c10;
      --cf-muted:#b8b09b;
      --cf-muted-dark:#817965;
      --cf-bronze:#806530;
      --cf-brass:#b99642;
      --cf-gold:#e0bd55;
      --cf-copper:#985f3d;
      --cf-line:#514a35;
      --cf-line-soft:#34382f;
      --cf-danger:#c76452;
      --cf-success:#8fa968;
      --cf-sans:system-ui,-apple-system,BlinkMacSystemFont,"Noto Sans KR","Noto Sans CJK KR","SamsungOneKorean","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
      --cf-display:Georgia,"Noto Serif KR","Batang","바탕",serif;
      --cf-space-1:4px;
      --cf-space-2:7px;
      --cf-space-3:10px;
      --cf-space-4:14px;
      --cf-rule:1px solid var(--cf-bronze);
      --cf-double:3px double var(--cf-bronze);
      --cf-shadow:inset 0 0 0 1px rgba(233,213,152,.08),0 3px 12px rgba(0,0,0,.32);
    }

    html,
    body.classicFantasyArchive {
      background:
        radial-gradient(circle at 50% -10%,#1b3553 0,transparent 38%),
        linear-gradient(135deg,#040912,#0b1728 52%,#050a12) !important;
      color:var(--cf-ivory) !important;
      font-family:var(--cf-sans) !important;
      font-size:14px !important;
      line-height:1.55 !important;
    }

    body.classicFantasyArchive {
      overflow-x:hidden !important;
      color-scheme:dark;
    }

    body.classicFantasyArchive.finalHomeNoScroll {
      overflow-y:auto !important;
    }

    body.classicFantasyArchive .app {
      position:relative;
      width:100% !important;
      max-width:520px !important;
      min-height:100dvh !important;
      margin:0 auto !important;
      overflow-x:clip !important;
      color:var(--cf-ivory) !important;
      background:
        repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0,rgba(255,255,255,.012) 1px,transparent 1px,transparent 5px),
        radial-gradient(circle at 50% 0,rgba(40,79,120,.24),transparent 36%),
        var(--cf-night) !important;
      border-inline:1px solid #252b2d !important;
      box-shadow:0 0 38px rgba(0,0,0,.55) !important;
    }

    body.classicFantasyArchive .app::before {
      content:"";
      position:fixed;
      z-index:60;
      top:0;
      left:50%;
      width:min(100%,520px);
      height:2px;
      transform:translateX(-50%);
      background:linear-gradient(90deg,transparent,var(--cf-brass) 16%,var(--cf-gold) 50%,var(--cf-brass) 84%,transparent);
      pointer-events:none;
    }

    body.classicFantasyArchive .app > header {
      grid-template-columns:88px minmax(0,1fr) 66px !important;
      height:52px !important;
      padding:4px 5px !important;
      color:var(--cf-ivory) !important;
      background:
        linear-gradient(120deg,rgba(185,154,82,.09),transparent 28%,rgba(185,154,82,.06) 72%,transparent),
        linear-gradient(#172a43,#081321) !important;
      border:0 !important;
      border-bottom:var(--cf-double) !important;
      box-shadow:0 3px 12px rgba(0,0,0,.42) !important;
    }

    body.classicFantasyArchive .app > header button,
    body.classicFantasyArchive .app > header #home {
      min-width:0 !important;
      height:38px !important;
      margin:0 !important;
      padding:0 8px !important;
      color:var(--cf-ivory) !important;
      background:linear-gradient(#2b2e27,#171c1b) !important;
      border:1px solid #625735 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(232,210,144,.06) !important;
      font-size:12px !important;
      font-weight:750 !important;
      letter-spacing:-.01em !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .app > header #home {
      color:#f4e6b9 !important;
      background:transparent !important;
      border-color:transparent !important;
      font-family:var(--cf-display) !important;
      font-size:16px !important;
      letter-spacing:.025em !important;
    }

    body.classicFantasyArchive .app > header #home {
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:center !important;
      line-height:1.05 !important;
    }

    body.classicFantasyArchive .app > header #home::after {
      content:"클래식 β" !important;
      display:block !important;
      max-width:100% !important;
      margin-top:2px !important;
      overflow:hidden !important;
      color:#c9ab59 !important;
      font-family:var(--cf-sans) !important;
      font-size:8px !important;
      font-weight:800 !important;
      letter-spacing:.14em !important;
      line-height:1 !important;
      text-overflow:ellipsis !important;
      white-space:nowrap !important;
    }

    body.classicFantasyArchive .app > header #settings {
      color:#251b09 !important;
      background:linear-gradient(#dec46f,#98742a) !important;
      border-color:#efd991 !important;
      text-shadow:0 1px rgba(255,255,255,.35) !important;
    }

    body.classicFantasyArchive .app > header button:hover,
    body.classicFantasyArchive .app > header button:focus-visible {
      color:#fff5d2 !important;
      border-color:var(--cf-brass) !important;
      background:linear-gradient(#3a3425,#1d1f1a) !important;
    }

    body.classicFantasyArchive #drawer {
      color:#111 !important;
      background:#fff !important;
      background-image:none !important;
      border:0 !important;
      border-right:1px solid #b8b8b8 !important;
      box-shadow:10px 0 28px rgba(0,0,0,.28) !important;
    }

    body.classicFantasyArchive #drawer h3 {
      margin:0 !important;
      padding:10px 14px 7px !important;
      color:#555 !important;
      background:#fff !important;
      border-top:1px solid #dedede !important;
      border-bottom:1px solid #c8c8c8 !important;
      font-family:var(--cf-display) !important;
      font-size:12px !important;
      letter-spacing:.1em !important;
      text-transform:none !important;
    }

    body.classicFantasyArchive #drawer button {
      min-height:48px !important;
      padding:0 16px !important;
      color:#111 !important;
      background:#fff !important;
      border:0 !important;
      border-left:3px solid transparent !important;
      border-bottom:1px solid #d8d8d8 !important;
      border-radius:0 !important;
      font-size:13px !important;
      text-align:left !important;
    }

    body.classicFantasyArchive #drawer button:hover,
    body.classicFantasyArchive #drawer button:focus-visible {
      color:#111 !important;
      background:#eef3f5 !important;
      border-left-color:#197a86 !important;
    }

    body.classicFantasyArchive #view,
    body.classicFantasyArchive main {
      width:100% !important;
      max-width:100% !important;
      min-width:0 !important;
      color:var(--cf-ivory) !important;
      background:transparent !important;
    }

    body.classicFantasyArchive .box,
    body.classicFantasyArchive .cv,
    body.classicFantasyArchive .clsPage,
    body.classicFantasyArchive .spellArchive,
    body.classicFantasyArchive .itemPage,
    body.classicFantasyArchive .runeEditorial,
    body.classicFantasyArchive .runeTextArchive,
    body.classicFantasyArchive .masteryShell,
    body.classicFantasyArchive .legacy,
    body.classicFantasyArchive .onlineManage {
      color:var(--cf-ivory) !important;
      background:
        repeating-linear-gradient(0deg,rgba(255,255,255,.01) 0,rgba(255,255,255,.01) 1px,transparent 1px,transparent 5px),
        linear-gradient(180deg,#111e2d,#07111e) !important;
      border:0 !important;
      border-radius:0 !important;
      box-shadow:none !important;
    }

    body.classicFantasyArchive .bar,
    body.classicFantasyArchive .cvBar,
    body.classicFantasyArchive .backbar,
    body.classicFantasyArchive .boardTop,
    body.classicFantasyArchive .tabs,
    body.classicFantasyArchive .runeControlStrip,
    body.classicFantasyArchive .archiveSectionHeader {
      position:relative !important;
      color:#eadfbe !important;
      background:linear-gradient(#1b2d43,#0b1827) !important;
      border:0 !important;
      border-bottom:var(--cf-rule) !important;
      border-radius:0 !important;
      box-shadow:inset 0 -1px rgba(0,0,0,.72) !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .bar,
    body.classicFantasyArchive .cvBar {
      min-height:44px !important;
      padding:10px 12px !important;
      font-family:var(--cf-display) !important;
      font-size:16px !important;
      font-weight:800 !important;
    }

    body.classicFantasyArchive .backbar {
      padding:6px !important;
    }

    body.classicFantasyArchive button,
    body.classicFantasyArchive input,
    body.classicFantasyArchive select,
    body.classicFantasyArchive textarea {
      max-width:100%;
      font-family:var(--cf-sans) !important;
    }

    body.classicFantasyArchive input,
    body.classicFantasyArchive select,
    body.classicFantasyArchive textarea {
      color:var(--cf-ink) !important;
      background:#efe7cf !important;
      border:1px solid #76633a !important;
      border-radius:0 !important;
      caret-color:#473414 !important;
    }

    body.classicFantasyArchive input::placeholder,
    body.classicFantasyArchive textarea::placeholder {
      color:#706852 !important;
      opacity:1 !important;
    }

    body.classicFantasyArchive .backbar button,
    body.classicFantasyArchive .boardTop button,
    body.classicFantasyArchive .tabs button,
    body.classicFantasyArchive .runeControlStrip button,
    body.classicFantasyArchive .publicActions button,
    body.classicFantasyArchive .publicActions a,
    body.classicFantasyArchive .modalRoute {
      color:#e8dcc0 !important;
      background:linear-gradient(#34352d,#1e211d) !important;
      border:1px solid #75663d !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(239,217,151,.07) !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .tabs button.on,
    body.classicFantasyArchive .runeControlStrip button.on,
    body.classicFantasyArchive .boardTop button.on {
      color:#261c0d !important;
      background:linear-gradient(#d7bd72,#9f7a2b) !important;
      border-color:#edda9a !important;
      box-shadow:inset 0 0 0 1px rgba(255,244,197,.38) !important;
      text-shadow:0 1px rgba(255,255,255,.35) !important;
    }

    body.classicFantasyArchive .archiveLead {
      margin:8px !important;
      padding:11px 12px !important;
      color:#eadfbe !important;
      background:linear-gradient(90deg,rgba(151,105,54,.18),rgba(26,31,30,.72)) !important;
      border:1px solid #55452c !important;
      border-left:4px solid var(--cf-copper) !important;
      border-radius:0 !important;
      font-size:12px !important;
      line-height:1.65 !important;
    }

    body.classicFantasyArchive .archiveEyebrow,
    body.classicFantasyArchive .archiveSectionHeader small {
      color:#d3b86c !important;
      font-family:var(--cf-display) !important;
      letter-spacing:.1em !important;
    }

    body.classicFantasyArchive .hint,
    body.classicFantasyArchive .hint2 {
      color:#b7b09d !important;
      font-size:11px !important;
      line-height:1.65 !important;
    }

    body.classicFantasyArchive .disc,
    body.classicFantasyArchive .publicActions {
      color:#bfb49b !important;
      background:#0c141a !important;
      border:1px solid #394037 !important;
      border-radius:0 !important;
      font-size:10px !important;
      line-height:1.6 !important;
    }

    /* Home archive desk. */
    body.classicFantasyArchive.finalHomeNoScroll #view > .hm,
    body.classicFantasyArchive.finalHomeNoScroll .app > #view,
    body.classicFantasyArchive.finalHomeNoScroll.finalHasLegalFooter > .app {
      color:var(--cf-ivory) !important;
      background:
        radial-gradient(circle at 50% 0,rgba(51,93,138,.22),transparent 36%),
        var(--cf-night) !important;
    }

    body.classicFantasyArchive .hm {
      padding:4px 5px 8px !important;
    }

    body.classicFantasyArchive .hmStrip {
      min-height:24px !important;
      padding:4px 8px !important;
      color:#d0bd87 !important;
      background:linear-gradient(90deg,#071321,#132842,#071321) !important;
      border:0 !important;
      border-bottom:1px solid #51472c !important;
      font-family:var(--cf-display) !important;
      font-size:11px !important;
      letter-spacing:.035em !important;
    }

    body.classicFantasyArchive .hmStrip span {
      color:#e0bd55 !important;
      font-size:9px !important;
      letter-spacing:.13em !important;
    }

    body.classicFantasyArchive .hmStrip b {
      margin-left:auto !important;
      color:#ded3b5 !important;
      font-family:var(--cf-sans) !important;
      font-size:9px !important;
      letter-spacing:0 !important;
    }

    body.classicFantasyArchive .hmSearch,
    body.classicFantasyArchive .hmLogo {
      color:var(--cf-ivory) !important;
      background:linear-gradient(#1a2b40,#0b1827) !important;
      border:var(--cf-rule) !important;
      border-radius:0 !important;
      box-shadow:var(--cf-shadow) !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .hmSearch {
      gap:6px !important;
      padding:7px !important;
    }

    body.classicFantasyArchive .hmSearch input,
    body.classicFantasyArchive .hmSearch button {
      min-height:36px !important;
      border-radius:0 !important;
      font-size:13px !important;
    }

    body.classicFantasyArchive .hmSearch button {
      color:#f3e6bd !important;
      background:linear-gradient(#4a3d24,#242015) !important;
      border:1px solid #9b8147 !important;
    }

    body.classicFantasyArchive .hmLogo {
      min-height:27px !important;
      padding:4px 8px !important;
      color:#d8c58c !important;
      font-family:var(--cf-display) !important;
    }

    body.classicFantasyArchive .hmRot {
      grid-template-rows:minmax(0,72px) !important;
      height:auto !important;
      min-height:88px !important;
      gap:8px !important;
      padding:7px 13px 9px !important;
      background:linear-gradient(#0d1d2e,#07111d) !important;
      border-inline:1px solid #453d2a !important;
      border-bottom:1px solid #453d2a !important;
    }

    body.classicFantasyArchive .rotC {
      height:72px !important;
      overflow:hidden !important;
      background:#0a0e12 !important;
      border:1px solid #76643a !important;
      border:2px solid #a48337 !important;
      border-radius:50% !important;
      box-shadow:inset 0 0 0 2px #101b28,0 2px 6px #000b !important;
    }

    body.classicFantasyArchive .rotC small {
      color:#f2ead2 !important;
      background:linear-gradient(transparent,rgba(0,0,0,.92)) !important;
      font-size:10px !important;
      text-shadow:0 1px 2px #000 !important;
    }

    body.classicFantasyArchive .hmSectionTitle {
      display:flex !important;
      align-items:center !important;
      justify-content:space-between !important;
      min-height:29px !important;
      margin-top:5px !important;
      padding:4px 8px !important;
      color:#f0e3bc !important;
      background:linear-gradient(#1b2d43,#0b1827) !important;
      border:1px solid #665534 !important;
      border-bottom:0 !important;
      font-family:var(--cf-display) !important;
    }

    body.classicFantasyArchive .hmSectionTitle small {
      color:#ab965d !important;
      font-family:var(--cf-sans) !important;
      font-size:8px !important;
      letter-spacing:.08em !important;
    }

    body.classicFantasyArchive .hmTabs {
      margin-top:5px !important;
      color:#d9cda9 !important;
      background:#0e1b29 !important;
      border:var(--cf-rule) !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .hmTabs button {
      min-height:34px !important;
      color:#bdb6a2 !important;
      background:linear-gradient(#16283c,#0a1725) !important;
      border:0 !important;
      border-right:1px solid #4c452f !important;
      border-bottom:3px solid transparent !important;
      border-radius:0 !important;
      font-size:12px !important;
    }

    body.classicFantasyArchive .hmTabs button.on {
      color:#f4e7bc !important;
      background:linear-gradient(#2d3a40,#142235) !important;
      border-bottom-color:var(--cf-gold) !important;
    }

    body.classicFantasyArchive .hmNews {
      color:#e6deca !important;
      background:#091522 !important;
      border-inline:var(--cf-rule) !important;
      border-bottom:var(--cf-rule) !important;
    }

    body.classicFantasyArchive .hmNews button,
    body.classicFantasyArchive .hmNews .finalEmptyHomeRow {
      color:#e1d9c3 !important;
      background:#091522 !important;
      border:0 !important;
      border-bottom:1px solid #34382f !important;
      font-size:11px !important;
    }

    body.classicFantasyArchive .hmNews button small {
      color:#aaa38f !important;
    }

    body.classicFantasyArchive.finalHomeNoScroll .hm > .hmNews:not(.lolVideoMode) > li,
    body.classicFantasyArchive.finalHomeNoScroll .hmNews .finalEmptyHomeRow,
    body.classicFantasyArchive.finalHomeNoScroll .hmNews .finalHomeOperatorRow {
      color:#e1d9c3 !important;
      background:#091522 !important;
      border-bottom:1px solid #34382f !important;
    }

    body.classicFantasyArchive.finalHomeNoScroll #view > .hm > .hmNews:not(.lolVideoMode) {
      background:#091522 !important;
    }

    body.classicFantasyArchive .hmFeature {
      gap:5px !important;
      margin-top:5px !important;
    }

    body.classicFantasyArchive .hmFeature > .hmPoster {
      color:#f5e7b9 !important;
      background:
        linear-gradient(145deg,transparent 0 61%,rgba(187,145,64,.13) 61% 62%,transparent 62%),
        radial-gradient(circle at 18% 16%,rgba(169,116,52,.25),transparent 35%),
        linear-gradient(135deg,#183454,#091727 60%,#281f10) !important;
      border:var(--cf-double) !important;
      border-left:var(--cf-double) !important;
      border-radius:0 !important;
      box-shadow:var(--cf-shadow) !important;
      text-shadow:0 1px 2px #000 !important;
    }

    body.classicFantasyArchive .hmPoster::before {
      content:"" !important;
      position:absolute !important;
      inset:9px !important;
      display:block !important;
      border:1px solid rgba(205,174,95,.3) !important;
      clip-path:polygon(0 0,38% 0,42% 5%,58% 5%,62% 0,100% 0,100% 100%,62% 100%,58% 95%,42% 95%,38% 100%,0 100%) !important;
      pointer-events:none !important;
    }

    body.classicFantasyArchive .hmPoster span {
      color:#cfb56c !important;
      font-family:var(--cf-display) !important;
      letter-spacing:.08em !important;
    }

    body.classicFantasyArchive .hmPoster b {
      color:#f4ead0 !important;
      font-family:var(--cf-display) !important;
      font-size:16px !important;
    }

    body.classicFantasyArchive .hmQuick,
    body.classicFantasyArchive .hmGrid {
      gap:4px !important;
    }

    body.classicFantasyArchive .hmQuick {
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    }

    body.classicFantasyArchive .hmGrid {
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      grid-template-rows:minmax(40px,auto) !important;
      margin:4px 0 0 !important;
    }

    body.classicFantasyArchive .hmQuick .hmBtn,
    body.classicFantasyArchive .hmGrid .hmBtn {
      color:#e7deca !important;
      background:linear-gradient(145deg,#292d29,#191e1d) !important;
      border:1px solid #62583a !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(222,198,125,.06) !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .hmQuick .hmBtn {
      height:100% !important;
      min-height:0 !important;
      border-left:3px solid #9b7a34 !important;
    }

    body.classicFantasyArchive .hmGrid .hmBtn {
      min-height:40px !important;
    }

    body.classicFantasyArchive .hmQuick .hmBtn small,
    body.classicFantasyArchive .hmGrid .hmBtn small {
      color:#d6b95d !important;
    }

    /* Champion register and dossier. */
    body.classicFantasyArchive .clsHead {
      color:#f1e3b8 !important;
      background:
        linear-gradient(105deg,rgba(44,27,12,.92),rgba(105,76,25,.9) 62%,rgba(151,115,38,.82)),
        repeating-linear-gradient(45deg,transparent 0,transparent 7px,rgba(255,255,255,.025) 7px,rgba(255,255,255,.025) 8px) !important;
      border-bottom:2px solid #b18e40 !important;
      text-shadow:0 1px 2px #000 !important;
    }

    body.classicFantasyArchive .clsHead b,
    body.classicFantasyArchive .clsPage .bar {
      font-family:var(--cf-display) !important;
    }

    body.classicFantasyArchive .clsHead small {
      color:#e2c98d !important;
      font-size:12px !important;
      line-height:1.5 !important;
    }

    body.classicFantasyArchive .champGrid,
    body.classicFantasyArchive .clsPage .classicPortraitGrid {
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      gap:4px !important;
      padding:6px !important;
      background:#050d18 !important;
    }

    body.classicFantasyArchive .champCell,
    body.classicFantasyArchive .clsPage .classicPortraitGrid .champCell {
      overflow:hidden !important;
      color:#f5ead0 !important;
      background:#07111d !important;
      border:1px solid #665633 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px #17130d,0 2px 6px rgba(0,0,0,.5) !important;
    }

    body.classicFantasyArchive .cgName,
    body.classicFantasyArchive .champCell b {
      color:#f5ead0 !important;
      background:linear-gradient(rgba(8,9,9,.94),rgba(8,9,9,.38)) !important;
      font-size:11px !important;
      line-height:1.35 !important;
      text-shadow:0 1px 2px #000 !important;
    }

    body.classicFantasyArchive .champCell small {
      color:#d4bd78 !important;
      background:linear-gradient(transparent,rgba(6,7,7,.94)) !important;
      font-size:9px !important;
    }

    body.classicFantasyArchive .cv {
      background:
        radial-gradient(circle at 82% 4%,rgba(98,76,37,.2),transparent 32%),
        linear-gradient(#172027,#0a1015 62%) !important;
    }

    body.classicFantasyArchive .cvHead,
    body.classicFantasyArchive .cvLinks,
    body.classicFantasyArchive .cvStats,
    body.classicFantasyArchive .cvRates,
    body.classicFantasyArchive .cvSkills,
    body.classicFantasyArchive .cvSkins {
      color:var(--cf-ivory) !important;
      background:rgba(17,23,27,.88) !important;
      border-color:#4c4936 !important;
      border-radius:0 !important;
      box-shadow:none !important;
    }

    body.classicFantasyArchive .cvHead {
      margin:8px !important;
      padding:14px !important;
      border:var(--cf-double) !important;
      box-shadow:var(--cf-shadow) !important;
    }

    body.classicFantasyArchive .cvInfo h2,
    body.classicFantasyArchive .cvNick,
    body.classicFantasyArchive .cvTag,
    body.classicFantasyArchive .dossierRates .cvRate span,
    body.classicFantasyArchive .cvStats .cvS,
    body.classicFantasyArchive .cvStats .cvS span,
    body.classicFantasyArchive .cvStats .cvS b,
    body.classicFantasyArchive .cvSkT p,
    body.classicFantasyArchive .cvSkins li {
      color:#eee6d2 !important;
    }

    body.classicFantasyArchive .cvInfo h2,
    body.classicFantasyArchive .cvNick {
      font-family:var(--cf-display) !important;
    }

    body.classicFantasyArchive .cvSkT .pv,
    body.classicFantasyArchive .cvSkins li small,
    body.classicFantasyArchive .classicSkillMeta {
      color:#b7b09c !important;
    }

    body.classicFantasyArchive .cvSkill,
    body.classicFantasyArchive .cvSkins li {
      border-color:#353a35 !important;
    }

    body.classicFantasyArchive .cvLinks button,
    body.classicFantasyArchive .dossierRates .cvRate {
      color:#e7dcc2 !important;
      background:#1d2526 !important;
      border:1px solid #4b4d3c !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .dossierRates .cvRate b {
      color:#d8b858 !important;
    }

    /* Items, spells, runes, and masteries share dense records. */
    body.classicFantasyArchive .box .search,
    body.classicFantasyArchive .itemPage .search {
      background:#0d1419 !important;
      border-bottom:1px solid #51482f !important;
    }

    body.classicFantasyArchive .box .search button,
    body.classicFantasyArchive .itemPage .search button {
      color:#f3e6bd !important;
      background:linear-gradient(#4a3e24,#242015) !important;
      border:1px solid #9b8147 !important;
    }

    body.classicFantasyArchive .itemEditorial .tree2 {
      color:#d5cdb9 !important;
      background:#091725 !important;
      border:1px solid #494a37 !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .itemEditorial .tree2 button {
      min-height:34px !important;
      color:#b9b4a5 !important;
      background:transparent !important;
      border:0 !important;
      border-left:3px solid transparent !important;
      border-bottom:1px solid #2c3330 !important;
      border-radius:0 !important;
      font-size:12px !important;
    }

    body.classicFantasyArchive .itemEditorial .tree2 button.on {
      color:#f2e5bd !important;
      background:linear-gradient(90deg,rgba(170,125,48,.26),transparent) !important;
      border-left-color:var(--cf-gold) !important;
    }

    body.classicFantasyArchive .itemEditorial .ilist {
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:0 !important;
      padding:0 !important;
      background:transparent !important;
    }

    body.classicFantasyArchive .itemEditorial .ilist button {
      grid-template-columns:36px minmax(0,1fr) !important;
      min-height:52px !important;
      padding:5px 7px !important;
      border-top:0 !important;
    }

    body.classicFantasyArchive .itemEditorial .itemTextMarker {
      width:32px !important;
      height:32px !important;
      background:#13263a !important;
      border:1px solid #806a37 !important;
      border-radius:0 !important;
      color:#dbc06a !important;
    }

    body.classicFantasyArchive .itemEditorial .ilist button,
    body.classicFantasyArchive .runeTextArchive .rlist button,
    body.classicFantasyArchive .runeInventoryList button,
    body.classicFantasyArchive .runeCategorySummary li button,
    body.classicFantasyArchive .spellArchive button {
      color:#e8dfca !important;
      background:linear-gradient(145deg,#1b2226,#11171c) !important;
      border:1px solid #3b403a !important;
      border-radius:0 !important;
      box-shadow:none !important;
      font-size:12px !important;
      line-height:1.5 !important;
    }

    body.classicFantasyArchive .itemEditorial .ilist small,
    body.classicFantasyArchive .runeTextArchive .rlist small,
    body.classicFantasyArchive .runeInventoryList small,
    body.classicFantasyArchive .runeCategorySummary small {
      color:#b5ad98 !important;
    }

    body.classicFantasyArchive .itemEditorial .ilist em,
    body.classicFantasyArchive .gold,
    body.classicFantasyArchive .runeEditorialStats b {
      color:#d7b64f !important;
    }

    body.classicFantasyArchive .spellArchive > h3 {
      margin:0 !important;
      padding:12px !important;
      color:#eadfbe !important;
      background:linear-gradient(#252b28,#151b1c) !important;
      border:0 !important;
      border-bottom:var(--cf-rule) !important;
      font-family:var(--cf-display) !important;
      font-size:16px !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .itemTextMarker,
    body.classicFantasyArchive .runeTextMarker,
    body.classicFantasyArchive .skinTextMarker,
    body.classicFantasyArchive .masteryIndex {
      color:#dfc878 !important;
      background:
        linear-gradient(135deg,transparent 0 14%,rgba(214,182,94,.12) 14% 16%,transparent 16% 84%,rgba(214,182,94,.12) 84% 86%,transparent 86%),
        #222720 !important;
      border:1px solid #77663a !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .masteryEditorialSection,
    body.classicFantasyArchive .runeInventory,
    body.classicFantasyArchive .runeSelectionIndex,
    body.classicFantasyArchive .runeEditorialStats,
    body.classicFantasyArchive .runeCategorySummary,
    body.classicFantasyArchive .runeClientTop {
      color:#e8dfc8 !important;
      background:#12191e !important;
      border:1px solid #494536 !important;
      border-radius:0 !important;
      box-shadow:none !important;
    }

    body.classicFantasyArchive .masteryEditorialSection > header,
    body.classicFantasyArchive .runeCategorySummary > header {
      color:#eadfbd !important;
      background:linear-gradient(#292b23,#191c19) !important;
      border-bottom:1px solid #665635 !important;
    }

    body.classicFantasyArchive .masteryEditorialCard,
    body.classicFantasyArchive .runeInventoryList li,
    body.classicFantasyArchive .runeCategorySummary li {
      border-color:#303631 !important;
    }

    body.classicFantasyArchive .masteryEditorialCard button {
      color:#e5dcc7 !important;
      background:#12191e !important;
      font-size:12px !important;
      line-height:1.55 !important;
    }

    body.classicFantasyArchive .masteryEditorialCard.locked button {
      color:#999684 !important;
      background:#101519 !important;
    }

    body.classicFantasyArchive .masteryEditorialCard.selected button {
      color:#f2e7c8 !important;
      background:linear-gradient(90deg,rgba(173,127,48,.24),#171b19) !important;
    }

    body.classicFantasyArchive .masteryCopy small,
    body.classicFantasyArchive .masteryCopy em {
      color:#bdb5a2 !important;
    }

    body.classicFantasyArchive .masteryCopy u,
    body.classicFantasyArchive .masteryEditorialSection > header b {
      color:#d6b758 !important;
    }

    body.classicFantasyArchive .masteryShell.classicMastery {
      color:#e9dfc7 !important;
      background:#0d1419 !important;
      border:0 !important;
    }

    body.classicFantasyArchive .masteryShell.classicMastery .masteryTabs button,
    body.classicFantasyArchive .runePageTabs button {
      color:#cfc5ab !important;
      background:linear-gradient(#302f27,#1b1e1b) !important;
      border:1px solid #5e5436 !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .masteryShell.classicMastery .masteryTabs button.on,
    body.classicFantasyArchive .runePageTabs button.on {
      color:#251a0b !important;
      background:linear-gradient(#e0c473,#a47d2d) !important;
      border-color:#f0dda0 !important;
    }

    body.classicFantasyArchive .masteryShell.classicMastery .masteryDetail,
    body.classicFantasyArchive .runeClient.classicSkinned .runeClientStats p,
    body.classicFantasyArchive .runeClient.classicSkinned .runeClientStats dl div {
      color:#e7deca !important;
      background:#151c1f !important;
      border-color:#4c4c3a !important;
    }

    body.classicFantasyArchive .runeClient.classicSkinned,
    body.classicFantasyArchive .runeClient.classicSkinned .runeClientLayout {
      background:#0d1419 !important;
      border-color:#75623a !important;
    }

    body.classicFantasyArchive .runeClient.classicSkinned .runeBoardPane {
      background:
        repeating-linear-gradient(45deg,rgba(86,63,28,.05) 0,rgba(86,63,28,.05) 2px,transparent 2px,transparent 7px),
        var(--cf-parchment) !important;
      border:var(--cf-double) !important;
    }

    /* Patch, community, settings, and legal records. */
    body.classicFantasyArchive .parchwrap,
    body.classicFantasyArchive .termsOriginal {
      color:var(--cf-ink) !important;
      background:
        repeating-linear-gradient(0deg,rgba(91,67,27,.03) 0,rgba(91,67,27,.03) 1px,transparent 1px,transparent 5px),
        linear-gradient(90deg,#a98f55,#d8c790 8%,#e1d3a7 50%,#d8c790 92%,#a98f55) !important;
      border:0 !important;
    }

    body.classicFantasyArchive .parch {
      color:#2a2113 !important;
      background:rgba(238,225,181,.82) !important;
      border:var(--cf-double) !important;
      border-radius:0 !important;
      box-shadow:0 8px 22px rgba(45,31,11,.22) !important;
      font-size:13px !important;
      line-height:1.75 !important;
    }

    body.classicFantasyArchive .parch h2,
    body.classicFantasyArchive .termsOriginal h2 {
      color:#34240d !important;
      font-family:var(--cf-display) !important;
      font-size:20px !important;
      line-height:1.4 !important;
    }

    body.classicFantasyArchive .legacy.settings,
    body.classicFantasyArchive .legacy.about {
      padding:12px !important;
    }

    body.classicFantasyArchive .set,
    body.classicFantasyArchive .settingsActions .card,
    body.classicFantasyArchive .communityAccountCard,
    body.classicFantasyArchive .onlineManageList,
    body.classicFantasyArchive .onlineManageList li {
      color:#e7deca !important;
      background:#151c20 !important;
      border-color:#3c413b !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .set b,
    body.classicFantasyArchive .settingsActions .card b,
    body.classicFantasyArchive .communityAccountCard b {
      color:#f0e4bd !important;
    }

    body.classicFantasyArchive .toggle button {
      color:#bcb39d !important;
      background:#222620 !important;
      border:1px solid #675b3a !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive .toggle button.on {
      color:#261b0b !important;
      background:linear-gradient(#dfc16f,#a57d2b) !important;
      border-color:#eddb9e !important;
    }

    body.classicFantasyArchive .bd,
    body.classicFantasyArchive .onlineManageBody {
      color:#282014 !important;
      background:#d8c997 !important;
    }

    body.classicFantasyArchive .bdTop,
    body.classicFantasyArchive .bdPager,
    body.classicFantasyArchive .posts,
    body.classicFantasyArchive .post,
    body.classicFantasyArchive .cmts,
    body.classicFantasyArchive .cform {
      color:#2a2114 !important;
      background:#e6d9b0 !important;
      border-color:#9b8654 !important;
    }

    body.classicFantasyArchive .posts li,
    body.classicFantasyArchive .cmts li {
      color:#2a2114 !important;
      border-color:#b8a571 !important;
    }

    body.classicFantasyArchive .box .posts button,
    body.classicFantasyArchive .box .posts button small {
      color:#2c2417 !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive #view .box > .posts > li > button {
      color:#2c2417 !important;
      background:transparent !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive .box .posts button small {
      color:#6f6247 !important;
    }

    body.classicFantasyArchive .bBtn,
    body.classicFantasyArchive .bBtn.gen,
    body.classicFantasyArchive .pg,
    body.classicFantasyArchive .pg.search {
      color:#2a2010 !important;
      background:linear-gradient(#ead9a5,#bea064) !important;
      border:1px solid #816a37 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(255,246,207,.35) !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive .bBtn.gen font,
    body.classicFantasyArchive .pg.search,
    body.classicFantasyArchive .pg.search br {
      color:#2a2010 !important;
    }

    body.classicFantasyArchive #view .bd .bdTop .bBtn,
    body.classicFantasyArchive #view .bd .bdTop .bBtn.gen,
    body.classicFantasyArchive #view .bd .bdPager .pg,
    body.classicFantasyArchive #view .bd .bdPager .pg.search {
      color:#2a2010 !important;
      background:linear-gradient(#ead9a5,#bea064) !important;
      border:1px solid #816a37 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(255,246,207,.35) !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive .brows {
      color:#2a2114 !important;
      background:#e1d2a6 !important;
      border-color:#9c8654 !important;
    }

    body.classicFantasyArchive .brow,
    body.classicFantasyArchive .finalBoardRow {
      color:#2a2114 !important;
      background:transparent !important;
      border-color:#b7a270 !important;
    }

    body.classicFantasyArchive dialog,
    body.classicFantasyArchive #modal {
      color:#ece3cd !important;
      background:#11181d !important;
      border:var(--cf-double) !important;
      border-radius:0 !important;
      box-shadow:0 16px 50px #000b !important;
    }

    body.classicFantasyArchive #close {
      color:#f0e4bd !important;
      background:#2b2c26 !important;
      border:1px solid #78683f !important;
      border-radius:0 !important;
    }

    body.classicFantasyArchive #floatingLegalFooter {
      color:#d8cfb9 !important;
      background:linear-gradient(#171f22,#0b1115) !important;
      border-top:var(--cf-double) !important;
      box-shadow:0 -4px 12px rgba(0,0,0,.35) !important;
    }

    body.classicFantasyArchive #floatingLegalFooter .finalLegalText {
      color:#c8c0ad !important;
      font-size:10px !important;
      line-height:1.45 !important;
    }

    body.classicFantasyArchive #floatingLegalFooter .finalLegalButton {
      color:#eddfb8 !important;
      background:#1f2420 !important;
      border:1px solid #75663c !important;
      border-radius:0 !important;
    }

    /* Final readability and archive-identity corrections. */
    body.classicFantasyArchive.finalHomeNoScroll #view > .hm > .hmNews:not(.lolVideoMode) > li > button,
    body.classicFantasyArchive.finalHomeNoScroll #view > .hm > .hmNews:not(.lolVideoMode) > li.finalHomeOperatorRow > button {
      color:#e8dfca !important;
      background:#11171b !important;
      border:0 !important;
      border-bottom:1px solid #34382f !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive.finalHomeNoScroll #view > .hm > .hmNews:not(.lolVideoMode) > li > button > b {
      color:#e8dfca !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive.finalHomeNoScroll #view > .hm > .hmNews:not(.lolVideoMode) > li > button > small {
      color:#aaa38f !important;
      text-shadow:none !important;
    }

    body.classicFantasyArchive .masteryShell.masteryEditorial .archiveSectionHeader h3 {
      color:#eadfbd !important;
      text-shadow:0 1px #000 !important;
    }

    body.classicFantasyArchive .parchClose {
      color:#f0e2b7 !important;
      background:#25251f !important;
      border:1px solid #7d6838 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(255,239,185,.08) !important;
    }

    body.classicFantasyArchive .hmQuick .hmBtn,
    body.classicFantasyArchive .hmGrid .hmBtn {
      position:relative !important;
      padding-right:20px !important;
      font-size:11px !important;
      line-height:1.3 !important;
      word-break:keep-all !important;
      overflow-wrap:normal !important;
    }

    body.classicFantasyArchive .hmQuick .hmBtn small,
    body.classicFantasyArchive .hmGrid .hmBtn small {
      position:absolute !important;
      right:7px !important;
      top:50% !important;
      transform:translateY(-50%) !important;
    }

    body.classicFantasyArchive #floatingLegalFooter .finalLegalText,
    body.classicFantasyArchive #floatingLegalFooter .finalLegalButton,
    body.classicFantasyArchive .disc button,
    body.classicFantasyArchive .publicLink {
      font-size:11px !important;
    }

    body.classicFantasyArchive .masteryShell.masteryEditorial .archiveSectionHeader > b,
    body.classicFantasyArchive .masteryEditorialSection > header > b {
      color:#d7b95e !important;
    }

    body.classicFantasyArchive .masteryIndex,
    body.classicFantasyArchive .masteryEditorialCard strong,
    body.classicFantasyArchive .runeTextArchive .rlist .qn {
      color:#e1ca87 !important;
      background:#20262a !important;
      border:1px solid #665735 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px rgba(235,210,138,.05) !important;
    }

    body.classicFantasyArchive .spellRow h4 {
      color:#d8bd68 !important;
    }

    body.classicFantasyArchive .spellRow h4 small,
    body.classicFantasyArchive .spellRow p {
      color:#d7cfba !important;
    }

    body.classicFantasyArchive .bd .hint2,
    body.classicFantasyArchive .brows .hint,
    body.classicFantasyArchive .brows .hint2 {
      color:#4a3b22 !important;
    }

    body.classicFantasyArchive :focus-visible {
      outline:3px solid #e2c66f !important;
      outline-offset:2px !important;
    }

    /*
     * ========================================================
     * 2013 APK PIXEL-REFERENCE RECONSTRUCTION
     * ========================================================
     * Geometry is reconstructed from the supplied APK layouts
     * (480x800 reference, 120x45 menu buttons, 40px roster,
     * 90dp grids, 120dp dossier portrait, 130dp item rail).
     * No historical binary UI artwork is embedded here.
     */
    body.historicalApkReference.classicFantasyArchive {
      --apk-black:#02070d;
      --apk-blue-0:#06111d;
      --apk-blue-1:#0a2035;
      --apk-blue-2:#173b5a;
      --apk-blue-3:#28587b;
      --apk-gold:#d5b34d;
      --apk-gold-dark:#80611e;
      --apk-ivory:#eee5cb;
      --apk-line:#516679;
      background:#02070d !important;
      font-size:13px !important;
    }

    body.historicalApkReference.classicFantasyArchive .app {
      max-width:480px !important;
      background:
        linear-gradient(rgba(4,15,27,.965),rgba(3,12,22,.985)),
        radial-gradient(circle at 50% 0,#244c70,transparent 52%) !important;
      border-inline:1px solid #263b4e !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header {
      grid-template-columns:82px minmax(0,1fr) 62px !important;
      height:50px !important;
      padding:4px !important;
      background:linear-gradient(#214566 0,#102b45 52%,#071726 53%,#0a1d2f 100%) !important;
      border-bottom:3px double var(--apk-gold-dark) !important;
      box-shadow:inset 0 1px rgba(255,255,255,.12),0 2px 5px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header button {
      height:40px !important;
      color:var(--apk-ivory) !important;
      background:linear-gradient(#253d51,#081523) !important;
      border:1px solid #536e83 !important;
      box-shadow:inset 0 1px rgba(255,255,255,.12),inset 0 -1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #settings {
      color:#fff0ba !important;
      background:linear-gradient(#3e5d75,#112638) !important;
      border-color:#8a7334 !important;
      text-shadow:0 1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #home {
      color:#fff0bf !important;
      font-family:var(--cf-display) !important;
      font-size:17px !important;
      text-shadow:0 1px #000,0 0 5px #a97920 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #home::after {
      content:"클래식" !important;
      color:#d8b849 !important;
      font-size:7px !important;
    }

    body.historicalApkReference.classicFantasyArchive .bar,
    body.historicalApkReference.classicFantasyArchive .cvBar,
    body.historicalApkReference.classicFantasyArchive .backbar,
    body.historicalApkReference.classicFantasyArchive .boardTop,
    body.historicalApkReference.classicFantasyArchive .tabs,
    body.historicalApkReference.classicFantasyArchive .runeControlStrip,
    body.historicalApkReference.classicFantasyArchive .archiveSectionHeader {
      background:linear-gradient(#244b6e,#0c263e 58%,#071724) !important;
      border-bottom:1px solid #99782b !important;
      box-shadow:inset 0 1px rgba(255,255,255,.08),inset 0 -1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .backbar button,
    body.historicalApkReference.classicFantasyArchive .boardTop button,
    body.historicalApkReference.classicFantasyArchive .tabs button,
    body.historicalApkReference.classicFantasyArchive .runeControlStrip button,
    body.historicalApkReference.classicFantasyArchive .modalRoute {
      color:#f1e7cd !important;
      background:linear-gradient(#2d4960,#0c1924) !important;
      border:1px solid #6b7e89 !important;
      box-shadow:inset 0 1px rgba(255,255,255,.12),inset 0 -1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .backbar button {
      min-height:42px !important;
      padding:0 14px !important;
      font-size:14px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hm {
      padding:3px 4px 7px !important;
    }

    html.finalHomeNoScroll {
      height:auto !important;
      min-height:100% !important;
      overflow-x:hidden !important;
      overflow-y:auto !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive.finalHasLegalFooter {
      height:auto !important;
      min-height:100dvh !important;
      overflow-x:hidden !important;
      overflow-y:auto !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive > .app,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive.finalHasLegalFooter > .app {
      height:auto !important;
      min-height:100dvh !important;
      max-height:none !important;
      grid-template-rows:50px auto !important;
      overflow:visible !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view > .hm {
      height:auto !important;
      min-height:0 !important;
      max-height:none !important;
      overflow:visible !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view > .hm > .hmNews {
      flex:0 0 auto !important;
      height:auto !important;
      min-height:217px !important;
      max-height:none !important;
      overflow:visible !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view > .hm > .hmFeature {
      display:block !important;
      flex:0 0 auto !important;
      width:100% !important;
      height:auto !important;
      min-height:0 !important;
      max-height:none !important;
      margin:5px 0 !important;
      overflow:visible !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive .hmFeature > .hmPoster,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive .hmFeature > .hmQuick {
      height:auto !important;
      min-height:0 !important;
      max-height:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmStrip {
      min-height:22px !important;
      padding:3px 7px !important;
      background:linear-gradient(#102c48,#061522) !important;
      border:1px solid #3d596d !important;
      border-bottom-color:#8d6e26 !important;
      font-family:var(--cf-sans) !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmStrip span {
      color:#e1bd4b !important;
      font-family:var(--cf-display) !important;
      font-size:9px !important;
      letter-spacing:.12em !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch {
      padding:5px !important;
      background:linear-gradient(#122c43,#071624) !important;
      border:1px solid #4a6476 !important;
      box-shadow:inset 0 0 0 1px #07101a !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch input,
    body.historicalApkReference.classicFantasyArchive .hmSearch button {
      min-height:34px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch button {
      color:#f4e9ce !important;
      background:linear-gradient(#304c62,#101c25) !important;
      border-color:#7e6b35 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmLogo {
      min-height:24px !important;
      color:#e2d8bd !important;
      background:linear-gradient(#173752,#081724) !important;
      border:1px solid #455e71 !important;
      font-family:var(--cf-sans) !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmRot {
      grid-template-columns:repeat(5,minmax(0,1fr)) !important;
      grid-template-rows:52px !important;
      min-height:62px !important;
      gap:8px !important;
      padding:5px 8px !important;
      background:linear-gradient(#091a2a,#030b12) !important;
      border:1px solid #354c5e !important;
    }

    body.historicalApkReference.classicFantasyArchive .rotC {
      width:46px !important;
      height:46px !important;
      justify-self:center !important;
      border:1px solid #8d7838 !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px #07111a,0 1px 3px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .rotC small {
      padding:1px 2px !important;
      font-size:8px !important;
      background:rgba(0,0,0,.72) !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmFeature {
      display:block !important;
      margin:5px 0 !important;
      min-height:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmFeature > .hmPoster {
      width:100% !important;
      min-height:64px !important;
      margin:0 0 7px !important;
      padding:8px 13px !important;
      text-align:left !important;
      background:
        linear-gradient(90deg,rgba(16,49,78,.96),rgba(3,13,22,.96)),
        #071724 !important;
      border:2px solid #806626 !important;
      box-shadow:inset 0 0 0 1px #31495b !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster::before {
      display:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster span,
    body.historicalApkReference.classicFantasyArchive .hmPoster b,
    body.historicalApkReference.classicFantasyArchive .hmPoster small {
      position:static !important;
      display:block !important;
      margin:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster span {
      font-size:10px !important;
      letter-spacing:.12em !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster b {
      font-size:18px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmQuick,
    body.historicalApkReference.classicFantasyArchive .hmGrid {
      display:grid !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:7px 10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmGrid {
      margin-top:7px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmGrid .hmBtn:last-child:nth-child(odd) {
      grid-column:1 / -1 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmQuick .hmBtn,
    body.historicalApkReference.classicFantasyArchive .hmGrid .hmBtn {
      min-height:45px !important;
      padding:0 22px 0 12px !important;
      color:#f2ead7 !important;
      background:linear-gradient(#29475f 0,#142a3b 48%,#08131d 52%,#101c24 100%) !important;
      border:1px solid #60798a !important;
      border-left:3px solid #a6822e !important;
      box-shadow:inset 0 1px rgba(255,255,255,.12),inset 0 -1px #000 !important;
      font-size:12px !important;
      text-align:left !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmQuick .hmBtn small,
    body.historicalApkReference.classicFantasyArchive .hmGrid .hmBtn small {
      color:#d9b84e !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSectionTitle {
      min-height:34px !important;
      padding:6px 10px !important;
      background:linear-gradient(#234969,#0a2034) !important;
      border:1px solid #526b7e !important;
      border-bottom-color:#9a782b !important;
      font-size:14px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button {
      min-height:34px !important;
      background:linear-gradient(#203b50,#0a1823) !important;
      border-color:#526879 !important;
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button.on,
    body.historicalApkReference.classicFantasyArchive .tabs button.on,
    body.historicalApkReference.classicFantasyArchive .runeControlStrip button.on {
      color:#fff3bd !important;
      background:linear-gradient(#765b22,#2a210f) !important;
      border-color:#d4af43 !important;
      text-shadow:0 1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmNews button,
    body.historicalApkReference.classicFantasyArchive .hmNews .finalEmptyHomeRow {
      min-height:31px !important;
      padding-block:4px !important;
      background:#07131e !important;
      border-bottom:1px solid #2d4050 !important;
    }

    body.historicalApkReference.classicFantasyArchive .clsHead {
      background:linear-gradient(#284e6e,#0c2235) !important;
      border-bottom-color:#9a782b !important;
    }

    body.historicalApkReference.classicFantasyArchive .champGrid,
    body.historicalApkReference.classicFantasyArchive .classicPortraitGrid {
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      gap:10px !important;
      padding:8px 10px !important;
      background:#030a11 !important;
    }

    body.historicalApkReference.classicFantasyArchive .champCell {
      aspect-ratio:1 / 1 !important;
      border:1px solid #667886 !important;
      box-shadow:inset 0 0 0 1px #02070b !important;
    }

    body.historicalApkReference.classicFantasyArchive .cgName {
      padding:2px 3px !important;
      color:#fff !important;
      background:rgba(0,0,0,.72) !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvHead {
      grid-template-columns:120px minmax(0,1fr) !important;
      gap:10px !important;
      margin:7px !important;
      padding:10px !important;
      background:linear-gradient(135deg,#0a1722,#11181b) !important;
      border:3px double #856b2c !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvHead .pic,
    body.historicalApkReference.classicFantasyArchive .cvHead .pic img {
      width:120px !important;
      height:120px !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvLinks {
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      gap:7px !important;
      padding:8px !important;
      background:#06111b !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvLinks button {
      min-height:43px !important;
      background:linear-gradient(#2c465a,#101b23) !important;
      border-color:#5b7180 !important;
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .split {
      display:grid !important;
      grid-template-columns:130px minmax(0,1fr) !important;
      align-items:start !important;
      gap:0 !important;
      overflow:hidden !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .tree2 {
      min-width:0 !important;
      background:#071827 !important;
      border-right:1px solid #5b6f7e !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .tree2 button {
      min-height:38px !important;
      padding:6px 8px !important;
      background:linear-gradient(#19344a,#081622) !important;
      border-bottom:1px solid #304757 !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist {
      min-width:0 !important;
      background:#060e15 !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist button {
      min-height:54px !important;
      background:linear-gradient(#142534,#08121b) !important;
      border-bottom:1px solid #2c414f !important;
    }

    body.historicalApkReference.classicFantasyArchive .historicalMasteryTabs {
      display:grid !important;
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      gap:2px !important;
      padding:5px !important;
      background:#07131d !important;
      border-bottom:1px solid #947429 !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryShell.masteryEditorial .archiveSectionHeader > b {
      font-size:10px !important;
      white-space:nowrap !important;
    }

    body.historicalApkReference.classicFantasyArchive .historicalMasteryTabs button {
      min-height:38px !important;
      color:#dfd7c3 !important;
      background:linear-gradient(#29455b,#0b1720) !important;
      border:1px solid #5d7180 !important;
      border-radius:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .historicalMasteryTabs button.on {
      color:#fff0b8 !important;
      background:linear-gradient(#73561d,#251d0d) !important;
      border-color:#d3ad3e !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryEditorialGrid {
      display:block !important;
      padding:7px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryEditorialSection[hidden] {
      display:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryEditorialSection > header {
      background:linear-gradient(#244866,#0c2031) !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRows {
      display:grid !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:7px !important;
      padding:8px !important;
      background:#040b11 !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow {
      min-width:0 !important;
      padding:7px !important;
      align-items:flex-start !important;
      background:linear-gradient(#152938,#08121a) !important;
      border:1px solid #425b6d !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellIcon,
    body.historicalApkReference.classicFantasyArchive .spellIcon img {
      width:46px !important;
      height:46px !important;
      flex:0 0 46px !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow h4 {
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow p {
      margin-top:4px !important;
      font-size:9px !important;
      line-height:1.45 !important;
    }

    body.historicalApkReference.classicFantasyArchive .runeEditorialLayout,
    body.historicalApkReference.classicFantasyArchive .runeClientLayout {
      background:#06111b !important;
    }

    body.historicalApkReference.classicFantasyArchive .set,
    body.historicalApkReference.classicFantasyArchive .settingsActions .card,
    body.historicalApkReference.classicFantasyArchive .communityAccountCard {
      background:linear-gradient(#183247,#091620) !important;
      border:1px solid #50697a !important;
    }

    body.historicalApkReference.classicFantasyArchive #floatingLegalFooter {
      background:linear-gradient(#102330,#050b10) !important;
      border-top:3px double #856821 !important;
    }

    @media (max-width:360px) {
      body.historicalApkReference.classicFantasyArchive .app > header {
        grid-template-columns:72px minmax(0,1fr) 54px !important;
      }

      body.historicalApkReference.classicFantasyArchive .hmRot {
        gap:4px !important;
        padding-inline:5px !important;
      }

      body.historicalApkReference.classicFantasyArchive .rotC {
        width:42px !important;
        height:42px !important;
      }

      body.historicalApkReference.classicFantasyArchive .champGrid,
      body.historicalApkReference.classicFantasyArchive .classicPortraitGrid {
        gap:7px !important;
        padding-inline:7px !important;
      }

      body.historicalApkReference.classicFantasyArchive .cvHead {
        grid-template-columns:104px minmax(0,1fr) !important;
      }

      body.historicalApkReference.classicFantasyArchive .cvHead .pic,
      body.historicalApkReference.classicFantasyArchive .cvHead .pic img {
        width:104px !important;
        height:104px !important;
      }

      body.historicalApkReference.classicFantasyArchive .itemEditorial .split {
        grid-template-columns:116px minmax(0,1fr) !important;
      }

      body.historicalApkReference.classicFantasyArchive .spellRows {
        grid-template-columns:1fr !important;
      }
    }

    @media (max-width:412px) {
      body.classicFantasyArchive .app > header {
        grid-template-columns:82px minmax(0,1fr) 60px !important;
      }
      body.classicFantasyArchive .app > header button {
        padding-inline:5px !important;
        font-size:11px !important;
      }
      body.classicFantasyArchive .itemEditorial .ilist,
      body.classicFantasyArchive .runeEditorialLayout {
        grid-template-columns:1fr !important;
      }
      body.classicFantasyArchive .dossierRates {
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      }
    }

    @media (max-width:360px) {
      body.classicFantasyArchive .app > header {
        grid-template-columns:76px minmax(0,1fr) 54px !important;
      }
      body.classicFantasyArchive .app > header #home {
        font-size:14px !important;
      }
      body.classicFantasyArchive .hm {
        padding-inline:3px !important;
      }
      body.classicFantasyArchive .hmGrid .hmBtn,
      body.classicFantasyArchive .hmQuick .hmBtn {
        padding-inline:5px !important;
        padding-right:18px !important;
        font-size:11px !important;
      }
      body.classicFantasyArchive .cvHead {
        margin:5px !important;
        padding:10px !important;
      }
      body.classicFantasyArchive .cvLinks {
        grid-template-columns:1fr !important;
      }
    }

    @media (max-width:320px) {
      body.classicFantasyArchive .app > header {
        grid-template-columns:70px minmax(0,1fr) 50px !important;
      }
      body.classicFantasyArchive .app > header button {
        font-size:11px !important;
      }
      body.classicFantasyArchive .app > header #home {
        font-size:13px !important;
      }
      body.classicFantasyArchive .hmTabs button,
      body.classicFantasyArchive .hmNews button,
      body.classicFantasyArchive .hmBtn {
        font-size:11px !important;
      }
      body.classicFantasyArchive .champGrid,
      body.classicFantasyArchive .clsPage .classicPortraitGrid {
        gap:3px !important;
        padding:4px !important;
      }
    }

    /* ========================================================
       DEVICE-OBSERVED 218 INTERNAL INTERFACE — 2026-08-29

       Visual structure only.  This layer deliberately uses CSS geometry and
       the current app's already-approved content assets.  It does not load the
       historical APK backgrounds, buttons, advertisements, datasets, storage,
       networking, or package behavior.
       ======================================================== */

    body.historicalApkReference.classicFantasyArchive {
      --device218-bg:#05080a;
      --device218-panel:#10171b;
      --device218-panel-2:#172327;
      --device218-line:#3d4a4e;
      --device218-line-soft:#252f32;
      --device218-text:#edf0ef;
      --device218-muted:#aab4b3;
      --device218-cyan:#9dd9d6;
      --device218-teal:#2b6f68;
      --device218-blue:#17314a;
      background:#000 !important;
      color:var(--device218-text) !important;
      font-family:Arial,"Noto Sans KR","Malgun Gothic",sans-serif !important;
      font-size:13px !important;
    }

    body.historicalApkReference.classicFantasyArchive .app {
      grid-template-rows:38px minmax(0,1fr) !important;
      background:
        radial-gradient(circle at 84% 35%,rgba(75,29,31,.22),transparent 36%),
        linear-gradient(135deg,#11191c,#040708 72%) !important;
      border-inline:1px solid #20282b !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header {
      grid-template-columns:64px minmax(0,1fr) 52px !important;
      height:38px !important;
      padding:2px 3px !important;
      background:linear-gradient(#1b2327,#080b0d 55%,#11171a) !important;
      border-top:1px solid #5b6668 !important;
      border-bottom:1px solid #333d40 !important;
      box-shadow:inset 0 1px rgba(255,255,255,.08),0 1px 4px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header button {
      height:32px !important;
      padding-inline:5px !important;
      color:#f1f2f1 !important;
      background:linear-gradient(#28343a,#0b1114 55%,#172126) !important;
      border:1px solid #59666a !important;
      box-shadow:inset 0 1px rgba(255,255,255,.09),inset 0 -1px #000 !important;
      font-family:inherit !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #settings {
      color:#f1f2f1 !important;
      background:linear-gradient(#28343a,#0b1114 55%,#172126) !important;
      border-color:#59666a !important;
      text-shadow:0 1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #home {
      color:#f0f2f1 !important;
      font-family:inherit !important;
      font-size:14px !important;
      font-weight:500 !important;
      text-shadow:0 1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #home::after {
      content:none !important;
      display:none !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive > .app,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive.finalHasLegalFooter > .app {
      grid-template-rows:38px auto !important;
    }

    body.historicalApkReference.classicFantasyArchive .bar,
    body.historicalApkReference.classicFantasyArchive .cvBar,
    body.historicalApkReference.classicFantasyArchive .backbar,
    body.historicalApkReference.classicFantasyArchive .boardTop,
    body.historicalApkReference.classicFantasyArchive .tabs,
    body.historicalApkReference.classicFantasyArchive .runeControlStrip,
    body.historicalApkReference.classicFantasyArchive .archiveSectionHeader {
      color:var(--device218-cyan) !important;
      background:linear-gradient(#1b2529,#0b1012 62%,#131b1e) !important;
      border-bottom:1px solid var(--device218-line) !important;
      box-shadow:inset 0 1px rgba(255,255,255,.06),inset 0 -1px #000 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .backbar {
      min-height:34px !important;
      padding:3px 6px !important;
    }

    body.historicalApkReference.classicFantasyArchive .backbar button {
      min-height:28px !important;
      padding:0 10px !important;
      color:#eef0ef !important;
      background:linear-gradient(#29373d,#0c1316) !important;
      border:1px solid #5b686b !important;
      font-family:inherit !important;
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hm {
      display:flex !important;
      flex-direction:column !important;
      gap:0 !important;
      padding:0 6px 8px !important;
      background:
        radial-gradient(circle at 50% 26%,rgba(99,33,36,.21),transparent 34%),
        linear-gradient(rgba(7,10,12,.93),rgba(4,7,8,.98)) !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmFeature {
      display:contents !important;
    }

    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view > .hm > .hmFeature {
      display:contents !important;
      width:auto !important;
      height:auto !important;
      min-height:0 !important;
      margin:0 !important;
      overflow:visible !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmLogo { order:1 !important; }
    body.historicalApkReference.classicFantasyArchive .hmRot { order:2 !important; }
    body.historicalApkReference.classicFantasyArchive .hmStrip { order:3 !important; }
    body.historicalApkReference.classicFantasyArchive .hmSearch { order:4 !important; }
    body.historicalApkReference.classicFantasyArchive .hmQuick { order:5 !important; }
    body.historicalApkReference.classicFantasyArchive .hmGrid { order:6 !important; }
    body.historicalApkReference.classicFantasyArchive .hmPoster { order:7 !important; }
    body.historicalApkReference.classicFantasyArchive .hmSectionTitle { order:8 !important; }
    body.historicalApkReference.classicFantasyArchive .hmTabs { order:9 !important; }
    body.historicalApkReference.classicFantasyArchive .hmNews { order:10 !important; }
    body.historicalApkReference.classicFantasyArchive .hmAd { order:11 !important; }

    body.historicalApkReference.classicFantasyArchive .hmLogo {
      min-height:30px !important;
      padding:5px 10px !important;
      color:#e8eceb !important;
      background:linear-gradient(90deg,#1c282d,#090d0f) !important;
      border:1px solid #4b5659 !important;
      font-family:inherit !important;
      font-size:11px !important;
      letter-spacing:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmLogo small {
      color:#aeb7b6 !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmRot {
      grid-template-columns:repeat(5,minmax(0,1fr)) !important;
      grid-template-rows:46px !important;
      min-height:56px !important;
      gap:8px !important;
      padding:5px 10px !important;
      background:linear-gradient(#141b1e,#050708) !important;
      border:1px solid #343e41 !important;
    }

    body.historicalApkReference.classicFantasyArchive .rotC {
      width:42px !important;
      height:42px !important;
      justify-self:center !important;
      border:1px solid #727c7d !important;
      border-radius:0 !important;
      box-shadow:inset 0 0 0 1px #050708,0 1px 2px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .rotC small {
      padding:1px 2px !important;
      color:#fff !important;
      background:rgba(0,0,0,.74) !important;
      font-size:8px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmStrip {
      min-height:22px !important;
      padding:3px 7px !important;
      color:#d9dedd !important;
      background:linear-gradient(#1b2529,#090d0f) !important;
      border:1px solid #3d494c !important;
      font-family:inherit !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmStrip span {
      color:var(--device218-cyan) !important;
      font-family:inherit !important;
      font-size:9px !important;
      letter-spacing:.04em !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch {
      margin-top:5px !important;
      padding:4px !important;
      background:#0b1113 !important;
      border:1px solid #3e4b4e !important;
      box-shadow:inset 0 0 0 1px #020304 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch input,
    body.historicalApkReference.classicFantasyArchive .hmSearch button {
      min-height:32px !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch input {
      color:#e8eeee !important;
      background:#0a1113 !important;
      border-color:#334246 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch button {
      color:#eef1f0 !important;
      background:linear-gradient(#29383e,#0c1316) !important;
      border-color:#58666a !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmQuick,
    body.historicalApkReference.classicFantasyArchive .hmGrid {
      display:grid !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:7px 12px !important;
      margin-top:7px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmQuick .hmBtn,
    body.historicalApkReference.classicFantasyArchive .hmGrid .hmBtn {
      min-height:46px !important;
      padding:0 12px !important;
      color:#f0f2f1 !important;
      background:
        linear-gradient(rgba(41,57,65,.92),rgba(8,15,19,.96) 54%,rgba(21,31,36,.96)) !important;
      border:1px solid #56666c !important;
      border-left:1px solid #56666c !important;
      box-shadow:inset 0 1px rgba(255,255,255,.09),inset 0 -1px #000 !important;
      font-family:inherit !important;
      font-size:12px !important;
      font-weight:500 !important;
      text-align:center !important;
      text-shadow:0 1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmQuick .hmBtn small,
    body.historicalApkReference.classicFantasyArchive .hmGrid .hmBtn small {
      display:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster {
      width:100% !important;
      min-height:50px !important;
      margin:7px 0 0 !important;
      padding:7px 10px !important;
      color:#e9eceb !important;
      text-align:left !important;
      background:linear-gradient(90deg,#182327,#090d0f) !important;
      border:1px solid #485458 !important;
      box-shadow:inset 0 0 0 1px #080b0d !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster span,
    body.historicalApkReference.classicFantasyArchive .hmPoster b,
    body.historicalApkReference.classicFantasyArchive .hmPoster small {
      color:inherit !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster span { font-size:9px !important; }
    body.historicalApkReference.classicFantasyArchive .hmPoster b { font-size:15px !important; }
    body.historicalApkReference.classicFantasyArchive .hmPoster small { color:#aeb8b7 !important; }

    body.historicalApkReference.classicFantasyArchive .hmSectionTitle {
      min-height:30px !important;
      margin-top:8px !important;
      padding:5px 8px !important;
      color:var(--device218-cyan) !important;
      background:linear-gradient(#1c282c,#090d0f) !important;
      border:1px solid #3d494c !important;
      font-family:inherit !important;
      font-size:12px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button,
    body.historicalApkReference.classicFantasyArchive .hmNews button {
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button {
      min-height:31px !important;
      color:#cdd4d3 !important;
      background:linear-gradient(#202c31,#0a0f11) !important;
      border-color:#465358 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button.on {
      color:#fff !important;
      background:linear-gradient(#356e68,#142b29) !important;
      border-color:#77a39f !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmNews button,
    body.historicalApkReference.classicFantasyArchive .hmNews .finalEmptyHomeRow {
      min-height:30px !important;
      color:#dce1e0 !important;
      background:#080d0f !important;
      border-bottom:1px solid #283336 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmAd {
      color:#929e9d !important;
      background:#070b0c !important;
      border-color:#293336 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .clist {
      background:#050809 !important;
      border:1px solid #3b4649 !important;
    }

    body.historicalApkReference.classicFantasyArchive .clFilter {
      gap:5px !important;
      padding:7px 9px 4px !important;
      background:linear-gradient(#161f22,#090d0f) !important;
    }

    body.historicalApkReference.classicFantasyArchive .clFilter .ck,
    body.historicalApkReference.classicFantasyArchive .clOnly .ck {
      color:#e5e9e8 !important;
      background:#090d0f !important;
      border:1px solid #465256 !important;
      font-family:inherit !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .clFilter .ck i,
    body.historicalApkReference.classicFantasyArchive .clOnly .ck i {
      border-color:#6d797b !important;
      background:#030405 !important;
    }

    body.historicalApkReference.classicFantasyArchive .clFilter .ck.on i,
    body.historicalApkReference.classicFantasyArchive .clOnly .ck.on i {
      background:var(--device218-teal) !important;
      box-shadow:inset 0 0 0 2px #09100f !important;
    }

    body.historicalApkReference.classicFantasyArchive .clOnly,
    body.historicalApkReference.classicFantasyArchive .clFind {
      color:#c7cfce !important;
      background:#0b1113 !important;
      border-color:#344145 !important;
    }

    body.historicalApkReference.classicFantasyArchive .clFind select,
    body.historicalApkReference.classicFantasyArchive .clFind input {
      min-height:32px !important;
      color:#e8eeee !important;
      background:#06090a !important;
      border:1px solid #586467 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .champGrid,
    body.historicalApkReference.classicFantasyArchive .classicPortraitGrid {
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      gap:5px !important;
      padding:6px !important;
      background:#020405 !important;
    }

    body.historicalApkReference.classicFantasyArchive .champCell {
      aspect-ratio:.94 / 1 !important;
      border:1px solid #151a1c !important;
      box-shadow:0 0 0 1px #4e595c,inset 0 0 0 1px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .champCell u {
      top:20px !important;
      right:2px !important;
      padding:1px 2px !important;
      color:#c8d0cf !important;
      background:rgba(0,0,0,.72) !important;
      border:0 !important;
      font-size:6px !important;
    }

    body.historicalApkReference.classicFantasyArchive .cgName {
      padding:2px !important;
      color:#fff !important;
      background:rgba(0,0,0,.78) !important;
      font-family:inherit !important;
      font-size:9px !important;
      font-weight:500 !important;
    }

    body.historicalApkReference.classicFantasyArchive .cv {
      color:#edf0ef !important;
      background:
        linear-gradient(rgba(12,17,19,.97),rgba(5,8,9,.985)),
        radial-gradient(circle at 80% 20%,#2b3538,transparent 50%) !important;
      border:1px solid #4d595b !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvHead {
      grid-template-columns:120px minmax(0,1fr) !important;
      gap:10px !important;
      margin:6px !important;
      padding:8px !important;
      color:#f0f2f1 !important;
      background:linear-gradient(135deg,#171f22,#080b0d) !important;
      border:1px solid #4e595c !important;
      box-shadow:inset 0 0 0 1px #020304 !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvHead .pic,
    body.historicalApkReference.classicFantasyArchive .cvHead .pic img {
      width:120px !important;
      height:120px !important;
    }

    body.historicalApkReference.classicFantasyArchive .archiveEyebrow {
      display:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvInfo h2,
    body.historicalApkReference.classicFantasyArchive .cvNick,
    body.historicalApkReference.classicFantasyArchive .cvTag,
    body.historicalApkReference.classicFantasyArchive .cvInfo h2 {
      font-size:22px !important;
      font-weight:500 !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvInfo h2 u {
      color:#b7c1c0 !important;
      background:#202a2e !important;
      border-color:#4e5a5d !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvLinks {
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:0 !important;
      padding:4px 10px 8px !important;
      background:#080c0e !important;
      border-block:1px solid #313b3e !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvLinks button {
      position:relative !important;
      min-height:38px !important;
      padding:5px 8px 5px 34px !important;
      color:#eef1f0 !important;
      background:transparent !important;
      border:0 !important;
      border-bottom:1px solid #293336 !important;
      box-shadow:none !important;
      font-family:inherit !important;
      font-size:13px !important;
      text-align:left !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvLinks button::before {
      content:"" !important;
      position:absolute !important;
      left:8px !important;
      top:10px !important;
      width:15px !important;
      height:15px !important;
      border:1px solid #8c9999 !important;
      background:linear-gradient(135deg,#d7dddd,#667476) !important;
      box-shadow:inset 0 0 0 3px #12191c !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvBar {
      min-height:30px !important;
      margin:0 !important;
      padding:6px 10px !important;
      color:#3f8fd2 !important;
      background:#080c0e !important;
      border-top:1px solid #2e383b !important;
      border-bottom:1px solid #2e383b !important;
      font-family:inherit !important;
      font-size:13px !important;
      font-weight:500 !important;
    }

    body.historicalApkReference.classicFantasyArchive .dossierRates {
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:4px !important;
      padding:8px 10px !important;
      background:#070b0c !important;
    }

    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate {
      --rate-color:#4c963d;
      position:relative !important;
      display:grid !important;
      grid-template-columns:68px minmax(0,1fr) 38px !important;
      align-items:center !important;
      min-height:21px !important;
      padding:0 !important;
      color:#e9edec !important;
      background:transparent !important;
      border:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate:nth-child(2) { --rate-color:#c02626; }
    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate:nth-child(3) { --rate-color:#263fc0; }
    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate:nth-child(4) { --rate-color:#7440a5; }

    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate::before {
      content:"" !important;
      grid-column:2 !important;
      grid-row:1 !important;
      height:11px !important;
      background:#010203 !important;
      border:1px solid #222b2e !important;
      box-shadow:inset 0 1px 3px #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate::after {
      content:"" !important;
      grid-column:2 !important;
      grid-row:1 !important;
      width:var(--historical-rate,0%) !important;
      height:9px !important;
      margin-left:1px !important;
      background:var(--rate-color) !important;
    }

    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate span {
      grid-column:1 !important;
      grid-row:1 !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .dossierRates .cvRate b {
      grid-column:3 !important;
      grid-row:1 !important;
      color:#cdd4d3 !important;
      font-size:9px !important;
      text-align:right !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvStats {
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:1px !important;
      padding:6px 12px 10px !important;
      background:#070b0c !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvS {
      display:grid !important;
      grid-template-columns:150px minmax(0,1fr) !important;
      min-height:19px !important;
      padding:1px 0 !important;
      color:#eef0ef !important;
      background:transparent !important;
      border:0 !important;
      font-family:inherit !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .cvS b { font-weight:500 !important; }
    body.historicalApkReference.classicFantasyArchive .cvS em { color:#ff3030 !important; }

    body.historicalApkReference.classicFantasyArchive .cvSkill,
    body.historicalApkReference.classicFantasyArchive .cvSkins li {
      color:#e8eceb !important;
      background:#080d0f !important;
      border-color:#293336 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemPage,
    body.historicalApkReference.classicFantasyArchive .itemEditorial .box {
      color:#dce4e3 !important;
      background:#071012 !important;
      border-color:#4c585b !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .bar {
      min-height:32px !important;
      color:var(--device218-cyan) !important;
      font-family:inherit !important;
      font-size:14px !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .archiveLead {
      margin:5px !important;
      padding:6px 8px !important;
      color:#aeb9b8 !important;
      background:#0d1517 !important;
      border:1px solid #344044 !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .search {
      margin:5px !important;
      padding:3px !important;
      background:#091012 !important;
      border:1px solid #3b474a !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .search input,
    body.historicalApkReference.classicFantasyArchive .itemEditorial .search button {
      min-height:30px !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .split {
      display:grid !important;
      grid-template-columns:130px minmax(0,1fr) !important;
      align-items:start !important;
      gap:0 !important;
      overflow:hidden !important;
      border:1px solid #3d494c !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .tree2 {
      min-width:0 !important;
      background:linear-gradient(#102022,#071012) !important;
      border-right:1px solid #445154 !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .tree2 button {
      min-height:30px !important;
      padding:4px 8px !important;
      color:#2f8c87 !important;
      background:linear-gradient(#122022,#081012) !important;
      border-bottom:1px solid #263235 !important;
      font-family:inherit !important;
      font-size:10px !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .tree2 button.on {
      color:#fff !important;
      background:#2d746d !important;
      border-color:#77a8a4 !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist {
      min-width:0 !important;
      background:#050809 !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist button {
      min-height:54px !important;
      padding:4px 6px !important;
      color:var(--device218-cyan) !important;
      background:#050809 !important;
      border-bottom:1px solid #202a2d !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemTextMarker {
      width:46px !important;
      height:46px !important;
      color:#9ccfcb !important;
      background:linear-gradient(135deg,#1e3436,#071012) !important;
      border:1px solid #45575a !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist b { font-size:11px !important; }
    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist small { color:#8fc4c0 !important; font-size:8px !important; }
    body.historicalApkReference.classicFantasyArchive .itemEditorial .ilist em { color:#d9cf79 !important; font-size:9px !important; }

    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery {
      box-sizing:border-box !important;
      width:auto !important;
      max-width:100% !important;
      margin:4px !important;
      padding:5px !important;
      overflow-x:clip !important;
      color:#eef0ef !important;
      background:#050809 !important;
      border:1px solid #4b5659 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery > h3 {
      margin:2px 2px 6px !important;
      color:#e6eae9 !important;
      font-family:inherit !important;
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery > h3 small {
      color:#e8dec2 !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery .masteryTabs {
      display:grid !important;
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      gap:2px !important;
      margin-bottom:5px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery .masteryTabs button {
      min-height:48px !important;
      color:#c5cccb !important;
      background:linear-gradient(#252b2e,#0b0d0e) !important;
      border:1px solid #3f484b !important;
      font-family:inherit !important;
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery .masteryTabs button.on {
      color:#fff !important;
      background:linear-gradient(#d2d2d2,#707070) !important;
      border-color:#b5b5b5 !important;
      text-shadow:0 1px #333 !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryBoards {
      display:block !important;
      width:100% !important;
      min-width:0 !important;
      border:1px solid #4b5659 !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryColumn {
      display:flex !important;
      flex-direction:column !important;
      width:100% !important;
      min-width:0 !important;
      min-height:600px !important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.06) !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryColumn.branch-0 {
      background:radial-gradient(circle at 50% 35%,rgba(210,45,33,.7),rgba(62,5,5,.97) 62%),#320505 !important;
    }
    body.historicalApkReference.classicFantasyArchive .masteryColumn.branch-1 {
      background:radial-gradient(circle at 50% 35%,rgba(36,113,187,.72),rgba(4,27,60,.97) 62%),#041b3a !important;
    }
    body.historicalApkReference.classicFantasyArchive .masteryColumn.branch-2 {
      background:radial-gradient(circle at 50% 35%,rgba(66,153,37,.72),rgba(11,53,8,.97) 62%),#0b3508 !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryColumnHead {
      padding:6px !important;
      color:#fff !important;
      background:rgba(0,0,0,.28) !important;
      border-bottom:1px solid rgba(255,255,255,.2) !important;
      font-size:12px !important;
      text-align:center !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryTreeGrid {
      display:grid !important;
      gap:5px !important;
      padding:9px 8px 14px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryRow {
      display:grid !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      gap:7px !important;
      min-height:82px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryCell.empty { visibility:hidden !important; }
    body.historicalApkReference.classicFantasyArchive .masteryCell.locked { opacity:.48 !important; }

    body.historicalApkReference.classicFantasyArchive .mnode {
      position:relative !important;
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:flex-start !important;
      width:100% !important;
      height:auto !important;
      min-height:75px !important;
      padding:4px 2px !important;
      color:#fff !important;
      background:rgba(0,0,0,.52) !important;
      border:1px solid #111 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .mnode.has { border-color:#d6cf67 !important; box-shadow:inset 0 0 0 1px #68a84b !important; }
    body.historicalApkReference.classicFantasyArchive .mnode.full { box-shadow:inset 0 0 0 2px #efe887 !important; }

    body.historicalApkReference.classicFantasyArchive .mnode .pic {
      position:relative !important;
      inset:auto !important;
      display:grid !important;
      place-items:center !important;
      width:46px !important;
      height:46px !important;
      border:1px solid #778183 !important;
      background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(0,0,0,.52)) !important;
    }

    body.historicalApkReference.classicFantasyArchive .mnode img { width:44px !important; height:44px !important; }

    body.historicalApkReference.classicFantasyArchive .mnode em {
      position:absolute !important;
      right:2px !important;
      bottom:2px !important;
      padding:1px 3px !important;
      color:#fff !important;
      background:#080b0d !important;
      border:1px solid #6b7476 !important;
      font-size:8px !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryLabel {
      display:-webkit-box !important;
      margin-top:3px !important;
      overflow:hidden !important;
      -webkit-box-orient:vertical !important;
      -webkit-line-clamp:2 !important;
      color:#fff !important;
      font-size:8px !important;
      line-height:1.15 !important;
      text-align:center !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryTotals {
      display:grid !important;
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      color:#e7eceb !important;
      background:#111719 !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryTotals div {
      padding:5px 2px !important;
      border:1px solid #3d474a !important;
      font-size:9px !important;
      text-align:center !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryDetail {
      margin-top:5px !important;
      color:#e7eceb !important;
      background:#111719 !important;
      border:1px solid #3d474a !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .masteryDetail small,
    body.historicalApkReference.classicFantasyArchive .masteryDetail p,
    body.historicalApkReference.classicFantasyArchive .masteryDetail em,
    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery .hint,
    body.historicalApkReference.classicFantasyArchive .masteryShell.classicMastery .mnames {
      color:#aeb9b8 !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellArchive {
      color:#e9edec !important;
      background:linear-gradient(#111719,#050809) !important;
      border:1px solid #465154 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellArchive > h3 {
      min-height:32px !important;
      margin:0 !important;
      padding:7px 10px !important;
      color:var(--device218-cyan) !important;
      background:#0b1012 !important;
      border-bottom:1px solid #3d484b !important;
      font-family:inherit !important;
      font-size:12px !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRows {
      display:grid !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      gap:13px 7px !important;
      padding:14px 8px 28px !important;
      background:#070b0c !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow {
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:flex-start !important;
      min-width:0 !important;
      min-height:84px !important;
      padding:3px 1px !important;
      color:#eef0ef !important;
      background:transparent !important;
      border:0 !important;
      font-family:inherit !important;
      text-align:center !important;
      cursor:pointer !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow:focus-visible {
      outline:2px solid #87b8b4 !important;
      outline-offset:2px !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellIcon,
    body.historicalApkReference.classicFantasyArchive .spellIcon img {
      width:52px !important;
      height:52px !important;
      flex:0 0 52px !important;
      border-color:#687477 !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow > div {
      width:100% !important;
      min-width:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow h4 {
      margin:3px 0 0 !important;
      color:#eef0ef !important;
      font-family:inherit !important;
      font-size:9px !important;
      font-weight:500 !important;
      line-height:1.2 !important;
      text-align:center !important;
      overflow-wrap:anywhere !important;
    }

    body.historicalApkReference.classicFantasyArchive .spellRow h4 small,
    body.historicalApkReference.classicFantasyArchive .spellRow p {
      display:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .legacy.settings {
      min-height:calc(100dvh - 76px) !important;
      padding:8px !important;
      color:#e7ebea !important;
      background:linear-gradient(135deg,#141b1e,#050809 72%) !important;
      border:1px solid #465154 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .legacy.settings h2 {
      margin:0 0 8px !important;
      padding:5px 8px !important;
      color:var(--device218-cyan) !important;
      background:#0a0f11 !important;
      border-bottom:1px solid #3d484b !important;
      font-family:inherit !important;
      font-size:14px !important;
      font-weight:500 !important;
    }

    body.historicalApkReference.classicFantasyArchive .cmsDelivery {
      display:grid !important;
      grid-template-columns:120px minmax(0,1fr) !important;
      align-items:center !important;
      min-height:44px !important;
      padding:7px 9px !important;
      color:#e8eceb !important;
      background:#0c1214 !important;
      border:1px solid #384347 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive .settingsActions {
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:0 !important;
      margin-top:8px !important;
      border:1px solid #3e494c !important;
    }

    body.historicalApkReference.classicFantasyArchive .settingsActions .card {
      position:relative !important;
      display:block !important;
      min-height:42px !important;
      padding:8px 42px 8px 12px !important;
      color:#e9edec !important;
      background:linear-gradient(#182225,#090d0f) !important;
      border:0 !important;
      border-bottom:1px solid #313c3f !important;
      box-shadow:none !important;
      font-family:inherit !important;
      font-size:11px !important;
      font-weight:400 !important;
      text-align:left !important;
    }

    body.historicalApkReference.classicFantasyArchive .settingsActions .card::after {
      content:"" !important;
      position:absolute !important;
      right:14px !important;
      top:50% !important;
      width:11px !important;
      height:11px !important;
      transform:translateY(-50%) !important;
      border:2px solid #7f8a8c !important;
      border-radius:50% !important;
      box-shadow:inset 0 0 0 3px #111719 !important;
      background:#3f4a4d !important;
    }

    body.historicalApkReference.classicFantasyArchive .settingsActions .card:active::after,
    body.historicalApkReference.classicFantasyArchive .settingsActions .card:focus-visible::after {
      background:#76d31e !important;
    }

    body.historicalApkReference.classicFantasyArchive .runeEditorial,
    body.historicalApkReference.classicFantasyArchive .runeClient,
    body.historicalApkReference.classicFantasyArchive .runeEditorialLayout,
    body.historicalApkReference.classicFantasyArchive .runeClientLayout {
      color:#dfe6e5 !important;
      background:#071012 !important;
      border-color:#465154 !important;
      font-family:inherit !important;
    }

    body.historicalApkReference.classicFantasyArchive #floatingLegalFooter {
      color:#b8c0bf !important;
      background:linear-gradient(#121a1d,#050708) !important;
      border-top:1px solid #495457 !important;
      font-family:inherit !important;
    }

    /* ==========================================================
       DEVICE-OBSERVED 218 HOME + CHAMPION LIST — USER REFERENCES
       Layout-only reconstruction with current app records/assets.
       ========================================================== */

    body.historicalApkReference.classicFantasyArchive .app > header {
      grid-template-columns:82px minmax(0,1fr) 64px !important;
      min-height:58px !important;
      height:58px !important;
      padding:4px 5px !important;
      color:#f3f3f3 !important;
      background:linear-gradient(#242424,#080808) !important;
      border-top:2px solid #bd9233 !important;
      border-bottom:2px solid #5d5d5d !important;
      box-shadow:inset 0 0 0 1px #050505 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive > .app,
    body.finalHomeNoScroll.historicalApkReference.classicFantasyArchive.finalHasLegalFooter > .app {
      grid-template-rows:58px minmax(0,1fr) !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #menu {
      color:#f4f4f4 !important;
      background:transparent !important;
      border:0 !important;
      font-size:14px !important;
      font-weight:700 !important;
      text-align:left !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #menu::first-letter {
      color:#d3ad36 !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #home {
      color:#fff !important;
      font-size:19px !important;
      font-weight:400 !important;
      text-align:center !important;
      letter-spacing:-.04em !important;
    }

    body.historicalApkReference.classicFantasyArchive .app > header #settings {
      min-height:43px !important;
      color:#151515 !important;
      background:linear-gradient(#ffc45d,#e88b13) !important;
      border:1px solid #f7c15b !important;
      box-shadow:inset 0 0 0 2px #d77e10 !important;
      font-size:13px !important;
      font-weight:700 !important;
    }

    body.historicalApkReference.classicFantasyArchive #view.homeView > .hm,
    body.historicalApkReference.classicFantasyArchive #view > .hm {
      display:grid !important;
      grid-template-columns:minmax(0,1fr) !important;
      grid-template-rows:none !important;
      gap:5px !important;
      min-height:calc(100dvh - 58px) !important;
      height:auto !important;
      padding:4px !important;
      overflow:visible !important;
      color:#161616 !important;
      background:#d8d8d5 !important;
      border:1px solid #8f8f8a !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmStrip,
    body.historicalApkReference.classicFantasyArchive .hmSectionTitle,
    body.historicalApkReference.classicFantasyArchive .hmAd {
      display:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch { order:1 !important; }
    body.historicalApkReference.classicFantasyArchive .hmLogo { order:2 !important; }
    body.historicalApkReference.classicFantasyArchive .hmRot { order:3 !important; }
    body.historicalApkReference.classicFantasyArchive .hmTabs { order:4 !important; }
    body.historicalApkReference.classicFantasyArchive .hmNews { order:5 !important; }
    body.historicalApkReference.classicFantasyArchive .hmPoster { order:6 !important; }
    body.historicalApkReference.classicFantasyArchive .hmQuick { order:7 !important; }
    body.historicalApkReference.classicFantasyArchive .hmGrid { order:8 !important; }

    body.historicalApkReference.classicFantasyArchive .hmSearch {
      display:grid !important;
      grid-template-columns:minmax(0,1fr) 58px !important;
      gap:4px !important;
      margin:0 !important;
      padding:0 4px 4px !important;
      background:#e5e5e3 !important;
      border:2px solid #aaa !important;
      box-shadow:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch::before {
      content:"챔피언 · 아이템 · 룬 검색" !important;
      grid-column:1 / -1 !important;
      min-height:29px !important;
      margin:0 -4px !important;
      padding:5px 7px !important;
      color:#f4f4f4 !important;
      background:linear-gradient(#333,#131313) !important;
      border-bottom:2px solid #999 !important;
      font-size:13px !important;
      line-height:1.2 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch input,
    body.historicalApkReference.classicFantasyArchive .hmSearch button {
      min-height:36px !important;
      height:36px !important;
      font-size:14px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch input {
      color:#222 !important;
      background:#fafafa !important;
      border:2px solid #3c3c3c !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmSearch button {
      color:#fff !important;
      background:linear-gradient(#747474,#050505) !important;
      border:0 !important;
      font-weight:700 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmLogo {
      min-height:30px !important;
      margin:0 !important;
      padding:5px 8px !important;
      color:#fff !important;
      background:linear-gradient(#353535,#121212) !important;
      border:1px solid #b98e30 !important;
      border-bottom:2px solid #9b9b9b !important;
      box-shadow:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmLogo b {
      color:#fff !important;
      font-size:13px !important;
      font-weight:500 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmLogo small {
      color:#cfcfcf !important;
      font-size:7px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmRot {
      display:grid !important;
      grid-template-columns:repeat(5,minmax(0,1fr)) !important;
      grid-template-rows:repeat(2,minmax(0,1fr)) !important;
      gap:4px !important;
      height:116px !important;
      min-height:116px !important;
      max-height:116px !important;
      margin:0 !important;
      padding:4px !important;
      overflow:hidden !important;
      background:#efefed !important;
      border:2px solid #aaa !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmRot .rotC {
      width:100% !important;
      height:100% !important;
      min-height:0 !important;
      aspect-ratio:auto !important;
      border:2px solid #090909 !important;
      box-shadow:none !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmRot .rotC small {
      padding:2px 1px !important;
      color:#fff !important;
      background:rgba(0,0,0,.64) !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs {
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      min-height:38px !important;
      margin:0 !important;
      padding:0 16px !important;
      background:#f0f0ee !important;
      border:2px solid #aaa !important;
      border-bottom:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button {
      min-height:37px !important;
      color:#8d8888 !important;
      background:#f0f0ee !important;
      border:0 !important;
      border-right:1px solid #c8c8c5 !important;
      font-size:13px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmTabs button.on {
      color:#111 !important;
      background:#f0f0ee !important;
      border-bottom:2px solid #111 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmNews {
      display:grid !important;
      grid-template-rows:repeat(7,30px) !important;
      height:216px !important;
      min-height:216px !important;
      max-height:216px !important;
      margin:0 !important;
      padding:5px 15px !important;
      color:#111 !important;
      background:#f0f0ee !important;
      border:2px solid #aaa !important;
      border-top:0 !important;
    }

    body.historicalApkReference.classicFantasyArchive #view.homeView > .hm .hmNews li,
    body.historicalApkReference.classicFantasyArchive #view.homeView > .hm .hmNews button,
    body.historicalApkReference.classicFantasyArchive #view.homeView > .hm .hmNews .finalEmptyHomeRow {
      min-height:29px !important;
      height:29px !important;
      color:#111 !important;
      background:#f0f0ee !important;
      border-color:#dededb !important;
      font-size:11px !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmNews .hmFeedDot {
      background:#b6b6b3 !important;
    }

    body.historicalApkReference.classicFantasyArchive .hmPoster,
    body.historicalApkReference.classicFantasyArchive .hmQuick,
    body.historicalApkReference.classicFantasyArchive .hmGrid {
      margin-top:0 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .backNav,
    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clsHead {
      display:none !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clsPage {
      margin:0 3px !important;
      padding:0 !important;
      background:#dfdfdc !important;
      border:2px solid #91918d !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .historicalChampionControls::before {
      content:"검색 옵션" !important;
      display:block !important;
      min-height:29px !important;
      padding:5px 7px !important;
      color:#fff !important;
      background:linear-gradient(#383838,#151515) !important;
      border-bottom:2px solid #aaa !important;
      font-size:13px !important;
      line-height:1.2 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFilter {
      display:grid !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      gap:2px !important;
      padding:5px 7px !important;
      background:#f0f0ee !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFilter .ck {
      display:grid !important;
      grid-template-columns:18px minmax(0,1fr) !important;
      align-items:center !important;
      min-width:0 !important;
      min-height:28px !important;
      padding:0 1px !important;
      color:#151515 !important;
      background:transparent !important;
      border:0 !important;
      font-size:10px !important;
      white-space:nowrap !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFilter .ck i {
      width:16px !important;
      height:16px !important;
      border:1px solid #c8c8c5 !important;
      border-radius:3px !important;
      background:#f8f8f7 !important;
      box-shadow:inset 0 0 4px #aaa !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFilter .ck.on i {
      background:linear-gradient(135deg,#f6f6f4 45%,#667995 46%,#667995 60%,#f6f6f4 61%) !important;
      box-shadow:inset 0 0 3px #aaa !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFind {
      display:grid !important;
      grid-template-columns:90px minmax(0,1fr) 62px !important;
      gap:5px !important;
      padding:3px 7px 7px !important;
      background:#f0f0ee !important;
      border:0 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFind select,
    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFind input {
      min-height:34px !important;
      height:34px !important;
      color:#171717 !important;
      background:#fff !important;
      border:1px solid #bbb8ac !important;
      font-size:12px !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .historicalChampionViewModes {
      display:grid !important;
      grid-template-columns:repeat(2,1fr) !important;
      gap:4px !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .historicalChampionViewModes button {
      min-width:0 !important;
      color:#232323 !important;
      background:linear-gradient(#f8f8f6,#bdbdb8) !important;
      border:1px solid #b7b7b2 !important;
      font-size:18px !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .historicalChampionViewModes button.on {
      box-shadow:inset 0 0 0 2px #777 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clsPage > h3.bar {
      min-height:29px !important;
      margin:0 !important;
      padding:5px 7px !important;
      color:#fff !important;
      background:linear-gradient(#353535,#111) !important;
      border-top:2px solid #b28b31 !important;
      border-bottom:2px solid #aaa !important;
      font-size:13px !important;
      font-weight:500 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .classicPortraitGrid {
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      gap:6px !important;
      padding:5px !important;
      background:#ecece9 !important;
      border:2px solid #aaa !important;
      border-top:0 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .classicPortraitGrid .champCell {
      aspect-ratio:1 / 1 !important;
      border:2px solid #050505 !important;
      box-shadow:none !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .classicPortraitGrid .cgName {
      top:auto !important;
      bottom:0 !important;
      padding:2px 0 !important;
      color:#fff !important;
      background:rgba(0,0,0,.72) !important;
      font-size:11px !important;
      line-height:1.25 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .classicPortraitGrid[data-historical-champion-view="list"] {
      grid-template-columns:1fr !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .classicPortraitGrid[data-historical-champion-view="list"] .champCell {
      aspect-ratio:auto !important;
      min-height:64px !important;
    }

    body.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] {
      width:calc(100vw - 16px) !important;
      max-width:none !important;
      height:calc(100dvh - 24px) !important;
      max-height:none !important;
      margin:auto !important;
      padding:0 !important;
      color:#15120b !important;
      background:linear-gradient(135deg,#e9cf78,#fff0a7 48%,#d9b75f) !important;
      border:4px double #8b5517 !important;
      box-shadow:0 0 0 4px #283444,0 18px 50px #000d !important;
      overflow:hidden !important;
    }

    body.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"]::backdrop {
      background:
        radial-gradient(circle at 50% 28%,rgba(64,79,102,.64),rgba(0,0,0,.96) 68%),
        #000 !important;
    }

    body.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #close {
      position:absolute !important;
      z-index:5 !important;
      top:8px !important;
      right:8px !important;
      width:34px !important;
      height:34px !important;
      color:#fff !important;
      background:#69778e !important;
      border:2px solid #9ba6b8 !important;
      border-radius:50% !important;
      font-size:24px !important;
      line-height:28px !important;
    }

    body.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #modalBody {
      height:100% !important;
      min-height:0 !important;
      max-height:100% !important;
      overflow:hidden !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchNotice {
      display:grid !important;
      grid-template-rows:auto minmax(0,1fr) auto auto !important;
      height:100% !important;
      color:#15120b !important;
      font-family:Malgun Gothic,Arial,sans-serif !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchNotice > header {
      display:block !important;
      min-height:72px !important;
      padding:15px 48px 10px 18px !important;
      color:#15120b !important;
      background:rgba(255,241,170,.45) !important;
      border-bottom:1px solid #a8772e !important;
      text-align:center !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchNotice > header small {
      display:block !important;
      color:#735117 !important;
      font-size:9px !important;
      letter-spacing:.08em !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchNotice > header h2 {
      margin:4px 0 0 !important;
      color:#15120b !important;
      font-size:22px !important;
      font-weight:500 !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchList {
      min-height:0 !important;
      padding:12px 15px !important;
      overflow-y:auto !important;
      overscroll-behavior:contain !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchList article {
      padding:0 0 14px !important;
      color:#15120b !important;
      border-bottom:1px solid rgba(123,77,20,.35) !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchList h3 {
      margin:10px 0 2px !important;
      color:#15120b !important;
      font-size:14px !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchList small {
      color:#765017 !important;
      font-size:9px !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchList p {
      margin:9px 0 0 !important;
      color:#15120b !important;
      font-size:12px !important;
      line-height:1.55 !important;
      white-space:pre-line !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchDisclaimer {
      margin:0 !important;
      padding:7px 12px !important;
      color:#573d14 !important;
      background:rgba(255,244,182,.55) !important;
      border-top:1px solid #ad7e35 !important;
      font-size:9px !important;
      text-align:center !important;
    }

    body.historicalApkReference.classicFantasyArchive .device218PatchNotice > [data-act="startupClose"] {
      min-height:42px !important;
      color:#fff !important;
      background:linear-gradient(#3e4650,#15191d) !important;
      border:0 !important;
      border-top:2px solid #8d6b31 !important;
      font-size:13px !important;
      font-weight:700 !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .champGrid .champCell[hidden] {
      display:none !important;
    }

    body.device218ChampionList.historicalApkReference.classicFantasyArchive .historicalChampionControls::before,
    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clsPage > h3.bar,
    body.device218ChampionList.historicalApkReference.classicFantasyArchive #persistentArchiveDock {
      display:none !important;
      content:none !important;
    }
    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFind {
      display:block !important;
      padding:5px !important;
      background:transparent !important;
    }
    body.device218ChampionList.historicalApkReference.classicFantasyArchive .clFind input {
      width:100% !important;
      box-sizing:border-box !important;
    }
    body.device218ChampionList.historicalApkReference.classicFantasyArchive,
    body.device218ChampionList.historicalApkReference.classicFantasyArchive #view {
      padding-bottom:0 !important;
      margin-bottom:0 !important;
      --nostalgia-archive-dock-height:0px !important;
    }

    @media (max-width:360px) {
      body.historicalApkReference.classicFantasyArchive .champGrid,
      body.historicalApkReference.classicFantasyArchive .classicPortraitGrid {
        grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      }

      body.historicalApkReference.classicFantasyArchive .spellRows {
        grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      }

      body.historicalApkReference.classicFantasyArchive .itemEditorial .split {
        grid-template-columns:112px minmax(0,1fr) !important;
      }

      body.historicalApkReference.classicFantasyArchive .cvHead {
        grid-template-columns:96px minmax(0,1fr) !important;
      }

      body.historicalApkReference.classicFantasyArchive .cvHead .pic,
      body.historicalApkReference.classicFantasyArchive .cvHead .pic img {
        width:96px !important;
        height:96px !important;
      }
    }

  `;

  document.head.appendChild(
    style
  );

  document.body.classList.add(
    'classicFantasyArchive',
    'historicalApkReference'
  );

  window.__LOL_LAYOUT_REPAIR__ =
    '2.0.4.23';
})();
/* FINAL_LAYOUT_REPAIR_2031_END */
