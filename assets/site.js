/* Ember site — minimal interactivity */
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

  // Contact form — fetch-based submission with inline status
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

      // Honeypot — silently drop bots
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
          setStatus('Thanks — we got it. We’ll be in touch.', 'ok');
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
