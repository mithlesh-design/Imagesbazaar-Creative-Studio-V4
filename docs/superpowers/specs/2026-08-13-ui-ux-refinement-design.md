# UI/UX refinement — ImagesBazaar Creative Studio

**Date:** 2026-08-13
**Scope:** Every surface except `Header.jsx` / `Header.css`, which are not to be touched.
**Visual direction:** Editorial mono — black, white and grey. The photographs are the
only colour on the page. Emphasis comes from type weight and spacing, never hue.

---

## 1 · Why

The app works but reads as unfinished. Three classes of problem, all verified against
the running app at 1440×900 and 390×844.

### Broken

| Problem | Evidence |
|---|---|
| Seven CSS custom properties are used but never defined | `--color-bg`, `--color-primary`, `--color-hover`, `--color-text-tertiary`, `--transition-fast`, `--radius-xl`, `--shadow-2xl`. `StudioPage.css:9` paints no background; `StudioPage.css:45` has no text colour; several transitions silently never run. (`--fill-from` and `--fill-to` also resolve to nothing in CSS but are legitimate — `Slider.jsx:109` sets them inline per-element.) |
| Two floating chat buttons overlap | `Footer.jsx:120` renders `footer-v2__chat-fab` on top of `SupportButton`. Visible as two circles stacked on mobile. |
| The studio's back button is scrolled off on arrival | `CreativeStudio.jsx:85-88` calls `scrollIntoView({ block: 'start' })` on mount. Root cause is the height budget — see below. |
| The studio cannot fit its viewport | `--studio-h: calc(100dvh - 48px)` is a near-full-viewport grid placed *below* a 76px header and a ~45px bar. It overflows by ~73px, forcing the page to scroll, which is what the `scrollIntoView` hack was compensating for. |
| A high-priority image preload for a deleted component | `index.html:22-29` preloads `hero-1600.webp` with `fetchpriority="high"`. `HeroBanner` is orphaned and never renders. |
| Prompt suggestions clip at 3 of 6 | `PromptPanel.css` — the container has no wrap and a fixed height. |
| Card titles are illegible on bright photos | `.card__title` is white text with no scrim. Fails on *Happy Family at Home*. |

### Design-system drift

- **24 distinct font sizes**, including `12.5px`, `13.5px`, `11.5px`, `14.5px`. There is
  no type scale.
- **A pink has crept in.** `rgba(224, 30, 90, …)` on the Character button and the studio
  badge, against an otherwise strictly monochrome system. Nothing in the brand mark
  suggests it.
- **A blue has crept in.** `Footer.jsx:37-43` hardcodes `fill="#0a53be"` on social icons.
- **Three different section-header treatments** inside one panel: "AI Prompt Studio"
  (17px bold), "PROMPT SUGGESTIONS" (13px caps), "References" (15px bold).

### Layout

- The home page is **empty** — a search bar, ~350px of void, then a footer that outweighs
  the product. The `h1` is `sr-only`, so nothing on screen says what the page does.
- On mobile the footer is **~85% of the page** and the search placeholder truncates
  mid-word ("Explain what kind of ir").
- The studio's References panel reserves **~300px** to say "No references added yet".
- The studio toolbar mixes **four different button shapes** in one row with no grouping.

### Dead code

`HeroBanner`, `CollectionGrid`, `PopularSearches`, `AboutSection` and `CharactersPanel`
are no longer imported by any rendered component.

---

## 2 · Foundation — `variables.css`, `globals.css`

### Type scale

Eight steps replace 24 ad-hoc sizes. Chosen so every existing value maps cleanly
(`12.5`→13, `14.5`→14, `11.5`→12, `13.5`→13).

```css
--text-2xs:   11px;  /* badges, counters */
--text-xs:    12px;  /* overline labels, meta */
--text-sm:    13px;  /* dense controls */
--text-base:  14px;  /* default UI text, buttons, links */
--text-md:    16px;  /* body copy, inputs */
--text-lg:    20px;  /* panel and section headings */
--text-xl:    26px;  /* page headings */
--text-2xl:   34px;  /* home headline base, clamps up to 52px */
```

No component may declare a raw `px` font-size after this change.

### Resolving the seven undefined properties

Three are genuinely missing and get defined:

```css
--color-hover:      #f1f3f5;
--radius-xl:        16px;
--radius-2xl:       24px;   /* new — the hero prompt box */
--shadow-2xl:       0 18px 48px rgba(0, 0, 0, 0.20);
--transition-fast:  150ms var(--ease);   /* composite */
```

The rest are consumer errors and get fixed at the call site rather than aliased:

| Used | Replace with | Why |
|---|---|---|
| `--color-bg` | `--color-background` | Typo for an existing token |
| `--color-text-tertiary` | `--color-text-muted` | Same role, existing token |
| `--color-primary` | `--color-accent` | There is no "primary" hue in a mono system |

### Preventing recurrence

Add `scripts/check-tokens.mjs` and an npm script `check:tokens`. It scans `src/**/*.css`
for `var(--…)` references, collects every `--…:` definition, and exits non-zero listing
any reference with no definition. Roughly 30 lines. This check is what would have caught
all seven.

It must carry an explicit allowlist for properties set inline from JavaScript, or it
will report false positives:

```js
// Set per-element in JS, never in a stylesheet. Not bugs.
const JS_SET = new Set(['--fill-from', '--fill-to'])  // Slider.jsx:109
```

Any future addition to this list should cite the file and line that sets it.

**Acceptance:** `npm run check:tokens` exits 0. No `font-size: <n>px` remains in
`src/**/*.css` outside `variables.css`.

---

## 3 · Home — Stitch-pattern hero, light theme

Structure follows the reference pattern (Stitch), translated to a light editorial theme.
The hero **owns exactly one viewport**: `min-height: calc(100dvh - var(--header-h))`,
flex-centred. The footer is reachable only by scrolling.

```
┌─ header (untouched) ──────────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────┤
│                Every image India can imagine                      │  h1, clamp 34→52px
│                                                                   │
│      Describe the photograph you need — we'll generate ten        │  16px, muted
│      authentic Indian variations, ready to edit and licence.      │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │  Describe the image you need…                           │     │  18px placeholder
│   │                                                         │     │  ~230px min-height
│   │  ╭───╮ ╭────────╮ ╭──────────────╮ ╭────────────╮ ╭─────╮│    │
│   │  │ 🎙│ │⚭ Link  │ │⧉ Upload image│ │▤ Upload PDF│ │Gen ↑││    │
│   │  ╰───╯ ╰────────╯ ╰──────────────╯ ╰────────────╯ ╰─────╯│    │
│   └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│    ✦ Family celebrating Diwali    ✦ Corporate team, Mumbai        │  suggestion pills
│    ✦ Farmer at sunrise            ✦ Traditional wedding           │
└───────────────────────────────────────────────────────────────────┘
        ↓ scroll ↓
┌─ footer ──────────────────────────────────────────────────────────┐
```

### Copy

- **Headline:** *Every image India can imagine*
- **Sub:** *Describe the photograph you need — we'll generate ten authentic Indian
  variations, ready to edit and licence.*

The `h1` becomes visible. It is currently `sr-only`, which is the direct cause of the
page reading as unfinished.

### The prompt box

| Property | Value |
|---|---|
| Fill | `var(--color-white)` |
| Border | `1px solid var(--color-border-light)` |
| Radius | `var(--radius-2xl)` (24px) |
| Shadow, rest | `var(--shadow-md)` |
| Shadow, `:focus-within` | `var(--shadow-lg)`, border → `var(--color-border-strong)` |
| Min height | 230px desktop, 140px mobile |
| Placeholder | 18px, `var(--color-text-muted)` |

The focus lift is where the premium quality comes from in a light theme, since Stitch's
glow is unavailable to us.

### Controls — bottom-left of the box

In the position Stitch uses for its App/Web toggle. Grey pills: `var(--color-chip-bg)`
fill, `var(--color-chip-border)` border, `var(--text-sm)`, 15px icons, `var(--color-hover)`
on hover.

1. **Microphone** — voice input
2. **Add link**
3. **Upload image**
4. **Upload PDF**

**Explicitly dropped from the reference pattern:** the `+` button, the App/Web toggle,
colour options, model selection.

### Submit — bottom-right of the box

A black `Generate ↑` pill rather than a bare arrow circle. Same weight and position as
the reference, but a stock-photo buyer should not have to infer that an arrow means
"make images". Disabled until the field has content.

### Microphone behaviour

Uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). While
recording, the box shows a "Listening…" state with a pulsing dot; interim transcripts
append to the field.

**Browser limit, not a shortcut:** Firefox does not implement the API and Safari's
support is partial. Where `SpeechRecognition` is absent from `window`, the mic button is
**not rendered** rather than rendered broken. Feature-detect at mount.

### Suggestions

Four pills below the box, each with a sparkle glyph, wrapping and centred. Fixed max
width with ellipsis truncation. Clicking fills the field and focuses it.

- Family celebrating Diwali at home
- Corporate team meeting in a Mumbai office
- Farmer in a green field at sunrise
- Bride and groom at a traditional wedding

The project's convention is that no copy is hardcoded in components, so these live in a
new `src/data/promptSuggestions.js`, replacing the deleted `popularSearches.js`. The
studio's six suggestions move out of `PromptPanel.jsx` into the same file for the same
reason — they are currently inline at `PromptPanel.jsx:9-16`.

### Search results

Unchanged in flow: submitting reveals the results section below the hero and scrolls to
it. Two copy fixes — the heading becomes `10 variations for "…"`, dropping the
implementation detail `5 × 2 Grid — Click any image to open in Creative Studio…`.

`.card__title` gains a bottom scrim
(`linear-gradient(to top, rgba(0,0,0,.65), transparent)`) so white titles stay legible
over bright photographs.

### Viewport fit

At 1440×900, under a 76px header: 56 (pad) + 104 (headline, 2 lines) + 16 + 26 (sub) +
40 + 230 (box) + 24 + 36 (pills) + 48 (pad) = **580px**. Clears 1366×768 as well. Below
700px viewport height the headline and box min-height clamp down.

**Mobile (390×844):** headline clamps to ~28px; box min-height 140px; the four control
pills go icon-only below 480px while retaining 44px touch targets.

### Consequence

There is no collections band between hero and footer, so `CollectionGrid` and
`PopularSearches` remain unused and are deleted with the other orphans.

**Acceptance:** at 1440×900 and 1366×768, header + hero + suggestions are fully visible
with no scrollbar; the footer requires scrolling. At 390×844 nothing truncates mid-word.

---

## 4 · Studio

### Height budget

```css
--studio-h: calc(100dvh - var(--header-h) - var(--studio-bar-h) - var(--space-5) * 2);
```

With the budget correct, the editor fits below the chrome and the `scrollIntoView` call
in `CreativeStudio.jsx:85-88` is **removed**. The back button stays on screen on arrival.

### The bar

The pink `CREATIVE STUDIO & IMAGE GENERATION` badge is replaced by the image's own
metadata, which currently sits redundantly inside the canvas card:

```
← Back to search              Family Festival Celebration · 2000 × 1500 · Edited
```

`.cvpanel__meta` is deleted from `CanvasPanel.jsx` — one bar, one job.

### Toolbar

Three grouped zones on one uniform 32×32 square-rounded button, separated by hairline
dividers. No more mixing pills, circles and rectangles in a single row.

```
1:1 4:3 16:9 3:2 Custom ▾  │ ⊖ 37% ⊕  ⤢  ⧉  ⛶ │ ↺ ↻ ⟲ │      [ Download ]
        ratio                     view            history
```

`Fit to Canvas` becomes an icon with a tooltip inside the view group rather than a wide
text pill.

### Character moves to the right panel

`Character` leaves the canvas toolbar entirely. It composes the prompt, not the pixels,
so it belongs with the prompt — and this removes the last of the pink. The existing
`CharacterBrowser` modal is unchanged; only its trigger relocates.

### Right panel

A flex column with a **pinned footer**, so the primary actions are always reachable
regardless of scroll position.

```
PROMPT          textarea
SUGGESTIONS     all six chips, wrapping        ← currently clipped at three
CHARACTERS      + opens the browser modal; attached shown as removable chips
REFERENCES      + three adders; empty state is one muted line, not a 300px box
─────────────────────────────────────────
[ Generate 10 variations ]                ← pinned
[ Apply edits ]
```

Section headers unify to one treatment: `var(--text-xs)`, uppercase,
`letter-spacing: .08em`, `var(--color-text-muted)`.

Emoji are removed from the suggestion chips — they render inconsistently across
platforms and carry no meaning the text does not. The trailing `✨` comes off the
Generate button; the leading `Sparkles` icon stays.

**Acceptance:** at 1440×900 the studio shows no page scrollbar and the back button is
visible on arrival. All six suggestion chips render. The empty References state occupies
one line.

---

## 5 · Footer and cleanup

- **Delete `footer-v2__chat-fab`** (`Footer.jsx:119-122`). `SupportButton` already owns
  that corner; two FABs in one corner is a bug.
- Social icons drop the hardcoded `fill="#0a53be"` for `currentColor`.
- On mobile the three link columns become a 2-up grid instead of a single ~1400px stack.
  Vertical padding reduced.
- Payment badges shrink to one muted row.

### Deleted

| File | Reason |
|---|---|
| `components/HeroBanner.jsx` + `.css` | Orphaned |
| `components/AboutSection.jsx` + `.css` | Orphaned |
| `components/CharactersPanel.jsx` + `.css` | Orphaned |
| `components/CollectionGrid.jsx` + `.css` | Orphaned — hero owns the viewport |
| `components/PopularSearches.jsx` + `.css` | Orphaned — superseded by hero suggestions |
| `data/popularSearches.js` | Sole consumer deleted; superseded by `data/promptSuggestions.js` |
| `index.html:22-29` | Hero preload for a deleted component |

`public/images/hero/*` are left in place; they cost nothing unreferenced and may be
wanted later.

### Accessibility

- Icon-only buttons to a **≥40px hit area** — several are currently 28px.
- `aria-live="polite"` on the generation status text.
- `:focus-visible` verified on every changed control.
- The mic's recording state announced via `aria-live`.
- `prefers-reduced-motion` already handled globally in `globals.css`; the new pulsing
  "Listening…" dot must respect it.

---

## 6 · Out of scope

- `Header.jsx` and `Header.css` — explicitly untouched.
- No backend. AI generation remains unwired; the existing behaviour of stating plainly
  that generation is not connected is preserved.
- No routing library, no TypeScript, no CSS framework. The stack stays React 18 + Vite +
  plain CSS.
- `CREDITS.md`'s licensing caveat is unaffected: the photography is still Pexels
  placeholder and must be replaced before commercial launch.

---

## 7 · Verification

| Check | How |
|---|---|
| No undefined tokens | `npm run check:tokens` exits 0 |
| No raw font sizes | `grep -rE "font-size: *[0-9.]+px" src --include='*.css'` returns only `variables.css` |
| No off-system colour | `grep -rE "rgba?\(224|#0a53be" src` returns nothing |
| Hero fits one viewport | Playwright screenshot at 1440×900 and 1366×768; no scrollbar |
| Studio fits | Playwright screenshot at 1440×900; back button visible on arrival |
| Mobile | Playwright screenshot at 390×844; no mid-word truncation |
| Build | `npm run build` succeeds |

Screenshots are the acceptance evidence for every layout claim above. Each is compared
against the equivalent "before" capture already taken.
