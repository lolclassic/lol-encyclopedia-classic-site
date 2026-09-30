/* Presentation-only effect links for the 26.19.5 Classic ability text. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicSkillEffects26195 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const LOCALES = ['ko_KR', 'ja_JP', 'en_US'];
  const BASE = Object.freeze({
    slow:'슬로우', stun:'스턴', root:'속박', fear:'공포', suppression:'제압',
    silence:'침묵', airborne:'에어본', taunt:'도발', blind:'실명', charm:'매혹',
    knockback:'넉백', pull:'그랩', shield:'보호막', cooldown:'쿨감', tenacity:'강인함',
  });
  const POPUP_COPY = Object.freeze({
    ko_KR:{label:'스킬 효과 용어 설명', close:'닫기', definition:'설명'},
    ja_JP:{label:'スキル効果の用語説明', close:'閉じる', definition:'説明'},
    en_US:{label:'Ability effect definition', close:'Close', definition:'Definition'},
  });
  let supplements = new Map();
  let installed = false;
  let popup = null;
  let returnFocus = null;

  function localeOf(value) { return LOCALES.includes(value) ? value : 'ko_KR'; }
  function setData(data) {
    if (data?.schemaVersion !== 1 || data.classification !== 'APP_EDITORIAL_CLASSIC_SKILL_EFFECT_GLOSSARY'
        || !Array.isArray(data.entries) || !data.entries.length) throw new Error('Invalid Classic effect glossary');
    const next = new Map();
    const names = new Set();
    for (const row of data.entries) {
      if (!row || !/^[a-zA-Z]+$/.test(row.id || '') || !['harmful', 'beneficial'].includes(row.kind)
          || ['termKo','termJa','termEn','descriptionKo','descriptionJa','descriptionEn']
            .some(key => typeof row[key] !== 'string' || !row[key].trim() || /[<>]/.test(row[key]))
          || next.has(row.id) || names.has(row.termKo)) throw new Error('Invalid Classic effect entry');
      next.set(row.id, Object.freeze({...row}));
      names.add(row.termKo);
    }
    if (typeof root.ClassicReferenceUI?.registerEffectTerms !== 'function')
      throw new Error('Classic glossary must load before effect terms');
    root.ClassicReferenceUI.registerEffectTerms(data.entries.map(row => ({
      termKo:row.termKo, termEn:row.termEn, description:row.descriptionKo,
    })));
    supplements = next;
  }
  function localizedTerm(term, locale) {
    const row = [...supplements.values()].find(entry => entry.termKo === term.termKo);
    if (!row || (term.description || term.descriptionKo) !== row.descriptionKo) return null;
    locale = localeOf(locale);
    return locale === 'ko_KR'
      ? {title:row.termKo, description:row.descriptionKo, secondary:row.termEn, translated:true}
      : locale === 'ja_JP'
        ? {title:row.termJa, description:row.descriptionJa, secondary:row.termEn, translated:true}
        : {title:row.termEn, description:row.descriptionEn, secondary:'', translated:true};
  }

  const direct = {
    ko_KR: [
      ['healingReduction', /고통스러운 상처|치유 감소|회복량 감소|회복 효과를?\s*감소|상처/g],
      ['attackSpeedReduction', /공격\s*속도\s*둔화|공격\s*속도\s*감소/g],
      ['slow', /둔화|느려집니다|느려지게|느려지는/g],
      ['stun', /기절|스턴|춤추게/g], ['root', /속박/g], ['fear', /공포|도망/g],
      ['suppression', /제압/g], ['silence', /침묵/g], ['polymorph', /변이/g],
      ['airborne', /공중(?:에|으로)\s*(?:뜹니다|뜨고|띄우|띄워)|띄웁니다/g],
      ['taunt', /도발/g], ['blind', /실명/g], ['charm', /매혹/g],
      ['knockback', /넉백|뒤로\s*밀어내|밀어내고|밀어냅|날려\s*보내|뒤로/g],
      ['pull', /끌어당/g], ['nearsight', /시야\s*범위가\s*감소/g],
      ['tenacity', /군중\s*제어\s*효과\s*감소/g],
      ['shield', /보호막/g], ['immunity', /면역/g],
    ],
    ja_JP: [
      ['healingReduction', /重傷|負傷|回復阻害|回復効果.{0,12}(?:低下|減少)/g],
      ['attackSpeedReduction', /攻撃速度(?:の)?(?:低下|減少)|攻撃速度スロウ/g],
      ['slow', /スロウ(?:効果)?/g], ['stun', /スタン(?:効果)?/g],
      ['root', /スネア(?:効果)?/g], ['fear', /フィアー(?:効果)?|逃走/g],
      ['suppression', /サプレッション(?:効果)?/g], ['silence', /サイレンス(?:効果)?/g],
      ['polymorph', /ポリモーフ|変身/g], ['disarm', /武装解除(?:効果)?/g],
      ['knockdown', /ノックダウン/g],
      ['airborne', /ノックアップ|打ち上げ/g],
      ['taunt', /タウント|挑発/g], ['blind', /ブラインド(?:効果)?/g],
      ['charm', /チャーム(?:効果)?/g], ['knockback', /ノックバック|弾き飛ばし|ノック|バック/g],
      ['pull', /引き寄せ/g], ['nearsight', /視界(?:範囲)?を?(?:狭|縮小)/g],
      ['stun', /踊らせる/g], ['shield', /シールド/g], ['immunity', /無効化|免疫/g],
      ['tenacity', /行動妨害耐性/g],
      ['ghosted', /ゴースト化/g], ['statReduction', /細断/g],
    ],
    en_US: [
      ['healingReduction', /\b(?:Grievous Wounds|Wounded)\b/gi],
      ['attackSpeedReduction', /\b(?:Slowing Attack Speed|Attack Speed (?:reduction|slow))\b/gi],
      ['slow', /\b(?:Slow|Slows|Slowing|Slowed)\b/gi],
      ['stun', /\b(?:Stun|Stuns|Stunning|Stunned)\b/gi],
      ['root', /\b(?:Root|Roots|Rooting|Rooted)\b/gi],
      ['fear', /\b(?:Fear|Fears|Fearing|Feared|Flee)\b/gi],
      ['suppression', /\b(?:Suppress|Suppresses|Suppressing|Suppressed|Suppression)\b/gi],
      ['silence', /\b(?:Silence|Silences|Silencing|Silenced)\b/gi],
      ['polymorph', /\b(?:Polymorph|Polymorphs|Polymorphed)\b/gi],
      ['disarm', /\b(?:Disarm|Disarms|Disarmed|Disarming)\b/gi],
      ['knockdown', /\bKnock(?:s|ing|ed)?\s+Down\b/gi],
      ['airborne', /\b(?:Knock(?:s|ing|ed)?\s+Up|Airborne)\b/gi],
      ['taunt', /\b(?:Taunt|Taunts|Taunted|Taunting)\b/gi],
      ['blind', /\b(?:Blind|Blinds|Blinded|Blinding)\b/gi],
      ['charm', /\b(?:Charm|Charms|Charmed|Charming)\b/gi],
      ['knockback', /\b(?:Knock(?:s|ing|ed)?\s+(?:Back|Away)|Knockback|Back)\b/gi],
      ['pull', /\b(?:Pull|Pulls|Pulling|Pulled)\b/gi],
      ['nearsight', /\b(?:Nearsight|reduced vision range|sight radius reduced)\b/gi],
      ['stun', /\bdance\b/gi], ['shield', /\b(?:Shield|Shields|Shielded)\b/gi],
      ['tenacity', /\bCrowd Control Reduction\b/gi],
      ['ghosted', /\bGhosted\b/gi], ['statReduction', /\bshreds?\b/gi],
    ],
  };
  const statCue = {
    ko_KR: [
      ['moveSpeedIncrease', /이동\s*속도/], ['attackSpeedIncrease', /공격\s*속도/],
      ['rangeIncrease', /(?:공격\s*)?사거리|공격\s*범위/],
      ['healthIncrease', /체력/], ['criticalChanceIncrease', /치명타\s*(?:확률|율)/],
      ['manaRegenIncrease', /마나\s*(?:재생|회복\s*속도)/],
      ['healthRegenIncrease', /체력\s*재생/],
      ['armorIncrease', /방어력/], ['magicResistIncrease', /마법\s*저항력/],
      ['attackDamageIncrease', /공격력/], ['abilityPowerIncrease', /주문력/],
    ],
    ja_JP: [
      ['moveSpeedIncrease', /移動速度/], ['attackSpeedIncrease', /攻撃速度/],
      ['rangeIncrease', /(?:通常攻撃|攻撃)(?:の)?射程|射程距離/],
      ['healthIncrease', /体力/], ['criticalChanceIncrease', /クリティカル(?:率|確率)/],
      ['manaRegenIncrease', /マナ自動回復|マナ再生/],
      ['healthRegenIncrease', /体力自動回復/],
      ['armorIncrease', /物理防御/], ['magicResistIncrease', /魔法防御/],
      ['attackDamageIncrease', /攻撃力/], ['abilityPowerIncrease', /魔力/],
    ],
    en_US: [
      ['moveSpeedIncrease', /Movement Speed/i], ['attackSpeedIncrease', /Attack Speed/i],
      ['rangeIncrease', /Attack Range|basic attack range|Tristana's Attack Range/i],
      ['healthIncrease', /\bHealth\b/i],
      ['criticalChanceIncrease', /Critical Strike chance|critical chance/i],
      ['manaRegenIncrease', /mana regeneration|mana regen/i],
      ['healthRegenIncrease', /health regeneration|health regen/i],
      ['armorIncrease', /\bArmor\b/i], ['magicResistIncrease', /Magic Resist(?:ance)?/i],
      ['attackDamageIncrease', /Attack Damage/i], ['abilityPowerIncrease', /Ability Power/i],
    ],
  };
  const healthGainContext = {
    ko_KR:/체력(?:이|가)[^.!?。]{0,35}(?:증가|올라가|높아지|늘어남)/,
    ja_JP:/増加体力|(?:最大)?体力が[^.!?。]{0,30}(?:増加|上昇)/,
    en_US:/\bgain(?:s|ed)?\b.{0,35}\b(?:bonus|max(?:imum)?)\s+Health\b/i,
  };
  const positiveVerb = {
    ko_KR: /증가(?:합니다|시킵니다|하고|하며|한다|하는|한|된|됩니다)?|올라갑니다|높아집니다|늘어납니다|향상됩니다|상승합니다|얻(?:습니다|고|으며|는다)/g,
    ja_JP: /増加(?:する|し|させる)?|上昇(?:する|し)?|高める|伸びる|獲得(?:する|し(?!た))/g,
    en_US: /\b(?:increas(?:e|es|ed|ing)|gain(?:s|ed)?|bonus|grant(?:s|ed|ing)?)\b/gi,
  };
  const negativeVerb = {
    ko_KR: /감소(?:시킵니다|합니다|하고|하며|한다|하는|한|된|됩니다)?|낮춥니다|낮추고|저하시킵니다/g,
    ja_JP: /低下(?:させる|する|し)?|減少(?:させる|する|し)?/g,
    en_US: /\b(?:reduc(?:e|es|ed|ing)|decreas(?:e|es|ed|ing)|lower(?:s|ed|ing)?)\b/gi,
  };
  const healingVerb = {
    ko_KR: /회복(?:합니다|시키며|시킵니다|하고|하는|됩니다)?/g,
    ja_JP: /回復(?:する|させる|し)?/g,
    en_US: /\b(?:heal(?:s|ed|ing)?|restor(?:e|es|ed|ing)|regenerat(?:e|es|ed|ing))\b/gi,
  };
  const healthRecovery = {
    ko_KR:/체력(?:을|이|가|의)?[^.!?。]{0,120}회복/,
    ja_JP:/体力(?:を|が|の)?[^.!?。]{0,120}回復/,
    en_US:/\brestor(?:e|es|ed|ing)\b[^.!?。]{0,120}\bHealth\b|\bheals?\s+(?!an?\s+enemy\b)[A-Z][a-z']*/i,
  };
  const beneficialContext = {
    ko_KR: /자신|아군|자기|챔피언의|트리스타나의|잔나와|보호막|강화|이로운/,
    ja_JP: /自身|味方|シールド|強化|トリスターナ|ジャンナ/,
    en_US: /self|allied|allies|ally|shield|empower|Tristana|Janna|her /i,
  };
  const harmfulContext = {
    ko_KR: /적|대상|상대|몬스터|도발당한/,
    ja_JP: /敵|対象|モンスター|相手/,
    en_US: /enemy|target|their |monster|opponent/i,
  };
  const healingBlocked = {
    ko_KR: /(?:치유|회복).{0,16}(?:감소|저하)|(?:감소|저하).{0,16}(?:치유|회복)/,
    ja_JP: /(?:回復|治癒).{0,16}(?:低下|減少)|(?:低下|減少).{0,16}(?:回復|治癒)/,
    en_US: /(?:heal|restor).{0,22}(?:reduc|decreas)|(?:reduc|decreas).{0,22}(?:heal|restor)/i,
  };
  const protectedChildren = '.classicSkillValue,.skillDamagePhysical,.skillDamageMagic,.skillDamageTrue,.skillScaleAd,.skillScaleAp,.skillScaleHealth,.skillScaleArmor,.skillScaleMr,[data-classic-token],.classicSkillEffect';
  function sentenceAt(text, start) {
    // Decimal rank values such as 1.5 must not split an effect sentence.
    const boundary = /(?:[.!?](?=\s|$)|。)/g;
    let before = -1, after = text.length, match;
    while ((match = boundary.exec(text))) {
      if (match.index < start) before = match.index;
      else { after = match.index; break; }
    }
    return text.slice(before + 1, after);
  }
  function nearby(text, start, end, before = 55, after = 30) {
    return text.slice(Math.max(0, start - before), Math.min(text.length, end + after));
  }
  function reductionId(before, verb, after, locale) {
    const sentence = before + verb + after;
    if (/받는\s*(?:체력\s*)?회복\s*효과|치유\s*감소|incoming healing|healing received|受ける回復効果/i.test(sentence)
        && /적|대상|enemy|target|敵|対象/i.test(sentence)) return 'healingReduction';
    if (/재사용\s*대기시간|쿨타임|cooldowns?|クールダウン|再使用までの時間/i.test(sentence)) return 'cooldown';
    if (/방해\s*효과\s*지속시간|군중\s*제어\s*효과\s*지속시간|duration of disables|行動妨害.{0,8}時間/i.test(sentence)) return 'tenacity';
    if (/받는\s*(?:물리\s*|마법\s*)?피해|被ダメージ|受ける(?:物理|魔法)?ダメージ|damage taken|(?:takes?|taking|receives?) .{0,20}reduced .{0,10}damage|reduc(?:e|es|ed|ing) incoming damage/i.test(sentence)
        && !/(?:적|대상|상대)(?:이|가)?\s*받는\s*피해|enemy.{0,10}takes .{0,10}reduced damage/i.test(sentence))
      return 'damageReduction';
    if (/(?:대상이|적이|상대가).{0,20}(?:입히는|가하는)\s*피해|対象が与えるダメージ|target.{0,20}(?:deal|does).{0,10}damage/i.test(sentence))
      return 'damageDealtReduction';
    if (/\btarget\b.{0,30}\b(?:deal|does)\b.{0,25}\breduced damage\b/i.test(sentence))
      return 'damageDealtReduction';
    if (/도발당한|挑発|taunted/i.test(sentence)
        && /가하는\s*피해|物理ダメージ|deal .{0,18}damage/i.test(sentence)) return 'damageDealtReduction';
    if (/명중률|命中率|chance to hit/i.test(sentence)) return 'accuracyReduction';
    if (/이동\s*속도|移動速度|Movement Speed/i.test(sentence) && harmfulContext[locale].test(sentence)) return 'slow';
    const stats = {
      ko_KR:[['attackSpeedReduction',/공격\s*속도/],['armorReduction',/방어력/],['magicResistReduction',/마법\s*저항력/],['attackDamageReduction',/공격력/],['abilityPowerReduction',/주문력/]],
      ja_JP:[['attackSpeedReduction',/攻撃速度/],['armorReduction',/物理防御/],['magicResistReduction',/魔法防御/],['attackDamageReduction',/攻撃力/],['abilityPowerReduction',/魔力/]],
      en_US:[['attackSpeedReduction',/Attack Speed/i],['armorReduction',/\bArmor\b/i],['magicResistReduction',/Magic Resist(?:ance)?/i],['attackDamageReduction',/Attack Damage/i],['abilityPowerReduction',/Ability Power/i]],
    }[locale];
    if (beneficialContext[locale].test(sentence) && !harmfulContext[locale].test(sentence)) return null;
    const preceding = stats.filter(([, cue]) => cue.test(before));
    const affected = preceding.length ? preceding : stats.filter(([, cue]) => cue.test(after));
    return affected.length > 1 ? 'statReduction' : affected[0]?.[0] || null;
  }
  function increaseId(sentence, locale, currentSentence = sentence, verb = '', before = '', after = '') {
    if (healingBlocked[locale].test(sentence)) return null;
    // Missing Health determines some bonuses; it is not itself the increased stat.
    const statText = sentence.replace(/잃은\s*체력|減少体力|\bmissing\s+Health\b/gi, '');
    const gainLike = (locale === 'ko_KR' && /^얻/.test(verb))
      || (locale === 'ja_JP' && /^獲得/.test(verb))
      || (locale === 'en_US' && /^(?:gain|grant)/i.test(verb));
    if (gainLike) {
      if (locale === 'ja_JP' && /^と/.test(after)) return null;
      let directStat = locale === 'en_US' ? after.slice(0, 65).split(/[.!?。]/)[0]
        : before.slice(-65);
      if (locale === 'ko_KR') {
        directStat = directStat.split(/(?:[.!?。]|비례하는|비례해|따라|증가하고,|:)/).at(-1);
      } else if (locale === 'ja_JP') {
        const boundary = Math.max(directStat.lastIndexOf('。'), directStat.lastIndexOf('、'),
          directStat.lastIndexOf('として'), directStat.lastIndexOf(':'));
        if (boundary >= 0) directStat = directStat.slice(boundary + 1);
      } else {
        directStat = directStat.split(/\band (?:his|her|their)\b/i)[0];
      }
      const direct = statCue[locale].filter(([id, cue]) => id === 'healthIncrease'
        ? locale === 'ko_KR' ? /(?:追加|最大)?\s*체력을\s*\d*\s*$/.test(directStat)
          : locale === 'ja_JP' ? /(?:増加|最大)?体力を\d*\s*$/.test(directStat)
            : /\b(?:bonus|max(?:imum)?)\s+Health\b/i.test(directStat)
        : cue.test(directStat));
      return direct.length > 1 ? 'statIncrease' : direct[0]?.[0] || null;
    }
    const affected = statCue[locale].filter(([id, cue]) =>
      id === 'healthIncrease' ? healthGainContext[locale].test(currentSentence) : cue.test(statText));
    if (!affected.length) return null;
    // Enemy damage amplification is a debuff, not a friendly stat increase.
    if (/(?:받는\s*피해|受けるダメージ|damage taken).{0,25}(?:증가|増加|increas)/i.test(sentence)) return null;
    return affected.length > 1 ? 'statIncrease' : affected[0][0];
  }
  function addMatches(text, pattern, id, output, predicate = null) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (predicate && !predicate(match)) continue;
      output.push({start:match.index, end:match.index + match[0].length, id});
    }
  }
  function scanText(text, locale, options = {}) {
    locale = localeOf(locale);
    text = String(text || '');
    const fullText = String(options.fullText || text);
    const offset = Number(options.offset) || 0;
    const found = [];
    for (const [id, regex] of direct[locale]) {
      if (id === 'polymorph' && locale === 'ja_JP' && options.championId !== 'Jade_Lulu') continue;
      addMatches(text, regex, id, found, match => {
        const sentence = sentenceAt(fullText, offset + match.index);
        if (id === 'shield') return !/破壊|削る|壊す|파괴|제거|break|destroy|shred/i.test(sentence);
        if (id === 'root' && /면역|무시|免疫|受けない|無効|immune/i.test(sentence)) return false;
        if (id === 'immunity' && /방해|이동 불가|군중 제어|行動妨害|移動不能|disabl|immobiliz|crowd control/i.test(sentence)) return false;
        if (id === 'immunity' && locale === 'ja_JP' && /オーラは無効化/.test(sentence)) return false;
        if (id === 'knockback' && /^(?:뒤로|バック|Back)$/i.test(match[0]))
          return /밀어내|ノック|knock/i.test(sentence);
        if (id === 'pull' && options.championId === 'Jade_Nautilus' && options.slot === 'Q'
            && /지형|地形|terrain/i.test(sentence)) return false;
        if (id === 'healingReduction' && match[0] === '상처') return options.championId === 'Jade_Katarina';
        if (id === 'stun' && /춤|踊|dance/i.test(match[0])) return options.championId === 'Jade_Sona';
        return true;
      });
    }
    const statusReference = {
      ko_KR:/방해|이동 불가/g,
      ja_JP:/行動妨害効果|移動不能効果/g,
      en_US:/\b(?:Disabl(?:es?|ing)|Immobiliz(?:ing|ation))\b/gi,
    }[locale];
    statusReference.lastIndex = 0;
    for (const match of text.matchAll(statusReference)) {
      const sentence = sentenceAt(fullText, offset + match.index);
      if (!/없애|정화|제거|면역|무효화|防ぐ|除去|解除|無効化|受けなく|cleans|remove|prevent|immune/i.test(sentence)) continue;
      const id = /없애|정화|제거|除去|解除|cleans|remove/i.test(sentence) ? 'cleanse' : 'crowdControlImmunity';
      found.push({start:match.index, end:match.index + match[0].length, id});
    }
    if (options.championId === 'Jade_Nautilus' && options.slot === 'Q') {
      const selfPull = {ko_KR:/끌려가고/g, ja_JP:/引き寄せ/g, en_US:/\bPulls?\b/gi}[locale];
      addMatches(text, selfPull, 'selfPull', found, match => /지형|地形|terrain/i.test(sentenceAt(fullText, offset + match.index)));
    }
    if (locale === 'ja_JP') addMatches(text, /軽減/g, 'damageReduction', found, match =>
      /受ける(?:物理|魔法)?ダメージ|被ダメージ/.test(sentenceAt(fullText, offset + match.index)));
    const armorMention = {ko_KR:/방어력(?:이|을)?/g, ja_JP:/物理防御/g, en_US:/\barmor\b/gi}[locale];
    addMatches(text, armorMention, 'armorReduction', found, match => {
      const following = fullText.slice(offset + match.index + match[0].length,
        offset + match.index + match[0].length + 27);
      return /^[^.!?。]{0,25}(?:감소|低下|reduc|lower|decreas)/i.test(following)
        && !/증가|増加|increas/i.test(following.split(/감소|低下|reduc|lower|decreas/i)[0]);
    });
    if (locale === 'en_US') addMatches(text, /\bKnock(?:s|ing|ed)?\b/gi, '', found, match => {
      const sentence = sentenceAt(fullText, offset + match.index);
      const id = /\b(?:up|airborne|air)\b/i.test(sentence) ? 'airborne'
        : /\b(?:back|away)\b/i.test(sentence) ? 'knockback' : null;
      if (!id) return false;
      found.push({start:match.index, end:match.index + match[0].length, id});
      return false;
    });
    negativeVerb[locale].lastIndex = 0;
    for (const match of text.matchAll(negativeVerb[locale])) {
      const position = offset + match.index;
      const before = fullText.slice(Math.max(0, position - 55), position);
      const after = fullText.slice(position + match[0].length, position + match[0].length + 30);
      const id = reductionId(before, match[0], after, locale)
        || (locale === 'en_US' && options.championId === 'Jade_Shen' && options.slot === 'E'
          && /reduced physical damage/i.test(nearby(fullText, position,
            position + match[0].length, 0, 28)) ? 'damageDealtReduction' : null);
      if (id) found.push({start:match.index, end:match.index + match[0].length, id});
    }
    positiveVerb[locale].lastIndex = 0;
    for (const match of text.matchAll(positiveVerb[locale])) {
      const position = offset + match.index;
      const currentSentence = sentenceAt(fullText, position);
      if (options.championId === 'Jade_Nasus' && options.slot === 'W'
          && locale === 'en_US' && /^increas/i.test(match[0])) {
        const beforeStat = fullText.slice(Math.max(0, position - 90), position);
        const id = beforeStat.lastIndexOf('Attack Speed') > beforeStat.lastIndexOf('Movement Speed')
          ? 'attackSpeedReduction' : 'slow';
        found.push({start:match.index, end:match.index + match[0].length, id});
        continue;
      }
      if (options.championId === 'Jade_Kayle' && options.slot === 'Q'
          && /^(?:증가|増加|increas)/i.test(match[0])) {
        found.push({start:match.index, end:match.index + match[0].length,
          id:'damageAmplification'});
        continue;
      }
      if (locale === 'en_US' && /^bonus$/i.test(match[0])
          && /\bgain(?:s|ed)?\b/i.test(fullText.slice(Math.max(0, position - 28), position))
          && /\bgain(?:s|ed)?\b/i.test(currentSentence)) continue;
      const local = nearby(fullText, position, position + match[0].length, 55, 55);
      const id = increaseId(local, locale, currentSentence, match[0],
        fullText.slice(Math.max(0, position - 65), position),
        fullText.slice(position + match[0].length));
      if (id) found.push({start:match.index, end:match.index + match[0].length, id});
    }
    healingVerb[locale].lastIndex = 0;
    for (const match of text.matchAll(healingVerb[locale])) {
      const position = offset + match.index;
      const sentence = sentenceAt(fullText, position);
      const recoveryContext = nearby(fullText, position, position + match[0].length, 42, 42);
      const ownHealthRecovery = healthRecovery[locale].test(sentence)
        || (locale === 'en_US' && /\b[A-Z][a-z]+\s+Regenerates\b/.test(sentence));
      const nonHealthRecovery = /マナ|마나|\bmana\b|기력|エネルギー|\benergy\b|이동\s*속도|移動速度|Movement Speed/i.test(sentence)
        && !ownHealthRecovery && !/\bheal(?:s|ed|ing)?\b/i.test(match[0]);
      const manaRegenWord = locale === 'ja_JP'
        && /マナ(?:自動)?$/.test(fullText.slice(Math.max(0, position - 12), position));
      const healthRegenStatWord = locale === 'ja_JP'
        && /体力自動$/.test(fullText.slice(Math.max(0, position - 12), position))
        && /獲得|増加/.test(sentence);
      if (!healingBlocked[locale].test(recoveryContext)
          && !nonHealthRecovery && !manaRegenWord && !healthRegenStatWord
          && (ownHealthRecovery || (locale === 'en_US' && /^heal/i.test(match[0]))))
        found.push({start:match.index, end:match.index + match[0].length, id:'healing'});
    }
    const special = {
      ko_KR:[['crowdControlImmunity',/무효화|면역/g],['cleanse',/없애고|제거|정화하고/g],['effectGrant',/부여(?:합니다|하고|하며)?/g],['effectGain',/얻습니다/g]],
      ja_JP:[['crowdControlImmunity',/無効化|受けなくなる/g],['cleanse',/除去|解除/g],['effectGrant',/付与(?:する|し)?/g],['effectGain',/得る/g]],
      en_US:[['crowdControlImmunity',/\b(?:immune|prevents?)\b/gi],['cleanse',/\b(?:remove|cleanses?)\b/gi],['effectGrant',/\bgrant(?:s|ed)?\b/gi],['effectGain',/\bgain(?:s|ed)?\b/gi]],
    }[locale];
    for (const [id, regex] of special) addMatches(text, regex, id, found, match => {
      const sentence = sentenceAt(fullText, offset + match.index);
      if (id === 'crowdControlImmunity' || id === 'cleanse')
        return /방해|이동 불가|군중 제어|行動妨害|移動不能|disabl|immobiliz|crowd control/i.test(sentence);
      const local = nearby(fullText, offset + match.index, offset + match.index + match[0].length,
        42, id === 'effectGain' ? 10 : 28);
      const beneficialStat = /보호막|이동\s*속도|공격\s*속도|방어력|공격력|마법\s*저항력|주문력|シールド|移動速度|攻撃速度|物理防御|魔法防御|攻撃力|魔力|Shield|Movement Speed|Attack Speed|Armor|Magic Resist|Attack Damage|Ability Power/i;
      return beneficialContext[locale].test(local) && beneficialStat.test(local)
        && !/(?:둔화|기절|속박|도발|제압|침묵|스턴|スロウ|スタン|スネア|タウント|サイレンス|slow|stun|root|taunt|silenc)/i.test(local);
    });
    found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const selected = [];
    for (const candidate of found) {
      if (!selected.some(row => candidate.start < row.end && row.start < candidate.end)) selected.push(candidate);
    }
    return selected.sort((a, b) => a.start - b.start);
  }
  function decorateElement(element, locale, championId, slot) {
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(element, (root.NodeFilter || doc.defaultView.NodeFilter).SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    const fullText = element.textContent;
    let offset = 0;
    let changed = false;
    for (const textNode of nodes) {
      const original = textNode.nodeValue;
      const start = offset;
      offset += original.length;
      if (!original.trim() || textNode.parentElement?.closest(protectedChildren)) continue;
      const matches = scanText(original, locale, {fullText, offset:start, championId, slot});
      if (!matches.length) continue;
      const fragment = doc.createDocumentFragment();
      let cursor = 0;
      for (const match of matches) {
        if (match.start > cursor) fragment.appendChild(doc.createTextNode(original.slice(cursor, match.start)));
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = 'classicSkillEffect classicSkillEffect--' + (supplements.get(match.id)?.kind || (['shield','cooldown','tenacity'].includes(match.id) ? 'beneficial' : 'harmful'));
        button.dataset.classicEffect = match.id;
        button.setAttribute('aria-haspopup', 'dialog');
        button.textContent = original.slice(match.start, match.end);
        fragment.appendChild(button);
        cursor = match.end;
      }
      if (cursor < original.length) fragment.appendChild(doc.createTextNode(original.slice(cursor)));
      textNode.replaceWith(fragment);
      changed = true;
    }
    return changed;
  }
  function decorate(html, locale, championId, slot) {
    if (typeof document === 'undefined' || !supplements.size) return html;
    const template = document.createElement('template');
    template.innerHTML = String(html || '');
    for (const paragraph of template.content.querySelectorAll('.classicSkillSummary,.classicSkillDetail'))
      decorateElement(paragraph, localeOf(locale), championId, slot);
    return template.innerHTML;
  }
  function closePopup() {
    if (!popup) return;
    popup.remove(); popup = null;
    const focus = returnFocus;
    returnFocus = null;
    if (focus?.isConnected) focus.focus({preventScroll:true});
  }
  async function openPopup(button) {
    const id = button.dataset.classicEffect;
    const locale = localeOf(root.ClassicLocale?.getLocale?.());
    const key = BASE[id];
    const row = key
      ? root.ClassicReferenceUI?.baseTerms?.().find(term => term.termKo === key)
      : [...supplements.values()].find(term => term.id === id);
    if (!row) return;
    if (key && root.ClassicGlossarySearch?.isLoading?.()) await root.ClassicGlossarySearch.whenReady();
    if (!button.isConnected) return;
    const localized = key
      ? root.ClassicGlossarySearch?.display?.(row, locale)
      : localizedTerm(row, locale);
    if (!localized) return;
    closePopup();
    returnFocus = button;
    const copy = POPUP_COPY[locale];
    const doc = button.ownerDocument;
    const panel = doc.createElement('div');
    panel.className = 'classicSkillEffectPopup';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'classicSkillEffectPopupTitle');
    panel.setAttribute('aria-describedby', 'classicSkillEffectPopupDescription');
    panel.setAttribute('lang', locale === 'ko_KR' ? 'ko' : locale === 'ja_JP' ? 'ja' : 'en');
    const header = doc.createElement('div');
    header.className = 'classicSkillEffectPopupHeader';
    const heading = doc.createElement('strong');
    heading.id = 'classicSkillEffectPopupTitle';
    heading.textContent = localized.title;
    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'classicSkillEffectPopupClose';
    close.setAttribute('aria-label', copy.close);
    close.textContent = '×';
    close.addEventListener('click', closePopup);
    header.append(heading, close);
    const description = doc.createElement('p');
    description.id = 'classicSkillEffectPopupDescription';
    description.textContent = localized.description;
    panel.append(header, description);
    doc.body.appendChild(panel);
    const box = button.getBoundingClientRect();
    const width = panel.getBoundingClientRect().width;
    const height = panel.getBoundingClientRect().height;
    const viewportWidth = doc.documentElement.clientWidth;
    const viewportHeight = doc.documentElement.clientHeight;
    panel.style.left = Math.max(12, Math.min(box.left, viewportWidth - width - 12)) + 'px';
    panel.style.top = Math.max(12, box.bottom + height + 12 <= viewportHeight ? box.bottom + 7
      : box.top - height - 7) + 'px';
    popup = panel;
    close.focus({preventScroll:true});
  }
  function install() {
    if (installed || typeof document === 'undefined') return;
    installed = true;
    document.addEventListener('click', event => {
      const button = event.target.closest?.('.classicSkillEffect[data-classic-effect]');
      if (button) { event.preventDefault(); openPopup(button); }
      else if (popup && !popup.contains(event.target)) closePopup();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && popup) { event.preventDefault(); closePopup(); }
    });
    root.addEventListener?.('hashchange', closePopup);
  }
  install();
  return Object.freeze({setData, localizedTerm, scanText, decorate, install, closePopup});
});
