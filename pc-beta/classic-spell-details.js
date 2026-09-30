(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const number = value => window.ClassicDamageView.formatNumber(value);
  const spellLabels = new Map([
    ['수치', '値', 'Value'], ['수치 정보 없음', '数値情報なし', 'Value unavailable'],
    ['고정 피해', '確定ダメージ', 'True damage'],
    ['공격 속도 감소', '攻撃速度低下', 'Attack speed reduction'],
    ['공격 속도 증가', '攻撃速度増加', 'Attack speed increase'],
    ['깃발 체력', '旗の体力', 'Banner health'],
    ['마나 회복 수치는 확인 중입니다.', 'マナ回復量は確認中です。', 'The mana restoration value is still being verified.'],
    ['방해 효과 감소 지속시간', '行動妨害軽減時間', 'Crowd control reduction duration'],
    ['보호막 지속시간', 'シールド持続時間', 'Shield duration'],
    ['보호막 피해 흡수량', 'シールド吸収量', 'Shield amount'],
    ['사용 가능할 때 미니언에게 주는 추가 피해', '使用可能時のミニオンへの追加ダメージ', 'Bonus damage to minions while available'],
    ['소모량', 'コスト', 'Cost'], ['소모량 없음', 'コストなし', 'No cost'],
    ['소환사의 결의 추가 체력', 'サモナーの決意による追加体力', "Bonus health from Summoner's Resolve"],
    ['소환사의 통찰력 적용 시 재사용 대기시간', 'サモナーの慧眼適用時のクールダウン', "Cooldown with Summoner's Insight"],
    ['시전 사거리', '射程', 'Cast range'],
    ['오라의 공격력 증가', 'オーラによる攻撃力増加', 'Aura attack damage bonus'],
    ['이동 속도 증가', '移動速度増加', 'Movement speed increase'],
    ['이동 속도·입히는 피해 감소', '移動速度・与ダメージ低下', 'Movement speed and damage reduction'],
    ['자신·주변 아군 체력 회복량', '自身と周囲の味方の体力回復量', 'Healing for you and nearby allies'],
    ['정신 집중 시간', '詠唱時間', 'Channel time'],
    ['주문력 증가', '魔力増加', 'Ability power increase'],
    ['주변 미니언 공격력 증가', '周囲のミニオンの攻撃力増加', 'Nearby minion attack damage bonus'],
    ['주변 미니언 방어력 증가', '周囲のミニオンの物理防御増加', 'Nearby minion armor bonus'],
    ['지속시간', '持続時間', 'Duration'],
    ['진급한 공성 미니언 공격력', '強化された砲台ミニオンの攻撃力', 'Promoted siege minion attack damage'],
    ['진급한 공성 미니언 체력', '強化された砲台ミニオンの体力', 'Promoted siege minion health'],
    ['처음 얻는 이동 속도 증가', '初期移動速度増加', 'Initial movement speed bonus'],
    ['체력 회복 감소', '体力回復低下', 'Healing reduction'],
    ['초당 고정 피해', '毎秒の確定ダメージ', 'True damage per second'],
    ['총 고정 피해', '合計確定ダメージ', 'Total true damage'],
    ['특성 적용 시 공격 속도 증가', 'マスタリー適用時の攻撃速度増加', 'Attack speed increase with mastery'],
    ['특성 적용 시 방해 효과 감소 지속시간', 'マスタリー適用時の行動妨害軽減時間', 'Crowd control reduction duration with mastery'],
    ['특성 적용 시 보호막 피해 흡수량', 'マスタリー適用時のシールド吸収量', 'Shield amount with mastery'],
    ['특성 적용 시 오라의 주문력 증가', 'マスタリー適用時のオーラによる魔力増加', 'Aura ability power bonus with mastery'],
    ['특성 적용 시 이동 속도 증가', 'マスタリー適用時の移動速度増加', 'Movement speed increase with mastery'],
    ['특성 적용 시 정신 집중 시간', 'マスタリー適用時の詠唱時間', 'Channel time with mastery'],
    ['특성 적용 시 주문력 증가', 'マスタリー適用時の魔力増加', 'Ability power increase with mastery'],
    ['특성 적용 시 포탑 광역 피해 비율', 'マスタリー適用時のタワー範囲ダメージ率', 'Turret area damage ratio with mastery'],
    ['포탑 공격 속도 증가', 'タワーの攻撃速度増加', 'Turret attack speed increase'],
    ['표시 사거리', '表示射程', 'Displayed range'],
  ].map(([ko, ja, en]) => [ko, {ja_JP:ja, en_US:en}]));
  const locale = () => window.ClassicLocale?.getLocale?.() || 'ko_KR';
  function spellText(value) {
    const source = String(value ?? '');
    const language = locale();
    if (language === 'ko_KR') return source;
    const translated = spellLabels.get(source)?.[language];
    if (translated) return translated;
    const seconds = source.match(/^(\d+(?:\.\d+)?)초$/);
    if (seconds) return language === 'ja_JP' ? `${seconds[1]}秒` : `${seconds[1]} sec`;
    return window.ClassicLocale?.text?.(source) || source;
  }
  function levelAction(label, expanded) {
    const language = locale();
    if (language === 'ja_JP') return `${label}: レベル1～18の値を${expanded ? '閉じる' : '開く'}`;
    if (language === 'en_US') return `${label}: ${expanded ? 'collapse' : 'expand'} level 1–18 values`;
    return `${label}: 1~18레벨 수치 ${expanded ? '접기' : '펼치기'}`;
  }
  const validValues = values => Array.isArray(values) && values.length === 18
    && values.every(value => typeof value === 'number' && Number.isFinite(value));
  function validEffects(spell) {
    return (Array.isArray(spell.levelEffects) ? spell.levelEffects : []).filter(effect => effect
      && typeof effect.label === 'string' && validValues(effect.values));
  }
  function levelValueHtml(effect, suffix = effect?.unit || '') {
    if (!validValues(effect?.values)) return '';
    const values = effect.values.map(number);
    if (new Set(effect.values).size === 1) return escape(values[0] + suffix);
    const compact = number(Math.min(...effect.values)) + ' ~ ' + number(Math.max(...effect.values)) + suffix;
    const expanded = values.join(' / ') + suffix;
    const label = spellText(effect.label || '수치');
    return `<button type="button" class="summonerLevelValue" data-summoner-range="${escape(compact)}" data-summoner-values="${escape(expanded)}" data-summoner-effect="${escape(label)}" aria-expanded="false" aria-label="${escape(levelAction(label, false))}"><u>${escape(compact)}</u></button>`;
  }
  function descriptionHtml(spell) {
    // Escape the source prose first; only verified numeric tokens create markup.
    return String(spell.detailTemplate || spell.desc || '').split(/(@[^@]+@)/g).map(part => {
      if (!part.startsWith('@') || !part.endsWith('@')) return escape(window.ClassicDamageView.formatNumericText(part));
      const token = part.slice(1, -1);
      const effect = spell.valueTokens?.[token];
      return levelValueHtml(effect, effect?.suffix || '');
    }).join('').replace(/\n/g, '<br>');
  }
  function render(spell, _selectedLevel = 1, iconHtml = '') {
    const effects = validEffects(spell);
    const cooldown = Number.isFinite(spell.cooldown) ? spellText(`${number(spell.cooldown)}초`) : spellText('수치 정보 없음');
    const fixed = (spell.fixedEffects || []).map(effect=>`<div><dt>${escape(spellText(effect.label))}</dt><dd>${escape(spellText(effect.value))}</dd></div>`).join('');
    const template = String(spell.detailTemplate || spell.desc || '');
    const inlineEffects = [...template.matchAll(/@([^@]+)@/g)].map(match => spell.valueTokens?.[match[1]]).filter(Boolean);
    const additional = effects.filter(effect => !inlineEffects.some(inline => inline.label === effect.label
      && JSON.stringify(inline.values) === JSON.stringify(effect.values)));
    const levels = additional.map(effect => `<p class="summonerValueNote">${escape(spellText(effect.label))}: ${levelValueHtml(effect)}</p>`).join('');
    const notes = (spell.valueNotes || []).map(note=>`<p class="summonerValueNote">${escape(spellText(note))}</p>`).join('');
    return `<section class="classicSummonerDetail" data-spell-id="${escape(spell.riotId)}"><header>${iconHtml}<div><small>${escape(spellText('클래식 소환사 주문'))}</small><h2>${escape(spell.name)}</h2><p>${escape(spellText('재사용 대기시간'))} <b>${cooldown}</b></p></div></header><p class="summonerDescription">${descriptionHtml(spell)}</p>${levels}${fixed?`<dl class="summonerNumbers">${fixed}</dl>`:''}${notes}</section>`;
  }
  function handleClick(event) {
    const button = event.target?.closest?.('button[data-summoner-values]');
    if (!button || !button.closest('.classicSummonerDetail')) return false;
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', levelAction(button.dataset.summonerEffect, expanded));
    button.textContent = expanded ? button.dataset.summonerValues : button.dataset.summonerRange;
    event.preventDefault?.();
    return true;
  }
  window.ClassicSpellDetails = Object.freeze({render,validEffects,descriptionHtml,levelValueHtml,handleClick});
})();
