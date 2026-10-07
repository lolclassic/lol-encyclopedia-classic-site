(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicChampionBackgrounds = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let backgrounds = new Map();
  let sourceRows = new Map();
  let localizedOverrides = new Map();
  let historicalSummaries = new Map();
  let activePatch = '26.19';
  const historicalCatalogSha256 = '15ef40783d82e38422adc393f141a527428855c176d508181ffbfa9a055bc761';
  const historicalIds = Object.freeze({Jade_Aatrox:266,Jade_Caitlyn:51,Jade_Irelia:39,Jade_Karma:43,Jade_Quinn:133});
  const sourceCatalogHashes = Object.freeze({
    '26.19':'ba8578247f0665c08926ac593ba17d845ce17f87d102745d2eaaf5ac884ca87e',
    '26.20':'12964f42fff28eb96e22b2744862b3b16a2f7e59ffcf7f37419aa219bb224032',
  });
  const direct2620 = Object.freeze({
    aatrox:{id:'Jade_Aatrox',source:'6b326d8bcdb61f71fc69cff147aaf8bc1377de63f2b2eb569151d3d146036392',background:'a3d30174130a1c3b6d120154e6959befb5fa7707fc6a4505a5752e7a880b9441'},
    caitlyn:{id:'Jade_Caitlyn',source:'e0b1b9835d80e684033884051e937aea018d5fd34d87e1458fc12fce58384f4f',background:'1708f1ef9229328f631bb3db795afa3107c2f82c2efd330ae888834a8b7ef0f8'},
    irelia:{id:'Jade_Irelia',source:'4f881ed7c7284a1df89c24e0a9e708e64e66774d16fd4bd97b5363a93400130f',background:'31eb889b057f7cb620a6bddcaeb3aa698a1c9b02207cb4666232a22e4168e908'},
    karma:{id:'Jade_Karma',source:'32a15bf96c3242d298675dca4a3fcd73d805a21a1f2819c4941ce94a21662ef6',background:'31eb889b057f7cb620a6bddcaeb3aa698a1c9b02207cb4666232a22e4168e908'},
    quinn:{id:'Jade_Quinn',source:'04fb0caff5ee015d19c6b6e5fe96f2e9a60437e7e27df31ccfb28430d9606d40',background:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'},
  });
  // Editorial translations of user-verified Korean Classic backgrounds that
  // are missing from the bundled 16.19.1 Japanese and English catalog.
  // Riot champion pages below verify current terminology, not the story text.
  const supplementalLocales = Object.freeze({
    Jade_Fizz: Object.freeze({
      sourceSlug: 'fizz',
      sourceSha256: '1c5a6145fd30d61eead5e8c59d22cb7ea4b9773692ac2c6f44c040f578b20cb2',
      terminologySource: 'https://www.leagueoflegends.com/ja-jp/champions/fizz/',
      ja_JP: Object.freeze({
        title: '波間のトリックスター',
        lore: `何百年も前、海の底で暮らす一族が海底山脈の下に秘密の都市を築いた。山々は天然の要塞となり、外敵を寄せ付けない。皆が安全で豊かな暮らしを喜ぶ中、好奇心旺盛なフィズだけは外の世界へ冒険に出た。危険に遭っても機転で切り抜け、経験を重ねるうちに、いたずら好きの若者は頼もしい戦士へと成長した。

ある日、冒険から戻った彼を迎えたのは、誰もいない故郷だった。仲間は痕跡ひとつ残さず消え、守るものも残っていない。フィズは魔法のトライデントだけを手に、廃墟となった都市を後にした。

幼いころに培った生き抜く術を頼りに何年も海をさまよった末、ビルジウォーターの港にたどり着く。陸で暮らす生き物に心を奪われた彼は、島の人々の暮らしに首を突っ込むようになった。いたずらが騒ぎを呼び、ついには怒った住民たちが彼を捕まえようとする。

居場所を失ったフィズが海へ戻ろうとしたその時、竜を思わせる巨大なサメが港を襲った。フィズは弱点を見抜き、知恵を使って怪物を退ける。住民たちは彼に感謝し、英雄として迎え入れた。新たな故郷を守るため、フィズはリーグ・オブ・レジェンドに加わった。ミス・フォーチュンも、熟練の船乗りでさえフィズにはかなわないと認め、彼が味方であることを喜んでいる。`,
      }),
      en_US: Object.freeze({
        title: 'the Tidal Trickster',
        lore: `Centuries ago, a people of the deep built a hidden city beneath an undersea mountain range. The mountains kept intruders away, allowing the city to prosper in safety. Fizz, however, was too curious to stay behind its walls. He ventured out whenever he could, using his wit to escape danger. Each journey sharpened his skills until the mischievous explorer became a formidable fighter.

One day Fizz returned to find his city abandoned. His people had vanished without a trace, and nothing remained for him to protect. Taking only a magical trident, he left the ruins of his home.

For years he wandered the ocean, surviving with the skills he had learned as a child. At last he reached the port of Bilgewater. Fascinated by the creatures who lived on land, he began meddling in the islanders' affairs. His pranks caused enough trouble that the angry residents resolved to catch him.

Fizz was about to abandon the place he had grown fond of when a huge, dragonlike shark attacked the harbor. He spotted the creature's weakness and defeated it through quick thinking. The people who had chased him now welcomed him as a hero. Fizz stayed in Bilgewater and joined the League of Legends to serve his new home. Miss Fortune considers even its veteran sailors outmatched by Fizz, and is glad he fights on their side.`,
      }),
    }),
    Jade_Graves: Object.freeze({
      sourceSlug: 'graves',
      sourceSha256: '9a62eca03f870af65e9a47bf7bde85048ea73d0b7393ecc603ee60eca45546f6',
      terminologySource: 'https://www.leagueoflegends.com/ja-jp/champions/graves/',
      ja_JP: Object.freeze({
        title: '無法者',
        lore: `賭博、犯罪、酒、裏切り、そして復讐。マルコム・グレイブスの人生を語るには、そんな言葉がふさわしい。生まれたばかりの彼はビルジウォーターの酒場の奥に置き去りにされ、そばには酒の混じったミルク瓶だけが残された。海賊が集まる貧しい街で盗みをしながら育った彼は、新たな人生を求めて本土行きの船に忍び込む。しかし海を渡っても運は開けず、各地の裏社会を渡り歩き、仕事がまずくなるたびに国境を越えて逃げる日々を送った。

大金のかかったポーカーの席で、グレイブスはツイステッド・フェイトと出会う。互いに騙し合った末、二人が最後に示した手は同じエースのフォーカードだった。好敵手を見つけた二人は手を組み、合図を交わして賭けに勝ち、追っ手をまいて逃げた。カードもチップも賞金も手に入れたが、その仲間関係は長くは続かなかった。

グレイブスは、ゾウンの高官で実業家でもあるドクター・アレゴール・プリッグスから大金を騙し取ってしまう。仕返しを企んだプリッグスは、魔法を操りたいというツイステッド・フェイトの望みを知り、それを叶える代わりにグレイブスを引き渡せと持ちかけた。相棒との絆より長年の夢を選んだツイステッド・フェイトは、その取引を受け入れた。

プリッグスに捕らえられたグレイブスは、恐ろしい刑罰が行われる特別な監獄に送られた。何年も機会をうかがい、ゾウンの冷酷な看守たちの目を逃れて脱獄する。かつての囚人仲間から紹介された風変わりな銃職人に、望みどおりの強力なショットガンを造ってもらった。プリッグスへの復讐を果たした今、彼が追うのはかつての相棒だ。二人の決着をつけるため、グレイブスはリーグ・オブ・レジェンドに加わった。監獄で過ごした長い時間は、復讐の計画を練るのに十分だった。`,
      }),
      en_US: Object.freeze({
        title: 'the Outlaw',
        lore: `Gambling, crime, drink, betrayal, and revenge have shaped Malcolm Graves's life. He was abandoned as a newborn in the back room of a Bilgewater tavern, with only a bottle of milk mixed with liquor beside him. He grew up stealing in its poor pirate quarter, then stowed away on a ship bound for the mainland in search of a better life. Crossing the sea changed little. He moved from one criminal haunt to another, fleeing across borders whenever a job went wrong.

At a high stakes poker table, Graves met Twisted Fate. Each tried to outwit the other, and both revealed the same four aces on the final hand. They recognized a worthy rival and became partners. With secret signals and well timed escapes, they swept up chips, cards, and winnings wherever they played. One disastrous mistake ended their partnership.

Graves swindled a large sum from Dr. Aregor Priggs, a Zaunite official and businessman whose influence he had failed to recognize. Priggs sought revenge. Knowing that Twisted Fate longed to command magic, he offered to fulfill that ambition in exchange for Graves. Twisted Fate valued his partner, but chose his lifelong dream and surrendered him.

Priggs sent Graves to a special prison where the punishments were too terrible to describe. After years of waiting, Graves evaded its ruthless guards and escaped. A former fellow prisoner led him to an eccentric gunsmith, who built the powerful shotgun Graves wanted. Graves settled his score with Priggs; now he intends to confront his former partner and settle their debt. He joined the League of Legends to find Twisted Fate. The long years in prison had given him ample time to plan his revenge.`,
      }),
    }),
    Jade_Nami: Object.freeze({
      sourceSlug: 'nami',
      sourceSha256: '94b2d57f1ba20426b0e389593321881943ecf312c7eb8f872ec16d74623c96fd',
      terminologySource: 'https://www.leagueoflegends.com/ja-jp/champions/nami/',
      ja_JP: Object.freeze({
        title: '潮呼びの巫女',
        lore: `深海に暮らす民にとっても、その暗闇は恐怖の源だった。海の力を引き出せるナミは、仲間を闇から守るため、危険な使命を自ら引き受けた。水がもたらす癒やしと波の激しさを操る彼女に、マライの民の運命が託された。

その使命は、陸の世界でしか手に入らない月長石を持ち帰ることだった。月長石の光は深海の脅威を退けるが、力が続くのは百年だけ。百年目の冬至が近づくと、選ばれた潮呼びの巫女が深海から深淵の真珠を探し出し、地上の者と月長石を交換する。マライの民は、この儀式を担う者を神聖な名で呼んできた。

ところが、百年の期限が迫っても、今の世代に選ばれた者は現れなかった。民は希望を捨てずに待ったが、やがて誰かが代わりに行くしかないと分かる。そこでナミが名乗り出た。暗い深海から生きて戻れるとは誰も思わなかったが、六日間の試練を経て、彼女は真珠を携えて帰還した。民はその勇気を称え、ナミを潮呼びの巫女として認めた。

しかし水面に出たナミを待つはずの地上の者は、聖なる入り江に現れなかった。伝承にない事態を前に、彼女はただ待ち続けることをやめる。陸について知るのは物語や噂だけ。それでも波を呼び起こして陸へ上がり、月長石を自分で探し始めた。マライの民として初めて外の世界へ踏み出したナミは、使命を果たすまで故郷には戻らないと誓った。`,
      }),
      en_US: Object.freeze({
        title: 'the Tidecaller',
        lore: `Even those who live deep beneath the sea fear its darkness. Nami could draw strength from the ocean, and she volunteered for a dangerous mission to protect her people from what lurked below. She wielded the water's healing power and the force of its waves, knowing the fate of the Marai now rested with her.

Her task was to bring home a moonstone, a source of light found only in the world above the surface. Its glow kept the horrors of the deep at bay, but lasted for only a hundred years. As the winter solstice of the hundredth year approached, a chosen Tidecaller had to retrieve an abyssal pearl from the ocean floor and exchange it with a person on land for a new moonstone. The Marai gave that sacred title to the one who would carry out the ritual.

As the hundredth year drew to a close, no Tidecaller appeared. The Marai kept faith that someone would be chosen, but time was running out. Nami offered to undertake the journey herself. No one expected her to survive the darkness. Six days later, she returned with the pearl, and her people honored her courage by naming her the Tidecaller.

At the surface, however, nobody came to the sacred cove to make the exchange. The old stories had never described such a failure. Nami waited, then realized that her people's survival depended on seeking the moonstone herself. She knew the land only from tales and rumors, but summoned a wave to carry her ashore. As the first Marai to explore the world beyond the sea, she vowed not to return home until her mission was complete.`,
      }),
    }),
  });
  function localizedRow(riotId, localeCode) {
    return localizedOverrides.get(riotId)?.[localeCode]
      || (Object.prototype.hasOwnProperty.call(supplementalLocales, riotId)
        ? supplementalLocales[riotId][localeCode] : null)
      || null;
  }
  function localizedTitle(riotId, localeCode) {
    return localizedRow(riotId, localeCode)?.title || '';
  }
  function localizedLore(riotId, localeCode) {
    return localizedRow(riotId, localeCode)?.lore || '';
  }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  async function setLoreData(raw) {
    if (typeof raw !== 'string' || !globalThis.crypto?.subtle) throw new Error('Historical background integrity unavailable');
    const digest = Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))), byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== historicalCatalogSha256) throw new Error('Historical background catalog integrity mismatch');
    const data = JSON.parse(raw);
    if (data.schemaVersion !== 1 || data.patch !== '26.20'
        || data.classification !== 'HISTORICAL_CLASSIC_BACKGROUND_EDITORIAL_SUMMARY'
        || data.sourcePolicy !== 'RIOT_ARCHIVED_PRE_REWORK_LORE_SUMMARIZED'
        || data.championCount !== 5 || JSON.stringify(data.locales) !== JSON.stringify(['ko_KR','ja_JP','en_US'])
        || !data.champions || Object.keys(data.champions).length !== 5) throw new Error('Invalid historical background catalog');
    const next = new Map();
    for (const [id, championId] of Object.entries(historicalIds)) {
      const row = data.champions[id];
      const version = id === 'Jade_Karma' ? '0.152.55' : '4.20.1';
      if (row?.championId !== championId || row.classicKey !== championId + 60000
          || row.appId !== id.slice(5).toLowerCase()
          || row.source?.version !== version || row.source.locale !== 'en_US'
          || row.source.url !== 'https://ddragon.leagueoflegends.com/cdn/' + version + '/data/en_US/champion/' + id.slice(5) + '.json'
          || !['ko_KR','ja_JP','en_US'].every(locale => row.locales?.[locale]?.lore?.trim()
            && row.locales[locale].classification === 'EDITORIAL_TRANSLATION_OF_HISTORICAL_SUMMARY')) {
        throw new Error('Invalid historical background identity');
      }
      next.set(id, Object.freeze(row));
    }
    historicalSummaries = next;
    return true;
  }
  const ready = typeof globalThis.fetch === 'function'
    ? globalThis.fetch('data/classic-lore-2620.json').then(response => {
      if (!response.ok) throw new Error('Historical background catalog unavailable');
      return response.text();
    }).then(setLoreData).catch(() => false) : Promise.resolve(false);

  function setData(data) {
    if (data?.schemaVersion !== 1 || !['26.19', '26.20'].includes(data.patch)
        || data.classification !== 'CLASSIC_CHAMPION_BACKGROUND_STORY'
        || data.verification?.status !== (data.patch === '26.20' ? 'USER_VERIFIED_72_AND_DIRECT_RIOT_CLASSIC_5' : 'VERIFIED_BY_USER')
        || data.championCount !== (data.patch === '26.20' ? 77 : 72) || !Array.isArray(data.champions)
        || data.champions.length !== (data.patch === '26.20' ? 77 : 72)) throw new Error('Invalid Classic background catalog');
    const next = new Map();
    const nextSources = new Map();
    let verifiedCount = 0, directCount = 0;
    for (const row of data.champions) {
      const spec = data.patch === '26.20' ? direct2620[row?.slug] : null;
      if (!/^[a-z]+$/.test(row?.slug || '') || !row.nameKo
          || typeof row.background !== 'string'
          || (!spec && (!row.background.trim() || row.verificationStatus !== 'VERIFIED_BY_USER_100_PERCENT'))
          || next.has(row.slug)) throw new Error('Invalid Classic champion background');
      if (spec) {
        if (row.verificationStatus !== 'DIRECT_MODE_CLASSIC_SOURCE' || row.classicId !== spec.id
            || row.sourceUrl !== 'https://ddragon.leagueoflegends.com/cdn/16.20.1/data/ko_KR/mode/classic/champion/' + spec.id + '.json'
            || row.sourceSha256 !== spec.source || row.sha256 !== spec.background
            || typeof row.title !== 'string') throw new Error('Invalid direct Classic champion background');
        directCount++;
      } else verifiedCount++;
      next.set(row.slug, row.background);
      nextSources.set(row.slug, row);
    }
    if (verifiedCount !== 72 || directCount !== (data.patch === '26.20' ? 5 : 0)) {
      throw new Error('Invalid Classic background verification coverage');
    }
    for (const supplemental of Object.values(supplementalLocales)) {
      const source = data.champions.find(row => row.slug === supplemental.sourceSlug);
      if (!source || source.sha256 !== supplemental.sourceSha256) {
        throw new Error('Localized Classic background source mismatch');
      }
    }
    backgrounds = next;
    sourceRows = nextSources;
    activePatch = data.patch;
    localizedOverrides = new Map();
  }

  function setLocalizedData(data) {
    if (data?.schemaVersion !== 1 || data.patch !== activePatch
        || data.classification !== 'CLASSIC_CHAMPION_BACKGROUND_TRANSLATION'
        || data.sourceCatalogSha256 !== sourceCatalogHashes[activePatch]
        || !data.champions || Array.isArray(data.champions)
        || typeof data.champions !== 'object') {
      throw new Error('Invalid localized Classic background catalog');
    }
    const next = new Map();
    for (const [riotId, row] of Object.entries(data.champions)) {
      const source = sourceRows.get(row?.sourceSlug);
      const direct = activePatch === '26.20' ? direct2620[row?.sourceSlug] : null;
      if (!/^Jade_[A-Za-z]+$/.test(riotId) || !source
          || source.sha256 !== row.sourceSha256
          || !['ja_JP', 'en_US'].every(locale =>
            typeof row[locale]?.lore === 'string' && (direct || row[locale].lore.trim())
            && (row[locale].title === undefined || typeof row[locale].title === 'string'))
          || (direct && (riotId !== direct.id || row.sourcePolicy !== 'exact-riot-mode-classic-lore'
            || !['ja_JP','en_US'].every(locale => row[locale].sourceUrl ===
              'https://ddragon.leagueoflegends.com/cdn/16.20.1/data/' + locale + '/mode/classic/champion/' + riotId + '.json')))) {
        throw new Error(`Invalid localized Classic background: ${riotId}`);
      }
      next.set(riotId, row);
    }
    localizedOverrides = next;
  }

  function getText(slug) { return backgrounds.get(slug) || ''; }

  function render(champion) {
    const text = getText(champion?.id);
    const locale = typeof globalThis !== 'undefined' ? globalThis.ClassicLocale : null;
    const localeCode = locale?.getLocale?.();
    const language = localeCode === 'ja_JP' ? 'ja' : localeCode === 'en_US' ? 'en' : '';
    const translated = language ? localizedLore(champion?.riotId, localeCode) : '';
    const heading = `<h2>${escapeHtml(locale?.name('champions', champion) || champion?.ko || '챔피언')} · ${escapeHtml(locale?.text('배경') || '배경')}</h2>`;
    if (activePatch === '26.20' && direct2620[champion?.id]) {
      const historical = historicalSummaries.get(champion?.riotId);
      const selected = ['ko_KR','ja_JP','en_US'].includes(localeCode) ? localeCode : 'ko_KR';
      if (!historical || historical.appId !== champion.id) {
        const unavailable = selected === 'ja_JP' ? '旧設定の背景資料を読み込めませんでした。もう一度開いてください。'
          : selected === 'en_US' ? 'The archived background could not be loaded. Please open it again.'
            : '옛 설정의 배경 자료를 불러오지 못했습니다. 다시 열어 주세요.';
        return `<section class="classicDocument classicChampionLore">${heading}<p${language ? ` lang="${language}"` : ''}>${unavailable}</p></section>`;
      }
      const note = selected === 'ja_JP' ? '旧設定の要約 · Riotが保存したリワーク前の背景物語を要約・翻訳しています。'
        : selected === 'en_US' ? 'Historical summary · Summarized and translated from Riot’s archived pre-rework story.'
          : '옛 설정 요약 · Riot이 보존한 리워크 이전 배경 이야기를 요약·번역한 자료입니다.';
      const sourceLabel = selected === 'ja_JP' ? 'Riotの原文' : selected === 'en_US' ? 'Riot source' : 'Riot 원본';
      const story = historical.locales[selected].lore.split(/\n{2,}/).map(paragraph =>
        `<p${language ? ` lang="${language}"` : ''}>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
      return `<section class="classicDocument classicChampionLore" data-classic-lore-source="historical-summary">${heading}<p class="hint">${escapeHtml(note)}</p>${story}<p class="hint"><a href="${escapeHtml(historical.source.url)}" target="_blank" rel="noopener noreferrer">${sourceLabel} · ${historical.source.version}</a></p></section>`;
    }
    const paragraphs = text
      ? text.replace(/\r\n?/g, '\n').split(/\n{2,}/).map(paragraph =>
        `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('')
      : '<p>등록된 배경 자료가 없습니다.</p>';
    if (!language) return `<section class="classicDocument classicChampionLore">${heading}${paragraphs}</section>`;
    if (!translated) {
      const unavailable = localeCode === 'ja_JP' ? '背景資料がありません。' : 'Background unavailable.';
      return `<section class="classicDocument classicChampionLore">${heading}<p lang="${language}">${unavailable}</p></section>`;
    }
    const official = escapeHtml(translated.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, ''))
      .replace(/\r?\n/g, '<br>');
    return `<section class="classicDocument classicChampionLore">${heading}<p lang="${language}">${official}</p></section>`;
  }

  return Object.freeze({ setData, setLocalizedData, setLoreData, ready, getText, localizedTitle, localizedLore, render });
});
