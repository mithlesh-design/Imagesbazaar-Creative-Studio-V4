import { useEffect } from 'react'
import { drawTo, previewBufferSize } from './renderer'

/**
 * Drives the preview canvas outside React's render cycle.
 *
 * Two things make this cheap. Updates are coalesced through a single
 * requestAnimationFrame, so ten slider ticks inside one frame cost one paint.
 * And the paint runs at *interactive* quality — which skips the sharpen
 * convolution — with a *final* pass scheduled once the input settles. Sharpen
 * is the only genuinely expensive stage, and nobody can see it mid-drag.
 */

const SETTLE_MS = 140

export function useRenderLoop({
  canvasRef,
  baseRef,
  baseVersion,
  crop,
  adjustments,
  comparing,
  displayW,
  displayH,
}) {
  useEffect(() => {
    let raf = 0
    let timer = 0

    const paint = (quality) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const dpr = window.devicePixelRatio || 1
      const size = previewBufferSize(crop, displayW, displayH, dpr)
      if (!size.w || !size.h) return

      // Reassigning width/height clears the canvas, so only do it on a change.
      if (canvas.width !== size.w || canvas.height !== size.h) {
        canvas.width = size.w
        canvas.height = size.h
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      drawTo(ctx, size.w, size.h, {
        base: baseRef.current,
        crop,
        adjustments,
        quality,
        bypass: comparing,
      })
    }

    raf = requestAnimationFrame(() => paint('interactive'))

    // Only schedule the expensive pass when there is something expensive to do.
    if (!comparing && adjustments.sharpen > 0) {
      timer = setTimeout(() => paint('final'), SETTLE_MS)
    }

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [
    canvasRef,
    baseRef,
    baseVersion,
    crop,
    adjustments,
    comparing,
    displayW,
    displayH,
  ])
}
