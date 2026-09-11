# content/ Authoring Rule — Ceilings, Not Essays

**What this is:** the rule that stops a field from becoming an essay. Sibling to
`ARCHITECTURE.md` — that document governs *where* a claim goes; this one governs *how
long* it's allowed to run once it's there.

**Last updated:** 2026-08-25

---

## The incident this rule exists to prevent

`journeys/rotation-lifecycle.yaml` was built with a written brief: `key_finding.detail`
should be "1-2 sentences." An audit later measured what actually shipped: average 470
characters, 98% of entries over 300 characters — 3-4x the brief, while four sibling
journey files built against the same brief landed at 221-263 characters, compliant.
The same file's `discipline_variance` field ran 13,728-22,727 characters per stage — an
essay stored in one string, not a summary.

The brief wasn't wrong. It was never checked. An agent handed rich source material and
no length gate will use all of it, every time, because "more" always reads as "more
thorough" from the inside. **A ceiling that lives only in a prompt is not a ceiling —
it's a suggestion that survives until the first agent with a strong opinion.**

## The rule

Every field that can accumulate written prose has a soft target and a hard ceiling.
Writing under the soft target needs no justification. Writing between soft and hard is
fine but should make you pause. Writing past the hard ceiling fails
`scripts/check_content_density.py` and blocks — the field must be shortened or the
overage explicitly allowlisted with a reason, not silently shipped.

| Field | Soft | Hard | Basis |
|---|---|---|---|
| `journeys/*.yaml` `key_findings[].detail` | 260 | 350 | measured from 4 compliant journeys |
| `journeys/*.yaml` `discipline_notes[].detail` | 2,000 | 3,000 | measured from admin-onboarding's compliant per-stage total |
| `journeys/*.yaml` `domain_variance` / `discipline_variance` (legacy single-string) | 1,800 | 3,000 | measured from domain_variance's own already-fine range |
| `journeys/*.yaml` `current_state_in_prism` / `pain_or_gap` / `accreditation_link` / `competitor_comparison` | 2,000 | 3,500 | guards drift; non-blocking at time of writing |
| `flows/*.yaml` `gap_note` (per element) | 500 (warn) | 1,500 (fail) | only the true tail (~1% of entries) should block |
| `personas/discipline-*.yaml` `archetype_summary` | 2,200 | 2,800 | already gated behind click-to-expand on `/personas`; guards drift |
| `personas/discipline-*.yaml` `accreditation_pressure[].detail` / `current_tools[].detail` | 350 | 700 | per decomposed point, not per field — see below |
| `personas/discipline-*.yaml` `jtbd[].job` | 300 | 500 | **new 2026-08-26** — was unceilinged (root cause of its length); measured off the corpus's cleanest existing entries (214-292 chars) that already read as one plain JTBD sentence with no inline accreditor-element numbers |
| `personas/role-*.yaml` `day_in_the_life_summary` | 2,200 | 2,800 | same treatment as discipline `archetype_summary` |
| `personas/role-*.yaml` `top_pains[].accreditation_link` | 300 | 600 | measured from existing role files |
| `personas/role-*.yaml` `top_pains[].pain` | 350 | 600 | **new 2026-08-26** — was unceilinged; measured off current shortest entries (473-507 chars) minus the citation material the plain-language pass relocates to `accreditation_link`/`source` |
| `personas/lens-*.yaml` `how_they_implicitly_serve_roles[].read` | 600 | 1,100 | **tightened 2026-08-26** from 700/1,400 — the old ceiling was set before this field was expected to be plain language; the Compliance/Accreditation Liaison entries (the most citation-heavy) are the ones this is meant to force a genuine trim of |
| `personas/lens-*.yaml` `gaps_prism_can_exploit[].claim` | 220 | 400 | **new 2026-08-26**, superseding the row below — the plain-language headline half of the claim/detail split (see the pattern section) |
| `personas/lens-*.yaml` `gaps_prism_can_exploit[].detail` | 300 | 600 | **new 2026-08-26**, superseding the row below — same number as the old combined field, re-anchored to the narrower `detail` half |
| ~~`personas/lens-*.yaml` `gaps_prism_can_exploit[]`~~ | ~~300~~ | ~~600~~ | **superseded 2026-08-26** by the `.claim`/`.detail` rows above — `gaps_prism_can_exploit` is no longer a flat string list, see the pattern section |
| `competitors/*.yaml` `exxat_opportunity` | 1,200 | 2,000 | measured from existing competitor files |
| `competitors/*.yaml` `strengths[].claim` / `weaknesses[].claim` | 300 | 600 | measured from existing competitor files |
| `prism/capability-map.yaml` `core_ring.pillars[].notes` / `why_it_matters` | 1,200 | 2,200 | p75/~p95 of the file's own distribution |
| `prism/capability-map.yaml` `core_ring.pillars[].features[].detail` | 900 | 1,800 | p75/~p95 of the file's own distribution |
| `prism/capability-map.yaml` `intelligence_layer.capabilities[]` | 1,500 | 2,700 | only 7 items, all inherently dense evidence claims |
| `prism/capability-map.yaml` `open_questions_for_phase_2[]` | 450 | 900 | measured from the file's own distribution |
| `accreditation/*.yaml` `standards[].evidence_programs_must_produce` | 640 | 1,450 | **new 2026-08-27** — soft is p75 of the file's own 165-standard corpus; hard is set above the corpus's observed max (not p95) since this directory was previously unmonitored and 25 existing entries haven't been individually spot-checked yet |
| `accreditation/*.yaml` `standards[].required_software_behavior` | 385 | 950 | **new 2026-08-27** — same treatment as above |
| `accreditation/*.yaml` `standards[].gap_notes` | 612 | 1,200 | **new 2026-08-27** — same treatment as above |
| `lenses/standards-competitor-ratings.yaml` `ratings[].rationale` | 300 | 600 | **new 2026-08-27** — same order of magnitude as `competitors/*.yaml`'s `strengths[].claim`, since it's the same kind of single-sourced competitive claim |
| `lenses/standards-use-cases.yaml` `use_cases[].use_case` | 120 | 220 | **new 2026-09-10** — a one-line "what a program would actually do with this standard," same register as a `trends[].trend` headline (120/220) and for the same reason: it is a scannable label, not the argument. The argument goes in `detail`. |
| `lenses/standards-use-cases.yaml` `use_cases[].detail` | 300 | 600 | **new 2026-09-10** — same numbers as `personas/lens-*.yaml`'s `gaps_prism_can_exploit[].detail`, since it is the same shape of claim: one paragraph of sourced supporting evidence behind a plain-language headline. An entry that can't fit decomposes into two `use_cases[]` entries. |
| `interviews/*.md` front-matter `title` | 120 | 200 | **new 2026-09-11** — the one-line plain-language name of a session, same register as a `trends[].trend` headline and `lenses/standards-use-cases.yaml`'s `use_cases[].use_case` (120/220), for the same reason: it's a scannable label in a session index, not a summary of the session. **Only the front-matter `title` is ceilinged — the markdown body below the front-matter is a Level 0 transcript and stays deliberately unceilinged**, since trimming a primary source destroys the thing that makes it citable. |
| `lenses/standards-competitor-ratings.yaml` `ratings[].evidence_note` | 150 | 300 | **new 2026-09-10** — a one-line statement of *what evidence the directional rating actually rests on* ("first-pass read of the vendor's public product page only"), not a second rationale. Same order of magnitude as `sources[].what_it_supports`, the closest analog. |
| `dissection/*.yaml` `questions[].gap_note` | 200 | 400 | **new 2026-09-11** — a dissection manifest holds no primary claims, so a gap note states *what research is missing and why* in one or two lines; the finding itself belongs in the file the question points at. Sized just above `ratings[].evidence_note` (150/300) because it carries two clauses (what is absent, and why) rather than one. |
| `dissection/*.yaml` `incumbent_set[].exclusion_reason` | 150 | 300 | **new 2026-09-11** — one sentence saying why a vendor is out of scope for this domain. Same numbers as `ratings[].evidence_note`, the closest analog: a one-line scoping statement, not a competitive argument — that stays in `competitors/<slug>.yaml`'s `strengths`/`weaknesses` (300/600). |
| `lenses/product-gaps.yaml` `gaps[].gap` | 120 | 220 | **new 2026-09-11** — the scannable one-line headline for a gap, same register (and same numbers) as `lenses/standards-use-cases.yaml`'s `use_cases[].use_case`, for the same reason: it's a label a reader skims down a list, not the argument. The argument goes in `detail`. |
| `lenses/product-gaps.yaml` `gaps[].detail` | 300 | 600 | **new 2026-09-11** — mirrors `lenses/standards-competitor-ratings.yaml` `ratings[].rationale` exactly: one paragraph of sourced evidence behind a plain-language headline. A gap that can't fit is two gaps. |
| `lenses/competitor-differentiation.yaml` `differentiators[].claim` | 160 | 260 | **new 2026-09-11** — the one-line competitive wedge. Slightly above the 120/220 headline register because a differentiation claim has to name both the vendor and the axis before it says anything, which a use-case headline doesn't. |
| `lenses/competitor-differentiation.yaml` `differentiators[].detail` | 300 | 600 | **new 2026-09-11** — mirrors `ratings[].rationale`; same kind of single-sourced competitive claim, one granularity down. |
| `lenses/competitor-differentiation.yaml` `differentiators[].counter_move` | 200 | 350 | **new 2026-09-11** — the stated move only, never its justification (that's `detail`, above). Sized between the headline fields and the paragraph fields because a move is one sentence with a subject and a mechanism, not a label. |
| `lenses/competitor-differentiation.yaml` `differentiators[].evidence_note` | 150 | 300 | **new 2026-09-11** — same numbers and same job as `lenses/standards-competitor-ratings.yaml` `ratings[].evidence_note`: one line saying what a directional claim actually rests on, not a second rationale. |
| `lenses/feature-comparison-matrix.yaml` `cells[].capability` | 120 | 220 | **new 2026-09-11** — a matrix row label, the same scannable-headline register as `use_cases[].use_case` and `gaps[].gap`. |
| `lenses/feature-comparison-matrix.yaml` `cells[].rationale` / `exxat_cells[].rationale` | 300 | 600 | **new 2026-09-11** — mirrors `ratings[].rationale` exactly, since it is the same kind of claim at feature rather than standard granularity. Exxat's own cells are held to the identical ceiling, deliberately. |
| `lenses/feature-comparison-matrix.yaml` `cells[].evidence_note` / `exxat_cells[].evidence_note` | 150 | 300 | **new 2026-09-11** — mirrors `ratings[].evidence_note` exactly, on both the competitor and the Exxat side. |
| `domains/*.yaml` `market_sizing.*.basis` (`tam` / `sam` / `som` / `acv`) | 150 | 300 | **new 2026-09-11** with the `market_sizing:` block — one line saying *what a count actually counts* ("ACPE-accredited PharmD programs in the 50 states, excluding candidate status"), not an argument for the number. Same numbers as `ratings[].evidence_note`, the closest analog: a one-line statement of what a figure rests on. If the basis needs a paragraph, the count is really two counts. |
| `domains/*.yaml` `market_sizing.accredited_programs.variance_note` | 200 | 400 | **new 2026-09-11** — written only when `tam` and `accredited_programs` genuinely disagree, and then it carries two clauses (which two numbers differ, and why), so it is sized like `dissection/*.yaml`'s `questions[].gap_note` rather than a one-clause evidence note. |
| `domains/*.yaml` `market_sizing.adjacency.claim` | 150 | 300 | **new 2026-09-11** — the one-line claim that this domain's institutions overlap with disciplines Prism already serves. Same numbers as `market_sizing.*.basis`, and ceilinged for the sharper reason: it is the only field in the block named "claim", the exact shape both incidents at the top of this document were about. The evidence behind it goes in `adjacency.source_id`, not inline. |
| `domains/*.yaml` `org_structure.typical_parent` | 200 | 400 | **new 2026-09-11** — where the domain's programs usually sit inside an institution ("a standalone college of pharmacy reporting to a health-sciences provost"). Two clauses, same ceiling as `variance_note`; the per-institution exceptions belong in `market/programs/*.yaml` rows, not in this generalization. |
| `domains/*.yaml` `org_structure.buying_roles[].note` | 200 | 400 | **new 2026-09-11** — the optional qualifier on one buying role, same numbers as its two siblings above. The role's evidence goes in `org_structure.sources`, not inline in the note. |
| `market/programs/*.yaml` `programs[].notes` | 150 | 300 | **new 2026-09-11** with the family — one line about one program, in a file with hundreds of rows. Same numbers as `market_sizing.*.basis` and for a sharper version of the same reason: anything longer is a finding about the domain, which belongs in `domains/*.yaml` or a lens, not in a registry row. |
| `market/programs/*.yaml` `source_of_record.pii_policy` | 300 | 500 | **new 2026-09-11** — the one paragraph stating what is deliberately not mirrored from the source export and why. Ceilinged higher than the row fields because it is a policy statement read once per file rather than a per-row label, but still a paragraph: the reasoning behind the policy belongs in `ARCHITECTURE.md`. |

Run the check with `python3 scripts/check_content_density.py` from the repo root. A
clean run prints one line; a dirty one lists every offending field with its actual
length. `--warn-only` reports without exiting non-zero, for a quick look mid-edit.

## The pattern for content that's genuinely long

If a field has real material past its soft target, the fix is almost never "write it
shorter" — dense analytical writing about eight disciplines does not compress into 2,000
characters without becoming vague. The fix is **decompose into a list before you write
an essay.**

`journeys/*.yaml`'s `key_findings` array is the working example: instead of one prose
block trying to hold a finding per discipline, each finding is its own
`{subject, headline, severity, detail}` entry. `discipline_notes` (added to
`rotation-lifecycle.yaml` specifically to fix the 13.7k-22.7k-char essay above) is the
same move applied to variance prose: `{subject, detail}` per discipline instead of one
string trying to hold all eight. Both render as a scannable list in the app
(`components/key-finding-list.tsx`, `components/discipline-variance-list.tsx`) instead
of a wall of text with no way to skip to the one discipline a reader actually cares
about.

`personas/discipline-*.yaml`'s `accreditation_pressure` / `current_tools` (converted
2026-08-25 from a single string, up to 4,325 chars with no paragraph breaks) is the same
move for a different axis: N distinct pressure points about ONE persona, glued into one
paragraph, decomposed into `{point, detail}` entries and rendered by
`components/pressure-point-list.tsx` as a headline-per-row list with one real
`Collapsible` per point.

**Before writing a long prose field, ask: is this actually N findings about N different
subjects, glued into one paragraph?** If yes, it's a list. If it's genuinely one
continuous argument about one subject (most of `synthesis/*.md` is this — an argument
someone is meant to read start to finish), a long field is correct and the ceiling table
above doesn't apply to full markdown documents, only to `content/*.yaml` fields that get
rendered inline on a page.

`personas/lens-*.yaml`'s `gaps_prism_can_exploit` (converted 2026-08-26 from a flat
`string[]` of dense competitive arguments) is the same move applied a third time, but
along a different axis than the two above: not "compress a long field" but "separate the
plain-language headline from the evidence it used to carry inline." Each entry becomes
`{claim, detail, related_flows}` — `claim` is the one-sentence wedge a dean could repeat
back, `detail` absorbs the named-competitor/named-pillar citation material the old flat
string mixed into the same sentence.

## Plain-language pass: `jtbd[].job`, `top_pains[].pain`, lens `read`/`gaps` (2026-08-26)

A repo audit found `jtbd[].job` and `top_pains[].pain` had **never been ceilinged at
all** — the two new rows above exist because an unceilinged field, handed rich source
material, will run long every time (the same lesson `key_finding.detail` already taught
this document once). Both fields, plus lens `how_they_implicitly_serve_roles[].read` and
`gaps_prism_can_exploit[].claim`, were rewritten in plain language: the accreditor
element numbers, named-source parentheticals, and embedded statistics these fields used
to carry inline moved to the sibling field that already exists for exactly that —
`evidence_or_rationale` (jtbd), `accreditation_link`/`source` (top_pains), lens
`sources:`/the new `detail` field (lens). Nothing was deleted; the citation trail these
fields ground out to is unchanged, only relocated to where it structurally belongs.

Target register: the sentence a coordinator or dean could say out loud — see
`synthesis/vocabulary-glossary.md`'s entries (e.g. "A lapsed agreement at a site you
already have students rotating through is the most avoidable citation there is") as the
style bar this pass was measured against, not an essay with the jargon trimmed.

The same pass added an optional `related_flows: [{flow, step?, element?}]` field to
these same entries — a navigational cross-reference to the `flows/*.yaml` element(s)
that verify the point (see `ARCHITECTURE.md`'s note on why this isn't an upward
citation). It is genuinely optional: most entries have none, and a fabricated or
weak match is worse than an absent field — see `flows/_TEMPLATE.yaml`'s own
`competitor_equivalent` convention of stating "not comparable" rather than guessing.

## Known allowlisted exceptions

`scripts/check_content_density.py` carries an explicit `ALLOWLIST` — a spot-checked
genuine dense finding is excluded there with a one-line reason and a date, not silently
ignored. Current entry: `rotation-lifecycle--06-midpoint-formative-feedback-early-risk-intervention.yaml`'s
"Availability of a shipped standard instrument to attach a midpoint to" `gap_note`
(4,369 chars) — read in full on 2026-08-25 and confirmed to be a real cross-discipline
synthesis note comparing instrument availability across all eight disciplines in one
element, not a formatting or copy-paste artifact.

## Current backlog (as of 2026-08-25)

`python3 scripts/check_content_density.py` reports remaining FAILs almost entirely in
`flows/rotation-lifecycle--*.yaml` `gap_note` fields (Level 3 element-level research
notes, not individually spot-checked beyond the one allowlisted outlier). This is
tracked here as an explicit, visible backlog rather than silently passing or being
force-trimmed without the same editorial care the `key_finding.detail` and
`discipline_notes` fixes got. Whoever picks this up next: read a sample of the flagged
`gap_note` entries first — several reviewed during the 2026-08-25 pass turned out to be
genuine dense cross-discipline synthesis, not padding, so don't assume they need cutting
rather than allowlisting. `gap_note` does now have a real read-the-rest affordance
(`FieldBlock`'s clamp + "Read full note" `Collapsible`, not just a hover tooltip) as of
2026-08-25 — the remaining FAILs are a content-density backlog, not a rendering gap.

The `personas/discipline-*.yaml` `accreditation_pressure` / `current_tools` FAILs from
the same pass were fixed the same day by decomposing into `{point, detail}` lists (see
the pattern section above) rather than allowlisted — the density was genuinely
excessive for a single string (up to 4,325 chars, no structure) even though it was
already behind a `Collapsible`.

## Scope decision: `positioning-and-element-flows-plan.md`

`synthesis/positioning-and-element-flows-plan.md` is explicitly self-described as
"process record, kept for traceability" — it has no page in `apps/ecosystem/` by design.
This is not a coverage gap; see the note in `ARCHITECTURE.md`'s Level 5b section. Its
sibling `prism-positioning.md` does have a page (`/synthesis/positioning`), because it's
the actual GTM brief per `ARCHITECTURE.md`'s own Level-5b description, not a process doc.

## When you're an agent writing new content/ fields

1. Know which field type you're writing and its ceiling from the table above.
2. If the material genuinely exceeds the soft target, decompose into a list — see
   the pattern above — rather than write past the ceiling and hope.
3. Before declaring the work done, run
   `python3 scripts/check_content_density.py` from the repo root and confirm zero
   unexplained `FAIL`s. This is not optional — see `/CLAUDE.md`.
