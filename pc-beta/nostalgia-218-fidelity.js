(() => {
  'use strict';

  const VERSION = '2.0.0.42';
  const MAX_POST_IMAGES = 4;
  const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
  const ALLOWED_POST_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const HOME_MENU_ROUTES = new Set([
    'champions', 'items', 'mastery', 'spells', 'runes', 'board',
  ]);
  let pendingPostImages = [];
  let originalGo = null;
  let initialized = false;
  let runeGeometryFrame = 0;

  const one = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const ui = (ko, ja, en) => ({ ja_JP: ja, en_US: en })[window.ClassicLocale?.getLocale()] || ko;

  function itemIconPath(item) {
    const id = String(item?.riotId || '');
    if (!/^\d+$/.test(id)) return '';
    return item.icon === `images/mode_classic/items/${id}.png`
      ? item.icon : `images/official_item/${id}.png`;
  }

  function removeBuilderFromNormalUi() {
    if (typeof menu !== 'undefined' && Array.isArray(menu['부가 기능'])) {
      menu['부가 기능'].splice(0, menu['부가 기능'].length,
        ...menu['부가 기능'].filter(([, route]) => route !== 'builder'));
    }
    if (typeof HOME_BTNS !== 'undefined' && Array.isArray(HOME_BTNS)) {
      for (let index = HOME_BTNS.length - 1; index >= 0; index -= 1) {
        if (HOME_BTNS[index] && HOME_BTNS[index][1] === 'builder') HOME_BTNS.splice(index, 1);
      }
    }
    all('[data-go="builder"]').forEach(node => node.remove());
  }

  function installRouteBoundary() {
    if (typeof go !== 'function' || originalGo) return;
    originalGo = go;
    go = function nostalgia218Go(route, ...rest) {
      if (String(route || '').replace(/^#/, '') === 'builder') {
        return originalGo('home', ...rest);
      }
      return originalGo(route, ...rest);
    };
    if (typeof S !== 'undefined' && S.view === 'builder') {
      S.view = 'home';
      history.replaceState(null, '', '#home');
    }
  }

  function installItemRenderer() {
    if (typeof itemsPage !== 'function' || itemsPage.__nostalgia218) return;
    itemsPage = function nostalgia218ItemsPage() {
      const currentCategory = S.cat;
      const query = (S.iq || '').trim().toLowerCase();
      const availableItems = classicItemsForCurrentApp();
      const visible = availableItems.filter(item => (
        itemMatchesCategory(item, currentCategory)
        && (!query || `${itemDisplayName(item.ko)} ${itemDisplayName(item.en)} ${itemDisplayName(itemName(item))} ${item.text || item.plaintext || ''}`.toLowerCase().includes(query))
      ));
      const categoryButton = (code, label, child) => `<button data-cat="${code == null ? 'all' : code}" class="${child ? 'kid ' : ''}${currentCategory === code ? 'on' : ''}">${child ? '· ' : ''}${label}</button>`;
      const categoryTree = CATS.map(group => `<div>${categoryButton(group.code, localized(group.label))}${(group.kids || []).map(child => categoryButton(child.code, localized(child.label), true)).join('')}</div>`).join('');
      const rows = visible.map(item => `<li><button data-item="${esc(item.cmsStableId || item.i)}"><img class="item218Icon" src="${itemIconPath(item)}" alt=""><span class="item218Copy"><b>${esc(itemDisplayName(itemName(item)))}</b><small>${appLocale.getLocale() === 'en_US' ? '' : esc(itemDisplayName(item.en))}${item.purchasable === false ? ` · ${localized('상점 구매 불가')}` : ''}</small><em>${esc(itemPriceText(item))}</em></span></button></li>`).join('');
      return `${backBar('home', '홈')}<div class="itemPage itemEditorial nostalgia218Items">${box(`${localized('아이템 기록')} <small>${availableItems.length}${appLocale.getLocale() === 'ko_KR' ? '개 · 클래식' : ` · ${localized('클래식')}`}</small>`, `
        <p class="archiveLead">${localized('클래식 아이템의 이름·가격·효과·조합과 아이콘을 한곳에서 확인할 수 있습니다.')}</p>
        <div class="search"><input id="itemQ" value="${esc(S.iq || '')}" placeholder="${localized('아이템 검색')}" aria-label="${localized('아이템 검색')}"><button data-act="itemSearch">${localized('검색')}</button></div>
        <div class="split"><nav class="tree2">${categoryTree}</nav><ul class="ilist">${rows || `<li class="hint">${localized('이 분류에 아이템이 없습니다.')}</li>`}</ul></div>
        <p class="hint">${ui(`현재 조건에 맞는 아이템 ${visible.length}개를 표시합니다.`, `現在の条件に合うアイテムを${visible.length}件表示します。`, `Showing ${visible.length} items matching the current filters.`)}</p>`)}${disclaimer()}</div>`;
    };
    itemsPage.__nostalgia218 = true;
  }

  function installRuneRenderer() {
    if (typeof runesPage !== 'function' || runesPage.__nostalgia218) return;
    const previousRunePaperPage = typeof runePaperPage === 'function' ? runePaperPage : null;
    runesPage = function nostalgia218RunesPage() {
      S.runeSet = 'classic';
      S.runeView = 'paper';
      if (!S.rslot) S.rslot = 'mark';
      const paper = previousRunePaperPage ? previousRunePaperPage() : runePaperPage();
      return `${backBar('home', '홈')}${paper}${disclaimer()}`;
    };
    runesPage.__nostalgia218 = true;
  }

  function decorateItemModal(itemId) {
    const item = typeof itemByI !== 'undefined' ? itemByI[itemId] : null;
    const head = one('#modalBody .itemDetail .imHead');
    if (!item || !head || head.dataset.nostalgia218 === 'true') return;
    if (one('.item218DetailIcon', head)) { head.dataset.nostalgia218 = 'true'; return; }
    const marker = one('.itemTextMarker', head);
    const image = document.createElement('img');
    image.className = 'item218DetailIcon';
    image.src = itemIconPath(item);
    image.alt = '';
    if (marker) marker.replaceWith(image); else head.prepend(image);
    head.dataset.nostalgia218 = 'true';
  }

  function cleanHomeFeed() {
    const feed = one('#view > .hm .hmNews');
    if (!feed) return;
    const tab = feed.dataset.feedTab || '';
    feed.classList.add('nostalgia218FixedFeed');
    feed.classList.toggle(
      'nostalgia218SharedFeedSurface',
      tab === '새소식' || tab === '커뮤니티',
    );
    if (tab !== '영상') {
      if (!feed.children.length) {
        feed.innerHTML = `<li class="nostalgia218EmptyFeed">${ui('표시할 기록이 없습니다.', '表示する記録はありません。', 'No records to show.')}</li>`;
      }
      for (const property of ['height', 'min-height', 'max-height']) {
        feed.style.removeProperty(property);
      }
      feed.dataset.nostalgia218Clean = 'true';
      return;
    }
    // Keep the real preview/player/status DOM. The previous native-video-only
    // check erased valid YouTube iframes and clickable preview stages.
    for (const property of ['height', 'min-height', 'max-height']) {
      feed.style.removeProperty(property);
    }
    feed.dataset.nostalgia218Clean = 'true';
  }

  function normalizeHomeButtons() {
    const home = one('#view > .hm');
    if (!home) return;
    const quick = one('.hmQuick', home);
    const grid = one('.hmGrid', home);
    if (!quick || !grid) return;
    all('.hmBtn[data-go]', home).forEach(button => {
      if (HOME_MENU_ROUTES.has(button.dataset.go || '')) {
        if (button.parentElement !== quick) quick.appendChild(button);
      } else {
        button.remove();
      }
    });
    quick.setAttribute('aria-label', localized('주 메뉴'));
    grid.setAttribute('aria-hidden', 'true');
    quick.dataset.nostalgia218Menu = String(all('.hmBtn[data-go]', quick).length);
  }

  function ensurePersistentArchiveDock() {
    let dock = one('#persistentArchiveDock');
    const poster = one('#view > .hm .hmPoster');

    if (!dock) {
      dock = document.createElement('button');
      dock.id = 'persistentArchiveDock';
      dock.type = 'button';
      dock.dataset.go = 'champions';
      dock.setAttribute('aria-label', localized('Classic Encyclopedia 챔피언 정보 열기'));
      dock.dataset.originalDescription = '챔피언과 아이템 기록을 살펴보세요.';
      dock.dataset.generatedArchiveDock = 'true';
      dock.innerHTML = `<img class="persistentArchiveIcon" src="images/branding/app-icon-512.png" alt=""><span>CLASSIC ENCYCLOPEDIA</span><b>${ui('클래식 아카이브', 'クラシックアーカイブ', 'Classic Archive')}</b><small>${localized('챔피언과 아이템 기록을 살펴보세요.')} ›</small>`;
      document.body.appendChild(dock);
    }

    if (poster) {
      const posterMarkup = poster.innerHTML.trim();
      const dockMarkup = '<img class="persistentArchiveIcon" src="images/branding/app-icon-512.png" alt="">' + posterMarkup;
      if (posterMarkup && dock.dataset.sourcePosterMarkup !== posterMarkup) {
        dock.innerHTML = dockMarkup;
        dock.dataset.sourcePosterMarkup = posterMarkup;
      }
      dock.dataset.go = poster.dataset.go || 'champions';
      dock.dataset.originalDescription = poster.dataset.originalDescription || '클래식의 챔피언과 아이템을 다시 만나보세요';
      delete dock.dataset.generatedArchiveDock;
      poster.dataset.nostalgia218SonaFeature = 'true';
    }

    localizePersistentArchiveDock();

    document.body.classList.add('nostalgia218HasArchiveDock');
    document.documentElement.style.setProperty('--nostalgia-archive-dock-height', '48px');
  }

  function localizePersistentArchiveDock() {
    const dock = one('#persistentArchiveDock');
    const locale = window.ClassicLocale;
    if (!dock || !locale) return;
    const small = dock.querySelector('small');
    const description = `${locale.text(dock.dataset.originalDescription || '챔피언과 아이템 기록을 살펴보세요.')} ›`;
    if (small && small.textContent !== description) small.textContent = description;
    const generatedTitle = dock.dataset.generatedArchiveDock === 'true' ? dock.querySelector('b') : null;
    if (generatedTitle) {
      const title = ui('클래식 아카이브', 'クラシックアーカイブ', 'Classic Archive');
      if (generatedTitle.textContent !== title) generatedTitle.textContent = title;
    }
    const ariaLabel = locale.text('Classic Encyclopedia 챔피언 정보 열기');
    if (dock.getAttribute('aria-label') !== ariaLabel) dock.setAttribute('aria-label', ariaLabel);
  }

  function keepPersistentBottomOrder() {
    const footer = one('#floatingLegalFooter');
    const dock = one('#persistentArchiveDock');
    if (footer && footer.nextElementSibling !== dock) {
      document.body.appendChild(footer);
    }
    if (dock && document.body.lastElementChild !== dock) {
      document.body.appendChild(dock);
    }
  }

  function normalizeHomeFeedMarkers() {
    const feed = one('#view > .hm .hmNews');
    if (!feed || feed.classList.contains('lolVideoMode') || feed.classList.contains('finalVideoMode')) return;
    all('li', feed).forEach(row => {
      const dot = one('.hmFeedDot', row);
      if (!dot) return;
      const semanticNotice = row.classList.contains('hmPatchNotice')
        || row.classList.contains('hmCommunityNotice')
        || dot.classList.contains('hmFeedDotNotice');
      const semanticUser = row.classList.contains('hmCommunityUser')
        || dot.classList.contains('hmFeedDotUser');
      const notice = semanticNotice
        || (!semanticUser && row.classList.contains('finalHomeOperatorRow'));
      const user = semanticUser
        || (!semanticNotice && row.classList.contains('finalHomeUserRow'));
      dot.classList.toggle('hmFeedDotNotice', notice);
      dot.classList.toggle('hmFeedDotUser', user);
    });
  }

  function syncRunePageGeometry() {
    cancelAnimationFrame(runeGeometryFrame);
    runeGeometryFrame = requestAnimationFrame(() => {
      const inventory = one('.runeClient.classicSkinned .runeInventory');
      const boardPane = one('.runeClient.classicSkinned .runeBoardPane');
      if (!inventory || !boardPane) return;
      inventory.style.removeProperty('height');
      inventory.style.removeProperty('max-height');
      if (inventory.closest('.runeClient').clientWidth < 720) {
        delete inventory.dataset.syncedBoardHeight;
        return;
      }
      const boardHeight = Math.ceil(boardPane.getBoundingClientRect().height);
      if (boardHeight <= 0) return;
      inventory.style.setProperty('height', `${boardHeight}px`, 'important');
      inventory.style.setProperty('max-height', `${boardHeight}px`, 'important');
      inventory.dataset.syncedBoardHeight = String(boardHeight);
    });
  }

  function resetPendingPostImages() {
    pendingPostImages.forEach(entry => {
      if (entry.url) URL.revokeObjectURL(entry.url);
    });
    pendingPostImages = [];
  }

  window.__LOLCLASSIC_POST_IMAGE_SELECTION__ = Object.freeze({
    files: () => pendingPostImages.map(entry => entry.file),
    clear: resetPendingPostImages,
    count: () => pendingPostImages.length,
    max: MAX_POST_IMAGES,
  });

  function updateAttachmentUi(dialog) {
    const counter = one('.nostalgia218AttachmentCounter', dialog);
    const picker = one('[data-act="wAddImg"]', dialog);
    const previews = one('.nostalgia218AttachmentPreviews', dialog);
    if (counter) counter.textContent = `${pendingPostImages.length} / ${MAX_POST_IMAGES}`;
    if (picker) picker.disabled = pendingPostImages.length >= MAX_POST_IMAGES;
    if (previews) {
      previews.innerHTML = pendingPostImages.map((entry, index) => `<span><img src="${entry.url}" alt="${ui(`선택한 이미지 ${index + 1}`, `選択した画像 ${index + 1}`, `Selected image ${index + 1}`)}"><button type="button" data-remove-post-image="${index}" aria-label="${ui(`선택한 이미지 ${index + 1} 제거`, `選択した画像 ${index + 1} を削除`, `Remove selected image ${index + 1}`)}">×</button></span>`).join('');
    }
  }

  function decorateWriteDialog() {
    const dialog = one('#modalBody .bdlg:not(.nick)');
    if (!dialog || !one('#wTitle', dialog) || dialog.dataset.nostalgia218 === 'true') return;
    resetPendingPostImages();
    dialog.dataset.nostalgia218 = 'true';
    dialog.classList.add('nostalgia218Write');
    const top = one('.bdlgTop', dialog);
    if (top) {
      const title = one('b', top);
      if (title) title.textContent = ui('글쓰기', '投稿を作成', 'Write a post');
      const camera = document.createElement('span');
      camera.className = 'nostalgia218Camera';
      camera.setAttribute('aria-hidden', 'true');
      camera.textContent = '▣';
      top.prepend(camera);
    }
    const buttons = one('.wBtns', dialog);
    const body = one('#wBody', dialog);
    const picker = one('[data-act="wAddImg"]', dialog);
    if (picker) picker.textContent = ui('본문 추가', '画像を追加', 'Add images');
    if (body && buttons) body.after(buttons);
    const attachment = document.createElement('section');
    attachment.className = 'nostalgia218Attachments';
    attachment.innerHTML = `<input class="nostalgia218FileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden><div class="nostalgia218AttachmentPreviews"></div><p><b class="nostalgia218AttachmentCounter">0 / ${MAX_POST_IMAGES}</b><span>${ui('PNG·JPEG·WebP, 최대 4장', 'PNG・JPEG・WebP、最大4枚', 'PNG, JPEG or WebP; up to 4 images')}</span></p><p class="nostalgia218TransportWarning">${ui('등록할 때 각 이미지를 안전한 크기로 다시 인코딩합니다. 처리 중에는 창을 닫지 마세요.', '投稿時に各画像を安全なサイズに再エンコードします。処理中は画面を閉じないでください。', 'Each image is resized safely when you post. Keep this window open while processing.')}</p>`;
    if (buttons) buttons.before(attachment); else dialog.append(attachment);
    updateAttachmentUi(dialog);
  }

  function decorateNicknameDialog() {
    const dialog = one('#modalBody .bdlg.nick');
    if (!dialog || dialog.dataset.nostalgia218 === 'true') return;
    dialog.dataset.nostalgia218 = 'true';
    dialog.classList.add('nostalgia218Nickname');
    const title = one('.ndlgTitle', dialog);
    if (title) title.textContent = ui('닉네임을 설정하세요.', 'ニックネームを設定してください。', 'Set your nickname.');
  }

  function decorateBoardReadability() {
    all('.bd .bempty').forEach(node => {
      node.classList.remove(
        'nostalgia218BoardLoading',
        'nostalgia218BoardError',
        'nostalgia218BoardEmpty',
      );
      const message = String(node.textContent || '').trim();
      const stateClass = /불러오는 중|로딩|読み込み中|loading/i.test(message)
        ? 'nostalgia218BoardLoading'
        : /오류|실패|연결|서버|시간 초과|エラー|失敗|接続|サーバー|タイムアウト|error|failed|connection|server|timed out/i.test(message)
          ? 'nostalgia218BoardError'
          : 'nostalgia218BoardEmpty';
      node.classList.add(stateClass);
    });
    all('.bd .brow .bt').forEach(node => {
      const fullTitle = String(node.textContent || '').trim();
      if (fullTitle) node.setAttribute('title', fullTitle);
    });
    all('.bd .frow').forEach(row => {
      const label = one('.fl', row);
      const value = one('.fv', row);
      if (label && value && /제\s*목|タイトル|Title/i.test(String(label.textContent || ''))) {
        const fullTitle = String(value.textContent || '').trim();
        if (fullTitle) value.setAttribute('title', fullTitle);
      }
    });
  }

  function showBoardTypeDialog() {
    const modal = one('#modal');
    const body = one('#modalBody');
    if (!modal || !body) return;
    const active = (typeof S !== 'undefined' && S.bfilter) || 'all';
    body.innerHTML = `<section class="nostalgia218BoardType" role="dialog" aria-label="${ui('게시판 타입 선택', '掲示板の表示を選択', 'Choose board view')}"><h2>${ui('게시판 타입을 선택해 주세요.', '掲示板の表示を選んでください。', 'Choose a board view.')}</h2><label><span>${ui('전체글', 'すべての投稿', 'All posts')}</span><input type="radio" name="board218Type" value="all" ${active === 'all' ? 'checked' : ''}></label><label><span>${ui('개념글', '人気の投稿', 'Popular posts')}</span><input type="radio" name="board218Type" value="best" ${active === 'best' ? 'checked' : ''}></label><label><span>${ui('내글', '自分の投稿', 'My posts')}</span><input type="radio" name="board218Type" value="mine" ${active === 'mine' ? 'checked' : ''}></label><div><button data-nostalgia-board-apply>${ui('보기', '表示', 'Show')}</button><button data-act="wClose">${ui('닫기', '閉じる', 'Close')}</button></div></section>`;
    if (!modal.open) modal.showModal();
  }

  function handleFileSelection(input) {
    const dialog = input.closest('.nostalgia218Write');
    const chosen = Array.from(input.files || []);
    const room = MAX_POST_IMAGES - pendingPostImages.length;
    const known = new Set(pendingPostImages.map(entry => `${entry.file.name}:${entry.file.size}:${entry.file.lastModified}`));
    const valid = [];
    chosen.forEach(file => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      const type = String(file.type || '').toLowerCase();
      const extensionAllowed = /\.(png|jpe?g|webp)$/i.test(String(file.name || ''));
      if (!(ALLOWED_POST_IMAGE_TYPES.has(type) || (!type && extensionAllowed))) {
        if (typeof toast === 'function') toast(ui('PNG, JPEG, WebP 이미지만 선택할 수 있습니다.', 'PNG、JPEG、WebP 画像のみ選択できます。', 'Choose PNG, JPEG or WebP images only.'));
        return;
      }
      if (!file.size || file.size > MAX_SOURCE_IMAGE_BYTES) {
        if (typeof toast === 'function') toast(ui('선택 원본 이미지는 한 장당 20 MiB 이하여야 합니다.', '元画像は1枚あたり20 MiB以下にしてください。', 'Each original image must be 20 MiB or smaller.'));
        return;
      }
      if (known.has(key)) return;
      known.add(key);
      valid.push(file);
    });
    if (valid.length > room) {
      if (typeof toast === 'function') toast(ui(`이미지는 최대 ${MAX_POST_IMAGES}장까지 선택할 수 있습니다. 다섯 번째 이미지는 추가하지 않았습니다.`, `画像は最大${MAX_POST_IMAGES}枚まで選択できます。5枚目以降は追加しませんでした。`, `You can select up to ${MAX_POST_IMAGES} images. Extra images were not added.`));
    }
    valid.slice(0, Math.max(0, room)).forEach(file => {
      pendingPostImages.push({ file, url: URL.createObjectURL(file) });
    });
    input.value = '';
    if (dialog) updateAttachmentUi(dialog);
  }

  function installCaptureHandlers() {
    document.addEventListener('click', event => {
      const target = event.target.closest && event.target.closest('[data-act], [data-remove-post-image], [data-nostalgia-board-apply]');
      if (!target) return;
      if (target.matches('[data-item]')) {
        setTimeout(() => decorateItemModal(target.dataset.item), 0);
        return;
      }
      if (target.dataset.act === 'bFilter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        showBoardTypeDialog();
        return;
      }
      if (target.hasAttribute('data-nostalgia-board-apply')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const choice = one('input[name="board218Type"]:checked', one('.nostalgia218BoardType'));
        if (choice && typeof S !== 'undefined') {
          S.bfilter = choice.value;
          S.page = 1;
        }
        const modal = one('#modal');
        if (modal && modal.open) modal.close();
        if (typeof render === 'function') render();
        return;
      }
      if (target.dataset.act === 'wAddImg' && target.closest('.nostalgia218Write')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const input = one('.nostalgia218FileInput', target.closest('.nostalgia218Write'));
        if (input && pendingPostImages.length < MAX_POST_IMAGES) input.click();
        return;
      }
      if (target.hasAttribute('data-remove-post-image')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const index = Number(target.dataset.removePostImage);
        const removed = pendingPostImages.splice(index, 1)[0];
        if (removed && removed.url) URL.revokeObjectURL(removed.url);
        updateAttachmentUi(target.closest('.nostalgia218Write'));
        return;
      }
      if (target.dataset.act === 'wClose' && target.closest('.nostalgia218Write')) {
        resetPendingPostImages();
      }
      if (target.matches('[data-runei]')) {
        if (typeof S !== 'undefined') S.rune218Selected = target.dataset.runei;
      }
    }, true);

    document.addEventListener('change', event => {
      if (event.target && event.target.matches('.nostalgia218FileInput')) {
        handleFileSelection(event.target);
      }
    }, true);
    const modal = one('#modal');
    if (modal) modal.addEventListener('close', resetPendingPostImages);
    window.addEventListener('beforeunload', resetPendingPostImages);
  }

  function decorateCurrentUi() {
    removeBuilderFromNormalUi();
    normalizeHomeButtons();
    ensurePersistentArchiveDock();
    keepPersistentBottomOrder();
    cleanHomeFeed();
    normalizeHomeFeedMarkers();
    decorateBoardReadability();
    syncRunePageGeometry();
    decorateWriteDialog();
    decorateNicknameDialog();
    document.body.classList.add('nostalgia218Fidelity');
    document.body.dataset.nostalgia218Version = VERSION;
  }

  function injectStyle() {
    if (one('#nostalgia-218-fidelity-style')) return;
    const style = document.createElement('style');
    style.id = 'nostalgia-218-fidelity-style';
    style.textContent = `
      html{color-scheme:dark;background:#05090c}
      body.nostalgia218Fidelity{color-scheme:dark!important;background:#05090c!important}
      body.nostalgia218Fidelity.nostalgia218HasArchiveDock{box-sizing:border-box!important;padding-bottom:var(--nostalgia-archive-dock-height,48px)!important}
      body.nostalgia218Fidelity.nostalgia218HasArchiveDock .itemPage{height:calc(100dvh - 107px - var(--nostalgia-archive-dock-height,48px))!important}
      body.nostalgia218Fidelity #view{overflow-x:hidden!important}
      body.nostalgia218Fidelity [data-go="builder"]{display:none!important}
      body.nostalgia218Fidelity .hmNews{height:216px!important;min-height:216px!important;max-height:216px!important;grid-template-rows:none!important;overflow:hidden!important}
      body.nostalgia218Fidelity .hmNews:not(.lolVideoMode):not(.finalVideoMode){display:block!important;align-self:stretch!important;overflow-y:auto!important}
      body.nostalgia218Fidelity .hmNews>li{min-height:34px!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode),
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode)>li,
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode)>li>button{color:#111!important;background:#fff!important;border-color:#d9d9d9!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode)>li>button>b{color:#111!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode)>li>button>small{color:#555!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode) .hmFeedDotNotice,
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode) .finalHomeOperatorRow .hmFeedDot{visibility:visible!important;opacity:1!important;background:#df4650!important;border:1px solid #b72e34!important;box-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode) .hmFeedDotUser,
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode) .finalHomeUserRow .hmFeedDot{visibility:visible!important;opacity:1!important;background:#3979db!important;border:1px solid #285cae!important;box-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode) .hmFeedEmpty .hmFeedDot,
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews:not(.lolVideoMode):not(.finalVideoMode) .finalEmptyHomeRow .hmFeedDot{visibility:hidden!important;opacity:0!important;background:transparent!important;border:0!important}
      body.nostalgia218Fidelity .nostalgia218EmptyFeed{display:grid;place-items:center;min-height:100%!important;padding:20px;color:#666;background:#eee;border:1px solid #aaa}
      body.nostalgia218Fidelity .nostalgia218MediaEmpty{display:grid!important;grid-template-columns:54px 1fr!important;grid-template-rows:auto auto!important;align-items:center!important;align-content:center!important;gap:2px 10px!important;min-height:100%!important;height:100%!important;padding:12px!important;color:#ddd!important;background:#050505!important;border:1px solid #888!important}
      body.nostalgia218Fidelity .nostalgia218MediaEmpty .play{grid-row:1/3;display:grid;place-items:center;width:48px;height:48px;border:2px solid #eee;border-radius:50%;font-size:22px}
      body.nostalgia218Fidelity .nostalgia218MediaEmpty b{font-size:13px}.nostalgia218MediaEmpty small{color:#aaa;font-size:10px}

      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.finalVideoMode,
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.lolVideoMode{display:grid!important;place-items:center!important;grid-template-rows:minmax(0,1fr)!important;width:100%!important;height:216px!important;min-height:216px!important;max-height:216px!important;padding:0!important;overflow:hidden!important;background:#000!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.finalVideoMode>.finalVideoStageItem{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#eee5ce!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.finalVideoMode .finalVideoPreview{display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;margin:0!important;overflow:hidden!important;background:#000!important;border:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.finalVideoMode .finalVideoPlayer{display:block!important;width:min(100%,366px)!important;height:auto!important;min-height:0!important;max-height:100%!important;aspect-ratio:16/9!important;margin:0!important;overflow:hidden!important;background:#000!important;border:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.finalVideoMode .finalVideoPlayer>iframe,
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.finalVideoMode .finalVideoPlayer>video{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;background:#000!important;border:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.lolVideoMode>.lolVideoHub{display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;overflow-y:auto!important;background:#000!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.lolVideoMode .lolVideoPreview{height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:16/9!important;background-size:cover!important;background-position:center!important;background-color:#000!important}

      body.nostalgia218Fidelity .nostalgia218Items .archiveLead{margin:8px!important;padding:8px!important}
      body.nostalgia218Fidelity .nostalgia218Items .ilist{display:grid!important;align-content:start!important;gap:1px!important;background:#303638!important}
      body.nostalgia218Fidelity .nostalgia218Items .ilist li{margin:0!important;border:0!important}
      body.nostalgia218Fidelity .nostalgia218Items .ilist button{display:grid!important;grid-template-columns:76px minmax(0,1fr)!important;align-items:center!important;gap:10px!important;min-height:82px!important;padding:6px!important;color:#d9eeee!important;background:#04090a!important;border:0!important;border-bottom:1px solid #394446!important;text-align:left!important}
      body.nostalgia218Fidelity .item218Icon{display:block;width:72px;height:72px;object-fit:cover;background:#111;border:1px solid #627174;image-rendering:auto}
      body.nostalgia218Fidelity .item218Copy{display:grid;gap:4px;min-width:0}.item218Copy b{color:#a7d9d8!important;font-size:13px!important}.item218Copy small{color:#8eb3b5!important}.item218Copy em{color:#e8d271!important;font-style:normal!important;font-weight:700!important}
      body.nostalgia218Fidelity .item218DetailIcon{width:92px;height:92px;object-fit:cover;border:2px solid #647476;background:#05090a}

      body.nostalgia218Fidelity .rune218Page{min-height:calc(100dvh - 100px);color:#bdcac9;background:#020708;border-top:2px solid #80672c}
      body.nostalgia218Fidelity .rune218Page>header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px;color:#a8d8d6;background:linear-gradient(#132024,#071012);border-bottom:1px solid #344548}
      body.nostalgia218Fidelity .rune218Page>header b{font-size:15px}.rune218Page>header small{font-size:9px;color:#aaa;text-align:right}
      body.nostalgia218Fidelity .rune218Truth{margin:8px;padding:9px 12px;color:#c7c1a9;background:#11191b;border:1px solid #596567;font-size:10px;line-height:1.5}
      body.nostalgia218Fidelity .rune218Tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-block:1px solid #6e5a2e}
      body.nostalgia218Fidelity .rune218Tabs button{min-height:42px;color:#dde2e1;background:linear-gradient(#23435b,#0b1c2a);border:1px solid #607989;font-size:11px}.rune218Tabs button.on{color:#fff6c4;background:linear-gradient(#715314,#241a05);border-color:#c8a647;font-weight:700}
      body.nostalgia218Fidelity .rune218Search{margin:8px!important}.rune218Search input{background:#fff8dc!important;color:#262016!important}
      body.nostalgia218Fidelity .rune218Detail{margin:8px;padding:10px;color:#ddd;background:#11191e;border:1px solid #586569}.rune218Detail b{color:#f2df9e;font-size:14px}.rune218Detail p{margin:7px 0;line-height:1.55}.rune218Detail small{color:#8eb8b7}
      body.nostalgia218Fidelity .rune218Rows{margin:0 8px;padding:0;list-style:none;border:1px solid #3d4b4e}.rune218Rows li{margin:0}.rune218Rows button{display:grid;grid-template-columns:minmax(0,1fr) 58px;align-items:center;width:100%;min-height:58px;padding:7px 8px;color:#d9eeee;background:#03090a;border:0;border-bottom:1px solid #334145;text-align:left}.rune218Rows li.selected button{background:#122126}.rune218Rows button span{display:grid;gap:3px}.rune218Rows button b{color:#a7d9d8}.rune218Rows button small{color:#9caead;white-space:normal}.rune218Rows button em{justify-self:end;color:#f0d783;background:#1c2524;border:1px solid #7b6e3d;padding:8px;font-style:normal}
      body.nostalgia218Fidelity .rune218Summary{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:8px;padding:9px;color:#e5d178;background:#11191d;border:1px solid #36464a}.rune218Summary button{min-height:36px;color:#eee;background:#172c3d;border:1px solid #61798a}

      body.nostalgia218Fidelity .classicMastery{display:flex!important;flex-direction:column!important}
      body.nostalgia218Fidelity .classicMastery>h3{order:0}.classicMastery>.masteryTabs{order:1}.classicMastery>.masteryDetail{order:2}.classicMastery>.masteryBoards{order:3}.classicMastery>.boardTop{order:4}
      body.nostalgia218Fidelity .classicMastery .masteryTreeGrid{min-height:0!important;padding:6px!important;gap:4px!important}
      body.nostalgia218Fidelity .classicMastery .masteryRow{min-height:62px!important;gap:5px!important}
      body.nostalgia218Fidelity .classicMastery .masteryNode{min-height:58px!important;padding:3px!important}
      body.nostalgia218Fidelity .classicMastery .masteryNode small{font-size:8px!important;line-height:1.15!important}
      body.nostalgia218Fidelity .classicMastery .masteryDetail{position:sticky!important;top:0!important;bottom:auto!important;z-index:3!important;min-height:100px!important;margin:0 6px 6px!important;padding:8px!important;background:#10191d!important;border:2px solid #8c7135!important}
      body.nostalgia218Fidelity .classicMastery .masteryTotals,body.nostalgia218Fidelity .classicMastery>.hint,body.nostalgia218Fidelity .classicMastery .mnames{display:none!important}

      body.nostalgia218Fidelity .bd{min-height:calc(100dvh - 100px)!important;background:#f2f2f2!important;border:1px solid #888!important}
      body.nostalgia218Fidelity .bdTop{display:grid!important;grid-template-columns:repeat(4,minmax(0,65px))!important;justify-content:center!important;gap:10px!important;min-height:52px!important;padding:8px!important;background:linear-gradient(#f7f7f7,#d1d1d1)!important;border-bottom:1px solid #aaa!important}
      body.nostalgia218Fidelity .bdTop .bBtn{min-width:0!important;min-height:34px!important;color:#111!important;background:linear-gradient(#fff,#d8d8d8)!important;border:1px solid #aaa!important;border-radius:4px!important;font-size:11px!important}
      body.nostalgia218Fidelity .bdPager{position:sticky!important;bottom:0!important;z-index:3!important;display:grid!important;grid-template-columns:42px 42px 96px 42px 42px!important;justify-content:center!important;gap:8px!important;padding:9px!important;background:#eee!important;border-top:1px solid #aaa!important}
      body.nostalgia218Fidelity .boardRows{min-height:260px!important}
      body.nostalgia218Fidelity .bd .brows,body.nostalgia218Fidelity .bd .brow,body.nostalgia218Fidelity .bd .bempty{color:#222!important;background:#fff!important;border-color:#ddd!important}
      body.nostalgia218Fidelity .bd .brow .bt{color:#111!important}body.nostalgia218Fidelity .bd .brow .bn{color:#555!important}body.nostalgia218Fidelity .bd .brow .bv{color:#777!important}
      body.nostalgia218Fidelity .bd .brow .bic{border-radius:50%!important;background:#3979db!important;border:1px solid #285cae!important;box-shadow:none!important}
      body.nostalgia218Fidelity .bd .brow .bic.no{background:#df4650!important;border-color:#b72e34!important}

      body.nostalgia218Fidelity #modal:has(.nostalgia218BoardType){width:min(82vw,380px)!important;padding:0!important;background:#080808!important;border:1px solid #666!important}
      body.nostalgia218Fidelity .nostalgia218BoardType{color:#111;background:#fff;box-shadow:0 0 16px #000}
      body.nostalgia218Fidelity .nostalgia218BoardType h2{margin:0;padding:18px;color:#fff;background:#050505;font-size:17px;font-weight:500}
      body.nostalgia218Fidelity .nostalgia218BoardType label{display:flex;align-items:center;justify-content:space-between;min-height:68px;padding:0 18px;border-bottom:1px solid #ddd;font-size:17px}.nostalgia218BoardType label small{display:block;color:#777;font-size:9px}.nostalgia218BoardType label.unsupported{color:#777}.nostalgia218BoardType input{width:25px;height:25px;accent-color:#555}
      body.nostalgia218Fidelity .nostalgia218BoardType>div{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:6px;background:#aaa}.nostalgia218BoardType>div button{min-height:48px;color:#111;background:linear-gradient(#fff,#ddd);border:1px solid #999;font-size:14px}

      body.nostalgia218Fidelity #modal:has(.nostalgia218Write){width:min(78vw,430px)!important;max-height:84dvh!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:auto!important}
      body.nostalgia218Fidelity #modal:has(.nostalgia218Write)>#close{display:none!important}
      body.nostalgia218Fidelity .nostalgia218Write{display:grid;gap:12px;padding:20px;color:#111;background:#fff;border:2px solid #aaa;border-radius:12px;box-shadow:0 8px 28px #0008}
      body.nostalgia218Fidelity .nostalgia218Write .bdlgTop{display:grid;grid-template-columns:56px 1fr 24px;align-items:center;background:transparent;border:0}.nostalgia218Write .bdlgTop b{text-align:center;font-size:18px;font-weight:500}.nostalgia218Write .bdlgX{display:none}.nostalgia218Camera{display:grid;place-items:center;width:44px;height:38px;color:#333;background:linear-gradient(#ddd,#888);border:1px solid #777;border-radius:4px;font-size:22px}
      body.nostalgia218Fidelity .nostalgia218Write .wrow{display:grid;grid-template-columns:82px minmax(0,1fr);align-items:center;gap:8px}.nostalgia218Write .wrow input{min-height:38px;color:#111!important;background:#fff!important;border:1px solid #ccc!important}.nostalgia218Write .wLabel{text-align:center;font-size:15px}.nostalgia218Write textarea{min-height:180px;color:#111!important;background:#fff!important;border:1px solid #ccc!important;resize:vertical}.nostalgia218Write .wBtns{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:10px!important}.nostalgia218Write .wBtns button{min-height:42px;padding-inline:3px!important;color:#111!important;background:linear-gradient(#fff,#e5e5e5)!important;border:1px solid #aaa!important;border-radius:5px!important;font-size:11px!important;white-space:nowrap!important}body.nostalgia218Fidelity .nostalgia218Write .hint2{color:#4a453f!important;line-height:1.45!important}
      body.nostalgia218Fidelity .nostalgia218Attachments{display:grid;gap:5px}.nostalgia218AttachmentPreviews{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.nostalgia218AttachmentPreviews span{position:relative;aspect-ratio:1}.nostalgia218AttachmentPreviews img{width:100%;height:100%;object-fit:cover;border:1px solid #aaa}.nostalgia218AttachmentPreviews button{position:absolute;top:0;right:0;width:24px;height:24px;padding:0;color:#fff;background:#000c;border:0}.nostalgia218Attachments p{display:flex;justify-content:space-between;gap:8px;margin:0;color:#555;font-size:9px}.nostalgia218TransportWarning{display:block!important;color:#5b5130!important;line-height:1.4}
      body.nostalgia218Fidelity .onlinePostImages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:10px 0}.onlinePostImages img{display:block;width:100%;max-height:320px;object-fit:contain;background:#111;border:1px solid #777}

      body.nostalgia218Fidelity #modal:has(.nostalgia218Nickname){width:min(72vw,350px)!important;padding:0!important;background:#050505!important;border:1px solid #555!important}
      body.nostalgia218Fidelity #modal:has(.nostalgia218Nickname)>#close{display:none!important}
      body.nostalgia218Fidelity .nostalgia218Nickname{display:grid;gap:18px;padding:26px 12px 10px;color:#fff;background:#050505}.nostalgia218Nickname .ndlgTitle{color:#fff!important;text-align:center;font-size:15px}.nostalgia218Nickname input{min-height:42px;padding:4px 8px;color:#111!important;background:#fff!important;border:0!important;border-radius:8px!important;font-size:18px}.nostalgia218Nickname .wBtns{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}.nostalgia218Nickname button{min-height:48px;color:#111!important;background:linear-gradient(#fff,#ddd)!important;border:1px solid #aaa!important}

      body.nostalgia218Fidelity .nostalgia218Document .parchbg{display:block!important;background:radial-gradient(circle at 70% 18%,rgba(120,60,140,.45),transparent 55%),radial-gradient(circle at 22% 80%,rgba(40,80,140,.4),transparent 55%),linear-gradient(#26384d,#080b10)!important}
      body.nostalgia218Fidelity .nostalgia218Document .parch{margin:16px 10px!important;padding:30px 18px!important;color:#221b0e!important;background:radial-gradient(circle at 35% 28%,#fff4bc,#ead078 72%,#bd8e36)!important;border:3px double #7c4b16!important;border-radius:18px 6px 20px 5px!important;box-shadow:0 8px 20px #000b,inset 0 0 24px #9f681b88!important}
      body.nostalgia218Fidelity #modal[data-startup-notice="true"]{background:radial-gradient(circle at 35% 28%,#fff4bc,#ead078 72%,#bd8e36)!important;border:4px double #7c4b16!important;border-radius:20px 5px 24px 7px!important}

      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(3,minmax(44px,1fr))!important;gap:4px 6px!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick{order:6!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:flex-end!important;gap:3px!important;position:relative!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:9px!important;overflow:hidden!important;color:#fff4cf!important;background-color:#0b151b!important;background-image:linear-gradient(90deg,rgba(3,7,9,.84) 0%,rgba(3,7,9,.42) 43%,rgba(3,7,9,.08) 100%),url('images/official_classic_skin/Jade_Sona/0.jpg')!important;background-position:center,center!important;background-repeat:no-repeat!important;background-size:cover,cover!important;border:2px solid #545b5c!important;border-radius:0!important;box-shadow:inset 0 0 0 1px #11191b,0 1px 2px rgba(0,0,0,.55)!important;text-align:left!important;text-shadow:0 1px 2px #000!important;cursor:pointer!important;touch-action:manipulation!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster::before,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster::after{content:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster span,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster b,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster small{z-index:1!important;display:block!important;color:inherit!important;font-family:inherit!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster span{position:static!important;margin:0!important;flex-shrink:0!important;font-size:9px!important;font-weight:700!important;letter-spacing:.08em!important;white-space:nowrap!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster b{position:static!important;flex-shrink:0!important;margin:0!important;font-size:16px!important;line-height:1.1!important;white-space:nowrap!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmPoster small{position:static!important;margin:0!important;flex-shrink:0!important;overflow-wrap:anywhere!important;color:#eee5ce!important;font-size:8px!important;line-height:1.3!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmGrid:empty{display:none!important}
      /* Installed operator-app parity: retain the current six real routes and
         fixed archive dock, but use the measured 218-era charcoal controls. */
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header{box-sizing:border-box!important;grid-template-columns:82px minmax(0,1fr) 64px!important;width:100%!important;max-width:100%!important;min-width:0!important;height:58px!important;min-height:58px!important;margin:0!important;padding:4px 5px!important;overflow:hidden!important;background:linear-gradient(#30342f,#111510)!important;border-bottom:2px solid #88763d!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header>#menu,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header>#home,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header>#settings{box-sizing:border-box!important;display:grid!important;place-items:center!important;min-width:0!important;max-width:100%!important;height:48px!important;min-height:0!important;margin:0!important;padding:0 6px!important;overflow:hidden!important;border-radius:0!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;line-height:1.15!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header button{color:#fff!important;background:#242721!important;border:1px solid #6c643b!important;box-shadow:none!important;font-size:12px!important;font-weight:700!important;text-shadow:0 1px #000!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header>#home{font-size:17px!important;font-weight:700!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive>.app>header button:last-child{color:#211705!important;background:linear-gradient(#f4b13d,#d58e18)!important;border-color:#8c5d10!important;text-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmSearch{background:linear-gradient(#59605f,#303534)!important;border:1px solid #191d1c!important;box-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmSearch input{color:#222!important;background:#f3f3ef!important;border:1px solid #252b2a!important;border-radius:0!important;box-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmSearch button{color:#f4ecd5!important;background:linear-gradient(#3a413f,#151918)!important;border:1px solid #8c805b!important;border-radius:0!important;box-shadow:none!important;text-shadow:0 1px #000!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmLogo{color:#f3f0df!important;background:linear-gradient(#252a28,#101311)!important;border:1px solid #090b0a!important;border-bottom-color:#5d6058!important;box-shadow:none!important;text-shadow:0 1px 1px #000!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmRot{background:#20272a!important;border:1px solid #111!important;box-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmTabs{border:1px solid #838783!important;border-bottom:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmTabs>button{color:#666!important;background:linear-gradient(#fff,#d8d8d5)!important;border:0!important;border-right:1px solid #a5a8a4!important;box-shadow:none!important;text-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmTabs>button:last-child{border-right:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmTabs>button.on{color:#111!important;background:#fff!important;border-bottom:3px solid #3e555f!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick .hmBtn{box-sizing:border-box!important;position:relative!important;z-index:1!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:0!important;height:100%!important;margin:0!important;padding:0 11px!important;overflow:hidden!important;pointer-events:auto!important;touch-action:manipulation!important;color:#f1efe7!important;background:linear-gradient(#4b4e4a,#252824)!important;border:1px solid #151815!important;border-radius:0!important;box-shadow:inset 0 0 0 1px rgba(214,183,99,.06)!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;font-size:12px!important;font-weight:700!important;line-height:1.2!important;text-align:left!important;text-shadow:0 1px 1px #000!important;white-space:nowrap!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick .hmBtn small{flex:0 0 auto!important;color:#d4bd72!important;font-size:13px!important;text-shadow:0 1px #000!important}
      html:lang(en) body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick .hmBtn{padding:3px 6px!important;white-space:normal!important;line-height:1.15!important}
      html:lang(en) body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick .hmBtn small{display:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmQuick .hmBtn:active{color:#fff!important;background:linear-gradient(#626760,#343934)!important;border-color:#8c805b!important;filter:brightness(1.08)!important;text-shadow:0 1px #000!important}

      #persistentArchiveDock{box-sizing:border-box!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:2147483000!important;display:grid!important;grid-template-columns:32px minmax(112px,auto) auto minmax(0,1fr)!important;align-items:center!important;gap:8px!important;width:100%!important;height:var(--nostalgia-archive-dock-height,48px)!important;min-height:44px!important;margin:0!important;padding:5px 12px!important;color:#f3f0df!important;background:linear-gradient(180deg,#2b302d 0%,#151917 58%,#0d100f 100%)!important;border:0!important;border-top:2px solid #88763d!important;box-shadow:0 -2px 8px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08)!important;text-align:left!important;text-shadow:0 1px #000!important;cursor:pointer!important;touch-action:manipulation!important}
      #persistentArchiveDock>.persistentArchiveIcon{display:block!important;width:28px!important;height:28px!important;object-fit:cover!important;border:1px solid #88763d!important;box-shadow:0 1px 2px #000!important}
      #persistentArchiveDock>span{overflow:hidden!important;font-size:10px!important;font-weight:700!important;letter-spacing:.08em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #persistentArchiveDock>b{color:#fff4c8!important;font-size:13px!important;white-space:nowrap!important}
      #persistentArchiveDock>small{overflow:hidden!important;color:#b8c7cc!important;font-size:9px!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #persistentArchiveDock:active{color:#171006!important;background:linear-gradient(#ffd770,#d79a22)!important;border-top-color:#6f4b0c!important;text-shadow:none!important}
      #persistentArchiveDock:focus-visible{outline:2px solid #fff0a0!important;outline-offset:-4px!important}

      html.finalHomeNoScroll{height:100%!important;min-height:100%!important;overflow:hidden!important;overscroll-behavior:none!important}
      body.nostalgia218Fidelity.finalHomeNoScroll,body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter{box-sizing:border-box!important;display:grid!important;grid-template-rows:minmax(0,1fr) auto!important;width:100%!important;height:100vh!important;height:100dvh!important;min-height:0!important;overflow:hidden!important;overscroll-behavior:none!important}
      body.nostalgia218Fidelity.finalHomeNoScroll>.app,body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>.app{grid-row:1!important;align-self:stretch!important;display:grid!important;grid-template-rows:58px minmax(0,1fr)!important;width:100%!important;height:auto!important;min-height:0!important;max-height:100%!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll .app>#view{display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;overflow:hidden!important;padding-bottom:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm{box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:52px 24px 116px 38px minmax(0,1fr) 144px!important;grid-template-areas:'search' 'logo' 'carousel' 'tabs' 'feed' 'quick'!important;gap:3px!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;padding:3px 4px 4px!important;overflow:hidden!important}
      /* The persistent archive dock owns the final 48px of the viewport. These
         high-specificity rules beat older long-page overrides so the home app,
         feed, and six-button grid fit above the dock without document scroll or
         an untappable final row. */
      body.nostalgia218Fidelity.finalHomeNoScroll.nostalgia218HasArchiveDock.historicalApkReference.classicFantasyArchive{height:100vh!important;height:100dvh!important;min-height:0!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.nostalgia218HasArchiveDock.historicalApkReference.classicFantasyArchive>.app{height:auto!important;min-height:0!important;max-height:100%!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.nostalgia218HasArchiveDock.historicalApkReference.classicFantasyArchive>.app>#view{height:100%!important;min-height:0!important;max-height:100%!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.nostalgia218HasArchiveDock.historicalApkReference.classicFantasyArchive #view.homeView>.hm{height:100%!important;min-height:0!important;max-height:100%!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.nostalgia218HasArchiveDock.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews{height:auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmStrip,body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmGrid,body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSectionTitle,body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmAd,body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.disc{display:none!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch{grid-area:search!important;display:grid!important;grid-template-columns:minmax(0,1fr) 66px!important;grid-template-rows:29px minmax(36px,1fr)!important;gap:4px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:2px!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch input,body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch button{height:36px!important;min-height:36px!important;margin:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmLogo{grid-area:logo!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0 7px!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmLogo b{font-size:13px!important;white-space:nowrap!important}body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmLogo small{overflow:hidden!important;font-size:8px!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmRot{grid-area:carousel!important;box-sizing:border-box!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-template-rows:repeat(2,minmax(0,1fr))!important;align-items:stretch!important;gap:3px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:2px 4px 3px!important;overflow:hidden!important;touch-action:manipulation!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmRot>.rotC{box-sizing:border-box!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmRot:focus-visible{outline:2px solid #f0c34c!important;outline-offset:-2px!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmFeature{grid-area:quick!important;display:grid!important;grid-template-columns:minmax(0,48%) minmax(0,52%)!important;grid-template-rows:minmax(0,1fr)!important;gap:4px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmTabs{grid-area:tabs!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmTabs>button{height:100%!important;min-height:0!important;padding:0 4px!important}
      body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmNews{grid-area:feed!important;align-self:stretch!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow-x:hidden!important;overflow-y:auto!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.finalVideoMode,body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.lolVideoMode{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#000!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.finalVideoMode>.finalVideoStageItem{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#eee5ce!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.finalVideoMode .finalVideoPreview{display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;overflow:hidden!important;aspect-ratio:auto!important;background:#000!important;border:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.finalVideoMode .finalVideoPlayer{display:block!important;min-height:0!important;max-width:100%!important;max-height:100%!important;margin:0!important;overflow:hidden!important;aspect-ratio:16/9!important;background:#000!important;border:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.finalVideoMode .finalYoutubeThumbnail,body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmNews.finalVideoMode .finalVideoPosterFrame{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#000!important}

      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView button,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView input{font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;font-synthesis:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>*{box-sizing:border-box!important;min-width:0!important;max-width:100%!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmSearch input,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmSearch button,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmTabs>button{box-sizing:border-box!important;min-width:0!important;max-width:100%!important;margin:0!important;overflow:hidden!important;border-radius:0!important;line-height:1.2!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmLogo b,body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmLogo small{min-width:0!important;line-height:1.2!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #view.homeView>.hm>.hmFeature>*{box-sizing:border-box!important;min-width:0!important;max-width:100%!important;overflow:hidden!important}

      body.nostalgia218Fidelity #drawer{box-sizing:border-box!important;width:min(75vw,340px)!important;max-width:340px!important;color:#111!important;background:#e7e7e7!important;background-image:none!important;border-right:1px solid #898989!important;box-shadow:10px 0 28px rgba(0,0,0,.34)!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;text-shadow:none!important}
      body.nostalgia218Fidelity #drawer h3{box-sizing:border-box!important;display:flex!important;align-items:center!important;min-height:34px!important;margin:0!important;padding:0 14px!important;color:#fff!important;background:#252a26!important;background-image:none!important;border-top:1px solid #3b403c!important;border-bottom:1px solid #111511!important;font-size:13px!important;font-weight:800!important;letter-spacing:0!important;line-height:1.2!important;text-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #drawer h3{font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;font-synthesis:none!important}
      body.nostalgia218Fidelity #drawer h3:first-child{border-top:0!important}
      body.nostalgia218Fidelity #drawer button{box-sizing:border-box!important;display:flex!important;align-items:center!important;width:100%!important;min-width:0!important;min-height:54px!important;height:auto!important;margin:0!important;padding:0 16px!important;overflow:hidden!important;color:#151515!important;background:#f5f5f5!important;background-image:none!important;border:0!important;border-bottom:1px solid #c9c9c9!important;border-radius:0!important;box-shadow:none!important;font:500 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;letter-spacing:0!important;text-align:left!important;text-overflow:ellipsis!important;text-shadow:none!important;white-space:nowrap!important}
      body.nostalgia218Fidelity #drawer button:hover,body.nostalgia218Fidelity #drawer button:focus-visible{color:#111!important;background:#e9eeeb!important;border-left:4px solid #847039!important;padding-left:12px!important;outline:0!important}
      body.nostalgia218Fidelity #shade{background:rgba(0,0,0,.58)!important}
      body.nostalgia218Fidelity.finalHasLegalFooter #view{padding-bottom:0!important}
      body.nostalgia218Fidelity #floatingLegalFooter{box-sizing:border-box!important;position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;z-index:1!important;display:none!important;width:100%!important;height:auto!important;margin:0!important;transform:none!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter{grid-row:2!important;align-self:end!important;position:relative!important;z-index:2!important;max-height:none!important;overflow:visible!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalInner{min-height:50px!important;padding:5px 12px!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalText{font-size:9.5px!important;line-height:13px!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalButton{min-width:56px!important;min-height:36px!important}

      /* Beat the older classic-fantasy 100dvh app rule so the legal row is
         allocated inside the home viewport instead of below it. */
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter.historicalApkReference.classicFantasyArchive{box-sizing:border-box!important;display:grid!important;grid-template-rows:minmax(0,1fr) auto!important;width:100%!important;height:100vh!important;height:100dvh!important;min-height:0!important;overflow:hidden!important;overscroll-behavior:none!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter.historicalApkReference.classicFantasyArchive>.app{grid-row:1!important;align-self:stretch!important;display:grid!important;grid-template-rows:58px minmax(0,1fr)!important;width:100%!important;height:auto!important;min-height:0!important;max-height:100%!important;overflow:hidden!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter.historicalApkReference.classicFantasyArchive>.app>#view{align-self:stretch!important;width:100%!important;height:auto!important;min-height:0!important;max-height:100%!important;overflow:hidden!important;padding-bottom:0!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter.historicalApkReference.classicFantasyArchive>#floatingLegalFooter{grid-row:2!important;align-self:end!important;position:relative!important;z-index:2!important;max-height:none!important;overflow:visible!important}

      /* Current requested patch-note parchment, item-title contrast, and 1:4 rune page. */
      body.nostalgia218Fidelity{--nostalgia-rune-paper:radial-gradient(circle at 22% 18%,rgba(255,249,194,.92),transparent 28%),radial-gradient(circle at 78% 72%,rgba(188,126,37,.22),transparent 34%),repeating-linear-gradient(7deg,rgba(112,72,17,.035) 0 1px,transparent 1px 6px),linear-gradient(115deg,#c89c42 0%,#f4dc88 8%,#fff0aa 48%,#e5c56d 91%,#aa7427 100%)}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive .nostalgia218Items .tree2{padding-bottom:12px!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive .nostalgia218Items .tree2 button:not(.kid):not([data-cat="all"]){color:#2b1b08!important;background:var(--nostalgia-rune-paper)!important;border-bottom:2px solid #916928!important;font-weight:800!important;text-shadow:none!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive .nostalgia218Items .tree2 button:not(.kid):not([data-cat="all"]).on{box-shadow:inset 5px 0 #2d746d,inset 0 0 12px rgba(118,68,15,.18)!important}

      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .imHead{box-sizing:border-box!important;display:grid!important;grid-template-columns:96px minmax(0,1fr)!important;align-items:center!important;gap:12px!important;width:100%!important;min-width:0!important;margin:0 0 10px!important;padding:12px 48px 12px 12px!important;color:#281908!important;background:var(--nostalgia-rune-paper)!important;border:3px double #835316!important;border-radius:6px!important;box-shadow:inset 0 0 18px rgba(117,66,12,.22)!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .imHead>div{min-width:0!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .imHead h2{display:block!important;margin:3px 0 0!important;color:#241405!important;font-size:clamp(19px,5.4vw,26px)!important;font-weight:900!important;line-height:1.3!important;text-shadow:0 1px rgba(255,255,255,.65)!important;overflow-wrap:anywhere!important;word-break:keep-all!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .archiveEyebrow{color:#73501a!important;font-size:9px!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .itemEn{color:#57411f!important;font-size:11px!important;overflow-wrap:anywhere!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .gold{color:#7c4807!important;text-shadow:none!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .imHead .hint{color:#76501a!important;font-weight:650!important}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt maintext{display:block}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt jadeunique,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt jadeLimit,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt jadeRules,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt attention,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt gold{color:#edce72;font-weight:700}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt physicalDamage,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt scaleAD,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt armorPen{color:#e5a17a;font-weight:700}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt magicDamage,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt scaleAP,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt scaleMana{color:#a9c8f5;font-weight:700}
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt healing,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt shield,
      body.nostalgia218Fidelity #modal:has(.itemDetail) .itemDetail .mtxt lifeSteal{color:#a9dca9;font-weight:700}

      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"]{box-sizing:border-box!important;position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;height:100vh!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:0!important;background:radial-gradient(circle at 50% 28%,#243448 0%,#101721 48%,#020406 100%)!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"]::backdrop{background:#020406!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #modalBody{box-sizing:border-box!important;position:relative!important;width:calc(100% - 12px)!important;height:calc(100% - 12px)!important;min-height:0!important;margin:6px!important;padding:clamp(50px,6.5dvh,72px) clamp(31px,7.5vw,58px) clamp(42px,5.8dvh,66px)!important;overflow:hidden!important;background-color:#efd477!important;background-image:radial-gradient(circle at 34% 24%,rgba(255,249,198,.94) 0%,rgba(255,239,154,.74) 38%,transparent 68%),radial-gradient(circle at 82% 72%,rgba(146,82,17,.18) 0%,transparent 38%),repeating-linear-gradient(7deg,rgba(95,55,12,.035) 0 1px,transparent 1px 6px),linear-gradient(115deg,#a66b23 0%,#e0b44f 4%,#f7df89 8%,#fff0a7 48%,#e4c168 92%,#985b1d 100%)!important;background-position:center!important;background-repeat:no-repeat!important;border:4px double #805018!important;border-radius:18px 5px 22px 7px!important;box-shadow:inset 0 0 28px rgba(99,49,7,.34),0 5px 18px rgba(0,0,0,.72)!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #close{position:absolute!important;z-index:7!important;top:clamp(20px,3.3dvh,36px)!important;right:clamp(16px,4.6vw,30px)!important;display:grid!important;place-items:center!important;width:32px!important;height:32px!important;margin:0!important;padding:0!important;color:#fff!important;background:linear-gradient(#718098,#3e4a5e)!important;border:2px solid #aab4c4!important;border-radius:50%!important;box-shadow:0 2px 5px #000b!important;font-size:23px!important;font-weight:800!important;line-height:1!important;text-shadow:0 1px #000!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchNotice{box-sizing:border-box!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;width:100%!important;height:100%!important;min-height:0!important;padding:0!important;color:#20180b!important;background:transparent!important;border:0!important;overflow:hidden!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchNotice>header{position:static!important;height:auto!important;min-height:0!important;padding:7px 4px 12px!important;color:#20180b!important;background:transparent!important;border-bottom:1px solid rgba(111,67,15,.45)!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchNotice>header h2{padding-bottom:0!important;border:0!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchList{min-height:0!important;padding:4px!important;overflow-y:auto!important;background:transparent!important;background-attachment:local!important;scrollbar-color:#9a6b27 transparent!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchList h3{line-height:1.45!important;overflow-wrap:break-word!important;word-break:keep-all!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchList p{font-size:14px!important;line-height:1.7!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchList small{font-size:11px!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchDisclaimer{margin:0!important;padding:6px 4px!important;color:#674615!important;background:transparent!important;border-top:1px solid rgba(111,67,15,.45)!important}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] .device218PatchNotice>[data-act="startupClose"]{display:none!important}

      body.nostalgia218Fidelity .hmNews.nostalgia218PatchSurface,
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.nostalgia218PatchSurface:not(.lolVideoMode):not(.finalVideoMode){color:#241706!important;background:var(--nostalgia-rune-paper)!important;border-color:#8b5b1a!important;box-shadow:inset 0 0 16px rgba(106,59,11,.2)!important}
      body.nostalgia218Fidelity .hmNews.nostalgia218PatchSurface>li,
      body.nostalgia218Fidelity .hmNews.nostalgia218PatchSurface>li>button,
      body.nostalgia218Fidelity .hmNews.nostalgia218PatchSurface .finalEmptyHomeRow,
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.nostalgia218PatchSurface:not(.lolVideoMode):not(.finalVideoMode)>li,
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.nostalgia218PatchSurface:not(.lolVideoMode):not(.finalVideoMode)>li>button{color:#241706!important;background:transparent!important;border-color:rgba(117,70,15,.28)!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.nostalgia218PatchSurface:not(.lolVideoMode):not(.finalVideoMode)>li>button>b{color:#241706!important;text-shadow:none!important}
      body.nostalgia218Fidelity.finalHomeNoScroll.historicalApkReference.classicFantasyArchive #view.homeView>.hm .hmNews.nostalgia218PatchSurface:not(.lolVideoMode):not(.finalVideoMode)>li>button>small{color:#68481a!important;text-shadow:none!important}

      body.nostalgia218Fidelity .hmNews.nostalgia218SharedFeedSurface,
      body.nostalgia218Fidelity .hmNews.nostalgia218SharedFeedSurface>li,
      body.nostalgia218Fidelity .hmNews.nostalgia218SharedFeedSurface>li>button{color:#111!important;background:#fff!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important}
      body.nostalgia218Fidelity .hmNews.nostalgia218SharedFeedSurface{border-color:#aaa!important}
      body.nostalgia218Fidelity .hmNews.nostalgia218SharedFeedSurface>li,body.nostalgia218Fidelity .hmNews.nostalgia218SharedFeedSurface>li>button{border-color:#dedede!important}


      body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientLayout{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-areas:"inventory" "board" "stats"!important;align-items:start!important;gap:14px!important;width:100%!important;min-width:0!important;padding:8px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventory{grid-area:inventory!important;align-self:start!important;display:flex!important;flex-direction:column!important;width:auto!important;min-width:0!important;height:auto!important;max-height:none!important;overflow:hidden!important;order:initial!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeBoardPane{grid-area:board!important;align-self:start!important;width:auto!important;min-width:0!important;height:auto!important;order:initial!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeBoard{width:100%!important;height:auto!important;min-height:0!important;aspect-ratio:197.5/255.1!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientStats{grid-area:stats!important;width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;overflow:visible!important;order:initial!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList{flex:1 1 auto!important;min-height:0!important;max-height:220px!important;overflow-y:auto!important;overscroll-behavior:contain!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryTabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:3px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryTabs button{display:grid!important;min-width:0!important;padding:5px 2px!important;overflow:visible!important;font-size:12px!important;line-height:1.4!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryTabs button span{overflow:visible!important;text-overflow:clip!important;white-space:normal!important;word-break:keep-all!important}
      html:lang(en) body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryTabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList button{display:grid!important;grid-template-columns:34px minmax(0,1fr) 28px!important;align-items:center!important;gap:8px!important;width:100%!important;min-height:56px!important;height:auto!important;padding:8px!important;text-align:left!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList button>.pic{width:34px!important;height:34px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList button>span{display:block!important;min-width:0!important;overflow:visible!important;white-space:normal!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList b{display:block!important;color:#fff1ca!important;font-size:16px!important;line-height:1.45!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;overflow:visible!important;text-overflow:clip!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList small{display:block!important;margin-top:3px!important;color:#e3d5b8!important;font-size:12px!important;line-height:1.45!important;white-space:normal!important;overflow:visible!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList em{position:static!important;color:#f8dc96!important;font-size:13px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeSocketIcon{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList .pic.noimg i{display:none!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeBoardPane h3{height:auto!important;min-height:34px!important;padding:7px 4px!important;color:#39230e!important;background:transparent!important;border-color:#a47c3c!important;font-size:18px!important;line-height:1.4!important;white-space:normal!important;text-shadow:none!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeSocket{width:30px!important;height:30px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeSocket.quint{width:50px!important;height:50px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientStats h4{height:auto!important;min-height:34px!important;padding:8px!important}

      /* A CSS paper sheet: decoration is clipped, readable content is not. */
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive :is(.runeClient.classicSkinned .runeBoardPane,#modal[data-startup-notice="true"] #modalBody){position:relative!important;isolation:isolate!important;padding:32px 20px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;filter:drop-shadow(0 5px 5px #0007)}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive :is(.runeBoardPane,#modal[data-startup-notice="true"] #modalBody)::before{content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;clip-path:polygon(2% 1%,17% 2%,19% 0,42% 1%,44% 0,68% 2%,83% 0,98% 2%,99% 17%,98% 29%,100% 31%,99% 54%,97% 56%,99% 74%,98% 96%,92% 98%,88% 96%,72% 99%,69% 97%,51% 100%,48% 98%,29% 99%,26% 97%,10% 99%,1% 97%,2% 79%,0 76%,2% 58%,1% 42%,3% 39%,1% 18%);background:linear-gradient(0deg,#80501a99,transparent 5%,transparent 94%,#8f5e2599),var(--nostalgia-rune-paper);box-shadow:inset 0 0 18px #7c4a2166}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive :is(.runeBoardPane,#modal[data-startup-notice="true"] #modalBody)::after{content:"";position:absolute;z-index:0;left:8px;right:8px;top:7px;height:17px;pointer-events:none;border:1px solid #9c713e;border-radius:45% 12% 36% 16% / 35% 40% 60% 55%;background:linear-gradient(#b68645 0%,#ffecb1 35%,#e6c478 65%,#97632d 100%);box-shadow:0 5px 5px #63391455,inset 0 2px 2px #fff6d8aa;transform:rotate(-.5deg)}
      body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #modalBody{padding:48px 28px 30px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeBoard{background:transparent!important;border:0!important;box-shadow:none!important}
      body.nostalgia218Fidelity .runePaperNames{margin-top:16px!important;padding-top:12px!important;color:#39230e!important;border-top:1px solid #a47c3c!important}
      body.nostalgia218Fidelity .runePaperNames h4{margin:0 0 6px!important;color:#39230e!important;background:transparent!important;font-size:15px!important;text-shadow:none!important}
      body.nostalgia218Fidelity .runePaperNames ul{margin:0!important;padding:0!important;list-style:none!important}
      body.nostalgia218Fidelity .runePaperNames button{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;min-height:44px!important;padding:9px 0!important;color:#39230e!important;background:transparent!important;border:0!important;border-bottom:1px solid #a47c3c55!important;border-radius:0!important;font-size:16px!important;line-height:1.5!important;text-align:left!important;box-shadow:none!important;text-shadow:none!important}
      body.nostalgia218Fidelity .runePaperNames b{min-width:0!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important}
      body.nostalgia218Fidelity .runePaperNames button span{flex-shrink:0!important;font-weight:700!important}
      body.nostalgia218Fidelity .runePaperNames .empty{padding:10px 0!important;color:#65451f!important;font-size:14px!important;line-height:1.5!important}
      @media(min-width:720px){
        body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientLayout{grid-template-columns:minmax(220px,1fr) minmax(0,1.8fr)!important;grid-template-areas:"inventory board" "stats stats"!important}
        body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryList{max-height:none!important}
      }

      /* Store-release polish: keep the 218-era palette while improving hierarchy,
         copy surfaces, and primary touch targets. */
      body.nostalgia218Fidelity .cvLinks.cvLinksTwo{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      body.nostalgia218Fidelity .plannedFeature{margin:8px 0!important;padding:10px 12px!important;color:#f3df9a!important;background:#162129!important;border:1px solid #766334!important;border-radius:4px!important;font-weight:700!important}
      body.nostalgia218Fidelity .aboutRelease{display:grid!important;gap:10px!important;min-height:0!important;padding:10px!important;color:#e7e0cd!important;background:#081115!important;white-space:normal!important}
      body.nostalgia218Fidelity .aboutHero{padding:16px!important;background:linear-gradient(145deg,#193348,#07131d 68%)!important;border:2px solid #8c7135!important;box-shadow:inset 0 0 0 1px rgba(236,205,117,.14)!important}
      body.nostalgia218Fidelity .aboutHero small{color:#d5b866!important;font-size:9px!important;letter-spacing:.13em!important}.aboutHero h3{margin:7px 0!important;color:#fff4cf!important;font-size:19px!important;line-height:1.35!important}.aboutHero p{margin:0!important;color:#c9d3d5!important;font-size:11px!important;line-height:1.65!important}
      body.nostalgia218Fidelity .aboutStats{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}.aboutStats span{display:grid!important;grid-template-columns:auto 1fr!important;align-items:center!important;gap:8px!important;min-height:48px!important;padding:8px 10px!important;color:#d9e3e3!important;background:linear-gradient(#18252c,#0d171c)!important;border:1px solid #4c5551!important}.aboutStats b{color:#f1cf6d!important;font-size:18px!important}.aboutStats span{font-size:10px!important}
      body.nostalgia218Fidelity .aboutPanel{padding:12px!important;color:#d9e1df!important;background:#10191e!important;border:1px solid #465154!important}.aboutPanel h3{margin:0 0 7px!important;color:#9fd7d3!important;font-size:14px!important}.aboutPanel p{margin:0!important;font-size:11px!important;line-height:1.7!important}
      body.nostalgia218Fidelity .riotNotice{color:#d8dfdd!important;background:#10191e!important;border:1px solid #766334!important}.riotNotice summary{display:flex!important;align-items:center!important;min-height:46px!important;padding:8px 12px!important;color:#f0d98e!important;cursor:pointer!important;font-weight:800!important}.riotNotice p{margin:0!important;padding:0 12px 12px!important;color:#c8cfcd!important;font-size:10px!important;line-height:1.65!important}.riotNotice p[lang="en"]{color:#aeb8b8!important}
      body.nostalgia218Fidelity .privacyText{line-height:1.65!important}
      body.nostalgia218Fidelity .settingsActions button{min-height:48px!important}

      body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientTop{min-height:48px!important;padding-block:4px!important}
      html:lang(en) body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientTop{grid-template-columns:minmax(130px,38%) minmax(0,1fr) 38px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientSearch input,body.nostalgia218Fidelity .runeClient.classicSkinned .runeClientSearch button{height:40px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runePageTabs button{flex-basis:34px!important;width:34px!important;min-width:34px!important;height:40px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryTabs button{min-height:42px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryFilter{grid-template-columns:minmax(0,1fr)!important;gap:2px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryFilter span,body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryFilter b{overflow:visible!important;text-overflow:clip!important;white-space:normal!important;line-height:1.25!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeInventoryFooter{height:42px!important;min-height:42px!important}
      body.nostalgia218Fidelity .runeClient.classicSkinned .runeBoardActions button{height:40px!important;min-height:40px!important;font-size:9px!important}
      body.nostalgia218Fidelity .bdTop .bBtn{min-height:44px!important}
      body.nostalgia218Fidelity .classicMastery .masteryCell.locked{opacity:.62!important}

      /* Shared operator-mirror parity and readability. The production app and
         admin mirror load this same asset, so one final layer keeps them equal. */
      body.nostalgia218Fidelity,
      body.nostalgia218Fidelity button,
      body.nostalgia218Fidelity input,
      body.nostalgia218Fidelity select,
      body.nostalgia218Fidelity textarea{font-family:system-ui,-apple-system,BlinkMacSystemFont,"SamsungOneKorean","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",Arial,sans-serif!important;font-synthesis:none;text-rendering:optimizeLegibility}
      body.nostalgia218Fidelity #view:not(.homeView){line-height:1.5}
      body.nostalgia218Fidelity #view:not(.homeView) button,
      body.nostalgia218Fidelity #view:not(.homeView) input,
      body.nostalgia218Fidelity #view:not(.homeView) select,
      body.nostalgia218Fidelity #view:not(.homeView) textarea{font-size:max(12px,1em)}
      body.nostalgia218Fidelity .bd,
      body.nostalgia218Fidelity .nostalgia218BoardType,
      body.nostalgia218Fidelity .nostalgia218Write,
      body.nostalgia218Fidelity .nostalgia218Nickname{color-scheme:light!important}

      body.nostalgia218Fidelity #modal:has(.consentDialog) .consentDialog{color:#eee6d0!important}
      body.nostalgia218Fidelity #modal:has(.consentDialog) .consentDialog h2{color:#fff3c8!important}
      body.nostalgia218Fidelity #modal:has(.consentDialog) .consentDialog p:not(.hint2){color:#e2dac5!important}
      body.nostalgia218Fidelity #modal:has(.consentDialog) .consentCheck{color:#241c0e!important;background:#fff8df!important}
      body.nostalgia218Fidelity #modal:has(.consentDialog) .consentLinks{color:#eee6d0!important}

      body.nostalgia218Fidelity .bd{font-size:14px!important;line-height:1.5!important}
      body.nostalgia218Fidelity .bdTop{grid-template-columns:repeat(4,minmax(0,76px))!important;gap:7px!important;padding:8px 6px!important}
      body.nostalgia218Fidelity .bdTop .bBtn{min-height:44px!important;padding:4px 6px!important;font-size:12px!important;font-weight:700!important;line-height:1.25!important;white-space:normal!important}
      body.nostalgia218Fidelity .bdPager{grid-template-columns:44px 44px minmax(96px,118px) 44px 44px!important;gap:6px!important;padding:9px 5px!important}
      body.nostalgia218Fidelity .bdPager .pg{width:auto!important;min-width:0!important;height:44px!important;min-height:44px!important;font-size:11px!important}
      body.nostalgia218Fidelity .bd .brow{display:grid!important;grid-template-columns:22px minmax(0,1fr) minmax(68px,24%) 42px!important;align-items:center!important;gap:4px!important;min-height:52px!important;height:auto!important;padding:6px 5px!important}
      body.nostalgia218Fidelity .bd .brow .bt{display:block!important;overflow:visible!important;text-overflow:clip!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:keep-all!important;color:#111!important;font-size:14px!important;font-weight:650!important;line-height:1.38!important}
      body.nostalgia218Fidelity .bd .brow .bn{overflow:hidden!important;color:#454545!important;font-size:12px!important;line-height:1.35!important;text-align:right!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      body.nostalgia218Fidelity .bd .brow .bv{color:#5c5c5c!important;font-size:11px!important;font-variant-numeric:tabular-nums!important;text-align:center!important}
      body.nostalgia218Fidelity .bd .brow .bic{width:14px!important;height:14px!important;justify-self:center!important}
      body.nostalgia218Fidelity .bd .hint2{margin:0!important;padding:10px 12px!important;color:#454545!important;background:#f4f4f4!important;font-size:12px!important;line-height:1.55!important;word-break:keep-all!important}
      body.nostalgia218Fidelity .bd .bempty{display:grid!important;place-items:center!important;min-height:180px!important;padding:24px!important;color:#4d4d4d!important;font-size:14px!important;line-height:1.6!important;text-align:center!important;word-break:keep-all!important}
      body.nostalgia218Fidelity .bd .bempty.nostalgia218BoardLoading{color:#285a72!important;background:#eef8fc!important}
      body.nostalgia218Fidelity .bd .bempty.nostalgia218BoardError{color:#8b2a23!important;background:#fff1ef!important;border-block:1px solid #e6b0aa!important}
      body.nostalgia218Fidelity .bd .bempty.nostalgia218BoardEmpty{color:#606060!important;background:#f8f8f8!important}

      body.nostalgia218Fidelity .bdDetailTop{min-height:48px!important;padding:7px 10px!important;font-size:14px!important}
      body.nostalgia218Fidelity .bdDetailTop .bBtn{min-height:40px!important;font-size:12px!important}
      body.nostalgia218Fidelity .bdMove{min-height:48px!important}
      body.nostalgia218Fidelity .bdMove .mv{min-width:0!important;font-size:12px!important}
      body.nostalgia218Fidelity .bdBody{font-size:14px!important}
      body.nostalgia218Fidelity .bdBody .frow{display:grid!important;grid-template-columns:70px minmax(0,1fr)!important;align-items:start!important;gap:6px!important;min-height:42px!important;height:auto!important;padding:8px!important}
      body.nostalgia218Fidelity .bdBody .fl{font-size:12px!important;line-height:1.5!important}
      body.nostalgia218Fidelity .bdBody .fv{display:block!important;overflow:visible!important;text-overflow:clip!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:keep-all!important;color:#111!important;font-size:14px!important;font-weight:650!important;line-height:1.5!important}
      body.nostalgia218Fidelity .bdBody .cbandLabel{padding:9px 10px!important;font-size:13px!important;font-weight:700!important}
      body.nostalgia218Fidelity .bdBody .ctext{min-height:170px!important;padding:14px 12px!important;color:#111!important;font-size:15px!important;line-height:1.68!important;overflow-wrap:anywhere!important;word-break:keep-all!important;white-space:pre-wrap!important}
      body.nostalgia218Fidelity .bdBody .cdate{padding:7px 10px!important;color:#555!important;font-size:12px!important}
      body.nostalgia218Fidelity .bdBody .authorActions{display:flex!important;flex-wrap:wrap!important;gap:7px!important;padding:8px 10px!important}
      body.nostalgia218Fidelity .bdBody .reportBtn{width:auto!important;min-width:82px!important;min-height:40px!important;padding:6px 10px!important;font-size:12px!important}
      body.nostalgia218Fidelity .bdBody .cwarn{padding:9px 10px!important;color:#3f3520!important;background:#f4efe2!important;border-block:1px solid #c8baa0!important;font-size:12px!important;font-weight:650!important;line-height:1.5!important}
      body.nostalgia218Fidelity .bdBody .crow{padding:10px!important}
      body.nostalgia218Fidelity .bdBody .crow .ch{color:#444!important;font-size:12px!important;line-height:1.45!important}
      body.nostalgia218Fidelity .bdBody .crow .cb{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:8px!important;color:#111!important;font-size:14px!important;line-height:1.58!important;overflow-wrap:anywhere!important;word-break:keep-all!important}
      body.nostalgia218Fidelity .bdBody .commentActions{display:flex!important;flex:0 0 auto!important;flex-wrap:wrap!important;gap:5px!important}
      body.nostalgia218Fidelity .bdBody .cdel,
      body.nostalgia218Fidelity .bdBody .commentBlock{min-height:38px!important;padding:6px 9px!important;font-size:12px!important}
      body.nostalgia218Fidelity .bdBody .cInput{display:grid!important;grid-template-columns:88px minmax(0,1fr)!important;gap:7px!important;padding:9px!important}
      body.nostalgia218Fidelity .bdBody .cInput .cReg,
      body.nostalgia218Fidelity .bdBody .cInput input{height:44px!important;min-height:44px!important;font-size:14px!important}
      body.nostalgia218Fidelity .bdBody .cInput input{padding:0 10px!important;color:#111!important;background:#fff!important}

      body.nostalgia218Fidelity .nostalgia218Write{gap:10px!important;padding:18px!important}
      body.nostalgia218Fidelity .nostalgia218Write .bdlgTop b{font-size:18px!important}
      body.nostalgia218Fidelity .nostalgia218Write .wrow{grid-template-columns:74px minmax(0,1fr)!important;gap:8px!important;min-height:42px!important;font-size:14px!important}
      body.nostalgia218Fidelity .nostalgia218Write .wLabel{font-size:14px!important;font-weight:700!important;text-align:left!important}
      body.nostalgia218Fidelity .nostalgia218Write .wrow input{min-height:44px!important;font-size:15px!important}
      body.nostalgia218Fidelity .nostalgia218Write textarea{min-height:190px!important;padding:10px!important;font-size:15px!important;line-height:1.55!important}
      body.nostalgia218Fidelity .nostalgia218Write .wBtns button{min-height:44px!important;font-size:13px!important}
      body.nostalgia218Fidelity .nostalgia218Write .hint2{font-size:12px!important}
      body.nostalgia218Fidelity .nostalgia218Attachments p{font-size:11px!important;line-height:1.45!important}
      body.nostalgia218Fidelity .nostalgia218Nickname .ndlgTitle{font-size:16px!important;line-height:1.45!important}
      body.nostalgia218Fidelity .nostalgia218Nickname input{font-size:17px!important}
      body.nostalgia218Fidelity .nostalgia218Nickname button{font-size:14px!important}

      @media(max-height:740px){
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm{grid-template-rows:48px 20px 96px 32px minmax(0,1fr) 144px!important;gap:2px!important;padding-block:2px 3px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch{grid-template-rows:29px minmax(30px,1fr)!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch input,body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch button{height:30px!important;min-height:30px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmRot>.rotC{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmLogo b{font-size:12px!important}body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmLogo small{font-size:7px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm .hmQuick .hmBtn{font-size:11px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalInner{min-height:46px!important;padding-block:3px!important}
      }

      @media(max-height:600px){
        body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalInner{min-height:30px!important;padding-block:1px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalText{font-size:8px!important;line-height:10px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalButton{height:28px!important;min-height:28px!important}
      }

      @media(max-width:360px){
        body.nostalgia218Fidelity .nostalgia218Items .itemEditorial .split{grid-template-columns:104px minmax(0,1fr)!important}
        body.nostalgia218Fidelity .nostalgia218Items .ilist button{grid-template-columns:58px minmax(0,1fr)!important;gap:6px!important;min-height:66px!important}.item218Icon{width:56px!important;height:56px!important}
        body.nostalgia218Fidelity .runeClient.classicSkinned .runeSocket{width:25px!important;height:25px!important}.runeClient.classicSkinned .runeSocket.quint{width:42px!important;height:42px!important}
        body.nostalgia218Fidelity .bdTop{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;padding-inline:4px!important}.bdTop .bBtn{font-size:11px!important}
        body.nostalgia218Fidelity .bdPager{grid-template-columns:40px 40px minmax(86px,1fr) 40px 40px!important;gap:3px!important}
        body.nostalgia218Fidelity .nostalgia218Write{padding:14px!important}.nostalgia218Write .wrow{grid-template-columns:66px minmax(0,1fr)!important}.nostalgia218Write .wBtns{gap:5px!important}
        body.nostalgia218Fidelity .bd .brow{grid-template-columns:18px minmax(0,1fr) 62px 36px!important;padding-inline:3px!important}
        body.nostalgia218Fidelity .bd .brow .bt{font-size:13px!important}
        body.nostalgia218Fidelity .bd .brow .bn{font-size:11px!important}
        body.nostalgia218Fidelity .bdBody .cInput{grid-template-columns:1fr!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch{grid-template-columns:minmax(0,1fr) 58px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmSearch input{font-size:11px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll #view.homeView>.hm>.hmLogo small{max-width:42%!important}
        body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalInner{gap:6px!important;padding-inline:8px!important}
        body.nostalgia218Fidelity.finalHomeNoScroll.finalHasLegalFooter>#floatingLegalFooter .finalLegalText{font-size:9px!important;line-height:12px!important}
        #persistentArchiveDock{grid-template-columns:28px minmax(0,1fr) auto!important;gap:6px!important;padding-inline:8px!important}
        #persistentArchiveDock>span{font-size:9px!important}
        #persistentArchiveDock>b{font-size:11px!important}
        #persistentArchiveDock>small{display:none!important}
        body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #modalBody{padding:44px 27px 36px!important}
        body.nostalgia218Fidelity.historicalApkReference.classicFantasyArchive #modal[data-startup-notice="true"] #close{top:18px!important;right:14px!important;width:30px!important;height:30px!important;font-size:21px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function initialize() {
    if (initialized) return;
    if (typeof render !== 'function' || typeof S === 'undefined') {
      setTimeout(initialize, 40);
      return;
    }
    initialized = true;
    removeBuilderFromNormalUi();
    installRouteBoundary();
    installItemRenderer();
    installRuneRenderer();
    injectStyle();
    installCaptureHandlers();
    window.addEventListener('resize', syncRunePageGeometry, { passive: true });
    window.addEventListener('classic-locale-change', localizePersistentArchiveDock);
    new MutationObserver(decorateCurrentUi).observe(document.body, { childList: true, subtree: true });
    decorateCurrentUi();
    if (S.view === 'builder') S.view = 'home';
    render();
  }

  window.__LOLCLASSIC_NOSTALGIA_218__ = Object.freeze({
    version: VERSION,
    maxPostImages: MAX_POST_IMAGES,
    get officialPortraitCount() { return typeof champions === 'undefined' ? 0 : champions.filter(champion => champion.sourceUrl?.includes('/mode/classic/champion/')).length; },
    historicalApkGameOrContentAssetsImported: 0,
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
