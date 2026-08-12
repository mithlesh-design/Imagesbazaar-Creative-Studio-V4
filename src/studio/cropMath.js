/**
 * Crop geometry. Pure functions over plain objects — no DOM, no React.
 *
 * A crop is `{ x, y, w, h }` in *base-canvas pixels*, where the base canvas is
 * the source image with rotation and flip already baked in. Working in base
 * pixels (rather than the old percentage offsets) means the crop survives a
 * ratio change, tells us the exact export size, and can be dragged directly.
 */

import { aspectRatios } from './config'

const MIN_EDGE = 24 // px, so a crop can never be dragged to nothing

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** Dimensions of the base canvas once `rotation` has been applied. */
export function baseSizeFor(natural, rotation) {
  if (!natural) return { w: 0, h: 0 }
  const swap = normaliseRotation(rotation) % 180 === 90
  return swap ? { w: natural.h, h: natural.w } : { w: natural.w, h: natural.h }
}

export function normaliseRotation(rotation) {
  return ((rotation % 360) + 360) % 360
}

/**
 * The numeric ratio for an aspect id, or null when the crop is free-form.
 *
 * `'original'` resolves against the base size so it follows the image.
 * `'custom:5:4'` carries a typed ratio in the id itself — that keeps the aspect
 * a single serialisable string, so history snapshots and undo need to know
 * nothing about custom ratios being a different kind of thing.
 */
export function ratioFor(aspectId, baseSize) {
  if (typeof aspectId === 'string' && aspectId.startsWith('custom:')) {
    const [, w, h] = aspectId.split(':')
    const ratio = Number(w) / Number(h)
    return Number.isFinite(ratio) && ratio > 0 ? ratio : null
  }

  const found = aspectRatios.find((a) => a.id === aspectId)
  if (!found || found.ratio === null) return null
  if (found.ratio === 'source') {
    if (!baseSize?.w || !baseSize?.h) return null
    return baseSize.w / baseSize.h
  }
  return found.ratio
}

/** The largest rect of `ratio` that fits in `baseSize`, centred. */
export function defaultCrop(baseSize, ratio) {
  const { w: bw, h: bh } = baseSize
  if (!bw || !bh) return { x: 0, y: 0, w: 0, h: 0 }
  if (ratio === null) return { x: 0, y: 0, w: bw, h: bh }

  let w = bw
  let h = w / ratio
  if (h > bh) {
    h = bh
    w = h * ratio
  }
  return {
    x: Math.round((bw - w) / 2),
    y: Math.round((bh - h) / 2),
    w: Math.round(w),
    h: Math.round(h),
  }
}

/**
 * Fits an existing crop to a new ratio, preserving its centre where possible.
 * Used when the user switches ratio mid-edit — the frame should shift, not jump
 * back to the middle of the image.
 */
export function refitCrop(crop, baseSize, ratio) {
  if (ratio === null) return clampCrop(crop, baseSize)
  const { w: bw, h: bh } = baseSize
  if (!bw || !bh) return crop

  const cx = crop.x + crop.w / 2
  const cy = crop.y + crop.h / 2

  // Keep the crop's area roughly constant so the reframe feels continuous.
  let w = Math.sqrt(crop.w * crop.h * ratio)
  let h = w / ratio

  // Then shrink to fit inside the image.
  const scale = Math.min(1, bw / w, bh / h)
  w *= scale
  h *= scale

  return clampCrop(
    { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) },
    baseSize
  )
}

/** Pushes a crop back inside the image without changing its size. */
export function clampCrop(crop, baseSize) {
  const { w: bw, h: bh } = baseSize
  const w = clamp(Math.round(crop.w), MIN_EDGE, bw || MIN_EDGE)
  const h = clamp(Math.round(crop.h), MIN_EDGE, bh || MIN_EDGE)
  return {
    x: clamp(Math.round(crop.x), 0, Math.max(0, bw - w)),
    y: clamp(Math.round(crop.y), 0, Math.max(0, bh - h)),
    w,
    h,
  }
}

/** Translate the crop by a delta in base pixels, clamped to the image. */
export function moveCrop(crop, dx, dy, baseSize) {
  return clampCrop({ ...crop, x: crop.x + dx, y: crop.y + dy }, baseSize)
}

/**
 * Resize from a handle. `handle` is one of nw/n/ne/e/se/s/sw/w.
 *
 * The corner opposite the dragged handle stays pinned. When `ratio` is set the
 * free axis is derived from the driving one, chosen so diagonal drags feel
 * natural (corners drive width; the n/s edges drive height).
 */
export function resizeCrop(crop, handle, dx, dy, baseSize, ratio) {
  const { w: bw, h: bh } = baseSize
  const left = handle.includes('w')
  const right = handle.includes('e')
  const top = handle.includes('n')
  const bottom = handle.includes('s')

  let { x, y, w, h } = crop

  if (right) w = crop.w + dx
  if (left) {
    w = crop.w - dx
    x = crop.x + dx
  }
  if (bottom) h = crop.h + dy
  if (top) {
    h = crop.h - dy
    y = crop.y + dy
  }

  if (ratio !== null) {
    // The n/s edge handles have no horizontal component, so height drives.
    const heightDrives = handle === 'n' || handle === 's'
    if (heightDrives) w = h * ratio
    else h = w / ratio

    // Re-pin the anchored edges after the constraint changed the free axis.
    if (left) x = crop.x + crop.w - w
    else if (!right) x = crop.x + (crop.w - w) / 2

    if (top) y = crop.y + crop.h - h
    else if (!bottom) y = crop.y + (crop.h - h) / 2
  }

  // Enforce the minimum before clamping so tiny drags cannot invert the rect.
  if (w < MIN_EDGE) {
    if (left) x -= MIN_EDGE - w
    w = MIN_EDGE
    if (ratio !== null) h = w / ratio
  }
  if (h < MIN_EDGE) {
    if (top) y -= MIN_EDGE - h
    h = MIN_EDGE
    if (ratio !== null) w = h * ratio
  }

  // Don't let a resize walk the rect off the image: shrink instead of sliding.
  if (x < 0) {
    if (ratio !== null) {
      const shrink = -x
      w -= shrink
      h = w / ratio
    }
    x = 0
  }
  if (y < 0) {
    if (ratio !== null) {
      const shrink = -y
      h -= shrink
      w = h * ratio
    }
    y = 0
  }
  if (x + w > bw) {
    w = bw - x
    if (ratio !== null) h = w / ratio
  }
  if (y + h > bh) {
    h = bh - y
    if (ratio !== null) w = h * ratio
  }

  return clampCrop({ x, y, w, h }, baseSize)
}

/**
 * Remaps a crop through a quarter-turn so the framing follows the picture.
 *
 * `turns` is +1 for each 90° clockwise step. `baseSize` is the base *before*
 * the turn; the returned rect is in the post-turn coordinate space.
 */
export function rotateCropRect(crop, baseSize, turns = 1) {
  let rect = { ...crop }
  let size = { ...baseSize }

  const steps = ((turns % 4) + 4) % 4
  for (let i = 0; i < steps; i++) {
    // Clockwise: a point (x, y) lands at (H − y, x) in the new H×W space.
    rect = {
      x: size.h - (rect.y + rect.h),
      y: rect.x,
      w: rect.h,
      h: rect.w,
    }
    size = { w: size.h, h: size.w }
  }
  return clampCrop(rect, size)
}

/** Mirrors a crop horizontally, so a flip keeps the same part of the subject. */
export function flipCropRect(crop, baseSize) {
  return clampCrop({ ...crop, x: baseSize.w - (crop.x + crop.w) }, baseSize)
}

/** The export dimensions for a given long edge, honouring the crop's shape. */
export function exportSizeFor(crop, longEdge) {
  if (!crop.w || !crop.h) return { w: 0, h: 0 }
  const r = crop.w / crop.h
  return r >= 1
    ? { w: Math.round(longEdge), h: Math.max(1, Math.round(longEdge / r)) }
    : { w: Math.max(1, Math.round(longEdge * r)), h: Math.round(longEdge) }
}

/** Largest long edge available without upscaling — now exact, not derived. */
export function maxLongEdgeFor(crop) {
  return Math.floor(Math.max(crop.w || 0, crop.h || 0))
}
