# ImagesBazaar — landing page

A responsive front end for an Indian stock photography and visual-content marketplace:
a one-viewport hero that turns a text prompt into search results, and a Creative Studio,
its own page, for editing whichever result you pick.

## Stack

React 18 · Vite 6 · plain CSS with custom properties · `lucide-react` for icons.
No TypeScript, no CSS framework, no router — page switching is a single `useState` in
`App.jsx`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## Structure

```
public/
  brand/imagesbazaar-logo.svg
  images/collections/   24 × {slug}.webp + @2x + -full   (4:3, up to 2000×1500)
src/
  components/   Header · MobileMenu · HeroPrompt · VoiceButton
                CollectionCard · Footer · SupportButton      (one .css file per component)
  studio/       the Creative Studio — its own page, reached from a search result
    config.js        ratios · tool groups · filter presets · sizes · formats · plans
    cropMath.js      crop rect geometry            ] pure: no DOM, no React,
    history.js       undo/redo stack               ] no canvas — testable
    renderer.js      base canvas · filters · sharpen · export ] in isolation
    studioReducer.js the state machine             ]
    StudioProvider.jsx  reducer + two contexts (state / stable actions), mounted in
                         App so studio state survives leaving the studio and coming back
    CreativeStudio.jsx  the two-card grid, and full screen as a class on it
    useRenderLoop.js    rAF-coalesced painting, interactive vs final quality
    useKeyboard.js      shortcut map, scoped to the studio
    components/  CanvasPanel · EditToolbar · ToolPopover · Stage · CropOverlay
                 PromptPanel · CharacterBrowser · GenerationModal · DownloadDialog
      controls/  Slider · FilterGrid · RatioPills
  data/         collections.js · characters.js · navigation.js · promptSuggestions.js
  hooks/        useSearch · useSubscription
                useFocusTrap · useLockBodyScroll · useMediaQuery
  pages/        Home.jsx · StudioPage.jsx
  styles/       variables.css (design tokens) · globals.css
scripts/        check-tokens.mjs · shoot.mjs      — see Verification
```

### Why the studio is shaped this way

Editing state lives in a reducer mounted once in `App`, above both pages, not in a hook
called from `StudioPage` — so leaving the studio to search for a different image and
coming back does not lose the edit in progress, and dragging a slider repaints only the
canvas rather than the page chrome around it. State splits into **edit** (undoable),
**view** (zoom and pan — never in history, because undoing a slider should not also
scroll you somewhere else) and everything else (the loaded source, loading/error flags,
which tool is open) — state shaped like session state that nobody would want to undo
either. Actions are served from a second context whose identity never changes, so
components that only dispatch never re-render.

Undo stores whole snapshots rather than inverse commands — an edit is about twenty
numbers, so sixty of them are free, and the stack cannot drift out of sync with what is
on screen. A continuous gesture is bracketed by `begin`/`commit`, so dragging a slider is
**one** undo step, not two hundred.

### Layout

```
┌ header ────────────────────────────────────────────────────────────────┐
├ ← Back to search        filename.jpg   1600 × 1200   Edited ───────────┤
├───────────────────────────────────────────┬─────────────────────────────┤
│ ratio pills   zoom · fit · compare · ⛶     │ Prompt                      │
│               undo · redo · reset          │ ┌─────────────────────────┐ │
│                                             │ │ describe how you want…  │ │
│                                             │ └─────────────────────────┘ │
│                ┌───────────────┐           │ Suggestions  chip chip     │
│                │     canvas    │           │ Characters (+)              │
│                │               │           │ References  image·link·pdf  │
│                └───────────────┘           │                              │
│  [Crop][Rotate][Bright][Contrast][Sat]…     │ [Generate 10 variations]    │
│      ▲ popover opens above the pressed tool │ [Apply edits]                │
└───────────────────────────────────────────┴─────────────────────────────┘
                canvas panel                          prompt panel
```

Every edit tool lives in the strip below the canvas rather than a side rail, so the
canvas keeps the full width of the card. Picking a tool opens a popover positioned over
the button you pressed rather than a permanent side panel — the popover measures its
trigger's offset and stays over it as the strip wraps or the window resizes. Crop is the
exception: it has no popover, it toggles the stage into crop mode directly, because it
changes what the stage is doing rather than opening controls.

Characters are reached from the prompt panel, not the tool strip — the "+" beside
"Characters" opens `CharacterBrowser`, a searchable, filterable roster that composes the
prompt rather than editing pixels. It is the one control that works with no image loaded.

Rules that do most of the work:

- **The canvas card is one viewport tall.** `--studio-h` in `variables.css` subtracts the
  header, the studio's own bar height and the page padding from `100dvh`, and nothing
  inside the card scrolls — each panel clips its own content. `npm run shoot` asserts the
  studio needs no page scroll at 1440×900 and 1366×768; below 1024px the two cards stack
  instead of sitting side by side.
- **The prompt panel is a separate card**, not a bar laid over the canvas.
  `.studio__grid` is a two-column grid (`minmax(0, 1fr)` plus a fixed `--studio-right-w`)
  that collapses to one column on tablet and mobile.
- **Full screen is a class, not a component.** `.studio.is-fullscreen` swaps the box;
  nothing remounts, so the image, crop, adjustments, undo stack and zoom survive with no
  state to lift or restore.

Two CSS traps are worth knowing before editing the layout. `body` uses
`overflow-x: clip`, not `hidden` — `hidden` computes the cross axis to `auto`, making the
body a scroll container. And grid/flex children default to `min-width: auto`, so every
column and scroller is pinned to `minmax(0, 1fr)` or `min-width: 0`; without it an
internal scroller stretches its ancestors instead of scrolling.

All copy is data-driven: `src/data/collections.js` is the search library,
`src/data/promptSuggestions.js` supplies both the hero's four suggestion chips and the
studio's six edit-prompt suggestions, and `src/data/characters.js` and
`src/data/navigation.js` back the character roster and the "Browse Categories" menu. No
copy is hardcoded in components.

## Design system

`src/styles/variables.css` is the single source of truth: the colour palette, an 8px
spacing scale (`--space-1` … `--space-13`), a type scale, radii, shadows and motion
timings. Components reference tokens rather than raw values, and `npm run check:tokens`
enforces that every referenced token is actually defined (see Verification).
`src/components/Header.css` is a deliberate exception to the type scale — see
"Deliberate exceptions" below.

Breakpoints: mobile `0–639`, tablet `640–1023`, desktop `1024–1439`, large `1440+`.
Authored mobile-first.

## The flow

```
Home: describe the image → Generate
   → up to 10 results from the local library, revealed below the hero
   → pick one → opens the Creative Studio, its own page
      → edit (crop · brightness · contrast · saturation/warmth · filters · blur · sharpen)
      → Download → choose a size, format and quality → subscription gate → download
   → Back to search → returns to Home with the same query and results intact
```

The studio is its own page (`src/pages/StudioPage.jsx`), reached by submitting a query on
the home page and clicking a result — not a section that lives inline below the search
box. `StudioProvider` is mounted above both pages in `App.jsx`, so the loaded image and
every edit survive the round trip back to Home and forward again. Expand takes the studio
full screen for detailed work and collapses back with everything intact.

## What actually works

This is a working front end, not a mockup:

- **The hero prompt** matches typed text against the local image library and returns up
  to 10 results, styled and paced like an AI generation flow — a staged "Analysing your
  brief… → Applying lighting models… → Rendering high-resolution detail…" loading state —
  but it is client-side keyword matching against `data/collections.js`, not a model.
  Typing `fail` triggers the error state on purpose. Voice dictation into the prompt box
  uses the Web Speech API where the browser supports it; `VoiceButton` renders nothing
  where it doesn't (Firefox, and partial Safari support), rather than a button that
  silently fails.
- **Selecting a result** opens it directly into the Creative Studio.
- **Characters are a tool**, opened from the prompt panel's "+" rather than a popover
  behind a gender toggle. The browser has a search that matches name, role *or* age band
  — "priya", "corporate" and "20s" all work — alongside role filters (Corporate,
  Lifestyle, Fashion, Fitness, Wellness, Traditional, Student), with gender as one option
  among those rather than the first choice you are forced to make. Avatars are initials,
  never invented likenesses, each with its own hue so a dozen of them stay scannable.
  Attached characters show as chips in the prompt panel.
- **The Creative Studio genuinely edits pixels** via HTML canvas — brightness, exposure,
  contrast, saturation, warmth, sharpen (a real 3×3 convolution), blur, eight filter
  presets shown as live thumbnails of your own photo, rotate and flip.
- **Crop is direct manipulation**: drag inside the frame to reposition, pull a handle to
  resize, with a rule-of-thirds grid shown while the frame is active. Four ratios sit as
  pills above the canvas (1:1, 4:3, 16:9, 3:2); free-form, the source's own proportions,
  9:16 and a typed width/height live behind "Custom". While cropping, the stage shows the
  whole picture and dims what is being cut away.
- **Undo and redo** (⌘Z / ⇧⌘Z) cover every edit. One drag is one undo step. "Apply edits"
  in the prompt panel flattens the current edit into the image, so a later generated
  variation starts from that baseline rather than the original.
- **Zoom and pan** 25–400%, with fit-to-screen and 100% — needed to judge sharpening,
  which is invisible on a fitted view.
- **Hold `\`** (or press and hold the compare icon) to see the untouched original.
- **Download** offers three sizes derived from the crop — nothing is ever upscaled — in
  JPEG, PNG or WebP, with a quality control and a *measured* file-size estimate (a
  quarter-scale encode, scaled by area, which is why it is labelled ≈). It then gates on
  an ImagesBazaar subscription. Activating a plan is simulated; the file that saves is
  genuinely the resolution, format and quality picked.
- **"Generate 10 variations"** in the prompt panel is the studio's own simulation: it
  applies ten CSS filter presets to the photo already on the canvas and lets you pick one
  to load, rather than calling an image model.
- **Browse Categories**, opened from the header's menu button, is a focus-trapped panel
  that locks scroll and closes on Escape; picking a category runs it as a search from the
  home page.

### Deliberately not implemented

There is no backend. Both "generation" surfaces are simulations rather than real model
calls: the hero's search-as-generation matches the local image set, and the studio's
"Generate 10 variations" reapplies CSS filters to the photo already loaded. Subscription
activation takes no payment and collects no details. There are no routes and no
authentication.

### Keyboard

| | |
|---|---|
| `⌘Z` / `⇧⌘Z` | undo · redo |
| `\` (hold) | compare against the original |
| `C` · `B` · `S` | crop tool · brightness tool · sharpen tool |
| `R` / `⇧R` · `F` | rotate right / left · flip |
| `0` · `1` · `+` `−` | fit · 100% · zoom |
| `⌘S` or `⌘↵` | download |
| `Esc` | close the open dialog or tool, then leave full screen |

Arrow keys move the crop frame; hold Shift for 10px steps. Every handle is
focusable, so the crop is fully operable without a mouse.

Shortcuts are **scoped to the studio** — live only while it is full screen or
while focus is inside the studio section. Clicking the stage focuses it, so
they arm when you'd expect.

## Accessibility

Semantic landmarks and heading order, a skip link on both pages, `aria-label`s
throughout, alt text on every image describing what is actually in the frame, visible
focus rings, ≥44px touch targets, and full `prefers-reduced-motion` support.

Browse Categories, the Character Browser and the Download dialog trap focus and close on
Escape; Browse Categories and the Character Browser also lock body scroll while open. In
the studio, the edit tool strip is a real `toolbar` with roving arrow-key navigation, the
canvas is a labelled `role="img"` that swaps its label when comparing against the
original, every slider carries `aria-valuetext` with its unit, the character grid has
roving arrow-key focus, and the crop frame and all eight handles are keyboard-operable.

## Performance

The sharpen pass is a per-pixel convolution — the one genuinely expensive stage
— so it is skipped while a control is being dragged and applied once the input
settles ~140ms later, the way desktop editors separate interactive from final
quality. The kernel itself is written so the centre tap collapses the nested 3×3
loop into one multiply and four subtractions per channel. Painting is coalesced
through a single `requestAnimationFrame`, and the preview renders at the
canvas's device-pixel size rather than the source's, so a 24MP photo previews at
one or two megapixels. The export always runs at full resolution and final
quality, through the same `drawTo` as the preview — so what downloads is what
you saw.

Images are local WebP — 72 files across the 24 collections (a base, an @2x and a
full-resolution file per collection), ~5.8MB total. The hero itself carries no image; of
the search results, the first five load eager and the rest lazy. Every image carries
explicit `width`/`height` so there is no layout shift.

## Verification

Two scripts back this refinement and are meant to be run before any UI change is
considered done:

- **`npm run check:tokens`** walks every `src/**/*.css` file and fails if any
  `var(--x)` reference has no matching `--x:` definition anywhere in the stylesheets. It
  carries a small allowlist, `--fill-from` and `--fill-to`, for the two custom properties
  `Slider.jsx` sets inline, per-element, in JavaScript rather than in a stylesheet —
  real properties, just not defined in CSS, so the allowlist documents why rather than
  silencing a bug.
- **`npm run shoot -- <label>`** drives a headless Chromium via Playwright at
  1440×900, 1366×768 and 390×844, asserts hero and studio geometry — the hero fits one
  viewport, the footer sits below the fold, the studio needs no page scroll and its back
  button stays on screen — and writes screenshots to `docs/superpowers/shots/<label>/`.
  It requires the dev server running on `http://localhost:5173` (or `SHOT_URL` pointed at
  another one).

## Deliberate exceptions

Two things look inconsistent on a skim and are not accidents:

1. **`src/components/Header.css` keeps six raw px `font-size`s** and is exempt from the
   type scale mapping the rest of the app uses — its responsive font-size ramp does not
   survive the 8-step mapping, and the header itself was out of scope for this
   refinement. The file carries a comment saying so.
2. **`StudioPage` renders no `<Footer />`.** The editor is meant to be an app surface
   that fits one viewport; a footer would make that impossible at the sizes the studio is
   verified against.

## Image licensing — read before launch

Photography is from Pexels and is **placeholder**. See `CREDITS.md` for per-image sources
and the licensing caveat: replace it with licensed or commissioned imagery before any real
commercial launch.
