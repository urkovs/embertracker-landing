/* Ember website V3: shared behavior. Every block is guarded, so a page loads
   this file whether or not it uses a given component. Pages work without it:
   links keep their authored href, and nothing is hidden until a script runs.

   [data-get]           store link for the visitor's platform (iOS → App Store,
                        Android → Google Play, otherwise the authored href, e.g. #get)
   [data-store-label]   "Free on the App Store" / "Free on Google Play" / "Free on iPhone and Android"
   .badges              Google Play badge moves first on Android
   .nav                 .is-scrolled once the page scrolls 8px
   .getbar              phone download bar between [data-hero] and #get
   [data-try]           the day classifier (mirrors src/utils/classification.ts)
   [data-toc]           legal contents rail: marks the current section

   Forms are not handled here. Contact and clinic forms load the live
   /assets/web-form.js?v=2 unchanged (inventory §2.1). */
(() => {
  const APP_STORE = 'https://apps.apple.com/us/app/ember-migraine-tracker/id6762041852';
  const PLAY = 'https://play.google.com/store/apps/details?id=com.cascadeheadache.ember';
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const root = document.documentElement;
  root.classList.add(isIOS ? 'is-ios' : isAndroid ? 'is-android' : 'is-desktop');

  // Store links and labels
  document.querySelectorAll('[data-get]').forEach(a => {
    if (isIOS) a.href = APP_STORE;
    else if (isAndroid) a.href = PLAY;
  });
  document.querySelectorAll('[data-store-label]').forEach(el => {
    el.textContent = isAndroid ? 'Free on Google Play' : isIOS ? 'Free on the App Store' : 'Free on iPhone and Android';
  });

  // Visitor's store first in every badge group
  if (isAndroid) {
    document.querySelectorAll('.badges').forEach(group => {
      const play = group.querySelector('.badge-play');
      if (play && group.firstElementChild !== play) group.prepend(play);
    });
  }

  // Nav hairline
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Phone download bar: visible after the hero leaves and before the closing enters
  const bar = document.querySelector('.getbar');
  const hero = document.querySelector('[data-hero]');
  const closing = document.querySelector('#get');
  if (bar) {
    const setShown = on => {
      bar.classList.toggle('is-shown', on);
      bar.setAttribute('aria-hidden', String(!on));
      if (on) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
    };
    setShown(false);
    if (hero && closing) {
      // Scroll position, not IntersectionObserver: a jump straight past the
      // closing (Page Down, End, anchor) never crosses an IO threshold.
      let ticking = false;
      const sync = () => {
        ticking = false;
        const pastHero = hero.getBoundingClientRect().bottom < 0;
        const atClose = closing.getBoundingClientRect().top < window.innerHeight;
        setShown(pastHero && !atClose);
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
      window.addEventListener('resize', sync, { passive: true });
      sync();
    }
  }

  // Day classifier. Mirrors classification.ts for head pain, symptoms and
  // impact; the medication rule is left out of this demo.
  //   Migraine features: light, sound, nausea, aura, neck (brain fog is not one),
  //   moderate or severe pain (1), limited or severe impact (1).
  //   Head pain: 2+ features → Migraine day, otherwise Headache day.
  //   No head pain: no symptoms → Clear day; symptoms + impact → Migraine day
  //   without head pain; symptoms without impact → Symptom day.
  document.querySelectorAll('[data-try]').forEach(tryEl => {
    const FEATURE = { light: 'Light sensitivity', sound: 'Sound sensitivity', nausea: 'Nausea', neck: 'Neck pain', aura: 'Aura' };
    const COLOR = { migraine: 'var(--mig)', headache: 'var(--head)', symptom: 'var(--sym)', clear: 'var(--clear)' };
    const state = { pain: 'mild', sym: new Set(['neck', 'nausea', 'fog']), impact: 'none' };
    tryEl.querySelectorAll('[data-group]').forEach(group => {
      const g = group.dataset.group;
      const pressed = [...group.querySelectorAll('[aria-pressed="true"]')].map(c => c.dataset.v);
      if (!pressed.length) return;
      if (g === 'sym') state.sym = new Set(pressed); else state[g] = pressed[0];
    });
    const result = tryEl.querySelector('[data-result]');
    if (!result) return;
    const title = result.querySelector('[data-r-title]');
    const rule = result.querySelector('[data-r-rule]');
    const feats = result.querySelector('[data-r-feats]');

    const classify = () => {
      const f = [];
      state.sym.forEach(s => { if (FEATURE[s]) f.push(FEATURE[s]); });
      if (state.pain === 'moderate') f.push('Moderate pain');
      if (state.pain === 'severe') f.push('Severe pain');
      const impact = state.impact === 'limited' || state.impact === 'severe';
      if (impact) f.push('Activities affected');
      if (state.pain !== 'none') {
        if (f.length >= 2) return { type: 'migraine', title: 'Migraine day', rule: `${f.length} migraine features → Migraine day`, f };
        return { type: 'headache', title: 'Headache day', rule: 'Head pain with fewer than 2 migraine features → Headache day', f };
      }
      if (state.sym.size === 0) return { type: 'clear', title: 'Clear day', rule: 'No head pain and no symptoms → Clear day', f: [] };
      if (impact) return { type: 'migraine', title: 'Migraine day', rule: 'Symptoms that limited the day → Migraine day without head pain', f: [] };
      return { type: 'symptom', title: 'Symptom day', rule: 'Symptoms with no significant impact → Symptom day', f: [] };
    };

    const render = () => {
      tryEl.querySelectorAll('[data-group]').forEach(group => {
        const g = group.dataset.group;
        group.querySelectorAll('[data-v]').forEach(c => {
          const on = g === 'sym' ? state.sym.has(c.dataset.v) : state[g] === c.dataset.v;
          c.setAttribute('aria-pressed', String(on));
        });
      });
      const r = classify();
      result.style.setProperty('--rc', COLOR[r.type]);
      result.dataset.type = r.type;
      if (title) title.textContent = r.title;
      if (rule) rule.textContent = r.rule;
      if (feats) {
        feats.replaceChildren(...r.f.map(name => { const s = document.createElement('li'); s.textContent = name; return s; }));
        feats.hidden = r.f.length === 0;
      }
    };

    tryEl.addEventListener('click', e => {
      const chip = e.target.closest('[data-v]');
      if (!chip || !tryEl.contains(chip)) return;
      const group = chip.closest('[data-group]');
      if (!group) return;
      const g = group.dataset.group, v = chip.dataset.v;
      if (g === 'sym') { if (state.sym.has(v)) state.sym.delete(v); else state.sym.add(v); }
      else state[g] = v;
      render();
    });
    render();
  });

  // Legal contents rail: highlight the section in view (sections stay visible regardless)
  const toc = document.querySelector('[data-toc]');
  if (toc && 'IntersectionObserver' in window) {
    const links = new Map();
    toc.querySelectorAll('a[href^="#"]').forEach(a => {
      const t = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (t) links.set(t, a);
    });
    const visible = new Set();
    const mark = () => {
      let current = null;
      links.forEach((a, t) => { if (visible.has(t) && !current) current = a; });
      if (!current) return;
      links.forEach(a => { a.classList.toggle('is-current', a === current); if (a === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      mark();
    }, { rootMargin: '-96px 0px -60% 0px' });
    links.forEach((a, t) => io.observe(t));
  }
})();
