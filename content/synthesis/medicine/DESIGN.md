# Medicine: Design reference

*For: designers. Source: `personas/discipline-medicine.yaml`, `accreditation/lcme.yaml`, cross-cutting `personas/role-*.yaml`.*

## A. Personas at a glance

| Persona | Current pain (#1) | Prism angle | Design implication |
|---|---|---|---|
| **Dean / Program Director** | Accreditation gates federal funding + ACGME eligibility + licensure — existential | Not a screen user | Needs the compliance-dashboard rollup, not the workflow |
| **Compliance / Accreditation Liaison** | Element 1.1 demands ongoing monitoring, not an 18-month self-study sprint | Highest-leverage Gap element, same shape as every domain | Would make Prism "the system of record for a self-study rather than just a data source for one" once shipped |
| **Clinical / Experiential Education Coordinator** | A student is evaluated by a different supervisor at a different site every 4–12 weeks; someone has to centrally prove every required experience happened | **The two strongest fits in the entire four-domain corpus land here** | 8.6 (central monitoring) and 9.7 (midpoint feedback) are near-zero-build extensions |

*(`personas/role-dean.yaml`, `personas/role-compliance-accreditation-liaison.yaml`, `personas/discipline-medicine.yaml`)*

**Key insight:** Medicine has the best raw pillar fit of any domain on two specific elements, but the competitive picture inverts the usual logic — six incumbents already ship what Prism would need to *add* to actually win a deal (exams, standards-mapped reporting). The design opportunity here isn't "build the missing thing," it's "ship the two near-zero-build wins fast enough that they're differentiating before parity closes."

## B. Domain persona journey — the Capacity-Squeezed LCME Program

*One archetype, full text from `personas/discipline-medicine.yaml`.*

**Archetype:** A mid-size LCME-accredited MD school that grew its class alongside the national trend (100,723 students, +1.3% YoY) without matching clerkship-capacity growth. Two-phase, exam-gated curriculum: years 1–2 pre-clinical, years 3–4 clinical (~48 weeks of core clerkships in 4–12 week blocks), multi-tiered supervision (attending → senior/chief resident → intern → student) that rotates every few weeks, then year-4 sub-internships and away rotations via AAMC VSLO. The degree isn't the end of the pathway — USMLE Step 1/2 CK sit inside the clinical timeline, and the NRMP Match is the outcome the program is actually judged on.

**Jobs to be done:**

1. **Central, program-wide clerkship-completion view with automatic gap flags** — the strongest capability fit in the whole standards set. *(LCME 8.6, rated Transfer → `flows/admin-onboarding--08-learning-activities-competency-management-reporting.yaml`, "Forms & Evaluations summary grid")*
2. **Per-site capacity records** (affiliation status, patient volume/case mix, cross-site comparability) as the class grows and new sites get added. *(LCME 1.4/5.5/8.7 → `flows/rotation-lifecycle--01-site-sourcing-capacity-contracting-affiliation-agreement.yaml`, "Site — Contracts tab")*
3. **Midpoint feedback and final grades auto-triggered off each placement's own dates** — maps almost one-to-one onto the confirmed anchor-relative scheduling primitive. *(LCME 9.7 Transfer, 9.8 Configure → `flows/admin-onboarding--08-learning-activities-competency-management-reporting.yaml`, "Publish timing — Event Anchored")*
4. **Multi-tiered supervision captured with named roles/levels per placement**, not just one preceptor field. *(LCME 3.1 Transfer, 9.3 Configure — one data-model change answers both)*
5. **Compliance evidence mapped to standards, monitored year-round** — the single feature that would make Prism the system of record for a self-study, not just a data source. *(LCME 1.1, Gap — no shipped screen exists)*
6. **Exam performance + survey + curriculum data in one cross-cohort view benchmarked against national norms** — catching a cohort trending toward a bad Match year while there's still time to act. *(LCME 8.4, Gap — depends on Exam Management (Q2 2027) integrating with Accreditation Management (Q3 2027); Surveys itself is shipped, corrected 2026-08-26)*
7. **Away rotations tracked in the same system as home clerkships** — over half of fourth-years do them, at $2,500–$10,000+ typical cost, and 8.6's completion monitoring makes no exception for rotations the school didn't arrange. *(→ `flows/accreditation-self-study--05-external-outcome-data-ingestion-board-exams.yaml` — no shipped screen exists)*

*(`personas/discipline-medicine.yaml`, full jtbd list)*

## C. Design opportunities, prioritized

Per `accreditation/lcme.yaml`'s actual counts (corrected 2026-09-02): 3 Transfer / 8 Configure / 2 Gap across 13 elements.

| Priority | Element | Fit | Design need |
|---|---|---|---|
| 1 | 8.6 — Central monitoring of required clinical experiences | **Transfer** | "The strongest fit of any standard in this document" — ship and lead sales with this first |
| 2 | 9.7 — Midpoint formative feedback | **Transfer** | Near-1:1 on the existing anchor-relative primitive |
| 3 | 1.1 — Strategic planning & continuous compliance monitoring | **Gap** | Same shape as every domain's top Gap — standards-mapped evidence aggregation |
| 4 | 8.4 — Program outcomes incl. USMLE/Match national norms | **Gap** | Depends on Exam Management + Accreditation Management integration, not just either shipping alone |
| 5 | 1.4 / 5.5 / 6.2 / 8.5 / 8.7 / 9.3 / 9.4 / 9.8 | Configure | Affiliation agreements, site capacity, required-experience evidence, student feedback, cross-site comparability, supervision attestation, assessment system, six-week grading SLA — all extend shipped pillars |
| — | 3.1 — Resident participation | **Transfer** | Add a resident/GME-trainee role to the existing preceptor-assignment record |

*(`accreditation/lcme.yaml`, all 13 elements)*

## D. Design system notes

Not sourced here — same as every domain.
