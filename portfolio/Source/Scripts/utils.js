/* =========================================================
   Shared utilities
   Tiny helpers used by multiple components. Add a function
   here when a second component needs it — not before.
   ========================================================= */

/* Cached MediaQueryList. `.matches` stays reactive, so this
   reflects the current setting if the user toggles the OS
   preference mid-session. */
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * @returns {boolean} true when the user has requested
 *                    reduced motion at the OS level.
 */
export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}
