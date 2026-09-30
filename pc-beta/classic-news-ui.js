(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicNews = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const sourceUrl = 'https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-18-notes/';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data;
  let localizedData;
  let patch2619;
  const localizedUrls = {
    ja_JP: 'https://www.leagueoflegends.com/ja-jp/news/game-updates/league-of-legends-patch-26-18-notes/',
    en_US: 'https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-18-notes/',
  };
  const sourceButtons = {
    ko_KR: 'Riot Games 공식 원문 열기',
    ja_JP: 'Riot Gamesの公式パッチノートを開く',
    en_US: 'Open Riot Games official patch notes',
  };
  const routeButtons = {
    ko_KR: '관련 화면 열기', ja_JP: '関連画面を開く', en_US: 'Open related page',
  };
  const currentVoteText = {
    ko_KR: {
      title: '의회 · 제2회 투표',
      period: '26.19 패치에서 안내 · 투표 기간 7일',
      summary: '복원할 챔피언의 스킬 구성을 포함한 6개 분야에 대한 의견을 받습니다. 투표 기간에는 답변을 변경할 수 있으며, 결과는 다음 패치노트에서 공개될 예정입니다.',
      action: '투표는 공식 리그 클라이언트의 ‘의회’ 탭에서 진행됩니다. 현재 참여 가능 여부는 클라이언트에서 확인해 주세요.',
    },
    ja_JP: {
      title: '評議会 · 第2回投票',
      period: 'パッチ26.19で案内 · 投票期間は7日間',
      summary: '次に復元するチャンピオンのスキル構成を含む6つのテーマについて意見を募ります。投票期間中は回答を変更でき、結果は次のパッチノートで発表される予定です。',
      action: '投票は公式リーグクライアントの「評議会」タブで行われます。現在も参加できるかはクライアントでご確認ください。',
    },
    en_US: {
      title: 'The Council · Second vote',
      period: 'Announced in Patch 26.19 · seven-day voting period',
      summary: 'The vote covers six topics, including which champion kit Riot should restore next. Answers can be changed while voting is open; results are planned for the next patch notes.',
      action: 'Voting takes place in The Council tab of the official League client. Check the client to see whether it is still open.',
    },
  };
  function setData(value) {
    if (value?.schemaVersion !== 1 || value.sourceScope !== 'classic-only' || value.sourceUrl !== sourceUrl
        || !Array.isArray(value.articles) || value.articles.length !== 1
        || value.articles[0].id !== 'league-classic-26-18' || value.articles[0].patch !== '26.18'
        || value.articles.some(article => article.sourceUrl !== sourceUrl || typeof article.body !== 'string' || article.route)
        || value.council?.sourceUrl !== sourceUrl || value.council.effectiveStatus !== '다음 패치 적용 예정'
        || value.council.questions?.length !== 8) throw new Error('Invalid Classic news/council source');
    for (const question of value.council.questions) {
      if (typeof question.question !== 'string' || !Array.isArray(question.options) || !question.options.length
          || question.options.some(row => typeof row.label !== 'string' || !Number.isFinite(row.percent) || row.percent < 0 || row.percent > 100)
          || Math.abs(question.options.reduce((sum, row) => sum + row.percent, 0) - 100) > .02) {
        throw new Error('Invalid council voting result');
      }
    }
    data = value;
  }
  function setLocalizedData(value) {
    if (!data || value?.schemaVersion !== 1 || value.sourceArticleId !== 'league-classic-26-18'
        || value.sourcePatch !== '26.18' || !value.locales) throw new Error('Invalid Classic news localization');
    for (const locale of ['ja_JP', 'en_US']) {
      const entry = value.locales[locale];
      if (!entry || entry.article?.sourceUrl !== localizedUrls[locale]
          || !entry.article.title || !entry.article.author || !entry.article.body
          || !entry.council?.title || !entry.council.effectiveStatus
          || entry.council.decisions?.length !== data.council.decisions.length
          || entry.council.questions?.length !== data.council.questions.length
          || entry.council.questions.some((question, index) => !question.question
            || question.options?.length !== data.council.questions[index].options.length
            || question.options.some(option => typeof option !== 'string' || !option.trim()))) {
        throw new Error('Incomplete Classic news localization: ' + locale);
      }
    }
    localizedData = value;
  }
  function setPatch2619(value) {
    const article = value?.article;
    const champions = article?.champions;
    const sections = article?.sections;
    if (value?.schemaVersion !== 1 || value.sourceScope !== 'classic-only'
        || article?.id !== 'league-classic-26-19' || article.patch !== '26.19'
        || article.sourceUrl !== 'https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-19-notes/'
        || !article.title || !article.body || !Array.isArray(champions) || champions.length !== 15
        || !Array.isArray(sections) || sections.length < 2
        || new Set(champions.map(row => row.id)).size !== champions.length
        || champions.some(row => !row.id || !row.name || !row.body || !['new', 'balance'].includes(row.kind)
          || !/^images\/[a-zA-Z0-9/_-]+\.(?:png|jpg|jpeg|webp)$/.test(row.icon))
        || sections.some(row => !row.title || !row.body)) throw new Error('Invalid Classic 26.19 article');
    for (const language of ['ja_JP', 'en_US']) {
      const entry = value.locales?.[language];
      if (!entry?.title || !entry.body || !entry.author || !entry.source
          || !entry.sourceUrl?.startsWith('https://www.leagueoflegends.com/')
          || entry.champions?.length !== champions.length || entry.sections?.length !== sections.length
          || entry.champions.some(row => !row.name || !row.body)
          || entry.sections.some(row => !row.title || !row.body)) throw new Error('Incomplete Classic 26.19 localization: ' + language);
    }
    patch2619 = value;
  }
  function locale() {
    const current = root.ClassicLocale?.getLocale?.();
    return current === 'ja_JP' || current === 'en_US' ? current : 'ko_KR';
  }
  function localized() { return localizedData?.locales?.[locale()] || null; }
  function articles() { return patch2619 ? [patch2619.article, ...(data?.articles || [])] : (data?.articles || []); }
  function article(id) { return articles().find(row => row.id === id); }
  function articleTitle(row) {
    if (row?.id === 'league-classic-26-19') return patch2619?.locales?.[locale()]?.title || row.title;
    if (row?.id === 'league-classic-26-18') return localized()?.article?.title || row.title;
    return row?.title || '';
  }
  function articleMarkup(row) {
    if (!row) return '';
    const language = locale();
    if (row.id === 'league-classic-26-19') {
      const overlay = patch2619?.locales?.[language];
      const shown = overlay || row;
      const champions = row.champions.map((champion, index) => {
        const translated = overlay?.champions[index] || champion;
        return `<section class="newsChampion"><h3><img src="${esc(champion.icon)}" alt="" width="30" height="30" loading="lazy"><span>${esc(translated.name)}</span></h3><p>${esc(translated.body)}</p></section>`;
      }).join('');
      const sections = row.sections.map((section, index) => {
        const translated = overlay?.sections[index] || section;
        return `<section class="newsPatchSection"><h3>${esc(translated.title)}</h3><p>${esc(translated.body)}</p></section>`;
      }).join('');
      return `<article class="newsArticle newsPatch2619" lang="${language.slice(0, 2)}"><h2>${esc(shown.title)}</h2><p class="newsArticleMeta">${esc(shown.author || row.author)} · ${esc(row.date)}</p><div class="newsArticleBody"><p class="newsArticleLead">${esc(shown.body)}</p><h3 class="newsChampionGroupTitle">${esc(language === 'ja_JP' ? 'チャンピオン' : language === 'en_US' ? 'Champions' : '챔피언')}</h3>${champions}${sections}</div><p class="newsArticleSource">${esc(shown.source || row.source)}</p><button class="parchSource" data-external="${esc(shown.sourceUrl || row.sourceUrl)}">${sourceButtons[language]}</button></article>`;
    }
    const overlay = row.id === 'league-classic-26-18' ? localized()?.article : null;
    const shown = overlay ? { ...row, ...overlay } : row;
    const officialUrl = overlay?.sourceUrl || sourceUrl;
    return `<article class="newsArticle" lang="${language.slice(0, 2)}"><h2>${esc(shown.title)}</h2><p class="newsArticleMeta">${esc(shown.author || '운영자')} · ${esc(shown.date || shown.createdAt || '')}</p><div class="newsArticleBody">${esc(shown.body)}</div>${row.route && /^[a-z][a-z0-9/-]*$/.test(row.route) && !row.route.startsWith('patchnote/') ? `<button data-article-route="${esc(row.route)}">${routeButtons[language]}</button>` : ''}${shown.source ? `<p class="newsArticleSource">${esc(shown.source)}</p>` : ''}${row.sourceUrl === sourceUrl ? `<button class="parchSource" data-external="${esc(officialUrl)}">${sourceButtons[language]}</button>` : ''}</article>`;
  }
  function councilMarkup() {
    const council = data.council;
    const language = locale();
    const overlay = localized()?.council;
    const officialUrl = localized()?.article.sourceUrl || sourceUrl;
    const current = patch2619 ? currentVoteText[language] : null;
    const currentUrl = patch2619?.locales?.[language]?.sourceUrl || patch2619?.article?.sourceUrl;
    const currentMarkup = current ? `<section class="councilCurrentVote"><h2>${esc(current.title)}</h2><p class="newsArticleMeta">Riot Games · ${esc(current.period)}</p><p>${esc(current.summary)}</p><p>${esc(current.action)}</p><button class="parchSource" data-external="${esc(currentUrl)}">${sourceButtons[language]}</button></section>` : '';
    return `<section class="councilPage" lang="${language.slice(0, 2)}">${currentMarkup}<h2>${esc(overlay?.title || council.title)}</h2><p class="newsArticleMeta">Riot Games · ${esc(council.date)}</p><section class="councilDecisions"><h3>${esc(overlay?.effectiveStatus || council.effectiveStatus)}</h3><ul>${council.decisions.map((text, index) => `<li>${esc(overlay?.decisions[index] || text)}</li>`).join('')}</ul></section>${council.questions.map((question, index) => `<section class="councilQuestion"><h3>${index + 1}. ${esc(overlay?.questions[index].question || question.question)}</h3><ol>${question.options.map((row, optionIndex) => `<li><span>${esc(overlay?.questions[index].options[optionIndex] || row.label)}</span><b>${row.percent.toFixed(2)}%</b><span class="councilPercentTrack" aria-hidden="true"><i style="width:${row.percent}%"></i></span></li>`).join('')}</ol></section>`).join('')}<button class="parchSource" data-external="${esc(officialUrl)}">${sourceButtons[language]}</button></section>`;
  }
  return Object.freeze({setData, setLocalizedData, setPatch2619, articles, article, articleTitle, articleMarkup, councilMarkup});
});
