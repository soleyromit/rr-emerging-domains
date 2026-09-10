# Design Patterns — which visual form fits which content shape

**What this is:** the storytelling-half sibling to `UI-DENSITY-PATTERNS.md`. That doc
governs *how much* of a field to show and where to hide the rest; this one governs
*what kind of thing to draw* once you know what the content actually is. Read both
before building a page — density without shape still reads as a spreadsheet with
better spacing.

**Last updated:** 2026-09-09

---

## The bug this doc exists to prevent

Every domain tab (`app/domains/[slug]/{overview,standards,trends,competitors,persona}`)
was built correctly against `UI-DENSITY-PATTERNS.md` — two-zone shape, `FieldBlock`
clamps, `Collapsible` deep dives, real bar charts for distribution data — and still
read as a dashboard with no visuals, no scenarios, no sense of story. The content was
dense-but-safe, not un-designed. What was actually missing: **several pieces of content
were conceptually a process, a chain, or a scenario, and got rendered as a table or a
paragraph anyway**, because nothing forced the question "what kind of thing is this,
really?" before reaching for the default (a `Table`, a `List`, a clamped `Text`).
Meanwhile this repo already had the exact component idiom needed
(`JourneyStepper`/`FlowDiagram`) and already had genuinely rich scenario content
(`content/journeys/*.yaml`, `content/personas/discipline-*.yaml`'s `switching_trigger`)
— both sitting unused by the domain pages. The fix was reuse and reconnection, not a
new charting library. See the Pharmacy domain tabs (`domains/pharmacy/*`) for the
worked result of every rule below.

## Content-type → treatment

| Content shape | Wrong default | Right treatment | Reference |
|---|---|---|---|
| **Sequential/temporal structure** (a real timeline: rotation years, standards effective dates, a program's own stage order) | A clamped paragraph behind a "read more" | Hand-composed `Stack`/`Card`+chevron timeline, one node per real stop, headline stat first | `components/clinical-education-timeline.tsx`, wired into `app/domains/[slug]/page.tsx`'s `DOMAIN_CLINICAL_TIMELINE` |
| **Causal chain** (standard → Exxat status → competitor → the specific feature that covers it) | Nested nothing-detail cards you have to read top to bottom to find "so who solves it" | A compact chevron chain as the card's *header* (3 nodes max — don't invent a branch the data doesn't have), full prose/sources kept below unchanged | `components/exxat-gap-answer.tsx`'s `GapChain` |
| **Maturity/progression state** (shipped vs. roadmap vs. unaddressed; none vs. partial vs. full) | A single standalone colored `Badge` | A 3-step scale showing the whole path with one stop lit, so "roadmap" reads as *further along than unaddressed*, not just "a different color" | `components/maturity-scale.tsx`, wired into `app/domains/[slug]/trends/page.tsx` |
| **Scenario/persona narrative** (pressure → current behavior → the thing that finally makes someone switch) | Parallel fact-card grids with no connective thread | An opening vignette (the persona's *own* first sentence, given visual weight — never invented prose) + a small stepper linking the sections in causal order via same-page anchors | `app/domains/[slug]/persona/page.tsx`'s `vignette`/`narrativeSteps` |
| **Rich narrative content that already exists elsewhere in the repo** (a journey/flow with real, sourced, discipline-specific stages) | Leaving it reachable only from the separate top-level Journeys/Flows nav, with no link in from the domain it's actually about | Surface the domain-relevant slice directly on that domain's Overview tab, filtered to the stages that actually mention it, with a link out to the full journey for the rest | `lib/content.ts`'s `getJourneyStagesForDiscipline`, `components/pharmacy-scenario.tsx` |
| **Real distribution/count data** (severity counts, fit counts, depth counts across many rows) | Reaching for a hand-composed diagram just because "diagrams are the fix now" | The existing Plot bar charts (`fit-distribution-chart.tsx`, `feature-depth-chart.tsx`, etc.) are already correct for this shape — keep them, don't replace real statistical data with a stylized illustration | `components/charts/*.tsx` |

## The rule underneath the table

Before writing a section, ask **"if I described this content out loud, would I say
'first this, then this, then this' — or 'here's how far along X is' — or 'here's what
happened to this one person'?"** If yes to any of those, it's a process/scale/scenario,
not a fact list, even if the underlying YAML is a flat array. The schema shape and the
right visual shape are different questions; don't let one silently answer the other.

## Reuse the existing hand-composed idiom — don't add a diagramming library

`JourneyStepper` (`components/charts/journey-stepper.tsx`) and `FlowDiagram`
(`components/charts/flow-diagram.tsx`) are `Stack`/`Card`/`Icon`(`chevronRight`)
compositions, not Plot/SVG charts and not a graph-layout library. `@observablehq/plot`
+ `d3` are already dependencies, used only for real statistical bar/cell charts — they
are the right tool for distribution data and the wrong tool for a hand-authored
sequence of 2-6 known stops. No mermaid/react-flow/dagre/cytoscape exists in this repo
(confirmed 2026-09-09) and none should be added for a fixed, small, hand-authored
chain — every new component in the table above extends the same three-primitive
(`Stack`+`Card`+`Icon`) pattern rather than introducing a new one.

## Hand-authored content is scoped, honestly, like `DOMAIN_EDITORIAL`

`DOMAIN_CLINICAL_TIMELINE` and `DOMAIN_SCENARIO_JOURNEY` in
`app/domains/[slug]/page.tsx` follow the same convention `DOMAIN_EDITORIAL` already
set: a `Partial<Record<string, ...>>` keyed by route slug, populated only for domains
actually researched to that level of detail (Pharmacy first), with every unlisted
domain's section simply not rendering rather than falling back to invented content.
Extending one of these to another domain means writing real, sourced stops for that
domain's actual structure — never copying Pharmacy's shape with different labels.

## When you're an agent building a new domain-page section

1. Read this file and `UI-DENSITY-PATTERNS.md` before writing JSX — density and shape
   are both required, neither substitutes for the other.
2. Run the content-shape question above on whatever field(s) you're about to render.
3. If it's a process/chain/scale/scenario, reach for the matching row in the table
   above before reaching for a `Table` or a clamped `Text`.
4. If the same content already exists richly elsewhere in the repo (a journey, a flow,
   a persona), check whether it's actually linked from the page a reader would expect
   it on — an orphaned rich section is as unhelpful as an under-designed one.
5. Run `npm run check:density` and `npx next build`, then actually open the page in a
   browser — a chevron chain or a scale can type-check and still look wrong, same
   reasoning as `UI-DENSITY-PATTERNS.md`'s `CollapsibleGroup` warning.
