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
   [data-reveal], [data-reveal-group], [data-draw]
                        rise / draw once on first view (round 3; CSS §20)
   [data-orb-path]      scroll orb along a winding path (round 3; CSS §22)
   [data-scroll-rise]   the home hero orb rises and fades in with scroll (pages/home.css "Hero")
   [data-orb-mark="k-…"] a ring on the path beside this element's kicker, in its color
   [data-orb-days="mhsc…"] on a [data-orb-gap]: a month of day types along that crossing
                        (m migraine, h headache, s symptom, c clear); both light as the orb passes
   window.EmberV3       { orb: { refresh(), check(), geometry }, reveal: { scan(), play(el) } }

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

  const reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: true };
  const api = window.EmberV3 = window.EmberV3 || {};

  // Reveal and draw once (CSS §20). Objects already on screen (or above it)
  // at start stay put; only objects below the fold rise or draw as they enter.
  // .js-motion gates every hidden start state, so no JS means no hiding.
  (() => {
    const SEL = '[data-reveal], [data-reveal-group], [data-draw]';
    if (reduceMQ.matches || !('IntersectionObserver' in window)) { api.reveal = { scan() {}, play() {} }; return; }
    const pending = new Set();
    const show = (el, animate) => {
      pending.delete(el);
      io.unobserve(el);
      el.classList.add('is-in');
      if (!animate) return;
      el.classList.add('is-anim');
      // drop the animation class once played, so a later display toggle can't replay it
      setTimeout(() => el.classList.remove('is-anim'), 1200);
    };
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) show(e.target, true); }), { rootMargin: '0px 0px -8% 0px' });
    // A jump past an object (End key, anchor link) never intersects it: show
    // anything already above the screen as is.
    let sweeping = false;
    window.addEventListener('scroll', () => {
      if (sweeping || !pending.size) return;
      sweeping = true;
      requestAnimationFrame(() => { sweeping = false; pending.forEach(el => { if (el.getBoundingClientRect().bottom < 0) show(el, false); }); });
    }, { passive: true });
    const scan = (scope = document) => {
      const fold = window.innerHeight;
      scope.querySelectorAll(SEL).forEach(el => {
        if (el.dataset.revealSeen) return;
        el.dataset.revealSeen = '';
        const r = el.getBoundingClientRect();
        // on screen, above it, or not rendered (hidden panel): show as is
        if (r.top < fold || (r.width === 0 && r.height === 0)) el.classList.add('is-in');
        else { pending.add(el); io.observe(el); }
      });
    };
    // play(el): run an object's entrance now, e.g. a Brief line in a tab panel
    // the visitor just opened (panels hidden at load start out drawn).
    const play = el => {
      if (!el) return;
      pending.delete(el); io.unobserve(el);
      el.classList.remove('is-in', 'is-anim');
      void el.offsetWidth;
      show(el, true);
    };
    scan();
    root.classList.add('js-motion');
    api.reveal = { scan, play };
  })();

  // Scroll orb (CSS §22). A small ember travels a winding path as the page
  // scrolls: its page y is scrollY + 55% of the viewport, its x follows the
  // path, so it moves sideways only through the curves. The path starts at
  // [data-orb-start], runs down a side margin, crosses the page only inside
  // the empty gaps above [data-orb-gap] elements (alternating sides), and ends
  // at [data-orb-end], where the orb merges into it.
  //   data-orb-path="left|right"   first side (default left); on any element
  //   data-orb-at="0.55"           orb height as a fraction of the viewport
  //   data-orb-lane="px"           lane distance from the window edge
  //                                (default: middle of the margin outside .wrap)
  //   data-orb-min-lane="px"       hide the orb while the margin lane is narrower
  //                                than this (default 40, i.e. below 1260px today)
  //   data-orb-debug               draw the whole path and the gap bands
  //   data-orb-start="fx,fy"       point inside the start element (default 0.5,1)
  //   data-orb-end="fx,fy"         point inside the end element (default 0.5,0.5)
  //   data-orb-gap="px"            the crossing keeps this far from content (default 24)
  // A gap band runs from the bottom of the previous sibling's content to the
  // top of this element's content (content = union of the element's children).
  (() => {
    let host = document.querySelector('[data-orb-path]');
    const wideMQ = matchMedia('(min-width: 1024px)');
    const SVG = 'http://www.w3.org/2000/svg';
    let layer = null, trail = null, dot = null, geo = null, ticking = false, ro = null;

    // Resting boxes: an object still waiting to rise ([data-reveal], a group
    // child, a .rise, the hero orb's [data-scroll-rise]) sits low for a while. Measure where
    // it will rest, so the path and check() don't depend on scroll history.
    const REST = '[data-reveal], [data-reveal-group] > *, .rise, [data-scroll-rise]';
    const restOffset = el => {
      let dx = 0, dy = 0;
      for (let n = el.closest(REST); n; n = n.parentElement && n.parentElement.closest(REST)) {
        const t = getComputedStyle(n).translate;
        if (t && t !== 'none') { const [x = '0', y = '0'] = t.split(' '); dx += parseFloat(x) || 0; dy += parseFloat(y) || 0; }
      }
      return { dx, dy };
    };
    const docRect = el => {
      const r = el.getBoundingClientRect(), { dx, dy } = restOffset(el);
      return { l: r.left - dx, r: r.right - dx, t: r.top + scrollY - dy, b: r.bottom + scrollY - dy, w: r.width, h: r.height };
    };
    const point = (el, spec, def) => {
      const [fx, fy] = (spec || def).split(',').map(Number);
      const r = docRect(el);
      return { x: r.l + r.w * (isNaN(fx) ? .5 : fx), y: r.t + r.h * (isNaN(fy) ? .5 : fy) };
    };
    const rendered = el => { const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0; };
    const content = el => {
      const kids = [...el.children].filter(c => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(c.tagName) && rendered(c));
      const rs = (kids.length ? kids : [el]).map(docRect);
      return { t: Math.min(...rs.map(r => r.t)), b: Math.max(...rs.map(r => r.b)) };
    };
    const prevRendered = el => { let p = el.previousElementSibling; while (p && (!rendered(p) || /^(SCRIPT|STYLE|TEMPLATE)$/.test(p.tagName))) p = p.previousElementSibling; return p; };

    // the lane: the middle of the margin outside .wrap's padded column. The orb
    // shows only where that lane is at least data-orb-min-lane px (default 40,
    // which with the current .wrap means a viewport of 1260px or wider).
    const marginLane = () => {
      const wrap = document.querySelector('main .wrap') || document.querySelector('.wrap');
      const left = wrap ? wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft) : 40;
      return left / 2;
    };
    const minLane = () => { const v = parseFloat(host.dataset.orbMinLane); return isNaN(v) ? 40 : v; };

    const build = () => {
      const start = document.querySelector('[data-orb-start]'), end = document.querySelector('[data-orb-end]');
      const gaps = [...document.querySelectorAll('[data-orb-gap]')].filter(rendered);
      if (!start || !end || gaps.length < 2) { console.warn('[orb] needs [data-orb-start], [data-orb-end] and at least 2 [data-orb-gap]'); return null; }
      const vw = document.documentElement.clientWidth;
      const S = point(start, start.dataset.orbStart, '0.5,1'), E = point(end, end.dataset.orbEnd, '0.5,0.5');
      let lane = parseFloat(host.dataset.orbLane);
      if (isNaN(lane)) lane = Math.max(18, marginLane());
      const sides = host.dataset.orbPath === 'right' ? [vw - lane, lane] : [lane, vw - lane];
      const bands = gaps.map(g => {
        const pad = parseFloat(g.dataset.orbGap) || 24, prev = prevRendered(g);
        return { t: (prev ? content(prev).b : docRect(g).t) + pad, b: content(g).t - pad, el: g };
      });
      bands[0].t = S.y;                       // first crossing leaves the start point
      bands[bands.length - 1].b = E.y;        // last crossing lands on the end point
      for (let i = 0; i < bands.length; i++) {
        const prevB = i ? bands[i - 1].b : -Infinity;
        if (bands[i].b - bands[i].t < 24 || bands[i].t < prevB) console.warn('[orb] gap band too small or out of order', i, gaps[i], bands[i]);
      }
      const pts = [];
      const cross = (xa, ya, xb, yb) => {
        if (!pts.length || pts[pts.length - 1].y < ya) pts.push({ x: xa, y: ya });
        const n = Math.max(12, Math.ceil((yb - ya) / 3));
        // trapezoid speed profile: ease in over the first 20%, glide, ease out
        // over the last 20%, so the peak sideways speed is only 1.25× the
        // crossing's average (a cosine ease peaks at 1.57×)
        const A = .2, V = 1 / (1 - A);
        const ease = u => u < A ? V * u * u / (2 * A) : u > 1 - A ? 1 - V * (1 - u) * (1 - u) / (2 * A) : V * (u - A / 2);
        for (let k = 1; k <= n; k++) { const u = k / n; pts.push({ x: xa + (xb - xa) * ease(u), y: ya + (yb - ya) * u }); }
      };
      let x = S.x;
      bands.forEach((band, i) => {
        const xb = i === bands.length - 1 ? E.x : sides[i % 2];
        cross(x, band.t, xb, Math.max(band.b, band.t + 1));
        x = xb;
      });
      // cumulative length (the trail is this polyline, so lengths match exactly)
      let len = 0; pts[0].l = 0;
      for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); pts[i].l = len; }
      return { pts, len, S, E, bands, vw, end, lane, k: parseFloat(host.dataset.orbAt) || .55 };
    };

    const render = () => {
      if (!layer) {
        layer = document.createElementNS(SVG, 'svg');
        layer.setAttribute('class', 'orb-layer'); layer.setAttribute('aria-hidden', 'true'); layer.setAttribute('focusable', 'false');
        trail = document.createElementNS(SVG, 'path'); trail.setAttribute('class', 'orb-trail');
        layer.append(trail);
        dot = document.createElement('div'); dot.className = 'orb-dot'; dot.setAttribute('aria-hidden', 'true');
        document.body.append(layer, dot);
        root.classList.add('orb-on');
      }
      layer.querySelectorAll('.orb-debug-path, .orb-debug-band').forEach(n => n.remove());
      layer.setAttribute('width', geo.vw); layer.setAttribute('height', Math.ceil(geo.E.y + 8));
      layer.setAttribute('viewBox', `0 0 ${geo.vw} ${Math.ceil(geo.E.y + 8)}`);
      const d = 'M' + geo.pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L');
      trail.setAttribute('d', d);
      trail.style.strokeDasharray = `${geo.len} ${geo.len + 2}`;
      // Section rings and a month of days, drawn on the path. update() lights
      // each once the orb has passed it: a color change, never movement.
      layer.querySelectorAll('.orb-mark, .orb-day').forEach(n => n.remove());
      geo.lights = [];
      const light = (cls, p, r) => {
        const c = document.createElementNS(SVG, 'circle');
        c.setAttribute('class', cls); c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); c.setAttribute('r', r);
        layer.append(c); geo.lights.push({ c, l: p.l });
      };
      document.querySelectorAll('[data-orb-mark]').forEach(el => {
        if (!rendered(el)) return;
        const k = el.querySelector('.kicker'), r = docRect(k || el), y = k ? r.t + r.h / 2 : r.t;
        if (y > geo.S.y && y < geo.E.y) light(`orb-mark ${el.dataset.orbMark}`, at(y), 4.5);
      });
      const kinds = { m: 'mig', h: 'head', s: 'sym', c: 'clear' };
      geo.bands.forEach(b => {
        const days = [...(b.el.dataset.orbDays || '')].filter(c => kinds[c]);
        if (!days.length) return;
        const inset = 28, l0 = at(b.t + inset).l, l1 = at(b.b - inset).l;
        days.forEach((c, i) => light(`orb-day orb-day--${kinds[c]}`, atL(l0 + (l1 - l0) * (i + .5) / days.length), c === 'c' ? 2.5 : 3.5));
      });
      if ('orbDebug' in host.dataset) {
        geo.bands.forEach(b => { const r = document.createElementNS(SVG, 'rect'); r.setAttribute('class', 'orb-debug-band'); r.setAttribute('x', 0); r.setAttribute('y', b.t); r.setAttribute('width', geo.vw); r.setAttribute('height', Math.max(1, b.b - b.t)); layer.prepend(r); });
        const ahead = document.createElementNS(SVG, 'path'); ahead.setAttribute('class', 'orb-debug-path'); ahead.setAttribute('d', d); layer.append(ahead);
      }
    };

    // the orb's page y: a pure function of scroll. Near the top and bottom of
    // the page it eases so the start and end points are always reachable.
    const orbY = () => {
      const vh = window.innerHeight, sy = window.scrollY, at = geo.k * vh;
      const max = Math.max(0, document.documentElement.scrollHeight - vh);
      const ramp = vh * .6, clamp = v => Math.min(1, Math.max(0, v));
      const lead = Math.max(0, at - geo.S.y);
      const lag = Math.max(0, geo.E.y - (max + at));
      return sy + at - lead * (1 - clamp(sy / ramp)) + lag * clamp((sy - (max - ramp)) / ramp);
    };
    const at = y => {
      const p = geo.pts; let lo = 0, hi = p.length - 1;
      if (y <= p[0].y) return p[0];
      if (y >= p[hi].y) return p[hi];
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (p[mid].y <= y) lo = mid; else hi = mid; }
      const a = p[lo], b = p[hi], u = b.y > a.y ? (y - a.y) / (b.y - a.y) : 1;
      return { x: a.x + (b.x - a.x) * u, y, l: a.l + (b.l - a.l) * u };
    };
    // the path point at arc length l (the days are spaced evenly along the path)
    const atL = l => {
      const p = geo.pts; let lo = 0, hi = p.length - 1;
      if (l <= 0) return p[0];
      if (l >= p[hi].l) return p[hi];
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (p[mid].l <= l) lo = mid; else hi = mid; }
      const a = p[lo], b = p[hi], u = (l - a.l) / ((b.l - a.l) || 1);
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, l };
    };
    const update = () => {
      ticking = false;
      if (!geo) return;
      const y = orbY(), p = at(y);
      const fadeIn = Math.min(1, Math.max(0, (y - geo.S.y) / 48));
      const merge = Math.min(1, Math.max(0, (geo.E.y - y) / 64));
      dot.style.opacity = (fadeIn * merge).toFixed(3);
      dot.style.transform = `translate3d(${p.x.toFixed(1)}px, ${(p.y - window.scrollY).toFixed(1)}px, 0) scale(${(.55 + .45 * merge).toFixed(3)})`;
      trail.style.strokeDashoffset = (geo.len - (y <= geo.S.y ? 0 : p.l)).toFixed(1);
      if (geo.lights) geo.lights.forEach(o => o.c.classList.toggle('is-lit', y > geo.S.y && p.l >= o.l));
      geo.end.classList.toggle('is-orb-arrived', merge < .15);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    // unmount(): remove the drawing and stop following scroll, but keep the
    // resize listeners so a wider window brings the orb back
    const unmount = () => {
      geo = null;
      if (layer) { layer.remove(); dot.remove(); layer = trail = dot = null; }
      root.classList.remove('orb-on');
      document.querySelectorAll('.is-orb-arrived').forEach(el => el.classList.remove('is-orb-arrived'));
      window.removeEventListener('scroll', onScroll);
    };
    let pending = false;
    const refresh = () => {
      if (pending) return; pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (!active()) return;
        if (marginLane() < minLane()) { unmount(); return; }
        geo = build();
        if (!geo) { teardown(); return; }
        window.addEventListener('scroll', onScroll, { passive: true });
        render(); update();
      });
    };
    const active = () => !!host && wideMQ.matches && !reduceMQ.matches;
    const teardown = () => {
      unmount();
      window.removeEventListener('resize', refresh);
      if (ro) { ro.disconnect(); ro = null; }
    };
    const setup = () => {
      teardown();
      host = document.querySelector('[data-orb-path]');
      if (!active()) return;
      window.addEventListener('resize', refresh, { passive: true });
      if ('ResizeObserver' in window) { ro = new ResizeObserver(refresh); ro.observe(document.body); }
      refresh();
    };
    const listen = (mq, fn) => mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener && mq.addListener(fn);
    listen(wideMQ, setup); listen(reduceMQ, setup);
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    if (host) setup();

    // check(): elements the path (with the orb's 20px halo) touches. For QA:
    // run EmberV3.orb.check() in the console at 1260–1440 (where the orb
    // shows); expect []. Narrower, there is no path and it returns [].
    const check = (selector = 'main h1, main h2, main h3, main p, main li, main a, main button, main img, main svg, main figure, main table, main [class*="card"], main .phone, main .badges, main .annot') => {
      if (!geo) return [];
      const halo = 20, hits = new Map();
      const skip = el => el.closest('[data-orb-start], [data-orb-end]');
      const rects = [...document.querySelectorAll(selector)].filter(el => !skip(el) && rendered(el)).map(el => [el, docRect(el)]);
      for (let i = 0; i < geo.pts.length; i += 2) {
        const p = geo.pts[i];
        rects.forEach(([el, r]) => {
          if (p.x > r.l - halo && p.x < r.r + halo && p.y > r.t - halo && p.y < r.b + halo && !hits.has(el)) hits.set(el, Math.round(p.y));
        });
      }
      return [...hits].map(([el, y]) => ({ el, y, what: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') }));
    };
    // refresh(): re-read the page (host, anchors, gaps) and redraw. Call it
    // after changing layout in a way that doesn't resize <body>.
    api.orb = { refresh: setup, check, get geometry() { return geo; } };
  })();

  // Hero orb rise ([data-scroll-rise]; CSS in pages/home.css "Hero"). The orb
  // behind the phone starts dark and low and rises into place over the first
  // stretch of scroll: it lands when the stage's top reaches a quarter of the
  // way down the screen, so the bright orb is seen whole. A pure function of
  // scroll, so it sinks again on the way back up. Where the scroll orb runs,
  // the rise finishes 40px before the ember leaves the orb's rim. Reduce
  // Motion: nothing moves and the orb rests in place.
  (() => {
    const els = [...document.querySelectorAll('[data-scroll-rise]')];
    if (!els.length) return;
    const stage = els[0].parentElement;
    let range = 1, ticking = false, on = false;
    const measure = () => { range = Math.max(200, stage.getBoundingClientRect().top + window.scrollY - window.innerHeight * .25); };
    const update = () => {
      ticking = false;
      let r = range;
      const g = api.orb && api.orb.geometry;
      if (g) r = Math.max(120, Math.min(r, g.S.y - g.k * window.innerHeight - 40));
      const p = Math.min(1, Math.max(0, window.scrollY / r));
      const fade = p * p * (3 - 2 * p), climb = 1 - (1 - p) * (1 - p);
      els.forEach(el => { el.style.setProperty('--rise', fade.toFixed(4)); el.style.setProperty('--rise-e', climb.toFixed(4)); });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const onResize = () => { measure(); onScroll(); };
    const set = () => {
      const want = !reduceMQ.matches;
      if (want === on) return;
      on = want;
      root.classList.toggle('js-rise', on);
      if (on) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('load', onResize);
        measure(); update();
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        els.forEach(el => { el.style.removeProperty('--rise'); el.style.removeProperty('--rise-e'); });
      }
    };
    set();
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', set);
  })();
})();
