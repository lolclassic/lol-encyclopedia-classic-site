(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassicChampionBackgrounds = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let backgrounds = new Map();
  let sourceRows = new Map();
  let localizedOverrides = new Map();
  const sourceCatalogSha256 = 'ba8578247f0665c08926ac593ba17d845ce17f87d102745d2eaaf5ac884ca87e';
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

  function setData(data) {
    if (data?.schemaVersion !== 1 || data.patch !== '26.19'
        || data.classification !== 'CLASSIC_CHAMPION_BACKGROUND_STORY'
        || data.verification?.status !== 'VERIFIED_BY_USER'
        || data.championCount !== 72 || !Array.isArray(data.champions)
        || data.champions.length !== 72) throw new Error('Invalid Classic background catalog');
    const next = new Map();
    const nextSources = new Map();
    for (const row of data.champions) {
      if (!/^[a-z]+$/.test(row?.slug || '') || !row.nameKo
          || typeof row.background !== 'string' || !row.background.trim()
          || row.verificationStatus !== 'VERIFIED_BY_USER_100_PERCENT'
          || next.has(row.slug)) throw new Error('Invalid Classic champion background');
      next.set(row.slug, row.background);
      nextSources.set(row.slug, row);
    }
    for (const supplemental of Object.values(supplementalLocales)) {
      const source = data.champions.find(row => row.slug === supplemental.sourceSlug);
      if (!source || source.sha256 !== supplemental.sourceSha256) {
        throw new Error('Localized Classic background source mismatch');
      }
    }
    backgrounds = next;
    sourceRows = nextSources;
    localizedOverrides = new Map();
  }

  function setLocalizedData(data) {
    if (data?.schemaVersion !== 1 || data.patch !== '26.19'
        || data.classification !== 'CLASSIC_CHAMPION_BACKGROUND_TRANSLATION'
        || data.sourceCatalogSha256 !== sourceCatalogSha256
        || !data.champions || Array.isArray(data.champions)
        || typeof data.champions !== 'object') {
      throw new Error('Invalid localized Classic background catalog');
    }
    const next = new Map();
    for (const [riotId, row] of Object.entries(data.champions)) {
      const source = sourceRows.get(row?.sourceSlug);
      if (!/^Jade_[A-Za-z]+$/.test(riotId) || !source
          || source.sha256 !== row.sourceSha256
          || !['ja_JP', 'en_US'].every(locale =>
            typeof row[locale]?.lore === 'string' && row[locale].lore.trim()
            && (row[locale].title === undefined || typeof row[locale].title === 'string'))) {
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

  return Object.freeze({ setData, setLocalizedData, getText, localizedTitle, localizedLore, render });
});
