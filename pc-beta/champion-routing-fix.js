(() => {
  'use strict';

  const clean = value => {
    try {
      return decodeURIComponent(String(value == null ? '' : value)).trim().toLowerCase();
    } catch (_) {
      return String(value == null ? '' : value).trim().toLowerCase();
    }
  };
  const compact = value => clean(value).replace(/[^a-z0-9가-힣]/g, '');

  function championList() {
    try {
      return Array.isArray(champions) ? champions : [];
    } catch (_) {
      return [];
    }
  }

  function canonicalChampionId(raw, list = championList()) {
    const token = compact(raw);
    if (!token) return '';
    const match = list.find(entry => (
      compact(entry && entry.id) === token
      || compact(entry && entry.en) === token
      || compact(entry && entry.ko) === token
    ));
    return match ? String(match.id) : token;
  }

  function idFromPortraitSource(src, list = championList()) {
    const decoded = clean(src);
    const match = decoded.match(/(?:^|\/)(?:classic_)?champ_img\/([^/?#]+)\.(?:png|jpe?g|webp)(?:[?#].*)?$/i);
    return match ? canonicalChampionId(match[1], list) : '';
  }

  function idFromButtonLabel(button, list = championList()) {
    if (!button) return '';
    const label = button.getAttribute('aria-label') || button.querySelector('.cgName, small, b')?.textContent || '';
    return canonicalChampionId(label, list);
  }

  function resolveChampionId(button, list = championList()) {
    if (!button) return '';

    // The logical champion ID and visible label are authoritative.
    // Classic portrait files are intentionally remapped and their filenames may
    // belong to another champion, so portrait-derived IDs must be the last fallback.
    const candidates = [
      canonicalChampionId(button.dataset && button.dataset.champ, list),
      idFromButtonLabel(button, list),
      idFromPortraitSource(button.querySelector('img')?.getAttribute('src'), list),
    ].filter(Boolean);

    if (!list.length) return candidates[0] || '';
    return candidates.find(id => list.some(entry => String(entry.id) === id)) || '';
  }

  function openChampion(id) {
    if (!id) return;
    try {
      if (typeof go === 'function') {
        go(`champion/${id}/basic`);
        return;
      }
    } catch (_) {}
    location.hash = `champion/${id}/basic`;
  }

  function repairChampionRoute() {
    const match = String(location.hash || '').match(/^#champion\/([^/]+)(\/.*)?$/i);
    if (!match) return;
    const id = canonicalChampionId(match[1]);
    if (!id) return;
    const next = `#champion/${id}${match[2] || '/basic'}`;
    if (location.hash !== next) history.replaceState(null, '', next);
  }

  document.addEventListener('click', event => {
    const target = event.target && event.target.closest ? event.target.closest('[data-champ]') : null;
    if (!target) return;

    const id = resolveChampionId(target);
    if (!id) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (typeof captureChampionListScrollBeforeDetail === 'function') {
        captureChampionListScrollBeforeDetail();
      }
    } catch (_) {}
    target.dataset.champ = id;
    openChampion(id);
  }, true);

  window.__lolClassicChampionRouting = {
    canonicalChampionId,
    idFromPortraitSource,
    resolveChampionId,
  };

  repairChampionRoute();
  window.addEventListener('hashchange', repairChampionRoute);
})();
