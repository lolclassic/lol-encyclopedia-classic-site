(function (root) {
  'use strict';
  const slots = ['P', 'Q', 'W', 'E', 'R'];
  const policy = 'exact-jade-client-detail-metadata';
  const sha256 = value => /^[a-f0-9]{64}$/.test(value || '');
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const passiveFields = {
    Jade_Alistar: 'mSpell.castRangeDisplayOverride',
    Jade_Fiddlesticks: 'mSpell.DataValues[name=PassiveRange].values',
    Jade_Heimerdinger: 'mSpell.castRangeValues.values',
    Jade_Soraka: 'mSpell.castRange',
    Jade_Vayne: 'mSpell.DataValues[name=Range].values',
    Jade_Wukong: 'mSpell.castRange',
  };
  // These are source identity/semantic rules, not guessed range values.
  const formRules = {
    Jade_GarenECancel: ['Jade_Garen', 'E', 'cancel', 'no-target', 'Spell_GarenECancel_Name'],
    Jade_GragasQ_Toggle: ['Jade_Gragas', 'Q', 'recast', 'no-target', null],
    Jade_KennenECancel: ['Jade_Kennen', 'E', 'cancel', 'no-target', 'Spell_KennenE_Cancel_Jade_Name'],
    Jade_NidaleePounce: ['Jade_Nidalee', 'W', 'cougar', 'cast-range', 'Spell_NidaleeCougarW_Jade_Name', 'mSpell.castRangeDisplayOverride'],
    Jade_NidaleeSwipe: ['Jade_Nidalee', 'E', 'cougar', 'cast-range', 'Spell_NidaleeCougarE_Jade_Name', 'mSpell.castRange'],
    Jade_NidaleeTakedown: ['Jade_Nidalee', 'Q', 'cougar', 'attack-linked', 'Spell_NidaleeCougarQ_Jade_Name'],
    Jade_ShacoHallucinateGuide: ['Jade_Shaco', 'R', 'command', 'unprovided', 'Spell_Jade_ShacoRGuide_Name'],
    Jade_TwistedFateEMarker: ['Jade_TwistedFate', 'E', 'recast', 'unprovided', 'Spell_Gate_Name'],
    Jade_WukongR_Leave: ['Jade_Wukong', 'R', 'cancel', 'no-target', null],
  };
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }
  function expandName(key, entries, seen = []) {
    assert(Object.hasOwn(entries, key) && !seen.includes(key) && seen.length < 10,
      'Unverified/cyclic Classic English name');
    return entries[key].replace(/\{\{\s*([^{}]+?)\s*\}\}/g,
      (_match, nested) => expandName(nested.trim(), entries, [...seen, key]));
  }
  function verifyRange(info, champion, ownerPath, field, kind) {
    const source = info?.source;
    const original = source?.originalValues;
    assert(info?.kind === kind && typeof info.label === 'string' && info.label.trim()
      && source?.policy === policy && source.internalPath === champion.clientSource.internalPath
      && source.binSha256 === champion.clientSource.sha256 && source.sourceSpellPath === ownerPath
      && source.field === field
      && Array.isArray(original) && original.length === 7
      && original.every(value => Number.isFinite(value) && value > 0 && value < 10000)
      && new Set(original).size === 1 && same(info.valuesByRank, [original[0]]),
    'Unverified Classic range field or engine default rejected');
  }
  const usableRange = values => Array.isArray(values) && values.length > 0
    && values.every(value => typeof value === 'number' && Number.isFinite(value) && value > 20 && value < 10000);
  function activeRangePresentation(original, context) {
    const hidden = reason => ({kind: 'hidden', reason, valuesByRank: []});
    const targeters = context.targeters, targetType = context.targetingType;
    if (!original.length || original.every(value => value <= 20)) return hidden('no-usable-range');
    if (targetType === 'Self' && !targeters.length) return hidden('self-cast-without-target-range');
    if (usableRange(original)) return {kind: 'original-range',
      label: targetType === 'SelfAoe' ? '효과 범위' : (targetType === 'Self' ? '표시 범위' : '사거리'),
      valuesByRank: original, field: 'data-dragon.range'};
    if (original.every(value => value === 4294967295) && same(context.castRangeDisplayOverride, Array(7).fill(-1))
        && usableRange(context.castRange)) return {kind: 'client-cast-range', label: '사거리',
      valuesByRank: context.castRange.slice(1, original.length + 1), field: 'mSpell.castRange'};
    const candidates = [];
    if (['Location', 'Direction', 'Cone'].includes(targetType)) targeters.forEach((targeter, index) => {
      const kind = targeter.__type;
      const values = kind === 'TargeterDefinitionLine' ? targeter.overrideBaseRange?.mPerLevelValues
        : (kind === 'TargeterDefinitionCone' ? [targeter.coneRange] : []);
      if (usableRange(values) && new Set(values).size === 1) candidates.push({index, kind, value: values[0],
        suffix: kind === 'TargeterDefinitionLine' ? 'overrideBaseRange.mPerLevelValues' : 'coneRange'});
    });
    if (candidates.length && new Set(candidates.map(row => row.value)).size === 1) return {
      kind: 'client-targeter-range', label: candidates[0].kind === 'TargeterDefinitionLine' ? '조준선 범위' : '조준 범위',
      valuesByRank: [candidates[0].value],
      fields: candidates.map(row => `mSpell.mClientData.mTargeterDefinitions[${row.index}].${row.suffix}`),
      reason: 'direct-targeter-only-not-projectile-distance'};
    return hidden('unbounded-or-engine-range-without-finite-display');
  }
  function attach(data, current) {
    const client = data?.clientMetadata;
    assert(data?.schemaVersion === 1 && data.classification === 'EXACT_CLASSIC_DETAIL_METADATA'
      && data.ordinaryFallback === false && data.version === '16.17.1'
      && client?.sourcePolicy === policy && client.clientVersion === '16.17.810.4348'
      && sha256(client.sourceManifestSha256) && sha256(client.englishStringtableSha256),
    'Unverified Classic detail metadata');
    const entries = client.englishEntries;
    const expectedKeys = Object.values(formRules).map(rule => rule[4]).filter(Boolean).concat('Spell_KennenE_Jade_Name').sort();
    assert(entries && same(Object.keys(entries).sort(), expectedKeys)
      && Object.values(entries).every(value => typeof value === 'string' && value.length > 0 && value.length < 512),
    'Unexpected Classic client English keys');
    const ids = current.champions.map(champion => champion.riotId);
    assert(same(Object.keys(data.champions || {}).sort(), [...ids].sort()), 'Classic detail roster mismatch');
    const updates = [];
    const championUpdates = [];
    let totalForms = 0;
    for (const champion of current.champions) {
      const row = data.champions[champion.riotId];
      const base = 'https://ddragon.leagueoflegends.com/cdn/' + data.version + '/data/';
      assert(row?.id === champion.riotId && row.key === champion.riotKey && row.rangeSourceSha256 === champion.sourceSha256
        && row.rangeSourceUrl === champion.sourceUrl
        && row.englishSourceUrl === base + 'en_US/mode/classic/champion/' + champion.riotId + '.json'
        && sha256(row.englishSha256) && row.skills?.length === 5 && Array.isArray(row.forms),
      'Classic detail source mismatch');
      const skills = current.skills.champions.find(entry => entry.championInternal === champion.riotId)?.skills;
      assert(skills?.length === 5 && skills.every(skill => skill.damageDetails && Array.isArray(skill.damageDetails.forms)),
        'Classic calculations must be bound before detail metadata');
      assert(row.clientSource?.internalPath === 'data/characters/' + row.id.toLowerCase() + '/' + row.id.toLowerCase() + '.bin'
          && row.clientSource.clientVersion === client.clientVersion && sha256(row.clientSource.sha256),
        'Non-Jade client detail source rejected');
      row.skills.forEach((skill, index) => {
        const original = index ? champion.raw.spells[index - 1] : champion.raw.passive;
        assert(skill.slot === slots[index] && typeof skill.nameEn === 'string' && skill.nameEn.trim()
          && same(skill.rangeByRank, original.range || []), 'Classic skill binding mismatch');
        const field = index === 0 && passiveFields[row.id];
        if (field) verifyRange(skill.rangeInfo, row, skills[index].damageDetails.sourceSpellPath, field, 'effect-range');
        else assert(skill.rangeInfo === undefined, 'Unreviewed passive/active client range rejected');
        if (index) {
          const context = skill.rangeContext;
          assert(context?.sourceSpellPath === skills[index].damageDetails.sourceSpellPath
            && context.spellId === skills[index].riotId
            && (context.targetingType === null || typeof context.targetingType === 'string')
            && Array.isArray(context.castRange) && context.castRange.every(Number.isFinite)
            && Array.isArray(context.castRangeDisplayOverride) && context.castRangeDisplayOverride.every(Number.isFinite)
            && Array.isArray(context.targeters) && context.targeters.every(value => value && typeof value === 'object')
            && same(skill.rangePresentation, activeRangePresentation(skill.rangeByRank, context)),
          'Unverified Classic active range presentation');
        } else assert(skill.rangeContext === undefined && skill.rangePresentation === undefined,
          'Active range classification cannot replace a passive');
        updates.push({target: skills[index], nameEn: skill.nameEn, rangeByRank: [...skill.rangeByRank],
          rangeInfo: skill.rangeInfo, rangePresentation: skill.rangePresentation});
      });
      const actualForms = skills.flatMap(skill => skill.damageDetails.forms.map(form => ({form, slot: skill.slot})));
      assert(row.forms.length === actualForms.length
        && new Set(row.forms.map(form => form.spellId)).size === row.forms.length, 'Classic form coverage mismatch');
      for (const form of row.forms) {
        const rule = formRules[form.spellId];
        const actual = actualForms.find(entry => entry.form.spellId === form.spellId);
        assert(rule && rule[0] === row.id && rule[1] === form.parentSlot && rule[2] === form.nameRelation
          && actual?.slot === form.parentSlot && actual.form.sourceSpellPath === form.sourceSpellPath
          && form.sourceSpellPath.startsWith('Characters/' + row.id + '/'), 'Wrong Classic form/parent binding');
        const source = form.nameSource;
        if (rule[4]) {
          assert(source?.method === 'direct-jade-client-key' && source.keyName === rule[4]
            && source.stringtableSha256 === client.englishStringtableSha256
            && form.nameEn === expandName(source.keyName, entries), 'Unverified Classic form English name');
        } else {
          assert(source?.method === 'parent-name-with-relation' && source.keyNameAbsent === true
            && source.parentSlot === form.parentSlot && source.relation === form.nameRelation
            && source.englishSourceUrl === row.englishSourceUrl
            && form.nameEn === row.skills[slots.indexOf(form.parentSlot)].nameEn,
          'Unnamed Classic form must preserve its parent name and relationship');
        }
        if (rule[5]) {
          verifyRange(form.rangeInfo, row, form.sourceSpellPath, rule[5], rule[3]);
        } else {
          const info = form.rangeInfo;
          assert(info?.kind === rule[3] && typeof info.label === 'string' && info.label.trim()
            && typeof info.text === 'string' && info.text.trim() && !/\d/.test(info.text)
            && same(info.valuesByRank, []) && info.source === undefined,
          'Unknown/untargeted Classic form must not acquire a numeric range');
        }
        updates.push({target: actual.form, nameEn: form.nameEn, nameRelation: form.nameRelation,
          nameSource: form.nameSource, rangeInfo: form.rangeInfo, rangeByRank: [...form.rangeInfo.valuesByRank]});
        totalForms++;
      }
      championUpdates.push({target: champion, nameEn: row.nameEn});
    }
    assert(totalForms === Object.keys(formRules).length, 'Missing Classic secondary form');
    // Validation is complete before any current runtime objects are mutated.
    for (const {target, ...values} of updates) Object.assign(target, values);
    for (const {target, ...values} of championUpdates) {
      Object.assign(target, values);
      // Explicit display-name request; the Jade ID and original JSON stay intact.
      if (target.riotId === 'Jade_Nunu') target.ko = target.nameKo = '누누';
    }
  }
  function formatRange(values) {
    const numbers = values.map(value => root.ClassicDamageView?.formatNumber(value)
      ?? Number(Number(value).toFixed(3)).toString());
    return new Set(numbers).size === 1 ? numbers[0] : numbers.join('/');
  }
  function rangeText(skill) {
    const values = skill.rangeByRank;
    if (skill.rangePresentation) return skill.rangePresentation.kind === 'hidden' ? '' : formatRange(skill.rangePresentation.valuesByRank);
    if (!usableRange(values)) return '';
    return formatRange(values);
  }
  function infoText(info) {
    return info.valuesByRank?.length ? formatRange(info.valuesByRank) : info.text;
  }
  function rangeLines(skill) {
    const main = skill.rangeInfo;
    const presentation = skill.rangePresentation;
    const lines = [];
    if (main && usableRange(main.valuesByRank)) lines.push({label: main.label, text: infoText(main)});
    else if (presentation && presentation.kind !== 'hidden') lines.push({label: presentation.label, text: formatRange(presentation.valuesByRank)});
    else if (!presentation && usableRange(skill.rangeByRank)) lines.push({label: '사거리', text: rangeText(skill)});
    for (const form of skill.damageDetails?.forms || []) {
      if (form.rangeInfo && usableRange(form.rangeInfo.valuesByRank)) lines.push({label: form.rangeInfo.label, text: infoText(form.rangeInfo), nameEn: form.nameEn});
    }
    return lines;
  }
  root.ClassicDetailExtras = Object.freeze({attach, rangeText, rangeLines});
  if (typeof module === 'object' && module.exports) module.exports = root.ClassicDetailExtras;
})(typeof window === 'undefined' ? globalThis : window);
