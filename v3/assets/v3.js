(() => {
  const APP_STORE = 'https://apps.apple.com/us/app/ember-migraine-tracker/id6762041852';
  const PLAY = 'https://play.google.com/store/apps/details?id=com.cascadeheadache.ember';
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  // Download buttons go straight to the visitor's store on a phone; on desktop they
  // scroll to the closing section with both badges and the QR code.
  document.querySelectorAll('[data-get]').forEach(a => {
    if (isIOS) a.href = APP_STORE;
    else if (isAndroid) a.href = PLAY;
    else a.href = '#get';
  });
  document.querySelectorAll('[data-store-label]').forEach(el => {
    el.textContent = isAndroid ? 'Free on Google Play' : isIOS ? 'Free on the App Store' : 'Free on iPhone and Android';
  });

  // Nav hairline once the page scrolls.
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Sticky download bar on phones: shows after the hero, hides at the closing CTA.
  const bar = document.querySelector('.getbar');
  const hero = document.querySelector('[data-hero]');
  const closing = document.querySelector('#get');
  if (bar && hero && closing && 'IntersectionObserver' in window) {
    let pastHero = false, atClose = false;
    const sync = () => bar.classList.toggle('show', pastHero && !atClose);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(hero);
    new IntersectionObserver(([e]) => { atClose = e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(closing);
  }

  // Try a day: mirrors Ember's classification precedence (src/utils/classification.ts)
  // for pain, symptoms and impact. Medication rules are left out of this demo.
  const tryEl = document.querySelector('[data-try]');
  if (tryEl) {
    const FEATURE = { light: 'Light sensitivity', sound: 'Sound sensitivity', nausea: 'Nausea', neck: 'Neck pain', aura: 'Aura' };
    const state = { pain: 'mild', sym: new Set(['neck', 'nausea', 'fog']), impact: 'none' };
    const result = tryEl.querySelector('.result');
    const rt = result.querySelector('.rt'), rs = result.querySelector('.rs'), rf = result.querySelector('.rf');
    const COLORS = { migraine: 'var(--mig)', headache: 'var(--head)', symptom: '#9a948a', clear: 'var(--clear)' };

    const classify = () => {
      const feats = [];
      state.sym.forEach(s => { if (FEATURE[s]) feats.push(FEATURE[s]); });
      if (state.pain === 'moderate' || state.pain === 'severe') feats.push(state.pain === 'severe' ? 'Severe pain' : 'Moderate pain');
      if (state.impact === 'limited' || state.impact === 'severe') feats.push('Activities affected');
      const impact = state.impact === 'limited' || state.impact === 'severe';
      if (state.pain !== 'none') {
        if (feats.length >= 2) return { type: 'migraine', title: 'Migraine day', rule: `${feats.length} qualifying features → Migraine day`, feats };
        return { type: 'headache', title: 'Headache day', rule: 'Head pain + fewer than 2 qualifying features → Headache day', feats };
      }
      if (state.sym.size > 0) {
        if (impact) return { type: 'migraine', title: 'Migraine day', rule: 'Symptoms + functional impact → Migraine day without headache', feats: [] };
        return { type: 'symptom', title: 'Symptom day', rule: 'Symptoms without significant impact → Symptom day', feats: [] };
      }
      return { type: 'clear', title: 'Clear day', rule: 'No pain + no symptoms → Clear day', feats: [] };
    };

    const render = (animate) => {
      tryEl.querySelectorAll('[data-group]').forEach(group => {
        const g = group.dataset.group;
        group.querySelectorAll('.chip').forEach(c => {
          const on = g === 'sym' ? state.sym.has(c.dataset.v) : state[g] === c.dataset.v;
          c.setAttribute('aria-pressed', String(on));
        });
      });
      const r = classify();
      result.style.setProperty('--rc', COLORS[r.type]);
      rt.textContent = r.title;
      rs.textContent = r.rule;
      rf.replaceChildren(...r.feats.map(f => { const s = document.createElement('span'); s.textContent = f; return s; }));
      rf.hidden = r.feats.length === 0;
      if (animate) { result.classList.remove('pop'); void result.offsetWidth; result.classList.add('pop'); }
    };

    tryEl.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const g = chip.closest('[data-group]').dataset.group;
      const v = chip.dataset.v;
      if (g === 'sym') { state.sym.has(v) ? state.sym.delete(v) : state.sym.add(v); }
      else state[g] = v;
      render(true);
    });
    render(false);
  }
})();
