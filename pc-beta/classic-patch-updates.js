/* Carry the verified Classic base forward only with reviewed official changes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicPatchUpdates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const baseVersion = '16.17.1';
  const targetVersion = '16.18.1';
  const baseHash = '2f4c3233e14b75337ec57e1b9e699cb567d4406020507354bc0b7c8dce991048';
  const calculationHash = '372449f5d26fc5427c5603720a26ddc46b753b62745dcc374e187d40d15b82dd';
  const sourceHash = 'aa22de0fade06631e8e8d64fac8e42b554813782c6e5a0298bb080fc58ad3f4b';
  const sourceUrl = 'https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-18-notes/';
  const slots = ['P', 'Q', 'W', 'E', 'R'];
  const addedIds = ['Jade_Fiora', 'Jade_Galio', 'Jade_Poppy', 'Jade_Shyvana', 'Jade_XinZhao'];
  const fields = ['damageDetails', 'nameEn', 'rangeByRank', 'rangeInfo', 'rangePresentation'];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const clone = value => JSON.parse(JSON.stringify(value));
  const sha256 = value => /^[a-f0-9]{64}$/.test(value || '');
  // Display bindings reviewed against skills-deep-audit.json. These are not a
  // damage model: unresolved consumers remain separate, even in a full tooltip.
  const ap = value => `<scaleAP>(+${value} AP)</scaleAP>`;
  const ad = value => `<scaleAD>(+${value} AD)</scaleAD>`;
  const bonusAd = value => `<scaleAD>(+추가 ${value} AD)</scaleAD>`;
  const reviewedBindings = {
    Jade_Fiora: {
      Q: {totaldamage:`40/65/90/115/140 ${bonusAd('0.6')}`},
      W: {bonusad:'15/20/25/30/35',reflectiondamage:`60/110/160/210/260 ${ap('1')}`},
      E: {'asbonus*100':'60/75/90/105/120','msbonus*100':'7/9/11/13/15',halfcooldown:'7.5/7/6.5/6/5.5'},
    },
    Jade_Galio: {
      Q: {totaldamage:`80/135/190/245/300 ${ap('0.6')}`,slowduration:'2.5',slowpercent:'24/28/32/36/40'},
      E: {totaldamage:`60/105/150/195/240 ${ap('0.5')}`,'movespeedmod*100':'20/28/36/44/52'},
    },
    Jade_Poppy: {
      W: {passiveduration:'5',bonusstats:'1.5/2/2.5/3/3.5',maxstacks:'10',activeduration:'5','speed*100':'17/19/21/23/25'},
      E: {initialdamagecalc:`50/75/100/125/150 ${ap('0.4')}`,walldamagecalc:`75/125/175/225/275 ${ap('0.4')}`,stunduration:'1.5'},
      R: {duration:'6/7/8',damagemulti:'20/30/40'},
    },
    Jade_Shyvana: {
      Q: {calc_bonus_damage:ad('0.8/0.85/0.9/0.95/1'),cooldown_reduction:'0.5'},
      W: {movespeedduration:'3',damage:`25/40/55/70/85 ${bonusAd('0.2')}`,'basemovespeed*100':'30/35/40/45/50',durationincreaseperhit:'1',maxdurationincrease:'4'},
      R: {damage:`200/300/400 ${ap('0.7')}`,seasonone_armormrgain:'10/15/20'},
    },
    Jade_XinZhao: {
      Q: {totalbonusdamageperhit:`15/30/45/60/75 ${ad('0.2')}`,knockupduration:'0.8'},
      W: {totalhealamount:`26/32/38/44/50 ${ap('0.7')}`,duration:'5','attackspeedbonus*100':'40/50/60/70/80'},
      E: {totalmagicdamage:`70/105/140/175/210 ${ap('0.6')}`,slowduration:'2',slowamount:'25/30/35/40/45'},
    },
  };
  function reviewedTooltip(id, slot, original) {
    const separate = {
      'Jade_Fiora:P':'피오라는 피해를 입힐 때마다 <healing>8 (+1 × (챔피언 레벨 − 1))의 체력</healing>을 6초에 걸쳐 회복합니다. 챔피언을 맞히면 이 효과를 최대 4회 중첩할 수 있습니다.',
      'Jade_Galio:P':'갈리오는 <scaleMR>총 마법 저항력의 50%</scaleMR>만큼 <scaleAP>추가 주문력</scaleAP>을 얻습니다.',
      'Jade_Poppy:P':original.description,
      'Jade_XinZhao:P':original.description,
      'Jade_Shyvana:P':original.description + '<br><br>기본 공격은 Q의 재사용 대기시간을 0.5초 줄이고, W의 지속시간을 1초 늘립니다. W의 연장 상한은 4초입니다.<br><br>E의 별도 추가 피해 비율은 15%입니다. 기본 공격으로 분노를 2 얻으며, 자연 회복량은 1.5초당 분노 1입니다.',
      'Jade_Fiora:R':original.description + `<br><br>개별 타격의 피해 수치는 <physicalDamage>160/330/500 ${bonusAd('1.15')}</physicalDamage>입니다. 별도 반복 타격 계산은 개별 피해량의 25%이며, 5타 전체의 합산 피해량으로 표시하지 않습니다.`,
      'Jade_Galio:W':original.description + `<br><br>방벽의 <scaleArmor>방어력</scaleArmor>과 <scaleMR>마법 저항력</scaleMR> 증가량은 30/45/60/75/90입니다. 개별 회복 수치는 <healing>25/40/55/70/85 ${ap('0.3')}</healing>이며, 반복 회복의 적용 관계는 미확인입니다.`,
      'Jade_Galio:R':original.description + `<br><br>기본 피해 수치는 <magicDamage>220/330/440 ${ap('0.6')}</magicDamage>이며, 피해 감소 계수는 0.5입니다.<br><br>별도 피격당 증가 계수는 0.05, 피격 횟수 상한 값은 8입니다. 증가량과 상한의 적용 관계가 미확인되어 최종 피해량으로 합산하지 않습니다.`,
      'Jade_Poppy:Q':original.description + `<br><br>기본 피해 계산은 <magicDamage>20/40/60/80/100 ${ad('1')} ${ap('0.6')}</magicDamage>입니다.<br><br>별도로 최대 체력 비율 8%와 상한 값 55/110/165/220/275가 있습니다. 대상 능력치와 상한의 적용 관계가 미확인되어 하나의 피해식으로 합산하지 않습니다.`,
      'Jade_Shyvana:E':original.description + `<br><br>화염구의 직격은 <magicDamage>80/125/170/215/260 ${ap('0.6')}의 마법 피해</magicDamage>를 입힙니다. 표식은 4초 동안 <scaleArmor>방어력을 15% 감소</scaleArmor>시킵니다.<br><br>별도 추가 피해 계산은 <magicDamage>0.15 × 직격 피해</magicDamage>입니다. 별도 최대 체력 관련 값은 2%이며, 위 추가 피해 계산과의 적용 관계는 미확인입니다. 두 값을 합산하거나 용 형상 E의 피해식으로 적용하지 않습니다.`,
      'Jade_XinZhao:R':original.description + `<br><br>개별 피해 수치는 <physicalDamage>75/175/275 ${bonusAd('1')}</physicalDamage>입니다. 별도 현재 체력 비율은 15%이며, 적용 관계가 미확인되어 하나의 피해식으로 합산하지 않습니다.<br><br>적중한 챔피언 1명당 6초 동안 <scaleArmor>방어력</scaleArmor>과 <scaleMR>마법 저항력</scaleMR>을 15/20/25 얻습니다.`,
    };
    if (Object.hasOwn(separate, id + ':' + slot)) return separate[id + ':' + slot];
    const bindings = reviewedBindings[id]?.[slot];
    assert(bindings && typeof original.tooltip === 'string', 'missing inline tooltip: ' + id + ':' + slot);
    let result = original.tooltip.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, token) => {
      if (token === 'spellmodifierdescriptionappend') return '';
      assert(Object.hasOwn(bindings, token), 'unreviewed tooltip token: ' + id + ':' + slot + ':' + token);
      return bindings[token];
    });
    if (id === 'Jade_Shyvana' && slot === 'R') result += '<br><br>기본 공격으로 분노를 2 얻으며, 용 형상에서는 초당 분노를 6 소모합니다.';
    return result;
  }
  function assert(condition, message) {
    if (!condition) throw new Error('Classic patch: ' + message);
  }
  function safeObject(value) {
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      assert(!['__proto__', 'prototype', 'constructor'].includes(key), 'unsafe object key');
      safeObject(value[key]);
    }
  }
  function indexRuntime(runtime, version, ids, records, sourceField) {
    const prefix = `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/mode/classic/`;
    assert(runtime?.skills?.source?.version === version && runtime.skills.source.locale === 'ko_KR'
      && runtime.skills.source.url === prefix + 'champion.json', 'wrong runtime version or Classic source');
    assert(same(runtime.champions.map(row => row.riotId).sort(), ids)
      && same(runtime.skills.champions.map(row => row.championInternal).sort(), ids), 'runtime roster mismatch');
    const skillRows = new Map(runtime.skills.champions.map(row => [row.championInternal, row]));
    const byId = new Map();
    for (const champion of runtime.champions) {
      const id = champion.riotId;
      const record = records[id];
      const row = skillRows.get(id);
      assert(/^Jade_[A-Za-z0-9_]+$/.test(id) && record && champion.raw?.id === id
        && String(champion.riotKey) === String(record.key) && String(champion.raw.key) === String(record.key)
        && champion.sourceVersion === version && champion.sourceUrl === prefix + `champion/${id}.json`
        && sha256(champion.sourceSha256) && champion.sourceSha256 === record[sourceField]
        && same(champion.raw.spells.map(spell => spell.id), record.spellIds)
        && row.appId === champion.id && row.skills.length === 5, 'champion identity/source mismatch: ' + id);
      row.skills.forEach((skill, index) => {
        assert(skill.slot === slots[index] && skill.sourceVersion === version
          && skill.sourceUrl === champion.sourceUrl && skill.riotId === (index ? record.spellIds[index - 1] : null),
        'skill identity mismatch: ' + id + ':' + slots[index]);
      });
      byId.set(id, {champion, skills: row.skills});
    }
    return byId;
  }
  function replaceChecked(target, operation, allowedFields = fields) {
    assert(operation && typeof operation.path === 'string' && operation.path.startsWith('/')
      && Object.hasOwn(operation, 'expected') && Object.hasOwn(operation, 'value'), 'invalid replacement');
    const keys = operation.path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'));
    assert(keys.length < 32 && allowedFields.includes(keys[0]) && keys.every(key =>
      key && !['__proto__', 'prototype', 'constructor'].includes(key)), 'replacement outside supplemental fields');
    let owner = target;
    for (const key of keys.slice(0, -1)) {
      assert(owner && typeof owner === 'object' && Object.hasOwn(owner, key), 'missing replacement parent');
      owner = owner[key];
    }
    const key = keys.at(-1);
    assert(owner && typeof owner === 'object' && Object.hasOwn(owner, key)
      && same(owner[key], operation.expected), 'expected old value differs at ' + operation.path);
    safeObject(operation.value);
    owner[key] = clone(operation.value);
  }
  function validateSupplement(detail, id, spellId, maxRank) {
    assert(detail && detail.spellId === spellId && detail.sourceSpellPath?.startsWith(`Characters/${id}/`)
      && detail.maxRank === maxRank && Array.isArray(detail.damages) && Array.isArray(detail.forms),
    'verified supplemental spell binding missing: ' + id + ':' + spellId);
    for (const owner of [detail, ...detail.forms]) {
      assert(owner.sourceSpellPath?.startsWith(`Characters/${id}/`) && typeof owner.tooltip === 'string',
        'foreign supplemental form');
      for (const row of [...(owner.damages || []), ...Object.values(owner.valuesByToken || {})]) {
        assert(row.resolved === true && (!row.sourceSpellPath || row.sourceSpellPath.startsWith(`Characters/${id}/`)),
          'unresolved/foreign calculation');
      }
    }
  }
  /** Both runtime arguments must first pass ModeClassicChampions.createVerified.
   * The base must also pass ClassicDamageView.createVerified and detail attach.
   * Bindings are the manifests used by those successful byte verifications.
   * Validation is atomic: neither runtime is changed if any check fails.
   */
  function apply(baseClassic, currentClassic, patchData, bindings) {
    assert(patchData?.schemaVersion === 1 && patchData.classification === 'VERIFIED_CLASSIC_BASE_WITH_OFFICIAL_PATCH'
      && patchData.base?.version === baseVersion && patchData.target?.version === targetVersion
      && patchData.base.combinedSha256 === baseHash && patchData.base.calculationsSha256 === calculationHash
      && bindings?.baseCombinedSha256 === baseHash && sha256(bindings?.targetCombinedSha256)
      && bindings.targetCombinedSha256 === patchData.target.combinedSha256, 'version/hash binding mismatch');
    assert(patchData.source?.url === sourceUrl && patchData.source.patch === '26.18'
      && patchData.source.sha256 === sourceHash
      && patchData.source.policy === 'official-classic-patch-over-verified-classic-base', 'unverified patch source');
    const baseIds = patchData.base.championIds;
    const targetIds = patchData.target.championIds;
    assert(Array.isArray(baseIds) && baseIds.length === 63 && new Set(baseIds).size === 63
      && Array.isArray(targetIds) && targetIds.length === 68 && new Set(targetIds).size === 68
      && same([...baseIds].sort(), baseIds) && same([...targetIds].sort(), targetIds)
      && same(targetIds.filter(id => !baseIds.includes(id)), addedIds)
      && same(patchData.unavailableChampionIds, addedIds)
      && same(Object.keys(patchData.champions || {}).sort(), targetIds)
      && same(Object.keys(patchData.englishLabels || {}).sort(), targetIds), 'supplement roster mismatch');
    const base = indexRuntime(baseClassic, baseVersion, baseIds, patchData.champions, 'baseSourceSha256');
    const current = indexRuntime(currentClassic, targetVersion, targetIds, patchData.champions, 'targetSourceSha256');
    const staged = new Map();
    for (const id of baseIds) {
      const record = patchData.champions[id];
      const row = base.get(id);
      const fresh = current.get(id);
      row.skills.forEach((skill, index) => {
        const spellId = index ? record.spellIds[index - 1] : record.basePassiveSpellId;
        assert(!fresh.skills[index].damageDetails && !fresh.skills[index].supplementalSource,
          'target already has a supplement');
        const rank = index ? fresh.skills[index].damage.maxRank : skill.damageDetails?.maxRank;
        validateSupplement(skill.damageDetails, id, spellId, rank);
        const values = Object.fromEntries(fields.filter(field => skill[field] !== undefined)
          .map(field => [field, clone(skill[field])]));
        values.calculationStatus = 'verified-16.17-classic-base';
        values.supplementalSource = {baseVersion, baseCombinedSha256: baseHash,
          baseCalculationsSha256: calculationHash, appliesToVersion: targetVersion,
          policy: 'verified-classic-base-with-explicit-official-patch-overrides', changes: []};
        staged.set(id + ':' + skill.slot, values);
      });
    }
    assert(Array.isArray(patchData.updates) && patchData.updates.length === 21, 'incomplete official changes');
    const seen = new Set();
    for (const change of patchData.updates) {
      const key = change.championId + ':' + change.slot;
      const values = staged.get(key);
      assert(values && !seen.has(key) && values.damageDetails.spellId === change.spellId
        && typeof change.sourceEvidence === 'string' && change.sourceEvidence.trim()
        && Array.isArray(change.replacements) && change.replacements.length, 'patch spell binding mismatch');
      seen.add(key);
      const paths = new Set();
      for (const operation of change.replacements) {
        assert(!paths.has(operation.path), 'duplicate replacement');
        paths.add(operation.path);
        replaceChecked(values, operation);
      }
      values.calculationStatus = 'verified-classic-base-with-official-26.18-changes';
      values.supplementalSource.changes = [...paths];
      values.supplementalSource.patchSource = clone(patchData.source);
      values.damageDetails.patchSource = clone(patchData.source);
      values.damageDetails.baseSourceVersion = baseVersion;
      validateSupplement(values.damageDetails, change.championId, change.spellId, values.damageDetails.maxRank);
    }
    for (const id of targetIds) {
      const labels = patchData.englishLabels[id];
      const record = patchData.champions[id];
      assert(typeof labels.nameEn === 'string' && labels.nameEn.trim() && sha256(labels.sha256)
        && labels.sourceUrl === `https://ddragon.leagueoflegends.com/cdn/${targetVersion}/data/en_US/mode/classic/champion/${id}.json`
        && Array.isArray(labels.skills) && labels.skills.length === 5, 'English source mismatch');
      labels.skills.forEach((label, index) => {
        assert(label.slot === slots[index] && label.spellId === (index ? record.spellIds[index - 1] : null)
          && typeof label.nameEn === 'string' && label.nameEn.trim(), 'English skill binding mismatch');
        const key = id + ':' + slots[index];
        let values = staged.get(key);
        if (!values) {
          assert(addedIds.includes(id) && !current.get(id).skills[index].damageDetails,
            'new champion cannot inherit calculations');
          values = {calculationStatus: 'unavailable-exact-classic-client-values',
            rangePresentation: {kind: 'hidden', reason: 'new-classic-targeting-context-unverified', valuesByRank: []}};
          staged.set(key, values);
        }
        values.nameEn = label.nameEn;
        values.nameSource = {version: targetVersion, sourceUrl: labels.sourceUrl, sha256: labels.sha256,
          sourceField: index ? `spells[${index - 1}].name` : 'passive.name'};
      });
    }
    // Official prose is a display supplement, separate from DD source and numbers.
    // Use the same checked-replacement contract for every affected skill.
    assert(Array.isArray(patchData.proseOverrides) && patchData.proseOverrides.length === 1,
      'incomplete official prose changes');
    const proseSeen = new Set();
    for (const change of patchData.proseOverrides) {
      const index = slots.indexOf(change.slot), key = change.championId + ':' + change.slot;
      const row = current.get(change.championId), ability = row?.skills[index], values = staged.get(key);
      const original = index === 0 ? row?.champion.raw.passive : row?.champion.raw.spells[index - 1];
      assert(index >= 0 && values && !values.damageDetails && !proseSeen.has(key)
        && ability.riotId === change.spellId && ability.sourceField === change.sourceField
        && ability.summaryKo === original?.description && !ability.proseSource
        && Array.isArray(change.sourceEvidence) && change.sourceEvidence.length
        && change.sourceEvidence.every(evidence => Number.isInteger(evidence.line) && evidence.line > 0
          && typeof evidence.text === 'string' && evidence.text.trim())
        && Array.isArray(change.replacements)
        && same(change.replacements.map(operation => operation.path).sort(), ['/detailKo', '/summaryKo']),
      'prose spell/source binding mismatch');
      assert(row.champion.skills[index].riotId === change.spellId
        && row.champion.skills[index].desc === original.description, 'prose display/source mismatch');
      values.summaryKo = ability.summaryKo;
      values.detailKo = ability.detailKo;
      for (const operation of change.replacements) {
        assert(typeof operation.value === 'string' && operation.value.length <= 6000
          && (operation.path !== '/summaryKo' || operation.value.trim())
          && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(operation.value)
          && !/[a-z][a-z0-9+.-]*:\/\/|javascript:|data:/i.test(operation.value), 'invalid official prose');
        replaceChecked(values, operation, ['summaryKo', 'detailKo']);
      }
      values.proseSource = {...clone(patchData.source), classification: 'RIOT_OFFICIAL_CLASSIC_PATCH_PROSE',
        championId: change.championId, spellId: change.spellId,
        originalSourceUrl: ability.sourceUrl, originalSourceField: change.sourceField + '.description',
        originalSourceSha256: row.champion.sourceSha256, sourceEvidence: clone(change.sourceEvidence)};
      proseSeen.add(key);
    }
    // Local display evidence is independent of the official Data Dragon build.
    // Keep B calculations separate; never feed them to the complete damage model.
    const evidence = patchData.localSkillEvidence;
    const complete = new Set(['Jade_Fiora:P', 'Jade_Galio:P', 'Jade_Galio:Q', 'Jade_Poppy:W', 'Jade_Poppy:R']);
    assert(evidence?.schemaVersion === 1 && evidence.classification === 'CLASSIC_LOCAL_DISPLAY_EVIDENCE'
      && evidence.officialDataDragonVersion === targetVersion && evidence.locale === 'ko_KR'
      && evidence.localGameBuild === '16.18.8175716' && evidence.exactVersionMappingProven === false
      && evidence.targetCombinedSha256 === bindings.targetCombinedSha256 && sha256(evidence.auditSha256)
      && same(Object.keys(evidence.champions || {}).sort(), addedIds), 'local evidence source mismatch');
    for (const id of addedIds) {
      const row = current.get(id), supplement = evidence.champions[id];
      assert(supplement.officialSourceSha256 === row.champion.sourceSha256
        && same(Object.keys(supplement.slots || {}), slots), 'local evidence champion/slots mismatch');
      slots.forEach((slot, index) => {
        const entry = supplement.slots[slot], isComplete = complete.has(id + ':' + slot);
        const original = index ? row.champion.raw.spells[index - 1] : row.champion.raw.passive;
        assert(entry.verification === (isComplete ? 'complete' : 'partial') && entry.grade === (isComplete ? 'A' : 'B')
          && entry.nameKo === original.name && entry.descriptionKo === original.description
          && (index === 0 || entry.spellId === original.id) && sha256(entry.localSourceSha256)
          && typeof entry.localObjectKey === 'string'
          && (entry.localObjectKey.startsWith('Characters/' + id + '/') || /^\{[a-f0-9]{8}\}$/.test(entry.localObjectKey))
          && Array.isArray(entry.unresolved) && (isComplete ? !entry.unresolved.length : entry.unresolved.length > 0)
          && Array.isArray(entry.displayLines) && entry.displayLines.length > 0 && entry.displayLines.length <= 10
          && entry.displayLines.every(line => typeof line === 'string' && line.length > 0 && line.length < 800),
        'local evidence grade/description mismatch: ' + id + ':' + slot);
        const values = staged.get(id + ':' + slot);
        values.nameKo = original.name;
        values.summaryKo = original.description;
        values.detailKo = '';
        values.calculationStatus = 'local-display-' + entry.verification;
        values.localEvidence = {...clone(entry), officialDataDragonVersion: targetVersion,
          localGameBuild: evidence.localGameBuild, exactVersionMappingProven: false,
          auditSha256: evidence.auditSha256};
        // Presentation-only adapter to the existing tooltip paragraph contract.
        // This is not damageDetails: no B calculation becomes a resolved formula.
        const displayValues = {};
        const displayText = text => text.replace(/(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)*)(\s+(?:×\s*)?(?:AP|AD|(?:추가|총) 공격력|총 마법 저항력))?/g, (value, number, suffix) => {
          const token = 'display' + Object.keys(displayValues).length;
          const stat = !suffix ? '' : /AP$/.test(suffix) ? 'AP' : /마법 저항력$/.test(suffix) ? 'MR' : 'AD';
          displayValues[token] = {resolved: true, text: number};
          return stat ? `<scale${stat}>@${token}@${suffix}</scale${stat}>` : `@${token}@`;
        });
        values.displayDetails = {presentationOnly: true, sourceUrl: row.skills[index].sourceUrl,
          sourceChampionId: id, sourceObjectKey: entry.localObjectKey,
          tooltip: displayText(reviewedTooltip(id, slot, original)),
          valuesByToken: displayValues};
        // The original Korean description wins for these five in this integration.
        // The reviewed patch prose remains in patchData for provenance only.
        delete values.proseSource;
      });
    }
    // No mutation before every source, expected value and new champion passed.
    for (const id of targetIds) {
      const row = current.get(id);
      row.champion.nameEn = patchData.englishLabels[id].nameEn;
      const previous = base.get(id)?.champion;
      if (previous && previous.raw.name === row.champion.raw.name) {
        // Preserve verified display-only names when the original name is unchanged.
        row.champion.ko = previous.ko;
        row.champion.nameKo = previous.nameKo;
      }
      row.skills.forEach((skill, index) => {
        const values = staged.get(id + ':' + skill.slot);
        Object.assign(skill, values);
        if (values.proseSource) row.champion.skills[index] = {...row.champion.skills[index],
          desc: values.summaryKo, proseSource: clone(values.proseSource)};
      });
    }
    const summary = {baseVersion, targetVersion, baseChampionCount: 63, targetChampionCount: 68,
      verifiedBaseSkillCount: 315, patchedSkillCount: seen.size, unavailableSkillCount: 0,
      completeLocalDisplaySkillCount: 5, partialLocalDisplaySkillCount: 20,
      proseOverrideCount: 0,
      unavailableChampionIds: [], patchSource: clone(patchData.source),
      limitations: clone(patchData.limitations)};
    currentClassic.skills.supplementalSource = summary;
    return summary;
  }
  return Object.freeze({apply});
});
