# Pharmacy standards page: proposed use cases + first-pass competitor ratings

## Context

User report: on `/domains/pharmacy/standards`, clicking "Show details" on any
accreditation standard shows no competitor research, making the detail panel
useless. They also want proposed use cases/journeys shown per standard, and
Vishaka's (pharmacy domain expert) Granola meeting input prioritized in the work.

**Verified root cause (not a UI bug):** `accreditation-standards-table.tsx` already
renders competitor cards per standard and degrades to an honest empty state when data
is missing — the wiring is correct. The problem is upstream: `content/lenses/
standards-competitor-ratings.yaml` has only 2 rated cells out of 100 for pharmacy (5
competitors × 20 ACPE elements), and the two pharmacy-dedicated platforms
(Pharmacademic, RxPreceptor) have zero. No schema anywhere links a standard to a
proposed use case/journey.

**Vishaka's Sep 4 2026 meeting** ("Pharmacy understanding with Vishaka and Ruchi," her
most recent and most authoritative session) is the domain-expert source this design is
built from. Her single most load-bearing statement: real pharmacy standards-gap
research **has never been done** — the "~25% gap" figure the team has been working off
is unverified, in her own words "research that remains to be done." Every piece of this
design that touches competitor accuracy is built around not contradicting that
statement — nothing gets written as verified that she has explicitly flagged as
unverified.

## Architectural decision: where does standard → use case live?

Three options considered:

1. **Purely computed** (reverse-match `flows/*.yaml` / `journeys/*.yaml`
   `accreditation_link` citations against each ACPE `element_id`). Zero authoring,
   ships immediately, covers 12/20 elements for free — but can't express *why* a match
   holds, can't carry Vishaka's named customer use cases (nothing about OHSU/Maryland
   exists in any flow), and 8 elements stay permanently empty.
2. **New field on `accreditation/acpe.yaml` itself** pointing at flows. Rejected:
   flows already cite `acpe.yaml` as ground truth; having `acpe.yaml` point back at
   flows creates a citation cycle — exactly what `content/ARCHITECTURE.md`'s
   citation rule exists to forbid, and Level 1 (the stratum everything else rests on)
   is not where the repo's one tolerated sideways-pointer exception (`related_flows`,
   documented for Level 2 → Level 3) applies.
3. **New Level-2 lens file, `content/lenses/standards-use-cases.yaml`** — structural
   sibling of the existing `standards-competitor-ratings.yaml`: sparse, keyed by
   `(domain, element_id)`, cites `accreditation/*.yaml` downward by element_id, carries
   `related_flows` as the already-tolerated Level 2 → Level 3 pointer. Curated entries
   render first; the computed join (option 1) fills the remaining elements as a
   distinctly-labeled fallback.

**Decision: option 3.** It's the only one that satisfies both breadth (all 20
standards, via the computed fallback) and depth (Vishaka's named, sourced use cases)
without violating the citation rule, and it reuses a pattern this repo already ships
and already gates in `check_content_density.py`.

## Schema

### `content/lenses/standards-use-cases.yaml` (new)

```yaml
last_updated: "2026-09-10"
use_cases:
  - domain: "Pharmacy"
    element_id: "Standard 2, Key Element 2.2.d"
    use_case: "Map curriculum, import ExamSoft scores, correlate to NAPLEX"
    status: "in-flight"          # proposed | in-flight | documented | no-fit-yet
    audience: ["role-dean", "role-compliance-accreditation-liaison"]
    detail: >
      A non-customer PharmD school is piloting ACPE curriculum mapping with
      didactic assessment data imported from ExamSoft, correlated against NAPLEX
      performance. Targeted at an AACP abstract (Nov 2026) — in flight, not shipped.
    related_flows:
      - flow: "accreditation-self-study--04-curriculum-competency-coverage-mapping-to-the.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"
```

`status` is the honesty axis (`no-fit-yet` is a first-class, explicitly-stated value —
never leave a real gap blank). `audience[]` reuses persona slugs, encoding Vishaka's
GTM point directly (deans/curriculum chairs/assessment chairs are the real buyers, not
just Directors of Clinical Education). `related_flows` and its resolver
(`resolveRelatedFlows`) are reused unchanged.

### `content/lenses/standards-competitor-ratings.yaml` (additive fields)

```yaml
    evidence_strength: "directional"   # omit for the existing verified entries
    evidence_note: "First-pass read of the vendor's public product page only."
```

Additive; the 2 existing pharmacy entries and all other domains' entries are untouched
and unflagged.

### Density ceilings (add to both `CONTENT-DENSITY.md` and the enforcement script)

| Field | Soft | Hard |
|---|---|---|
| `standards-use-cases.yaml` `use_cases[].use_case` | 120 | 220 |
| `standards-use-cases.yaml` `use_cases[].detail` | 300 | 600 |
| `standards-competitor-ratings.yaml` `ratings[].evidence_note` | 150 | 300 |

Numbers, not "keep it short" — this repo has a documented history of prose briefs
being silently ignored. An entry that can't fit decomposes into two list entries.

## Content plan

**Step 0 (blocking prerequisite):** land the meeting as a real Level-0 source —
nothing from Vishaka can be cited until it exists in `content/`. New file
`content/interviews/2026-09-04-vishaka-ruchi-pharmacy-understanding.md`, format
matching `content/interviews/2026-08-26-wilson-nursing-crosswalk.md` (title,
date/participants, Granola source, "Level 0 raw source, not summarized," then
near-verbatim sections — including her "research that remains to be done" line
verbatim, since that quote is what the whole caveat mechanism below hangs off). Add a
matching `type: "interview"` entry to `content/sources/registry.yaml`.

**Computed join:** in `lib/content.ts`, match each ACPE `element_id` (full string,
plus accreditor short name — do not loosen to bare numbers, which risks false
positives against COCA/CODA's shared `N.N` numbering) against `flows`/`journeys`
`accreditation_link` prose. Covers 12/20 elements today with zero authoring. Cap
rendered matches at 4 + "N more" — Standard 3 KE 3.3.a alone matches 9 flow files.

**Curated use cases (~15 entries)** built from Vishaka's named items: the pilot
(curriculum mapping + ExamSoft + NAPLEX → AACP abstract), OHSU (clinical-placement
management, `documented` since it's an active customer), Maryland (flagged `detail`
that the specific workflow isn't yet documented — do not invent one), the Core→Exact
migration case (`proposed`), the Sep-12 bulk ExamSoft import (`proposed`). Two of the
8 computed-join gaps get an honest `no-fit-yet` (patient-population diversity tracking)
or are left unmapped entirely (student remuneration, 3.5.c) rather than forcing a match.
The aspirational AI-gap-detection idea from her Cohere deck goes in, if at all, as its
own `proposed` entry whose `detail` opens with "Roadmap concept, not shipped" — never
folded into the live pilot entry.

**New journey:** `content/journeys/pharmacy-core-to-exact-migration.yaml` — 5 stages
(decision trigger → data inventory → program re-setup → bulk ExamSoft import → first
self-study cycle), each stage citing full ACPE element_id strings so it auto-appears in
the computed join. Authored well under the existing ceilings (target 800–1,400 chars
per stage field against a 3,500 hard ceiling; `key_findings[].detail` held ≤ 260 against
the 350 hard limit — this is the exact field that overran on `rotation-lifecycle.yaml`
previously).

**Competitor research (real, not fabricated):** `pharmacademic.yaml` (2 sources) and
`rxpreceptor.yaml` (1 source) currently can't support element-level ratings. Step 1: a
real WebSearch/WebFetch pass against public vendor docs to deepen both files'
`feature_teardown[]` with genuine sourced pillars. Step 2: rate a targeted ~10-element
slice (the GTM-load-bearing standards: curriculum mapping, IPPE/APPE hours, preceptor
lifecycle, CQI, continuous compliance) across the 5 competitors — realistic outcome
~25–35 of 100 cells, not all of them. Every new rating carries `evidence_strength:
"directional"` + a required `evidence_note`. Where evidence genuinely doesn't support a
rating, the cell stays empty — the existing "unresearched, not 'doesn't solve it'"
copy is already the right answer.

## Caveat mechanism (directional must never read as verified)

Three layers:

1. **Structural** — `evidence_strength`/`evidence_note` enforced in
   `check_standards_ratings_integrity()`: directional requires a note; this makes a
   future "promote to verified" pass a visible diff, not a silent reclassification.
2. **Visual** — a `DirectionalBadge` (new, added to `fit-badge.tsx`, the app's single
   home for badge vocabulary) rendered in the expanded competitor card next to the
   existing rating badge, with the `evidence_note` shown in the same italic
   supporting-text treatment already used for "not yet researched." Not shown in the
   collapsed table cell — a second pill per cell across 5 columns breaks the scan
   strip.
3. **Aggregate** — `CoverageGapsCallout` gets an optional `directionalCount`, e.g. "28
   of 100 rated · 26 directional first-pass, pending a full standards-gap audit," plus
   a short paragraph on the page itself citing Vishaka's interview directly.

Deliberately not doing: a new color in the shared badge palette, or a numeric
"confidence score" — both would invent vocabulary this repo doesn't have.

## UI plan

- `lib/content.ts`: `StandardUseCase` type, `getStandardsUseCases()`, computed-join
  helper, merged into `getStandardsCrosswalkForDomain()` with new coverage counts.
- `accreditation-standards-table.tsx` (`StandardDetail` only): a new "PROPOSED USE
  CASES" `Divider` section above the existing competitor-ratings section, built
  entirely from components already imported in this file or its siblings
  (`FieldBlock`, `Badge`, `RelatedFlowsPreview`, `SourceList`) — the only new component
  is `DirectionalBadge`.
- `domains/[slug]/standards/page.tsx`: a third `ProgressBar` ("standards with a
  proposed use case"), plus `directionalCount` passed to `CoverageGapsCallout`.

**Known risk:** `RelatedFlowsPreview`'s `HoverCard` has never been rendered inside this
hand-rolled detail-panel plugin before — overflow/clipping inside a `<td>` is a real
possibility that only shows up in a browser, not in a build.

## Verification

- `python3 scripts/check_content_density.py` — baseline today is 934 WARN / 31 FAIL;
  requirement is FAIL count stays 31 with none naming a file this work touches, and any
  new FAIL is either fixed or explicitly `ALLOWLIST`ed with a reason.
- Integrity checks (element_id, competitor_slug, source_id, persona_relevance,
  competitor_feature_ref all resolve; every directional rating has a note) must print
  zero problems.
- `cd apps/ecosystem && npm run check:density && npx next build`.
- Manual browser pass (required — this repo has shipped a build-clean but visually
  broken component before): open `/domains/pharmacy/standards`; expand the
  high-density case (3.3.a, 9 flows) and confirm the 4-item cap; expand a
  deliberately-empty case (3.5.c) and confirm it reads as "unmapped, not unsupported";
  hover a `RelatedFlowsPreview` chip inside the panel and confirm the HoverCard isn't
  clipped; confirm the two pre-existing `core-elms` ratings are *not* flagged
  directional while new ones are; check `/domains/do/standards` (no use-case content
  yet) still degrades cleanly; check the new `/journeys/pharmacy-core-to-exact-
  migration` route renders.

## Sequencing

1. Interview file + source registry entry (blocks everything below).
2. Density ceilings + integrity-check additions — gates before content.
3. Computed join + UI section, shipped against zero curated content first (proves the
   empty-state and the 12/20 breadth independently of the rest).
4. Curated `standards-use-cases.yaml` entries.
5. Competitor WebSearch pass → directional ratings → caveat copy (independent of 4,
   can run in parallel).
6. Migration journey + pharmacy trends entries.
7. Full verification sweep.
