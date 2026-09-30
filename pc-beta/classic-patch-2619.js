/* Preserve reviewed 26.18 display evidence only where the 26.19 skill is unchanged. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicPatch2619 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const previousVersion = '16.18.1';
  const currentVersion = '16.19.1';
  const previousHash = '8da1b8e411c21fb8d2981ffb200073e306390bd069b89baf6d13ce3da5c9d022';
  const currentHash = 'db989805fe7c5a0dd4eaef4b89f092a4523c72abebcec41a0b09b6e6c946ded8';
  const additions = ['Jade_Fizz', 'Jade_Graves', 'Jade_Nami', 'Jade_Nautilus'];
  const slots = ['P', 'Q', 'W', 'E', 'R'];
  const carriedFields = ['nameKo', 'summaryKo', 'detailKo', 'damageDetails', 'rangeByRank',
    'rangeInfo', 'rangePresentation', 'calculationStatus', 'supplementalSource',
    'localEvidence', 'displayDetails', 'proseSource'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const sha256 = value => /^[a-f0-9]{64}$/.test(value || '');
  const assert = (condition, message) => { if (!condition) throw new Error('Classic 26.19: ' + message); };
  const originalAbility = (champion, index) => index === 0
    ? champion.raw.passive : champion.raw.spells[index - 1];
  function withoutImage(ability) {
    const copy = clone(ability);
    delete copy.image;
    return copy;
  }
  /** Inputs must first pass ModeClassicChampions.createVerified. The previous
   * runtime must also pass ClassicPatchUpdates.apply with its exact 26.18 data.
   * All bindings are checked before any champion or skill is changed.
   */
  function apply(previous, current, previousManifest, currentManifest, english) {
    assert(previousManifest?.version === previousVersion && previousManifest.combinedSha256 === previousHash
      && currentManifest?.version === currentVersion && currentManifest.combinedSha256 === currentHash
      && previous.skills?.source?.version === previousVersion
      && current.skills?.source?.version === currentVersion
      && previous.skills.supplementalSource?.targetVersion === previousVersion,
    'verified source or previous supplement mismatch');
    const older = new Map(previous.champions.map(row => [row.riotId, row]));
    const fresh = new Map(current.champions.map(row => [row.riotId, row]));
    const oldSkills = new Map(previous.skills.champions.map(row => [row.championInternal, row.skills]));
    const freshSkills = new Map(current.skills.champions.map(row => [row.championInternal, row.skills]));
    assert(older.size === 68 && fresh.size === 72 && oldSkills.size === 68 && freshSkills.size === 72
      && same([...fresh.keys()].filter(id => !older.has(id)), additions)
      && [...older.keys()].every(id => fresh.has(id))
      && same([...fresh.keys()].sort(), Object.keys(english?.champions || {}).sort())
      && english.schemaVersion === 1 && english.classification === 'RIOT_CLASSIC_ENGLISH_LABELS'
      && english.version === currentVersion && english.locale === 'en_US'
      && english.sourceIndexUrl === `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/mode/classic/champion.json`
      && sha256(english.sourceIndexSha256), 'roster or English source mismatch');

    const changes = [];
    let carried = 0, changed = 0, added = 0;
    for (const [id, champion] of fresh) {
      const previousChampion = older.get(id), labels = english.champions[id];
      const skills = freshSkills.get(id), old = oldSkills.get(id);
      assert(champion.raw?.id === id && currentManifest.champions[id]?.routeId === champion.id
        && champion.sourceSha256 === currentManifest.champions[id].sourceSha256
        && labels?.key === champion.raw.key && typeof labels.nameEn === 'string' && labels.nameEn.trim()
        && labels.sourceUrl === `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/mode/classic/champion/${id}.json`
        && sha256(labels.sourceSha256) && Array.isArray(labels.skills) && labels.skills.length === 5
        && Array.isArray(skills) && skills.length === 5 && (!previousChampion ||
          (previousChampion.raw?.id === id && previousChampion.raw.key === champion.raw.key
            && previousManifest.champions[id]?.sourceSha256 === previousChampion.sourceSha256
            && Array.isArray(old) && old.length === 5)), 'champion identity mismatch: ' + id);
      const stagedSkills = [];
      skills.forEach((skill, index) => {
        const source = originalAbility(champion, index), label = labels.skills[index];
        const spellId = index === 0 ? null : source.id;
        assert(skill.slot === slots[index] && skill.riotId === spellId
          && skill.sourceVersion === currentVersion && skill.sourceUrl === champion.sourceUrl
          && label?.slot === slots[index] && label.spellId === spellId
          && typeof label.nameEn === 'string' && label.nameEn.trim(),
        'skill identity mismatch: ' + id + ':' + slots[index]);
        const values = {};
        if (previousChampion && old[index].slot === skill.slot && old[index].riotId === skill.riotId
            && same(withoutImage(originalAbility(previousChampion, index)), withoutImage(source))) {
          for (const field of carriedFields) {
            if (Object.hasOwn(old[index], field)) values[field] = clone(old[index][field]);
          }
          carried++;
        } else {
          values.calculationStatus = 'unavailable-exact-classic-client-values';
          values.rangePresentation = {kind: 'hidden', reason: '26.19-skill-values-unverified', valuesByRank: []};
          if (previousChampion) changed++; else added++;
        }
        values.nameEn = label.nameEn;
        values.nameSource = {version: currentVersion, sourceUrl: labels.sourceUrl,
          sha256: labels.sourceSha256, sourceField: index ? `spells[${index - 1}].name` : 'passive.name'};
        stagedSkills.push(values);
      });
      changes.push({champion, previousChampion, labels, skills, stagedSkills});
    }
    for (const change of changes) {
      change.champion.nameEn = change.labels.nameEn;
      if (change.previousChampion?.raw.name === change.champion.raw.name) {
        change.champion.ko = change.previousChampion.ko;
        change.champion.nameKo = change.previousChampion.nameKo;
      }
      change.skills.forEach((skill, index) => Object.assign(skill, change.stagedSkills[index]));
    }
    const summary = {previousVersion, targetVersion: currentVersion,
      championCount: fresh.size, carriedSkillCount: carried,
      changedSkillCount: changed, newSkillCount: added,
      sourceCombinedSha256: currentHash, englishIndexSha256: english.sourceIndexSha256};
    current.skills.supplementalSource = summary;
    return summary;
  }
  return Object.freeze({apply});
});
