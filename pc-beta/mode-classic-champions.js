/* Raw Classic data is authoritative. Route aliases never supply game fields. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ModeClassicChampions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SLOTS = ['P', 'Q', 'W', 'E', 'R'];
  const STAT_FIELDS = {
    damage: 'attackdamage', damage_per_level: 'attackdamageperlevel',
    health: 'hp', health_per_level: 'hpperlevel', mana: 'mp', mana_per_level: 'mpperlevel',
    move_speed: 'movespeed', range: 'attackrange', attack_speed: 'attackspeed',
    attack_speed_per_level: 'attackspeedperlevel', armor: 'armor', armor_per_level: 'armorperlevel',
    mr: 'spellblock', mr_per_level: 'spellblockperlevel', health_regen: 'hpregen',
    health_regen_per_level: 'hpregenperlevel', mana_regen: 'mpregen', mana_regen_per_level: 'mpregenperlevel',
  };
  const ROLE_LABELS = { Assassin: '암살자', Fighter: '전사', Mage: '마법사',
    Marksman: '원거리 공격수', Support: '지원형', Tank: '탱커' };
  const unresolved = text => /\{\{|@[A-Za-z0-9_.:-]+@/.test(String(text || ''));
  const text = value => typeof value === 'string' ? value : '';
  const list = value => Array.isArray(value) ? value : [];

  // Data Dragon's `effect` positions are unnamed.  Treat them as damage only
  // when the source explicitly binds an eN/effectN placeholder (or supplies a
  // vars coefficient).  Never infer a formula from an arbitrary numeric slot.
  function damageMetadata(ability) {
    const tooltip = text(ability?.tooltip);
    const types = [
      ['physicalDamage', 'physical'],
      ['magicDamage', 'magic'],
      ['trueDamage', 'true'],
    ].filter(([tag]) => tooltip.includes(`<${tag}>`)).map(([, type]) => type);
    const bindings = [];
    const damageText = [...tooltip.matchAll(/<(?:physicalDamage|magicDamage|trueDamage)>[\s\S]*?<\/(?:physicalDamage|magicDamage|trueDamage)>/gi)]
      .map(match => match[0]).join(' ');
    for (const match of damageText.matchAll(/\{\{\s*(?:e|effect)(\d+)\b[^}]*\}\}/gi)) {
      const index = Number(match[1]);
      const values = list(ability.effect?.[index]);
      if (values.length && values.some(value => typeof value === 'number' && value !== 0)) {
        bindings.push({ index, values: [...values] });
      }
    }
    const scalings = list(ability.vars).map(variable => {
      if (!variable || typeof variable !== 'object') return null;
      const key = text(variable.key || variable.name);
      const coeff = variable.coeff;
      return key && (typeof coeff === 'number' || Array.isArray(coeff))
        ? { key, coeff: Array.isArray(coeff) ? [...coeff] : coeff }
        : null;
    }).filter(Boolean);
    return {
      types,
      maxRank: Number.isInteger(ability?.maxrank) ? ability.maxrank : null,
      baseByEffect: bindings,
      scalings,
      disclosed: bindings.length > 0 || scalings.length > 0,
    };
  }

  function create(raw, manifest) {
    if (manifest?.schemaVersion !== 1 || manifest.classification !== 'DIRECT_MODE_CLASSIC_RUNTIME'
        || !/^\d+\.\d+\.\d+$/.test(manifest.version) || !['ko_KR', 'en_US'].includes(manifest.locale)
        || manifest.historicalOrOrdinaryDataFallback !== false || manifest.missingFieldsSupplemented !== false) {
      throw new Error('Unverified Classic champion input');
    }
    const prefix = `https://ddragon.leagueoflegends.com/cdn/${manifest.version}/data/${manifest.locale}/mode/classic/`;
    if (manifest.sourceIndexUrl !== prefix + 'champion.json') throw new Error('Non-Classic champion index rejected');
    const ids = Object.keys(raw?.data || {});
    const mapped = Object.keys(manifest.champions || {});
    if (!ids.length || raw.version !== manifest.version || ids.length !== mapped.length
        || mapped.some(id => !ids.includes(id)) || !Array.isArray(manifest.navigationOrder)
        || manifest.navigationOrder.length !== ids.length || new Set(manifest.navigationOrder).size !== ids.length) {
      throw new Error('Classic champion roster mismatch');
    }
    const images = new Map(list(manifest.images).map(image => [image.path, image]));
    if (images.size !== manifest.images.length) throw new Error('Duplicate Classic image record');
    const skillChampions = [];
    const champions = ids.map(id => {
      const original = raw.data[id], entry = manifest.champions[id];
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(id) || original?.id !== id
          || entry.sourceUrl !== prefix + `champion/${id}.json`
          || !/^[a-z0-9]+$/.test(entry.routeId) || !manifest.navigationOrder.includes(entry.routeId)
          || !original.passive || !Array.isArray(original.spells) || original.spells.length !== 4) {
        throw new Error('Invalid exact Classic champion identity: ' + id);
      }
      const abilityImages = [original.image, original.passive.image, ...original.spells.map(spell => spell.image)];
      for (const [index, slot] of ['portrait', ...SLOTS].entries()) {
        const image = abilityImages[index], path = entry.images[slot], source = images.get(path);
        const field = index === 0 ? 'image' : index === 1 ? 'passive.image' : `spells[${index - 2}].image`;
        if (!image || !['champion', 'passive', 'spell'].includes(image.group)
            || !/^[A-Za-z0-9_]+\.png$/.test(image.full)
            || path !== `images/mode_classic/${image.group}/${image.full}`
            || source?.sourceUrl !== `https://ddragon.leagueoflegends.com/cdn/${manifest.version}/img/mode/classic/${image.group}/${image.full}`
            || !source.references.some(ref => ref.championId === id && ref.sourceField === field && ref.sourceJsonUrl === entry.sourceUrl)) {
          throw new Error('Classic image identity mismatch: ' + id + ':' + slot);
        }
      }
      const skills = [original.passive, ...original.spells].map((ability, index) => ({
        slot: SLOTS[index], riotId: index ? ability.id : null,
        nameKo: text(ability.name), summaryKo: text(ability.description),
        detailKo: !unresolved(ability.tooltip) ? text(ability.tooltip) : '',
        cooldown: list(ability.cooldown), cost: list(ability.cost),
        resourceType: text(ability.costType || original.partype),
        resourceText: text(ability.resource), partype: text(original.partype),
        sourceVersion: manifest.version, sourceUrl: entry.sourceUrl,
        sourceField: index ? `spells[${index - 1}]` : 'passive',
        unresolvedTooltip: unresolved(ability.tooltip),
        damage: damageMetadata(ability),
      }));
      skillChampions.push({ appId: entry.routeId, championInternal: id, nameKo: original.name, skills });
      const info = original.info || {};
      return {
        id: entry.routeId, riotId: id, riotKey: original.key,
        en: id, ko: text(original.name), nameKo: text(original.name), nameEn: id,
        initial: text(original.name).charAt(0), nick: text(original.title),
        stats: Object.fromEntries(Object.entries(STAT_FIELDS).map(([target, source]) => [target, original.stats?.[source]])),
        rate: ['defense', 'attack', 'magic', 'difficulty'].every(key => typeof info[key] === 'number')
          ? [info.defense, info.attack, info.magic, info.difficulty] : [],
        tags: list(original.tags), tagsKo: list(original.tags).map(tag => ROLE_LABELS[tag] || tag),
        img: entry.images.portrait, simg: SLOTS.map(slot => entry.images[slot]),
        skills: [original.passive, ...original.spells].map((ability, index) => ({
          name: text(ability.name), desc: text(ability.description), riotId: index ? ability.id : null,
          damage: damageMetadata(ability),
        })),
        tips: { play: list(original.allytips), vs: list(original.enemytips) },
        history: original.lore ? [original.lore] : [], skins: list(original.skins),
        sourceUrl: entry.sourceUrl, sourceVersion: manifest.version, sourceSha256: entry.sourceSha256,
        raw: original,
      };
    });
    if (new Set(champions.map(champion => champion.id)).size !== ids.length) throw new Error('Duplicate Classic route alias');
    const byRoute = new Map(champions.map(champion => [champion.id, champion]));
    return { champions: manifest.navigationOrder.map(id => byRoute.get(id)),
      skills: { source: { version: manifest.version, locale: manifest.locale, url: manifest.sourceIndexUrl }, champions: skillChampions } };
  }
  async function createVerified(bytes, manifest) {
    if (!(bytes instanceof ArrayBuffer) || !/^[a-f0-9]{64}$/.test(manifest?.combinedSha256 || '')) {
      throw new Error('Classic source byte binding is missing');
    }
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const actual = Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
    if (actual !== manifest.combinedSha256) throw new Error('Classic source bytes do not match the verified export');
    return create(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)), manifest);
  }
  return Object.freeze({ create, createVerified });
});
