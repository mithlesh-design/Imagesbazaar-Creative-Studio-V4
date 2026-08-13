# UI/UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine every UI surface of the ImagesBazaar Creative Studio except the header — a real type scale, a Stitch-pattern hero that owns one viewport, a studio that fits its chrome, and no dead code.

**Architecture:** Plain CSS custom properties remain the single source of truth. Two new
scripts make layout claims executable: `check-tokens.mjs` proves every `var(--…)`
resolves, and `shoot.mjs` drives a real browser and asserts geometry (hero fits the
viewport, studio shows no page scrollbar) before writing screenshots. Those two scripts
are the test suite this project has never had, and each task below is gated on them.

**Tech Stack:** React 18 · Vite 6 · plain CSS with custom properties · `lucide-react` ·
`playwright` (new devDependency, used only by the verification script). No TypeScript, no
CSS framework, no router, no test framework.

**Spec:** [`docs/superpowers/specs/2026-08-13-ui-ux-refinement-design.md`](../specs/2026-08-13-ui-ux-refinement-design.md)

## Global Constraints

Every task's requirements implicitly include this section.

- **Never modify `src/components/Header.jsx` or `src/components/Header.css`.** Explicitly out of scope.
- **Visual direction is editorial mono:** black, white, grey. Emphasis via type weight and
  spacing, never hue. The photographs are the only colour on the page.
- **No raw `font-size: <n>px`** anywhere in `src/**/*.css` except `src/styles/variables.css`.
  Use the eight-step scale.
- **No hardcoded colour literals** in `src/**/*.jsx`. Use `currentColor` or a token.
- **No copy hardcoded in components.** Page and panel copy lives in `src/data/`.
- **No new runtime dependencies.** `playwright` is `devDependencies` only.
- **`prefers-reduced-motion`** is honoured globally in `globals.css`; any new animation
  must not defeat it.
- **Touch targets ≥ 44px**, icon-only button hit areas ≥ 40px.
- Commit after every task. Conventional-commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`).

---

### Task 1: Verification harness

Builds the two scripts every later task is gated on. They must **fail** against the
current codebase — that failure is the proof they work.

**Files:**
- Create: `scripts/check-tokens.mjs`
- Create: `scripts/shoot.mjs`
- Modify: `package.json`
- Create: `.gitignore` entry for `docs/superpowers/shots/`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run check:tokens` (exit 0 = all `var(--…)` resolve) and
  `npm run shoot -- <label>` (exit 0 = all layout assertions hold; writes PNGs to
  `docs/superpowers/shots/<label>/`). Later tasks call both by these exact names.

- [ ] **Step 1: Add playwright and the npm scripts**

In `package.json`, add to `devDependencies` and `scripts`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check:tokens": "node scripts/check-tokens.mjs",
    "shoot": "node scripts/shoot.mjs"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "playwright": "^1.62.1",
    "vite": "^6.0.7"
  }
}
```

Then:

```bash
npm install
npx playwright install chromium
```

- [ ] **Step 2: Write `scripts/check-tokens.mjs`**

```js
/**
 * Fails if any `var(--x)` in src/**\/*.css has no `--x:` definition anywhere in
 * the stylesheets. Seven such references existed before this script was written;
 * this is the check that would have caught them.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Set per-element from JavaScript, never in a stylesheet. Not bugs.
 *  Any addition here must cite the file and line that sets it. */
const JS_SET = new Set([
  '--fill-from', // src/studio/components/controls/Slider.jsx:109
  '--fill-to',   // src/studio/components/controls/Slider.jsx:109
])

function cssFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) cssFiles(p, out)
    else if (entry.endsWith('.css')) out.push(p)
  }
  return out
}

const defined = new Set(JS_SET)
const used = new Map() // name -> Set<file>

for (const file of cssFiles('src')) {
  const css = readFileSync(file, 'utf8')
  for (const m of css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)) defined.add(m[1])
  for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
    if (!used.has(m[1])) used.set(m[1], new Set())
    used.get(m[1]).add(file)
  }
}

const missing = [...used.keys()].filter((n) => !defined.has(n)).sort()

if (missing.length) {
  const plural = missing.length === 1 ? 'y is' : 'ies are'
  console.error(`\n✗ ${missing.length} CSS custom propert${plural} used but never defined:\n`)
  for (const name of missing) {
    console.error(`  ${name}`)
    for (const f of used.get(name)) console.error(`      ${f}`)
  }
  console.error('')
  process.exit(1)
}

console.log(`✓ all ${used.size} CSS custom properties resolve`)
```

- [ ] **Step 3: Run it — expect it to FAIL**

```bash
npm run check:tokens
```

Expected: exit 1, listing exactly seven properties — `--color-bg`, `--color-hover`,
`--color-primary`, `--color-text-tertiary`, `--radius-xl`, `--shadow-2xl`,
`--transition-fast`. It must **not** list `--fill-from` or `--fill-to`; if it does, the
`JS_SET` allowlist is not being applied.

- [ ] **Step 4: Write `scripts/shoot.mjs`**

```js
/**
 * Drives a real browser and asserts layout facts, then writes screenshots.
 * Usage: npm run shoot -- before      (dev server must be running)
 * Env:   SHOT_URL (default http://localhost:5173)
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'
const LABEL = process.argv[2] ?? 'after'
const OUT = `docs/superpowers/shots/${LABEL}`

const VIEWPORTS = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
  { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const failures = []

function check(ok, label) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failures.push(label)
}

for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 2,
    isMobile: v.mobile ?? false,
    hasTouch: v.mobile ?? false,
  })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/home-${v.name}.png` })

  // The hero owns exactly one viewport: its bottom edge is at or above the fold.
  const heroFits = await page.evaluate(() => {
    const hero = document.querySelector('.hero')
    if (!hero) return null
    return hero.getBoundingClientRect().bottom <= window.innerHeight + 1
  })
  check(heroFits === true, `${v.name}: hero fits one viewport (got ${heroFits})`)

  // The footer is below the fold — reachable only by scrolling.
  const footerBelowFold = await page.evaluate(() => {
    const f = document.querySelector('footer')
    return f ? f.getBoundingClientRect().top >= window.innerHeight : null
  })
  check(footerBelowFold === true, `${v.name}: footer below the fold (got ${footerBelowFold})`)

  // Studio: navigate in, assert no page scrollbar and a visible back button.
  await page.fill('.heroprompt__input', 'family celebrating diwali')
  await page.click('.heroprompt__submit')
  await page.waitForSelector('.search-results__grid-5x2 .card__button', { timeout: 8000 })
  await page.click('.search-results__grid-5x2 .card__button')
  await page.waitForSelector('.studio', { timeout: 8000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/studio-${v.name}.png` })

  if (!v.mobile) {
    const backVisible = await page.evaluate(() => {
      const b = document.querySelector('.studio-page__back')
      if (!b) return null
      const r = b.getBoundingClientRect()
      return r.top >= 0 && r.bottom <= window.innerHeight
    })
    check(backVisible === true, `${v.name}: studio back button on screen (got ${backVisible})`)

    const noPageScroll = await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight + 1
    )
    check(noPageScroll === true, `${v.name}: studio needs no page scroll (got ${noPageScroll})`)
  }

  await ctx.close()
}

await browser.close()

if (failures.length) {
  console.error(`\n✗ ${failures.length} layout assertion(s) failed\n`)
  process.exit(1)
}
console.log('\n✓ all layout assertions hold\n')
```

- [ ] **Step 5: Run it against the current code — expect it to FAIL**

In one terminal `npm run dev`, then:

```bash
npm run shoot -- before
```

Expected: exit 1. `.hero` and `.heroprompt__input` do not exist yet, so
`heroFits` is `null` and the fill step throws. **This is the point** — it captures the
"before" screenshots and proves the assertions are live. Record which assertions failed;
Task 6 and Task 9 turn them green.

If the script throws before writing any screenshot, wrap the studio-navigation block in
`try { … } catch (e) { check(false, `${v.name}: studio reachable — ${e.message}`) }` so the
"before" run still produces images.

- [ ] **Step 6: Ignore the screenshot output**

Append to `.gitignore`:

```
docs/superpowers/shots/
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json scripts/ .gitignore
git commit -m "chore: add token and layout verification scripts

check-tokens.mjs fails on the seven CSS custom properties that are
referenced but never defined, with an allowlist for the two that
Slider.jsx sets inline. shoot.mjs drives chromium and asserts hero and
studio geometry rather than only capturing images."
```

---

### Task 2: Foundation — type scale and token resolution

Turns `check:tokens` green and removes 24 ad-hoc font sizes.

**Files:**
- Modify: `src/styles/variables.css`
- Modify: every file under `src/` containing `font-size: <n>px` or one of the seven
  undefined properties (find them with the commands in Step 2)

**Interfaces:**
- Consumes: `npm run check:tokens` from Task 1.
- Produces: the eight-step type scale (`--text-2xs` … `--text-2xl`), plus
  `--color-hover`, `--radius-xl`, `--radius-2xl`, `--shadow-2xl`, `--transition-fast`.
  Tasks 4–11 use these names exactly.

- [ ] **Step 1: Add the scale and the missing tokens**

In `src/styles/variables.css`, inside `:root`, after the `--font-sans` line:

```css
  /* ---- Type scale ----
     Eight steps replacing 24 ad-hoc sizes. Every prior value maps cleanly:
     12.5 and 13.5 -> 13, 14.5 -> 14, 11.5 -> 12. No component may declare a
     raw px font-size. */
  --text-2xs: 11px;   /* badges, counters */
  --text-xs: 12px;    /* overline labels, meta */
  --text-sm: 13px;    /* dense controls */
  --text-base: 14px;  /* default UI text, buttons, links */
  --text-md: 16px;    /* body copy, inputs */
  --text-lg: 20px;    /* panel and section headings */
  --text-xl: 26px;    /* page headings */
  --text-2xl: 34px;   /* home headline base; clamps up to 52px */
```

Add `--color-hover` beside the other colours:

```css
  --color-hover: #f1f3f5;
```

Add the two radii beside the existing scale:

```css
  --radius-xl: 16px;
  --radius-2xl: 24px;  /* the hero prompt box */
```

Add the shadow step and the composite transition:

```css
  --shadow-2xl: 0 18px 48px rgba(0, 0, 0, 0.2);

  --transition-fast: 150ms var(--ease);
```

- [ ] **Step 2: Find every consumer**

```bash
grep -rn "color-bg\b\|--color-primary\|--color-text-tertiary" src --include='*.css'
grep -rn "font-size: *[0-9.]*px" src --include='*.css' | grep -v variables.css
```

- [ ] **Step 3: Fix the three consumer errors**

These are typos and misnomers, fixed at the call site rather than aliased:

| Replace | With |
|---|---|
| `var(--color-bg)` | `var(--color-background)` |
| `var(--color-text-tertiary)` | `var(--color-text-muted)` |
| `var(--color-primary)` | `var(--color-accent)` |

`--color-primary` appears in `src/pages/StudioPage.css:45` on `.studio-page__badge`. That
whole rule is deleted in Task 9; for now just make it resolve.

- [ ] **Step 4: Replace every raw font size**

Map each hit from Step 2 by nearest step: `10,11,11.5` → `--text-2xs`/`--text-xs`;
`12,12.5` → `--text-xs`; `13,13.5` → `--text-sm`; `14,14.5` → `--text-base`;
`15,16,17` → `--text-md`; `18,19,20,21` → `--text-lg`; `22,24,26` → `--text-xl`;
`28,30,34,52,60` → `--text-2xl` or a `clamp()` where the element is a display heading.

`src/styles/globals.css` `.section-heading` and its two media queries collapse to one
declaration: `font-size: var(--text-xl);`.

- [ ] **Step 5: Run both gates — expect PASS and no visual regression**

```bash
npm run check:tokens          # expect: exit 0, "all N CSS custom properties resolve"
grep -rn "font-size: *[0-9.]*px" src --include='*.css' | grep -v variables.css
                              # expect: no output
npm run build                 # expect: success
```

- [ ] **Step 6: Commit**

```bash
git add src/styles src/
git commit -m "refactor: add type scale and resolve undefined CSS custom properties

Eight-step scale replaces 24 ad-hoc font sizes. Three references were
typos or misnomers and are fixed at the call site (--color-bg,
--color-text-tertiary, --color-primary); four were genuinely missing and
are now defined. check:tokens passes."
```

---

### Task 3: Purge dead code, the duplicate FAB, and the stale preload

**Files:**
- Delete: `src/components/HeroBanner.jsx`, `src/components/HeroBanner.css`
- Delete: `src/components/AboutSection.jsx`, `src/components/AboutSection.css`
- Delete: `src/components/CharactersPanel.jsx`, `src/components/CharactersPanel.css`
- Delete: `src/components/CollectionGrid.jsx`, `src/components/CollectionGrid.css`
- Delete: `src/components/PopularSearches.jsx`, `src/components/PopularSearches.css`
- Delete: `src/data/popularSearches.js`
- Modify: `src/components/Footer.jsx:1`, `:36-44`, `:119-122`
- Modify: `index.html:21-29`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Pure removal.

- [ ] **Step 1: Confirm each file is genuinely unreferenced**

```bash
for c in HeroBanner AboutSection CharactersPanel CollectionGrid PopularSearches popularSearches; do
  echo "--- $c"; grep -rn "$c" src index.html --include='*.jsx' --include='*.js' --include='*.html' | grep -v "^src/components/$c\.\|^src/data/$c\."
done
```

Expected: no output under any heading. **If any heading shows a hit, stop and report it**
— something still imports it and the spec's premise is wrong for that file.

- [ ] **Step 2: Delete them**

```bash
git rm src/components/HeroBanner.jsx src/components/HeroBanner.css \
       src/components/AboutSection.jsx src/components/AboutSection.css \
       src/components/CharactersPanel.jsx src/components/CharactersPanel.css \
       src/components/CollectionGrid.jsx src/components/CollectionGrid.css \
       src/components/PopularSearches.jsx src/components/PopularSearches.css \
       src/data/popularSearches.js
```

- [ ] **Step 3: Remove the duplicate chat FAB**

`SupportButton` already owns the bottom-right corner; the footer renders a second button
on top of it. In `src/components/Footer.jsx`, delete lines 119-122:

```jsx
      {/* Floating Chat FAB */}
      <button type="button" className="footer-v2__chat-fab" aria-label="Live Chat Support">
        <MessageSquare size={22} fill="white" stroke="none" />
      </button>
```

Drop `MessageSquare` from the import on line 1. Delete the `.footer-v2__chat-fab` rule
from `src/components/Footer.css`.

- [ ] **Step 4: Remove the hardcoded blue from the social icons**

In `src/components/Footer.jsx`, lines 36-44 — replace `fill="#0a53be"` with
`fill="currentColor"` on all three icons, and set the colour in CSS on
`.footer-v2__social-btn` so it is themeable:

```css
.footer-v2__social-btn {
  color: var(--color-text-primary);
}
```

- [ ] **Step 5: Remove the stale hero preload**

`HeroBanner` no longer renders, so this is a high-priority download for nothing. Delete
`index.html` lines 21-29 (the comment and the entire `<link rel="preload" as="image" …>`).
Leave `public/images/hero/*` on disk — unreferenced files cost nothing and may be wanted.

- [ ] **Step 6: Verify**

```bash
npm run build     # expect: success, no unresolved import
grep -rn "chat-fab\|0a53be" src            # expect: no output
grep -n "preload" index.html               # expect: no output
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: delete orphaned components, duplicate FAB, and stale preload

Five components had no importer. Footer rendered a second chat button on
top of SupportButton in the same corner. index.html preloaded hero-1600
at high priority for a component that no longer renders."
```

---

### Task 4: Hero prompt box and its controls

**Files:**
- Create: `src/data/promptSuggestions.js`
- Create: `src/components/HeroPrompt.jsx`
- Create: `src/components/HeroPrompt.css`

**Interfaces:**
- Consumes: `--radius-2xl`, `--shadow-md/lg`, `--color-hover`, `--transition-fast`,
  `--text-*` from Task 2.
- Produces:
  - `heroSuggestions: {id: string, text: string}[]` and
    `studioSuggestions: {id: string, text: string}[]` from `src/data/promptSuggestions.js`.
  - `<HeroPrompt value onChange onSubmit busy />` — a forwardRef component whose ref lands
    on the `<textarea class="heroprompt__input">`. Task 5 adds a `voiceSlot` prop; Task 6
    mounts it.

- [ ] **Step 1: Create the suggestion data**

`src/data/promptSuggestions.js`:

```js
/** Prompt suggestions. Copy never lives in components — see README "data-driven". */

/** Shown under the hero prompt box on the home page. */
export const heroSuggestions = [
  { id: 'diwali', text: 'Family celebrating Diwali at home' },
  { id: 'corporate', text: 'Corporate team meeting in a Mumbai office' },
  { id: 'farmer', text: 'Farmer in a green field at sunrise' },
  { id: 'wedding', text: 'Bride and groom at a traditional wedding' },
]

/** Shown in the studio's prompt panel. These edit an image that already exists,
 *  so they are phrased as instructions rather than subjects. */
export const studioSuggestions = [
  { id: 'diyas', text: 'Add vibrant Diwali diyas and warm festive lighting' },
  { id: 'office', text: 'Transform the background to a modern corporate office' },
  { id: 'marigold', text: 'Decorate with traditional Indian marigold flowers' },
  { id: 'golden-hour', text: 'Set cinematic golden-hour Indian sunset lighting' },
  { id: 'heritage', text: 'Apply a rich Indian heritage oil-painting style' },
  { id: 'holi', text: 'Add celebratory colour powder and a festival mood' },
]
```

- [ ] **Step 2: Create `src/components/HeroPrompt.jsx`**

```jsx
import { forwardRef, useRef, useState } from 'react'
import { ArrowUp, FileText, ImagePlus, Link2, X } from 'lucide-react'
import './HeroPrompt.css'

const REF_ICON = { image: ImagePlus, pdf: FileText, link: Link2 }

/**
 * The hero's prompt box. Structure follows the reference pattern: a tall field
 * with a control row pinned to its foot — references on the left, submit on the
 * right. `voiceSlot` is rendered first in that row; Task 5 fills it, and it is
 * a slot rather than a hardcoded child because the mic is absent entirely on
 * browsers without SpeechRecognition.
 */
const HeroPrompt = forwardRef(function HeroPrompt(
  { value, onChange, onSubmit, busy = false, voiceSlot = null },
  ref
) {
  const imgInputRef = useRef(null)
  const pdfInputRef = useRef(null)
  const [references, setReferences] = useState([])

  const addLink = () => {
    const url = window.prompt('Paste a reference URL')
    if (!url?.trim()) return
    let name = url.trim()
    try {
      const u = new URL(name)
      name = u.hostname.replace(/^www\./, '') + u.pathname
    } catch {
      /* keep the raw text as the label */
    }
    setReferences((r) => [...r, { id: `link-${r.length}-${name}`, type: 'link', name }])
  }

  const addFile = (type) => (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setReferences((r) => [
        ...r,
        { id: `${type}-${r.length}-${file.name}`, type, name: file.name },
      ])
    }
    e.target.value = ''
  }

  const canSubmit = Boolean(value.trim()) && !busy

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSubmit) onSubmit()
    }
  }

  return (
    <div className="heroprompt">
      <textarea
        ref={ref}
        className="heroprompt__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe the image you need…"
        aria-label="Describe the image you need"
        rows={1}
      />

      {references.length > 0 && (
        <ul className="heroprompt__refs">
          {references.map((r) => {
            const Icon = REF_ICON[r.type] ?? Link2
            return (
              <li className="heroprompt__ref" key={r.id}>
                <Icon size={13} aria-hidden="true" />
                <span className="heroprompt__ref-name">{r.name}</span>
                <button
                  type="button"
                  onClick={() => setReferences((list) => list.filter((x) => x.id !== r.id))}
                  aria-label={`Remove reference ${r.name}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="heroprompt__controls">
        {voiceSlot}

        <button type="button" className="heroprompt__pill" onClick={addLink}>
          <Link2 size={15} aria-hidden="true" />
          <span>Add link</span>
        </button>

        <button
          type="button"
          className="heroprompt__pill"
          onClick={() => imgInputRef.current?.click()}
        >
          <ImagePlus size={15} aria-hidden="true" />
          <span>Upload image</span>
        </button>

        <button
          type="button"
          className="heroprompt__pill"
          onClick={() => pdfInputRef.current?.click()}
        >
          <FileText size={15} aria-hidden="true" />
          <span>Upload PDF</span>
        </button>

        <button
          type="button"
          className="heroprompt__submit"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          <span>Generate</span>
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </div>

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a reference image"
        onChange={addFile('image')}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a reference PDF"
        onChange={addFile('pdf')}
      />
    </div>
  )
})

export default HeroPrompt
```

- [ ] **Step 3: Create `src/components/HeroPrompt.css`**

```css
/* The box. In a light theme the focus lift does the work the reference
   pattern's glow does in a dark one. */
.heroprompt {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--search-max);
  min-height: 230px;
  padding: var(--space-5);
  text-align: left;
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.heroprompt:focus-within {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-lg);
}

.heroprompt__input {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: none;
  font-size: var(--text-lg);
  line-height: 1.5;
  color: var(--color-text-primary);
}

.heroprompt__input::placeholder {
  color: var(--color-text-muted);
}

.heroprompt__controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-4);
}

.heroprompt__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: var(--color-chip-bg);
  border: 1px solid var(--color-chip-border);
  border-radius: var(--radius-pill);
  white-space: nowrap;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.heroprompt__pill:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}

.heroprompt__submit {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 40px;
  margin-left: auto;
  padding: 0 var(--space-5);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-white);
  background: var(--color-accent);
  border-radius: var(--radius-pill);
  transition: background-color var(--transition-fast);
}

.heroprompt__submit:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.heroprompt__submit:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface-secondary);
  cursor: not-allowed;
}

/* Attached references */
.heroprompt__refs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-3);
}

.heroprompt__ref {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 240px;
  padding: 4px var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  background: var(--color-chip-bg);
  border: 1px solid var(--color-chip-border);
  border-radius: var(--radius-pill);
}

.heroprompt__ref-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Below 480px the four controls cannot hold their labels without wrapping the
   row. Icons only, but the 40px target is kept. */
@media (max-width: 479px) {
  .heroprompt {
    min-height: 140px;
    padding: var(--space-4);
  }

  .heroprompt__input {
    font-size: var(--text-md);
  }

  .heroprompt__pill {
    width: 40px;
    padding: 0;
    justify-content: center;
  }

  .heroprompt__pill span {
    display: none;
  }

  .heroprompt__submit {
    padding: 0 var(--space-4);
  }
}
```

- [ ] **Step 4: Verify it compiles and tokens still resolve**

```bash
npm run check:tokens   # expect: exit 0
npm run build          # expect: success
```

The component is not mounted yet — Task 6 does that. A build-only check is the correct
gate here.

- [ ] **Step 5: Commit**

```bash
git add src/data/promptSuggestions.js src/components/HeroPrompt.jsx src/components/HeroPrompt.css
git commit -m "feat: add hero prompt box with reference controls

Tall field with a control row pinned to its foot: references left, submit
right. voiceSlot is a slot rather than a child because the mic is absent
entirely where SpeechRecognition is unavailable."
```

---

### Task 5: Voice input

**Files:**
- Create: `src/components/VoiceButton.jsx`
- Create: `src/components/VoiceButton.css`

**Interfaces:**
- Consumes: `.heroprompt__pill` styling from Task 4 (the button reuses that class).
- Produces: `<VoiceButton onTranscript={(text: string) => void} />`. Returns `null` when
  the browser has no `SpeechRecognition`. Task 6 passes it as `HeroPrompt`'s `voiceSlot`.

- [ ] **Step 1: Create `src/components/VoiceButton.jsx`**

```jsx
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
      recognition.stop()
      setListening(false)
    } else {
      recognition.start()
      setListening(true)
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
```

- [ ] **Step 2: Create `src/components/VoiceButton.css`**

```css
.voice {
  width: 40px;
  padding: 0;
  justify-content: center;
}

.voice.is-listening {
  color: var(--color-white);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.voice__dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: var(--color-white);
  border-radius: 50%;
  animation: voice-pulse 1.2s ease-in-out infinite;
}

.voice {
  position: relative;
}

@keyframes voice-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
```

`globals.css` already reduces every animation to 0.01ms under
`prefers-reduced-motion: reduce`, so the pulse stops there without extra CSS. The
listening state stays legible because it is carried by the fill and the `aria-live`
announcement, not by the animation.

- [ ] **Step 3: Verify**

```bash
npm run check:tokens   # expect: exit 0
npm run build          # expect: success
```

- [ ] **Step 4: Commit**

```bash
git add src/components/VoiceButton.jsx src/components/VoiceButton.css
git commit -m "feat: add voice input for the hero prompt

Feature-detects SpeechRecognition and renders nothing where it is
absent (Firefox, partially Safari) rather than a button that fails
silently. Listening state is announced via aria-live, not by the
animation alone."
```

---

### Task 6: Assemble the hero and turn the layout assertions green

This is the task that makes `npm run shoot` pass on the home page.

**Files:**
- Modify: `src/pages/Home.jsx` (full rewrite of the returned markup)
- Modify: `src/pages/Home.css`
- Modify: `src/components/SearchBar.jsx` — **delete**, superseded by `HeroPrompt`
- Delete: `src/components/SearchBar.css`

**Interfaces:**
- Consumes: `HeroPrompt` (Task 4), `VoiceButton` (Task 5), `heroSuggestions` (Task 4).
- Produces: DOM contracts the `shoot.mjs` assertions depend on — `.hero`,
  `.heroprompt__input`, `.heroprompt__submit`. Do not rename these without updating
  `scripts/shoot.mjs`.

- [ ] **Step 1: Confirm `SearchBar` has no other consumer**

```bash
grep -rn "SearchBar" src --include='*.jsx' | grep -v "^src/components/SearchBar"
```

Expected: only `src/pages/Home.jsx`. If `StudioPage` or anything else imports it, stop
and report.

- [ ] **Step 2: Rewrite `Home.jsx`**

```jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import HeroPrompt from '../components/HeroPrompt'
import VoiceButton from '../components/VoiceButton'
import CollectionCard from '../components/CollectionCard'
import ImageSearchModal from '../components/ImageSearchModal'
import Footer from '../components/Footer'
import SupportButton from '../components/SupportButton'
import { useStudioActions } from '../studio/StudioProvider'
import { useSearch } from '../hooks/useSearch'
import { heroSuggestions } from '../data/promptSuggestions'
import './Home.css'

export default function Home({ onNavigateStudio }) {
  const search = useSearch()
  const studio = useStudioActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageSearchOpen, setImageSearchOpen] = useState(false)

  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  const submit = useCallback(() => {
    search.generate()
  }, [search])

  const useSuggestion = useCallback(
    (text) => {
      search.setQuery(text)
      inputRef.current?.focus()
    },
    [search]
  )

  const selectImage = useCallback(
    (collection) => {
      if (!collection) return
      studio.loadFromSource({
        url: collection.imageFull,
        name: `${collection.id}.jpg`,
        title: collection.title,
        alt: collection.alt,
      })
      onNavigateStudio?.()
    },
    [studio, onNavigateStudio]
  )

  const hasSearchActive = Boolean(search.query.trim()) && search.status !== 'idle'

  // Results live below the fold by design, so reveal them rather than leaving
  // the user looking at an unchanged hero.
  useEffect(() => {
    if (search.status === 'results' || search.status === 'loading') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [search.status])

  const generatedResults = search.results.slice(0, 10)

  return (
    <div className="home-page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header onOpenMenu={() => setMenuOpen(true)} />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCategory={useSuggestion}
      />

      <main id="main" className="home-page__main">
        <section className="hero">
          <h1 className="hero__title">Every image India can imagine</h1>
          <p className="hero__sub">
            Describe the photograph you need — we’ll generate ten authentic Indian
            variations, ready to edit and licence.
          </p>

          <HeroPrompt
            ref={inputRef}
            value={search.query}
            onChange={search.setQuery}
            onSubmit={submit}
            busy={search.status === 'loading'}
            voiceSlot={<VoiceButton onTranscript={search.setQuery} />}
          />

          <ul className="hero__suggestions">
            {heroSuggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="hero__suggestion"
                  onClick={() => useSuggestion(s.text)}
                >
                  <span className="hero__suggestion-glyph" aria-hidden="true">
                    ✦
                  </span>
                  <span className="hero__suggestion-text">{s.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div ref={resultsRef}>
          {hasSearchActive && (
            <section className="search-results container" aria-label="Generated images">
              {search.status === 'loading' && <GenerationLoadingState query={search.query} />}

              {search.status === 'empty' && (
                <div className="search-results__empty">
                  <h2>No matching images generated</h2>
                  <p>
                    Try describing your requirement like <em>family celebrating Diwali</em> or{' '}
                    <em>corporate office meeting in Mumbai</em>.
                  </p>
                </div>
              )}

              {search.status === 'results' && generatedResults.length > 0 && (
                <div className="search-results__content">
                  <div className="search-results__head-wrap">
                    <h2 className="search-results__heading">
                      10 variations for “{search.query}”
                    </h2>
                    <p className="search-results__sub">
                      Pick one to open it in the Creative Studio.
                    </p>
                  </div>

                  <ul className="search-results__grid-5x2">
                    {generatedResults.map((item, i) => (
                      <CollectionCard
                        key={item.id}
                        collection={item.collection}
                        onSelect={selectImage}
                        priority={i < 5}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
      <SupportButton />

      <ImageSearchModal open={imageSearchOpen} onClose={() => setImageSearchOpen(false)} />
    </div>
  )
}

function GenerationLoadingState({ query }) {
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTextIndex((prev) => (prev + 1) % 4), 600)
    return () => clearInterval(interval)
  }, [])

  const loadingTexts = [
    `Analysing your brief: “${query}”…`,
    'Applying lighting models…',
    'Rendering high-resolution detail…',
    'Finalising ten variations…',
  ]

  return (
    <div className="generation-loading">
      <div className="generation-loading__header">
        <h2 className="generation-loading__title">
          <span className="generation-loading__spinner" aria-hidden="true" />
          Generating images
        </h2>
        <p className="generation-loading__status" role="status" aria-live="polite">
          {loadingTexts[textIndex]}
        </p>
      </div>
      <ul className="search-results__grid-5x2">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="skeleton-card">
            <div className="skeleton-card__image" />
            <div className="skeleton-card__text" />
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Note the two bug fixes folded in: `loadingTexts` was in the `useEffect` dependency array
while being re-created every render (it re-created the interval on every tick), and the
results heading no longer describes its own grid geometry.

- [ ] **Step 3: Replace the top of `Home.css`**

Replace the `.home__search` rules and its two media queries with the hero:

```css
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.home-page__main {
  flex: 1;
}

/* The hero owns exactly one viewport. scripts/shoot.mjs asserts that its
   bottom edge is at or above the fold at 1440x900, 1366x768 and 390x844. */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  min-height: calc(100dvh - var(--header-h));
  padding: var(--space-8) var(--page-pad) var(--space-7);
  text-align: center;
}

.hero__title {
  max-width: 16ch;
  font-size: clamp(28px, 5.2vw, 52px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero__sub {
  max-width: 54ch;
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.hero__suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  max-width: var(--search-max);
}

.hero__suggestion {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 280px;
  min-height: 40px;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  transition: background-color var(--transition-fast), border-color var(--transition-fast),
    color var(--transition-fast);
}

.hero__suggestion:hover {
  color: var(--color-text-primary);
  background: var(--color-hover);
  border-color: var(--color-border);
}

.hero__suggestion-glyph {
  color: var(--color-text-muted);
}

.hero__suggestion-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Short viewports: clamp the block so it still fits one screen. */
@media (max-height: 700px) {
  .hero {
    gap: var(--space-4);
    padding-top: var(--space-6);
    padding-bottom: var(--space-5);
  }

  .hero__title {
    font-size: clamp(26px, 4vw, 34px);
  }

  .heroprompt {
    min-height: 160px;
  }
}

@media (max-width: 639px) {
  .hero {
    gap: var(--space-4);
    padding-top: var(--space-6);
  }

  .hero__suggestions {
    flex-wrap: nowrap;
    justify-content: flex-start;
    width: 100%;
    overflow-x: auto;
    padding-bottom: var(--space-2);
    scrollbar-width: none;
  }

  .hero__suggestions::-webkit-scrollbar {
    display: none;
  }
}
```

Keep the existing `.search-results*`, `.generation-loading*` and `.skeleton-card*` rules
below, changing only `--color-bg` if Task 2 missed any.

- [ ] **Step 4: Delete the superseded search bar**

```bash
git rm src/components/SearchBar.jsx src/components/SearchBar.css
```

- [ ] **Step 5: Run the layout assertions — expect the home checks to PASS**

With `npm run dev` running:

```bash
npm run shoot -- after-hero
```

Expected: `hero fits one viewport` and `footer below the fold` pass at all three
viewports. The two studio assertions still fail — Task 9 fixes those.

Open `docs/superpowers/shots/after-hero/home-desktop-1440x900.png` and confirm the
headline, sub, box and four pills are all visible with no scrollbar.

- [ ] **Step 6: Verify the rest**

```bash
npm run check:tokens   # expect: exit 0
npm run build          # expect: success
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace the empty home page with a one-viewport hero

Headline, sub, prompt box and suggestions now fill the first screen; the
footer is reachable only by scrolling. The h1 was sr-only, which is why
the page read as unfinished. SearchBar is superseded by HeroPrompt.

Also fixes a re-created interval in the loading state and drops the
results heading's description of its own grid geometry."
```

---

### Task 7: Result card legibility

**Files:**
- Modify: `src/components/CollectionCard.css`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Reproduce the failure**

With the dev server running, search `family` and look at *Happy Family at Home* in
`docs/superpowers/shots/after-hero/home-desktop-1440x900.png` — white title text over a
bright window, effectively unreadable.

- [ ] **Step 2: Add a scrim**

In `src/components/CollectionCard.css`, add to `.card__media`:

```css
.card__media {
  position: relative;
}

/* Guarantees the title's contrast regardless of what is in the frame.
   The photographs vary too much for a text shadow to be reliable. */
.card__media::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 55%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0));
  pointer-events: none;
}

.card__title {
  position: relative;
  z-index: 1;
}
```

If `.card__title` is already absolutely positioned over the media, keep its existing
positioning and add only `z-index: 1`.

- [ ] **Step 3: Verify**

```bash
npm run shoot -- after-cards
```

Open the desktop shot and confirm every one of the ten titles is legible, *Happy Family
at Home* included.

- [ ] **Step 4: Commit**

```bash
git add src/components/CollectionCard.css
git commit -m "fix: scrim result card titles for contrast

White titles were unreadable over bright frames. The photographs vary too
much for a text shadow to be reliable, so the gradient is unconditional."
```

---

### Task 8: Footer

**Files:**
- Modify: `src/components/Footer.css`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Measure the problem**

```bash
npm run shoot -- before-footer
```

In `home-mobile-390x844.png` the footer is roughly 85% of the scrollable page — three
link columns stacked into a single ~1400px run.

- [ ] **Step 2: Two-up the columns on mobile and tighten the rhythm**

In `src/components/Footer.css`:

```css
/* Three stacked columns run to ~1400px on a phone. Two-up halves that
   without shrinking any touch target. */
@media (max-width: 639px) {
  .footer-v2__nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-6) var(--space-4);
  }

  .footer-v2__container {
    padding-top: var(--space-7);
    padding-bottom: var(--space-6);
  }

  .footer-v2__top {
    gap: var(--space-7);
  }
}

/* One muted row, not a badge wall. */
.footer-v2__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  opacity: 0.75;
}

.footer-v2__badges .badge {
  transform: scale(0.85);
  transform-origin: left center;
}
```

Reduce the vertical padding on `.footer-v2__container` at desktop by one step on the
existing rule (e.g. `--space-11` → `--space-9`) — find it with
`grep -n "padding" src/components/Footer.css`.

- [ ] **Step 3: Verify**

```bash
npm run shoot -- after-footer
npm run check:tokens
```

Confirm the footer's share of the mobile page has dropped and no link target is under
44px.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.css
git commit -m "refactor: compact the footer, two-up its columns on mobile

Three stacked link columns ran to ~1400px on a phone, making the footer
roughly 85% of the page. Touch targets are unchanged."
```

---

### Task 9: Studio height budget, bar, and the scroll hack

Turns the two remaining `shoot` assertions green.

**Files:**
- Modify: `src/styles/variables.css`
- Modify: `src/studio/CreativeStudio.jsx:85-88`
- Modify: `src/pages/StudioPage.jsx:32-45`
- Modify: `src/pages/StudioPage.css`
- Modify: `src/studio/components/CanvasPanel.jsx:180-190`

**Interfaces:**
- Consumes: `--header-h` (existing).
- Produces: `--studio-bar-h` and a corrected `--studio-h`. Tasks 10–11 assume the studio
  fits without page scroll.

- [ ] **Step 1: Correct the height budget**

`--studio-h: calc(100dvh - 48px)` is a near-full-viewport grid placed *below* a 76px
header and a ~45px bar, so it overflows by ~73px. That overflow is the actual cause of
the scroll hack in Step 3.

In `src/styles/variables.css`, replace the `--studio-h` declaration:

```css
  --studio-bar-h: 44px;
  /* The editor fits the space that is actually left after the page chrome.
     Getting this wrong by ~73px is what forced the scrollIntoView hack. */
  --studio-h: calc(100dvh - var(--header-h) - var(--studio-bar-h) - var(--space-5) * 2);
```

- [ ] **Step 2: Move the image metadata into the bar**

`CanvasPanel` renders the filename and dimensions inside the canvas card while the bar
above shows a decorative badge. Swap them.

Delete `src/studio/components/CanvasPanel.jsx:180-190` — the whole
`{hasImage && (<p className="cvpanel__meta">…</p>)}` block — and its `.cvpanel__meta`,
`.cvpanel__file`, `.cvpanel__dims`, `.cvpanel__edited` rules from `CanvasPanel.css`.

Then rewrite the bar in `src/pages/StudioPage.jsx`. It needs studio state, so add the
import `import { useStudio } from '../studio/StudioProvider'` and read it:

```jsx
export default function StudioPage({ onNavigateHome }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { hasImage, isEdited, edit, meta } = useStudio()

  // …Header and MobileMenu unchanged…

      <div className="studio-page__bar">
        <div className="container studio-page__bar-inner">
          <button
            type="button"
            className="studio-page__back"
            onClick={onNavigateHome}
            aria-label="Return to image search"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Back to search</span>
          </button>

          {hasImage && (
            <p className="studio-page__meta">
              <span className="studio-page__file">{meta?.title || meta?.name}</span>
              <span className="studio-page__dims">
                {Math.round(edit.crop.w)} × {Math.round(edit.crop.h)}
              </span>
              {isEdited && <span className="studio-page__edited">Edited</span>}
            </p>
          )}
        </div>
      </div>
```

- [ ] **Step 3: Delete the scroll hack**

In `src/studio/CreativeStudio.jsx`, delete lines 85-88:

```jsx
  useEffect(() => {
    if (fullscreen) return
    sectionRef.current?.scrollIntoView({ block: 'start' })
  }, [fullscreen])
```

This scrolled the back button off the top of the viewport on arrival. With the budget
corrected there is nothing to scroll to. Remove `useEffect` from the import if it becomes
unused.

- [ ] **Step 4: Restyle the bar and delete the pink**

Replace the whole of `src/pages/StudioPage.css`:

```css
.studio-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.studio-page__bar {
  height: var(--studio-bar-h);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border-light);
}

.studio-page__bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.studio-page__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-3);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.studio-page__back:hover {
  color: var(--color-text-primary);
  background-color: var(--color-hover);
}

/* Replaces the decorative pink badge with the one thing worth stating here:
   which image is open, and whether it has been changed. */
.studio-page__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.studio-page__file {
  overflow: hidden;
  font-weight: 600;
  color: var(--color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-page__dims {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.studio-page__edited {
  padding: 2px var(--space-2);
  font-size: var(--text-2xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: var(--color-chip-bg);
  border: 1px solid var(--color-chip-border);
  border-radius: var(--radius-pill);
}

.studio-page__main {
  flex: 1;
}

@media (max-width: 639px) {
  .studio-page__meta {
    display: none;
  }
}
```

- [ ] **Step 5: Run the assertions — expect ALL to PASS**

```bash
npm run shoot -- after-studio
```

Expected: exit 0. `studio back button on screen` and `studio needs no page scroll` are now
true at 1440×900 and 1366×768.

- [ ] **Step 6: Verify**

```bash
npm run check:tokens                       # expect: exit 0
grep -rn "224, 30, 90\|224,30,90" src      # expect: no output
npm run build                              # expect: success
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: correct the studio height budget and remove the scroll hack

--studio-h was calc(100dvh - 48px) for a grid sitting below a 76px header
and a 44px bar, overflowing by ~73px. scrollIntoView on mount was
compensating for that by pushing the back button off screen. Budget
corrected, hack deleted.

The bar's decorative pink badge is replaced by the image metadata that
was duplicated inside the canvas card."
```

---

### Task 10: Studio toolbar grouping

**Files:**
- Modify: `src/studio/components/CanvasPanel.jsx:52-178`
- Modify: `src/studio/components/CanvasPanel.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CanvasPanel` no longer accepts `onOpenCharacters` or
  `selectedCharactersCount`. Task 11 removes those props at the call site in
  `CreativeStudio.jsx`.

- [ ] **Step 1: Remove the Character button from the canvas toolbar**

Delete lines 56-69 of `CanvasPanel.jsx` — the `cvpanel__character-btn` block — and drop
`Users` from the lucide import. Remove `onOpenCharacters` and `selectedCharactersCount`
from the destructured props. Delete `.cvpanel__character-btn` and
`.cvpanel__character-badge` from `CanvasPanel.css` — the last of the pink lives there.

Character composes the prompt rather than the pixels, so Task 11 re-homes it in the
prompt panel.

- [ ] **Step 2: Replace the wide "Fit to Canvas" pill with an icon in the view group**

In `CanvasPanel.jsx`, delete the `cvpanel__fit` button (lines 71-80) and add it inside the
zoom group instead. Add `Maximize` to the lucide import. The view group becomes:

```jsx
          <div className="cvpanel__group" role="group" aria-label="View">
            <button
              type="button"
              className="cvpanel__icon"
              onClick={() => a.zoomStep(-1)}
              disabled={!hasImage}
              aria-label="Zoom out"
              title="Zoom out (−)"
            >
              <Minus size={15} aria-hidden="true" />
            </button>
            <span className="cvpanel__level" aria-live="off">
              {hasImage ? `${shownZoom}%` : '—'}
            </span>
            <button
              type="button"
              className="cvpanel__icon"
              onClick={() => a.zoomStep(1)}
              disabled={!hasImage}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`cvpanel__icon${view.fit ? ' is-active' : ''}`}
              onClick={a.zoomFit}
              disabled={!hasImage}
              aria-pressed={view.fit}
              aria-label="Fit to canvas"
              title="Fit to canvas (0)"
            >
              <Maximize size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`cvpanel__icon${comparing ? ' is-active' : ''}`}
              disabled={!hasImage || !isEdited}
              aria-pressed={comparing}
              aria-label="Hold to see the original"
              title="Hold to see the original (\\)"
              {...holdCompare}
            >
              <SplitSquareHorizontal size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cvpanel__icon"
              onClick={onToggleFullscreen}
              aria-pressed={fullscreen}
              aria-label={fullscreen ? 'Exit full screen' : 'Expand to full screen'}
              title={fullscreen ? 'Exit full screen (Esc)' : 'Expand to full screen'}
            >
              {fullscreen ? (
                <Minimize2 size={15} aria-hidden="true" />
              ) : (
                <Maximize2 size={15} aria-hidden="true" />
              )}
            </button>
          </div>
```

The history group (undo / redo / reset) stays as it is, and `Download` stays last. Delete
the two now-unused `cvpanel__icon--bare` buttons that this block absorbs.

- [ ] **Step 3: One button shape, three zones**

In `CanvasPanel.css`, replace the `.cvpanel__bar`, `.cvpanel__actions`, `.cvpanel__group`,
`.cvpanel__icon` and `.cvpanel__fit` rules with:

```css
.cvpanel__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--studio-border);
}

.cvpanel__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

/* Three zones — ratio, view, history — separated by hairlines. Every control
   inside them is the same 32px square. Four different button shapes in one row
   is what made this bar unreadable. */
.cvpanel__group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-inline: var(--space-2);
  border-left: 1px solid var(--studio-border);
}

.cvpanel__group:first-of-type {
  border-left: none;
}

.cvpanel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

/* The visual box is 32px; the hit area is 40px. */
.cvpanel__icon::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
}

.cvpanel__icon {
  position: relative;
}

.cvpanel__icon:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--studio-hover);
}

.cvpanel__icon.is-active {
  color: var(--color-white);
  background: var(--studio-accent);
}

.cvpanel__icon:disabled {
  color: var(--studio-text-disabled);
  cursor: not-allowed;
}

.cvpanel__level {
  min-width: 44px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.cvpanel__download {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  margin-left: var(--space-2);
  padding: 0 var(--space-4);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-white);
  background: var(--studio-accent);
  border-radius: var(--radius-md);
  transition: opacity var(--transition-fast);
}

.cvpanel__download:disabled {
  color: var(--color-text-muted);
  background: var(--studio-surface);
  cursor: not-allowed;
}
```

- [ ] **Step 4: Verify**

```bash
npm run check:tokens                       # expect: exit 0
npm run build                              # expect: success
npm run shoot -- after-toolbar             # expect: exit 0
```

Open `studio-desktop-1440x900.png` and confirm: one button shape throughout, three
hairline-separated zones, Download last, no pink anywhere.

- [ ] **Step 5: Commit**

```bash
git add src/studio/components/CanvasPanel.jsx src/studio/components/CanvasPanel.css
git commit -m "refactor: group the studio toolbar into ratio, view and history

One 32px square button shape replaces the mix of pills, circles and
rectangles. 'Fit to canvas' becomes an icon in the view group rather than
a wide text pill. Character leaves the canvas bar entirely — it composes
the prompt, not the pixels — taking the last of the stray pink with it."
```

---

### Task 11: Studio right panel

**Files:**
- Modify: `src/studio/components/PromptPanel.jsx`
- Modify: `src/studio/components/PromptPanel.css`
- Modify: `src/studio/CreativeStudio.jsx:96-124`

**Interfaces:**
- Consumes: `studioSuggestions` (Task 4); `CanvasPanel` without the character props
  (Task 10).
- Produces: `PromptPanel` gains `onOpenCharacters: () => void`. `CreativeStudio` passes
  `onOpenCharacters={() => setBrowserOpen(true)}` to `PromptPanel` instead of
  `CanvasPanel`.

- [ ] **Step 1: Move the character trigger's wiring**

In `src/studio/CreativeStudio.jsx`, remove these two props from `<CanvasPanel>`:

```jsx
            onOpenCharacters={() => setBrowserOpen(true)}
            selectedCharactersCount={selectedCharacters.length}
```

and add to `<PromptPanel>`:

```jsx
            onOpenCharacters={() => setBrowserOpen(true)}
```

- [ ] **Step 2: Restructure the panel**

Rewrite the returned markup of `src/studio/components/PromptPanel.jsx`. Import
`studioSuggestions` from `../../data/promptSuggestions` and delete the local
`PROMPT_SUGGESTIONS` array at lines 9-16 — emoji come out (they render inconsistently
across platforms and carry no meaning the text does not) and the copy belongs in `data/`.
Add `Plus` and `Users` to the lucide import; drop `Sparkles` from the header uses it no
longer needs.

```jsx
  return (
    <section className="ppanel" aria-labelledby="ppanel-heading">
      <h2 className="sr-only" id="ppanel-heading">
        Prompt and references
      </h2>

      <div className="ppanel__scroll">
        <h3 className="ppanel__legend">Prompt</h3>
        <textarea
          className="ppanel__input"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe how you want to edit or generate the image…"
          aria-label="Prompt"
          rows={4}
        />

        <h3 className="ppanel__legend">Suggestions</h3>
        <div className="ppanel__chips">
          {studioSuggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="ppanel__chip"
              onClick={() => onPromptChange(prompt ? `${prompt}, ${s.text}` : s.text)}
            >
              {s.text}
            </button>
          ))}
        </div>

        <h3 className="ppanel__legend">
          Characters
          <button
            type="button"
            className="ppanel__add"
            onClick={onOpenCharacters}
            aria-label="Choose characters"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </h3>
        {names.length > 0 ? (
          <div className="ppanel__chips">
            {names.map((name) => (
              <span className="ppanel__token" key={name}>
                <Users size={13} aria-hidden="true" />
                {name}
              </span>
            ))}
            <button type="button" className="ppanel__clear" onClick={onClearCharacters}>
              Clear
            </button>
          </div>
        ) : (
          <p className="ppanel__empty">None attached</p>
        )}

        <h3 className="ppanel__legend" id="ppanel-refs">
          References
        </h3>
        <div className="ppanel__adders" role="group" aria-labelledby="ppanel-refs">
          <button type="button" className="ppanel__adder" onClick={() => imgRef.current?.click()}>
            <ImagePlus size={16} strokeWidth={1.7} aria-hidden="true" />
            Image
          </button>
          <button type="button" className="ppanel__adder" onClick={addLink}>
            <Link2 size={16} strokeWidth={1.7} aria-hidden="true" />
            Link
          </button>
          <button type="button" className="ppanel__adder" onClick={() => pdfRef.current?.click()}>
            <FileText size={16} strokeWidth={1.7} aria-hidden="true" />
            PDF
          </button>
        </div>

        {refs.length > 0 ? (
          <ul className="ppanel__refs">
            {refs.map((r) => {
              const Icon = REF_ICON[r.type] ?? Link2
              return (
                <li className="ppanel__ref" key={r.key}>
                  <Icon size={14} aria-hidden="true" />
                  <span className="ppanel__ref-name">{r.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveRef(r.key)}
                    aria-label={`Remove reference ${r.name}`}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="ppanel__empty">None added</p>
        )}
      </div>

      <div className="ppanel__cta">
        <button
          type="button"
          className="ppanel__generate"
          onClick={handleGenerateClick}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="ppanel__spin" size={16} aria-hidden="true" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={16} aria-hidden="true" />
              Generate 10 variations
            </>
          )}
        </button>

        <button
          type="button"
          className="ppanel__apply"
          onClick={bake}
          disabled={!hasImage || !isEdited}
          title={
            isEdited
              ? 'Flatten current edits into the image'
              : 'Make an edit first — there is nothing to apply'
          }
        >
          Apply edits
        </button>
      </div>

      {/* the two file inputs stay exactly as they are */}
    </section>
  )
```

Add `onOpenCharacters` to the destructured props.

- [ ] **Step 3: Scroll the content, pin the actions**

In `PromptPanel.css`, replace the `.ppanel`, `.ppanel__head-row`, `.ppanel__title`,
`.ppanel__ai-tag`, `.ppanel__legend`, `.ppanel__suggestions*` and `.ppanel__empty` rules
with:

```css
.ppanel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

/* Content scrolls; the actions never leave. min-height:0 is what lets the
   scroller actually scroll instead of stretching its ancestors. */
.ppanel__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
}

.ppanel__legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-5);
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.ppanel__scroll > .ppanel__legend:first-child {
  margin-top: 0;
}

.ppanel__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
  border: 1px solid var(--studio-border);
  border-radius: var(--radius-sm);
}

.ppanel__add:hover {
  color: var(--color-text-primary);
  background: var(--studio-hover);
}

/* All six render and wrap. They were clipped at three by a fixed height. */
.ppanel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.ppanel__chip,
.ppanel__token {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  line-height: 1.35;
  text-align: left;
  color: var(--color-text-secondary);
  background: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.ppanel__chip:hover {
  color: var(--color-text-primary);
  background: var(--studio-hover);
}

.ppanel__clear {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: underline;
}

/* One line, not a 300px box reserved to say nothing. */
.ppanel__empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.ppanel__cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--studio-border);
}
```

- [ ] **Step 4: Verify**

```bash
npm run check:tokens   # expect: exit 0
npm run build          # expect: success
npm run shoot -- after-panel   # expect: exit 0
```

Open `studio-desktop-1440x900.png` and confirm: all six suggestion chips render, the
empty References state is one line, Generate and Apply edits are visible without
scrolling the panel, and the four section headers share one treatment.

- [ ] **Step 5: Accessibility sweep**

```bash
npm run dev
```

Tab through the home page and the studio end to end and confirm:

- Every control shows a visible focus ring (`globals.css` `:focus-visible`).
- The skip link is the first tab stop on both pages.
- No icon-only button has a hit area under 40px — check with devtools' box model on
  `.cvpanel__icon`, `.ppanel__add`, `.heroprompt__pill`.
- With `prefers-reduced-motion: reduce` forced in devtools, the mic pulse and the
  skeleton shimmer stop, and the listening state is still legible from the fill.
- The generating status announces — it carries `role="status" aria-live="polite"`.

Fix anything that fails before committing.

- [ ] **Step 6: Commit**

```bash
git add src/studio/
git commit -m "refactor: restructure the studio prompt panel

Content scrolls and the actions pin, so Generate is always reachable.
All six suggestions render — they were clipped at three by a fixed
height. The empty References state is one line rather than a reserved
300px box. Characters moves here from the canvas toolbar, and the four
section headers collapse to one treatment from three."
```

---

### Task 12: Final verification and documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run every gate**

```bash
npm run check:tokens
npm run build
npm run shoot -- final
grep -rn "font-size: *[0-9.]*px" src --include='*.css' | grep -v variables.css
grep -rn "224, 30, 90\|224,30,90\|0a53be" src
git status --porcelain
```

Expected: `check:tokens` exit 0; `build` succeeds; `shoot` exit 0 with all assertions
passing; both greps silent; working tree clean.

- [ ] **Step 2: Confirm the header is untouched**

```bash
git diff --stat e59f011..HEAD -- src/components/Header.jsx src/components/Header.css
```

Expected: **no output.** If this prints anything, the constraint was violated — revert
those hunks.

- [ ] **Step 3: Bring the README in line**

`README.md` describes a structure that no longer exists — a hero banner, a collections
grid, popular-search chips, an about section, a three-panel studio with a tool rail, and
a studio that lives inline on the landing page. Update:

- The `Structure` tree: remove the deleted components, add `HeroPrompt`, `VoiceButton`,
  `data/promptSuggestions.js`, `scripts/`.
- The `Layout` ASCII diagram: replace the rail/detail/stage drawing with the current
  canvas + prompt-panel two-card layout.
- `The flow`: the studio is now a page reached from a result, not a section below the
  search bar.
- Add a short `Verification` section documenting `npm run check:tokens` and
  `npm run shoot`.
- Delete the duplicated `## Performance` heading — there are currently two.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: bring the README in line with the refined UI

The structure tree, layout diagram and flow described components and a
three-panel studio that no longer exist. Documents the two verification
scripts and removes the duplicated Performance heading."
```

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: §2 foundation → Task 2 (with
the harness in Task 1); §3 hero → Tasks 4, 5, 6, plus 7 for the card scrim and the
results copy fix in Task 6; §4 studio → Tasks 9, 10, 11; §5 footer and cleanup → Tasks 3,
8, with the accessibility list in Task 11 Step 5; §7 verification → Tasks 1 and 12.

**Two spec items that needed a home and now have one:** the README is stale in ways the
spec did not enumerate (it documents a tool rail and an inline studio that no longer
exist), so Task 12 Step 3 covers it. And the spec's "no copy hardcoded in components"
convention required the studio's six suggestions to move to `data/` as well as the hero's
four — folded into Tasks 4 and 11.

**Type consistency.** `heroSuggestions` / `studioSuggestions` are named identically in
Tasks 4, 6 and 11. `onOpenCharacters` moves from `CanvasPanel` (removed in Task 10) to
`PromptPanel` (added in Task 11) — both halves are stated in both tasks' Interfaces
blocks. `--studio-bar-h` is defined in Task 9 Step 1 and consumed in Task 9 Step 4.
`.hero`, `.heroprompt__input` and `.heroprompt__submit` are the DOM contract
`scripts/shoot.mjs` depends on; Task 6's Interfaces block says so explicitly.

**One known ordering constraint.** Task 1's `shoot` script asserts against selectors that
do not exist until Task 6, and studio geometry that is wrong until Task 9. This is
deliberate — it is the red half of the cycle — but it means `npm run shoot` will not exit
0 until Task 9 completes. Tasks 2–5 gate on `check:tokens` and `build` only. Do not
"fix" the shoot script during Tasks 2–5 to make it pass early.
