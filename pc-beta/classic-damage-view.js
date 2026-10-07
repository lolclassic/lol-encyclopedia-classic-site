/* Display only calculations bound to an exact Jade character and spell. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicDamageView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {
    ko_KR:{physical:'물리 피해', magic:'마법 피해', true:'고정 피해'},
    ja_JP:{physical:'物理ダメージ', magic:'魔法ダメージ', true:'確定ダメージ'},
    en_US:{physical:'physical damage', magic:'magic damage', true:'true damage'},
  };
  const colors = { physical:'skillDamagePhysical', magic:'skillDamageMagic', true:'skillDamageTrue' };
  const editColors = Object.freeze({physical:'skillDamagePhysical', magic:'skillDamageMagic', true:'skillDamageTrue',
    ad:'skillScaleAd', ap:'skillScaleAp', health:'skillScaleHealth', armor:'skillScaleArmor', mr:'skillScaleMr'});
  // A small text-only notation; never accept authored HTML, CSS or arbitrary attributes.
  function authoredText(value) {
    const text = String(value ?? ''), pattern = /\[색:(physical|magic|true|ad|ap|health|armor|mr)\]([^\[]*?)\[\/색\]/gs;
    let html = '', cursor = 0;
    for (const match of text.matchAll(pattern)) {
      html += damageText(text.slice(cursor, match.index), text.slice(match.index).replace(pattern, '$2'))
        + `<span class="${editColors[match[1]]}">${escape(match[2])}</span>`;
      cursor = match.index + match[0].length;
    }
    return (html + damageText(text.slice(cursor))).replace(/\r?\n/g, '<br>');
  }
  function damageText(value, continuation = '') {
    const text = String(value ?? ''), ranges = [];
    // A shared trailing '피해' qualifies each listed type, not only the last one.
    // Continuation supplies context across tooltip tags; only this text is emitted.
    const phrase = /(?:물리|마법|고정)(?:\s*(?:및|또는|혹은|와|과|\/|·|,)\s*(?:물리|마법|고정))*\s*피해/g;
    for (const match of (text + continuation).matchAll(phrase)) {
      for (const word of match[0].matchAll(/(물리|마법|고정)(\s*피해)?/g)) {
        const start = match.index + word.index;
        if (start >= text.length) continue;
        ranges.push({start, end:Math.min(start + word[0].length, text.length),
          css:colors[{물리:'physical',마법:'magic',고정:'true'}[word[1]]]});
      }
    }
    let cursor = 0, html = '';
    for (const range of ranges) {
      html += escape(text.slice(cursor, range.start)) + `<span class="${range.css}">${escape(text.slice(range.start, range.end))}</span>`;
      cursor = range.end;
    }
    return html + escape(text.slice(cursor));
  }
  const stats = {
    AD:{label:['AD','AD','AD'],css:'skillScaleAd'}, AP:{label:['AP','AP','AP'],css:'skillScaleAp'},
    health:{label:['체력','体力','Health'],css:'skillScaleHealth',percent:true},
    armor:{label:['방어력','物理防御','Armor'],css:'skillScaleArmor',percent:true},
    mr:{label:['마법 저항력','魔法防御','Magic Resistance'],css:'skillScaleMr',percent:true},
    mana:{label:['마나','マナ','Mana'],css:'skillManaValue',percent:true},
    energy:{label:['기력','気','Energy'],css:'skillEnergyValue',percent:true},
    fury:{label:['분노','フューリー','Fury'],css:'skillFuryValue',percent:true},
    bloodWell:{label:['피의 샘','ブラッドウェル','Blood Well'],css:'skillFuryValue',percent:true},
    moveSpeed:{label:['이동 속도','移動速度','Movement Speed'],css:'skillMetaPlainValue',percent:true},
    critChance:{label:['치명타 확률','クリティカル率','critical chance'],css:'skillMetaPlainValue',percent:true},
    critDamage:{label:['치명타 피해 배율','クリティカルダメージ倍率','critical damage multiplier'],css:'skillMetaPlainValue',percent:true},
  };
  const qualifiers = {total:'',base:'기본',bonus:'추가',max:'최대',current:'현재',missing:'잃은',
    target:'대상',targetMax:'대상 최대',targetCurrent:'대상 현재',targetMissing:'대상 잃은',
    bonusHealth:'추가',maxHealth:'최대'};
  const translatedQualifiers = {
    ja_JP:{total:'合計',base:'基本',bonus:'増加',max:'最大',current:'現在',missing:'減少',
      bonusHealth:'増加',maxHealth:'最大'},
    en_US:{total:'total',base:'base',bonus:'bonus',max:'maximum',current:'current',missing:'missing',
      bonusHealth:'bonus',maxHealth:'maximum'},
  };
  const runtimeLabels = {
    '게임 중 누적 골드':['試合中に獲得したゴールドの合計','total Gold earned in this match'],
    '아이템으로 얻은 추가 체력':['アイテムによる増加体力','bonus Health from items'],
    '현재 추가 주문력':['現在の増加魔力','current bonus Ability Power'],
    '현재 추가 공격력':['現在の増加攻撃力','current bonus Attack Damage'],
    '현재 전환된 추가 공격력':['現在の変換後の増加攻撃力','current converted bonus Attack Damage'],
    '현재 전환된 추가 체력':['現在の変換後の増加体力','current converted bonus Health'],
    '게임 중 누적 최대 체력':['試合中に獲得した最大体力の合計','total maximum Health gained in this match'],
    '게임 중 누적 주문력':['試合中に獲得した魔力の合計','total Ability Power gained in this match'],
    '게임 중 누적 추가 경험치':['試合中に獲得した追加経験値の合計','total bonus experience gained in this match'],
  };
  const localeIndex = locale => ({ko_KR:0,ja_JP:1,en_US:2})[locale] ?? 0;
  const language = locale => labels[locale] ? locale : 'ko_KR';
  function statLabel(row, locale) {
    const stat = stats[row.stat];
    if (!stat || !Object.hasOwn(qualifiers, row.qualifier || 'total')) throw new Error('Unknown Classic scaling stat or qualifier');
    locale = language(locale);
    const key = row.qualifier || 'total';
    const target = row.target === 'target' || key.startsWith('target');
    if (locale === 'ko_KR') return [row.target === 'target' ? '대상' : '', qualifiers[key], stat.label[0]].filter(Boolean).join(' ');
    const quality = key.startsWith('target') ? ({target:'',targetMax:'max',targetCurrent:'current',targetMissing:'missing'})[key]
      : ({bonusHealth:'bonus',maxHealth:'max'})[key] || key;
    const term = translatedQualifiers[locale][quality];
    const name = stat.label[localeIndex(locale)];
    if (locale === 'ja_JP') return `${target ? '対象の' : ''}${term || ''}${name}`;
    return `${target ? "target's " : ''}${term ? term + ' ' : ''}${name}`;
  }
  // One presentation rule for every champion, resource, rank and coefficient.
  // Keep the captured values unchanged and round only the displayed number.
  function formatNumber(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) throw new Error('Invalid Classic display number');
    if (Math.abs(numeric) >= 1e18) return numeric.toString();
    const rounded = Math.sign(numeric) * Math.round((Math.abs(numeric) + Number.EPSILON) * 1000) / 1000;
    return Number(rounded.toFixed(3)).toString();
  }
  function formatNumericText(value) {
    return String(value ?? '').replace(/(?<![A-Za-z0-9_.])[-+]?(?:\d+\.\d+|\.\d+)(?:e[+-]?\d+)?(?![A-Za-z0-9_.])/gi,
      match => (match.startsWith('+') ? '+' : '') + formatNumber(match));
  }
  const number = formatNumber;
  function series(values, scale = 1, compact = false) {
    if (!Array.isArray(values) || !values.length || values.some(v => typeof v !== 'number' || !Number.isFinite(v))) throw new Error('Invalid Classic rank series');
    const strings = values.map(n => number(n * scale));
    return (compact && new Set(strings).size === 1 ? strings.slice(0, 1) : strings).join('/');
  }
  function scaling(row, locale = 'ko_KR') {
    const stat = stats[row.stat];
    if (!stat || !Object.hasOwn(qualifiers, row.qualifier || 'total')) throw new Error('Unknown Classic scaling stat or qualifier');
    const value = series(row.coefficients, stat.percent ? 100 : 1, true) + (stat.percent ? '%' : '');
    const name = statLabel(row, locale);
    locale = language(locale);
    if (locale !== 'ko_KR') {
      const phrase = locale === 'ja_JP'
        ? (stat.percent ? `${name}の${value}` : `${name} × ${value}`)
        : (stat.percent ? `${value} of ${name}` : `${value} ${name}`);
      return `<span class="${stat.css}">(+${escape(phrase)})</span>`;
    }
    const qualifier = [row.target === 'target' ? '대상' : '', qualifiers[row.qualifier || 'total']].filter(Boolean).join(' ');
    const words = row.stat === 'armor' || row.stat === 'mr'
      ? [qualifier, stat.label[0], value] : [qualifier, value, stat.label[0]];
    return `<span class="${stat.css}">(+${escape(words.filter(Boolean).join(' '))})</span>`;
  }
  function statText(row, locale = 'ko_KR') {
    const stat = stats[row.stat];
    if (!stat || !Object.hasOwn(qualifiers, row.qualifier || 'total')) throw new Error('Unknown Classic expression stat');
    return `<span class="${stat.css}">${escape(statLabel(row, locale))}</span>`;
  }
  function unref(node) {
    while (node?.kind === 'reference') node = node.value;
    return node;
  }
  function normalized(node) {
    node = unref(node);
    if (!node || !['sum', 'product'].includes(node.kind)) return node;
    const parts = node.parts.map(normalized).flatMap(part => part.kind === node.kind ? part.parts : [part]);
    const numbers = parts.filter(part => part.kind === 'rankValues');
    const rest = parts.filter(part => part.kind !== 'rankValues');
    if (numbers.length) {
      const ranks = Math.max(...numbers.map(part => part.values.length));
      if (numbers.every(part => part.values.length === 1 || part.values.length === ranks)) {
        const values = Array.from({length:ranks}, (_,i) => Number(numbers.reduce((value,part) =>
          node.kind === 'product' ? value * part.values[part.values.length === 1 ? 0 : i] : value + part.values[part.values.length === 1 ? 0 : i],
        node.kind === 'product' ? 1 : 0).toPrecision(7)));
        if (!rest.length || !values.every(v => v === (node.kind === 'product' ? 1 : 0))) rest.unshift({kind:'rankValues',values});
      } else rest.unshift(...numbers);
    }
    return rest.length === 1 ? rest[0] : {...node,parts:rest};
  }
  function productParts(node) {
    node = unref(node);
    return node?.kind === 'product' ? node.parts.flatMap(productParts) : [node];
  }
  function parenthesize(node, locale) {
    const value = expression(node, locale);
    return ['sum', 'conditional'].includes(unref(node)?.kind) ? `(${value})` : value;
  }
  function percentProduct(node, locale) {
    const parts = productParts(node);
    const stat = parts.find(p => p?.kind === 'stat' && stats[p.stat]?.percent);
    if (!stat) return null;
    const rest = parts.filter(p => p !== stat);
    if (!rest.length) return null;
    const factor = normalized(rest.length === 1 ? rest[0] : {kind:'product',parts:rest});
    const times100 = value => value.kind === 'sum'
      ? normalized({...value,parts:value.parts.map(times100)})
      : normalized({kind:'product',parts:[{kind:'rankValues',values:[100]},value]});
    const value = parenthesize(times100(factor), locale);
    if (locale === 'ja_JP') return `${statText(stat, locale)}の${value}%`;
    if (locale === 'en_US') return `${value}% of ${statText(stat, locale)}`;
    return `${statText(stat, locale)}의 ${value}%`;
  }
  function expression(node, locale = 'ko_KR') {
    locale = language(locale);
    if (!node || typeof node !== 'object') throw new Error('Missing Classic calculation expression');
    if (node.op === 'constant') return number(node.value);
    if (node.op === 'multiply') return `(${expression(node.left, locale)}) × ${expression(node.right, locale)}`;
    node = normalized(node);
    if (node.displayAsPercent && node.kind === 'sum'
        && node.parts.every(p => p.kind === 'rankValues' || (p.kind === 'stat' && p.stat === 'critDamage'))) {
      return node.parts.map(part => part.kind === 'rankValues'
        ? part.values.map(n => (n > 0 ? '+' : '') + number(n * 100)).join('/') + '%'
        : statText(part, locale)).join(' + ');
    }
    switch (node.kind) {
      case 'reference': return expression(node.value, locale);
      case 'rankValues': return series(node.values, 1, true);
      case 'stat': return statText(node, locale);
      case 'sum': return node.parts.map((part, i) => {
        if (i && part.kind === 'stat') return ' ' + scaling({...part,coefficients:[1]}, locale);
        const flat = productParts(part);
        if (i && flat.length === 2) {
          const values = flat.find(p => p.kind === 'rankValues');
          const stat = flat.find(p => p.kind === 'stat');
          if (values && stat) return ' ' + scaling({...stat, coefficients:values.values}, locale);
        }
        return (i ? ' + ' : '') + expression(part, locale);
      }).join('');
      case 'product': return percentProduct(node, locale) || node.parts.map(part => parenthesize(part, locale)).join(' × ');
      case 'max': return `${{ko_KR:'최댓값',ja_JP:'最大値',en_US:'max'}[locale]}(${node.parts.map(part => expression(part, locale)).join(', ')})`;
      case 'min': return `${{ko_KR:'최솟값',ja_JP:'最小値',en_US:'min'}[locale]}(${node.parts.map(part => expression(part, locale)).join(', ')})`;
      case 'championLevel': return `${series(node.values)} <span class="classicDamageLevel">${{ko_KR:`(챔피언 1~${node.values.length}레벨)`,ja_JP:`(チャンピオンレベル 1～${node.values.length})`,en_US:`(champion levels 1–${node.values.length})`}[locale]}</span>`;
      case 'buffStacks': return {ko_KR:'중첩 수',ja_JP:'スタック数',en_US:'stack count'}[locale];
      case 'cooldownMultiplier': return {ko_KR:'재사용 대기시간 배율',ja_JP:'クールダウン倍率',en_US:'cooldown multiplier'}[locale];
      case 'runtimeValue':
        if (!node.label) throw new Error('Missing Classic live-value label');
        return escape(locale === 'ko_KR' ? node.label : runtimeLabels[node.label]?.[locale === 'ja_JP' ? 0 : 1] || node.label);
      case 'conditional':
        if (!node.conditionLabel) throw new Error('Classic conditional label is missing');
        return `${escape(node.conditionLabel)}: ${expression(node.then, locale)} / ${{ko_KR:'그 외',ja_JP:'それ以外',en_US:'otherwise'}[locale]}: ${expression(node.else, locale)}`;
      default: throw new Error('Unrecognized Classic expression kind: ' + String(node.kind));
    }
  }
  function damageLine(row, locale = 'ko_KR') {
    locale = language(locale);
    if (!Object.hasOwn(labels.ko_KR, row.type) && row.type !== 'modifier') throw new Error('Unknown Classic damage type');
    const title = row.type === 'modifier' ? damageText(row.label) : `<span class="${colors[row.type]}">${labels[locale][row.type]}</span>`;
    const condition = row.condition ? ` <span class="classicDamageCondition">${escape(row.condition)}</span>` : '';
    if (row.resolved !== true) throw new Error('Unresolved Classic damage rejected');
    const base = row.baseByRank?.length && (!(row.scalings||[]).length || row.baseByRank.some(n=>n!==0)) ? `<span class="classicDamageValues">${series(row.baseByRank)}</span>` : '';
    const ratios = (row.scalings || []).map(ratio => scaling(ratio, locale)).join(' ');
    let detail = row.dynamic || row.affine === false ? expression(row.expression, locale) : [base, ratios].filter(Boolean).join(' ');
    if (row.unit === 'percent') detail = `(${detail})%`;
    if (!detail) throw new Error('Resolved Classic damage has no value');
    return `<div class="classicDamageLine">${title}${condition}: ${detail}</div>`;
  }
  function render(details, locale = 'ko_KR') {
    if (!details) return '';
    return (details.damages || []).map(row => damageLine(row, locale)).join('');
  }
  // Data-only operator skills share the Classic effect-paragraph styling.
  // Each declared effect remains separate: never infer hit totals or bounds.
  function damageParagraphs(details, locale = 'ko_KR') {
    locale = language(locale);
    return (details?.damages || []).map(row => {
      damageLine(row, locale); // Retain the same type/resolution/expression validation.
      const condition = row.condition ? `<span class="classicSkillEmphasis">${escape(row.condition)}</span> ` : '';
      const value = valueText(row, false, locale);
      const effect = row.type === 'modifier'
        ? `${damageText(row.label)}: ${value}`
        : locale === 'ja_JP' ? `<span class="${colors[row.type]}">${value}の${labels[locale][row.type]}</span>を与える。`
          : locale === 'en_US' ? `Deals <span class="${colors[row.type]}">${value} ${labels[locale][row.type]}</span>.`
            : `<span class="${colors[row.type]}">${value}의 ${labels[locale][row.type]}</span>를 입힙니다.`;
      return `<p class="classicSkillDetail">${condition}${effect}</p>`;
    }).join('');
  }
  // Render every value at its original position in the exact Classic tooltip.
  // Numeric healing, shields, CC and passives use the same verified expressions
  // as damage; the short Data Dragon summary is not a substitute for this text.
  function valueText(row, percentAlreadyWritten = false, locale = 'ko_KR') {
    locale = language(locale);
    if (!row || row.resolved !== true) throw new Error('Unresolved Classic tooltip value');
    if (typeof row.text === 'string') return escape(formatNumericText(row.text));
    if (typeof row.displayText === 'string') return escape(formatNumericText(row.displayText));
    let result;
    if (row.baseByChampionLevel?.length && row.levelExpansionComplete
        && row.scalingsByChampionLevel?.every(values => JSON.stringify(values) === JSON.stringify(row.scalingsByChampionLevel[0]))) {
      const bases = row.baseByChampionLevel;
      if (bases.every(values => values.length === 1)) {
        const values = bases.map(values => values[0]);
        const starts = values.map((n, i) => i === 0 || n !== values[i - 1] ? i : -1).filter(i => i >= 0);
        const levels = starts.length < values.length
          ? starts.map(i => i + 1).join('/') : '1~' + values.length;
        result = series(starts.map(i => values[i]));
        if (row.unit === 'percent' && !percentAlreadyWritten) result += '%';
        const note = locale === 'ja_JP' ? `(チャンピオンレベル ${levels})`
          : locale === 'en_US' ? `(champion levels ${levels})` : `(챔피언 ${levels}레벨)`;
        result += ` <span class="classicDamageLevel">${note}</span>`;
        result += (row.scalingsByChampionLevel[0] || []).map(ratio => scaling(ratio, locale)).map(html => ' ' + html).join('');
        return result;
      }
    }
    if (row.dynamic || row.affine === false) result = expression(row.expression, locale);
    else {
      const base = row.baseByRank?.length && (!(row.scalings || []).length || row.baseByRank.some(n => n !== 0))
        ? series(row.baseByRank, 1, true) : '';
      result = [base, ...(row.scalings || []).map(ratio => scaling(ratio, locale))].filter(Boolean).join(' ');
    }
    if (!result) throw new Error('Classic tooltip value is empty');
    const percentage = row.unit === 'percent' || percentAlreadyWritten;
    if (percentage && ((row.scalings || []).length || row.dynamic)) result = '(' + result + ')';
    return result + (row.unit === 'percent' && !percentAlreadyWritten ? '%' : '');
  }
  const tooltipClasses = {
    physicaldamage:'skillDamagePhysical', magicdamage:'skillDamageMagic', truedamage:'skillDamageTrue',
    scalead:'skillScaleAd', scaleap:'skillScaleAp', scalehealth:'skillScaleHealth',
    scalearmor:'skillScaleArmor', scalemr:'skillScaleMr',
    healing:'skillScaleHealth', shield:'classicSkillShield',
    spellpassive:'classicSkillEmphasis', spellactive:'classicSkillEmphasis', recast:'classicSkillEmphasis',
    spellname:'classicSkillEmphasis', keywordmajor:'classicSkillEmphasis', keyword:'classicSkillEmphasis',
  };
  function tooltip(text, details, locale = 'ko_KR') {
    locale = language(locale);
    if (typeof text !== 'string') throw new Error('Missing Classic tooltip text');
    const pieces = text.split(/(<[^>]*>|@[^@\n]+@|\{\{[^{}]+\}\})/g);
    const stack = [];
    const output = [];
    for (let i = 0; i < pieces.length; i++) {
      const part = pieces[i];
      if (!part) continue;
      if (part.startsWith('@') || part.startsWith('{{')) {
        const key = part.startsWith('@') ? part.slice(1, -1) : part.slice(2, -2).trim();
        const row = details.valuesByToken?.[key];
        const rankNote = row?.sourceSpellId === 'Jade_NidaleeAspectOfTheCougar' && details.spellId !== row.sourceSpellId
          ? ` <span class="classicDamageLevel">${{ko_KR:'(궁극기 레벨별)',ja_JP:'(アルティメットのランク別)',en_US:'(by ultimate rank)'}[locale]}</span>` : '';
        output.push(`<span class="classicSkillValue" data-classic-token="${escape(key)}">${valueText(row, /^\s*%/.test(pieces[i + 1] || ''), locale)}${rankNote}</span>`);
      } else if (part.startsWith('<')) {
        const match = part.match(/^<\s*(\/?)\s*([a-z0-9]+)/i);
        if (!match) continue;
        const tag = match[2].toLowerCase();
        if (tag === 'br') { output.push('<br>'); continue; }
        if (match[1]) {
          const index = stack.map(entry => entry.tag).lastIndexOf(tag);
          if (index < 0) continue;
          while (stack.length > index) { const entry = stack.pop(); if (entry.css) output.push('</span>'); }
        } else {
          const css = tooltipClasses[tag];
          stack.push({tag, css});
          if (css) output.push(`<span class="${css}">`);
        }
      } else output.push(damageText(formatNumericText(part), pieces.slice(i + 1).filter(piece => !piece.startsWith('<')).join('')));
    }
    while (stack.length) { if (stack.pop().css) output.push('</span>'); }
    return output.join('');
  }
  function description(details, locale = 'ko_KR') {
    // Some audited passive object names are still hashes. A display-only adapter
    // retains that identity instead of inventing a resolved source spell path.
    const presentation = details?.presentationOnly === true
      && /^Jade_[A-Za-z]+$/.test(details.sourceChampionId || '')
      && /^https:\/\/ddragon\.leagueoflegends\.com\/cdn\/[^/]+\/data\/ko_KR\/mode\/classic\//.test(details.sourceUrl || '')
      && typeof details.sourceObjectKey === 'string' && details.sourceObjectKey.length > 0;
    if (!details?.sourceSpellPath?.startsWith('Characters/Jade_') && !presentation) throw new Error('Non-Classic tooltip rejected');
    const body = [];
    const add = (text, owner, css = '') => {
      for (const paragraph of (text || '').split(/<br\s*\/?>(?:\s*<br\s*\/?>)+/i)) {
        const html = tooltip(paragraph, owner, locale);
        const plain = html.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
        if (!plain || body.some(entry => entry.plain.includes(plain))) continue;
        // Extended tooltips sometimes repeat the main paragraph and add one
        // sentence. Keep the complete paragraph once, including its new rule.
        const shorter = body.findIndex(entry => plain.includes(entry.plain));
        const entry = {plain, html:`<p class="classicSkillDetail${css}">${html}</p>`};
        if (shorter >= 0) body[shorter] = entry;
        else body.push(entry);
      }
    };
    add(details.tooltip, details);
    for (const extra of details.additionalTooltips || []) add(extra.text, details, ' classicSkillExtra');
    for (const form of details.forms || []) {
      add(form.tooltip, form, ' classicSkillForm');
      for (const extra of form.additionalTooltips || []) add(extra.text, form, ' classicSkillExtra');
    }
    return body.map(entry => entry.html).join('');
  }
  function bind(dataset, manifest, current) {
    const expected = current.champions.map(c => c.riotId).sort();
    if (dataset.schemaVersion !== 1 || manifest.schemaVersion !== 1
        || dataset.sourcePolicy !== 'exact-classic-client' || manifest.sourcePolicy !== dataset.sourcePolicy
        || dataset.version !== current.skills.source.version || manifest.version !== dataset.version
        || !dataset.clientVersion || manifest.clientVersion !== dataset.clientVersion
        || JSON.stringify(Object.keys(dataset.champions || {}).sort()) !== JSON.stringify(expected)
        || JSON.stringify([...(manifest.championIds || [])].sort()) !== JSON.stringify(expected)) {
      throw new Error('Classic calculation roster or source mismatch');
    }
    for (const champion of current.champions) {
      const record = dataset.champions[champion.riotId];
      const entry = record.source || {};
      if (record.id !== champion.riotId || String(record.key) !== String(champion.riotKey)
          || entry.internalPath?.toLowerCase() !== `data/characters/${record.id.toLowerCase()}/${record.id.toLowerCase()}.bin`
          || !/^[a-f0-9]{64}$/i.test(entry.sha256 || '')) throw new Error('Non-Jade calculation source rejected');
      const abilities = current.skills.champions.find(c => c.championInternal === record.id).skills;
      for (const skill of abilities) {
        const detail = record.skills[skill.slot];
        if (!detail && skill.slot === 'P') continue;
        if (!detail || detail.slot !== skill.slot || (skill.slot !== 'P' && detail.spellId !== skill.riotId)
            || (detail.sourceSpellPath && !detail.sourceSpellPath.startsWith(`Characters/${record.id}/`))) throw new Error('Classic spell calculation binding mismatch: ' + record.id + ':' + skill.slot);
        if (skill.slot !== 'P' && (!Number.isInteger(detail.maxRank) || detail.maxRank < 1 || detail.maxRank > 6)) throw new Error('Invalid Classic spell ranks');
        const damages = [...(detail.damages || [])];
        for (const form of record.forms || []) {
          if (form.display !== true || form.parentSlot !== skill.slot || form.alreadyRepresentedInMain) continue;
          if (!form.sourceAbilityBinding?.method || !form.sourceSpellPath?.startsWith(`Characters/${record.id}/`)) throw new Error('Classic form binding mismatch');
          for (const row of form.damages || []) {
            if (row.alreadyRepresentedInMain === true) continue;
            const same = damages.some(d => d.sourceSpellPath === row.sourceSpellPath && d.token === row.token && d.type === row.type);
            if (!same) damages.push(row);
          }
        }
        for (const damage of damages) {
          const ranks = damage.sourceMaxRank || detail.maxRank;
          if (!damage.sourceSpellPath?.startsWith(`Characters/${record.id}/`) || damage.resolved !== true) throw new Error('Invalid Classic damage source');
          if (damage.baseByRank?.length && damage.baseByRank.length !== ranks) throw new Error('Classic damage rank length mismatch');
          for (const ratio of damage.scalings || []) {
            if (ratio.coefficients.length !== 1 && ratio.coefficients.length !== ranks) throw new Error('Classic scaling rank length mismatch');
            scaling(ratio);
          }
          damageLine(damage);
        }
        skill.damageDetails = {...detail, damages, forms:(record.forms || []).filter(form => form.display === true && form.parentSlot === skill.slot)};
      }
    }
    return dataset;
  }
  async function createVerified(bytes, manifest, current) {
    if (!(bytes instanceof ArrayBuffer) || !/^[a-f0-9]{64}$/.test(manifest?.sha256 || '')) throw new Error('Classic calculation byte binding missing');
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const actual = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    if (actual !== manifest.sha256) throw new Error('Classic calculation bytes changed');
    return bind(JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)), manifest, current);
  }
  return Object.freeze({createVerified, bind, render, description, tooltip, valueText, scaling, series, expression, damageParagraphs, damageText, authoredText, editColors,
    formatNumber, formatNumericText});
});
