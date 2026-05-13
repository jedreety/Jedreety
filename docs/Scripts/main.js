/* =========================================================
   Entry point
   Imports each component's initializer and runs them on
   DOM ready. Components are self-contained: each is a
   no-op if its target element isn't in the page.
   ========================================================= */

import { initTextScramble }     from './Components/text-scramble.js';
import { initHeroCursorGlow }   from './Components/hero-cursor-glow.js';
import { initTimelineReveal }   from './Components/timeline-reveal.js';
import { initProjectsCarousel } from './Components/projects-carousel.js';

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
