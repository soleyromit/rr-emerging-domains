# DO: Product & GTM summary

*For: PMs and executives. Every figure below cites a source file. Full context: [`../gap-analysis.md`](../gap-analysis.md), [`../prism-positioning.md`](../prism-positioning.md).*

## A. Market summary

**Market:** 48 accredited colleges of osteopathic medicine (COMs) at 75 teaching locations across 36 states (9 public, 39 private) — and the only domain of the four that's genuinely *growing*. Total enrollment hit an all-time high of 40,905 in 2025-26 (+2.9% YoY, +59% over the decade); first-year enrollment +3.6% to 11,590; 2026-27 applications +12.8% to 26,506, the most received since 2021. *(`domains/do.yaml`)*

**Where DO ranks:** First of four, and not close — 4.40 weighted vs. Pharmacy 4.05, Medicine 3.85, Dentistry 2.75. DO is the only domain scoring 5/5 on both accreditation pressure *and* incumbent weakness at once. *(`scorecard/where-to-play.yaml`)*

**Why now:** COCA's 2026 COM Continuing Accreditation Standards take effect July 1, 2026 (governing reviews after Feb 1, 2027) and demand *computed* evidence, not documents — a 3-year rolling capacity average per site, system-generated per-student supervision/GME-resident/inpatient proof, cross-site statistical comparability — layered on bright-line public thresholds (COMLEX within 30 days of NBOME's update; 95% PGY-1 floor) that auto-escalate to out-of-compliance after three years. At the same time, four of the plausible DO incumbents have changed hands since 2023 (New Innovations → QGenda, Jul 2025; Leo/DaVinci → Elentra under Achieve Partners, with Elentra now publicly courting Leo customers to migrate; MedHub/E\*Value → Ascend Learning) — a platform conversation many COMs did not initiate. *(`scorecard/where-to-play.yaml`, `synthesis/prism-positioning.md`)*

**Where we win:** Zero outright Transfers, but 7 clean Configures on shipped pillars (corrected 2026-09-02 — see the note in `gap-analysis.md`) — the rotation/placement engine with added metadata fields covers site capacity and clinical-experience attributes; osteopathic core competencies map onto Curriculum Mapping; supervision-policy attestation and GME tracking map onto Compliance Management; student surveys map onto the already-shipped Surveys pillar. The two strongest curriculum/accreditation incumbents, Elentra and Leo, ship **no compliance module at all**. *(`accreditation/coca.yaml`; `scorecard/where-to-play.yaml`)*

## B. Competitive positioning

**Positioning statement:** Prism is the system of record for clinical/experiential education, and COCA's 2026 standards ask for exactly the evidence our placement engine already produces — at the moment four of the plausible DO incumbents are in M&A churn. *(`synthesis/prism-positioning.md`)*

**The incumbent field — five vendors, no clean leader:**

| Vendor | Ownership status | DO-relevant strength | Named weakness |
|---|---|---|---|
| MedHub/E\*Value | Ascend Learning | 24+ disciplines incl. DO; case logs, hours validation, mobile procedure logging | Reviewers cite slow/buggy mobile logging, "cumbersome" patient logging |
| New Innovations | Acquired by QGenda, Jul 2025 | Strongest public scheduling depth (rotation/block/daily/on-call, UME lottery); ships APE, NAS, CLER, CCC milestone review — capabilities Prism doesn't plan until Q3 2027 | Roadmap/support-continuity uncertainty post-acquisition |
| eMedley/AllofE | — | Closest public match to COCA 6.9's affiliation-agreement requirement (eKeeper, auto-expiration reminders); only vendor here with a published price point ($5,000/yr flat, per Capterra) | — |
| Elentra | Achieve Partners (absorbed Skyfactor + DaVinci within ~1 year) | AAMC Curriculum Inventory vendor, MedBiquitous native, >40% CACMS DCI coverage | **No dedicated Compliance Management module** — the concept only appears in marketing copy |
| Leo (DaVinci) | Folded into Elentra, May 2024 | Deep curriculum-mapping heritage | **No public compliance-tracking evidence**; Elentra is now publicly courting Leo's own customers to migrate off it |

*(`competitors/e-value.yaml`, `competitors/new-innovations.yaml`, `competitors/emedley.yaml`, `competitors/elentra.yaml`, `competitors/leo-davinci.yaml`)*

**The opening:** all five vendors keep pricing opaque with almost no third-party review presence — this program buys largely on reference calls. The two strongest curriculum players ship no compliance module, so immunization/background-check/affiliation-agreement tracking almost certainly lives in spreadsheets regardless of which suite the COM owns today. *(`personas/discipline-do.yaml`, "current_tools")*

## C. Go-to-market sequencing

> **ADDED 2026-09-10, per stakeholder direction:** Pharmacy, not DO, is the confirmed
> first domain in market — see [`synthesis/prism-positioning.md`](../prism-positioning.md)
> for the full override note. DO remains the scorecard's analytical leader (below,
> unedited) and is the fast-follow once Pharmacy is in market.

DO is the recommended lead — the repo names it explicitly, not by averaging well but because it's the only domain scoring 5/5 on both accreditation pressure and incumbent weakness. **A phase-by-phase roadmap with dates and named beachhead-program targets does not exist in this research** and isn't invented here — this is the domain where that plan should be built first, since Pharmacy is explicitly sequenced to follow its template. *(`scorecard/where-to-play.yaml`)*

**Reachability:** 39 of 48 COMs are private, many inside health-sciences universities that already run the PA/PT/OT programs Prism serves today (Touro, NSU, PCOM-type institutions); the buying center is the clinical education office and accreditation liaison, not a hospital GME office; AACOM's annual meeting is a named, single-channel route to essentially the whole field of 48. *(`scorecard/where-to-play.yaml`, "Reachability" row)*

## D. Revenue model

**Mostly not sourced.** The only public price point across five DO-relevant competitors is eMedley's Capterra-listed "$5,000 Flat Rate, Per Year" starting price — everything else is confirmed non-public. No Prism-specific DO pricing exists in this repo. Don't infer tiers or ARR targets from that single data point. *(`competitors/emedley.yaml`)*

## E. Key personas

Full detail: [DESIGN.md](./DESIGN.md). Summary:

- **Dean / Program Director** — approves ed-tech spend roughly once every 5–7 years, usually triggered by an accreditation cycle, acquisition, or bad site visit. *(`personas/role-dean.yaml`)*
- **Compliance / Accreditation Liaison** — assembles the annual/mid-cycle COCA report by hand today; no shipped pillar maps evidence to named COCA elements. *(`personas/role-compliance-accreditation-liaison.yaml`)*
- **Clinical / Experiential Education Coordinator** — manages hundreds of individually-recruited preceptor relationships across many states; site capacity is the named, ongoing bottleneck, intensified since DO students began competing directly with MD students for away-rotation slots post-2020. *(`personas/role-clinical-coordinator.yaml`, `domains/do.yaml`)*

*Same caveat as Pharmacy: this repo's real role taxonomy doesn't include the generic "Faculty" or "Student" personas some external templates assume.*

## F. What to measure

No numeric targets are sourced. What the research points at:

- Whether the 3-year rolling site-capacity average and per-student pre-4th-year supervision checklist (COCA 6.9/6.10) can run as a live view instead of a spreadsheet reconstruction. *(`personas/discipline-do.yaml`, jtbd — "THIS IS THE PRIMARY JOB")*
- Whether cross-site statistical comparability (6.11) — "the hardest ask in the whole document" — can be computed at all from current data.
- COMLEX/PGY-1 public-metric publication timeliness (30-day and continual windows, Elements 11.4/11.5).
