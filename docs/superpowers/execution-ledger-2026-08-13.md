# SDD ledger — plan: docs/superpowers/plans/2026-08-13-ui-ux-refinement.md

Spec: docs/superpowers/specs/2026-08-13-ui-ux-refinement-design.md
Branch: `ui-ux-refinement`
Base commit: `38ce341` (checkpoint of the user's in-flight work — the state the audit was run against)

---

## Setup rulings

**Ruling: work on branch `ui-ux-refinement` in the primary working directory rather than a
separate git worktree** — the user has VSCode and a dev server pointed at this directory, this
is a visual task whose output they will want to see live, and the uncommitted in-flight changes
that the entire plan was written against live here. Isolation is still satisfied: `main` carries
only the spec and plan commits. *Cost if wrong:* the user's working directory is on a feature
branch instead of main; `git checkout main` reverses it.

**Ruling: commit the ~19 uncommitted modified files unchanged as checkpoint `38ce341` before
starting** — the plan's every line-number reference and every audit finding describes that
working-tree state, not `f2fe79c`. Without the checkpoint the plan does not apply to anything.
*Cost if wrong:* an extra commit in history the user may want to squash.

**Note:** `src/components/Header.jsx` is modified in `38ce341`. That is the user's own in-flight
change (adding `onNavigateHome`), committed unchanged. The no-touch constraint binds everything
from `38ce341` forward.

---

## Pre-flight conflict scan

### Cross-task: shared files and interfaces

| Tasks | Produces → consumes | Finding |
|---|---|---|
| T1 → all | `check:tokens`, `shoot` npm scripts | OK. T1's assertions intentionally fail until T6/T9; documented in the plan. |
| T2 → T4,5,6,9,10,11 | `--text-*`, `--color-hover`, `--radius-2xl`, `--shadow-2xl`, `--transition-fast` | **CONFLICT** — see ruling PF-1 |
| T3 ↔ T8 | both edit `Footer.css` | OK. T3 deletes `.footer-v2__chat-fab`; T8 restyles other rules. Sequential, disjoint. |
| T3 ↔ T6 | T3 deletes `CollectionGrid`/`PopularSearches`; T6 rewrites `Home.jsx` | OK. Current `Home.jsx` imports neither. `SearchBar` is deleted by T6, not T3 — correctly assigned. |
| T4 → T6 | `<HeroPrompt value onChange onSubmit busy voiceSlot>`, ref → textarea | OK. T6 passes exactly these; `inputRef.current.focus()` resolves to the textarea. |
| T5 → T6 | `<VoiceButton onTranscript>` | OK on the interface. **CONFLICT** on CSS cascade — see ruling PF-2 |
| T4 ↔ T5 | `.heroprompt__pill` shared class | **CONFLICT** — see ruling PF-2 |
| T6 → T1 | DOM contract `.hero`, `.heroprompt__input`, `.heroprompt__submit` | OK. `page.fill` works on a textarea. `useSearch` exports `generate` and an `idle` status — both verified in source. |
| T6 → T1 | `document.querySelector('footer')` | OK. `Footer` renders `<footer className="footer-v2">`. |
| T9 → T10 | both edit `CanvasPanel.jsx` | OK. T9 deletes lines 180-190; T10 edits 52-178. T9's deletion is *below* T10's range, so T10's line numbers do not shift. Ordering is correct as written. |
| T10 → T11 | `onOpenCharacters` moves `CanvasPanel` → `PromptPanel` | OK but note: between T10 and T11 the character browser has no trigger. React ignores the now-unused props, so nothing crashes. Accepted — T11 immediately follows. |
| T7 ↔ T6 | `.card__title` scrim vs `.card` positioning | OK. Verified in source: `.card` is `position: relative`, `.card__title` is `position: absolute`, and `.card__media` is its *sibling* — so adding `position: relative` to `.card__media` does not change the title's containing block. `z-index: 1` is sufficient. |
| T12 → all | Header no-touch assertion | **CONFLICT** — see ruling PF-4 |

### Per-task: internal self-consistency

| Task | Finding |
|---|---|
| T1 | **CONFLICT** — see ruling PF-5 |
| T2 | Agrees with itself, except the display-heading question in PF-1. |
| T3 | Agrees. Deletion list matches the Step 1 verification loop exactly. |
| T4 | Agrees (the `useRefListState` stand-in was corrected before the plan was committed). |
| T5 | Agrees, modulo PF-2. |
| T6 | Agrees, modulo PF-1. Verified `useSearch` exposes `generate`, `setQuery`, `status`, `results`. |
| T7 | Agrees. Positioning verified in source. |
| T8 | Agrees. The one "find it with grep" step is a location hint, not a missing value. |
| T9 | Agrees. |
| T10 | **CONFLICT** — see ruling PF-3 |
| T11 | **CONFLICT** — see ruling PF-6 |
| T12 | Agrees, modulo PF-4. |

### Rulings

**PF-1 — display headings vs "no raw px font-size".** T2 comments that `--text-2xl` "clamps up
to 52px" but T6 writes `font-size: clamp(28px, 5.2vw, 52px)`, using neither the token nor T2's
stated 34px floor. The two tasks disagree, and both put raw px in a component stylesheet.
*Ruling:* T2 additionally defines `--text-display: clamp(28px, 5.2vw, 52px)` and
`--text-display-sm: clamp(26px, 4vw, 34px)` in `variables.css`; T6 uses those tokens and writes
no px. Fluid display type is a real need the fixed scale cannot express, and the constraint's
purpose is to stop 24 ad-hoc sizes, not to ban `clamp()`. *Cost if wrong:* two tokens used once
each; inlining them back is a two-line change.

**PF-2 — `.voice` overrides depend on CSS import order.** `VoiceButton.css` overrides
`.heroprompt__pill` at equal specificity, so it only wins because `Home.jsx` imports `HeroPrompt`
before `VoiceButton`. That is invisible and breaks on reorder. *Ruling:* T5 scopes its overrides
as `.heroprompt__pill.voice` (specificity 0-2-0), making order irrelevant. *Cost if wrong:* none
identified; strictly more robust.

**PF-3 — T10's 40px hit-area `::before` is not centred.** The rule sets `position: absolute;
width: 40px; height: 40px` with no offsets, so the pseudo-element lands at the content-box origin
rather than centred on the 32px button — the hit area would be off by 4px in each direction.
*Ruling:* T10 adds `top: 50%; left: 50%; transform: translate(-50%, -50%)`. *Cost if wrong:*
none; this is a straightforward bug in my own plan text.

**PF-4 — T12's Header assertion uses the wrong baseline.** It diffs `e59f011..HEAD`, but
`Header.jsx` was modified by the user's own in-flight work, which is committed in `38ce341`. The
check would report a violation that is not one. *Ruling:* T12 Step 2 diffs `38ce341..HEAD`.
*Cost if wrong:* a false pass would let a header edit through; mitigated because the constraint
is also in every dispatch's global-constraints block.

**PF-5 — T1's `shoot.mjs` throws before writing mobile screenshots.** The studio-navigation block
will throw on the "before" run because `.heroprompt__input` does not exist, aborting the loop at
the first viewport. The plan offers a try/catch as a conditional remedy in prose. *Ruling:* the
try/catch is mandatory in the script as first written, not conditional. A verification script
that cannot survive its own red state is not a verification script. *Cost if wrong:* none.

**PF-6 — T11 says to drop `Sparkles` from the imports, but still uses it.** The instruction
"drop `Sparkles` from the header uses it no longer needs" is garbled, and the Generate button in
the same task's markup renders `<Sparkles size={16} />`. *Ruling:* keep `Sparkles` imported;
remove only the `.ppanel__ai-tag` "AI POWERED" badge that used to also use it. *Cost if wrong:*
a build error, caught immediately by `npm run build`.

**PF-7 — dictation replaces rather than appends.** `VoiceButton` calls
`onTranscript(fullTranscript)` and T6 wires it to `search.setQuery`, so dictating over typed text
overwrites it. *Ruling:* accept as designed for now — dictation is a from-scratch input in
practice, and append-semantics needs a decision about separators that the spec does not make.
Noted so the final review can revisit. *Cost if wrong:* a user who types then dictates loses
their typing; a one-line change to append.

---

## Task progress

Task 1: complete (commits 38ce341..5d334d8, review clean — spec ✅, quality approved, 0 Critical/Important)
  Both scripts verified failing correctly: check:tokens exits 1 with exactly the 7 tokens
  (no --fill-from/--fill-to false positives); shoot exits 1 with 9 named assertions across
  3 viewports, screenshots written for all. PF-5 try/catch ruling applied and verified.
  Note: two vite dev servers are running against this directory (5173 and 5174). Not caused
  by this task. Port 5173 is the live one the harness uses.

**Ruling PF-8 (made during Task 2) — revert `Header.css` entirely; exclude it from the
font-size constraint.** My Task 2 dispatch permitted font-size-only edits to `Header.css` so the
"no raw px" grep could pass. That ruling was too permissive. The file carried a responsive type
ramp (`.header__menu` 15px → 17px at ≥1024px; `.header__signin` 14 → 15 → 17) and mapping every
value onto the 8-step scale collapsed it — `.header__menu` is now 16px at every breakpoint. The
rendered header changed, which is what "don't touch the header" actually protects. The user's
instruction is the binding authority and outranks my own constraint. *Ruling:* revert
`src/components/Header.css` to its `38ce341` state, and carry a documented exclusion for it in
the font-size check rather than editing it. *Cost if wrong:* six raw px font-sizes survive in one
file, and the grep in Task 12 needs a documented `grep -v Header.css`.

**Plan-ordering note (no action).** Task 2 spent effort mapping font sizes in `HeroBanner.css`
and `AboutSection.css`, which Task 3 deletes outright. Task 3 should have preceded Task 2. Costs
nothing now — the files are about to go — but it is the kind of ordering defect worth catching in
a future pre-flight scan.
Task 2: fix round 1/5 (1 addressed, 0 open — Header.css reverted per PF-8; commits e53e174..7e234dc)
Task 2: complete (commits 5d334d8..7e234dc, review clean — spec ✅, quality approved)
  check:tokens exits 0 (84 properties resolve). Font-size grep clean except the six
  documented Header.css exemptions. Build succeeds.
Task 2: minor (deferred): SearchBar.css .search__input 15→16px ramp flattened — moot, file is
  deleted in Task 6, and 16px is the iOS no-zoom threshold.
Task 2: minor (deferred): four static sibling-size collisions of 1-2px in ImageSearchModal.css,
  MobileMenu.css, Footer.css, CharactersPanel.css. Different UI roles, no hierarchy carried.

**Ruling PF-9 (Task 3) — `CharactersPanel` IS orphaned; the plan had the wrong path.** The plan
listed it at `src/components/CharactersPanel.jsx`; it actually lives at
`src/studio/components/CharactersPanel.jsx`. The implementer found nothing at the plan's path,
found the real file, and reported it as "actively used by the Creative Studio" — that claim is
false. Verified: `grep -rn "CharactersPanel" src` returns only the file's own CSS self-import and
its own `export default` line. `CreativeStudio.jsx` imports CharacterBrowser, CanvasPanel,
PromptPanel, DownloadDialog and GenerationModal — not CharactersPanel. *Ruling:* delete it at the
correct path. *Cost if wrong:* a build error naming the missing import, caught by `npm run build`
in the same round.

**Ruling PF-10 (Task 3) — delete the dead `hero` export from `src/data/collections.js`.** It
exports a `hero` object referencing `/images/hero/hero-{960,1600,2400}.webp`, imported by
nothing (the deleted `HeroBanner` was its only consumer). It is also the last referrer to those
image files, so leaving it makes the task's own "is anything still referencing the hero images"
check permanently answer yes. *Ruling:* delete the export; still leave the image files on disk as
the plan says. *Cost if wrong:* a build error if something imports it — verified nothing does.
Task 3: fix round 1/5 (2 addressed, 0 open — PF-9 CharactersPanel deleted at correct path,
  PF-10 dead hero export removed; commits 461793c..d09e1dd)
Task 3: complete (commits 7e234dc..d09e1dd, review clean — spec ✅, quality approved)
  6 orphan pairs + popularSearches.js + dead hero export removed. Duplicate FAB gone,
  MessageSquare import removed, social icons on currentColor, preload gone from index.html.
  Reviewer swept both directions (over-deletion and under-deletion) and found no broken refs.
Task 3: minor (deferred): src/components/CollectionCard.css:21 comment references the deleted
  HeroBanner.css. Cosmetic, outside Task 3's file list.

**Ruling PF-11 (Task 4) — every control in the hero prompt box is 44px, at all breakpoints.**
The reviewer found the pills and submit at 40px with visible text labels, which violates the
plan's own "touch targets ≥44px / icon-only ≥40px" constraint; it also surfaced a genuine
conflict between the spec (§3 mobile: "retaining 44px touch targets") and the plan/brief (40px
mobile). *Ruling:* 44px everywhere in this component, mobile included. It honours both documents,
costs 4px in a box with a 230px min-height, and removes the ambiguity rather than picking a side.
This binds Task 5's `VoiceButton` too, which reuses `.heroprompt__pill`. *Cost if wrong:* the
control row is 4px taller than designed; trivially reversible.

**Ruling PF-12 (Task 4) — reference ids get a monotonic counter, not `array.length`.** My brief
generated ids as `${type}-${list.length}-${name}`. The reviewer produced a sound repro: add a.jpg,
add b.jpg, remove a.jpg, re-add b.jpg → the new entry computes the same id as the existing one,
so two list items share a React `key` and removal can hit the wrong chip. *Ruling:* use a `useRef`
counter that only increments. *Cost if wrong:* none identified; strictly correct.
Task 4: fix round 1/5 (4 addressed, 1 new open — WCAG 2.5.3 Label in Name introduced by the fix:
  aria-labels I specified do not contain the visible text; commits e4aa0e8..9229ffc)
Task 4: minor (deferred): the 44px hit area on .heroprompt__ref-remove extends ~10px past its
  24px visual box, leaving only a few px clearance from an adjacent chip. No overlap today.
Task 4: fix round 2/5 (1 addressed, 0 open — Label in Name; commits 9229ffc..5231bf5)
Task 4: complete (commits d09e1dd..5231bf5, review clean — spec ✅, quality approved after 2 rounds)
  3 files created. forwardRef→textarea and the .heroprompt__input/.heroprompt__submit class
  contract verified (Task 6 and shoot.mjs both depend on them). 44px targets throughout per PF-11.
Task 5: minor (deferred): VoiceButton cleanup does not null recognitionRef.current. Harmless.
Task 5: minor (deferred): microphone permission denial resets state correctly but surfaces no
  explanation to the user. No error UI is specified anywhere in the spec.
Task 5: fix round 1/5 (1 addressed, 0 open — InvalidStateError guard; commits 680f9e3..5e79434)
Task 5: complete (commits 5231bf5..5e79434, review clean — spec ✅, quality approved)
  PF-2 compound selector and PF-11 44px both applied. Recogniser lifecycle, stale-closure ref
  and hooks-order all verified sound. onend/onerror are now the primary route to idle.

**Ruling PF-13 (Task 6) — delete `ImageSearchModal`.** The reviewer found it permanently
unreachable: nothing calls `setImageSearchOpen(true)`. It traced the cause to before this plan —
the old `Home.jsx` passed `onOpenImageSearch` to `SearchBar`, but `SearchBar` never destructured
or called it, so the modal was already dead at `38ce341`. The new hero has no reverse-image-search
entry point and the spec specifies none ("Upload image" in the prompt box is a *reference* upload,
a different feature). *Ruling:* delete it, consistent with the PF-9/PF-10 precedent of sweeping
orphans found during a rewrite. *Cost if wrong:* a built reverse-image-search UI is removed from
the tree; recoverable from git if the feature is wanted, and it would need a trigger designed for
it either way.

**Ruling PF-14 (Task 6) — render the `error` status and wire up `retry()`.** `useSearch` has five
statuses; the page branches on three. `error` is reachable whenever the query contains "fail" —
an ordinary word ("family after a failed harvest"), and per the README a deliberate demo trigger.
Previously that left the user where they stood; Task 6's new reveal effect now smooth-scrolls them
down to an entirely empty section. `useSearch` already exports `retry()`, consumed nowhere.
*Ruling:* add an error branch with a retry button. The spec does not specify error UI, but the
task actively made this path worse, and the fix is small and uses an API that already exists.
*Cost if wrong:* a small amount of UI the spec did not ask for.

**Note (no action) — the plan overstated a bug it claimed to fix.** The commit message for
`a6357e1` says it fixes "a re-created interval in the loading state". The reviewer checked the base
code: the dependency array was `[loadingTexts.length]`, a primitive that stays `Object.is`-equal
across renders, so the effect never re-ran. The new code is still correct and cleaner; the claim
was simply wrong. Recorded because the commit message is now inaccurate in the history.
Task 6: fix round 1/5 (5 addressed, 1 new open; commits a6357e1..655b098)
  Addressed: monospace textarea (fixed at the globals.css reset as `input, textarea`),
  .hero__suggestion 44px, mobile menu closes on select, ImageSearchModal deleted (PF-13),
  error branch + retry() wired (PF-14). All six home assertions still pass.
  NEW OPEN (Important): useFocusTrap's cleanup unconditionally calls previouslyFocused.focus(),
  stealing focus from the input that useSuggestion just focused. Live-reproduced: activeElement
  ends up on .header__menu, not the textarea. Cause is src/hooks/useFocusTrap.js:51. Fix is to
  make the restore conditional on focus not having escaped the overlay deliberately.
Task 6: fix round 2 dispatch DIED — API session limit (resets 8pm Asia/Calcutta), no commit made.
  HEAD still 655b098, working tree clean, useFocusTrap.js unmodified. Round 2 must be re-run.
Task 6: minor (deferred): the error branch reuses .search-results__empty for semantically
  different content.
Task 6: minor (deferred): useFocusTrap's unconditional restore is a general hazard for any caller
  that closes a trapped overlay then focuses elsewhere in the same tick.
Task 6: fix round 2/5 (1 addressed, 0 open — useFocusTrap conditional restore, both focus paths
  verified empirically with a Playwright probe; commits 655b098..e5309c3)
Task 6: complete (commits 5e79434..e5309c3, review clean — quality approved after 2 rounds)
  All six home layout assertions pass at 1440x900, 1366x768, 390x844. Hero measured at
  824/692/780px against its budget. Footer below the fold at every viewport.

**Ruling PF-15 — batch Tasks 7 and 8 into one dispatch.** Both are small single-file CSS edits
verified the same way (a screenshot plus the standard gates), and neither needs its own judgment
or review surface. The session hit an API rate limit during Task 6, killing one dispatch outright,
so cutting a whole implement-review cycle reduces the chance of losing work mid-plan. *Cost if
wrong:* the two changes share a review surface, so a reviewer weighing one could be distracted by
the other; both are small enough that this is unlikely to hide anything.

**Ruling PF-16 (Task 8) — fix the footer's sub-44px touch targets here rather than deferring.**
The implementer found `.footer-v2__list a` at ~19px tall and `.footer-v2__social-btn` at 38x38,
both under the ≥44px global constraint, and correctly noted both pre-date this plan. *Ruling:*
fix them in Task 8. "Pre-existing" is not an exemption when the task at hand is *the footer task*,
touch targets are a stated global constraint, and the change just made those links denser by
two-upping them on mobile. *Cost if wrong:* the footer link list gets taller, which works against
the compaction goal — mitigated by using padding on the anchors and reducing the list `gap` to
compensate.

**Correction — my Task 8 brief overstated the problem.** It claimed the footer was "~85% of the
mobile page". The implementer measured it directly: 59.0% before, 54.1% after. The compaction is
real but smaller than I asserted. Recorded because the figure appears in both the spec and the
plan and is wrong in both.
Tasks 7+8: fix round 1/5 (2 addressed, 1 new open — .footer-v2__legal a has the same sub-44px
  issue and was not named in PF-16; commits ff0e1c2..b44a38a)
  .footer-v2__list a now 44px (13 links), .footer-v2__social-btn 44x44 (3). Footer share of the
  mobile page 56.9% — up from 54.1% but still under the 59.0% pre-compaction baseline, so the
  compaction holds. Gap could not fully absorb the +25px per anchor (original gap was only 12px),
  so footer height rose ~123px; reported rather than hidden.

**Ruling PF-17 — extend PF-16 to `.footer-v2__legal a`.** The implementer found the bottom-bar
Terms/Privacy/FAQs links have the same sub-44px problem and correctly did not act on a selector my
ruling did not name. *Ruling:* fix it, same treatment. It is the same defect class in the same
file in the same task, and leaving one of three link groups short would be an arbitrary line.
*Cost if wrong:* a few more px of footer height on an already-measured budget.
Tasks 7+8: fix round 2/5 (1 addressed, 0 open — PF-17 legal links; commit b44a38a..6bd49b8)
  Measured directly: all three legal links exactly 44px tall, 27.3px apart, pipe midpoints
  1859.1 vs link midpoints 1859.2 (aligned within 0.1px). Footer share 57.4%, under the 59.0%
  pre-compaction baseline. check:tokens 83/83, build clean, six home assertions pass.
Tasks 7+8: complete (commits e5309c3..6bd49b8)

**Ruling PF-18 — round 2 was completed in the controller session, not by a subagent, and its
scoped re-review is folded into the final whole-branch review.** The implementer dispatch was
stopped by infrastructure failure with the edit made but uncommitted, and a re-dispatch to finish
it was declined by the user. The remaining work was verification and a commit, not authorship.
I measured every claim empirically (heights, gaps, pipe alignment, footer share) rather than
asserting it. *Cost if wrong:* this one small diff reaches the final review without an
intermediate scoped re-review; it is 3 CSS declarations in a file the final reviewer sees anyway.

**Deferred inventory request (unfulfilled).** I had asked for a complete sweep of Footer.css for
remaining sub-44px interactive elements and hardcoded colour literals (`#d1d5db`, `#4b5563`,
`#ffffff` are visible around the legal row alone; an early audit counted 33 hex literals in this
file). The dispatch that would have produced it was cancelled. The final whole-branch review
should produce this inventory.

**Ruling PF-19 (Task 9) — `<Footer />` removed from `StudioPage.jsx`. USER-VISIBLE PRODUCT CHANGE.**
The implementer found the height budget alone could not satisfy the gate: the footer's own ~500px
pushes the page past one viewport regardless of how correct `--studio-h` is. My plan's Task 9
acceptance explicitly demanded "the studio shows no page scrollbar", which a footer makes
impossible. *Ruling:* accept the removal. An editor is an app surface, not a marketing page, and
full-bleed editors conventionally carry no footer. *Cost if wrong:* the studio page loses its
route to Terms/Privacy/Contact; the header's Pricing and Sign In remain. Reversible by restoring
the element and relaxing the assertion to "the studio grid fits above the fold" instead of
"the page does not scroll". **Flag to the user — this is a design decision, not a bug fix.**

**Ruling PF-20 (Task 9) — pink purged from three files outside the task's list.** The constraint
was "no pink anywhere in src", but `rgba(224,30,90,…)` also lived in `EditToolbar.css`,
`GenerationModal.css` and two more spots in `PromptPanel.css`. The implementer recoloured them via
two new tokens (`--shadow-ring`, `--shadow-glow`) rather than restructuring, leaving the Character
button itself for Task 10. *Ruling:* correct call. *Cost if wrong:* two tokens exist that only a
few rules consume.

**Ruling PF-21 — batch Tasks 10 and 11 into one dispatch.** Task 10 removes the Character button
from the canvas toolbar; Task 11 adds it to the prompt panel. Run separately, the branch passes
through a state where the Characters feature is unreachable from the UI. They are one coherent
change split across two files. *Cost if wrong:* a larger single review surface.
Task 9: complete (commit 6bd49b8..68a1fe1) — ALL TEN assertions pass for the first time.
  Height budget corrected, scrollIntoView deleted, metadata moved to the bar, pink purged.
  Required PF-19 (Footer removed from StudioPage) and PF-20 (pink in 3 extra files).
Tasks 10+11: complete (commits 68a1fe1..4b311d0, all ten assertions still pass)
  Toolbar in three hairline zones, one uniform 32px button with a centred 40px hit area.
  Character relocated to the prompt panel. All six suggestion chips render (was 3).
  Empty References is one line. Generate/Apply pinned. Implementer caught that the brief's
  ::before omitted centering — same defect I fixed in HeroPrompt and then copied into this brief.
Tasks 10+11: minor (deferred): pre-existing hardcoded hex in .ppanel__adder, .ppanel__refs,
  .ppanel__ref, .ppanel__generate, .ppanel__apply. None pink, none new.
Task 12: complete (commit 4b311d0..81382e3) — README rewritten against verified code.
  ALL TEN assertions pass. check:tokens 86/86. Build clean. Both greps silent.
  HEADER CONSTRAINT VERIFIED: git diff 38ce341..HEAD -- Header.jsx Header.css shows Header.jsx
  absent entirely and Header.css +3 lines, confirmed by full read to be only the exemption comment.
Task 12: note — my brief named the wrong base commit (e59f011) for the header check; the
  implementer correctly used 38ce341, the actual pre-Task-1 checkpoint. From e59f011 the diff is
  NOT clean because it includes the user's own pre-existing Header.jsx change (onNavigateHome),
  which was captured in the checkpoint commit and is not this plan's work.
Task 12: minor (deferred): public/images/hero/*.webp are dead assets, orphaned since HeroBanner
  was deleted. Deliberately left on disk.

FINAL WHOLE-BRANCH REVIEW (opus, 38ce341..81382e3, 21 commits):
  HEADER CONSTRAINT PASSES — Header.jsx absent from the diff, Header.css +3 comment lines only,
  confirmed by reading the full diff rather than trusting the gate.
  Verdict: fit to merge after two findings, ~15 lines, both with a correct implementation already
  written elsewhere in the branch to copy.
  BLOCKER 1 (Important): CreativeStudio.jsx:56 still builds ref keys from array.length — the exact
    defect PF-12 fixed in HeroPrompt. Worse here: removeRef filters by key, so two colliding
    entries mean clicking either X deletes BOTH references.
  BLOCKER 2 (Important): PromptPanel.css .ppanel__add is 24x24 with no hit-area expansion. NEW in
    this branch (Task 11). Its sibling .cvpanel__icon got a centred 40px ::before in the same
    batched dispatch. It is the only touch entry point to the character browser. PF-21's stated
    cost materialised.
  Also: 22 hex literals across PromptPanel/Home/Footer are Tailwind slate (hue 210-215deg), not
    grey. Deferred during execution as "none pink, none new" — but the spec's mandate was "never
    hue" and names both pink AND blue as drift. Reviewer: fix before merge.
  Token audit: the 8-step scale is genuinely used across 7 of 8 steps (--text-sm 38 uses,
    --text-base 23, --text-md 16). --text-2xl has 0 uses, superseded by PF-1's --text-display-sm.
    --color-hover is byte-identical to --color-surface-secondary.
  Rulings: 19 of 21 endorsed unreservedly. Pushback on PF-21 (batching did hide blocker 2) and
    PF-7 (reviewer says leave dictation as replace-not-append; it is a product question).
