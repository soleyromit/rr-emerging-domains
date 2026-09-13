# PRISM Positioning & Element-Level Flow Plan

This is a plan, not yet the execution. It answers three things Romit asked for: (1) how we talk about what PRISM offers, (2) a methodology for user journeys/flows granular enough to know the exact click-by-click flow, and (3) how competitor/gap/accreditation analysis attaches to every flow. Part 4 is a scope decision that needs sign-off before the flows themselves get built — that build is comparable in size to the help-center synthesis workflow already run today.

Grounded in: `prism/capability-map.yaml`, `scorecard/where-to-play.yaml`, `synthesis/gap-analysis.md`, `journeys/*.yaml` (4 existing stage-level journeys, 32 stages total), `accreditation/*.yaml`, `competitors/*.yaml`, and the discipline playbooks + help-center mirror added 2026-08-24.

---

## Part 1 — How We Talk About What PRISM Offers

### The core narrative arc

**Lead domain: DO.** The scorecard is unambiguous (4.40 weighted vs. 4.05 Pharmacy, 3.85 Medicine, 2.75 Dentistry) and for a coherent reason, not an average: DO is the only domain scoring 5 on *both* accreditation pressure and incumbent weakness simultaneously. The story isn't "PRISM is good at everything" — it's **"COCA's 2026 standards ask for exactly what our placement engine already produces, at the exact moment four of the plausible incumbents are in M&A churn."** Pharmacy is the explicit fast-follow (highest pillar-fit ratio of any domain: 4 Transfer/5 Configure/3 Gap), Medicine is the long game (biggest prize, but racing to parity not opening a gap), Dentistry is deferred (structural mismatch, axiUm lock-in).

### Audience segmentation (from `personas/`)

Five personas need five different cuts of the same evidence:
- **Clinical/Experiential Education Coordinator** — the day-to-day buyer/user. Wants: does this replace my spreadsheet, and does it save me the compliance-chasing work.
- **Compliance/Accreditation Liaison** — the standards-fluent skeptic. Wants: standard-by-standard evidence, not feature bullets. This persona reads `accreditation_link` fields, not marketing copy.
- **Dean / Assistant Dean for Clinical Education** — the budget owner. Wants: risk reduction (citation avoidance) and the competitive-migration story (why now, why us).
- **Preceptor / Site Faculty** — the lowest-tolerance user (gap-analysis Pattern J: no dedicated access story in 3/4 domains today). Wants: doesn't want to create an account for a five-minute eval.
- **Student** — indirect buyer, direct daily user. Wants: doesn't come up much in accreditor-facing sales conversations but matters for retention/reference.

### Message architecture — three tiers, and never blur them

1. **Category claim** (safe everywhere): "PRISM is the system of record for clinical/experiential education — placements, compliance, curriculum mapping, all anchored to the rotation, not the calendar."
2. **Pillar proof point** (cite the shipped/roadmap status from `capability-map.yaml` every time): "Compliance Management already gates placement start on student, site, contract, *and* preceptor-license status" — say "already" only for `status: shipped`.
3. **Standard-citable claim** (only where `journeys/*.yaml` rates it Transfer or a real Configure, never Gap): "our anchor-relative scheduling primitive maps almost one-to-one onto LCME 9.7's midpoint-feedback requirement" — this is the highest-trust claim type because it's a direct standard citation, and it's also the easiest to get pulled up on in a demo if the underlying feature isn't actually wired the way the claim implies. This is exactly why Part 2 exists: journeys assert Transfer/Configure at *stage* granularity; nobody has verified it at *screen* granularity yet.

### Positioning by competitive stage (pulled straight from `rotation-lifecycle.yaml`, which already did stage-by-stage competitor verdicts)

| Stage | Verdict | Lead line |
|---|---|---|
| 3. Compliance clearance gate | **Lead with this** | Elentra has no compliance page at all; one45's only compliance-adjacent feature is duty-hours. This is the wedge against both. |
| 6. Midpoint feedback | **Lead with this** | Nobody else is documented doing anchor-relative scheduling of the trigger *or* tracking midpoint-delivery compliance as a reportable figure — that reportable is a small build with a standard citation attached (LCME 9.7). |
| 1. Site/contract lifecycle | **Behind, name it, fix it** *(see correction below)* | ~~CORE ELMS and eMedley both ship this; the smallest build that flips ACPE 3.5.b from Gap to Transfer.~~ Prism ships a site-scoped Contract object too; the remaining shortfall is the scheduling block, not the contract record. |
| 2. Preceptor credentialing | **Conditional lead** | Genuine asset *if* the preceptor-as-entity extension exists — otherwise it's a claim we can't demo. Verify before using in a pitch (see Part 2). |
| 4. Placement allocation | **Do not lead with this** | Every serious competitor ships an allocation algorithm (CORE's SmartMatch, one45's three lottery types, Elentra's lottery). Our counter is the anchor-relative primitive itself ("unmatched on what happens once the schedule exists"), not the allocation step. |
| 7. Evaluation half | **Concede, redirect** *(see correction below)* | ~~Six competitors ship surveys/evaluations today; ours is Q1 2027.~~ Redirect to the completion-verification half (LCME 8.6, rated Transfer, "the strongest fit of any standard"). |
| 8. Post-rotation rollup | **Do not claim, roadmap only** | The unanimous, largest gap in the corpus. MedHub/E*Value's Accreditation Automation product is named and specific. If this comes up, the honest answer is Q3 2027 roadmap, scoped four-accreditor-native — which is itself a differentiated claim (nobody has full COCA+ACPE+CODA coverage), but it is a roadmap claim, not a shipped one. |

**CORRECTION (2026-08-26), per direct Exxat PM confirmation:** row 7's "ours is Q1 2027" is now out of date. `content/prism/capability-map.yaml`'s Surveys & Course Evaluations pillar is `status: shipped` — a placement-evaluation Forms engine (CIET v2, PTSE1/2, SCIPAI, PTMACS/PTAMACS and similar named instruments) plus a separate general-purpose "Exxat Surveys" builder (14 question types, multi-channel distribution, full analytics; already extended to PT and SLP). The stage-7 verdict changes from **Concede, redirect** to something closer to **Lead with parity, not superiority**: Surveys is shipped, so "concede" is no longer accurate, but there is no evidence yet of competitive depth parity against the six named competitors (Elentra, one45, eMedley/eValuate+, Leo, MedHub/E\*Value, CORE ELMS) — so do not claim Prism wins this stage, only that it is no longer absent from it. This correction is scoped to row 7 (Surveys & Course Evaluations) only; row 8 (Accreditation Management, Q3 2027) is unaffected and remains accurate as written.

**CORRECTION (2026-09-13):** row 1's verdict is out of date too. Element-level verification of the Contracts object under Sites — expiry auto-notifications, cross-site linking, routing checklist, template generation, institutional rollup, and a Contract Status column on the Placement Clearance Dashboard — showed Prism already ships this category of function, and the ACPE accreditation record's 3.5.b rating was corrected from **Gap** to **Configure** on 2026-09-10 on that evidence. Row 1 therefore reads closer to **parity with one honest caveat** than to "behind": what remains is whether an expiring contract hard-blocks new scheduling at that site or only flags it — which no competitor's public documentation resolves in either direction either. Do not use the struck-through lead line in a pitch: it asserts a gap that is already closed, in a room where the customer may have the feature on screen.

### Guardrails

- Never claim a Q1/Q2/Q3 2027 roadmap pillar as shipped. `capability-map.yaml`'s `status` field is the single source of truth for this — check it before every external claim, not just once.
- The COCA standards PDF prohibits submitting COCA-owned content into AI platforms without written permission (flagged in `accreditation/coca.yaml`'s header and the scorecard's closing caveat). Clear with Legal before any COCA standard language goes into customer-facing messaging, including AI-assisted drafting of that messaging.
- "Configure" is not "shipped" — it's "the right shipped pillar exists, gated on an unconfirmed extension." Sales-safe language distinguishes these; the gap-analysis and journey files are explicit about which is which and should not get flattened in translation.

### Where this plan doesn't go

This plan does not write the actual pitch deck, one-pagers, or battlecards — that's Ruchi's GTM track (`70-GTM-with-Ruchi` in the vault, human-owned) and should be built *from* this narrative, not instead of it. What this section provides is the narrative spine and the claim-safety rules; the GTM artifacts are a separate, human-led next step.

---

## Part 2 — Element-Level Flow Methodology

### Why stage-level isn't enough

The four existing journeys (`journeys/*.yaml`) are excellent at the *comparative* story — "here's how DO/Pharmacy/Dentistry/Medicine would each hit this stage differently, and how competitors compare." But they're written at stage granularity ("Placement allocation, scheduling & capacity balancing" is one stage covering an entire sub-product), and their `current_state_in_prism` claims are sourced from `capability-map.yaml`'s pillar-level descriptions — which is itself a synthesis, not a screen-by-screen trace. Nobody has yet verified, screen by screen, that a specific accreditation-citable claim ("gates on preceptor license status") is actually wired the way the claim implies, versus being an aspirational reading of a feature name.

As of today that verification is newly possible and newly cheap: the help-center mirror (`99-Assets/documents/Exxat-Help-Guides/`, 322 files) and the discipline playbooks document *actual* screens, fields, button labels, and navigation paths (e.g. "Sites > Reports > SCPE Details," "Placements > Course > Placement Clearance Dashboard"). Element-level flows are the artifact that turns that raw documentation into a verifiable, citable ground truth — and they let a sales engineer demo the exact claim, not a paraphrase of it.

### New artifact type: `content/flows/*.yaml`

Distinct from `content/journeys/*.yaml`. Journeys are the cross-domain comparative narrative; flows are the single-product ground truth journeys cite. Proposed schema (extends the journey template's spirit, adds element granularity):

```yaml
flow_name: "e.g. 'Placement Clearance Gate'"
maps_to_journey: "rotation-lifecycle.yaml, stage 3"   # every flow traces back to a journey stage
persona: "who performs this flow"
steps:
  - screen: "e.g. 'Placement Clearance Dashboard'"
    navigation_path: "Placements > Course > Placement Clearance Dashboard"
    elements:
      - element: "Compliance status column"
        type: "read-only rollup"
        data_shown: "e.g. 'Some Action Needed / All Docs Approved / Not Applicable'"
      - element: "Contract status column"
        type: "read-only rollup"
        gates_on: ["active contract", "student compliance", "site documents"]
    action: "what the user does at this screen"
    confirmed_by: "exact source file(s) — a help-center path or discipline-playbook citation, not a paraphrase"
    accreditation_citation: "standard ID(s), if this screen is where evidence for that standard actually lives"
    competitor_equivalent: "what the named competitor's equivalent screen/feature does, if documented"
    gap_severity: "none | cosmetic | configure-needed | gap"
    gap_note: ""
sources: []
last_verified: ""
```

Key discipline this format enforces: **every claim in `accreditation_citation` and `competitor_equivalent` must trace to a `confirmed_by` source file** — no re-deriving from the stage-level journey narrative, which would just be citing our own synthesis as if it were ground truth.

### How this changes the three analyses

- **Competitor analysis** moves from "CORE ELMS ships SmartMatch" (feature-existence, stage-level) to "at this exact screen, CORE's equivalent does X, ours does Y" — only where a competitor's public docs are granular enough to support it (most aren't; competitor docs are mostly feature-level, so this will often stay stage-level by necessity, flagged as such rather than faked).
- **Gap analysis** moves from "Configure, pending confirmation" (the current hedge language littered through `journeys/*.yaml`) to a resolved yes/no per screen, because the help-center docs now exist to resolve most of those hedges.
- **Accreditation analysis** moves from "this pillar plausibly produces this evidence" to "this exact screen/report is the evidence" — which is also what turns a sales conversation into a demo script.

---

## Part 3 — Prioritized Flow List

Not "every flow" on day one — the existing 32 stages across 4 journeys is already the exhaustive stage-level map; element-level treatment of all 32 is a multi-week effort. Priority order, weighted toward (a) the DO beachhead, (b) stages `rotation-lifecycle.yaml` already flags as highest-leverage (strongest lead claims and biggest confirmed gaps), and (c) where the new help-center source material is richest:

1. **Placement Clearance Gate** (rotation-lifecycle stage 3) — our strongest lead claim; verify it element-by-element before anyone repeats it in a pitch. Source is rich (`Placement Clearance Dashboard.md`, `Placement Clearance requirements` sections across three discipline playbooks).
2. **Midpoint Formative Feedback & Forms/Evaluations Distribution** (rotation-lifecycle stage 6) — the flagship anchor-relative-scheduling claim; same urgency, same reason.
3. **Placement Allocation / Placement Assist / Wishlist** (rotation-lifecycle stage 4) — our weakest competitive stage on a shipped pillar; element-level detail tells us exactly how much of "Advanced Options in Placement Assist" closes the gap vs. how much is still manual, which is a real product-roadmap input, not just a messaging exercise.
4. **Contract & Affiliation Agreement Lifecycle** (rotation-lifecycle stage 1) — ACPE's one outright Gap rating in the whole corpus; smallest build that flips it, per the journey's own recommendation — element detail tells us exactly what "smallest" means.
5. **Preceptor Credentialing & Site Sharing** (preceptor-site-onboarding stages 3–4) — the "conditional lead" flagged in Part 1; needs verification before it's usable in a pitch at all.
6. **Curriculum Mapping → Standards Crosswalk** (competency-verification stage 1, accreditation-self-study stage 4) — backbone of how Accreditation Management (Q3 2027) should be scoped; element detail here is a product-planning input as much as a sales one.

Deferred for now: stages 7–8 of accreditation-self-study and rotation-lifecycle (post-rotation rollup, self-study assembly) — these are roadmap-stage (Q3 2027 unbuilt), so there's no current-product screen to trace yet. Element-level treatment there is a "spec the roadmap pillar precisely" exercise, not a "verify what exists" exercise — different kind of work, worth doing later but shouldn't consume the same pass.

---

## Part 4 — Execution Plan (needs sign-off before running)

- **Format:** one `content/flows/*.yaml` file per item above, six files.
- **Sourcing:** primarily the existing help-center mirror and discipline playbooks — no new external research needed, which is why this is tractable now and wasn't before today.
- **Mechanism:** comparable in shape to today's exhaustive-synthesis workflow — likely a multi-agent workflow (one agent per flow doing the element-level trace + gap/accreditation/competitor tagging, then a single writer pass to keep the schema consistent and cross-link back into `journeys/*.yaml` where a flow resolves a hedge like "unconfirmed").
- **Open scope questions for Romit:**
  1. Confirm the six flows above, or reorder/trim.
  2. Should flows also re-verify and tighten the *existing* journey stages' hedged language ("unconfirmed," "pending confirmation") as a side effect, updating `journeys/*.yaml` in place? (Recommended — it's a natural byproduct and keeps the two artifact types from drifting apart.)
  3. Should Part 1's messaging narrative get built out into an actual positioning one-pager now, or wait until the element-level flows land (since several Part 1 claims are exactly what Part 2 exists to verify)?
