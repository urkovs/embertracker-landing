(() => {
  'use strict';
  const endpoint = 'https://ember-clinic-delivery-m7tqb7cmgq-uc.a.run.app/v1/web-contact';
  // Cloudflare Turnstile spam check. It loads only when the form service asks
  // for it (`challenge: 'turnstile-v1'` on the form token), so nothing reaches
  // Cloudflare until the check is switched on, and a service that doesn't ask
  // never receives the extra field.
  const turnstileSiteKey = '0x4AAAAAAFlk4skhIJGtyEG3';
  let turnstileLoad = null;
  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!turnstileLoad) turnstileLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(Error('UNAVAILABLE'));
      script.onerror = () => { turnstileLoad = null; script.remove(); reject(Error('UNAVAILABLE')); };
      document.head.appendChild(script);
    });
    return turnstileLoad;
  };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (const form of document.querySelectorAll('[data-ember-form]')) {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    const originalLabel = button.textContent;
    button.disabled = false;
    let token = null, tokenRequest = null, payload = null, busy = false;
    let challengeWanted = false, widget = null;
    async function startChallenge() {
      if (widget !== null) return;
      try {
        const api = await loadTurnstile();
        if (widget !== null) return;
        const host = document.createElement('div');
        host.className = 'form-challenge';
        button.before(host);
        // Shown only when Cloudflare needs the visitor to do something.
        widget = api.render(host, { sitekey: turnstileSiteKey, action: form.dataset.emberForm, appearance: 'interaction-only', theme: 'dark', size: 'flexible', 'response-field': false,
          // Handled: Cloudflare retries on its own, and the form service decides about a form without an answer.
          'error-callback': () => true });
      } catch { /* the form service decides whether a form without an answer goes through */ }
    }
    async function challengeAnswer() {
      if (!challengeWanted) return '';
      await startChallenge();
      for (let waited = 0; widget !== null && waited < 15000; waited += 250) {
        try { const answer = window.turnstile.getResponse(widget); if (answer) return answer; } catch { return ''; }
        await pause(250);
      }
      return '';
    }
    const resetChallenge = () => { if (widget !== null) try { window.turnstile.reset(widget); } catch { /* a fresh answer comes from the next render */ } };
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
        challengeWanted = result.challenge === 'turnstile-v1';
        if (challengeWanted) void startChallenge();
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
          const answer = await challengeAnswer();
          if (answer) payload.turnstile = answer;
        }
        lockFields(true);
        const result = await request(endpoint, payload);
        if (result.status === 'submitted') {
          for (const element of form.querySelectorAll('.form-row,.form-check,.form-note,.form-next,.form-trap,.form-challenge,button')) element.hidden = true;
          message(form.dataset.emberForm === 'clinic' ? 'Request sent. We’ll email you to confirm your clinic’s inbox.' : 'Message sent. We’ll reply to the email you provided.');
          return;
        }
        if (result.status === 'rejected') {
          payload = null; token = null; resetChallenge(); lockFields(false);
          message('Your message wasn’t sent. Your details are still here; please try again later.', true);
        } else {
          message('We’re still confirming your message. Check again before sending another.', true);
        }
      } catch (error) {
        if (['FORM_EXPIRED','INVALID_REQUEST','RATE_LIMIT','REQUEST_CHANGED'].includes(error.message)) {
          payload = null; token = null; resetChallenge(); lockFields(false);
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
