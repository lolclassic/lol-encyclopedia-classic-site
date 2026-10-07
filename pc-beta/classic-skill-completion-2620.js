/* Bind 26.20 changed/new Classic skill values to exact source bytes and identities. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicSkillCompletion2620 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sha256 = 'a9cb5f196b276da7e8b319950bf0adf0f3346b59eaece6602e65c926701fd8b2';
  const runtimeSha256 = '3afe5ef91f36aee6d245e8d3f1b48e437123d40ea01923d57b8efb7c739f14a5';
  const slots = Object.freeze({Jade_Aatrox:'PQWER',Jade_Caitlyn:'PQWER',Jade_Irelia:'PQWER',Jade_Karma:'PQWER',Jade_Quinn:'PQWER',Jade_Fiora:'W',Jade_Fizz:'QWE',Jade_Graves:'WER',Jade_Kennen:'W',Jade_Nautilus:'PW',Jade_Amumu:'WER',Jade_KogMaw:'R',Jade_Pantheon:'P',Jade_Shyvana:'QWER'});
  const assert = (ok, message) => { if (!ok) throw new Error('Classic 26.20: ' + message); };
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const hex = value => /^[a-f0-9]{64}$/.test(value || '');
  const digest = async bytes => Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)), n=>n.toString(16).padStart(2,'0')).join('');
  async function createVerified(bytes, current, manifest, damageView) {
    assert(bytes instanceof ArrayBuffer && await digest(bytes) === sha256,'skill data byte hash mismatch');
    const data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    assert(data.schemaVersion === 1 && data.classification === 'RIOT_CLASSIC_CLIENT_26_20_CHANGED_AND_ADDED_SKILLS'
      && data.dataDragonVersion === '16.20.1' && data.clientVersion === '16.20.824.8524'
      && hex(data.clientExecutableSha256) && hex(data.localizationSource?.sha256)
      && data.dataDragonIndexSha256 === manifest?.sourceIndexSha256
      && manifest?.version === '16.20.1' && manifest.combinedSha256 === runtimeSha256
      && current?.champions?.length === 77 && current.skills?.champions?.length === 77
      && current.skills.source?.version === '16.20.1' && data.skillCount === 44
      && data.unresolved?.length === 0 && same(Object.keys(data.champions).sort(),Object.keys(slots).sort()),'roster or provenance mismatch');
    const champions = new Map(current.champions.map(row=>[row.riotId,row]));
    const skills = new Map(current.skills.champions.map(row=>[row.championInternal,row.skills]));
    const staged = [];
    for (const [id, expectedSlots] of Object.entries(slots)) {
      const source = data.champions[id], champion = champions.get(id), target = skills.get(id);
      assert(source?.id === id && source.key === String(champion?.riotKey)
        && source.dataDragonSourceUrl === champion.sourceUrl
        && source.clientSource?.internalPath === `data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin`
        && hex(source.clientSource.sha256) && /^[a-f0-9]{16}$/.test(source.clientSource.pathHash || '')
        && same(Object.keys(source.skills),[...expectedSlots]) && target?.length === 5,'champion source mismatch: '+id);
      for (const slot of expectedSlots) {
        const row = target['PQWER'.indexOf(slot)], detail = source.skills[slot];
        assert(row?.slot === slot && row.riotId === detail?.spellId
          && row.sourceUrl === source.dataDragonSourceUrl && row.sourceVersion === '16.20.1'
          && detail.source?.dataDragonSha256 === champion.sourceSha256
          && detail.source.binSha256 === source.clientSource.sha256
          && detail.sourceSpellPath.startsWith(`Characters/${id}/`)
          && detail.maxRank >= 1 && detail.maxRank <= 18
          && Array.isArray(detail.damages) && Array.isArray(detail.forms)
          && detail.damages.every(value=>value.resolved === true)
          && Object.values(detail.valuesByToken || {}).every(value=>value.resolved === true)
          && typeof detail.tooltip === 'string' && detail.tooltip.trim(),'skill source mismatch: '+id+':'+slot);
        damageView.description(detail);
        damageView.render(detail);
        staged.push({row,detail,source});
      }
    }
    assert(staged.length === 44,'incomplete skill supplement');
    for (const {row,detail,source} of staged) {
      row.damageDetails = detail;
      delete row.displayDetails;
      row.calculationStatus = 'verified-16.20-classic-client';
      row.supplementalSource = {classification:data.classification,dataDragonVersion:data.dataDragonVersion,clientVersion:data.clientVersion,clientBinSha256:source.clientSource.sha256,localizationSha256:data.localizationSource.sha256};
      if (detail.rangePresentation) row.rangePresentation = detail.rangePresentation;
    }
    return {championCount:14,skillCount:44,clientVersion:data.clientVersion,sha256};
  }
  return Object.freeze({createVerified});
});
