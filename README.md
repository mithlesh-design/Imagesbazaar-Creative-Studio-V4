# ImagesBazaar — landing page

A responsive landing page for an Indian stock photography and visual-content marketplace,
built to the specification in `DESIGN.md`.

## Stack

React 18 · Vite 6 · plain CSS with custom properties · `lucide-react` for icons.
No TypeScript, no CSS framework, no router — nothing beyond what the page needs.

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
  images/hero/          hero-{960,1600,2400}.webp   (3:1)
  images/collections/   24 × {slug}.webp + @2x + -full   (4:3, up to 2000×1500)
src/
  components/   Header · MobileMenu · SearchBar · ImageSearchModal · HeroBanner
                CollectionGrid · CollectionCard · AboutSection · PopularSearches
                Footer · SupportButton      (one .css file per component)
  studio/       the Creative Studio — inline on the page, below the search bar
    config.js        ratios · tool groups · filter presets · sizes · formats · plans
    cropMath.js      crop rect geometry            ] pure: no DOM, no React,
    history.js       undo/redo stack               ] no canvas — testable
    renderer.js      base canvas · filters · sharpen · export ] in isolation
    studioReducer.js the state machine             ]
    StudioProvider.jsx  reducer + two contexts (state / stable actions)
    CreativeStudio.jsx  the section shell, and full screen as a class on it
    useRenderLoop.js    rAF-coalesced painting, interactive vs final quality
    useKeyboard.js      shortcut map, scoped to the section
    components/  StudioHeader · ToolRail · ToolPanel · Stage · CropOverlay
                 PromptDock · DownloadDialog
      controls/  Slider · FilterGrid · RatioPicker
  data/         collections.js · characters.js · popularSearches.js · navigation.js
  hooks/        useSearch · useSubscription
                useFocusTrap · useLockBodyScroll · useMediaQuery
  pages/        Home.jsx
  styles/       variables.css (design tokens) · globals.css
```

### Why the studio is shaped this way

Editing state lives in a reducer above the page, not in a hook called from
`Home`, so dragging a slider repaints the canvas without re-rendering the
header, footer and 24 collection cards. State is split three ways: **edit**
(undoable), **view** (zoom and pan — never in history, because undoing a slider
should not also scroll you somewhere else) and **session**. Actions are served
from a second context whose identity never changes, so components that only
dispatch never re-render.

Undo stores whole snapshots rather than inverse commands — an edit is about
twenty numbers, so sixty of them are free, and the stack cannot drift out of
sync with what is on screen. A continuous gesture is bracketed by
`begin`/`commit`, so dragging a slider is **one** undo step, not two hundred.

### Layout

```
┌ header ─────────────────── history · zoom · compare · ⛶ · Download ┐
├──────┬────────────────┬────────────────────────────────────────────┤
│ Crop │ LIGHT          │                                            │
│ Light│ Brightness ──● │                                            │
│Colour│ Exposure   ──● │              ┌──────────────┐              │
│Filter│ Contrast   ──● │              │    canvas    │              │
│Detail│                │              └──────────────┘              │
│Rotate│                │                                            │
│ ──── │                │      ╭───────── prompt ─────────╮          │
│Chars²│                │      ╰───────────────────────────╯         │
└──────┴────────────────┴────────────────────────────────────────────┘
  rail       detail                      stage
```

Every tool works the same way: pick it in the rail, its controls appear in the
panel beside it. **Characters is one of those tools** — it opens a searchable,
filterable roster in the panel and carries a badge of how many are attached. It
sits apart at the foot of the rail because it composes the prompt rather than
editing pixels, and it is the one tool that works with no image loaded.

Four rules do most of the work:

- **The whole editor is one viewport tall** (`calc(100dvh - 48px)`) and nothing
  inside it scrolls — each column clips its own content. Verified to fit without
  scrolling at 1366×768, 1440×900, 1512×900 and 1920×1080.
- **The rail holds tools and nothing else**, so the canvas keeps the full
  remaining width. The picture uses 73–86% of the canvas area.
- **The prompt bar is the stage's second grid row.** The fit calculation
  measures the picture's row, so the bar cannot be laid over the photograph —
  not a collision avoided, one that cannot occur.
- **Full screen is a class, not a component.** `.studio.is-fullscreen` swaps the
  box; nothing remounts, so the image, crop, adjustments, undo stack and zoom
  survive with no state to lift or restore.

Two CSS traps are worth knowing before editing the layout. `body` uses
`overflow-x: clip`, not `hidden` — `hidden` computes the cross axis to `auto`,
making the body a scroll container. And grid/flex children default to
`min-width: auto`, so every column and scroller is pinned to `minmax(0, 1fr)` or
`min-width: 0`; without it an internal scroller stretches its ancestors instead
of scrolling.

All page content is data-driven — editing `src/data/collections.js` changes the grid, and
`popularSearches.js` changes the keyword chips. No copy is hardcoded in components.

## Design system

`src/styles/variables.css` is the single source of truth: the colour palette, an 8px
spacing scale (`--space-1` … `--space-13`), radii, shadows and motion timings, all taken
from `DESIGN.md`. Components reference tokens rather than raw values.

Breakpoints: mobile `0–639`, tablet `640–1023`, desktop `1024–1439`, large `1440+`.
Authored mobile-first. The collection grid runs 2 → 3 → 4 columns.

## The flow

```
Search → select an image → it loads into the Creative Studio, in place
      → edit (crop · light · colour · filters · detail · rotate)
      → Download → choose a size, format and quality
      → subscription gate → download
```

The studio lives on the page, directly below the search bar — it is a section,
not a mode. Expand takes it full screen for detailed work and collapses back
with everything intact.

## What actually works

This is a working front end, not a mockup:

- **Search** matches the image library client-side and returns the photos themselves as
  thumbnail results. Picking one loads it into the studio. A proper ARIA combobox with
  ↑/↓/Enter/Escape; typing `fail` triggers the error state on purpose.
- **The prompt bar is always present**, fixed at the foot of the canvas with a
  consistent gap above and below.
- **Characters are a tool**, not a popover behind a gender toggle. The panel has a
  search that matches name, role *or* age band — "priya", "corporate" and "20s" all
  work — alongside role filters (Corporate, Lifestyle, Fashion, Fitness, Wellness,
  Traditional, Student), with gender as one option among those rather than the first
  choice you are forced to make. Avatars are initials, never invented likenesses, each
  with its own hue so twelve of them stay scannable. Attached characters show as a badge
  on the rail and a count in the prompt bar.
- **The Creative Studio genuinely edits pixels** via HTML canvas — brightness, exposure,
  contrast, saturation, warmth, sharpen (a real 3×3 convolution), soften, eight filter
  presets shown as live thumbnails of your own photo, rotate and flip.
- **Crop is direct manipulation**: drag inside the frame to reposition, pull a handle to
  resize, with a rule-of-thirds grid, six ratios and a genuinely free-form option. While
  cropping, the stage shows the whole picture and dims what is being cut away.
- **Undo and redo** (⌘Z / ⇧⌘Z) cover every edit. One drag is one undo step.
- **Zoom and pan** 25–400%, with fit-to-screen and 100% — needed to judge sharpening,
  which is invisible on a fitted view.
- **Hold `\`** (or press and hold Compare) to see the untouched original.
- **Download** offers three sizes derived from the crop — nothing is ever upscaled — in
  JPEG, PNG or WebP, with a quality control and a *measured* file-size estimate (a
  quarter-scale encode, scaled by area, which is why it is labelled ≈). It then gates on
  an ImagesBazaar subscription. Activating a plan is simulated; the file that saves is
  genuinely the resolution, format and quality picked.
- **Collection cards** are a second route into the studio; **keyword chips** fill the search.
- **Browse Categories** and **Search by image** are focus-trapped modals that lock scroll
  and close on Escape.

### Keyboard

| | |
|---|---|
| `⌘Z` / `⇧⌘Z` | undo · redo |
| `\` (hold) | compare against the original |
| `C` · `L` | crop tool · light tool |
| `R` / `⇧R` · `F` | rotate right / left · flip |
| `0` · `1` · `+` `−` | fit · 100% · zoom |
| `⌘S` or `⌘↵` | download |
| `Esc` | leave full screen |

Arrow keys move the crop frame; hold Shift for 10px steps. Every handle is
focusable, so the crop is fully operable without a mouse.

Shortcuts are **scoped to the studio** — live only while it is full screen or
while focus is inside the section. On a landing page a window-wide binding would
mean `c`, `r` or `0` firing editor commands while somebody was simply reading the
collections grid. Clicking the stage focuses it, so they arm when you'd expect.

### Deliberately not implemented

There is no backend. **AI generation is not connected** — the floating dock captures the
prompt, characters and references for real, then says plainly that generation isn't wired
up rather than inventing a result. It idles as a compact pill so a surface that does
nothing yet cannot occupy the picture. The editing tools are what change the image.
Reverse image matching is a UI flow only. Subscription activation takes no payment and
collects no details. There are no routes and no authentication.

## Accessibility

Semantic landmarks and heading order, a skip link, `aria-label`s on the search input and
image-search action, alt text on every image describing what is actually in the frame,
visible focus rings, ≥44px touch targets, focus trapping in overlays, and full
`prefers-reduced-motion` support.

In the studio the tool rail and the detail panel are a real `tablist`/`tabpanel`
pair with arrow-key navigation, the canvas is a labelled `role="img"`, every
slider carries `aria-valuetext` with its unit, the character list has roving
arrow-key focus, and the crop frame and all eight handles are keyboard-operable.

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

## Performance

Images are local WebP — 51 files, ~1.6MB total. The hero is preloaded with a responsive
`srcset` and `fetchPriority="high"` as the LCP element; collection images below the first
row are lazy-loaded. Every image carries explicit `width`/`height` so there is no layout
shift.

## Image licensing — read before launch

Photography is from Pexels and is **placeholder**. See `CREDITS.md` for per-image sources
and the licensing caveat: replace it with licensed or commissioned imagery before any real
commercial launch.
