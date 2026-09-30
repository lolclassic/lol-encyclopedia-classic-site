/* Local, exact-ID Classic skin artwork viewer. No model or chroma art is synthesized. */
(function (root) {
  'use strict';
  let active = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const labels = {
    ko_KR: { detail:'상세 정보', view:'스킨 크게 보기', stage:'일러스트 확대 및 크로마 넘기기', art:'일러스트',
      zoom:'일러스트 확대', out:'축소', reset:'원래 크기', in:'확대', chromaNav:'크로마 넘기기',
      prev:'이전 크로마', next:'다음 크로마', variants:'스킨과 크로마 선택', base:'기본',
      unavailable:'모델링 이미지가 제공되지 않습니다.', failed:'일러스트를 불러오지 못했습니다.',
      representative:'원본 스킨 일러스트 · 크로마 외형 이미지 없음' },
    ja_JP: { detail:'詳細情報', view:'スキンを拡大表示', stage:'イラストの拡大とクロマの切り替え', art:'イラスト',
      zoom:'イラストの拡大', out:'縮小', reset:'元のサイズ', in:'拡大', chromaNav:'クロマの切り替え',
      prev:'前のクロマ', next:'次のクロマ', variants:'スキンとクロマを選択', base:'デフォルト',
      unavailable:'モデル画像はありません。', failed:'イラストを読み込めませんでした。',
      representative:'元のスキンイラスト · クロマの外観画像はありません' },
    en_US: { detail:'Details', view:'View skin larger', stage:'Zoom artwork and switch chromas', art:'Artwork',
      zoom:'Zoom artwork', out:'Zoom out', reset:'Original size', in:'Zoom in', chromaNav:'Switch chromas',
      prev:'Previous chroma', next:'Next chroma', variants:'Select skin or chroma', base:'Base',
      unavailable:'No model image is available.', failed:'Could not load the artwork.',
      representative:'Base skin artwork · no chroma appearance image' },
  };
  const ui = () => labels[root.ClassicLocale?.getLocale?.()] || labels.ko_KR;

  function installStyle() {
    if (document.getElementById('classicSkinViewerStyle')) return;
    const style = document.createElement('style');
    style.id = 'classicSkinViewerStyle';
    style.textContent = `
      body .cvSkins.classicSkinCards>li{display:block!important;padding:0!important}
      body .classicSkinCard{display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-height:82px!important;margin:0!important;padding:12px!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;text-align:left!important}
      body .classicSkinCard>.pic.cvci{display:block!important;flex:0 0 84px!important;width:84px!important;height:58px!important;border:1px solid #9b7b43!important}
      body .classicSkinCard>.pic.cvci img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important}
      body .classicSkinCard>span:not(.pic){flex:1!important;min-width:0!important;font-size:16px!important;white-space:normal!important;overflow-wrap:anywhere!important}
      body .classicSkinCard small{display:block!important;margin-top:5px!important;color:#bca777!important;font-size:13px!important}
      body .classicSkinCard>b{flex:0 0 20px!important;font-size:28px!important;color:#d3b76c!important}
      body .classicSkinCard:focus-visible{outline:2px solid #e9c771!important;outline-offset:-3px!important}
      #modal.classicSkinDialog{box-sizing:border-box!important;width:min(960px,calc(100vw - 16px))!important;max-width:960px!important;max-height:calc(100dvh - 16px)!important;margin:auto!important;padding:46px 14px 16px!important;border:1px solid #a78a50!important;border-radius:8px!important;background:#10191e!important;color:#f5e7bd!important;overflow-x:hidden!important;overflow-y:auto!important}
      #modal.classicSkinDialog #close{position:absolute!important;right:5px!important;top:3px!important;width:44px!important;height:40px!important;min-width:44px!important;min-height:40px!important;z-index:10!important;background:#213038!important;color:#f5e7bd!important;border:1px solid #a78a50!important}
      #modal.classicSkinDialog #modalBody{padding:0!important;background:transparent!important;overflow:visible!important}
      #modal.classicSkinDialog .classicSkinViewer{width:100%!important;min-width:0!important;color:#f5e7bd!important;background:transparent!important}
      #modal.classicSkinDialog h2{margin:0 0 8px!important;padding:0!important;color:#f5e7bd!important;background:none!important;border:0!important;font-size:20px!important;line-height:1.45!important;overflow-wrap:anywhere!important}
      #modal.classicSkinDialog .classicSkinVariantName{margin:0 0 12px!important;color:#e1c785!important;font-size:16px!important;line-height:1.5!important;overflow-wrap:anywhere!important}
      #modal.classicSkinDialog .classicSkinStage{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:100%!important;height:clamp(220px,48dvh,600px)!important;overflow:hidden!important;background:#070d11!important;border:1px solid #6b6047!important;touch-action:none!important;cursor:grab!important;user-select:none!important}
      #modal.classicSkinDialog .classicSkinStage img{display:block!important;flex:none!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;transform-origin:center!important;pointer-events:none!important;user-select:none!important}
      #modal.classicSkinDialog .classicSkinStage img[hidden]{display:none!important}
      #modal.classicSkinDialog .classicSkinStage:active{cursor:grabbing!important}
      #modal.classicSkinDialog .classicSkinZoom{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;margin:10px 0!important}
      #modal.classicSkinDialog button{box-sizing:border-box!important;min-width:44px!important;min-height:44px!important;padding:8px 12px!important;color:#f5e7bd!important;background:#24333c!important;border:1px solid #8b764b!important;border-radius:5px!important;font-size:16px!important;line-height:1.4!important;text-shadow:none!important}
      #modal.classicSkinDialog button:disabled{opacity:.4!important}
      #modal.classicSkinDialog button:focus-visible,.classicSkinStage:focus-visible{outline:2px solid #ffe0a0!important;outline-offset:2px!important}
      #modal.classicSkinDialog .classicSkinVariantNav{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin:10px 0!important}
      #modal.classicSkinDialog .classicSkinVariantNav[hidden]{display:none!important}
      #modal.classicSkinDialog .classicSkinVariantNav output{color:#e1c785!important;font-size:15px!important;text-align:center!important}
      #modal.classicSkinDialog .classicSkinVariants{display:flex!important;gap:8px!important;overflow-x:auto!important;overscroll-behavior-x:contain!important;scroll-snap-type:x proximity!important;padding:3px 2px 10px!important;scrollbar-width:thin!important;touch-action:pan-x!important}
      #modal.classicSkinDialog .classicSkinVariants[hidden]{display:none!important}
      #modal.classicSkinDialog .classicSkinVariants button{flex:0 0 auto!important;max-width:230px!important;white-space:normal!important;scroll-snap-align:center!important;overflow-wrap:anywhere!important;font-size:15px!important}
      #modal.classicSkinDialog .classicSkinVariants button[aria-pressed=true]{background:#cfb46d!important;color:#211b0e!important;border-color:#f8e2a4!important}
      #modal.classicSkinDialog .classicSkinImageCaption,#modal.classicSkinDialog .classicSkinModelStatus{margin:8px 0!important;color:#c6b991!important;font-size:13px!important;line-height:1.5!important;white-space:normal!important}
      #modal.classicSkinDialog .classicSkinModelStatus{padding-top:8px!important;border-top:1px solid #43505a!important}
      @media(max-height:600px){#modal.classicSkinDialog .classicSkinStage{height:240px!important}}
    `;
    document.head.appendChild(style);
  }

  function close() {
    if (!active) return;
    const previous = active;
    active = null;
    previous.controller.abort();
    previous.modal.classList.remove('classicSkinDialog');
    previous.modal.setAttribute('aria-label', previous.originalLabel);
  }

  function open({ media, championId, championName, skinId }) {
    const group = media?.skinGroupFor(championId, skinId);
    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    if (!group || !modal || !body || !Array.isArray(group.variants) || !group.variants.length) return false;
    close();
    installStyle();
    const text = ui();
    const originalLabel = modal.getAttribute('aria-label') || text.detail;
    const controller = new AbortController();
    const state = { modal, controller, originalLabel, index: 0, zoom: 1, x: 0, y: 0 };
    active = state;
    modal.classList.add('classicSkinDialog');
    modal.setAttribute('aria-label', `${championName} ${text.view}`);
    body.innerHTML = `<section class="classicSkinViewer" data-classic-champion="${escape(championId)}" data-parent-skin-id="${escape(group.id)}">
      <h2>${escape(championName)} · ${escape(group.ko)}</h2>
      <p class="classicSkinVariantName" aria-live="polite"></p>
      <div class="classicSkinStage" tabindex="0" role="group" aria-label="${text.stage}">
        <img src="${escape(group.img)}" alt="${escape(group.ko)} ${text.art}" draggable="false">
      </div>
      <div class="classicSkinZoom" role="group" aria-label="${text.zoom}">
        <button type="button" data-skin-zoom="out" aria-label="${text.out}">−</button>
        <button type="button" data-skin-zoom="reset" aria-label="${text.reset}">100%</button>
        <button type="button" data-skin-zoom="in" aria-label="${text.in}">＋</button>
      </div>
      <p class="classicSkinImageCaption"></p>
      <nav class="classicSkinVariantNav" aria-label="${text.chromaNav}" ${group.variants.length < 2 ? 'hidden' : ''}>
        <button type="button" data-skin-step="-1" aria-label="${text.prev}">‹</button>
        <output aria-live="polite"></output>
        <button type="button" data-skin-step="1" aria-label="${text.next}">›</button>
      </nav>
      <div class="classicSkinVariants" role="group" aria-label="${text.variants}" ${group.variants.length < 2 ? 'hidden' : ''}>
        ${group.variants.map((variant, index) => `<button type="button" data-skin-variant="${index}" aria-pressed="false">${escape(index === 0 ? text.base : variant.ko.startsWith(group.ko + ' (') ? variant.ko.slice(group.ko.length + 2, -1) : variant.ko)}</button>`).join('')}
      </div>
      <p class="classicSkinModelStatus">${text.unavailable}</p>
    </section>`;
    const viewer = body.querySelector('.classicSkinViewer');
    const stage = viewer.querySelector('.classicSkinStage');
    const image = stage.querySelector('img');
    const variants = viewer.querySelector('.classicSkinVariants');
    const name = viewer.querySelector('.classicSkinVariantName');
    const caption = viewer.querySelector('.classicSkinImageCaption');
    const on = (target, type, callback, extra = {}) => target.addEventListener(type, callback, { ...extra, signal: controller.signal });
    let failed = false;
    function paintZoom() {
      const ratio = Math.min(1, stage.clientWidth / (image.naturalWidth || 1), stage.clientHeight / (image.naturalHeight || 1));
      const maxX = Math.max(0, ((image.naturalWidth || 1) * ratio * state.zoom - stage.clientWidth) / 2);
      const maxY = Math.max(0, ((image.naturalHeight || 1) * ratio * state.zoom - stage.clientHeight) / 2);
      state.x = clamp(state.x, -maxX, maxX);
      state.y = clamp(state.y, -maxY, maxY);
      image.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.zoom})`;
      viewer.dataset.zoom = String(state.zoom);
      viewer.querySelector('[data-skin-zoom=reset]').textContent = `${Math.round(state.zoom * 100)}%`;
      viewer.querySelector('[data-skin-zoom=out]').disabled = failed || state.zoom <= 1;
      viewer.querySelector('[data-skin-zoom=in]').disabled = failed || state.zoom >= 4;
      viewer.querySelector('[data-skin-zoom=reset]').disabled = failed;
    }
    function zoom(value) { state.zoom = clamp(value, 1, 4); if (state.zoom === 1) state.x = state.y = 0; paintZoom(); }
    function select(index) {
      state.index = clamp(index, 0, group.variants.length - 1);
      const variant = group.variants[state.index];
      viewer.dataset.skinId = String(variant.id);
      name.textContent = variant.ko;
      caption.textContent = failed ? text.failed : variant.representativePreview
        ? text.representative : text.art;
      viewer.querySelector('.classicSkinVariantNav output').textContent = `${state.index + 1} / ${group.variants.length}`;
      viewer.querySelector('[data-skin-step="-1"]').disabled = state.index === 0;
      viewer.querySelector('[data-skin-step="1"]').disabled = state.index === group.variants.length - 1;
      for (const button of variants.children) button.setAttribute('aria-pressed', String(Number(button.dataset.skinVariant) === state.index));
      const selected = variants.children[state.index];
      if (selected) variants.scrollLeft = selected.offsetLeft - variants.offsetLeft - (variants.clientWidth - selected.offsetWidth) / 2;
      zoom(1);
    }
    on(viewer, 'click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-skin-variant')) select(Number(button.dataset.skinVariant));
      else if (button.hasAttribute('data-skin-step')) select(state.index + Number(button.dataset.skinStep));
      else if (button.dataset.skinZoom) zoom(button.dataset.skinZoom === 'reset' ? 1 : state.zoom + (button.dataset.skinZoom === 'in' ? .5 : -.5));
    });
    const pointers = new Map();
    let start = null;
    let pinch = null;
    const distance = () => { const pair = [...pointers.values()]; return Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y); };
    const midpoint = () => { const pair = [...pointers.values()]; return { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 }; };
    on(stage, 'pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      stage.setPointerCapture(event.pointerId);
      if (pointers.size === 1) start = { x: event.clientX, y: event.clientY, panX: state.x, panY: state.y, zoom: state.zoom, time: performance.now() };
      if (pointers.size === 2) { pinch = { distance: Math.max(1, distance()), zoom: state.zoom, center: midpoint(), x: state.x, y: state.y }; start = null; }
    });
    on(stage, 'pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch && pointers.size === 2 && !failed) {
        const bounds = stage.getBoundingClientRect(), center = midpoint();
        const nextZoom = clamp(pinch.zoom * distance() / pinch.distance, 1, 4), scale = nextZoom / pinch.zoom;
        state.x = center.x - bounds.x - bounds.width / 2 - (pinch.center.x - bounds.x - bounds.width / 2 - pinch.x) * scale;
        state.y = center.y - bounds.y - bounds.height / 2 - (pinch.center.y - bounds.y - bounds.height / 2 - pinch.y) * scale;
        state.zoom = nextZoom;
        paintZoom();
      }
      else if (start && state.zoom > 1) { state.x = start.panX + event.clientX - start.x; state.y = start.panY + event.clientY - start.y; paintZoom(); }
    });
    function release(event) {
      if (!pointers.has(event.pointerId)) return;
      if (event.type === 'pointerup' && start && pointers.size === 1 && start.zoom === 1 && state.zoom === 1) {
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.2 && performance.now() - start.time < 1200) select(state.index + (dx < 0 ? 1 : -1));
      }
      pointers.delete(event.pointerId);
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      pinch = null; start = null;
      if (pointers.size === 1) {
        const remaining = [...pointers.values()][0];
        start = { x: remaining.x, y: remaining.y, panX: state.x, panY: state.y, zoom: state.zoom, time: performance.now() };
      }
    }
    on(stage, 'pointerup', release); on(stage, 'pointercancel', release);
    on(stage, 'dblclick', () => { if (!failed) zoom(state.zoom > 1 ? 1 : 2); });
    on(stage, 'wheel', event => { if (event.ctrlKey && !failed) { event.preventDefault(); zoom(state.zoom + (event.deltaY < 0 ? .25 : -.25)); } }, { passive: false });
    on(modal, 'keydown', event => {
      if (event.key === 'Escape') return; // Native dialog/Android back close the shared modal.
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); select(state.index + (event.key === 'ArrowRight' ? 1 : -1)); }
      else if (['+', '=', '-', '0'].includes(event.key) && !failed) { event.preventDefault(); zoom(event.key === '0' ? 1 : state.zoom + (event.key === '-' ? -.5 : .5)); }
    });
    on(image, 'load', paintZoom);
    on(image, 'error', () => { failed = true; image.hidden = true; select(state.index); });
    on(root, 'resize', paintZoom);
    on(modal, 'close', () => { if (active === state && !modal.open) close(); });
    if (!modal.open) modal.showModal();
    select(0);
    stage.focus({ preventScroll: true });
    return true;
  }
  installStyle();
  root.ClassicSkinViewer = Object.freeze({ open });
})(window);
