# Pharmacy: Product & GTM summary

*For: PMs and executives. Every figure below cites a source file — see the link at the end of each claim. Full context: [`../gap-analysis.md`](../gap-analysis.md), [`../prism-positioning.md`](../prism-positioning.md).*

## A. Market summary

**Market:** 142 ACPE-accredited PharmD programs in the U.S. as of 2022, up from 78 in 2000 — the largest program count of the four domains this repo tracks, but the only shrinking one. PharmD applicant volume fell over 60% from 106,815 (fall 2011) to 40,552 (fall 2021); enrollment slid from 44,403 (2023) to 42,312 (2024); University of Charleston's program closed in Dec 2024 citing declining enrollment. Applications have risen two years running since (+6% fall 2024→2025), so the read is stabilization, not growth. *(`domains/pharmacy.yaml`, `scorecard/where-to-play.yaml`)*

**Where Pharmacy ranks:** Second of four on Prism's own *weighted* scorecard — DO 4.40, **Pharmacy 4.05**, Medicine 3.85, Dentistry 2.75. Pharmacy scores 5/5 (highest of any domain) on pillar fit — but only 3/5 on incumbent weakness, because CORE ELMS holds a hard incumbency. `scorecard/where-to-play.yaml` names Pharmacy explicitly as *"the close second and the natural fast-follow"* to DO in that weighted math.

> **ADDED 2026-09-10, per stakeholder direction:** despite the weighted ranking above,
> Pharmacy is the confirmed first domain actually going to market — a business
> sequencing call made for reasons outside the weighted model, not a correction to it.
> See [`synthesis/prism-positioning.md`](../prism-positioning.md) for the full override
> note. *(`scorecard/where-to-play.yaml`)*

> **Citation discrepancy worth fixing at the source:** `scorecard/where-to-play.yaml`, `synthesis/gap-analysis.md`, and `personas/discipline-pharmacy.yaml` all describe the ACPE pillar-fit split as "4 Transfer / 5 Configure / 3 Gap." Counting `accreditation/acpe.yaml`'s own 12 standards entries directly gives **4 Transfer / 6 Configure / 2 Gap** instead. This doc uses the ground-truth file's actual count; the downstream synthesis docs should be corrected to match, per `ARCHITECTURE.md`'s own rule that a lower layer is annotated, not silently overridden by an upper one.

**Why now:** ACPE's Standards 2025 (effective for evaluations from fall 2025, superseding Standards 2016) landed in the same cycle ACPE retired AACP's AAMS platform for its own submission system, PHARMS — every accredited program has to re-map its evidence and re-learn where it's submitted, regardless of which vendor they're on. That's the moment switching cost looks smallest. *(`personas/discipline-pharmacy.yaml`, "switching_trigger")*

**Beachhead targets:** Not sourced. No named pharmacy programs, contacts, or fit scores exist in this repo's research — that list would need real outreach/qualification work, not a template fill.

**Where we win:** Highest pillar-fit ratio of any domain assessed — the one-to-one licensed-pharmacist preceptor model maps directly onto Prism's existing student-preceptor-placement data model, and the 2:1 ratio cap (3.3.e) is "a query against existing assignment data, not new architecture." *(`accreditation/acpe.yaml`, element 3.3.e)*

## B. Competitive positioning

**Positioning statement:** Prism is the system of record for clinical/experiential education; ACPE's Standards 2025 + PHARMS transition asks every program to re-prove itself in the same cycle Prism's placement engine already covers most of that evidence. *(adapted from `synthesis/prism-positioning.md`)*

**The incumbent: CORE ELMS.** Claims 90% of U.S. pharmacy programs, rated 4.7/5 overall on Capterra (4.9/5 customer service) — a hard incumbency, not a soft one. Its own reviewers call out a "reporting suite [that] lacks depth and consistency," modules that "seem disjointed," and a steep learning curve. Pricing is quote-only; no public tiers. *(`competitors/core-elms.yaml`)*

**Feature comparison** (Prism vs. CORE ELMS, the only pharmacy-relevant teardown in this repo):

| Capability | Prism | CORE ELMS |
|---|---|---|
| Clinical & Experiential Education (placement engine) | Shipped | Shipped — "at parity" |
| Compliance Management (student-item gating) | Shipped | Shipped — "at parity" |
| Curriculum Mapping | Shipped | Shipped via CompMS add-on — rated "ahead" (bundling/pricing unconfirmed) |
| Surveys & Course Evaluations | Roadmap Q1 2027 | Shipped today — "ahead" |
| Exam Management | Roadmap Q2 2027 | No public evidence of this capability — "unknown," not "ahead" |
| Accreditation Management (standards-mapped evidence aggregation) | Roadmap Q3 2027 | Shipped via CompMS, explicit ACPE claim — "ahead" |

*(`competitors/core-elms.yaml`, feature_teardown)*

**The opening:** CORE's own users name the exact wedge — reporting depth and platform cohesion. E\*Value and Leo/DaVinci also serve pharmacy but without a pharmacy-specific teardown in this repo yet. Two more pharmacy vendors were added 2026-09-09 with deliberately thin, one-to-two-fact teardowns rather than a full one: **PharmAcademic** (McCreadie Group) and **RxPreceptor**. *(`competitors/core-elms.yaml`, "exxat_opportunity"; `competitors/e-value.yaml`, `competitors/leo-davinci.yaml`, `competitors/pharmacademic.yaml`, `competitors/rxpreceptor.yaml`, domains_served)*

> **ADDENDUM (2026-09-09) — corroborating and complicating evidence on the incumbency picture.** Nothing in section B above is retracted; the following is added beside it.
>
> - **CORE's incumbency corroborated from a second, independent direction.** Exxat's own internal competitor-review deck (Aug 2026) estimates CORE ELMS/PeopleGrove at ~98% of pharmacy programs — 750+ programs at roughly $200/student. That is a higher number than the "CORE claims 90%" figure above, from a source with the opposite incentive to inflate it, so read the two as corroborating rather than conflicting: the incumbency is at least as hard as this doc already says. *(Exxat internal competitor-review deck, Aug 2026, Google Drive)*
> - **Exxat's own internal posture on Pharmacy is "supports," not "primary market."** The same deck marks Pharmacy "✓ supports" while reserving "★ primary market" for PT/OT/PA only. *(Exxat internal competitor-review deck, Aug 2026, Google Drive)*
> - **The client base is near-zero today.** Exxat's internal client-tracking spreadsheet shows 2 of ~97 tracked pharmacy programs as current Exxat clients: University of the Pacific and Belmont University. *(Exxat internal client-tracking spreadsheet, Google Drive)*
> - **External proof is thin too.** Exxat has zero reviews on G2 ("not enough reviews to provide buying insight"), and no Capterra or TrustRadius listing was found — against CORE ELMS's 36 Capterra reviews at 4.7/5 cited above. *(https://www.g2.com/sellers/exxat)*
> - **Pharmacy is not on Exxat's own homepage.** exxat.com lists Nursing, Social Work, Counseling, Teacher Education, PT, PA, OT, SLP, Athletic Training, Public Health and Nutrition — Pharmacy is absent. A pharmacy buyer checking the vendor's own site finds no evidence the vendor serves them. *(https://exxat.com/)*
>
> Taken together these do not change the wedge (reporting depth, platform cohesion); they change the starting position it is argued from. Pharmacy entry is a cold start against a ~98%-held market, from a vendor that does not currently name the discipline publicly and carries no third-party review footprint to point at.

## C. Go-to-market sequencing

> **ADDED 2026-09-10:** Pharmacy is now the confirmed first domain in market — the
> "fast-follow after DO" framing below describes the scorecard's original analytical
> sequencing, superseded by the stakeholder override. Left as written for the record.

This repo's research establishes *strategic sequencing*, not a dated rollout plan: Pharmacy is positioned as the fast-follow after DO, timed to ACPE's Standards 2025 + PHARMS transition window rather than a fixed calendar date. **A phase-by-phase roadmap with dates and named beachhead-program targets does not exist in this research** and isn't invented here — that's a GTM-team deliverable, best built once DO's roadmap (the actual lead domain) sets the template and timing. *(`scorecard/where-to-play.yaml`, `synthesis/prism-positioning.md`)*

**Reachability, for when that plan gets built:** 142 colleges are overwhelmingly at regional publics and privates that already run the nursing and allied-health programs Prism serves today — E\*Value explicitly bundles pharmacy alongside PT/OT/PA — so the warm-intro path is short even at a CORE-held account. *(`scorecard/where-to-play.yaml`, "Reachability" row)*

## D. Revenue model

**Not sourced in this repo.** Neither Prism's own pharmacy-specific pricing nor CORE ELMS's pricing (confirmed "not publicly disclosed... quote-only") is documented here. Filling in tiers, ARR targets, or CAC assumptions would mean inventing numbers with no basis in the research — that's a finance/product-team exercise, not something this doc fabricates. *(`competitors/core-elms.yaml`, "pricing_signal")*

## E. Key personas

Full detail: [DESIGN.md](./DESIGN.md). Summary:

- **Dean / Program Director** — approves the ed-tech budget roughly once every 5–7 years, usually triggered by an accreditation cycle. Top pain: metrics they're judged on (NAPLEX pass rate) are computed outside any system and reported late, with no shipped pillar ingesting licensure-exam results. *(`personas/role-dean.yaml`)*
- **Compliance / Accreditation Liaison** — rebuilds the standards-to-evidence crosswalk by hand every cycle; no shipped pillar maps program evidence to named ACPE elements. *(`personas/role-compliance-accreditation-liaison.yaml`)*
- **Clinical / Experiential Education Coordinator** — in Pharmacy specifically, sequences 300 IPPE hours across two didactic years then builds a coursework-free fourth year of 6–7 APPE blocks per student; site/preceptor capacity is the structural bottleneck. *(`personas/role-clinical-coordinator.yaml`)*
- **Preceptor** — the lowest-tolerance user, with the thinnest access story of any role today. *(`synthesis/gap-analysis.md`, Pattern J)*

*Note: this repo's actual role taxonomy is Dean, Compliance Liaison, Clinical Coordinator, Program Administrator, and Preceptor — not the generic "Program Director / Faculty / Student / Site Coordinator" set some external templates assume. No Faculty- or Student-specific persona file exists yet for Pharmacy.*

## F. What to measure

No numeric targets are sourced for Pharmacy specifically, but the research points at what would matter if this domain is pursued:

- Whether the standards-to-evidence crosswalk (currently manual, rebuilt every ACPE cycle) can be shortened — the single most-cited liaison pain. *(`personas/role-compliance-accreditation-liaison.yaml`)*
- Whether the 2:1 preceptor ratio check and four-required-setting graduation clearance can run as real-time constraints instead of after-the-fact reports. *(`personas/discipline-pharmacy.yaml`, jtbd)*
- Whichever DO beachhead metrics get defined first — Pharmacy's fast-follow positioning means its own success metrics should track that template once it exists, not be defined independently. **(Superseded 2026-09-10: Pharmacy is now first in market, so this dependency runs the other way in practice — noted here, not rewritten.)** *(`synthesis/prism-positioning.md`)*
