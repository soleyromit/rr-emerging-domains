# Medicine: Product & GTM summary

*For: PMs and executives. Every figure below cites a source file. Full context: [`../gap-analysis.md`](../gap-analysis.md), [`../prism-positioning.md`](../prism-positioning.md).*

## A. Market summary

**Market:** 159–161 LCME-accredited MD schools (~96 public / 64 private) — the largest domain on every axis. U.S. MD enrollment crossed 100,000 for the first time in 2025-26 (100,723, +1.3% YoY), 23,440 first-year matriculants (+1.2%), and applicants rose 5.3%, reversing three years of decline. *(`domains/medicine.yaml`)*

**Where Medicine ranks:** Third of four — 3.85 weighted vs. DO 4.40, Pharmacy 4.05, Dentistry 2.75. Strong pillar fit (3 Transfer / 8 Configure / 2 Gap across 13 LCME elements, corrected 2026-09-02 from a prior 3/7/3 mistally) but weak incumbent openness (3/5) — six MD incumbents (one45, Elentra, Leo, eMedley, MedHub/E\*Value, New Innovations) already ship surveys, exams, and standard-aligned accreditation reporting Prism doesn't until 2027. *(`scorecard/where-to-play.yaml`)*

**Why "the long game," not the lead:** capacity hasn't kept pace with enrollment growth — 44% of AAMC-surveyed schools feel moderate-to-severe pressure to pay community physicians to host students, and even in the largest Match on record (2025) 6.5% of U.S. MD seniors didn't match to a PGY-1 position. The pain is real, but the incumbents are entrenched: Leo has been an AAMC Curriculum Inventory vendor since 2013, one45 is credited in a full 8-year LCME outcome. *(`domains/medicine.yaml`; `scorecard/where-to-play.yaml`)*

**Where we win:** The two strongest single fits in the entire corpus, across all four domains — LCME 8.6 (central monitoring of required-experience completion) is rated *"the strongest fit of any standard in this document,"* and 9.7 (midpoint formative feedback) *"maps almost one-to-one"* onto Prism's confirmed anchor-relative scheduling primitive. *(`accreditation/lcme.yaml`)*

## B. Competitive positioning

**Positioning statement:** Prism can win on placement-gating compliance and modern mobile UX where MD incumbents show real, documented gaps — not on feature-for-feature accreditation-reporting parity, which those incumbents currently win. *(`personas/discipline-medicine.yaml`, "switching_trigger")*

**Seven vendors serve MD — the most crowded field of any domain:**

| Vendor | Ships today, ahead of Prism's 2027 roadmap | Named weakness |
|---|---|---|
| MedHub/E\*Value | Evaluations, exams, accreditation workflows | "Two bolted-together legacy systems" from a 2015 M&A rollup; mobile app draws real complaints |
| one45 (Acuity Insights) | Duty-hour/leave tracking; ExamSoft/NBME integration | No public evidence of a dedicated compliance module; outdated interface, vendor slow on feedback |
| Elentra | AAMC CI vendor since 2013, MedBiquitous native, >40% CACMS DCI coverage | **No dedicated Compliance Management module** |
| Leo (DaVinci) | Deep curriculum-mapping heritage | Mid-merger into Elentra, which is publicly courting Leo's own customers to migrate |
| New Innovations | APE, NAS, CLER, CCC milestone review — shipped, not roadmap | Acquired by QGenda (Jul 2025); roadmap/support-continuity uncertainty |
| eMedley | Surveys/Course Evaluations + Exam Management shipped today | — |

*(`competitors/medhub.yaml`, `competitors/one45.yaml`, `competitors/elentra.yaml`, `competitors/leo-davinci.yaml`, `competitors/new-innovations.yaml`, `competitors/emedley.yaml`)*

**The wedge:** placement-gating compliance (one45, Elentra, and Leo show no public evidence of a dedicated immunization/background-check/certification module) plus modern mobile data-entry UX, where the largest incumbents draw documented complaints. *(`personas/discipline-medicine.yaml`)*

## C. Go-to-market sequencing

Medicine is explicitly the long game, not the near-term focus — DO is the lead and Pharmacy the fast-follow. **No dated roadmap or named beachhead schools exist in this research.** Given the domain's own "racing to parity" framing, a GTM plan here should follow DO's, not precede it. **(ADDED 2026-09-10: Pharmacy, not DO, is the confirmed first domain in market — see `synthesis/prism-positioning.md` — but Medicine's "long game, follows the others" conclusion is unaffected by which of DO/Pharmacy goes first.)** *(`synthesis/prism-positioning.md`)*

**Reachability:** Nursing and allied health usually sit on the same academic health center campus, but the MD program's clinical-ed stack is frequently inherited from the affiliated health system's GME office (MedHub/E\*Value at 80 of 119 U.S. academic health centers, New Innovations at 740 enterprise customers) — the decision often lives outside the campus relationship Prism already has, and Prism has no MD reference customers today. *(`scorecard/where-to-play.yaml`, "Reachability" row)*

## D. Revenue model

**Not sourced.** All seven MD-relevant competitors have confirmed non-public pricing (quote-based). No Prism-specific Medicine pricing exists in this repo.

## E. Key personas

Full detail: [DESIGN.md](./DESIGN.md).

- **Dean / Program Director** — accreditation status gates federal funding, ACGME residency eligibility, and licensure; existential, not just operational.
- **Compliance / Accreditation Liaison** — Element 1.1 requires ongoing monitoring, not point-in-time self-study prep; currently a manual, cyclical project.
- **Clinical / Experiential Education Coordinator** — same student evaluated by a different supervisor at a different site every 4–12 weeks; someone centrally has to prove every required experience was completed before graduation.

*(`personas/role-dean.yaml`, `personas/role-compliance-accreditation-liaison.yaml`, `personas/discipline-medicine.yaml`)*

## F. What to measure

No numeric targets sourced. What the research points at:

- Whether central, per-student proof of required-clerkship completion (LCME 8.6, "the strongest fit of any standard in this document") can actually be produced before it becomes a site-visit finding.
- Whether away rotations (over half of fourth-years, $2,500–$10,000+ typical cost) can be tracked in the same system as home clerkships instead of living only in VSLO and email.
