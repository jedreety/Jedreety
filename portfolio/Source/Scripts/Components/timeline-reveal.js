/* =========================================================
   Timeline reveal
   Fades each timeline item in as it enters the viewport.

   Defensive pattern: items are visible by default in the
   CSS. This script adds `.is-ready` on the timeline to
   opt IN to the hidden-then-revealed behavior, then adds
   `.is-visible` per item as they intersect.
   If the JS fails to load, items stay visible.

   Stagger: items that arrive in the SAME observer batch
   (page loaded pre-scrolled, or user scrolls fast past
   several at once) get progressive transition-delay so
   they don't animate as one synced block.
   ========================================================= */

import { prefersReducedMotion } from '../utils.js';

const STAGGER_MS = 130;

export function initTimelineReveal() {
  const timeline = document.querySelector('[data-component="timeline"]');
  if (!timeline) return;

  const items = timeline.querySelectorAll('.timeline__item');
  if (!items.length) return;

  if (prefersReducedMotion()) return;

  /* Opt in to the reveal. Without this class, the rule
     `.timeline.is-ready .timeline__item` never matches —
     so items stay visible if anything below this line
     throws. */
  timeline.classList.add('is-ready');

  const observer = new IntersectionObserver(
    (entries, obs) => {
      const incoming = entries.filter((e) => e.isIntersecting);

      incoming.forEach((entry, idx) => {
        entry.target.style.transitionDelay = `${idx * STAGGER_MS}ms`;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    {
      /* Fire slightly before the item enters the visible
         area, so the user catches the animation rather
         than the final state. */
      rootMargin: '0px 0px -8% 0px',
      threshold: 0,
    }
  );

  items.forEach((el) => observer.observe(el));
}
