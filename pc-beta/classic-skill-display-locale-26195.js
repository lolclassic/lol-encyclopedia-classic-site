/* The eleven 16.18.1 display-only skills have reviewed Korean value bindings.
 * Detailed JA/EN prose below translates those reviewed tooltips; it is not a
 * Riot-authored full tooltip or a new damage calculation. Ability wording and
 * names were checked against Riot 16.19.1 Classic Data Dragon descriptions.
 * Every @displayN@ remains bound to the unchanged verified Korean value row.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicSkillDisplayLocale26195 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const templates = Object.freeze({
    'Jade_Fiora:P': {
      ja_JP: 'ダメージを与えるたびに、<healing>@display0@ (+@display1@ × (チャンピオンレベル − @display2@))の体力</healing>を@display3@秒かけて回復する。チャンピオンに攻撃を命中させると、この効果は最大@display4@回までスタックする。',
      en_US: 'Each time Fiora deals damage, she restores <healing>@display0@ (+@display1@ × (champion level − @display2@)) Health</healing> over @display3@ seconds. Hitting champions stacks this effect up to @display4@ times.',
    },
    'Jade_Galio:P': {
      ja_JP: '<scaleMR>合計魔法防御の@display0@%</scaleMR>に相当する<scaleAP>追加魔力</scaleAP>を獲得する。',
      en_US: 'Galio gains <scaleAP>bonus Ability Power</scaleAP> equal to <scaleMR>@display0@% of his total Magic Resistance</scaleMR>.',
    },
    'Jade_Galio:Q': {
      ja_JP: '両目から衝撃波を放ち、着弾地点の周囲にいる敵に<magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP>の魔法ダメージ</magicDamage>を与え、@display2@秒間、@display3@%の<status>スロウ</status>効果を付与する。',
      en_US: 'Galio fires a concussive blast from his eyes, dealing <magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP> magic damage</magicDamage> to enemies near the impact point and <status>slowing</status> them by @display3@% for @display2@ seconds.',
    },
    'Jade_Poppy:E': {
      ja_JP: '敵に突撃し、<magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP>の魔法ダメージ</magicDamage>を与えて短い距離を押し進める。対象が地形に衝突すると、さらに<magicDamage>@display2@ <scaleAP>(+@display3@ AP)</scaleAP>の魔法ダメージ</magicDamage>を与え、@display4@秒間<status>スタン</status>させる。',
      en_US: 'Poppy charges at an enemy, dealing <magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP> magic damage</magicDamage> and carrying them a short distance. If the target collides with terrain, she deals an additional <magicDamage>@display2@ <scaleAP>(+@display3@ AP)</scaleAP> magic damage</magicDamage> and <status>stuns</status> them for @display4@ seconds.',
    },
    'Jade_Poppy:R': {
      ja_JP: '敵チャンピオン一体に集中する。@display0@秒間、その対象に与えるダメージが@display1@%増加し、対象以外の敵からのダメージとスキルを受けなくなる。',
      en_US: 'Poppy focuses on one enemy champion. For @display0@ seconds, she deals @display1@% more damage to that target and is immune to damage and abilities from other enemies.',
    },
    'Jade_Shyvana:P': {
      ja_JP: '通常攻撃がスキルを強化する。<br><br>通常攻撃を行うと、Qのクールダウンが@display0@秒短縮され、Wの効果時間が@display1@秒延長される。Wの延長上限は@display2@秒。<br><br>Eには別途@display3@%の追加ダメージ率がある。通常攻撃でフューリーを@display4@獲得し、自然回復では@display5@秒ごとにフューリーを@display6@獲得する。',
      en_US: 'Basic attacks enhance Shyvana’s abilities.<br><br>Each basic attack reduces Q’s cooldown by @display0@ seconds and extends W’s duration by @display1@ seconds. W can be extended by at most @display2@ seconds.<br><br>E has a separate @display3@% bonus damage rate. Basic attacks grant @display4@ Fury, and natural regeneration grants @display6@ Fury every @display5@ seconds.',
    },
    'Jade_Shyvana:R': {
      ja_JP: '<spellActive>発動時:</spellActive> 龍に変身して指定地点へ飛びかかる。通過した敵に<magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP>の魔法ダメージ</magicDamage>を与え、着地地点へ向かってノックバックする。<br><br><spellPassive>自動効果:</spellPassive> <scaleArmor>物理防御</scaleArmor>と<scaleMR>魔法防御</scaleMR>が@display2@増加する。<keywordMajor>ドラゴンフォーム</keywordMajor>中は、この防御ボーナスが2倍になる。<br><br><keywordMajor>ドラゴンフォーム</keywordMajor>中は他のスキルにも追加効果が付く。<br><br>通常攻撃でフューリーを@display3@獲得し、ドラゴンフォーム中は毎秒@display4@フューリーを消費する。',
      en_US: '<spellActive>Active:</spellActive> Shyvana transforms into a dragon and flies to a target location. Enemies along her path take <magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP> magic damage</magicDamage> and are knocked toward the landing point.<br><br><spellPassive>Passive:</spellPassive> She gains @display2@ <scaleArmor>Armor</scaleArmor> and <scaleMR>Magic Resistance</scaleMR>. These defensive bonuses are doubled in <keywordMajor>Dragon Form</keywordMajor>.<br><br>Her other abilities gain additional effects in <keywordMajor>Dragon Form</keywordMajor>.<br><br>Basic attacks grant @display3@ Fury, while Dragon Form consumes @display4@ Fury per second.',
    },
    'Jade_XinZhao:Q': {
      ja_JP: '次の@display0@回の通常攻撃がそれぞれ<physicalDamage>@display1@ <scaleAD>(+@display2@ AD)</scaleAD>の追加物理ダメージ</physicalDamage>を与え、他のスキルのクールダウンを@display3@秒短縮する。最後の通常攻撃は対象を@display4@秒間<status>ノックアップ</status>する。',
      en_US: 'Xin Zhao’s next @display0@ basic attacks each deal <physicalDamage>@display1@ <scaleAD>(+@display2@ AD)</scaleAD> bonus physical damage</physicalDamage> and reduce the cooldown of his other abilities by @display3@ second. The final attack <status>knocks up</status> the target for @display4@ seconds.',
    },
    'Jade_XinZhao:W': {
      ja_JP: '<spellPassive>自動効果:</spellPassive> 通常攻撃を@display0@回行うたびに、<healing>@display1@ <scaleAP>(+@display2@ AP)</scaleAP>の体力</healing>を回復する。<br><br><spellActive>発動時:</spellActive> 雄叫びを上げ、@display3@秒間<attackSpeed>攻撃速度が@display4@%</attackSpeed>増加する。',
      en_US: '<spellPassive>Passive:</spellPassive> Every @display0@ basic attacks restore <healing>@display1@ <scaleAP>(+@display2@ AP)</scaleAP> Health</healing>.<br><br><spellActive>Active:</spellActive> Xin Zhao lets out a battle cry, gaining <attackSpeed>@display4@% Attack Speed</attackSpeed> for @display3@ seconds.',
    },
    'Jade_XinZhao:E': {
      ja_JP: '敵に突進してその対象を<keywordMajor>挑戦対象</keywordMajor>にする。突進時には対象を含む周囲の敵すべてに<magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP>の魔法ダメージ</magicDamage>を与え、@display2@秒間、@display3@%の<status>スロウ</status>効果を付与する。',
      en_US: 'Xin Zhao charges an enemy and <keywordMajor>challenges</keywordMajor> the target. The charge deals <magicDamage>@display0@ <scaleAP>(+@display1@ AP)</scaleAP> magic damage</magicDamage> to all nearby enemies and <status>slows</status> them by @display3@% for @display2@ seconds.',
    },
    'Jade_XinZhao:R': {
      ja_JP: '周囲の敵に現在体力に応じたダメージを与え、挑戦対象以外をノックバックする。命中したチャンピオンの数に応じて追加の物理防御と魔法防御を得る。<br><br>個別のダメージ値は<physicalDamage>@display0@ <scaleAD>(+@display1@ 増加攻撃力)</scaleAD></physicalDamage>。別途、対象の現在体力の@display2@%に関する値もあるが、適用関係は未確認のため単一のダメージ式には合算しない。<br><br>命中したチャンピオン@display3@体ごとに、@display4@秒間、<scaleArmor>物理防御</scaleArmor>と<scaleMR>魔法防御</scaleMR>を@display5@獲得する。',
      en_US: 'Xin Zhao damages nearby enemies based on their current Health and knocks back targets he has not challenged. He gains bonus Armor and Magic Resistance based on how many champions he hits.<br><br>The separate damage figure is <physicalDamage>@display0@ <scaleAD>(+@display1@ bonus AD)</scaleAD></physicalDamage>. A separate value of @display2@% of current Health also exists, but its interaction is unverified, so these values are not combined into one damage formula.<br><br>For every @display3@ champion hit, he gains @display5@ <scaleArmor>Armor</scaleArmor> and <scaleMR>Magic Resistance</scaleMR> for @display4@ seconds.',
    },
  });
  const supportedLocales = ['ja_JP', 'en_US'];
  const tokenNames = text => [...text.matchAll(/@([^@\n]+)@/g)].map(match => match[1]).sort();
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function render(locale, championId, slot, details, view) {
    if (!supportedLocales.includes(locale)) return null;
    const key = championId + ':' + slot;
    const localizedTooltip = templates[key]?.[locale];
    if (!localizedTooltip || details?.presentationOnly !== true || details.sourceChampionId !== championId
        || !details.sourceUrl?.includes('/ko_KR/mode/classic/champion/' + championId + '.json')
        || typeof details.sourceObjectKey !== 'string' || !details.sourceObjectKey)
      throw new Error('Classic display-only locale/source mismatch: ' + key);
    const sourceTokens = tokenNames(details.tooltip);
    const translatedTokens = tokenNames(localizedTooltip);
    if (!same(sourceTokens, translatedTokens) || !same(sourceTokens, Object.keys(details.valuesByToken || {}).sort())
        || /[가-힣]|\{\{/.test(localizedTooltip))
      throw new Error('Classic display-only value binding changed: ' + key);
    const html = view.description({...details, tooltip:localizedTooltip}, locale);
    if (/[가-힣]|@[^@\n]+@|\{\{[^{}]+\}\}/.test(html))
      throw new Error('Untranslated Classic display-only tooltip: ' + key);
    return {html, missing:[], provenance:{
      values:{classification:'CLASSIC_LOCAL_DISPLAY_EVIDENCE', presentationOnly:true,
        exactVersionMappingProven:false, sourceObjectKey:details.sourceObjectKey,
        sourceUrl:details.sourceUrl},
      wording:{classification:'REVIEWED_TRANSLATION_OF_KOREAN_DISPLAY_TOOLTIP',
        officialSummaryUrl:`https://ddragon.leagueoflegends.com/cdn/16.19.1/data/${locale}/mode/classic/champion/${championId}.json`},
    }};
  }
  return Object.freeze({render, keys:Object.freeze(Object.keys(templates).sort())});
});
