/* Exact-ID presentation adapter for verified League Classic champion media. */
(function (root) {
  'use strict';
  function create(data) {
    const fail = message => { throw new Error('Classic champion media: ' + message); };
    if (!data || data.classification !== 'DIRECT_MODE_CLASSIC_MEDIA_MAP'
        || !/^\d+\.\d+\.\d+$/.test(data.version)
        || !['ko_KR', 'en_US'].includes(data.locale)) fail('invalid catalogue');
    const prefix = `https://ddragon.leagueoflegends.com/cdn/${data.version}/data/${data.locale}/mode/classic/`;
    if (data.sourceIndexUrl !== prefix + 'champion.json') fail('non-Classic index');
    if (!data.champions || typeof data.champions !== 'object') fail('missing champions');
    const map = new Map();
    for (const [id, row] of Object.entries(data.champions)) {
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(id) || row.id !== id
          || row.sourceUrl !== prefix + `champion/${id}.json`
          || !Array.isArray(row.skins)) fail('identity or source mismatch');
      const byNum = new Map();
      for (const skin of row.skins) {
        if (!Number.isInteger(skin.num) || skin.num < 0 || byNum.has(skin.num)
            || String(skin.id) !== String(Number(row.key) * 1000 + skin.num)) fail('invalid skin identity');
        byNum.set(skin.num, skin);
      }
      for (const [num, art] of Object.entries(row.skinArt || {})) {
        const skin = byNum.get(Number(num));
        const sourcePrefix = 'https://ddragon.leagueoflegends.com/cdn/img/mode/classic/champion/';
        if (!skin || Object.hasOwn(skin, 'parentSkin')
            || art.path !== `images/official_classic_skin/${id}/${num}.jpg`
            || !['loading', 'splash'].some(kind => art.sourceUrl === `${sourcePrefix}${kind}/${id}_${num}.jpg`)
            || !/^[0-9a-f]{64}$/.test(art.sha256)) fail('invalid skin artwork');
      }
      const projected = row.skins.map(skin => {
        let parent = skin;
        const seen = new Set();
        while (Object.hasOwn(parent, 'parentSkin')) {
          if (seen.has(parent.num) || !byNum.has(parent.parentSkin)) fail('invalid chroma parent');
          seen.add(parent.num);
          parent = byNum.get(parent.parentSkin);
        }
        const artwork = row.skinArt && row.skinArt[String(parent.num)];
        if (!artwork) fail('missing verified skin artwork');
        return { ...skin, classicMode: true, img: artwork.path,
          ko: skin.name === 'default' ? '기본 스킨' : (skin.name || `이름 미제공 · ${skin.id}`),
          en: '', representativePreview: parent.num !== skin.num,
          artworkSkinNum: parent.num };
      });
      for (const [spellId, art] of Object.entries(row.spellImages || {})) {
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(spellId)
            || art.path !== `images/official_classic_spell/${spellId}.png`
            || art.sourceUrl !== `https://ddragon.leagueoflegends.com/cdn/${data.version}/img/mode/classic/spell/${spellId}.png`
            || !/^[0-9a-f]{64}$/.test(art.sha256)) fail('invalid spell artwork');
      }
      const groups = projected.filter(skin => !skin.representativePreview).map(skin => ({
        ...skin, variants: [skin, ...projected.filter(variant => variant.representativePreview && variant.artworkSkinNum === skin.num)],
      }));
      // Swap only the source-labelled Classic restoration and default skin; keep every other slot intact.
      const defaultIndex = groups.findIndex(skin => skin.num === 0);
      const classicName = data.locale === 'ko_KR' ? /^클래식\s/ : /^Classic\s/;
      const restored = groups.filter(skin => classicName.test(skin.name));
      if (defaultIndex !== -1 && restored.length === 1) {
        const classicIndex = groups.indexOf(restored[0]);
        [groups[defaultIndex], groups[classicIndex]] = [groups[classicIndex], groups[defaultIndex]];
      }
      map.set(id, { skins: projected, groups, spellImages: row.spellImages || {} });
    }
    return {
      skinsFor(exactId) { return map.get(exactId)?.skins || []; },
      skinGroupsFor(exactId) { return map.get(exactId)?.groups || []; },
      skinGroupFor(exactId, skinId) {
        return map.get(exactId)?.groups.find(group => String(group.id) === String(skinId)) || null;
      },
      spellImagesFor(exactId) { return map.get(exactId)?.spellImages || {}; },
      has(exactId) { return map.has(exactId); },
      championIds() { return [...map.keys()]; },
    };
  }
  root.ClassicChampionMedia = Object.freeze({ create });
})(typeof window === 'undefined' ? globalThis : window);
