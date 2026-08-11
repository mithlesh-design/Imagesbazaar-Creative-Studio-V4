/**
 * The studio state machine. Pure — no DOM, no React, no canvas.
 *
 * Three tiers of state, deliberately kept apart:
 *
 *   edit     what the picture looks like. Snapshot-able, undoable.
 *   view     zoom and pan. Never enters history — undoing a slider should not
 *            also scroll you somewhere else.
 *   session  the loaded image and transient UI (active tool, errors).
 */

import { DEFAULT_ADJUSTMENTS, ZOOM_MAX, ZOOM_MIN, ZOOM_STEPS } from './config'
import {
  baseSizeFor,
  clamp,
  clampCrop,
  defaultCrop,
  flipCropRect,
  ratioFor,
  refitCrop,
  rotateCropRect,
} from './cropMath'
import * as H from './history'

const DEFAULT_ASPECT = 'original'

/** Two edits are the same if every tracked field matches. */
export function editEquals(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.rotation !== b.rotation || a.flipH !== b.flipH || a.aspect !== b.aspect) return false
  if (a.crop.x !== b.crop.x || a.crop.y !== b.crop.y || a.crop.w !== b.crop.w || a.crop.h !== b.crop.h)
    return false
  for (const k of Object.keys(DEFAULT_ADJUSTMENTS)) {
    if (a.adjustments[k] !== b.adjustments[k]) return false
  }
  return true
}

const freshEdit = (naturalSize) => {
  const baseSize = baseSizeFor(naturalSize, 0)
  return {
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    crop: defaultCrop(baseSize, ratioFor(DEFAULT_ASPECT, baseSize)),
    rotation: 0,
    flipH: false,
    aspect: DEFAULT_ASPECT,
  }
}

export const initialState = {
  source: null,
  meta: null,
  naturalSize: null,
  loading: false,
  error: null,

  edit: freshEdit(null),
  history: H.emptyHistory(),

  view: { zoom: 1, fit: true, panX: 0, panY: 0 },

  // Which tool is open is shell state, not edit state — it lives in the
  // component, since it is nothing you would ever want to undo.
  comparing: false,
}

/** Base-canvas dimensions for the current rotation. Derived, never stored. */
export const selectBaseSize = (state) => baseSizeFor(state.naturalSize, state.edit.rotation)

export const selectRatio = (state) => ratioFor(state.edit.aspect, selectBaseSize(state))

export const selectIsEdited = (state) => {
  const { adjustments, rotation, flipH, crop } = state.edit
  if (rotation !== 0 || flipH) return true
  for (const k of Object.keys(DEFAULT_ADJUSTMENTS)) {
    if (adjustments[k] !== DEFAULT_ADJUSTMENTS[k]) return true
  }
  const base = selectBaseSize(state)
  return crop.x !== 0 || crop.y !== 0 || crop.w !== base.w || crop.h !== base.h
}

/** Files the current edit as an undo point before applying a discrete change. */
const withUndo = (state, nextEdit) => ({
  ...state,
  edit: nextEdit,
  history: H.push(state.history, state.edit),
})

export function studioReducer(state, action) {
  switch (action.type) {
    // ---------- session ----------
    case 'IMAGE_LOADING':
      return { ...state, loading: true, error: null }

    case 'IMAGE_LOADED': {
      const { source, meta } = action
      const naturalSize = { w: source.naturalWidth, h: source.naturalHeight }
      return {
        ...state,
        source,
        meta,
        naturalSize,
        loading: false,
        error: null,
        edit: freshEdit(naturalSize),
        history: H.emptyHistory(),
        view: { zoom: 1, fit: true, panX: 0, panY: 0 },
        comparing: false,
      }
    }

    case 'IMAGE_ERROR':
      return { ...state, loading: false, error: action.message }

    case 'DISMISS_ERROR':
      return { ...state, error: null }

    case 'CLEAR':
      return { ...initialState }

    // ---------- continuous gestures ----------
    case 'BEGIN':
      return { ...state, history: H.begin(state.history, state.edit) }

    case 'COMMIT':
      return { ...state, history: H.commit(state.history, state.edit, editEquals) }

    case 'ABANDON':
      return { ...state, history: H.abandon(state.history) }

    case 'SET_ADJUSTMENT': {
      const { key, value } = action
      if (state.edit.adjustments[key] === value) return state
      return {
        ...state,
        edit: { ...state.edit, adjustments: { ...state.edit.adjustments, [key]: value } },
      }
    }

    case 'SET_CROP': {
      const crop = clampCrop(action.crop, selectBaseSize(state))
      const c = state.edit.crop
      if (c.x === crop.x && c.y === crop.y && c.w === crop.w && c.h === crop.h) return state
      return { ...state, edit: { ...state.edit, crop } }
    }

    // ---------- discrete edits (own undo entry each) ----------
    case 'SET_FILTER': {
      if (state.edit.adjustments.filter === action.id) return state
      return withUndo(state, {
        ...state.edit,
        adjustments: { ...state.edit.adjustments, filter: action.id },
      })
    }

    case 'SET_ASPECT': {
      if (state.edit.aspect === action.id) return state
      const baseSize = selectBaseSize(state)
      const ratio = ratioFor(action.id, baseSize)
      return withUndo(state, {
        ...state.edit,
        aspect: action.id,
        crop: refitCrop(state.edit.crop, baseSize, ratio),
      })
    }

    case 'ROTATE': {
      if (!state.source) return state
      const turns = action.turns ?? 1
      const baseSize = selectBaseSize(state)
      return withUndo(state, {
        ...state.edit,
        rotation: (state.edit.rotation + turns * 90 + 360) % 360,
        crop: rotateCropRect(state.edit.crop, baseSize, turns),
      })
    }

    case 'FLIP': {
      if (!state.source) return state
      return withUndo(state, {
        ...state.edit,
        flipH: !state.edit.flipH,
        crop: flipCropRect(state.edit.crop, selectBaseSize(state)),
      })
    }

    case 'RESET': {
      if (!state.source) return state
      const fresh = freshEdit(state.naturalSize)
      if (editEquals(fresh, state.edit)) return state
      return withUndo(state, fresh)
    }

    // ---------- history ----------
    case 'UNDO': {
      const result = H.undo(state.history, state.edit)
      if (!result) return state
      return { ...state, edit: result.snapshot, history: result.history }
    }

    case 'REDO': {
      const result = H.redo(state.history, state.edit)
      if (!result) return state
      return { ...state, edit: result.snapshot, history: result.history }
    }

    // ---------- view ----------
    case 'SET_ZOOM': {
      const zoom = clamp(action.zoom, ZOOM_MIN, ZOOM_MAX)
      return { ...state, view: { ...state.view, zoom, fit: false } }
    }

    case 'ZOOM_STEP': {
      const current = state.view.zoom
      const steps = action.dir > 0 ? ZOOM_STEPS : [...ZOOM_STEPS].reverse()
      const next =
        steps.find((z) => (action.dir > 0 ? z > current + 0.001 : z < current - 0.001)) ?? current
      return { ...state, view: { ...state.view, zoom: next, fit: false } }
    }

    case 'ZOOM_FIT':
      return { ...state, view: { zoom: 1, fit: true, panX: 0, panY: 0 } }

    case 'ZOOM_ACTUAL':
      return { ...state, view: { ...state.view, zoom: 1, fit: false } }

    case 'SET_PAN':
      return { ...state, view: { ...state.view, panX: action.x, panY: action.y } }

    // ---------- ui ----------
    case 'SET_COMPARING':
      return state.comparing === action.value ? state : { ...state, comparing: action.value }

    default:
      return state
  }
}
