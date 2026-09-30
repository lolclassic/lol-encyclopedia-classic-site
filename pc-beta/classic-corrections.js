(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicCorrections = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const kind = 'classic_correction_v1';
  const prefix = 'classic-correction-';
  const stableId = /^[a-z0-9][a-z0-9._-]{1,95}$/;
  const sha = /^[a-f0-9]{64}$/;
  const slots = new Set(['P', 'Q', 'W', 'E', 'R']);
  let binding;
  const fail = () => { throw new Error('cms_classic_correction_invalid'); };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function keys(value, allowed) {
    if (!object(value) || Object.keys(value).some(key => !allowed.includes(key))) fail();
  }
  function plain(value, limit, multiline) {
    if (typeof value !== 'string' || !value.trim() || value.length > limit
        || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
        || (!multiline && /[\r\n\u0085\u2028\u2029]/u.test(value))
        || /[a-z][a-z0-9+.-]*:\/\/|javascript:|data:|mailto:|tel:|www\./i.test(value)) fail();
    return value;
  }
  function reserved(entry) {
    return String(entry?.id || entry?.entityId || '').startsWith(prefix) || entry?.payload?.kind === kind;
  }
  function configure(runtime, champions) {
    if (!sha.test(runtime?.combinedSha256 || '') || champions.length !== Object.keys(runtime.champions || {}).length) fail();
    const map = new Map();
    for (const champion of champions) {
      const record = runtime.champions[champion.riotId];
      if (!record || record.routeId !== champion.id || record.sourceSha256 !== champion.sourceSha256
          || champion.sourceVersion !== runtime.version || !sha.test(record.sourceSha256)
          || record.sourceUrl !== `https://ddragon.leagueoflegends.com/cdn/${runtime.version}/data/${runtime.locale}/mode/classic/champion/${champion.riotId}.json`) fail();
      map.set(champion.riotId, {route: champion.id, hash: record.sourceSha256});
    }
    binding = {version: runtime.version, map};
  }
  function image(id, assets, removed) {
    if (typeof id !== 'string' || !stableId.test(id)) fail();
    if (removed) return undefined;
    const asset = assets.get(id);
    if (!asset || asset.assetId !== id || !/^assetrev_[0-9a-f-]{36}$/.test(asset.assetRevisionId || '')
        || asset.url !== `/api/v1/cms/assets/${asset.sha256}` || !sha.test(asset.sha256 || '') || !['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)
        || !Number.isInteger(asset.size) || asset.size < 1 || asset.size > 5 * 1024 * 1024
        || !Number.isInteger(asset.width) || asset.width < 1
        || !Number.isInteger(asset.height) || asset.height < 1) fail();
    return `https://appassets.androidplatform.net/cms-assets/${asset.sha256}`;
  }
  function verify(entries, assets) {
    const result = {};
    const seen = new Set();
    for (const entry of entries) {
      if (!reserved(entry)) continue;
      const value = entry.payload;
      keys(value, ['kind', 'championId', 'sourceVersion', 'sourceSha256', 'nameKo', 'portraitAssetId', 'skills']);
      const source = binding?.map.get(value.championId);
      if (value.kind !== kind || !source || typeof entry.tombstone !== 'boolean'
          || (entry.id || entry.entityId) !== prefix + source.route
          || value.sourceVersion !== binding.version || value.sourceSha256 !== source.hash || seen.has(value.championId)) fail();
      seen.add(value.championId);
      const row = {skills: {}};
      if (value.nameKo !== undefined) row.nameKo = plain(value.nameKo, 100, false);
      if (value.portraitAssetId !== undefined) row.portrait = image(value.portraitAssetId, assets, entry.tombstone);
      if (value.skills !== undefined) {
        if (!object(value.skills)) fail();
        for (const [slot, fields] of Object.entries(value.skills)) {
          if (!slots.has(slot)) fail();
          keys(fields, ['nameKo', 'description', 'iconAssetId']);
          const skill = {};
          if (fields.nameKo !== undefined) skill.nameKo = plain(fields.nameKo, 100, false);
          if (fields.description !== undefined) skill.description = plain(fields.description, 6000, true);
          if (fields.iconAssetId !== undefined) skill.icon = image(fields.iconAssetId, assets, entry.tombstone);
          if (Object.keys(skill).length) row.skills[slot] = Object.freeze(skill);
        }
      }
      if (entry.tombstone || (!row.nameKo && !row.portrait && !Object.keys(row.skills).length)) continue;
      result[value.championId] = Object.freeze({...row, skills: Object.freeze(row.skills)});
    }
    return Object.freeze(result);
  }
  return Object.freeze({configure, reserved, verify});
});
