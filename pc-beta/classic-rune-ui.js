(() => {
  'use strict';
  document.body.classList.add('classicRuneRefresh');
  const svg = name => {
    const path = { prev:'m14 5-7 7 7 7', next:'m10 5 7 7-7 7', first:'M5 5v14m13-14-7 7 7 7', last:'M19 5v14M6 5l7 7-7 7' }[name];
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"></path></svg>`;
  };
  function decorate() {
    document.querySelectorAll('.pg.prev,.pg.next,.pg.first,.pg.last').forEach(button => {
      if (button.dataset.runeNavIcon) return;
      const kind = ['first','last','prev','next'].find(value => button.classList.contains(value));
      button.innerHTML = svg(kind);
      button.dataset.runeNavIcon = kind;
    });
    const rot = document.querySelector('.hmRot');
    if (rot && !rot.dataset.carouselReady) {
      rot.dataset.carouselReady = 'true';
      rot.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        // Preserve Enter/Space on individual champion buttons.
        event.preventDefault();
        const left = event.key === 'Home' ? 0 : event.key === 'End' ? rot.scrollWidth : rot.scrollLeft + (event.key === 'ArrowRight' ? 1 : -1) * rot.clientWidth;
        rot.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
      let pointer = null, moved = false;
      rot.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        pointer = { x:event.clientX, scroll:rot.scrollLeft }; moved = false;
      });
      rot.addEventListener('pointermove', event => {
        if (!pointer || !(event.buttons & 1)) return;
        const delta = event.clientX - pointer.x;
        if (Math.abs(delta) > 6) { moved = true; rot.scrollLeft = pointer.scroll - delta; event.preventDefault(); }
      });
      rot.addEventListener('pointerup', () => { pointer = null; });
      rot.addEventListener('pointercancel', () => { pointer = null; moved = false; });
      rot.addEventListener('pointerleave', () => { pointer = null; });
      rot.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopImmediatePropagation(); moved = false; } }, true);
    }
  }
  new MutationObserver(decorate).observe(document.getElementById('view'), { childList:true, subtree:true });
  decorate();

  document.addEventListener('click', event => {
    if (window.ClassicSpellDetails.handleClick(event)) event.stopImmediatePropagation();
  }, true);

  function contactFromForm(form) {
    return window.ClassicDocuments.composeContact({ category:form.elements.category.value, subject:form.elements.subject.value,
      body:form.elements.body.value, version:typeof META === 'object' ? META.appVersion : '', device:navigator.userAgent });
  }
  const CONTACT_ORIGIN = 'https://lolclassic-community-service.lolflix-7313.workers.dev';
  const contactLabels = {
    ko_KR: {
      origin:'온라인 문의 창구에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      storage:'접수 기록을 저장할 수 없습니다. 앱 저장 공간을 확인해 주세요.',
      duplicate:'같은 내용의 문의가 이미 전송되었습니다. 접수 여부를 확인할 수 없어 중복 전송하지 않았습니다. 작성 내용은 그대로 남아 있습니다.',
      http:status => `문의 접수에 실패했습니다. (HTTP ${status}) 작성 내용은 그대로 남아 있습니다.`,
      invalidId:'접수번호를 확인할 수 없습니다. 중복 접수를 막기 위해 자동으로 다시 보내지 않습니다.',
      uncertain:'문의 접수 여부를 확인할 수 없습니다. 작성 내용은 그대로 남아 있으며 자동으로 다시 보내지 않습니다.',
      sending:'문의 접수 중입니다.', accepted:id => `문의가 접수되었습니다. 접수번호: ${id}`,
      copied:'문의 내용을 복사했습니다.', copyHelp:'제목과 내용을 입력한 뒤, 길게 눌러 복사해 주세요.',
    },
    ja_JP: {
      origin:'オンラインお問い合わせ窓口に接続できません。しばらくしてからもう一度お試しください。',
      storage:'受付記録を保存できません。アプリの保存容量を確認してください。',
      duplicate:'同じ内容はすでに送信されました。受付の確認ができないため、重複送信はしません。入力内容は残っています。',
      http:status => `お問い合わせの送信に失敗しました（HTTP ${status}）。入力内容は残っています。`,
      invalidId:'受付番号を確認できません。重複を防ぐため自動再送信はしません。',
      uncertain:'受付の成否を確認できません。入力内容は残しており、自動再送信はしません。',
      sending:'お問い合わせを送信しています。', accepted:id => `お問い合わせを受け付けました。受付番号：${id}`,
      copied:'お問い合わせの内容をコピーしました。', copyHelp:'件名と内容を入力してから、長押ししてコピーしてください。',
    },
    en_US: {
      origin:'The online contact service is unavailable. Try again later.',
      storage:'Could not save the submission receipt. Check the app storage.',
      duplicate:'The same message was already sent. Its status cannot be confirmed, so it will not be sent again. Your draft remains intact.',
      http:status => `Contact submission failed (HTTP ${status}). Your draft remains intact.`,
      invalidId:'Could not verify the receipt number. The message will not be sent again automatically.',
      uncertain:'Could not confirm whether the message was accepted. Your draft remains intact and will not be sent again automatically.',
      sending:'Sending your message…', accepted:id => `Message received. Receipt number: ${id}`,
      copied:'Contact message copied.', copyHelp:'Enter a subject and message, then long-press to copy.',
    },
  };
  const contactText = () => contactLabels[window.ClassicLocale?.getLocale?.()] || contactLabels.ko_KR;
  async function submitContact(form) {
    const base = String(window.__LOLCLASSIC_CONFIG__?.communityApiBaseUrl || '').trim().replace(/\/+$/, '');
    if (base !== CONTACT_ORIGIN) throw new Error(contactText().origin);
    const payload = contactFromForm(form);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([payload.title, payload.body, payload.appVersion])));
    const key = 'classicContactReceipt:' + Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('');
    let prior;
    try { prior = JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { throw new Error(contactText().storage); }
    if (prior?.id) return prior.id;
    if (prior?.pending) throw new Error(contactText().duplicate);
    try { localStorage.setItem(key, JSON.stringify({pending:true, at:Date.now()})); }
    catch { throw new Error(contactText().storage); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${base}/api/v1/bug-reports`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload), signal:controller.signal });
      let result = {};
      try { result = await response.json(); } catch {}
      if (!response.ok) {
        // Explicit client rejection means no report was accepted. A server error
        // or a lost response can follow a successful insert; retain that journal.
        if (response.status >= 400 && response.status < 500) localStorage.removeItem(key);
        throw new Error(contactText().http(response.status));
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(result.id || ''))) throw new Error(contactText().invalidId);
      localStorage.setItem(key, JSON.stringify({id:result.id, at:Date.now()}));
      return result.id;
    } catch (error) {
      if (error?.name === 'AbortError' || error instanceof TypeError) throw new Error(contactText().uncertain);
      throw error;
    } finally { clearTimeout(timeout); }
  }
  document.addEventListener('submit', async event => {
    if (event.target.id !== 'classicContactForm') return;
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const status = form.querySelector('#contactStatus');
    try {
      if (form.dataset.submitting === 'true') return;
      form.dataset.submitting = 'true';
      form.querySelector('[type="submit"]').disabled = true;
      status.textContent = contactText().sending;
      const id = await submitContact(form);
      status.textContent = contactText().accepted(id);
      form.reset();
      form.dataset.submitting = 'false';
      form.querySelector('[type="submit"]').disabled = false;
    } catch (error) {
      form.dataset.submitting = 'false';
      form.querySelector('[type="submit"]').disabled = false;
      status.textContent = error.message;
    }
  });
  document.addEventListener('click', async event => {
    const documentButton = event.target.closest('[data-go^="document/"]');
    if (documentButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      const modal = document.getElementById('modal');
      if (modal.open) modal.close();
      go(documentButton.dataset.go);
      return;
    }
    const copy = event.target.closest('[data-contact-copy]');
    if (copy) {
      const form = copy.closest('form'), status = form.querySelector('#contactStatus');
      try { await navigator.clipboard.writeText(contactFromForm(form).copyText); status.textContent = contactText().copied; }
      catch { status.textContent = contactText().copyHelp; }
      return;
    }
    const link = event.target.closest('a[href], [data-external]');
    if (!link) return;
    const route = window.ClassicDocuments.routeForUrl(link.dataset.external || link.getAttribute('href'));
    if (!route) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const modal = document.getElementById('modal');
    if (modal.open) modal.close();
    go(route);
  }, true);
})();
