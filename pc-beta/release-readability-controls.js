(() => {
  const COMMUNITY_NOTICE = {
    id: 1,
    notice: true,
    localOwner: false,
    title: '[공지] 온라인 자유게시판 이용 안내',
    author: '운영자',
    body: '롤 백과사전 클래식 자유게시판은 익명 프로필을 사용하는 온라인 커뮤니티입니다.\n\n만 18세 이상 사용자가 2026-09-27 약관에 동의한 뒤 게시판 읽기·게시글·댓글·추천·게시글 신고·차단·버그 신고를 이용할 수 있으며, 콘텐츠는 커뮤니티 서버에서 처리됩니다. 프로필 삭제와 개인정보 문의는 최신 약관 재동의 없이 이용할 수 있습니다.\n\n개인정보나 계정 정보 등 민감한 내용을 게시글·댓글·신고 본문에 작성하지 마세요. 신고와 차단, 운영자 관리 및 프로필 삭제 절차가 적용됩니다.',
    ts: 1785398400000,
    views: 8,
    likes: 3,
    comments: [],
  };
  const NOTICE_TRANSLATIONS = {
    en_US: {
      title: '[Notice] Online Community Guide', author: 'Administrator',
      body: 'The LoL Encyclopedia Classic board is an online community that uses anonymous profiles.\n\nPeople aged 18 or older may read the board, post, comment, recommend, report posts or bugs, and block users after accepting the terms dated 2026-09-27. Community content is processed by the community server. You can delete your profile or make a privacy inquiry without accepting updated terms again.\n\nDo not put personal information, account details, or other sensitive content in posts, comments, or reports. Reports, blocks, administrator moderation, and profile deletion procedures apply.',
    },
    ja_JP: {
      title: '【お知らせ】オンライン掲示板のご案内', author: '運営者',
      body: '「LoL百科事典クラシック」の掲示板は、匿名プロフィールを使用するオンラインコミュニティです。\n\n18歳以上の方は、2026-09-27付の利用規約に同意した後、掲示板の閲覧、投稿、コメント、おすすめ、投稿や不具合の報告、ユーザーのブロックを利用できます。コンテンツはコミュニティサーバーで処理されます。プロフィールの削除とプライバシーに関するお問い合わせは、更新された規約への再同意なしで利用できます。\n\n投稿、コメント、通報の本文には、個人情報やアカウント情報などの機密情報を書かないでください。通報、ブロック、運営者による管理、プロフィール削除の手続きが適用されます。',
    },
  };
  const PAGE_COPY = {
    ko_KR: {
      builder: '빌더', saved: '개 저장됨', introBuilder: '룬·특성 조합 저장소',
      introBuilderBody: '룬 페이지와 특성 화면에서 설정한 현재 조합을 이름과 함께 저장합니다. 저장한 항목은 한눈에 비교하고 즉시 불러올 수 있습니다.',
      newBuild: '새 빌드 이름', buildExample: '예: 가렌 탑 21/9/0', buildName: '빌드 이름',
      saveCurrent: '현재 조합 저장', savedBuilds: '저장한 빌드', count: '개',
      loadBuild: '이 빌드 불러오기', delete: '삭제', noBuilds: '저장된 빌드가 없습니다.',
      noBuildsHelp: '룬과 특성을 설정한 뒤 위 버튼으로 저장하세요.',
      masteryPoints: n => `특성 ${n}포인트`, runeNotes: '룬 메모만',
      legacyRunes: '이전 룬 편성 보관 중', classicRunes: n => `클래식 룬 ${n}/30`,
      terms: '용어 사전', introTerms: '클래식 기본 용어를 빠르게 확인하세요',
      introTermsBody: '용어 이름과 설명을 분리하고, 영문 표현은 별도 표식으로 정리했습니다. 검색어는 용어와 설명 모두에 적용됩니다.',
      searchPlaceholder: '용어 또는 설명 검색', searchLabel: '용어 검색', search: '검색',
      searchResult: q => `“${q}” 검색 결과`, allTerms: '전체 용어', noTerms: '검색 결과가 없습니다.',
      noTermsHelp: '다른 검색어를 입력해 주세요.',
      unavailable: '번역을 확인할 수 없습니다.', loading: '용어 번역을 불러오는 중입니다.',
    },
    en_US: {
      builder: 'Builder', saved: ' saved', introBuilder: 'Saved Rune and Mastery Builds',
      introBuilderBody: 'Save your current rune page and mastery setup with a name. Compare saved builds and load them when needed.',
      newBuild: 'New build name', buildExample: 'Example: Garen top 21/9/0', buildName: 'Build name',
      saveCurrent: 'Save current build', savedBuilds: 'Saved builds', count: '',
      loadBuild: 'Load this build', delete: 'Delete', noBuilds: 'No saved builds yet.',
      noBuildsHelp: 'Set your runes and masteries, then use the button above to save them.',
      masteryPoints: n => `Masteries: ${n} points`, runeNotes: 'Rune notes only',
      legacyRunes: 'Earlier rune setup saved', classicRunes: n => `Classic runes ${n}/30`,
      terms: 'Glossary', introTerms: 'Quick guide to Classic terminology',
      introTermsBody: 'Browse term names and definitions. You can search names and descriptions.',
      searchPlaceholder: 'Search terms or definitions', searchLabel: 'Search glossary', search: 'Search',
      searchResult: q => `Results for “${q}”`, allTerms: 'All terms', noTerms: 'No matching terms.',
      noTermsHelp: 'Try another search.',
      unavailable: 'Translation unavailable for this entry.', loading: 'Loading glossary translations…',
    },
    ja_JP: {
      builder: 'ビルダー', saved: '件保存', introBuilder: 'ルーン・マスタリービルドの保存',
      introBuilderBody: '現在のルーンページとマスタリー構成に名前を付けて保存します。保存したビルドを比較し、必要なときに読み込めます。',
      newBuild: '新しいビルド名', buildExample: '例：ガレン トップ 21/9/0', buildName: 'ビルド名',
      saveCurrent: '現在のビルドを保存', savedBuilds: '保存したビルド', count: '件',
      loadBuild: 'このビルドを読み込む', delete: '削除', noBuilds: '保存したビルドはありません。',
      noBuildsHelp: 'ルーンとマスタリーを設定し、上のボタンで保存してください。',
      masteryPoints: n => `マスタリー ${n}ポイント`, runeNotes: 'ルーンのメモのみ',
      legacyRunes: '以前のルーン構成を保存中', classicRunes: n => `クラシックルーン ${n}/30`,
      terms: '用語集', introTerms: 'クラシックの基本用語をすばやく確認',
      introTermsBody: '用語名と説明を分けて表示します。名前と説明の両方を検索できます。',
      searchPlaceholder: '用語または説明を検索', searchLabel: '用語を検索', search: '検索',
      searchResult: q => `「${q}」の検索結果`, allTerms: 'すべての用語', noTerms: '該当する用語はありません。',
      noTermsHelp: '別のキーワードを入力してください。',
      unavailable: 'この項目の翻訳はありません。', loading: '用語の翻訳を読み込み中…',
    },
  };
  const currentLanguage = () => window.ClassicLocale?.getLocale?.() || 'ko_KR';
  const copy = () => PAGE_COPY[currentLanguage()] || PAGE_COPY.ko_KR;
  let bundledTerms = null;
  function bundledTermMap() {
    if (!bundledTerms?.size) bundledTerms = new Map(window.ClassicReferenceUI.baseTerms().map(term => [term.termKo, term]));
    return bundledTerms;
  }
  let translatedTerms = null;
  let glossaryLoadState = 'loading';
  let glossaryReady = Promise.resolve();
  if (typeof fetch === 'function') {
    glossaryReady = fetch('./data/classic-glossary-localized-26195.json').then(response => {
      if (!response.ok) throw new Error('Glossary translation asset unavailable');
      return response.json();
    }).then(data => {
      if (data.schemaVersion !== 1 || !Array.isArray(data.entries)
        || data.entries.length !== 132) throw new Error('Invalid glossary translation catalog');
      const map = new Map(data.entries.map(row => [row[0], row]));
      if (map.size !== data.entries.length || data.entries.some(row => row.length !== 4 || !row[0]
        || row.slice(1).some(value => typeof value !== 'string' || !value.trim() || /[가-힣]/.test(value))))
        throw new Error('Incomplete glossary translation catalog');
      translatedTerms = map;
      glossaryLoadState = 'ready';
    }).catch(() => { glossaryLoadState = 'failed'; }).finally(() => {
      if (typeof booted !== 'undefined' && booted && S.view === 'terms' && typeof render === 'function') render();
    });
  } else glossaryLoadState = 'failed';
  function displayTerm(term, language) {
    const effectTerm = window.ClassicSkillEffects26195?.localizedTerm?.(term, language);
    if (effectTerm) return effectTerm;
    if (language === 'ko_KR') return { title: term.termKo, description: term.description, secondary: term.termEn, translated: true };
    const source = bundledTermMap().get(term.termKo);
    const row = source?.description === term.description && translatedTerms?.get(term.termKo);
    const english = /^[^가-힣]+$/.test(term.termEn || '') ? term.termEn : '';
    return row ? {
      title: language === 'ja_JP' ? row[1] : english || row[1],
      description: language === 'ja_JP' ? row[3] : row[2],
      secondary: language === 'ja_JP' ? english : '', translated: true,
    } : { title: english || (language === 'ja_JP' ? '未翻訳の用語' : 'Untranslated term'),
      description: copy().unavailable, secondary: '', translated: false };
  }
  function matchesTermSearch(term, query) {
    const language = currentLanguage();
    const needle = String(query || '').trim().toLocaleLowerCase(language === 'ja_JP' ? 'ja' : language === 'en_US' ? 'en' : 'ko');
    if (!needle) return true;
    const translated = displayTerm(term, language);
    return [term.termKo, term.termEn, term.description, ...(term.aliases || []), translated.title, translated.description]
      .some(value => String(value || '').toLocaleLowerCase(language === 'ja_JP' ? 'ja' : language === 'en_US' ? 'en' : 'ko')
        .includes(needle));
  }
  window.ClassicGlossarySearch = Object.freeze({matches: matchesTermSearch, display: displayTerm,
    isLoading: () => glossaryLoadState === 'loading', whenReady: () => glossaryReady});
  function installReadabilityStyles() {
    if (document.getElementById('release-readability-controls-style')) return;
    const style = document.createElement('style');
    style.id = 'release-readability-controls-style';
    style.textContent = `
      .readableBuilder,.readableTerms{overflow:hidden;border-color:#76623a;background:#f2ead8;color:#241b10}
      .readableBuilder .bar,.readableTerms .bar{display:flex;align-items:center;justify-content:space-between;min-height:42px;padding:9px 11px;background:linear-gradient(#3e3527,#211c15);color:#f6e7bd;border-bottom:2px solid #b99853;font-size:15px}
      .readableBuilder .bar small,.readableTerms .bar small{color:#e8c977;font-size:10px}
      .builderIntro,.termsIntro{padding:12px;background:linear-gradient(135deg,#fffaf0,#eadbb8);border-bottom:1px solid #c5ae75}
      .builderIntro b,.termsIntro b{display:block;margin-bottom:5px;color:#36240e;font-size:14px}
      .builderIntro p,.termsIntro p{margin:0;color:#665336;font-size:11px;line-height:1.65;word-break:keep-all}
      .builderComposer{padding:11px;background:#e5d5ad;border-bottom:1px solid #b99d61}
      .builderComposer label{display:block;margin-bottom:6px;color:#4c391f;font-size:11px;font-weight:800}
      .builderComposerRow{display:grid;grid-template-columns:minmax(0,1fr) 88px;gap:7px}
      .builderComposer input{width:100%;min-width:0;height:42px;padding:0 11px;border:1px solid #92784a;background:#fffdf7;color:#22180d;font-size:13px}
      .builderComposer button{height:42px;border:1px solid #21180c;background:linear-gradient(#5d4728,#342612);color:#f9e6ad;font-size:11px;font-weight:800}
      .builderSectionHead{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:#d1bc88;border-bottom:1px solid #a98c50;color:#35250f;font-size:12px}
      .builderSectionHead span{padding:2px 7px;border-radius:10px;background:#5b4526;color:#f8e7b8;font-size:9px}
      .builderCards{display:grid;gap:8px;padding:9px;background:#efe4ca}
      .buildCard{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;padding:10px;border:1px solid #b9a06b;background:#fffaf0;box-shadow:0 2px 5px rgba(76,52,19,.12)}
      .buildIndex{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#3a2a16;color:#f2d487;border:2px solid #bd9b50;font:800 12px Arial}
      .buildCardBody{min-width:0}
      .buildCardTitle{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#24170a;font-size:14px}
      .buildMeta{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
      .buildMeta span{padding:3px 6px;border:1px solid #cbb78b;border-radius:10px;background:#f4ead2;color:#604b2d;font-size:9px;line-height:1.25}
      .buildActions{display:grid;grid-template-columns:1fr 66px;gap:6px;margin-top:9px}
      .buildActions button{min-height:36px;border:1px solid #806738;background:#4a3820;color:#f8e6b6;font-size:11px;font-weight:700}
      .buildActions .deleteBuild{background:#5d2525;border-color:#8c3b3b;color:#ffd8d8}
      .emptyReadable{margin:0;padding:22px 12px;text-align:center;color:#78664a;font-size:11px;background:#fffaf0;border:1px dashed #bca474}

      .termSearchPanel{padding:10px;background:#e5d5ad;border-bottom:1px solid #b99d61}
      .termSearchPanel .search{grid-template-columns:minmax(0,1fr) 72px;padding:0;gap:7px}
      .termSearchPanel input{height:40px;padding:0 10px;border:1px solid #92784a;background:#fffdf7;color:#23180b;font-size:13px}
      .termSearchPanel button{height:40px;border:1px solid #21180c;background:#3d2e1a;color:#f7e4ac;font-weight:800}
      .termResultLine{display:flex;justify-content:space-between;margin-top:7px;color:#675335;font-size:10px}
      .termGrid{display:grid;gap:8px;padding:9px;background:#efe4ca}
      .termCard{display:grid;grid-template-columns:30px minmax(0,1fr);gap:9px;padding:10px;border:1px solid #b8a06c;background:#fffaf0;box-shadow:0 2px 4px rgba(74,49,17,.1)}
      .termCard>div{min-width:0}
      .termNumber{display:grid;place-items:center;width:28px;height:28px;border-radius:4px;background:#342716;color:#edcf82;font:800 10px Arial}
      .termTitleRow{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-height:25px}
      .termTitleRow b{color:#2b1c0b;font-size:14px;overflow-wrap:anywhere}
      .termEnglish{margin-left:auto;max-width:100%;text-align:right;overflow-wrap:anywhere;padding:2px 6px;border-radius:9px;background:#d8c18d;color:#59401e;font-size:9px;font-weight:700}
      .termCard p{margin:5px 0 0;color:#5f4c31;font-size:11px;line-height:1.7;overflow-wrap:anywhere}

      @media (min-width:640px){
        .termGrid{grid-template-columns:1fr 1fr}
        .termCard{grid-template-columns:28px minmax(0,1fr)}
      }
    `;
    document.head.appendChild(style);
  }

  function syncCommunityNotice() {
    const seedIndex = SEED_POSTS.findIndex(post => Number(post.id) === COMMUNITY_NOTICE.id);
    if (seedIndex >= 0) SEED_POSTS[seedIndex] = { ...SEED_POSTS[seedIndex], ...COMMUNITY_NOTICE };
    else SEED_POSTS.unshift({ ...COMMUNITY_NOTICE });

    const saved = store.get('res3posts', null);
    if (!Array.isArray(saved)) return;
    const existingIndex = saved.findIndex(post => Number(post.id) === COMMUNITY_NOTICE.id);
    if (existingIndex >= 0) {
      const previous = saved[existingIndex] || {};
      saved[existingIndex] = {
        ...previous,
        ...COMMUNITY_NOTICE,
        views: Number(previous.views) || COMMUNITY_NOTICE.views,
        likes: Number(previous.likes) || COMMUNITY_NOTICE.likes,
        comments: Array.isArray(previous.comments) ? previous.comments : [],
      };
    } else {
      saved.unshift({ ...COMMUNITY_NOTICE });
    }
    store.set('res3posts', saved);
  }

  // Local seed content is app-authored; translate returned display copies only.
  // loadPosts/savePosts and the online community's server records stay unchanged.
  const originalSortedPosts = sortedPosts;
  sortedPosts = function localizedSortedPosts() {
    const translation = NOTICE_TRANSLATIONS[currentLanguage()];
    return originalSortedPosts().map(post => translation && Number(post.id) === COMMUNITY_NOTICE.id
      && post.notice === true && post.title === COMMUNITY_NOTICE.title && post.body === COMMUNITY_NOTICE.body
      ? { ...post, ...translation } : post);
  };

  builder = function () {
    const c = copy();
    const language = currentLanguage();
    const slots = store.get('res3builds', []);
    const cards = slots.map((build, index) => `
      <article class="buildCard">
        <span class="buildIndex">${index + 1}</span>
        <div class="buildCardBody">
          <b class="buildCardTitle" data-user-content>${esc(build.name)}</b>
          <div class="buildMeta">
            <span>${fmtDate(build.ts)}</span>
            <span>${esc(language === 'ko_KR' ? builderRuneSummary(build)
              : !build?.runePage || typeof build.runePage !== 'object' ? c.runeNotes
                : build.runeMode !== 'classic' ? c.legacyRunes
                  : c.classicRunes(runePageTotal(build.runePage, 'classic')))}</span>
            <span>${esc(c.masteryPoints(Number(build.total) || 0))}</span>
          </div>
          <div class="buildActions">
            <button data-act="bLoad:${index}">${c.loadBuild}</button>
            <button class="deleteBuild" data-act="bDel:${index}" aria-label="${c.delete} ${index + 1}">${c.delete}</button>
          </div>
        </div>
      </article>
    `).join('');

    return `${backBar('home', '홈')}<section class="box readableBuilder">
      <h2 class="bar"><span>${c.builder}</span><small>${slots.length}${c.saved}</small></h2>
      <div class="builderIntro"><b>${c.introBuilder}</b><p>${c.introBuilderBody}</p></div>
      <div class="builderComposer">
        <label for="bName">${c.newBuild}</label>
        <div class="builderComposerRow"><input id="bName" placeholder="${c.buildExample}" aria-label="${c.buildName}"><button data-act="bSave">${c.saveCurrent}</button></div>
      </div>
      <div class="builderSectionHead"><b>${c.savedBuilds}</b><span>${slots.length}${c.count}</span></div>
      <div class="builderCards">${cards || `<p class="emptyReadable">${c.noBuilds}<br>${c.noBuildsHelp}</p>`}</div>
    </section>${disclaimer()}`;
  };

  termsPage = function () {
    const c = copy();
    const language = currentLanguage();
    const query = (S.tq || '').trim();
    const sourceTerms = window.ClassicReferenceUI.mergeTerms(window.__lolCmsShared?.glossary, window.__lolCmsShared?.glossaryComplete === true);
    const loading = language !== 'ko_KR' && glossaryLoadState === 'loading';
    const list = loading ? [] : !query ? sourceTerms : sourceTerms.filter(term => matchesTermSearch(term, query));
    const cards = list.map((term, index) => {
      const display = displayTerm(term, language);
      return `<article class="termCard"><span class="termNumber">${String(index + 1).padStart(2, '0')}</span><div><div class="termTitleRow"><b>${esc(display.title)}</b>${display.secondary ? `<span class="termEnglish">${esc(display.secondary)}</span>` : ''}</div><p>${esc(display.description)}</p></div></article>`;
    }).join('');

    return `${backBar('home', '홈')}<section class="box readableTerms">
      <h2 class="bar"><span>${c.terms}</span><small>${list.length}/${sourceTerms.length}</small></h2>
      <div class="termsIntro"><b>${c.introTerms}</b><p>${c.introTermsBody}</p></div>
      <div class="termSearchPanel"><div class="search"><input id="termQ" value="${esc(query)}" placeholder="${c.searchPlaceholder}" aria-label="${c.searchLabel}"><button data-act="termSearch">${c.search}</button></div><div class="termResultLine"><span>${query ? c.searchResult(esc(query)) : c.allTerms}</span><b>${list.length}${c.count}</b></div></div>
      <div class="termGrid">${loading ? `<p class="emptyReadable">${c.loading}</p>` : cards || `<p class="emptyReadable">${c.noTerms}<br>${c.noTermsHelp}</p>`}</div>
    </section>${disclaimer()}`;
  };

  document.addEventListener('keydown', event => {
    if (event.target.id !== 'termQ' || event.key !== 'Enter') return;
    event.preventDefault();
    S.tq = event.target.value;
    render();
  });

  syncCommunityNotice();
  installReadabilityStyles();
  window.__releaseReadabilityControlsReady = true;
})();
