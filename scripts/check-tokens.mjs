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
  '--alwayzz-bg', // src/components/AnimatedBackground/AnimatedBackground.jsx:47
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
