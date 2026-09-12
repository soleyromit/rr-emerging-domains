# DO: Design reference

*For: designers. Source: `personas/discipline-do.yaml`, `accreditation/coca.yaml`, cross-cutting `personas/role-*.yaml`.*

## A. Personas at a glance

| Persona | Current pain (#1) | Prism angle | Design implication |
|---|---|---|---|
| **Dean / Program Director** | Judged on COMLEX pass rates and PGY-1 placement — both computed outside any system, no shipped pillar ingests board results | Not a screen user; needs the rollup | Board-exam/GME-Match ingestion is unshipped roadmap (Q2 2027) |
| **Compliance / Accreditation Liaison** | Assembles the annual/mid-cycle COCA report as a six-month, five-system archaeology project | The highest-leverage Gap element for this domain | Element 11.9 (annual/mid-cycle report) — genuinely new UI |
| **Clinical / Experiential Education Coordinator** | Manages hundreds of individually-recruited preceptors across 36 states; can't currently answer "show me this student's evidence" without rebuilding history from spreadsheets | Closest fit to Prism's existing placement engine | Site-capacity + per-student attribute capture at scheduling time (Configure, not build) |

*(`personas/role-dean.yaml`, `personas/role-compliance-accreditation-liaison.yaml`, `personas/role-clinical-coordinator.yaml`, `personas/discipline-do.yaml`)*

**Key insight:** DO's single named "PRIMARY JOB" (per the persona file itself) is the union of two COCA elements — 6.9 (site capacity + affiliation agreements) and 6.10 (per-student supervision proof) — both owned by the Clinical Coordinator, both Configure-tier. The Gap-tier work (11.1/11.2/11.8/11.9, the finding→action→evidence loop and the annual report itself) belongs to the Liaison. Design effort splits cleanly by role, same shape as Pharmacy.

## B. Domain persona journey — the Fast-Growing COCA-Accredited COM

*One archetype (a program, not an individual), full text from `personas/discipline-do.yaml`.*

**Archetype:** A private COM that grew class size faster than clinical capacity — one of 48 accredited COMs, inside a field where total enrollment hit an all-time high (40,905, 2025-26) and applications jumped 12.8%. Clinical training runs OMS-3/4 on a distributive model: students dispersed across a wide, individually-recruited network rather than one owned teaching hospital, with a DO-specific competency track (200–500 hours of hands-on OMM/OMT) taught and assessed *during* clerkships, no MD or allied-health analog.

**Jobs to be done:**

1. **System-generated site-capacity and per-student supervision proof, captured automatically at scheduling time** — the primary job, cited as such directly in the source file. *(COCA 6.9 + 6.10 → `flows/rotation-lifecycle--01-site-sourcing-capacity-contracting-affiliation-agreement.yaml`, "Site/Location — Slots tab", "Number of Offers")*
2. **Live capacity-vs-demand forecast per rotation type/site** — so a shortfall surfaces a year out, not weeks before a block starts.
3. **OMM/OPP manual-skills competency tracked on the same rotation record as case logs and EPAs** — no competitor reviewed documents an equivalent competency type. *(COCA 6.4 → `flows/competency-verification--01-define-the-competency-framework-and-map.yaml`, "Course Type selector")*
4. **Automatic COMLEX/PGY-1 figures computed from student records and pushed to the required public page** within COCA's tracked deadlines.
5. **Every COCA report field pre-mapped from a year of normal operations** — turning the annual/mid-cycle report from a six-month archaeology project into a query.

**Design opportunities from this journey:** JTBDs 1–3 extend the existing placement/competency engine (Configure); JTBD 4 has no shipped screen (board-exam ingestion is Q2 2027 roadmap); JTBD 5 is the same Accreditation Management gap Pharmacy hits, just against COCA's taxonomy instead of ACPE's.

*(`personas/discipline-do.yaml`, full jtbd list)*

## C. Design opportunities, prioritized

Per the corrected count (`gap-analysis.md`, 2026-09-02): **0 Transfer / 7 Configure / 5 Gap** across 12 COCA elements — no element transfers cleanly as-is, which tracks with the persona's own framing ("Zero outright Transfers... but 5 clean Configures" was itself the pre-correction miscount; the real Configure list is longer).

| Priority | Element | Fit | Design need |
|---|---|---|---|
| 1 | 11.9 — COCA annual & mid-cycle report | **Gap** | The recurring deadline forcing every other number into one submission — highest-leverage Gap in the whole document per the accreditation research |
| 2 | 6.11 — Comparability across clinical sites (statistical analysis) | **Gap** | Cross-site inferential statistics on site-tagged assessment data — "the hardest ask in the whole document" |
| 3 | 11.1 / 11.2 / 11.8 — Finding→action→evidence loop, confidential course evaluation, mandatory student survey | **Gap** (×3) | Same closed-loop pattern as Pharmacy's 7.5.a/b — CQI evidence, not just collection |
| 4 | 11.4 / 11.5 — COMLEX pass rates, PGY-1 placement | **Gap** | Public-webpage push within 30-day/continual windows — depends on external NBOME/ACGME data import |
| 5 | 6.9 / 6.10 — Site capacity + affiliation agreements; per-student supervision proof | Configure | The named PRIMARY JOB — extend the placement engine's metadata, not new architecture |
| 6 | 6.4 — Osteopathic core competencies (OMM) | Configure | Curriculum Mapping taxonomy extension |
| 7 | 5.4 — Patient care supervision policy attestation | Configure | Compliance Management item type, pointed at a population the COM doesn't employ |
| 8 | 10.2 — Affiliated GME registry | Configure | Native ACGME program modeling, matching MedHub/New Innovations |

*(`accreditation/coca.yaml`, all 12 elements)*

## D. Design system notes

Not sourced here — same as Pharmacy. This repo doesn't capture Prism's UI design-system constraints.
