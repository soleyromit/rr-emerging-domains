# Exxat PRISM — 4-Domain Expansion Gap Analysis

**Scope:** Pharmacy (ACPE) · DO (COCA) · Dentistry (CODA) · Medicine (LCME)
**Date:** 2026-08-24
**Sources:** every claim below traces to a file in `content/` or to a URL recorded in one of those files. Primary inputs: `content/prism/capability-map.yaml`, `content/domains/*.yaml`, `content/accreditation/{coca,lcme,acpe,coda}.yaml`, `content/competitors/*.yaml`, `content/journeys/*.yaml`.

---

> **ADDED 2026-09-10, per stakeholder direction:** Pharmacy is the confirmed
> first GTM target — see `scorecard/where-to-play.yaml`'s `actual_gtm_target`
> field and `synthesis/prism-positioning.md`. This is a business call, not a
> correction to the research below: this document's per-domain fit analysis
> (§2) is unaffected and every accreditor's data stays exactly as researched.
> The per-domain subsection order below (§2.1 DO first, historically written
> before this override) is left as-is rather than renumbered, to avoid
> corrupting the internal element-ID cross-references throughout an already
> fact-checked document — §2.2 is the Pharmacy section to start with.

> **Correction (2026-08-24), added after reading Exxat's internal PA and OT discipline
> playbooks (`content/prism/capability-map.yaml`, "Physician Assistant" and "Occupational
> Therapy" sources):** this document's competitor research was built from public competitor
> marketing pages and accreditor PDFs — it had no visibility into Prism's own internal product
> documentation. Two claims below are now known to be wrong as stated:
> - **Pattern G** ("no allocation, preference-ranking, or constraint-solving layer is documented
>   anywhere in Prism's research") is false. Prism ships **Placement Assist** — a real weighted
>   allocation engine (staged runs, difficulty-weighted specialties, wishlist-fed) — confirmed in
>   both playbooks. See the corrected note at the end of Pattern G.
> - **Pattern A**'s framing ("the entity model stops at the student") undersells what's shipped.
>   **Placement Clearance** already gates on student compliance *and* site documents *and* active
>   contracts *and* preceptor license/certification validity — four entities, not one. The real
>   open question is whether that same gate extends to the *specific new item types* each new
>   accreditor asks for (faculty calibration, affiliated-GME-program status), not whether
>   non-student gating exists at all.
>
> Everything else in this document — the 48-standard fit distribution, the five biggest gaps, the
> per-domain tables — still reads accreditor standards against what a system must do, and is
> unaffected. Full detail: `content/prism/capability-map.yaml`.

> **CORRECTION (2026-08-26), per direct Exxat PM confirmation:** the **Surveys & Course
> Evaluations** pillar's `status` in `content/prism/capability-map.yaml` was just corrected from
> `roadmap` (Q1 2027) to **`shipped`**. Every "Q1 2027" / "roadmap" reference to Surveys & Course
> Evaluations below (section 3.8, Pattern F) is now out of date as stated. Prism ships both a
> placement-evaluation Forms engine (CIET v2, PTSE1/2, SCIPAI, PTMACS/PTAMACS and similar named
> instruments) and a separate general-purpose "Exxat Surveys" builder (14 question types,
> multi-channel distribution, full analytics — already extended to PT and SLP). This does **not**
> mean Prism leads on Surveys — there is no evidence yet of competitive depth parity against the
> six named competitors (Elentra, one45, eMedley/eValuate+, Leo, MedHub/E\*Value, CORE ELMS). The
> correct framing going forward is **"shipped, competitive depth vs. named competitors not yet
> re-verified"** — not "Prism wins" and not "Prism has nothing." Original text is left in place
> below with inline corrections so the audit trail survives. This correction is scoped to Surveys
> & Course Evaluations only — Exam Management (Q2 2027) and Accreditation Management (Q3 2027)
> remain accurate, still-roadmap items and are unaffected.

---

## 0. The numbers first

56 numbered accreditation elements were researched against the standards documents themselves (not summary pages) and rated for Prism fit. The distribution is the headline:

| Accreditor (domain) | Elements rated | Transfer | Configure | **Gap** |
|---|---|---|---|---|
| COCA (DO) | 12 | **0** | **7** | **5** |
| LCME (Medicine) | 13 | 3 | **8** | **2** |
| ACPE (Pharmacy) | 20 | 4 | **12** | **4** |
| CODA (Dentistry) | 11 | 3 | 5 | 3 |
| **Total** | **56** | **10** | **32** | **14** |

<!-- CORRECTED 2026-09-02: the Configure/Gap counts above were miscounted against
their own source files (accreditation/coca.yaml, lcme.yaml, acpe.yaml) — COCA's
Configure and Gap columns were swapped, and LCME/ACPE were each off by one in
both columns. Recounted directly from each file's `standards[].prism_fit` field;
CODA's count was already correct. Per ARCHITECTURE.md, this is an annotated
correction, not a silent rewrite — the original claim was 10/22/16. -->

<!-- CORRECTED 2026-09-10: `accreditation/acpe.yaml` grew from 12 to 20 Standard-3
(Experiential Learning) elements — the 6 missing sub-elements of Standards 3.2/3.3
plus 3.4.a and 3.5.a — after a completeness check found Standard 3 was only 44%
covered (7 of 16 real key elements) despite being the standard most directly in
Exxat's product lane. ACPE's row and the Total row above are updated to match;
COCA/LCME/CODA are unchanged and still only partially cover their own standards
documents (each ~10-13 of 100+ real key elements in the actual PDFs — this is a
deliberate scope, not a gap: only elements plausibly relevant to clinical/
experiential-education software were researched, not governance/faculty-HR/
resource standards no rotation platform would touch). See §2.2 for the 8 new rows. -->

Counts derived from the `prism_fit` field on every entry in `content/accreditation/coca.yaml`, `lcme.yaml`, `acpe.yaml`, `coda.yaml`.

Two things fall out immediately:

1. **DO is the worst accreditation fit of the four, not the best.** COCA is the only accreditor in the set with **zero** elements rated Transfer and the only one where Gaps outnumber Configures (7 of 12). Seven of COCA's twelve researched elements — 6.11, 11.1, 11.2, 11.4, 11.5, 11.8, 11.9 — are hard Gaps (`content/accreditation/coca.yaml`). That sits in direct tension with the market case for DO: 48 accredited COMs, 40,905 students in 2025-26 (all-time high), first-year enrollment up 62% over the decade, applications up 12.8% YoY (`content/domains/do.yaml`, citing https://www.aacom.org/become-a-doctor/about-osteopathic-medicine/quick-facts). DO is the most attractive market and the heaviest build.
2. **The Gaps are not scattered — they clump.** 14 of the 16 Gap ratings sit in three buckets: standards-to-evidence mapping, external outcome-data ingestion, and closed-loop CQI. All three are the job description of one unshipped pillar.

---

## 1. Executive summary — the five biggest gaps across all four domains

### Gap 1 — Prism has no object that knows what an accreditation standard *is*

This is the load-bearing gap, and all four accreditation files converge on it independently:

- `lcme.yaml` (Element 1.1): *"No shipped pillar currently maps program evidence to named accreditor standards/elements or tracks CQI action-item status against them; this is the single feature that would let Prism be the 'system of record' for an LCME self-study rather than just a data source for one."*
- `coda.yaml` (Element 1-2): *"the single item the capability map itself calls the most load-bearing gap for the whole domain-expansion thesis."*
- `coca.yaml` (Element 11.9): *"the single highest-leverage element in this document for that pillar's business case."*
- `acpe.yaml` (Key Element 7.5.b): *"precisely the not-yet-built Accreditation Management pillar (roadmap Q3 2027) — no current pillar aggregates evidence against named standard numbers."*

Curriculum Mapping (shipped) maps courses/activities to *a curriculum structure* — a curriculum structure, not COCA Element 6.9 or LCME Element 8.6 (`content/prism/capability-map.yaml`; `content/journeys/accreditation-self-study.yaml`, stage 1). Today the crosswalk lives in a spreadsheet outside the system, so nothing detects that an element has **no** evidence attached until a reviewer asks.

**Who covers it better today:** Elentra names the specific standards it reports against — LCME (including ED-5/ED-7-aligned reporting), COCA, CACMS, ACPE, CODA, ARC-PA — plus AAMC Core EPAs, and covers >40% of the CACMS DCI natively (https://elentra.com/disciplines/medicine-undergraduate). Leo/DaVinci has been an AAMC-authorized Curriculum Inventory vendor **since 2013**, with one-click CI submission and AAMC business rules that flag data errors *pre*-submission (https://www.davinci-ed.com/resources/mapping-for-curriculum-inventory-accreditation-insight-dashboard). MedHub/E\*Value ships a named Accreditation Automation product — ACGME NAS dashboards, CLER visit/letter/response-action tracking, ADS-formatted report generation, direct ACGME survey import (https://www.medhub.com/accreditation-automation/); `content/competitors/e-value.yaml` calls this *"the single biggest publicly-verifiable gap found in this research."* CORE ELMS ships CompMS standards mapping with explicit ACPE/CAPE alignment for pharmacy (https://corehighered.com/competency-management).

### Gap 2 — Compliance Management is confirmed for students only; the accreditors mostly ask about everyone else

Compliance Management (shipped) gates placement start/continuation on completed student items, and `content/prism/capability-map.yaml` lists the exact item taxonomy as an open Phase 2 question. Every accreditation file independently notes the confirmed scope is **student-level items only**, and then asks Prism to gate on a different entity:

| Entity that must be tracked/gated | Elements requiring it |
|---|---|
| Clinical **site** (executed, unexpired affiliation agreement) | ACPE 3.5.b (**Gap**), COCA 6.9, LCME 1.4, CODA 4-6 |
| **Preceptor** (licensure, orientation-before-assignment, PD log) | ACPE 3.3.a, 3.3.c |
| **Faculty** (calibration training, recurring evaluation) | CODA 2-6, CODA 3-4 |
| **Any user** (policy acknowledgment / attestation) | COCA 5.4 |
| **Affiliated GME program** (accreditation status, Osteopathic Recognition) | COCA 10.2, 10.3 |

The three files disagree on severity precisely because the entity model is unconfirmed: `acpe.yaml` rates site agreements a flat **Gap** (*"no pillar today models site-level compliance/contract documents"*), while `lcme.yaml` and `coda.yaml` rate the same requirement Configure with the identical caveat (`content/journeys/accreditation-self-study.yaml`, stage 3). ACPE 3.5.b is the single element in the entire researched corpus for the preceptor/site onboarding journey rated a flat Gap (`content/journeys/preceptor-site-onboarding.yaml`, stage 2).

The failure mode is silent and live: a lapsed affiliation agreement does not block new scheduling, so it surfaces during a site visit with students already on site.

**Who covers it better today:** CORE ELMS ships affiliation-agreement tracking with expiration alerts *plus* preceptor license tracking inside its compliance module (https://services.corehighered.com/student-clinical-experential-education) — and CORE claims 90% of U.S. pharmacy programs (https://corehighered.com/core-for-pharmacy), i.e. it is the incumbent in exactly the domain where Prism's fit is rated Gap. eMedley's eKeeper goes further, pairing affiliation-agreement tracking and auto-expiration reminders with preceptor **pay** automation (https://clinical.emedley.com/features/) — which matters because 44% of AAMC-surveyed schools report moderate-to-severe pressure to start paying community physicians to host students (https://www.aamc.org/news/so-many-medical-students-so-few-clerkship-sites). New Innovations ships a dedicated Credentialling Module for licenses, certifications, visas and immunizations with expiration alerts (https://www.new-innov.com/pub/gme_details.html). MedHub verifies credentials against NPDB/NPPES (https://www.medhub.com/software/).

**Counter-note (this is also Prism's best wedge):** Elentra has no dedicated compliance feature page at all — compliance appears only in tagline copy (`content/competitors/elentra.yaml`); one45's only compliance-adjacent public feature is duty-hours/leave tracking inside scheduling (`content/competitors/one45.yaml`); Leo/DaVinci is rated **behind** outright (`content/competitors/leo-davinci.yaml`). And *gating* — not listing — is the defensible claim: eMedley's public pages never state that its compliance items actually gate placement start (`content/competitors/emedley.yaml`).

### Gap 3 — "Competency Tracking" is a marketing bullet, and competency attainment is the artifact three of four accreditors gate on

In `content/prism/capability-map.yaml`, Competency Tracking appears only as a bullet in the intelligence layer — **no confirmed data model, no shipped module, and unlike all six core-ring pillars, not even a roadmap date.** Three separate accreditation files decline to credit it:

- `lcme.yaml` (9.4): *"Program-objective-level competency rollup across all assessment types is not a confirmed shipped capability."*
- `acpe.yaml` (7.3.d): formal readiness assessment at ACPE's rigor *"is likely outside current Prism capability"* until Exam Management ships (Q2 2027).
- `coda.yaml` (2-24): flat **Gap** — no CDT-code-level procedure logging, no per-category competency roll-up.

Completion ≠ competence. LCME 8.6 (central monitoring of rotation *completion*) is rated Transfer and called *"the strongest fit of any standard in this document"* — but nothing shipped converts logs and sign-offs into a per-competency attainment state, and nothing shipped enforces that state as a **blocking gate** (`content/journeys/competency-verification.yaml`, stage 6). The gate is not optional: ACPE 7.3.d requires APPE-readiness verified *before* APPE entry and Practice-/Team-readiness at graduation; ACPE 3.2.d requires blocking graduation clearance for a missing setting category; COCA 6.10 requires a per-student checklist satisfiable *before* fourth-year clerkships; dentistry gates continuously on procedure quotas.

**Who covers it better today:** CORE's CompMS generates auto-built assessment e-portfolios and curriculum-effectiveness reports tying student outcomes back to the map (https://corehighered.com/competency-management). New Innovations ships CCC Milestone Review aggregating evaluation data into competency spider graphs (https://www.new-innov.com/pub/gme_details.html). eMedley ships EPA entrustment ratings with growth-curve reporting, plus a published DO-school case study at Nova Southeastern's KPCOM (https://emedley.com/2026/03/17/transforming-medical-education-how-nova-southeastern-university-partnered-with-emedley-to-implement-competency-based-assessment/). one45 auto-generates MSPE letters from longitudinal feedback (https://acuityinsights.com/products/one45/assessment-and-evaluation/). Leo maps to multiple competency sets and EPAs with a mapping-completion Insights Dashboard and markets directly against tools that *"only map to your assessments or your content"* (https://www.davinci-ed.com/programs/curriculum-management-for-medical-education) — a direct hit on Prism's generic mapping description.

### Gap 4 — Nothing closes the finding → action → evidence loop, and every accreditor demands it

`coca.yaml` (Element 11.1) makes the sharpest architectural claim in the entire research set: *"This closed-loop pattern recurs across most 'continuous improvement' standards from every accreditor in this workstream — it should be a first-class object type in Accreditation Management, not bolted onto Curriculum Mapping."*

Accreditors do not accept "we collected data." They require proof that data **changed** something, traceable back to the finding that prompted it:

- **COCA 11.1** — three years of learning-outcomes assessments *plus concrete examples of curriculum, pedagogy or counseling changes made as a direct result*; **11.2** — a flowchart showing how evaluation data drives curricular improvement.
- **LCME 1.1** — CQI producing measurable outcomes used to improve program quality, with *"effective, ongoing monitoring of the program's compliance with every LCME accreditation standard"* — not a point-in-time compilation.
- **ACPE 7.5.a** — data → analysis → programmatic changes → *communication of major findings and actions to stakeholders at least annually* (an outbound step the others do not specify).
- **CODA 1-2** (broad-based, systematic, continuous), **5-3** (root-cause analysis of treatment deficiencies + implemented corrective measures over patient records), **2-2** (individual evaluation and due-process decision trail with timestamps when a student falls below published criteria).

That causal link lives in meeting minutes and email today and cannot be reconstructed at self-study time.

**Who covers it better today:** the GME-side vendors ship the loop as a workflow object, though ACGME-shaped. MedHub/E\*Value ships customizable Annual Program Evaluation forms, CLER visit/letter/**response-action** tracking, and automated alerts for accreditation tasks and policy expirations (https://www.medhub.com/accreditation-automation/). New Innovations ships CLER Visit Management, ACGME NAS Accreditation Tools with *"problem identification and correction capabilities,"* and APE with **citation/concern tracking** (https://www.new-innov.com/pub/gme_details.html). The response-action object already exists in those products and would need re-pointing at COCA/LCME/ACPE/CODA elements rather than inventing. On the UME side nobody documents a finding→action→evidence record with an audit trail — `content/journeys/accreditation-self-study.yaml` (stage 7) calls this *"the most winnable structural gap in the journey."*

### Gap 5 — External outcome data arrives with publication clocks and automatic triggers, and Prism ingests none of it

Every domain's terminal evidence is owned by a body outside the school: NBOME (COMLEX-USA), NBME/FSMB (USMLE), JCNDE (INBDE/DLOSCE), NABP (NAPLEX/MPJE), ADEX (regional clinical exams), AAMC/ERAS and ACGME/NRMP (Match). Nothing shipped ingests or reports any of it (`content/journeys/accreditation-self-study.yaml`, stage 5).

Two scoping traps sit inside this gap:

1. **This is an import/reporting integration, not exam delivery.** `coca.yaml` is explicit: *"Scope this as an NBOME data-import/reporting integration, not as exam delivery — Prism does not and cannot administer COMLEX-USA itself; NBOME proctors it."* Scoping the Q2 2027 Exam Management pillar as authoring/proctoring builds the wrong thing for these four domains.
2. **Several requirements are timers and state machines, not reports.** COCA 11.4 requires four years of first-time pass rates published on a **public webpage within 30 days** of each NBOME annual update, plus a mandatory improvement plan the moment a cohort falls >2 SD below the mean and under 90%, with a three-consecutive-year out-of-compliance clock. COCA 11.5 requires a continually updated public 4-year PGY-1 placement rate with a mandatory improvement plan below 95%. LCME 9.8 attaches a numeric six-week grade-release SLA.

**Who covers it better today:** MedHub/E\*Value directly imports ACGME survey results into program scorecards, imports case-log and milestone data, integrates AAMC ERAS demographic data, and auto-imports PubMed scholarly activity (https://www.medhub.com/software/). New Innovations imports directly from the ACGME Resident Case Log System (https://www.new-innov.com/pub/gme_details.html). one45's Analytics pulls NBME CBSE/CCSE data and integrates ExamSoft into a "Gateway exams" dashboard (https://one45software.na2.teamsupport.com/knowledgeBase/18353436).

**Genuine white space:** CORE ELMS has **no** publicly verifiable exam module at all — searched across product pages, PeopleGrove's page, and Capterra/G2 with no result (`content/competitors/core-elms.yaml`) — and one45 has no native exam engine, only third-party aggregation. Exam **ingestion** is claimable; exam delivery is not the fight.

---

## 2. Gap table — domain × standard area × Prism fit × who covers it better

Fit ratings are quoted from the `prism_fit` field of the corresponding accreditation file. "Competitor(s) ahead" lists only vendors with a *publicly documented shipped* capability covering that area, per `content/competitors/*.yaml`.

### 2.1 DO — COCA (`content/accreditation/coca.yaml`)
Standards doc: COCA 2026 COM Continuing Accreditation Standards, effective July 1 2026 — https://osteopathic.org/wp-content/uploads/COCA-2026-COM-Continuing-Accreditation-Standards.pdf

| Element | Standard area | Prism fit | Competitor(s) ahead |
|---|---|---|---|
| 6.9 | Clinical education: rotation types, executed site agreements, 3-yr rolling capacity average, contingency plan | Configure | CORE ELMS (affiliation-agreement tracking + expiry alerts); eMedley eKeeper (agreements + preceptor pay); eMedley eduSched (site capacity mgmt) |
| 6.10 | Clinical experience: resident-present / DO-supervised / inpatient rotation attributes → per-student checklist | Configure | None documented — no competitor publicly enforces accreditor-specific rotation attributes at assignment time |
| 6.11 | **Comparability across clinical education sites — statistical analysis report** | **Gap** | None documented — closest is New Innovations APE trend analysis (ACGME-shaped, not UME cross-site) |
| 6.4 | Osteopathic core competencies incl. OPP/OMM — curriculum map | Configure | Elentra (names AACOM Osteopathic Core Competencies); Leo (multi-competency-set + EPA mapping); eMedley eCurriculum |
| 5.4 | Patient-care supervision policy + distribution/attestation proof | Configure | MedHub/E\*Value (automated onboarding document collection — collection, not gating) |
| 10.2 | Affiliated GME registry, accreditation status, PGY-1 position counter | Configure | MedHub, New Innovations (native ACGME program modelling) |
| 11.1 | **Program assessment — 3 yrs of outcomes + changes made as a direct result** | **Gap** | MedHub/E\*Value (APE + CLER response-action tracking); New Innovations (APE + citation/concern tracking) |
| 11.2 | Student evaluation of instruction (confidential, forms on file, improvement flowchart) | Configure *(corrected 2026-09-02, was mislabeled Gap)* | Elentra, one45, eMedley (eValuate+), Leo, MedHub/E\*Value, CORE ELMS all ship surveys today — Prism's Surveys pillar is shipped too, per capability-map.yaml; this is instrument/cadence configuration |
| 11.4 | **COMLEX-USA pass rates: 30-day public publication + 2SD/<90% improvement trigger** | **Gap** | MedHub/E\*Value (ACGME survey/case-log import); one45 (NBME CBSE/CCSE ingest) |
| 11.5 | **GME placement rate: public 4-yr PGY-1 rate, <95% improvement plan** | **Gap** | MedHub (AAMC ERAS integration); New Innovations (GME-native) |
| 11.8 | Mandatory COCA student survey — promotion proof + findings/actions report | Configure *(corrected 2026-09-02, was mislabeled Gap)* | Same as 11.2 — survey delivery is shipped; the promotion-proof/findings-report format is the configuration work |
| 11.9 | **COCA annual & mid-cycle report submission mapped to COCA's field taxonomy** | **Gap** | Elentra (names COCA explicitly); Leo (LCME/COCA site-visit readiness); MedHub/E\*Value (ADS-formatted report generation); New Innovations (NAS tools) |

**DO-specific structural note:** the OMM/OMT competency — 200-500 hours of hands-on manipulative medicine assessed **during** clerkships (https://www.aacom.org/become-a-doctor/about-osteopathic-medicine/omm-explained) — has no analog in any other domain and must live on the rotation record, not just the pre-clinical curriculum. And COCA 10.3 requires modelling "Osteopathic Recognition" (an AOA/ACGME joint credential) as its own status, not collapsed into generic ACGME accreditation.

### 2.2 Pharmacy — ACPE (`content/accreditation/acpe.yaml`)
Standards doc: ACPE Standards 2025, effective fall 2025 — https://www.acpe-accredit.org/wp-content/uploads/ACPEStandards2025.pdf

| Element | Standard area | Prism fit | Competitor(s) ahead |
|---|---|---|---|
| 3.1.a | IPPE structure & sequencing across Pre-APPE curriculum | Transfer | CORE ELMS (SmartMatch, 90% of U.S. pharmacy programs) |
| 3.1.b | IPPE hours: ≥300 total, ≥75 community, ≥75 hospital, **simulation excluded** | Configure | None documented enforcing setting-category sub-thresholds with simulation exclusion |
| 3.2.a | APPE continuity of care + diverse patient-population exposure (age/gender/race/socioeconomic) | **Gap** | None documented — no vendor rolls up patient-population demographics per rotation |
| 3.2.b / 3.2.d | APPE: ≥1,440 hrs, ≥160/APPE, four required settings, NTPD assessed-equivalent record | Configure | CORE ELMS (hours/timesheets); MedHub/E\*Value (hour tracking + reminders) |
| 3.2.c | APPE timing: sequenced after IPPE/didactic completion; capstone excluded from the 1,440-hr count | Configure | None documented — a prerequisite-gating rule, not a shipped feature elsewhere |
| 3.2.e | Elective APPE non-patient-care hour cap (≤320 of 1,440) | Configure | None documented enforcing the cap in real time |
| 3.3.a | Preceptor criteria: licensure record, majority-U.S.-licensed test per student | Configure | CORE ELMS (preceptor license tracking); New Innovations (Credentialling Module); MedHub (NPDB/NPPES) |
| 3.3.b | Preceptor credentials/expertise explicitly linked to the course they precept | Configure | CORE ELMS / New Innovations track credentials, but not course-linked |
| 3.3.c | Preceptor orientation **before** accepting a student + PD log | Configure | MedHub/E\*Value (document collection — no vendor documents a *blocking* orientation gate) |
| 3.3.d | Preceptor engagement in curriculum CQI, especially the experiential component | Configure | None documented — survey participation tracking exists generically, not CQI-scoped |
| 3.3.e | Student-to-preceptor ratio 2:1 maximum, real-time block | Transfer | None documented enforcing the cap at assignment time |
| 3.4.a | Practice facility quality criteria: licensure + outcome-achievement evaluation | Configure | CORE ELMS (Site Assessment); axiUm (site profiles, dental-specific) |
| 3.5.a | Experiential education personnel: leader qualifications + staffing adequacy | **Gap** | None documented — no vendor models institutional staffing ratios |
| 3.5.b | Executed, current affiliation agreement per practice facility | Configure *(corrected 2026-09-13, was mislabeled Gap — the ACPE accreditation record's own 3.5.b rating was corrected to Configure on 2026-09-10: Compliance Management's shipped "Contracts with expiry alerts" tracks affiliation agreements per location)* | CORE ELMS; eMedley eKeeper — both ship agreement tracking with expiry alerts today |
| 3.5.c | Student remuneration/employment attestation (no pay, no self-placement conflict) | Configure | None documented as a distinct attestation type |
| 2.2.d | Curriculum/APPE mapping to 2.1.a-m outcomes (from AACP COEPA 2022) | Transfer | CORE CompMS; Leo; Elentra; eMedley — all rated "ahead" on named-taxonomy depth |
| 7.3.c | Experiential QA: standardized components + consistent assessment across sites | Transfer | None on drift analytics — CORE's own reviewers call its reporting suite shallow |
| 7.3.d | APPE-ready / Practice-ready / Team-ready attainment + readiness **gate** | Configure | CORE CompMS; New Innovations CCC Milestone Review; eMedley EPA growth curves |
| 7.5.a | CQI using AACP standardized graduating-student/faculty/preceptor surveys | Configure *(corrected 2026-09-02, was mislabeled Gap — Surveys pillar is shipped per capability-map.yaml, confirmed 2026-08-26)* | CORE ELMS survey module; E\*Value; eMedley eValuate+; Elentra; one45; Leo |
| 7.5.b | **Continuous compliance — standards-to-evidence repository, gap tracking, self-study assembly** | **Gap** | CORE CompMS (explicit ACPE/CAPE alignment); Elentra (names ACPE) |

<!-- ADDED 2026-09-10: the four rows above the original 12 existed at time of
writing but were never captured (3.2.a, 3.2.c, 3.2.e, 3.3.b, 3.3.d, 3.4.a, 3.5.a,
3.5.c — 8 total). Same sourcing as the rest of this table:
accreditation/acpe.yaml, researched against the live ACPE Standards 2025 PDF. -->

**The academic literature agrees with 7.3.d and 3.3.a/3.3.c specifically, not just this repo's own read.** A 2026-09-10 research pass (`content/trends/pharmacy.yaml`, `content/sources/registry.yaml`) found real peer-reviewed evidence that the "readiness gate" and "preceptor gating" elements above are live, unsolved problems in the field, not just this repo's own inference:
- **7.3.d's "APPE-ready" gate has no agreed definition anywhere in the literature** — a 2025 study found no professionally recognized definition of "APPE-ready" exists; programs instead survey preceptors on which EPAs matter most and which indicators signal non-readiness (ScienceDirect, `article-sciencedirect-appe-readiness`). A companion 2025 scoping review of 24 studies found EPA-based assessment is trending toward direct practice observation as the dominant method, not a hardened instrument any vendor ships (PMC, `article-pmc-epa-scoping-review-2025`).
- **3.3.a/3.3.c's preceptor gating needs to be *calibrated*, not just enforced.** A study of 509 students, 12,426 assessments, and 557 preceptors found raw preceptor ratings need year-based calibration ceilings (max rating capped by program year) to mean the same thing across preceptors and cohorts (PMC, `article-pmc-entrustment-scale-calibration-2025`) — a real, sourced answer to *how* a preceptor-orientation gate should actually score, not just whether one exists.
- **3.4.a/3.5.a's site-and-staffing gaps are named as structural, not incidental**, in a PubMed-indexed account of experiential-site capacity: inter-program competition for the same sites, site saturation, and preceptor workplace demands/burnout (`article-pubmed-site-capacity-barriers`).

These are cited in full, with URLs, publishers, and access dates, in `content/sources/registry.yaml` and rendered on `/domains/pharmacy/trends` — not repeated here to avoid two copies of the same citation drifting apart.

**Pharmacy-specific scoping constraint:** ACPE retired AACP's AAMS and now operates its **own** submission platform, **PHARMS**, effective with Standards 2025 (July 2025). `acpe.yaml` is emphatic: Prism's Accreditation Management pillar should be scoped as an evidence-aggregation/**export** layer feeding PHARMS, not a competing self-study portal — ACPE, not the vendor, owns the system of record for submission. Also: state boards license the practice **facilities**, and multi-campus/distance programs routinely cross state lines, so site records need a per-state licensure dimension, not one national status.

### 2.3 Dentistry — CODA (`content/accreditation/coda.yaml`)
Standards doc: CODA Accreditation Standards for Dental Education Programs, reflecting the Aug 8 2025 Commission action (Standards 1-4 and 4-4 **suspended indefinitely**) — https://coda.ada.org/-/media/project/ada-organization/ada/coda/files/predoc_standards.pdf

| Element | Standard area | Prism fit | Competitor(s) ahead |
|---|---|---|---|
| 1-2 | **Institutional effectiveness — continuous planning/assessment/improvement (self-study backbone)** | **Gap** | axiUm ("CODA-Ready Reporting", ~90% of U.S. dental schools); Elentra (names CODA) |
| 2-1 | Advance course information / syllabus publication | Transfer | — |
| 2-2 | Individual evaluation + due-process trail when a student fails criteria | Configure | None documented — case-management trail is white space |
| 2-5 | Competency-linked assessment instruments (OSCE, clinical skills testing) | Configure | eMedley eValuate + ExamN; Elentra Assessment & Evaluation (proctored exams); one45 EPAs/WBAs |
| 2-6 | Comparable instruction across sites via **faculty calibration** tracking | Configure | New Innovations (certification expiry alerts, closest analog); no vendor ships calibration natively |
| 2-8 | Curriculum management plan / course-to-competency crosswalk | Transfer | Leo; CORE CompMS; Elentra — all "ahead" on mapping depth. **axiUm has no curriculum-mapping module at all** |
| 2-9 | Adequate patient experiences to achieve competency (volume + pacing alerts) | Transfer | axiUm (student-patient matching against graduation requirements, chairside) |
| 2-24 | **~15 clinical competency categories (a-o) evidenced by procedure-level logs** | **Gap** | axiUm (fused EHR + billing + competency grading; faculty approve treatments in-system) |
| 4-6 | Written agreements for non-owned sites | Configure | CORE ELMS; eMedley eKeeper |
| 5-3 | **Patient-care CQI: chart-audit sampling, deficiency coding, root-cause analysis, corrective action** | **Gap** | axiUm (Custom Query Engine / Info Manager — ad hoc, not structured) |
| 3-4 | Faculty evaluation process (teaching, patient care, scholarship, service) | Configure | None documented — no vendor ships a faculty-facing evaluation workflow |

**Dentistry-specific structural note:** CODA 2-24 and 5-3 both need CDT-coded, tooth/surface-level procedure logging. `coda.yaml` calls this *"likely the single largest dentistry-specific build if Prism enters this domain"* and adds a design constraint: any dental procedure log *"should speak CDT natively rather than inventing a parallel taxonomy, since programs' existing clinic systems, insurance workflows, and CODA site-visit reviewers all already think in CDT"* (https://www.ada.org/publications/cdt). Dentistry also inverts the rotation model entirely — a longitudinal comprehensive-care patient panel the student recruits and retains, ~32 hrs/week in years 3-4, with per-procedure faculty sign-off (https://www.dental.upenn.edu/admissions-academics/dmd-program/clinical-education/). Prism's placement engine does not map onto chair/operatory scheduling.

**Competitive opening in dentistry:** CORE's dental page conspicuously makes **no** CODA-specific claim the way its pharmacy page makes an ACPE-specific one (https://corehighered.com/core-for-dental) — `content/competitors/core-elms.yaml` names this *"a specific, provable gap in CORE's dental depth Prism can target first."* And axiUm, at ~85-90% penetration, has no external-placement engine, no discrete student compliance-item tracker, no curriculum-mapping module, and no exam module (https://www.axiumacademic.com/platform/practice-management/) — its reviewers rate it 3.1/5 on Capterra and describe it as *"outdated like a program created in the early 90s"* (https://www.capterra.com/p/130811/axiUm/reviews/). The realistic entry is complementary aggregation plus dental-adjacent allied programs that genuinely route students externally, not displacing the clinical EHR.

### 2.4 Medicine — LCME (`content/accreditation/lcme.yaml`)
Standards doc: *Functions and Structure of a Medical School*, March 2023 edition, elements effective July 1 2024 — https://education.med.wustl.edu/app/uploads/2023/07/2024-25-Functions-and-Structure-of-a-Medical-School.pdf (LCME republishes annually and renumbers/retires elements after public comment — verify numbering before external use)

| Element | Standard area | Prism fit | Competitor(s) ahead |
|---|---|---|---|
| 1.1 | **Strategic planning & CQI — ongoing monitoring of compliance with every standard** | **Gap** | Elentra (LCME ED-5/ED-7-aligned reporting, Miami Miller mock-visit reference); Leo (AAMC CI vendor since 2013); one45 (Augusta MCG full 8-year LCME accreditation); MedHub ("LCME Support"); eMedley (eCurriculum→LCME mapping) |
| 1.4 | Affiliation agreements — clause-level (authority, exposure follow-up, learning environment) | Configure | CORE ELMS; eMedley eKeeper (expiry only — no vendor documents clause-level inspection) |
| 3.1 | Resident participation in medical student education | **Transfer** | — |
| 5.5 | Resources for clinical instruction — patient volume, acuity, case mix per site | Configure | eMedley eduSched (site capacity mgmt); one45 (event-level duty-hour/leave tracking) |
| 6.2 | Required clinical experiences — published condition/skill list + per-student evidence | Configure | Leo (PET: diagnoses/procedures mapped to curriculum themes); eMedley eCLAS (ICD-10/CPT); Elentra Logbook |
| 8.4 | **Program outcomes incl. national norms (USMLE, Match), during and after enrollment** | **Gap** | MedHub/E\*Value (ACGME + ERAS import); one45 (NBME CBSE/CCSE ingest) |
| 8.5 | Medical student feedback on courses, clerkships, teachers | Configure *(corrected 2026-09-02, was mislabeled Gap)* | All six survey-shipping vendors ship this; Prism's Surveys pillar is shipped too — instrument/cadence configuration, not new capability |
| 8.6 | Central monitoring of required clinical experience completion | **Transfer** — *"the strongest fit of any standard in this document"* | — |
| 8.7 | Comparability of education/assessment across locations | Configure | None documented shipping a purpose-built comparability report |
| 9.3 | Clinical supervision attestation (named supervisor, role/level, per encounter) | Configure | New Innovations (Procedure Logger with supervision-level tracking) |
| 9.4 | Centralized assessment system tied to program objectives | Configure | CORE CompMS; New Innovations CCC Milestone Review; eMedley EPA growth curves |
| 9.7 | Formative feedback at rotation midpoint | **Transfer** — anchor-relative primitive maps ~1:1 | E\*Value (midpoint-to-end summary evals + low-score alerts); Leo (no-login on-demand eval links) |
| 9.8 | Summative assessment — grades within six weeks of clerkship end | Configure | None documented reporting on the SLA itself |

**Medicine-specific note:** supervision is a *team* (attending → fellow → resident → intern) that changes every 4-12 weeks, and a meaningful share of fourth-year rotations are **away rotations** at institutions with no prior relationship to the home school, coordinated through AAMC's VSLO — over half of students (54.9%) report declining at least one away rotation on cost grounds (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5109707/). That is the most demanding possible test of a lightweight site/preceptor onboarding path and is almost certainly handled off-system today.

---

## 3. How the Q3 2027 "Accreditation Management" roadmap item should be scoped differently

`content/prism/capability-map.yaml` already states the strategic premise: *"The domain expansion thesis (DO/Pharmacy/Dentistry/Medicine are higher-stakes, accreditation-driven buyers) and this roadmap item are the same conversation, not two separate ones — the Accreditation Management build should be scoped WITH the new-domain standards (COCA/LCME/ACPE/CODA), not just for existing disciplines."* The research turns that premise into eleven concrete scoping decisions.

### 3.1 Build two primitives, not a document generator

`content/journeys/accreditation-self-study.yaml` frames the defining structural fact as **the two-clock problem**: the journey runs on a 7-10 year cycle *and* an annual/interim obligation simultaneously, and every accreditor now writes the continuous clock into the standard itself (LCME 1.1 "ongoing," ACPE 7.5.b "on an ongoing basis," CODA 1-2 "continuous," COCA 11.9 annual + mid-cycle). Its conclusion: *"Any Accreditation Management build scoped as a self-study DOCUMENT GENERATOR solves stage 8 and misses stages 1 and 7, which are where the evidence is actually lost."*

The two first-class objects to build:

1. **A standards-to-evidence crosswalk** — the accreditor's element list as data, with evidence artifacts, owners, and freshness attached to each element, and a "this element has no evidence" alarm state.
2. **A finding → action → evidence record** — per `coca.yaml` (11.1): *"it should be a first-class object type in Accreditation Management, not bolted onto Curriculum Mapping."*

Stage 8 (assembly/submission) is then an **export**, not a portal.

### 3.2 Make the standards taxonomy versioned, with "suspended / not applicable" as a valid state

This is not a hypothetical requirement — all four accreditors moved their standards inside an 18-month window:

| Accreditor | Version event |
|---|---|
| COCA | 2026 standards approved Feb 1 2026, **effective July 1 2026**, applying to reviews after Feb 1 2027 — supersedes the 2023 set |
| ACPE | **Standards 2025** approved June 14 2024, updated June 12 2025, effective for evaluations from fall 2025 — supersedes Standards 2016 |
| CODA | Aug 8 2025 Commission action **suspended Standards 1-4 and 4-4 indefinitely**; Standard 1-3 Intent Statement revised |
| LCME | Republishes annually and *"does periodically renumber/retire elements after public comment"* — a 2026-27 edition already exists |

A spreadsheet crosswalk silently rots against all four (`content/journeys/accreditation-self-study.yaml`, stage 1). The data model must carry `standard_version` as a dimension, support element renumbering/retirement with evidence carried forward, and treat **"suspended — not applicable this cycle" as a required state, not an error state** (the CODA case).

### 3.3 Ship threshold triggers and publication clocks as workflow, not as reports

Three requirements are timers and state machines:

- **COCA 11.4:** publish four years of first-time COMLEX-USA pass rates on a public page **within 30 days** of each NBOME annual update; auto-open an improvement plan when a cohort falls >2 SD below the mean *and* under 90%; three consecutive years of shortfall = out-of-compliance finding.
- **COCA 11.5:** continually updated public 4-year PGY-1 placement rate; improvement plan mandatory below 95%.
- **LCME 9.8:** grades released within six weeks of clerkship end — and leadership must be able to *report on* the SLA, not just be reminded of it.

`content/journeys/accreditation-self-study.yaml` (stage 7) notes the consequence for the DO domain specifically: *"the DO loop must fire from a threshold, not from a committee's judgment."* No competitor is documented as automating a threshold-triggered improvement plan against a named accreditor rule. This is a small, provable, standard-citable differentiator.

### 3.4 Put cross-site comparability *statistics* inside the pillar — do not assume they fall out of the rotation engine

`coca.yaml` (6.11) says this verbatim: comparability *"should be scoped explicitly into the Accreditation Management build rather than assumed to fall out of the rotation engine."* The requirement is inferential — variance/effect-size by site, flagging sites outside the comparable-outcomes band — and it recurs as LCME 8.7, ACPE 7.3.c (cross-site grading drift), and CODA 2-6 (faculty calibration).

Critically, this gap **fails silently and early but is discovered late**: you cannot compute site-level variance from data that was never tagged by site, and by self-study time the tagging window has closed on years of records (`content/journeys/accreditation-self-study.yaml`, stage 6). So the site-tagging requirement on assessment records must land in Clinical & Experiential Education **before** Q3 2027, or the pillar ships with no data to analyze.

This is also the single best differentiation target in the whole corpus: *"Nobody clearly wins this stage."* CORE's own reviewers say its reporting suite *"lacks depth and consistency"* (https://www.capterra.com/p/265422/CORE-ELMS/reviews/); axiUm's story is ad hoc query building; New Innovations' CCC spider graphs are ACGME/GME-shaped, not UME cross-site-shaped.

### 3.5 Scope the pillar as an export layer feeding externally-owned submission systems

Three named, externally-owned targets already exist and the product does not own any of them:

| Domain | Submission target | Note |
|---|---|---|
| Pharmacy | **ACPE PHARMS** | Live since July 2025, replacing AACP's discontinued AAMS. ACPE, not the vendor, owns the system of record |
| DO | **COCA annual & mid-cycle report field taxonomy** | `coca.yaml`: model COCA's exact field structure, *"not a generic evidence binder"* |
| Medicine | **AAMC Curriculum Inventory** | A separate parallel submission with its own business rules |

Leo/DaVinci sets the model worth copying: one-click CI submission with **AAMC business rules built in to flag data errors pre-submission** (https://www.davinci-ed.com/resources/mapping-for-curriculum-inventory-accreditation-insight-dashboard). Validate-before-submit against the accreditor's own rules is the shape of the feature, not "generate a Word document."

### 3.6 Do not build it MD/ACGME-first — four-accreditor-native is the one axis no incumbent covers

The convergent recommendation across five independent competitor files (`one45.yaml`, `emedley.yaml`, `new-innovations.yaml`, `medhub.yaml`, `core-elms.yaml`) is the same. The evidence:

- MedHub/E\*Value's Accreditation Automation is documented as **ACGME/GME-specific** (NAS, CLER, ADS) — a DO/Pharmacy-native accreditation workflow is *"a capability MedHub has not publicly demonstrated"* (`content/competitors/e-value.yaml`).
- New Innovations' tooling is likewise ACGME-shaped (NAS, CLER, APE, CCC).
- CORE ELMS makes an explicit ACPE claim on its pharmacy page and **no CODA claim** on its dental page.
- eMedley has **no standalone accreditation module at all** — its accreditation story is folded into eCurriculum's LCME mapping, and its references are LCME-centric (`content/competitors/emedley.yaml`).
- axiUm's "CODA-Ready Reporting" appears to be Custom Query Engine / Info Manager ad hoc reporting rather than structured standard-by-standard evidence mapping.

Only Elentra names all four (LCME/COCA/ACPE/CODA + CACMS + ARC-PA) — and `content/competitors/elentra.yaml` notes that detail appears only on a discipline page, with the general accreditation feature page *"thin on specifics."* Elentra also carries integration risk from stacking two acquisitions (Skyfactor Benchworks, DaVinci/LCMS+) onto its own platform within roughly a year of being acquired by Achieve Partners.

### 3.7 Fix the entity model *before* Q3 2027 — it is what makes half the "Configure" ratings true

22 of 48 elements are rated Configure, and a large share of those ratings are conditional on an unconfirmed assumption: that Compliance Management can point at a site, preceptor, faculty member, or affiliated GME program rather than only a student. If that extension does not exist, those Configures degrade toward Gap. Extending a **shipped** pillar to new entity types is the cheapest, fastest move in the entire plan and it is what flips ACPE 3.5.b from Gap to Transfer while simultaneously satisfying COCA 6.9, LCME 1.4 and CODA 4-6 (`content/journeys/rotation-lifecycle.yaml`, stage 1).

Add two item-type capabilities alongside it: **document-acknowledgment/attestation** (COCA 5.4 requires proof of distribution *and* acknowledgment by students, faculty and staff) and **recurring re-certification** (CODA 2-6 needs alerts when a faculty member falls *out* of calibration — a recurring-expiry gate, not a one-time checkbox).

### 3.8 Resolve the dependency trap — pull the crosswalk schema forward to Q1 2027

`content/journeys/accreditation-self-study.yaml` names this explicitly. LCME 8.4 is the warning case: it requires **all three** roadmap pillars shipped *and integrated with each other*, not merely shipped individually. *"Sequencing Accreditation Management last (Q3 2027) is correct only if Surveys and Exam Management are built with the standards-crosswalk as a known consumer from the start; otherwise Q3 2027 becomes an integration project rather than a feature project."*

Practical implication: the crosswalk **schema** (element identity, evidence attachment, version, owner) should be specified and landed with the Q1 2027 Surveys release, so survey results are born standard-tagged rather than retro-tagged.

**CORRECTION (2026-08-26):** Surveys & Course Evaluations is now `status: shipped` in `content/prism/capability-map.yaml`, per direct Exxat PM confirmation — it is no longer a Q1 2027 roadmap item, so "all three roadmap pillars" above now reads as two (Exam Management, Q2 2027; Accreditation Management, Q3 2027). The dependency-trap logic still holds for those two: the crosswalk schema still needs to exist before Accreditation Management (Q3 2027) so LCME 8.4 doesn't become an integration project. But the schema can now be scoped against Surveys as a **shipped** consumer rather than a co-dependent roadmap item — so tagging survey results as standard-linked is a Configure-level integration task today, not something waiting on a Q1 2027 ship date. Competitive depth of the shipped Surveys pillar against named competitors is not yet re-verified.

### 3.9 Sequence competency attainment *before*, not after, the pillar

`content/journeys/competency-verification.yaml` is direct: the per-student attainment-state object *"is a prerequisite for Stage 7 and Stage 8, so sequencing it after the Q3 2027 Accreditation Management pillar inverts the dependency order."* Its recommended shape: one attainment-state object with **four pluggable gate policies** — APPE-entry + graduation for Pharmacy; pre-clerkship checklist + OMM for DO; continuous quota for Dentistry; graduation-only for Medicine — fed by a domain-specific capture taxonomy. Not four products, but not one hard-coded rule either.

### 3.10 Scope the exam dependency as ingestion, and say so out loud

For all four domains the licensure exam is externally administered. `coca.yaml`: *"Any 'Exam Management' capability serving the DO domain is not an exam-authoring tool — it has to be an integration/reporting layer that ingests NBOME's official score and pass-rate reports and republishes them against COCA's compliance thresholds."* Building authoring/proctoring instead would put Prism into a fight it does not need — and would forfeit the actual white space, since CORE has no exam module at all and one45 has no native engine.

### 3.11 Clear the COCA copyright constraint with Legal before designing any AI drafting feature

`content/accreditation/coca.yaml` carries an explicit warning from the COCA standards PDF's copyright page: *"No COCA-owned data or information, including COCA Standards, policies, or forms, may be submitted (copied, typed, uploaded, or otherwise entered) into an artificial intelligence (AI) platform without the written permission of the COCA."*

This directly constrains how Leo AI could handle COCA element text in a self-study drafting feature for the DO domain — the highest-value domain in the expansion thesis. Two actions: (a) route this to Legal/Compliance before any COCA standards excerpting reaches customer-facing material, and (b) request COCA's written permission now if AI-assisted use of the standards text will be an ongoing part of the product, because the answer changes the feature design, not just the disclaimer.

---

## 4. Cross-domain patterns — gaps that appear in 3+ domains (i.e. platform-level, not domain-specific)

These are the gaps to fund once at the platform layer. Each is followed by the domains it appears in and the citations.

### Pattern A — The entity model stops at the student (4/4 domains)
Prism's gating primitive is real and shipped, but points only at students. Every accreditor asks it to point somewhere else: sites (ACPE 3.5.b, COCA 6.9, LCME 1.4, CODA 4-6), preceptors (ACPE 3.3.a/3.3.c), faculty (CODA 2-6, 3-4), any user via attestation (COCA 5.4), and affiliated GME programs (COCA 10.2 — *"tracking an affiliated GME program as the tracked entity is a new object type, not just a new item"*).
**Platform fix:** entity-generic compliance items with gate semantics, plus attestation and recurring-recertification item types.

### Pattern B — The accreditor's standard list is not data anywhere in the product (4/4 domains)
LCME 1.1, ACPE 7.5.b, CODA 1-2, COCA 11.9 — all four rated Gap, all four pointing at the same unshipped pillar. This is the difference between being *"the system of record for a self-study"* and *"just a data source for one"* (`lcme.yaml`).
**Platform fix:** versioned standards taxonomy as a first-class object, loaded with four accreditors at launch.

### Pattern C — Nothing records that a finding caused an action (4/4 domains)
COCA 11.1/11.2, LCME 1.1, ACPE 7.5.a, CODA 1-2/5-3/2-2. `coca.yaml` states the pattern explicitly: it *"recurs across most 'continuous improvement' standards from every accreditor in this workstream."* Domain-invariant in structure; varies only in trigger (DO fires from a numeric threshold; Pharmacy adds mandatory annual outbound communication; Dentistry adds a patient-care loop and a student due-process loop).
**Platform fix:** one finding→action→evidence object, four trigger policies.

### Pattern D — Cross-site comparability requires statistics the product cannot run (4/4 domains)
COCA 6.11 (statistical analysis report), LCME 8.7, ACPE 7.3.c (grading drift), CODA 2-6 (faculty calibration). *"No shipped pillar does outcome analytics"* (`coca.yaml`). Nobody in the competitive set clearly wins this, which makes it the strongest differentiation target.
**Platform fix:** mandatory site-tagging on assessment records (must precede the analytics), plus recurring comparability reporting in Accreditation Management.

### Pattern E — The terminal evidence is externally owned, in both directions (4/4 domains)
Inbound: NBOME, NBME/FSMB, JCNDE, NABP, ADEX, AAMC/ERAS, ACGME. Outbound: ACPE PHARMS, AAMC Curriculum Inventory, COCA's report fields. The product is a middle layer, not an endpoint — the correct feature shape is **validated import** and **validated export**, and getting this wrong means building an exam engine and a submission portal nobody asked for.

### Pattern F — CORRECTED 2026-08-26: Surveys & Course Evaluations is shipped, not a Q1 2027 pillar (4/4 domains)
**Original claim (now corrected): "Half the feedback loop is blocked on one Q1 2027 pillar."** COCA 11.2 and 11.8, LCME 8.5, ACPE 7.5.a, CODA 2-8 (which requires student evaluation of instruction as an input to curriculum review) were rated Gap on the same blocker: Surveys & Course Evaluations, said to ship Q1 2027. **All six comparable competitors ship this today** — Elentra, one45, eMedley (eValuate+), Leo, MedHub/E\*Value, CORE ELMS. `acpe.yaml`'s operational consequence — *"programs cannot generate this evidence inside Prism and must use an external survey tool alongside it"* — was written against that now-superseded roadmap framing.

Per direct Exxat PM confirmation (2026-08-26), `content/prism/capability-map.yaml`'s Surveys & Course Evaluations pillar is `status: shipped`: a placement-evaluation Forms engine (CIET v2, PTSE1/2, SCIPAI, PTMACS/PTAMACS and similar named instruments) plus a separate general-purpose "Exxat Surveys" builder (14 question types, multi-channel distribution, full analytics; already extended to PT and SLP). These four elements should be re-rated Configure rather than Gap, pending confirmation that the shipped builder can be pointed at each accreditor's specific instrument/cadence requirements. This is **not** a claim that Prism leads on Surveys — competitive depth against the six named competitors above has not been re-verified, only that the pillar is no longer absent.

### Pattern G — CORRECTED 2026-08-24: Prism already has an allocation engine (3/4 domains: DO, Pharmacy, Medicine)
Every serious competitor ships an allocation engine: CORE's SmartMatch (rule-based auto-matching, independently corroborated by Capterra reviewers as cutting matching time significantly), one45's three named lottery algorithms, Elentra's lottery + learner-driven elective selection, eMedley's eduSched, Leo's Clerkship Lottery, New Innovations' UME rotation lottery. **Original claim (now corrected): "No allocation, preference-ranking, or constraint-solving layer is documented anywhere in Prism's research."** That was true of the *public competitor research*, not of Prism itself — Prism's own internal PA and OT playbooks confirm **Placement Assist**: staged placement runs, difficulty-weighted specialty prioritization (e.g. Women's Health = 10, Pediatrics = 9), fed by a location- or setting-ranked wishlist, plus a **Slot Request** feature where sites confirm availability directly in-system. This is a real, shipped, comparable allocation layer — the parity gap is smaller than originally stated; the remaining open question is how it stacks up feature-for-feature against SmartMatch/named lottery algorithms, not whether Prism has one at all. See `content/prism/capability-map.yaml`. Dentistry is still the exception — there is no cohort-wide block allocation to solve, because students hold a longitudinal panel in the school's own clinic.

### Pattern H — Accreditors want *enforcement*, and competitors ship *reporting* (4/4 domains)
ACPE 3.3.e is a hard real-time block (2:1 cap); ACPE 3.2.d blocks graduation clearance on a missing setting category; ACPE 3.3.c blocks student assignment until preceptor orientation is complete; COCA 6.10 must be queryable *before* fourth-year clerkships begin; CODA gates progression continuously on procedure quotas; LCME 8.6 requires gaps be *remedied before graduation*. Per `content/journeys/preceptor-site-onboarding.yaml` (stages 4 and 6): *"No competitor in the set publicly documents a preceptor-orientation gate that BLOCKS student assignment the way ACPE 3.3.c literally requires — the closest public claims are all collection-and-reminder, not enforcement."*
**This is Prism's most defensible platform claim**, because gating is what Compliance Management already does — it just needs Pattern A's entity extension, and the rules should be built once and parameterized per accreditor rather than per customer.

### Pattern I — One placement scaffold, four incompatible log schemas (4/4 domains)
The transferable layer is the placement/assignment scaffold; the domain-specific layer is the log schema hanging off it (`content/journeys/rotation-lifecycle.yaml`, stage 5):

| Domain | Unit of evidence |
|---|---|
| Pharmacy | The **clock hour**, bucketed by setting category, simulation excluded, hard sub-thresholds (300/75/75; 1,440/160 × 4 settings) |
| DO | The **rotation with attributes** (residents present, DO supervisor, inpatient) plus 200-500 hrs of OMM/OMT manual skills |
| Medicine | The **required encounter** from a published condition/skill list, under a layered attending→resident→intern chain (multiple supervisors per encounter) |
| Dentistry | The **procedure step** — CDT-coded, tooth/surface-level, faculty-signed before the student may proceed, accumulating toward quotas |

*"A single generic 'log' object serves none of these four well."* Budget for a pluggable capture taxonomy, not a universal case-log.

### Pattern J — The lowest-tolerance user in the product has no access story (3/4 domains: DO, Pharmacy, Medicine)
The community preceptor is external, unpaid or nominally paid, has no SIS record and no university credential — and every login wall is a reason to stop hosting students, which feeds directly back into the site-capacity bottleneck that is a named, worsening problem in both DO and MD (https://thedo.osteopathic.org/2023/11/to-solve-the-problem-of-too-few-clinical-rotation-sites-leaders-in-medicine-consider-business-solutions/; https://www.aamc.org/news/so-many-medical-students-so-few-clerkship-sites). Prism's integration story (LMS/SIS, Canvas/Banner) is a student/faculty story, not an external-supervisor story. Leo sets the benchmark worth copying outright: *"on-demand evaluation links can be emailed to clinical faculty with NO LOGIN required"* (https://www.davinci-ed.com/the-davinci-difference/leo-faqs). CORE demonstrates the anti-pattern its own users complain about — changing a preceptor's employer requires a new account rather than an update (https://www.capterra.com/p/265422/CORE-ELMS/reviews/).

### The one genuine cross-domain asset — and where it breaks
Anchor-relative scheduling (publish/due dates set as N days before/after a placement's **start, MID, or end** date) is recorded in `content/prism/capability-map.yaml` as *"a real, confirmed architectural fact."* It maps almost one-to-one onto LCME 9.7's midpoint-formative-feedback requirement, and both `content/competitors/emedley.yaml` and `content/competitors/leo-davinci.yaml` explicitly note that **no competitor publicly documents an equivalent primitive**. Two caveats worth carrying:

1. The reportable that proves LCME 9.7 — *"% of student/rotation pairs with midpoint feedback delivered on time"* — is a small build on already-shipped data and is not documented at any competitor. Build it and cite the standard number in the sales motion.
2. The strongest primitive in the product is the weakest fit in exactly one domain: dentistry has no rotation midpoint to anchor to, because progression is quota- and competency-gated rather than calendar-blocked. There the anchor must be re-expressed as a threshold on quota progress.

---

## 5. Consolidated open questions blocking a confident plan

Carried forward from `content/prism/capability-map.yaml` and the journey files; each one changes a fit rating if answered.

1. Does Compliance Management support **non-student entity types** (site, preceptor, faculty, affiliated GME program)? Blocks Pattern A in all four domains. Determines whether ~8 Configure ratings hold.
2. Does it support **document-acknowledgment/attestation** item types, not only checklist/expiry? Blocks COCA 5.4.
3. Does the placement record support a **custom setting-category taxonomy with sub-threshold enforcement and simulation exclusion**? Blocks ACPE 3.1.b.
4. Does the Q3 2027 Accreditation Management scope cover **standard-level mapping or only evidence aggregation**? Stages 1, 7 and 8 of the self-study journey all hinge on the answer.
5. **Legal:** can COCA standards text be processed by AI-assisted features at all, given the copyright notice in `content/accreditation/coca.yaml`? Blocks any AI drafting feature for the DO domain.
6. Is a **CDT-coded, tooth/surface-level procedure log** in scope for dentistry entry? Determines whether the domain is viable at all (CODA 2-24, 5-3).
7. Is there any **allocation/matching engine** in Prism today? Six competitors ship one; nothing in the research documents Prism's.
8. Does Prism have any **post-graduation outcome record** (Match, licensure, placement)? COCA 11.5 and LCME 8.4 both require it, and it sits past the placement engine's horizon.

---

## Appendix — file index

| Path | Contents |
|---|---|
| `content/prism/capability-map.yaml` | 6 core-ring pillars (3 shipped, 3 dated 2027), intelligence layer, Exxat Advantage ring, anchor-relative scheduling primitive, Phase 2 open questions |
| `content/domains/{do,pharmacy,dentistry,medicine}.yaml` | Market size/trend, standards bodies, clinical education shape, distinctive pain points |
| `content/accreditation/{coca,lcme,acpe,coda}.yaml` | 48 numbered elements with evidence requirements, required software behavior, `prism_fit`, gap notes, page-level source citations; plus licensure/GME layer per domain |
| `content/competitors/{elentra,e-value,medhub,new-innovations,one45,emedley,leo-davinci,core-elms,axium}.yaml` | Per-pillar feature teardown with `depth_vs_prism`, strengths, weaknesses, retention anchor, Exxat opportunity, pricing signal |
| `content/journeys/{accreditation-self-study,rotation-lifecycle,preceptor-site-onboarding,competency-verification}.yaml` | 8-stage journeys with current Prism state, pain/gap, accreditation link, competitor comparison, domain variance |
| `content/scorecard/where-to-play.yaml` | **Unscored** — criteria and weights defined, all scores still 0; this analysis is the input needed to fill it |

**Note on the scorecard:** `content/scorecard/where-to-play.yaml` still carries zeros across all five criteria and an empty `recommended_beachhead`. The "Prism pillar fit (transfer vs build)" criterion carries the highest weight (0.25) and can now be scored directly from §0's Transfer/Configure/Gap distribution — which points the opposite way from the market-size narrative for DO.
