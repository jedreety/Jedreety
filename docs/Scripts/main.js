/* =========================================================
   Entry point
   Imports each component's initializer and runs them on
   DOM ready. Components are self-contained: each is a
   no-op if its target element isn't in the page.
   ========================================================= */

import { initTextScramble }     from './components/text-scramble.js';
import { initHeroCursorGlow }   from './components/hero-cursor-glow.js';
import { initTimelineReveal }   from './components/timeline-reveal.js';
import { initProjectsCarousel } from './components/projects-carousel.js';

function init() {
  initTextScramble();
  initHeroCursorGlow();
  initTimelineReveal();
  initProjectsCarousel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
