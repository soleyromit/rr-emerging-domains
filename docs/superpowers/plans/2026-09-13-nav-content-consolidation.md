# Navigation, Color-Semantics & Domain-Understanding Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut `apps/ecosystem`'s global nav from 15 items/7 groups to 10 items/6 groups (revised from an original "9 items" target — Phase 3's Task 3.2 shipped a real `/archetypes` route after this plan's arithmetic was written, and Task 1.6 correctly kept it reachable rather than delete a live feature to hit a stale number) and its domain tabs from 7 to 6 (revised from an original "to 5" target — see the note on Task 1.5 below) by merging pages that render the same underlying data with no distinguishing perspective; fix the 9 color/badge collisions where one visual signal carries two meanings; and add the three real content gaps a live domain-planning meeting exposed (domain adjacency, a university-archetypes scaffold, cross-domain journey comparison) — without fabricating any content the evidence doesn't support.

**Architecture:** Three independent phases, each safely committable and reviewable on its own — nothing in Phase 2 or 3 depends on Phase 1 landing first, so they can run in any order or in parallel worktrees if desired. Phase 1 merges routes and deletes the ones it absorbs, replacing every internal link to a deleted route. Phase 2 is a pure content-and-prop change inside existing badge/banner components — no new components, only corrected variant choices and, where genuinely needed, new named severity states. Phase 3 adds one optional YAML field, one new content-schema file (currently empty of real entries — this plan does **not** invent archetype data), and one new page composed entirely from an existing, already-cross-domain-aware library function.

**Tech Stack:** Next.js App Router (`apps/ecosystem`), `@astryxdesign/core` (Table/Badge/Banner/Section), YAML content under `content/`, `lib/content.ts` as the sole content-reading layer.

**Spec:** This plan's own header section below stands in for a separate spec file — the design was produced and reviewed interactively across three prior artifacts this session (badge-color audit, IA/link-graph audit, nav-consolidation proposal) plus one real planning-meeting transcript (Granola, "Exact pharmacy domain — competitive analysis, accreditation gaps, and product roadmap," 2026-09-12). Every task below cites which of those four sources justifies it. No task exists that isn't traced to one.

## Global Constraints

- Every claim rendered in `content/` must trace to a real source per `content/ARCHITECTURE.md`'s citation rule — Phase 3 tasks that touch content must cite the 2026-09-12 meeting transcript by name and date, exactly as this plan does, not invent detail beyond what the transcript actually said.
- Run `python3 scripts/check_content_density.py` from repo root after any `content/` change; the baseline going in is **"1003 WARN, 31 FAIL"** — any new FAIL needs an `ALLOWLIST` entry with a dated reason, not a silent increase. Read the summary line itself (`"N WARN, M FAIL"`), never `grep -c "^FAIL"` — the script's trailing legend paragraph starts with the literal word "FAIL" and will inflate a naive count.
- After any `apps/ecosystem` change: `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build` must all pass clean. This repo's established verification bar (per `apps/ecosystem/CLAUDE.md`, `UI-DENSITY-PATTERNS.md`, and this whole session's practice) is browser verification before "done," not a unit-test suite — every task below ends with a live check in a running `npm run dev` instance, not a mocked render.
- Never delete a route without first grep-confirming every internal `<Link href="...">` that pointed at it, and updating each one — a merge that leaves a dangling link recreates the exact "click and land somewhere your click didn't ask for" defect this plan exists to fix (IA audit finding #4).
- Do not fabricate content. Phase 3's university-archetypes work builds the schema and an honest empty state; it does not invent archetype names, criteria, or counts that no real research has produced yet.

---

## Phase 1 — Navigation & Page Consolidation

*Source: `Navigation Consolidation Plan` artifact (published this session), itself built on the `Navigation Perspective Audit` artifact's findings.*

### Task 1.1: Merge PRISM capability map + System vocabulary into one tabbed "Product" page

**Files:**
- Create: `app/product/page.tsx` (replaces `app/prism/page.tsx` and `app/prism/vocabulary/page.tsx`)
- Modify: `apps/ecosystem/components/*nav*` sidebar config (find via `grep -rn "PRISM capability map" apps/ecosystem/components apps/ecosystem/app` — the sidebar's data source) — remove the two old entries, add one `Product` entry pointing at `/product`
- Modify: every `<Link href="/prism"` or `href="/prism/vocabulary"` site-wide (grep first, list every hit before touching any)
- Delete: `app/prism/page.tsx`, `app/prism/vocabulary/page.tsx` once every reference is repointed

**Interfaces:**
- Consumes: whatever `getCapabilityMap()` and the vocabulary content loader already return (read `app/prism/page.tsx` and `app/prism/vocabulary/page.tsx` as they exist today — reuse their rendering bodies verbatim inside two tab panels, do not rewrite their content logic)
- Produces: route `/product` with two tabs, `Capability map` (default) and `Vocabulary`, using this app's existing tab pattern (the same one the domain hub already uses for its 5-7 tabs — follow `app/domains/[slug]/page.tsx`'s tab wiring exactly, do not invent a new tab mechanism)

- [ ] **Step 1:** `grep -rn 'href="/prism' apps/ecosystem/app apps/ecosystem/components` and list every hit in the task's working notes before changing anything.
- [ ] **Step 2:** Create `app/product/page.tsx`; move `app/prism/page.tsx`'s JSX into a `CapabilityMapTab` component and `app/prism/vocabulary/page.tsx`'s JSX into a `VocabularyTab` component, both rendered inside the shared tab shell.
- [ ] **Step 3:** Update the sidebar nav config: delete the `PRISM capability map` and `System vocabulary` rows, add one `Product` row targeting `/product`.
- [ ] **Step 4:** Update every internal link found in Step 1 to point at `/product` (add `?tab=vocabulary` or the app's existing tab-URL convention if one exists — check `app/domains/[slug]/page.tsx` for how it encodes the active tab in the URL, and match it).
- [ ] **Step 5:** Delete `app/prism/page.tsx` and `app/prism/vocabulary/page.tsx`.
- [ ] **Step 6:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 7:** In a running `npm run dev`, visit `/product`, confirm both tabs render their full original content, confirm `/prism` and `/prism/vocabulary` now 404 (or redirect — implementer's call, but must not silently 200 with stale content), and click every link found in Step 1 from its real page of origin to confirm it lands on `/product` correctly.
- [ ] **Step 8:** Commit.

### Task 1.2: Merge Competitor matrix + Feature map + every domain's Competitors tab into one "Competitive landscape" page with a pivot toggle

**Files:**
- Create: `app/competitive-landscape/page.tsx`
- Create: `components/competitive-landscape-view.tsx` (the pivot-toggle wrapper — by competitor / by pillar / by domain)
- Modify: `app/domains/[slug]/competitors/page.tsx` — replace its full matrix render with a summary card + `<Link href="/competitive-landscape?domain={slug}">View {domain}'s competitive landscape →</Link>`
- Modify: domain tab config (the 7-tab list) — remove `Competitors` as a full tab route if Task 1.2 and the Phase-1 domain-tab reduction (Task 1.5) land together; otherwise leave the tab, just gut its body per the line above
- Delete: `app/competitors/page.tsx`, `app/feature-map/page.tsx` once repointed
- Modify: `next.config.ts` — add `{ source: "/competitors", destination: "/competitive-landscape", permanent: true }` and `{ source: "/feature-map", destination: "/competitive-landscape/by-pillar", permanent: true }`, following this file's own established "IA consolidation" redirect convention (dated comment, 3 existing entries from the 2026-08-27 `/lenses`/`/accreditation`/`/personas` consolidation — Task 1.1's review found and fixed a missed instance of this exact convention, don't repeat that miss)
- Read first, do not modify: `components/feature-teardown-matrix.tsx`, `components/comparison-matrix.tsx` (the shared matrix machinery every one of these three pages already calls — confirmed identical by the IA audit; this task changes *routing*, not the matrix component itself)

**Interfaces:**
- Consumes: `listFeatureMaps()` (pillar pivot) and `listCompetitors()` (competitor pivot) from `lib/content.ts` — both already exist and already feed the two pages being merged; no new data function needed
- Produces: `/competitive-landscape` with the pivot as a real route segment, **not** a query param — Task 1.1's implementer found and confirmed this app's real tab/pivot convention is route-based (`app/domains/[slug]/layout.tsx` + `components/domain-hub-tabs.tsx`, `TabList` + `router.push` over real sub-routes, e.g. `app/product/layout.tsx` + `components/product-tabs.tsx` + a `vocabulary/` sub-route from Task 1.1's own commit `e6bdc22`), so mirror that exactly: `/competitive-landscape` (by-competitor, default) and `/competitive-landscape/by-pillar` as sub-routes, not `?view=`. `domain` (optional) stays a query-param *filter* layered on top of whichever route is active, since it's an orthogonal narrowing, not a mutually-exclusive view — reuse whatever domain-filter logic `app/domains/[slug]/competitors/page.tsx` already applies today.

- [ ] **Step 1:** `grep -rn 'href="/competitors\|href="/feature-map' apps/ecosystem/app apps/ecosystem/components` and list every hit.
- [ ] **Step 2:** Read `app/competitors/page.tsx`, `app/feature-map/page.tsx`, and `app/domains/[slug]/competitors/page.tsx` in full to confirm they really do call the same underlying matrix component with only different axis/filter arguments (the IA audit already found this from source, but re-confirm the exact call signatures before merging).
- [ ] **Step 3:** Build the pivot as real route segments per the Interfaces note above (mirroring `app/product/layout.tsx` + `components/product-tabs.tsx` from Task 1.1, commit `e6bdc22`) — `app/competitive-landscape/layout.tsx` + a tab component + `app/competitive-landscape/by-pillar/page.tsx`, not a client-side `?view=` toggle. `domain` stays a `?domain=` query param read the normal Next.js way (searchParams) inside whichever route is active.
- [ ] **Step 4:** Create `app/competitive-landscape/page.tsx` wiring the above, defaulting to `view=competitor` with no domain filter (matches today's `/competitors` default).
- [ ] **Step 5:** Update `app/domains/[slug]/competitors/page.tsx`: strip the full matrix render, add a short summary (reuse this domain's existing threat-level competitor list at the top of the page — keep that part, it's genuinely domain-specific and not duplicated elsewhere) plus the link to `/competitive-landscape/by-pillar?domain={slug}`.
- [ ] **Step 6:** Update every link found in Step 1 to the new URL shape.
- [ ] **Step 7:** Update sidebar nav: delete `Feature map` and `Competitor matrix`, add one `Competitive landscape` row.
- [ ] **Step 8:** Delete `app/competitors/page.tsx` and `app/feature-map/page.tsx`.
- [ ] **Step 9:** Add the two redirect entries to `next.config.ts` per the Files note above.
- [ ] **Step 10:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 11:** In `npm run dev`: confirm `/competitive-landscape` in both `view` states matches the old two pages' content exactly; confirm every domain's Competitors tab now shows the summary + working link; confirm the link lands pre-filtered to the right domain and pivot; confirm `/competitors` and `/feature-map` redirect (not 404).
- [ ] **Step 12:** Commit.

### Task 1.3: Merge Crosswalk + Vocabulary glossary into one "Standards & glossary" page

**Files:**
- Create: `app/standards/layout.tsx` + `app/standards/page.tsx` (Coverage map, default route) + `app/standards/glossary/page.tsx` (replaces `app/crosswalk/page.tsx` and `app/synthesis/vocabulary/page.tsx`) — Task 1.1's implementer (commit `e6bdc22`) confirmed this app's real tab convention is route-based (`layout.tsx` + a tab-bar component + real sub-routes, `TabList`/`router.push`, not a client-side query-param toggle or same-file tab components) — mirror `app/product/layout.tsx` + `components/product-tabs.tsx` exactly, don't reintroduce the query-param/same-file pattern this plan originally (incorrectly) described.
- Modify: every `<Link href="/crosswalk"` or `href="/synthesis/vocabulary"` site-wide
- Modify: `next.config.ts` — add `{ source: "/crosswalk", destination: "/standards", permanent: true }` and `{ source: "/synthesis/vocabulary", destination: "/standards/glossary", permanent: true }`, following the same convention Task 1.1's review fixed a missed instance of
- Delete: `app/crosswalk/page.tsx`, `app/synthesis/vocabulary/page.tsx` once repointed

**Interfaces:**
- Consumes: `listStandardsCrosswalkDomains()` + `getStandardsCrosswalkForDomain()` (Coverage-map route) and whatever `app/synthesis/vocabulary/page.tsx` reads today (Glossary route) — reuse both bodies verbatim inside the two routes, same pattern as Task 1.1
- Produces: `/standards` (Coverage map, default) and `/standards/glossary` — rename the second route's label from "Vocabulary" to "Glossary" everywhere it appears in copy, closing the System-vocabulary/Vocabulary-glossary name collision noted earlier this session

- [ ] **Step 1:** `grep -rn 'href="/crosswalk\|href="/synthesis/vocabulary' apps/ecosystem/app apps/ecosystem/components` and list every hit — pay special attention to `components/crosswalk-view.tsx`'s own per-row links (`:167`, `:175` per the IA audit) into `/domains/{slug}/standards` and `/domains/{slug}/dissect`, which must keep working unchanged since those are the pairing the audit found already "earns its hop."
- [ ] **Step 2:** Create `app/standards/layout.tsx` (tab bar) + `app/standards/page.tsx` + `app/standards/glossary/page.tsx`; move the two source pages' JSX in as each route's body, matching Task 1.1's real structure.
- [ ] **Step 3:** Update sidebar nav: delete `Crosswalk` and `Vocabulary glossary`, add one `Standards & glossary` row (keep it filed under the same group as `Competitive landscape` and `Go-to-market` — see Task 1.6).
- [ ] **Step 4:** Update every link found in Step 1 (except the domain-hub-bound ones inside `crosswalk-view.tsx`, which move as-is into the new page).
- [ ] **Step 5:** Delete `app/crosswalk/page.tsx` and `app/synthesis/vocabulary/page.tsx`.
- [ ] **Step 6:** Add the two redirect entries to `next.config.ts` per the Files note above.
- [ ] **Step 7:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 8:** In `npm run dev`: confirm both tabs render fully; confirm every domain-row link inside the Coverage map tab still lands on that domain's real Standards tab and Dissection tab; confirm `/crosswalk` and `/synthesis/vocabulary` redirect (not 404).
- [ ] **Step 9:** Commit.

### Task 1.4: Merge Scorecard + Gap analysis + Positioning brief into one linked "Go-to-market" flow, and reconcile Gap analysis's numbers with Crosswalk's live data

**Files:**
- Create: `app/go-to-market/page.tsx`
- Modify: `app/scorecard/page.tsx`, `app/synthesis/gap-analysis/page.tsx`, `app/synthesis/positioning/page.tsx` — content moves into three step-sections on the new page rather than three routes; add real `next`/`prev` links between the three sections (IA audit finding #1: today these have **zero** links between them, grep-confirmed)
- Modify: `app/synthesis/gap-analysis/page.tsx`'s data source — read the same live `listStandardsCrosswalkDomains()`/`getStandardsCrosswalkForDomain()` data `/standards`'s Coverage-map tab uses, instead of the separate hand-authored markdown doc (IA audit finding #3: today these compute "how many standards, how many gaps" two different ways with no disclosure)
- Modify: `app/page.tsx` and `app/domains/[slug]/win/page.tsx` — both independently call `getScorecard()`+`computeWeightedTotals()` (IA audit finding #2); add a `<Link href="/go-to-market">` next to each rendered figure so a reader can trace the number back to its source
- Delete: `app/scorecard/page.tsx`, `app/synthesis/gap-analysis/page.tsx`, `app/synthesis/positioning/page.tsx` once repointed (their content lives inside `app/go-to-market/page.tsx` now)
- Modify: `next.config.ts` — add `{ source: "/scorecard", destination: "/go-to-market#which-domain", permanent: true }`, `{ source: "/synthesis/gap-analysis", destination: "/go-to-market#whats-missing", permanent: true }`, `{ source: "/synthesis/positioning", destination: "/go-to-market#what-to-say", permanent: true }`, following the same convention Task 1.1's review fixed a missed instance of

**Interfaces:**
- Consumes: `getScorecard()`+`computeWeightedTotals()` (step 1), `listStandardsCrosswalkDomains()`+`getStandardsCrosswalkForDomain()` (step 2 — **not** `readMarkdownFile` as today), whatever `app/synthesis/positioning/page.tsx` reads today (step 3)
- Produces: `/go-to-market` with three anchored sections (`#which-domain`, `#whats-missing`, `#what-to-say`), each with a "Next: …" link to the following section and a "Back to: …" link to the previous one

- [ ] **Step 1:** `grep -rn 'href="/scorecard\|href="/synthesis/gap-analysis\|href="/synthesis/positioning' apps/ecosystem/app apps/ecosystem/components` and list every hit.
- [ ] **Step 2:** Read `app/synthesis/gap-analysis/page.tsx` end to end to see exactly how it currently computes "56 standards, 5 gaps, 10 platform-level patterns" from the hand-authored doc, and read `components/crosswalk-view.tsx` (or wherever `/standards`'s Coverage-map tab lives after Task 1.3) to see the shape of the live `standardsCrosswalk` rows. Confirm whether the live rows can produce the same three headline figures; if a figure the hand-authored doc reports (e.g., "10 platform-level patterns") has no equivalent in the live row data, keep that one figure sourced from the hand-authored doc but say so explicitly in the page copy ("platform-pattern synthesis below is hand-authored; standards/gap counts above are computed live") rather than silently mixing sources under one unlabeled number.
- [ ] **Step 3:** Build `app/go-to-market/page.tsx` with the three sections, each reusing its source page's existing render body, plus the next/prev links.
- [ ] **Step 4:** Rewire `app/synthesis/gap-analysis/page.tsx`'s data calls per Step 2's finding (this logic moves into the new page's "what's missing" section — there is no longer a standalone `gap-analysis` route after this task).
- [ ] **Step 5:** Add the `<Link href="/go-to-market#which-domain">` trace-back next to the weighted-total figure in `app/page.tsx` and `app/domains/[slug]/win/page.tsx`.
- [ ] **Step 6:** Update sidebar nav: delete `Where-to-play scorecard`, `Gap analysis`, `Positioning brief`; add one `Go-to-market` row.
- [ ] **Step 7:** Update every link found in Step 1 to the new anchored sections.
- [ ] **Step 8:** Delete the three old route files.
- [ ] **Step 9:** Add the three redirect entries to `next.config.ts` per the Files note above.
- [ ] **Step 10:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 11:** In `npm run dev`: click through all three sections via the next/prev links; confirm the homepage and every domain's Win tab now link back to `/go-to-market`; confirm the gap-analysis section's numbers either match Crosswalk's live figures or are explicitly labeled as coming from a different source; confirm all three old routes redirect to their anchored section (not 404).
- [ ] **Step 12:** Commit.

### Task 1.5: Reduce domain tabs from 7 to 6 — fold Persona into Overview (renamed "Buyer profile"), fix the mis-targeted Roles cross-link

*Note: originally planned as "7 to 5," assuming Task 1.2 would remove Competitors as a full tab entry. Task 1.2's actual review found that assumption's premise (an earlier audit's "identical machinery" claim) was itself wrong, and the controller ruled to keep Competitors as a thinner, real tab (gutted to a domain-specific summary + link, not deleted) rather than force a false consolidation. This task therefore only removes Persona — a real, correct "7 to 6," not a shortfall.*

**Files:**
- Modify: `app/domains/[slug]/page.tsx` (Overview tab) — add a "Buyer profile" section rendering what `app/domains/[slug]/persona/page.tsx` renders today
- Modify: domain tab config — remove the `Persona` tab entry (Task 1.2 already removed `Competitors` as a full tab)
- Modify: `app/roles/[slug]/page.tsx:70` (per the IA audit's exact citation) — the `applies_across_domains` chip currently links to `/domains/{slug}/persona` expecting "this role within that domain" but actually lands on the discipline's own composite persona, a different entity; change the link label to make the destination explicit, e.g. `"{Domain}'s buyer profile →"` instead of an unlabeled domain-name chip, so the click's destination matches what it now says
- Delete: `app/domains/[slug]/persona/page.tsx` once its content is merged into Overview

**Interfaces:**
- Consumes: whatever `getDomainHubData()`'s `disciplinePersona` field returns today — unchanged, only its render location and section heading move
- Produces: no new interface; `app/domains/[slug]/persona` route no longer exists — any external bookmark or link to it must redirect to `/domains/{slug}#buyer-profile` (add a Next.js redirect entry, don't just 404 a previously-real URL)

- [ ] **Step 1:** `grep -rn 'href="/domains/\[slug\]/persona\|domains/${.*}/persona' apps/ecosystem/app apps/ecosystem/components` (adjust the pattern to however the codebase actually interpolates the slug — check one real call site first) and list every hit.
- [ ] **Step 2:** Add a "Buyer profile" section to `app/domains/[slug]/page.tsx`, moving `app/domains/[slug]/persona/page.tsx`'s render body into it.
- [ ] **Step 3:** Update domain tab config to remove `Persona`.
- [ ] **Step 4:** Update `app/roles/[slug]/page.tsx:70`'s chip label per the Files note above.
- [ ] **Step 5:** Add a Next.js redirect from `/domains/[slug]/persona` to `/domains/[slug]#buyer-profile`.
- [ ] **Step 6:** Delete `app/domains/[slug]/persona/page.tsx`.
- [ ] **Step 7:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 8:** In `npm run dev`: open a role page, click its domain chip, confirm the label now says what it does and the destination matches; confirm the old `/domains/{slug}/persona` URL redirects instead of 404ing.
- [ ] **Step 9:** Commit.

### Task 1.6: Remove the homepage's duplicate nav grid; regroup the sidebar into 6 groups; move Enterprise repo out of the research nav

**Files:**
- Modify: `app/page.tsx:201-214` — delete the "Explore the research" card grid entirely (IA audit finding #6: identical targets to the sidebar, no added framing)
- Modify: sidebar nav config — regroup into `Start here` (Executive summary), `Product` (Task 1.1's page), `Market` (`Competitive landscape`, `Standards & glossary`, `Go-to-market`), `Customer` (Roles, Journeys — unchanged), `Domains` (unchanged), `Reference — unverified` (unchanged); the `Strategy` group is deleted entirely
- Modify: app footer component (find via `grep -rn "footer" apps/ecosystem/components apps/ecosystem/app | grep -iv node_modules` — if no shared footer component exists yet, create a minimal one) — add an `Enterprise repo` link here, out of the main research nav (IA audit note: it's an internal tooling decision, not product/market content, and was only ever under Strategy for lack of anywhere else to put it)

- [ ] **Step 1:** Delete the card grid at `app/page.tsx:201-214`; confirm nothing else on the homepage depended on that block's layout wrapper (read the surrounding 30 lines before cutting).
- [ ] **Step 2:** Rewrite the sidebar nav config to the 6-group, 9-item structure above.
- [ ] **Step 3:** Add or extend the footer component with the `Enterprise repo` link.
- [ ] **Step 4:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 5:** In `npm run dev`: confirm the homepage no longer shows the card grid but still reads coherently; confirm the sidebar shows exactly 9 items in 6 groups; confirm `Enterprise repo` is reachable from the footer on every page.
- [ ] **Step 6:** Commit.

---

## Phase 2 — Color & Badge Semantics

*Source: `Badge Color Audit` artifact (published this session). Every sub-task below is one numbered collision from that audit.*

### Task 2.1: Fix the "behind" polarity collision (audit collision #1) and the tint-instead-of-semantic mismatches (audit collision #9)

**Files:**
- Modify: `components/feature-status.tsx:13` — the `behind` state currently reuses the word "behind" for "Prism is behind." Do not change the color (error/red is correct — Prism-behind is genuinely bad news); instead change the **label** so it no longer collides with `DepthBadge`'s "behind" (competitor-behind-Prism, good news, green): rename this state's rendered text from "Behind" to "Competitor leads" (it already carries that meaning in the surrounding copy per the audit's own citation — make the badge say what the page already says elsewhere on it).
- Modify: `app/synthesis/positioning/page.tsx:47-51`'s `BADGE_BY_TONE` — change `behind`'s color from the tint `"red"` to the semantic `error` variant, matching every other bad-news state in the same scale (audit collision #9, second instance).
- Modify: `components/fit-badge.tsx:20-25` (`FitBadge`) and `:33-38` (`DepthBadge`) — change the `build`/`prism-only` states from the tint `blue` to the semantic `accent` variant (audit collision #9, first instance) — confirm visually this doesn't collide with any *other* already-established use of `accent` on the same page before committing (check `app/prism/page.tsx`'s Shipped/Roadmap pills, which already use `accent` for "roadmap" — the two meanings, "neutral/not-a-verdict" and "on the roadmap," are close enough that sharing the token is arguably correct, not a new collision; note this reasoning in the commit message rather than silently changing it).

- [ ] **Step 1:** Make the three edits above.
- [ ] **Step 2:** `grep -rn '"Behind Prism"\|DepthBadge' apps/ecosystem/components apps/ecosystem/app` to confirm no other call site's copy assumed the old red-tint/blue-tint colors by name in a comment or test.
- [ ] **Step 3:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 4:** In `npm run dev`: open a competitor's Dissection panel showing `DepthBadge`'s green "Behind" pill, then open the Feature map showing `feature-status.tsx`'s red pill — confirm the second one now reads "Competitor leads," not "Behind." Open the positioning brief and confirm its "behind" rotation-stage pill matches the semantic error red used everywhere else on that page.
- [ ] **Step 5:** Commit.

### Task 2.2: Fix the two-different-severities "Unverified" collision (audit collision #2) and the silent-vs-loud caveat inconsistency (audit collision #4)

**Files:**
- Modify: `components/comparison-matrix.tsx:465` — the matrix-level "Unverified" label currently renders `Badge variant="warning"` (amber). Change it to `variant="neutral"` (gray), matching `DepthBadge`'s existing "Unverified" (`fit-badge.tsx:48,75`) — both now mean the same thing with the same weight.
- Modify: `app/roles/page.tsx:42-45` — the "every role file's domain list is stale" caveat currently renders as plain `<Text type="supporting" size="xsm" color="secondary">`. Wrap it in the same `Takeaway`/`Banner` component with `status="warning"` that `components/sales-reference-matrix.tsx:106-114` uses for its "not evidence" quarantine notice — both are the same category of "known, named defect in this data," and should carry the same visual weight.

- [ ] **Step 1:** Make the two edits above.
- [ ] **Step 2:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 3:** In `npm run dev`: confirm the comparison-matrix's "Unverified" label now renders gray, matching `DepthBadge`'s; confirm the Roles page's stale-data caveat now renders as an amber Banner, not plain text.
- [ ] **Step 4:** Commit.

### Task 2.3: Disambiguate the two coverage-stat vs. quarantine-flag Banners on the Dissection tab (audit collision #3), and give `DivergenceBadge`'s three collapsed states distinct colors (audit collision #6)

**Files:**
- Modify: `app/domains/[slug]/dissect/page.tsx:198-200` — the "1 of 6 dissection questions have partial-or-better coverage" stat currently uses `Takeaway status="warning"`. Change it to `status="info"` (**not** `"accent"` — Task 2.1's implementer confirmed live that `Badge`/`Banner`'s semantic non-severity variant is spelled `info`, not `accent`; `BadgeVariantMap` has no `accent` key) — informational, not cautionary, so it no longer shares a color with the genuine quarantine notice below it on the same page.
- Modify: `components/fit-badge.tsx:224-231` (`DivergenceBadge`) — split `gap`, `workaround`, and `inverted` (currently all `error`/red) into three distinct treatments: keep `gap` as `error` (nothing exists — the worst case), change `workaround` to `warning` (a real but partial mitigation exists), and change `inverted` to a distinct fourth state — since this scale has no unclaimed semantic color left, use the `purple` tint deliberately (confirm via `grep -rn "purple" apps/ecosystem/components apps/ecosystem/lib` that no other severity scale currently uses `purple`, the way `fit-badge.tsx:309`'s `PrismFeatureBadge` deliberately checked before claiming `teal`).

- [ ] **Step 1:** Make the two edits above.
- [ ] **Step 2:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 3:** In `npm run dev`: open a domain's Dissection tab, confirm the coverage-stat banner and the sales-collateral quarantine banner (added/kept from Task 2.2) now render in visibly different colors. Find a real `DivergenceBadge` `inverted` state in the content and confirm it now renders purple, distinct from `gap`'s red and `workaround`'s amber.
- [ ] **Step 4:** Commit.

### Task 2.4: Collapse `DisciplineChip`'s tint reuse (audit collision #5) and retire the second `StatusPill` implementation in favor of `Badge` (audit collision #8)

**Files:**
- Modify: `lib/discipline-meta.ts:32-47` — 12 discipline codes currently share 9 tints (`purple`: DO/OT/CRNA, `teal`: Pharmacy/PA, `orange`: Dentistry/Nursing, `cyan`: Medicine/SLP, `pink`: PT/TE). This app's design system exposes exactly 9 non-semantic tints total, so a fully unique color per 12 codes isn't possible without reaching into semantic colors (which Section 2.1-2.3 are actively trying to keep meaning "severity," not "identity") — the fix here is not more colors but a **second visual dimension**: add a distinct icon or letter-mark per code within a shared tint family, so two codes sharing `purple` (DO vs. OT vs. CRNA) are still told apart without relying on hue alone. Check `components/discipline-chip.tsx` for whether it already renders any per-code glyph before designing a new one.
- Modify: `components/status-pill.tsx` — `StatusPill`/`IconTile` reimplement `Badge`'s 4 semantic states by hand solely because `Badge`'s text is fixed at 12px. Check whether `@astryxdesign/core/Badge` exposes a `size` prop before assuming it doesn't (re-read `node_modules/@astryxdesign/core/src/Badge/Badge.tsx` in full — the audit only inspected its `variants`, not every prop). If a size prop exists, delete `status-pill.tsx` and replace every call site with `Badge size="lg"` (or equivalent); if it genuinely doesn't, leave `status-pill.tsx` in place but add a code comment pointing at `Badge`'s variant source as the canonical color definition, so a future edit to one is a visible prompt to check the other.

- [ ] **Step 1:** Re-read `Badge.tsx` in full for a size/scale prop; branch the task per the Files note above based on what's actually there.
- [ ] **Step 2:** Make the discipline-chip and status-pill changes.
- [ ] **Step 3:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 4:** In `npm run dev`: view a page rendering multiple `DisciplineChip`s that share a tint (e.g., a role applicable to both DO and OT) and confirm they're now visually distinguishable at a glance, not only by reading the label text.
- [ ] **Step 5:** Commit.

---

## Phase 3 — Domain-Understanding Content Gaps

*Source: Granola meeting transcript, "Exact pharmacy domain — competitive analysis, accreditation gaps, and product roadmap," 2026-09-12. Cite this meeting by name and date in every piece of content this phase adds — it is the real source, not this plan.*

### Task 3.1: Add a "closest comparable domain" field to the domain content schema, and populate Pharmacy's real one

**Files:**
- Modify: `content/domains/_TEMPLATE.yaml` (or wherever the domain schema is documented — check for a template file before assuming its shape) — add an optional `closest_analog` block:
  ```yaml
  closest_analog:
    discipline: "OT/PT"          # plain label; this discipline may not have its own domain hub page yet
    domain_slug: null            # set only if lib/content.ts's listDomains() actually has this slug; else leave null and never construct a Link from it
    similarity: "One sentence, the real structural reason these two are alike — not a guess."
    reuse_note: "What specifically can be scaffolded from the analog rather than rebuilt from zero."
    source: "2026-09-12 Exact pharmacy domain planning session"
  ```
- Modify: `content/domains/pharmacy.yaml` — add the real, sourced value:
  ```yaml
  closest_analog:
    discipline: "OT/PT"
    domain_slug: null
    similarity: "OT/PT uses a single unified accreditor with a multi-visit-cycle structure comparable to Pharmacy's ACPE standards, per the 2026-09-12 planning session."
    reuse_note: "OT/PT's requirement-to-requirement accreditation mapping is already ~90-100% complete against Exact; use it as the starting scaffold for Pharmacy's own mapping instead of starting from zero."
    source: "2026-09-12 Exact pharmacy domain planning session (Granola transcript)"
  ```
- Modify: `app/domains/[slug]/page.tsx` (Overview tab) — render a callout when `closest_analog` is present: if `domain_slug` resolves to a real domain in `listDomains()`, render it as a `<Link>`; otherwise render the `discipline` name as plain text with no link (this repo's established discipline — confirmed this session in the Roles/Persona cross-link finding — never construct a link to content that doesn't exist).
- Do **not** add `closest_analog` to `content/domains/do.yaml`, `dentistry.yaml`, or `medicine.yaml` in this task — no source establishes a real analog for those three; leave the field absent (not `null` written out, just omitted) rather than guess.

- [ ] **Step 1:** Find and read the domain content schema/template file to confirm the exact YAML shape and where optional fields are documented.
- [ ] **Step 2:** Add the `closest_analog` field definition to the template/schema doc.
- [ ] **Step 3:** Add the real Pharmacy value to `content/domains/pharmacy.yaml`.
- [ ] **Step 4:** Add the conditional-link callout to the Overview tab.
- [ ] **Step 5:** `python3 scripts/check_content_density.py` from repo root — confirm the summary line still reads baseline or better (never `grep -c "^FAIL"`).
- [ ] **Step 6:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 7:** In `npm run dev`: open Pharmacy's Overview tab, confirm the callout renders with the real text above, confirm it does **not** render as a broken/dead link (since `domain_slug` is `null`). Open DO's, Dentistry's, or Medicine's Overview tab and confirm no callout renders at all (not an empty box, not a "no analog found" placeholder — genuinely absent).
- [ ] **Step 8:** Commit.

### Task 3.2: Build the university-archetypes content schema and page, with an honest empty state — no fabricated archetype data

**Files:**
- Create: `content/archetypes/_TEMPLATE.yaml` — the schema for one university archetype: `{ name, description, exact_footprint: "current-customer" | "competitor-customer" | "unengaged", identifying_traits: [string], gtm_approach: string, source }`. Every field mandatory except leave the directory otherwise empty — this task ships zero real archetype entries, because no real research has produced any yet (per the transcript, this was still a planned deliverable, not a completed one).
- Create: `app/archetypes/page.tsx` — lists whatever's in `content/archetypes/` (today: nothing) with an honest empty state matching this app's established pattern (per the Medicine "No feature comparison matrix yet" precedent seen this session): a clear headline stating no archetypes are documented yet, one sentence citing the 2026-09-12 meeting as the source of the *plan* to build them, and no fabricated example rows.
- Modify: sidebar nav — add `University archetypes` under the `Market` group (alongside `Competitive landscape`, `Standards & glossary`, `Go-to-market`).
- Modify: `lib/content.ts` — add `listArchetypes()` reading `content/archetypes/*.yaml`, following the exact same pattern as an existing `list*()` function (e.g., `listCompetitors()`) — read that function first and mirror its shape, don't invent a new content-loading convention.

- [ ] **Step 1:** Read `listCompetitors()` (or another existing `list*()` function) in `lib/content.ts` to confirm the pattern to mirror.
- [ ] **Step 2:** Create the schema template and `listArchetypes()`.
- [ ] **Step 3:** Create `app/archetypes/page.tsx` with the honest empty state.
- [ ] **Step 4:** Add the sidebar entry.
- [ ] **Step 5:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 6:** In `npm run dev`: visit `/archetypes`, confirm the empty state renders (no fabricated rows, no broken query on an empty directory), confirm the nav entry is reachable.
- [ ] **Step 7:** Commit.

### Task 3.3: Add a cross-domain journey comparison view, reusing the existing per-discipline journey filter

**Files:**
- Create: `app/journeys/[slug]/compare/page.tsx` (or a `?compare=domainA,domainB` query-param mode on the existing `app/journeys/[slug]/page.tsx` — implementer's choice, but confirm which fits this app's existing URL conventions better by checking how `/domains/[slug]/dissect` or `/competitive-landscape`, Task 1.2, encode multi-value state in the URL)
- Read first, do not modify: `lib/content.ts:466`'s `getJourneyStagesForDiscipline(journeySlug, subject)` — this function already filters one journey down to one discipline's stages; the comparison view calls it twice (once per selected discipline) and renders the two filtered stage-lists side by side. No new data function is needed.

**Interfaces:**
- Consumes: `getJourneyStagesForDiscipline(journeySlug, subjectA)` and `getJourneyStagesForDiscipline(journeySlug, subjectB)` — both already exist
- Produces: a two-column (stacking to one column under ~680px) view, one column per selected discipline, sharing the same stage rows so a reader can see, stage by stage, where discipline A has a finding and discipline B has none (or vice versa) — this is literally the "pinpoint where they differ" artifact described in the 2026-09-12 meeting

- [ ] **Step 1:** Read `getJourneyStagesForDiscipline` and its existing single-discipline caller (wherever a domain tab currently renders one discipline's journey stages) to confirm the exact return shape before building the two-column view against it.
- [ ] **Step 2:** Build the comparison page/mode: a picker for journey + two disciplines, then the two-column stage-by-stage render. Stages where one discipline has a finding and the other doesn't must visibly mark the gap (reuse an existing "—" / empty-cell convention from `comparison-matrix.tsx` rather than inventing a new one).
- [ ] **Step 3:** Add an entry point: a "Compare across domains" link from the existing single-journey page.
- [ ] **Step 4:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 5:** In `npm run dev`: pick a journey with real content on at least two disciplines, confirm the two-column view renders both correctly and marks the stages where they diverge; confirm it correctly shows "no content" rather than crashing for a discipline with zero stages authored.
- [ ] **Step 6:** Commit.

---

## Phase 4 — Visual & Storytelling Upgrades

*Source: `design-reference-research.md` (this session) — real, named products researched live via WebSearch, not internal audit or taste. This phase exists because the audience for this app just widened to leadership, marketing, product, and design, which raises the bar from "structurally correct" to "reads well in one sitting." Run this after Phase 1 lands (several tasks touch the merged pages Phase 1 creates) and after Phase 2 lands (Task 4.5 depends on Phase 2's corrected badge colors).*

### Task 4.1: Restructure the matrix detail panel into Fact → Impact → Act, and make it a persistent synced side panel instead of a replacing modal

**Files:**
- Modify: `components/comparison-matrix.tsx` — the `renderPanel`/row-panel rendering logic (the shared machinery every one of `dissection-matrix.tsx`, `scorecard-matrix.tsx`, `feature-teardown-matrix.tsx`, `sales-reference-matrix.tsx` calls into)
- Read first: `lib/table-detail-panel.tsx` (`useTableDetailPanel`) — today's panel expansion mechanism, which replaces the row's space in-line; confirm whether the design system's `Table` component supports a fixed side-panel layout mode before assuming a full rewrite is needed

**Interfaces:**
- Consumes: the same `ComparisonMatrixPanelContext<RowId, ColId, TValue>` shape already passed to every caller's `rowPanel`/`rowPanelTakeaway` render props — this task changes how that context is *laid out*, not what data it carries
- Produces: three named slots in the panel — `fact` (the rated claim itself, e.g., "Elentra ships AACOM-taxonomy curriculum mapping"), `impact` (why it matters competitively — reuse whatever prose each caller already writes for its takeaway, just relocate it into this slot), `act` (a new, optional slot — not every caller will have real content for this yet; render nothing rather than a placeholder if a caller doesn't supply it)

- [ ] **Step 1:** Read `lib/table-detail-panel.tsx` and the design system's `Table` docs for any existing side-panel/split-view layout primitive.
- [ ] **Step 2:** Redesign `ComparisonMatrixPanelContext`'s render contract to expose three named sections instead of one undifferentiated block; update `comparison-matrix.tsx`'s panel rendering to lay them out as Fact (top, most prominent), Impact (below, supporting), Act (below that, optional, visually secondary if empty).
- [ ] **Step 3:** Update each of the 4 real callers (`dissection-matrix.tsx`, `scorecard-matrix.tsx`, `feature-teardown-matrix.tsx`, `sales-reference-matrix.tsx`) to map their existing panel content into the three slots — this is content re-slotting, not new copywriting; do not invent new "Act" text where a caller has none.
- [ ] **Step 4:** If Step 1 found a real side-panel layout primitive, switch from the current expand-in-place panel to a persistent panel that stays visible and updates as the reader moves between rows (matches Stripe docs' synced-panel pattern — claim and proof stay visible together, never one hiding behind a click). If no such primitive exists, keep today's expand-in-place mechanism and note in the commit message that the persistent-panel upgrade is deferred pending a design-system capability, not skipped by choice.
- [ ] **Step 5:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 6:** In `npm run dev`: open a row panel on all 4 matrix types, confirm Fact/Impact/Act render in the new structure, confirm no caller shows an empty "Act" heading with nothing under it.
- [ ] **Step 7:** Commit.

### Task 4.2: Replace bar/table competitive verdicts with a named two-axis quadrant plot

**Files:**
- Modify: `components/charts/verdict-distribution-chart.tsx`
- Modify: `app/competitive-landscape/page.tsx` (created in Phase 1 Task 1.2) — add the quadrant view as a third pivot option alongside by-competitor/by-pillar

**Interfaces:**
- Consumes: whatever data `verdict-distribution-chart.tsx` already reads (lead/hold/behind per rotation stage) — this task changes the visualization, not the data
- Produces: an SVG quadrant plot with two **named** axes (not generic "score") — e.g., for the GTM verdict chart: "Accreditation coverage" (x) × "Competitive whitespace" (y) — and four labeled quadrant regions whose *names* are the takeaway a reader remembers, matching Gartner MQ / G2 Grid's mechanism. Pick real, defensible axis names from this app's own existing metrics (do not invent a metric that isn't already computed somewhere in `lib/content.ts`) — read what's available before naming the axes.

- [ ] **Step 1:** Read `verdict-distribution-chart.tsx`'s current data inputs and confirm which two real, already-computed metrics can serve as the plot's two axes.
- [ ] **Step 2:** Build the quadrant SVG: two axes, gridlines, four labeled quadrant background regions, plotted points per domain/competitor.
- [ ] **Step 3:** Add the explicit Gartner-style disclosure line near the chart: this graphic is a summary; open the underlying row for full evidence and caveats — matching this app's own existing evidence-status discipline, just stated on-page the way Gartner does.
- [ ] **Step 4:** Wire the quadrant view into `/competitive-landscape` as a third `view=quadrant` option.
- [ ] **Step 5:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 6:** In `npm run dev`: confirm the quadrant renders with real, labeled axes and quadrant names, confirm every plotted point is still clickable through to its evidence.
- [ ] **Step 7:** Commit.

### Task 4.3: Replace competitor initials with a real logo grid

**Files:**
- Modify: `components/competitor-logo.tsx` (the existing initials-based component)
- Modify: `content/competitors/_TEMPLATE.yaml` and every real `content/competitors/*.yaml` — add an optional `logo_url` or `logo_asset` field
- Modify: every page rendering a competitor list (`app/competitive-landscape/page.tsx`, each domain's Competitors summary from Phase 1 Task 1.2)

**Interfaces:**
- Consumes: a new optional logo reference per competitor — when absent, fall back to today's initials treatment (never a broken image icon)
- Produces: a grid of real competitor logos grouped by threat level or category, matching CB Insights market-map convention, wherever a competitor *list* (not a single competitor detail page) renders today

- [ ] **Step 1:** Confirm where competitor logo assets would legally/practically come from (this is a content-sourcing question, not a code one — flag to the user if no real logo source is available yet rather than placeholder-fill with generic icons).
- [ ] **Step 2:** Add the optional schema field; populate it only for competitors with a real, sourced logo asset available.
- [ ] **Step 3:** Update `competitor-logo.tsx` to render the real logo when present, initials otherwise.
- [ ] **Step 4:** Update the list views to group by threat level with the new grid treatment.
- [ ] **Step 5:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 6:** In `npm run dev`: confirm mixed real-logo/initials-fallback rendering looks intentional, not broken, in every list.
- [ ] **Step 7:** Commit.

### Task 4.4: Action-title nav labels, breadcrumbs on every merged page

**Files:**
- Modify: sidebar nav config (from Phase 1 Task 1.6) — rename the 6 group labels from category nouns to action-title fragments (e.g., `Market` → something closer to "Where we win or lose"; `Customer` → "Who we're building for") — draft real candidates and confirm each one passes the ghost-deck test (read the group's labels alone, in order, and check they already tell a story) before finalizing
- Modify: `app/product/page.tsx`, `app/competitive-landscape/page.tsx`, `app/standards/page.tsx`, `app/go-to-market/page.tsx` (all created in Phase 1) — add the same `Domains / {section}` breadcrumb pattern already used on the domain hub (`app/domains/[slug]/page.tsx`), so which merged tab a reader is in is never ambiguous

- [ ] **Step 1:** Draft action-title candidates for all 6 nav groups; run the ghost-deck test on the full list read in sequence.
- [ ] **Step 2:** Update the nav config with the finalized labels.
- [ ] **Step 3:** Add breadcrumbs to the 4 new merged pages, matching the domain hub's existing breadcrumb component exactly (reuse it, don't rebuild it).
- [ ] **Step 4:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build`.
- [ ] **Step 5:** In `npm run dev`: read the sidebar top to bottom as a leadership skimmer would, confirm it now tells a story; confirm every merged page shows a breadcrumb.
- [ ] **Step 6:** Commit.

### Task 4.5: Inline hover-preview citations and a visible citation-correction affordance on prose-heavy pages

**Files:**
- Create: a small `CitationMark` component (superscript marker + hover/click preview of the source, matching Wikipedia's Reference Previews mechanism) — check `lib/strip-file-citations.ts` and its callers first, since this is the opposite move (surfacing a citation lightly, rather than stripping it) and must not conflict with that sanitizer's job on the same prose
- Modify: `app/page.tsx` (Executive summary), `app/go-to-market/page.tsx`'s positioning-brief section (from Phase 1 Task 1.4) — the two prose-heaviest pages with no inline citation affordance today, per the reference research
- Add: a small "flag this" affordance next to `CitationMark`'s preview, even if it only opens a mailto/feedback link today rather than a full correction workflow — the point per PitchBook's pattern is making correction visibly possible, not necessarily automating it yet

- [ ] **Step 1:** Read `lib/strip-file-citations.ts` and its test file to understand exactly what it currently removes from prose, so `CitationMark` adds a citation affordance without reintroducing the raw-filename leak that sanitizer exists to prevent.
- [ ] **Step 2:** Build `CitationMark` as a small, reusable component.
- [ ] **Step 3:** Wire it into the Executive summary and Go-to-market/positioning prose where a real source exists to attach.
- [ ] **Step 4:** Add the "flag this" affordance.
- [ ] **Step 5:** `cd apps/ecosystem && npx tsc --noEmit && npm run check:density && npx next build && npm test` (the citation-sanitizer test suite must still pass 37/37).
- [ ] **Step 6:** In `npm run dev`: hover a citation mark on the Executive summary, confirm the preview opens without navigating away; confirm no raw filename leaks into the preview text.
- [ ] **Step 7:** Commit.

### Note on Phase 2 (already planned) — Linear's weight/opacity hierarchy

Once Phase 2's color fixes land, apply Linear's within-severity refinement as a follow-on: two badges sharing the corrected `error` red for different confidence levels (e.g., a fully-researched gap vs. a provisionally-flagged one) should differ by weight/opacity, not a second competing hue. This is a refinement on top of Phase 2's fixes, not a new task — fold it into Phase 2's own re-review if there's appetite, or track it as a follow-up once Phase 2 ships and the corrected palette is visible to judge against.

---

## Execution note

Phases 1 and 2 are independent of each other; Phase 3 is net-new and additive and can run fully in parallel with both in a separate worktree. Phase 4 depends on Phase 1 (several tasks touch pages Phase 1 creates) and Phase 2 (Task 4.1's Fact/Impact/Act restructuring reads much better once the badge colors it displays are already correct). Suggested order: **Phase 2 → Phase 1 → Phase 4**, with Phase 3 running alongside all three in its own worktree.
