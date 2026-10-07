/* =============================================================
   롤 백과사전 클래식 — V8
   V7에서 이어짐. 기존 기능 유지 + 아래 항목 수정/추가.

   [수정] localStorage 차단/오류 시 앱 백지 → 메모리 폴백
   [수정] #post/{id} 직접 진입 크래시
   [수정] 홈 커뮤니티 글 5개가 전부 post/1로 가던 문제
   [수정] 공략 하위탭 활성 표시 없음 + 재진입 시 리셋 (S.guide 미사용)
   [추가] 자유게시판 글쓰기 / 댓글 / 추천 / 이전글·다음글 / 페이지 이동
   [추가] DATA_SCHEMA.json 준수 (season/patch/source/verified/verificationNote)
   [추가] 비공식 팬 프로젝트 고지 (Play 등록 필수)
   [추가] 아이템 계층형 목록, 빌더 저장/불러오기, 용어사전
   ============================================================= */

/* ---------- 안전한 저장소 (localStorage 죽어도 앱은 산다) ---------- */
const mem = {};
let storageOk = true;
const store = {
  get(k, fb) {
    try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); }
    catch (e) { storageOk = false; return k in mem ? mem[k] : fb; }
  },
  set(k, v) {
    mem[k] = v;
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { storageOk = false; }
  },
  remove(k) {
    delete mem[k];
    try { localStorage.removeItem(k); }
    catch (e) { storageOk = false; }
  }
};

/* Champion content comes only from verified /mode/classic/ originals. */
let META = {}, champions = [], items = [], runes = [], classicRunes = [], MST = { branches: [], names: [] }, spells = [], CATS = [];
let CLASSIC_ITEM_CATALOG = null;
let CLASSIC = { ids: [], notes: [] }, classicSet = new Set();
let CLASSIC_SKILLS = { champions: [] }, classicSkillById = new Map();
let CLASSIC_CHAMPION_MEDIA = null;
let itemByEn = {}, itemByI = {}, mstById = {}, booted = false;
const CLASSIC_MASTERY_STATE_KEY = 'res3mastery2619';
const appLocale = window.ClassicLocale || {
  locales: ['ko_KR'], languageNames: {ko_KR:'한국어'},
  getLocale: () => 'ko_KR', setLocale: () => false, name: (_kind, row) => row?.ko || row?.name || '',
  description: () => '', skill: () => null, text: value => value, apply: () => {}, observe: () => {},
  hasVerifiedName: () => true,
};
const localized = value => appLocale.text(value);
const appMessage = (ko, ja, en) => ({ ja_JP: ja, en_US: en })[appLocale.getLocale()] || ko;
const championName = champion => {
  const official = appLocale.name('champions', champion);
  if (appLocale.getLocale() !== 'ko_KR' && window.OperatorChampionOverlay?.isChampion(champion)
      && !appLocale.hasVerifiedName('champions', champion)) return champion.nameEn || champion.en || official;
  return official;
};
const itemName = item => appLocale.name('items', item);
const spellName = spell => appLocale.name('spells', spell);
const runeName = rune => appLocale.name('runes', rune);
const masteryName = mastery => appLocale.name('masteries', mastery);
const championTitle = champion => appLocale.getLocale() === 'ko_KR' ? champion.nick || ''
  : window.ClassicChampionBackgrounds?.localizedTitle?.(champion.riotId, appLocale.getLocale())
    || appLocale.row?.('champions', champion.riotId)?.title || '';

function assertClassicMasteries2619(data) {
  if (data?.source?.clientVersion !== '16.19.821.7343'
      || data.source.sha256 !== '8bbd09190578250309fb5d005589073e25413a36fbb9e10dc4d2e55c39c76897'
      || data.unlockRule?.totalPoints !== 30
      || data.unlockRule?.pointsPerRow !== 4
      || !Array.isArray(data.branches)
      || data.branches.map(branch => branch.key).join(',') !== 'o,d,u'
      || data.branches.map(branch => branch.nodes?.length).join(',') !== '18,19,19'
      || Object.keys(data.iconSha256 || {}).length !== 112) {
    throw new Error('26.19 Classic mastery source mismatch');
  }
  const nodes = data.branches.flatMap(branch => Array.isArray(branch.nodes)
    ? branch.nodes.map(node => ({ ...node, branch: branch.key })) : []);
  const byId = new Map(nodes.map(node => [node.id, node]));
  const positions = new Set();
  if (nodes.length !== 56 || byId.size !== 56 || data.branches.some(branch => !Array.isArray(branch.nodes))) {
    throw new Error('26.19 Classic mastery roster mismatch');
  }
  for (const node of nodes) {
    const position = `${node.branch}:${node.row}:${node.col}`;
    if (!/^jade_\d+$/.test(node.id) || node.id !== `jade_${node.riotId}`
        || !node.name?.trim() || !node.desc?.trim()
        || !Number.isInteger(node.max) || node.max < 1
        || !Number.isInteger(node.row) || node.row < 0
        || !Number.isInteger(node.col) || node.col < 0 || node.col > 3
        || !Number.isInteger(node.requiredPoints) || node.requiredPoints !== node.row * 4
        || !Array.isArray(node.requires) || positions.has(position)
        || node.iconOn !== `images/mode_classic/masteries/${node.riotId}_ON.png`
        || node.iconOff !== `images/mode_classic/masteries/${node.riotId}_OFF.png`
        || !data.iconSha256[node.iconOn] || !data.iconSha256[node.iconOff]) {
      throw new Error(`26.19 Classic mastery node mismatch: ${node.id}`);
    }
    positions.add(position);
    for (const requirement of node.requires) {
      const parent = byId.get(requirement.id);
      if (!parent || parent.branch !== node.branch || requirement.rank !== parent.max) {
        throw new Error(`26.19 Classic mastery prerequisite mismatch: ${node.id}`);
      }
    }
  }
}

/* 이미지 헬퍼: 원본 이미지가 없거나 로딩 실패하면 첫 글자 플레이스홀더로 대체 */
function pic(src, label, cls = '', sourceFallback = '') {
  const fb = `<i>${esc((label || '?').charAt(0))}</i>`;
  if (!src) return `<span class="pic noimg ${cls}">${fb}</span>`;
  const fallback = sourceFallback || (window.__lolCmsAssetFallbacks && window.__lolCmsAssetFallbacks[src]);
  const fallbackAttribute = fallback ? ` data-fallback="${esc(fallback)}"` : '';
  return `<span class="pic ${cls}"><img src="${esc(encodeURI(src))}"${fallbackAttribute} alt="" loading="lazy" onerror="if(this.dataset.fallback){const next=this.dataset.fallback;delete this.dataset.fallback;this.src=next}else{this.parentElement.classList.add('noimg');this.remove()}">${fb}</span>`;
}
const htm = s => String(s == null ? '' : s).replace(/\r?\n/g, '<br>');
/* 스토어 스크린샷이 출시일 뒤에도 낡아 보이지 않는 고정 출시일 표기 */
function launchDateStamp() {
  const parts = String(CLASSIC.launchDate || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isInteger(part))) return '7월 30일';
  return `${parts[0]}.${String(parts[1]).padStart(2, '0')}.${String(parts[2]).padStart(2, '0')}`;
}
function itemImageHtml(item, className = 'item218Icon') {
  const id = String(item?.riotId || '');
  const icon = item?.icon && item.icon === `images/mode_classic/items/${id}.png`
    ? item.icon : `images/official_item/${id}.png`;
  return /^\d+$/.test(id) ? `<img class="${esc(className)}" src="${icon}" alt="${esc(itemDisplayName(itemName(item)))}">` : '';
}
function itemTotalPrice(item) { return item.priceTotal ?? item.price; }
const HIDDEN_CLASSIC_ITEM_IDS = new Set(['3330', '3599', '3600']);
function itemVisibleInCurrentApp(item) {
  return !HIDDEN_CLASSIC_ITEM_IDS.has(String(item.riotId));
}
function classicItemsForCurrentApp() {
  return items.filter(itemVisibleInCurrentApp)
    .sort((a, b) => a.priceTotal - b.priceTotal || a.i - b.i);
}
function itemDisplayName(value) {
  return String(value || '').split(/<br\s*\/?\s*>/i)[0].replace(/<[^>]*>/g, '').trim();
}
function itemPriceText(item) {
  if (item.requiredBuffCurrencyName === 'GangplankBilgewaterToken' && item.requiredBuffCurrencyCost > 0)
    return `${item.requiredBuffCurrencyCost} ${appMessage('바다뱀 은화', 'シルバーサーペント', 'Silver Serpents')}`;
  return `${itemTotalPrice(item) ?? '-'} ${localized('골드')}`;
}
const UNRESOLVED_CLASSIC_ITEM_IDS = new Set([
  '3330', '772037', '772038', '772039',
  '773060', '773064', '773083', '773085', '773100', '773114', '773143',
  '773146', '773174', '773190', '773209', '773340', '773348',
]);
function itemDescriptionStatus(item) {
  if (!['16.19.1', '16.20.1'].includes(CLASSIC_ITEM_CATALOG?.version)) return '';
  if (/^GeneratedTip_[A-Za-z0-9_]+$/.test(String(item.text || ''))) return 'generated-tip';
  if (UNRESOLVED_CLASSIC_ITEM_IDS.has(String(item.riotId))) return 'unresolved-zero';
  return '';
}
function itemEffectText(item) {
  if (itemDescriptionStatus(item) === 'generated-tip') return '';
  return String(item.text || '').replace(/<[^>]*>/g, '').trim() ? item.text : (item.plaintext || '');
}
function localizedItemEffect(item, sourceEffect) {
  const official = appLocale.description('items', item);
  if (!official) return htm(sourceEffect);
  const plain = official.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  if (!plain) return htm(sourceEffect);
  return esc(plain).replace(/\r?\n/g, '<br>');
}
const SHOP_HEADER_LABELS = {
  START: '시작', TOOLS: '도구', DEFENSE: '방어', ATTACK: '공격',
  MAGIC: '마법', MOVEMENT: '이동', UNCATEGORIZED: '기타',
};
const SHOP_TAG_LABELS = {
  LANE: '라인 시작', JUNGLE: '정글 시작', GOLDPER: '추가 골드', CONSUMABLE: '소모품', VISION: '시야',
  HEALTH: '체력', SPELLBLOCK: '마법 저항력', ARMOR: '방어력', HEALTHREGEN: '체력 재생',
  ATTACKSPEED: '공격 속도', CRITICALSTRIKE: '치명타', DAMAGE: '공격력', LIFESTEAL: '생명력 흡수',
  MANA: '마나', SPELLDAMAGE: '주문력', COOLDOWNREDUCTION: '재사용 대기시간 감소', MANAREGEN: '마나 재생',
  BOOTS: '장화', NONBOOTSMOVEMENT: '이동 속도', ACTIVE: '사용 효과', ARMORPENETRATION: '방어구 관통력',
  STEALTH: '은신', SLOW: '둔화', ONHIT: '적중 시 효과', AURA: '오오라',
  MAGICPENETRATION: '마법 관통력', TRINKET: '장신구', SPELLVAMP: '주문 흡혈', TENACITY: '강인함',
  ABILITYHASTE: '스킬 가속', BILGEWATER: '빌지워터',
};
function classicItemCategories(catalog) {
  if (!['16.19.1', '16.20.1'].includes(catalog?.version) || !Array.isArray(catalog.items) || catalog.items.length !== 150
      || !Array.isArray(catalog.shopTree) || catalog.shopTree.length !== 7
      || Object.keys(catalog.iconSha256 || {}).length !== catalog.items.length) {
    throw new Error('26.19 Classic item catalog is incomplete');
  }
  const ids = new Set(catalog.items.map(item => String(item.riotId)));
  if (ids.size !== catalog.items.length || catalog.items.some((item, index) =>
    !Number.isInteger(item.i) || item.i < 0 || (index > 0 && item.i <= catalog.items[index - 1].i)
      || item.i >= 188 || !/^\d+$/.test(String(item.riotId)) || !item.ko || !item.en
      || item.icon !== `images/mode_classic/items/${item.riotId}.png`
      || !catalog.iconSha256[item.icon]
      || !Number.isFinite(item.price) || !Number.isFinite(item.priceTotal)
      || !Array.isArray(item.req) || !Array.isArray(item.bld)
      || !Array.isArray(item.tags) || !Array.isArray(item.cat)
      || typeof item.text !== 'string' || item.purchasable !== true)) {
    throw new Error('26.19 Classic item row is invalid');
  }
  const seen = new Set();
  const categories = catalog.shopTree.map(group => {
    const header = String(group.header || '').toUpperCase();
    if (!SHOP_HEADER_LABELS[header] || !Array.isArray(group.tags) || seen.has(header))
      throw new Error('26.19 Classic item category is invalid');
    seen.add(header);
    const kids = group.tags.map(tag => {
      const code = String(tag || '').toUpperCase();
      if (!SHOP_TAG_LABELS[code] || seen.has(code)) throw new Error('26.19 Classic item tag is invalid');
      seen.add(code);
      return { code, label: SHOP_TAG_LABELS[code] };
    });
    return { code: header, label: SHOP_HEADER_LABELS[header], kids };
  });
  return [{ code: null, label: '모든 아이템', kids: [] }, ...categories];
}
function itemMatchesCategory(item, category) {
  if (category == null) return true;
  const tags = new Set((item.tags || item.cat || []).map(tag => String(tag).toUpperCase()));
  const group = CATS.find(value => value.code === category);
  return group ? group.kids.some(kid => tags.has(kid.code)) : tags.has(String(category).toUpperCase());
}
function catLabel(code) {
  const key = String(code).toUpperCase();
  for (const c of CATS) {
    if (String(c.code).toUpperCase() === key) return localized(c.label);
    for (const k of (c.kids || [])) if (String(k.code).toUpperCase() === key) return localized(k.label);
  }
  return SHOP_TAG_LABELS[key] ? localized(SHOP_TAG_LABELS[key])
    : appMessage(`분류 ${esc(code)}`, `分類 ${esc(code)}`, `Category ${esc(code)}`);
}

async function boot() {
  try {
    const [meta, rawChampions, itemCatalog, crs, ms, sp, cl, classicMedia, appDocuments, runtimeManifest, rawCalculations, calculationManifest, detailMetadata, glossaryData, itemAliases, championReleaseDates, classicNews, patch2619News, baseRawChampions, baseRuntimeManifest, patchUpdates, previousRawChampions, previousRuntimeManifest, englishLabels, backgroundData, skillCompletion, localizedNews, localizedDocuments, effectData, recommendationData, frozenRawChampions, frozenRuntimeManifest, english2620, completion2620, news2620] = await Promise.all(
      ['meta', 'mode-classic-champions', 'classic-items-26.20', 'runes-classic', 'classic-masteries-26.19', 'spells', 'classic', 'classic-champion-media-26.20', 'app-documents', 'mode-classic-runtime', 'classic-damage-calculations', 'classic-damage-manifest', 'classic-detail-metadata', 'classic-glossary', 'classic-item-aliases', 'classic-champion-release-dates', 'classic-news', 'classic-news-2619', 'mode-classic-champions-16.17.1', 'mode-classic-runtime-16.17.1', 'classic-patch-updates', 'mode-classic-champions-16.18.1', 'mode-classic-runtime-16.18.1', 'classic-english-26.19', 'classic-backgrounds-26.20', 'classic-skill-completion-26.19', 'classic-news-localized-26195', 'app-documents-localized-26195', 'classic-skill-effects-26195', 'classic-recommendations-2620', 'mode-classic-champions-16.19.1', 'mode-classic-runtime-16.19.1', 'classic-english-26.20', 'classic-skill-completion-26.20', 'classic-news-2620']
        .map(n => fetch('data/' + n + '.json').then(r => { if (!r.ok) throw new Error(n + '.json HTTP ' + r.status); return ['mode-classic-champions', 'mode-classic-champions-16.17.1', 'mode-classic-champions-16.18.1', 'mode-classic-champions-16.19.1', 'classic-damage-calculations', 'classic-skill-completion-26.19', 'classic-skill-completion-26.20'].includes(n) ? r.arrayBuffer() : r.json(); })));
    META = { ...meta, appVersion: window.__LOLCLASSIC_CONFIG__?.appVersion || meta.appVersion };
    window.ClassicNews.setData(classicNews);
    window.ClassicNews.setLocalizedData(localizedNews);
    window.ClassicNews.setPatch2619(patch2619News);
    window.ClassicNews.setPatch2620(news2620);
    window.ClassicReferenceUI.setData(glossaryData);
    window.ClassicSkillEffects26195.setData(effectData);
    terms.splice(0, terms.length, ...glossaryData.entries.map(e => [e.termKo, e.description, e.termEn]));
    window.ClassicDocuments.setDocuments(appDocuments);
    window.ClassicDocuments.setLocalizedDocuments(localizedDocuments);
    window.ClassicChampionBackgrounds.setData(backgroundData);
    try {
      const response = await fetch('data/classic-backgrounds-localized-2620.json');
      if (!response.ok) throw new Error('classic-backgrounds-localized-2620.json HTTP ' + response.status);
      window.ClassicChampionBackgrounds.setLocalizedData(await response.json());
    } catch (error) {
      console.warn('Localized Classic backgrounds unavailable:', error);
    }
    const currentClassic = await window.ModeClassicChampions.createVerified(rawChampions, runtimeManifest);
    const baseClassic = await window.ModeClassicChampions.createVerified(baseRawChampions, baseRuntimeManifest);
    const previousClassic = await window.ModeClassicChampions.createVerified(previousRawChampions, previousRuntimeManifest);
    const frozenClassic = await window.ModeClassicChampions.createVerified(frozenRawChampions, frozenRuntimeManifest);
    await window.ClassicDamageView.createVerified(rawCalculations, calculationManifest, baseClassic);
    window.ClassicDetailExtras.attach(detailMetadata, baseClassic);
    window.ClassicPatchUpdates.apply(baseClassic, previousClassic, patchUpdates, {
      baseCombinedSha256: baseRuntimeManifest.combinedSha256,
      targetCombinedSha256: previousRuntimeManifest.combinedSha256,
    });
    window.ClassicPatch2619.apply(previousClassic, frozenClassic, previousRuntimeManifest, frozenRuntimeManifest, englishLabels);
    await window.ClassicSkillCompletion26192.createVerified(skillCompletion, frozenClassic, frozenRuntimeManifest, window.ClassicDamageView);
    window.ClassicPatch2620.apply(frozenClassic, currentClassic, frozenRuntimeManifest, runtimeManifest, english2620);
    await window.ClassicSkillCompletion2620.createVerified(completion2620, currentClassic, runtimeManifest, window.ClassicDamageView);
    const statsResponse = await fetch('data/classic-champion-stats-2620.json');
    if (!statsResponse.ok) throw new Error('classic-champion-stats-2620.json HTTP ' + statsResponse.status);
    await window.ClassicPatch2620.createVerifiedStats(await statsResponse.arrayBuffer(), currentClassic, runtimeManifest);
    window.ClassicCorrections.configure(runtimeManifest, currentClassic.champions);
    champions = currentClassic.champions;
    CATS = classicItemCategories(itemCatalog);
    CLASSIC_ITEM_CATALOG = itemCatalog;
    items = itemCatalog.items.map(item => ({ ...item, cmsStableId: `item-2619-${item.riotId}` }));
    window.ClassicReferenceUI.setCatalogMetadata(itemAliases, championReleaseDates, items, champions, itemCatalog);
    classicRunes = crs.map(r => ({
      ...r,
      i: r.id,
      ko: r.title,
      text: r.tooltip,
      price: null,
    }));
    runes = classicRunes;
    assertClassicMasteries2619(ms);
    MST = ms; spells = sp;
    window.ClassicRecommendationsUI.setData(recommendationData, { items, runes: classicRunes, masteries: MST, spells });
    CLASSIC = { ...cl, ids: runtimeManifest.navigationOrder, champCount: champions.length,
      source: 'Riot Data Dragon League Classic ' + runtimeManifest.version,
      sourceUrls: [{ label: 'League Classic', url: runtimeManifest.sourceIndexUrl }],
      portraitUnavailable: [], portraitFallbacks: {}, notes: [] };
    classicSet = new Set(CLASSIC.ids);
    CLASSIC_CHAMPION_MEDIA = window.ClassicChampionMedia.create(classicMedia);
    const classicChampions = champions.filter(c => classicSet.has(c.id));
    if (classicChampions.length !== CLASSIC_CHAMPION_MEDIA.championIds().length
        || classicChampions.some(c => !CLASSIC_CHAMPION_MEDIA.has(c.riotId))) {
      throw new Error('Classic champion media exact-ID roster mismatch');
    }
    CLASSIC_SKILLS = currentClassic.skills;
    classicSkillById = new Map(CLASSIC_SKILLS.champions.map(c => [c.appId, c]));
    if (window.ClassicLocale) {
      const response = await fetch('data/classic-localized-26.20.json');
      if (!response.ok) throw new Error('classic-localized-26.20.json HTTP ' + response.status);
      window.ClassicLocale.setData(await response.json());
    }
    if (window.ClassicSkillLocale26195) {
      const response = await fetch('data/classic-skill-localized-2620.json');
      if (!response.ok) throw new Error('classic-skill-localized-2620.json HTTP ' + response.status);
      const bytes = await response.arrayBuffer();
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
      window.ClassicSkillLocale26195.setData(JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)), sha256);
      const extraResponse = await fetch('data/classic-skill-localized-extra-2620.json');
      if (!extraResponse.ok) throw new Error('classic-skill-localized-extra-2620.json HTTP ' + extraResponse.status);
      window.ClassicSkillLocale26195.setSupplementData(await extraResponse.json());
    }
    items.forEach(x => { itemByEn[x.en] = x; itemByI[x.i] = x; itemByI[x.riotId] = x; itemByI[x.cmsStableId] = x; });
    MST.branches.forEach(b => b.nodes.forEach(nd => { mstById[nd.id] = { ...nd, branch: b.key }; }));
    booted = true;
  } catch (e) {
    $('#view').innerHTML = `<section class="box"><h2 class="bar">데이터 로딩 실패</h2><div class="post">data/*.json 을 읽지 못했습니다.\n\n${esc(e.message || String(e))}</div></section>`;
    return;
  }
  render();
  appLocale.observe();
}

/* 용어 사전 (로컬 유지) */
const terms = [];

const news = { '새소식': [] };

/* 시드 게시글 — 홈 커뮤니티 탭의 5개 글이 각각 이 글들로 연결된다 (V7은 전부 post/1로 갔음) */
const SEED_POSTS = [
  { id: 1, notice: true, title: '자유게시판 이용 안내', author: '운영자', body: '롤 백과사전 클래식 자유게시판입니다.\n\n이 게시판은 이 기기 안에만 저장됩니다. 다른 사람에게는 보이지 않고, 앱 데이터를 지우면 사라집니다.', ts: 1752600000000, views: 8, likes: 3, comments: [] },
  { id: 2, notice: false, title: '기억나는 클래식 아이템', author: '소환사', body: '워모그 끼고 안 죽던 시절이 기억납니다.', ts: 1752610000000, views: 5, likes: 1, comments: [] },
  { id: 3, notice: false, title: '가장 좋아했던 챔피언', author: '탑라이너', body: '클래식 가렌은 진짜 단순해서 좋았어요.', ts: 1752620000000, views: 12, likes: 4, comments: [] },
  { id: 4, notice: false, title: '룬 조합 공유', author: '미드라이너', body: '공격력 표식과 방어력 인장을 사용하고 있습니다.', ts: 1752630000000, views: 3, likes: 0, comments: [] },
  { id: 5, notice: false, title: '클래식 추억 공유', author: '복귀유저', body: '특성 21/9/0 찍던 감각이 아직도 남아있네요.', ts: 1752640000000, views: 7, likes: 2, comments: [] },
];
const SEED_POST_MAX_ID = Math.max(...SEED_POSTS.map(post => post.id));

const PER_PAGE = 10;

/* ---------- 상태 ---------- */
let S = { view: location.hash.slice(1) || 'home', tab: '새소식', guide: 0, cat: null, page: 1, iq: '', rq: '', rslot: 'mark', onlyClassic: true };
const routeHistory = [S.view];
const itemDetailHistory = [];
const $ = x => document.querySelector(x);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const userText = s => esc(s == null ? '' : s).replace(/\r?\n/g, '<br>');
const editorialText = s => esc(s == null ? '' : s)
  .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
  .replace(/\r?\n/g, '<br>');
const champ = id => champions.find(c => c.id === id) || champions[0];
function sortChampionsForDisplay(list, sort = 'ko') {
  if (sort === 'rel' || appLocale.getLocale() === 'ko_KR') return window.ClassicReferenceUI.sortChampions(list, sort);
  const collator = new Intl.Collator(appLocale.getLocale() === 'ja_JP' ? 'ja' : 'en');
  return [...list].sort((a, b) => collator.compare(championName(a), championName(b)) || String(a.id).localeCompare(String(b.id)));
}
function classicChampions() {
  return [...(CLASSIC.ids || []).map(id => champions.find(c => c.id === id)).filter(Boolean),
    ...champions.filter(c => window.OperatorChampionOverlay?.isChampion(c))];
}
function championPortrait(c) { return c?.img || null; }
function championListImage(c) { return window.OperatorChampionOverlay?.isChampion(c) ? c.icon : championPortrait(c); }
const CLASSIC_SKILL_SLOTS = ['P', 'Q', 'W', 'E', 'R'];
function classicSkillsFor(c) {
  if (!c || !classicSet.has(c.id)) return null;
  const record = classicSkillById.get(c.id);
  if (!record || record.championInternal !== c.riotId) return null;
  const bySlot = new Map(record.skills.map(skill => [skill.slot, skill]));
  const skills = CLASSIC_SKILL_SLOTS.map(slot => bySlot.get(slot));
  if (!skills.every(skill => skill && skill.sourceUrl === c.sourceUrl)) return null;
  const edits = window.__lolClassicCorrections?.[c.riotId]?.skills;
  return skills.map(skill => edits?.[skill.slot]
    ? {...skill, nameKo: edits[skill.slot].nameKo || skill.nameKo, operatorCorrection: edits[skill.slot]} : skill);
}
function classicSafeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
/* =============================================================
   Classic skill tooltip normalization

   AD              -> (+1.0 AD) 전체 빨강
   추가 AD         -> (+1.0 추가 AD) 전체 빨강
   AP              -> (+1.0 AP) 전체 파랑
   추가 AP         -> (+1.0 추가 AP) 전체 파랑
   방어력           -> (+0.3 방어력) 전체 노랑
   마법 저항력      -> (+0.3 마저) 전체 청록
   체력             -> (+0.1 추가 체력) 전체 연두

   쿨타임:         라벨 기본색 / 숫자만 노랑
   마나 소모량:    라벨 기본색 / 숫자만 파랑
   기력 소모량:    라벨 기본색 / 숫자만 노랑
   분노 소모량:    라벨 기본색 / 숫자만 주황

   TYPE_*, STAT_*, XML scale tags, Markdown 흔적 제거
   ============================================================= */

const ENERGY_CHAMPION_IDS = new Set([
  'leesin',
  'akali',
  'kennen',
  'shen',
]);

const FURY_CHAMPION_IDS = new Set([
  'tryndamere',
  'renekton',
  'shyvana',
]);

const LEGACY_DMG_AS_AD_SKILLS = new Set([
  'akali:E',
]);

function cleanSkillGarbage(value) {
  let out = String(value == null ? '' : value);

  // Markdown 흔적
  out = out.replace(/\*+/g, '');

  // HTML entity 형태의 내부 태그
  out = out.replace(
    /&lt;\/?[A-Za-z][A-Za-z0-9_-]*(?:\s[^&]*?)?&gt;/gi,
    ''
  );

  // 실제 내부 태그. <br>만 유지.
  out = out.replace(
    /<(?!br\s*\/?>)[^>]+>/gi,
    ''
  );

  // 내부 데이터 토큰
  out = out.replace(
    /\b(?:TYPE|STAT|FUNC|FUNCTION|VALUE|PARAM|CALC|FORMULA|DATA)_[A-Za-z0-9_]+\b/g,
    ''
  );

  // {{...}}, @TOKEN@ 등의 내부 placeholder
  out = out.replace(/\{\{[\s\S]*?\}\}/g, '');
  out = out.replace(/@[A-Za-z0-9_.:-]+@/g, '');

  // 보기 싫은 코드형 괄호 표현을 자연스럽게 평탄화
  out = out.replace(
    /\(\s*챔피언\s*레벨당\s*([^()]+?)\s*\)/g,
    '챔피언 레벨당 $1'
  );

  // legacy 스킬 설명 끝에 붙어 있는 쿨다운/자원 메타 제거
  out = out.replace(
    /(?:쿨다운|쿨타임)\s*:?\s*[0-9.]+(?:\s*\/\s*[0-9.]+)*/gi,
    ''
  );

  out = out.replace(
    /(?:초당\s*)?(?:마나\s*소모량?|마나소모량?|마나\s*소모|마나소모|소비마나|마나소비)(?:\s*\(\s*매\s*공격당\s*\))?\s*:?\s*[0-9.]+(?:\s*\/\s*[0-9.]+)*/gi,
    ''
  );

  out = out.replace(
    /마나\s*:\s*[0-9.]+(?:\s*\/\s*[0-9.]+)*/gi,
    ''
  );

  out = out.replace(
    /(?:기력\s*소모량?|기력소모량?|기력\s*소모|기력소모)\s*:?\s*[0-9.]+(?:\s*\/\s*[0-9.]+)*/gi,
    ''
  );

  out = out.replace(
    /(?:분노\s*소모량?|분노소모량?|분노\s*소모|분노소모)\s*:?\s*[0-9.]+(?:\s*\/\s*[0-9.]+)*/gi,
    ''
  );

  out = out.replace(
    /그림자의?\s*정수\s*소모량?\s*:?\s*[0-9.]+(?:\s*\/\s*[0-9.]+)*/gi,
    ''
  );

  out = out.replace(
    /체력\s*소모량?(?:\s*\([^)]*\))?\s*:?\s*(?:(?:현재\s*피(?:의)?|현재(?:의)?\s*체력(?:의)?)\s*[0-9.]+%|[0-9.]+(?:\s*\/\s*[0-9.]+)*(?:%)?)/gi,
    ''
  );

  out = out.replace(/\(\s*\)/g, '');
  out = out.replace(/\[\s*\]/g, '');
  out = out.replace(/\{\s*\}/g, '');

  out = out.replace(/<br>\s*<br>/gi, '<br>');
  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s+([,.:;!?])/g, '$1');

  return out.trim();
}

function skillPercentToRatioText(raw) {
  return String(raw == null ? '' : raw)
    .replace(/%/g, '')
    .split('/')
    .map(part => {
      const number = Number(String(part).trim());

      if (!Number.isFinite(number)) {
        return String(part).trim();
      }

      let ratio = (number / 100)
        .toFixed(4)
        .replace(/0+$/, '')
        .replace(/\.$/, '');

      if (!ratio.includes('.')) {
        ratio += '.0';
      }

      return ratio;
    })
    .join(' / ');
}

const SKILL_SCALE_TYPES = Object.freeze({
  AD: { cssClass: 'skillScaleAd', label: 'AD' },
  AP: { cssClass: 'skillScaleAp', label: 'AP' },
  ARMOR: { cssClass: 'skillScaleArmor', label: '방어력' },
  MR: { cssClass: 'skillScaleMr', label: '마저' },
  HEALTH: { cssClass: 'skillScaleHealth', label: '체력' },
});

function normalizeSkillScaleType(value) {
  const compact = String(value || '').replace(/\s+/g, '').toUpperCase();
  if (compact === 'AD') return 'AD';
  if (compact === 'AP') return 'AP';
  if (compact === 'ARMOR' || compact === '방어력') return 'ARMOR';
  if (compact === 'MR' || compact === '마저' || compact === '마법저항력') return 'MR';
  if (compact === 'HEALTH' || compact === 'HP' || compact === '체력') return 'HEALTH';
  return '';
}

function normalizeSkillScaleQualifier(value) {
  const allowed = new Set(['추가', '대상', '자신의', '최대', '현재', '잃은']);
  const tokens = String(value || '').trim().split(/\s+/).filter(token => allowed.has(token));
  return [...new Set(tokens)].join(' ');
}

function buildSkillScaleTag(type, rawValue, qualifier = '', sourceIsPercent = true) {
  const normalizedType = normalizeSkillScaleType(type);
  const descriptor = SKILL_SCALE_TYPES[normalizedType];
  if (!descriptor) return '';
  const ratio = sourceIsPercent
    ? skillPercentToRatioText(rawValue)
    : String(rawValue == null ? '' : rawValue).replace(/\s*\/\s*/g, ' / ').trim();
  const normalizedQualifier = normalizeSkillScaleQualifier(qualifier);
  const label = normalizedQualifier
    ? `${normalizedQualifier} ${descriptor.label}`
    : descriptor.label;
  return `<span class="${descriptor.cssClass}">(+${ratio} ${label})</span>`;
}

function formatSkillText(html, options = {}) {
  let out = cleanSkillGarbage(html);
  out = window.ClassicDamageView.formatNumericText(out);
  const scalingTags = [];

  const stashScalingTag = (type, value, qualifier = '', sourceIsPercent = true) => {
    const index = scalingTags.length;
    scalingTags.push(buildSkillScaleTag(type, value, qualifier, sourceIsPercent));
    return `\uE000${index}\uE001`;
  };

  const stashSpecialScalingTag = (type, label) => {
    const descriptor = SKILL_SCALE_TYPES[normalizeSkillScaleType(type)];
    if (!descriptor) return '';
    const index = scalingTags.length;
    scalingTags.push(`<span class="${descriptor.cssClass}">${label}</span>`);
    return `\uE000${index}\uE001`;
  };

  // Multiplicative historical formulas cannot be flattened truthfully into a
  // normal additive ratio. Preserve their unit and color only the parenthesized
  // stat-dependent term.
  out = out.replace(
    /\(\+\s*AP\s*100당\s*(\d+(?:\.\d+)?%)\s*\)/gi,
    (_, value) => stashSpecialScalingTag('AP', `(+AP 100당 ${value})`)
  );
  out = out.replace(
    /\(\+\s*추가\s*AD\s*(\d+(?:\.\d+)?)당\s*대상\s*최대\s*체력\s*(\d+(?:\.\d+)?%)\s*\)/gi,
    (_, ad, health) => stashSpecialScalingTag('AD', `(+추가 AD ${ad}당 대상 최대 체력 ${health})`)
  );

  // 공식 변환 데이터와 기존 괄호 계수를 모두 하나의 표기로 정규화한다.
  out = out.replace(
    /\(+\s*\+\s*(추가\s*)?(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*)\s*((?:(?:추가|대상|자신의|최대|현재|잃은)\s*)*)(AD|AP|방어력|마저|마법\s*저항력|체력)\s*\)+/gi,
    (_, legacyBonus, ratio, qualifier, type) => stashScalingTag(
      type,
      ratio,
      `${legacyBonus || ''} ${qualifier || ''}`,
      false
    )
  );

  // 대상의 주문력은 시전자 AP와 구분해서 같은 파란 계수 안에 대상을 명시한다.
  out = out.replace(
    /대상(?:의)?\s*주문력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('AP', value, '대상')
  );

  // AD / 추가 AD
  out = out.replace(
    /\+?\s*추가\s*공격력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('AD', value, '추가')
  );
  out = out.replace(
    /\+?\s*총\s*공격력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('AD', value)
  );
  out = out.replace(
    /\+\s*공격력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('AD', value)
  );

  // AP / 추가 AP
  out = out.replace(
    /\+?\s*추가\s*주문력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('AP', value, '추가')
  );
  out = out.replace(
    /\+?\s*주문력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('AP', value)
  );

  // 방어력과 마법 저항력을 동시에 참조하는 비율은 각 색상을 따로 적용한다.
  out = out.replace(
    /방어력과\s*마법\s*저항력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => `${stashScalingTag('ARMOR', value)} / ${stashScalingTag('MR', value)}`
  );
  out = out.replace(
    /추가\s*방어력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('ARMOR', value, '추가')
  );
  out = out.replace(
    /방어력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('ARMOR', value)
  );
  out = out.replace(
    /추가\s*(?:마법\s*저항력|마저)의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('MR', value, '추가')
  );
  out = out.replace(
    /(?:마법\s*저항력|마저)의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('MR', value)
  );

  // 체력 계수는 명시된 대상/현재/최대/잃은/추가 조건을 괄호 안에 보존한다.
  out = out.replace(
    /(?:대상|적)(?:\s*챔피언)?(?:의|이\s*보유한)?\s*현재\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '대상 현재')
  );
  out = out.replace(
    /(?:대상|적)(?:\s*챔피언)?(?:의|이\s*보유한)?\s*최대\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '대상 최대')
  );
  out = out.replace(
    /(?:대상(?:이)?|적(?:이)?)\s*잃은\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '대상 잃은')
  );
  out = out.replace(
    /자신의\s*추가\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '추가')
  );
  out = out.replace(
    /추가\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '추가')
  );
  out = out.replace(
    /자신의\s*최대\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '자신의 최대')
  );
  out = out.replace(
    /최대\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '최대')
  );
  out = out.replace(
    /현재\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '현재')
  );
  out = out.replace(
    /잃은\s*체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value, '잃은')
  );
  out = out.replace(
    /(?:총\s*)?체력의?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*%)/g,
    (_, value) => stashScalingTag('HEALTH', value)
  );

  // legacy 영문형
  out = out.replace(
    /\+\s*(\d+(?:\.\d+)?)\s*bonus\s+AD\b/gi,
    (_, ratio) => stashScalingTag('AD', ratio, '추가', false)
  );
  out = out.replace(
    /\+\s*(\d+(?:\.\d+)?)\s*bonus\s+AP\b/gi,
    (_, ratio) => stashScalingTag('AP', ratio, '추가', false)
  );

  if (options.legacyDmgAsAd === true) {
    out = out.replace(
      /\+\s*(\d+(?:\.\d+)?)\s*추가\s*DMG\b/gi,
      (_, ratio) => stashScalingTag('AD', ratio, '추가', false)
    );
    out = out.replace(
      /\+\s*(\d+(?:\.\d+)?)\s*DMG\b/gi,
      (_, ratio) => stashScalingTag('AD', ratio, '', false)
    );
  }

  out = out.replace(
    /\+\s*(\d+(?:\.\d+)?)\s*AD\b/gi,
    (_, ratio) => stashScalingTag('AD', ratio, '', false)
  );
  out = out.replace(
    /\+\s*(\d+(?:\.\d+)?)\s*AP\b/gi,
    (_, ratio) => stashScalingTag('AP', ratio, '', false)
  );

  for (let i = 0; i < 3; i += 1) {
    out = out.replace(/\(\s*(\uE000\d+\uE001)\s*\)/g, '$1');
  }
  out = out.replace(
    /\uE000(\d+)\uE001/g,
    (_, index) => scalingTags[Number(index)] || ''
  );
  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s+([,.:;!?])/g, '$1');
  return out.trim();
}

function normalizeMetaSeries(value) {
  if (value == null) return '';

  if (Array.isArray(value)) {
    return value
      .map(entry => normalizeMetaSeries(entry))
      .filter(Boolean)
      .join(' / ');
  }

  if (typeof value === 'object') {
    for (const key of [
      'displayKo',
      'display',
      'valueKo',
      'value',
      'textKo',
      'text',
      'costKo',
      'cost',
      'cooldownKo',
      'cooldown',
      'cooldownBurn',
      'burn',
      'amount',
      'values',
      'ko'
    ]) {
      if (value[key] != null) {
        return normalizeMetaSeries(value[key]);
      }
    }

    return '';
  }

  return String(value)
    .replace(/\*+/g, '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeCooldownSeries(value) {
  const normalized = normalizeMetaSeries(value)
    .replace(/^(?:쿨다운|쿨타임|cooldown|cd)\s*:?\s*/i, '')
    .replace(/\s*초\b/g, '')
    .trim();

  const compact = normalized
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, '');

  return !normalized || /^0+(?:\/0+)*$/.test(compact)
    ? ''
    : normalized;
}

function extractLegacySeries(text, regex) {
  const source = String(text == null ? '' : text);
  const match = source.match(regex);

  if (!match || !match[1]) {
    return '';
  }

  return String(match[1])
    .replace(/\s*\/\s*/g, ' / ')
    .trim();
}

function explicitResourceType(value) {
  const typeValue = value && typeof value === 'object'
    ? value.resourceType || value.type || value.kind || value.nameKo || value.name
    : value;
  const text = String(typeValue == null ? '' : typeValue).toLowerCase();

  if (/기력|energy/.test(text)) return 'energy';
  if (/분노|rage|fury/.test(text)) return 'fury';
  if (/마나|mana/.test(text)) return 'mana';
  if (/그림자\s*정수|shadow\s*essence/.test(text)) return 'special';
  return '';
}

function historicalResourceMetadata(text) {
  const source = String(text == null ? '' : text);
  const patterns = [
    {
      regex: /마나\s*:\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'mana',
    },
    {
      regex: /(?:마나\s*소모(?:량)?\s*\(\s*초당\s*\)|초당\s*마나\s*소모(?:량)?)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'mana',
      qualifier: '초당',
    },
    {
      regex: /마나\s*소모(?:량)?\s*\(\s*매\s*공격당\s*\)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'mana',
      qualifier: '매 공격당',
    },
    {
      regex: /체력\s*소모(?:량)?\s*\(\s*초\s*\)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'special',
      label: '체력 소모량',
      qualifier: '초당',
    },
    {
      regex: /체력\s*소모(?:량)?\s*:?\s*(?:현재\s*피(?:의)?|현재(?:의)?\s*체력(?:의)?)\s*([0-9.]+)%/i,
      type: 'special',
      label: '체력 소모량',
      valuePrefix: '현재 체력의 ',
      valueSuffix: '%',
      dynamic: true,
    },
    {
      regex: /체력\s*소모(?:량)?\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*(?:%)?)/i,
      type: 'special',
      label: '체력 소모량',
    },
    {
      regex: /(?:기력\s*소모량?|기력소모량?|기력\s*소모|기력소모)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'energy',
    },
    {
      regex: /(?:분노\s*소모량?|분노소모량?|분노\s*소모|분노소모)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'fury',
    },
    {
      regex: /(?:마나\s*소모량?|마나소모량?|마나\s*소모|마나소모|소비마나|마나소비)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i,
      type: 'mana',
    },
  ];

  for (const pattern of patterns) {
    const value = extractLegacySeries(source, pattern.regex);
    if (!value) continue;
    const compact = value.replace(/\s*\/\s*/g, '/').replace(/\s+/g, '');
    if (/^0+(?:\.0+)?(?:\/0+(?:\.0+)?)*$/.test(compact)) continue;
    return {
      type: pattern.type,
      label: pattern.label || '',
      qualifier: pattern.qualifier || '',
      value: `${pattern.valuePrefix || ''}${value}${pattern.valueSuffix || ''}`,
      dynamic: pattern.dynamic === true,
    };
  }

  return null;
}

function championResourceType(champion, skill) {
  const id = String(
    (champion && (champion.id || champion.appId)) ||
    (skill && skill.appId) ||
    ''
  ).toLowerCase();

  if (ENERGY_CHAMPION_IDS.has(id)) {
    return 'energy';
  }

  if (FURY_CHAMPION_IDS.has(id)) {
    return 'fury';
  }

  return 'mana';
}

function detectSkillCooldown(skill) {
  const direct = [
    skill && skill.cooldownKo,
    skill && skill.cooldown,
    skill && skill.cooldownBurn,
    skill && skill.cdKo,
    skill && skill.cd,
    skill && skill.recharge,
  ];

  for (const candidate of direct) {
    const value = normalizeCooldownSeries(candidate);
    if (value) return value;
  }

  // Kennen / Shen / Akali 같은 legacy 설명 내부 메타
  return extractLegacySeries(
    skill && skill.desc,
    /(?:쿨다운|쿨타임)\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i
  );
}

function detectSkillResource(skill, champion) {
  const legacyShadowEssence = extractLegacySeries(
    skill && skill.desc,
    /그림자의?\s*정수\s*소모량?\s*:?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)*)/i
  );

  if (legacyShadowEssence) {
    return {
      type: 'special',
      label: '그림자 정수 소모량',
      value: legacyShadowEssence,
    };
  }

  const historicalResource = historicalResourceMetadata(
    skill && (skill.legacyDesc || skill.desc)
  );

  if (historicalResource) return historicalResource;

  const candidates = [
    { value: skill && skill.resource, type: skill && (skill.resourceType || skill.resourceKind) },
    { value: skill && skill.resourceKo, type: skill && (skill.resourceType || skill.resourceKind) },
    { value: skill && skill.cost, type: skill && (skill.resourceType || skill.resourceKind) },
    { value: skill && skill.costKo, type: skill && (skill.resourceType || skill.resourceKind) },
    { value: skill && skill.resourceCost, type: skill && (skill.resourceType || skill.resourceKind) },
    { value: skill && skill.mana, type: 'mana' },
    { value: skill && skill.energy, type: 'energy' },
    { value: skill && skill.rage, type: 'fury' },
    { value: skill && skill.fury, type: 'fury' },
  ];

  for (const candidate of candidates) {
    let value = normalizeMetaSeries(candidate.value);

    if (!value) continue;

    value = value
      .replace(
        /^(?:마나|mana|기력|energy|분노|rage|fury)\s*(?:소모량|소모|cost)?\s*:?\s*/i,
        ''
      )
      .trim();

    if (!value) continue;

    const compact =
      value
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s+/g, '');

    if (/^0+(?:\/0+)*$/.test(compact)) {
      continue;
    }

    const type = explicitResourceType(candidate.type) ||
        explicitResourceType(candidate.value) ||
        (historicalResource && historicalResource.type) ||
        championResourceType(champion, skill);

    return {
      type,
      label: historicalResource && historicalResource.type === type
        ? historicalResource.label
        : '',
      value,
      qualifier: historicalResource && historicalResource.type === type
        ? historicalResource.qualifier
        : '',
    };
  }

  const semanticText = [
    skill && skill.summaryKo,
    skill && skill.detailKo,
    skill && skill.desc,
  ].filter(Boolean).join(' ');

  if (/분노를\s*소모하여|소모한\s*분노/.test(semanticText)) {
    return {
      type: 'fury',
      value: '현재 보유량',
      dynamic: true,
    };
  }

  return null;
}

function renderSkillMeta(skill, champion) {
  const cooldown =
    detectSkillCooldown(skill);

  const resource =
    detectSkillResource(skill, champion);

  const rows = [];

  /*
   * 쿨타임:
   * 라벨은 기본색.
   * 숫자만 노랑.
   */
  rows.push(
    cooldown
      ? `<span class="skillMetaLine"><span class="skillMetaLabel">쿨타임:</span> <span class="skillCooldownValue">${esc(cooldown)}</span></span>`
      : `<span class="skillMetaLine"><span class="skillMetaLabel">쿨타임:</span> <span class="skillMetaPlainValue">없음</span></span>`
  );

  if (!resource) {
    rows.push(
      `<span class="skillMetaLine"><span class="skillMetaLabel">소모량 없음</span></span>`
    );
  } else {
    let label = '마나 소모량';
    let valueClass = 'skillManaValue';

    if (resource.type === 'energy') {
      label = '기력 소모량';
      valueClass = 'skillEnergyValue';
    } else if (resource.type === 'fury') {
      label = '분노 소모량';
      valueClass = resource.dynamic ? 'skillMetaPlainValue' : 'skillFuryValue';
    } else if (resource.type === 'special') {
      label = resource.label || '특수 자원 소모량';
      valueClass = 'skillMetaPlainValue';
    }

    const qualifier = resource.qualifier
      ? `<span class="skillMetaQualifier">${esc(resource.qualifier)}</span> `
      : '';
    rows.push(
      `<span class="skillMetaLine"><span class="skillMetaLabel">${label}:</span> ${qualifier}<span class="${valueClass}">${esc(resource.value)}</span></span>`
    );
  }

  return `<div class="classicSkillMeta">${rows.join('')}</div>`;
}

function classicHtmlText(value) {
  return formatSkillText(
    esc(classicSafeText(value))
      .replace(/\r?\n/g, '<br>')
  );
}
function classicSkillMeta(skill) {
  if (!skill.sourceUrl?.includes('/mode/classic/')) throw new Error('Non-Classic skill metadata rejected');
  return skillMetaMarkup(skill);
}
function skillMetaMarkup(skill, champion) {
  if (skill.slot === 'P') return '';
  const series = value => Array.isArray(value) && value.length && value.every(n => typeof n === 'number' && Number.isFinite(n))
    ? (new Set(value).size === 1 ? String(value[0]) : value.join('/')) : null;
  const cooldown = series(skill.cooldown);
  const cost = series(skill.cost);
  const boundResource = skill.damageDetails?.resource;
  const cougarForms = (skill.damageDetails?.forms || []).filter(form => /^Jade_Nidalee(?:Pounce|Swipe|Takedown)$/.test(form.spellId));
  const formPrefix = cougarForms.length ? appMessage('인간 형태 · ', 'ヒト形態 · ', 'Human form · ') : '';
  const sourceType = /마나|기력|분노|체력|mana|energy|fury|health/i.test(skill.resourceType) ? skill.resourceType : skill.partype;
  const resourceType = boundResource?.type || (/기력|energy/i.test(sourceType) ? 'energy'
    : /분노|fury|rage/i.test(sourceType) ? 'fury'
    : /체력|health/i.test(sourceType) ? 'health' : /마나|mana/i.test(sourceType) ? 'mana' : 'other');
  const label = { energy: '기력 소모량', fury: '분노 소모량', health: '체력 소모량', mana: '마나 소모량', other: '소모량' }[resourceType];
  const valueClass = { energy: 'skillEnergyValue', fury: 'skillFuryValue', health: 'skillHealthCost', mana: 'skillManaValue', other: 'skillMetaPlainValue' }[resourceType];
  const rows = [`<span class="skillMetaLine"><span class="skillMetaLabel">${formPrefix}${localized('쿨타임')}:</span> <span class="${cooldown === null || cooldown === '0' ? 'skillMetaPlainValue' : 'skillCooldownValue'}">${cooldown === null ? localized('수치 미제공') : cooldown === '0' ? localized('없음') : esc(cooldown) + localized('초')}</span></span>`];
  const noCost = boundResource?.type === 'none' || skill.resourceType === 'none' || (!boundResource && /없음|no cost/i.test(skill.resourceText) && skill.cost.length && skill.cost.every(n => n === 0));
  const costHtml = boundResource?.tooltip ? globalThis.ClassicDamageView.tooltip(boundResource.tooltip.replace(/^(?:마나|기력)\s+/, ''), skill.damageDetails, appLocale.getLocale()) : (cost === null ? localized('수치 미제공') : esc(cost));
  rows.push(noCost ? `<span class="skillMetaLine"><span class="skillMetaLabel">${formPrefix}${localized('소모량 없음')}</span></span>`
    : `<span class="skillMetaLine"><span class="skillMetaLabel ${resourceType === 'health' || resourceType === 'energy' ? valueClass : ''}">${formPrefix}${localized(label)}:</span> <span class="${valueClass}">${costHtml}</span></span>`);
  for (const form of [...(skill.damageDetails?.forms || []), ...(skill.damageDetails?.recastResources || [])]) {
    const resource = form.resource;
    if (!resource) continue;
    const prefix = cougarForms.includes(form)
      ? appMessage('쿠거 형태', 'クーガー形態', 'Cougar form')
      : appLocale.getLocale() === 'ko_KR' ? (form.name || '재사용')
        : (champion && appLocale.skill(champion.riotId, skill.slot)?.name || appMessage('재사용', '再発動', 'Recast'));
    const formCostClass = {energy:'skillEnergyValue',health:'skillHealthCost',mana:'skillManaValue',fury:'skillFuryValue'}[resource.type] || 'skillMetaPlainValue';
    const formCost = resource.type === 'none' ? localized('소모량 없음') : globalThis.ClassicDamageView.tooltip(resource.tooltip, form, appLocale.getLocale());
    rows.push(`<span class="skillMetaLine"><span class="skillMetaLabel">${esc(prefix)}:</span> <span class="${formCostClass}">${formCost}</span></span>`);
    const formCooldown = series(form.cooldownByRank);
    if (cougarForms.includes(form) && formCooldown !== null) rows.push(`<span class="skillMetaLine"><span class="skillMetaLabel">${appMessage('쿠거 형태', 'クーガー形態', 'Cougar form')} · ${localized('쿨타임')}:</span> <span class="skillCooldownValue">${esc(formCooldown)}${localized('초')}</span></span>`);
  }
  return `<div class="classicSkillMeta">${rows.join('')}</div>`;
}
function classicSkillBodyKorean(skill, champion) {
  if (!skill.sourceUrl?.includes('/mode/classic/')) throw new Error('Non-Classic skill rejected');
  if (skill.operatorCorrection?.description) return `<p class="classicSkillSummary">${skillDescriptionText(skill.operatorCorrection.description)}</p>` + classicSkillMeta(skill);
  if (skill.damageDetails || skill.displayDetails) return globalThis.ClassicDamageView.description(skill.damageDetails || skill.displayDetails) + classicSkillMeta(skill);
  const summary = classicHtmlText(skill.summaryKo);
  const detail = classicHtmlText(skill.detailKo);

  const sameText =
    Boolean(summary) &&
    Boolean(detail) &&
    summary === detail;

  const blocks = [];

  if (summary) {
    blocks.push(`<p class="classicSkillSummary">${summary}</p>`);
  }

  if (detail && !sameText) {
    blocks.push(`<p class="classicSkillDetail">${detail}</p>`);
  }

  blocks.push(classicSkillMeta(skill, champion));

  return blocks.join('');
}
function classicSkillBody(skill, champion) {
  const locale = appLocale.getLocale();
  const official = locale === 'ko_KR' ? null : appLocale.skill(champion.riotId, skill.slot);
  if (!official?.description) return classicSkillBodyKorean(skill, champion);
  const prose = official.description.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
  const client = skill.damageDetails && globalThis.ClassicSkillLocale26195?.render(
    locale, champion.riotId, skill.slot, skill.damageDetails, globalThis.ClassicDamageView);
  const display = skill.displayDetails && globalThis.ClassicSkillDisplayLocale26195?.render(
    locale, champion.riotId, skill.slot, skill.displayDetails, globalThis.ClassicDamageView);
  const localizedBody = client?.html || display?.html || `<p class="classicSkillSummary">${classicHtmlText(prose)}</p>`;
  return `<div lang="${locale === 'ja_JP' ? 'ja' : 'en'}">${localizedBody}</div>`;
}
function skillValueDataAttributes(skill) {
  if (!skill || !skill.sourceUrl?.includes('/mode/classic/')) return '';
  return ` data-classic-source-url="${esc(skill.sourceUrl)}" data-classic-source-field="${esc(skill.sourceField)}" data-classic-skill-slot="${esc(skill.slot)}"`
    + (skill.localEvidence ? ` data-classic-verification="${esc(skill.localEvidence.verification)}"` : '');
}
function skillCardHeader(skill, index, champion) {
  const official = champion && appLocale.getLocale() !== 'ko_KR' ? appLocale.skill(champion.riotId, skill.slot) : null;
  const name = classicSafeText(official?.name || (appLocale.getLocale() !== 'ko_KR' && skill.nameEn) || skill.nameKo), slot = classicSafeText(skill.slot);
  const secondary = skill.nameEn && skill.nameEn !== name ? `<span class="classicSkillEnglish" lang="en">(${esc(skill.nameEn)})</span>` : '';
  return `<h4 class="${index === 4 ? 'sk-r' : 'sk-g'}"><b class="classicSkillSlot">${esc(slot)}</b>${esc(name)}${index === 0 ? ` <b class="pv">(${localized('패시브')})</b>` : ''}${secondary}</h4>`;
}
function skillDescriptionText(text) {
  return window.ClassicDamageView.authoredText(text);
}
function renderSkillCards(c, compact = false) {
  if (window.OperatorChampionOverlay?.isChampion(c)) return renderOperatorSkillCards(c, compact);
  const classicSkills = classicSkillsFor(c);
  if (!classicSkills) return `<p class="hint">${localized('스킬 정보를 불러오지 못했습니다.')}</p>`;
  return classicSkills.map((skill, i) => {
    const name = classicSafeText(appLocale.getLocale() === 'ko_KR' ? skill.nameKo : appLocale.skill(c.riotId, skill.slot)?.name || skill.nameKo);
    const icon = skill.operatorCorrection?.icon || c.simg?.[i];
    const header = skillCardHeader(skill, i, c);
    const rangeLines = window.ClassicDetailExtras.rangeLines
      ? window.ClassicDetailExtras.rangeLines(skill)
      : [{label:'사거리', text:window.ClassicDetailExtras.rangeText(skill)}];
    const skillBody = window.ClassicSkillEffects26195.decorate(classicSkillBody(skill, c), appLocale.getLocale(), c.riotId, skill.slot);
    const body = (skill.operatorCorrection ? `<p class="classicCorrectionLabel">${localized('운영자 정정')}</p>` : '') + skillBody + rangeLines.map(line =>
      `<p class="classicSkillRange">${esc(localized(line.label))}: ${esc(line.text)}${line.nameEn ? `<span class="classicSkillEnglish" lang="en">(${esc(line.nameEn)})</span>` : ''}</p>`).join('');
    const availability = skill.calculationStatus === 'unavailable-exact-classic-client-values'
      ? `<p class="classicSkillAvailability">${localized('상세 피해량·계수는 클래식 원본을 확인 중입니다. 표시하지 않은 수치는 미확인입니다.')}</p>` : '';
    const attributes = skillValueDataAttributes(skill);
    return compact
      ? `<div class="skill classicSkill"${attributes}>${pic(icon, name, 'sk', skill.operatorCorrection?.icon ? c.simg?.[i] : '')}<div>${header}${body}${availability}</div></div>`
      : `<div class="cvSkill classicSkill"${attributes}>${pic(icon, name, 'cvsk', skill.operatorCorrection?.icon ? c.simg?.[i] : '')}<div class="cvSkT">${header}${body}${availability}</div></div>`;
  }).join('');
}

function renderOperatorSkillCards(c, compact = false) {
  if (!window.OperatorChampionOverlay?.isChampion(c)) throw new Error('operator_champion_unverified');
  const series = values => !values.length ? '수치 미제공' : new Set(values).size === 1 ? String(values[0]) : values.join('/');
  return c.operatorSkills.map((skill, index) => {
    const header = skillCardHeader(skill, index, c);
    const damage = skill.damageDetails ? window.ClassicDamageView.damageParagraphs(skill.damageDetails) : '';
    const meta = skillMetaMarkup(skill, c);
    const range = skill.rangeByRank.length ? `<p class="classicSkillRange">${localized('사거리')}: ${esc(series(skill.rangeByRank))}</p>` : '';
    const description = window.ClassicSkillEffects26195.decorate(`<p class="classicSkillDetail">${skillDescriptionText(skill.description)}</p>`, appLocale.getLocale(), c.riotId, skill.slot);
    return `<div class="${compact ? 'skill' : 'cvSkill'} classicSkill" data-operator-skill-slot="${skill.slot}">${pic(skill.icon, skill.nameKo, compact ? 'sk' : 'cvsk')}<div class="cvSkT">${header}${description}${damage}${meta}${range}</div></div>`;
  }).join('');
}
const fmtDate = ts => { const d = new Date(ts); return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

const menu = {
  '게임 정보': [['챔피언 정보', 'champions'], ['아이템 정보', 'items'], ['특성 정보', 'mastery'], ['주문', 'spells'], ['룬', 'runes']],
  '부가 기능': [['빌더', 'builder'], ['용어 사전', 'terms']],
  '커뮤니티': [['자유게시판', 'board'], ['의회', 'council'], ['설정', 'settings'], ['이 앱에 대하여', 'about']],
};

function shouldClearChampionListScroll(fromView, toView) {
  const enteringDetailOutsideList = toView.startsWith('champion/') && fromView !== 'champions' && !fromView.startsWith('champion/');
  const abandoningListReturn = fromView.startsWith('champion/') && toView !== 'champions' && !toView.startsWith('champion/');
  return enteringDetailOutsideList || abandoningListReturn;
}
function createChampionListScrollState() {
  let savedTop = null;
  return {
    capture(view, top) {
      if (view !== 'champions') return false;
      savedTop = Math.max(0, Number(top) || 0);
      return true;
    },
    clear() { savedTop = null; },
    take() {
      const top = savedTop;
      savedTop = null;
      return top;
    },
  };
}
function createChampionDetailReturnState() {
  let route = 'champions';
  return {
    capture(fromView, toView) {
      if (!toView.startsWith('champion/') || fromView.startsWith('champion/')) return false;
      route = fromView || 'champions';
      return true;
    },
    getRoute() { return route; },
  };
}
const championListScrollState = createChampionListScrollState();
const championDetailReturnState = createChampionDetailReturnState();
function captureChampionListScrollBeforeDetail() {
  return championListScrollState.capture(S.view, window.scrollY);
}
function stopChampionAudio() {
  window.ClassicPickVoice?.stop();
  window.ClassicVoiceLibrary?.stop();
}
function go(v) {
  stopChampionAudio();
  itemDetailHistory.length = 0;
  try { $('#modal').close(); } catch (e) { }
  championDetailReturnState.capture(S.view, v);
  if (shouldClearChampionListScroll(S.view, v)) championListScrollState.clear();
  if (v !== S.view) routeHistory.push(v);
  if (v === S.view || ('#' + v) === location.hash) { S.view = v; render(); }
  else { location.hash = v; }
  closeDrawer();
}
function backToPrevious(fallback) {
  if (routeHistory.length > 1) {
    routeHistory.pop();
    history.back();
    return true;
  }
  if (fallback && fallback !== S.view) { go(fallback); return true; }
  return false;
}
function handleAndroidBack() {
  stopChampionAudio();
  if (document.querySelector('.classicSkillEffectPopup') && window.ClassicSkillEffects26195?.closePopup) {
    window.ClassicSkillEffects26195.closePopup();
    return true;
  }
  const modal = $('#modal');
  if (modal && modal.open) {
    if (modal.querySelector('.itemDetail') && itemDetailHistory.length) {
      const previous = itemDetailHistory.pop();
      $('#modalBody').innerHTML = previous.html;
      modal.scrollTop = previous.scrollTop;
      return true;
    }
    itemDetailHistory.length = 0;
    modal.close();
    return true;
  }
  const drawer = $('#drawer');
  if (drawer && drawer.classList.contains('open')) { closeDrawer(); return true; }
  const back = $('#view .backNav');
  if (back) return backToPrevious(back.dataset.back || 'home');
  const route = location.hash.slice(1) || 'home';
  return backToPrevious(route.startsWith('post/') ? 'board' : route === 'home' ? '' : 'home');
}
function box(t, b) { return `<section class="box"><h2 class="bar">${t}</h2>${b}</section>`; }
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => t.classList.remove('on'), 1600);
}
function renderPreservingScroll(selectors = ['.tree2', '.ilist', '.rlist', '.runeInventory', '.runeClientStats']) {
  const windowY = window.scrollY;
  const nested = selectors.map(selector => ({
    selector,
    top: document.querySelector(selector)?.scrollTop || 0,
  }));
  render();
  requestAnimationFrame(() => {
    window.scrollTo(0, windowY);
    nested.forEach(position => {
      const element = document.querySelector(position.selector);
      if (element) element.scrollTop = position.top;
    });
  });
}
function backBar(to) { return `<button class="backNav" data-back="${esc(to)}">‹ ${appMessage('뒤로', '戻る', 'Back')}</button>`; }
function externalButton(label, url, className = 'card') {
  const localRoute = window.ClassicDocuments?.routeForUrl(url);
  if (localRoute) return `<button class="${esc(className)}" data-go="${esc(localRoute)}">${esc(label.replace(/^공개 |^공식 |^외부 /, '').replace(' 사이트', ''))}</button>`;
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return '';
  return `<button class="${esc(className)}" data-external="${esc(url)}" aria-label="${esc(label)} — 외부 브라우저에서 열기">${esc(label)} <small>↗</small></button>`;
}

/* ---------- 게시판 저장소 ---------- */
function loadPosts() {
  let ps = store.get('res3posts', null);
  if (!Array.isArray(ps) || !ps.length) { ps = SEED_POSTS.slice(); store.set('res3posts', ps); }
  let migrated = false;
  const normalized = ps.map(p => {
    const localOwner = typeof p.localOwner === 'boolean'
      ? p.localOwner
      : Number(p.id) > SEED_POST_MAX_ID;
    if (typeof p.localOwner !== 'boolean') migrated = true;
    const comments = (Array.isArray(p.comments) ? p.comments : []).map(comment => {
      if (typeof comment.localOwner === 'boolean') return comment;
      migrated = true;
      return { ...comment, localOwner: true };
    });
    return { comments: [], notice: false, ts: Date.now(), views: 0, likes: 0, ...p, localOwner, comments };
  });
  if (migrated) store.set('res3posts', normalized);
  return normalized;
}
function savePosts(ps) { store.set('res3posts', ps); }
function sortedPosts() {
  const ps = loadPosts();
  return [...ps.filter(p => p.notice), ...ps.filter(p => !p.notice).sort((a, b) => b.id - a.id)];
}
function likedSet() { return new Set(store.get('res3liked', [])); }

/* ---------- 홈 : 독립적인 아카이브 데스크 + 오프라인 보존 기능 ---------- */
const HOME_BTNS = [
  ['챔피언 정보', 'champions'], ['아이템 정보', 'items'],
  ['특성', 'mastery'], ['주문', 'spells'],
  ['룬', 'runes'], ['자유 게시판', 'board'],
  ['용어 사전', 'terms'], ['설정', 'settings'],
];
function communityTitles() { return sortedPosts().slice(0, 7); }

function cmsSharedList(key) {
  const value = window.__lolCmsShared && window.__lolCmsShared[key];
  return Array.isArray(value) ? value : [];
}

function isAppPatchNews(article) {
  const ids = [article.id, article.entityId, article.cmsStableId];
  const title = String(article.title || '').replace(/\s+/g, '');
  return ids.some(id => /^app-patch(?:[._-]|$)/i.test(String(id || '')))
    || String(article.route || '').replace(/^#/, '') === 'patchnote/1'
    || /(?:백과사전|앱).*패치노트|app.*patchnotes?/i.test(title);
}

function isBundledNewsArticle(article) {
  return String(article.route || '').replace(/^#/, '').startsWith('patchnote/')
    || window.ClassicNews.articles().some(row => [article.id, article.entityId, article.cmsStableId].includes(row.id)
      || String(article.title || '').replace(/\s+/g, '') === row.title.replace(/\s+/g, ''));
}

function homeNewsForTab(tab) {
  const source = window.__lolCmsContentApplied ? cmsSharedList('news') : (news[tab] || []);
  const articles = source.filter(article => (article.tab || '새소식') === tab
    && !isAppPatchNews(article) && !isBundledNewsArticle(article));
  return tab === '새소식' ? [...window.ClassicNews.articles(), ...articles] : articles;
}

const LOL_VIDEO_API_BASE = 'https://lolclassic-video-service.lolflix-7313.workers.dev';
let lolVideoItems = [];
let lolVideoLoading = false;
let lolVideoLoaded = false;
let lolVideoError = '';

function lolVideoAdmin() {
  // Privileged operations are native-only. No credential or actor identity is
  // exposed to the WebView JavaScript context.
  return null;
}

function lolVideoYoutubeEmbed(id) {
  return `<iframe class="lolVideoFrame" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}"
    title="YouTube video player" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

function lolVideoPlayer(item) {
  if (item.type === 'youtube' && item.youtubeId) {
    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(item.youtubeId)}/hqdefault.jpg`;
    return `<button class="lolVideoPreview" data-act="videoPlay:${esc(item.id)}"
      aria-label="${esc(item.title || '영상')} 재생">
      <img class="lolVideoThumbnail" src="${thumb}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer">
      <span class="lolVideoPlayBadge">▶ 재생</span>
    </button>`;
  }

  if (item.type === 'file' && item.mediaUrl) {
    return `<button class="lolVideoPreview lolVideoFilePreview" data-act="videoPlay:${esc(item.id)}" aria-label="${esc(item.title || '영상')} 재생">
      <span class="lolVideoFileIcon">▶</span>
      <span class="lolVideoPlayBadge">직접 업로드 영상 재생</span>
    </button>`;
  }

  return `<div class="lolVideoUnavailable">재생할 수 없는 영상입니다.</div>`;
}

function lolVideoFeedHtml() {
  const admin = lolVideoAdmin();
  const styles = `<style>
    .lolVideoHub{display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;padding:9px!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;background:#111820!important;border:0!important;touch-action:pan-y!important;scrollbar-gutter:stable}
    .lolVideoIntro{padding:10px 12px;margin-bottom:9px;border:1px solid #654c1f;background:#181b19;color:#d9c796;font-size:12px}
    .lolVideoIntro b{display:block;color:#ffe28a;font-size:15px;margin-bottom:3px}
    .lolVideoAdminBox{padding:10px;margin-bottom:12px;border:1px solid #c79934;background:#29200d}
    .lolVideoAdminBox input,.lolVideoAdminBox textarea{box-sizing:border-box;width:100%;margin:4px 0;padding:9px;border:1px solid #725b2d;background:#101417;color:#f4ecd0}
    .lolVideoAdminBox textarea{min-height:66px;resize:vertical}
    .lolVideoAdminActions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:6px!important;margin-top:6px;width:100%}
    .lolVideoAdminActions button,.lolVideoTools button{display:block!important;width:100%!important;min-width:0!important;min-height:36px;padding:0 7px!important;margin:0!important;border:1px solid #d4ad53;background:#171b18;color:#ffe8a5;font-weight:700;font-size:11px!important;white-space:nowrap}
    .lolVideoGrid{display:grid;grid-template-columns:1fr;gap:12px}
    .lolVideoCard{padding:10px;border:1px solid #39424a;background:#141b22}
    .lolVideoCard h3{margin:8px 0 4px;color:#f3e7bd;font-size:15px}
    .lolVideoCard p{margin:0 0 7px;color:#aeb8c2;font-size:12px;line-height:1.45}
    .lolVideoMeta{display:block;color:#7f8c96;font-size:10px;margin-top:5px}
.lolVideoGrid,.lolVideoCard{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}
.lolVideoPreview{position:relative;display:block;width:100%!important;height:auto!important;aspect-ratio:16/9;padding:0!important;margin:0!important;overflow:hidden!important;border:1px solid #414b54!important;background-color:#05080d!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;color:#fff!important}
.lolVideoPreview img{position:absolute!important;inset:0!important;z-index:1!important;display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;background:#000!important;visibility:visible!important;opacity:1!important;pointer-events:none!important}
.lolVideoPlayBadge{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 13px;border:1px solid #e0bd67;background:rgba(7,10,13,.88);color:#ffe8a5;font-weight:800;font-size:12px;white-space:nowrap;pointer-events:none}
.lolVideoFilePreview{display:grid!important;place-items:center;background:linear-gradient(145deg,#17222c,#05080d)!important}
.lolVideoFileIcon{font-size:42px;color:#e4bd57;pointer-events:none}
.lolVideoFrame,.lolVideoPlayer{display:block;width:100%;aspect-ratio:16/9;border:0;background:#000}
.lolVideoGrid,.lolVideoCard{position:relative!important;float:none!important;clear:both!important;display:block!important;width:100%!important}
.lolVideoGrid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important}
.lolVideoCard{margin:0!important}
.hmNews.lolVideoMode{display:block!important;position:relative!important;width:100%!important;overflow:hidden!important;padding:0!important;margin:0!important}
    .lolVideoTools{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;margin-top:8px;width:100%}
    .lolVideoTools button:last-child{border-color:#a44;background:#351313;color:#ffc7c7}
    .lolVideoStatus{padding:18px 10px;text-align:center;color:#aeb8c2}
    .lolVideoProgress{margin-top:7px;color:#ffe28a;font-size:11px}
  </style>`;

  const adminBox = admin ? `
    <section class="lolVideoAdminBox">
      <b>운영자 영상 등록</b>
      <input id="lolVideoTitle" maxlength="120" placeholder="영상 제목">
      <textarea id="lolVideoDescription" maxlength="1500" placeholder="설명 (선택)"></textarea>
      <input id="lolVideoYoutube" placeholder="YouTube 링크 또는 영상 ID">
      <div style="padding:5px 0;color:#c9b47b;font-size:11px">또는 동영상 파일을 직접 선택하세요.</div>
      <input id="lolVideoFile" type="file" accept="video/*">
      <div class="lolVideoAdminActions">
        <button data-act="videoUpload">영상 등록</button>
        <button data-act="videoRefresh">새로고침</button>
      </div>
      <div id="lolVideoProgress" class="lolVideoProgress"></div>
    </section>` : '';

  let body = '';
  if (lolVideoLoading && !lolVideoLoaded) {
    body = `<div class="lolVideoStatus">영상 목록을 불러오는 중…</div>`;
  } else if (lolVideoError) {
    body = `<div class="lolVideoStatus">${esc(lolVideoError)}</div>`;
  } else if (!lolVideoItems.length) {
    body = `<div class="lolVideoStatus">등록된 영상이 없습니다.</div>`;
  } else {
    body = `<div class="lolVideoGrid">${lolVideoItems.map(item => {
      const tools = admin ? `<div class="lolVideoTools">
        <button data-act="videoEdit:${esc(item.id)}">정보 수정</button>
        <button data-act="videoChange:${esc(item.id)}">영상 변경</button>
        <button data-act="videoDelete:${esc(item.id)}">삭제</button>
      </div>` : '';
      return `<article class="lolVideoCard">
        ${lolVideoPlayer(item)}
        <h3>${esc(item.title || '영상')}</h3>
        ${item.description ? `<p>${userText(item.description)}</p>` : ''}
        <small class="lolVideoMeta">${item.type === 'youtube' ? 'YouTube' : '직접 업로드'} · ${esc((item.createdAt || '').replace('T', ' ').slice(0, 16))}</small>
        ${tools}
      </article>`;
    }).join('')}</div>`;
  }

  return `<li class="lolVideoHub">${styles}
    <div class="lolVideoIntro"><b>영상</b></div>
    ${adminBox}${body}
  </li>`;
}


function openLolVideoPlayer(id) {
  const item = lolVideoItems.find(v => String(v.id) === String(id));
  if (!item) return toast(appMessage('영상을 찾을 수 없습니다.', '動画が見つかりません。', 'Video not found.'));

  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return toast(appMessage('영상 창을 열 수 없습니다.', '動画画面を開けません。', 'Could not open the video player.'));

  let media = '';
  if (item.type === 'youtube' && item.youtubeId) {
    media = `<iframe class="lolVideoFrame" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeId)}?autoplay=1"
      title="${esc(item.title || 'YouTube 영상')}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  } else if (item.type === 'file' && item.mediaUrl) {
    media = `<video class="lolVideoPlayer" controls autoplay preload="metadata" playsinline src="${esc(item.mediaUrl)}"></video>`;
  } else {
    return toast(appMessage('재생할 수 없는 영상입니다.', 'この動画は再生できません。', 'This video cannot be played.'));
  }

  body.innerHTML = `<section class="lolVideoModal">
    ${media}
    <h2 style="margin:12px 0 6px">${esc(item.title || '영상')}</h2>
    ${item.description ? `<p class="mtxt">${userText(item.description)}</p>` : ''}
  </section>`;

  if (!modal.open) modal.showModal();
}
async function loadLolVideos(force = false) {
  if (window.__LOLCLASSIC_CONFIG__?.webBeta === true) return;
  if (lolVideoLoading) return;
  if (lolVideoLoaded && !force) return;
  lolVideoLoading = true;
  lolVideoError = '';
  if (S.tab === '영상') render();
  try {
    const response = await fetch(`${LOL_VIDEO_API_BASE}/videos`, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `HTTP ${response.status}`);
    lolVideoItems = Array.isArray(payload.videos) ? payload.videos : [];
    lolVideoLoaded = true;
  } catch (error) {
    lolVideoError = appMessage(`영상 목록을 불러오지 못했습니다. ${error.message || error}`, `動画一覧を読み込めませんでした。 ${error.message || error}`, `Could not load videos. ${error.message || error}`);
  } finally {
    lolVideoLoading = false;
    if (S.tab === '영상') render();
  }
}

async function lolVideoAdminFetch(path, options = {}) {
  void path;
  void options;
  throw new Error('운영자 작업은 네이티브 운영자 도구에서만 사용할 수 있습니다.');
}

function lolVideoProgress(message) {
  const el = document.getElementById('lolVideoProgress');
  if (el) el.textContent = message || '';
}

async function uploadLolVideo() {
  const admin = lolVideoAdmin();
  if (!admin) return toast('운영자만 업로드할 수 있습니다.');

  const titleEl = document.getElementById('lolVideoTitle');
  const descriptionEl = document.getElementById('lolVideoDescription');
  const youtubeEl = document.getElementById('lolVideoYoutube');
  const fileEl = document.getElementById('lolVideoFile');

  const title = (titleEl?.value || '').trim();
  const description = (descriptionEl?.value || '').trim();
  const youtubeUrl = (youtubeEl?.value || '').trim();
  const file = fileEl?.files?.[0] || null;

  if (title.length < 2) return toast('영상 제목을 2글자 이상 입력하세요.');
  if (!file && !youtubeUrl) return toast('YouTube 링크 또는 동영상 파일을 선택하세요.');

  try {
    if (!file) {
      lolVideoProgress('YouTube 영상 등록 중…');
      await lolVideoAdminFetch('/admin/videos/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, youtubeUrl, published: true }),
      });
    } else {
      if (!String(file.type || '').startsWith('video/')) throw new Error('동영상 파일만 업로드할 수 있습니다.');

      lolVideoProgress('업로드 준비 중…');
      const start = await lolVideoAdminFetch('/admin/uploads/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description,
          fileName: file.name,
          mime: file.type || 'video/mp4',
          size: file.size,
        }),
      });

      const chunkSize = Math.min(Number(start.chunkLimit) || (20 * 1024 * 1024), 20 * 1024 * 1024);
      const total = Math.ceil(file.size / chunkSize);
      const parts = [];

      try {
        for (let partNumber = 1; partNumber <= total; partNumber++) {
          const from = (partNumber - 1) * chunkSize;
          const to = Math.min(file.size, from + chunkSize);
          const chunk = file.slice(from, to);

          lolVideoProgress(`파일 업로드 ${partNumber}/${total} · ${Math.round((to / file.size) * 100)}%`);

          const uploaded = await lolVideoAdminFetch(
            `/admin/uploads/part?key=${encodeURIComponent(start.key)}&uploadId=${encodeURIComponent(start.uploadId)}&partNumber=${partNumber}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: chunk,
            },
          );
          parts.push({ partNumber: uploaded.partNumber, etag: uploaded.etag });
        }

        lolVideoProgress('업로드 완료 처리 중…');
        await lolVideoAdminFetch('/admin/uploads/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: start.id,
            key: start.key,
            uploadId: start.uploadId,
            parts,
            title,
            description,
            fileName: file.name,
            mime: file.type || 'video/mp4',
            size: file.size,
            published: true,
          }),
        });
      } catch (error) {
        try {
          await lolVideoAdminFetch('/admin/uploads/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: start.key, uploadId: start.uploadId }),
          });
        } catch {}
        throw error;
      }
    }

    if (titleEl) titleEl.value = '';
    if (descriptionEl) descriptionEl.value = '';
    if (youtubeEl) youtubeEl.value = '';
    if (fileEl) fileEl.value = '';
    lolVideoProgress('');
    toast('영상 등록 완료');
    lolVideoLoaded = false;
    await loadLolVideos(true);
  } catch (error) {
    lolVideoProgress('');
    toast(`영상 등록 실패: ${error.message || error}`);
  }
}

async function editLolVideo(id) {
  const item = lolVideoItems.find(v => String(v.id) === String(id));
  if (!item) return toast('영상을 찾을 수 없습니다.');

  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return toast('수정 창을 열 수 없습니다.');

  const currentUrl = item.type === 'youtube' && item.youtubeId
    ? `https://www.youtube.com/watch?v=${item.youtubeId}`
    : (item.mediaUrl || '');

  const urlLabel = item.type === 'youtube'
    ? 'YouTube URL'
    : '직접 업로드 URL';

  const urlNote = item.type === 'youtube'
    ? 'YouTube 링크 또는 영상 ID를 변경할 수 있습니다.'
    : '직접 업로드 파일 주소는 서버가 자동 관리합니다. 파일 자체를 바꾸려면 “영상 변경”을 사용하세요.';

  body.innerHTML = `
    <section class="lolVideoEditDialog">
      <h2 style="margin:0 0 12px">영상 정보 수정</h2>

      <label style="display:block;margin:8px 0 4px;font-weight:700">제목</label>
      <input id="lolVideoEditTitle"
        value="${esc(item.title || '')}"
        maxlength="120"
        style="box-sizing:border-box;width:100%;min-height:38px;padding:8px">

      <label style="display:block;margin:12px 0 4px;font-weight:700">내용</label>
      <textarea id="lolVideoEditDescription"
        maxlength="1500"
        style="box-sizing:border-box;width:100%;min-height:120px;padding:8px;resize:vertical">${esc(item.description || '')}</textarea>

      <label style="display:block;margin:12px 0 4px;font-weight:700">${urlLabel}</label>
      <input id="lolVideoEditUrl"
        value="${esc(currentUrl)}"
        ${item.type === 'youtube' ? '' : 'readonly'}
        style="box-sizing:border-box;width:100%;min-height:38px;padding:8px;${item.type === 'youtube' ? '' : 'opacity:.65'}">

      <p style="margin:5px 0 12px;font-size:11px;line-height:1.5;color:#777">${esc(urlNote)}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
        <button data-act="videoEditCancel"
          style="min-height:40px">취소</button>
        <button data-act="videoEditSave:${esc(item.id)}"
          style="min-height:40px;font-weight:700">저장</button>
      </div>
    </section>`;

  if (!modal.open) modal.showModal();
}

async function saveLolVideoEdit(id) {
  const item = lolVideoItems.find(v => String(v.id) === String(id));
  if (!item) return toast('영상을 찾을 수 없습니다.');

  const title = (document.getElementById('lolVideoEditTitle')?.value || '').trim();
  const description = (document.getElementById('lolVideoEditDescription')?.value || '').trim();
  const url = (document.getElementById('lolVideoEditUrl')?.value || '').trim();

  if (title.length < 2) return toast('영상 제목을 2글자 이상 입력하세요.');
  if (description.length > 1500) return toast('내용은 1500자 이하로 입력하세요.');
  if (item.type === 'youtube' && !url) return toast('YouTube URL을 입력하세요.');

  const payload = { title, description };
  if (item.type === 'youtube') payload.youtubeUrl = url;

  try {
    await lolVideoAdminFetch(`/admin/videos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const modal = document.getElementById('modal');
    if (modal?.open) modal.close();

    toast('영상 정보를 수정했습니다.');
    lolVideoLoaded = false;
    await loadLolVideos(true);
  } catch (error) {
    toast(`수정 실패: ${error.message || error}`);
  }
}
async function changeLolVideo(id) {
  const item = lolVideoItems.find(v => String(v.id) === String(id));
  if (!item) return toast('영상을 찾을 수 없습니다.');

  if (item.type === 'youtube') {
    const current = item.youtubeId
      ? `https://www.youtube.com/watch?v=${item.youtubeId}`
      : '';
    const youtubeUrl = prompt('새 YouTube 링크 또는 영상 ID', current);
    if (youtubeUrl == null) return;
    if (!youtubeUrl.trim()) return toast('YouTube 링크를 입력하세요.');

    try {
      await lolVideoAdminFetch(`/admin/videos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });
      toast('YouTube 영상을 변경했습니다.');
      lolVideoLoaded = false;
      await loadLolVideos(true);
    } catch (error) {
      toast(`영상 변경 실패: ${error.message || error}`);
    }
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.onchange = async () => {
    const file = input.files && input.files[0] ? input.files[0] : null;
    input.remove();

    if (!file) return;
    if (!String(file.type || '').startsWith('video/')) {
      return toast('동영상 파일만 선택할 수 있습니다.');
    }

    if (!confirm(`“${item.title || '영상'}”의 영상 파일을 새 파일로 교체할까요?`)) {
      return;
    }

    let start = null;

    try {
      lolVideoProgress('교체용 파일 업로드 준비 중…');

      start = await lolVideoAdminFetch('/admin/uploads/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title || '영상',
          description: item.description || '',
          fileName: file.name,
          mime: file.type || 'video/mp4',
          size: file.size,
        }),
      });

      const chunkSize = Math.min(
        Number(start.chunkLimit) || (20 * 1024 * 1024),
        20 * 1024 * 1024
      );
      const total = Math.ceil(file.size / chunkSize);
      const parts = [];

      for (let partNumber = 1; partNumber <= total; partNumber++) {
        const from = (partNumber - 1) * chunkSize;
        const to = Math.min(file.size, from + chunkSize);
        const chunk = file.slice(from, to);

        lolVideoProgress(
          `영상 교체 업로드 ${partNumber}/${total} · ${Math.round((to / file.size) * 100)}%`
        );

        const uploaded = await lolVideoAdminFetch(
          `/admin/uploads/part?key=${encodeURIComponent(start.key)}&uploadId=${encodeURIComponent(start.uploadId)}&partNumber=${partNumber}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: chunk,
          },
        );

        parts.push({
          partNumber: uploaded.partNumber,
          etag: uploaded.etag,
        });
      }

      lolVideoProgress('새 영상 적용 중…');

      await lolVideoAdminFetch('/admin/uploads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: start.id,
          key: start.key,
          uploadId: start.uploadId,
          parts,
          title: item.title || '영상',
          description: item.description || '',
          fileName: file.name,
          mime: file.type || 'video/mp4',
          size: file.size,
          published: true,
        }),
      });

      // 새 파일 등록이 완전히 성공한 뒤에만 기존 영상을 삭제한다.
      await lolVideoAdminFetch(
        `/admin/videos/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );

      lolVideoProgress('');
      toast('영상 파일을 교체했습니다.');
      lolVideoLoaded = false;
      await loadLolVideos(true);
    } catch (error) {
      if (start && start.key && start.uploadId) {
        try {
          await lolVideoAdminFetch('/admin/uploads/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: start.key,
              uploadId: start.uploadId,
            }),
          });
        } catch {}
      }

      lolVideoProgress('');
      toast(`영상 교체 실패: ${error.message || error}`);
    }
  };

  input.click();
}
async function deleteLolVideo(id) {
  const item = lolVideoItems.find(v => String(v.id) === String(id));
  if (!item) return toast('영상을 찾을 수 없습니다.');
  if (!confirm(`“${item.title || '영상'}”을 삭제할까요?`)) return;
  try {
    await lolVideoAdminFetch(`/admin/videos/${encodeURIComponent(id)}`, { method: 'DELETE' });
    toast('삭제했습니다.');
    lolVideoLoaded = false;
    await loadLolVideos(true);
  } catch (error) {
    toast(`삭제 실패: ${error.message || error}`);
  }
}
const HOME_TABS = Object.freeze(['새소식', '영상', '의회', '커뮤니티']);
const HOME_FEED_ROW_COUNT = 7;
const HOME_NOTICE_SLOT_COUNT = 1;
const HOME_USER_SLOT_COUNT = 5;
function emptyHomeFeedRow(slotClass = '') {
  return `<li class="hmFeedEmpty${slotClass ? ` ${slotClass}` : ''}" aria-hidden="true"></li>`;
}

function fixedHomeFeedSlots(rows, slotCount, slotClass = '') {
  const realRows = Array.isArray(rows) ? rows.slice(0, slotCount) : [];
  return realRows.concat(Array.from(
    { length: Math.max(0, slotCount - realRows.length) },
    () => emptyHomeFeedRow(slotClass),
  ));
}

function fixedHomeFeedRows(rows) {
  return fixedHomeFeedSlots(rows, HOME_FEED_ROW_COUNT).join('');
}

function homeFeedDot(kind) {
  const suffix = kind === 'notice' ? 'Notice' : 'User';
  return `<span class="hmFeedDot hmFeedDot${suffix}" aria-hidden="true"></span>`;
}

function isHomeNotice(post) {
  return !!post && typeof post === 'object'
    && (post.notice === true || post.isNotice === true);
}

function isOperatorPost(post) {
  // The public API reserves null authorId + this name for admin-created posts.
  // A user nickname or a title starting with [공지] does not establish a role.
  return isHomeNotice(post) || (!!post && post.authorId === null && post.author === '운영자');
}

function homeFeedMeta(label, date = '') {
  date = String(date).match(/\d{4}[.\/-]\d{2}[.\/-]\d{2}/)?.[0]?.replace(/[-/]/g, '.') || '';
  return `<small><span class="hmFeedAuthor">${esc(label)}</span>${date ? `<span class="hmFeedSeparator" aria-hidden="true">·</span><time>${esc(date)}</time>` : ''}</small>`;
}

function managedNewsHomeFeed(tab) {
  const articles = homeNewsForTab(tab);
  if (!articles.length) return fixedHomeFeedRows([`<li class="hmFeedEmpty"><span class="hmFeedStatus">${appMessage('등록된 새소식이 없습니다.', 'ニュースはまだありません。', 'No news is available yet.')}</span></li>`]);
  const rows = articles.map((article, index) => `<li class="hmPatchRow hmPatchNotice"><button data-article="${index}">${homeFeedDot('notice')}<b data-user-content>${esc(window.ClassicNews.articleTitle(article))}</b>${homeFeedMeta(localized(article.author || '운영자'), article.createdAt || article.date || article.source)}</button></li>`);
  return fixedHomeFeedRows(rows);
}

function communityHomeFeed(posts) {
  const source = Array.isArray(posts) ? posts : [];
  const notice = source.find(post => isHomeNotice(post)
    && (String(post.id) === 'official-welcome-20260729' || /^(온라인 )?자유게시판 이용 안내$/.test(String(post.title || ''))));
  const users = source.filter(post => !isOperatorPost(post)).slice(0, HOME_USER_SLOT_COUNT);
  const noticeBody = appMessage(
    '롤 백과사전 클래식 온라인 자유게시판입니다. 서로를 존중하고, 개인정보나 타인의 권리를 침해하는 내용을 게시하지 마세요. 게시글과 댓글은 신고 및 운영 정책의 적용을 받을 수 있습니다.',
    'LoL クラシック百科事典のオンライン自由掲示板です。お互いを尊重し、個人情報や他人の権利を侵害する内容を投稿しないでください。投稿やコメントは通報と運営ポリシーの対象となる場合があります。',
    'This is the LoL Classic Encyclopedia online free board. Respect others and do not post personal information or content that infringes others’ rights. Posts and comments may be reported and moderated.');
  const noticeAction = notice ? `data-post="${esc(notice.id)}"` : `data-modal="${esc(noticeBody)}"`;
  const noticeRow = `<li class="hmCommunityRow hmCommunityNotice"><button ${noticeAction}>${homeFeedDot('notice')}<b>${localized('온라인 자유게시판 이용 안내')}</b>${homeFeedMeta(localized('운영자'), notice?.createdAt || (notice?.ts ? new Date(notice.ts).toISOString() : ''))}</button></li>`;
  const article = window.ClassicNews.articles()[0];
  const newsRow = `<li class="hmCommunityRow hmCommunityNotice hmCommunityPatch"><button data-news-article="${esc(article.id)}">${homeFeedDot('notice')}<b>${esc(window.ClassicNews.articleTitle(article))}</b>${homeFeedMeta(localized(article.author), article.date)}</button></li>`;
  const userRows = users.map(post => `<li class="hmCommunityRow hmCommunityUser"><button data-post="${esc(post.id)}">${homeFeedDot('user')}<b>${esc(post.title)}</b>${homeFeedMeta(post.author || localized('소환사'), post.createdAt || (post.ts ? new Date(post.ts).toISOString() : ''))}</button></li>`);
  return [noticeRow, newsRow, ...fixedHomeFeedSlots(userRows, HOME_USER_SLOT_COUNT, 'hmCommunityUserSlot')].join('');
}

function showNewsArticle(article) {
  if (!article) return;
  $('#modalBody').innerHTML = window.ClassicNews.articleMarkup(article);
  if (!$('#modal').open) $('#modal').showModal();
}

function homeFeed(tab) {
  if (tab === '영상') return lolVideoFeedHtml();
  if (tab === '커뮤니티') return communityHomeFeed(communityTitles());
  if (tab === '의회') return fixedHomeFeedRows([`<li class="hmCommunityRow hmCommunityNotice"><button data-go="council">${homeFeedDot('notice')}<b>${appMessage('의회 · 제2회 투표', '評議会 · 第2回投票', 'The Council · Second vote')}</b>${homeFeedMeta(localized('운영자'), '2026.09.23')}</button></li>`]);
  return managedNewsHomeFeed(tab);
}

function home() {
  const tab = HOME_TABS.includes(S.tab) ? S.tab : HOME_TABS[0];
  const managedHome = cmsSharedList('home')[0] || {};
  const featured = cmsSharedList('featured')[0] || {};
  const video = cmsSharedList('videos')[0] || {};
  return `<section class="hm">
<div class="hmStrip"><span>클래식 기록실</span><b>클래식 백과</b></div>
<div class="hmSearch"><input id="homeQ"${managedHome.searchPlaceholder ? ' data-user-content' : ''} value="${esc(S.homeQ || '')}" placeholder="${esc(managedHome.searchPlaceholder ?? localized('초성어로 검색하세요'))}" aria-label="${localized('오프라인 통합 검색')}"><button data-act="homeSearch" aria-label="${localized('검색')}">${appLocale.getLocale() === 'en_US' ? 'Go' : localized('검색')}</button><div id="homeSearchResults" class="homeSearchResults"${S.homeQ?.trim() ? '' : ' hidden'}>${homeSearchResults(S.homeQ || '')}</div></div>
<div class="hmLogo"><b${managedHome.title ? ' data-user-content' : ''}>${esc(managedHome.title || localized('클래식 챔피언 기록실'))}</b><small${managedHome.subtitle ? ' data-user-content' : ''}>${esc(managedHome.subtitle || localized('클래식 챔피언을 한눈에'))}</small></div>
<div class="hmRot" tabindex="0" aria-label="${esc(appMessage(`클래식 챔피언 ${champions.length}명 · 좌우로 넘기기`, `クラシックチャンピオン${champions.length}人 · 左右にスワイプ`, `${champions.length} Classic champions · Swipe left or right`))}">${cards(champions.length)}</div>
<div class="hmFeature">
  <button class="hmPoster" data-go="${esc(featured.route || 'champions')}" data-original-description="${esc(featured.description || '클래식의 챔피언과 아이템을 다시 만나보세요')}"><span${featured.title ? ' data-user-content' : ''}>${esc(featured.title || 'CLASSIC ENCYCLOPEDIA')}</span><b>${launchDateStamp()}</b><small${featured.description ? ' data-user-content' : ''}>${esc(featured.description || localized('클래식의 챔피언과 아이템을 다시 만나보세요'))} ›</small></button>
  <div class="hmQuick">${HOME_BTNS.slice(0, 6).map(t => `<button class="hmBtn" data-go="${t[1]}">${localized(t[0])}<small>›</small></button>`).join('')}</div>
</div>
<div class="hmGrid">${HOME_BTNS.slice(6).map(t => `<button class="hmBtn" data-go="${t[1]}">${localized(t[0])}<small>›</small></button>`).join('')}</div>
<div class="hmSectionTitle"><b>${localized('소식 기록')}</b><small>NEWS · VIDEO · COMMUNITY</small></div>
<div class="hmTabs" role="tablist" style="--home-tab-count:${HOME_TABS.length}">${HOME_TABS.map(name => `<button role="tab" aria-selected="${tab === name}" data-news="${name}" class="${tab === name ? 'on' : ''}">${localized(name === '커뮤니티' ? '자유게시판' : name)}</button>`).join('')}</div>
<ul class="hmNews ${tab === '영상' ? 'lolVideoMode' : ''}" data-feed-tab="${esc(tab)}">${homeFeed(tab)}</ul>
${video.title ? `<button class="hmAd" data-modal="${esc(`${video.title} — ${video.description || appMessage('추천 영상입니다.', 'おすすめの動画です。', 'Recommended video.')}`)}">${appMessage('메인 영상', '注目の動画', 'Featured video')} · ${esc(video.title)}</button>` : ''}
</section>${disclaimer()}`;
}

function cards(n = 10) {
  const pool = classicChampions();
  const list = pool.slice(0, n);
  return list.map(c => `<button class="rotC" data-champ="${c.id}" data-classic-id="${c.id}" aria-label="${esc(championName(c))}">${pic(championListImage(c), championName(c), 'rotc', c.portraitFallback)}<small>${esc(championName(c))}</small></button>`).join('');
}

function championSearchRow(list) {
  return `<div class="champGrid championSearchResults" aria-label="${appMessage('챔피언 검색 결과', 'チャンピオンの検索結果', 'Champion search results')}">${list.map(c => {
    const displayName = championName(c);
    const english = window.ClassicReferenceUI.championEnglishName(c) || c.en || '';
    const secondaryEnglish = english !== displayName ? english : '';
    const title = championTitle(c);
    return `<button class="championSearchResult" data-champ="${esc(c.id)}" aria-label="${esc([displayName, secondaryEnglish, title, (c.tagsKo || []).map(localized).join(', ')].filter(Boolean).join(' '))}">${pic(championListImage(c), displayName, 'searchPortrait', c.portraitFallback)}<span class="searchChampionInfo"><b>${esc(displayName)}</b>${secondaryEnglish ? `<span class="searchChampionEnglish">${esc(secondaryEnglish)}</span>` : ''}${title ? `<span class="searchChampionTitle" title="${esc(title)}">${esc(title)}</span>` : ''}</span><span class="searchChampionTraits">${c.tagsKo?.length ? `[${localized('특징')}]: ${esc(c.tagsKo.map(localized).join(', '))}` : ''}</span></button>`;
  }).join('') || `<p class="hint2">${localized('일치하는 챔피언이 없습니다.')}</p>`}</div>`;
}

function homeSearchResults(query) {
  if (!query.trim()) return '';
  return championSearchRow(sortChampionsForDisplay(champions.filter(c => window.ClassicReferenceUI.matchesChampionSearch(`${c.ko} ${c.en} ${c.nick || ''} ${championName(c)}`, query, c.ko)), 'ko'));
}

function updateHomeSearchResults() {
  const input = $('#homeQ');
  const results = $('#homeSearchResults');
  if (!input || !results) return;
  S.homeQ = input.value;
  results.hidden = !input.value.trim();
  results.innerHTML = homeSearchResults(input.value);
}

let homeSearchSequence = 0;
async function runHomeSearch() {
  const sequence = ++homeSearchSequence;
  const input = $('#homeQ');
  const raw = (input ? input.value : '').trim();
  const q = raw.toLowerCase();
  const searchLocale = appLocale.getLocale();
  if (!q) return toast(appMessage('검색어를 입력해 주세요.', '検索語を入力してください。', 'Enter a search term.'));

  const routeKeywords = [
    [/챔피언|champion|チャンピオン/, 'champions'],
    [/아이템|item|アイテム/, 'items'],
    [/특성|mastery|マスタリー/, 'mastery'],
    [/주문|spell|サモナースペル/, 'spells'],
    [/룬|rune|ルーン/, 'runes'],
    [/용어|사전|glossary|用語集/, 'terms'],
  ];
  const keyword = routeKeywords.find(([pattern]) => pattern.test(q));
  if (keyword && q.length <= 8) return go(keyword[1]);

  const matches = champions.filter(c => window.ClassicReferenceUI.matchesChampionSearch(`${c.ko} ${c.en} ${c.nick || ''} ${championName(c)}`, q, c.ko));
  if (matches.length > 1) return updateHomeSearchResults();
  const champion = matches[0];
  if (champion) {
    return go(`champion/${champion.id}/basic`);
  }

  const item = classicItemsForCurrentApp().find(entry =>
    `${itemDisplayName(entry.ko)} ${itemDisplayName(entry.en)} ${itemDisplayName(itemName(entry))}`.toLowerCase().includes(q));
  if (item) {
    S.iq = raw;
    S.cat = null;
    return go('items');
  }

  const classicRune = classicRunes.find(rune =>
    `${rune.ko} ${rune.text || ''} ${runeName(rune)} ${appLocale.description('runes', rune)}`.toLowerCase().includes(q));
  const rune = classicRune;
  if (rune) {
    S.runeSet = 'classic';
    S.runeView = 'list';
    S.rslot = rune.slot;
    S.rq = raw;
    return go('runes');
  }

  const currentTerms = window.ClassicReferenceUI.mergeTerms(window.__lolCmsShared?.glossary,
    window.__lolCmsShared?.glossaryComplete === true);
  let term = currentTerms.find(entry => window.ClassicGlossarySearch?.matches(entry, raw))
    || window.ClassicReferenceUI.filterTerms(currentTerms, q)[0];
  if (!term && searchLocale !== 'ko_KR' && window.ClassicGlossarySearch?.isLoading?.()) {
    await window.ClassicGlossarySearch.whenReady();
    if (sequence !== homeSearchSequence || S.view !== 'home' || appLocale.getLocale() !== searchLocale
        || ($('#homeQ')?.value || '').trim() !== raw) return;
    term = currentTerms.find(entry => window.ClassicGlossarySearch.matches(entry, raw));
  }
  if (term) {
    S.tq = raw;
    return go('terms');
  }
  toast(appMessage(`“${raw}” 검색 결과가 없습니다.`, `「${raw}」の検索結果はありません。`, `No results for “${raw}”.`));
}

/* ---------- 챔피언 목록 : 원본 재현 (ref_21) ---------- */
function championsPage() {
  const q = (S.q || '').trim().toLowerCase();
  const sort = S.sort === 'rel' ? 'rel' : 'ko';
  const role = S.role || '모두';
  const ROLES = ['모두', '탱커', '근접 딜러', '암살자', '마법사', '원거리 딜러', '서포터'];
  const onlyClassic = !!S.onlyClassic;
  let list = champions.filter(c => (role === '모두' || (c.tagsKo || []).includes(role))
    && (!onlyClassic || classicSet.has(c.id))
    && window.ClassicReferenceUI.matchesChampionSearch(c.ko + ' ' + c.en + ' ' + (c.nick || '') + ' ' + championName(c), q, c.ko));
  if (sort === 'ko') list = sortChampionsForDisplay(list, 'ko');
  if (sort === 'koD') list = [...list].sort((a, b) => b.ko.localeCompare(a.ko, 'ko'));
  if (sort === 'rel') list = window.ClassicReferenceUI.sortChampions(list, 'rel');
  const chk = (k, label) => `<button data-sort="${k}" class="ck ${sort === k ? 'on' : ''}"><i></i>${label}</button>`;

  return `<section class="clist">
<div class="clFilter">${chk('ko', '가나다 순')}${chk('rel', '출시 순')}</div>
<div class="clOnly"><button data-act="onlyClassic" class="ck ${onlyClassic ? 'on' : ''}"><i></i>${appMessage(`현재 클래식 ${classicSet.size}명만`, `現在のクラシックチャンピオン${classicSet.size}人のみ`, `Current Classic champions only (${classicSet.size})`)}</button><span>${launchDateStamp()}</span></div>
<div class="clFind">
  <select id="roleSel" aria-label="역할 선택">${ROLES.map(r => `<option ${role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
  <input id="champQ" value="${esc(S.q || '')}" placeholder="초성어로 검색하세요" aria-label="챔피언 검색">
</div>
${q ? championSearchRow(list) : `<div class="champGrid">${list.map(c => `<button class="champCell${classicSet.has(c.id) ? ' cls' : ''}" data-champ="${c.id}" aria-label="${esc(championName(c))}">${pic(championListImage(c), championName(c), 'cg', c.portraitFallback)}<b class="cgName">${esc(championName(c))}</b>${classicSet.has(c.id) ? '<u>클래식</u>' : ''}</button>`).join('') || '<p class="hint2">검색 결과가 없습니다.</p>'}</div>`}
<p class="hint2">${appMessage(`${list.length}명 표시 · 금색 테두리는 현재 롤 클래식 로스터 챔피언을 뜻합니다.`, `${list.length}人を表示 · 金色の枠は現在のクラシックチャンピオンを示します。`, `Showing ${list.length} champions · Gold borders indicate the current Classic roster.`)}</p>
</section>${disclaimer()}`;
}

/* ---------- 챔피언 상세 : 4탭 + 공략 6탭 — 출처 검증 데이터 ---------- */
function stRow(label, v, lv) {
  if (v == null) return '';
  return `<div class="st"><span>${label}</span><b>${v}${lv != null ? ` <em>(+${lv})</em>` : ''}</b></div>`;
}
function masteryBranch(node) {
  return node && MST.branches.find(branch => branch.key === node.branch);
}
function masteryIconPath(node, rank = 0) {
  return rank > 0 ? node?.iconOn || '' : node?.iconOff || '';
}
function masteryLowerPoints(node, pts) {
  const branch = masteryBranch(node);
  if (!branch) return 0;
  return branch.nodes
    .filter(candidate => candidate.row < node.row)
    .reduce((total, candidate) => total + (Number(pts[candidate.id]) || 0), 0);
}
function masteryRequirementsMet(node, pts) {
  return (node.requires || []).every(requirement => (Number(pts[requirement.id]) || 0) >= requirement.rank);
}
function masterySelectionValid(pts) {
  let total = 0;
  for (const branch of MST.branches) {
    for (const node of branch.nodes) {
      const value = Number(pts[node.id]) || 0;
      if (!Number.isInteger(value) || value < 0 || value > node.max) return false;
      total += value;
      if (value > 0 && (masteryLowerPoints({ ...node, branch: branch.key }, pts) < node.requiredPoints || !masteryRequirementsMet(node, pts))) return false;
    }
  }
  return total <= 30;
}
function masterySnapshot(value = {}) {
  let clean = {};
  const ordered = MST.branches.flatMap(branch => branch.nodes
    .map(node => ({ ...node, branch: branch.key }))
    .sort((a, b) => a.row - b.row || a.col - b.col));
  ordered.forEach(node => {
    const requested = Math.min(node.max, Math.max(0, Math.floor(Number(value && value[node.id]) || 0)));
    for (let rank = 0; rank < requested; rank++) {
      const next = { ...clean, [node.id]: (clean[node.id] || 0) + 1 };
      if (!masterySelectionValid(next)) break;
      clean = next;
    }
  });
  return clean;
}
function mstState() { return masterySnapshot(store.get(CLASSIC_MASTERY_STATE_KEY, {})); }
function mstGrid(interactive) {
  if (!MST.branches.length) return '<p class="hint">특성 데이터가 없습니다.</p>';
  const pts = mstState();
  const bsum = b => b.nodes.reduce((t, nd) => t + (pts[nd.id] || 0), 0);
  const total = MST.branches.reduce((t, b) => t + bsum(b), 0);
  const sections = MST.branches.map(branch => {
    const nodes = [...branch.nodes].sort((a, b) => a.requiredPoints - b.requiredPoints || a.row - b.row || a.col - b.col);
    return `<section class="masteryEditorialSection" data-mastery-branch="${branch.key}">
      <header><div><small>역사 특성 분류</small><h4>${esc(localized(branch.ko))}</h4></div><b>${bsum(branch)}${localized('포인트')}</b></header>
      <ol>${nodes.map(nd => {
        const value = pts[nd.id] || 0;
        const requirements = (nd.requires || []).map(requirement => {
          const parent = mstById[requirement.id];
          return `${parent ? masteryName(parent) : requirement.id} ${requirement.rank}${localized('포인트')}`;
        }).join(' · ');
        const available = masteryLowerPoints({ ...nd, branch: branch.key }, pts) >= nd.requiredPoints
          && masteryRequirementsMet(nd, pts);
        return `<li class="masteryEditorialCard ${available ? '' : 'locked'} ${value ? 'selected' : ''}">
          <button ${interactive ? `data-mst="${nd.id}"` : 'disabled'} aria-label="${esc(masteryName(nd))} ${value}/${nd.max}">
            <span class="masteryIndex" aria-hidden="true">${String(nd.requiredPoints).padStart(2, '0')}</span>
            <span class="masteryCopy"><b>${esc(masteryName(nd))}</b><small>${esc(nd.nameEn || '')}</small><em>${editorialText(appLocale.description('masteries', nd) || nd.desc || '')}</em>${requirements ? `<u>선행: ${esc(requirements)}</u>` : ''}</span>
            <strong>${value}/${nd.max}</strong>
          </button>
        </li>`;
      }).join('')}</ol>
    </section>`;
  }).join('');
  return `<div class="masteryShell masteryEditorial"><header class="archiveSectionHeader"><div><small>클래식 특성</small><h3>특성 기록</h3></div><b>${total}/30 · 남은 포인트 ${30 - total}</b></header><p class="archiveLead">공격·방어·보조 특성의 요구 포인트와 선행 관계를 한눈에 확인할 수 있습니다.</p><div class="masteryEditorialGrid">${sections}</div>${interactive ? '<div class="boardTop"><button data-act="mstReset">선택 초기화</button></div>' : ''}<p class="hint">항목을 누르면 1포인트 추가됩니다. 길게 누르기/우클릭은 1포인트를 뺍니다. 이름·효과·요구 조건은 클래식 자료를 기준으로 합니다.</p></div>`;
}

function isBaseSkin(skin) {
  return !!skin && ((skin.classicMode && skin.num === 0) || skin.en === 'Classic' || skin.ko === '기본스킨');
}
function skinName(champion, skin) {
  let name;
  if (appLocale.getLocale() === 'ko_KR') name = skin.ko;
  else {
    const official = appLocale.row?.('champions', champion.riotId)?.skins?.find(row => String(row.id) === String(skin.id));
    name = official?.name === 'default' ? localized('기본 스킨')
      : official?.name || skin.en || `${localized('스킨')} #${skin.num ?? skin.id}`;
  }
  return champion.riotId === 'Jade_Nunu' && typeof name === 'string'
    ? name.replace('누누와 윌럼프', '누누').replace('ヌヌ＆ウィルンプ', 'ヌヌ').replace('ヌヌ＆ビィルンプ', 'ヌヌ').replace('Nunu & Willump', 'Nunu').replace('Nunu & Beelump', 'Nunu')
    : name;
}

function skinPortrait(c, skin) {
  const explicitPath = String(skin && (skin.img || skin.image || skin.thumbnail) || '').trim();
  if (skin && skin.classicMode && explicitPath) {
    return pic(explicitPath, skinName(c, skin) || championName(c), 'cvci');
  }
  if (isBaseSkin(skin)) {
    return pic(explicitPath || championPortrait(c), skinName(c, skin) || skin.en || championName(c), 'cvci');
  }
  const label = `${skin && (skinName(c, skin) || skin.en) || localized('스킨')} ${localized('스킨 정보')}`;
  return `<span class="skinTextMarker" role="img" aria-label="${esc(label)}"><i aria-hidden="true">${appMessage('정보', '情報', 'Info')}</i></span>`;
}

function displayedChampionStat(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Number(value.toFixed(4)) : value;
}

function legacy(id, tab = 'basic', sub) {
  const c = champ(id);
  const modeClassicSkins = classicSet.has(c.id);
  const skinRows = modeClassicSkins
    ? (CLASSIC_CHAMPION_MEDIA ? CLASSIC_CHAMPION_MEDIA.skinGroupsFor(c.riotId) : [])
    : (c.skins || []);
  const st = c.stats || {};
  const rateDef = ['방어력', '공격력', '주문력', '난이도'];
  const statOrder = [
    ['공격력', st.damage, st.damage_per_level], ['체력', st.health, st.health_per_level],
    ['마나/기력', st.mana, st.mana_per_level], ['공격 속도', st.attack_speed, st.attack_speed_per_level],
    ['이동 속도', st.move_speed, null], ['사정 거리', st.range, null],
    ['방어력', st.armor, st.armor_per_level], ['마법 저항력', st.mr, st.mr_per_level],
    ['5초당 체력 회복', st.health_regen, st.health_regen_per_level],
    ['5초당 마나/기력 회복', st.mana_regen, st.mana_regen_per_level],
  ];
  const returnRoute = championDetailReturnState.getRoute();
  const returnLabel = returnRoute === 'champions' ? '챔피언 목록' : '이전 화면';
  const displayName = championName(c);
  const englishName = window.ClassicReferenceUI.championEnglishName(c);
  return `${backBar(returnRoute, returnLabel)}<section class="cv">
<div class="cvHead">
  ${pic(championPortrait(c), displayName, 'cvimg', c.portraitFallback)}
  <div class="cvInfo"><small class="archiveEyebrow">챔피언 정보</small>
    <h2>${esc(displayName)}${englishName && englishName !== displayName ? ` <span class="championEnglishName" lang="en">· ${esc(englishName)}</span>` : ''}</h2>
    <p class="cvNick">${window.OperatorChampionOverlay?.isChampion(c)
      ? appMessage(`운영자 등록 · 패치 ${esc(c.patch)}`, `運営者登録 · パッチ ${esc(c.patch)}`, `Operator entry · Patch ${esc(c.patch)}`)
      : esc(championTitle(c))}</p>
    <p class="cvTag">${localized('특징')} : ${esc((c.tagsKo || []).map(localized).join(', ') || '-')}</p>
  </div>
</div>
<div class="cvLinks cvLinksTwo">
  <button data-act="lore:${id}"><span class="classicActionIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v15"/></svg></span>배경</button>
  <button data-act="classicVoices:${id}"><span class="classicActionIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg></span>음성대사</button>
</div>
<h3 class="cvBar">기본 능력치</h3>
${(c.rate || []).length === 4 ? `<div class="cvRates dossierRates">${rateDef.map((label, i) => `<div class="cvRate"><span>${localized(label)}</span><b>${c.rate[i] || 0}/10</b></div>`).join('')}</div>` : ''}
<div class="cvStats">${statOrder.map(r => `<div class="cvS"><span>${localized(r[0])} : </span><b>${r[1] == null ? '-' : displayedChampionStat(r[1])}${r[2] != null ? ` <em>(+${displayedChampionStat(r[2])})</em>` : ''}</b></div>`).join('')}</div>
${window.ClassicRecommendationsUI.render(c, { locale: appLocale.getLocale(), open: store.get('classicRecommendationsAlwaysOpen26195', false), names: { items: itemName, runes: runeName, masteries: masteryName, spells: spellName } })}
<h3 class="cvBar">스킬 정보</h3>
<div class="cvSkills">${renderSkillCards(c)}</div>
<div id="tipBox" class="cvTips ${S.showTip === id ? 'on' : ''}">${S.showTip === id ? tipSection(c) : ''}</div>
<h3 class="cvBar">${localized(modeClassicSkins ? '클래식 스킨' : '보유 스킨')} <small>${skinRows.length}${appLocale.getLocale() === 'ko_KR' ? '종' : appLocale.getLocale() === 'ja_JP' ? '種' : ''}</small></h3>
<ul class="cvSkins${modeClassicSkins ? ' classicSkinCards' : ''}">${skinRows.map(sk2 => sk2.classicMode
  ? `<li data-classic-skin-id="${esc(sk2.id)}"><button class="classicSkinCard" data-open-classic-skin="${esc(sk2.id)}" data-skin-champion="${esc(c.riotId)}" aria-label="${esc(skinName(c, sk2))} ${localized('크게 보기')}">${skinPortrait(c, sk2)}<span>${esc(skinName(c, sk2))}<small>${sk2.variants.length > 1 ? `${localized('크로마')} ${sk2.variants.length - 1}${appLocale.getLocale() === 'ko_KR' ? '종' : appLocale.getLocale() === 'ja_JP' ? '種' : ''}` : (isBaseSkin(sk2) ? localized('기본 스킨') : localized('스킨'))}</small></span><b aria-hidden="true">›</b></button></li>`
  : `<li>${skinPortrait(c, sk2)}<span>${esc(skinName(c, sk2))}<small>${esc(sk2.en)}</small></span><b>${isBaseSkin(sk2) ? '기본' : (sk2.price || '-')}</b></li>`).join('') || '<li class="hint2">등록된 스킨 정보가 없습니다.</li>'}</ul>
</section>${disclaimer()}`;
}

function tipSection(c) {
  const play = (c.tips && c.tips.play) || [], vs = (c.tips && c.tips.vs) || [];
  return `<div class="cvTipInner">
<h4 class="sk-g">공략 (플레이 팁)</h4>${play.length ? `<ul>${play.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="hint2">등록된 플레이 팁이 없습니다.</p>'}
<h4 class="sk-r">카운터픽 (상대할 때)</h4>${vs.length ? `<ul>${vs.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="hint2">등록된 상성 정보가 없습니다.</p>'}
<p class="hint2">클래식 플레이 팁입니다.</p></div>`;
}

function guide(i, id) {
  const c = champ(id);
  if (i == 1) {
    const saved = store.get('res3runes', {});
    const slots = [['mark', '표식', 9], ['seal', '인장', 9], ['glyph', '문양', 9], ['quintessence', '정수', 3]];
    return `<h3>룬 Runes</h3>${slots.map(r => `<div class="rune"><div class="gem">◆</div><span>${r[1]} <small>x${r[2]}</small></span></div><input class="rin" data-rune="${r[0]}" value="${esc(saved[r[0]] || '')}" placeholder="${r[1]} 메모 (예: 상급 공격력 표식)" aria-label="${r[1]}">`).join('')}
<div class="boardTop"><button data-act="runeSave">룬 메모 저장</button><button data-act="runeLoad">불러오기</button><button data-go="runes">실제 룬 목록 보기</button></div>`;
  }
  if (i == 2) return mstGrid(true);
  if (i == 3) return `<h3>추천 소환사 주문</h3><div class="grid">${spells.map(sp => `<div class="card">◈<br>${esc(spellName(sp))}</div>`).join('')}</div><p class="hint plannedFeature">추천 조합 정보가 없습니다.</p><div class="boardTop"><button data-go="spells">소환사의 주문 정보 열기</button></div>`;
  if (i == 4) return `<h3>아이템</h3><p class="hint plannedFeature">추천 아이템 정보가 없습니다.</p><div class="boardTop"><button data-go="items">아이템 정보 열기</button></div>`;
  if (i == 5) return `<h3>스킬</h3>${renderSkillCards(c, true)}`;
  return `<h3>공략 정보</h3>${(c.tips && c.tips.play && c.tips.play.length) ? `<ul class="tipsL">${c.tips.play.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p class="hint">클래식 플레이 팁</p>` : '<p class="hint">팁 정보가 없습니다.</p>'}`;
}

/* ---------- 자유게시판 : 원본 board_list.xml 재현 ---------- */
function nick() { return store.get('res3nick', '소환사'); }
function boardFilter(all) {
  const f = S.bfilter || 'all';
  if (f === 'best') return all.filter(p => p.likes >= 1 || p.notice);
  if (f === 'mine') return all.filter(p => p.localOwner === true);
  return all;
}
function filterLabel() { return localized({ all: '전체글', best: '개념글', mine: '내글' }[S.bfilter || 'all']); }

function boardRowMetadata(date, likes, comments) {
  const parsed = new Date(date);
  const time = Number.isFinite(parsed.getTime()) ? `<time datetime="${esc(parsed.toISOString())}">${fmtDate(parsed)}</time>` : '';
  const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  return `<small class="boardRowMeta">${time}<span>${localized('추천')} ${count(likes)}</span><span>${localized('댓글')} ${count(comments)}</span></small>`;
}
function board() {
  const all = boardFilter(sortedPosts());
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  S.page = Math.min(Math.max(1, S.page), pages);
  const slice = all.slice((S.page - 1) * PER_PAGE, S.page * PER_PAGE);
  const rows = slice.map(p => `<li class="brow" data-post="${p.id}" data-post-role="${isOperatorPost(p) ? 'operator' : 'user'}"><i class="bic ${isOperatorPost(p) ? 'no' : ''}"></i><span class="bt">${p.notice === true ? appMessage('[공지] ', '[お知らせ] ', '[Notice] ') : ''}${esc(p.title)}${p.comments.length ? ` <em>[${p.comments.length}]</em>` : ''}</span><span class="bn">${esc(p.author)}</span><span class="bv">${localized('조회')} ${p.views}</span>${boardRowMetadata(p.ts, p.likes, p.comments.length)}</li>`).join('') || `<li class="bempty">${localized('글이 존재하지 않습니다.')}</li>`;

  return `<section class="bd">
<div class="bdTop">
  <button class="bBtn gen" data-act="bFilter"><font>${filterLabel()}</font></button>
  <button class="bBtn" data-act="write">${localized('글쓰기')}</button>
  <button class="bBtn" data-act="refresh">${localized('새로고침')}</button>
  <button class="bBtn" data-act="nickChange">${localized('닉변경')}</button>
</div>
<div class="bdPager">
  <button class="pg first" data-page="1" aria-label="처음"></button>
  <button class="pg prev" data-page="${S.page - 1}" aria-label="이전"></button>
  <button class="pg search" data-act="pageSearch">${localized('페이지 검색')}<br>(${S.page}/${pages})</button>
  <button class="pg next" data-page="${S.page + 1}" aria-label="다음"></button>
  <button class="pg last" data-page="${pages}" aria-label="끝"></button>
</div>
<div class="bdLine"></div>
<ul class="brows">${rows}</ul>
${storageOk ? '' : `<p class="warn">${localized('저장소를 쓸 수 없어 이번 실행에서만 유지됩니다.')}</p>`}
<p class="hint2">${appMessage(`${filterLabel()} · ${S.page}/${pages} 페이지 · 전체 ${all.length}건. 서버가 필요한 원본 게시판을 대신하는, 이 기기에만 저장되는 로컬 게시판입니다.`, `${filterLabel()} · ${S.page}/${pages}ページ · 全${all.length}件。この掲示板は端末内にのみ保存されます。`, `${filterLabel()} · Page ${S.page}/${pages} · ${all.length} posts. This board is stored only on this device.`)}</p>
</section>${disclaimer()}`;
}

function post(id) {
  const listAll = sortedPosts();
  const idx = listAll.findIndex(p => p.id == id);
  if (idx < 0) return `<section class="bd"><div class="bdDetailTop"><b>게시물</b><button class="bBtn" data-go="board">새로고침</button></div><p class="bempty">글이 존재하지 않습니다.</p><div class="bdLine"></div><div style="padding:10px"><button class="bBtn" data-go="board">목록</button></div></section>`;
  const p = listAll[idx];
  const prev = listAll[idx - 1], next = listAll[idx + 1];
  const liked = likedSet().has(p.id);
  const cmts = p.comments.map((c, i) => `<li class="crow"><div class="ch">${esc(c.author)}   |   ${fmtDate(c.ts)}</div><div class="cb"><span data-user-content>${userText(c.body)}</span>${c.localOwner === true ? ` <button class="cdel" data-act="cdel:${p.id}:${i}" aria-label="${localized('댓글삭제')}">${localized('삭제')}</button>` : ''}</div></li>`).join('') || '';

  return `<section class="bd">
<div class="bdDetailTop"><b>게시물</b><button class="bBtn" data-go="board">새로고침</button></div>
<div class="bdMove">
  <span class="mv"><em>이전글</em><button class="pg prev" ${prev ? `data-post="${prev.id}"` : 'disabled'} aria-label="이전글"></button></span>
  <span class="mv r"><em>다음글</em><button class="pg next" ${next ? `data-post="${next.id}"` : 'disabled'} aria-label="다음글"></button></span>
</div>
<div class="bdBody">
  <div class="frow"><span class="fl">아이디 : </span><span class="fv">${esc(p.author)}</span></div>
  <div class="fdiv"></div>
  <div class="frow"><span class="fl">제   목 : </span><span class="fv">${esc(p.title)}</span></div>
  <div class="fdiv"></div>
  <div class="cbandLabel">내   용</div>
  <div class="ctext">${userText(p.body)}</div>
  <div class="cdate">${fmtDate(p.ts)}</div>
  <button class="genRec ${liked ? 'on' : ''}" data-act="rec:${p.id}">${p.likes}<br>개념글 추천</button>
  <button class="reportBtn" data-act="report:${p.id}"><i></i>신고하기</button>
  <div class="cwarn">${appMessage(`전체댓글수${p.comments.length} | 욕설이나 비방 댓글은 누군가에게 큰 상처로 남을 수 있습니다.`, `コメント数 ${p.comments.length} | 暴言や中傷のコメントは人を深く傷つけることがあります。`, `${p.comments.length} comments | Abusive comments can cause real harm.`)}</div>
  <div class="fdiv"></div>
  <ul class="crows">${cmts}</ul>
  <div class="cInput">
    <button class="cReg" data-act="cadd:${p.id}">댓글등록</button>
    <input id="cBody" placeholder="타인의 권리를 침해하거나 명예를 훼손하는 댓글은 운영원칙 및 관련 법률에 의해 제재를 받을 수 있습니다." aria-label="댓글 입력">
  </div>
</div>
</section>${disclaimer()}`;
}

function openWrite() {
  $('#modalBody').innerHTML = `<div class="bdlg">
<div class="bdlgTop"><b>글쓰기</b><button class="bdlgX" data-act="wClose" aria-label="닫기">×</button></div>
<div class="wrow"><span>아이디 : </span><b>${esc(nick())}</b></div>
<div class="wrow"><span>제   목 : </span><input id="wTitle" aria-label="제목"></div>
<div class="wLabel">내   용</div>
<div class="wBtns"><button data-act="wAddImg">본문 추가</button><button data-act="wClose">취소</button><button data-act="wSave">등록</button></div>
<textarea id="wBody" aria-label="내용"></textarea>
</div>`;
  $('#modal').showModal();
}

function openNick() {
  $('#modalBody').innerHTML = `<div class="bdlg nick">
<div class="ndlgTitle">닉네임을 설정하세요.</div>
<input id="nickIn" value="${esc(nick())}" placeholder="닉네임을 입력하세요." aria-label="닉네임">
<div class="wBtns two"><button data-act="nickSave">등록</button><button data-act="wClose">취소</button></div>
</div>`;
  $('#modal').showModal();
}

/* ---------- 아이템 : 텍스트 중심 역사 인벤토리 ---------- */
function itemsPage() {
  const cur = S.cat;
  const q = (S.iq || '').trim().toLowerCase();
  const availableItems = classicItemsForCurrentApp();
  const list = availableItems.filter(it => itemMatchesCategory(it, cur) && (!q || (`${itemDisplayName(it.ko)} ${itemDisplayName(it.en)} ${itemDisplayName(itemName(it))} ${it.text || it.plaintext || ''}`).toLowerCase().includes(q)));
  const btn = (code, label, kid) => `<button data-cat="${code == null ? 'all' : code}" class="${kid ? 'kid ' : ''}${cur === code ? 'on' : ''}">${kid ? '· ' : ''}${label}</button>`;
  const tree = CATS.map(cg => `<div>${btn(cg.code, localized(cg.label))}${(cg.kids || []).map(k => btn(k.code, localized(k.label), 1)).join('')}</div>`).join('');
  return `${backBar('home', '홈')}<div class="itemPage itemEditorial">${box(`아이템 기록 <small>${availableItems.length}개 · 클래식</small>`, `
<p class="archiveLead">클래식 아이템의 이름·가격·효과와 조합 관계를 한곳에서 확인할 수 있습니다.</p>
<div class="search"><input id="itemQ" value="${esc(S.iq || '')}" placeholder="아이템 검색" aria-label="아이템 검색"><button data-act="itemSearch">검색</button></div>
<div class="split"><nav class="tree2">${tree}</nav>
<ul class="ilist">${list.map(it => `<li><button data-item="${esc(it.cmsStableId || it.i)}">${itemImageHtml(it, 'item218Icon')}<span><b>${esc(itemDisplayName(itemName(it)))}</b><small>${esc(itemDisplayName(appLocale.getLocale() === 'en_US' ? it.ko : it.en))}${it.purchasable === false ? ' · 상점 구매 불가' : ''}</small><em>${esc(itemPriceText(it))}</em></span></button></li>`).join('') || '<li class="hint">이 분류에 아이템이 없습니다.</li>'}</ul></div>
<p class="hint">현재 조건에 맞는 아이템 ${list.length}개를 표시합니다.</p>`)}${disclaimer()}</div>`;
}

/* ---------- 빌더 : 저장 / 불러오기 ---------- */
function runePageSnapshot(value = runePageState(), source = runeData()) {
  const limits = { mark: 9, seal: 9, glyph: 9, quint: 3 };
  const used = { mark: 0, seal: 0, glyph: 0, quint: 0 };
  const clean = {};
  source.forEach(r => {
    const n = Math.max(0, Math.floor(Number(value && value[r.i]) || 0));
    const room = Math.max(0, (limits[r.slot] || 0) - (used[r.slot] || 0));
    const count = Math.min(n, room);
    if (count > 0) {
      clean[r.i] = count;
      used[r.slot] += count;
    }
  });
  return clean;
}
function runePageTotal(value, mode = runeMode()) {
  return Object.values(runePageSnapshot(value || {}, runeData(mode))).reduce((sum, count) => sum + count, 0);
}
function builderRuneSummary(build) {
  if (!build || !build.runePage || typeof build.runePage !== 'object')
    return appMessage('룬 메모만', 'ルーンのメモのみ', 'Rune notes only');
  if (build.runeMode !== 'classic')
    return appMessage('이전 룬 편성 보관 중', '以前のルーン構成を保存中', 'Older rune setup saved');
  const count = runePageTotal(build.runePage, 'classic');
  return appMessage(`클래식 룬 ${count}/30`, `クラシックルーン ${count}/30`, `Classic runes ${count}/30`);
}
function builder() {
  const slots = store.get('res3builds', []);
  const sharedBuilder = Array.isArray(window.__lolCmsShared?.builder) ? window.__lolCmsShared.builder : [];
  const sharedBuilderHtml = sharedBuilder.length ? `<section class="box"><h3 class="bar">${appMessage('공유 빌더 안내', '共有ビルドのお知らせ', 'Shared build information')}</h3><ul class="cmts">${sharedBuilder.map(entry => `<li><b data-user-content>${esc(entry.title || '')}</b><p data-user-content>${esc(entry.description || '')}</p></li>`).join('')}</ul></section>` : '';
  return `${backBar('home', '홈')}${box('빌더', `
<p class="hint">${appMessage('공략 > 룬 / 특성 화면에서 설정한 값을 슬롯에 저장합니다.', '攻略 > ルーン／マスタリー画面で設定した構成をスロットに保存します。', 'Save the setup from Guide > Runes / Masteries to a slot.')}</p>
<div class="cform"><input id="bName" placeholder="${appMessage('빌드 이름 (예: 가렌 탑)', 'ビルド名（例：ガレン トップ）', 'Build name (e.g. Garen top)')}" aria-label="${appMessage('빌드 이름', 'ビルド名', 'Build name')}"><button data-act="bSave">${appMessage('현재 룬·특성 저장', '現在のルーンとマスタリーを保存', 'Save current runes and masteries')}</button></div>
<ul class="posts">${slots.map((b, i) => `<li><b>${i + 1}</b><button data-act="bLoad:${i}"><span data-user-content>${esc(b.name)}</span><br><small>${fmtDate(b.ts)} · ${builderRuneSummary(b)} · ${appMessage(`특성 ${Number(b.total) || 0}포인트`, `マスタリー ${Number(b.total) || 0}ポイント`, `Masteries: ${Number(b.total) || 0} points`)}</small></button><small><button data-act="bDel:${i}" aria-label="${localized('삭제')}">×</button></small></li>`).join('') || `<li class="hint">${appMessage('저장된 빌드가 없습니다.', '保存されたビルドはありません。', 'No saved builds.')}</li>`}</ul>`)}${sharedBuilderHtml}${disclaimer()}`;
}

/* ---------- 용어사전 ---------- */
function termsPage() {
  const q = (S.tq || '').trim();
  const list = window.ClassicReferenceUI.filterTerms(window.ClassicReferenceUI.mergeTerms(window.__lolCmsShared?.glossary, window.__lolCmsShared?.glossaryComplete === true), q);
  return `${backBar('home', '홈')}${box('용어 사전', `
<div class="search"><input id="termQ" value="${esc(q)}" placeholder="용어 검색" aria-label="용어 검색"><button data-act="termSearch">검색</button></div>
${window.ClassicReferenceUI.renderTerms(list)}`)}${disclaimer()}`;
}

function settings() {
  const cmsStatus = window.__lolCmsDeliveryStatus || { source: 'bundled', health: 'ready', releaseId: '' };
  const cmsSourceLabel = cmsStatus.source === 'verified'
    ? '최신 콘텐츠' : '앱 내장 콘텐츠';
  const cmsHealthLabel = ({
    ready: '정상', updating: '업데이트 확인 중',
    recovered: '기본 콘텐츠 사용 중', degraded: '기본 콘텐츠 사용 중',
  })[cmsStatus.health] || '정상';
  const publicLinks = [
    externalButton('앱 소개', META.productSiteUrl),
    externalButton('공개 개인정보처리방침', META.privacyPolicyUrl),
    externalButton('이용약관', META.termsUrl),
    externalButton('문의하기', META.contactUrl),
  ].join('');
  const appLanguage = `<label class="set" for="classicAppLocale"><span>${localized('앱 언어')}</span><select id="classicAppLocale" aria-label="${localized('앱 언어')}">${appLocale.locales.map(locale => `<option value="${locale}"${appLocale.getLocale() === locale ? ' selected' : ''}>${appLocale.languageNames[locale]}</option>`).join('')}</select></label>`;
  return `${backBar('home', '홈')}<section class="legacy settings classicPreferences"><div class="preferencesHeading"><small>LOL ENCYCLOPEDIA CLASSIC</small><h2>${localized('설정')}</h2><p>${localized('음성, 콘텐츠와 커뮤니티 환경을 관리합니다.')}</p></div><h3 class="preferencesSectionTitle">${localized('콘텐츠와 소리')}</h3>
${appLanguage}
<label class="set" for="classicRecommendationOpenMode"><span>${appMessage('추천 조합 기본 표시', 'おすすめビルドの初期表示', 'Suggested build by default')}</span><select id="classicRecommendationOpenMode" aria-label="${appMessage('추천 조합 기본 표시', 'おすすめビルドの初期表示', 'Suggested build by default')}"><option value="closed"${store.get('classicRecommendationsAlwaysOpen26195', false) ? '' : ' selected'}>${appMessage('닫힘', '閉じる', 'Collapsed')}</option><option value="open"${store.get('classicRecommendationsAlwaysOpen26195', false) ? ' selected' : ''}>${appMessage('항상 펼치기', '常に展開', 'Always expanded')}</option></select></label>
<div class="cmsDelivery"><b>${localized('백과사전 콘텐츠')}</b><span>${esc(localized(cmsSourceLabel))}</span><small>${esc(localized(cmsHealthLabel))}</small></div>
${window.ClassicPickVoice?.settingsMarkup() || ''}
${window.__LOLCLASSIC_CONFIG__?.operatorTestDrafts === true ? '<button data-go="operator-drafts">로컬 Draft 편집·미리보기</button>' : ''}
<p class="hint">${localized('룬·특성·빌드 및 오프라인 게시판 데이터는 기기에 저장됩니다. 온라인 닉네임·글·댓글·추천·신고·차단·버그 신고는 커뮤니티 서버에서 처리됩니다.')}</p>
<h3 class="preferencesSectionTitle">${localized('데이터와 계정')}</h3><div class="settingsActions"><button class="card" data-act="clearCache">${localized('콘텐츠 새로 불러오기')}</button><button class="card" data-act="resetAll">${localized('기기 저장 데이터 초기화')}</button><button class="card" data-go="privacy">${localized('개인정보처리방침')}</button><button class="card" data-go="about">${localized('이 앱에 대하여')}</button>${publicLinks}</div>

${META.appVersion ? `<p class="hint">${localized('앱 버전')} ${esc(META.appVersion)}</p>` : ''}</section>${disclaimer()}`;
}

function about() {
  const publicLinks = [
    externalButton('앱 소개', META.productSiteUrl, 'publicLink'),
    externalButton('공개 이용약관', META.termsUrl, 'publicLink'),
    externalButton('문의하기', META.contactUrl, 'publicLink'),
  ].join('');
  const masteryCount = MST.branches.reduce((total, branch) => total + branch.nodes.length, 0);
  return `${backBar('settings', '설정')}<section class="classicPreferences classicAbout"><div class="preferencesHeading"><small>LOL ENCYCLOPEDIA CLASSIC</small><h2>${localized('이 앱에 대하여')}</h2></div><div class="post aboutRelease">
<section class="aboutHero"><small>LOL ENCYCLOPEDIA CLASSIC</small><h3>${localized('클래식의 기억을 다시 만나는 백과사전')}</h3><p>${localized('2012~2013년 모바일 정보 앱의 화면 구조와 감성을 현대 Android 환경에 맞게 담은 비공식 팬 프로젝트입니다.')}</p></section>
<div class="aboutStats"><span><b>${classicChampions().length}</b>${localized('클래식 챔피언')}</span><span><b>${classicItemsForCurrentApp().length}</b>${localized('아이템')}</span><span><b>${masteryCount}</b>${localized('특성')}</span><span><b>${spells.length}</b>${localized('소환사 주문')}</span><span><b>${runes.length}</b>${localized('룬')}</span></div>
<section class="aboutPanel"><h3>${localized('제공 기능')}</h3><p>${localized('챔피언·스킬·아이템·특성·소환사 주문·룬 정보를 살펴보고, 룬과 특성 편성을 기기에 저장할 수 있습니다. 익명 온라인 커뮤니티에서는 게시글·댓글·추천·신고·차단과 프로필 삭제 기능을 제공합니다.')}</p></section>
<section class="aboutPanel"><h3>${localized('자료 안내')}</h3><p>${localized('역사 자료는 참고와 보존 목적으로 제공되며 현재 게임의 수치·명칭과 다를 수 있습니다. 앱은 무료이며 광고와 인앱 결제, 이메일·비밀번호 회원가입이 없습니다.')}</p></section>
<details class="riotNotice"><summary>${localized('Riot Games 관련 고지')}</summary><p>${localized('롤 백과사전 클래식은 Riot Games의 보증·승인·후원을 받지 않습니다. Riot Games 및 관련 자산은 Riot Games, Inc.의 상표 또는 등록 상표입니다.')}</p><p lang="en">LoL Encyclopedia Classic — Unofficial Archive isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p></details>
</div><div class="publicActions">${publicLinks}</div></section>${disclaimer()}`;
}

function privacy() {
  return `${backBar('settings', '설정')}${window.ClassicDocuments.render('privacy')}${disclaimer()}`;
}
function archivedPrivacyText() {
  const developer = META.developerName || 'LOLFLIX';
  const contact = '앱 안의 문의하기 창구';
  const policyUrl = META.privacyPolicyUrl || '';
  const publicLinks = [
    externalButton('공개 방침 열기', META.privacyPolicyUrl, 'publicLink'),
    externalButton('개인정보·권리 문의', META.contactUrl, 'publicLink'),
  ].join('');
  return `${backBar('settings', '설정')}${box('개인정보처리방침', `<div class="post privacyText"><b>롤 백과사전 클래식 개인정보처리방침</b>

운영 주체: ${esc(developer)}
앱 지원: 앱 안의 문의하기 창구 이용
개인정보 문의: ${esc(contact)}
${policyUrl ? `공개 방침 URL: ${esc(policyUrl)}` : ''}

<b>1. 수집·이용·공유</b>
이메일·비밀번호 회원가입, 광고, 분석과 위치 추적은 없습니다. 온라인 커뮤니티는 닉네임, 익명 사용자 ID, 게시글·댓글·추천·신고·차단, 버그 신고 제목·본문·선택 연락처·앱 버전·기기 정보를 서버에서 처리합니다. 연락처·카메라·마이크·사진·미디어 파일 또는 공용 저장소 권한은 요청하지 않습니다.

<b>2. 기기 내부 저장</b>
온라인 커뮤니티 세션 토큰, 삭제 코드와 닉네임·익명 사용자 ID·약관 상태 같은 사용자 정보는 WebView 저장소에 보관됩니다. 룬 메모·편성, 특성·빌드 및 오프라인 게시판 데이터도 기기에 저장되며 Android 자동 백업과 기기 간 데이터 이전 대상에서 제외됩니다.

<b>3. 서버 저장과 보안</b>
앱은 Android 인터넷 권한으로 설정된 HTTPS 커뮤니티 서버에 연결합니다. 서버에는 세션 토큰과 삭제 코드의 원문 대신 해시를 저장하고 게시글·댓글·추천·신고·차단·버그 신고를 처리합니다. 승인된 공개 정책·문의·공식 출처 링크는 기기의 외부 브라우저로 엽니다.

<b>4. 보유·삭제</b>
삭제 코드는 프로필 생성 직후 한 번 표시되며 현재 Android 설정에서는 다시 표시되지 않습니다. 인증된 프로필은 앱에서 삭제할 수 있고, 따로 보관한 삭제 코드는 외부 삭제 안내 페이지에 제출할 수 있습니다. 일반 로컬 데이터 초기화나 이 기기의 커뮤니티 세션 제거만으로는 서버 프로필이 삭제되지 않습니다. 프로필 삭제 시 본인 게시글·댓글, 추천·차단 관계, 게시글 신고 연결정보, 버그 신고의 사용자 연결정보와 연락처가 제거되지만 운영상 필요한 범위에서 버그 신고의 자유입력 제목·본문·앱 버전·기기 정보 일부는 남을 수 있습니다.

<b>5. 공개 웹사이트와 외부 링크</b>
LOLFLIX가 운영하는 정적 제품 사이트에는 자체 광고·분석 추적기·계정·문의 양식이 없습니다. GitHub Pages 등 호스팅 제공자는 자체 방침에 따라 IP 주소, 브라우저 정보, 요청 시각과 같은 표준 기술 요청 정보를 처리할 수 있습니다. 외부 사이트의 정보 처리는 각 서비스의 방침을 따릅니다.

<b>6. 연령과 이용약관</b>
온라인 커뮤니티는 만 18세 이상만 이용할 수 있으며 약관 버전은 2026-09-27입니다. 게시판 읽기와 게시글·댓글·추천·신고·차단·버그 신고를 이용하려면 최신 약관에 동의해야 합니다. 프로필 삭제와 개인정보 문의는 재동의 없이 가능합니다.

시행일: ${esc(META.privacyEffectiveDate || '2026-08-02')}</div>`)}<div class="publicActions">${publicLinks}</div>${disclaimer()}`;
}

function disclaimer() {
  return `<p class="disc">비공식 팬 프로젝트 · 공식 Riot 영문 고지는 <button data-go="about">이 앱에 대하여</button>에서 확인할 수 있습니다.</p>`;
}

/* ---------- 특성 정보 ---------- */
function masteryPage() {
  return `${backBar('home', '홈')}${box(`${localized('특성 정보')} — ${localized('클래식')} (30 ${localized('포인트')})`, mstGrid(true))}${disclaimer()}`;
}

/* ---------- 소환사의 주문 정보 (클래식 참고 화면 16종) ---------- */
function spellIconSrc(sp) {
  if (sp && sp.img) return sp.img;
  if (sp && sp.imageKey) return `images/summoner_spell/${sp.imageKey}.jpg`;
  return null;
}
function originalSpellIcon(sp) { return spellIconSrc(sp); }
function spellSpriteStyle(sp) {
  const sprite = sp && sp.sprite;
  if (!sprite || !sprite.src) return null;
  const values = ['x', 'y', 'width', 'height', 'sheetWidth', 'sheetHeight'].map(k => Number(sprite[k]));
  if (!values.every(Number.isFinite) || values.some(n => n < 0) || values.slice(2).some(n => n <= 0)) return null;
  const [x, y, width, height, sheetWidth, sheetHeight] = values;
  return `width:${width}px;height:${height}px;background-image:url('${encodeURI(sprite.src)}');background-position:-${x}px -${y}px;background-size:${sheetWidth}px ${sheetHeight}px`;
}
function spellIconHtml(sp) {
  const icon = spellIconSrc(sp);
  if (icon) {
    return `<span class="spellIcon"><img src="${encodeURI(icon)}" alt="${esc(spellName(sp))}" onerror="this.parentElement.classList.add('missing');this.parentElement.textContent='?'"></span>`;
  }
  const spriteStyle = spellSpriteStyle(sp);
  if (spriteStyle) {
    return `<span class="spellIcon"><i class="spellSprite" role="img" aria-label="${esc(spellName(sp))}" style="${spriteStyle}"></i></span>`;
  }
  return '<span class="spellIcon missing" title="아이콘 없음" aria-label="아이콘 없음">?</span>';
}
function spellRowsHtml() {
  return spells.map(sp => {
    const official = appLocale.description('spells', sp);
    const description = official ? official.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '') : sp.desc;
    return `<article class="spellRow" data-classic-spell="${esc(sp.riotId)}">${spellIconHtml(sp)}<div><h4>${esc(spellName(sp))} <small>재사용 대기시간(초): ${sp.cooldown ?? '-'}</small></h4><p>${editorialText(description)}</p></div></article>`;
  }).join('');
}
function spellsPage() {
  return `${backBar('home', '홈')}<section class="spellArchive"><h3>클래식 소환사 주문 · ${spells.length}종</h3><div class="spellRows">${spellRowsHtml()}</div></section>${disclaimer()}`;
}

/* ---------- 룬 페이지 (Riot Classic/Jade 원본 53종) ---------- */
const RUNE_SLOT_DEFS = [
  ['mark', '표식', 9],
  ['seal', '인장', 9],
  ['glyph', '문양', 9],
  ['quint', '정수', 3],
];
const RUNE_PAGE_COUNT = 20;
const RUNE_SOCKET_POSITIONS = {
  mark: [[9,63],[16,56],[22,66],[6,78],[15,78],[23,82],[8,92],[18,92],[28,92]],
  seal: [[10,48],[15,38],[22,33],[28,22],[36,16],[46,11],[57,7],[61,18],[20,48]],
  glyph: [[67,7],[77,8],[89,8],[71,20],[84,17],[96,17],[79,31],[90,30],[93,43]],
  quint: [[13,19],[68,47],[35,67]],
};
const RUNE_STAT_LABELS = Object.freeze({
  FlatArmorMod: '방어력',
  FlatCritChanceMod: '치명타 확률',
  FlatCritDamageMod: '치명타 피해',
  FlatHPPoolMod: '체력',
  FlatHPRegenMod: '체력 재생',
  FlatMagicDamageMod: '주문력',
  FlatMPPoolMod: '마나',
  FlatMPRegenMod: '마나 재생',
  FlatPhysicalDamageMod: '공격력',
  FlatSpellBlockMod: '마법 저항력',
  PercentAttackSpeedMod: '공격 속도',
  PercentHPPoolMod: '체력 비율',
  rFlatArmorModPerLevel: '레벨당 방어력',
  rFlatArmorPenetrationMod: '방어구 관통력',
  rFlatGoldPer10Mod: '10초당 골드',
  rFlatHPModPerLevel: '레벨당 체력',
  rFlatHPRegenModPerLevel: '레벨당 체력 재생',
  rFlatMagicDamageModPerLevel: '레벨당 주문력',
  rFlatMagicPenetrationMod: '마법 관통력',
  rFlatMPModPerLevel: '레벨당 마나',
  rFlatMPRegenModPerLevel: '레벨당 마나 재생',
  rFlatPhysicalDamageModPerLevel: '레벨당 공격력',
  rFlatSpellBlockModPerLevel: '레벨당 마법 저항력',
  rPercentCooldownMod: '재사용 대기시간',
  rPercentCooldownModPerLevel: '레벨당 재사용 대기시간',
});
const RUNE_PERCENT_STATS = new Set([
  'FlatCritChanceMod',
  'FlatCritDamageMod',
  'PercentAttackSpeedMod',
  'PercentHPPoolMod',
  'rPercentCooldownMod',
  'rPercentCooldownModPerLevel',
]);
function runeIconPath(rune) {
  return /^images\/classic_rune\/[a-z0-9_]+\.project_jade\.png$/.test(rune?.img || '') ? rune.img : '';
}
function runeStatLabel(key) {
  if (key.startsWith('jade:')) {
    const [, scale, , label] = key.split(':');
    return `${localized(label)}${scale === 'perlevel' ? ` (${localized('레벨당')})` : ''}`;
  }
  return localized(RUNE_STAT_LABELS[key] || key);
}
function runeStatValue(key, value) {
  if (key.startsWith('jade:')) {
    const [, scale, unit] = key.split(':');
    const format = amount => `${amount > 0 ? '+' : ''}${Math.round(amount * 1000) / 1000}${unit === 'percent' ? '%' : ''}`;
    return `${format(Number(value))}${scale === 'perlevel' ? ` · ${localized('18레벨')} ${format(Number(value) * 18)}` : ''}`;
  }
  const scaled = RUNE_PERCENT_STATS.has(key) ? Number(value) * 100 : Number(value);
  const rounded = Math.round(scaled * 100) / 100;
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded}${RUNE_PERCENT_STATS.has(key) ? '%' : ''}`;
}
function runeSocketHtml(slot, index, rune) {
  const position = (RUNE_SOCKET_POSITIONS[slot] || [])[index] || [50, 50];
  const slotLabel = localized(({ mark: '빨강 표식', seal: '노랑 인장', glyph: '파랑 문양', quint: '정수' })[slot] || '룬');
  const displayRuneName = rune ? runeName(rune) : '';
  const icon = runeIconPath(rune);
  const visual = icon
    ? `<img class="runeSocketIcon" src="${esc(icon)}" alt="" aria-hidden="true" loading="lazy">`
    : '';
  const action = rune
    ? `data-rune-remove="${esc(rune.i)}"`
    : `data-rune-empty="${slot}"`;
  const label = rune
    ? `${displayRuneName} ${localized('장착됨. 눌러서 1개 해제')}`
    : `${slotLabel} ${localized('빈 소켓. 눌러서 왼쪽 선택기 열기')}`;
  return `<button type="button" class="runeSocket ${slot} ${rune ? 'filled' : 'empty'}" data-slot="${slot}" data-rune-position="${slot}-${index + 1}" ${action} style="left:${position[0]}%;top:${position[1]}%" aria-label="${esc(label)}" title="${esc(displayRuneName || slotLabel)}">${visual}</button>`;
}
function runeMode() { return 'classic'; }
function runeData(mode = runeMode()) { return mode === 'classic' ? classicRunes : []; }
function runePageNumber() {
  const value = Number(S.runePage) || 1;
  return Math.max(1, Math.min(RUNE_PAGE_COUNT, Math.round(value)));
}
function runePageKey(mode = runeMode(), page = runePageNumber()) {
  const base = mode === 'archive' ? 'res3runepageArchive' : 'res3runepageClassic';
  return page === 1 ? base : `${base}${page}`;
}
function runePageState(mode = runeMode(), page = runePageNumber()) {
  const saved = store.get(runePageKey(mode, page), null);
  if (saved && typeof saved === 'object') return saved;
  return mode === 'archive' && page === 1 ? store.get('res3runepage', {}) : {};
}
function saveRunePage(value, mode = runeMode(), page = runePageNumber()) {
  store.set(runePageKey(mode, page), value);
  if (mode === 'archive' && page === 1) store.set('res3runepage', value);
}
function runeSelectionEntries(source, selected, slot) {
  const values = [];
  source.filter(rune => rune.slot === slot).forEach(rune => {
    for (let count = 0; count < (Number(selected[rune.i]) || 0); count++) values.push(rune);
  });
  return values;
}
function runeSelectionSummary(source, selected) {
  const numeric = {};
  const choices = [];
  source.forEach(rune => {
    const count = Number(selected[rune.i]) || 0;
    if (!count) return;
    choices.push({ rune, count });
    Object.entries(rune.pageStats || {}).forEach(([key, value]) => {
      if (typeof value === 'number') numeric[key] = (numeric[key] || 0) + value * count;
    });
  });
  const total = choices.reduce((sum, choice) => sum + choice.count, 0);
  const numericLabel = Object.keys(numeric).length
    ? Object.entries(numeric).map(([key, value]) => `${runeStatLabel(key)} ${runeStatValue(key, value)}`).join(' · ')
    : (total ? `${localized('선택')} ${total}/30 · ${localized('각 룬 효과 적용 중')}` : localized('선택한 룬 없음'));
  return { choices, numeric, numericLabel, total };
}
function runeCategorySummaryHtml(source, selected, slot, label, limit) {
  const entries = source
    .filter(rune => rune.slot === slot && Number(selected[rune.i]) > 0)
    .map(rune => ({ rune, count: Number(selected[rune.i]) || 0 }));
  const used = entries.reduce((sum, entry) => sum + entry.count, 0);
  return `<section class="runeCategorySummary" data-rune-category="${slot}">
    <header><div><small>${localized('룬 분류')}</small><h4>${localized(label)}</h4></div><b>${used}/${limit}</b></header>
    <ul>${entries.map(({ rune, count }) => `<li><button data-rune-remove="${esc(rune.i)}" aria-label="${esc(runeName(rune))} ${localized('1개 해제')}"><span><b>${esc(runeName(rune))}</b><small>${esc(appLocale.description('runes', rune) || rune.text || '')}</small></span><em>×${count}</em></button></li>`).join('') || `<li class="empty">${localized('선택한 룬이 없습니다.')}</li>`}</ul>
  </section>`;
}
function runePaperPage() {
  const source = runeData();
  const sel = runePageState();
  const summary = runeSelectionSummary(source, sel);
  const inventoryQuery = (S.rq || '').trim().toLowerCase();
  const inventoryRows = source
    .filter(rune => (
      !inventoryQuery
      || `${rune.ko} ${rune.text || ''} ${runeName(rune)} ${appLocale.description('runes', rune)}`.toLowerCase().includes(inventoryQuery)
    ))
    .map(rune => {
      const count = Number(sel[rune.i]) || 0;
      const marker = ({
        ko_KR: { mark: '표', seal: '인', glyph: '문', quint: '정' },
        ja_JP: { mark: 'マ', seal: 'シ', glyph: 'グ', quint: 'エ' },
        en_US: { mark: 'M', seal: 'S', glyph: 'G', quint: 'Q' },
      })[appLocale.getLocale()]?.[rune.slot] || localized('룬').slice(0, 1);
      return `<li><button data-runei="${rune.i}"><span class="runeTextMarker" aria-hidden="true">${marker}</span><span><b>${esc(runeName(rune))}</b><small>${esc(appLocale.description('runes', rune) || rune.text || '')}</small></span><em class="${count ? 'on' : ''}">×${count}</em></button></li>`;
    })
    .join('');
  const page = runePageNumber();
  const sourceLabel = appMessage(`클래식 룬 ${source.length}종`, `クラシックルーン ${source.length}種`, `${source.length} Classic runes`);
  return `<section class="runeEditorial" aria-label="룬 페이지 편집">
<div class="runeClientTop"><div class="runeClientSearch"><input id="runePaperQ" value="${esc(S.rq || '')}" placeholder="룬 검색" aria-label="룬 자료 검색"><button data-act="runePaperSearch" aria-label="룬 검색">검색</button></div><div class="runePageTabs" aria-label="룬 페이지 선택">${Array.from({ length: RUNE_PAGE_COUNT }, (_, index) => index + 1).map(number => `<button data-runepage="${number}" class="${page === number ? 'on' : ''}" aria-label="룬 페이지 ${number}">${number}</button>`).join('')}</div><span>${page}/${RUNE_PAGE_COUNT}</span></div>
<p class="archiveLead">표식 9 · 인장 9 · 문양 9 · 정수 3의 클래식 편성 규칙과 효과 합계를 확인할 수 있습니다.</p>
<div class="runeEditorialLayout">
  <aside class="runeInventory">
    <h4>룬 자료 목록</h4>
    <div class="runeInventoryFilter"><span>모든 룬</span><b>${sourceLabel} · ${summary.total}/30</b></div>
    <ul class="runeInventoryList">${inventoryRows || '<li class="empty">검색 결과가 없습니다.</li>'}</ul>
    <button class="runeInventoryFooter" data-runeview="list">전체 자료 보기</button>
  </aside>
  <div class="runeSelectionIndex"><header class="archiveSectionHeader"><div><small>RUNE PAGE ${page}</small><h3>선택 기록</h3></div><b>${summary.total}/30</b></header><div class="runeCategoryGrid">${RUNE_SLOT_DEFS.map(def => runeCategorySummaryHtml(source, sel, ...def)).join('')}</div><div class="runeBoardActions"><button data-act="rpSave">저장</button><button data-act="rpReset">초기화</button></div></div>
  <aside class="runeClientStats runeEditorialStats">
    <h4>효과 합계</h4>
    <b class="runeTotal">${summary.total}/30</b>
    <p>${esc(summary.numericLabel)}</p>
    <dl>${summary.choices.map(({ rune, count }) => `<div><dt>${esc(appLocale.description('runes', rune) || rune.text || runeName(rune))}</dt><dd>×${count}</dd></div>`).join('') || '<div class="empty"><dt>룬을 선택하면 효과가 표시됩니다.</dt></div>'}</dl>
  </aside>
</div>
<p class="runeClientHint">자료 목록에서 항목을 누르면 추가되고, 선택 기록에서 항목을 누르면 1개 해제됩니다. 선택 결과는 효과 합계에 바로 반영됩니다.</p>
</section>`;
}
function runeListPage() {
  const slotNames = { mark: '표식', seal: '인장', glyph: '문양', quint: '정수' };
  const limits = { mark: 9, seal: 9, glyph: 9, quint: 3 };
  const slot = S.rslot || 'mark';
  const mode = runeMode();
  const source = runeData(mode);
  const sel = runePageState(mode);
  const used = t => source.filter(r => r.slot === t).reduce((t2, r) => t2 + (sel[r.i] || 0), 0);
  const q = (S.rq || '').trim().toLowerCase();
  const list = source.filter(r => r.slot === slot && (!q || `${r.ko} ${r.text || ''} ${runeName(r)} ${appLocale.description('runes', r)}`.toLowerCase().includes(q)));
  const summary = runeSelectionSummary(source, sel);
  const sourceLabel = appMessage(`클래식 룬 ${source.length}종`, `クラシックルーン ${source.length}種`, `${source.length} Classic runes`);
  const sourceHint = '성장 룬은 레벨당 수치와 18레벨 합계를 함께 표시합니다.';
  const sumLabel = summary.numericLabel;
  return `<section class="box runeTextArchive"><h2 class="bar">${localized('룬 기록')} <small>${sourceLabel}</small></h2><p class="archiveLead">${localized('클래식 룬의 이름·효과·분류와 현재 편성 합계를 확인할 수 있습니다.')}</p><div class="tabs runeTabs">${Object.keys(slotNames).map(t => `<button data-rslot="${t}" class="${slot === t ? 'on' : ''}">${localized(slotNames[t])} ${used(t)}/${limits[t]}</button>`).join('')}</div><div class="search"><input id="runeQ" value="${esc(S.rq || '')}" placeholder="${localized('룬 검색')}" aria-label="${localized('룬 검색')}"><button data-act="runeSearch">${localized('검색')}</button></div><ul class="rlist">${list.map(r => `<li><button data-runei="${r.i}"><span class="runeTextMarker" aria-hidden="true">${esc(localized(slotNames[r.slot]).slice(0, 1))}</span><span><b>${esc(runeName(r))}</b><small>${esc(appLocale.description('runes', r) || r.text || '')}</small></span><b class="qn ${sel[r.i] ? 'on' : ''}">${sel[r.i] || 0}</b></button></li>`).join('') || `<li class="hint">${localized('검색 결과가 없습니다.')}</li>`}</ul><p class="runeSum">${localized('합계')}: ${sumLabel}</p><div class="boardTop"><button data-act="rpReset">${localized('현재 페이지 초기화')}</button></div><p class="hint">${appMessage('탭 +1 · 범주가 가득하면 선택된 룬을 탭해 해제 · 길게 누르기/우클릭 −1. 편성은 이 기기에만 저장됩니다.', 'タップで+1 · 枠が埋まったら選択済みルーンをタップして外す · 長押し／右クリックで−1。構成はこの端末に保存されます。', 'Tap to add one. When a category is full, tap a selected rune to remove it. Long press or right-click to subtract one. The setup is stored on this device.')}<br>${localized(sourceHint)}</p></section>`;
}
function runesPage() {
  const mode = S.runeView || 'list';
  const controls = `<div class="runeControlStrip" aria-label="${localized('룬 화면 전환')}"><span>${appMessage(`클래식 룬 ${classicRunes.length}종`, `クラシックルーン ${classicRunes.length}種`, `${classicRunes.length} Classic runes`)}</span><button data-runeview="list" class="${mode === 'list' ? 'on' : ''}">${localized('룬 목록')}</button><button data-runeview="paper" class="${mode === 'paper' ? 'on' : ''}">${localized('페이지 편집')}</button></div>`;
  return `${backBar('home', '홈')}${controls}${mode === 'paper' ? runePaperPage() : runeListPage()}${disclaimer()}`;
}

/* ---------- 롤 클래식 안내 (라이엇 공식 발표 기반) ---------- */
function classicPage() {
  const sort = S.sort === 'rel' ? 'rel' : 'ko';
  const query = String(S.q || '').trim().toLocaleLowerCase('ko');
  const list = sortChampionsForDisplay(classicChampions().filter(c =>
    window.ClassicReferenceUI.matchesChampionSearch([c.ko, c.en, c.nick, championName(c), window.ClassicReferenceUI.championEnglishName(c)].join(' '), query, c.ko)), sort);
  const sourceLinks = (CLASSIC.sourceUrls || [])
    .map(source => externalButton(source.label, source.url, 'publicLink'))
    .join('');
  return `${backBar('home', '홈')}<section class="clsPage">
<div class="clsHead"><b>${esc(appMessage(CLASSIC.title || '리그 오브 레전드 클래식', 'リーグ・オブ・レジェンド クラシック', 'League of Legends Classic'))}</b><em>${launchDateStamp()}</em>
<small>${esc(CLASSIC.launchLabel ? appMessage(CLASSIC.launchLabel, '2026年7月30日リリース（パッチ26.15）', 'Released July 30, 2026 (Patch 26.15)') : '')}</small><small>${esc(CLASSIC.base || '')}</small></div>
<h3 class="bar">${appMessage(`클래식 챔피언 색인 ${list.length}명`, `クラシックチャンピオン索引 · ${list.length}人`, `Classic champion index · ${list.length}`)}</h3>
<div class="classicChampionSearch"><div class="classicChampionSort" role="group" aria-label="챔피언 정렬"><button data-sort="ko" aria-pressed="${sort === 'ko'}">가나다 순</button><button data-sort="rel" aria-pressed="${sort === 'rel'}">출시 순</button></div><input id="champQ" value="${esc(S.q || '')}" placeholder="초성어로 검색하세요" aria-label="챔피언 검색"></div>
${query ? championSearchRow(list) : `<div class="champGrid classicPortraitGrid">${list.map(c => `<button class="champCell cls" data-champ="${c.id}" data-classic-id="${c.id}" aria-label="${esc(championName(c))}">${pic(championListImage(c), championName(c), 'cg', c.portraitFallback)}<b class="cgName">${esc(championName(c))}</b></button>`).join('')}</div>`}
<p class="hint2">클래식 자료의 출처는 아래 공식 데이터 링크에서 확인할 수 있습니다.</p>
${sourceLinks ? `<div class="publicActions classicSources">${sourceLinks}</div>` : ''}
</section>${disclaimer()}`;
}

/* ---------- 라우터 ---------- */
function revealActiveRunePageTab() {
  const tabs = document.querySelector('.runePageTabs');
  const active = tabs?.querySelector('button.on');
  if (!tabs || !active) return;
  const tabsRect = tabs.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  if (activeRect.left < tabsRect.left) {
    tabs.scrollLeft -= tabsRect.left - activeRect.left;
  } else if (activeRect.right > tabsRect.right) {
    tabs.scrollLeft += activeRect.right - tabsRect.right;
  }
}
function render() {
  if (!booted) { $('#view').innerHTML = '<p class="hint" style="padding:34px 14px">원본 데이터를 불러오는 중…</p>'; return; }
  const v = S.view;
  const seg = v.split('/');
  let h;
  if (v === 'home') h = home();
  else if (v === 'champions') h = classicPage();
  else if (seg[0] === 'champion') h = legacy(seg[1], seg[2] || 'basic', seg[3]);
  else if (v === 'council') h = `${backBar('home', '홈')}${window.ClassicNews.councilMarkup()}${disclaimer()}`;
  else if (v === 'board') h = board();
  else if (seg[0] === 'post') h = post(seg[1]);
  else if (v === 'settings') h = settings();
  else if (v === 'operator-drafts' && window.__LOLCLASSIC_CONFIG__?.operatorTestDrafts === true) h = window.OperatorTestDrafts.markup();
  else if (v === 'privacy') h = privacy();
  else if (v === 'about') h = about();
  else if (seg[0] === 'document') h = `${backBar('settings', '설정')}${window.ClassicDocuments.render(seg[1])}${disclaimer()}`;
  else if (v === 'items') h = itemsPage();
  else if (v === 'builder') h = builder();
  else if (v === 'terms') h = termsPage();
  else if (v === 'classic') h = classicPage();
  else if (v === 'runes') h = runesPage();
  else if (v === 'mastery') h = masteryPage();
  else if (v === 'spells') h = spellsPage();
  else {
    S.view = 'home';
    if (location.hash !== '#home') history.replaceState(null, '', '#home');
    h = home();
  }
  const view = $('#view');
  const championContent = S.view.split('/')[0] === 'champion';
  view.classList.toggle('homeView', S.view === 'home');
  view.classList.toggle('classicLightContent', S.view !== 'home' && !championContent && !['settings', 'about'].includes(S.view));
  view.classList.toggle('classicChampionContent', championContent);
  view.classList.toggle('classicPreferencesContent', ['settings', 'about'].includes(S.view));
  document.body.classList.toggle('classicLightPage', view.classList.contains('classicLightContent'));
  document.body.classList.toggle('classicPreferencesPage', view.classList.contains('classicPreferencesContent'));
  view.innerHTML = h;
  appLocale.apply(view);
  window.ClassicPickVoice?.enter(championContent ? champ(seg[1]) : null);
  if (S.view === 'home' && S.tab === '영상') window.ClassicVideoPreview?.render();
  revealActiveRunePageTab();
  const championListTop = v === 'champions' ? championListScrollState.take() : null;
  window.scrollTo(0, 0);
  if (championListTop != null) {
    requestAnimationFrame(() => window.scrollTo(0, championListTop));
  }
}

function openDrawer() { $('#drawer').classList.add('open'); $('#shade').hidden = false; }
function closeDrawer() { $('#drawer').classList.remove('open'); $('#shade').hidden = true; }

function renderDrawer() {
  $('#drawer').innerHTML = Object.entries(menu).map(([s, a]) => `<h3>${s}</h3>${a.map(x => `<button data-go="${x[1]}">${x[0]}　›</button>`).join('')}`).join('');
  appLocale.apply($('#drawer'));
}
renderDrawer();
$('#menu').onclick = openDrawer;
$('#shade').onclick = closeDrawer;
$('#home').onclick = () => go('home');
$('#settings').onclick = () => go('settings');
$('#close').onclick = () => { stopChampionAudio(); itemDetailHistory.length = 0; $('#modal').close(); };
$('#modal').addEventListener('close', () => { if (!$('#modal').open) itemDetailHistory.length = 0; });
$('#home').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') go('home'); };

/* ---------- 이벤트 ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const hit = s => t.closest(s);

  const skinCard = hit('[data-open-classic-skin]');
  if (skinCard) {
    const exactId = skinCard.dataset.skinChampion;
    const owner = champions.find(row => row.riotId === exactId && classicSet.has(row.id));
    if (!owner || !window.ClassicSkinViewer) return;
    const media = {skinGroupFor(championId, skinId) {
      const group = CLASSIC_CHAMPION_MEDIA.skinGroupFor(championId, skinId);
      return group && {...group, ko:skinName(owner, group), variants:group.variants.map(variant => ({...variant, ko:skinName(owner, variant)}))};
    }};
    return window.ClassicSkinViewer.open({ media,
      championId: exactId, championName: championName(owner), skinId: skinCard.dataset.openClassicSkin });
  }

  const external = hit('[data-external]');
  if (external) {
    const url = external.dataset.external || '';
    if (!/^https:\/\//i.test(url)) return toast(appMessage('안전한 공개 주소를 확인할 수 없습니다.', '安全な公開URLを確認できません。', 'Could not verify a safe public URL.'));
    window.location.href = url;
    return;
  }
  const back = hit('[data-back]');
  if (back) return backToPrevious(back.dataset.back || 'home');
  const g = hit('[data-go]');
  if (g) {
    if (g.dataset.go === '__sum') { toast(appMessage('현재 전적 조회를 지원하지 않습니다.', '現在、戦績の検索には対応していません。', 'Match history lookup is currently unavailable.')); return; }
    if (g.dataset.go === '__sales') { toast(appMessage('현재 세일 정보를 제공하지 않습니다.', '現在、セール情報は提供していません。', 'Sale information is currently unavailable.')); return; }
    if (g.dataset.go === '__cal') { toast(appMessage('현재 일정 정보를 제공하지 않습니다.', '現在、スケジュール情報は提供していません。', 'Schedule information is currently unavailable.')); return; }
    if (g.dataset.go === 'champions' && !S.view.startsWith('champion/')) championListScrollState.clear();
    return go(g.dataset.go);
  }
  const c = hit('[data-champ]'); if (c) {
    captureChampionListScrollBeforeDetail();
    return go('champion/' + c.dataset.champ + '/basic');
  }

  const ct = hit('[data-ct]');
  if (ct) { const [id, tab, sub] = ct.dataset.ct.split(':'); return go('champion/' + id + '/' + tab + (sub != null ? '/' + sub : '')); }

  const n = hit('[data-news]'); if (n) {
    S.tab = n.dataset.news;
    if (S.tab === '영상') {
      render();
      loadLolVideos();
      return;
    }
    return render();
  }
  const p = hit('[data-post]'); if (p) return go('post/' + p.dataset.post);
  const sr = hit('[data-sort]'); if (sr) { S.sort = sr.dataset.sort; return render(); }
  const mb = hit('[data-mbranch]'); if (mb) { S.mbranch = mb.dataset.mbranch; return render(); }
  const rset = hit('[data-runeset]'); if (rset) { S.runeSet = rset.dataset.runeset; S.rq = ''; return render(); }
  const rv = hit('[data-runeview]'); if (rv) { S.runeView = rv.dataset.runeview; return render(); }
  const rsl = hit('[data-rslot]'); if (rsl) { S.rslot = rsl.dataset.rslot; return render(); }
  const rpage = hit('[data-runepage]'); if (rpage) { S.runePage = Number(rpage.dataset.runepage) || 1; return render(); }
  const runeRemove = hit('[data-rune-remove]');
  if (runeRemove) {
    const sel = runePageState();
    const key = runeRemove.dataset.runeRemove;
    if ((Number(sel[key]) || 0) > 0) {
      sel[key]--;
      if (!sel[key]) delete sel[key];
      saveRunePage(sel);
    }
    return renderPreservingScroll();
  }
  const runeEmpty = hit('[data-rune-empty]');
  if (runeEmpty) {
    S.rslot = runeEmpty.dataset.runeEmpty;
    S.runeView = 'paper';
    return renderPreservingScroll();
  }
  const rni = hit('[data-runei]');
  if (rni) {
    const source = runeData();
    const r3 = source.find(v => String(v.i) === rni.dataset.runei); if (!r3) return;
    const limits = { mark: 9, seal: 9, glyph: 9, quint: 3 };
    const sel = runePageState();
    const used = source.filter(v => v.slot === r3.slot).reduce((t, v) => t + (sel[v.i] || 0), 0);
    if (used < limits[r3.slot]) sel[r3.i] = (sel[r3.i] || 0) + 1;
    else if (sel[r3.i]) delete sel[r3.i];
    else return;
    saveRunePage(sel);
    return renderPreservingScroll();
  }
  const cat = hit('[data-cat]'); if (cat) { const code = cat.dataset.cat; S.cat = code === 'all' ? null : /^\d+$/.test(code) ? +code : code; return renderPreservingScroll(['.tree2']); }
  const pg = hit('[data-page]'); if (pg) { S.page = +pg.dataset.page; return render(); }
  const it = hit('[data-item]');
  if (it) {
    const x = itemByI[it.dataset.item]; if (!x || !itemVisibleInCurrentApp(x)) return;
    const itemModal = $('#modal');
    const itemBody = $('#modalBody');
    if (itemModal.open && it.closest('#modal') && itemBody.querySelector('.itemDetail')) {
      itemDetailHistory.push({html:itemBody.innerHTML, scrollTop:itemModal.scrollTop});
    } else {
      itemDetailHistory.length = 0;
    }
    const relationButton = target => `<button class="chip itemRelation" data-item="${esc(target.cmsStableId || target.i)}">${itemImageHtml(target, 'itemRelationIcon')}<span>${esc(itemDisplayName(itemName(target)))}</span></button>`;
    const chips = (direction, arr) => {
      if (!arr || !arr.length) return '';
      return window.ClassicReferenceUI.relationHeading(direction) + `<div class="chips itemRelations">` + arr.map(ref => {
        const t = itemByI[ref] || itemByEn[ref];
        return t ? relationButton(t)
                 : `<span class="chip off">${esc(ref)}</span>`;
      }).join('') + '</div>';
    };
    const recipeId = Number.isInteger(x.specialRecipe) && x.specialRecipe > 0 ? String(x.specialRecipe) : '';
    const recipeOrigin = recipeId && items.find(item => String(item.riotId) === recipeId);
    const recipeMarkup = recipeId
      ? `<h3 class="bar">${appMessage('변형 원본', '元のアイテム', 'Original item')}</h3><section class="itemSpecialRecipe" data-special-recipe="${recipeId}"><div class="chips itemRelations">${recipeOrigin
        ? relationButton(recipeOrigin)
        : `<span class="chip off" data-unavailable-item="${recipeId}">${appMessage(`현재 클래식 목록에 없는 원본 · ID ${recipeId}`, `現在のクラシック一覧にない元アイテム · ID ${recipeId}`, `Original item unavailable in the current Classic catalog · ID ${recipeId}`)}</span>`}</div></section>` : '';
    const variants = items.filter(item => String(item.specialRecipe) === String(x.riotId));
    const variantMarkup = variants.length
      ? `<h3 class="bar">${localized('이 아이템의 변형')}</h3><section class="itemSpecialVariants"><div class="chips itemRelations">${variants.map(relationButton).join('')}</div></section>` : '';
    const requiredChampion = String(x.requiredChampion || '');
    const matchingChampion = champions.find(champion => String(champion.riotId || '').toLowerCase() === `jade_${requiredChampion}`.toLowerCase());
    const requirementMarkup = requiredChampion
      ? `<p class="hint itemMeta itemRequiredChampion" data-required-champion="${esc(requiredChampion)}">${localized('사용 챔피언 제한:')} ${matchingChampion ? `${esc(championName(matchingChampion))} (${esc(requiredChampion)})` : esc(requiredChampion)}</p>` : '';
    const stackMarkup = Number.isInteger(x.maxStacks) && x.maxStacks > 1
      ? `<p class="hint itemMeta itemStackLimit" data-max-stacks="${x.maxStacks}">${appMessage(`최대 중첩 ${x.maxStacks}개`, `最大スタック ${x.maxStacks}`, `Maximum stacks: ${x.maxStacks}`)}</p>` : '';
    const descriptionStatus = itemDescriptionStatus(x);
    const accuracyMessage = {
      'generated-tip': appMessage('Riot 원본에 정적 효과 설명이 제공되지 않습니다.', 'Riot の原本には固定の効果説明がありません。', 'The Riot source does not provide a static effect description.'),
      'unresolved-zero': localized('원본 설명의 일부 수치가 0으로 미치환되어 실제 수치로 확정할 수 없습니다.'),
    }[descriptionStatus];
    const accuracyMarkup = accuracyMessage
      ? `<p class="hint itemMeta itemAccuracyNote" data-description-status="${descriptionStatus}">${accuracyMessage}</p>` : '';
    const effect = itemEffectText(x);
    const effectMarkup = descriptionStatus === 'generated-tip'
      ? `<h3 class="bar">${localized('아이템 효과')}</h3>${accuracyMarkup}`
      : effect ? `<h3 class="bar">${localized('아이템 효과')}</h3>${accuracyMarkup}<div class="mtxt">${localizedItemEffect(x, effect)}</div>`
        : `<p class="hint">${localized('원본 자료에 효과 설명이 없습니다.')}</p>`;
    $('#modalBody').innerHTML = `<section class="itemDetail itemEditorialDetail"><div class="imHead">${itemImageHtml(x, 'item218DetailIcon')}<div><small class="archiveEyebrow">${localized('아이템 정보')}</small><h2>${esc(itemDisplayName(itemName(x)))}</h2><p class="itemEn">${appLocale.getLocale() === 'en_US' ? '' : esc(itemDisplayName(x.en))}</p><p class="gold">${esc(itemPriceText(x))}</p>${x.priceTotal != null && x.price != null && x.priceTotal !== x.price ? `<p class="hint">${localized('조합비')} ${x.price} ${localized('골드')}</p>` : ''}${x.purchasable === false ? `<p class="hint">${localized('상점 구매 불가')}</p>` : ''}</div></div>`
      + (appLocale.getLocale() === 'ko_KR' ? window.ClassicReferenceUI.itemAliasesMarkup(x) : '')
      + effectMarkup
      + (x.unique ? `<h3 class="bar">${localized('고유 효과')}</h3><p class="mtxt">${htm(x.unique)}</p>` : '')
      + chips('components', x.req) + chips('upgrades', x.bld)
      + recipeMarkup + variantMarkup + requirementMarkup + stackMarkup
      + `<p class="hint itemMeta">${localized('분류')}: ${(x.cat || []).map(catLabel).join(' · ') || '-'}</p></section>`;
    appLocale.apply($('#modalBody'));
    if (!$('#modal').open) $('#modal').showModal();
    return;
  }
  const newsArticle = hit('[data-news-article]');
  if (newsArticle) return showNewsArticle(window.ClassicNews.article(newsArticle.dataset.newsArticle));
  const a = hit('[data-article]');
  if (a) return showNewsArticle(homeNewsForTab(S.tab)[a.dataset.article]);
  const articleRoute = hit('[data-article-route]');
  if (articleRoute) {
    if ($('#modal')?.open) $('#modal').close();
    return go(articleRoute.dataset.articleRoute);
  }

  const spellCard = hit('[data-classic-spell]');
  if (spellCard) {
    const spell = spells.find(row => row.riotId === spellCard.dataset.classicSpell);
    if (!spell) return;
    const official = appLocale.description('spells', spell);
    const localizedSpell = official ? {...spell, name:spellName(spell), detailTemplate:official.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '')} : {...spell, name:spellName(spell)};
    $('#modalBody').innerHTML = window.ClassicSpellDetails.render(localizedSpell, 1, spellIconHtml(spell));
    if (!$('#modal').open) $('#modal').showModal();
    return;
  }
  const m = hit('[data-modal]');
  if (m) { $('#modalBody').innerHTML = `<h2>${appMessage('보존 자료 안내', '保存資料のご案内', 'Archived material')}</h2><p>` + esc(m.dataset.modal) + '</p>'; return $('#modal').showModal(); }

  const mst = hit('[data-mst]');
  if (mst) {
    const nid = mst.dataset.mst;
    const node = mstById[nid]; if (!node) return;
    const pts = mstState();
    const total = Object.values(pts).reduce((t, x) => t + x, 0);
    const cur = pts[nid] || 0;
    S.masteryInfo = nid;
    if (total >= 30) { renderPreservingScroll(); return toast(appMessage('특성은 최대 30포인트까지 선택할 수 있습니다.', 'マスタリーは最大30ポイントまで選択できます。', 'You can assign up to 30 mastery points.')); }
    if (cur >= node.max) return renderPreservingScroll();
    if (masteryLowerPoints(node, pts) < node.requiredPoints) { renderPreservingScroll(); return toast(appMessage(`이 분기에 먼저 ${node.requiredPoints}포인트를 사용하세요.`, `先にこの系統に${node.requiredPoints}ポイント割り振ってください。`, `Assign ${node.requiredPoints} points to this tree first.`)); }
    if (!masteryRequirementsMet(node, pts)) { renderPreservingScroll(); return toast(appMessage('바로 위 선행 특성을 최대 랭크까지 선택하세요.', '直前の前提マスタリーを最大ランクまで選択してください。', 'Max out the prerequisite mastery immediately above.')); }
    const next = { ...pts, [nid]: cur + 1 };
    if (!masterySelectionValid(next)) { renderPreservingScroll(); return toast(appMessage('현재 조건에서는 이 특성을 선택할 수 없습니다.', '現在の条件ではこのマスタリーを選択できません。', 'This mastery cannot be selected under the current conditions.')); }
    store.set(CLASSIC_MASTERY_STATE_KEY, next);
    return renderPreservingScroll();
  }
  if (t.closest('.toggle button:not([data-act])')) {
    const b = t.closest('.toggle button');
    b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('on'));
    return b.classList.add('on');
  }

  const act = hit('[data-act]'); if (!act) return;
  const [cmd, arg, arg2] = act.dataset.act.split(':');
  const ps = loadPosts();

  if (cmd === 'write') return openWrite();
  if (cmd === 'wClose') { $('#modal').close(); return; }
  if (cmd === 'refresh') { S.page = 1; toast(appMessage('새로고침 완료', '更新しました。', 'Refreshed.')); return render(); }
  if (cmd === 'nickChange') return openNick();
  if (cmd === 'bFilter') {
    const order = ['all', 'best', 'mine'];
    S.bfilter = order[(order.indexOf(S.bfilter || 'all') + 1) % 3];
    S.page = 1; return render();
  }
  if (cmd === 'pageSearch') {
    const all = boardFilter(sortedPosts());
    const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
    const v = prompt(appMessage(`검색할 페이지를 입력하세요.(1/${pages})`, `移動するページを入力してください（1～${pages}）。`, `Enter a page number (1–${pages}).`), String(S.page));
    if (v == null) return;
    const n2 = parseInt(v, 10);
    if (!n2 || n2 < 1 || n2 > pages) return toast(appMessage('페이지 검색: 1~' + pages + ' 범위로 입력해주세요.', `1～${pages}のページ番号を入力してください。`, `Enter a page number from 1 to ${pages}.`));
    S.page = n2; return render();
  }
  if (cmd === 'nickSave') {
    const v = $('#nickIn').value.trim();
    if (!v) return toast(appMessage('닉네임을 적어주세요', 'ニックネームを入力してください。', 'Enter a nickname.'));
    store.set('res3nick', v); $('#modal').close();
    toast(appMessage(v + '으로 닉네임이 변경됐습니다.', `ニックネームを「${v}」に変更しました。`, `Nickname changed to “${v}”.`)); return render();
  }
  if (cmd === 'wAddImg') return;
  if (cmd === 'wSave') {
    const title = $('#wTitle').value.trim(), body = $('#wBody').value.trim();
    if (title.length < 3) return toast(appMessage('제목을 3글자 이상 입력해주세요.', 'タイトルを3文字以上入力してください。', 'Enter at least 3 characters for the title.'));
    if (body.length < 5) return toast(appMessage('내용을 5글자 이상 입력해주세요', '本文を5文字以上入力してください。', 'Enter at least 5 characters for the body.'));
    toast(appMessage('등록중...', '投稿中…', 'Posting…'));
    const id = Math.max(0, ...ps.map(x => x.id)) + 1;
    ps.push({ id, notice: false, localOwner: true, title, author: nick(), body, ts: Date.now(), views: 0, likes: 0, comments: [] });
    savePosts(ps); $('#modal').close();
    setTimeout(() => { toast(appMessage('등록 완료~', '投稿しました。', 'Posted.')); go('post/' + id); }, 260);
    return;
  }
  if (cmd === 'rec') {
    const L = likedSet(), pid = +arg, p2 = ps.find(x => x.id === pid);
    toast(appMessage('추천중...', 'おすすめを更新中…', 'Updating recommendation…'));
    if (L.has(pid)) { L.delete(pid); p2.likes = Math.max(0, p2.likes - 1); } else { L.add(pid); p2.likes++; }
    store.set('res3liked', [...L]); savePosts(ps); return render();
  }
  if (cmd === 'report') return toast(appMessage('이 게시판은 이 기기에만 저장되어 신고가 외부로 전송되지 않습니다.', 'この掲示板は端末内にのみ保存されるため、通報は外部に送信されません。', 'This board is stored only on this device. Reports are not sent externally.'));
  if (cmd === 'cadd') {
    const el = $('#cBody'); const body = el.value.trim();
    if (body.length < 3) return toast(appMessage('댓글을 3글자 이상 입력해주세요', 'コメントを3文字以上入力してください。', 'Enter at least 3 characters for the comment.'));
    const p2 = ps.find(x => x.id == arg);
    p2.comments.push({ localOwner: true, author: nick(), body, ts: Date.now() });
    savePosts(ps); return render();
  }
  if (cmd === 'cdel') {
    const p2 = ps.find(x => x.id == arg);
    const comment = p2 && p2.comments[+arg2];
    if (!comment || comment.localOwner !== true) return toast(appMessage('이 기기에서 작성한 댓글만 삭제할 수 있습니다.', 'この端末で書いたコメントのみ削除できます。', 'You can delete only comments written on this device.'));
    p2.comments.splice(+arg2, 1);
    savePosts(ps);
    return render();
  }

    if (cmd === 'videoPlay') return openLolVideoPlayer(arg);
  if (cmd === 'videoUpload') return uploadLolVideo();
  if (cmd === 'videoRefresh') { lolVideoLoaded = false; return loadLolVideos(true); }
  if (cmd === 'videoEdit') return editLolVideo(arg);
  if (cmd === 'videoEditSave') return saveLolVideoEdit(arg);
  if (cmd === 'videoEditCancel') {
    const videoEditModal = document.getElementById('modal');
    if (videoEditModal?.open) videoEditModal.close();
    return;
  }
  if (cmd === 'videoChange') return changeLolVideo(arg);
  if (cmd === 'videoDelete') return deleteLolVideo(arg);
  if (cmd === 'homeSearch') return runHomeSearch();
  if (cmd === 'champSearch') { S.q = $('#champQ').value; return render(); }
  if (cmd === 'onlyClassic') { S.onlyClassic = !S.onlyClassic; return render(); }
  if (cmd === 'itemSearch') { S.iq = $('#itemQ').value; return render(); }
  if (cmd === 'runeSearch') { S.rq = $('#runeQ').value; return render(); }
  if (cmd === 'runePaperSearch') { S.rq = $('#runePaperQ').value; return render(); }
  if (cmd === 'rpReset') { saveRunePage({}); return renderPreservingScroll(); }
  if (cmd === 'rpSave') { saveRunePage(runePageState()); return toast(appMessage(`룬 페이지 ${runePageNumber()}을 이 기기에 저장했습니다.`, `ルーンページ${runePageNumber()}をこの端末に保存しました。`, `Rune page ${runePageNumber()} was saved on this device.`)); }
  if (cmd === 'tipToggle') { S.showTip = (S.showTip === arg ? null : arg); render(); setTimeout(() => { const el = document.getElementById('tipBox'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60); return; }
  if (cmd === 'classicVoices') return window.ClassicVoiceLibrary.open(champ(arg));
  if (cmd === 'lore') {
    const c2 = champ(arg);
    const loreBody = $('#modalBody');
    const initialLore = window.ClassicChampionBackgrounds.render(c2);
    loreBody.innerHTML = initialLore;
    window.ClassicChampionBackgrounds.ready?.then(() => {
      if ($('#modal').open && loreBody.innerHTML === initialLore) {
        loreBody.innerHTML = window.ClassicChampionBackgrounds.render(c2);
      }
    });
    return $('#modal').showModal();
  }
  if (cmd === 'termSearch') { S.tq = $('#termQ').value; return render(); }
  if (cmd === 'sumSearch') { $('#modalBody').innerHTML = `<h2>${appMessage('전적 조회', '戦績検索', 'Match history')}</h2><p>${appMessage('현재 전적 조회를 지원하지 않습니다.', '現在、戦績の検索には対応していません。', 'Match history lookup is currently unavailable.')}</p>`; return $('#modal').showModal(); }

  if (cmd === 'runeSave') { const o = {}; document.querySelectorAll('[data-rune]').forEach(i => o[i.dataset.rune] = i.value); store.set('res3runes', o); return alert(appMessage('룬을 저장했습니다.', 'ルーンのメモを保存しました。', 'Rune notes saved.')); }
  if (cmd === 'runeLoad') { const o = store.get('res3runes', {}); document.querySelectorAll('[data-rune]').forEach(i => i.value = o[i.dataset.rune] || ''); return; }
  if (cmd === 'mstReset') { store.set(CLASSIC_MASTERY_STATE_KEY, {}); return renderPreservingScroll(); }

  if (cmd === 'bSave') {
    const name = $('#bName').value.trim(); if (!name) return alert(appMessage('빌드 이름을 입력해주세요.', 'ビルド名を入力してください。', 'Enter a build name.'));
    const pts = mstState(), total = Object.values(pts).reduce((s, x) => s + (Number(x) || 0), 0);
    const bs = store.get('res3builds', []);
    const currentRuneMode = runeMode();
    const currentRunePage = runePageNumber();
    const runePage = runePageSnapshot(runePageState(currentRuneMode, currentRunePage), runeData(currentRuneMode));
    bs.push({ schema: 4, name, ts: Date.now(), masterySource: '26.19', mastery: pts, runeMode: currentRuneMode, runePageIndex: currentRunePage, runePage, runeNotes: store.get('res3runes', {}), runeTotal: runePageTotal(runePage, currentRuneMode), total });
    store.set('res3builds', bs); return render();
  }
  if (cmd === 'bLoad') {
    const b = store.get('res3builds', [])[+arg]; if (!b) return alert(appMessage('저장된 빌드를 찾을 수 없습니다.', '保存されたビルドが見つかりません。', 'Saved build not found.'));
    if (b.masterySource === '26.19') store.set(CLASSIC_MASTERY_STATE_KEY, masterySnapshot(b.mastery || {}));
    if (b.runeMode === 'classic' && b.runePage && typeof b.runePage === 'object') {
      const savedRuneMode = b.runeMode === 'classic' ? 'classic' : 'archive';
      const savedRunePage = Math.max(1, Math.min(RUNE_PAGE_COUNT, Math.round(Number(b.runePageIndex) || 1)));
      S.runeSet = savedRuneMode;
      S.runePage = savedRunePage;
      saveRunePage(runePageSnapshot(b.runePage, runeData(savedRuneMode)), savedRuneMode, savedRunePage);
    }
    const notes = b.runeNotes || b.runes;
    if (notes && typeof notes === 'object') store.set('res3runes', notes);
    return alert(b.masterySource === '26.19'
      ? appMessage(`'${b.name}' 불러왔습니다. 룬 / 특성 화면에서 확인하세요.`, `「${b.name}」を読み込みました。ルーン／マスタリー画面で確認してください。`, `Loaded “${b.name}”. Check the Runes and Masteries screens.`)
      : appMessage(`'${b.name}'의 룬을 불러왔습니다. 이전 특성 조합은 현재 26.19 특성에 적용되지 않습니다.`, `「${b.name}」のルーンを読み込みました。以前のマスタリー構成は現在の26.19マスタリーには適用されません。`, `Loaded runes from “${b.name}”. Its older mastery setup does not apply to the current 26.19 masteries.`));
  }
  if (cmd === 'bDel') { const bs = store.get('res3builds', []); bs.splice(+arg, 1); store.set('res3builds', bs); return render(); }

  if (cmd === 'clearCache') {
    if (!('caches' in window)) return alert(appMessage('삭제할 웹 캐시가 없습니다.', '削除できるウェブキャッシュはありません。', 'There is no web cache to delete.'));
    return caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('lolclassic-')).map(key => caches.delete(key))))
      .then(() => alert(appMessage('롤 백과사전 웹 캐시를 삭제했습니다.', 'LoL百科事典のウェブキャッシュを削除しました。', 'LoL Encyclopedia web cache deleted.')));
  }
  if (cmd === 'resetAll') {
    if (!confirm(appMessage('이 기기의 로컬 닉네임, 로컬 게시판 글·댓글·추천, 룬 메모·편성, 특성, 저장한 빌드가 지워집니다. 온라인 커뮤니티 프로필과 세션은 삭제되지 않습니다. 계속할까요?', 'この端末のニックネーム、端末内掲示板の投稿・コメント・おすすめ、ルーンのメモと構成、マスタリー、保存したビルドを削除します。オンラインコミュニティのプロフィールとセッションは削除されません。続けますか？', 'This deletes the local nickname, device-only board posts, comments and recommendations, rune notes and setups, masteries, and saved builds. Your online community profile and session will remain. Continue?'))) return;
    const runePageKeys = ['res3runepage', ...['Archive', 'Classic'].flatMap(setName => (
      Array.from({ length: RUNE_PAGE_COUNT }, (_, index) => `res3runepage${setName}${index ? index + 1 : ''}`)
    ))];
    ['res3nick', 'res3posts', 'res3liked', 'res3builds', 'res3mastery', 'res3mastery2', 'res3mastery3', CLASSIC_MASTERY_STATE_KEY, 'res3runes', 'classicRecommendationsAlwaysOpen26195',
      ...runePageKeys].forEach(k => store.remove(k));
    return go('home');
  }
});

/* 글 조회수: 상세 진입 시 1회 증가 */
function bumpView(id) {
  const ps = loadPosts(), p = ps.find(x => x.id == id);
  if (p) { p.views++; savePosts(ps); }
}

document.addEventListener('contextmenu', e => {
  const mst = e.target.closest('[data-mst]');
  if (mst) {
    e.preventDefault();
    const nid = mst.dataset.mst.split(':')[0];
    const pts = mstState();
    if ((pts[nid] || 0) <= 0) return;
    const next = { ...pts, [nid]: pts[nid] - 1 };
    if (!next[nid]) delete next[nid];
    if (!masterySelectionValid(next)) return toast(appMessage('상위 특성이 사용 중이라 먼저 해제해야 합니다.', '上位のマスタリーを使用中です。先にそちらを解除してください。', 'Remove the higher-tier mastery first.'));
    store.set(CLASSIC_MASTERY_STATE_KEY, next);
    return renderPreservingScroll();
  }
  const rn = e.target.closest('[data-runei]');
  if (rn) {
    e.preventDefault();
    const sel = runePageState();
    const k = rn.dataset.runei;
    if ((sel[k] || 0) <= 0) return;
    sel[k]--; if (!sel[k]) delete sel[k];
    saveRunePage(sel);
    return renderPreservingScroll();
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'classicRecommendationOpenMode') {
    store.set('classicRecommendationsAlwaysOpen26195', e.target.value === 'open');
    return;
  }
  if (e.target.id === 'classicAppLocale') {
    if (appLocale.setLocale(e.target.value)) { renderDrawer(); render(); appLocale.apply(document.body); }
    return;
  }
  if (e.target.id === 'roleSel') { S.role = e.target.value; render(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'homeQ') return updateHomeSearchResults();
  if (e.target.id !== 'champQ') return;
  S.q = e.target.value;
  clearTimeout(window.__qT);
  window.__qT = setTimeout(() => {
    const pos = e.target.selectionStart;
    render();
    const el = $('#champQ');
    if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (_) { } }
  }, 220);
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'homeQ' && e.key === 'Enter') {
    e.preventDefault();
    runHomeSearch();
  }
  if (e.target.id === 'runePaperQ' && e.key === 'Enter') {
    e.preventDefault();
    S.rq = e.target.value;
    render();
  }
});

window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1) || 'home';
  if (v !== S.view) {
    itemDetailHistory.length = 0;
    if ($('#modal').open) $('#modal').close();
  }
  if (routeHistory.at(-1) !== v) {
    if (routeHistory.length > 1 && routeHistory.at(-2) === v) routeHistory.pop();
    else routeHistory.push(v);
  }
  championDetailReturnState.capture(S.view, v);
  if (v.startsWith('post/')) bumpView(v.split('/')[1]);
  S.view = v; render();
});

if (S.view.startsWith('post/')) bumpView(S.view.split('/')[1]);
boot();
if ('serviceWorker' in navigator && location.hostname !== 'appassets.androidplatform.net'
    && window.__LOLCLASSIC_CONFIG__?.webBeta !== true) {
  navigator.serviceWorker.register('./sw.js').catch(() => { });
}
