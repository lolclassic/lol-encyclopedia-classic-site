/* Expose the verified runtime roster without replacing source names or portraits. */
(() => {
  'use strict';
  function publishRoster() {
    if (typeof booted === 'undefined' || !booted) {
      setTimeout(publishRoster, 100);
      return;
    }
    window.__LOLCLASSIC_EXACT_ROSTER__ = Object.freeze({
      ids: champions.map(champion => champion.id),
      names: Object.fromEntries(champions.map(champion => [champion.id, champion.ko])),
      sourceIds: champions.map(champion => champion.riotId),
      portraitUnavailable: [],
    });
  }
  publishRoster();
})();
