import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { aspectRatios, filterPresets } from '../data/characters'

/**
 * Canvas-backed image editor.
 *
 * Pipeline: source image → offscreen "base" canvas (rotation + flip baked in)
 * → target canvas (framing + CSS filters + optional sharpen convolution).
 *
 * The same `drawTo` routine renders both the on-screen preview and the export,
 * so what you download is exactly what you saw. The preview is capped at
 * PREVIEW_EDGE for responsiveness; the export runs at full resolution.
 */

const PREVIEW_EDGE = 1000

export const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  exposure: 0, // -100..100
  contrast: 100,
  saturation: 100,
  warmth: 0, // -100 (cool) .. 100 (warm)
  blur: 0,
  sharpen: 0,
  filter: 'none',
}

/** 3×3 sharpen convolution, blended with the original by `amount` (0–1). */
function sharpenCanvas(ctx, w, h, amount) {
  if (amount <= 0 || w < 3 || h < 3) return

  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.createImageData(w, h)
  const s = src.data
  const o = out.data
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0]

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        o[i] = s[i]; o[i + 1] = s[i + 1]; o[i + 2] = s[i + 2]; o[i + 3] = s[i + 3]
        continue
      }
      for (let c = 0; c < 3; c++) {
        let sum = 0
        let ki = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++, ki++) {
            sum += s[((y + dy) * w + (x + dx)) * 4 + c] * k[ki]
          }
        }
        const orig = s[i + c]
        o[i + c] = Math.max(0, Math.min(255, orig + (sum - orig) * amount))
      }
      o[i + 3] = s[i + 3]
    }
  }
  ctx.putImageData(out, 0, 0)
}

/** Builds the ctx.filter string for the current adjustments. */
function buildFilter(adj) {
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

export function useImageEditor() {
  const canvasRef = useRef(null)
  const baseRef = useRef(null) // offscreen canvas: source with rotation/flip applied

  const [source, setSource] = useState(null) // HTMLImageElement
  const [meta, setMeta] = useState(null) // { name, alt, title }
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [aspect, setAspect] = useState('1:1')
  const [fit, setFit] = useState('cover') // 'cover' | 'contain'
  const [offset, setOffset] = useState({ x: 50, y: 50 })
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const hasImage = Boolean(source)

  const naturalSize = useMemo(
    () => (source ? { w: source.naturalWidth, h: source.naturalHeight } : null),
    [source]
  )

  const activeRatio = useMemo(() => {
    const found = aspectRatios.find((a) => a.id === aspect)
    if (found?.ratio) return found.ratio
    if (source) return source.naturalWidth / source.naturalHeight
    return 1
  }, [aspect, source])

  /** Rebuild the rotated/flipped base canvas when the source or transform changes. */
  useEffect(() => {
    if (!source) {
      baseRef.current = null
      return
    }
    const rot = ((rotation % 360) + 360) % 360
    const swap = rot === 90 || rot === 270
    const iw = source.naturalWidth
    const ih = source.naturalHeight

    const base = document.createElement('canvas')
    base.width = swap ? ih : iw
    base.height = swap ? iw : ih

    const bctx = base.getContext('2d')
    bctx.translate(base.width / 2, base.height / 2)
    bctx.rotate((rot * Math.PI) / 180)
    if (flipH) bctx.scale(-1, 1)
    bctx.drawImage(source, -iw / 2, -ih / 2)
    baseRef.current = base
  }, [source, rotation, flipH])

  /**
   * Renders the current state into any 2D context at any size.
   * Shared by the preview and the export so they cannot drift apart.
   */
  const drawTo = useCallback(
    (ctx, w, h) => {
      const base = baseRef.current
      ctx.clearRect(0, 0, w, h)
      if (!base) return

      ctx.save()
      ctx.filter = buildFilter(adjustments)

      const bw = base.width
      const bh = base.height

      if (fit === 'contain') {
        const scale = Math.min(w / bw, h / bh)
        const dw = bw * scale
        const dh = bh * scale
        ctx.drawImage(base, (w - dw) / 2, (h - dh) / 2, dw, dh)
      } else {
        // cover: choose the source rect, positioned by the crop offset
        const scale = Math.max(w / bw, h / bh)
        const sw = w / scale
        const sh = h / scale
        const sx = (bw - sw) * (offset.x / 100)
        const sy = (bh - sh) * (offset.y / 100)
        ctx.drawImage(base, sx, sy, sw, sh, 0, 0, w, h)
      }

      ctx.restore()

      if (adjustments.sharpen > 0) {
        sharpenCanvas(ctx, w, h, adjustments.sharpen / 100)
      }
    },
    [adjustments, fit, offset]
  )

  /** Preview render, capped for responsiveness. */
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = activeRatio
    const w = ratio >= 1 ? PREVIEW_EDGE : Math.round(PREVIEW_EDGE * ratio)
    const h = ratio >= 1 ? Math.round(PREVIEW_EDGE / ratio) : PREVIEW_EDGE
    canvas.width = w
    canvas.height = h
    // willReadFrequently: the sharpen pass reads this canvas back on every
    // slider move, which Chrome warns about otherwise.
    drawTo(canvas.getContext('2d', { willReadFrequently: true }), w, h)
  }, [activeRatio, drawTo])

  useEffect(() => {
    render()
  }, [render, source, rotation, flipH])

  /** Dimensions the export would produce for a given long-edge target. */
  const exportSize = useCallback(
    (longEdge) => {
      const r = activeRatio
      return r >= 1
        ? { w: Math.round(longEdge), h: Math.round(longEdge / r) }
        : { w: Math.round(longEdge * r), h: Math.round(longEdge) }
    },
    [activeRatio]
  )

  /**
   * The largest long edge this image can produce without upscaling.
   *
   * Derived from the source dimensions rather than from `baseRef`, which is
   * populated in an effect and would still be null on the render where a new
   * image arrives — leaving the download sizes stuck at zero.
   */
  const maxLongEdge = useMemo(() => {
    if (!naturalSize) return 0
    const rot = ((rotation % 360) + 360) % 360
    const swap = rot === 90 || rot === 270
    const bw = swap ? naturalSize.h : naturalSize.w
    const bh = swap ? naturalSize.w : naturalSize.h
    // Largest frame of the active ratio that fits inside the source.
    const w = Math.min(bw, bh * activeRatio)
    return Math.floor(Math.max(w, w / activeRatio))
  }, [activeRatio, naturalSize, rotation])

  /** Full-resolution export. Returns a Blob. */
  const exportBlob = useCallback(
    async (longEdge, type = 'image/png', quality = 0.95) => {
      if (!baseRef.current) return null
      const { w, h } = exportSize(longEdge)
      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      drawTo(out.getContext('2d', { willReadFrequently: true }), w, h)
      return new Promise((resolve) => out.toBlob(resolve, type, quality))
    },
    [drawTo, exportSize]
  )

  /** Shared image ingestion. */
  const ingest = useCallback((src, info, revoke) => {
    setLoading(true)
    const img = new Image()
    // Guards against tainting the canvas if a remote URL is ever used.
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setSource(img)
      setMeta(info)
      setRotation(0)
      setFlipH(false)
      setOffset({ x: 50, y: 50 })
      setAdjustments(DEFAULT_ADJUSTMENTS)
      setFit('cover')
      setLoading(false)
      revoke?.()
    }
    img.onerror = () => {
      setError('That image could not be opened.')
      setLoading(false)
      revoke?.()
    }
    img.src = src
  }, [])

  /** Load from the library or any same-origin URL. */
  const loadFromSource = useCallback(
    ({ url, name, alt, title }) => {
      if (!url) return
      setError(null)
      ingest(url, { name: name ?? url.split('/').pop(), alt, title })
    },
    [ingest]
  )

  /** Load a File from the picker or a drop. */
  const loadFile = useCallback(
    (file) => {
      setError(null)
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('That file is not an image.')
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('Images must be under 15MB.')
        return
      }
      const url = URL.createObjectURL(file)
      ingest(url, { name: file.name, title: file.name }, () => URL.revokeObjectURL(url))
    },
    [ingest]
  )

  /** Bakes the current preview back into the source, clearing adjustments. */
  const bake = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !baseRef.current) return
    ingest(canvas.toDataURL('image/png'), meta)
  }, [ingest, meta])

  const setAdjustment = useCallback((key, value) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setRotation(0)
    setFlipH(false)
    setOffset({ x: 50, y: 50 })
    setFit('cover')
  }, [])

  const clear = useCallback(() => {
    setSource(null)
    setMeta(null)
    setAspect('1:1')
    reset()
  }, [reset])

  const rotate = useCallback(() => setRotation((r) => (r + 90) % 360), [])
  const flip = useCallback(() => setFlipH((f) => !f), [])

  const isEdited = useMemo(() => {
    const a = adjustments
    return (
      Object.keys(DEFAULT_ADJUSTMENTS).some((k) => a[k] !== DEFAULT_ADJUSTMENTS[k]) ||
      rotation !== 0 ||
      flipH ||
      offset.x !== 50 ||
      offset.y !== 50
    )
  }, [adjustments, rotation, flipH, offset])

  return {
    canvasRef,
    hasImage,
    loading,
    meta,
    naturalSize,
    error,
    setError,
    aspect,
    setAspect,
    activeRatio,
    fit,
    setFit,
    offset,
    setOffset,
    rotation,
    rotate,
    flipH,
    flip,
    adjustments,
    setAdjustment,
    isEdited,
    loadFile,
    loadFromSource,
    bake,
    reset,
    clear,
    exportBlob,
    exportSize,
    maxLongEdge,
  }
}
