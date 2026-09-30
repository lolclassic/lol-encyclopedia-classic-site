(() => {
  'use strict';
  let documents = Object.create(null);
  let localizedDocuments = Object.create(null);
  const ui = {
    ko_KR: {
      titles: { product: '제품 안내', privacy: '개인정보처리방침', terms: '이용약관', deletion: '계정·데이터 삭제 안내', contact: '문의하기' },
      nav: '관련 안내', deleteShort: '데이터 삭제', missing: '안내 문서를 불러오지 못했습니다. 콘텐츠를 다시 불러와 주세요.',
      sourceLabel: '한국어 원문 · 번역을 제공하지 않는 문서',
      contactIntro: '앱 이용 중 궁금한 점이나 개선 의견을 LOLFLIX에 보내 주세요.',
      contactRecipient: '문의 내용은 앱의 보안 접수 창구로 전달되며, 이메일 주소는 표시하지 않습니다.',
      category: '문의 종류', subject: '제목', body: '내용',
      categories: ['앱 이용 문의', '오류 제보', '개선 제안', '개인정보·데이터 삭제', '권리 관련 문의'],
      subjectPlaceholder: '문의 제목을 적어 주세요', bodyPlaceholder: '문의 내용과 확인이 필요한 화면을 적어 주세요',
      secretHint: '비밀번호나 인증 코드 등 비밀 정보는 적지 마세요. 제출하면 접수번호가 표시됩니다.',
      submit: '문의 접수하기', copy: '문의 내용 복사',
      emptyError: '제목과 내용을 입력해 주세요.', subjectError: '제목은 3~100자로 입력해 주세요.',
      bodyError: '내용은 5~4,960자로 입력해 주세요.'
    },
    ja_JP: {
      titles: { product: '製品案内', privacy: 'プライバシーポリシー', terms: '利用規約', deletion: 'アカウント・データの削除', contact: 'お問い合わせ' },
      nav: '関連情報', deleteShort: 'データの削除', missing: '案内文書を読み込めませんでした。コンテンツを再読み込みしてください。',
      sourceLabel: '韓国語の原文 · 確認済みの日本語訳はありません',
      contactIntro: 'アプリについてのご質問や改善のご提案をLOLFLIXにお送りください。',
      contactRecipient: 'お問い合わせはアプリ内の安全な受付窓口に送信され、メールアドレスは表示されません。',
      category: 'お問い合わせの種類', subject: '件名', body: '内容',
      categories: ['アプリの利用', '不具合の報告', '改善の提案', '個人情報・データの削除', '権利に関するお問い合わせ'],
      subjectPlaceholder: '件名を入力してください', bodyPlaceholder: '内容と確認が必要な画面を入力してください',
      secretHint: 'パスワードや認証コードなどの秘密情報は入力しないでください。送信後に受付番号が表示されます。',
      submit: 'お問い合わせを送信', copy: '内容をコピー',
      emptyError: '件名と内容を入力してください。', subjectError: '件名は3～100文字で入力してください。',
      bodyError: '内容は5～4,960文字で入力してください。'
    },
    en_US: {
      titles: { product: 'Product information', privacy: 'Privacy Policy', terms: 'Terms of Use', deletion: 'Account and data deletion', contact: 'Contact' },
      nav: 'Related information', deleteShort: 'Delete data', missing: 'The document could not be loaded. Please reload the content.',
      sourceLabel: 'Korean original · No verified English translation is available',
      contactIntro: 'Send LOLFLIX questions about the app or suggestions for improvement.',
      contactRecipient: 'Your message is sent through the app’s secure contact channel. An email address is not displayed.',
      category: 'Type of inquiry', subject: 'Subject', body: 'Message',
      categories: ['App usage', 'Bug report', 'Improvement suggestion', 'Privacy or data deletion', 'Rights-related inquiry'],
      subjectPlaceholder: 'Enter a subject', bodyPlaceholder: 'Describe your inquiry and the screen we need to check',
      secretHint: 'Do not include passwords, verification codes, or other secrets. A receipt number appears after submission.',
      submit: 'Send inquiry', copy: 'Copy message',
      emptyError: 'Enter a subject and message.', subjectError: 'Enter a subject of 3–100 characters.',
      bodyError: 'Enter a message of 5–4,960 characters.'
    }
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const boundedText = (value, limit) => Array.from(String(value)).filter(c => c.length > 1 || !/[\ud800-\udfff]/.test(c)).join('').slice(0, limit).replace(/[\ud800-\udbff]$/, '');
  const activeLocale = () => {
    const locale = window.ClassicLocale?.getLocale?.();
    return Object.hasOwn(ui, locale) ? locale : 'ko_KR';
  };

  function routeForUrl(value) {
    if (typeof value !== 'string') return null;
    if (value === 'app://document/contact') return 'document/contact';
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https:/i.test(value)) return null;
    let url;
    try { url = new URL(value, 'https://lolclassic.github.io/lol-encyclopedia-classic-site/'); } catch { return null; }
    if (url.username || url.password || url.port || url.protocol !== 'https:') return null;
    if (url.hostname === 'github.com' && /^\/lolclassic\/lol-encyclopedia-classic-site(?:\/|$)/.test(url.pathname)) {
      return /\/issues(?:\/|$)/.test(url.pathname) ? 'document/contact' : 'document/product';
    }
    if (url.hostname !== 'lolclassic.github.io' || !/^\/lol-encyclopedia-classic-site(?:\/|$)/.test(url.pathname)) return null;
    const file = url.pathname.split('/').pop() || 'index.html';
    const slug = { 'index.html':'product', 'privacy.html':'privacy', 'terms.html':'terms', 'contact.html':'contact', 'delete-account.html':'deletion' }[file] || 'product';
    return `document/${slug}`;
  }

  function contactForm(locale) {
    const t = ui[locale];
    return `<h1>${escape(t.titles.contact)}</h1><p>${escape(t.contactIntro)}</p>
      <p class="contactRecipient">${escape(t.contactRecipient)}</p>
      <form id="classicContactForm" class="runeContactForm">
        <label for="contactCategory">${escape(t.category)}</label><select id="contactCategory" name="category">${t.categories.map((label, index) => `<option value="${escape(ui.ko_KR.categories[index])}">${escape(label)}</option>`).join('')}</select>
        <label for="contactSubject">${escape(t.subject)}</label><input id="contactSubject" name="subject" minlength="3" maxlength="100" required autocomplete="off" placeholder="${escape(t.subjectPlaceholder)}">
        <label for="contactBody">${escape(t.body)}</label><textarea id="contactBody" name="body" minlength="5" maxlength="4960" rows="10" required placeholder="${escape(t.bodyPlaceholder)}"></textarea>
        <p class="contactHint">${escape(t.secretHint)}</p>
        <div class="documentActions"><button type="submit">${escape(t.submit)}</button><button type="button" data-contact-copy>${escape(t.copy)}</button></div>
        <p id="contactStatus" class="contactStatus" role="status" aria-live="polite"></p>
      </form>`;
  }

  function render(slug = 'product') {
    const locale = activeLocale();
    const t = ui[locale];
    const name = Object.hasOwn(t.titles, slug) ? slug : 'product';
    const translated = locale !== 'ko_KR' && typeof localizedDocuments[locale]?.[name] === 'string'
      && localizedDocuments[locale][name].trim() !== '';
    let content = name === 'contact' ? contactForm(locale)
      : translated ? localizedDocuments[locale][name] : documents[name];
    if (!content) content = `<h1>${escape(t.titles[name])}</h1><p>${escape(t.missing)}</p>`;
    const sourceLabel = locale !== 'ko_KR' && name !== 'contact' && !translated && documents[name]
      ? `<p class="documentSourceLabel" lang="${locale === 'ja_JP' ? 'ja' : 'en'}">${escape(t.sourceLabel)}</p>` : '';
    const contentLanguage = locale === 'ko_KR' || sourceLabel ? 'ko' : locale === 'ja_JP' ? 'ja' : 'en';
    return `<article class="classicDocument runeParchment" data-document="${name}" aria-label="${escape(t.titles[name])}">
      <div class="documentSeal" aria-hidden="true">LOLFLIX · CLASSIC</div><div class="documentContent">${sourceLabel}<div lang="${contentLanguage}">${content}</div></div>
      <nav class="documentActions" aria-label="${escape(t.nav)}"><button data-go="document/product">${escape(t.titles.product)}</button><button data-go="document/terms">${escape(t.titles.terms)}</button><button data-go="document/privacy">${escape(t.titles.privacy)}</button><button data-go="document/deletion">${escape(t.deleteShort)}</button><button data-go="document/contact">${escape(t.titles.contact)}</button></nav>
    </article>`;
  }

  function composeContact({ category = '앱 이용 문의', subject = '', body = '', version = '', device = '' } = {}) {
    const t = ui[activeLocale()];
    const title = String(subject).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    const content = String(body).replace(/\u0000/g, '').trim();
    if (!title || !content) throw new Error(t.emptyError);
    const kind = boundedText(String(category).replace(/[\u0000-\u001f\u007f]/g, ' '), 30);
    if (title.length < 3 || title.length > 100) throw new Error(t.subjectError);
    if (content.length < 5 || content.length > 4960) throw new Error(t.bodyError);
    const fullBody = `[${kind}]\n\n${content}`;
    return { title, body: fullBody, appVersion: String(version).slice(0, 40), device: String(device).slice(0, 200),
      copyText: `${t.category}: ${kind}\n${t.subject}: ${title}\n\n${content}` };

  }

  window.ClassicDocuments = Object.freeze({ routeForUrl, render, composeContact,
    setDocuments(value) { documents = value && typeof value === 'object' ? value : Object.create(null); },
    setLocalizedDocuments(value) {
      if (value?.schemaVersion !== 1 || !value.locales || typeof value.locales !== 'object')
        throw new Error('Invalid localized document bundle');
      localizedDocuments = value.locales;
    } });
})();
