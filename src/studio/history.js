/**
 * Undo/redo over immutable snapshots. Pure — no DOM, no React.
 *
 * A snapshot is the whole `EditState` (adjustments + crop + rotation + flip +
 * aspect): about twenty numbers, so keeping sixty of them is free. Storing
 * whole states rather than inverse commands means undo can never drift out of
 * sync with the render, which is the usual failure mode of command stacks.
 *
 * The important detail is *when* a snapshot is taken. Dragging a slider fires
 * hundreds of updates; each must repaint but only the gesture as a whole is
 * one undo step. `begin`/`commit` bracket a gesture — `begin` remembers where
 * it started, `commit` files that starting point once, on release.
 */

import { HISTORY_LIMIT } from './config'

export const emptyHistory = () => ({ past: [], future: [], pending: null })

/**
 * Files `snapshot` as an undo point and clears the redo stack.
 * Used for discrete actions (rotate, flip, pick a filter) that need no bracket.
 */
export function push(history, snapshot) {
  const past = [...history.past, snapshot]
  return {
    past: past.length > HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT) : past,
    future: [],
    pending: null,
  }
}

/** Marks the start of a continuous gesture, if one is not already open. */
export function begin(history, snapshot) {
  if (history.pending) return history
  return { ...history, pending: snapshot }
}

/**
 * Closes a gesture. `current` is the state as it now stands; if the gesture
 * changed nothing, no undo entry is created.
 */
export function commit(history, current, isEqual) {
  if (!history.pending) return history
  if (isEqual(history.pending, current)) return { ...history, pending: null }
  return push(history, history.pending)
}

/** Abandons an open gesture without filing it (used when a drag is cancelled). */
export function abandon(history) {
  return history.pending ? { ...history, pending: null } : history
}

export const canUndo = (history) => history.past.length > 0
export const canRedo = (history) => history.future.length > 0

/** Returns `{ history, snapshot }`, or null when there is nothing to undo. */
export function undo(history, current) {
  if (!canUndo(history)) return null
  const snapshot = history.past[history.past.length - 1]
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
      pending: null,
    },
    snapshot,
  }
}

/** Returns `{ history, snapshot }`, or null when there is nothing to redo. */
export function redo(history, current) {
  if (!canRedo(history)) return null
  const [snapshot, ...rest] = history.future
  return {
    history: {
      past: [...history.past, current],
      future: rest,
      pending: null,
    },
    snapshot,
  }
}
