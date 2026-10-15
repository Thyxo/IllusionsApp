// Bundark (bottom sheet) med swipe ned for at lukke, fokusfælde og tilbage-knap.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function createSheet(root, appEl) {
  const sheet = root.querySelector('.sheet');
  const body = root.querySelector('.sheet-body');
  const backdrop = root.querySelector('.sheet-backdrop');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  let isOpen = false;
  let pushed = false;
  let lastFocus = null;
  let onCloseCb = null;
  let gen = 0;

  function open(html, { onClose, focus } = {}) {
    gen++;
    onCloseCb = onClose || null;
    body.innerHTML = html;
    body.scrollTop = 0;
    const title = body.querySelector('[data-sheet-title]');
    if (title) {
      if (!title.id) title.id = 'sheet-title';
      sheet.setAttribute('aria-labelledby', title.id);
    }
    if (!isOpen) {
      lastFocus = document.activeElement;
      root.hidden = false;
      sheet.style.transform = '';
      void root.offsetWidth; // start overgangen fra lukket tilstand
      root.classList.add('is-open');
      appEl.inert = true;
      isOpen = true;
      try { history.pushState({ sheet: true }, ''); pushed = true; } catch { pushed = false; }
    }
    const target = (focus && body.querySelector(focus)) || title || sheet;
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }

  function close({ fromHistory = false } = {}) {
    if (!isOpen) return;
    isOpen = false;
    const myGen = ++gen;
    root.classList.remove('is-open');
    sheet.style.transform = '';
    appEl.inert = false;
    const finish = () => {
      if (myGen !== gen) return;
      root.hidden = true;
      body.innerHTML = '';
    };
    if (reduceMotion.matches) finish();
    else {
      sheet.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, 450);
    }
    if (pushed && !fromHistory) history.back();
    pushed = false;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    const cb = onCloseCb;
    onCloseCb = null;
    if (cb) cb();
  }

  window.addEventListener('popstate', () => { if (isOpen) close({ fromHistory: true }); });
  backdrop.addEventListener('click', () => close());

  root.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = [...sheet.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Swipe ned for at lukke (touch). Fra håndtaget altid; fra indholdet kun når det er rullet helt op.
  let startY = 0;
  let dy = 0;
  let startT = 0;
  let drag = null; // null | 'maybe' | 'on'
  let fromGrab = false;

  sheet.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { drag = null; return; }
    fromGrab = !!e.target.closest('.sheet-grab');
    if (!fromGrab && body.scrollTop > 0) { drag = null; return; }
    if (e.target.closest('input, textarea')) { drag = null; return; }
    startY = e.touches[0].clientY;
    startT = performance.now();
    dy = 0;
    drag = 'maybe';
  }, { passive: true });

  sheet.addEventListener('touchmove', (e) => {
    if (!drag) return;
    dy = e.touches[0].clientY - startY;
    if (drag === 'maybe') {
      if (dy > 8 && (fromGrab || body.scrollTop <= 0)) { drag = 'on'; sheet.classList.add('is-dragging'); }
      else if (dy < -4) { drag = null; return; }
      else return;
    }
    e.preventDefault();
    sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
  }, { passive: false });

  const endDrag = () => {
    if (drag !== 'on') { drag = null; return; }
    drag = null;
    sheet.classList.remove('is-dragging');
    const velocity = dy / Math.max(1, performance.now() - startT);
    if (dy > 110 || (dy > 30 && velocity > 0.6)) close();
    else sheet.style.transform = '';
  };
  sheet.addEventListener('touchend', endDrag);
  sheet.addEventListener('touchcancel', endDrag);

  // Mus: træk i håndtaget (desktop)
  const grab = sheet.querySelector('.sheet-grab');
  grab.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    grab.setPointerCapture(e.pointerId);
    startY = e.clientY; dy = 0; startT = performance.now();
    sheet.classList.add('is-dragging');
    const move = (ev) => { dy = ev.clientY - startY; sheet.style.transform = `translateY(${Math.max(0, dy)}px)`; };
    const up = () => {
      grab.removeEventListener('pointermove', move);
      sheet.classList.remove('is-dragging');
      if (dy > 110) close(); else if (Math.abs(dy) < 4) close(); else sheet.style.transform = '';
    };
    grab.addEventListener('pointermove', move);
    grab.addEventListener('pointerup', up, { once: true });
  });

  return {
    open,
    close,
    get isOpen() { return isOpen; },
    body,
  };
}
