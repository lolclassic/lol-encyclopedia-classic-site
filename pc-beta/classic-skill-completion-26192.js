/* Add the 44 verified 26.19 Classic client skills missing from the frozen base. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicSkillCompletion26192 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sha256 = '38b9e9666cd216186c696640a7b43316d786ea3e2d1c91d535063d65f48b6a0d';
  const runtimeSha256 = 'db989805fe7c5a0dd4eaef4b89f092a4523c72abebcec41a0b09b6e6c946ded8';
  const missing = Object.freeze({
    Jade_Akali: 'E', Jade_Fiora: 'QWER', Jade_Fizz: 'PQWER', Jade_Galio: 'WER',
    Jade_Graves: 'PQWER', Jade_Kassadin: 'Q', Jade_Malphite: 'R', Jade_Morgana: 'WR',
    Jade_Nami: 'PQWER', Jade_Nautilus: 'PQWER', Jade_Poppy: 'PQW',
    Jade_Shyvana: 'QWE', Jade_Sona: 'E', Jade_Tristana: 'E',
    Jade_TwistedFate: 'ER', Jade_XinZhao: 'P', Jade_Zilean: 'E',
  });
  const assert = (condition, message) => { if (!condition) throw new Error('Classic 26.19.2: ' + message); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const digest = async bytes => Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes)),
    n => n.toString(16).padStart(2, '0')).join('');
  const hex = value => /^[a-f0-9]{64}$/.test(value || '');
  async function createVerified(bytes, current, manifest, damageView) {
    assert(bytes instanceof ArrayBuffer && await digest(bytes) === sha256, 'data byte hash mismatch');
    const data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    const championIds = Object.keys(missing).sort();
    assert(data.schemaVersion === 1 && data.classification === 'RIOT_CLASSIC_CLIENT_26_19_MISSING_SKILLS'
      && data.dataDragonVersion === '16.19.1' && /^16\.19\./.test(data.clientVersion || '')
      && hex(data.clientExecutableSha256) && hex(data.localizationSource?.sha256)
      && data.dataDragonIndexSha256 === manifest?.sourceIndexSha256
      && manifest?.combinedSha256 === runtimeSha256 && manifest.version === '16.19.1'
      && data.skillCount === 44 && same(Object.keys(data.champions).sort(), championIds)
      && current?.champions?.length === 72 && current.skills?.champions?.length === 72
      && current.skills.source?.version === '16.19.1', 'roster or provenance mismatch');
    const champions = new Map(current.champions.map(row => [row.riotId, row]));
    const skills = new Map(current.skills.champions.map(row => [row.championInternal, row.skills]));
    const staged = [];
    const prior = current.skills.champions.flatMap(row => row.skills);
    assert(prior.length === 360
      && prior.filter(row => row.damageDetails).length === 305
      && prior.filter(row => row.displayDetails).length === 11
      && prior.filter(row => !row.damageDetails && !row.displayDetails).length === 44,
    'existing skill coverage changed');
    for (const id of championIds) {
      const source = data.champions[id], champion = champions.get(id), target = skills.get(id);
      assert(source?.id === id && source.key === String(champion?.riotKey)
        && source.dataDragonSourceUrl === champion.sourceUrl
        && source.clientSource?.internalPath === `data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin`
        && hex(source.clientSource.sha256) && /^[a-f0-9]{16}$/.test(source.clientSource.pathHash || '')
        && same(Object.keys(source.skills), [...missing[id]])
        && target?.length === 5, 'champion binding mismatch: ' + id);
      for (const slot of missing[id]) {
        const index = 'PQWER'.indexOf(slot), row = target[index], detail = source.skills[slot];
        assert(row?.slot === slot && row.riotId === detail?.spellId
          && row.sourceUrl === source.dataDragonSourceUrl && row.sourceVersion === '16.19.1'
          && row.calculationStatus === 'unavailable-exact-classic-client-values'
          && !row.damageDetails && !row.displayDetails
          && detail?.source?.dataDragonSha256 === champion.sourceSha256
          && detail.source.binSha256 === source.clientSource.sha256
          && detail.sourceSpellPath.startsWith(`Characters/${id}/`)
          && detail.maxRank >= 1 && detail.maxRank <= 18
          && Array.isArray(detail.damages) && Array.isArray(detail.forms)
          && detail.damages.every(value => value.resolved === true)
          && Object.values(detail.valuesByToken || {}).every(value => value.resolved === true)
          && typeof detail.tooltip === 'string' && detail.tooltip.length > 0,
        'missing-skill binding mismatch: ' + id + ':' + slot);
        // Validate every sourced formula and tooltip before assigning any row.
        damageView.description(detail);
        damageView.render(detail);
        staged.push({row, detail, source});
      }
    }
    assert(staged.length === 44, 'incomplete skill supplement');
    for (const {row, detail, source} of staged) {
      row.damageDetails = detail;
      row.calculationStatus = 'verified-16.19-classic-client';
      row.supplementalSource = {
        classification: data.classification, dataDragonVersion: data.dataDragonVersion,
        clientVersion: data.clientVersion, clientBinSha256: source.clientSource.sha256,
        localizationSha256: data.localizationSource.sha256,
      };
      if (detail.rangePresentation) row.rangePresentation = detail.rangePresentation;
    }
    return {championCount: championIds.length, skillCount: staged.length,
      preservedSkillCount: 316, clientVersion: data.clientVersion, sha256};
  }
  return Object.freeze({createVerified});
});
