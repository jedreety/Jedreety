/* =========================================================
   Text scramble
   Black Mirror-style character reveal. Cycles through the
   phrases listed in `data-phrases` on the target element.

   The first phrase is rendered statically in the HTML —
   nothing animates on page load. The first scramble fires
   only after HOLD_MS, so the page settles before any
   movement kicks in.
   ========================================================= */

import { prefersReducedMotion } from '../utils.js';

const SCRAMBLE_CHARS  = '!<>-_\\/[]{}—=+*^?#$%&@';
const HOLD_MS         = 28000;  /* time each phrase stays put */
const FRAME_BUDGET    = 200;    /* spreads char start/end frames */
const CHAR_FLIP_PROB  = 0.10;   /* per-frame re-roll probability */


class TextScramble {
  constructor(el) {
    this.el            = el;
    this.queue         = [];
    this.frame         = 0;
    this.frameRequest  = 0;
    this.resolve       = () => {};
    this.update        = this.update.bind(this);
  }

  /* Returns a promise that resolves when newText is fully
     rendered (all characters settled). */
  setText(newText) {
    const oldText = this.el.innerText;
    const length  = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));

    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from  = oldText[i] || '';
      const to    = newText[i] || '';
      const start = Math.floor(Math.random() * FRAME_BUDGET);
      const end   = start + Math.floor(Math.random() * FRAME_BUDGET);
      this.queue.push({ from, to, start, end, char: '' });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output   = '';
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];

      if (this.frame >= item.end) {
        complete++;
        output += item.to;
      } else if (this.frame >= item.start) {
        /* Re-roll the in-flight char occasionally so it
           shimmers rather than freezing on one glyph. */
        if (!item.char || Math.random() < CHAR_FLIP_PROB) {
          item.char = SCRAMBLE_CHARS[
            Math.floor(Math.random() * SCRAMBLE_CHARS.length)
          ];
        }
        output += `<span class="scramble-char">${item.char}</span>`;
      } else {
        output += item.from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}


function initOne(el) {
  let phrases;
  try { phrases = JSON.parse(el.dataset.phrases || '[]'); }
  catch { phrases = []; }
  if (phrases.length < 2) return;

  /* Respect user preference: show the first phrase, do
     nothing else. */
  if (prefersReducedMotion()) {
    el.textContent = phrases[0];
    return;
  }

  const fx = new TextScramble(el);

  /* phrases[0] is already in the HTML, so start the cycle
     at phrases[1]. Avoids re-scrambling what's on screen. */
  let i = 1;

  const cycle = () => {
    fx.setText(phrases[i]).then(() => setTimeout(cycle, HOLD_MS));
    i = (i + 1) % phrases.length;
  };

  /* Wait before the FIRST scramble so nothing animates at
     page load. */
  setTimeout(cycle, HOLD_MS);
}


export function initTextScramble() {
  const els = document.querySelectorAll('[data-component="brand-scramble"]');
  els.forEach(initOne);
}
