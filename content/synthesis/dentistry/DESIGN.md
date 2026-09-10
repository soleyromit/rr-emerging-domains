# Dentistry: Design reference

*For: designers. Source: `personas/discipline-dentistry.yaml`, `accreditation/coda.yaml`. Read the index.md note first — this domain's competitive shape is additive, not displacing, and that changes what "design opportunity" means here.*

## A. Personas at a glance

| Persona | Current pain (#1) | Prism angle | Design implication |
|---|---|---|---|
| **Dean / Program Director** | Patient-volume shortfall is existential for a new school, not a metrics-reporting problem | Not a screen user | Needs the rollup showing program-wide patient-encounter health, not per-student detail |
| **Compliance / Accreditation Liaison** | CODA 1-2 continuous institutional effectiveness is "the backbone of the self-study," compiled manually | Highest-leverage Gap, same shape as other domains | Standard-by-standard evidence aggregation — net-new |
| **Clinical / Experiential Education Coordinator** | Structurally different job here: recruiting/retaining a *patient panel*, not scheduling preceptor rotations | No existing Prism screen maps directly | Real-time patient-encounter tracking against competency quotas is the single biggest design opportunity |

*(`personas/role-dean.yaml`, `personas/role-compliance-accreditation-liaison.yaml`, `personas/discipline-dentistry.yaml`)*

**Key insight, different from every other domain:** dentistry's core clinical workflow (patient panel + chairside procedure sign-off) has no equivalent screen in Prism today — this isn't a Configure-tier extension of the placement engine the way DO/Pharmacy's jobs are. The single biggest job (patient-encounter volume/breadth tracking) is closer to new capability than to configuration.

## B. Domain persona journey — the Newly-Opened CODA Dental School

*One archetype, full text from `personas/discipline-dentistry.yaml`.*

**Archetype:** A recently opened or fast-growing CODA program — one of the cohort behind 55→77 program growth since 2000, where 25% of 2024's first-year enrollees sat at newly opened schools. No block rotations: each student carries a longitudinal comprehensive-care patient panel from year 1, with a faculty clinical practice unit signing off on each procedural step. Progression is quota- and competency-gated. The defining tension: a young program's clinic doesn't yet have the patient base an entrenched school has, pushing it toward extramural sites — precisely the multi-site shape axiUm was never built for.

**Jobs to be done:**

1. **Live per-student patient-encounter volume/breadth vs. required competency categories**, with pacing alerts months before a shortfall delays graduation — named the single biggest job, where the accreditation standard, the degree, and the graduation rate are the same number. *(CODA 2-9 + 2-24 → `flows/competency-verification--03-capture-evidence-at-the-point-of.yaml`, "Procedure Minimums list")*
2. **Extramural placement + affiliation-agreement + student-credentialing as one system** — the multi-site problem axiUm has no answer for. *(CODA 4-6)*
3. **Faculty calibration proof across every added extramural site** — the more sites solve #2, the more this hurts. *(CODA 2-6 → `flows/accreditation-self-study--03-institution-side-documentation-capture-sites-preceptors.yaml`, "Faculty Compliance — Setup")*
4. **Continuous, exportable self-study evidence** instead of a six-month manual reconstruction. *(CODA 1-2)*
5. **Case-record + due-process trail** when a student falls below threshold. *(CODA 2-2 → `flows/accreditation-self-study--07-closing-the-cqi-loop-finding-to.yaml`, "Student 360 Dashboard — Interventions tab")*
6. **Chart-audit/deficiency-coding CQI loop** back to curriculum and supervision changes. *(CODA 5-3 — "no confirmed capability exists in the platform today")*
7. **Rolled-up INBDE + regional clinical licensure (ADEX/CDCA-WREB) outcomes** alongside competency data. *(→ `flows/accreditation-self-study--05-external-outcome-data-ingestion-board-exams.yaml` — no shipped screen exists)*

*(`personas/discipline-dentistry.yaml`, full jtbd list)*

## C. Design opportunities, prioritized

Per `accreditation/coda.yaml`'s actual counts (verified correct against `gap-analysis.md`, 2026-09-02): 3 Transfer / 5 Configure / 3 Gap across 11 elements.

| Priority | Element | Fit | Design need |
|---|---|---|---|
| 1 | 2-9 — Adequate patient experiences | **Transfer** *(per acpe... coda.yaml, though structurally the hardest job)* | The confirmed anchor is patient-matching against graduation requirements, chairside — but this is existential, not incremental; treat as priority 1 regardless of nominal "fit" |
| 2 | 1-2 — Institutional effectiveness (CQI backbone) | **Gap** | Continuous, standards-mapped evidence aggregation — same shape as every domain's top Gap |
| 3 | 2-24 — ~15 competency categories, CDT-coded procedure logs | **Gap** | Called "likely the single largest dentistry-specific build" — must speak CDT natively, not a parallel taxonomy |
| 4 | 5-3 — Patient-care CQI (chart audits, deficiency coding) | **Gap** | No confirmed capability exists today |
| 5 | 2-2 / 2-5 / 2-6 / 4-6 / 3-4 | Configure | Individual due-process case records, competency-linked exams, faculty calibration, site agreements, faculty evaluation — all extend existing patterns from other domains |
| — | 2-1 / 2-8 | Transfer | Syllabus publication, curriculum-to-competency crosswalk — axiUm has **no curriculum-mapping module at all**, a clean win if pursued |

*(`accreditation/coda.yaml`, all 11 elements)*

**Structural constraint for every item above:** Prism's placement engine does not map onto chair/operatory scheduling — dentistry inverts the rotation model entirely. Any procedure log "should speak CDT natively rather than inventing a parallel taxonomy." *(`synthesis/gap-analysis.md`)*

## D. Design system notes

Not sourced here — same as every domain.
