/* Localized Classic client wording bound to the existing verified value rows. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicSkillLocale26195 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  let catalog = null;
  let catalogSha256 = null;
  let supplement = null;
  const label = {
    ja_JP: {missing:'この値は検証済みのクラシック資料にありません。',
      source:'検証済み数値・韓国語原文'},
    en_US: {missing:'This value is not in the verified Classic data.',
      source:'Verified figures · Korean source'},
  };
  const words = {
    ja_JP: [
      ['게임 중 누적 골드','試合中に獲得したゴールドの合計'],
      ['게임 중 누적 최대 체력','試合中に獲得した最大体力の合計'],
      ['게임 중 누적 주문력','試合中に獲得した魔力の合計'],
      ['게임 중 누적 추가 경험치','試合中に獲得した追加経験値の合計'],
      ['아이템으로 얻은','アイテムによる'], ['전환된','変換された'],
      ['주문력','魔力'], ['공격력','攻撃力'], ['경험치','経験値'], ['골드','ゴールド'],
      ['궁극기 레벨별','アルティメットのランク別'],
      ['재사용 대기시간 배율','クールダウン倍率'], ['치명타 피해 배율','クリティカルダメージ倍率'],
      ['마법 저항력','魔法防御'], ['이동 속도','移動速度'], ['치명타 확률','クリティカル率'],
      ['최댓값','最大値'], ['최솟값','最小値'], ['중첩 수','スタック数'],
      ['챔피언','チャンピオン'], ['레벨','レベル'], ['방어력','物理防御'],
      ['체력','体力'], ['마나','マナ'], ['기력','気'], ['분노','フューリー'],
      ['대상','対象'], ['기본','基本'], ['추가','増加'], ['최대','最大'],
      ['현재','現在'], ['잃은','減少した'], ['그 외','それ以外'], ['의','の'],
    ],
    en_US: [
      ['게임 중 누적 골드','total Gold earned in this match'],
      ['게임 중 누적 최대 체력','total maximum Health gained in this match'],
      ['게임 중 누적 주문력','total Ability Power gained in this match'],
      ['게임 중 누적 추가 경험치','total bonus experience gained in this match'],
      ['아이템으로 얻은','from items'], ['전환된','converted'],
      ['주문력','Ability Power'], ['공격력','Attack Damage'], ['경험치','experience'], ['골드','Gold'],
      ['궁극기 레벨별','by ultimate rank'], ['재사용 대기시간 배율','cooldown multiplier'],
      ['치명타 피해 배율','critical damage multiplier'], ['마법 저항력','Magic Resistance'],
      ['이동 속도','Movement Speed'], ['치명타 확률','critical chance'],
      ['최댓값','maximum'], ['최솟값','minimum'], ['중첩 수','stack count'],
      ['챔피언','champion'], ['레벨','level'], ['방어력','Armor'],
      ['체력','Health'], ['마나','Mana'], ['기력','Energy'], ['분노','Fury'],
      ['대상','target'], ['기본','base'], ['추가','bonus'], ['최대','maximum'],
      ['현재','current'], ['잃은','missing'], ['그 외','otherwise'], ['의',' of '],
    ],
  };
  const escapes = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const translateGeneratedText = (html, locale) => html.replace(/(^|>)([^<]+)(?=<|$)/g, (_, prefix, content) => {
    let result = content;
    for (const [ko, translated] of words[locale] || []) result = result.replace(new RegExp(escapes(ko), 'g'), translated);
    return prefix + result;
  });
  function setData(data, sha256) {
    const profile = {'16.19.1': {clientVersion:'16.19', count:349},
      '16.20.1': {clientVersion:'16.20.824.8524', count:385,
        sha256:'be609b79a148502b45f24d9f723b93b4ea920c41bce2d68974f89877eb0e5ef6'}}[data?.version];
    if (data?.schemaVersion !== 1 || !profile
        || data.clientVersion !== profile.clientVersion
        || data.sourcePolicy !== 'exact-classic-client-localization-key'
        || !/^[a-f0-9]{64}$/.test(sha256 || '')
        || (profile.sha256 && sha256 !== profile.sha256)
        || !['ja_JP', 'en_US'].every(locale => Object.values(data.locales?.[locale] || {})
          .flatMap(Object.values).length === profile.count)) throw new Error('Classic skill locale roster mismatch');
    catalog = data;
    catalogSha256 = sha256;
  }
  function setSupplementData(data) {
    const profile = {'16.19.1':{classification:'EXACT_16_19_JADE_LOCALIZED_TOOLTIP_EXTRA_TOKENS', count:19},
      '16.20.1':{classification:'EXACT_16_20_JADE_LOCALIZED_TOOLTIP_EXTRA_TOKENS', count:17}}[catalog?.version];
    if (!catalog || data?.schemaVersion !== 1 || data.version !== catalog.version
        || !profile || data.classification !== profile.classification
        || data.clientLocaleCatalogSha256 !== catalogSha256
        || JSON.stringify(data.clientLocaleSources) !== JSON.stringify(catalog.sources)
        || Object.keys(data.champions || {}).length !== profile.count
        || !data.forms || !data.clientExecutableSha256)
      throw new Error('Classic skill locale supplement/source mismatch');
    supplement = data;
  }
  function supplementedOwner(championId, slot, owner, formPath = '') {
    const added = formPath ? supplement?.forms?.[championId]?.[slot]?.[formPath]
      : supplement?.champions?.[championId]?.[slot];
    if (!added) return owner;
    const original = owner.valuesByToken || {};
    const known = new Set(Object.keys(original).map(name => name.toLowerCase()));
    for (const [token, row] of Object.entries(added)) {
      if (known.has(token.toLowerCase()) || row?.resolved !== true
          || !row.sourceSpellPath?.startsWith('Characters/' + championId + '/')
          || !row.sourceSpellId?.startsWith('Jade_'))
        throw new Error('Invalid Classic supplemental value: ' + championId + ':' + slot + ':' + token);
      known.add(token.toLowerCase());
    }
    return {...owner, valuesByToken:{...original, ...added}};
  }
  const bindingKey = details => details.tooltipSource?.key || details.source?.tooltipSource?.key;
  function preparedTooltip(text, owner) {
    const names = Object.keys(owner.valuesByToken || {});
    const canonical = new Map();
    for (const name of names) {
      const lowered = name.toLowerCase();
      if (canonical.has(lowered) && canonical.get(lowered) !== name)
        throw new Error('Ambiguous Classic tooltip token: ' + name);
      canonical.set(lowered, name);
    }
    const missing = [];
    const adapted = text.replace(/@([^@\n]+)@|\{\{\s*([^{}]+)\s*\}\}/g, (_, at, curly) => {
      const token = at || curly;
      if (token.toLowerCase() === 'spellmodifierdescriptionappend') return '';
      const match = canonical.get(token.toLowerCase());
      if (match && owner.valuesByToken[match]?.resolved === true) return '@' + match + '@';
      missing.push(token);
      return '—';
    });
    return {adapted, missing};
  }
  function renderParagraphs(record, owner, locale, view, css = '') {
    const result = preparedTooltip(record.tooltip, owner);
    const paragraphs = result.adapted.split(/<br\s*\/?>(?:\s*<br\s*\/?>)+/i)
      .map(paragraph => translateGeneratedText(view.tooltip(paragraph, owner, locale), locale))
      .filter(html => html.replace(/<[^>]+>/g, '').trim())
      .map(html => `<p class="classicSkillDetail${css}">${html}</p>`);
    return {html: paragraphs.join(''), missing: result.missing};
  }
  function render(locale, championId, slot, details, view) {
    if (!label[locale] || !catalog || !details) return null;
    const record = catalog.locales[locale]?.[championId]?.[slot];
    if (!record || record.key !== bindingKey(details)) throw new Error('Classic skill locale/source mismatch: ' + championId + ':' + slot);
    if (record.extra.length !== (details.additionalTooltips || []).length
        || record.extra.some((extra, index) => extra.key !== details.additionalTooltips[index].key)
        || record.forms.length !== (details.forms || []).length)
      throw new Error('Classic skill locale detail mismatch: ' + championId + ':' + slot);
    const mainOwner = supplementedOwner(championId, slot, details);
    const main = renderParagraphs(record, mainOwner, locale, view);
    let html = main.html;
    const missing = [...main.missing];
    for (const extra of record.extra) {
      if (!extra.tooltip) continue;
      const row = renderParagraphs(extra, mainOwner, locale, view, ' classicSkillExtra');
      html += row.html;
      missing.push(...row.missing);
    }
    for (const form of record.forms) {
      const owner = details.forms?.find(candidate => candidate.sourceSpellPath === form.sourceSpellPath);
      if (!owner || bindingKey(owner) !== form.key) throw new Error('Classic skill locale form mismatch');
      const row = renderParagraphs(form, supplementedOwner(championId, slot, owner, form.sourceSpellPath), locale, view, ' classicSkillForm');
      html += row.html;
      missing.push(...row.missing);
    }
    if (missing.length) html += `<p class="classicSkillAvailability">${label[locale].missing}</p>`;
    return {html, missing, sourceLabel:label[locale].source};
  }
  return Object.freeze({setData, setSupplementData, render, preparedTooltip, translateGeneratedText});
});
