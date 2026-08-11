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
    editor/     CreativeEditor · EditorToolbar · EditorStage · PromptDock
                DownloadDialog
  data/         collections.js · characters.js · popularSearches.js · navigation.js
  hooks/        useSearch · useImageEditor · useSubscription
                useFocusTrap · useLockBodyScroll · useMediaQuery
  pages/        Home.jsx
  styles/       variables.css (design tokens) · globals.css
```

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
Search → select an image → it opens in the Creative Editor
      → edit (crop · light · colour · filters · detail · rotate)
      → pick an aspect ratio → Download → choose a resolution
      → subscription gate → download
```

## What actually works

This is a working front end, not a mockup:

- **Search** matches the image library client-side and returns the photos themselves as
  thumbnail results. Picking one loads it into the editor. A proper ARIA combobox with
  ↑/↓/Enter/Escape; typing `fail` triggers the error state on purpose.
- **The Creative Editor genuinely edits pixels** via HTML canvas — brightness, exposure,
  contrast, saturation, warmth, sharpen (a real 3×3 convolution), soften, eight filter
  presets, crop repositioning, rotate and flip. Reset restores the original exactly.
- **Aspect ratio** defaults to 1:1 and reframes the canvas live.
- **Download** offers three sizes derived from what the image can actually produce at the
  chosen ratio — nothing is ever upscaled — then gates on an ImagesBazaar subscription.
  Activating a plan is simulated; the file that saves is genuinely the resolution picked.
- **Collection cards** are a second route into the editor; **keyword chips** fill the search.
- **Browse Categories** and **Search by image** are focus-trapped modals that lock scroll
  and close on Escape.

### Deliberately not implemented

There is no backend. **AI generation is not connected** — the floating dock captures the
prompt, characters and references for real, then says plainly that generation isn't wired
up rather than inventing a result. The editing tools are what change the image. Reverse
image matching is a UI flow only. Subscription activation takes no payment and collects no
details. There are no routes and no authentication.

## Accessibility

Semantic landmarks and heading order, a skip link, `aria-label`s on the search input and
image-search action, alt text on every image describing what is actually in the frame,
visible focus rings, ≥44px touch targets, focus trapping in overlays, and full
`prefers-reduced-motion` support.

## Performance

Images are local WebP — 51 files, ~1.6MB total. The hero is preloaded with a responsive
`srcset` and `fetchPriority="high"` as the LCP element; collection images below the first
row are lazy-loaded. Every image carries explicit `width`/`height` so there is no layout
shift.

## Image licensing — read before launch

Photography is from Pexels and is **placeholder**. See `CREDITS.md` for per-image sources
and the licensing caveat: replace it with licensed or commissioned imagery before any real
commercial launch.
