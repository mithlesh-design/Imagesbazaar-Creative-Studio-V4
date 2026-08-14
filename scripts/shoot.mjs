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
  // Wrapped so a missing/renamed selector still lets every viewport finish and
  // still produce screenshots — a thrown exception here must not abort the run.
  // The hero lands in Search mode, so the Generate field is not mounted until
  // the toggle is switched. Assert the switch works, then switch back — the
  // studio is reached below via the default path a real visitor takes.
  try {
    await page.click('#mode-generate')
    await page.waitForSelector('.heroprompt__input', { timeout: 4000 })
    check(true, `${v.name}: toggle reveals the generate field`)

    // Generate is the TALLER panel, so the fit check above — which runs in the
    // default search mode — does not cover it. Measure content against the box
    // rather than the fold: the hero has a min-height, so an overflowing panel
    // still reports a bottom edge at the fold while spilling inside.
    const genHeadroom = await page.evaluate(() => {
      const h = document.querySelector('.hero')
      const kids = [...h.children]
      const s = getComputedStyle(h)
      const content =
        kids.reduce((a, el) => a + el.getBoundingClientRect().height, 0) +
        parseFloat(s.rowGap) * (kids.length - 1) +
        parseFloat(s.paddingTop) +
        parseFloat(s.paddingBottom)
      return Math.round(h.clientHeight - content)
    })
    check(genHeadroom >= 0, `${v.name}: generate panel fits the hero (headroom ${genHeadroom}px)`)

    await page.click('#mode-search')
    await page.waitForSelector('.searchpanel__input', { timeout: 4000 })
    check(true, `${v.name}: toggle returns to search`)
  } catch (e) {
    check(false, `${v.name}: mode toggle — ${e.message}`)
  }

  try {
    await page.fill('.searchpanel__input', 'family celebrating diwali')
    await page.click('.searchpanel__submit')
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
  } catch (e) {
    check(false, `${v.name}: studio reachable — ${e.message}`)
  }

  await ctx.close()
}

await browser.close()

if (failures.length) {
  console.error(`\n✗ ${failures.length} layout assertion(s) failed\n`)
  process.exit(1)
}
console.log('\n✓ all layout assertions hold\n')
