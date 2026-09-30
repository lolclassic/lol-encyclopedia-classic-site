/* Editorial Classic build viewer. All identifiers and source notes come from the bundled catalog. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicRecommendationsUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const copy = {
    ko_KR: {
      title: '추천 조합', role: '포지션', source: '자료 출처', note: '클래식 빌드를 바탕으로 편집한 참고 조합입니다. 실제 선택률이나 승률 통계가 아닙니다.',
      items: '아이템', runes: '룬', masteries: '특성', skills: '스킬 순서',
      start: '시작', early: '초반', core: '핵심', late: '후반',
      mark: '표식', seal: '인장', glyph: '문양', quint: '정수',
      o: '공격', d: '방어', u: '보조', empty: '추천 자료 없음', none: '배분 없음', level: '레벨',
      roles: {top:'탑', jungle:'정글', mid:'미드', adc:'원거리 딜러', support:'서포터'},
    },
    ja_JP: {
      title: 'おすすめビルド', role: 'ロール', source: '出典', note: 'クラシック向けビルドを基に編集した参考構成です。使用率や勝率の統計ではありません。',
      items: 'アイテム', runes: 'ルーン', masteries: 'マスタリー', skills: 'スキル取得順',
      start: '開始', early: '序盤', core: 'コア', late: '終盤',
      mark: '印', seal: '紋章', glyph: '章', quint: '神髄',
      o: '攻撃', d: '防御', u: '補助', empty: '推奨データなし', none: '割り当てなし', level: 'レベル',
      roles: {top:'トップ', jungle:'ジャングル', mid:'ミッド', adc:'ボット', support:'サポート'},
    },
    en_US: {
      title: 'Suggested build', role: 'Role', source: 'Source', note: 'An editorial example adapted from a Classic build. It is not measured pick rate or win rate data.',
      items: 'Items', runes: 'Runes', masteries: 'Masteries', skills: 'Skill order',
      start: 'Start', early: 'Early', core: 'Core', late: 'Late',
      mark: 'Marks', seal: 'Seals', glyph: 'Glyphs', quint: 'Quintessences',
      o: 'Offense', d: 'Defense', u: 'Utility', empty: 'No recommendation available', none: 'No points allocated', level: 'Level',
      roles: {top:'Top', jungle:'Jungle', mid:'Mid', adc:'Bot', support:'Support'},
    },
  };
  const itemStages = ['start', 'early', 'core', 'late'];
  const runeSlots = ['mark', 'seal', 'glyph', 'quint'];
  const branchKeys = ['o', 'd', 'u'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
  })[char]);
  let catalog = null;
  let itemById = new Map();
  let runeById = new Map();
  let masteryById = new Map();

  function setData(data, {items, runes, masteries}) {
    if (data?.schemaVersion !== 1 || data.patch !== '26.19'
        || data.classification !== 'EDITORIAL_CLASSIC_BUILD_ESTIMATE'
        || !data.entries || Object.keys(data.entries).length !== 72
        || !Array.isArray(items) || !Array.isArray(runes) || !Array.isArray(masteries?.branches)) {
      throw new Error('Invalid 26.19 Classic recommendation catalog');
    }
    const nextItems = new Map(items.map(row => [String(row.riotId), row]));
    const nextRunes = new Map(runes.map(row => [String(row.id), row]));
    const nextMasteries = new Map(masteries.branches.flatMap(branch => branch.nodes.map(row => [row.id, {...row, branch:branch.key}])));
    for (const [id, entry] of Object.entries(data.entries)) {
      if (!entry || !/^[a-z0-9]+$/.test(id) || !entry.items || !entry.runes || !entry.masteries
          || !Array.isArray(entry.skillOrder) || entry.skillOrder.length !== 18
          || entry.skillOrder.some(slot => !['Q', 'W', 'E', 'R'].includes(slot))
          || !branchKeys.every(key => Number.isInteger(entry.masterySplit?.[key]))) {
        throw new Error(`Invalid Classic recommendation: ${id}`);
      }
      for (const stage of itemStages) {
        if (!Array.isArray(entry.items[stage]) || entry.items[stage].some(itemId => !nextItems.has(String(itemId)))) {
          throw new Error(`Unknown recommended item: ${id}/${stage}`);
        }
      }
      for (const slot of runeSlots) {
        if (!Array.isArray(entry.runes[slot]) || entry.runes[slot].some(row =>
          !nextRunes.has(String(row.id)) || !Number.isInteger(row.count) || row.count < 1)) {
          throw new Error(`Unknown recommended rune: ${id}/${slot}`);
        }
      }
      if (Object.entries(entry.masteries).some(([nodeId, rank]) => {
        const node = nextMasteries.get(nodeId);
        return !node || !Number.isInteger(rank) || rank < 1 || rank > node.max;
      }) || branchKeys.some(branch => Object.entries(entry.masteries).reduce((sum, [nodeId, rank]) =>
        sum + (nextMasteries.get(nodeId)?.branch === branch ? rank : 0), 0) !== entry.masterySplit[branch])) {
        throw new Error(`Invalid recommended masteries: ${id}`);
      }
    }
    catalog = data;
    itemById = nextItems;
    runeById = nextRunes;
    masteryById = nextMasteries;
    return Object.keys(data.entries).length;
  }

  function nameOf(type, row, names) {
    const fn = names?.[type];
    return esc((typeof fn === 'function' && fn(row)) || row.ko || row.title || row.name || row.en || row.id || '');
  }
  function icon(src, className) {
    return src ? `<img class="${className}" src="${esc(src)}" alt="" loading="lazy">` : '';
  }
  function itemGroup(entry, stage, t, names) {
    const refs = entry.items[stage];
    const counts = new Map();
    refs.forEach(ref => counts.set(String(ref), (counts.get(String(ref)) || 0) + 1));
    const content = [...counts].map(([id, count]) => {
      const item = itemById.get(id);
      return `<li class="classicRecommendationChip">${icon(item.icon, 'classicRecommendationIcon')}<span>${nameOf('items', item, names)}</span>${count > 1 ? `<b>×${count}</b>` : ''}</li>`;
    }).join('') || `<li class="classicRecommendationEmpty">${esc(t.empty)}</li>`;
    return `<div class="classicRecommendationGroup"><h5>${esc(t[stage])}</h5><ul>${content}</ul></div>`;
  }
  function runeGroup(entry, slot, t, names) {
    const content = entry.runes[slot].map(ref => {
      const rune = runeById.get(String(ref.id));
      return `<li class="classicRecommendationChip">${icon(rune.img, 'classicRecommendationIcon')}<span>${nameOf('runes', rune, names)}</span><b>×${ref.count}</b></li>`;
    }).join('') || `<li class="classicRecommendationEmpty">${esc(t.empty)}</li>`;
    return `<div class="classicRecommendationGroup"><h5>${esc(t[slot])}</h5><ul>${content}</ul></div>`;
  }
  function masteryGroup(entry, branch, t, names) {
    const selected = Object.entries(entry.masteries).map(([id, rank]) => ({node:masteryById.get(id), rank}))
      .filter(({node}) => node.branch === branch)
      .sort((a, b) => a.node.row - b.node.row || a.node.col - b.node.col);
    const content = selected.map(({node, rank}) => `<li class="classicRecommendationChip">
      ${icon(node.iconOn, 'classicRecommendationIcon')}<span>${nameOf('masteries', node, names)}</span><b>${rank}/${node.max}</b>
    </li>`).join('') || `<li class="classicRecommendationEmpty">${esc(t.none)}</li>`;
    return `<div class="classicRecommendationGroup"><h5>${esc(t[branch])} <small>${entry.masterySplit[branch]}</small></h5><ul>${content}</ul></div>`;
  }
  function skillOrder(entry, t) {
    return `<ol class="classicRecommendationSkillOrder">${entry.skillOrder.map((skill, index) =>
      `<li class="classicRecommendationSkill${skill === 'R' ? ' ultimate' : ''}" aria-label="${esc(t.level)} ${index + 1}: ${skill}"><small>${index + 1}</small><b>${skill}</b></li>`).join('')}</ol>`;
  }

  function render(championId, {locale = 'ko_KR', open = false, names = {}} = {}) {
    if (!catalog) throw new Error('Classic recommendations have not been loaded');
    const id = typeof championId === 'object' ? championId?.id : championId;
    const entry = catalog.entries[String(id || '').toLowerCase()];
    if (!entry) return '';
    const t = copy[locale] || copy.ko_KR;
    const role = t.roles[entry.role] || entry.role;
    const source = /^https:\/\/riftback\.gg\/champions\/[a-z0-9-]+\/?$/.test(entry.sourceUrl)
      ? `${catalog.source.name} (${entry.sourceUrl})` : catalog.source.name;
    return `<details class="classicRecommendations" data-recommendation-champion="${esc(id)}"${open ? ' open' : ''}>
      <summary><span>${esc(t.title)}</span><small>${esc(role)}</small></summary>
      <div class="classicRecommendationsBody">
        <p class="classicRecommendationNote">${esc(t.note)}</p>
        <section><h4>${esc(t.items)}</h4><div class="classicRecommendationGroups">${itemStages.map(stage => itemGroup(entry, stage, t, names)).join('')}</div></section>
        <section><h4>${esc(t.runes)}</h4><div class="classicRecommendationGroups">${runeSlots.map(slot => runeGroup(entry, slot, t, names)).join('')}</div></section>
        <section><h4>${esc(t.masteries)} <small>${branchKeys.map(key => entry.masterySplit[key]).join(' / ')}</small></h4><div class="classicRecommendationGroups">${branchKeys.map(branch => masteryGroup(entry, branch, t, names)).join('')}</div></section>
        <section><h4>${esc(t.skills)}</h4>${skillOrder(entry, t)}</section>
        <p class="classicRecommendationSource">${esc(t.source)}: ${esc(source)} · ${esc(catalog.source.retrievedAtKst || '')}</p>
      </div>
    </details>`;
  }
  return Object.freeze({setData, render});
});
