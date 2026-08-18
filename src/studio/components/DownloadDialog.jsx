import { useEffect, useRef, useState } from 'react'
import { Check, Crown, Download, Loader2, Lock, X } from 'lucide-react'
import { downloadFormat, resolutionTiers, subscriptionPlans } from '../config'
import { exportSizeFor } from '../cropMath'
import { useStudio, useStudioActions } from '../StudioProvider'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import Slider from './controls/Slider'
import './DownloadDialog.css'

const ESTIMATE_DEBOUNCE = 260
const ESTIMATE_DIVISOR = 4 // measure at ¼ scale, scale the result by the area ratio

const formatBytes = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

/**
 * Download flow: pick a size, then clear the subscription gate. The format is
 * fixed to JPEG, so quality is always meaningful and always shown.
 *
 * Every size offered is derived from the crop, so nothing is ever upscaled —
 * a 2000×1500 source cropped square can only give 1500×1500, and the list says
 * so. The file-size figure is measured, not guessed: a quarter-scale encode is
 * taken and scaled by area. It is labelled with ≈ because that is what it is.
 */
export default function DownloadDialog({ open, onClose, subscription }) {
  const { edit, maxLongEdge, meta } = useStudio()
  const { exportImage } = useStudioActions()

  const [step, setStep] = useState('resolution') // resolution | plans
  const [working, setWorking] = useState(false)
  const [tierId, setTierId] = useState('medium')
  const [quality, setQuality] = useState(92)
  const [estimate, setEstimate] = useState(null)
  const [done, setDone] = useState(null)

  const panelRef = useRef(null)
  useFocusTrap(panelRef, open, onClose)

  useEffect(() => {
    if (!open) return
    setStep('resolution')
    setDone(null)
  }, [open])

  const format = downloadFormat

  const tiers = resolutionTiers.map((t) => {
    const longEdge = Math.max(200, Math.round((maxLongEdge * t.scale) / 50) * 50)
    const { w, h } = exportSizeFor(edit.crop, longEdge)
    return { ...t, longEdge, w, h, available: maxLongEdge > 0 }
  })
  const selected = tiers.find((t) => t.id === tierId) ?? tiers[0]

  // Measured size estimate, debounced so dragging the quality slider is cheap.
  useEffect(() => {
    if (!open || !selected?.available) return
    setEstimate(null)
    let cancelled = false

    const timer = setTimeout(async () => {
      const probe = Math.max(80, Math.round(selected.longEdge / ESTIMATE_DIVISOR))
      const blob = await exportImage(probe, format.id, quality / 100)
      if (cancelled || !blob) return
      setEstimate(blob.size * ESTIMATE_DIVISOR * ESTIMATE_DIVISOR)
    }, ESTIMATE_DEBOUNCE)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, exportImage, selected?.longEdge, selected?.available, format.id, quality])

  if (!open) return null

  const runDownload = async () => {
    setWorking(true)
    const blob = await exportImage(selected.longEdge, format.id, quality / 100)
    setWorking(false)
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `imagesbazaar-${(meta?.name ?? 'image').replace(/\.[^.]+$/, '')}-${selected.w}x${selected.h}.${format.ext}`
    a.click()
    URL.revokeObjectURL(url)

    setDone({ w: selected.w, h: selected.h, size: blob.size })
    setStep('resolution')
  }

  const onContinue = () => {
    if (!selected.available) return
    if (subscription.isSubscribed) runDownload()
    else setStep('plans')
  }

  return (
    <div className="dl">
      <div className="dl__backdrop" onClick={onClose} aria-hidden="true" />

      <div
        className="dl__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dl-title"
        tabIndex={-1}
      >
        <div className="dl__head">
          <h2 className="dl__title" id="dl-title">
            {step === 'plans' ? 'Subscription required' : 'Download image'}
          </h2>
          <button type="button" className="dl__close" onClick={onClose} aria-label="Close">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {step !== 'plans' && (
          <div className="dl__body">
            {done && (
              <p className="dl__done" role="status">
                <Check size={15} aria-hidden="true" />
                Saved {done.w} × {done.h}px · {formatBytes(done.size)}
              </p>
            )}

            <section className="dl__section">
              <h3 className="dl__legend">Size</h3>
              <ul className="dl__tiers" role="radiogroup" aria-label="Image resolution">
                {tiers.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={tierId === t.id}
                      className={`dl__tier${tierId === t.id ? ' is-active' : ''}`}
                      onClick={() => setTierId(t.id)}
                      disabled={!t.available}
                    >
                      <span className="dl__tier-main">
                        <span className="dl__tier-label">{t.label}</span>
                        <span className="dl__tier-note">{t.note}</span>
                      </span>
                      <span className="dl__tier-size">
                        {t.available ? `${t.w} × ${t.h}` : '—'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* No legend: the slider renders its own visible "Quality" label,
                and two of them stacked would just repeat the word. */}
            <section className="dl__section">
              <Slider
                label="Quality"
                value={quality}
                min={60}
                max={100}
                step={1}
                suffix="%"
                reset={92}
                onChange={setQuality}
              />
            </section>

            <p className="dl__estimate">
              Estimated file size
              <strong>{estimate === null ? 'measuring…' : `≈ ${formatBytes(estimate)}`}</strong>
            </p>

            <p className="dl__gate-note">
              <Lock size={13} aria-hidden="true" />
              An active ImagesBazaar subscription is required to download.
            </p>

            <button
              type="button"
              className="dl__primary"
              onClick={onContinue}
              disabled={!selected.available || working}
            >
              {working ? (
                <>
                  <Loader2 className="dl__spin" size={17} aria-hidden="true" />
                  Preparing {selected.w} × {selected.h}…
                </>
              ) : subscription.isSubscribed ? (
                <>
                  <Download size={17} aria-hidden="true" />
                  Download {selected.w} × {selected.h}
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}

        {step === 'plans' && (
          <div className="dl__body">
            <p className="dl__lead">
              You need an active ImagesBazaar subscription before you can download this image.
              Choose a plan to continue.
            </p>

            <ul className="dl__plans">
              {subscriptionPlans.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`dl__plan${p.popular ? ' is-popular' : ''}`}
                    onClick={() => {
                      subscription.activate(p.id)
                      runDownload()
                    }}
                  >
                    {p.popular && (
                      <span className="dl__badge">
                        <Crown size={11} aria-hidden="true" />
                        Most popular
                      </span>
                    )}
                    <span className="dl__plan-name">{p.name}</span>
                    <span className="dl__plan-price">
                      {p.price}
                      <span>{p.period}</span>
                    </span>
                    <span className="dl__plan-detail">{p.detail}</span>
                    <span className="dl__plan-cta">Activate</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="dl__demo">
              Demo build — choosing a plan activates a simulated subscription so you can see the
              rest of the flow. No payment is taken and no details are collected.
            </p>

            <button type="button" className="dl__back" onClick={() => setStep('resolution')}>
              Back to sizes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
