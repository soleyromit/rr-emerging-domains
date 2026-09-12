# Dentistry: Product & GTM summary

*For: PMs and executives. Every figure below cites a source file. Full context: [`../gap-analysis.md`](../gap-analysis.md).*

## A. Market summary

**Market:** 77 CODA-accredited predoctoral (DDS/DMD) programs (up from 55 in 2000, 67 in 2020), genuinely growing — 28,925 students enrolled 2025-26 (up from 27,920), with 25% of 2024's 7,013 first-year enrollees at newly opened schools. *(`domains/dentistry.yaml`)*

**Where Dentistry ranks:** Last of four — 2.75 weighted vs. DO 4.40, Pharmacy 4.05, Medicine 3.85. It's the only domain scoring 2/5 on pillar fit: dental clinical education is a longitudinal in-house patient panel with per-procedure chairside sign-off, not block rotations, so Prism's confirmed anchor-relative scheduling primitive has little to anchor to. *(`scorecard/where-to-play.yaml`)*

**Why this domain is different from the other three:** this is not a displacement story. The incumbent, axiUm, is the combined patient EHR + billing/revenue-cycle system + student competency gradebook for the teaching clinic — one database holding HIPAA-regulated patient records. The domain's own persona file states it plainly: *"This archetype does not rip out axiUm."* *(`personas/discipline-dentistry.yaml`, "switching_trigger")*

**Where a real opening exists:** CODA 2-24 requires ~15 clinical competency categories evidenced by CDT-coded, tooth/surface-level procedure logs — called *"likely the single largest dentistry-specific build"* if Prism enters. axiUm has no public external-placement engine, no discrete student compliance tracker, no curriculum-mapping module, and no exam module — but it also has no reason to need one, since its academic model assumes patients come to the school's own clinic, not that students go out to sites. *(`accreditation/coda.yaml`; `competitors/axium.yaml`)*

## B. Competitive positioning

**Positioning is complementary, not competitive.** axiUm holds ~90% of U.S. dental schools (Henry Schein academic software reaches 85% of U.S. schools, ~30,000 students), rated 3.1/5 on Capterra — "clunky," "outdated like a program created in the early 90s," tolerated because institutional customers have had few options. Reviewers' complaints are real, but axiUm's retention anchor (patient EHR + billing + gradebook, one database) is close to absolute. *(`competitors/axium.yaml`)*

**Where axiUm has no answer, and other cross-discipline vendors barely reach:**

| Capability axiUm lacks | Who else serves Dentistry | The gap |
|---|---|---|
| External placement/rotation engine | CORE ELMS (dental page exists, SmartMatch) | CORE's dental page makes **no CODA-specific claim**, unlike its explicit ACPE claim on the pharmacy page |
| Student compliance-item tracking | CORE ELMS, Leo (DaVinci) | Leo is mid-merger into Elentra, with Elentra publicly courting Leo's own customers to migrate |
| Curriculum-to-competency mapping | Elentra (14 disciplines), E\*Value (20+ disciplines) | Neither speaks CDT — dentistry's native procedure-coding language |
| Exam management | Leo ships this today | Prism doesn't until Q2 2027 |

*(`competitors/core-elms.yaml`, `competitors/leo-davinci.yaml`, `competitors/elentra.yaml`, `competitors/e-value.yaml`)*

**The real entry point:** complementary aggregation for programs that need to place students at community-based extramural sites — not displacing axiUm's clinical EHR. *(`synthesis/gap-analysis.md`, "Competitive opening in dentistry")*

## C. Go-to-market sequencing

**Not a beachhead-timing question — a segment-fit question.** The persona file names two genuinely open windows, neither of which is "convince an established program to switch":

1. **A brand-new school** in the initial-accreditation cohort has no legacy database to migrate — buying its whole stack at once, the only moment the decision is genuinely open.
2. **A growing program's first serious extramural expansion**, forced by CODA Standard 2-9 (adequate patient experiences) when in-house patient volume can't meet quota — this acquires a multi-site placement, affiliation-agreement, and compliance problem axiUm has no public answer for. It's a budgeted adjacent purchase, not a replacement.

**No dated roadmap or named beachhead schools exist in this research** — and given the repo's own recommendation to defer this domain, that plan shouldn't be built until DO and Pharmacy are further along. **(ADDED 2026-09-10: Pharmacy, not DO, is now the confirmed first domain in market — see `synthesis/prism-positioning.md` — but the "defer Dentistry" conclusion above is unaffected by which of the two goes first.)** *(`personas/discipline-dentistry.yaml`, "switching_trigger")*

## D. Revenue model

**Not sourced.** axiUm's pricing is confirmed "not publicly disclosed." No Prism-specific Dentistry pricing exists in this repo.

## E. Key personas

Full detail: [DESIGN.md](./DESIGN.md).

- **Dean / Program Director** — same cross-cutting role as other domains, but here the accreditation exposure is patient-care-shaped, not exam-shaped: existential in a new program still building its patient base. *(`personas/role-dean.yaml`, `personas/discipline-dentistry.yaml`)*
- **Compliance / Accreditation Liaison** — CODA Standard 1-2 (continuous institutional effectiveness) is "the backbone of the self-study report," compiled manually today.
- **Clinical / Experiential Education Coordinator** — in dentistry, this role's core anxiety is patient-sourcing, not preceptor scheduling — the domain's central, existential risk for a new school.

*Note: this domain's persona also flags a "disqualifier" worth repeating for any role reading this — a pitch requiring CDT-level procedure coding or replacing chairside faculty sign-off competes with axiUm's core, not its gaps.*

## F. What to measure

No numeric targets sourced. What the research points at, if this domain is pursued:

- Whether real-time patient-encounter volume/breadth tracking against competency categories (CODA 2-9/2-24) can catch a shortfall months before it delays graduation — named as "the single biggest job" in the persona file.
- Whether a new-school full-stack pitch or an extramural-expansion add-on pitch converts better — these are two different sales motions, not one.
