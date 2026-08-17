/**
 * Remembers whether the hero walkthrough has been shown.
 *
 * Deliberately plain ESM — no React, no CSS import — so `scripts/shoot.mjs` can
 * import TOUR_KEY directly and the key can never drift between the app and the
 * gate that seeds it.
 *
 * The key is versioned rather than the payload alone: adding a fifth step later
 * means bumping to v2, which intentionally re-shows the tour to people who saw
 * the old one.
 */
export const TOUR_KEY = 'ib.tour.hero.v1'

/**
 * Mirrors the flag for the session when storage cannot be written.
 *
 * Module scope, not component state, and that matters: `App.jsx` is a ternary
 * rather than a router, so `Home` unmounts entirely on the way to the studio and
 * remounts on return. Without this the tour would relaunch on every trip back.
 */
let memoryFlag = false

/**
 * True when the walkthrough should not auto-start.
 *
 * A read failure counts as seen. The two error directions are not symmetric: a
 * tour that cannot remember being dismissed reappears on every load forever with
 * no way for the user to stop it, whereas failing to show an optional
 * walkthrough costs one nicety and is recoverable from the View Guide link.
 */
export function hasSeenTour() {
  if (memoryFlag) return true
  try {
    return Boolean(window.localStorage.getItem(TOUR_KEY))
  } catch {
    return true
  }
}

/** @param {'completed' | 'skipped'} outcome */
export function markTourSeen(outcome) {
  memoryFlag = true
  try {
    window.localStorage.setItem(
      TOUR_KEY,
      JSON.stringify({ v: 1, outcome, at: Date.now() })
    )
  } catch {
    /* The module-scope mirror above already covers this session. */
  }
}
