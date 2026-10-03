import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const ui = require('./pc-beta/classic-recommendations-ui.js');
const dataPath = 'pc-beta/data/';
const read = file => JSON.parse(fs.readFileSync(dataPath + file, 'utf8'));
const data = read('classic-recommendations-26195.json');
const items = read('classic-items-26.19.json').items;
const runes = read('runes-classic.json');
const masteries = read('classic-masteries-26.19.json');
const spells = read('spells.json');
const references = {items, runes, masteries, spells};

assert.equal(ui.setData(data, references), 72);
for (const id of Object.keys(data.entries)) {
  const html = ui.render(id);
  assert.match(html, /<details class="classicRecommendations"/);
  assert.match(html, /classicRecommendationSkillOrder/);
  assert.equal((html.match(/class="classicRecommendationSkill(?: ultimate)?"/g) || []).length, 18, id);
  assert.match(html, /실제 선택률이나 승률 통계가 아닙니다/);
}

const names = {
  items: row => `Localized item ${row.riotId}`,
  runes: row => `Localized rune ${row.id}`,
  masteries: row => `Localized mastery ${row.id}`,
  spells: row => `Localized spell ${row.riotId}`,
};
const ja = ui.render({id:'garen'}, {locale:'ja_JP', open:true, names});
assert.match(ja, /<details[^>]+ open>/);
assert.match(ja, /おすすめビルド/);
assert.match(ja, /使用率や勝率の統計ではありません/);
assert.match(ja, /Localized item 771029/);
assert.match(ja, /Localized rune 775245/);
assert.match(ja, /Localized mastery jade_533/);
data.entries.garen.summonerSpells.forEach(id => assert.ok(ja.includes(`Localized spell ${id}`)));
assert.match(ja, /×5/); // Garen's five health potions remain represented.
assert.match(ja, /Riftback \(https:\/\/riftback\.gg\/champions\/garen\)/);

const en = ui.render('garen', {locale:'en_US'});
assert.match(en, /Suggested build/);
assert.match(en, /not measured pick rate or win rate data/);
assert.match(en, /<small>21 \/ 9 \/ 0<\/small>/);
assert.doesNotMatch(en, /<details[^>]+ open>/);
assert.equal(ui.render('not-a-classic-champion'), '');

const unsafe = structuredClone(data);
unsafe.entries.garen.sourceUrl = 'javascript:alert(1)';
ui.setData(unsafe, references);
assert.doesNotMatch(ui.render('garen'), /javascript:alert/);

const incomplete = structuredClone(data);
incomplete.entries.garen.runes.mark = [];
ui.setData(incomplete, references);
assert.match(ui.render('garen'), /추천 자료 없음/);

const invalid = structuredClone(data);
invalid.entries.garen.items.core[0] = 'unknown';
assert.throws(() => ui.setData(invalid, references), /Unknown recommended item/);
assert.match(ui.render('garen'), /추천 자료 없음/); // Rejected input did not replace the prior catalog.

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const attributes = html => Object.fromEntries([...html.matchAll(/([\w-]+)="([^"]*)"/g)]
  .map(([, key, value]) => [key, value]));
const count = (html, pattern) => [...html.matchAll(pattern)].length;
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const inputBefore = JSON.stringify({data, references});
[data, references].forEach(freeze);
assert.ok(Object.isFrozen(ui));
assert.equal(ui.setData(data, references), 72);
assert.equal(masteries.branches.reduce((sum, branch) => sum + branch.nodes.length, 0), 56);
for (const branch of masteries.branches) {
  for (const node of branch.nodes) {
    for (const source of [node.iconOn, node.iconOff]) {
      assert.ok(fs.existsSync('pc-beta/' + source), `${node.id}: missing ${source}`);
    }
  }
}
for (const [champion, entry] of Object.entries(data.entries)) {
  const html = ui.renderMasteryTrees(entry, masteries);
  assert.ok(ui.render(champion).includes(html), `${champion}: card must contain the complete tree`);
  assert.equal(count(html, /class="masteryRow"/g), 18, champion);
  assert.equal(count(html, /class="masteryCell(?: empty)?"/g), 72, champion);
  assert.equal(count(html, /class="masteryCell empty"/g), 16, champion);
  assert.equal(count(html, /class="mnode(?: [^"]*)?"/g), 56, champion);
  assert.equal(count(html, /class="pic mi"/g), 56, champion);
  assert.equal(count(html, /class="masteryLabel"/g), 56, champion);
  assert.ok(!/<button\b|\bdata-mst=|\bdata-act=|\bdisabled\b|\bon\w+=|\btabindex=/.test(html), champion);
  let total = 0;
  for (const [index, branch] of masteries.branches.entries()) {
    const tree = html.match(new RegExp(`<section class="masteryColumn branch-${index}"[\\s\\S]*?<\\/section>`))?.[0];
    assert.ok(tree, `${champion}/${branch.key}`);
    assert.equal(count(tree, /class="masteryRow"/g), 6);
    assert.equal(count(tree, /class="masteryCell(?: empty)?"/g), 24);
    const slots = [...tree.matchAll(/<span class="masteryCell(?: empty)?"[^>]*>/g)].map(match => attributes(match[0]));
    assert.deepEqual(slots.map(slot => `${slot['data-row']}:${slot['data-col']}`),
      Array.from({length: 24}, (_, slot) => `${Math.floor(slot / 4)}:${slot % 4}`));
    const renderedNodes = [...tree.matchAll(/<div class="mnode[^>]*>[\s\S]*?<\/div>/g)];
    assert.equal(renderedNodes.length, branch.nodes.length);
    const nodeById = new Map(renderedNodes.map(match => [attributes(match[0])['data-node-id'], match[0]]));
    let branchTotal = 0;
    for (const node of branch.nodes) {
      const rank = entry.masteries[node.id] || 0;
      const markup = nodeById.get(node.id);
      assert.ok(markup, `${champion}/${node.id}`);
      const attrs = attributes(markup.slice(0, markup.indexOf('>') + 1));
      assert.equal(attrs['data-row'], String(node.row));
      assert.equal(attrs['data-col'], String(node.col));
      assert.equal(attrs['data-rank'], String(rank));
      assert.equal(attrs.role, 'img');
      assert.equal(attrs['aria-label'], `${escape(node.name)} ${rank}/${node.max}`);
      assert.match(markup, new RegExp(`<em>${rank}/${node.max}<\\/em>`));
      assert.ok(markup.includes(`src="${escape(rank > 0 ? node.iconOn : node.iconOff)}"`));
      assert.equal(attrs.class.split(' ').includes('has'), rank > 0);
      assert.equal(attrs.class.split(' ').includes('full'), rank > 0 && rank >= node.max);
      assert.equal(attrs.class.split(' ').includes('muted'), rank === 0);
      branchTotal += rank;
    }
    assert.ok(tree.includes(`data-branch="${branch.key}" data-total-rank="${branchTotal}"`));
    assert.equal(branchTotal, entry.masterySplit[branch.key]);
    total += branchTotal;
  }
  assert.equal(total, 30, champion);
  assert.ok(html.startsWith('<div class="masteryShell classicMastery classicRecommendationMasteries" data-total-rank="30">'));
}
for (const [locale, labels] of Object.entries({
  ko_KR: ['공격', '방어', '보조'], ja_JP: ['攻撃', '防御', '補助'], en_US: ['Offense', 'Defense', 'Utility'],
})) {
  const named = [];
  const html = ui.renderMasteryTrees(data.entries.garen, masteries, {locale, names: {
    masteries: node => { named.push(node); return `${locale}:${node.id}`; },
  }});
  labels.forEach(label => assert.ok(html.includes(`class="masteryColumnHead">${label} <b>`)));
  assert.equal(named.length, 56);
  assert.ok(named.every(node => ['o', 'd', 'u'].includes(node.branch)));
  named.forEach(node => assert.ok(html.includes(`<small class="masteryLabel">${locale}:${node.id}</small>`)));
}
assert.equal(ui.renderMasteryTrees(data.entries.garen, masteries, {locale: 'unknown'}), ui.renderMasteryTrees(data.entries.garen, masteries));
assert.equal(ui.renderMasteryTrees(data.entries.garen, masteries, {names: {masteries: () => ''}}), ui.renderMasteryTrees(data.entries.garen, masteries));
assert.equal(ui.renderMasteryTrees({...data.entries.garen, masterySplit: {o: 99, d: 99, u: 99}}, masteries), ui.renderMasteryTrees(data.entries.garen, masteries));
const hostileMasteries = structuredClone(masteries);
const hostile = `A&<script>"'`;
const hostileNode = hostileMasteries.branches[0].nodes[0];
hostileNode.id = hostile;
hostileNode.iconOn = `images/a&<b>"'.png`;
hostileNode.iconOff = `images/z&<b>"'.png`;
const escaped = ui.renderMasteryTrees({masteries: {[hostile]: 1}}, hostileMasteries, {names: {masteries: () => hostile}});
assert.ok(!escaped.includes('<script>') && !escaped.includes('<b>"'));
assert.ok(escaped.includes(`data-node-id="${escape(hostile)}"`));
assert.ok(escaped.includes(`aria-label="${escape(hostile)} 1/1"`));
assert.ok(escaped.includes(`src="${escape(hostileNode.iconOn)}"`));
assert.ok(ui.renderMasteryTrees({masteries: {}}, hostileMasteries).includes(`src="${escape(hostileNode.iconOff)}"`));
const validHtml = ui.render('garen');
const rejected = structuredClone(data);
rejected.entries.garen.masteries = {unknown: 1};
const rejectedMasteries = structuredClone(masteries);
rejectedMasteries.branches[0].nodes[0].iconOn = 'images/rejected.png';
rejectedMasteries.branches[0].nodes[0].iconOff = 'images/rejected.png';
assert.throws(() => ui.setData(rejected, {...references, masteries: rejectedMasteries}), /Invalid recommended masteries/);
assert.equal(ui.render('garen'), validHtml, 'Rejected catalogs must preserve captured mastery data');
assert.equal(JSON.stringify({data, references}), inputBefore);

const spellById = new Map(spells.map(spell => [spell.riotId, spell]));
const spellChips = html => {
  const list = html.match(/<ul class="classicRecommendationSpells">[\s\S]*?<\/ul>/)?.[0] || '';
  return [...list.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/g)].map(match => ({
    markup: match[0], attrs: attributes(match[0].match(/<button\b[^>]*>/)?.[0] || ''),
    chipAttrs: attributes(match[0].slice(0, match[0].indexOf('>') + 1)),
  }));
};
for (const [champion, entry] of Object.entries(data.entries)) {
  assert.equal(entry.summonerSpells.length, 2, champion);
  assert.equal(new Set(entry.summonerSpells).size, 2, champion);
  const html = ui.render(champion);
  assert.match(html, /class="classicRecommendationSpells"/);
  const chips = spellChips(html);
  assert.equal(chips.length, 2, champion);
  assert.deepEqual(chips.map(chip => chip.attrs['data-classic-spell']), entry.summonerSpells);
  for (const {markup, attrs, chipAttrs} of chips) {
    const spell = spellById.get(attrs['data-classic-spell']);
    assert.ok(spell, `${champion}: unknown recommended spell`);
    assert.ok(chipAttrs.class.split(' ').includes('classicRecommendationChip'));
    assert.equal(attrs.class, 'classicRecommendationSpell');
    assert.equal(attrs.type, 'button');
    assert.ok(markup.includes(`src="${escape(spell.img)}"`));
    assert.ok(markup.includes(escape(spell.name)));
    assert.ok(fs.existsSync('pc-beta/' + spell.img), `${champion}: missing ${spell.img}`);
    assert.ok(!/\bdata-act=|\bdata-mst=|\bon\w+=|\btabindex=/.test(markup));
  }
}
for (const [locale, note] of Object.entries({
  ko_KR: '포지션을 기준으로 편집한 참고 추천입니다.',
  ja_JP: 'ロールを基に編集した参考のおすすめです。',
  en_US: 'An editorial reference recommendation based on role.',
})) {
  const namedSpells = [];
  const html = ui.render('garen', {locale, names: {
    spells: spell => { namedSpells.push(spell.riotId); return `${locale}:${spell.riotId}`; },
  }});
  assert.deepEqual(namedSpells, data.entries.garen.summonerSpells);
  spellChips(html).forEach(chip => assert.ok(chip.markup.includes(`${locale}:${chip.attrs['data-classic-spell']}`)));
  assert.ok(html.includes(`<p class="classicRecommendationSpellNote">${note}</p>`));
}
const unsafeSpells = structuredClone(spells);
const unsafeSpellId = data.entries.garen.summonerSpells[0];
const unsafeSpell = unsafeSpells.find(spell => spell.riotId === unsafeSpellId);
unsafeSpell.img = `images/spell&<b>"'.png`;
ui.setData(data, {...references, spells: unsafeSpells});
const unsafeSpellHtml = ui.render('garen', {names: {spells: () => hostile}});
const unsafeSpellChip = spellChips(unsafeSpellHtml).find(chip => chip.attrs['data-classic-spell'] === unsafeSpellId);
assert.ok(unsafeSpellChip.markup.includes(`src="${escape(unsafeSpell.img)}"`));
assert.ok(unsafeSpellChip.markup.includes(escape(hostile)));
assert.ok(!unsafeSpellChip.markup.includes('<script>') && !unsafeSpellChip.markup.includes('<b>"'));
assert.equal(ui.setData(data, references), 72);
const validSpellHtml = ui.render('garen');
for (const pair of [
  undefined,
  null,
  ['unknown', data.entries.garen.summonerSpells[1]],
  [unsafeSpellId, unsafeSpellId],
  [unsafeSpellId],
  [],
  [...data.entries.garen.summonerSpells, 'SummonerSmite_Jade'],
]) {
  const badSpells = structuredClone(data);
  badSpells.entries.garen.summonerSpells = pair;
  assert.throws(() => ui.setData(badSpells, {...references, spells: unsafeSpells}), /spell/i);
  assert.equal(ui.render('garen'), validSpellHtml, 'Rejected spell data must preserve the prior catalog and references');
}
assert.equal(JSON.stringify({data, references}), inputBefore);

console.log('PASS 72 Classic recommendation cards, summoner spell pairs, and full mastery trees: coordinates, 56 nodes/16 empty slots, ranks/icons/assets/totals, three locales, escaping, immutable input, source safety, and transactional ID/count validation');
