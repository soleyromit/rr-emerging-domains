---
# Filename and id follow the pattern of the three records beside this one:
# <date>-<participants>-<topic>. The meeting's own Granola title renders the company
# name as "Exact"; that is the recognizer, not the name (see "Transcription
# artifacts" below), so the id and title here use Exxat.
id: "interview-romit-ruchi-pharmacy-domain-planning-2026-09-12"
type: "internal-planning"
date: "2026-09-12"
title: "Exxat pharmacy domain — competitive analysis, accreditation gaps, and product roadmap"
participants:
  - { name: "Romit Soley", org: "Exxat", role: "Research" }
  - { name: "Ruchi", org: "Exxat", role: "Consultant — four emerging domains" }
domains: ["Pharmacy"]
programs: []
recording:
  platform: "granola"
  # No Granola id was captured for this session. Recorded as null rather than
  # omitted, so the absence is visible instead of looking like a call that was
  # never recorded — the other Granola records here carry a real external_id.
  external_id: null
access: "internal"
evidence_status: "verbatim-cleaned"
claims_are_speaker_opinion: true
topics: ["research-plan", "competitors", "accreditation-crosswalk", "product-roadmap", "conferences"]
supersedes: []
---

# Exxat pharmacy domain — competitive analysis, accreditation gaps, and product roadmap

**Date:** 2026-09-12
**Participants:** Romit Soley (Exxat, research), Ruchi (Exxat, consultant — four emerging domains)
**Source:** Granola meeting transcript. No Granola `external_id` was captured for this
session, so unlike the 2026-08-26 and 2026-09-04 records beside it, this file is the only
in-repo locator for the call.
**Status:** Level 0 raw source. Lightly cleaned — connection troubleshooting, cross-talk,
and a personal phone call that ran after the work discussion had ended are removed — but
not summarized. Quoted passages are verbatim from the transcript, ASR artifacts included.
Anything downstream that cites this file should quote the specific passage, not just this
file generally.

**Speaker attribution.** Granola produced a single unlabelled stream for this call: no
line in the raw transcript carries a speaker. The decisions below are therefore recorded
as the *session's*, and named to a person only where the content makes the seat
unambiguous (strategy work to the consultant, product work to the research seat). Do not
attribute a quotation in this file to a named speaker.

**Transcription artifacts.** The recognizer renders **"Exxat" as "Exact"** throughout —
the same mis-hearing already present in the 2026-09-04 record ("moved from Core to
Exact"). Quotations below keep "Exact" exactly as transcribed; this file's own prose, and
any authored content downstream restating these claims, uses **Exxat**. Also seen and
left uncorrected inside quotations: "OTBT" for OT/PT, "prison" for Prism, "course user"
for CORE user, "Vishakha" for Vishaka, "Kanti" for Kanthi.

---

## Context

A working call over a shared Excel worksheet that lists the pharmacy research effort's
inputs row by row — the same seven-input shape the 2026-09-11 GTM-taxonomy session named
(competitive analysis, market sizing, program-level research, domain-expert research,
conference research, interviews, consultants). The purpose of this call was not to do the
research: it was to decide, input by input, what each one concretely means for pharmacy,
what is already done, and who owns it.

## Competitive analysis — how to actually get inside CORE

CORE needs a detailed teardown of "what they have, what they don't have potentially," and
the session named the access routes rather than assuming one:

- **Vishaka's recordings** — "we need like full access from Vishaka on all the video
  recordings." (She holds a folder of CORE demo screenshots and screen recordings; see the
  2026-09-04 record.)
- **The accreditation angle** — "from accreditation standard perspective, we would need to
  figure out how is like Core solving it."
- **CORE's public material** — "Core's website, like from PeopleGrove."
- **Former CORE users** — if an opportunity comes up through Cohere, talk to people "who
  were working with the core before." Asked who could broker that: "Maybe I think Wilson
  would be the right person."

The division of labour on this input: the consultant side takes the install-base question
("who has Core, etc."), and the research/product side takes the feature-level comparison —
"what you need to focus on is more of line-by-line services that Core provides that we may
not have."

## Accreditation gaps — the comparison is OT/PT, not nursing

This is the passage the `closest_analog` claim in `content/domains/pharmacy.yaml` rests on.

What the accreditation input means, verbatim:

> "I would say in case of accreditation, it is like mapping of accreditation standards. To
> how exact? Operates. Versus like what is gap in the exact? And how does the comparator
> solve?"

The open question was which existing Exxat discipline pharmacy should be mapped against —
nursing, or PT/OT. The session settled it on structure:

> "OTPT, OTPT, Single Unified Accredit Return, um, and you're looking at 5 visit cycles. So
> I think it's very similar to OTPT. So we need to compare it to OTPT."

Why it is worth the work — the mapping is expected to come out near-complete, which turns
pharmacy from a build into a scaffold:

> "we can say that we have a program or we have a software that would— it's almost 90 to
> 100%."

> "So we don't have to do any additional work, right? But you'll have to do that mapping.
> requirement to requirement. And those requirements, uh, Vishakha has outlined them very
> well in her ebook."

Two enablers were confirmed on the call: Exxat has Prism access to an OT/PT school to work
from ("I put any OTPT school in the prison. I can get the access"), and the pharmacy
requirements themselves are already written up in Vishaka's pharmacy ebook. A related
observation, unelaborated: OT/PT is also being implemented for Maryland.

## Domain-expert research

Defined as: what research Exxat's own domain experts have already done — conferences they
attended, insights they carry, data they hold. Vishaka is the named pharmacy expert;
Wilson was named as holding data of his own. Outstanding artifacts from Vishaka at the
time of the call:

- The folder she was to share (still pending).
- Notes she sent from a conference she attended.
- An introduction to Kanthi, for reaching consultants and setting up interviews.
- A June town hall deck.

People to meet, named on the call: **Sam** (pharmacy, sales side), **Ashish** (working a
university's pharmacy implementation), **Kanthi**.

## Conference research — two access routes, one of them paid

Conferences split into the ones internal domain experts have attended (get a summary from
them) and the ones whose recordings sit behind a paywall: "there are conferences where to
watch a video you need to pay. There's a paywall basically." The proposed fix is a shared
account — "build an account, a common account where we can access all the webinar videos.
Which are behind paywall" — scoped to the relevant conferences, off the conference list
Vishaka already shared by email.

## Interviews and consultants

Interview users, and ask the internal domain experts to broker the introductions — ideally
including programs that are *not* Exxat customers, though the call acknowledged that
reaching non-customers is hard (the one precedent named was a professor reached through
Vishaka's own partnership). On the consultant side the question raised was what level to
aim at — a dean or program director, or someone at the standards-body level. The answer
given: "it's program director as well as course user, someone who's already using."

## University archetypes

Archetype universities against the Exxat footprint. Taken by the consultant side
explicitly "because that's something will be part of strategy."

## Product roadmap — there is no readable roadmap, so it gets reconstructed

The product team has not been working on pharmacy-domain requirements, and the roadmap
data itself is not accessible:

> "I'm still working out with An exact team member called Salman who can give me access to
> their current task and user stories that they are going to develop."

Getting that access would also expose the shipped history, not just the plan. Because the
task platform is gated and any roadmap shared from above would be thin —

> "these things are very high-level data that they will share. So I mean, it will be
> helpful but not at a very deeper level."

— the roadmap is being reconstructed from what the product has actually shipped:

> "I am trying to develop a repository where all the Help Center documents and all the
> playbooks are. at one space. Which would allow us to know that how much of the roadmap
> is connected to OT and PT and similarly to pharmacy."

That corpus is Help Center articles, playbooks and tutorial videos (transcripts and
screenshots), plus the guides issued to universities. **Yash** was named as the person to
ask for a roadmap directly, with the caveat that what he shares, what the product managers
share, and what is actually tracked may not agree — so secondary research stays necessary
either way.

The deliverable the consultant side asked for is narrower than a roadmap: a map of what
OT/PT actually does in the product. "I don't know the product to be very honest, right? I
know the screens." Pick a school, document how they use it, and show how close that is to
what pharmacy needs. And before building any of it, ask the product managers what already
exists — "we don't have to recreate the wheel. We need to find the workflows for OTPT."

## The competitive slide, and the January exam launch

The competitive output is deliberately small: one slide, "what places they have, what they
don't have, what we have, what we don't have." The known stack point — CORE plus ExamSoft
plus Influx — becomes an Exxat argument once the exam module ships: "we are launching exam
in January," so "you can just use Exact for all the suites" instead of combining vendors.
The targeting follow-on: find which universities are using ExamSoft today, because those
are the programs that consolidation can be pitched to.

## Why pharmacy first

> "Okay, the reason I want to start with pharmacy is there's a lot of things available. So
> if we set it up for pharmacy, then we can do it for rest."

> "Yes, and I think this will also become like a framework in future."

## How the worksheet was split

Recorded as the session's split (see the speaker-attribution caveat above):

| Input | Owner |
|---|---|
| Market sizing | Consultant side — already done and being updated; Manoj helped build it |
| Program-level research | Consultant side — off what Vishaka shared |
| Accreditation gaps (the OT/PT comparison) | Consultant side |
| University archetypes | Consultant side ("part of strategy") |
| CORE install base ("who has Core") | Consultant side |
| Product roadmap / product gap map | Research side |
| Competitive analysis, line-by-line vs CORE | Research side, from the product angle |

One worksheet row stayed ambiguous on the call — row 42, "what is the most similar to
Exact compared to what is available in OTPD" — with the two of them unsure whether it
belongs under product roadmap or under accreditation. It was left under product roadmap.

## Named people and open dependencies

Vishaka (folder, conference notes, CORE recordings — the largest open dependency at the
time of the call) · Wilson (former-CORE-user introductions) · Kanthi (consultants and
interviews) · Sam (pharmacy sales) · Ashish (university pharmacy implementation) · Yash
(roadmap) · Salman (task/user-story platform access) · Manoj (market-sizing data).
