---
# NOTE: `id` intentionally omits "ruchi" so it matches the already-frozen
# registry id for this same session (content/sources/registry.yaml), which 19
# existing citations already point at (15 `sources[].source_id` entries in
# content/lenses/standards-use-cases.yaml, 4 `sources[]` entries in
# content/trends/pharmacy.yaml, counted 2026-09-11). One canonical id per
# session; see the registry's "an entry's id is frozen once written" rule.
id: "interview-vishaka-pharmacy-understanding-2026-09-04"
type: "domain-expert"
date: "2026-09-04"
title: "Pharmacy understanding — product fit, competitors, use cases, with Vishaka and Ruchi"
participants:
  - { name: "Romit Soley", org: "Exxat", role: "Research" }
  - { name: "Ruchi", org: "Exxat", role: "Consultant — four emerging domains" }
  - { name: "Vishaka", org: "Exxat", role: "Customer Experience", is_domain_expert: true }
domains: ["Pharmacy"]
programs: []
recording:
  platform: "granola"
  external_id: "b818e417-61ab-4f49-894c-d11a270fb320"
access: "internal"
evidence_status: "verbatim-cleaned"
claims_are_speaker_opinion: true
topics: ["product-gaps", "gtm", "competitors"]
supersedes: []
---

# Pharmacy understanding — product fit, competitors, use cases, with Vishaka and Ruchi

**Date:** 2026-09-04
**Participants:** Romit Soley (Exxat), Ruchi (Exxat, consultant — four emerging domains), Vishaka (Exxat, Customer Experience)
**Source:** Granola meeting transcript, id `b818e417-61ab-4f49-894c-d11a270fb320`
**Status:** Level 0 raw source. Lightly cleaned (introductions, tech-support tangents and
cross-talk removed) but not summarized — substantive content is verbatim or near-verbatim
from the transcript. Anything downstream that cites this file should quote the specific
passage, not just this file generally.

---

## Context

Pharmacy is the first of four emerging domains Exxat is targeting. The internal working
line is "we are 80% there" with pharmacy. Ruchi opened by asking what that number
actually means. Vishaka is Exxat's pharmacy domain expert and runs Customer Experience
(learning hub, webinars, product grooming, release management).

## The load-bearing statement — the "80%" and the "25% gap" are anecdotal (verbatim)

> "Exactly when we say 80%, percent is anecdotal. Okay? It's a combination of how do we
> understand what pharmacy needs, and maybe based on that understanding, we are ahead in
> terms of product fit for pharmacy, if we compare DO and medical and dentistry is what
> we think. But we don't know what we don't know. So there's a lot more research that we
> should be doing to ascertain that the gaps in pharmacy that we are aware of, which we
> are thinking are only 25%, are the only gaps that are there. **So that research remains
> to be done.**"

Everything in this repo that rates a pharmacy competitor against a specific ACPE element
sits downstream of that sentence. No competitor rating derived from this research pass
may be presented as verified.

## How competitive/gap research actually happens today

> "Traditionally... we are a sales driven company, whether they accept it or not. So we
> [start] looking into a discipline and doing all this research soon after our first
> contract... So once the first, second, third customer we get, as we work with that
> customer for onboarding is when we organically figure out what's working and what's not
> working."

Contributors named: Wilson (demo questions), account managers / CSS (onboarding snags),
CX (consultant engagements and existing-customer interviews). Vishaka's point: for MD/DO
this order has to invert — "those are the places we need to have a product in place
before anyone will buy."

## Current pharmacy install base

Five pharmacy programs. Three use **Approve** only (the managed compliance service), not
the full Prism platform. Two are on the complete platform: **University of Maryland
(UMD)** and **OHSU**. **Husson Pharmacy** was a customer and has since churned.

## Competitors as Vishaka describes them

- **CORE** — "Core is our biggest competitor in pharmacy... they have, I think, about 80
  or more than 80% of pharmacy programs subscribed to Core." Compared directly to Exxat's
  own ~85% share of PT programs.
- **e-Value** — "e-Value is archaic and they're not making any significant enhancements.
  I think it's bought over by MedHub or it was an offshoot of MedHub, if I'm not wrong.
  But there is still some pharmacy customers who are subscribing to e-Value."
- Action item carried over from a prior AACP and not yet acted on: curate the list of
  e-Value pharmacy programs from booth-lead notes and from program websites (Manoj is
  doing the website sweep). "Four e-Value programs have even been flagged for immediate
  demos" — whether those demos happened is unknown to Vishaka.
- Vishaka personally holds a folder of **CORE screenshots and screen recordings** obtained
  via demos arranged through her own network.
- A masked vendor-comparison Excel ("vendor one, vendor two") covering the whole product,
  not just clinical education, exists with Isha/Wilson. The clinical-education-only sheet
  Romit had came from that original.

## The ExamSoft + CORE + Influx stack — the thing to break

> "In pharmacy, the popular [stack]... is CORE, ExamSoft, and Influx. It's a combination
> technology stack that you are going to see again and again in pharmacy programs."

Influx is an analytics/insights platform with no original data of its own. It has built
integrations with CORE (clinical data) and ExamSoft (didactic data), crunches both, and
sells insights, dashboards and gap-finding on top. Exxat was once on a path to integrate
with Influx and stopped, because Prism's own roadmap is to do the same thing.

**The September 12, 2026 release** lets programs already using Prism for clinical
management **bulk-import their ExamSoft reports and data**. Vishaka: "that's huge for us…
for the first time now, we will have the entire student data from didactic and clinical on
our platform." It is **free** — no additional service charge. Value prop: one platform,
all data in one place, cost savings, and fewer systems for staff to be trained on.

The exam module — Exxat's own ExamSoft counterpart — has a **January soft launch**.

## LMS integration

Named the second biggest pharmacy buying driver: it removes manual transfer of grades from
the clinical management system into the LMS, which is the program's official student
communication channel. A dean told Vishaka: "once you have LMS integration, come back to me
and talk to me." **Canvas is shipped. Brightspace is next, then Blackboard.** The
recommendation is to reopen that channel with every lead who asked.

Longer-term worry, verbatim: "in the last two years, LMS is slowly encroaching in our
space… Canvas, Brightspace, all of them have introduced AI, have introduced building
assessments… we are thinking we are building a product to compete with ExamSoft, but we
are actually competing with both LMS and ExamSoft."

## Use cases Ruchi asked for, and Vishaka's answers

Ruchi's ask: use cases with the two active pharmacy schools, plus "one use case where
[a school] would have moved from Core to Exact and their experience and why they moved…
and then also publish a white paper on it."

- **UMD (Maryland)** — implementation in progress, AM and CSS leading; Vishaka is on the
  strategic setup calls because the program is "interested in competency tracking [and]
  some helping solution for it." Once they are live, interview them and build a webinar.
  The specific workflow they land on is not documented yet.
- **OHSU Pharmacy** — "they have used us now almost for a year for the clinical management
  piece… definitely we should do an interview or a white paper or a testimonial with them
  and even a webinar… on how they were able to effectively manage their clinical
  placements using Prism." They have not adopted the rest of the product.
- **The pilot** — Vishaka is running a pilot with a school of pharmacy that is **not an
  Exxat customer and uses CORE today**, through a professor she knows: do the curriculum
  mapping in Prism, "then import ExamSoft data for some key pharmacotherapy courses, and
  correlate it with their NAPLEX outcome. So it's kind of a study that I'm doing." Status:
  "we are just in the process of collecting the data, very preliminary stage." Intent is to
  publish and present at next year's AACP; **the abstract deadline is November**.

## GTM targeting — the wrong tree

> "Today, most of our target prospects is the DCEs, which is director of clinical
> education… we really need to have solid lists from each of our current schools on who's
> their dean, who's their director, who's their curriculum chair, who's their assessment
> dean or assessment chair. Do targeted communication to them about competency tracking,
> curriculum mapping. Because the [DCE] doesn't care about curriculum mapping because it's
> not part of their responsibility… we are barking against the wrong tree."

Assets should differ by role: clinical leader gets one story; a program director or dean of
assessment gets competency tracking and the ExamSoft import.

## How placement is organized inside a university

- Pharmacy is typically its own independent program with its own budget and its own
  office of clinical (or experiential) education, headed by a director of clinical /
  experiential education.
- PT, OT and PA are usually departments under a school of medicine, health sciences, or
  pharmacy.
- Some universities centralize a **clinical coordinator** role that works across the
  individual schools' clinical education offices. More common in medical programs.
- Larger institutions increasingly have a **central office for faculty development and
  technology adoption** that makes enterprise software decisions (LMS, SIS, and often
  ExamSoft) and runs implementation across programs, funded from the institution-level
  dean's budget. Finding which universities have one identifies the real decision maker.
- University-level contracts matter because pharmacy can influence the smaller PT/OT/PA
  programs' software choice — the "one Exxat for the university" value prop.

## The product vision Vishaka would sell (AI insights, not reports)

> "It's not about giving them a good report. That data is gone. Today with AI, [it's]
> about how quickly are we helping them draw action items for improving their program
> outcomes… we don't want to give them reports and dashboards. Everyone is doing that. We
> wanna give them some AI aided insights telling them exactly where the gap is, giving a
> recommendation that this is how you can fix the gap."

Her worked example: "we noticed you're spending fourteen hours on geriatric drugs, and
that's an over coverage… you potentially can remove five hours from there so that you can
make room for [inserting] an IPEC competency that is a gap." This vision is in a
presentation she is preparing for Cohere and was previously shared at a June town hall. It
is a roadmap concept, not shipped.

Related structural observation: "they curriculum map and assessment map are disconnected.
So the faculty would create a curriculum separately. They would create assessment
separately. They're not really linking their curriculum with their assessments."

## Point solutions vs. one designed platform (verbatim — read the note below first)

> **Editorial note on this passage's evidentiary status.** This passage was part of the
> original verbatim extraction of the 2026-09-04 meeting, but it was omitted when this file
> was first committed to the repo, so the committed record has been a real but partial one.
> It has been added back here from that original extraction record. It has **not** been
> independently re-verified against the raw recording — this repo has no access to the
> Granola recording or its transcript, so no one working in this repo can currently check
> the wording against the primary source. Treat it as verbatim-as-extracted, one step
> weaker than the passages above it, and re-verify before quoting it externally.

> "the evolution of the entire epic has been point solutions… 2025 is a year where
> everyone's pitches via one platform that can allow you to do everything. So but the way
> it's done is, oh, we have this point solution… We are just going to provide all those
> points solutions in one platform rather than focusing on is the design of that one
> platform. Not just joining point solutions, but actually building a solution that can
> [do] everything… That part is missing. That is what we will try to do with that
> platform."

("epic" in the first line reads as a transcription artifact rather than a term of art —
flagged, not corrected, since the passage is reproduced exactly as extracted.)

This is the architectural argument sitting under the AI-insights vision above: the
complaint is not that competitors lack features, it is that bundling point solutions into
one login is not the same as designing one platform — and that the design is what Exxat
intends to compete on.

## RFP losses (MD/DO, not pharmacy)

The RFPs Exxat lost were mainly MD and DO. Top reasons Vishaka remembers: very detailed
placement-logic and scheduling requirements; university-health-system integration
expectations (UPMC named); and the connection between Exxat One and Exxat Prism not being
deep enough. Kunal and Wilson hold the full detail.

## Contacts named

Kanthi — interviews and consultants. David — webinars. Sam — pharmacy on the sales side.
Manoj — list curation (competitor-by-program website sweep, university org structure).
