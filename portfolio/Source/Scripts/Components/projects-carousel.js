/* =========================================================
   Projects carousel — osu!-style selector
   -------------------------------------------------------
   State          : which strip is selected.
   Inputs         : wheel, arrow keys, click, hover-pause.
   Outputs        : per-item --item-y / --curve-x / opacity,
                    `.is-selected` class, backdrop swap.
   Auto-cycle     : ambient progression, paused on hover or
                    any direct user interaction (~8 s pause).
                    Set AUTO_CYCLE_MS = 0 to disable entirely.
   ========================================================= */

import { prefersReducedMotion } from '../utils.js';

export function initProjectsCarousel() {
  const stage    = document.querySelector('[data-component="projects-carousel"]');
  const backdrop = document.querySelector('[data-component="projects-backdrop"]');
  if (!stage) return;

  const list  = stage.querySelector('.projects__list');
  const items = Array.from(stage.querySelectorAll('.projects__item'));
  if (!list || items.length === 0) return;


  /* ── Image setup ──────────────────────────────────────
     Apply each strip's `data-image` as its background.
     Without this, strips fall back to the CSS gradient. */
  items.forEach((item) => {
    const image = item.dataset.image;
    if (!image) return;
    const bg = item.querySelector('.project-strip__bg');
    if (bg) bg.style.backgroundImage = `url('${image}')`;
  });


  /* ── Geometry from CSS ────────────────────────────────
     Read --strip-h / --strip-gap at init time so the CSS
     stays the single source of truth (no duplicated
     magic numbers here). */
  const cs        = getComputedStyle(stage);
  const stripH    = parseFloat(cs.getPropertyValue('--strip-h'))   || 76;
  const stripGap  = parseFloat(cs.getPropertyValue('--strip-gap')) || 14;
  const STRIP_STEP = stripH + stripGap;


  /* ── Tunables ─────────────────────────────────────────
     Curve: |distance|^CURVE_POWER * CURVE_FACTOR, except
     selected which sits at -SELECTED_OFFSET (pops left). */
  const SELECTED_OFFSET = 80;
  const CURVE_POWER     = 1.4;
  const CURVE_FACTOR    = 35;

  const AUTO_CYCLE_MS   = 5000;   /* 0 disables auto-cycle  */
  const USER_PAUSE_MS   = 8000;   /* pause after user input */

  const WHEEL_THRESHOLD = 50;     /* px of wheel for 1 step */
  const STEP_COOLDOWN   = 220;    /* ms minimum between steps */


  /* ── State ────────────────────────────────────────────  */
  let selectedIndex   = 0;
  let autoCycleTimer  = null;
  let autoCyclePaused = false;   /* true while in USER_PAUSE_MS window */
  let userPauseTimer  = null;
  let wheelAcc        = 0;
  let lastStepAt      = 0;
  let inView          = false;

  const reducedMotion = prefersReducedMotion();


  /* ── Geometry ────────────────────────────────────────── */
  function curveOffset(distance) {
    const abs = Math.abs(distance);
    if (abs === 0) return -SELECTED_OFFSET;
    return Math.pow(abs, CURVE_POWER) * CURVE_FACTOR;
  }


  /* ── Render ───────────────────────────────────────────
     Position every item from the selectedIndex. Uses the
     shortest wrapped distance so the carousel feels
     infinite — an item just off the bottom can re-enter
     at the top. Wrap teleports are made invisible by
     suspending the transition during the jump. */
  function render() {
    const n    = items.length;
    const half = Math.floor(n / 2);

    items.forEach((item, i) => {
      let dist = i - selectedIndex;
      while (dist >  half) dist -= n;
      while (dist < -half) dist += n;

      /* Detect a wrap: |Δdist| > 1 means the item
         teleported across the carousel. We want that
         teleport to be instant, not animated. */
      const prevDist = item._lastDist;
      const isWrap   = prevDist !== undefined && Math.abs(dist - prevDist) > 1;

      if (isWrap) item.style.transition = 'none';

      item.style.setProperty('--curve-x', `${curveOffset(dist)}px`);
      item.style.setProperty('--item-y',  `${dist * STRIP_STEP}px`);

      /* Fade the wrap-zone items so the teleport at dist
         ±2 (with n=5) is hidden behind opacity 0. */
      const abs     = Math.abs(dist);
      const opacity = abs <= 1 ? 1 : Math.max(0, 1 - (abs - 1) * 0.85);
      item.style.setProperty('--item-opacity', opacity);

      item.classList.toggle('is-selected', i === selectedIndex);
      item._lastDist = dist;

      if (isWrap) {
        /* Force reflow so `transition: none` lands BEFORE
           the new transform values, then restore the
           transition on the next frame for future moves. */
        void item.offsetHeight;
        requestAnimationFrame(() => { item.style.transition = ''; });
      }
    });

    if (backdrop) {
      const image = items[selectedIndex].dataset.image;
      if (image) {
        backdrop.style.backgroundImage = `url('${image}')`;
        backdrop.classList.add('is-visible');
      }
    }
  }


  /* ── Selection helpers ──────────────────────────────── */
  function select(index) {
    const n = items.length;
    /* Safe modulo for negative indices. */
    selectedIndex = ((index % n) + n) % n;
    render();
  }

  function next() { select(selectedIndex + 1); }
  function prev() { select(selectedIndex - 1); }


  /* ── Auto-cycle ───────────────────────────────────────  */
  function startAutoCycle() {
    if (reducedMotion || AUTO_CYCLE_MS <= 0) return;
    if (autoCyclePaused || autoCycleTimer || !inView) return;
    autoCycleTimer = setInterval(next, AUTO_CYCLE_MS);
  }

  function stopAutoCycle() {
    if (autoCycleTimer) {
      clearInterval(autoCycleTimer);
      autoCycleTimer = null;
    }
  }

  /* Any explicit user input → pause auto-cycle for
     USER_PAUSE_MS, then resume if conditions still hold. */
  function flagUserInteracted() {
    autoCyclePaused = true;
    stopAutoCycle();
    if (userPauseTimer) clearTimeout(userPauseTimer);
    userPauseTimer = setTimeout(() => {
      autoCyclePaused = false;
      startAutoCycle();
    }, USER_PAUSE_MS);
  }


  /* ── Wheel ────────────────────────────────────────────
     We hijack vertical wheel inside the stage. Standard
     trade-off for an osu!-style selector: the page no
     longer scrolls while the cursor is on the carousel.
     The hint above the stage tells the user what's going
     on. */
  list.addEventListener('wheel', (e) => {
    e.preventDefault();
    flagUserInteracted();

    const now = performance.now();
    if (now - lastStepAt < STEP_COOLDOWN) return;

    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) >= WHEEL_THRESHOLD) {
      const dir = Math.sign(wheelAcc);
      wheelAcc   = 0;
      lastStepAt = now;
      if (dir > 0) next();
      else         prev();
    }
  }, { passive: false });

  list.addEventListener('pointerenter', stopAutoCycle);
  list.addEventListener('pointerleave', () => {
    if (!autoCyclePaused) startAutoCycle();
  });


  /* ── Click on a strip ───────────────────────────────── */
  items.forEach((item, i) => {
    item.addEventListener('click', (e) => {
      if (i !== selectedIndex) {
        /* Selecting a non-current strip → prevent
           navigation, just bring it to the center. */
        e.preventDefault();
        flagUserInteracted();
        select(i);
      }
      /* If it's already selected, let the <a> behave
         normally and follow its href. */
    });
  });


  /* ── Keyboard ─────────────────────────────────────────
     Only intercept arrows when the section is in view —
     otherwise we'd hijack page-level keyboard scrolling. */
  document.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      flagUserInteracted();
      next();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      flagUserInteracted();
      prev();
    }
  });


  /* ── Visibility observer ──────────────────────────────
     Auto-cycle only ticks while the section is on screen.
     No point cycling while the user is up reading the hero. */
  const visObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        inView = entry.isIntersecting;
        if (inView) startAutoCycle();
        else        stopAutoCycle();
      });
    },
    { threshold: 0.25 }
  );
  visObserver.observe(stage);


  /* ── Boot ───────────────────────────────────────────── */
  render();
}
