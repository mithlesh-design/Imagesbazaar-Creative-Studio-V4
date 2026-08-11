import { FlipHorizontal, Info, RotateCcw, RotateCw } from 'lucide-react'
import { toolGroups } from '../config'
import { useStudio, useStudioActions } from '../StudioProvider'
import Slider from './controls/Slider'
import FilterGrid from './controls/FilterGrid'
import RatioPicker from './controls/RatioPicker'
import CharacterPicker from './controls/CharacterPicker'
import './ToolPanel.css'

/**
 * The second column: detail controls for whichever tool is selected in the rail.
 *
 * Separating "which tool" from "its settings" is what keeps the rail narrow and
 * the canvas wide. It is the `tabpanel` half of the rail's `tablist`, so the
 * pairing is announced rather than merely implied by position.
 */
export default function ToolPanel({
  openTool,
  selectedCharacters,
  onToggleCharacter,
  onClearCharacters,
}) {
  const { edit, hasImage } = useStudio()
  const a = useStudioActions()

  const group = toolGroups.find((g) => g.id === openTool) ?? toolGroups[0]
  const { adjustments, rotation, flipH, crop } = edit

  // Characters compose the prompt, not the pixels, so this panel works with no
  // image loaded — you can line people up before choosing a photo.
  const needsImage = !group.characters

  return (
    <aside
      className="tpanel"
      id="studio-tool-panel"
      role="tabpanel"
      aria-labelledby={`tab-${group.id}`}
      tabIndex={0}
    >
      <div className="tpanel__head">
        <h3 className="tpanel__title">{group.label}</h3>
        {hasImage && group.id === 'crop' && (
          <span className="tpanel__readout">
            {Math.round(crop.w)} × {Math.round(crop.h)}
          </span>
        )}
        {hasImage && group.id === 'rotate' && (
          <span className="tpanel__readout">
            {rotation}°{flipH && ' · flipped'}
          </span>
        )}
        {group.characters && selectedCharacters.length > 0 && (
          <span className="tpanel__readout">{selectedCharacters.length} attached</span>
        )}
      </div>

      <div className="tpanel__body">
        {needsImage && !hasImage && (
          <p className="tpanel__idle">
            Pick a photo from the search or the collections below to start editing.
          </p>
        )}

        {group.characters && (
          <CharacterPicker
            selected={selectedCharacters}
            onToggle={onToggleCharacter}
            onClear={onClearCharacters}
          />
        )}

        {hasImage && (
          <>
            {group.id === 'crop' && (
              <section className="tpanel__section">
                <h4 className="tpanel__legend">Aspect ratio</h4>
                <RatioPicker />
              </section>
            )}

            {group.sliders && (
              <section className="tpanel__section tpanel__section--sliders">
                {group.sliders.map((s) => (
                  <Slider
                    key={s.key}
                    label={s.label}
                    value={adjustments[s.key]}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    suffix={s.suffix}
                    reset={s.reset}
                    onBegin={a.begin}
                    onCommit={a.commit}
                    onChange={(v) => a.setAdjustment(s.key, v)}
                  />
                ))}
              </section>
            )}

            {group.presets && (
              <section className="tpanel__section">
                <FilterGrid />
              </section>
            )}

            {group.actions && (
              <section className="tpanel__section">
                <div className="tpanel__actions">
                  <button type="button" className="tpanel__action" onClick={() => a.rotate(-1)}>
                    <RotateCcw size={15} aria-hidden="true" />
                    Left 90°
                  </button>
                  <button type="button" className="tpanel__action" onClick={() => a.rotate(1)}>
                    <RotateCw size={15} aria-hidden="true" />
                    Right 90°
                  </button>
                  <button type="button" className="tpanel__action" onClick={a.flip}>
                    <FlipHorizontal size={15} aria-hidden="true" />
                    Flip
                  </button>
                </div>
              </section>
            )}

          </>
        )}

        {group.hint && (!needsImage || hasImage) && (
          <p className="tpanel__hint">
            <Info size={13} aria-hidden="true" />
            {group.hint}
          </p>
        )}
      </div>
    </aside>
  )
}
