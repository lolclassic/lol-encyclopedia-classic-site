(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('site-media-26201-config').textContent);
  let previous;
  function apply() {
    const language = ['ko','ja','en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
    if (language === previous) return;
    previous = language;
    const text = config.text[language], locale = config.locales[language];
    document.querySelectorAll('[data-media26201-text]').forEach(node => { node.textContent = text[node.dataset.media26201Text].replace('{duration}', config.duration); });
    document.querySelectorAll('[data-media26201-scene]').forEach(node => {
      const scene = node.dataset.media26201Scene, meta = config.files[locale + '-' + scene + '-webview.png'];
      const src = config.directory + '/' + meta.file;
      const image = node.tagName === 'IMG' ? node : node.querySelector('img');
      image.src = src; image.width = meta.width; image.height = meta.height;
      image.alt = text.scenes[scene][0] + ' · 26.20.1 · ' + text.language + ' · ' + text.scenes[scene][1];
      if (node.tagName !== 'IMG') {
        const link = node.querySelector('a'); link.href = src; link.setAttribute('aria-label', image.alt);
        node.querySelector('figcaption strong').textContent = text.scenes[scene][0];
        node.querySelector('figcaption span').textContent = text.scenes[scene][1] + ' · ' + text.language;
      }
    });
    // The video remains the original English recording in every site language.
    document.querySelector('#live-preview video').poster = config.directory + '/en_US-home-webview.png';
    document.querySelectorAll('[data-site-media-26201]').forEach(node => { node.lang = language; });
  }
  new MutationObserver(apply).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  apply();
})();
