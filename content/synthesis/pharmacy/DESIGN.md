# Pharmacy: Design reference

*For: designers. Full traceability: every persona pain links to an accreditation element and (where verified) a `flows/` file. Source: `personas/discipline-pharmacy.yaml`, `accreditation/acpe.yaml`, cross-cutting `personas/role-*.yaml`.*

## A. Personas at a glance

| Persona | Current pain (#1) | Prism angle | Design implication |
|---|---|---|---|
| **Dean / Program Director** | Judged on NAPLEX pass rates computed outside any system, reported late — no shipped pillar ingests licensure-exam results | Not a screen user; needs the rollup, not the workflow | Board-exam/licensure ingestion is an *unshipped roadmap pillar* (Q2 2027) — nothing to design against yet, only to scope |
| **Compliance / Accreditation Liaison** | Rebuilds the ACPE standards-to-evidence crosswalk by hand every cycle in Word/Excel/a shared drive | The single most load-bearing Gap in the whole element set | Accreditation Management (Standard 7.5.b) — genuinely new UI, no existing pillar to extend |
| **Clinical / Experiential Education Coordinator** | Sequences 300 IPPE hours across 2 years, then builds a coursework-free 4th year of 6–7 APPE blocks/student; site/preceptor capacity is the structural bottleneck | Closest persona to Prism's existing placement-engine users | Hour-category configuration + preceptor ratio/eligibility gating (both Configure, not build) |
| **Preceptor** | Lowest-tolerance user in the product; thinnest access story of any role today (repo-wide, not pharmacy-specific) | One-to-one licensed-pharmacist model — Prism's data model already fits | Access/onboarding friction is the design risk, not the data model |

*(`personas/role-dean.yaml`, `personas/role-compliance-accreditation-liaison.yaml`, `personas/role-clinical-coordinator.yaml`, `synthesis/gap-analysis.md` Pattern J)*

**Key insight:** every pillar-fit "Gap" in ACPE traces to the same two people — the Compliance/Accreditation Liaison (standards-to-evidence mapping) and the Dean (post-graduation outcome ingestion) — while the Clinical Coordinator's pains are almost entirely Configure-not-build. Design effort for Pharmacy is concentrated at the top of the org chart, not the day-to-day placement workflow.

## B. Domain persona journey — the Enrollment-Squeezed ACPE Program

*This repo's per-domain persona is one archetype (a program, not an individual) rather than a per-role journey — see `personas/_TEMPLATE_discipline.yaml`. Full text below is copied, not summarized, per the source file.*

**Archetype:** A mid-sized ACPE-accredited PharmD program absorbing the post-growth-era correction — one of 142 U.S. programs, expanded during 2000–2022 growth, now navigating a >60% applicant decline (2011–2021) with two years of tentative recovery. Its experiential-education team (an Experiential Director, one or two IPPE/APPE coordinators, an Assessment/Accreditation lead wearing a second hat) owns hundreds of sites, hundreds of preceptors, and a graduation-gating hour count for every student.

**Jobs to be done** (each cites a specific ACPE element and, where verified, a `flows/` file):

1. **Per-student, per-category hour ledger** — a site-visit-ready answer to "show me this student's evidence" in seconds, not weeks of spreadsheet reconciliation. *(Standard 3.1.b → `flows/accreditation-self-study--02-continuous-student-level-clinical-evidence-capture.yaml`, "Course Setup — Timesheet Categorization")*
2. **Live preceptor capacity/eligibility at assignment time** — the 2:1 ratio and license/orientation checks enforced the moment a student is placed, not after. *(Standard 3.3.e → `flows/preceptor-site-onboarding--06-student-assignment-ratio-capacity-and-eligibility.yaml`, "Max Placement Limit (Slot Cap)")*
3. **Curriculum mapped to the current outcome taxonomy** with coverage gaps surfaced, exportable into PHARMS rather than rebuilt by hand. *(Standard 2.2.d → `flows/accreditation-self-study--04-curriculum-competency-coverage-mapping-to-the.yaml`, "Course/Measure mapping grid")*
4. **Standardized evaluation forms across every site**, with drift-flagging analytics — 20 sites, 20 preceptors, one course. *(Standard 7.3.c → `flows/preceptor-site-onboarding--08-ongoing-site-preceptor-quality-review-agreement.yaml`)*
5. **Early off-pace warning pre-APPE** — because a readiness failure isn't a retake, it's a delayed graduation (the 4th year is one uninterrupted block). *(Standard 3.1.b + 7.3.d → `flows/rotation-lifecycle--03-student-readiness-compliance-clearance-pre-rotation.yaml`, "Competency Review Dashboard")*
6. **NAPLEX/MPJE pass rates trended against IPPE/APPE performance** — a closed loop from rotation data to licensure outcome, for a board-level viability question. *(role: Dean → `flows/accreditation-self-study--05-external-outcome-data-ingestion-board-exams.yaml` — no shipped screen exists; board-exam ingestion is an unshipped Q2 2027 roadmap pillar)*

**Design opportunities from this journey:** JTBDs 1–4 extend existing screens; JTBD 5 is a Configure-tier alert on existing readiness data; JTBD 6 has *no shipped screen to extend* — it's the clearest net-new design opportunity tied directly to a persona (the Dean), not just an accreditation checklist item.

*(`personas/discipline-pharmacy.yaml`, full jtbd list)*

## C. Design opportunities, prioritized

Correcting a citation error found while building this doc: `accreditation/acpe.yaml`'s own 12 standards entries split **4 Transfer / 6 Configure / 2 Gap** — not the "4/5/3" cited in `scorecard/where-to-play.yaml` and `gap-analysis.md`. Priorities below use the actual per-element fit.

| Priority | Element | Fit | Design need |
|---|---|---|---|
| 1 | 3.5.b — Affiliation agreements with practice facilities | **Gap** | Net-new: site-level contract/document repository. Compliance Management today only gates student-side items (immunizations, background checks) — no pillar, current or roadmap, names site-contract tracking. Multi-campus/distance programs add a per-state licensure dimension. |
| 2 | 7.5.b — Continuous compliance with accreditation standards | **Gap** | Net-new: the not-yet-built Accreditation Management pillar (roadmap Q3 2027) — no current pillar aggregates evidence against named standard numbers. This is the Liaison's #1 pain, repo-wide. |
| 3 | 3.1.b — IPPE duration (hour categories) | Configure | Extend the placement engine's hour-tracking with a setting-category taxonomy (community/hospital/other) and two 75-hour sub-thresholds, simulation excluded. Open question: does the current engine aggregate by *custom category*, or only a single total per placement? |
| 4 | 3.2.b/3.2.d — APPE duration + 4 required settings | Configure | Same engine, add the four-setting taxonomy and a per-student graduation-gating coverage check. |
| 5 | 3.3.a / 3.3.c — Preceptor criteria & education | Configure | Extend the *student*-compliance gating pattern to the *preceptor* entity — license status and completed orientation as placement preconditions. |
| 6 | 7.3.d — Student readiness (APPE-/Practice-/Team-ready) | Configure | Partial fit today — data model exists via Competency Tracking + Curriculum Mapping, but formal exam scoring depends on the still-roadmap Exam Management pillar (Q2 2027). |
| 7 | 7.5.a — CQI using stakeholder feedback | Configure | Surveys & Course Evaluations pillar is shipped (corrected 2026-08-26 per Exxat PM confirmation) — this is instrument/cadence configuration, not new capability. |

**Not build targets — already Transfer:** 3.1.a (IPPE sequencing), 3.3.e (2:1 ratio — "a query against existing assignment data"), 2.2.d (curriculum mapping), 7.3.c (cross-site QA via existing Setup → Forms/Evaluations flow).

*(`accreditation/acpe.yaml`, all 12 elements)*

## D. Design system notes

Not sourced here. This repo is a research/evidence base for Prism's product-market fit, not a record of Prism's UI design-system constraints (components, accessibility baseline, typography) — that documentation lives with the product/design team, not in `content/`. Don't infer or invent design-system rules from this repo.
