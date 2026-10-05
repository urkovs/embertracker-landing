(() => {
  'use strict';
  const endpoint = 'https://ember-clinic-delivery-m7tqb7cmgq-uc.a.run.app/v1/web-contact';
  for (const form of document.querySelectorAll('[data-ember-form]')) {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    const originalLabel = button.textContent;
    button.disabled = false;
    let token = null, tokenRequest = null, payload = null, busy = false;
    const message = (text, error = false) => {
      status.textContent = text;
      status.className = `form-status ${error ? 'form-status--err' : 'form-status--ok'}`;
      status.focus();
    };
    async function request(url, body) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      try {
        const response = await fetch(url, {
          method: body ? 'POST' : 'GET', mode: 'cors', credentials: 'omit', redirect: 'error',
          ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
          signal: controller.signal,
        });
        const text = await response.text();
        if (text.length > 2048) throw Error('UNAVAILABLE');
        const result = JSON.parse(text);
        if (!response.ok) throw Error(result.error || 'UNAVAILABLE');
        return result;
      } finally { clearTimeout(timer); }
    }
    async function prepare() {
      if (token) return token;
      if (!tokenRequest) tokenRequest = request(`${endpoint}/token`).then(result => {
        if (typeof result.token !== 'string' || result.token.length > 200) throw Error('UNAVAILABLE');
        return token = result.token;
      }).finally(() => { tokenRequest = null; });
      return tokenRequest;
    }
    const lockFields = locked => {
      for (const control of form.querySelectorAll('input,textarea')) control.disabled = locked;
    };
    form.addEventListener('focusin', () => { void prepare().catch(() => {}); }, { once: true });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || (!payload && !form.reportValidity())) return;
      busy = true; button.disabled = true; button.textContent = payload ? 'Checking…' : 'Sending…';
      try {
        if (!payload) {
          const data = new FormData(form);
          const values = { kind: form.dataset.emberForm, name: String(data.get('name') || '').trim(), email: String(data.get('email') || '').trim(), website: String(data.get('website') || '') };
          if (values.kind === 'clinic') Object.assign(values, { clinic: String(data.get('clinic') || '').trim(), inbox: String(data.get('inbox') || '').trim(), approved: data.get('approved') === 'on' });
          else values.message = String(data.get('message') || '').trim();
          lockFields(true);
          payload = { ...values, token: await prepare() };
        }
        lockFields(true);
        const result = await request(endpoint, payload);
        if (result.status === 'submitted') {
          for (const element of form.querySelectorAll('.form-row,.form-check,.form-note,.form-next,.form-trap,button')) element.hidden = true;
          message(form.dataset.emberForm === 'clinic' ? 'Request sent. We’ll email you to confirm your clinic’s inbox.' : 'Message sent. We’ll reply to the email you provided.');
          return;
        }
        if (result.status === 'rejected') {
          payload = null; token = null; lockFields(false);
          message('Your message wasn’t sent. Your details are still here; please try again later.', true);
        } else {
          message('We’re still confirming your message. Check again before sending another.', true);
        }
      } catch (error) {
        if (['FORM_EXPIRED','INVALID_REQUEST','RATE_LIMIT','REQUEST_CHANGED'].includes(error.message)) {
          payload = null; token = null; lockFields(false);
          message(error.message === 'RATE_LIMIT' ? 'The form is temporarily busy. Your details are still here; please try again later.' : error.message === 'INVALID_REQUEST' ? 'Check your details and try again. Nothing was sent.' : 'Please try again. Your details are still here.', true);
        } else {
          if (!payload) lockFields(false);
          message(payload ? 'We couldn’t confirm your message. Check again; this won’t send a duplicate.' : 'Couldn’t connect. Your details are still here; please try again.', true);
        }
      } finally {
        busy = false; button.disabled = false;
        button.textContent = payload ? 'Check message status' : originalLabel;
      }
    });
  }
})();
