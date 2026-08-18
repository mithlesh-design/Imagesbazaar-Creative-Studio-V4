/**
 * Drives a real browser and asserts layout facts, then writes screenshots.
 * Usage: npm run shoot -- before      (dev server must be running)
 * Env:   SHOT_URL (default http://localhost:5173)
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { TOUR_KEY } from '../src/tour/tourStorage.js'

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
  // Each viewport gets a fresh context, so the first-run walkthrough would open
  // in every screenshot below. Seed it as already seen; the tour has its own
  // pass at the end of this file with unseeded contexts.
  await ctx.addInitScript((key) => {
    try {
      localStorage.setItem(key, JSON.stringify({ v: 1, outcome: 'completed' }))
    } catch {
      /* storage unavailable; the tour treats that as seen anyway */
    }
  }, TOUR_KEY)
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
  // Wrapped so a missing/renamed selector still lets every viewport finish and
  // still produce screenshots — a thrown exception here must not abort the run.
  // The hero has a min-height, so an overflowing panel still reports its bottom
  // edge at the fold while spilling inside it. Measure content against the box,
  // not against the viewport.
  try {
    await page.waitForSelector('.heroprompt__input', { timeout: 4000 })
    const headroom = await page.evaluate(() => {
      const h = document.querySelector('.hero')
      const kids = [...h.children]
      const s = getComputedStyle(h)
      // Margins are counted deliberately. getBoundingClientRect().height excludes
      // them, and the hero carries 60px of child margin — so without this term the
      // script reported 100px of room at 1366x768 where only 40px existed, and a
      // change could overflow the fold while the gate still looked healthy.
      const content =
        kids.reduce((a, el) => {
          const m = getComputedStyle(el)
          // Out-of-flow children take up no space in the column but still
          // report a full rect. Nothing in the hero is positioned that way
          // today; the guard stays so the next thing that is cannot silently
          // double-count the section.
          if (m.position === 'absolute' || m.position === 'fixed') return a
          return (
            a +
            el.getBoundingClientRect().height +
            parseFloat(m.marginTop) +
            parseFloat(m.marginBottom)
          )
        }, 0) +
        parseFloat(s.rowGap) * (kids.length - 1) +
        parseFloat(s.paddingTop) +
        parseFloat(s.paddingBottom)
      return Math.round(h.clientHeight - content)
    })
    check(headroom >= 0, `${v.name}: studio panel fits the hero (headroom ${headroom}px)`)

    // The site search bar sits above the hero and shares the first screen.
    const barVisible = await page.evaluate(() => {
      const b = document.querySelector('.sitesearch__bar')
      return b ? b.getBoundingClientRect().bottom <= window.innerHeight : null
    })
    check(barVisible === true, `${v.name}: site search bar on the first screen`)
  } catch (e) {
    check(false, `${v.name}: hero — ${e.message}`)
  }

  try {
    // The bar has no submit button by design; Enter runs the search.
    await page.fill('.sitesearch__input', 'family')
    await page.press('.sitesearch__input', 'Enter')
    await page.waitForSelector('.search-results__grid .card__button', { timeout: 8000 })
    await page.click('.search-results__grid .card__button')
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
  } catch (e) {
    check(false, `${v.name}: studio reachable — ${e.message}`)
  }

  await ctx.close()
}

// ---------------------------------------------------------------------------
// The walkthrough, on clean profiles so it actually opens.
// ---------------------------------------------------------------------------
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 2,
    isMobile: v.mobile ?? false,
    hasTouch: v.mobile ?? false,
  })
  const page = await ctx.newPage()

  try {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    // The anchor contract. Without this a refactor of HeroPrompt can drop a
    // data-tour attribute and the walkthrough degrades silently.
    const anchors = await page.evaluate(() =>
      ['hero-brief', 'hero-links', 'hero-files', 'hero-generate'].map(
        (t) => document.querySelectorAll(`[data-tour="${t}"]`).length
      )
    )
    check(
      anchors.every((n) => n === 1),
      `${v.name}: all four tour anchors resolve exactly once (got ${anchors.join(',')})`
    )

    await page.waitForSelector('.herotour__tip', { timeout: 5000 })
    check(true, `${v.name}: walkthrough opens on a first visit`)

    // The hero arithmetic must still hold WITH the tour open — this is the
    // assertion that catches a mount inside .hero rather than a portal.
    const headroom = await page.evaluate(() => {
      const h = document.querySelector('.hero')
      const kids = [...h.children]
      const s = getComputedStyle(h)
      // Margins are counted deliberately. getBoundingClientRect().height excludes
      // them, and the hero carries 60px of child margin — so without this term the
      // script reported 100px of room at 1366x768 where only 40px existed, and a
      // change could overflow the fold while the gate still looked healthy.
      const content =
        kids.reduce((a, el) => {
          const m = getComputedStyle(el)
          // Out-of-flow children take up no space in the column but still
          // report a full rect. Nothing in the hero is positioned that way
          // today; the guard stays so the next thing that is cannot silently
          // double-count the section.
          if (m.position === 'absolute' || m.position === 'fixed') return a
          return (
            a +
            el.getBoundingClientRect().height +
            parseFloat(m.marginTop) +
            parseFloat(m.marginBottom)
          )
        }, 0) +
        parseFloat(s.rowGap) * (kids.length - 1) +
        parseFloat(s.paddingTop) +
        parseFloat(s.paddingBottom)
      return Math.round(h.clientHeight - content)
    })
    check(headroom >= 0, `${v.name}: hero still fits with the tour open (${headroom}px)`)

    // Walk all four steps: spotlight tracks its target, tooltip stays on screen.
    for (let i = 0; i < 4; i++) {
      const r = await page.evaluate(() => {
        const spot = document.querySelector('.herotour__spot')
        const target = document.querySelector(`[data-tour="${spot.dataset.step}"]`)
        const s = spot.getBoundingClientRect()
        const t = target.getBoundingClientRect()
        const tip = document.querySelector('.herotour__tip').getBoundingClientRect()
        return {
          tracks:
            Math.abs(s.top - t.top) < 1.5 &&
            Math.abs(s.left - t.left) < 1.5 &&
            Math.abs(s.width - t.width) < 1.5,
          onScreen:
            tip.left >= 0 &&
            tip.right <= window.innerWidth &&
            tip.top >= 0 &&
            tip.bottom <= window.innerHeight,
        }
      })
      check(r.tracks, `${v.name}: step ${i + 1} spotlight tracks its target`)
      check(r.onScreen, `${v.name}: step ${i + 1} tooltip fully on screen`)
      await page.screenshot({ path: `${OUT}/tour-step${i + 1}-${v.name}.png` })
      if (i < 3) {
        await page.click('.herotour__next')
        await page.waitForTimeout(420)
      }
    }

    // The spotlight is a hole, not a cover: the control underneath stays
    // clickable. One dropped `pointer-events: none` regresses this and no
    // screenshot would show it. Generate is skipped — it is legitimately
    // disabled while the brief is empty.
    await page.click('.herotour__back')
    await page.waitForTimeout(300)
    await page.click('.herotour__back')
    await page.waitForTimeout(420)
    for (const t of ['hero-links', 'hero-files']) {
      const hit = await page.evaluate((sel) => {
        const r = document.querySelector(`[data-tour="${sel}"]`).getBoundingClientRect()
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return el?.closest(`[data-tour="${sel}"]`) !== null
      }, t)
      check(hit, `${v.name}: ${t} still clickable through the spotlight`)
    }

    // Finish, then prove it stays gone across a reload in the same profile.
    await page.click('.herotour__next')
    await page.waitForTimeout(300)
    await page.click('.herotour__next')
    await page.waitForTimeout(420)
    await page.click('.herotour__next')
    await page.waitForTimeout(420)
    check(
      (await page.$('.herotour__tip')) === null,
      `${v.name}: walkthrough closes on Start Creating`
    )
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1400)
    check(
      (await page.$('.herotour__tip')) === null,
      `${v.name}: walkthrough does not return after being completed`
    )
  } catch (e) {
    check(false, `${v.name}: walkthrough — ${e.message}`)
  }

  await ctx.close()
}

await browser.close()

if (failures.length) {
  console.error(`\n✗ ${failures.length} layout assertion(s) failed\n`)
  process.exit(1)
}
console.log('\n✓ all layout assertions hold\n')
