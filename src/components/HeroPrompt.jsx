import { forwardRef, useRef, useState } from "react";
import {
  ArrowUp,
  FileText,
  ImagePlus,
  Link2,
  Paperclip,
  X,
} from "lucide-react";
import ReferenceLinksModal from "./ReferenceLinksModal";
import BriefNotice from "./BriefNotice";
import { briefSignals } from "../data/briefNotice";
import "./HeroPrompt.css";

const REF_ICON = { image: ImagePlus, pdf: FileText, link: Link2 };

/** One picker for both kinds — the split into separate image and PDF buttons
 *  made the user classify the file before choosing it, which the file dialog
 *  already does. */
const ACCEPT = "image/*,application/pdf";

/**
 * The hero's prompt box. Structure follows the reference pattern: a tall field
 * with a control row pinned to its foot — references on the left, submit on the
 * right, with the mic immediately left of it. `voiceSlot` is a slot rather than
 * a hardcoded child because the mic is absent entirely on browsers without
 * SpeechRecognition.
 */
const HeroPrompt = forwardRef(function HeroPrompt(
  { value, onChange, onSubmit, busy = false, voiceSlot = null },
  ref,
) {
  const fileInputRef = useRef(null);
  const nextRefId = useRef(0);
  const [references, setReferences] = useState([]);
  const [linksOpen, setLinksOpen] = useState(false);

  /** Ids come from a monotonic counter, never the array length: removing an
   *  entry and adding another would otherwise recompute a colliding id, and two
   *  chips sharing a React key makes removal hit the wrong one. */
  const attach = (items) =>
    setReferences((r) => [
      ...r,
      ...items.map((it) => ({
        ...it,
        id: `${it.type}-${nextRefId.current++}-${it.name}`,
      })),
    ]);

  const addFiles = (e) => {
    const files = [...(e.target.files ?? [])];
    if (files.length) {
      attach(
        files.map((f) => ({
          type: f.type === "application/pdf" ? "pdf" : "image",
          name: f.name,
        })),
      );
    }
    e.target.value = "";
  };

  /* Read here rather than in the page because the website signal comes from
     `references`, which this component owns. One read feeds both the gate and
     the notice, so the button and the checklist can never disagree. */
  const signals = briefSignals(value, references);

  /* Only `ready` gates. Brand and product are advisory: a lowercase brand name
     reads as missing, and blocking on a guess that wrong would lock people out
     of their own campaign. */
  const canSubmit = signals.ready && !busy;
  const showNotice = !signals.ready || !signals.brand || !signals.product;

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <>
      <div className="heroprompt">
        <textarea
          ref={ref}
          className="heroprompt__input"
          data-tour="hero-brief"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe the exact product or service along with the brand name that you want us to create a campaign for?"
          aria-label="Describe the exact product or service along with the brand name that you want us to create a campaign for?"
          rows={1}
        />

        {references.length > 0 && (
          <ul className="heroprompt__refs">
            {references.map((r) => {
              const Icon = REF_ICON[r.type] ?? Link2;
              return (
                <li className="heroprompt__ref" key={r.id}>
                  <Icon size={12} aria-hidden="true" />
                  {r.kind && (
                    <span className="heroprompt__ref-kind">{r.kind}</span>
                  )}
                  <span className="heroprompt__ref-name">{r.name}</span>
                  <button
                    type="button"
                    className="heroprompt__ref-remove"
                    onClick={() =>
                      setReferences((list) => list.filter((x) => x.id !== r.id))
                    }
                    aria-label={`Remove reference ${r.name}`}
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="heroprompt__controls">
          <button
            type="button"
            className="heroprompt__pill"
            data-tour="hero-links"
            onClick={() => setLinksOpen(true)}
            aria-haspopup="dialog"
            aria-label="Add Reference Links"
          >
            <Link2 size={14} aria-hidden="true" />
            <span>Add Reference Links</span>
          </button>

          <button
            type="button"
            className="heroprompt__pill"
            data-tour="hero-files"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload Reference Files"
          >
            <Paperclip size={14} aria-hidden="true" />
            <span>Upload Reference Files</span>
          </button>

          {voiceSlot}

          <button
            type="button"
            className="heroprompt__submit"
            data-tour="hero-generate"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            <span>Generate</span>
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload reference files"
          onChange={addFiles}
        />

        <ReferenceLinksModal
          open={linksOpen}
          onClose={() => setLinksOpen(false)}
          onAttach={attach}
        />
      </div>

      {showNotice && <BriefNotice signals={signals} />}
    </>
  );
});

export default HeroPrompt;
