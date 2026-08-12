/**
 * The pixel pipeline. Pure functions over canvases — no React, no component state.
 *
 *   source image
 *     → base canvas      (rotation + flip baked in, rebuilt only on transform)
 *     → destination      (crop window + CSS filters + optional sharpen)
 *
 * `drawTo` renders both the on-screen preview and the export, so what you
 * download is exactly what you saw. The only thing `quality` changes is
 * whether the sharpen convolution runs: it is skipped mid-gesture to keep
 * dragging at 60fps, and always runs for the export.
 */

import { DEFAULT_ADJUSTMENTS, filterPresets } from './config'

/** Largest preview buffer we will allocate, in device pixels on the long edge. */
const PREVIEW_MAX = 2600
const PREVIEW_MIN = 900

/**
 * Intrinsic size of a drawable source.
 *
 * A source is normally an `Image`, but "Apply Edits" bakes to a `canvas` and
 * hands that back as the new source — and a canvas has `width`/`height` where
 * an image has `naturalWidth`/`naturalHeight`. One accessor keeps every caller
 * from having to care which it is holding.
 */
export function sourceSize(source) {
  if (!source) return { w: 0, h: 0 }
  return {
    w: source.naturalWidth ?? source.width,
    h: source.naturalHeight ?? source.height,
  }
}

/** Builds the offscreen base canvas: the source with rotation and flip applied. */
export function buildBaseCanvas(source, rotation, flipH) {
  if (!source) return null
  const rot = ((rotation % 360) + 360) % 360
  const swap = rot === 90 || rot === 270
  const { w: iw, h: ih } = sourceSize(source)

  const base = document.createElement('canvas')
  base.width = swap ? ih : iw
  base.height = swap ? iw : ih

  const ctx = base.getContext('2d')
  ctx.translate(base.width / 2, base.height / 2)
  ctx.rotate((rot * Math.PI) / 180)
  if (flipH) ctx.scale(-1, 1)
  ctx.drawImage(source, -iw / 2, -ih / 2)
  return base
}

/** The ctx.filter string for the current adjustments. */
export function buildFilter(adj) {
  const preset = filterPresets.find((f) => f.id === adj.filter)?.css ?? ''
  // Exposure rides on brightness; warmth is sepia one way, hue-rotate the other.
  const exposure = 1 + adj.exposure / 200
  const parts = [
    `brightness(${(adj.brightness / 100) * exposure})`,
    `contrast(${adj.contrast}%)`,
    `saturate(${adj.saturation}%)`,
  ]
  if (adj.warmth > 0) parts.push(`sepia(${adj.warmth / 200}) saturate(${100 + adj.warmth / 4}%)`)
  if (adj.warmth < 0) parts.push(`hue-rotate(${adj.warmth / 5}deg) saturate(${100 - adj.warmth / 8}%)`)
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`)
  if (preset) parts.push(preset)
  return parts.join(' ')
}

/**
 * 3×3 sharpen, blended with the original by `amount` (0–1).
 *
 * The kernel is [0,-1,0, -1,5,-1, 0,-1,0]. Because the centre tap is the
 * pixel itself, `kernelSum − original` collapses to `4c − up − down − left −
 * right`, which removes the nested 3×3 loop entirely — one multiply and four
 * subtractions per channel instead of nine multiply-accumulates. Edge pixels
 * are copied through untouched.
 */
export function sharpenCanvas(ctx, w, h, amount) {
  if (amount <= 0 || w < 3 || h < 3) return

  const img = ctx.getImageData(0, 0, w, h)
  const s = img.data
  const out = new Uint8ClampedArray(s) // edges come along for free

  const stride = w * 4

  for (let y = 1; y < h - 1; y++) {
    let i = y * stride + 4 // skip the first column
    for (let x = 1; x < w - 1; x++, i += 4) {
      for (let c = 0; c < 3; c++) {
        const p = i + c
        const centre = s[p]
        const edge = 4 * centre - s[p - 4] - s[p + 4] - s[p - stride] - s[p + stride]
        out[p] = centre + edge * amount
      }
      // alpha already copied
    }
  }

  img.data.set(out)
  ctx.putImageData(img, 0, 0)
}

/**
 * Renders the current state into any 2D context at any size.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} destW  destination width in pixels
 * @param {number} destH  destination height in pixels
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.base   base canvas (rotation/flip applied)
 * @param {{x,y,w,h}} opts.crop           crop window in base pixels
 * @param {object} opts.adjustments
 * @param {'interactive'|'final'} [opts.quality]
 * @param {boolean} [opts.bypass]         draw the untouched original (compare)
 */
export function drawTo(ctx, destW, destH, { base, crop, adjustments, quality = 'final', bypass = false }) {
  ctx.clearRect(0, 0, destW, destH)
  if (!base || !crop?.w || !crop?.h) return

  const adj = bypass ? DEFAULT_ADJUSTMENTS : adjustments

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = buildFilter(adj)
  ctx.drawImage(base, crop.x, crop.y, crop.w, crop.h, 0, 0, destW, destH)
  ctx.restore()

  if (!bypass && quality === 'final' && adj.sharpen > 0) {
    sharpenCanvas(ctx, destW, destH, adj.sharpen / 100)
  }
}

/**
 * Buffer size for the on-screen preview.
 *
 * Rendering at the element's device-pixel size keeps the picture crisp without
 * pushing the full source through every slider tick — a 24MP photo previews at
 * one or two megapixels. Capped so a 400% zoom cannot allocate an enormous
 * canvas, and floored so a small stage still has enough detail to zoom into.
 */
export function previewBufferSize(crop, displayW, displayH, dpr = 1) {
  if (!crop?.w || !crop?.h) return { w: 0, h: 0 }
  const cropLong = Math.max(crop.w, crop.h)
  const displayLong = Math.max(displayW, displayH) * dpr

  const target = Math.min(cropLong, Math.max(displayLong, PREVIEW_MIN), PREVIEW_MAX)
  const scale = target / cropLong

  return {
    w: Math.max(1, Math.round(crop.w * scale)),
    h: Math.max(1, Math.round(crop.h * scale)),
  }
}

/**
 * Flattens the current edit into a standalone canvas at full crop resolution —
 * what "Apply Edits" bakes and then treats as the new source.
 *
 * It goes through `drawTo` at final quality, the same call `exportBlob` makes,
 * so a baked image is pixel-for-pixel what a download at that moment would have
 * given you. Anything else would mean the preview, the export and the bake
 * could drift apart.
 */
export function bakeCanvas(base, crop, adjustments) {
  if (!base || !crop?.w || !crop?.h) return null

  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(crop.w))
  out.height = Math.max(1, Math.round(crop.h))

  // willReadFrequently: the sharpen pass reads this canvas back.
  const ctx = out.getContext('2d', { willReadFrequently: true })
  drawTo(ctx, out.width, out.height, { base, crop, adjustments, quality: 'final' })
  return out
}

/** Full-resolution export. Resolves to a Blob, or null if there is nothing to draw. */
export function exportBlob(base, crop, adjustments, size, type = 'image/jpeg', quality = 0.94) {
  if (!base || !size.w || !size.h) return Promise.resolve(null)

  const out = document.createElement('canvas')
  out.width = size.w
  out.height = size.h

  // willReadFrequently: the sharpen pass reads this canvas back.
  const ctx = out.getContext('2d', { willReadFrequently: true })
  drawTo(ctx, size.w, size.h, { base, crop, adjustments, quality: 'final' })

  return new Promise((resolve) => out.toBlob(resolve, type, quality))
}
