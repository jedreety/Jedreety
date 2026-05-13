/* =========================================================
   Hero cursor glow
   Tracks the cursor inside the hero and moves an additive
   halo to follow it. The halo brightens whatever sits below
   (skylight video + bg) via `mix-blend-mode: screen`, so
   it complements the always-on skylight instead of hiding it.

   --mx / --my are set in pixels relative to the hero
   element; the CSS positions the gradient from those.
   ========================================================= */

import { prefersReducedMotion } from '../utils.js';

export function initHeroCursorGlow() {
  const glow = document.querySelector('[data-component="hero-cursor-glow"]');
  const hero = document.getElementById('hero');
  if (!glow || !hero) return;

  if (prefersReducedMotion()) return;

  let targetX = null;
  let targetY = null;
  let rafId   = 0;

  const update = () => {
    rafId = 0;
    if (targetX == null) return;
    const rect = hero.getBoundingClientRect();
    glow.style.setProperty('--mx', `${targetX - rect.left}px`);
    glow.style.setProperty('--my', `${targetY - rect.top}px`);
  };

  const onMove = (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    glow.classList.add('is-active');
    if (!rafId) rafId = requestAnimationFrame(update);
  };

  /* Fade out when the cursor leaves the hero — avoids a
     stuck highlight while scrolling through the rest of
     the page. */
  const onLeave = () => glow.classList.remove('is-active');

  hero.addEventListener('pointermove',  onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
}
