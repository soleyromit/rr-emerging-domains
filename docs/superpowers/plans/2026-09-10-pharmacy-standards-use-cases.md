# Pharmacy Standards: Proposed Use Cases + Competitor Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/domains/pharmacy/standards` useful when a reader clicks "Show detail" — every ACPE element gains a proposed-use-case section (curated entries plus a computed flow/journey fallback), and the competitor cards gain real, honestly-caveated directional ratings instead of 98 empty cells.

**Architecture:** A new Level-2 lens file `content/lenses/standards-use-cases.yaml` (structural sibling of `standards-competitor-ratings.yaml`) carries curated `(domain, element_id)` use cases sourced from a new Level-0 interview file; `lib/content.ts` merges those with a computed join that reverse-matches each ACPE `element_id` against `flows/*.yaml` `steps[].elements[].accreditation_citation` and `journeys/*.yaml` `stages[].accreditation_link` prose. `accreditation-standards-table.tsx`'s `StandardDetail` renders both above the existing competitor-ratings section. New directional ratings carry `evidence_strength`/`evidence_note`, gated structurally in `check_content_density.py`, shown visually via a new `DirectionalBadge` in `fit-badge.tsx`, and aggregated in `CoverageGapsCallout`.

**Tech Stack:** Next.js 16 App Router (`apps/ecosystem`), `@astryxdesign/core` design system, TypeScript, YAML content read at build time via `js-yaml`, Python 3 + PyYAML for `scripts/check_content_density.py`. **There is no Jest/Vitest/Playwright in this repo** — verified: `apps/ecosystem/package.json` has no test script and no test runner in `dependencies`/`devDependencies`. "Tests" are therefore `python3 scripts/check_content_density.py`, `npm run check:density`, `npx next build`, and explicit manual browser checks.

**Spec:** docs/superpowers/specs/2026-09-10-pharmacy-standards-use-cases-design.md

## Global Constraints

- **Citation direction:** every file cites only the level(s) below it — never sideways, never up (`content/ARCHITECTURE.md`). `standards-use-cases.yaml` is Level 2: it cites `accreditation/acpe.yaml` by `element_id` (down) and `interviews/` + `sources/registry.yaml` (down). `related_flows` pointing at Level 3 is the one already-tolerated navigational exception — it is wayfinding, not evidence.
- **No fabrication:** a competitor cell with no real sourced evidence stays absent. Absence renders as "Not yet researched against this specific standard — unresearched, not 'doesn't solve it.'" Never invent a rating to fill the grid.
- **Nothing Vishaka flagged as unverified may be written as verified.** Her load-bearing statement — real pharmacy standards-gap research has never been done, and the working "~25%" figure is "research that remains to be done" — is the reason `evidence_strength: "directional"` exists. Every new rating in this work is directional.
- **Density ceiling — `standards-use-cases.yaml` `use_cases[].use_case`: soft 120, hard 220.**
- **Density ceiling — `standards-use-cases.yaml` `use_cases[].detail`: soft 300, hard 600.**
- **Density ceiling — `standards-competitor-ratings.yaml` `ratings[].evidence_note`: soft 150, hard 300.**
- **Existing ceiling that governs the new journey — `journeys/*.yaml` `key_findings[].detail`: soft 260, hard 350.** Hold new entries ≤ 260. This is the exact field that overran on `rotation-lifecycle.yaml`.
- **Existing ceiling — `journeys/*.yaml` `current_state_in_prism` / `pain_or_gap` / `accreditation_link` / `competitor_comparison`: soft 2,000, hard 3,500.** Target 800–1,400 per field.
- **Existing ceiling — `trends/*.yaml` `trends[].trend`: soft 120, hard 220; `trends[].detail`: soft 300, hard 600.**
- **Existing ceiling — `sources/registry.yaml` `sources[].what_it_supports`: soft 150, hard 300.**
- **Density baseline is 934 WARN / 31 FAIL** (verified by running the script on the pre-change tree). FAIL count must stay at 31 with no FAIL naming a file this work touches. A genuinely new FAIL is either fixed or added to `ALLOWLIST` in `scripts/check_content_density.py` with a one-line reason and today's date.
- **No raw filenames, YAML slugs, or partial paths as visible UI text, ever** (`apps/ecosystem/UI-DENSITY-PATTERNS.md`). Every flow/journey reference renders as `flow_name` / `journey_name`.
- **Every `<Text>` rendering a long-form field needs `maxLines=`, a nearby `<Collapsible`, or a `DENSITY-OK:` comment** — enforced by `apps/ecosystem/scripts/check-render-density.sh`. Prefer `FieldBlock`.
- **No new color in the shared badge palette and no numeric "confidence score."** `DirectionalBadge` and `UseCaseStatusBadge` reuse the existing `neutral | info | success | warning | error` variants.
- Run app commands from `apps/ecosystem/`; run the Python density script from the repo root.

---

### Task 1: Vishaka interview source file + registry entry

Blocking prerequisite. Nothing below may cite Vishaka until this Level-0 file exists.

**Files:**
- Create: `content/interviews/2026-09-04-vishaka-ruchi-pharmacy-understanding.md`
- Modify: `content/sources/registry.yaml` (append a new entry at the end of the `sources:` list; the file is 596 lines and its last entry is `video-new-innovations-introduction-homepage-2020`)
- Test: `python3 scripts/check_content_density.py` (gates `sources[].what_it_supports`)

**Interfaces:**
- Consumes: nothing (Level 0).
- Produces: source id `interview-vishaka-pharmacy-understanding-2026-09-04`, referenced by every `sources[].source_id` in Tasks 5, 6, 8, 9 and by `trends[].sources` in Task 11.

- [ ] **Step 1: Create `content/interviews/2026-09-04-vishaka-ruchi-pharmacy-understanding.md`** with this exact content. Format matches `content/interviews/2026-08-26-wilson-nursing-crosswalk.md` (title, date/participants, Granola source, "Level 0 raw source" status line, then near-verbatim sections):

```markdown
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

## RFP losses (MD/DO, not pharmacy)

The RFPs Exxat lost were mainly MD and DO. Top reasons Vishaka remembers: very detailed
placement-logic and scheduling requirements; university-health-system integration
expectations (UPMC named); and the connection between Exxat One and Exxat Prism not being
deep enough. Kunal and Wilson hold the full detail.

## Contacts named

Kanthi — interviews and consultants. David — webinars. Sam — pharmacy on the sales side.
Manoj — list curation (competitor-by-program website sweep, university org structure).
```

- [ ] **Step 2: Append this exact entry to the end of the `sources:` list in `content/sources/registry.yaml`** (after the `video-new-innovations-introduction-homepage-2020` entry, which is the current final entry at the end of the file). Note there is deliberately **no `url:` field** — the source is an in-repo file, and `UI-DENSITY-PATTERNS.md` forbids rendering a raw path as visible text; `SourceList`/`SourceLine` fall back to rendering `title` as prose when `url` is absent, which is the correct behavior here:

```yaml

  # --- Interviews (Level 0, in-repo) ---
  - id: "interview-vishaka-pharmacy-understanding-2026-09-04"
    title: "Interview — Pharmacy understanding with Vishaka and Ruchi (Exxat, 2026-09-04)"
    type: "interview"
    publisher: "Exxat (internal)"
    date: "2026-09-04"
    what_it_supports: "Exxat's pharmacy domain expert states the 80% product-fit and 25%-gap figures are anecdotal and the real standards-gap research remains undone; names the CORE/ExamSoft/Influx stack, the two live pharmacy customers, and the pilot."
    accessed: "2026-09-10"
```

- [ ] **Step 3: Verify the `what_it_supports` length is inside its ceiling** — Run from the repo root: `python3 -c "import yaml;d=yaml.safe_load(open('content/sources/registry.yaml'));s=[x for x in d['sources'] if x['id']=='interview-vishaka-pharmacy-understanding-2026-09-04'][0];print(len(s['what_it_supports']))"`. Expected: a number `<= 300` (the hard ceiling). If it prints > 300, shorten the sentence — do not allowlist.
- [ ] **Step 4: Run the density script** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only | tail -3`. Expected: `934 WARN, 31 FAIL` or `935 WARN, 31 FAIL` (a `what_it_supports` between 150 and 300 adds one WARN, which is fine). FAIL must still be exactly `31`.
- [ ] **Step 5: Commit**
  ```bash
  git add content/interviews/2026-09-04-vishaka-ruchi-pharmacy-understanding.md content/sources/registry.yaml
  git commit -m "Add Vishaka pharmacy-understanding interview as a Level-0 source"
  ```

---

### Task 2: Density ceilings and integrity gates for the new fields

Gates land before content, so no entry can be authored past a ceiling that doesn't exist yet.

**Files:**
- Modify: `content/CONTENT-DENSITY.md:33-59` (the ceiling table; append three rows after the current final row, `lenses/standards-competitor-ratings.yaml ratings[].rationale`, on line 59)
- Modify: `scripts/check_content_density.py:96-98` (`STANDARDS_RATINGS_CEILINGS`), `:240-311` (`check_standards_ratings_integrity`), `:402-411` (the file-walk block in `main`), `:427-429` (the integrity-problem accumulation in `main`)
- Test: `python3 scripts/check_content_density.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `STANDARDS_USE_CASES_CEILINGS` (dict), `check_standards_use_cases_integrity()` (function), the `ratings[].evidence_note` ceiling entry, and the directional-requires-a-note assertion inside `check_standards_ratings_integrity()`. Tasks 5, 6, 8, 9 all depend on these gates existing.

- [ ] **Step 1: Append these three rows to the ceiling table in `content/CONTENT-DENSITY.md`**, immediately after the existing final table row (line 59, the `lenses/standards-competitor-ratings.yaml` `ratings[].rationale` row):

```markdown
| `lenses/standards-use-cases.yaml` `use_cases[].use_case` | 120 | 220 | **new 2026-09-10** — a one-line "what a program would actually do with this standard," same register as a `trends[].trend` headline (120/220) and for the same reason: it is a scannable label, not the argument. The argument goes in `detail`. |
| `lenses/standards-use-cases.yaml` `use_cases[].detail` | 300 | 600 | **new 2026-09-10** — same numbers as `personas/lens-*.yaml`'s `gaps_prism_can_exploit[].detail`, since it is the same shape of claim: one paragraph of sourced supporting evidence behind a plain-language headline. An entry that can't fit decomposes into two `use_cases[]` entries. |
| `lenses/standards-competitor-ratings.yaml` `ratings[].evidence_note` | 150 | 300 | **new 2026-09-10** — a one-line statement of *what evidence the directional rating actually rests on* ("first-pass read of the vendor's public product page only"), not a second rationale. Same order of magnitude as `sources[].what_it_supports`, the closest analog. |
```

- [ ] **Step 2: In `scripts/check_content_density.py`, add the `evidence_note` ceiling** — replace the `STANDARDS_RATINGS_CEILINGS` block currently at lines 94-98 with:

```python
# same order of magnitude as competitors/*.yaml's strengths[].claim — the closest
# analog (a single-sourced competitive claim).
STANDARDS_RATINGS_CEILINGS = {
    "ratings[].rationale": (300, 600),
    # added 2026-09-10 with evidence_strength: a one-line statement of what the
    # directional rating actually rests on, not a second rationale.
    "ratings[].evidence_note": (150, 300),
}
# content/lenses/standards-use-cases.yaml — added 2026-09-10. `use_case` is a
# scannable one-liner (same register as a trends[].trend headline); `detail` is the
# sourced paragraph behind it (same numbers as a lens gaps_prism_can_exploit[].detail).
STANDARDS_USE_CASES_CEILINGS = {
    "use_cases[].use_case": (120, 220),
    "use_cases[].detail": (300, 600),
}
```

- [ ] **Step 3: Add the directional-evidence assertion to `check_standards_ratings_integrity()`** — inside the `for i, r in enumerate(doc.get("ratings") or []):` loop (which begins at line 279), insert this block immediately after the existing `has_sources_list` / no-source check (the block ending `f"{where}: rating {r.get('rating')!r} has no source (neither \`source\` nor \`sources[]\`)"`, currently line 294):

```python
        # evidence_strength/evidence_note (added 2026-09-10). "directional" means a
        # first-pass read of public vendor material, NOT the element-by-element
        # verification the unflagged entries carry. Requiring the note makes a future
        # "promote to verified" pass a visible diff instead of a silent
        # reclassification — see the design spec's caveat mechanism, layer 1.
        strength = r.get("evidence_strength")
        if strength is not None and strength != "directional":
            problems.append(
                f"{where}: evidence_strength {strength!r} is not a recognized value (only 'directional', or omit the field)"
            )
        if strength == "directional" and not (r.get("evidence_note") or "").strip():
            problems.append(f"{where}: evidence_strength 'directional' requires a non-empty evidence_note")
        if r.get("evidence_note") and strength != "directional":
            problems.append(
                f"{where}: evidence_note is set but evidence_strength is not 'directional' — an unflagged note reads as verified"
            )
```

- [ ] **Step 4: Add `check_standards_use_cases_integrity()`** — insert this whole function immediately after `check_standards_ratings_integrity()` ends (after its `return problems`, currently line 311) and before `def check_trends_integrity():`:

```python
def check_standards_use_cases_integrity():
    """Same automatable "does the arrow point down, and does it resolve" check that
    check_standards_ratings_integrity() applies to the ratings lens, applied to
    content/lenses/standards-use-cases.yaml (added 2026-09-10): every entry must
    resolve to a real accreditation element for its domain, carry a recognized
    status, and have every audience persona / source id / related flow resolve.

    `no-fit-yet` is a first-class value, not an absence — but it must say WHY in
    `detail`, otherwise it's indistinguishable from an unfinished entry."""
    problems = []
    path = CONTENT / "lenses" / "standards-use-cases.yaml"
    if not path.exists():
        return problems
    doc = yaml.safe_load(path.read_text()) or {}

    elements_by_slug = {}
    for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        adoc = yaml.safe_load(f.read_text()) or {}
        if adoc.get("slug"):
            elements_by_slug[adoc["slug"]] = {s.get("element_id") for s in (adoc.get("standards") or [])}

    source_ids = _load_source_ids()
    persona_slugs = _load_persona_slugs()
    flow_slugs = {f.stem for f in (CONTENT / "flows").glob("*.yaml") if not f.name.startswith("_TEMPLATE")}
    valid_statuses = {"proposed", "in-flight", "documented", "no-fit-yet"}

    for i, u in enumerate(doc.get("use_cases") or []):
        where = f"use_cases[{i}]"
        domain = u.get("domain")
        element_id = u.get("element_id")
        accreditor_slug = DOMAIN_TO_ACCREDITATION_SLUG.get(domain)
        if accreditor_slug is None:
            problems.append(f"{where}: domain {domain!r} is not a recognized accreditation domain")
        elif element_id not in elements_by_slug.get(accreditor_slug, set()):
            problems.append(f"{where}: element_id {element_id!r} not found in {domain}'s accreditation file")

        status = u.get("status")
        if status not in valid_statuses:
            problems.append(f"{where}: status {status!r} not in {sorted(valid_statuses)}")
        if status == "no-fit-yet" and not (u.get("detail") or "").strip():
            problems.append(f"{where}: status 'no-fit-yet' requires a detail saying why — a blank gap reads as unfinished")
        if not (u.get("use_case") or "").strip():
            problems.append(f"{where}: use_case is empty")

        for p in u.get("audience") or []:
            if p not in persona_slugs:
                problems.append(f"{where}: audience {p!r} not found in content/personas/*.yaml")

        for j, s in enumerate(u.get("sources") or []):
            sid = s.get("source_id")
            if sid and sid not in source_ids:
                problems.append(f"{where}.sources[{j}]: source_id {sid!r} not found in content/sources/registry.yaml")
        if not (u.get("sources") or []):
            problems.append(f"{where}: no sources[] — a use case asserts something and must cite where it came from")

        for j, rf in enumerate(u.get("related_flows") or []):
            slug = (rf.get("flow") or "").replace(".yaml", "")
            if slug and slug not in flow_slugs:
                problems.append(f"{where}.related_flows[{j}]: flow {rf.get('flow')!r} not found in content/flows/")

    return problems
```

- [ ] **Step 5: Wire the new file and the new check into `main()`** — in `main()`, immediately after the existing `ratings_file` block (currently lines 402-404, ending `check_file(ratings_file, STANDARDS_RATINGS_CEILINGS, results)`), insert:

```python
    use_cases_file = CONTENT / "lenses" / "standards-use-cases.yaml"
    if use_cases_file.exists():
        check_file(use_cases_file, STANDARDS_USE_CASES_CEILINGS, results)
```

  and change the integrity accumulation block (currently lines 427-429) from:

```python
    integrity_problems = check_standards_ratings_integrity()
    integrity_problems += check_trends_integrity()
    integrity_problems += check_research_sources_integrity()
```

  to:

```python
    integrity_problems = check_standards_ratings_integrity()
    integrity_problems += check_standards_use_cases_integrity()
    integrity_problems += check_trends_integrity()
    integrity_problems += check_research_sources_integrity()
```

- [ ] **Step 6: Verify the gates do nothing yet but still run** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only | tail -3`. Expected: FAIL count unchanged at `31` (the use-cases file does not exist yet, so `check_standards_use_cases_integrity()` returns `[]`; the two existing pharmacy ratings have no `evidence_strength`, so the new assertions are silent).
- [ ] **Step 7: Verify the new integrity check actually fires** — Run this one-liner from the repo root, which exercises the function against a synthetic bad entry without touching any file on disk:
  ```bash
  python3 -c "
import sys, pathlib, yaml, tempfile, importlib.util
spec = importlib.util.spec_from_file_location('ccd', 'scripts/check_content_density.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print('use_cases fn present:', callable(m.check_standards_use_cases_integrity))
print('use_case ceilings:', m.STANDARDS_USE_CASES_CEILINGS)
print('evidence_note ceiling:', m.STANDARDS_RATINGS_CEILINGS.get('ratings[].evidence_note'))
"
  ```
  Expected output:
  ```
  use_cases fn present: True
  use_case ceilings: {'use_cases[].use_case': (120, 220), 'use_cases[].detail': (300, 600)}
  evidence_note ceiling: (150, 300)
  ```
- [ ] **Step 8: Commit**
  ```bash
  git add content/CONTENT-DENSITY.md scripts/check_content_density.py
  git commit -m "Add density ceilings and integrity gates for standards use cases and directional ratings"
  ```

---

### Task 3: `lib/content.ts` — `StandardUseCase` type, computed join, crosswalk merge

Pure data layer. Ships and builds cleanly against zero curated content.

**Files:**
- Modify: `apps/ecosystem/lib/content.ts:748-758` (`StandardsCompetitorRatingEntry`), `:807-815` (`StandardsCrosswalkCompetitorCell`), `:817-832` (`StandardsCrosswalkRow`), `:834-843` (`StandardsCrosswalkForDomain`), `:854-916` (`getStandardsCrosswalkForDomain`), plus a new section inserted after `getStandardsCompetitorRatings()` (currently ends line 769)
- Test: `cd apps/ecosystem && npx next build` (compiles + prerenders every static route) plus the node one-liner in Step 7

**Interfaces:**
- Consumes: `RelatedFlow`, `ResolvedRelatedFlow`, `resolveRelatedFlows`, `resolveSourceIds`, `SourceRegistryEntry`, `listFlows`, `listJourneys`, `getJourneyContextForFlow`, `readYamlFile` — all already exported or module-local in this file.
- Produces, spelled exactly this way everywhere downstream: type `StandardUseCaseStatus`; interfaces `StandardUseCaseEntry`, `StandardsUseCasesDoc`, `StandardUseCase` (fields `useCase`, `status`, `audience`, `detail`, `relatedFlows`, `sources`), `ComputedUseCaseMatch` (fields `kind`, `label`, `href`, `context`); constant `COMPUTED_USE_CASE_MATCH_CAP`; functions `getStandardsUseCases()`, `buildComputedUseCaseIndex()`; new `StandardsCrosswalkRow` fields `useCases`, `computedMatches`, `computedMatchTotal`; new `StandardsCrosswalkForDomain` fields `standardsWithUseCaseCount`, `directionalRatingCount`; new `StandardsCrosswalkCompetitorCell` fields `evidenceStrength`, `evidenceNote`.

- [ ] **Step 1: Add the two new optional fields to `StandardsCompetitorRatingEntry`** — replace the interface currently at lines 748-758 with:

```ts
export interface StandardsCompetitorRatingEntry {
  domain: string;
  element_id: string;
  competitor_slug: string;
  rating: "not-meeting" | "partially-meeting" | "fully-meeting";
  rationale?: string;
  source?: string;
  competitor_feature_ref?: string;
  sources?: { source_id: string }[];
  persona_relevance?: string[];
  /** Added 2026-09-10. Present only on first-pass ratings read off public vendor
   * material rather than verified element by element. The existing verified
   * entries deliberately omit it. Enforced in check_content_density.py's
   * check_standards_ratings_integrity(): "directional" requires evidence_note. */
  evidence_strength?: "directional";
  /** What the directional rating actually rests on — required whenever
   * evidence_strength is "directional". */
  evidence_note?: string;
}
```

- [ ] **Step 2: Add the whole standards-use-cases section** — insert this immediately after `getStandardsCompetitorRatings()` closes (currently line 769) and before `export interface SourceRegistryEntry`:

```ts
// ---------- standards use cases (Level 2 lens + computed fallback) ----------

// content/lenses/standards-use-cases.yaml — added 2026-09-10, structural sibling of
// standards-competitor-ratings.yaml above: sparse, keyed by (domain, element_id),
// citing accreditation/*.yaml downward by element_id and carrying related_flows as
// the already-tolerated Level 2 -> Level 3 navigational pointer (see
// content/ARCHITECTURE.md). Absence of an entry is the "not curated yet" state, not
// an error — the computed join below fills the remaining elements as a distinctly
// labeled fallback.
export type StandardUseCaseStatus = "proposed" | "in-flight" | "documented" | "no-fit-yet";

export interface StandardUseCaseEntry {
  domain: string;
  element_id: string;
  use_case: string;
  status: StandardUseCaseStatus | string;
  audience?: string[];
  detail?: string;
  related_flows?: RelatedFlow[];
  sources?: { source_id: string }[];
}

export interface StandardsUseCasesDoc {
  last_updated: string;
  use_cases: StandardUseCaseEntry[];
}

export function getStandardsUseCases(): StandardsUseCasesDoc | null {
  return readYamlFile<StandardsUseCasesDoc>("lenses/standards-use-cases.yaml");
}

/** One curated use case, resolved for rendering. */
export interface StandardUseCase {
  useCase: string;
  status: StandardUseCaseStatus | string;
  audience: string[];
  detail?: string;
  relatedFlows: ResolvedRelatedFlow[];
  sources: SourceRegistryEntry[];
}

/** One computed (not curated) reference: an existing flow or journey whose own
 * accreditation prose already names this element. Zero authoring — it's a reverse
 * lookup over research that already exists. */
export interface ComputedUseCaseMatch {
  kind: "flow" | "journey";
  /** flow_name or journey_name — never a slug or filename (UI-DENSITY-PATTERNS.md). */
  label: string;
  href: string;
  context?: string;
}

// Standard 3 Key Element 3.3.a alone matches 9 flow files; rendering all of them
// buries the curated entries above. Cap the rendered list and report the remainder
// as a count.
export const COMPUTED_USE_CASE_MATCH_CAP = 4;

// Matching is deliberately strict: the FULL element_id string ("Standard 3, Key
// Element 3.3.a") AND the accreditor's short name must both appear in the same prose
// field. Loosening to bare numbers would false-positive across accreditors — COCA and
// LCME both use "Standard N, Element N.N" numbering, and CODA reuses "Standard N,
// Element N-N". Verified 2026-09-10: the accreditor-name guard changes nothing for
// ACPE (still 12 of 20 elements covered, still 9 flows for 3.3.a) while removing the
// cross-accreditor collision risk.
function elementProseHit(prose: string | undefined, elementId: string, accreditorShort: string): boolean {
  if (!prose) return false;
  if (!prose.includes(elementId)) return false;
  return !accreditorShort || prose.includes(accreditorShort);
}

/** "ACPE (Accreditation Council for Pharmacy Education)" -> "ACPE". Derived from the
 * accreditation file's own `accreditor` field rather than a hand-kept map, so a new
 * accreditor file needs no code change. */
export function accreditorShortName(doc: AccreditationDoc): string {
  return (doc.accreditor ?? "").split("(")[0].trim();
}

/** One pass over flows + journeys for every element at once. Built as an index
 * rather than a per-element function because the naive shape re-reads all 41 flow
 * files and all 5 journey files once per element (20x on the pharmacy page). */
export function buildComputedUseCaseIndex(
  elementIds: string[],
  accreditorShort: string
): Map<string, ComputedUseCaseMatch[]> {
  const index = new Map<string, ComputedUseCaseMatch[]>();
  for (const id of elementIds) index.set(id, []);

  for (const flow of listFlows()) {
    const prose = (flow.steps ?? []).flatMap((s) =>
      (s.elements ?? []).map((e) => e.accreditation_citation ?? "")
    );
    if (!prose.length) continue;
    let ctxResolved: FlowJourneyContext | null | undefined;
    for (const id of elementIds) {
      if (!prose.some((p) => elementProseHit(p, id, accreditorShort))) continue;
      if (ctxResolved === undefined) ctxResolved = getJourneyContextForFlow(flow);
      index.get(id)!.push({
        kind: "flow",
        label: flow.flow_name,
        href: `/flows/${flow.slug}`,
        context: ctxResolved
          ? `${ctxResolved.journey.journey_name} — stage ${ctxResolved.stageNumber}`
          : undefined,
      });
    }
  }

  for (const journey of listJourneys()) {
    (journey.stages ?? []).forEach((stage, i) => {
      for (const id of elementIds) {
        if (!elementProseHit(stage.accreditation_link, id, accreditorShort)) continue;
        index.get(id)!.push({
          kind: "journey",
          label: journey.journey_name,
          href: `/journeys/${journey.slug}`,
          context: `Stage ${i + 1} — ${stage.stage}`,
        });
      }
    });
  }

  return index;
}
```

- [ ] **Step 3: Add the evidence fields to `StandardsCrosswalkCompetitorCell`** — replace the interface currently at lines 807-815 with:

```ts
export interface StandardsCrosswalkCompetitorCell {
  competitor: string;
  slug: string;
  rating: "not-meeting" | "partially-meeting" | "fully-meeting" | "unresearched";
  rationale?: string;
  source?: string;
  competitorFeatureRef?: string;
  sources: SourceRegistryEntry[];
  /** "directional" = first-pass read of public vendor material, not element-by-element
   * verification. Absent on the pre-existing verified entries, by design. */
  evidenceStrength?: "directional";
  evidenceNote?: string;
}
```

- [ ] **Step 4: Add the use-case fields to `StandardsCrosswalkRow` and the counters to `StandardsCrosswalkForDomain`** — replace lines 817-843 with:

```ts
export interface StandardsCrosswalkRow {
  element_id: string;
  element_title?: string;
  evidence_programs_must_produce?: string;
  required_software_behavior?: string;
  prism_fit?: string;
  prism_fit_rationale?: string;
  exxat_compliance?: string;
  exxat_compliance_rationale?: string;
  gap_notes?: string;
  personaRelevance: string[];
  /** Resolved from `research_sources` — peer-reviewed/analyst literature
   * backing this standard's real-world difficulty, always an array. */
  researchSources: SourceRegistryEntry[];
  competitors: StandardsCrosswalkCompetitorCell[];
  /** Curated entries from lenses/standards-use-cases.yaml. Rendered first. */
  useCases: StandardUseCase[];
  /** Computed fallback, already capped at COMPUTED_USE_CASE_MATCH_CAP. */
  computedMatches: ComputedUseCaseMatch[];
  /** Uncapped count, so the UI can say "N more" honestly. */
  computedMatchTotal: number;
}

export interface StandardsCrosswalkForDomain {
  domain: string;
  accreditor: string;
  standardsDocument?: { title?: string; url?: string };
  competitors: { competitor: string; slug: string }[];
  rows: StandardsCrosswalkRow[];
  researchStatus?: "unresearched";
  ratedCompetitorCellCount: number;
  totalCompetitorCellCount: number;
  /** Rows with at least one curated use case OR at least one computed match. */
  standardsWithUseCaseCount: number;
  /** Subset of ratedCompetitorCellCount carrying evidence_strength: "directional". */
  directionalRatingCount: number;
}
```

- [ ] **Step 5: Merge everything into `getStandardsCrosswalkForDomain`** — replace the function body currently at lines 854-916 with:

```ts
export function getStandardsCrosswalkForDomain(domain: string): StandardsCrosswalkForDomain | null {
  const accreditationSlug = DOMAIN_TO_ACCREDITATION_SLUG[domain];
  if (!accreditationSlug) return null;
  const doc = listAccreditation().find((a) => a.slug === accreditationSlug);
  if (!doc) return null;

  const code = DOMAIN_TO_COMPETITOR_CODE[domain] ?? domain;
  const competitors = listCompetitors().filter((c) =>
    (c.domains_served ?? []).some((s) => matchesDomain(s, code) || matchesDomain(s, domain))
  );

  const ratingsIndex = new Map(
    (getStandardsCompetitorRatings()?.ratings ?? [])
      .filter((r) => r.domain === domain)
      .map((r) => [`${r.element_id}|${r.competitor_slug}`, r])
  );

  // Curated use cases, grouped by element. Sparse — most elements have none.
  const useCasesByElement = new Map<string, StandardUseCase[]>();
  for (const u of getStandardsUseCases()?.use_cases ?? []) {
    if (u.domain !== domain) continue;
    const list = useCasesByElement.get(u.element_id) ?? [];
    list.push({
      useCase: u.use_case,
      status: u.status,
      audience: u.audience ?? [],
      detail: u.detail,
      relatedFlows: resolveRelatedFlows(u.related_flows),
      sources: resolveSourceIds(u.sources),
    });
    useCasesByElement.set(u.element_id, list);
  }

  // Computed fallback — one pass over flows/journeys for all elements at once.
  const elementIds = (doc.standards ?? []).map((s) => s.element_id);
  const computedIndex = buildComputedUseCaseIndex(elementIds, accreditorShortName(doc));

  let ratedCompetitorCellCount = 0;
  let directionalRatingCount = 0;
  let standardsWithUseCaseCount = 0;

  const rows: StandardsCrosswalkRow[] = (doc.standards ?? []).map((s) => {
    const personaSet = new Set<string>();
    const cellCompetitors = competitors.map((c) => {
      const rated = ratingsIndex.get(`${s.element_id}|${c.slug}`);
      if (rated) {
        ratedCompetitorCellCount += 1;
        if (rated.evidence_strength === "directional") directionalRatingCount += 1;
        for (const p of rated.persona_relevance ?? []) personaSet.add(p);
      }
      return {
        competitor: c.competitor,
        slug: c.slug,
        rating: rated?.rating ?? ("unresearched" as const),
        rationale: rated?.rationale,
        source: rated?.source,
        competitorFeatureRef: rated?.competitor_feature_ref,
        sources: resolveSourceIds(rated?.sources),
        evidenceStrength: rated?.evidence_strength,
        evidenceNote: rated?.evidence_note,
      };
    });

    const useCases = useCasesByElement.get(s.element_id) ?? [];
    const allComputed = computedIndex.get(s.element_id) ?? [];
    if (useCases.length || allComputed.length) standardsWithUseCaseCount += 1;

    return {
      element_id: s.element_id,
      element_title: s.element_title,
      evidence_programs_must_produce: s.evidence_programs_must_produce,
      required_software_behavior: s.required_software_behavior,
      prism_fit: s.prism_fit,
      prism_fit_rationale: s.prism_fit_rationale,
      exxat_compliance: s.exxat_compliance,
      exxat_compliance_rationale: s.exxat_compliance_rationale,
      gap_notes: s.gap_notes,
      personaRelevance: Array.from(personaSet),
      researchSources: resolveSourceIdStrings(s.research_sources),
      competitors: cellCompetitors,
      useCases,
      computedMatches: allComputed.slice(0, COMPUTED_USE_CASE_MATCH_CAP),
      computedMatchTotal: allComputed.length,
    };
  });

  return {
    domain,
    accreditor: doc.accreditor,
    standardsDocument: doc.standards_document,
    competitors: competitors.map((c) => ({ competitor: c.competitor, slug: c.slug })),
    rows,
    researchStatus: doc.research_status,
    ratedCompetitorCellCount,
    totalCompetitorCellCount: rows.length * competitors.length,
    standardsWithUseCaseCount,
    directionalRatingCount,
  };
}
```

- [ ] **Step 6: Verify it type-checks and every route still prerenders** — Run: `cd apps/ecosystem && npx next build`. Expected: build completes with no TypeScript errors and no prerender failures. `standards-use-cases.yaml` does not exist yet; `readYamlFile` returns `null` for a missing file, so `getStandardsUseCases()?.use_cases ?? []` is the empty path and must not throw.
- [ ] **Step 7: Verify the computed join produces the numbers the spec predicts** — Run from the repo root:
  ```bash
  cd apps/ecosystem && npx tsx -e "
  import { getStandardsCrosswalkForDomain } from './lib/content';
  const x = getStandardsCrosswalkForDomain('Pharmacy')!;
  console.log('rows', x.rows.length);
  console.log('withUseCase', x.standardsWithUseCaseCount);
  console.log('directional', x.directionalRatingCount);
  const r = x.rows.find(r => r.element_id === 'Standard 3, Key Element 3.3.a')!;
  console.log('3.3.a total', r.computedMatchTotal, 'shown', r.computedMatches.length);
  const e = x.rows.find(r => r.element_id === 'Standard 3, Key Element 3.5.c')!;
  console.log('3.5.c total', e.computedMatchTotal);
  " 2>/dev/null || echo "tsx unavailable — confirm the same numbers by expanding the rows in the browser in Task 4 Step 6 instead"
  ```
  Expected (these are verified against the current content tree, not estimates):
  ```
  rows 20
  withUseCase 12
  directional 0
  3.3.a total 13 shown 4
  3.5.c total 0
  ```
  (`3.3.a total 13` = 9 flow matches + 4 journey-stage matches.) If `tsx` is not installed, do not install it — fall back to the browser check noted in the command.
- [ ] **Step 8: Commit**
  ```bash
  git add apps/ecosystem/lib/content.ts
  git commit -m "Add StandardUseCase type, computed standard-to-flow join, and directional rating fields"
  ```

---

### Task 4: Empty lens file + `DirectionalBadge`/`UseCaseStatusBadge` + PROPOSED USE CASES UI

Shippable against zero curated content — this task proves the empty state and the 12/20 computed breadth on their own.

**Files:**
- Create: `content/lenses/standards-use-cases.yaml` (header + empty list)
- Modify: `apps/ecosystem/components/fit-badge.tsx` (append after line 192, the end of the file)
- Modify: `apps/ecosystem/components/source-list.tsx:22-29` (`KIND_META`)
- Modify: `apps/ecosystem/components/accreditation-standards-table.tsx:1-16` (imports) and `:205-352` (`StandardDetail` — insert a new section immediately before the existing `<Divider label="COMPETITOR RATINGS" />` on line 269, and add the directional badge/note inside the competitor card at lines 278-304)
- Test: `cd apps/ecosystem && npm run check:density && npx next build`, then the manual browser pass in Step 8

**Interfaces:**
- Consumes: `StandardsCrosswalkRow.useCases`, `.computedMatches`, `.computedMatchTotal`; `StandardsCrosswalkCompetitorCell.evidenceStrength`, `.evidenceNote` (all from Task 3). Also the already-existing `FieldBlock`, `Badge`, `SourceList`, `Divider`, `Link`, `personaLabel`.
- Produces: `DirectionalBadge({ evidenceStrength })` and `UseCaseStatusBadge({ status })` exported from `components/fit-badge.tsx`; the `PROPOSED USE CASES` section inside `StandardDetail`. Task 9 consumes `directionalRatingCount`, not these.

- [ ] **Step 1: Create `content/lenses/standards-use-cases.yaml`** with exactly this content — a real file with a real header and an empty list, so the schema and the empty state are both provable before any content lands:

```yaml
# Level 2 reframing — cites content/accreditation/*.yaml (by element_id) and
# content/sources/registry.yaml (by source_id) downward; never asserts a claim that
# isn't grounded in a cited Level-0/Level-1 source. Structural sibling of
# standards-competitor-ratings.yaml: same sparse, keyed-by-(domain, element_id)
# shape, same "absence is the unresearched state" convention.
#
# WHY THIS FILE EXISTS AND NOT A FIELD ON accreditation/*.yaml: flows already cite
# acpe.yaml as ground truth. Having acpe.yaml point back at flows would create a
# citation cycle — exactly what content/ARCHITECTURE.md's citation rule forbids, and
# Level 1 is not where the repo's one tolerated sideways-pointer exception
# (`related_flows`, documented for Level 2 -> Level 3) applies. See
# docs/superpowers/specs/2026-09-10-pharmacy-standards-use-cases-design.md.
#
# Schema, per entry:
#   domain           — canonical domain label ("Pharmacy"), matching the key
#                      getStandardsCrosswalkForDomain() looks up by
#   element_id       — the FULL element_id string from that domain's accreditation file
#   use_case         — one scannable line: what a program would actually do. <= 220 chars
#   status           — proposed | in-flight | documented | no-fit-yet
#                      `no-fit-yet` is a first-class value, not an absence: never leave a
#                      real gap blank, say it and say why in `detail`
#   audience         — optional content/personas/*.yaml filenames (no extension). Encodes
#                      who actually buys this, not just who operates it
#   detail           — the sourced paragraph behind the headline. <= 600 chars; decompose
#                      into two entries rather than write past it
#   related_flows    — optional [{flow, step?, element?}] navigational pointer into
#                      content/flows/ (Level 3). Wayfinding, not evidence
#   sources          — [{source_id}] into content/sources/registry.yaml. Required
#
# Gated by scripts/check_content_density.py's check_standards_use_cases_integrity().
last_updated: "2026-09-10"
use_cases: []
```

- [ ] **Step 2: Append the two new badges to `apps/ecosystem/components/fit-badge.tsx`** (after the existing `DivergenceBadge`, which closes the file at line 192). Both reuse the existing `BadgeVariant` palette — no new color, per the spec's explicit decision:

```tsx

// A directional rating is a first-pass read of a vendor's public material, not the
// element-by-element verification the unflagged entries carry. Neutral on purpose:
// the spec explicitly rules out a new color in the shared palette and a numeric
// "confidence score" — both would invent vocabulary this repo doesn't have. Renders
// nothing when the rating isn't directional, so callers need no emptiness guard.
export function DirectionalBadge({ evidenceStrength }: { evidenceStrength?: string }) {
  if (evidenceStrength?.toLowerCase().trim() !== "directional") return null;
  return <Badge variant="neutral" label="Directional" />;
}

// Status of a proposed use case against one accreditation element. Same five-state
// palette as FitBadge/GapSeverityBadge so the color language stays consistent
// app-wide, and the same "absence is a real, named state" rule: `no-fit-yet` is an
// explicit answer, not a blank.
const USE_CASE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  documented: "success",
  "in-flight": "warning",
  proposed: "info",
  "no-fit-yet": "error",
};

const USE_CASE_STATUS_LABEL: Record<string, string> = {
  documented: "Documented",
  "in-flight": "In flight",
  proposed: "Proposed",
  "no-fit-yet": "No fit yet",
};

export function UseCaseStatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="neutral" label="Unrated" />;
  const key = status.toLowerCase().trim();
  return (
    <Badge variant={USE_CASE_STATUS_VARIANT[key] ?? "neutral"} label={USE_CASE_STATUS_LABEL[key] ?? status} />
  );
}
```

- [ ] **Step 3: Teach `SourceList` about the interview kind** — in `apps/ecosystem/components/source-list.tsx`, change the lucide import on line 7 and add one row to `KIND_META` (lines 22-29) so the Task 1 source renders as "Interview" rather than the generic "Source" fallback. Replace line 7:

```tsx
import { BarChart3, FileText, Globe, Link2, MessagesSquare, Newspaper, Video } from "lucide-react";
```

  and add this row inside `KIND_META`, immediately after the `webinar` row:

```tsx
  // A first-party internal interview is the only source kind in this registry that
  // isn't publicly checkable — neutral variant (no new color), distinct icon/label so
  // a reader can tell it apart from a vendor page at a glance.
  interview: { label: "Interview", variant: "neutral", icon: MessagesSquare },
```

- [ ] **Step 4: Add the imports `StandardDetail` needs** — in `apps/ecosystem/components/accreditation-standards-table.tsx`, replace lines 12-16 with:

```tsx
import {
  DirectionalBadge,
  ExxatComplianceBadge,
  FitBadge,
  StandardsRatingBadge,
  UseCaseStatusBadge,
} from "@/components/fit-badge";
import { FieldBlock } from "@/components/field-block";
import { CompetitorLogo } from "@/components/competitor-logo";
import { SourceList } from "@/components/source-list";
import { RelatedFlowsPreview } from "@/components/related-flows-preview";
import type { StandardsCrosswalkForDomain, StandardsCrosswalkRow } from "@/lib/content";
```

- [ ] **Step 5: Insert the PROPOSED USE CASES section into `StandardDetail`** — immediately before the existing `<Divider label="COMPETITOR RATINGS" />` (line 269), insert this block. It is built entirely from components already used in this file plus `RelatedFlowsPreview`; the only new pieces are the two badges from Step 2:

```tsx
      {/* Proposed use cases sit ABOVE competitor ratings: "what would a program do
          with this standard" is the question a reader has before "and how do the
          incumbents score on it." Curated entries render first; the computed
          flow/journey join is a distinctly-labeled fallback, never presented as
          curated research. */}
      <Divider label="PROPOSED USE CASES" />
      {row.useCases.length ? (
        <Stack gap={3}>
          {row.useCases.map((u, i) => (
            <Stack key={`${u.useCase}-${i}`} gap={1.5}>
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                <UseCaseStatusBadge status={u.status} />
                <Text type="body" weight="semibold" textWrap="wrap">
                  {u.useCase}
                </Text>
              </Stack>
              <FieldBlock text={u.detail} type="supporting" maxLines={3} />
              {u.audience.length ? (
                <Stack direction="horizontal" gap={1} wrap="wrap">
                  {u.audience.map((a) => (
                    <Badge key={a} variant="neutral" label={personaLabel(a)} />
                  ))}
                </Stack>
              ) : null}
              <RelatedFlowsPreview items={u.relatedFlows} />
              <SourceList sources={u.sources} />
            </Stack>
          ))}
        </Stack>
      ) : null}

      {row.computedMatches.length ? (
        <Stack gap={1.5}>
          <Text type="label" color="secondary" size="xsm">
            Also cited by existing research (computed — not a curated use case)
          </Text>
          <Stack gap={1}>
            {row.computedMatches.map((m) => (
              <Stack
                key={`${m.kind}-${m.href}-${m.label}`}
                direction="horizontal"
                gap={2}
                vAlign="center"
                wrap="wrap"
              >
                <Badge variant="neutral" label={m.kind === "flow" ? "Flow" : "Journey"} />
                <Link href={m.href} color="accent" hasUnderline>
                  {m.label}
                </Link>
                {m.context ? (
                  <Text type="supporting" size="xsm" color="secondary" maxLines={1}>
                    {m.context}
                  </Text>
                ) : null}
              </Stack>
            ))}
          </Stack>
          {row.computedMatchTotal > row.computedMatches.length ? (
            <Text type="supporting" size="xsm" color="secondary">
              {row.computedMatchTotal - row.computedMatches.length} more flow and journey
              references name this element — open the linked flows above to follow the chain.
            </Text>
          ) : null}
        </Stack>
      ) : null}

      {!row.useCases.length && !row.computedMatches.length ? (
        <Text type="supporting" size="sm" color="secondary" style={{ fontStyle: "italic" }}>
          No use case or journey is mapped to this standard yet — unmapped, not unsupported.
          Nothing here says a program can't do this in Prism; it says nobody has written
          down what doing it looks like.
        </Text>
      ) : null}
```

- [ ] **Step 6: Show the directional caveat inside the competitor card** — in the rated branch of the competitor card (lines 289-295 today, the `{isRated ? (<>...</>) : (...)}` block), replace the rated fragment with:

```tsx
                {isRated ? (
                  <>
                    {c.rationale ? (
                      <FieldBlock text={c.rationale} type="supporting" maxLines={4} />
                    ) : null}
                    {/* Directional flag lives here, in the expanded card — NOT in the
                        collapsed table cell. A second pill per cell across 5 competitor
                        columns breaks the row's scan strip. The note reuses the same
                        italic supporting-text treatment as "not yet researched" below. */}
                    {c.evidenceStrength === "directional" ? (
                      <Stack gap={1}>
                        <DirectionalBadge evidenceStrength={c.evidenceStrength} />
                        {c.evidenceNote ? (
                          <Text
                            type="supporting"
                            size="xsm"
                            color="secondary"
                            maxLines={3}
                            style={{ fontStyle: "italic" }}
                          >
                            {c.evidenceNote}
                          </Text>
                        ) : null}
                      </Stack>
                    ) : null}
                    <SourceList sources={c.sources} />
                  </>
                ) : (
```

  Leave the unrated `else` branch and everything after it exactly as it is.
- [ ] **Step 7: Run both mechanical checks** — Run: `cd apps/ecosystem && npm run check:density && npx next build`. Expected: `check-render-density: PASS` followed by a clean build. If `check-render-density` flags the `c.evidenceNote` `<Text>`, it already has `maxLines={3}` — re-read the failing line number before adding any `DENSITY-OK:` comment.
- [ ] **Step 8: Manual browser pass (required — this repo has shipped a build-clean but visually broken component before)** — Run `cd apps/ecosystem && npm run dev`, then in a browser:
  - Open `/domains/pharmacy/standards`. Expand `Standard 3, Key Element 3.3.a` ("Show detail"). Confirm a `PROPOSED USE CASES` divider appears **above** `COMPETITOR RATINGS`, that exactly **4** computed references are listed, and that the trailing line reads "9 more flow and journey references name this element."
  - Expand `Standard 3, Key Element 3.5.c` ("Student remuneration/employment"). Confirm the italic "unmapped, not unsupported" empty state renders and that no computed references appear.
  - Confirm every computed reference shows a full descriptive name (e.g. "Preceptor Recruitment, Credential Verification & Licensure Gating"), never a filename or slug.
  - Open `/domains/do/standards` and expand any row. Confirm the section degrades cleanly — computed COCA matches or the empty state, never a crash and never ACPE content leaking in.
- [ ] **Step 9: Commit**
  ```bash
  git add content/lenses/standards-use-cases.yaml apps/ecosystem/components/fit-badge.tsx apps/ecosystem/components/source-list.tsx apps/ecosystem/components/accreditation-standards-table.tsx
  git commit -m "Render proposed use cases and directional-evidence caveat in the standards detail panel"
  ```

---

### Task 5: Curated use cases — the pilot and the two live pharmacy schools

**Files:**
- Modify: `content/lenses/standards-use-cases.yaml` (replace `use_cases: []` on the last line with the six entries below)
- Test: `python3 scripts/check_content_density.py` + the browser check in Step 4

**Interfaces:**
- Consumes: source id `interview-vishaka-pharmacy-understanding-2026-09-04` (Task 1); the ceilings and `check_standards_use_cases_integrity()` (Task 2); the `StandardUseCase` render path (Tasks 3-4).
- Produces: curated entries on elements `Standard 2, Key Element 2.2.d`, `Standard 7, Key Element 7.3.d`, `Standard 3, Key Elements 3.2.b & 3.2.d`, `Standard 3, Key Element 3.1.a`.

- [ ] **Step 1: Replace the final line `use_cases: []` with these six entries.** Every `element_id` below is verbatim from `content/accreditation/acpe.yaml`; every `related_flows.flow` is a file that exists in `content/flows/`; every `audience` slug is a real `content/personas/*.yaml` filename:

```yaml
use_cases:
  # --- Pharmacy / ACPE — the pilot and the two live schools ---
  - domain: "Pharmacy"
    element_id: "Standard 2, Key Element 2.2.d"
    use_case: "Map an ACPE curriculum in Prism, import ExamSoft didactic scores, and correlate them to NAPLEX outcomes"
    status: "in-flight"
    audience: ["role-dean", "role-compliance-accreditation-liaison"]
    detail: >
      A non-customer PharmD school running CORE today is piloting ACPE curriculum
      mapping in Prism, with ExamSoft scores imported for key pharmacotherapy courses
      and correlated against NAPLEX outcomes. Data collection is at a preliminary
      stage; the target is an AACP abstract, deadline November 2026.
    related_flows:
      - flow: "accreditation-self-study--04-curriculum-competency-coverage-mapping-to-the.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 2, Key Element 2.2.d"
    use_case: "AI-flagged curriculum coverage gap with an hours-reallocation recommendation, not just a report"
    status: "proposed"
    audience: ["role-dean", "role-compliance-accreditation-liaison"]
    detail: >
      Roadmap concept, not shipped. The stated vision is insight plus remedy: name the
      uncovered competency, propose the lecture that fills it, and name the
      over-covered hours to cut to make room. The worked example given was trimming
      geriatric-drug coverage to insert an IPEC competency that is nowhere in the map.
    related_flows:
      - flow: "admin-onboarding--06-courses-rotations-curriculum-mapping.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 7, Key Element 7.3.d"
    use_case: "Bulk-import ExamSoft reports so didactic and clinical performance sit in one longitudinal view"
    status: "proposed"
    audience: ["role-dean", "role-program-admin"]
    detail: >
      The September 12 2026 release lets programs already using Prism for clinical
      management bulk-import ExamSoft data at no extra charge. It is the first time
      didactic and clinical records sit on one platform, and it is the direct answer
      to the CORE plus ExamSoft plus Influx stack this market defaults to.
    related_flows:
      - flow: "accreditation-self-study--05-external-outcome-data-ingestion-board-exams.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 7, Key Element 7.3.d"
    use_case: "Stand up competency tracking for a PharmD program during onboarding"
    status: "in-flight"
    audience: ["role-compliance-accreditation-liaison", "role-program-admin"]
    detail: >
      University of Maryland is implementing Prism now, with competency tracking named
      as the capability they want help with, and strategic setup calls in progress. The
      specific workflow they land on is not documented anywhere yet — do not describe
      one until the implementation has actually been interviewed.
    related_flows:
      - flow: "competency-verification--06-roll-up-to-a-per-student.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 3, Key Elements 3.2.b & 3.2.d"
    use_case: "Run a PharmD program's full APPE placement cycle in Prism"
    status: "documented"
    audience: ["role-clinical-coordinator", "discipline-pharmacy"]
    detail: >
      OHSU School of Pharmacy has used Prism for clinical placement management for
      roughly a year — the one pharmacy reference where the experiential workflow is
      live rather than proposed. They have not adopted the other parts of the product,
      so the evidence here is placement-side only and should not be stretched further.
    related_flows:
      - flow: "rotation-lifecycle--04-placement-allocation-scheduling-capacity-balancing.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.1.a"
    use_case: "Publish a pharmacy placement-management reference story as a webinar and white paper"
    status: "proposed"
    audience: ["role-clinical-coordinator", "role-dean"]
    detail: >
      Proposed marketing motion, not a shipped asset: interview OHSU on how they manage
      IPPE and APPE placements in Prism, then turn it into a testimonial, a white paper
      and a webinar. Named as the strongest pharmacy clinical reference available today.
    related_flows:
      - flow: "preceptor-site-onboarding--06-student-assignment-ratio-capacity-and-eligibility.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"
```

- [ ] **Step 2: Verify every field is inside its ceiling and every reference resolves** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only`. Expected: no line naming `standards-use-cases.yaml`, and FAIL still exactly `31`. If a `use_case` or `detail` line appears, shorten it — do not allowlist a brand-new field on its first day.
- [ ] **Step 3: Verify the integrity check passes on real content** — Run from the repo root:
  ```bash
  python3 -c "
import importlib.util
spec = importlib.util.spec_from_file_location('ccd', 'scripts/check_content_density.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
p = m.check_standards_use_cases_integrity()
print('problems:', len(p)); [print(' ', x) for x in p]
"
  ```
  Expected: `problems: 0`.
- [ ] **Step 4: Manual browser check** — with `npm run dev` running, open `/domains/pharmacy/standards`, expand `Standard 2, Key Element 2.2.d`. Confirm two curated entries render above the computed list, with an amber "In flight" badge on the first and a blue "Proposed" on the second, an "Interview" source pill under each, and a `RelatedFlowsPreview` chip showing "Curriculum & Competency Coverage Mapping". **Hover that chip and confirm the `HoverCard` is not clipped by the surrounding `<td>`** — this is the spec's named known risk; `RelatedFlowsPreview`'s `HoverCard` has never been rendered inside this hand-rolled detail-panel plugin before. If it clips, the fix is a `style={{ overflow: "visible" }}` on the panel `<td>` in `accreditation-standards-table.tsx` line 78, not removing the chip.
- [ ] **Step 5: Commit**
  ```bash
  git add content/lenses/standards-use-cases.yaml
  git commit -m "Add pilot and live-school pharmacy use cases from the Vishaka interview"
  ```

---

### Task 6: Curated use cases — migration, GTM, roadmap, and the honest gap

**Files:**
- Modify: `content/lenses/standards-use-cases.yaml` (append nine entries after the six from Task 5)
- Test: `python3 scripts/check_content_density.py` + the browser check in Step 4

**Interfaces:**
- Consumes: identical to Task 5.
- Produces: curated entries on `Standard 3, Key Element 3.5.b`, `Standard 7, Key Element 7.5.b`, `Standard 3, Key Element 3.1.b`, `Standard 7, Key Element 7.5.a`, `Standard 7, Key Element 7.3.c`, `Standard 3, Key Element 3.5.a`, `Standard 3, Key Element 3.2.a`, `Standard 7, Key Element 7.3.d`, `Standard 3, Key Element 3.1.a` — bringing `standardsWithUseCaseCount` from 12 to 14 of 20 (3.5.a and 3.2.a are two of the eight elements the computed join cannot reach).

- [ ] **Step 1: Append these nine entries** to the `use_cases:` list, after the OHSU webinar entry. Note deliberately: **`Standard 3, Key Element 3.5.c` (student remuneration) gets no entry at all.** Leaving it genuinely unmapped is the honest answer; forcing a match there would be exactly the fabrication this whole design exists to prevent:

```yaml

  # --- Migration, GTM motions, roadmap, and one honest gap ---
  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.5.b"
    use_case: "Inventory sites and affiliation agreements in the incumbent before cutting over to Prism"
    status: "proposed"
    audience: ["role-clinical-coordinator", "role-compliance-accreditation-liaison"]
    detail: >
      Proposed. A program leaving CORE mid-accreditation-cycle has to move every active
      site record and affiliation agreement without losing its expiry dates. Prism's
      contracts-with-expiry-alerts feature is the destination; the migration path itself
      is unexercised — no pharmacy program has done this move on record.
    related_flows:
      - flow: "preceptor-site-onboarding--02-affiliation-agreement-execution-contract-lifecycle-management.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 7, Key Element 7.5.b"
    use_case: "Survive the first ACPE self-study cycle after switching platforms mid-cycle"
    status: "proposed"
    audience: ["role-compliance-accreditation-liaison", "role-dean"]
    detail: >
      Proposed. The migration story the GTM team asked for is a program that moved from
      CORE to Exxat and can say why. Its hardest stage is the first self-study after the
      switch, where evidence has to span both platforms. No such customer exists yet —
      this entry names the target, it does not record an outcome.
    related_flows:
      - flow: "accreditation-self-study--08-self-study-assembly-submission-site-visit.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.1.b"
    use_case: "Carry historical IPPE hour records across a mid-cycle platform switch"
    status: "proposed"
    audience: ["role-clinical-coordinator", "role-program-admin"]
    detail: >
      Proposed. ACPE's 300-hour IPPE total, with its 75-hour community and 75-hour
      hospital minimums, is a per-student cumulative record — so a program switching
      mid-cohort must import prior-year hours rather than start counting from zero. No
      documented import path for an incumbent's hour logs exists in this repo.
    related_flows:
      - flow: "rotation-lifecycle--05-in-rotation-capture-hours-encounters-procedures.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 7, Key Element 7.5.a"
    use_case: "Run the AACP graduating-student, faculty and preceptor surveys inside Prism"
    status: "proposed"
    audience: ["role-compliance-accreditation-liaison", "role-dean"]
    detail: >
      Proposed. Programs are actively trying to shrink their technology stack, and Exxat
      Surveys plus the Forms and Evaluations engine already cover the instrument types
      7.5.a names. What has not been built is the specific AACP instrument set and its
      annual cadence — that is configuration work nobody has done yet.
    related_flows:
      - flow: "accreditation-self-study--07-closing-the-cqi-loop-finding-to.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 7, Key Element 7.3.c"
    use_case: "Push finalized rotation grades to Canvas so the LMS stays the official student record"
    status: "in-flight"
    audience: ["role-program-admin", "role-clinical-coordinator"]
    detail: >
      Canvas integration has shipped; Brightspace is next, then Blackboard. LMS
      integration was named the second biggest pharmacy buying driver — one dean said to
      come back once it existed. What it removes is re-keying grades from the clinical
      system into the channel the program actually communicates through.
    related_flows:
      - flow: "rotation-lifecycle--07-summative-evaluation-grading-turnaround-completion-verification.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.5.a"
    use_case: "Serve one university's pharmacy, PT, OT and PA placements from a single office and platform"
    status: "proposed"
    audience: ["role-dean", "role-clinical-coordinator"]
    detail: >
      Proposed. Pharmacy usually runs its own office of clinical education, but some
      universities centralize a clinical-coordinator role across programs, and larger
      institutions have a central technology-adoption office that makes the enterprise
      software decision. Where that office exists, pharmacy can carry the smaller programs.
    related_flows:
      - flow: "admin-onboarding--05-sites-locations-personnel-management.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.2.a"
    use_case: "Report each student's APPE exposure across the patient-population diversity categories"
    status: "no-fit-yet"
    audience: ["role-compliance-accreditation-liaison"]
    detail: >
      Stated as an honest gap, not a proposal. ACPE asks for aggregate exposure across
      age, gender, neurodivergent status, race and ethnicity, socioeconomic factors and
      disease states. No shipped or roadmap Prism pillar carries patient-population
      demographics at the rotation level, so there is nothing to propose here yet.
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 7, Key Element 7.3.d"
    use_case: "Replace ExamSoft with Exxat's own exam module once it soft-launches"
    status: "proposed"
    audience: ["role-dean", "role-program-admin"]
    detail: >
      Proposed, and the module is unshipped — a January soft launch was the date given.
      The competitive read matters as much as the date: Canvas and Brightspace have both
      added assessment building in the last two years, so this module lands against the
      LMS as well as against ExamSoft.
    related_flows:
      - flow: "competency-verification--02-build-and-deploy-the-assessment-instruments.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"

  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.1.a"
    use_case: "Replace an aging e-Value experiential setup at a pharmacy program"
    status: "proposed"
    audience: ["role-clinical-coordinator", "role-program-admin"]
    detail: >
      Proposed. CORE holds the large majority of pharmacy programs; e-Value still holds
      some but was described as archaic and not receiving significant enhancements. Booth
      leads at a prior AACP named e-Value and were shopping alternatives, with four
      programs flagged for immediate demos — whether those demos happened is unknown.
    related_flows:
      - flow: "admin-onboarding--02-program-details-settings-setup.yaml"
    sources:
      - source_id: "interview-vishaka-pharmacy-understanding-2026-09-04"
```

- [ ] **Step 2: Verify ceilings and integrity** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only`. Expected: no line naming `standards-use-cases.yaml`; FAIL still exactly `31`.
- [ ] **Step 3: Verify coverage went 12 → 14 and 3.5.c is still deliberately empty** — Run from the repo root:
  ```bash
  python3 -c "
import yaml
u = yaml.safe_load(open('content/lenses/standards-use-cases.yaml'))['use_cases']
a = yaml.safe_load(open('content/accreditation/acpe.yaml'))['standards']
ids = {x['element_id'] for x in u}
print('entries:', len(u), 'distinct elements:', len(ids))
print('3.5.c curated:', 'Standard 3, Key Element 3.5.c' in ids)
print('3.2.a status:', [x['status'] for x in u if x['element_id']=='Standard 3, Key Element 3.2.a'])
"
  ```
  Expected:
  ```
  entries: 15 distinct elements: 11
  3.5.c curated: False
  3.2.a status: ['no-fit-yet']
  ```
- [ ] **Step 4: Manual browser check** — expand `Standard 3, Key Element 3.2.a`. Confirm a red "No fit yet" badge with the honest-gap paragraph, and **no** computed references (this element has none). Then expand `Standard 3, Key Element 3.5.c` and confirm the italic "unmapped, not unsupported" state still renders — that element is deliberately untouched.
- [ ] **Step 5: Commit**
  ```bash
  git add content/lenses/standards-use-cases.yaml
  git commit -m "Add migration, GTM, roadmap and no-fit-yet pharmacy use cases"
  ```

---

### Task 7: Competitor research pass — deepen `pharmacademic.yaml` and `rxpreceptor.yaml`

Neither file can currently support element-level ratings: PharmAcademic has 2 sourced sentences, RxPreceptor has one named mention. Task 8 cannot start until this lands.

**Files:**
- Modify: `content/competitors/pharmacademic.yaml:14-42` (`feature_teardown`), `:44-60` (`strengths`/`weaknesses`), `:83` (`last_researched`), `:85-87` (`sources`)
- Modify: `content/competitors/rxpreceptor.yaml:14-27` (`feature_teardown`), `:29-39` (`strengths`/`weaknesses`), `:55` (`last_researched`), `:57-58` (`sources`)
- Modify: `content/sources/registry.yaml` (append one entry per newly-found source)
- Test: `python3 scripts/check_content_density.py`

**Interfaces:**
- Consumes: `content/sources/registry.yaml` id conventions from Task 1.
- Produces: new `feature_teardown[].pillar` values on both files. **These pillar strings are the exact values Task 8's `competitor_feature_ref` must match** — `check_standards_ratings_integrity()` fails a `competitor_feature_ref` that isn't one of the competitor's own `feature_teardown[].pillar` values. Use only names from `CANONICAL_PILLAR_ORDER` in `apps/ecosystem/lib/content.ts:648-655`: `Clinical & Experiential Education`, `Compliance Management`, `Curriculum Mapping`, `Surveys & Course Evaluations`, `Exam Management`, `Accreditation Management`.

- [ ] **Step 1: Run the searches.** Use `WebSearch` for each query below, then `WebFetch` every vendor-owned or accreditor-owned page in the results. Do not answer from memory (`CLAUDE.md`: "use WebSearch/WebFetch directly rather than answering from memory"):
  - `PharmAcademic McCreadie Group experiential education pharmacy school features`
  - `PharmAcademic curricular mapping ACPE standards report`
  - `McCreadie Group PharmAcademic preceptor evaluation scheduling rotations`
  - `RxPreceptor CORE Higher Education pharmacy APPE scheduling features`
  - `RxPreceptor compliance document tracking preceptor pharmacy`
  - `RxPreceptor pricing OR customers OR "powered by" pharmacy school`
  Fetch, at minimum: `https://mccreadiegroup.com/pharmacademic/` and any linked feature/module subpages; `https://www.ashp.org/professional-development/residency-information/residency-program-resources/pharmacademic`; the RxPreceptor vendor site and any CORE Higher Education page that names RxPreceptor.
- [ ] **Step 2: For each genuinely new, sourced capability, append a `feature_teardown` entry** in the existing shape of the file. Use exactly this structure (this is the shape both files already use, so a new entry slots in without a schema change):

```yaml
  - pillar: "<one of the six CANONICAL_PILLAR_ORDER names, verbatim>"
    competitor_capability: >
      <what the vendor's own page says the product does, in their terms, one or two
      sentences — not what you infer it must do>
    depth_vs_prism: "unknown"
    evidence: >
      <the specific sentence or claim on the page, plus what it does NOT establish.
      Keep the existing files' discipline: "rated 'unknown', not 'at-parity'" when the
      page names a capability without describing its depth.>
    source: "<the exact URL fetched>"
```

  Both files' existing header comments state the standard this must hold to — PharmAcademic: "Nothing here is inferred from CORE ELMS's shape or from what a pharmacy platform 'must' have." RxPreceptor: "nothing is filled in by analogy to CORE ELMS or PharmAcademic." Keep both comments and keep obeying them.
- [ ] **Step 3: Register every new URL in `content/sources/registry.yaml`**, appended to the end of the `sources:` list, following the existing `<type>-<slug>-<topic>-<year>` id convention:

```yaml
  - id: "product-page-pharmacademic-<topic>-2026"
    title: "<the page's own title>"
    url: "<the exact URL>"
    type: "product-page"
    publisher: "McCreadie Group"
    what_it_supports: "<one line: which specific claim this page backs, <= 300 chars>"
    accessed: "2026-09-10"
```

- [ ] **Step 4: Update `last_researched` in both competitor files** to `"2026-09-10"` and append every new URL to each file's own `sources:` list at the bottom.
- [ ] **Step 5: If a file stays thin, say so instead of padding it.** If the searches genuinely turn up nothing new for RxPreceptor, leave the file as it is, update only `last_researched`, and add this line to its header comment: `# Re-searched 2026-09-10 (vendor site, CORE Higher Education pages, review sites): no new public material found. Still one source. Absence of a weakness here is absence of research, not a finding.` A file that stays thin is a valid outcome; a file padded with inference is not.
- [ ] **Step 6: Verify the density and integrity checks still pass** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only | tail -3`. Expected: FAIL still exactly `31`. `competitors/*.yaml`'s `strengths[].claim` / `weaknesses[].claim` are ceilinged at 300/600 and `exxat_opportunity` at 1,200/2,000 — if any new prose FAILs, shorten it.
- [ ] **Step 7: Verify every new `feature_teardown[].pillar` is one of the six canonical names** — Run from the repo root:
  ```bash
  python3 -c "
import yaml
for f in ('pharmacademic', 'rxpreceptor'):
    d = yaml.safe_load(open(f'content/competitors/{f}.yaml'))
    print(f, [t['pillar'] for t in d.get('feature_teardown') or []])
"
  ```
  Expected: each printed pillar string is one Task 8 can paste verbatim into `competitor_feature_ref`.
- [ ] **Step 8: Commit**
  ```bash
  git add content/competitors/pharmacademic.yaml content/competitors/rxpreceptor.yaml content/sources/registry.yaml
  git commit -m "Deepen PharmAcademic and RxPreceptor teardowns with sourced public evidence"
  ```

---

### Task 8: Directional competitor ratings across the GTM-load-bearing element slice

**Files:**
- Modify: `content/lenses/standards-competitor-ratings.yaml:1-28` (header comment — document the two new fields), `:29` (`last_updated`), `:31-52` (append new pharmacy entries after the two existing `core-elms` entries, before the `# --- Dentistry / CODA ---` comment on line 54)
- Modify: `content/sources/registry.yaml` (append entries for any newly cited source)
- Test: `python3 scripts/check_content_density.py` + the browser check in Step 7

**Interfaces:**
- Consumes: `evidence_strength`/`evidence_note` gates (Task 2), `evidenceStrength`/`evidenceNote` render path (Tasks 3-4), the `feature_teardown[].pillar` values (Task 7).
- Produces: an increased `ratedCompetitorCellCount` and a non-zero `directionalRatingCount`, both consumed by Task 9.

- [ ] **Step 1: Document the new fields in the file header** — in `content/lenses/standards-competitor-ratings.yaml`, insert these lines into the schema comment block, immediately after the `persona_relevance` lines (currently lines 25-28) and before `last_updated:`:

```yaml
#   evidence_strength: "directional"                         — optional, added 2026-09-10. Present
#     ONLY on a first-pass rating read off public vendor material, not verified element by element.
#     The two original 2026-09-09 core-elms entries below deliberately omit it and stay unflagged.
#   evidence_note: "..."                                     — REQUIRED whenever evidence_strength is
#     "directional". States what the rating actually rests on ("first-pass read of the vendor's
#     public product page only"), not a second rationale. Enforced in
#     scripts/check_content_density.py's check_standards_ratings_integrity(): directional without a
#     note fails, and a note without the flag also fails — an unflagged note reads as verified.
```

  Then change `last_updated: "2026-09-09"` (line 29) to `last_updated: "2026-09-10"`.
- [ ] **Step 2: Rate this exact element slice, and only this slice.** These are the ten GTM-load-bearing ACPE elements (curriculum mapping, IPPE/APPE hours, preceptor lifecycle, cross-site QA, CQI, continuous compliance), verbatim from `content/accreditation/acpe.yaml`:
  1. `Standard 2, Key Element 2.2.d`
  2. `Standard 3, Key Element 3.1.b`
  3. `Standard 3, Key Elements 3.2.b & 3.2.d`
  4. `Standard 3, Key Element 3.3.a`
  5. `Standard 3, Key Element 3.3.c`
  6. `Standard 3, Key Element 3.3.e`
  7. `Standard 3, Key Element 3.5.b`
  8. `Standard 7, Key Element 7.3.c`
  9. `Standard 7, Key Element 7.5.a`
  10. `Standard 7, Key Element 7.5.b`

  Against these five competitors, which are exactly the five `getStandardsCrosswalkForDomain("Pharmacy")` returns (verified from `domains_served`): `core-elms`, `e-value`, `leo-davinci`, `pharmacademic`, `rxpreceptor`.

  That is 50 candidate cells. **Two are already rated** (`core-elms` × 3.5.b and `core-elms` × 7.5.b — leave both untouched and unflagged). **Target 26-33 new directional cells**, landing the whole file at roughly 28-35 of 100 pharmacy cells. **Do not aim for 50.** Where the evidence gathered in Task 7 and Step 3 below genuinely does not support a rating, add no entry — the "unresearched, not 'doesn't solve it'" copy already in the UI is the right answer.
- [ ] **Step 3: Gather evidence before writing any rating.** For each competitor, `WebSearch` then `WebFetch` its public product pages against the element's `required_software_behavior` (read it from `content/accreditation/acpe.yaml`, do not paraphrase from memory). Starting queries:
  - `CORE ELMS pharmacy curriculum mapping ACPE hours tracking preceptor`
  - `CORE CompMS ACPE standards gap analysis accreditation report`
  - `E*Value pharmacy experiential rotation hours preceptor evaluation MedHub`
  - `Leo DaVinci Education curriculum mapping competency EPA pharmacy`
  - plus the PharmAcademic and RxPreceptor pages already fetched in Task 7.
  Register every new URL in `content/sources/registry.yaml` first (same shape as Task 7 Step 3); a rating with no resolvable source fails the integrity check.
- [ ] **Step 4: Write each new rating in exactly this shape.** This is a complete, real entry, written against evidence already in this repo (`content/sources/registry.yaml`'s `product-page-core-elms-pharmacy-affiliation-agreements-2026`, which states CORE collects preceptor licenses with expiry alerts) — use it as the literal template for the rest, replacing only the element/competitor/rationale/note/source:

```yaml
  - domain: "Pharmacy"
    element_id: "Standard 3, Key Element 3.3.a"
    competitor_slug: "core-elms"
    rating: "partially-meeting"
    rationale: "CORE's pharmacy ELMS page states the product collects preceptor licenses and issues automated expiry alerts, which is the credentialing-record half of 3.3.a. Nothing public shows roster-level reporting on the licensed-pharmacist share of a given student's assigned preceptors, or evaluation forms bound to each precepting assignment."
    competitor_feature_ref: "Compliance Management"
    evidence_strength: "directional"
    evidence_note: "First-pass read of the vendor's public pharmacy product page only — no demo, no customer confirmation, not verified element by element."
    sources:
      - source_id: "product-page-core-elms-pharmacy-affiliation-agreements-2026"
    persona_relevance: ["role-clinical-coordinator", "role-compliance-accreditation-liaison"]
```

  Rules that apply to every entry, without exception:
  - `evidence_strength: "directional"` and a non-empty `evidence_note` on **every** new entry.
  - `rationale` ≤ 600 chars (hard ceiling); `evidence_note` ≤ 300 chars (hard ceiling).
  - `competitor_feature_ref` must be a verbatim `feature_teardown[].pillar` string from that competitor's own file, or omitted entirely.
  - `rating: "not-meeting"` is allowed only as an argument from *documented absence*, and the rationale must say so in those words — see the existing `medhub` × `Standard 11, Element 11.9` entry ("an argument from documented absence, not a stated limit") as the model.
  - Insert all new pharmacy entries between the existing `core-elms` × 7.5.b entry (ends line 52) and the `# --- Dentistry / CODA ---` comment (line 54).
- [ ] **Step 5: Verify every new entry resolves and carries its note** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only | grep -c "standards-competitor-ratings\|ratings\[" || true`. Expected: `0`. Any output means an element_id, competitor slug, source id, persona slug, feature ref, or directional note failed to resolve — fix the entry, do not allowlist it.
- [ ] **Step 6: Verify the counts landed in range** — Run from the repo root:
  ```bash
  python3 -c "
import yaml
r = yaml.safe_load(open('content/lenses/standards-competitor-ratings.yaml'))['ratings']
ph = [x for x in r if x['domain']=='Pharmacy']
d = [x for x in ph if x.get('evidence_strength')=='directional']
print('pharmacy rated cells:', len(ph), 'of 100')
print('directional:', len(d), '| unflagged (must be exactly 2):', len(ph)-len(d))
print('all directional have a note:', all((x.get('evidence_note') or '').strip() for x in d))
"
  ```
  Expected: `pharmacy rated cells:` between `28` and `35`; `unflagged (must be exactly 2): 2`; `all directional have a note: True`.
- [ ] **Step 7: Manual browser check** — expand `Standard 3, Key Element 3.5.b` on `/domains/pharmacy/standards`. Confirm the CORE ELMS card shows its rating **without** a "Directional" badge (it is a pre-existing verified entry), while a card rated in this task **does** show the badge plus its italic evidence note. Then check the collapsed table: confirm **no** "Directional" pill appears in any table cell — it belongs only in the expanded card, or the 5-column scan strip breaks.
- [ ] **Step 8: Commit**
  ```bash
  git add content/lenses/standards-competitor-ratings.yaml content/sources/registry.yaml
  git commit -m "Add first-pass directional pharmacy competitor ratings across the GTM element slice"
  ```

---

### Task 9: Aggregate caveat — `CoverageGapsCallout` directional count + standards page

**Files:**
- Modify: `apps/ecosystem/components/coverage-gaps-callout.tsx:18-45` (props and the `lines` construction)
- Modify: `apps/ecosystem/app/domains/[slug]/standards/page.tsx:44-69` (the `ProgressBar` stack, the `MetadataList`, and the `CoverageGapsCallout` call)
- Test: `cd apps/ecosystem && npm run check:density && npx next build` + the browser check in Step 5

**Interfaces:**
- Consumes: `standardsCrosswalk.directionalRatingCount` and `.standardsWithUseCaseCount` (Task 3), populated by Tasks 5, 6, 8.
- Produces: `CoverageGapsCallout`'s new optional `directionalCount` prop. `/crosswalk` and any other existing caller that omits it is unaffected.

- [ ] **Step 1: Add the `directionalCount` prop to `CoverageGapsCallout`** — replace the props block and the `lines` construction (lines 18-45) with:

```tsx
export function CoverageGapsCallout({
  ratedCount,
  totalCount,
  domain,
  trendCount,
  directionalCount,
  isCompact = false,
}: {
  ratedCount: number;
  totalCount: number;
  domain?: string;
  /** Omit when trends aren't relevant to this surface; 0 means "sourced nothing yet". */
  trendCount?: number;
  /** How many of `ratedCount` are first-pass directional reads rather than verified
   * element-by-element research. Optional — every existing caller omits it and is
   * unaffected. Layer 3 of the design spec's caveat mechanism: a reader must not be
   * able to see the rated fraction without also seeing how much of it is provisional. */
  directionalCount?: number;
  isCompact?: boolean;
}) {
  const lines: string[] = [];

  if (totalCount > 0) {
    lines.push(`${ratedCount} of ${totalCount} standard × competitor cells rated`);
  } else {
    lines.push("No competitor research covers this domain's standards yet");
  }

  if (directionalCount && directionalCount > 0) {
    lines.push(`${directionalCount} directional first-pass, pending a full standards-gap audit`);
  }

  if (trendCount === 0) {
    lines.push(domain ? `Trends not yet sourced for ${domain}` : "Trends not yet sourced");
  }

  const variant: PillVariant =
    totalCount > 0 && ratedCount === totalCount ? "success" : ratedCount > 0 ? "warning" : "error";
```

  Leave everything from `if (isCompact)` down unchanged.
- [ ] **Step 2: Add the third `ProgressBar`** — in `apps/ecosystem/app/domains/[slug]/standards/page.tsx`, inside the `<Stack gap={3}>` that currently holds two bars (lines 44-57), append a third after the "Competitor research coverage" bar:

```tsx
              <ProgressBar
                label="Standards with a proposed use case"
                hasValueLabel
                value={standardsCrosswalk.standardsWithUseCaseCount}
                max={standardsCrosswalk.rows.length}
              />
```

- [ ] **Step 3: Add the matching metadata item** — replace the `MetadataList` block (lines 58-63) with:

```tsx
            <MetadataList columns={3}>
              <MetadataListItem label="Standards tracked">{standardsCrosswalk.rows.length}</MetadataListItem>
              <MetadataListItem label="Competitor cells rated">
                {standardsCrosswalk.ratedCompetitorCellCount} / {standardsCrosswalk.totalCompetitorCellCount}
              </MetadataListItem>
              <MetadataListItem label="Standards with a use case">
                {standardsCrosswalk.standardsWithUseCaseCount} / {standardsCrosswalk.rows.length}
              </MetadataListItem>
            </MetadataList>
```

- [ ] **Step 4: Pass `directionalCount` and add the caveat paragraph** — replace the `CoverageGapsCallout` call (lines 64-69) with:

```tsx
            <CoverageGapsCallout
              ratedCount={standardsCrosswalk.ratedCompetitorCellCount}
              totalCount={standardsCrosswalk.totalCompetitorCellCount}
              domain={entry.domain}
              trendCount={trendCount}
              directionalCount={standardsCrosswalk.directionalRatingCount}
            />
            {standardsCrosswalk.directionalRatingCount > 0 ? (
              <Text type="supporting" size="sm" color="secondary">
                Ratings marked <strong>Directional</strong> are a first-pass read of public vendor
                material, not element-by-element verification. Exxat&apos;s pharmacy domain expert
                stated on 4 September 2026 that a real pharmacy standards-gap study has never been
                run, and that the working &ldquo;25% gap&rdquo; figure is &ldquo;research that
                remains to be done.&rdquo; These ratings are the starting point for that audit, not
                its result.
              </Text>
            ) : null}
```

- [ ] **Step 5: Run both mechanical checks** — Run: `cd apps/ecosystem && npm run check:density && npx next build`. Expected: `check-render-density: PASS` then a clean build. The new `<Text>` renders no property whose name matches the script's long-form pattern, so no `maxLines` is required.
- [ ] **Step 6: Manual browser check** — open `/domains/pharmacy/standards`. Confirm three progress bars, a three-column metadata row, a "Research coverage" callout whose second line reads like "26 directional first-pass, pending a full standards-gap audit", and the caveat paragraph directly under it. Then open `/domains/do/standards` and confirm the callout shows only the rated line (DO has no directional ratings, so `directionalCount` is 0 and the line is correctly absent) and the caveat paragraph does not render.
- [ ] **Step 7: Commit**
  ```bash
  git add apps/ecosystem/components/coverage-gaps-callout.tsx "apps/ecosystem/app/domains/[slug]/standards/page.tsx"
  git commit -m "Surface directional-rating count and use-case coverage on the standards page"
  ```

---

### Task 10: `pharmacy-core-to-exxat-migration` journey

**Files:**
- Create: `content/journeys/pharmacy-core-to-exxat-migration.yaml`
- Test: `python3 scripts/check_content_density.py` + `cd apps/ecosystem && npx next build` + the browser check in Step 4

**Interfaces:**
- Consumes: nothing from earlier tasks at author time.
- Produces: a journey whose `stages[].accreditation_link` fields contain full ACPE `element_id` strings **and** the token `ACPE`, so `buildComputedUseCaseIndex` (Task 3) picks them up automatically. After this task, `Standard 3, Key Element 3.5.b` gains a computed journey match and its `computedMatchTotal` rises by one.

- [ ] **Step 1: Create `content/journeys/pharmacy-core-to-exxat-migration.yaml`** with exactly this content. Note the deliberate discipline used throughout: every `accreditation_link` names full ACPE element_id strings and the accreditor's short name; `key_findings[].detail` is held under 260 chars (soft ceiling) because this is the exact field that overran on `rotation-lifecycle.yaml`:

```yaml
# Journey: Pharmacy Platform Migration — CORE ELMS to Exxat Prism
# Level 4 narrative. Cites ../flows/*.yaml (Level 3), ../accreditation/acpe.yaml and
# ../competitors/{core-elms,e-value}.yaml (Level 1), and
# ../interviews/2026-09-04-vishaka-ruchi-pharmacy-understanding.md (Level 0).
#
# SCOPE HONESTY, read this before extending the file: no pharmacy program has actually
# made this move on record. This journey is the shape of a migration derived from what
# ACPE requires and what the two platforms are documented to hold — it is NOT a recorded
# customer outcome. Vishaka named the CORE-to-Exxat migration story as a use case the GTM
# team WANTS, not one that exists. Every stage below is written in that register.
journey_name: "Pharmacy Platform Migration — CORE ELMS to Exxat Prism"
domain_scope: ["Pharmacy"]
persona: >
  Centers on the Director of Experiential (or Clinical) Education, who owns the site,
  preceptor and hour records that have to survive the move, working alongside the
  Assistant/Associate Dean for Assessment & Accreditation, who owns the ACPE evidence
  chain that must stay unbroken across the cutover. In a pharmacy program these are
  usually two people in one independent school with its own budget — not a shared
  services function — which is why a platform switch here is a program-level decision
  and not an institutional one. See ../personas/role-clinical-coordinator.yaml and
  ../personas/role-compliance-accreditation-liaison.yaml.

stages:
  - stage: "1. Decision trigger — why a pharmacy program leaves its incumbent"
    current_state_in_prism: >
      Nothing in Prism participates in this stage: the program is still fully on its
      incumbent and Prism is one of several options being evaluated. What Prism brings
      to the evaluation is documented in ../prism/capability-map.yaml — a shipped
      Clinical & Experiential Education placement engine, shipped Compliance Management
      including contracts with expiry alerts, shipped Curriculum Mapping with pre-loaded
      and custom accreditor standards, and shipped Surveys & Course Evaluations. Two
      pillars that a pharmacy evaluator will ask about are not shipped: Exam Management
      (roadmap Q2 2027) and Accreditation Management (roadmap Q3 2027). The
      2026-09-04 interview adds a shipped capability the capability map does not yet
      carry: an ExamSoft bulk import, released 12 September 2026, free to programs
      already using Prism for clinical management.
    pain_or_gap: >
      The trigger named in the interview is not feature dissatisfaction — it is stack
      cost and stack sprawl. Pharmacy programs commonly run CORE for clinical data,
      ExamSoft for didactic data, and Influx to join the two into one longitudinal view,
      paying three vendors and training staff on three systems to answer one question
      about student performance. A second, weaker trigger is platform decay: e-Value was
      described as archaic and not receiving significant enhancements, with programs on
      it actively shopping alternatives. Neither trigger is quantified anywhere. Nobody
      has measured how many pharmacy programs would move, what the switching cost is, or
      how long an evaluation takes — which is the same unmeasured-market problem the
      interview flags for the whole pharmacy gap analysis.
    accreditation_link: >
      The decision is bounded by where the program sits in its ACPE cycle. ACPE Standard
      7, Key Element 7.5.b requires documented processes for reviewing and ensuring the
      program meets all accreditation standards on an ongoing basis, including interim
      reporting ACPE requests during the term — so a switch does not pause the
      obligation. ACPE Standard 3, Key Element 3.5.b requires a fully executed, current
      affiliation agreement on file for every practice facility in use, meaning a
      migration that loses agreement expiry dates creates a live compliance exposure,
      not just a data-quality problem.
    competitor_comparison: >
      CORE ELMS holds the large majority of US pharmacy programs — the incumbent in
      nearly every deal. Its documented retention anchor is the accumulated record:
      contracts, affiliation agreements and preceptor licenses stored centrally with
      automated expiry alerts (see ../competitors/core-elms.yaml). That is precisely
      what makes the switch hard, and precisely what Stage 2 has to move. PharmAcademic
      is not the incumbent to displace here: its ASHP mandate binds residency programs,
      a different program type and often a different buyer inside the same institution
      (see ../competitors/pharmacademic.yaml).
    key_findings:
      - subject: "Pharmacy"
        headline: "The trigger is stack cost, not a missing feature"
        severity: "gap"
        detail: >
          Programs pay CORE, ExamSoft and Influx to answer one question about student
          performance. The wedge is collapsing three vendors into one, and the
          September 2026 ExamSoft bulk import is what makes that pitch possible at all.

  - stage: "2. Data inventory — what exists in the incumbent and what has to survive"
    current_state_in_prism: >
      Prism's destination objects are documented and shipped. Site, location and
      personnel records have a defined setup path
      (../flows/admin-onboarding--05-sites-locations-personnel-management.yaml).
      Affiliation agreements land in Compliance Management's Contracts feature with
      expiry alerts, traced element by element in
      ../flows/preceptor-site-onboarding--02-affiliation-agreement-execution-contract-lifecycle-management.yaml.
      Preceptor credential records and their licensure gating are traced in
      ../flows/preceptor-site-onboarding--03-preceptor-recruitment-credential-verification-licensure-gating.yaml.
      Student hour capture is traced in
      ../flows/rotation-lifecycle--05-in-rotation-capture-hours-encounters-procedures.yaml.
    pain_or_gap: >
      What is documented is where the data goes, not how it gets there. No flow, help
      article or transcript in this repo describes a bulk import of an incumbent's site
      records, executed affiliation agreements with their original expiry dates,
      preceptor credential history, or per-student cumulative hour logs. That is an
      absence of documentation, not a confirmed absence of capability — but it means a
      migration plan cannot currently be quoted with any confidence. The hour logs are
      the sharpest instance: a program switching mid-cohort cannot restart the count.
    accreditation_link: >
      Three ACPE elements set the floor for what must survive. ACPE Standard 3, Key
      Element 3.1.b requires auditable, student-level hour logs proving at least 300
      total IPPE clock hours with 75-hour community and 75-hour hospital minimums, so
      partial-cohort history has to move. ACPE Standard 3, Key Elements 3.2.b & 3.2.d
      require transcript-level records of 1,440 APPE hours across four required
      settings, per student. ACPE Standard 3, Key Element 3.5.b requires a current
      executed affiliation agreement per facility — its expiry date is the field whose
      loss is most expensive.
    competitor_comparison: >
      The incumbent's own strength defines the inventory. CORE's pharmacy page documents
      centralized contract and affiliation-agreement storage with automated expiration
      alerting, plus preceptor license collection and expiry alerts (see
      ../competitors/core-elms.yaml). Anything CORE alerts on is a field that must
      arrive in Prism with its date intact. Nothing public describes CORE's export
      formats, so the shape of the extract is unknown from this side.
    key_findings:
      - subject: "Pharmacy"
        headline: "Expiry dates are the field a migration is most likely to lose"
        severity: "gap"
        detail: >
          ACPE 3.5.b is satisfied by a current agreement, not by an agreement. An import
          that lands the document but drops its expiration turns a tracked renewal into
          an untracked one, which is the most avoidable citation in the file.

  - stage: "3. Program re-setup — courses, sites, preceptors and standards rebuilt in Prism"
    current_state_in_prism: >
      This is the best-documented stage in the whole journey, because it is ordinary
      onboarding. Program details and settings
      (../flows/admin-onboarding--02-program-details-settings-setup.yaml), the site and
      personnel directory (--05), the course catalog and curriculum grid (--06), and
      learning activities and competency setup (--08) are each traced screen by screen.
      Curriculum Mapping ships pre-loaded and custom accreditor standards with a Mapped
      Standards Report distinguishing Directly from Indirectly Mapped, plus an Unmapped
      Standards filter — so an ACPE standard set can be activated and mapped against
      without new construction.
    pain_or_gap: >
      Re-setup is where the migration's real cost sits, and it is staff time, not
      software. Rebuilding a four-year curriculum map, a site directory and a preceptor
      roster is weeks of work by the same two people who still have a running program to
      operate. Nothing in this repo estimates that duration for a pharmacy program. The
      2026-09-04 interview describes the current research pattern honestly: gaps get
      discovered organically during onboarding, when the account manager or CSS team
      hits a snag — meaning a migration's real friction points are found on the first
      customer, not before them.
    accreditation_link: >
      Re-setup is the moment the ACPE standard taxonomy itself gets stood up. ACPE
      Standard 2, Key Element 2.2.d requires documented mapping of didactic content
      coverage plus mapping of every APPE experience's learning outcomes to the 2.1.a-m
      elements — the curriculum grid rebuilt in this stage IS that evidence. ACPE
      Standard 3, Key Element 3.3.a (preceptor quality criteria and credential records)
      and ACPE Standard 3, Key Element 3.3.c (orientation and development completion)
      set what the rebuilt preceptor roster must carry.
    competitor_comparison: >
      Curriculum mapping is the one place a pharmacy evaluator will directly compare
      CORE's CompMS against Prism's Curriculum Mapping pillar, since CompMS markets
      alignment to named accreditors including ACPE with dashboards, gap analysis and
      one-click reports (see ../competitors/core-elms.yaml). PharmAcademic also names
      curricular mapping for schools of pharmacy, but its public evidence establishes
      the capability by name only, with no depth to compare (see
      ../competitors/pharmacademic.yaml).
    key_findings:
      - subject: "Pharmacy"
        headline: "The migration cost is staff weeks, and nobody has measured it"
        severity: "configure-needed"
        detail: >
          Every re-setup screen is documented; the elapsed time to rebuild a four-year
          PharmD curriculum map, site directory and preceptor roster is not. That number
          is what a migration pitch actually needs and does not have.

  - stage: "4. Bulk ExamSoft import — didactic data joins clinical data on one platform"
    current_state_in_prism: >
      The 12 September 2026 release lets a program already using Prism for clinical
      management bulk-import its ExamSoft reports and data, at no additional charge. Per
      the 2026-09-04 interview this is the first time a program's didactic and clinical
      records sit on one platform in Prism. External outcome-data ingestion more broadly
      — board exams, match, mandated surveys — is traced in
      ../flows/accreditation-self-study--05-external-outcome-data-ingestion-board-exams.yaml.
      This capability is not yet reflected in ../prism/capability-map.yaml; the interview
      is currently its only in-repo source.
    pain_or_gap: >
      Two limits, both stated rather than inferred. First, the import is scoped to
      ExamSoft — a program whose didactic assessment lives in its LMS instead has no
      described path, and the interview notes Canvas and Brightspace have both added
      assessment building in the last two years, so that population is growing. Second,
      the import moves data; it does not by itself produce the insight the stack was
      bought for. What Influx sold was analysis on top of the join, and the AI-aided
      gap-and-recommendation layer that would match it is explicitly a roadmap concept,
      not shipped.
    accreditation_link: >
      This is the stage that serves ACPE Standard 7, Key Element 7.3.d, which requires
      an assessment plan measuring achievement against the 2.1.a-n outcome elements at
      both individual-student and aggregate level, with evidence students are APPE-ready
      before entering APPEs and graduates are Practice-ready and Team-ready. A
      longitudinal didactic-plus-clinical record is the substrate that claim rests on.
      It also feeds ACPE Standard 7, Key Element 7.5.a, whose CQI cycle requires
      collected assessment data to be analysed and acted on, not merely stored.
    competitor_comparison: >
      This is a direct strike at the incumbent stack rather than at a single competitor:
      CORE holds the clinical half, ExamSoft holds the didactic half, and Influx charges
      to join them while owning no original data of its own. A free import that lands
      both halves in one platform removes the third vendor from the diagram. Note the
      honest asymmetry — Exxat also owns the clinical half natively and so does not
      depend on an integration to get it, which Influx does.
    key_findings:
      - subject: "Pharmacy"
        headline: "The free ExamSoft import removes the third vendor from the stack"
        severity: "none"
        detail: >
          CORE plus ExamSoft plus Influx exists to produce one longitudinal view. Landing
          didactic data next to clinical data at no charge makes the analytics vendor
          redundant, which is the clearest pharmacy wedge in this file.

  - stage: "5. First ACPE self-study cycle on the new platform"
    current_state_in_prism: >
      Self-study evidence assembly, submission export and site-visit support are traced
      element by element in
      ../flows/accreditation-self-study--08-self-study-assembly-submission-site-visit.yaml,
      including the Heatmap, Mapped Standards and Cumulative reports and read-only
      site-visitor accounts. Closing the CQI loop from finding to action to evidence is
      traced in ../flows/accreditation-self-study--07-closing-the-cqi-loop-finding-to.yaml.
      The Accreditation Management pillar that would aggregate evidence against named
      ACPE standard numbers is roadmap Q3 2027, not shipped.
    pain_or_gap: >
      A program that switched mid-cycle has to produce one continuous evidence chain
      from two systems, and nothing on either side is built for that. Pre-cutover
      evidence sits in an incumbent the program no longer licenses; post-cutover
      evidence sits in Prism; the self-study narrative has to reconcile them. This is
      the single hardest thing in the journey and the least supported. It is also
      exactly the story the GTM team asked for and cannot yet tell, because no pharmacy
      program has been through it.
    accreditation_link: >
      ACPE Standard 7, Key Element 7.5.b is the governing element: documented processes
      for reviewing and ensuring the program meets all standards on an ongoing basis,
      including interim reporting during the accreditation term. A scoping fact this
      stage must respect — ACPE retired AACP's AAMS and now operates its own submission
      platform, PHARMS, effective with Standards 2025. The accreditor owns the system of
      record, so the target is evidence aggregation and export into PHARMS, never a
      rival submission portal. ACPE Standard 7, Key Element 7.3.c (standardized key
      components and consistent assessment across all sites offering the same course) is
      the other element a two-system history threatens directly.
    competitor_comparison: >
      This is CORE's strongest defensive position, not Exxat's strongest offensive one.
      CORE's CompMS markets ACPE-named standards alignment with real-time dashboards,
      gap analysis and one-click reports, and CORE has actively pitched it for the
      2016-to-2025 standards transition (see ../competitors/core-elms.yaml). Prism's
      equivalent pillar is roadmap. The honest posture during a migration is that the
      self-study is harder in the switch year, and that the payoff is the unified
      didactic-plus-clinical evidence base underneath it — not that the self-study
      itself gets easier immediately.
    key_findings:
      - subject: "Pharmacy"
        headline: "The switch-year self-study spans two systems and neither supports it"
        severity: "gap"
        detail: >
          Pre-cutover evidence lives in a platform the program no longer licenses.
          Reconciling that with post-cutover evidence into one ACPE 7.5.b narrative is
          unsupported on both sides and is the migration's real risk.

sources:
  - "../interviews/2026-09-04-vishaka-ruchi-pharmacy-understanding.md — the CORE/ExamSoft/Influx stack, the 12 Sep 2026 free ExamSoft bulk import, the January exam-module soft launch, CORE's pharmacy share, e-Value described as archaic, and the explicit statement that the pharmacy standards-gap research remains to be done"
  - "../accreditation/acpe.yaml — ACPE Key Elements 2.2.d, 3.1.b, 3.2.b, 3.2.d, 3.3.a, 3.3.c, 3.5.b, 7.3.c, 7.3.d, 7.5.a, 7.5.b; PHARMS replacing AACP's AAMS as the submission system of record"
  - "../competitors/core-elms.yaml — centralized contract and affiliation-agreement storage with expiry alerts, preceptor license collection, CompMS ACPE standards alignment with dashboards and one-click reports"
  - "../competitors/e-value.yaml — the second pharmacy incumbent, and the weaker of the two migration triggers"
  - "../competitors/pharmacademic.yaml — ASHP residency mandate binds a different program type; PharmD-side curricular mapping evidenced by name only"
  - "../prism/capability-map.yaml — shipped vs. roadmap split: Clinical & Experiential Education, Compliance Management (Contracts with expiry alerts), Curriculum Mapping (Pre-loaded + custom standards, Mapped Standards Report, Unmapped Report) and Surveys & Course Evaluations shipped; Exam Management Q2 2027 and Accreditation Management Q3 2027 not shipped"
  - "../flows/admin-onboarding--02-program-details-settings-setup.yaml, --05-sites-locations-personnel-management.yaml, --06-courses-rotations-curriculum-mapping.yaml, --08-learning-activities-competency-management-reporting.yaml — the re-setup stage, traced screen by screen"
  - "../flows/preceptor-site-onboarding--02-affiliation-agreement-execution-contract-lifecycle-management.yaml, --03-preceptor-recruitment-credential-verification-licensure-gating.yaml — the contract and credential objects a migration has to land"
  - "../flows/rotation-lifecycle--05-in-rotation-capture-hours-encounters-procedures.yaml — per-student cumulative hour capture, the record that cannot restart mid-cohort"
  - "../flows/accreditation-self-study--05-external-outcome-data-ingestion-board-exams.yaml, --07-closing-the-cqi-loop-finding-to.yaml, --08-self-study-assembly-submission-site-visit.yaml — outcome ingestion, CQI closure, and self-study assembly"
last_updated: "2026-09-10"
```

- [ ] **Step 2: Verify every journey field is inside its ceiling** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only | grep "pharmacy-core-to-exxat" || echo "clean"`. Expected: `clean`. Any `key_findings[].detail` line means an entry is over 260 chars — shorten it rather than allowlisting a brand-new file.
- [ ] **Step 3: Verify the computed join picked the new journey up** — Run from the repo root:
  ```bash
  python3 -c "
import yaml, pathlib
j = yaml.safe_load(open('content/journeys/pharmacy-core-to-exxat-migration.yaml'))
a = yaml.safe_load(open('content/accreditation/acpe.yaml'))
els = [s['element_id'] for s in a['standards']]
for i, st in enumerate(j['stages'], 1):
    p = st.get('accreditation_link') or ''
    hits = [e for e in els if e in p and 'ACPE' in p]
    print(i, len(hits), hits)
"
  ```
  Expected: every one of the 5 stages reports at least one hit, and stage 2 reports three (`3.1.b`, `3.2.b & 3.2.d`, `3.5.b`).
- [ ] **Step 4: Build and manual browser check** — Run `cd apps/ecosystem && npx next build`, then with `npm run dev`: open `/journeys` and confirm a sixth card, "Pharmacy Platform Migration — CORE ELMS to Exxat Prism", showing "5 stages" and a "Pharmacy" badge. Open `/journeys/pharmacy-core-to-exxat-migration` and confirm the page renders with the two-zone shape and stages closed by default. Then open `/domains/pharmacy/standards`, expand `Standard 3, Key Element 3.5.b`, and confirm the new journey now appears in the computed "Also cited by existing research" list under its full name.
- [ ] **Step 5: Commit**
  ```bash
  git add content/journeys/pharmacy-core-to-exxat-migration.yaml
  git commit -m "Add CORE-to-Exxat pharmacy migration journey"
  ```

---

### Task 11: Pharmacy trends from the interview

**Files:**
- Modify: `content/trends/pharmacy.yaml:1-6` (header comment count), `:99-106` (append four entries after the `aacp-experiential-education-institute-2026` entry), `:107` (`last_updated`)
- Test: `python3 scripts/check_content_density.py` + the browser check in Step 4

**Interfaces:**
- Consumes: source id `interview-vishaka-pharmacy-understanding-2026-09-04` (Task 1) — `check_trends_integrity()` fails on any `trends[].sources` id that doesn't resolve.
- Produces: four new `TrendEntry` records rendered by `/domains/pharmacy/trends`; raises `trendCount` from 10 to 14, which the standards page's `CoverageGapsCallout` reads.

- [ ] **Step 1: Update the header comment** — replace lines 1-6 of `content/trends/pharmacy.yaml` with:

```yaml
# Level 2 reframing — see _TEMPLATE.yaml for schema/rules. Cites
# content/prism/capability-map.yaml (for exxat_status/exxat_ref),
# content/competitors/*.yaml, and content/sources/registry.yaml. Sparse by
# design: 14 trends (9 researched 2026-09-09: 4 ACPE-standards trends, then 5 from
# the pedagogy/capacity/AI research pass; 1 added 2026-09-10 from the
# reviews/newsletters/videos research pass; 4 added 2026-09-10 from the Vishaka
# pharmacy interview), not padded to a round number.
```

- [ ] **Step 2: Append these four entries** immediately after the `aacp-experiential-education-institute-2026` entry (its `sources:` list ends line 106) and before `last_updated:` on line 107:

```yaml

  - id: "core-examsoft-influx-stack"
    trend: "Pharmacy programs run CORE plus ExamSoft plus Influx to get one longitudinal student view"
    detail: "Influx owns no original data — it integrates with CORE for clinical records and ExamSoft for didactic records, then sells the analysis on top. Three vendors, three training burdens, one question. The 12 September 2026 ExamSoft bulk import lands both halves in Prism at no extra charge, which makes the analytics vendor redundant."
    exxat_status: "shipped"
    exxat_ref: "ExamSoft bulk import (September 2026 release)"
    addressed_by_competitors:
      - competitor_slug: "core-elms"
        capability_ref: "Clinical & Experiential Education"
        source_id: "product-page-core-elms-pharmacy-affiliation-agreements-2026"
    sources:
      - "interview-vishaka-pharmacy-understanding-2026-09-04"

  - id: "lms-encroaching-on-assessment"
    trend: "LMS platforms are moving into assessment, so the exam module competes with Canvas as well as ExamSoft"
    detail: "Canvas and Brightspace have both added AI and assessment building in the last two years, and some programs already run full hundred-question midterms and finals in the LMS rather than in a dedicated exam tool. Exxat's own exam module has a January soft launch, so it lands against two categories of incumbent, not one."
    exxat_status: "roadmap"
    exxat_ref: "Exam Management"
    addressed_by_competitors: []
    sources:
      - "interview-vishaka-pharmacy-understanding-2026-09-04"

  - id: "pharmacy-buyer-is-not-the-dce"
    trend: "Curriculum mapping and competency tracking are sold to deans and assessment chairs, not to Directors of Clinical Education"
    detail: "Most pharmacy outreach today targets the Director of Clinical Education, for whom curriculum mapping and accreditation are outside their purview — described internally as barking up the wrong tree. Dean, program director, curriculum chair and assessment chair lists don't exist yet for the current schools, so the assets can't be routed by role."
    exxat_status: "unaddressed"
    exxat_ref: null
    addressed_by_competitors: []
    sources:
      - "interview-vishaka-pharmacy-understanding-2026-09-04"

  - id: "central-technology-adoption-office"
    trend: "Larger universities decide clinical-education software centrally, not program by program"
    detail: "Bigger institutions increasingly run a central office for faculty development and technology adoption that chooses enterprise software — LMS, SIS, often ExamSoft — and runs implementation across programs from an institution-level budget. Where one exists, the pharmacy program is an influencer, not the decision maker, and pharmacy can pull PT, OT and PA along with it."
    exxat_status: "unaddressed"
    exxat_ref: null
    addressed_by_competitors: []
    sources:
      - "interview-vishaka-pharmacy-understanding-2026-09-04"
```

- [ ] **Step 3: Verify ceilings and source resolution** — Run from the repo root: `python3 scripts/check_content_density.py --warn-only | grep "pharmacy.yaml" || echo "clean"`. Expected: `clean` (`trends[].trend` hard ceiling 220, `trends[].detail` hard ceiling 600 — every entry above is inside both). Then confirm `check_trends_integrity()` is silent: the full script's FAIL count must still be exactly `31`.
- [ ] **Step 4: Manual browser check** — open `/domains/pharmacy/trends` and confirm 14 trends render, with the four new ones carrying an "Interview" source pill (added to `SourceList`'s `KIND_META` in Task 4 Step 3).
- [ ] **Step 5: Commit**
  ```bash
  git add content/trends/pharmacy.yaml
  git commit -m "Add four pharmacy trends from the Vishaka interview"
  ```

---

### Task 12: Full verification sweep

Nothing new is authored here. This task exists because this repo has shipped a build-clean but visually broken component before.

**Files:**
- Modify: none expected. If a check fails, fix in the task that owns the file, then re-run this whole sweep from Step 1.
- Test: all of the below.

**Interfaces:**
- Consumes: everything from Tasks 1-11.
- Produces: nothing. This is the gate.

- [ ] **Step 1: Content density and integrity, full run** — Run from the repo root: `python3 scripts/check_content_density.py; echo "exit=$?"`. Expected: the summary line reports exactly `31 FAIL`, and `grep`ing the output for any file this work touched returns nothing:
  ```bash
  python3 scripts/check_content_density.py --warn-only | grep -E "standards-use-cases|standards-competitor-ratings|pharmacy-core-to-exxat|pharmacy\.yaml|pharmacademic|rxpreceptor|registry\.yaml" || echo "no FAIL/WARN on touched files"
  ```
  A WARN on `registry.yaml`'s `what_it_supports` is acceptable (it's between soft and hard). A **FAIL** on any of these files is not — fix it or add it to `ALLOWLIST` with a one-line reason and today's date.
- [ ] **Step 2: All four integrity checks print zero problems** — Run from the repo root:
  ```bash
  python3 -c "
import importlib.util
spec = importlib.util.spec_from_file_location('ccd', 'scripts/check_content_density.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
for fn in (m.check_standards_ratings_integrity, m.check_standards_use_cases_integrity,
           m.check_trends_integrity, m.check_research_sources_integrity):
    p = fn(); print(fn.__name__, len(p)); [print('  ', x) for x in p]
"
  ```
  Expected: all four print `0`. This is the spec's "element_id, competitor_slug, source_id, persona_relevance, competitor_feature_ref all resolve; every directional rating has a note" requirement.
- [ ] **Step 3: Render density and build** — Run: `cd apps/ecosystem && npm run check:density && npx next build`. Expected: `check-render-density: PASS`, then a build that compiles and prerenders every static route with no errors.
- [ ] **Step 4: Manual browser pass — the six checks the spec names.** Run `cd apps/ecosystem && npm run dev` and work through all six. Do not skip one because the build was clean:
  1. `/domains/pharmacy/standards` → expand `Standard 3, Key Element 3.3.a` (the high-density case). Confirm exactly **4** computed references render and the "N more" line reports the remainder.
  2. Expand `Standard 3, Key Element 3.5.c` (the deliberately-empty case). Confirm it reads "unmapped, not unsupported" — never "unsupported," never blank.
  3. Hover a `RelatedFlowsPreview` chip inside an expanded panel. Confirm the `HoverCard` renders fully and is **not clipped** by the surrounding `<td>`. (Spec's named known risk — this `HoverCard` has never been rendered inside this hand-rolled detail-panel plugin before.)
  4. Expand `Standard 3, Key Element 3.5.b` and `Standard 7, Key Element 7.5.b`. Confirm the two pre-existing `core-elms` ratings are **not** flagged Directional, while ratings added in Task 8 are.
  5. `/domains/do/standards` (no curated use-case content). Confirm the page degrades cleanly: computed COCA matches or the empty state, no crash, no ACPE content bleeding through.
  6. `/journeys/pharmacy-core-to-exxat-migration`. Confirm the route renders and the stages are closed by default.
- [ ] **Step 5: Confirm no raw filename or slug reached the screen** — while on `/domains/pharmacy/standards` with several rows expanded, use the browser's find-in-page for `.yaml` and for `--0`. Expected: zero matches in rendered text. Every flow and journey reference must show its `flow_name` / `journey_name` (`UI-DENSITY-PATTERNS.md`'s standing rule).
- [ ] **Step 6: Confirm the numbers on the page match the data** — on `/domains/pharmacy/standards`, read the three progress bars and the metadata row, then verify against the source of truth:
  ```bash
  python3 -c "
import yaml
u = yaml.safe_load(open('content/lenses/standards-use-cases.yaml'))['use_cases']
r = yaml.safe_load(open('content/lenses/standards-competitor-ratings.yaml'))['ratings']
ph = [x for x in r if x['domain']=='Pharmacy']
print('curated use-case entries:', len(u))
print('pharmacy rated cells:', len(ph), '| directional:', len([x for x in ph if x.get('evidence_strength')=='directional']))
"
  ```
  Expected: `curated use-case entries: 15`; `pharmacy rated cells:` between 28 and 35 with all but 2 directional. "Standards with a proposed use case" should read `14 / 20` (12 from the computed join, plus `3.5.a` and `3.2.a` which only curated content reaches). "Competitor cells rated" should match the printed rated count out of 100.
- [ ] **Step 7: Commit any fixes made during the sweep**
  ```bash
  git add -A
  git commit -m "Fix issues found in the pharmacy standards use-cases verification sweep"
  ```
  If nothing needed fixing, skip this step — do not create an empty commit.

---

## Notes on what the planning agent could and could not do

**Task count:** 12.

**Verified by reading, not assumed:** no Jest/Vitest/Playwright exists (`package.json`); density baseline is exactly 934 WARN / 31 FAIL; the computed join covers exactly 12/20 ACPE elements and 3.3.a matches 9 flows + 4 journey stages — and adding the accreditor-name guard changes neither; flows expose `steps[].elements[].accreditation_citation`, not `accreditation_link` (the design spec paraphrases loosely); Pharmacy's five competitors are core-elms, e-value, leo-davinci, pharmacademic, rxpreceptor.

**One thing added beyond the design spec's explicit component list:** `UseCaseStatusBadge`. The spec says "the only new component is `DirectionalBadge`," but `status` has to render somehow. It lives in `fit-badge.tsx` alongside `DirectionalBadge` and reuses the existing five-variant palette, so it adds no new file and no new color.

**One honesty constraint that could not be engineered around:** Task 8's individual ratings cannot be pre-written — they depend on web research that has not happened yet, and inventing them is precisely what the spec forbids. That task instead carries the exact element slice, the exact competitor list, the exact target count range, one complete worked entry built from evidence already in the repo, and machine-checkable acceptance criteria.

**Source note:** Task 1's interview file draws on the actual Granola transcript (id `b818e417-61ab-4f49-894c-d11a270fb320`), including the "that research remains to be done" quote the whole caveat mechanism hangs off — rather than a paraphrase of the design spec's paraphrase.
