# The Vocabulary-Ahead Glossary

**Purpose.** Exxat's team already speaks allied health fluently — CAPTE, ACOTE, CPI, FWPE roll off the tongue in the first ten minutes of a discovery call. This document is the equivalent for the four expansion domains: **DO, Pharmacy, Dentistry, Medicine**. The bar is *vocabulary-ahead*: when a dean or a director of clinical education uses a term, we should already know what it is, which Prism pillar it touches, and how to say something useful back.

**How to use it.**
- Each entry is `Term → plain-English definition → why it matters to Prism → how to say it to a dean`.
- The "say it to a dean" line is a *messaging equivalent*, not a claim of shipped capability. Where a pillar is roadmap, the line is written to be honest about that.
- Every entry cites the on-disk research file it came from, and the primary source that file cites.

**Prism pillars referenced throughout** (per `content/prism/capability-map.yaml`):

| Pillar | Status |
|---|---|
| Clinical & Experiential Education | Shipped |
| Compliance Management | Shipped |
| Curriculum Mapping | Shipped |
| Surveys & Course Evaluations | ~~Roadmap — Q1 2027~~ **Shipped** *(corrected 2026-08-26 — see note below)* |
| Exam Management | Roadmap — Q2 2027 |
| Accreditation Management | Roadmap — Q3 2027 |
| Intelligence layer | Early-risk Alerts · Competency Tracking · Program Quality Analytics · Recommendations · AI Insights (Leo AI) |

> **CORRECTION (2026-08-26), per direct Exxat PM confirmation:** Surveys & Course Evaluations was
> listed above as "Roadmap — Q1 2027." That was wrong as stated. `content/prism/capability-map.yaml`
> now records `status: shipped` for this pillar: a placement-evaluation Forms engine (CIET v2,
> PTSE1/2, SCIPAI, PTMACS/PTAMACS and similar named instruments) plus a separate general-purpose
> "Exxat Surveys" builder (14 question types, multi-channel distribution, full analytics — already
> extended to PT and SLP). This is not a claim that Prism leads on Surveys — competitive depth
> against named competitors has not been re-verified — only that it is shipped, not absent. Every
> glossary entry below that says "our roadmap is Q1 2027" for this pillar is corrected in place,
> not silently rewritten. This correction is scoped to Surveys & Course Evaluations only — Exam
> Management (Q2 2027) and Accreditation Management (Q3 2027) are unaffected and remain accurate.

> **Legal flag before any customer-facing reuse.** The COCA 2026 standards PDF carries an explicit notice prohibiting entry of COCA-owned text into an AI platform without written permission. The DO research on disk was built by AI-mediated fetching and *paraphrases* rather than reproduces that text. Clear COCA-derived content with Legal/Compliance before it appears in a deck, a battlecard, or a website. Source: header note in `content/accreditation/coca.yaml`.

---

## 0. The Rosetta Stone — translating from what we already know

The fastest way to get fluent is to map each new term onto the allied-health equivalent the team already uses daily.

| What we say today (allied health) | DO | Pharmacy | Dentistry | Medicine |
|---|---|---|---|---|
| CAPTE / ACOTE (the accreditor) | **COCA** | **ACPE** | **CODA** | **LCME** |
| NPTE / NBCOT (the licensure exam) | **COMLEX-USA** (NBOME) | **NAPLEX + MPJE** (NABP) | **INBDE** (JCNDE) **+ a regional clinical exam** (ADEX) | **USMLE Step 1 / 2 CK / 3** (NBME + FSMB) |
| CPI / FWPE (the clinical evaluation instrument) | Clerkship evaluations + a separate **OMM/OPP** manual-skills competency | Preceptor evaluation per **IPPE/APPE**, mapped to **COEPA** outcomes | Per-procedure faculty sign-off + **competency exams** | Direct-observation forms mapped to **EPAs**; **MSPE** as the summative export |
| Clinical rotation | **Core / required rotation** (4-week blocks, OMS-3/4) | **IPPE** (longitudinal) then **APPE** (block) | **Comprehensive care** on a student's own patient panel | **Core clerkship**, then **sub-internship** and **away rotation** |
| Clinical instructor / CI | **Preceptor** (often a community DO, individually recruited) | **Preceptor** (licensed pharmacist, max 2:1) | **Clinical practice unit** faculty, chairside | **Attending → resident → intern** (a hierarchy, not one person) |
| "The program is accredited" | Plus: graduates must **Match** into ACGME residency | Plus: two exams + state intern hours | Plus: a hands-on state/regional clinical exam | Plus: **Match** into ACGME residency; degree is not the end of the pathway |
| Self-study | COCA **annual + mid-cycle reports** | ACPE self-study submitted through **PHARMS** | CODA self-study + site visit | LCME **DCI** (Data Collection Instrument) + full survey visit |

Source: `content/domains/*.yaml`, `content/accreditation/*.yaml`, `content/personas/role-program-admin.yaml`.

---

## 1. Cross-domain terms — true in all four

These come up in every conversation regardless of domain. Learn these first.

### Self-study
**What it is.** The program's own written, evidence-backed argument that it meets every standard, assembled before an accreditor's site visit. Every accreditor in scope requires one; the formats differ (COCA annual/mid-cycle reports, LCME DCI, ACPE via PHARMS, CODA self-study report).
**Why it matters to Prism.** This is the demand that the roadmap **Accreditation Management** pillar (Q3 2027) exists to meet. No shipped pillar today assembles cross-pillar evidence into an exportable self-study narrative — `content/accreditation/coda.yaml` calls this "the single item the capability map itself calls the most load-bearing gap for the whole domain-expansion thesis."
**Say it to a dean.** "Most of the self-study isn't writing — it's finding the evidence. Our goal is that the evidence is already assembled the day you start writing, because it was captured as the year happened."
*Source: `content/accreditation/coda.yaml` (Standard 1-2); `content/accreditation/lcme.yaml` (Element 1.1); `content/prism/capability-map.yaml`.*

### CQI (Continuous Quality Improvement)
**What it is.** The accreditor's requirement that the program monitor its own compliance *year-round*, not in a sprint before the visit — and prove that data actually changed a decision. LCME Element 1.1 and COCA Element 11.1 both demand a documented "finding → action → evidence" loop.
**Why it matters to Prism.** `content/accreditation/coca.yaml` notes this closed-loop pattern "recurs across most 'continuous improvement' standards from every accreditor in this workstream — it should be a first-class object type in Accreditation Management, not bolted onto Curriculum Mapping."
**Say it to a dean.** "The hard part of CQI isn't collecting data — it's proving three years later that a specific finding led to a specific change. That link should be a record, not a memory."
*Source: `content/accreditation/lcme.yaml` (Element 1.1); `content/accreditation/coca.yaml` (Element 11.1).*

### Citation / out-of-compliance / monitoring
**What it is.** The escalation ladder. A **citation** is a finding against a specific standard. Sustained failure produces an **out-of-compliance** determination, which triggers a required **improvement plan** and, in the worst case, adverse action against accreditation status. Several thresholds are automatic and three-year-clocked (see *COMLEX-USA* and *GME placement rate* below).
**Why it matters to Prism.** This is the dean's actual buying question. `content/personas/role-dean.yaml`: "will this reduce the probability that my program receives a citation, and will it tell me a cohort is in trouble while I can still do something about it?"
**Say it to a dean.** "We're not selling you a reporting tool. We're selling you the twelve months of warning before a threshold becomes a finding."
*Source: `content/personas/role-dean.yaml`; `content/accreditation/coca.yaml` (Elements 11.4, 11.5).*

### Affiliation agreement
**What it is.** The executed written contract between the school and a clinical site it does not own, defining each party's responsibilities. Required by **every** accreditor in scope: LCME 1.4, COCA 6.9, ACPE 3.5.b, CODA 4-6.
**Why it matters to Prism.** Rated **Gap** in `acpe.yaml` and **Configure** in `lcme.yaml`/`coda.yaml`/`coca.yaml` — the split is itself the finding. Compliance Management today is confirmed as a *student*-level item tracker (immunizations, background checks, certs); pointing that same expiry-and-gating model at a *site*-level contract is an open Phase 2 question in `content/prism/capability-map.yaml`.
**Say it to a dean.** "A lapsed agreement at a site you already have students rotating through is the most avoidable citation there is. The system should refuse to schedule into it."
*Source: `content/accreditation/lcme.yaml` (1.4); `content/accreditation/acpe.yaml` (3.5.b); `content/accreditation/coda.yaml` (4-6); `content/accreditation/coca.yaml` (6.9).*

### Comparability
**What it is.** The requirement that the same course or clerkship delivers equivalent experience and equivalent assessment at *every* site or campus where it runs — so a student's outcome doesn't depend on which site they drew. LCME 8.7, COCA 6.11, CODA 2-6, ACPE 7.3.c.
**Why it matters to Prism.** The single most consistently under-served standard across all four accreditors. COCA 6.11 goes furthest — it wants a *statistical* cross-site comparison report. `content/accreditation/coca.yaml` rates it a **Gap** and recommends scoping it explicitly into Accreditation Management "rather than assumed to fall out of the rotation engine."
**Say it to a dean.** "You added community sites to absorb enrollment growth. Comparability is the promise that gets hardest to keep exactly when you do that — so it should be monitored continuously, not audited once."
*Source: `content/accreditation/lcme.yaml` (8.7); `content/accreditation/coca.yaml` (6.11); `content/accreditation/coda.yaml` (2-6); `content/accreditation/acpe.yaml` (7.3.c).*

### EPA (Entrustable Professional Activity)
**What it is.** A unit of professional work a learner can be trusted to perform unsupervised — the assessment vocabulary that has largely replaced abstract competency checklists in health professions education. Assessment is expressed as an *entrustment level*, not a score. Each domain has its own named set: AAMC **Core EPAs** for medicine, AACP **COEPA** for pharmacy.
**Why it matters to Prism.** The **Competency Tracking** intelligence-layer capability is the natural home. `content/journeys/competency-verification.yaml` records "no documented EPA/entrustment dimension, no mapping-completion dashboard, and no evidence of shipped support for named external taxonomies (AACP COEPA, …)" — meanwhile competitors ship it (eMedley's eValuate has EPA entrustment ratings; Elentra supports AAMC Core EPAs).
**Say it to a dean.** "If your faculty are already grading in entrustment language, the system should store the entrustment level, not flatten it into a percentage."
*Source: `content/journeys/competency-verification.yaml`; `content/personas/lens-emedley.yaml`; `content/personas/lens-elentra.yaml`; `content/accreditation/acpe.yaml` (COEPA, licensure_or_gme_layer).*

### OSCE (Objective Structured Clinical Examination)
**What it is.** A standardized, station-based practical exam with a scored rubric and (usually) standardized patients. The default format for assessing clinical skill rather than knowledge.
**Why it matters to Prism.** Sits on the seam between the shipped Forms/Evaluations workflow in **Clinical & Experiential Education** and the roadmap **Exam Management** pillar (Q2 2027). CODA 2-5 names OSCEs explicitly as acceptable evidence; `content/accreditation/coda.yaml` flags that "exam-grade assessment delivery is not yet shipped."
**Say it to a dean.** "Rubric-scored direct observation we handle today. Proctored, exam-grade delivery is on the roadmap — I'd rather tell you which is which than blur them."
*Source: `content/accreditation/coda.yaml` (2-5); `content/prism/capability-map.yaml`.*

### GME (Graduate Medical Education) / PGY-1
**What it is.** Post-degree residency training. **PGY-1** is postgraduate year one — the intern year. For MD and DO the degree is *not* the end of the pathway; for pharmacy (ASHP PGY1/PGY2) and dentistry (GPR/AEGD) it is optional. **ACGME** accredits all US residency and fellowship programs.
**Why it matters to Prism.** Every accreditor in scope now asks for *post-graduation* outcome data, and no shipped pillar covers past graduation. `content/accreditation/coca.yaml`: "No shipped pillar tracks post-graduation Match/placement outcomes."
**Say it to a dean.** "Your accreditation number is a post-graduation number. That means the system of record can't stop at commencement."
*Source: `content/accreditation/coca.yaml` (11.5, licensure_or_gme_layer); `content/accreditation/lcme.yaml` (licensure_or_gme_layer).*

### CAS (Centralized Application Service)
**What it is.** The single national application portal each domain runs — **AACOMAS** (DO, run by AACOM), **AADSAS** (dentistry, run by ADEA), **ERAS** (residency, run by AAMC). Applicants apply once; programs receive standardized files.
**Why it matters to Prism.** Upstream of Prism's scope today, but it's where the cohort data originates and where competitors integrate (MedHub advertises AAMC ERAS integration). Knowing the acronym prevents a credibility stumble in discovery.
**Say it to a dean.** "We don't replace AACOMAS — we pick up where it hands off, at the point the student becomes yours to track."
*Source: `content/domains/dentistry.yaml`; `content/accreditation/coca.yaml` (AACOM); `content/competitors/medhub.yaml`.*

### ⚠️ Name collision: "Leo"
**What it is.** Two unrelated things share the name. **Leo AI** is Exxat's own intelligence-layer AI Insights capability. **Leo (by DaVinci Education)** is a competing med-ed platform, Duke-born, an AAMC-authorized Curriculum Inventory vendor since 2013 (formerly LCMS+).
**Why it matters to Prism.** A prospect who says "we're on Leo" is naming a competitor, not our feature. Getting this backwards in a live call is expensive.
**Say it to a dean.** *(Internal only — just don't get it wrong.)*
*Source: `content/prism/capability-map.yaml` (intelligence_layer); `content/competitors/leo-davinci.yaml`.*

---

## 2. DO — Osteopathic Medicine

**Market shape:** 48 accredited colleges of osteopathic medicine (COMs) across 75 teaching locations in 36 states, 9 public / 39 private. Total enrollment hit an all-time high of 40,905 in 2025-26 (+2.9% YoY, +59% over the decade); 2026-27 applications rose 12.8% to 26,506. *Source: `content/domains/do.yaml` (aacom.org/quick-facts).*

### COCA — Commission on Osteopathic College Accreditation
**What it is.** The accreditor for all colleges of osteopathic medicine. Chartered by the AOA, recognized by the US Department of Education. Current standards: *COM Continuing Accreditation Standards*, dated February 1, 2026, effective July 1, 2026.
**Why it matters to Prism.** COCA is the accreditor Prism's roadmap **Accreditation Management** pillar should be scoped *around*. `content/accreditation/coca.yaml` on Element 11.9: "This element alone argues for scoping Accreditation Management around COCA's exact report structure and field taxonomy, not a generic evidence binder." Competitive note: Elentra is the only competitor whose accreditation story already names COCA explicitly — most rivals ship an LCME/ACGME-shaped story that DO programs buy for lack of an alternative.
**Say it to a dean.** "Most platforms sold to COMs were built for LCME and ACGME and had COCA bolted on. We'd rather build to your standards document, not translate someone else's."
*Source: `content/accreditation/coca.yaml`; `content/personas/lens-elentra.yaml`; `content/personas/lens-emedley.yaml`.*

### COM
**What it is.** College of Osteopathic Medicine — the institution itself. Say "COM," not "DO school." There are 48.
**Why it matters to Prism.** Segment sizing and naming convention for the whole DO GTM motion.
**Say it to a dean.** "Across the 48 COMs, the pattern we keep seeing is the same one you're describing…"
*Source: `content/domains/do.yaml`.*

### "CORE" element
**What it is.** COCA's own designation marking certain elements as core requirements — e.g. Element 6.9 Clinical Education (CORE), 5.4 Patient Care Supervision (CORE), 11.1 Program Assessment (CORE), 11.9 Annual and Mid-Cycle Reports (CORE). Not the same word as "core rotations."
**Why it matters to Prism.** Tells you where to concentrate the demo. CORE elements are where citations bite hardest, and four of the CORE elements in `coca.yaml` map directly onto Clinical & Experiential Education and Compliance Management.
**Say it to a dean.** "We prioritized the CORE elements first — 6.9, 6.10, 5.4 — because that's where a finding actually costs you."
*Source: `content/accreditation/coca.yaml` (element titles).*

### Distributive model
**What it is.** DO clinical education's defining structure. Instead of anchoring OMS-3/OMS-4 to one or two university-owned teaching hospitals, students are dispersed across a wide, geographically scattered network of independent community hospitals, physician practices, and ambulatory sites that each COM recruits, contracts, and credentials **one at a time**.
**Why it matters to Prism.** This is the strongest structural argument for Prism in DO. It means hundreds of individually-negotiated preceptor relationships across many states — precisely the multi-site placement problem the shipped **Clinical & Experiential Education** engine is built for, and precisely what a single-hospital-shaped incumbent handles badly.
**Say it to a dean.** "You don't have a rotation schedule, you have a supply chain — hundreds of independent sites in dozens of states, each with its own agreement, its own capacity, and its own preceptor. That's the problem we're actually good at."
*Source: `content/domains/do.yaml` (clinical_education_shape); `content/personas/discipline-do.yaml`.*

### OMS-3 / OMS-4
**What it is.** Osteopathic Medical Student year 3 and year 4 — the clinical years. Commonly run as a ~22-month, twenty-two-block sequence of four-week rotations (e.g. at Touro COM).
**Why it matters to Prism.** The four-week block cadence maps cleanly onto the confirmed **anchor-relative scheduling** primitive (publish/due dates set as N days before/after a placement's start, MID, or end date).
**Say it to a dean.** "Twenty-two blocks, four weeks each — every form, every evaluation, every deadline should anchor to the block, not to a calendar date someone maintains by hand."
*Source: `content/domains/do.yaml`; `content/prism/capability-map.yaml`.*

### Core rotations vs. required rotations
**What it is.** COCA Element 6.9 distinguishes them. **Core**: family medicine, internal medicine, general surgery, pediatrics. **Required**: psychiatry, OB/GYN, emergency medicine. Minimum four weeks each, with in-person patient care. Plus OPP/OMM, electives, and at many schools a rural or underserved primary-care rotation in OMS-4.
**Why it matters to Prism.** They are two different record types with different evidence burdens — modeling them as one undifferentiated "rotation" loses the distinction COCA audits against. Rated **Configure** on the existing rotation/placement data model.
**Say it to a dean.** "Core and required aren't the same thing to COCA, so they shouldn't be the same record in your system."
*Source: `content/accreditation/coca.yaml` (Element 6.9, p.43-44).*

### OPP / OMM / OMT — Osteopathic Principles and Practice / Osteopathic Manipulative Medicine / Treatment
**What it is.** The hands-on manual-medicine competency that defines osteopathic training. 200–500 additional hours, taught and assessed **during clinical clerkships**, not just in pre-clinical coursework. It is one of COCA's seven osteopathic core competencies. There is no MD or allied-health analog.
**Why it matters to Prism.** Site and preceptor records must carry a **manual-skills competency dimension** alongside the usual case-log/EPA data — a DO-specific configuration of **Curriculum Mapping** (COCA's 7-competency taxonomy as the mapping dimension) plus **Competency Tracking**. It is also the single cleanest proof-of-listening moment in a DO discovery call.
**Say it to a dean.** "OMM is assessed in the clinical years, by community preceptors, in a manual skill — so it can't live in a pre-clinical gradebook. It has to be a competency dimension on the rotation record itself."
*Source: `content/domains/do.yaml` (distinctive_pain_points, aacom.org/omm-explained); `content/accreditation/coca.yaml` (Element 6.4).*

### The seven osteopathic core competencies
**What it is.** COCA Element 6.4's required framework: medical knowledge, patient care, communication, professionalism, practice-based learning, systems-based practice, and OPP/OMM. Programs must produce a curriculum map showing where each is taught and assessed.
**Why it matters to Prism.** Squarely the shipped **Curriculum Mapping** pillar — rated **Configure**, needing only the COCA 7-competency taxonomy configured as the mapping dimension.
**Say it to a dean.** "Your competency map is a configuration, not a build. We'd load COCA's seven and hand you the coverage export."
*Source: `content/accreditation/coca.yaml` (Element 6.4, p.38).*

### Element 6.10 "Clinical Experience" — the three proofs
**What it is.** Before fourth-year clerkships, a COM must produce de-identified, system-generated proof that **every** student completed: at least one rotation alongside GME resident physicians; at least one supervised by an osteopathic physician (a DO); and more than one in an inpatient setting.
**Why it matters to Prism.** The cleanest **Configure** in the whole DO file: rotation records need three discrete, filterable attributes — *residents present at site*, *supervising physician is a DO*, *setting is inpatient/outpatient* — rolling into a per-student checklist. Small metadata change, high evidentiary value.
**Say it to a dean.** "Three checkboxes on the rotation record, and 6.10 stops being a spreadsheet exercise forever."
*Source: `content/accreditation/coca.yaml` (Element 6.10, p.45).*

### Three-year rolling average (Element 6.9 capacity math)
**What it is.** COCA wants a three-year rolling average of students eligible for first-time, repeat, and off-cycle rotations, matched against demonstrated adequate faculty/capacity at each site — **plus a contingency plan for replacing lost rotation capacity**.
**Why it matters to Prism.** Capacity math on top of the existing placement engine. Also the sharpest illustration of the dean's real ceiling: `content/personas/role-dean.yaml` frames clinical capacity, not classroom capacity, as the binding constraint on enrollment.
**Say it to a dean.** "You're asked to prove capacity on a three-year rolling average *and* to show what you'd do if a major site walked. Both of those are queries against data you already generate."
*Source: `content/accreditation/coca.yaml` (Element 6.9).*

### NBOME
**What it is.** National Board of Osteopathic Medical Examiners — writes and administers COMLEX-USA. The **sole source** of the pass-rate data COCA requires COMs to publish.
**Why it matters to Prism.** Defines the shape of Exam Management for DO: `content/accreditation/coca.yaml` is explicit that this "is not an exam-authoring tool — it has to be an integration/reporting layer that ingests NBOME's official score and pass-rate reports… Prism cannot administer COMLEX-USA itself."
**Say it to a dean.** "We're not going to pretend we can proctor COMLEX. What we can do is ingest NBOME's release and run it against COCA's thresholds the day it lands."
*Source: `content/accreditation/coca.yaml` (licensure_or_gme_layer, nbome.org).*

### COMLEX-USA (Levels 1, 2, 3)
**What it is.** The Comprehensive Osteopathic Medical Licensing Examination — the exam series required for DO licensure, accepted in all 50 states. The DO counterpart to USMLE.
**Why it matters to Prism.** COCA Element 11.4 attaches hard compliance mechanics: the last four years of **first-time** Level 1/2/3 pass rates must be published on a public webpage within **30 days** of each NBOME annual update; a cohort more than 2 standard deviations below the mean *and* under 90% requires an improvement plan; three consecutive years triggers out-of-compliance. Rated **Gap** — nothing shipped ingests licensure-exam results.
**Say it to a dean.** "Right now you learn your COMLEX number the same day the public does, with the 30-day publication clock already running. That's the gap we want to close first."
*Source: `content/accreditation/coca.yaml` (Element 11.4, p.77); `content/domains/do.yaml`.*

### Single Accreditation System (the 2020 AOA–ACGME merger)
**What it is.** Completed in 2020, it folded formerly AOA-only residency programs into ACGME, making ACGME the sole accreditor of US residency and fellowship programs.
**Why it matters to Prism.** It created the DO domain's sharpest operational pain: DO students now compete **directly with MD students** for the same fourth-year away-rotation slots, with peer-reviewed evidence of a cost and access gap disadvantaging DO applicants in competitive specialties such as general surgery. This is the "why now" in a DO conversation.
**Say it to a dean.** "Since the merger your students are bidding against MD students for the same away slots. Every week of scheduling friction is now a competitive disadvantage, not just an inconvenience."
*Source: `content/domains/do.yaml` (distinctive_pain_points, PMC11984451); `content/accreditation/coca.yaml`.*

### Osteopathic Recognition
**What it is.** A joint **AOA/ACGME** credential awarded to ACGME residency programs that deliver osteopathic-principles training. It survived the merger as a distinct status. COCA Element 10.3 requires a COM to prove it helps affiliated GME programs earn it.
**Why it matters to Prism.** `content/accreditation/coca.yaml` is emphatic: any GME-tracking feature for DO "has to model 'Osteopathic Recognition' as its own status, not collapse it into generic ACGME accreditation." This is a genuine schema requirement, not a label.
**Say it to a dean.** "Osteopathic Recognition is its own status, and you're accountable for helping your affiliated programs get it — so it needs its own field, not a note in a comments box."
*Source: `content/accreditation/coca.yaml` (licensure_or_gme_layer, Element 10.3; osteopathic.org/accreditation).*

### GME placement rate (Element 11.5)
**What it is.** A public, continually updated four-year PGY-1 placement rate — PGY-1 entrants ÷ PGY-1 applicants, by residency program. Below **95%** requires an improvement plan; three consecutive years below triggers out-of-compliance.
**Why it matters to Prism.** Rated **Gap** — no shipped pillar tracks post-graduation Match outcomes. Natural home is Accreditation Management (Q3 2027), reusing the student/rotation record model extended past graduation.
**Say it to a dean.** "A 95% floor with a three-year clock means you need to see the trend in year one, not year three."
*Source: `content/accreditation/coca.yaml` (Element 11.5, p.78).*

### AOA / AACOM / AACOMAS
**What it is.** **AOA** — American Osteopathic Association, the profession's association; charters COCA, co-administers Osteopathic Recognition, governs DO board certification. **AACOM** — American Association of Colleges of Osteopathic Medicine, the trade association for all 48 COMs; publishes the applicant/enrollment benchmarking data the field runs on. **AACOMAS** — AACOM's centralized application service.
**Why it matters to Prism.** AACOM is not a regulator but is doubly relevant: COMs cite AACOM benchmarking data in self-studies to argue comparability (echoing COCA 6.11), and **AACOM's annual meeting is a primary go-to-market channel for reaching DO-program buyers**.
**Say it to a dean.** "We benchmark against the AACOM data you're already citing in your self-study, so the numbers in our dashboard are the numbers your reviewers recognize."
*Source: `content/accreditation/coca.yaml` (licensure_or_gme_layer, aacom.org); `content/domains/do.yaml`.*

---

## 3. Pharmacy — Doctor of Pharmacy (PharmD)

**Market shape:** 142 ACPE-accredited schools as of 2022, up from 78 in 2000 — but applicants fell from 106,815 (fall 2011) to 40,552 (fall 2021), a 60%+ decline, and enrollment slipped from 44,403 (2023) to 42,312 (2024). One program (University of Charleston) closed in December 2024. Early reversal: applications up 6% fall 2024→fall 2025, a second consecutive rise. *Source: `content/domains/pharmacy.yaml` (Drug Topics, AACP, WVU Today).*

> **The framing that matters in pharmacy.** This is the one domain where the buyer's anxiety is **viability**, not just compliance — more programs chasing fewer students. Efficiency and enrollment-yield arguments land harder here than in the other three.

### ACPE — Accreditation Council for Pharmacy Education
**What it is.** The accreditor for PharmD programs. Current standards: **"Standards 2025"** — approved June 14, 2024, updated June 12, 2025, effective for evaluations beginning **fall 2025**, superseding Standards 2016.
**Why it matters to Prism.** "Standards 2025" is a recency signal that instantly establishes credibility — a program in a 2025-26 evaluation window is living inside a brand-new standards document. Note ACPE's governance quirk: NABP holds three seats on ACPE's own board, alongside AACP and APhA.
**Say it to a dean.** "You're in the first evaluation cycle under Standards 2025 — which means precedent is thin and evidence discipline matters more than usual."
*Source: `content/accreditation/acpe.yaml` (standards_document).*

### IPPE — Introductory Pharmacy Practice Experience
**What it is.** Tier one of experiential education. ACPE requires a minimum of **300 clock hours**, including at least **75 hours community** and **75 hours hospital/health-system** — delivered as short, recurring placements woven *concurrently* through the first two didactic years. Simulation hours are excluded from the 300.
**Why it matters to Prism.** Rated **Transfer** for sequencing (3.1.a) and **Configure** for the hour math (3.1.b): the engine must aggregate verified hours by *setting category*, enforce two sub-thresholds plus a total, exclude simulation-tagged activities, and alert advisors when a student is off-pace **before the IPPE window closes**. That last clause is an Early-Risk Alerts story.
**Say it to a dean.** "Three hundred hours with two sub-minimums and simulation excluded is a rule, not a report — the system should be enforcing it in September, not discovering it in April."
*Source: `content/accreditation/acpe.yaml` (Standard 3, Key Elements 3.1.a and 3.1.b, pp.10-11).*

### APPE — Advanced Pharmacy Practice Experience
**What it is.** Tier two, and pharmacy's defining structure: a minimum of **36 weeks / 1,440 hours** (each APPE ≥160 hours), delivered as roughly six to seven full-time block rotations of four to six weeks, **with no concurrent coursework**. Most programs devote the entire fourth professional year exclusively to APPEs. Four settings are mandatory: community pharmacy, ambulatory care, hospital/health-system pharmacy, and inpatient adult patient care.
**Why it matters to Prism.** The single highest-value **Configure** in pharmacy: tag every APPE placement with a required-setting category and hours, roll up per-student progress against all four categories plus the 1,440/160-hour rules, and **block or flag graduation clearance** for any student missing a category. A coursework-free capstone year of long block rotations is structurally unlike allied health's interleaved model.
**Say it to a dean.** "Your entire P4 year is one uninterrupted rotation block with four settings that all have to land. Graduation clearance should be a computed state, not a manual audit in April of P4."
*Source: `content/accreditation/acpe.yaml` (3.2.b, 3.2.d, p.11); `content/domains/pharmacy.yaml`.*

### Pre-APPE / APPE-ready / Practice-ready / Team-ready
**What it is.** ACPE Standard 7.3.d's readiness ladder. The program must show at individual *and* aggregate level that students are **APPE-ready** before entering APPEs, and that graduates are **Practice-ready** and **Team-ready** against the 2.1.a-n outcome elements.
**Why it matters to Prism.** Implies a **readiness gate** that blocks APPE enrollment until Pre-APPE competency thresholds are verified — the Compliance Management gating pattern applied to competency rather than to a document. Rated **Configure**, with a caveat: psychometrically valid standardized-assessment scoring lives in Exam Management (Q2 2027).
**Say it to a dean.** "'APPE-ready' should be a gate the system enforces, not an assertion the committee makes."
*Source: `content/accreditation/acpe.yaml` (7.3.d, p.24).*

### 2:1 preceptor ratio (Key Element 3.3.e)
**What it is.** ACPE caps most IPPE/APPE rotations at **no more than 2 students per precepting pharmacist**, with documented exceptions. Supervision is a one-to-one preceptor model, not a clinical-teaching-team model.
**Why it matters to Prism.** Rated **Transfer** — a real-time capacity calculation across a preceptor's concurrently active placements, blocking or flagging an assignment that would breach 2:1. This is a query against existing assignment data, not new architecture. It is also the crispest live-demo moment available in pharmacy.
**Say it to a dean.** "Watch — I'll try to assign a third student to a preceptor already at two. The system should stop me, and it should tell me why."
*Source: `content/accreditation/acpe.yaml` (3.3.e, p.13).*

### Preceptor credentialing and development (3.3.a, 3.3.c)
**What it is.** Every preceptor needs documented quality criteria at recruitment, a record that **the majority of any given student's preceptors are US-licensed pharmacists**, performance evaluations on file, and completed orientation to the program's mission, the experience's syllabus expectations, and effective evaluation technique **before accepting a student** — plus ongoing professional-development records.
**Why it matters to Prism.** Extends Compliance Management's gating model from the *student* entity to the *preceptor* entity: license number/status/expiration linked to every placement, and an orientation checklist that gates assignability. `content/prism/capability-map.yaml` flags as an open question whether Compliance Management natively models preceptors as a trackable entity at all.
**Say it to a dean.** "You already gate a student from starting a rotation on their immunizations. The same gate should apply to a preceptor whose license lapsed or who hasn't completed orientation."
*Source: `content/accreditation/acpe.yaml` (3.3.a and 3.3.c, p.12).*

### NAPLEX and MPJE
**What it is.** The **two** exams a PharmD graduate must pass, both administered by NABP. **NAPLEX** — North American Pharmacist Licensure Examination, clinical competence. **MPJE** — Multistate Pharmacy Jurisprudence Examination, *state-specific pharmacy law*. Plus state-tracked supervised intern hours.
**Why it matters to Prism.** Two exams, not one, is the thing outsiders get wrong. Standards 2025 was explicitly revised using the **2021 NAPLEX Competency Statements**, so aligning the competency/outcome taxonomy to NAPLEX lets a program trend cohort pass rates as a leading indicator inside **Program Quality Analytics** — closing the loop from IPPE/APPE performance to licensure outcome.
**Say it to a dean.** "Standards 2025 was written off the NAPLEX competency statements — so if your rotation assessments are tagged to that same taxonomy, your experiential data becomes a leading indicator of your pass rate."
*Source: `content/accreditation/acpe.yaml` (licensure_or_gme_layer, nabp.pharmacy); `content/domains/pharmacy.yaml`.*

### State Boards of Pharmacy
**What it is.** The actual licensing authority in each state/territory. They require an ACPE-accredited degree plus NAPLEX and MPJE (or a state jurisprudence exam) — **and they also license the practice facilities where IPPEs and APPEs occur.**
**Why it matters to Prism.** Because affiliation agreements and site licensure must satisfy the specific state the rotation occurs in, and rotations routinely cross state lines for multi-campus and distance programs, **site records need a per-state licensure/compliance dimension**, not a single national field.
**Say it to a dean.** "Your sites are licensed per state, and your students cross state lines. Site compliance can't be a single national flag."
*Source: `content/accreditation/acpe.yaml` (licensure_or_gme_layer, Standards 3.4.a/3.5.b).*

### PHARMS — Pharmacy Accreditation Report Management System
**What it is.** **ACPE's own submission platform**, which it now operates directly. It replaced AACP's AAMS (Assessment and Accreditation Management System) effective with Standards 2025 in July 2025. AAMS is discontinued.
**Why it matters to Prism.** This is the most strategically load-bearing single fact in the pharmacy file, and it constrains the shape of the Accreditation Management build. Verbatim from `content/accreditation/acpe.yaml`: Prism's future pillar "should be scoped as an evidence-aggregation/export layer that **feeds** PHARMS, not as a competing self-study portal — **ACPE, not the vendor, owns the system of record for submission**." Any roadmap that positions Prism as the place the self-study is *submitted* is wrong on the facts.
**Say it to a dean.** "You submit through PHARMS — we're not going to try to replace that. Our job is that everything PHARMS asks for is already assembled and exportable when you open it."
*Source: `content/accreditation/acpe.yaml` (7.5.b gap_notes, licensure_or_gme_layer); `content/personas/role-program-admin.yaml`.*

### COEPA
**What it is.** AACP's **Curriculum Outcomes and Entrustable Professional Activities** framework (2022). ACPE's Standard 2.1 educational outcomes are explicitly *adapted from* COEPA — meaning the outcomes taxonomy originates with the academic association but is enforced by the accreditor.
**Why it matters to Prism.** The named external taxonomy **Curriculum Mapping** should target for pharmacy. `content/journeys/competency-verification.yaml` records no evidence of shipped support for named external taxonomies including COEPA — a concrete, closable gap.
**Say it to a dean.** "Your outcomes are COEPA-derived, so the map should ship speaking COEPA rather than asking you to re-key it as custom competencies."
*Source: `content/accreditation/acpe.yaml` (licensure_or_gme_layer, aacp.org); `content/personas/discipline-pharmacy.yaml`.*

### AACP standardized surveys (7.2.d)
**What it is.** AACP's standardized graduating-student, faculty, and preceptor surveys, named in Standard 7.2.d as **required** assessment-plan evidence for the CQI cycle in 7.5.a.
**Why it matters to Prism.** ~~Rated **Gap** — blocked on the **Surveys & Course Evaluations** pillar (Q1 2027). Until it ships, programs must run these outside Prism. Honesty here is better than a hedge; the instruments are standardized and externally authored, so replicating them is a defined scope rather than an open one.~~
**Say it to a dean.** ~~"The AACP surveys are external instruments today. Our roadmap is Q1 2027 to bring them inside so the results land next to the rotation data instead of in a separate export."~~

> **CORRECTION (2026-08-26), per direct Exxat PM confirmation:** the **Surveys & Course
> Evaluations** pillar is now `status: shipped` in `content/prism/capability-map.yaml` — the "Gap,
> blocked on Q1 2027" framing above is out of date, and so is the sales line built on it. Prism
> ships both a placement-evaluation Forms engine (CIET v2, PTSE1/2, SCIPAI, PTMACS/PTAMACS and
> similar named instruments) and a separate general-purpose "Exxat Surveys" builder (14 question
> types, multi-channel distribution, full analytics; already extended to PT and SLP). Whether the
> AACP-specific standardized instruments (7.2.d) are pre-built inside that shipped pillar or need
> to be configured into it has not been re-verified — treat this entry as **Configure**, not Gap
> and not Transfer, until that is confirmed. **Corrected line to say to a dean:** "The AACP
> surveys can be built and run inside Prism today, on our Surveys pillar — we haven't yet
> confirmed whether the standardized instruments are pre-loaded or need to be configured, so let's
> check that against your specific instrument list before we commit to a demo." Do **not** say
> Prism already has the AACP instruments pre-built, and do not say Prism leads on Surveys — only
> that it is shipped, not roadmap.
*Source: `content/accreditation/acpe.yaml` (7.5.a, 7.2.d); `content/prism/capability-map.yaml`.*

### NTPD — Nontraditional PharmD
**What it is.** A pathway for working pharmacists in which the four required APPE settings can be satisfied via **formalized faculty assessment** of existing practice experience rather than by completing the rotations themselves.
**Why it matters to Prism.** A non-standard record type. `content/accreditation/acpe.yaml` flags it as likely needing custom configuration or a small build — an "assessed equivalent" completion record that satisfies the same graduation gate by a different route. Worth asking about in discovery precisely because nobody expects a vendor to know it exists.
**Say it to a dean.** "Do you run an NTPD cohort? Because 'assessed equivalent' completion is a different record type from a completed rotation, and most systems make you fake it."
*Source: `content/accreditation/acpe.yaml` (3.2.b/3.2.d gap_notes).*

### ASHP and PGY1/PGY2
**What it is.** American Society of Health-System Pharmacists — accredits **PGY1 and PGY2 post-PharmD residency programs**, and has collaborated with ACPE since 2014 on pharmacy technician education accreditation.
**Why it matters to Prism.** Two angles. Many required APPE hospital/health-system sites are themselves ASHP-accredited residency sites. And residency placement/match rate is an increasingly tracked post-graduate outcome for PharmD programs — a natural extension of **Program Quality Analytics** beyond the degree.
**Say it to a dean.** "Your best APPE sites are usually ASHP residency sites, and your residency placement rate is becoming a recruiting number. Those are the same dataset."
*Source: `content/accreditation/acpe.yaml` (licensure_or_gme_layer, ashp.org).*

### BPS — Board of Pharmacy Specialties
**What it is.** Post-licensure specialty board certification (BCPS, BCACP, BCPPS, etc.) — the credentialing layer for the **Continuing Professional Development (CPD)** philosophy Standards 2025 explicitly asks programs to instill in students.
**Why it matters to Prism.** Outside core PharmD accreditation scope, but relevant to any future CPD/lifelong-learning tracking that extends the product past graduation. Useful for showing range without overclaiming.
**Say it to a dean.** "Standards 2025 asks you to instill CPD as a habit — which is a tracking problem that doesn't stop at graduation. That's a later conversation, but it's a real one."
*Source: `content/accreditation/acpe.yaml` (licensure_or_gme_layer, bpsweb.org).*

### APhA
**What it is.** American Pharmacists Association — the profession's national membership association, and one of the three bodies (with AACP and NABP) seated on ACPE's board.
**Why it matters to Prism.** Association literacy; ACPE governance context.
**Say it to a dean.** *(Recognition-level term — know it, rarely lead with it.)*
*Source: `content/domains/pharmacy.yaml`; `content/accreditation/acpe.yaml`.*

---

## 4. Dentistry — DDS / DMD

**Market shape:** 77 CODA-accredited predoctoral programs in the US and Puerto Rico as of 2024-25, up from 67 in 2020 and 55 in 2000. Total predoctoral enrollment 28,925 in 2025-26 (up from 27,920); first-year enrollment reached 7,013 in 2024, with **25% of those enrollees at newly opened schools**. *Source: `content/domains/dentistry.yaml` (ADEA Trends, ADA News).*

> **The framing that matters in dentistry.** axiUm (Exan / Henry Schein One) is reportedly in use at **~90% of US dental schools** and combines the EHR, billing, and academic record — enormous lock-in. But its own reviewers call it clunky and dated (Capterra 3.1/5), and it has no documented rotation/placement engine, no curriculum-mapping module, no survey tool, and no exam management. The wedge is **new and growing schools not yet locked in** — and 25% of 2024 first-years were at newly opened schools. *Source: `content/competitors/axium.yaml`.*

### CODA — Commission on Dental Accreditation
**What it is.** Accredits predoctoral (DDS/DMD) programs under the *Accreditation Standards for Dental Education Programs* ("DEP Standards"), **and** separately accredits allied dental programs and postdoctoral/advanced programs under their own standards documents. Recognized by the US Department of Education. Note: as of the August 8, 2025 Commission action, Standards 1-4 and 4-4 are **suspended indefinitely** and Standard 1-3's Intent Statement and Examples of Evidence were revised.
**Why it matters to Prism.** Knowing which standards are currently suspended is a live-currency signal few vendors have. More structurally: because **one accreditor spans both the DDS/DMD school and the postdoctoral residency**, the same rotation engine built for predoctoral placements is architecturally the right foundation to extend into postdoctoral residency tracking later — a single-accreditor, two-stage continuum unlike the MD/DO split between LCME/COCA and ACGME.
**Say it to a dean.** "CODA accredits both your predoctoral program and your GPR and AEGD residencies — so it should be one continuum in one system, not two systems that don't talk."
*Source: `content/accreditation/coda.yaml` (standards_document, licensure_or_gme_layer).*

### Comprehensive care model / patient panel
**What it is.** Dentistry's defining structure, and the thing most outsiders get wrong. Dental clinical education is **not** short block rotations through specialty services. From year 1 each student is assigned **their own patient panel**; in years 3-4 (roughly **32 hours/week** of direct patient care) the student acts as the primary treatment provider for those patients across restorative, periodontics, endodontics, and prosthodontics. Specialty rotations (pediatrics, oral surgery, urgent care, community extramural clinics) are layered *on top* of the core panel, not instead of it.
**Why it matters to Prism.** If a demo shows a rotation calendar as the primary object, a dental dean will conclude we don't understand their program. The longitudinal panel is the spine; rotations are the exception. This is the domain where Prism's mental model needs the most deliberate adjustment.
**Say it to a dean.** "Your students don't rotate through patients — they carry a panel for years and rotate around the edges. So the record that matters is the panel and the procedure, not the block."
*Source: `content/domains/dentistry.yaml` (clinical_education_shape).*

### Clinical practice unit / chairside supervision
**What it is.** Supervision is **per-procedure, not per-shift**. A faculty "clinical practice unit" (roughly 1 lead faculty plus 1-2 additional instructors per 2-student team) must inspect and sign off on each clinical step — prep, impression, seating — before the student proceeds.
**Why it matters to Prism.** This generates far finer-grained, far higher-volume faculty evaluation events than any allied-health preceptor model. A system built around one summative evaluation per placement is the wrong shape.
**Say it to a dean.** "You're not signing off on a rotation, you're signing off on a step — dozens of times a day. Volume and speed of capture matter more here than form design."
*Source: `content/domains/dentistry.yaml` (distinctive_pain_points, Penn Dental and Univ. at Buffalo).*

### Competency- and quota-based progression
**What it is.** Progression is gated by **completed procedure counts/types and faculty-graded clinical competency exams**, not by calendar time. Because students must also **recruit and retain enough compliant patients** to hit those quotas, patient-sourcing shortfalls are a documented, widespread cause of **delayed graduation**.
**Why it matters to Prism.** CODA Standard 2-9 (adequate patient experiences) is rated the **strongest fit in the entire CODA standards set** — real-time tracking of encounter volume and breadth per student against required competencies, with pacing alerts when a student falls behind. That is Clinical & Experiential Education plus Competency Tracking plus Early-Risk Alerts, aimed at a problem that costs the school tuition and the student a year.
**Say it to a dean.** "Delayed graduation here is usually a patient-supply problem discovered too late. Pacing alerts in D3 are worth more than any report in D4."
*Source: `content/accreditation/coda.yaml` (Standard 2, Element 2-9, p.25); `content/domains/dentistry.yaml` (PMC11667986).*

### Standard 2-24 — the ~15 competency categories
**What it is.** CODA requires documentation that every graduate is competent across roughly 15 defined clinical categories (a–o): patient assessment/diagnosis/treatment planning, head-and-neck cancer screening, referral judgment, caries and disease prevention, local anesthesia and pain/anxiety control, restorations, dental lab coordination, fixed/removable/implant prosthodontics, periodontal therapy, pulpal therapy, oral mucosal/TMJ/osseous disorders, hard and soft tissue surgery, dental emergencies, malocclusion and space management, and outcomes evaluation — each typically evidenced by **procedure-level logs**.
**Why it matters to Prism.** Rated **Gap**, and named as "likely the single largest dentistry-specific build if Prism enters this domain": a CDT-coded, tooth/surface-level procedure-log data model feeding Competency Tracking. This is the honest cost of entry for dentistry and should be scoped, not hand-waved.
**Say it to a dean.** "Fifteen categories evidenced by procedure logs is a data model, not a report. We'd rather tell you that's a build than pretend a rotation record covers it."
*Source: `content/accreditation/coda.yaml` (Standard 2, Element 2-24, pp.29-30).*

### CDT — Current Dental Terminology
**What it is.** The ADA-maintained standard code set for documenting dental procedures. The taxonomy every procedure log, insurance claim, and chart audit in US dentistry already uses.
**Why it matters to Prism.** Guidance from `content/accreditation/coda.yaml` is explicit: any dental procedure-logging capability "should speak CDT natively rather than inventing a parallel taxonomy, since programs' existing clinic systems, insurance workflows, and CODA site-visit reviewers all already think in CDT." Inventing a parallel taxonomy would be the classic outsider mistake.
**Say it to a dean.** "It'll speak CDT, because your clinic system does, your claims do, and your site-visit reviewer does."
*Source: `content/accreditation/coda.yaml` (licensure_or_gme_layer, ada.org/publications/cdt).*

### Faculty calibration (Standard 2-6)
**What it is.** CODA's comparability requirement, dentistry-flavored: evidence of **ongoing faculty calibration** across every site where required educational activity occurs — training, calibration manuals, periodic monitoring, and documentation of faculty participation. The concern is that two faculty grading the same prep should grade it the same.
**Why it matters to Prism.** Requires extending Compliance Management item tracking to **faculty**, not just students, with alerts when a site or faculty member falls out of calibration. Rated **Configure**, with faculty-side tracking flagged as an open Phase 2 question.
**Say it to a dean.** "Calibration is a credential with an expiry date, attached to a person and a site. Track it the way you track a student's certification and it stops being a scramble."
*Source: `content/accreditation/coda.yaml` (Standard 2, Element 2-6, p.25).*

### Standard 5-3 — patient-care CQI / chart audit
**What it is.** A formal quality-improvement system for **patient care**: written measurable standards of care, ongoing review of a representative sample of patients and records for appropriateness/necessity/quality, root-cause analysis of treatment deficiencies, and implemented corrective measures.
**Why it matters to Prism.** Rated **Gap** — no shipped pillar confirms patient-record sampling, deficiency coding, or corrective-action tracking. Dentistry is the only domain in scope where the accreditor audits the **care delivered**, not only the education, because the school runs a real clinic.
**Say it to a dean.** "You're accredited on the care your clinic delivers, not just the teaching — that's a chart-audit workflow, and it's honestly not something we do today."
*Source: `content/accreditation/coda.yaml` (Standard 5, Element 5-3, p.37).*

### INBDE — Integrated National Board Dental Examination
**What it is.** The written cognitive national licensure exam, administered by **JCNDE** (Joint Commission on National Dental Examinations, an independent agency of the ADA). Accepted by all US states and territories. It replaced the old NBDE Part I / Part II.
**Why it matters to Prism.** Program-level INBDE pass rates are a standard outcomes metric in the CODA self-study, feeding Standard 1-2's continuous-assessment requirement. Saying "NBDE" instead of "INBDE" dates you immediately.
**Say it to a dean.** "Your INBDE pass rate is self-study evidence, so it should live next to the competency data that predicts it — not in a separate spreadsheet."
*Source: `content/accreditation/coda.yaml` (licensure_or_gme_layer, jcnde.ada.org).*

### DLOSCE — Dental Licensure Objective Structured Clinical Examination
**What it is.** JCNDE's standardized clinical-competency exam, which **some** states accept in place of a traditional manikin or patient-based clinical licensure exam.
**Why it matters to Prism.** A genuinely useful connection: the DLOSCE is an OSCE-format, rubric-scored clinical competency exam — **the same assessment shape as CODA Standard 2-5's evidence requirement**. So any OSCE/competency-assessment tooling built for 2-5 is structurally the same tooling that helps a program prepare students for DLOSCE-style assessment. One build, two payoffs.
**Say it to a dean.** "The rubric you need for 2-5 evidence is the same rubric shape as the DLOSCE. Build it once and it does both jobs."
*Source: `content/accreditation/coda.yaml` (licensure_or_gme_layer, jcnde.ada.org).*

### ADEX / CDCA-WREB-CITA — the regional clinical licensure exam
**What it is.** Dentistry's extra licensure layer. Beyond the written INBDE, **most US jurisdictions still require a separate hands-on clinical licensure exam** administered by a regional board — ADEX (American Board of Dental Examiners), following the CDCA-WREB-CITA merger. Historically performed on **live patients**; shifting toward standardized manikin testing since 2020.
**Why it matters to Prism.** Allied-health licensure (e.g. NCLEX) has no analog to this — it is an extra exam with its own scheduling and logistics burden, and state-by-state pass rates are another outcomes measure programs must track and report under Standard 1-2. A multi-jurisdiction outcomes rollup is a natural Accreditation Management extension.
**Say it to a dean.** "Your students sit a written national exam *and* a hands-on regional one, and both pass rates are self-study evidence. Most platforms only model the first."
*Source: `content/domains/dentistry.yaml` (distinctive_pain_points, adextesting.org, cdcaexams.org); `content/accreditation/coda.yaml`.*

### CompeDont
**What it is.** The standardized **manikin tooth** used in ADEX clinical licensure testing — the concrete artifact behind the post-2020 shift away from performing licensure exams on live patients.
**Why it matters to Prism.** Pure credibility currency. Nobody outside dental education knows this word; using it correctly signals we read past the summary page. It also marks a real operational change — a program no longer has to source and schedule live board patients, which used to be a significant clinic-management burden.
**Say it to a dean.** "Since the move to CompeDont you're not sourcing board patients the way you were in 2019 — has that changed how you plan D4 clinic time?"
*Source: `content/domains/dentistry.yaml` (distinctive_pain_points, adextesting.org, cdcaexams.org).*

### GPR / AEGD
**What it is.** Optional postdoctoral training, both CODA-accredited. **GPR** — General Practice Residency, hospital-based with a medical-management emphasis. **AEGD** — Advanced Education in General Dentistry, clinical-dentistry emphasis. Alongside nine recognized dental specialties. Unlike medicine, **none of this is required for general licensure to practice.**
**Why it matters to Prism.** Adjacent expansion surface inside an existing account, under the same accreditor and (architecturally) the same rotation engine. Also the fastest way to sound wrong: assuming dentistry requires residency the way medicine does.
**Say it to a dean.** "Your GPR and AEGD residents are under the same accreditor as your DDS students — that's a second program on the same platform, not a second procurement."
*Source: `content/domains/dentistry.yaml`; `content/accreditation/coda.yaml` (licensure_or_gme_layer).*

### ADA and ADEA
**What it is.** **ADA** — American Dental Association: national membership body for practicing dentists, CODA's parent organization, maintainer of CDT codes. **ADEA** — American Dental Education Association: membership body for all 87 US and Canadian dental schools plus 800+ allied/advanced programs; runs **ADEA AADSAS** centralized admissions and publishes the *Journal of Dental Education* and the *Trends in Dental Education* data everyone cites.
**Why it matters to Prism.** ADEA is the dental analog of AACOM for DO — the source of the benchmarking numbers deans quote, and the corresponding GTM channel.
**Say it to a dean.** "The enrollment numbers I'm quoting are ADEA's, from *Trends* — same source you'd use in your own board deck."
*Source: `content/domains/dentistry.yaml` (standards_bodies, market.sources).*

### axiUm and "CODA-Ready Reporting"
**What it is.** axiUm (Exan / Henry Schein One) is the near-universal dental school system — approximately 90% of US dental schools — combining clinic EHR, billing, and academic records. It markets **"CODA-Ready Reporting: Maintain auditable records for accreditation compliance."**
**Why it matters to Prism.** Know the incumbent's own phrase before walking in. The documented weaknesses are specific: no rotation/placement engine (its "clinical education" is built around one school's own clinic), no documented curriculum-mapping module, no survey/course-evaluation tool, no exam management, and reviewers describing an early-90s interface (Capterra 3.1/5, G2 ~3.9/5). Lock-in is extreme because it holds the billing and patient record too.
**Say it to a dean.** "We're not trying to replace axiUm's clinic and billing record — that's not a fight worth having. We're the layer it was never built for: placements, curriculum map, evaluations, and the self-study evidence around them."
*Source: `content/competitors/axium.yaml`.*

---

## 5. Medicine — MD (Allopathic)

**Market shape:** ~159-161 LCME-accredited MD-granting schools (~96 public / 64 private). US MD enrollment crossed **100,000 for the first time in 2025-26** (100,723, +1.3% YoY), with 23,440 first-year matriculants (+1.2%) and applicants up 5.3%, reversing three years of decline. Enrollment growth has outpaced growth in downstream clinical and GME capacity. *Source: `content/domains/medicine.yaml` (AAMC).*

### LCME — Liaison Committee on Medical Education
**What it is.** The accreditor for MD-granting programs in the US, **co-sponsored by the AAMC and the AMA**. Standards live in *Functions and Structure of a Medical School* ("F&S"), republished annually. Accreditation gates federal funding eligibility, ACGME residency placement, and in most states, licensure.
**Why it matters to Prism.** LCME is existential rather than procedural for this buyer, which raises the stakes on every conversation. **Practical caution from the research file:** LCME periodically renumbers and retires elements after public comment — verify current numbering at lcme.org/publications before citing element numbers in any external-facing deliverable. Citing a retired element number in a deck is a credibility loss with exactly the audience that will notice.
**Say it to a dean.** "I'll cite the element numbers, but I'll check them against the current F&S edition first — I know they move."
*Source: `content/accreditation/lcme.yaml` (header note, standards_document, governs).*

### Element 8.6 — Monitoring of Completion of Required Clinical Experiences
**What it is.** LCME requires proof of a **centrally-overseen** system that monitors and ensures every student completes all required clinical experiences, and remedies any gap **before graduation**.
**Why it matters to Prism.** The strongest fit of any standard in the LCME document, rated **Transfer**: "squarely the Clinical & Experiential Education pillar's core job — the confirmed placement/rotation engine… with anchor-relative scheduling is built precisely to give central oversight of rotation completion across sites." If there is one slide to lead with in Medicine, this is it. It pairs with Element 6.2, which requires a published list of patient types, conditions, skills, settings, and expected level of student responsibility, plus evidence students met it.
**Say it to a dean.** "8.6 asks for one central view proving every student completed everything, with gaps caught before graduation instead of at self-study. That is the product, not a report we'd build for you."
*Source: `content/accreditation/lcme.yaml` (Element 8.6, p.12; Element 6.2, p.8).*

### Core clerkship
**What it is.** The year-3 clinical blocks: internal medicine, surgery, OB/GYN, pediatrics, psychiatry, family medicine, neurology, and often radiology. Roughly 4-12 weeks each, commonly cited as **~48 weeks total** across year 3, at teaching hospitals and affiliated outpatient sites.
**Why it matters to Prism.** Variable-length blocks across a shifting set of sites are exactly what the anchor-relative scheduling primitive handles — and exactly what a fixed-calendar system handles badly.
**Say it to a dean.** "Four to twelve week blocks means every deadline has to anchor to the block. Fixed calendar dates break the moment one clerkship shifts."
*Source: `content/domains/medicine.yaml` (clinical_education_shape); `content/prism/capability-map.yaml`.*

### Attending → resident → intern → student
**What it is.** Medicine's supervision hierarchy. Evaluation and sign-off responsibility is **distributed across a hierarchy that changes every few weeks** as students rotate services — not a single stable preceptor relationship.
**Why it matters to Prism.** Two direct consequences. LCME **Element 3.1** requires confirming each student worked with residents in an ACGME-accredited program, so the placement record must capture **residents, not just attendings** (rated **Transfer** — add a resident/GME-trainee role to the existing assignment record). **Element 9.3** requires a supervision-level attestation matched to training level and the supervisor's scope of practice (rated **Configure**).
**Say it to a dean.** "In your program the evaluator changes every few weeks and isn't always the attending. If the record only has a preceptor field, 3.1 becomes an email hunt."
*Source: `content/accreditation/lcme.yaml` (Elements 3.1 p.4, 9.3 p.14); `content/domains/medicine.yaml`.*

### Elements 9.7 and 9.8 — the two deadline standards
**What it is.** **9.7**: every student must receive formal **formative feedback at least at the midpoint** of each required course/clerkship, early enough to allow remediation (with an alternate method for experiences under four weeks). **9.8**: **final grades within six weeks** of the clerkship ending.
**Why it matters to Prism.** 9.7 is rated **Transfer** and maps almost one-to-one onto the confirmed anchor-relative scheduling primitive — "a midpoint-formative-feedback trigger is exactly what that primitive was built for." 9.8 is **Configure**: the same primitive fires a grade-due deadline off the end date, though a purpose-built six-week SLA turnaround report is not confirmed out of the box. Together these are the highest-conviction demo pair in Medicine.
**Say it to a dean.** "Midpoint feedback and the six-week grade deadline both anchor off the rotation, not the calendar — and the system should be chasing them, not your coordinator."
*Source: `content/accreditation/lcme.yaml` (Elements 9.7 p.15, 9.8 p.15).*

### USMLE — Step 1, Step 2 CK, Step 3
**What it is.** The three-step licensure exam sequence, co-owned by **NBME** and **FSMB**. What makes it structurally different from allied health: **Step 1 and Step 2 CK sit inside the clinical timeline itself** and gate residency eligibility, not just graduation.
**Why it matters to Prism.** USMLE performance is the primary "national norm of accomplishment" cited in LCME Element 8.4. `content/accreditation/lcme.yaml` puts it bluntly: "Program-outcome evaluation (Standard 8.4) is effectively meaningless without USMLE pass-rate/score data — this is the concrete reason **Exam Management** (roadmap Q2 2027) matters for the Medicine domain specifically, not just as a generic feature."
**Say it to a dean.** "Your board data is the benchmark 8.4 is graded against, and it lives outside your systems. Bringing it inside is Q2 2027 for us — I'd rather say the date than imply we have it."
*Source: `content/accreditation/lcme.yaml` (Element 8.4 p.12, licensure_or_gme_layer).*

### NRMP / the Match / Match Day / SOAP
**What it is.** The **National Resident Matching Program** runs the Main Residency Match, algorithmically placing graduating students into ACGME residency positions. **SOAP** (Supplemental Offer and Acceptance Program) is the separate process that places applicants left unmatched on Match Day.
**Why it matters to Prism.** The Match is a hard downstream bottleneck built into the pathway, and it's the outcome the program is actually judged on: even in the largest Match on record (2025), **6.5% of US MD seniors** and roughly a third or more of international medical graduates did not match to a PGY-1 position. Match results feed Element 8.4 and are a **Gap** — no shipped pillar tracks post-graduation outcomes.
**Say it to a dean.** "Match results are the number your board and your applicants actually look at, and they land after every system you own has stopped tracking the student."
*Source: `content/domains/medicine.yaml` (distinctive_pain_points, AMA 2025 Match); `content/accreditation/lcme.yaml` (8.4).*

### Sub-internship ("Sub-I")
**What it is.** A year-4 rotation carrying near-resident-level responsibility. Distinct from a core clerkship in both expectation and assessment.
**Why it matters to Prism.** A different record type with a different supervision level — relevant to Element 9.3's requirement that student responsibility be matched to training level.
**Say it to a dean.** "A sub-I isn't a clerkship with a different name — the expected level of responsibility is different, and 9.3 asks you to document that."
*Source: `content/domains/medicine.yaml` (clinical_education_shape); `content/accreditation/lcme.yaml` (9.3).*

### Away rotation / audition rotation / VSLO
**What it is.** Year-4 rotations at other institutions, done partly to audition for that institution's residency program. Coordinated through the AAMC's **VSLO** (Visiting Student Learning Opportunities) platform — a system **outside** the home school's own stack.
**Why it matters to Prism.** Two distinct pains. Financially, most students report **$2,500–$10,000+** in total away-rotation costs; **54.9%** declined at least one away rotation due to cost and **75.9%** say finances influenced which offers they accepted. Operationally, `content/personas/discipline-medicine.yaml` notes that Element 8.6's completion-monitoring duty still applies to away rotations — so **a rotation living only in VSLO and email is a gap in the central record**.
**Say it to a dean.** "Away rotations happen in VSLO and your inbox, but 8.6 still holds you accountable for them. That's the piece of the central record that's usually missing."
*Source: `content/domains/medicine.yaml` (distinctive_pain_points, PMC5109707); `content/personas/discipline-medicine.yaml`; `content/personas/role-clinical-coordinator.yaml`.*

### MSPE — Medical Student Performance Evaluation
**What it is.** The "Dean's Letter" — the standardized summative narrative of a student's performance that every school produces and that **ERAS** (AAMC's residency application system) consumes. Required under LCME Standard 11.4, on a national timeline schools must align to.
**Why it matters to Prism.** `content/accreditation/lcme.yaml` is direct: any MSPE-generation or residency-readiness feature "must align to AAMC/ERAS timelines and data format, not just internal school workflow — a hard external dependency for anything touching Standard 11.4." The MSPE is where four years of scattered clerkship evaluations must become one defensible document, which is a compelling argument for the evaluation data being centralized in the first place.
**Say it to a dean.** "The MSPE is where four years of clerkship narratives have to become one letter on an ERAS deadline. If those narratives are scattered, that letter is a manual reconstruction every fall."
*Source: `content/accreditation/lcme.yaml` (licensure_or_gme_layer, Standard 11.4).*

### Element 5.5 — Resources for Clinical Instruction (case mix)
**What it is.** Evidence that clinical sites used for required instruction offer adequate **numbers and types of patients** — acuity, case mix, age, gender — to support the required curriculum, tracked across every ambulatory and inpatient site.
**Why it matters to Prism.** Rated **Configure**: sites and placements are modeled today, but case-mix/volume analytics rolled up from student-logged encounters is not confirmed as a built-in report. This is the standard that turns the capacity crisis into a documentation crisis — **44% of AAMC-surveyed schools report moderate-to-severe pressure to pay community physicians and clinics to host students**, something most don't currently do.
**Say it to a dean.** "As you add community sites to absorb enrollment, 5.5 asks you to prove each one has the case mix to support the curriculum. That proof should roll up from encounters you're already logging."
*Source: `content/accreditation/lcme.yaml` (Element 5.5, p.6); `content/domains/medicine.yaml` (AAMC clerkship-sites).*

### DCI — Data Collection Instrument
**What it is.** LCME's structured self-study submission document, the medicine analog of COCA's annual/mid-cycle reports and ACPE's PHARMS submission. (Canada's parallel body, **CACMS**, uses its own DCI.)
**Why it matters to Prism.** Named in `content/personas/role-program-admin.yaml` among the accreditor submission portals this role lives in. Competitive context: Elentra claims coverage of **>40% of the CACMS DCI** — a concrete, named benchmark the roadmap Accreditation Management pillar will be measured against.
**Say it to a dean.** "The target isn't a generic evidence binder — it's the DCI's actual fields, so the export maps to what you have to fill in."
*Source: `content/personas/role-program-admin.yaml`; `content/personas/lens-elentra.yaml`; `content/personas/role-compliance-accreditation-liaison.yaml`.*

### AAMC Curriculum Inventory (CI) and MedBiquitous
**What it is.** The **AAMC Curriculum Inventory** is an annual national curriculum-data submission MD and DO programs make through an AAMC portal. **MedBiquitous** is the underlying data standard. AAMC operates an **authorized/participating vendor** program for platforms that submit on a school's behalf.
**Why it matters to Prism.** A concrete competitive moat to plan around, not a nice-to-have. Leo (DaVinci) has been an AAMC-authorized CI vendor **since 2013**, with AAMC business rules built in to flag data issues pre-submission; Elentra is a participating vendor with native MedBiquitous support; New Innovations and eMedley route their UME curriculum-mapping story through the CI portal too. Any Medicine or DO curriculum-mapping conversation will hit this.
**Say it to a dean.** "CI submission is table stakes in this market and we should be straight about where we are on it — what I'd rather talk about is the evidence the CI export is built from."
*Source: `content/personas/lens-elentra.yaml`; `content/personas/role-compliance-accreditation-liaison.yaml`; `content/personas/lens-new-innovations.yaml`; `content/competitors/leo-davinci.yaml`.*

### ACGME, CLER, NAS, ADS, Milestones
**What it is.** The GME-side vocabulary that shows up whenever a school also runs residency programs. **ACGME** accredits the ~13,762 US residency and fellowship programs (5,380 specialty, 7,024 subspecialty). **NAS** — Next Accreditation System. **CLER** — Clinical Learning Environment Review, ACGME's site-visit program for the teaching environment. **ADS** — ACGME's Accreditation Data System (the reporting format). **Milestones** — ACGME's staged competency framework, reviewed by a program's CCC (Clinical Competency Committee).
**Why it matters to Prism.** This is the vocabulary the GME-native incumbents are built around — MedHub ships ACGME milestone/EPA tracking, survey/case-log/milestone import and ADS-formatted reporting; New Innovations ships CLER Visit Management, NAS tools, and CCC Milestone Review. The strategic read in `content/personas/lens-new-innovations.yaml` is to **not** compete on that terrain: their tooling is ACGME/AAMC-shaped end to end, so "Prism's Q3 2027 pillar scoped for COCA from day one competes on coverage rather than on a losing feature comparison."
**Say it to a dean.** "If your question is GME — CLER, NAS, milestones — the incumbents have had a decade on that. Where we'd rather compete is the UME side and the accreditor they built for second."
*Source: `content/personas/lens-medhub.yaml`; `content/personas/lens-new-innovations.yaml`; `content/personas/role-compliance-accreditation-liaison.yaml`; `content/domains/medicine.yaml`.*

### AAMC and AMA
**What it is.** **AAMC** — Association of American Medical Colleges: co-sponsors LCME, operates ERAS, VSLO, the Curriculum Inventory, and the MCAT; publishes the enrollment and workforce data the field cites. **AMA** — American Medical Association: co-sponsors LCME, publishes clerkship and residency guidance.
**Why it matters to Prism.** AAMC is unusual among the associations in this glossary because it is not just a data publisher — it **operates infrastructure Prism must interoperate with** (ERAS, VSLO, CI). It is a dependency, not only a channel.
**Say it to a dean.** "AAMC isn't just where your benchmarks come from — it runs three systems your workflow already depends on. Anything we build has to meet them there."
*Source: `content/domains/medicine.yaml` (standards_bodies); `content/accreditation/lcme.yaml` (licensure_or_gme_layer).*

---

## 6. Known gaps in this glossary

Kept explicit so nobody mistakes silence for coverage.

- **PharmCAS** (pharmacy's centralized application service) is not researched anywhere in `content/` and is therefore not defined above. AACOMAS, AADSAS, and ERAS are.
- **Nursing and allied-health terms** (CAPTE, ACOTE, CPI, FWPE, NCLEX) appear only in the Rosetta Stone as translation anchors — this glossary is for the four expansion domains.
- **LCME element numbering** is verified against the March 2023 edition (effective July 1, 2024). A 2026-27 edition exists. Re-verify before external use — see the LCME entry above.
- **COCA standards text** is paraphrased, not quoted, for the legal reason flagged at the top. Do not lift COCA language verbatim into customer-facing material without clearing it.
- **CACMS** (Canada's MD accreditor, parallel to LCME) is referenced but not researched in its own file.
- **The Where-to-Play scorecard is still unscored** (`content/scorecard/where-to-play.yaml` has all zeros and an empty `recommended_beachhead`), so this glossary deliberately gives all four domains equal weight rather than implying a chosen beachhead.

---

*Compiled from `content/accreditation/{coca,acpe,coda,lcme}.yaml`, `content/domains/{do,pharmacy,dentistry,medicine}.yaml`, `content/prism/capability-map.yaml`, `content/personas/`, `content/journeys/`, and `content/competitors/`. Underlying research last verified 2026-08-24; every claim traces to a cited primary source in those files.*
