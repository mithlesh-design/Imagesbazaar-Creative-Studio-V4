import { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import './VoiceButton.css'

/**
 * Dictation via the Web Speech API.
 *
 * Firefox does not implement it and Safari's support is partial, so this
 * feature-detects and renders *nothing* rather than a button that silently
 * fails. That is a real browser limitation, not a stub.
 */
const Recognition =
  typeof window === 'undefined'
    ? undefined
    : window.SpeechRecognition ?? window.webkitSpeechRecognition

export default function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)

  // Keep the callback fresh without re-creating the recogniser on every render.
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (!Recognition) return undefined

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      onTranscriptRef.current?.(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      recognition.abort()
    }
  }, [])

  if (!Recognition) return null

  const toggle = () => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (listening) {
      // `onend` flips `listening` back to false — don't pre-empt it here, or a
      // fast stop→start lands on an instance that has not finished tearing down.
      try {
        recognition.stop()
      } catch {
        setListening(false)
      }
      return
    }

    try {
      recognition.start()
      setListening(true)
    } catch {
      // Already starting or still stopping. The existing session stays live and
      // `onend` will settle the state; swallow rather than break the button.
      setListening(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`heroprompt__pill voice${listening ? ' is-listening' : ''}`}
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? 'Stop dictation' : 'Dictate your prompt'}
        title={listening ? 'Stop dictation' : 'Dictate your prompt'}
      >
        <Mic size={15} aria-hidden="true" />
        {listening && <span className="voice__dot" aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {listening ? 'Listening' : ''}
      </span>
    </>
  )
}
