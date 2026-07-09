/* Ember site. minimal interactivity */
(function () {
  // Sticky nav background once user scrolls
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Reveal-on-scroll for marked elements
  const targets = document.querySelectorAll('.reveal');
  if (targets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => io.observe(el));
  }

  // Calendar view swap (Impact / Day type)
  const swapButtons = document.querySelectorAll('[data-swap-btn]');
  const swapHost = document.querySelector('[data-swap]');
  if (swapButtons.length && swapHost) {
    swapButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-swap-btn');
        swapButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        swapHost.querySelectorAll('[data-swap-view]').forEach((img) => {
          img.classList.toggle('is-hidden', img.getAttribute('data-swap-view') !== view);
        });
      });
    });
  }

  // Videos: honor reduced motion, pause when offscreen
  const videos = document.querySelectorAll('video[autoplay]');
  if (videos.length) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
      videos.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); v.setAttribute('controls', ''); });
    } else if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) { if (v.paused) v.play().catch(() => {}); }
          else if (!v.paused) v.pause();
        });
      }, { threshold: 0.25 });
      videos.forEach((v) => vio.observe(v));
    }
  }

  // Feature carousel. arrow controls, end-state disabling, center-focus perspective
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-carousel]').forEach((car) => {
    const track = car.querySelector('[data-carousel-track]');
    const prev = car.querySelector('[data-carousel-prev]');
    const next = car.querySelector('[data-carousel-next]');
    if (!track) return;
    const cards = Array.from(track.querySelectorAll('.fcard'));
    const step = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 18;
      return cards[0] ? cards[0].getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    // Scale + fade each card by its distance from the track's center
    const focus = () => {
      if (reduceMotion) return;
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const norm = Math.min(1, Math.abs((r.left + r.width / 2) - center) / (r.width * 1.1));
        card.style.transform = 'scale(' + (1 - 0.13 * norm).toFixed(3) + ')';
        card.style.opacity = (1 - 0.62 * norm).toFixed(3);
      });
    };
    const arrows = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= maxScroll - 4;
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; focus(); arrows(); });
    };
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { focus(); arrows(); });
    window.addEventListener('load', () => { focus(); arrows(); });
    focus(); arrows();
  });

  // Report lightbox. click a report/crop to enlarge; click again for 1:1, scroll to pan
  const zoomEls = document.querySelectorAll('[data-zoom]');
  if (zoomEls.length) {
    let box = null;
    const ensure = () => {
      if (box) return box;
      box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close">×</button><img alt="">';
      document.body.appendChild(box);
      const bimg = box.querySelector('img');
      const close = () => { box.classList.remove('open'); document.documentElement.style.overflow = ''; };
      box.addEventListener('click', (e) => {
        if (e.target === box || e.target.classList.contains('lightbox-close')) close();
      });
      bimg.addEventListener('click', (e) => { e.stopPropagation(); bimg.classList.toggle('zoomed'); box.scrollTop = 0; box.scrollLeft = 0; });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
      return box;
    };
    const open = (el) => {
      const inner = el.querySelector('img');
      const src = el.getAttribute('data-zoom-src') || (inner && inner.src);
      if (!src) return;
      const b = ensure();
      const bimg = b.querySelector('img');
      bimg.classList.remove('zoomed');
      bimg.src = src;
      bimg.alt = (inner && inner.alt) || '';
      b.classList.add('open');
      b.scrollTop = 0; b.scrollLeft = 0;
      document.documentElement.style.overflow = 'hidden';
    };
    zoomEls.forEach((el) => {
      el.addEventListener('click', () => open(el));
      if (el.tagName !== 'BUTTON') {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
      }
    });
  }

  // Contact form. fetch-based submission with inline status
  const form = document.querySelector('form[data-contact-form]');
  if (form) {
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('.form-submit');
    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove('form-status--ok', 'form-status--err');
      if (kind) status.classList.add('form-status--' + kind);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot. silently drop bots
      const honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) return;

      // Native validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submit.disabled = true;
      const originalLabel = submit.textContent;
      submit.textContent = 'Sending…';
      setStatus('', null);

      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.reset();
          setStatus('Thanks. We got it. We’ll be in touch.', 'ok');
        } else {
          setStatus('Something went wrong. Please try again, or email hello@cascadeheadache.com.', 'err');
        }
      } catch (err) {
        setStatus('Network error. Please try again, or email hello@cascadeheadache.com.', 'err');
      } finally {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    });
  }
})();
