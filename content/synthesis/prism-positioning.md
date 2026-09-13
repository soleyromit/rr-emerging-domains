# How We Talk About What PRISM Offers

A positioning brief, not a research document — every claim here is downstream of `journeys/*.yaml` (now element-verified via `flows/*.yaml`), `prism/capability-map.yaml`, and `scorecard/where-to-play.yaml`. Built for Ruchi's GTM track and for anyone taking a PRISM conversation into a room. Re-check a claim against its source file before using it externally; this brief will drift out of date as those files keep moving and should be treated as a snapshot, not a script to memorize.

## The one-sentence version

**PRISM is the system of record for clinical/experiential education, and ACPE's Standards 2025 + PHARMS transition asks every pharmacy program to re-prove itself in the same cycle our placement engine already covers most of that evidence for — Pharmacy is the confirmed first domain in market, with DO's COCA-driven case (below) as the close analytical second.**

> **ADDED 2026-09-10, per stakeholder direction:** Pharmacy is the confirmed first
> GTM target, ahead of DO. This overrides the scorecard's own analytical
> recommendation, not the research behind it — the weighted math below (DO 4.40 vs.
> Pharmacy 4.05) is real and unedited; the actual go-to-market sequencing is a
> business call made for reasons outside that weighted model. Per
> `ARCHITECTURE.md`, this is an annotation on top of the existing analysis, not a
> rewrite of it — DO's case is left intact below for anyone building the DO
> fast-follow pitch once Pharmacy is in market.

## Lead domain: Pharmacy (confirmed) — DO is the scorecard's analytical pick

**Pharmacy is the domain actually being taken to market first.** Its own case, independent of the override: highest Prism pillar-fit ratio of the four domains scored on the where-to-play scorecard, not of every accreditor researched (4 Transfer / 13 Configure / 3 Gap across 20 researched ACPE elements — the smallest real build of the four, updated 2026-09-10 from an earlier 12-element pass; split re-counted 2026-09-13 directly from `accreditation/acpe.yaml`, which was off by one in the Configure and Gap columns), a live switching-cost window as ACPE retired AAMS for its own PHARMS submission platform in the same cycle Standards 2025 took effect, and the second-highest weighted score (4.05, 0.35 behind DO) on the scorecard itself.

**DO's case is real and still the scorecard's own top pick (4.40 weighted vs. Pharmacy 4.05, Medicine 3.85, Dentistry 2.75, `scorecard/where-to-play.yaml`)** — worth knowing for the DO fast-follow pitch once Pharmacy is in market. It's the only domain scoring 5/5 on both accreditation pressure *and* incumbent weakness simultaneously:

- **Accreditation pressure:** COCA's 2026 standards (effective July 1, 2026) demand computed evidence, not documents — a 3-year rolling capacity average per site (6.9), explicitly "system-generated" per-student DO-supervision/GME-resident/inpatient proof (6.10), cross-site statistical comparability (6.11) — layered on bright-line public thresholds that auto-escalate to out-of-compliance after three years.
- **Incumbent weakness:** four of the plausible DO incumbents have changed hands since 2023 (New Innovations → QGenda, July 2025; Leo/DaVinci → Elentra under Achieve Partners, with Elentra now publicly courting Leo customers to migrate; MedHub/E*Value → Ascend Learning) — a platform conversation many COMs did not initiate. And the two strongest curriculum/accreditation players in the segment, Elentra and Leo, ship **no compliance module at all**.

Medicine is the long game (biggest prize, but racing to parity, not opening a gap), Dentistry is deferred (axiUm's combined EHR/billing/gradebook lock-in makes displacement impractical; CODA's procedure-level logging requirement is the single largest domain-specific build in the set).

## Who's in the room, and what they each actually want

| Persona | What they want from the conversation |
|---|---|
| **Clinical/Experiential Education Coordinator** | Does this replace my spreadsheet, and does it stop me from manually chasing compliance documents. |
| **Compliance/Accreditation Liaison** | Standard-by-standard evidence, not feature bullets — this is the person who will ask "show me the exact screen" mid-pitch. |
| **Dean / Assistant Dean for Clinical Ed** | Risk reduction (citation avoidance) and the "why now, why us" competitive-migration story. |
| **Preceptor / Site Faculty** | Doesn't want to create an account for a five-minute evaluation — the lowest-tolerance user, and the one with the thinnest access story today (`gap-analysis.md` Pattern J). |
| **Student** | Rarely the deal, but matters for retention/reference once live. |

## The claim architecture — three tiers, never blur them

1. **Category claim** (safe anywhere): "PRISM is the system of record for clinical/experiential education — placements, compliance, curriculum mapping, all anchored to the rotation, not the calendar."
2. **Pillar proof point** (check `capability-map.yaml`'s `status` field *every time*, not from memory): "Compliance Management already gates placement start on student, site, contract, *and* preceptor-license status." Say "already" only for `status: shipped`.
3. **Standard-citable claim** (only where a `journeys/*.yaml` stage — now element-verified — rates Transfer or a real Configure, never Gap): these are the highest-trust, highest-risk claims, because they invite "show me." Every one below has now been checked against an actual screen, not just a pillar description.

## Verified lead / concede map (rotation lifecycle — the core journey)

This table changed meaningfully after this week's element-level verification pass — several claims that were previously "real but conditional" are now confirmed, and one gained a sharper caveat.

| Stage | Verdict | What changed after element-level verification | Lead line |
|---|---|---|---|
| **3. Compliance clearance gate** | **Lead** | Strengthened, not softened. Attestations confirmed as a real shipped item type (checkbox, signed audit trail, distinct from document upload); the item taxonomy confirmed configurable-not-fixed. | "Elentra has no dedicated compliance page at all; one45's only compliance-adjacent feature is duty-hours tracking. This is our clearest wedge against both — and now it's verified screen by screen, not just described." |
| **2. Preceptor credentialing** | **Lead** (upgraded from "conditional") | The gate on this claim used to be "only a lead *if* the preceptor-as-entity extension actually exists." It does: Sites > Personnel is a confirmed first-class preceptor entity, the Placement Clearance Dashboard carries dedicated CV/License/Certification columns, and a separate Faculty Compliance module now ships. **Caveat to carry into the pitch:** the credential check is a monitoring view a human reads, not yet a system-enforced block at the point of assigning a student to a preceptor — don't overclaim a hard stop that doesn't exist yet. | "New Innovations and MedHub both ship credentialing modules, but Elentra, one45, and Leo don't. Ours is real and demoable today — with the honest caveat that it's a dashboard you check, not (yet) a block that stops you." |
| **6. Midpoint formative feedback** | **Lead** | Unchanged by verification — it was already the cleanest fit in the corpus and held up. | "Nobody else is documented scheduling the feedback trigger relative to the rotation's own dates, and nobody tracks midpoint-delivery *compliance* as a reportable figure — which is literally what LCME 9.7 asks a program to prove." |
| **4. Placement allocation** | **Do not lead** | Verification found the anchor-relative architecture runs deeper than previously credited, but the allocation *algorithm* gap itself is unchanged — every serious competitor (CORE's SmartMatch, one45's three lottery types, Elentra's lottery) ships one. | Redirect to what happens after the schedule exists, not how it gets built. |
| **1. Contract/affiliation-agreement lifecycle** | **Lead with parity, carry the caveat** (corrected 2026-09-13, was "Behind, name it, fix it") | Reversed by element-level verification: the ACPE accreditation record's 3.5.b rating was corrected from **Gap** to **Configure** on 2026-09-10, because a site-scoped Contract object ships today — expiry auto-notifications, one agreement linked across many locations, routing checklist, template generation, institutional rollup, and a Contract Status column on the Placement Clearance Dashboard. What remains open is narrower: whether an expiring contract hard-blocks new scheduling at that site or only flags it. | "Contracts are a first-class site object here — expiry alerts, one agreement linked across a whole health system, contract status surfaced on the clearance dashboard. Same honest caveat as preceptor credentialing: today that status is a flag you read, not a block that stops you." |
| **7. Evaluation half** | **Concede, redirect** | Unchanged — six competitors ship surveys/evaluations today; ours (Exxat Surveys) is real but general-purpose and unproven at accreditor-citation depth yet. | Redirect to completion-verification (LCME 8.6, rated Transfer, "the strongest fit of any standard in the corpus"). |
| **8. Post-rotation rollup / accreditation evidence** | **Do not claim, roadmap only** | Verification made the gap sharper, not softer: an exhaustive keyword search across all 322 help-center articles and every discipline playbook found zero mentions of NBOME/COMLEX/NAPLEX/USMLE or any exam-ingestion feature, and the student record's own Status field has no state beyond "Graduate" — nowhere for a licensure result to even live if it existed. | If this comes up, the honest answer is Q3 2027, scoped four-accreditor-native (a differentiated claim nobody else can make) — but say "roadmap," not "ships." |

## Guardrails — non-negotiable

1. **Never claim a roadmap pillar as shipped.** `capability-map.yaml`'s `status` field is the single source of truth. Check it before every external claim — not just once, since it moves as research updates it.
2. **"Configure" is not "shipped."** It means the right pillar exists but is gated on an extension that may or may not be built yet for a specific new-domain use case. Collapsing this distinction in a pitch is how a claim gets disproven live in a demo.
3. **The COCA standards PDF prohibits submitting COCA-owned content into AI platforms without written permission** (flagged in `accreditation/coca.yaml`'s header). Clear with Legal before any COCA standard language — including AI-assisted drafting of messaging that quotes it — goes customer-facing.
4. **A "lead" claim earns that status from an element-level flow file, not from a pillar description.** If someone wants to add a new claim to the lead list above, the bar is the same one this table just went through: find or write the `flows/*.yaml` trace first.

## What this document is not

It is not the pitch deck, one-pager for prospects, or battlecard — those are Ruchi's GTM-track artifacts (`70-GTM-with-Ruchi` in the vault, human-owned) and should be built *from* this narrative. This document is the narrative spine and the claim-safety rules underneath them.

---
*Sources: `journeys/rotation-lifecycle.yaml` (element-verified 2026-08-24), `flows/rotation-lifecycle--0{1,2,3,4,6,7,8}-*.yaml`, `prism/capability-map.yaml`, `scorecard/where-to-play.yaml`, `synthesis/gap-analysis.md`, `synthesis/positioning-and-element-flows-plan.md` (Part 1 draft this supersedes with verified claims).*
*Last updated: 2026-08-24.*
