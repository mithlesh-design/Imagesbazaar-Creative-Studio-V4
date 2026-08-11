import { useEffect, useRef, useState } from 'react'
import { Check, Crown, Download, Loader2, Lock, X } from 'lucide-react'
import { resolutionTiers, subscriptionPlans } from '../../data/characters'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import './DownloadDialog.css'

/**
 * Download flow: choose a resolution, then clear the subscription gate.
 *
 * Sizes above what the source can produce are disabled rather than upscaled,
 * so every option offered is real detail. Activation is simulated — no payment
 * is taken and the dialog says so.
 */
export default function DownloadDialog({ open, onClose, editor, subscription }) {
  const [step, setStep] = useState('resolution') // resolution | plans | working
  const [tierId, setTierId] = useState('medium')
  const [done, setDone] = useState(false)

  const panelRef = useRef(null)
  useLockBodyScroll(open)
  useFocusTrap(panelRef, open, onClose)

  useEffect(() => {
    if (!open) return
    setStep('resolution')
    setDone(false)
  }, [open])

  if (!open) return null

  const { exportSize, maxLongEdge, exportBlob, meta } = editor

  // Sizes scale off the largest frame this image can genuinely produce at the
  // current ratio, snapped to the nearest 50px so the numbers read cleanly.
  const tiers = resolutionTiers.map((t) => {
    const longEdge = Math.max(200, Math.round((maxLongEdge * t.scale) / 50) * 50)
    const { w, h } = exportSize(longEdge)
    return { ...t, longEdge, w, h, available: maxLongEdge > 0 }
  })
  const selected = tiers.find((t) => t.id === tierId) ?? tiers[0]

  const runDownload = async () => {
    setStep('working')
    const blob = await exportBlob(selected.longEdge, 'image/jpeg', 0.94)
    if (!blob) {
      setStep('resolution')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `imagesbazaar-${(meta?.name ?? 'image').replace(/\.[^.]+$/, '')}-${selected.w}x${selected.h}.jpg`
    a.click()
    URL.revokeObjectURL(url)
    setDone(true)
    setStep('resolution')
  }

  const onContinue = () => {
    if (!selected.available) return
    if (subscription.isSubscribed) runDownload()
    else setStep('plans')
  }

  const activate = (planId) => {
    subscription.activate(planId)
    runDownload()
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
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* ---------- Step 1: resolution ---------- */}
        {step !== 'plans' && (
          <div className="dl__body">
            {done && (
              <p className="dl__done" role="status">
                <Check size={16} aria-hidden="true" />
                Saved at {selected.w} × {selected.h}px.
              </p>
            )}

            <p className="dl__lead">Choose the size you need.</p>

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

            <p className="dl__gate-note">
              <Lock size={13} aria-hidden="true" />
              An active ImagesBazaar subscription is required to download.
            </p>

            <button
              type="button"
              className="dl__primary"
              onClick={onContinue}
              disabled={!selected.available || step === 'working'}
            >
              {step === 'working' ? (
                <>
                  <Loader2 className="dl__spin" size={18} aria-hidden="true" />
                  Preparing {selected.w} × {selected.h}…
                </>
              ) : subscription.isSubscribed ? (
                <>
                  <Download size={18} aria-hidden="true" />
                  Download {selected.w} × {selected.h}
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}

        {/* ---------- Step 2: subscription gate ---------- */}
        {step === 'plans' && (
          <div className="dl__body">
            <p className="dl__lead">
              You need an active ImagesBazaar subscription before you can download this
              image. Choose a plan to continue.
            </p>

            <ul className="dl__plans">
              {subscriptionPlans.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`dl__plan${p.popular ? ' is-popular' : ''}`}
                    onClick={() => activate(p.id)}
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
              Demo build — choosing a plan activates a simulated subscription so you can see
              the rest of the flow. No payment is taken and no details are collected.
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
