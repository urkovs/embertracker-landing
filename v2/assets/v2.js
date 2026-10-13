(function () {
  document.documentElement.classList.add('js');
  const body = document.body;
  const menuButton = document.querySelector('[data-menu-button]');
  const navLinks = document.querySelector('[data-nav-links]');

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && body.classList.contains('menu-open')) {
        setMenu(false);
        menuButton.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-header')) setMenu(false);
    });
    window.matchMedia('(min-width: 48rem)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });
  }

  const reveals = document.querySelectorAll('.reveal');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('in'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px' });
    reveals.forEach((element) => observer.observe(element));
  }

  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panels = [...tabs.querySelectorAll('[role="tabpanel"]')];

    function selectTab(button, moveFocus) {
      const panelId = button.getAttribute('aria-controls');
      buttons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.setAttribute('aria-selected', String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.id !== panelId; });
      if (moveFocus) button.focus();
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => selectTab(button, false));
      button.addEventListener('keydown', (event) => {
        let nextIndex = null;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;
        if (nextIndex !== null) {
          event.preventDefault();
          selectTab(buttons[nextIndex], true);
        }
      });
    });
  });

  document.querySelectorAll('[data-watch-demo]').forEach((demo) => {
    const steps = [...demo.querySelectorAll('[data-demo-step]')];
    const play = demo.querySelector('[data-play-flow]');
    const playLabel = play.querySelector('span');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timers = new Set();
    let playing = false;

    function stop() {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      playing = false;
      playLabel.textContent = 'Replay flow';
      play.setAttribute('aria-label', 'Replay the Watch walkthrough');
    }

    function selectStep(index) {
      demo.dataset.step = String(index);
      steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      demo.querySelector('.watch-home').setAttribute('aria-hidden', String(index !== 0));
      demo.querySelector('.watch-entry').setAttribute('aria-hidden', String(index === 0));
    }

    function schedule(fn, delay) {
      const timer = setTimeout(() => { timers.delete(timer); fn(); }, delay);
      timers.add(timer);
    }

    steps.forEach((button, index) => {
      button.addEventListener('click', () => { stop(); selectStep(index); });
      button.addEventListener('keydown', (event) => {
        const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        const next = (index + direction + steps.length) % steps.length;
        stop(); selectStep(next); steps[next].focus();
      });
    });

    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      stop();
      if (motion.matches) { selectStep(2); return; }
      selectStep(0);
      playing = true;
      playLabel.textContent = 'Pause flow';
      play.setAttribute('aria-label', 'Pause the Watch walkthrough');
      schedule(() => selectStep(1), 1000);
      schedule(() => selectStep(2), 2200);
      schedule(stop, 3200);
    });
    demo.addEventListener('keydown', (event) => { if (event.key === 'Escape' && playing) stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
    motion.addEventListener('change', () => { if (playing) stop(); });
    selectStep(0);
  });

  document.querySelectorAll('[data-classifier]').forEach((classifier) => {
    const buttons = [...classifier.querySelectorAll('[data-scenario]')];
    const label = classifier.querySelector('[data-output-label]');
    const explanation = classifier.querySelector('[data-output-copy]');

    function selectScenario(button) {
      buttons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      label.textContent = button.dataset.result;
      label.style.color = button.dataset.color;
      explanation.textContent = button.dataset.explanation;
    }

    buttons.forEach((button) => button.addEventListener('click', () => selectScenario(button)));
  });

  const reportDialog = document.querySelector('[data-report-dialog]');
  if (reportDialog) {
    const closeButton = reportDialog.querySelector('[data-dialog-close]');
    document.querySelectorAll('[data-open-report]').forEach((button) => {
      button.addEventListener('click', () => reportDialog.showModal());
    });
    closeButton.addEventListener('click', () => reportDialog.close());
    reportDialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = [...reportDialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
        .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (!reportDialog.contains(document.activeElement)
        || (event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
    reportDialog.addEventListener('click', (event) => {
      if (event.target === reportDialog) reportDialog.close();
    });
  }
})();
