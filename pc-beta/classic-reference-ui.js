(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicReferenceUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  let bundled = [];
  let effectTerms = [];
  let termMigrations = [];
  let aliasesByItem = new Map();
  let releasesByChampion = new Map();
  const koCompare = (a, b) => a.ko.localeCompare(b.ko, 'ko') || String(a.id).localeCompare(String(b.id));
  function setCatalogMetadata(aliasData, releaseData, items, champions, itemCatalog = null) {
    if (aliasData?.schemaVersion !== 1 || !Array.isArray(aliasData.items)
        || releaseData?.schemaVersion !== 1 || !releaseData.champions) throw new Error('Invalid catalog metadata');
    const nextAliases = new Map(aliasData.items.map(row => [String(row.riotId), row]));
    const nextReleases = new Map(Object.entries(releaseData.champions));
    const currentItemIds = new Set(items.map(item => String(item.riotId)));
    const newCatalog = ['16.19.1', '16.20.1'].includes(itemCatalog?.version);
    const invalidItems = itemCatalog
      ? !newCatalog || itemCatalog.items?.length !== 150 || items.length !== 150
        || currentItemIds.size !== items.length
        || itemCatalog.items.some((row, index) => row.purchasable !== true
          || row.riotId !== items[index].riotId || row.i !== items[index].i)
        || nextAliases.size !== aliasData.items.length || aliasData.items.some(row => !Array.isArray(row.aliases))
      : nextAliases.size !== items.length || items.some(item => {
        const row = nextAliases.get(String(item.riotId));
        return !row || row.itemIndex !== item.i || !Array.isArray(row.aliases);
      });
    if (invalidItems || nextReleases.size !== champions.length || champions.some(champion => {
      const row = nextReleases.get(champion.riotId);
      return !row || row.appId !== champion.id || !row.nameEn
        || !/^\d{4}-\d{2}-\d{2}$/.test(row.releaseDate) || !row.sourceRefs?.length;
    })) throw new Error('Catalog metadata must match the full Classic roster and item set');
    aliasesByItem = newCatalog
      ? new Map([...nextAliases].filter(([id]) => currentItemIds.has(id))) : nextAliases;
    releasesByChampion = nextReleases;
  }
  function championEnglishName(champion) { return champion.riotId === 'Jade_Nunu' ? 'Nunu' : releasesByChampion.get(champion.riotId)?.nameEn || champion.nameEn || ''; }
  function matchesChampionSearch(value, query, initialName = value) {
    const haystack = String(value || '').toLocaleLowerCase('ko');
    const needle = String(query || '').trim().toLocaleLowerCase('ko');
    const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
    if (!needle || !Array.from(needle).every(c => initials.includes(c))) return haystack.includes(needle);
    const extracted = Array.from(String(initialName || ''), c => {
      const offset = c.codePointAt(0) - 0xac00;
      return offset >= 0 && offset < 11172 ? initials[Math.floor(offset / 588)] : c;
    }).join('');
    return extracted.includes(needle);
  }
  function sortChampions(champions, sort = 'ko') {
    return [...champions].sort((a, b) => sort === 'rel'
      ? (releasesByChampion.get(a.riotId)?.releaseDate || '9999-99-99').localeCompare(releasesByChampion.get(b.riotId)?.releaseDate || '9999-99-99') || koCompare(a, b)
      : koCompare(a, b));
  }
  function itemAliasesMarkup(item) {
    const aliases = aliasesByItem.get(String(item.riotId))?.aliases || [];
    return aliases.length ? '<p class="itemAliases"><b>' + esc(ui('한국 서버 약칭')) + '</b> ' + aliases.map(esc).join(' · ') + '</p>' : '';
  }
  function migratedName(name) {
    let value = name;
    const seen = new Set();
    while (!seen.has(value)) {
      seen.add(value);
      const migration = termMigrations.find(row => row.from === value);
      if (!migration) return value;
      if (migration.action === 'delete' || !migration.to) return '';
      value = migration.to;
    }
    return value;
  }
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const locale = () => typeof globalThis !== 'undefined' ? globalThis.ClassicLocale : null;
  const ui = value => locale()?.text(value) || value;
  function normalize(entry) {
    if (!entry || typeof entry !== 'object') return null;
    let ko = String(entry.termKo || '').trim();
    ko = migratedName(ko);
    let en = String(entry.termEn || '').trim();
    const embedded = ko.match(/^(.*?)\s*\(([^()]+)\)$/);
    if (embedded && !en && /[A-Za-z]/.test(embedded[2])) { ko = embedded[1].trim(); en = embedded[2].trim(); }
    ko = migratedName(ko);
    const description = String(entry.description || '').trim();
    const aliases = Array.isArray(entry.aliases) ? entry.aliases.filter(value => typeof value === 'string').map(value => value.trim()).filter(Boolean) : [];
    return ko && description ? { termKo: ko, termEn: en, description, aliases } : null;
  }
  function setData(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.entries)) throw new Error('Invalid glossary data');
    termMigrations = Array.isArray(data.migrations) ? data.migrations.map(row => ({...row})) : [];
    const entries = data.entries.map(normalize);
    if (entries.some(entry => !entry || !entry.termEn)) throw new Error('Glossary requires Korean, English and description');
    if (new Set(entries.map(entry => entry.termKo)).size !== entries.length) throw new Error('Duplicate glossary term');
    bundled = entries;
  }
  function registerEffectTerms(rows) {
    if (!Array.isArray(rows)) throw new Error('Invalid effect glossary terms');
    const next = rows.map(normalize);
    if (next.some(row => !row?.termEn)
        || new Set(next.map(row => row.termKo)).size !== next.length
        || next.some(row => bundled.some(base => base.termKo === row.termKo)))
      throw new Error('Effect glossary duplicates a reviewed term');
    effectTerms = next;
  }
  function baseTerms() { return [...bundled, ...effectTerms].map(entry => ({...entry, aliases:[...entry.aliases]})); }
  function mergeTerms(shared, complete = false) {
    // A complete CMS list has already merged by stable ID. Equal display names
    // may describe different entries and must not overwrite each other here.
    if (complete) {
      const merged = (Array.isArray(shared) ? shared : []).map(normalize).filter(Boolean);
      // App-authored effect definitions remain available even when CMS edits a
      // separate entry with the same label. Skip only unchanged CMS copies.
      const exactCopies = new Set(merged.map(entry => JSON.stringify([entry.termKo, entry.termEn, entry.description])));
      for (const entry of effectTerms) {
        if (!exactCopies.has(JSON.stringify([entry.termKo, entry.termEn, entry.description])))
          merged.push({...entry, aliases:[...entry.aliases]});
      }
      return merged.sort((a, b) => a.termKo.localeCompare(b.termKo, 'ko'));
    }
    const merged = new Map([...bundled, ...effectTerms].map(entry => [entry.termKo, { ...entry, aliases:[...entry.aliases] }]));
    (Array.isArray(shared) ? shared : []).forEach(raw => {
      const entry = normalize(raw);
      if (!entry) return;
      const existing = merged.get(entry.termKo);
      merged.set(entry.termKo, { ...entry, termEn: entry.termEn || existing?.termEn || '' });
    });
    return [...merged.values()].sort((a, b) => a.termKo.localeCompare(b.termKo, 'ko'));
  }
  function filterTerms(entries, query) {
    const q = String(query || '').trim().toLocaleLowerCase('ko');
    return entries.filter(entry => !q || [entry.termKo, entry.termEn, entry.description, ...(entry.aliases || [])].some(value => value.toLocaleLowerCase('ko').includes(q)));
  }
  function renderTerms(entries) {
    const language = locale()?.getLocale() || 'ko_KR';
    return '<ul class="cmts classicGlossary">' + (entries.map(entry => {
      const primary = language === 'ko_KR' ? entry.termKo : entry.termEn || entry.termKo;
      const secondary = language === 'ko_KR' ? entry.termEn : entry.termKo;
      const description = language === 'ko_KR' ? '<p>' + esc(entry.description) + '</p>' : '';
      return '<li><div class="classicGlossaryHeading"><b>' + esc(primary) + '</b><span class="classicGlossaryEnglish" lang="' + (language === 'ko_KR' ? 'en' : 'ko') + '">' + esc(secondary) + '</span></div>' + description + '</li>';
    }).join('') || '<li class="hint">' + esc(ui('검색 결과가 없습니다.')) + '</li>') + '</ul>';
  }
  function relationHeading(direction) {
    if (direction === 'components') return '<h3 class="bar itemRelationHeading" data-relation="components">' + esc(ui('하위 아이템 · 조합 재료')) + '</h3><p class="hint itemRelationExplanation">' + esc(ui('이 아이템을 만들 때 필요한 재료입니다.')) + '</p>';
    if (direction === 'upgrades') return '<h3 class="bar itemRelationHeading" data-relation="upgrades">' + esc(ui('상위 아이템 · 업그레이드')) + '</h3><p class="hint itemRelationExplanation">' + esc(ui('이 아이템을 재료로 사용해 만들 수 있습니다.')) + '</p>';
    throw new Error('Unknown item relation direction');
  }
  return Object.freeze({ setData, registerEffectTerms, baseTerms, mergeTerms, filterTerms, renderTerms, relationHeading,
    setCatalogMetadata, championEnglishName, matchesChampionSearch, sortChampions, itemAliasesMarkup, migratedName,
    migrations: () => termMigrations.map(row => ({...row})) });
});
