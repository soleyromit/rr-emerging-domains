#!/usr/bin/env python3
"""Enforce the character-ceiling table in content/CONTENT-DENSITY.md.

A length brief was given for key_finding.detail ("1-2 sentences") during the
rotation-lifecycle journey build and was silently ignored — 98% of that
journey's entries ended up 3-4x over target, because the brief was requested
in a prompt but never mechanically checked. This script is the check: it
measures the same fields against the same ceilings written down in
content/CONTENT-DENSITY.md, and exits non-zero on any FAIL so an agent can't
declare authoring work done while still over budget.

NOTE ON COVERAGE: main() enumerates content directories EXPLICITLY — it does
not glob content/**. That is deliberate (each family has its own ceiling
table), but it means a new content family is unchecked until it is added to
main() by hand, and a ceiling documented in CONTENT-DENSITY.md for a directory
main() never visits can never fire. content/gtm/ sat in exactly that state
between its creation and 2026-09-11. If you add a family, add it to main().

It has since grown a second job: the check_*_integrity() functions enforce
content/ARCHITECTURE.md's citation rule mechanically — every source_id, slug,
element_id and pillar name resolving to something real, every enum in its
enum, and the two structural quarantines (content/gtm/ and
content/sources/vendor-comparison-chart.yaml) that only exist as rules if
something checks them.

Usage: python3 scripts/check_content_density.py [--warn-only]
"""
import argparse
import pathlib
import re
import sys

import yaml

REPO = pathlib.Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"

# field-path -> (soft, hard). Field paths are dotted, with [] meaning "each item
# of the list at this point". Kept in sync with content/CONTENT-DENSITY.md by hand
# since that doc is the one a human/agent reads; this table is the enforcement.
JOURNEY_CEILINGS = {
    "stages[].key_findings[].detail": (260, 350),
    "stages[].discipline_notes[].detail": (2000, 3000),
    "stages[].domain_variance": (1800, 3000),
    "stages[].discipline_variance": (1800, 3000),
    "stages[].current_state_in_prism": (2000, 3500),
    "stages[].pain_or_gap": (2000, 3500),
    "stages[].accreditation_link": (2000, 3500),
    "stages[].competitor_comparison": (2000, 3500),
}
FLOW_CEILINGS = {
    "steps[].elements[].gap_note": (500, 1500),
}
PERSONA_CEILINGS = {
    "archetype_summary": (2200, 2800),
    "accreditation_pressure[].detail": (350, 700),
    "current_tools[].detail": (350, 700),
    # was unceilinged — root cause of its length. See CONTENT-DENSITY.md's
    # "Plain-language pass" section (2026-08-26).
    "jtbd[].job": (300, 500),
}
ROLE_PERSONA_CEILINGS = {
    "day_in_the_life_summary": (2200, 2800),
    "top_pains[].accreditation_link": (300, 600),
    # was unceilinged — same root cause as jtbd[].job above.
    "top_pains[].pain": (350, 600),
}
LENS_PERSONA_CEILINGS = {
    # tightened 2026-08-26 from 700/1400 as part of the plain-language pass.
    "how_they_implicitly_serve_roles[].read": (600, 1100),
    # gaps_prism_can_exploit[] (flat string) is superseded by the claim/detail
    # split below — kept as a dict key here only if a lens file hasn't been
    # migrated yet; both shapes are checked so nothing silently stops being
    # gated mid-migration.
    "gaps_prism_can_exploit[]": (300, 600),
    "gaps_prism_can_exploit[].claim": (220, 400),
    "gaps_prism_can_exploit[].detail": (300, 600),
}
COMPETITOR_CEILINGS = {
    "exxat_opportunity": (1200, 2000),
    "strengths[].claim": (300, 600),
    "weaknesses[].claim": (300, 600),
}
PRISM_CEILINGS = {
    # measured from capability-map.yaml's own real distribution (67 features, 5
    # pillar notes, 7 intelligence capabilities) — p75 as soft, ~p95 as hard, same
    # method as gap_note's "only the true tail should block".
    "core_ring.pillars[].notes": (1200, 2200),
    "core_ring.pillars[].why_it_matters": (1200, 2200),
    "core_ring.pillars[].features[].detail": (900, 1800),
    "intelligence_layer.capabilities[]": (1500, 2700),
    "open_questions_for_phase_2[]": (450, 900),
    # The optional `roadmap:` sub-object added 2026-09-11 (see capability-map.yaml's own
    # schema comment). CONTENT-DENSITY.md documented this ceiling at 200/400 but marked it
    # "Not yet enforced in check_content_density.py"; wired here 2026-09-11 so the first
    # populated scope_note is gated on arrival. Both attachment points are listed because
    # the sub-object is documented as attachable to a pillar OR a feature.
    "core_ring.pillars[].roadmap.scope_note": (200, 400),
    "core_ring.pillars[].features[].roadmap.scope_note": (200, 400),
}
# measured 2026-08-27 from the file's own 165-standard corpus. Soft ceiling is p75
# (an early warning); hard ceiling is set above the corpus's own observed max (not
# p95, unlike gap_note above) so bringing this previously-unmonitored directory under
# the script doesn't retroactively FAIL 25 already-shipped, already-cited findings
# nobody has individually reviewed yet — same "guards drift; non-blocking at time of
# writing" treatment as the journey fields below. Tighten to a true p95 hard ceiling
# only after those existing WARNs get a real spot-check pass, the way gap_note's did.
ACCREDITATION_CEILINGS = {
    "standards[].evidence_programs_must_produce": (640, 1450),
    "standards[].required_software_behavior": (385, 950),
    "standards[].gap_notes": (612, 1200),
    # exxat_compliance_rationale is a one-sentence derivation from prism_fit,
    # not independent research — same order of magnitude as a competitor claim.
    "standards[].exxat_compliance_rationale": (350, 700),
}
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
# content/trends/*.yaml — one-line trend + a short decomposed detail, same order
# of magnitude as a persona jtbd.job / accreditation gap_notes entry.
TRENDS_CEILINGS = {
    "trends[].trend": (120, 220),
    "trends[].detail": (300, 600),
}
# content/sources/registry.yaml — a citation's "what it supports" is a one-line
# pointer, not a summary of the source itself.
SOURCES_CEILINGS = {
    "sources[].what_it_supports": (150, 300),
}
# content/dissection/*.yaml — added 2026-09-11 with the family itself. A dissection
# manifest asserts nothing, so both ceilinged fields are one-liners about scope and
# absence, not findings: `gap_note` says what research is missing and why (two clauses,
# hence slightly above evidence_note), `exclusion_reason` says why a vendor is out of
# scope for this domain (same numbers as evidence_note, its closest analog). Wired up
# now, while content/dissection/ holds only _TEMPLATE.yaml, so the first real manifest
# is gated on arrival rather than retrofitted — the failure mode CONTENT-DENSITY.md's
# "unceilinged field" sections exist to prevent.
DISSECTION_CEILINGS = {
    "questions[].gap_note": (200, 400),
    "incumbent_set[].exclusion_reason": (150, 300),
}
# content/domains/*.yaml — added 2026-09-11 with the `market_sizing:` and
# `org_structure:` blocks. Only the new prose fields inside those two blocks are
# ceilinged; the pre-existing `market:` prose, `clinical_education_shape` and
# `distinctive_pain_points` are deliberately left alone, since retrofitting a ceiling
# onto already-shipped, already-cited narrative is a separate editorial pass (the same
# call ACCREDITATION_CEILINGS documents above). Wired up now, while every field here
# is null, so the first real number is gated on arrival rather than retrofitted.
DOMAIN_CEILINGS = {
    "market_sizing.tam.basis": (150, 300),
    "market_sizing.sam.basis": (150, 300),
    "market_sizing.som.basis": (150, 300),
    "market_sizing.acv.basis": (150, 300),
    "market_sizing.accredited_programs.variance_note": (200, 400),
    # The one field in this block literally named "claim" — the shape this repo has
    # twice measured running long when left unceilinged. Same numbers as the basis
    # fields above: one sourced line, with the evidence in adjacency.source_id.
    "market_sizing.adjacency.claim": (150, 300),
    "org_structure.typical_parent": (200, 400),
    "org_structure.buying_roles[].note": (200, 400),
}
# content/market/programs/*.yaml — added 2026-09-11 with the family itself, which holds
# only _TEMPLATE.yaml today. `notes` is one line about one program in a file of hundreds
# of rows; `pii_policy` is the single paragraph saying what is deliberately not mirrored
# out of the source export.
MARKET_PROGRAMS_CEILINGS = {
    "programs[].notes": (150, 300),
    "source_of_record.pii_policy": (300, 500),
}
# content/interviews/*.md FRONT-MATTER only — added to CONTENT-DENSITY.md 2026-09-11 with
# the session schema, wired here 2026-09-11. The markdown body below the front-matter is a
# Level 0 transcript and stays deliberately unceilinged; trimming a primary source destroys
# the thing that makes it citable.
INTERVIEW_FRONT_MATTER_CEILINGS = {
    "title": (120, 200),
}
# content/lenses/product-gaps.yaml — ceilings documented in CONTENT-DENSITY.md 2026-09-11
# with the file; wired here (Task 1.3 documented them and explicitly handed the enforcement
# to this task). `gap` is the scannable headline, `detail` the sourced paragraph behind it.
PRODUCT_GAPS_CEILINGS = {
    "gaps[].gap": (120, 220),
    "gaps[].detail": (300, 600),
}
# content/lenses/competitor-differentiation.yaml — same hand-off. `claim` sits slightly
# above the 120/220 headline register because a differentiation claim has to name both the
# vendor and the axis before it says anything.
COMPETITOR_DIFFERENTIATION_CEILINGS = {
    "differentiators[].claim": (160, 260),
    "differentiators[].detail": (300, 600),
    "differentiators[].counter_move": (200, 350),
    "differentiators[].evidence_note": (150, 300),
}
# content/lenses/feature-comparison-matrix.yaml — same hand-off. Exxat's own cells are held
# to the identical ceilings as every competitor's, deliberately: the whole point of the
# separate exxat_cells[] list is that Exxat's side gets the same treatment, not a softer one.
FEATURE_MATRIX_CEILINGS = {
    "cells[].capability": (120, 220),
    "cells[].rationale": (300, 600),
    "cells[].evidence_note": (150, 300),
    "exxat_cells[].rationale": (300, 600),
    "exxat_cells[].evidence_note": (150, 300),
}
# content/gtm/*.yaml — documented in CONTENT-DENSITY.md 2026-09-11 with the family and
# wired here. Note that content/gtm/ was not in main()'s directory enumeration at all until
# this task, so these ceilings could not have fired even if they had been declared.
GTM_PIPELINE_CEILINGS = {
    "workstreams[].objective": (200, 350),
    "workstreams[].blocked_by": (150, 300),
}
GTM_COLLATERAL_CEILINGS = {
    "assets[].title": (150, 300),
    "assets[].notes": (150, 300),
}

# Known, reviewed exceptions — a spot-checked genuine dense finding, not a bug.
# Format: (file glob, field path, substring of the VALUE itself) -> reason. The
# identifier must appear in the actual field text, not the element/subject name
# next to it — matching is a plain substring check against the value.
ALLOWLIST = {
    (
        "rotation-lifecycle--06-midpoint-formative-feedback-early-risk-intervention.yaml",
        "steps[].elements[].gap_note",
        "This is the sharpest cross-discipline split in the file",
    ): "genuine cross-discipline synthesis note (Availability of a shipped standard instrument "
    "to attach a midpoint to), spot-checked 2026-08-25 — not a formatting artifact",

    # rotation-lifecycle.yaml's discipline_variance (the original single-string field,
    # 13.7k-22.7k chars/stage) is superseded by discipline_notes (added 2026-08-25,
    # same content decomposed per discipline) but kept verbatim, additively, so nothing
    # that already reads discipline_variance breaks. The app prefers discipline_notes
    # for rendering when present — see components/journey-stage-section.tsx. Allowlisted
    # per-stage by a tail substring rather than a blanket path exemption, so a *new*
    # journey adopting discipline_variance still gets checked normally.
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "the CSIF is a named enhancement, not a shipped instrument."): "superseded by discipline_notes, kept additively — stage 1",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "OT answers all three standards without new construction."): "superseded by discipline_notes, kept additively — stage 2",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "receiving site has never seen the student's compliance profile."): "superseded by discipline_notes, kept additively — stage 3",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "scope, which is a stated limitation rather than a finding."): "superseded by discipline_notes, kept additively — stage 4",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "and every program assembles the answer from several."): "superseded by discipline_notes, kept additively — stage 5",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "actual midpoint practice is undocumented rather than absent."): "superseded by discipline_notes, kept additively — stage 6",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "COA's daggered post-January-2026 rows outright."): "superseded by discipline_notes, kept additively — stage 7",
    ("rotation-lifecycle.yaml", "stages[].discipline_variance", "so it is one motion serving two disciplines."): "superseded by discipline_notes, kept additively — stage 8",

    # discipline_notes[].detail — 9 entries landed 6-504 chars over the 3000 hard
    # ceiling after mechanically decomposing an 18,887-avg-char essay into per-discipline
    # entries (an ~87% reduction overall). Each ends on a real, load-bearing closing
    # point, not padding — reviewed 2026-08-25 and kept rather than mechanically
    # truncated, which would have cut a genuine finding, not filler.
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "multi-party custom FORM (Student > Site Mentor Review > Faculty Review > Admin Review)"): "reviewed 2026-08-25, genuine closing point kept — stage 1 OT/OTA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "OT/SW/SLP programs whose accreditors ask materially the same question cannot have it at all."): "reviewed 2026-08-25, genuine closing point kept — stage 1 PA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "which is the number 4P actually needs."): "reviewed 2026-08-25, genuine closing point kept — stage 2 PT/PTA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "claimed by no competitor."): "reviewed 2026-08-25, genuine closing point kept — stage 6 PA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "it is missing from seven of eight disciplines."): "reviewed 2026-08-25, genuine closing point kept — stage 7 PT/PTA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "Extending that carry-forward to configured forms would serve Nursing and SLP identically."): "reviewed 2026-08-25, genuine closing point kept — stage 7 PA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "III-K is about instrument availability, not this."): "reviewed 2026-08-25, genuine closing point kept — stage 7 Nursing",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "which arc-pa.yaml calls a real gap for a report whose entire purpose is accreditation-readiness evidence."): "reviewed 2026-08-25, genuine closing point kept — stage 8 PA",
    ("rotation-lifecycle.yaml", "stages[].discipline_notes[].detail", "so it is one motion serving two disciplines."): "reviewed 2026-08-25, genuine closing point kept — stage 8 Teacher Education",

    # discipline-crna.yaml's archetype_summary is 45 chars over the 2,800 hard
    # ceiling (2,845). Read in full 2026-08-25: it's one continuous argument about
    # CRNA's three accreditor-driven structural facts (counting, supervision,
    # severity), not N findings glued together, so it doesn't decompose into a list
    # the way accreditation_pressure/current_tools did — see CONTENT-DENSITY.md's
    # "genuinely one continuous argument" exception. Kept whole rather than cut.
    ("discipline-crna.yaml", "archetype_summary", "None of that is researched anywhere in this repo."): "reviewed 2026-08-25, one continuous argument, 45 chars over — not decomposable",

    # capability-map.yaml — newly brought under check_content_density.py 2026-08-25
    # (previously entirely unmonitored). These 4 are single-feature/single-pillar
    # evidence trails, not N findings glued together, so they don't decompose the
    # way accreditation_pressure did — read in full and confirmed genuine.
    ("capability-map.yaml", "core_ring.pillars[].features[].detail", "the closest existing analogue for competency/hour-threshold accreditors like ACPE or CODA."): "reviewed 2026-08-25, one continuous feature evidence trail (SLP Clinical Log) — not decomposable",
    ("capability-map.yaml", "core_ring.pillars[].features[].detail", "Qualitative and quantitative assessment formats are both supported."): "reviewed 2026-08-25, one continuous feature evidence trail (AACN Essentials CBE pipeline) — not decomposable",
    ("capability-map.yaml", "core_ring.pillars[].features[].detail", "per-question bar charts aggregated by rotation or setting, plus a response-distribution pie chart"): "reviewed 2026-08-25, one continuous feature evidence trail (CIET v2) — not decomposable",
    ("capability-map.yaml", "core_ring.pillars[].notes", "the only remaining unconfirmed piece is what incremental scope the Q1 2027 roadmap item adds"): "reviewed 2026-08-25, a running dated research log (RECONCILE/RESOLVED entries), one continuous thread — not decomposable",
}


def walk(obj, path=""):
    """Yield (path, value) for every string leaf, expanding lists as []."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for item in obj:
            yield from walk(item, f"{path}[]")
    elif isinstance(obj, str):
        yield path, obj


def check_file(fpath, ceilings, results, extra_id_field=None):
    data = yaml.safe_load(fpath.read_text())
    if not data:
        return
    for path, value in walk(data):
        if path not in ceilings:
            continue
        soft, hard = ceilings[path]
        n = len(value)
        if n <= soft:
            continue
        severity = "FAIL" if n > hard else "WARN"
        results.append((severity, fpath.name, path, n, hard, value))


def check_front_matter_file(fpath, ceilings, results):
    """Same measurement as check_file(), against a markdown file's YAML front-matter
    block rather than a whole YAML document. Only the front-matter is measured: the
    body below it is a Level 0 transcript and is deliberately unceilinged."""
    data = _load_front_matter(fpath, [])
    if not data:
        return
    for path, value in walk(data):
        if path not in ceilings:
            continue
        soft, hard = ceilings[path]
        n = len(value)
        if n <= soft:
            continue
        severity = "FAIL" if n > hard else "WARN"
        results.append((severity, fpath.name, path, n, hard, value))


# Mirrors DOMAIN_TO_ACCREDITATION_SLUG in apps/ecosystem/lib/content.ts — kept in
# sync by hand, same as the ceiling tables above vs. CONTENT-DENSITY.md. This is the
# canonical app-level domain label (e.g. "Physical Therapy"), which is NOT the same
# string as that accreditor file's own `domain:` field (e.g. capte.yaml's is
# "PT / PTA") — ratings entries use this label so they match what
# getStandardsCrosswalkForDomain() looks up by.
DOMAIN_TO_ACCREDITATION_SLUG = {
    "DO": "coca",
    "Pharmacy": "acpe",
    "Dentistry": "coda",
    "Medicine": "lcme",
    "Nursing": "nursing",
    "Teacher Education": "caep",
    "Social Work": "cswe",
    "Physical Therapy": "capte",
    "Occupational Therapy": "acote",
    "Physician Assistant": "arc-pa",
    "Speech-Language Pathology": "caa-asha",
    "CRNA": "coa",
    "Counseling": "counseling",
}


# ---------------------------------------------------------------------------
# Level 0.5 source homes.
#
# A citable `source_id` used to live in exactly one place: content/sources/
# registry.yaml. Phase 0 of the domain-dissection work added four more homes,
# each a corpus index (one file indexing many sources) rather than one registry
# entry per source. Every source_id check in this file resolves against the
# UNION of all five, through the single _load_source_ids() below — deliberately
# one loader, not five lookups scattered through the individual checks.
#
# The shapes below were read off the real committed files, not assumed, and are
# load-bearing:
#   content/sources/registry.yaml           sources[].id
#   content/sources/help-center.yaml        articles[].id
#   content/sources/playbooks.yaml          playbooks[].id   <- under a `playbooks:`
#                                                               key, not a bare list
#   content/sources/support-tickets/*.yaml  snapshot.id  AND  tickets[].source_id
#   content/interviews/*.md                 `id:` in the YAML front-matter block
#
# Two things that look like ids and are not: playbooks[].zendesk_capture is a
# plain string label for an unverified screen capture, and the support-ticket
# _TEMPLATE.yaml's placeholder ids are skipped the same way _TEMPLATE files are
# skipped everywhere else in this checker.
#
# Interview ids are NOT derivable from filenames — one of them deliberately
# differs from its filename slug so it matches an already-frozen registry id
# that existing citations point at. They are always read from front-matter.
SOURCE_HOMES_DESC = (
    "any source home (content/sources/registry.yaml, help-center.yaml, "
    "playbooks.yaml, support-tickets/*.yaml, content/interviews/*.md)"
)

_SOURCE_IDS_CACHE = None
_SOURCE_HOME_PROBLEMS = []


def _rel(path):
    try:
        return str(path.relative_to(REPO))
    except ValueError:
        return str(path)


def _load_source_home_yaml(path, problems):
    """Parse one source-home file, reporting rather than swallowing a failure.

    A home that exists but won't parse must never read as "no ids here": that
    would silently turn every citation into it into a dangling-source FAIL,
    which reads as a content error when it is actually a parse error.
    """
    try:
        return yaml.safe_load(path.read_text()) or {}
    except (yaml.YAMLError, OSError) as exc:
        problems.append(
            f"{_rel(path)}: could not be read as YAML, so the source ids it defines "
            f"cannot resolve — {exc.__class__.__name__}: {exc}"
        )
        return None


def _load_listed_ids(path, list_key, id_field, problems):
    """Ids from a corpus-index file shaped `<list_key>: [ {<id_field>: ...}, ... ]`."""
    if not path.exists():
        problems.append(
            f"{_rel(path)}: missing — citations to the ids this source home defines cannot resolve"
        )
        return set()
    doc = _load_source_home_yaml(path, problems)
    if doc is None:
        return set()
    entries = doc.get(list_key)
    if not isinstance(entries, list):
        problems.append(
            f"{_rel(path)}: expected a top-level `{list_key}:` list of entries carrying "
            f"an `{id_field}:`; found {type(entries).__name__}"
        )
        return set()
    ids = set()
    for n, entry in enumerate(entries):
        value = entry.get(id_field) if isinstance(entry, dict) else None
        if not value:
            problems.append(f"{_rel(path)}: {list_key}[{n}] has no `{id_field}:`, so it defines no citable source id")
            continue
        ids.add(value)
    return ids


def _load_front_matter(path, problems):
    """Parse the YAML front-matter block between a markdown file's first two
    `---` fence lines. Interview files carry their `id:` there, sometimes below
    comment lines explaining the id, so this is a real YAML parse rather than a
    regex for `id:`."""
    lines = path.read_text().splitlines()
    if not lines or lines[0].strip() != "---":
        problems.append(
            f"{_rel(path)}: no YAML front-matter block (file does not open with a `---` line), "
            "so its source id cannot resolve"
        )
        return None
    block = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            block = "\n".join(lines[1:i])
            break
    if block is None:
        problems.append(f"{_rel(path)}: front-matter block is never closed by a second `---` line")
        return None
    try:
        return yaml.safe_load(block) or {}
    except yaml.YAMLError as exc:
        problems.append(
            f"{_rel(path)}: front-matter is not valid YAML — {exc.__class__.__name__}: {exc}"
        )
        return None


def _load_source_ids():
    """The union of every id a citation may legitimately resolve to, across all
    five Level 0.5 source homes.

    Cached: each integrity check calls this, and every call would otherwise
    re-parse 56KB of registry.yaml and re-report the same load problems once per
    caller.
    """
    global _SOURCE_IDS_CACHE
    if _SOURCE_IDS_CACHE is not None:
        return _SOURCE_IDS_CACHE

    problems = _SOURCE_HOME_PROBLEMS
    ids = set()

    # 1. registry.yaml — original behaviour, deliberately unchanged, including
    #    tolerating a missing registry silently.
    registry_path = CONTENT / "sources" / "registry.yaml"
    if registry_path.exists():
        doc = _load_source_home_yaml(registry_path, problems)
        if doc is not None:
            ids |= {s.get("id") for s in (doc.get("sources") or []) if isinstance(s, dict) and s.get("id")}

    # 2. help-center.yaml, 3. playbooks.yaml — corpus indexes.
    ids |= _load_listed_ids(CONTENT / "sources" / "help-center.yaml", "articles", "id", problems)
    ids |= _load_listed_ids(CONTENT / "sources" / "playbooks.yaml", "playbooks", "id", problems)

    # 4. support-tickets/*.yaml — each snapshot is itself citable (snapshot.id)
    #    AND each ticket inside it is citable (tickets[].source_id).
    tickets_dir = CONTENT / "sources" / "support-tickets"
    if not tickets_dir.is_dir():
        problems.append(f"{_rel(tickets_dir)}: missing — support-ticket snapshot ids cannot resolve")
    else:
        for f in sorted(tickets_dir.glob("*.yaml")):
            if f.name.startswith("_TEMPLATE"):
                continue
            doc = _load_source_home_yaml(f, problems)
            if doc is None:
                continue
            snapshot = doc.get("snapshot")
            if not isinstance(snapshot, dict) or not snapshot.get("id"):
                problems.append(f"{_rel(f)}: no `snapshot.id:`, so the snapshot defines no citable source id")
            else:
                ids.add(snapshot["id"])
            tickets = doc.get("tickets")
            if not isinstance(tickets, list):
                problems.append(
                    f"{_rel(f)}: expected a top-level `tickets:` list of entries carrying a "
                    f"`source_id:`; found {type(tickets).__name__}"
                )
                continue
            for n, ticket in enumerate(tickets):
                sid = ticket.get("source_id") if isinstance(ticket, dict) else None
                if not sid:
                    problems.append(f"{_rel(f)}: tickets[{n}] has no `source_id:`, so it defines no citable source id")
                    continue
                ids.add(sid)

    # 5. interviews/*.md — id lives in YAML front-matter.
    interviews_dir = CONTENT / "interviews"
    if not interviews_dir.is_dir():
        problems.append(f"{_rel(interviews_dir)}: missing — interview source ids cannot resolve")
    else:
        for f in sorted(interviews_dir.glob("*.md")):
            if f.name.startswith("_TEMPLATE"):
                continue
            front_matter = _load_front_matter(f, problems)
            if front_matter is None:
                continue
            if not front_matter.get("id"):
                problems.append(f"{_rel(f)}: front-matter has no `id:`, so this interview defines no citable source id")
                continue
            ids.add(front_matter["id"])

    _SOURCE_IDS_CACHE = ids
    return ids


def check_source_homes_integrity():
    """Report, as a named FAIL, any problem hit while loading the five source
    homes. Without this a home that quietly loaded as empty would make every
    citation into it look like a dangling reference, and the real cause (a
    renamed key, a YAML typo, a deleted file) would never be named."""
    _load_source_ids()
    return list(_SOURCE_HOME_PROBLEMS)


def _load_persona_slugs():
    slugs = set()
    for f in sorted((CONTENT / "personas").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        slugs.add(f.stem)
    return slugs


def check_standards_ratings_integrity():
    """Enforce ARCHITECTURE.md's citation rule for the cross-registry files this
    repo has: every rating in lenses/standards-competitor-ratings.yaml must resolve
    to a real accreditation element and a real competitor slug, and carry a source
    whenever it asserts a rating — the automatable version of "does the arrow point
    down, and does it resolve" that's otherwise enforced only by human review.

    A rating's source requirement is satisfied by either the original single-URL
    `source` field or a non-empty `sources[]` list (added 2026-09-09) — either is
    a real, checkable citation. `sources[].source_id` and `persona_relevance[]`
    entries (also added 2026-09-09) are optional but must resolve if present."""
    problems = []
    ratings_path = CONTENT / "lenses" / "standards-competitor-ratings.yaml"
    if not ratings_path.exists():
        return problems
    doc = yaml.safe_load(ratings_path.read_text()) or {}

    elements_by_slug = {}  # accreditor slug -> element_id -> set of feature_teardown pillars
    for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        adoc = yaml.safe_load(f.read_text()) or {}
        if adoc.get("slug"):
            elements_by_slug[adoc["slug"]] = {s.get("element_id") for s in (adoc.get("standards") or [])}

    competitor_pillars = {}  # slug -> set of feature_teardown pillar names
    for f in sorted((CONTENT / "competitors").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        cdoc = yaml.safe_load(f.read_text()) or {}
        if cdoc.get("slug"):
            competitor_pillars[cdoc["slug"]] = {
                t.get("pillar") for t in (cdoc.get("feature_teardown") or []) if t.get("pillar")
            }
    competitor_slugs = set(competitor_pillars)

    source_ids = _load_source_ids()
    persona_slugs = _load_persona_slugs()

    for i, r in enumerate(doc.get("ratings") or []):
        where = f"ratings[{i}]"
        domain = r.get("domain")
        element_id = r.get("element_id")
        slug = r.get("competitor_slug")
        accreditor_slug = DOMAIN_TO_ACCREDITATION_SLUG.get(domain)
        if accreditor_slug is None:
            problems.append(f"{where}: domain {domain!r} is not a recognized accreditation domain")
        elif element_id not in elements_by_slug.get(accreditor_slug, set()):
            problems.append(f"{where}: element_id {element_id!r} not found in {domain}'s accreditation file")
        if slug not in competitor_slugs:
            problems.append(f"{where}: competitor_slug {slug!r} not found in content/competitors/*.yaml")

        has_sources_list = bool(r.get("sources"))
        if r.get("rating") and not r.get("source") and not has_sources_list:
            problems.append(f"{where}: rating {r.get('rating')!r} has no source (neither `source` nor `sources[]`)")

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

        for j, s in enumerate(r.get("sources") or []):
            sid = s.get("source_id")
            if sid and sid not in source_ids:
                problems.append(f"{where}.sources[{j}]: source_id {sid!r} not found in {SOURCE_HOMES_DESC}")

        ref = r.get("competitor_feature_ref")
        if ref and slug in competitor_pillars and competitor_pillars[slug] and ref not in competitor_pillars[slug]:
            problems.append(
                f"{where}: competitor_feature_ref {ref!r} not found among {slug}'s feature_teardown pillars"
            )

        for p in r.get("persona_relevance") or []:
            if p not in persona_slugs:
                problems.append(f"{where}: persona_relevance {p!r} not found in content/personas/*.yaml")

    return problems


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

    # Which Exxat capability actually does the work — read live from capability-map.yaml
    # rather than hardcoded, so a renamed/added pillar there doesn't silently drift out
    # of sync with what this file accepts.
    capability_map_path = CONTENT / "prism" / "capability-map.yaml"
    prism_pillars = set()
    if capability_map_path.exists():
        cap_doc = yaml.safe_load(capability_map_path.read_text()) or {}
        prism_pillars = {p.get("name") for p in (cap_doc.get("core_ring", {}).get("pillars") or []) if p.get("name")}

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
                problems.append(f"{where}.sources[{j}]: source_id {sid!r} not found in {SOURCE_HOMES_DESC}")
        if not (u.get("sources") or []):
            problems.append(f"{where}: no sources[] — a use case asserts something and must cite where it came from")

        for j, rf in enumerate(u.get("related_flows") or []):
            slug = (rf.get("flow") or "").replace(".yaml", "")
            if slug and slug not in flow_slugs:
                problems.append(f"{where}.related_flows[{j}]: flow {rf.get('flow')!r} not found in content/flows/")

        # prism_feature_ref names WHICH Exxat capability does the work — added
        # 2026-09-11 because a use case telling only a market/customer story without
        # naming the Prism feature behind it reads as a generic idea, not a product
        # answer. Required whenever a real pillar could plausibly do this work;
        # "no-fit-yet" is the one status allowed to omit it, since by definition no
        # pillar addresses it.
        feature_ref = u.get("prism_feature_ref")
        if feature_ref and feature_ref not in prism_pillars:
            problems.append(
                f"{where}: prism_feature_ref {feature_ref!r} not found among capability-map.yaml's pillar names"
            )
        if not feature_ref and status != "no-fit-yet":
            problems.append(
                f"{where}: status {status!r} requires a prism_feature_ref — only 'no-fit-yet' may omit it"
            )

    return problems


def check_trends_integrity():
    """content/trends/*.yaml's `sources` is a flat list of ids (not the
    {source_id} object shape ratings entries use — there's no other per-source
    metadata to hang alongside a trend); confirm every id, including inside
    addressed_by_competitors[], resolves into one of the five source homes."""
    problems = []
    source_ids = _load_source_ids()
    for f in sorted((CONTENT / "trends").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        for t in doc.get("trends") or []:
            tid = t.get("id")
            for sid in t.get("sources") or []:
                if sid not in source_ids:
                    problems.append(f"{f.name} trend {tid!r}: source id {sid!r} not found in {SOURCE_HOMES_DESC}")
            for ref in t.get("addressed_by_competitors") or []:
                sid = ref.get("source_id")
                if sid and sid not in source_ids:
                    problems.append(
                        f"{f.name} trend {tid!r}: addressed_by_competitors source_id {sid!r} not found in {SOURCE_HOMES_DESC}"
                    )
    return problems


def check_research_sources_integrity():
    """content/accreditation/*.yaml's `standards[].research_sources` (added
    2026-09-10, distinct from the accreditor's own `source` field) — confirm
    every id resolves into one of the five source homes."""
    problems = []
    source_ids = _load_source_ids()
    for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        for s in doc.get("standards") or []:
            for sid in s.get("research_sources") or []:
                if sid not in source_ids:
                    problems.append(
                        f"{f.name} {s.get('element_id')!r}: research_sources id {sid!r} not found in {SOURCE_HOMES_DESC}"
                    )
    return problems


# ---------------------------------------------------------------------------
# Phase 1 integrity checks (added 2026-09-11).
#
# Six new content families landed in Tasks 1.1-1.6 — a quarantined sales artifact
# (content/sources/vendor-comparison-chart.yaml), per-domain dissection manifests
# (content/dissection/), three new lenses, numeric market sizing
# (content/domains/*.yaml#market_sizing plus content/market/programs/), GTM work
# tracking (content/gtm/), and an optional roadmap sub-object on
# content/prism/capability-map.yaml. Every one of them was documented by a header
# comment and validated by nothing. The functions below are that validation.
#
# TWO REPORTING CHANNELS, not one. The existing integrity checks above return a
# list of problems, every one of which prints as FAIL and exits non-zero. Several
# of the rules below are deliberately WARN-only, so they get their own channel via
# _warn(): a check introduced against content that mostly cannot satisfy it yet
# guards drift without blocking. That is not a new posture invented here — it is
# the same treatment ACCREDITATION_CEILINGS documents above ("guards drift;
# non-blocking at time of writing", 2026-08-27, so bringing a previously
# unmonitored directory under the script doesn't retroactively FAIL 25 shipped
# findings), and the same words content/CONTENT-DENSITY.md uses on both the
# journeys row and the capability-map `roadmap.scope_note` row.
#
# A third channel, _coverage(), prints unconditionally even on a fully clean run —
# the same reason summarize_unresearched_accreditation() exists below: an empty
# family must never read as a researched one just because nothing FAILed.
INTEGRITY_WARNINGS = []
COVERAGE_LINES = []


def _warn(message):
    INTEGRITY_WARNINGS.append(message)


def _coverage(message):
    COVERAGE_LINES.append(message)


DOMAIN_LABELS = set(DOMAIN_TO_ACCREDITATION_SLUG)

# content/sources/registry.yaml's own header enumerates these 24 `type:` values, plus
# the origin/access enums. Mirrored here by hand, same convention as
# DOMAIN_TO_ACCREDITATION_SLUG above vs. apps/ecosystem/lib/content.ts.
SOURCE_TYPES = {
    "doc", "product-page", "analyst", "press", "newsletter", "video", "webinar",
    "review", "interview", "other", "research-paper", "dataset", "program-page",
    "conference", "podcast", "support-ticket", "rfp", "sales-call",
    "help-center-article", "playbook", "roadmap-doc", "crm-export",
    "sales-collateral", "exxat-site-update",
}
SOURCE_ORIGINS = {"first-party", "third-party"}
SOURCE_ACCESS = {"public", "internal", "confidential"}

# content/interviews/*.md front-matter. No file in this repo documents these two enums
# in prose — they are read off the four committed sessions, which is why the sets are
# small. Widening either one is a deliberate one-line edit here, made at the same time
# as the session that needs it, rather than a silently accepted new value.
SESSION_TYPES = {"internal-planning", "domain-expert"}
SESSION_EVIDENCE_STATUS = {"verbatim-cleaned", "summary-only"}

ISO_DATE_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
# capability-map.yaml's own schema comment gives this regex verbatim for roadmap.target.
ROADMAP_TARGET_RE = re.compile(r"^Q[1-4] \d{4}$|^\d{4}-(0[1-9]|1[0-2])$")
# product-gaps.yaml documents its own `target` in the other order ("YYYY-MM" or
# "YYYY-Qn"). The two families are deliberately NOT harmonized here — each regex
# matches what its own file's comment states.
PRODUCT_GAP_TARGET_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$|^\d{4}-Q[1-4]$")

VENDOR_CHART_PATH = CONTENT / "sources" / "vendor-comparison-chart.yaml"
GTM_DIR = CONTENT / "gtm"

# Field names whose VALUES are citations or pointers — the only places a reference to
# another file/id can legitimately live. Both isolation checks below scan exactly these
# rather than grepping file text, because content/ARCHITECTURE.md and
# content/CONTENT-DENSITY.md now both contain the literal string "content/gtm" in prose
# describing the isolation rule itself, and a naive substring grep would report this
# checker's own documentation as a violation.
CITATION_FIELD_NAMES = {
    "source_id", "sources", "research_sources", "answered_in", "produces",
    "grounded_in", "inputs", "flow", "path", "incumbent_evidence",
    "becomes_source_id", "template_of_record", "source",
}


def _citation_values(doc):
    """Yield (path, value) for every string leaf sitting in a citation-bearing field."""
    for path, value in walk(doc):
        leaf = path.split(".")[-1]
        if leaf.endswith("[]"):
            leaf = leaf[:-2]
        if leaf in CITATION_FIELD_NAMES:
            yield path, value


def _content_yaml_docs(skip_dirs=()):
    """Yield (path, parsed document) for every content/**/*.yaml, minus _TEMPLATE files
    and any named subdirectory. Yields the PARSED doc, not the path: both isolation scans
    below walk field values, and handing them a pathlib.Path would make walk() yield
    nothing at all — a scan that silently checks zero files and reports a clean pass."""
    skip = {(CONTENT / d).resolve() for d in skip_dirs}
    for f in sorted(CONTENT.rglob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        if any(parent.resolve() in skip for parent in f.parents):
            continue
        try:
            doc = yaml.safe_load(f.read_text())
        except (yaml.YAMLError, OSError):
            continue  # already reported by check_source_homes_integrity / the ceiling pass
        if doc:
            yield f, doc


_ACCREDITATION_ELEMENTS_CACHE = None


def _load_accreditation_elements():
    """accreditor slug -> set of element_id. Same load the two existing standards
    checks do inline; cached here because five of the new checks need it."""
    global _ACCREDITATION_ELEMENTS_CACHE
    if _ACCREDITATION_ELEMENTS_CACHE is None:
        out = {}
        for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
            if f.name.startswith("_TEMPLATE"):
                continue
            doc = yaml.safe_load(f.read_text()) or {}
            if doc.get("slug"):
                out[doc["slug"]] = {s.get("element_id") for s in (doc.get("standards") or [])}
        _ACCREDITATION_ELEMENTS_CACHE = out
    return _ACCREDITATION_ELEMENTS_CACHE


_COMPETITOR_PILLARS_CACHE = None


def _load_competitor_pillars():
    """competitor slug -> set of feature_teardown pillar names."""
    global _COMPETITOR_PILLARS_CACHE
    if _COMPETITOR_PILLARS_CACHE is None:
        out = {}
        for f in sorted((CONTENT / "competitors").glob("*.yaml")):
            if f.name.startswith("_TEMPLATE"):
                continue
            doc = yaml.safe_load(f.read_text()) or {}
            if doc.get("slug"):
                out[doc["slug"]] = {
                    t.get("pillar") for t in (doc.get("feature_teardown") or []) if t.get("pillar")
                }
        _COMPETITOR_PILLARS_CACHE = out
    return _COMPETITOR_PILLARS_CACHE


_PRISM_PILLARS_CACHE = None


def _load_prism_pillar_status():
    """capability-map.yaml core_ring pillar name -> its `status:` value. Read live rather
    than hardcoded, so a renamed or added pillar there cannot silently drift out of sync
    with what the lens files are allowed to say about it."""
    global _PRISM_PILLARS_CACHE
    if _PRISM_PILLARS_CACHE is None:
        out = {}
        path = CONTENT / "prism" / "capability-map.yaml"
        if path.exists():
            doc = yaml.safe_load(path.read_text()) or {}
            for p in (doc.get("core_ring", {}) or {}).get("pillars") or []:
                if p.get("name"):
                    out[p["name"]] = p.get("status")
        _PRISM_PILLARS_CACHE = out
    return _PRISM_PILLARS_CACHE


def _load_competitor_slugs():
    return set(_load_competitor_pillars())


def _elements_for_domain(domain):
    return _load_accreditation_elements().get(DOMAIN_TO_ACCREDITATION_SLUG.get(domain), set())


def _check_sources_list(entry, where, problems, required=True):
    """The `sources: [{source_id, locator?}]` shape shared by every new lens file."""
    sources = entry.get("sources") or []
    if required and not sources:
        problems.append(f"{where}: no sources[] — this entry asserts something and must cite where it came from")
    source_ids = _load_source_ids()
    for j, s in enumerate(sources):
        sid = s.get("source_id") if isinstance(s, dict) else None
        if not sid:
            problems.append(f"{where}.sources[{j}]: no source_id")
        elif sid not in source_ids:
            problems.append(f"{where}.sources[{j}]: source_id {sid!r} not found in {SOURCE_HOMES_DESC}")


def _check_two_value_evidence_pairing(entry, where, problems, required=True):
    """The evidence_strength/evidence_note rule shared by
    lenses/competitor-differentiation.yaml and lenses/feature-comparison-matrix.yaml.

    DELIBERATELY NOT the same rule as check_standards_ratings_integrity()'s. Both of
    those files' headers spell out the divergence and ask for a separate rule: there,
    evidence_strength is OPTIONAL, "directional" is the ONLY accepted value, and an
    omitted field is what implicitly means verified. Here it is a REQUIRED two-value
    enum, so the verified state is written down instead of inferred from an absence.
    The evidence_note BEHAVIOR is identical across all three files — required iff
    directional — because an unflagged note reads as verified either way."""
    strength = entry.get("evidence_strength")
    note = (entry.get("evidence_note") or "").strip()
    if strength is None:
        if required:
            problems.append(
                f"{where}: evidence_strength is required on every entry in this file "
                "(directional | verified) — there is no 'omit it' state here"
            )
        return
    if strength not in ("directional", "verified"):
        problems.append(f"{where}: evidence_strength {strength!r} not in ['directional', 'verified']")
        return
    if strength == "directional" and not note:
        problems.append(f"{where}: evidence_strength 'directional' requires a non-empty evidence_note")
    if strength == "verified" and note:
        problems.append(
            f"{where}: evidence_strength 'verified' forbids an evidence_note — "
            "a note next to a verified claim reads as an unstated caveat"
        )


def check_source_registry_integrity():
    """content/sources/registry.yaml — the enums its own header documents, and global
    id uniqueness. check_source_homes_integrity() above only reports files that would
    not LOAD; nothing until now looked at what a loaded entry actually says."""
    problems = []
    path = CONTENT / "sources" / "registry.yaml"
    if not path.exists():
        return problems
    doc = yaml.safe_load(path.read_text()) or {}
    seen = {}
    for i, s in enumerate(doc.get("sources") or []):
        where = f"registry.yaml sources[{i}]"
        sid = s.get("id")
        if not sid:
            problems.append(f"{where}: no id")
        elif sid in seen:
            problems.append(f"{where}: duplicate id {sid!r} (first seen at sources[{seen[sid]}])")
        else:
            seen[sid] = i
        where = f"registry.yaml {sid!r}"
        if s.get("type") not in SOURCE_TYPES:
            problems.append(f"{where}: type {s.get('type')!r} not in the registry header's 24-value enum")
        if s.get("origin") not in SOURCE_ORIGINS:
            problems.append(f"{where}: origin {s.get('origin')!r} not in {sorted(SOURCE_ORIGINS)}")
        if s.get("access") not in SOURCE_ACCESS:
            problems.append(f"{where}: access {s.get('access')!r} not in {sorted(SOURCE_ACCESS)}")
        if s.get("access") == "public" and not s.get("url"):
            problems.append(
                f"{where}: access 'public' requires a url — the registry's own rule is "
                '"an entry without a real public url: is not public"'
            )
        if not s.get("url") and not s.get("path"):
            # WARN, not FAIL: one committed entry (the internal Vishaka interview, whose
            # full record lives at content/interviews/2026-09-04-...md) deliberately has
            # neither, because its locator is the interview file rather than a URL. That
            # is a real gap worth naming — the registry entry could carry a `path:` — but
            # not a content error worth blocking the whole check on.
            _warn(f"{where}: has neither url nor path, so the entry names no locator a reader can open")
    return problems


def check_sessions_integrity():
    """content/interviews/*.md front-matter (added 2026-09-11 as the session schema).

    `programs[]` is deliberately NOT resolved: content/market/programs/ holds only its
    _TEMPLATE today, so every value there would be a forward reference. Resolving it is
    Phase 2/3 work, once real per-domain program registries exist."""
    problems = []
    interviews = CONTENT / "interviews"
    if not interviews.is_dir():
        return problems
    seen = {}
    for f in sorted(interviews.glob("*.md")):
        if f.name.startswith("_TEMPLATE"):
            continue
        fm = _load_front_matter(f, problems)
        if fm is None:
            continue
        where = f.name
        sid = fm.get("id")
        if not sid:
            problems.append(f"{where}: front-matter has no id")
        elif sid in seen:
            problems.append(f"{where}: duplicate session id {sid!r} (also in {seen[sid]})")
        else:
            seen[sid] = where
        if fm.get("type") not in SESSION_TYPES:
            problems.append(f"{where}: type {fm.get('type')!r} not in {sorted(SESSION_TYPES)}")
        if fm.get("evidence_status") not in SESSION_EVIDENCE_STATUS:
            problems.append(
                f"{where}: evidence_status {fm.get('evidence_status')!r} not in {sorted(SESSION_EVIDENCE_STATUS)}"
            )
        if fm.get("access") not in SOURCE_ACCESS:
            problems.append(f"{where}: access {fm.get('access')!r} not in {sorted(SOURCE_ACCESS)}")
        date = fm.get("date")
        if not isinstance(date, str) or not ISO_DATE_RE.match(date):
            problems.append(f"{where}: date {date!r} is not an ISO YYYY-MM-DD string")
        for d in fm.get("domains") or []:
            if d not in DOMAIN_LABELS:
                problems.append(f"{where}: domains value {d!r} is not a recognized domain label")
    return problems


def check_support_ticket_snapshots_integrity():
    """content/sources/support-tickets/*.yaml — the PII gate that family's own template
    calls "the one rule this family lives or dies by". snapshot_zendesk.py always writes
    `redacted: false` and is not allowed to write true, because "a human has read this and
    there is no personal data in it" is not something a script can know. A missing or
    false `redacted` on a COMMITTED snapshot is therefore a hard FAIL, never a WARN."""
    problems = []
    tickets_dir = CONTENT / "sources" / "support-tickets"
    if not tickets_dir.is_dir():
        return problems
    for f in sorted(tickets_dir.glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        snapshot = doc.get("snapshot") or {}
        if not snapshot.get("taken"):
            problems.append(f"{f.name}: snapshot.taken is missing — a snapshot with no date is not a snapshot")
        if not (snapshot.get("selection_method") or "").strip():
            problems.append(
                f"{f.name}: snapshot.selection_method is empty — without it a reader cannot judge "
                "the selection bias, which this family's template calls its most important field"
            )
        for i, t in enumerate(doc.get("tickets") or []):
            if t.get("redacted") is not True:
                problems.append(
                    f"{f.name} tickets[{i}] ({t.get('source_id')!r}): redacted is {t.get('redacted')!r}, "
                    "not true — a snapshot may not be committed until a human has read and redacted every ticket"
                )
    return problems


def check_product_gaps_integrity():
    """content/lenses/product-gaps.yaml. NOTE this file carries NO evidence_strength /
    evidence_note pair — only competitor-differentiation.yaml and
    feature-comparison-matrix.yaml do — so _check_two_value_evidence_pairing() is
    deliberately not called here."""
    problems = []
    path = CONTENT / "lenses" / "product-gaps.yaml"
    if not path.exists():
        return problems
    doc = yaml.safe_load(path.read_text()) or {}
    kinds = {"missing-module", "shallow-integration", "wrong-depth", "wrong-entity",
             "data-not-ingested", "ux", "non-product"}
    build_shapes = {"transfer", "configure", "build", "partner", "buy"}
    severities = {"blocking", "material", "nice-to-have"}
    demand = {"rfp", "support-ticket", "lost-deal", "customer-request", "expert-assertion", "inferred"}
    blocks_values = {"deal", "standard", "renewal", "expansion"}
    # 3 values, NOT the 4 feature-comparison-matrix.yaml's exxat_cells[] uses. The extra
    # `partial` there is deliberate (a matrix row is narrower than a gap and can land
    # between shipped and absent) — the two enums are not harmonized on purpose.
    statuses = {"shipped", "roadmap", "absent"}

    pillar_status = _load_prism_pillar_status()
    competitor_slugs = _load_competitor_slugs()
    persona_slugs = _load_persona_slugs()
    source_ids = _load_source_ids()
    seen = {}

    gaps = doc.get("gaps") or []
    for i, g in enumerate(gaps):
        where = f"product-gaps.yaml gaps[{i}] ({g.get('id')!r})"
        gid = g.get("id")
        if not gid:
            problems.append(f"{where}: no id")
        elif gid in seen:
            problems.append(f"{where}: duplicate id {gid!r} (first seen at gaps[{seen[gid]}])")
        else:
            seen[gid] = i
        domain = g.get("domain")
        if domain not in DOMAIN_LABELS:
            problems.append(f"{where}: domain {domain!r} is not a recognized domain label")
        if not (g.get("gap") or "").strip():
            problems.append(f"{where}: gap headline is empty")
        for field, allowed in (("kind", kinds), ("build_shape", build_shapes),
                               ("severity", severities), ("demand_evidence", demand)):
            if g.get(field) not in allowed:
                problems.append(f"{where}: {field} {g.get(field)!r} not in {sorted(allowed)}")
        blocks = g.get("blocks") or []
        if not blocks:
            problems.append(f"{where}: blocks[] is empty — a gap must name what it actually blocks")
        for b in blocks:
            if b not in blocks_values:
                problems.append(f"{where}: blocks value {b!r} not in {sorted(blocks_values)}")

        ref = g.get("prism_feature_ref")
        status = g.get("prism_status")
        if status not in statuses:
            problems.append(f"{where}: prism_status {status!r} not in {sorted(statuses)}")
        if ref is not None and ref not in pillar_status:
            problems.append(f"{where}: prism_feature_ref {ref!r} not found among capability-map.yaml's pillar names")
        elif ref is None and status in statuses and status != "absent":
            problems.append(
                f"{where}: prism_status {status!r} with prism_feature_ref: null — "
                "'absent' is the value that pairs with a null ref"
            )
        elif ref is not None and status in statuses and status != pillar_status.get(ref):
            # The anti-drift check: this file may not quietly claim a different shipping
            # status for a pillar than capability-map.yaml, the file that owns that fact.
            problems.append(
                f"{where}: prism_status {status!r} disagrees with capability-map.yaml, which states "
                f"{pillar_status.get(ref)!r} for pillar {ref!r}"
            )

        # The rule product-gaps.yaml's own header states as an INTEGRITY RULE: a blocking
        # claim needs stronger evidence than an inference.
        if g.get("severity") == "blocking" and g.get("demand_evidence") == "inferred":
            problems.append(
                f"{where}: severity 'blocking' with demand_evidence 'inferred' — "
                "find the RFP, ticket or lost deal that says so, or lower the severity"
            )

        for e in g.get("element_ids") or []:
            if domain in DOMAIN_LABELS and e not in _elements_for_domain(domain):
                problems.append(f"{where}: element_id {e!r} not found in {domain}'s accreditation file")
        for j, c in enumerate(g.get("competitor_has_it") or []):
            slug = c.get("competitor_slug") if isinstance(c, dict) else None
            if slug not in competitor_slugs:
                problems.append(f"{where}.competitor_has_it[{j}]: competitor_slug {slug!r} not found in content/competitors/")
            sid = c.get("source_id") if isinstance(c, dict) else None
            if sid and sid not in source_ids:
                problems.append(f"{where}.competitor_has_it[{j}]: source_id {sid!r} not found in {SOURCE_HOMES_DESC}")
        for p in g.get("audience") or []:
            if p not in persona_slugs:
                problems.append(f"{where}: audience {p!r} not found in content/personas/*.yaml")
        target = g.get("target")
        if target is not None and not PRODUCT_GAP_TARGET_RE.match(str(target)):
            problems.append(f"{where}: target {target!r} is not 'YYYY-MM' or 'YYYY-Qn' (this file's documented form)")
        _check_sources_list(g, where, problems)

    _coverage(f"product gaps: {len(gaps)} gap(s) across {len({g.get('domain') for g in gaps})} domain(s)")
    return problems


def check_competitor_differentiation_integrity():
    """content/lenses/competitor-differentiation.yaml — the head-to-head reasoning lens.
    Unlike product-gaps.yaml, this file DOES carry the evidence_strength/evidence_note
    pair, on a required two-value enum of its own (see
    _check_two_value_evidence_pairing)."""
    problems = []
    path = CONTENT / "lenses" / "competitor-differentiation.yaml"
    if not path.exists():
        return problems
    doc = yaml.safe_load(path.read_text()) or {}
    axes = {"product", "data", "integration", "distribution", "price", "incumbency",
            "compliance", "services"}
    directions = {"competitor-advantage", "exxat-advantage", "parity", "unknown"}
    counter_statuses = {"proposed", "in-flight", "shipped", "rejected", "no-answer-yet"}

    competitor_pillars = _load_competitor_pillars()
    pillar_status = _load_prism_pillar_status()
    persona_slugs = _load_persona_slugs()

    rows = doc.get("differentiators") or []
    for i, d in enumerate(rows):
        where = f"competitor-differentiation.yaml differentiators[{i}]"
        domain = d.get("domain")
        if domain not in DOMAIN_LABELS:
            problems.append(f"{where}: domain {domain!r} is not a recognized domain label")
        slug = d.get("competitor_slug")
        if slug not in competitor_pillars:
            problems.append(f"{where}: competitor_slug {slug!r} not found in content/competitors/*.yaml")
        for field, allowed in (("axis", axes), ("direction", directions),
                               ("counter_move_status", counter_statuses)):
            if d.get(field) not in allowed:
                problems.append(f"{where}: {field} {d.get(field)!r} not in {sorted(allowed)}")
        if not (d.get("claim") or "").strip():
            problems.append(f"{where}: claim is empty")
        ref = d.get("prism_feature_ref")
        if ref is not None and ref not in pillar_status:
            problems.append(f"{where}: prism_feature_ref {ref!r} not found among capability-map.yaml's pillar names")
        cref = d.get("competitor_feature_ref")
        if cref is not None and slug in competitor_pillars and competitor_pillars[slug] and cref not in competitor_pillars[slug]:
            problems.append(
                f"{where}: competitor_feature_ref {cref!r} not found among {slug}'s own feature_teardown pillars"
            )
        _check_two_value_evidence_pairing(d, where, problems)
        for p in d.get("persona_relevance") or []:
            if p not in persona_slugs:
                problems.append(f"{where}: persona_relevance {p!r} not found in content/personas/*.yaml")
        _check_sources_list(d, where, problems)

    _coverage(
        f"competitor differentiation: {len(rows)} entry(ies) across "
        f"{len({(d.get('domain'), d.get('competitor_slug')) for d in rows})} domain x competitor pair(s)"
    )
    return problems


def _vendor_chart_ids():
    """Every id minted by the quarantined sales artifact. Today that is exactly one
    (artifact.id), but reading it from the file rather than hardcoding the string means a
    second quarantined id added later is covered without editing this checker."""
    ids = set()
    if not VENDOR_CHART_PATH.exists():
        return ids
    doc = yaml.safe_load(VENDOR_CHART_PATH.read_text()) or {}
    artifact = doc.get("artifact") or {}
    if artifact.get("id"):
        ids.add(artifact["id"])
    return ids


def check_feature_comparison_matrix_integrity():
    """content/lenses/feature-comparison-matrix.yaml — and in particular the cells[] /
    exxat_cells[] join, which is this phase's core anti-fabrication device.

    The quarantined sales chart marks EXXAT present on 81 of 81 rows with zero per-row
    evidence. That cannot recur here structurally, not just by convention: every
    capability_id that appears in cells[] must also appear in exxat_cells[], either as a
    real sourced verdict held to the identical evidence standard as any competitor's, or
    explicitly carrying exxat_coverage: "unresearched" — which makes "we haven't looked at
    our own product here" a visible, countable state rather than a missing row."""
    problems = []
    path = CONTENT / "lenses" / "feature-comparison-matrix.yaml"
    if not path.exists():
        return problems
    doc = yaml.safe_load(path.read_text()) or {}
    ratings = {"fully-meeting", "partially-meeting", "not-meeting"}
    # 4 values — one more than product-gaps.yaml's. See that file's note: `partial` is
    # for a pillar that ships but whose specific capability on this row does not.
    exxat_statuses = {"shipped", "roadmap", "partial", "absent"}

    competitor_pillars = _load_competitor_pillars()
    pillar_status = _load_prism_pillar_status()
    persona_slugs = _load_persona_slugs()
    quarantined = _vendor_chart_ids()

    cells = doc.get("cells") or []
    exxat_cells = doc.get("exxat_cells") or []

    seen_cell_keys = {}
    capability_ids_by_domain = {}
    for i, c in enumerate(cells):
        where = f"feature-comparison-matrix.yaml cells[{i}] ({c.get('capability_id')!r})"
        domain = c.get("domain")
        if domain not in DOMAIN_LABELS:
            problems.append(f"{where}: domain {domain!r} is not a recognized domain label")
        pillar = c.get("pillar")
        if pillar not in pillar_status:
            problems.append(f"{where}: pillar {pillar!r} not found among capability-map.yaml's pillar names")
        cap_id = c.get("capability_id")
        if not cap_id:
            problems.append(f"{where}: no capability_id")
        slug = c.get("competitor_slug")
        if slug not in competitor_pillars:
            problems.append(f"{where}: competitor_slug {slug!r} not found in content/competitors/*.yaml")
        # A capability_id is a ROW, so it legitimately repeats once per competitor; what
        # must be unique is the (domain, capability_id, competitor_slug) cell itself.
        key = (domain, cap_id, slug)
        if cap_id and key in seen_cell_keys:
            problems.append(f"{where}: duplicate cell for {key!r} (first seen at cells[{seen_cell_keys[key]}])")
        else:
            seen_cell_keys[key] = i
        if cap_id:
            capability_ids_by_domain.setdefault(domain, set()).add(cap_id)
        if not (c.get("capability") or "").strip():
            problems.append(f"{where}: capability label is empty")
        if c.get("rating") not in ratings:
            problems.append(f"{where}: rating {c.get('rating')!r} not in {sorted(ratings)}")
        cref = c.get("competitor_feature_ref")
        if cref is not None and slug in competitor_pillars and competitor_pillars[slug] and cref not in competitor_pillars[slug]:
            problems.append(f"{where}: competitor_feature_ref {cref!r} not found among {slug}'s feature_teardown pillars")
        _check_two_value_evidence_pairing(c, where, problems)
        for e in c.get("element_ids") or []:
            if domain in DOMAIN_LABELS and e not in _elements_for_domain(domain):
                problems.append(f"{where}: element_id {e!r} not found in {domain}'s accreditation file")
        for p in c.get("persona_relevance") or []:
            if p not in persona_slugs:
                problems.append(f"{where}: persona_relevance {p!r} not found in content/personas/*.yaml")
        _check_sources_list(c, where, problems)
        for j, s in enumerate(c.get("sources") or []):
            if isinstance(s, dict) and s.get("source_id") in quarantined:
                problems.append(
                    f"{where}.sources[{j}]: cites {s.get('source_id')!r}, an id from the quarantined "
                    "vendor-comparison-chart.yaml — the rigorous matrix may never rest on the sales chart"
                )

    exxat_by_key = {}
    for i, e in enumerate(exxat_cells):
        where = f"feature-comparison-matrix.yaml exxat_cells[{i}] ({e.get('capability_id')!r})"
        domain = e.get("domain")
        if domain not in DOMAIN_LABELS:
            problems.append(f"{where}: domain {domain!r} is not a recognized domain label")
        cap_id = e.get("capability_id")
        if not cap_id:
            problems.append(f"{where}: no capability_id")
        key = (domain, cap_id)
        if cap_id and key in exxat_by_key:
            problems.append(f"{where}: duplicate exxat cell for {key!r} (first seen at exxat_cells[{exxat_by_key[key]}])")
        else:
            exxat_by_key[key] = i
        coverage = e.get("exxat_coverage")
        if coverage is not None and coverage != "unresearched":
            problems.append(
                f"{where}: exxat_coverage {coverage!r} — the only accepted value is 'unresearched' (or omit the field)"
            )
        unresearched = coverage == "unresearched"
        if cap_id and key not in {(d, cid) for d, ids in capability_ids_by_domain.items() for cid in ids}:
            problems.append(
                f"{where}: capability_id {cap_id!r} does not appear in cells[] for domain {domain!r} — "
                "exxat_cells[] is Exxat's side of a row that exists, not a row of its own"
            )
        status = e.get("prism_status")
        ref = e.get("prism_feature_ref")
        if status not in exxat_statuses:
            problems.append(f"{where}: prism_status {status!r} not in {sorted(exxat_statuses)}")
        if ref is not None and ref not in pillar_status:
            problems.append(f"{where}: prism_feature_ref {ref!r} not found among capability-map.yaml's pillar names")
        elif ref is None and status in exxat_statuses and status != "absent":
            problems.append(
                f"{where}: prism_status {status!r} with prism_feature_ref: null — 'absent' pairs with a null ref"
            )
        elif ref is not None and status in exxat_statuses and status not in (pillar_status.get(ref), "partial"):
            problems.append(
                f"{where}: prism_status {status!r} disagrees with capability-map.yaml, which states "
                f"{pillar_status.get(ref)!r} for pillar {ref!r} ('partial' is the one allowed narrowing)"
            )
        if unresearched:
            # A row with nothing to report must report nothing: a rating on an
            # "unresearched" row is exactly the unevidenced X this whole design prevents.
            for field in ("rating", "rationale", "evidence_strength"):
                if e.get(field):
                    problems.append(
                        f"{where}: exxat_coverage 'unresearched' but {field} is set — "
                        "an unresearched row has no finding to state"
                    )
        else:
            if e.get("rating") not in ratings:
                problems.append(f"{where}: rating {e.get('rating')!r} not in {sorted(ratings)}")
            _check_two_value_evidence_pairing(e, where, problems)
            _check_sources_list(e, where, problems)
            for j, s in enumerate(e.get("sources") or []):
                if isinstance(s, dict) and s.get("source_id") in quarantined:
                    problems.append(
                        f"{where}.sources[{j}]: cites {s.get('source_id')!r}, an id from the quarantined "
                        "vendor-comparison-chart.yaml"
                    )

    # THE isolation rule. Stated as an INTEGRITY RULE in the file's own header and
    # enforced here for the first time.
    for domain, cap_ids in sorted(capability_ids_by_domain.items(), key=lambda kv: str(kv[0])):
        for cap_id in sorted(cap_ids):
            if (domain, cap_id) not in exxat_by_key:
                problems.append(
                    f"feature-comparison-matrix.yaml: capability_id {cap_id!r} ({domain}) is rated for a "
                    "competitor in cells[] but has no exxat_cells[] entry — every row must state Exxat's "
                    'own side, as a sourced verdict or as exxat_coverage: "unresearched"'
                )

    # Unconditional, printed even at zero: "N of M cells rated" is the number that stops an
    # empty matrix from reading as a finished one. M counts the in-scope competitors per
    # domain from that domain's dissection manifest incumbent_set (excluding
    # role: "not-a-target"), falling back to the competitors already appearing in cells[]
    # for that domain when no manifest exists yet.
    in_scope = _dissection_incumbents_by_domain_label()
    possible = 0
    for domain, cap_ids in capability_ids_by_domain.items():
        competitors = in_scope.get(domain) or {c.get("competitor_slug") for c in cells if c.get("domain") == domain}
        possible += len(cap_ids) * len(competitors)
    _coverage(
        f"feature comparison matrix: {len(cells)} of {possible} domain x capability x competitor cells rated "
        f"({len(exxat_cells)} exxat cell(s) across "
        f"{sum(len(v) for v in capability_ids_by_domain.values())} capability row(s))"
    )
    return problems


def _dissection_incumbents_by_domain_label():
    """domain LABEL -> set of in-scope competitor slugs, from the dissection manifests.

    Note the label translation: a manifest's top-level `domain:` deliberately carries the
    RAW content/domains/<slug>.yaml value ("MD" for Medicine), while every lens joins on
    the app label ("Medicine"). Both conventions are correct for their own purpose and are
    not harmonized — they are translated here, at the one place the two meet."""
    out = {}
    raw_to_label = _domain_raw_to_label()
    for f in sorted((CONTENT / "dissection").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        label = raw_to_label.get(doc.get("domain"), doc.get("domain"))
        slugs = {
            e.get("competitor_slug")
            for e in (doc.get("incumbent_set") or [])
            if isinstance(e, dict) and e.get("role") != "not-a-target" and e.get("competitor_slug")
        }
        if slugs:
            out.setdefault(label, set()).update(slugs)
    return out


_DOMAIN_RAW_CACHE = None


def _domain_raw_to_label():
    """content/domains/<slug>.yaml's own raw `domain:` value -> the app-level label.

    medicine.yaml says `domain: "MD"`; the label every lens and the accreditation
    crosswalk join on is "Medicine". DO, Pharmacy and Dentistry are spelled identically in
    both places, which is exactly why the one that differs is easy to miss."""
    global _DOMAIN_RAW_CACHE
    if _DOMAIN_RAW_CACHE is None:
        by_slug_label = {
            "medicine": "Medicine", "do": "DO", "pharmacy": "Pharmacy", "dentistry": "Dentistry",
        }
        out = {}
        for f in sorted((CONTENT / "domains").glob("*.yaml")):
            if f.name.startswith("_TEMPLATE"):
                continue
            doc = yaml.safe_load(f.read_text()) or {}
            raw = doc.get("domain")
            label = by_slug_label.get(f.stem)
            if raw and label:
                out[raw] = label
        _DOMAIN_RAW_CACHE = out
    return _DOMAIN_RAW_CACHE


def check_market_sizing_integrity():
    """content/domains/*.yaml#market_sizing — the numeric sibling of the prose `market:`
    block. Every rule here comes from the block's own header comment: a number goes in
    only when it is sourced, and an all-null block with confidence "low" is an honest
    state rather than an unfinished one.

    org_structure.buying_roles[] is validated alongside it: it landed in the same commit,
    its `note` is already ceilinged above, and an unresolvable persona_ref there is the
    same class of dangling reference every other check in this file catches."""
    problems = []
    trends = {"growing", "stable", "declining", "recovering", "unknown"}
    confidences = {"low", "medium", "high"}
    acv_confidences = {"unknown", "low", "medium", "high"}
    decision_roles = {"economic-buyer", "champion", "user", "blocker", "influencer"}
    source_ids = _load_source_ids()
    persona_slugs = _load_persona_slugs()

    populated_domains = []
    for f in sorted((CONTENT / "domains").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        ms = doc.get("market_sizing")
        if not isinstance(ms, dict):
            problems.append(f"{f.name}: no market_sizing block")
            continue
        where = f"{f.name} market_sizing"

        as_of = ms.get("as_of")
        if not isinstance(as_of, str) or not ISO_DATE_RE.match(as_of):
            problems.append(f"{where}.as_of: {as_of!r} is not an ISO YYYY-MM-DD string")
        if not (ms.get("unit") or "").strip():
            problems.append(f"{where}.unit: empty — every count below is counted in something")
        if ms.get("confidence") not in confidences:
            problems.append(f"{where}.confidence: {ms.get('confidence')!r} not in {sorted(confidences)}")

        def num(path_):
            node = ms
            for part in path_.split(".")[:-1]:
                node = (node or {}).get(part) or {}
            return (node or {}).get(path_.split(".")[-1])

        # (numeric field, the source_id field that must back it). A number with no
        # resolving source is the exact failure the block's header warns about: uncited
        # prose copied down becomes uncited machine-readable numbers, which read as more
        # authoritative while being no better sourced.
        backed = [
            ("tam.programs", "tam.source_id"),
            ("accredited_programs.count", "accredited_programs.source_id"),
            ("enrollment.students", "enrollment.source_id"),
            ("enrollment.as_of_year", "enrollment.source_id"),
            ("enrollment.yoy_pct", "enrollment.source_id"),
            ("current_clients.count", "current_clients.source_id"),
            ("churned_clients.count", "churned_clients.source_id"),
            ("adjacency.cross_discipline_overlap_institutions", "adjacency.source_id"),
        ]
        # Every numeric leaf, including the ones with no source_id field of their own
        # (sam/som/acv/penetration/revenue are derived or argued, not sourced directly).
        numeric_fields = [p for p, _ in backed] + [
            "sam.programs", "som.programs", "penetration_pct", "acv.value_usd", "revenue_potential_usd",
        ]
        for field in numeric_fields:
            value = num(field)
            if value is None:
                continue
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                problems.append(
                    f"{where}.{field}: {value!r} is a {type(value).__name__}, not a number — "
                    "this block exists so a check or a scorecard can do arithmetic on it"
                )
        for field, source_field in backed:
            if num(field) is None:
                continue
            sid = num(source_field)
            if not sid:
                problems.append(f"{where}.{field}: is set but {source_field} is null — an unsourced number")
            elif sid not in source_ids:
                problems.append(f"{where}.{source_field}: source_id {sid!r} not found in {SOURCE_HOMES_DESC}")

        # sam/som carry no source_id of their own by design: sam is derived from tam by a
        # stated filter, som is argued rather than counted.
        if num("sam.programs") is not None:
            if not (ms.get("sam") or {}).get("derived_from"):
                problems.append(f"{where}.sam.programs: set but sam.derived_from is empty — say which filters got you here")
            if not ((ms.get("tam") or {}).get("source_id")):
                problems.append(f"{where}.sam.programs: set but tam.source_id is null — sam is derived from an unsourced tam")
        if num("som.programs") is not None and not ((ms.get("som") or {}).get("basis") or "").strip():
            problems.append(f"{where}.som.programs: set but som.basis is empty")

        acv = ms.get("acv") or {}
        if acv.get("confidence") not in acv_confidences:
            problems.append(f"{where}.acv.confidence: {acv.get('confidence')!r} not in {sorted(acv_confidences)}")
        if acv.get("value_usd") is not None and not (acv.get("basis") or "").strip():
            problems.append(f"{where}.acv.value_usd: set but acv.basis is empty")
        # The block's own HARD RULE, verbatim: a revenue number standing on an unsourced
        # ACV is a guess wearing a dollar sign.
        if ms.get("revenue_potential_usd") is not None and acv.get("value_usd") is None:
            problems.append(
                f"{where}.revenue_potential_usd: set while acv.value_usd is null — "
                "a revenue number standing on an unsourced ACV is a guess wearing a dollar sign"
            )

        enrollment = ms.get("enrollment") or {}
        if enrollment.get("trend") is not None and enrollment.get("trend") not in trends:
            problems.append(f"{where}.enrollment.trend: {enrollment.get('trend')!r} not in {sorted(trends)}")

        # WARN, not FAIL: penetration_pct is a derived convenience field, and a rounding
        # convention this checker doesn't know about is likelier than a wrong number.
        tam_programs = num("tam.programs")
        clients = num("current_clients.count")
        stated = ms.get("penetration_pct")
        if isinstance(tam_programs, (int, float)) and tam_programs and isinstance(clients, (int, float)) \
                and isinstance(stated, (int, float)):
            derived = 100.0 * clients / tam_programs
            if abs(derived - stated) > 0.5:
                _warn(
                    f"{where}.penetration_pct: states {stated} but "
                    f"current_clients.count / tam.programs derives {derived:.1f}"
                )

        if any(num(field) is not None for field in numeric_fields):
            populated_domains.append(f.stem)

        org = doc.get("org_structure") or {}
        for i, role in enumerate(org.get("buying_roles") or []):
            rwhere = f"{f.name} org_structure.buying_roles[{i}]"
            ref = role.get("persona_ref")
            if ref and ref not in persona_slugs:
                problems.append(f"{rwhere}: persona_ref {ref!r} not found in content/personas/*.yaml")
            if role.get("decision_role") not in decision_roles:
                problems.append(f"{rwhere}: decision_role {role.get('decision_role')!r} not in {sorted(decision_roles)}")

    _coverage(
        "market sizing: "
        + (f"{len(populated_domains)} domain(s) carry at least one number ({', '.join(sorted(populated_domains))})"
           if populated_domains else "0 domains carry a single non-null number yet — every block is honestly all-null")
    )
    return problems


# A mechanical PII gate for content/market/programs/*.yaml. Deliberately crude and
# deliberately in this file rather than in a reviewer's head: the family's own template
# says contact names/emails/phone numbers are NOT mirrored out of the source export, and
# the support-ticket family next door already learned that "a human will notice" is not a
# control. These two patterns catch the two shapes that actually leak from a CRM export.
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?<!\d)(?:\+1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}(?!\d)")


def check_market_programs_integrity():
    """content/market/programs/*.yaml — the per-program ground-truth registry under each
    domain's market_sizing block. Holds only _TEMPLATE.yaml today, so this runs over zero
    real files; the empty case is the normal one and is handled without complaint."""
    problems = []
    programs_dir = CONTENT / "market" / "programs"
    if not programs_dir.is_dir():
        return problems
    accreditation_statuses = {"accredited", "candidate", "precandidate", "probation", "closing", "unknown"}
    exxat_statuses = {"client", "churned", "prospect", "not-tracked"}
    competitor_slugs = _load_competitor_slugs()
    source_ids = _load_source_ids()

    total_rows = 0
    files = 0
    for f in sorted(programs_dir.glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        files += 1
        doc = yaml.safe_load(f.read_text()) or {}
        if doc.get("domain") not in DOMAIN_LABELS:
            problems.append(f"{f.name}: domain {doc.get('domain')!r} is not a recognized domain label")
        sor = doc.get("source_of_record") or {}
        programs = doc.get("programs") or []
        total_rows += len(programs)
        if sor.get("row_count") != len(programs):
            problems.append(
                f"{f.name}: source_of_record.row_count is {sor.get('row_count')!r} but programs[] holds "
                f"{len(programs)} row(s) — they are updated together or not at all"
            )
        sid = sor.get("source_id")
        # null is a legitimate, honest unpopulated state (no export has been registered
        # for this domain yet), NOT a broken reference. Only a non-null id must resolve.
        if sid is not None and sid not in source_ids:
            problems.append(f"{f.name}: source_of_record.source_id {sid!r} not found in {SOURCE_HOMES_DESC}")

        seen = {}
        for i, p in enumerate(programs):
            where = f"{f.name} programs[{i}] ({p.get('slug')!r})"
            slug = p.get("slug")
            if not slug:
                problems.append(f"{where}: no slug")
            elif slug in seen:
                problems.append(f"{where}: duplicate slug {slug!r} (first seen at programs[{seen[slug]}])")
            else:
                seen[slug] = i
            if p.get("accreditation_status") not in accreditation_statuses:
                problems.append(
                    f"{where}: accreditation_status {p.get('accreditation_status')!r} not in {sorted(accreditation_statuses)}"
                )
            if p.get("exxat_status") not in exxat_statuses:
                problems.append(f"{where}: exxat_status {p.get('exxat_status')!r} not in {sorted(exxat_statuses)}")
            incumbent = p.get("incumbent_vendor")
            if incumbent != "unknown" and incumbent not in competitor_slugs:
                problems.append(
                    f"{where}: incumbent_vendor {incumbent!r} is neither 'unknown' nor a content/competitors/ slug — "
                    "'unknown' is a real, countable answer; a guess is not"
                )
            elif incumbent != "unknown" and not p.get("incumbent_evidence"):
                problems.append(f"{where}: incumbent_vendor {incumbent!r} requires an incumbent_evidence source_id")
            ev = p.get("incumbent_evidence")
            if ev and ev not in source_ids:
                problems.append(f"{where}: incumbent_evidence {ev!r} not found in {SOURCE_HOMES_DESC}")
            _check_sources_list(p, where, problems)

        for path, value in walk(doc):
            if EMAIL_RE.search(value):
                problems.append(
                    f"{f.name} {path}: looks like it contains an email address — contact PII stays in the "
                    "source system and is never mirrored into content/"
                )
            if PHONE_RE.search(value):
                problems.append(
                    f"{f.name} {path}: looks like it contains a phone number — contact PII stays in the "
                    "source system and is never mirrored into content/"
                )

    _coverage(f"market program registry: {files} domain file(s), {total_rows} program row(s)")
    return problems


DISSECTION_QUESTION_KEYS = [
    "features-to-build",
    "competitor-differentiation",
    "market-size",
    "feature-comparison",
    "standards-to-product",
    "persona-and-document-lens",
]
# content/dissection/_TEMPLATE.yaml's persona-and-document-lens question points at no file
# at all: the answer is computed from tags and sources[] already carried by the lenses
# above it. The value is a prose marker, not a path, and must never be resolved as one.
DISSECTION_COMPUTED_PREFIX = "computed — "


def check_dissection_integrity():
    """content/dissection/*.yaml — the per-domain manifest family. Holds only
    _TEMPLATE.yaml today, so this is written for the empty case first.

    The top-level `domain:` here is the ONE field in this phase that carries the RAW
    content/domains/<slug>.yaml value rather than the app label — so Medicine's manifest
    says "MD", not "Medicine". That is correct and deliberate (the manifest mirrors the
    domain file it is the manifest FOR), and is the opposite convention from every lens
    and gtm file, whose per-row `domain:` joins against sibling lenses and therefore uses
    the label. The two are not harmonized; they are translated where they meet, in
    _dissection_incumbents_by_domain_label()."""
    problems = []
    dissection_dir = CONTENT / "dissection"
    if not dissection_dir.is_dir():
        return problems
    coverages = {"none", "stub", "partial", "researched"}
    confidences = {"low", "medium", "high"}
    roles = {"primary", "switch-target", "adjacent", "secondary", "not-a-target"}

    raw_domain_values = set(_domain_raw_to_label())
    competitor_slugs = _load_competitor_slugs()
    source_ids = _load_source_ids()
    scorecard = yaml.safe_load((CONTENT / "scorecard" / "where-to-play.yaml").read_text()) or {}
    gtm_target = scorecard.get("actual_gtm_target")

    files = 0
    for f in sorted(dissection_dir.glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        files += 1
        doc = yaml.safe_load(f.read_text()) or {}
        where = f.name
        raw_domain = doc.get("domain")
        if raw_domain not in raw_domain_values:
            problems.append(
                f"{where}: domain {raw_domain!r} does not match any content/domains/*.yaml file's own "
                f"`domain:` value ({sorted(raw_domain_values)}) — a manifest mirrors the RAW value, not the app label"
            )
        if doc.get("slug") != f.stem:
            problems.append(f"{where}: slug {doc.get('slug')!r} does not match the filename")
        last_reviewed = doc.get("last_reviewed")
        if not isinstance(last_reviewed, str) or not ISO_DATE_RE.match(last_reviewed):
            problems.append(f"{where}: last_reviewed {last_reviewed!r} is not an ISO YYYY-MM-DD string")
        tor = doc.get("template_of_record")
        if tor is not None and tor not in source_ids:
            problems.append(f"{where}: template_of_record {tor!r} not found in {SOURCE_HOMES_DESC}")

        # is_gtm_target is true only for the domain named in where-to-play.yaml's
        # actual_gtm_target — deliberately NOT its recommended_beachhead, which the GTM
        # decision has already overridden once (DO scores higher; Pharmacy was chosen).
        label = _domain_raw_to_label().get(raw_domain)
        if doc.get("is_gtm_target") and label and gtm_target and label != gtm_target:
            problems.append(
                f"{where}: is_gtm_target is true but where-to-play.yaml's actual_gtm_target is {gtm_target!r}"
            )

        for i, inc in enumerate(doc.get("incumbent_set") or []):
            iwhere = f"{where} incumbent_set[{i}]"
            slug = inc.get("competitor_slug")
            if slug not in competitor_slugs:
                problems.append(f"{iwhere}: competitor_slug {slug!r} not found in content/competitors/*.yaml")
            role = inc.get("role")
            if role not in roles:
                problems.append(f"{iwhere}: role {role!r} not in {sorted(roles)}")
            reason = (inc.get("exclusion_reason") or "").strip()
            if role == "not-a-target" and not reason:
                problems.append(f"{iwhere}: role 'not-a-target' requires an exclusion_reason")
            if role != "not-a-target" and reason:
                problems.append(
                    f"{iwhere}: exclusion_reason is set on role {role!r} — a reason written next to an "
                    "in-scope vendor reads as an exclusion that never happened"
                )

        questions = doc.get("questions") or []
        keys = [q.get("key") for q in questions]
        # The template states "exactly these six keys, always all six, in this order".
        if keys != DISSECTION_QUESTION_KEYS:
            problems.append(
                f"{where}: questions[].key is {keys!r}; the manifest family fixes it at "
                f"{DISSECTION_QUESTION_KEYS!r} — all six, in that order. An unanswered question is "
                "recorded with coverage 'none', never by omitting the key"
            )
        answered = 0
        for i, q in enumerate(questions):
            qwhere = f"{where} questions[{i}] ({q.get('key')!r})"
            coverage = q.get("coverage")
            if coverage not in coverages:
                problems.append(f"{qwhere}: coverage {coverage!r} not in {sorted(coverages)}")
            if q.get("confidence") not in confidences:
                problems.append(f"{qwhere}: confidence {q.get('confidence')!r} not in {sorted(confidences)}")
            gap_note = (q.get("gap_note") or "").strip()
            if coverage in ("none", "stub") and not gap_note:
                problems.append(
                    f"{qwhere}: coverage {coverage!r} requires a gap_note saying specifically what is missing and why"
                )
            if coverage in ("partial", "researched"):
                answered += 1
            for target in q.get("answered_in") or []:
                if target.startswith(DISSECTION_COMPUTED_PREFIX):
                    continue  # a prose marker, not a path — see DISSECTION_COMPUTED_PREFIX
                rel = target.split("#", 1)[0]
                if "*" in rel:
                    if not list(CONTENT.glob(rel)):
                        problems.append(f"{qwhere}: answered_in {target!r} matches no file under content/")
                elif not (CONTENT / rel).exists():
                    problems.append(f"{qwhere}: answered_in {target!r} does not exist under content/")
        _coverage(
            f"dissection coverage: {raw_domain} {answered}/6 questions at partial-or-better"
        )

    if not files:
        _coverage("dissection coverage: 0 manifests — no domain has been dissected yet (only _TEMPLATE.yaml exists)")
    return problems


def check_gtm_isolation():
    """content/gtm/ is outside the citation DAG, and the rule runs in exactly one
    direction: a gtm row MAY point at content/, and nothing under content/ outside
    content/gtm/ may EVER cite a content/gtm/ path or id as evidence.

    THE SCAN IS DELIBERATELY NOT A REPO-WIDE GREP FOR "content/gtm". Both
    content/ARCHITECTURE.md and content/CONTENT-DENSITY.md now legitimately contain that
    literal string, in prose describing this very rule — a naive grep would report the
    rule's own documentation as a violation of itself. Only actual citation-bearing YAML
    field VALUES are scanned (see CITATION_FIELD_NAMES)."""
    problems = []
    pipeline_path = GTM_DIR / "research-pipeline.yaml"
    collateral_path = GTM_DIR / "collateral.yaml"
    source_ids = _load_source_ids()
    persona_slugs = _load_persona_slugs()

    gtm_ids = set()
    stage_keys = []
    workstreams = []
    if pipeline_path.exists():
        pdoc = yaml.safe_load(pipeline_path.read_text()) or {}
        stage_keys = [s.get("key") for s in (pdoc.get("stages") or [])]
        expected_stages = [
            "competitive-analysis", "market-sizing", "program-level-research",
            "domain-expert-research", "conference-research", "interviews", "consultants",
        ]
        if stage_keys != expected_stages:
            problems.append(
                f"research-pipeline.yaml: stages[].key is {stage_keys!r}; the seven fixed stages are "
                f"{expected_stages!r}, in that order (named verbatim in the GTM-taxonomy session). "
                "A stage that does not apply is recorded as a workstream with status 'dropped'"
            )
        workstreams = pdoc.get("workstreams") or []
        gtm_ids |= {w.get("id") for w in workstreams if isinstance(w, dict) and w.get("id")}

    assets = []
    if collateral_path.exists():
        cdoc = yaml.safe_load(collateral_path.read_text()) or {}
        assets = cdoc.get("assets") or []
        gtm_ids |= {a.get("id") for a in assets if isinstance(a, dict) and a.get("id")}

    # --- direction 1: nothing under content/ outside content/gtm/ may cite gtm ---
    for f, doc in _content_yaml_docs(skip_dirs=("gtm",)):
        for path, value in _citation_values(doc):
            if "content/gtm/" in value or value.startswith("gtm/") or value in gtm_ids:
                problems.append(
                    f"{_rel(f)} {path}: cites {value!r}, which is a content/gtm/ path or id — "
                    "gtm/ tracks work, not facts, and citing it would launder an intention into evidence"
                )
    for f in sorted((CONTENT / "interviews").glob("*.md")):
        fm = _load_front_matter(f, [])
        if not fm:
            continue
        for path, value in _citation_values(fm):
            if "content/gtm/" in value or value.startswith("gtm/") or value in gtm_ids:
                problems.append(f"{_rel(f)} front-matter {path}: cites the content/gtm/ path or id {value!r}")

    # --- direction 2: the gtm files' own structure ---
    statuses = {"not-started", "in-progress", "blocked", "done", "dropped"}
    feeds_values = {"product-development", "sales"}
    seen_ws = {}
    for i, w in enumerate(workstreams):
        where = f"research-pipeline.yaml workstreams[{i}] ({w.get('id')!r})"
        wid = w.get("id")
        if not wid:
            problems.append(f"{where}: no id")
        elif wid in seen_ws:
            problems.append(f"{where}: duplicate id {wid!r} (first seen at workstreams[{seen_ws[wid]}])")
        else:
            seen_ws[wid] = i
        if w.get("domain") not in DOMAIN_LABELS:
            problems.append(f"{where}: domain {w.get('domain')!r} is not a recognized domain label")
        if w.get("stage") not in stage_keys:
            problems.append(f"{where}: stage {w.get('stage')!r} is not one of the seven fixed stage keys")
        status = w.get("status")
        if status not in statuses:
            problems.append(f"{where}: status {status!r} not in {sorted(statuses)}")
        blocked_by = (w.get("blocked_by") or "").strip()
        if status == "blocked" and not blocked_by:
            problems.append(f"{where}: status 'blocked' requires blocked_by naming what is actually blocking it")
        if status != "blocked" and blocked_by:
            problems.append(f"{where}: blocked_by is set on status {status!r} — it is forbidden off 'blocked'")
        for field in ("started", "target"):
            value = w.get(field)
            if value is not None and (not isinstance(value, str) or not ISO_DATE_RE.match(value)):
                problems.append(f"{where}: {field} {value!r} is not an ISO YYYY-MM-DD string or null")
        for j, s in enumerate(w.get("inputs") or []):
            sid = s.get("source_id") if isinstance(s, dict) else s
            if sid and sid not in source_ids:
                problems.append(f"{where}.inputs[{j}]: source_id {sid!r} not found in {SOURCE_HOMES_DESC}")
        _check_gtm_paths(w.get("produces") or [], f"{where}.produces", problems)
        for feed in w.get("feeds") or []:
            if feed not in feeds_values:
                problems.append(f"{where}: feeds value {feed!r} not in {sorted(feeds_values)}")

    kinds = {"whitepaper", "podcast", "webinar", "video", "sandbox", "use-case-one-pager", "conference-abstract"}
    asset_statuses = {"idea", "drafting", "in-review", "published", "retired"}
    owner_teams = {"marketing", "sales", "product", "research"}
    review_statuses = {"not-reviewed", "reviewed-against-content", "contains-unverified-claims"}
    seen_assets = {}
    for i, a in enumerate(assets):
        where = f"collateral.yaml assets[{i}] ({a.get('id')!r})"
        aid = a.get("id")
        if not aid:
            problems.append(f"{where}: no id")
        elif aid in seen_assets:
            problems.append(f"{where}: duplicate id {aid!r} (first seen at assets[{seen_assets[aid]}])")
        else:
            seen_assets[aid] = i
        kind = a.get("kind")
        if kind not in kinds:
            problems.append(f"{where}: kind {kind!r} not in {sorted(kinds)}")
        if a.get("domain") not in DOMAIN_LABELS:
            problems.append(f"{where}: domain {a.get('domain')!r} is not a recognized domain label")
        status = a.get("status")
        if status not in asset_statuses:
            problems.append(f"{where}: status {status!r} not in {sorted(asset_statuses)}")
        if a.get("owner_team") not in owner_teams:
            problems.append(f"{where}: owner_team {a.get('owner_team')!r} not in {sorted(owner_teams)}")
        if a.get("claims_review_status") not in review_statuses:
            problems.append(f"{where}: claims_review_status {a.get('claims_review_status')!r} not in {sorted(review_statuses)}")
        target_date = a.get("target_date")
        if target_date is not None and (not isinstance(target_date, str) or not ISO_DATE_RE.match(target_date)):
            problems.append(f"{where}: target_date {target_date!r} is not an ISO YYYY-MM-DD string or null")
        if a.get("published_url") and status != "published":
            problems.append(f"{where}: published_url is set on status {status!r} — only 'published' may carry one")
        for p in a.get("audience") or []:
            if p not in persona_slugs:
                problems.append(f"{where}: audience {p!r} not found in content/personas/*.yaml")
        _check_gtm_paths(a.get("grounded_in") or [], f"{where}.grounded_in", problems)
        _check_becomes_source_id(a, where, problems)

    _coverage(
        f"gtm tracking: {len(workstreams)} workstream(s) across {len(stage_keys)} fixed stage(s), "
        f"{len(assets)} collateral asset(s)"
    )
    return problems


# Forward references both gtm files name explicitly as legitimate: the per-domain files of
# two families that have a committed _TEMPLATE but no real members yet. Anything else in a
# `produces:` / `grounded_in:` list has to exist on disk today.
GTM_FORWARD_REFERENCE_RE = re.compile(r"^(dissection|market/programs)/[a-z0-9-]+\.yaml$")


def _check_gtm_paths(paths, where, problems):
    for i, p in enumerate(paths):
        rel = str(p).split("#", 1)[0]
        if (CONTENT / rel).exists():
            continue
        if GTM_FORWARD_REFERENCE_RE.match(rel):
            continue  # a documented Phase 2/3 forward reference — the point of the field
        problems.append(
            f"{where}[{i}]: {p!r} does not exist under content/ and is not one of the documented "
            "Phase 2/3 forward references (dissection/<slug>.yaml, market/programs/<slug>.yaml)"
        )


# content/gtm/collateral.yaml's own header comment is the definitive routing table for
# becomes_source_id, and it gives every kind a destination so a published row is never
# left with a required field and no rule. Transcribed here from that comment:
#   kind -> (must be quarantined?, allowed registry `type:` values)
# `whitepaper` is the one genuinely ambiguous kind and routes BY CONTENT into three cases
# (original material -> registry doc/research-paper/dataset; a restatement of content/ ->
# still a registry entry, but never citable back at its own grounded_in files; a pitch
# piece -> quarantined sales-collateral), so both destinations are accepted for it and the
# type set is the union of the three.
COLLATERAL_ROUTING = {
    "webinar": (False, {"webinar"}),
    "podcast": (False, {"podcast"}),
    "video": (False, {"video"}),
    # NOTE the deliberate name difference: "conference-abstract" is this file's `kind`,
    # while the registry's `type:` value is "conference". There is no
    # "conference-abstract" type.
    "conference-abstract": (False, {"conference"}),
    "use-case-one-pager": (True, {"sales-collateral"}),
    "sandbox": (True, {"sales-collateral"}),
    "whitepaper": (None, {"doc", "research-paper", "dataset", "sales-collateral"}),
}


def _quarantined_home_ids():
    """id -> (type, origin) for every Level 0.5 home carrying `citable_as_fact: false`.
    Today that is exactly content/sources/vendor-comparison-chart.yaml."""
    out = {}
    if VENDOR_CHART_PATH.exists():
        doc = yaml.safe_load(VENDOR_CHART_PATH.read_text()) or {}
        a = doc.get("artifact") or {}
        if a.get("id") and a.get("citable_as_fact") is False:
            out[a["id"]] = (a.get("type"), a.get("origin"))
    return out


def _check_becomes_source_id(asset, where, problems):
    kind = asset.get("kind")
    status = asset.get("status")
    bsid = asset.get("becomes_source_id")
    if status == "published" and not bsid:
        problems.append(f"{where}: status 'published' requires becomes_source_id — the artifact exists in the world now")
        return
    if bsid and status != "published":
        problems.append(
            f"{where}: becomes_source_id is set on status {status!r} — it must be null for every status but "
            "'published', including 'retired' (a retired draft was never published, so it never became a source)"
        )
        return
    if not bsid:
        return

    registry = yaml.safe_load((CONTENT / "sources" / "registry.yaml").read_text()) or {}
    registry_entries = {s.get("id"): s for s in (registry.get("sources") or []) if isinstance(s, dict)}
    quarantined = _quarantined_home_ids()
    if bsid in registry_entries:
        entry = registry_entries[bsid]
        entry_type, origin, quarantined_home = entry.get("type"), entry.get("origin"), False
    elif bsid in quarantined:
        entry_type, origin = quarantined[bsid]
        quarantined_home = True
    else:
        problems.append(
            f"{where}: becomes_source_id {bsid!r} resolves to no Level 0.5 source home — "
            "a published asset is registered where it can be referenced, or the field stays null"
        )
        return

    rule = COLLATERAL_ROUTING.get(kind)
    if rule is None:
        return  # the kind enum check above already reported it
    must_be_quarantined, allowed_types = rule
    if must_be_quarantined is True and not quarantined_home:
        problems.append(
            f"{where}: kind {kind!r} routes to a `citable_as_fact: false` home, but becomes_source_id "
            f"{bsid!r} is a citable registry.yaml entry"
        )
    if must_be_quarantined is False and quarantined_home:
        problems.append(
            f"{where}: kind {kind!r} routes to content/sources/registry.yaml, but becomes_source_id "
            f"{bsid!r} points at a quarantined home"
        )
    if entry_type not in allowed_types:
        problems.append(
            f"{where}: becomes_source_id {bsid!r} has type {entry_type!r}; kind {kind!r} routes to "
            f"{sorted(allowed_types)}"
        )
    if not quarantined_home and origin != "first-party":
        problems.append(
            f"{where}: becomes_source_id {bsid!r} has origin {origin!r} — our own published collateral is "
            'always registered first-party'
        )


def check_vendor_comparison_isolation():
    """THE structural guarantee behind content/sources/vendor-comparison-chart.yaml's
    `citable_as_fact: false` marker: no source_id anywhere in content/ may resolve to an
    id from that artifact. A chart on which its own author never loses (EXXAT marked on 81
    of 81 rows, zero per-row evidence, its two sheets contradicting each other) is a
    positioning document; quarantining it is only a convention until something enforces it.

    Also folds in the count-consistency sub-check deferred from Task 1.1's review — the
    file states several counts in its own prose, and nothing re-derived them from the data
    underneath. Those are WARN, not FAIL: a drifting count is a documentation bug worth
    naming loudly, not a reason to block the whole repo's check."""
    problems = []
    if not VENDOR_CHART_PATH.exists():
        return problems
    doc = yaml.safe_load(VENDOR_CHART_PATH.read_text()) or {}
    artifact = doc.get("artifact") or {}
    quarantined = _vendor_chart_ids()

    if artifact.get("citable_as_fact") is not False:
        problems.append(
            "vendor-comparison-chart.yaml: artifact.citable_as_fact is not false — that marker is what "
            "this check enforces; removing it silently re-admits the sales chart as evidence"
        )

    for f, fdoc in _content_yaml_docs():
        if f.resolve() == VENDOR_CHART_PATH.resolve():
            continue
        for path, value in _citation_values(fdoc):
            if value in quarantined:
                problems.append(
                    f"{_rel(f)} {path}: cites {value!r} from the quarantined vendor-comparison-chart.yaml "
                    "(citable_as_fact: false) — it is a record of what Exxat sales claimed, not of what is true"
                )
    for f in sorted((CONTENT / "interviews").glob("*.md")):
        fm = _load_front_matter(f, [])
        if not fm:
            continue
        for path, value in _citation_values(fm):
            if value in quarantined:
                problems.append(f"{_rel(f)} front-matter {path}: cites the quarantined id {value!r}")

    # --- count consistency, re-derived from the file's own data ---
    sections = doc.get("sections") or []
    rows = [r for s in sections for r in (s.get("rows") or [])]
    row_ids = {r.get("row_id") for r in rows}
    n_rows, n_sections = len(rows), len(sections)
    if n_rows != 81:
        _warn(f"vendor-comparison-chart.yaml: sections hold {n_rows} rows, but the file's prose states 81")
    if n_sections != 10:
        _warn(f"vendor-comparison-chart.yaml: {n_sections} sections, but the file's prose states 10")
    if len(row_ids) != n_rows:
        _warn(f"vendor-comparison-chart.yaml: row_id is not unique across the {n_rows} rows")

    contradictions = artifact.get("known_contradictions") or []
    unmasked_only = artifact.get("unmasked_only_vendor_rows") or []
    if len(contradictions) != 7:
        _warn(f"vendor-comparison-chart.yaml: known_contradictions holds {len(contradictions)}, prose states 7")
    if len(unmasked_only) != 2:
        _warn(f"vendor-comparison-chart.yaml: unmasked_only_vendor_rows holds {len(unmasked_only)}, prose states 2")

    c_ids = {e.get("row_id") for e in contradictions}
    u_ids = {e.get("row_id") for e in unmasked_only}
    overlap = c_ids & u_ids
    if overlap:
        _warn(
            f"vendor-comparison-chart.yaml: {sorted(overlap)} appear in BOTH known_contradictions and "
            "unmasked_only_vendor_rows — the two lists are defined as disjoint, and an overlap "
            "double-counts the contradiction total"
        )

    # Re-derive the contradiction verdict for every listed row. Sheet1 is not transcribed
    # per-row (only these two lists quote it), so the derivation is: translate the row's
    # OWN Sheet2 marks through unmasking_key, and compare with the Sheet1 names the entry
    # quotes, restricted to the four columns the masks actually resolve to. A genuine
    # contradiction is a difference on those four; an agreement there means the entry only
    # records an unmasked-only vendor and belongs in the other list.
    key = {
        u.get("sheet2_label"): u.get("sheet1_name")
        for u in (doc.get("unmasking_key") or [])
        if u.get("sheet2_label")
    }
    resolvable = set(key.values())
    rows_by_id = {r.get("row_id"): r for r in rows}

    def marks(row):
        return {label for label, mark in (row.get("sheet2") or {}).items() if mark}

    def quoted(value):
        return {p.strip() for p in (value or "").split(",") if p.strip()}

    for listname, entries, expect_contradiction in (
        ("known_contradictions", contradictions, True),
        ("unmasked_only_vendor_rows", unmasked_only, False),
    ):
        for e in entries:
            rid = e.get("row_id")
            row = rows_by_id.get(rid)
            if row is None:
                _warn(f"vendor-comparison-chart.yaml {listname}: row_id {rid!r} is not one of the {n_rows} transcribed rows")
                continue
            if e.get("row") != row.get("row"):
                _warn(f"vendor-comparison-chart.yaml {listname} {rid!r}: row label disagrees with the transcribed row")
            actual = marks(row)
            if quoted(e.get("sheet2")) != actual:
                _warn(
                    f"vendor-comparison-chart.yaml {listname} {rid!r}: sheet2 field says "
                    f"{e.get('sheet2')!r} but the transcribed row marks {sorted(actual)}"
                )
                continue
            translated = {key[m] for m in actual if m in key}
            sheet1_resolvable = quoted(e.get("sheet1")) & resolvable
            is_contradiction = translated != sheet1_resolvable
            if is_contradiction != expect_contradiction:
                _warn(
                    f"vendor-comparison-chart.yaml {listname} {rid!r}: re-deriving from the row data gives "
                    f"{'a contradiction' if is_contradiction else 'agreement'} on the four masked columns "
                    f"(sheet2 {sorted(translated)} vs sheet1 {sorted(sheet1_resolvable)}), so it belongs in the other list"
                )

    # The 55 + 26 = 81 module partition.
    grouped = [rid for m in (doc.get("module_grouping") or []) for rid in (m.get("row_ids") or [])]
    for m in doc.get("module_grouping") or []:
        if m.get("row_count") != len(m.get("row_ids") or []):
            _warn(
                f"vendor-comparison-chart.yaml module_grouping {m.get('module')!r}: row_count "
                f"{m.get('row_count')!r} != {len(m.get('row_ids') or [])} listed row_ids"
            )
    not_in_module = doc.get("rows_not_in_any_module") or {}
    ungrouped = not_in_module.get("row_ids") or []
    if not_in_module.get("row_count") != len(ungrouped):
        _warn(
            f"vendor-comparison-chart.yaml rows_not_in_any_module: row_count "
            f"{not_in_module.get('row_count')!r} != {len(ungrouped)} listed row_ids"
        )
    if len(grouped) != 55:
        _warn(f"vendor-comparison-chart.yaml: module_grouping covers {len(grouped)} rows, prose states 55")
    if len(ungrouped) != 26:
        _warn(f"vendor-comparison-chart.yaml: rows_not_in_any_module holds {len(ungrouped)}, prose states 26")
    partition = set(grouped) | set(ungrouped)
    if set(grouped) & set(ungrouped):
        _warn("vendor-comparison-chart.yaml: a row_id appears both in a module and in rows_not_in_any_module")
    if partition != row_ids:
        missing = sorted(row_ids - partition)
        extra = sorted(partition - row_ids)
        _warn(
            "vendor-comparison-chart.yaml: the module partition does not cover the transcribed rows exactly "
            f"(missing {missing[:5]}, unknown {extra[:5]})"
        )
    # The "41 rows carrying an unmasked-only-vendor mark" figure in the file's own prose is
    # NOT re-derivable here and is deliberately not checked: Sheet1's per-row marks were
    # never transcribed (only these two lists quote them), so nothing in this file can
    # count them. Named here rather than silently skipped.

    matrix_path = CONTENT / "lenses" / "feature-comparison-matrix.yaml"
    verified = 0
    if matrix_path.exists():
        mdoc = yaml.safe_load(matrix_path.read_text()) or {}
        mapped = {r.get("maps_to_capability_id") for r in rows if r.get("maps_to_capability_id")}
        matrix_ids = {c.get("capability_id") for c in (mdoc.get("cells") or [])}
        verified = len(mapped & matrix_ids)
    _coverage(f"vendor comparison chart: {n_rows} rows, {verified} verified in the evidence matrix")
    return problems


def check_scorecard_metric_refs():
    """content/scorecard/where-to-play.yaml's `scoring_basis` (added 2026-09-11) records
    what a criterion's 1-5 scores actually rest on, so a reader can tell a sourced number
    from an expert read without reverse-engineering the rationale.

    Every criterion is "qualitative" today and no criterion carries a `metric_refs:` block,
    because content/domains/*.yaml#market_sizing holds no numbers to point at yet. The
    metric_refs half of this function is therefore a no-op today, by design: it exists so
    the first real metric_ref is checked on arrival rather than retrofitted."""
    problems = []
    path = CONTENT / "scorecard" / "where-to-play.yaml"
    if not path.exists():
        return problems
    doc = yaml.safe_load(path.read_text()) or {}
    # TWO values, not three. The file's own header enumerates exactly
    # "qualitative" | "qualitative-with-metric-refs"; there is no "computed" value.
    bases = {"qualitative", "qualitative-with-metric-refs"}
    scorecard_updated = doc.get("last_updated")

    sizing_fields = {}
    for f in sorted((CONTENT / "domains").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc_d = yaml.safe_load(f.read_text()) or {}
        ms = doc_d.get("market_sizing") or {}
        paths = {p for p, _ in walk(ms)}
        for node, value in _numeric_paths(ms):
            paths.add(node)
        sizing_fields[f.stem] = (paths, ms.get("as_of"))

    n_refs = 0
    for i, c in enumerate(doc.get("criteria") or []):
        where = f"where-to-play.yaml criteria[{i}] ({c.get('name')!r})"
        basis = c.get("scoring_basis")
        if basis not in bases:
            problems.append(f"{where}: scoring_basis {basis!r} not in {sorted(bases)}")
        refs = c.get("metric_refs") or []
        if basis == "qualitative-with-metric-refs" and not refs:
            problems.append(f"{where}: scoring_basis 'qualitative-with-metric-refs' but metric_refs is empty")
        if basis == "qualitative" and refs:
            problems.append(f"{where}: scoring_basis 'qualitative' but metric_refs is populated — say so in the basis")
        for j, ref in enumerate(refs):
            n_refs += 1
            target = ref.get("path") if isinstance(ref, dict) else ref
            rwhere = f"{where}.metric_refs[{j}]"
            # "domains/<slug>.yaml#market_sizing.tam.programs"
            file_part, _, field_part = str(target).partition("#")
            slug = pathlib.Path(file_part).stem
            if slug not in sizing_fields:
                problems.append(f"{rwhere}: {target!r} does not name a content/domains/*.yaml file")
                continue
            paths, as_of = sizing_fields[slug]
            field = field_part[len("market_sizing."):] if field_part.startswith("market_sizing.") else field_part
            if field not in paths:
                problems.append(f"{rwhere}: {target!r} does not resolve to a field in {slug}'s market_sizing block")
            # WARN: a metric that was re-measured after the scorecard was scored means the
            # score may be resting on a number that has since moved.
            if as_of and scorecard_updated and str(as_of) > str(scorecard_updated):
                _warn(
                    f"{rwhere}: {slug}'s market_sizing.as_of ({as_of}) postdates the scorecard's own "
                    f"last_updated ({scorecard_updated}) — the score may rest on a number that has since moved"
                )
    _coverage(f"scorecard: {len(doc.get('criteria') or [])} criteria, {n_refs} metric_ref(s)")
    return problems


def _numeric_paths(node, prefix=""):
    """Dotted paths to every non-string scalar leaf — walk() only yields strings, and a
    metric_ref points at a NUMBER, which is precisely the kind of leaf walk() skips."""
    if isinstance(node, dict):
        for k, v in node.items():
            yield from _numeric_paths(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(node, list):
        for item in node:
            yield from _numeric_paths(item, f"{prefix}[]")
    elif not isinstance(node, str):
        yield prefix, node


def check_capability_roadmap_integrity():
    """content/prism/capability-map.yaml's optional `roadmap:` sub-object (added
    2026-09-11), attachable to any pillar or feature carrying `status: roadmap`.

    WARN-ONLY, deliberately. Both populated entries today state a date and nothing else —
    no `commitment`, no `scope_note`, `source_id: null` — because the file does not state
    those anywhere and the schema is not a licence to infer them. A `status: roadmap` entry
    with NO `roadmap:` object at all is likewise a valid, honest state. This is the same
    "guards drift; non-blocking at time of writing" posture ACCREDITATION_CEILINGS uses
    above (2026-08-27) and that content/CONTENT-DENSITY.md applies to both the journeys
    ceilings and this very field's own row."""
    path = CONTENT / "prism" / "capability-map.yaml"
    if not path.exists():
        return []
    doc = yaml.safe_load(path.read_text()) or {}
    commitments = {"committed", "planned", "exploratory"}
    source_ids = _load_source_ids()

    n_roadmap, n_with_object = 0, 0

    def visit(entry, where):
        nonlocal n_roadmap, n_with_object
        roadmap = entry.get("roadmap")
        if entry.get("status") == "roadmap":
            n_roadmap += 1
        if not isinstance(roadmap, dict):
            # No object at all is valid — target/timing simply not documented yet.
            return
        n_with_object += 1
        if entry.get("status") != "roadmap":
            _warn(f"{where}: carries a roadmap: object but status is {entry.get('status')!r}, not 'roadmap'")
        target = roadmap.get("target")
        if target is not None and not ROADMAP_TARGET_RE.match(str(target)):
            _warn(
                f"{where}: roadmap.target {target!r} does not match the file's own documented form "
                '/^Q[1-4] \\d{4}$|^\\d{4}-(0[1-9]|1[0-2])$/ ("Q2 2027" or "2027-06")'
            )
        commitment = roadmap.get("commitment")
        if commitment is not None and commitment not in commitments:
            _warn(f"{where}: roadmap.commitment {commitment!r} not in {sorted(commitments)}")
        sid = roadmap.get("source_id")
        # source_id: null is honestly incomplete, not wrong — only a non-null id resolves.
        if sid is not None and sid not in source_ids:
            _warn(f"{where}: roadmap.source_id {sid!r} not found in {SOURCE_HOMES_DESC}")
        # The mirror invariant. The flat pillar-level `target:` is read directly by
        # apps/ecosystem/app/prism/page.tsx ("Target: Q2 2027"), so Task 1.6 kept it rather
        # than blanking the UI — which means the date is now stated twice on the same
        # entry. Both are documented in the same "Qn YYYY" form specifically so this stays
        # a literal string equality rather than a format-normalizing comparison.
        flat = entry.get("target")
        if flat is not None and target is not None and str(flat) != str(target):
            _warn(
                f"{where}: flat target {flat!r} and roadmap.target {target!r} disagree — while both fields "
                "exist they state one date twice and are never allowed to diverge"
            )

    for p in (doc.get("core_ring", {}) or {}).get("pillars") or []:
        visit(p, f"capability-map.yaml pillar {p.get('name')!r}")
        for feat in p.get("features") or []:
            visit(feat, f"capability-map.yaml pillar {p.get('name')!r} feature {feat.get('name')!r}")

    _coverage(
        f"capability roadmap: {n_with_object} of {n_roadmap} roadmap-status entries carry a roadmap: object"
    )
    return []


def summarize_unresearched_accreditation():
    """Unconditional — runs even on an otherwise-clean pass, so a stub file with
    standards: [] can never read as "fully researched" just because nothing FAILed."""
    lines = []
    for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        standards = doc.get("standards") or []
        if doc.get("research_status") == "unresearched" or not standards:
            lines.append(f"{f.name} ({len(standards)} standards)")
    return lines


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--warn-only", action="store_true", help="never exit non-zero")
    args = parser.parse_args()

    results = []
    for f in sorted((CONTENT / "journeys").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, JOURNEY_CEILINGS, results)
    for f in sorted((CONTENT / "flows").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, FLOW_CEILINGS, results)
    for f in sorted((CONTENT / "personas").glob("discipline-*.yaml")):
        check_file(f, PERSONA_CEILINGS, results)
    for f in sorted((CONTENT / "personas").glob("role-*.yaml")):
        check_file(f, ROLE_PERSONA_CEILINGS, results)
    for f in sorted((CONTENT / "personas").glob("lens-*.yaml")):
        check_file(f, LENS_PERSONA_CEILINGS, results)
    for f in sorted((CONTENT / "competitors").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, COMPETITOR_CEILINGS, results)
    for f in sorted((CONTENT / "prism").glob("*.yaml")):
        check_file(f, PRISM_CEILINGS, results)
    for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, ACCREDITATION_CEILINGS, results)
    ratings_file = CONTENT / "lenses" / "standards-competitor-ratings.yaml"
    if ratings_file.exists():
        check_file(ratings_file, STANDARDS_RATINGS_CEILINGS, results)
    use_cases_file = CONTENT / "lenses" / "standards-use-cases.yaml"
    if use_cases_file.exists():
        check_file(use_cases_file, STANDARDS_USE_CASES_CEILINGS, results)
    for f in sorted((CONTENT / "trends").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, TRENDS_CEILINGS, results)
    for f in sorted((CONTENT / "dissection").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, DISSECTION_CEILINGS, results)
    for f in sorted((CONTENT / "domains").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, DOMAIN_CEILINGS, results)
    for f in sorted((CONTENT / "market" / "programs").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_file(f, MARKET_PROGRAMS_CEILINGS, results)
    sources_file = CONTENT / "sources" / "registry.yaml"
    if sources_file.exists():
        check_file(sources_file, SOURCES_CEILINGS, results)
    # The three Phase 1 lens files. Their ceilings were written into
    # content/CONTENT-DENSITY.md when the files landed (2026-09-11) and explicitly handed
    # to this task for enforcement — until now they were documentation only.
    for name, ceilings in (
        ("product-gaps.yaml", PRODUCT_GAPS_CEILINGS),
        ("competitor-differentiation.yaml", COMPETITOR_DIFFERENTIATION_CEILINGS),
        ("feature-comparison-matrix.yaml", FEATURE_MATRIX_CEILINGS),
    ):
        lens_file = CONTENT / "lenses" / name
        if lens_file.exists():
            check_file(lens_file, ceilings, results)
    # content/gtm/ was not in this enumeration at all before 2026-09-11, so its ceilings
    # could not have fired even had they been declared.
    for name, ceilings in (
        ("research-pipeline.yaml", GTM_PIPELINE_CEILINGS),
        ("collateral.yaml", GTM_COLLATERAL_CEILINGS),
    ):
        gtm_file = GTM_DIR / name
        if gtm_file.exists():
            check_file(gtm_file, ceilings, results)
    # Markdown front-matter, not a YAML document — the transcript body below it stays
    # deliberately unceilinged.
    for f in sorted((CONTENT / "interviews").glob("*.md")):
        if f.name.startswith("_TEMPLATE"):
            continue
        check_front_matter_file(f, INTERVIEW_FRONT_MATTER_CEILINGS, results)

    # Drop allowlisted entries — matched by filename + path + a substring of the
    # actual value, so allowlisting one entry doesn't silently exempt every other
    # (possibly future, possibly bad) entry sharing the same field path.
    filtered = []
    for severity, fname, path, n, hard, value in results:
        allowlisted = False
        for (fglob, fpath_key, ident), _reason in ALLOWLIST.items():
            if fname == fglob and path == fpath_key and ident in value:
                allowlisted = True
                break
        if not allowlisted:
            filtered.append((severity, fname, path, n, hard))
    results = filtered

    # First, so a broken source home is named as its own FAIL rather than only
    # showing up as a cascade of "source_id not found" failures downstream.
    integrity_problems = check_source_homes_integrity()
    integrity_problems += check_standards_ratings_integrity()
    integrity_problems += check_standards_use_cases_integrity()
    integrity_problems += check_trends_integrity()
    integrity_problems += check_research_sources_integrity()
    # Phase 1 families (2026-09-11). Ordered so the two isolation checks — the ones that
    # enforce a structural quarantine rather than a field rule — run last and read as the
    # closing argument they are.
    integrity_problems += check_source_registry_integrity()
    integrity_problems += check_sessions_integrity()
    integrity_problems += check_support_ticket_snapshots_integrity()
    integrity_problems += check_product_gaps_integrity()
    integrity_problems += check_competitor_differentiation_integrity()
    integrity_problems += check_feature_comparison_matrix_integrity()
    integrity_problems += check_market_sizing_integrity()
    integrity_problems += check_market_programs_integrity()
    integrity_problems += check_dissection_integrity()
    integrity_problems += check_scorecard_metric_refs()
    integrity_problems += check_capability_roadmap_integrity()
    integrity_problems += check_gtm_isolation()
    integrity_problems += check_vendor_comparison_isolation()
    unresearched = summarize_unresearched_accreditation()

    if not results and not integrity_problems and not INTEGRITY_WARNINGS:
        print("check_content_density: 0 WARN, 0 FAIL — all fields within ceiling.")
    else:
        warns = [r for r in results if r[0] == "WARN"]
        fails = [r for r in results if r[0] == "FAIL"]

        for severity, fname, path, n, hard in results:
            print(f"{severity}  {fname}  {path}  {n} chars (hard ceiling {hard})")
        for problem in integrity_problems:
            print(f"FAIL  {problem}")
        # Non-blocking integrity findings: a rule introduced against content that mostly
        # cannot satisfy it yet, or a derived number that disagrees with the prose stating
        # it. Reported by name and loudly, never silently dropped.
        for warning in INTEGRITY_WARNINGS:
            print(f"WARN  {warning}")

        print(f"\n{len(warns) + len(INTEGRITY_WARNINGS)} WARN, {len(fails) + len(integrity_problems)} FAIL")

    # Unconditional — runs even on a clean pass, so an empty/stub accreditation file
    # can never silently read as "fully researched" just because nothing FAILed.
    if unresearched:
        print(f"\n{len(unresearched)} accreditation file(s) marked unresearched: " + ", ".join(unresearched))

    # Same reason, applied to the six Phase 1 families: every one of them is empty or
    # near-empty today, and an empty family must report its emptiness rather than pass
    # silently and read as researched.
    if COVERAGE_LINES:
        print("\nPhase 1 coverage:")
        for line in COVERAGE_LINES:
            print(f"  {line}")

    if (results or integrity_problems) and not args.warn_only:
        fails = [r for r in results if r[0] == "FAIL"]
        if fails or integrity_problems:
            print(
                "\nFAIL means a field is over its hard ceiling, or a standards-competitor-\n"
                "ratings.yaml entry doesn't resolve to a real element/competitor/source. If a\n"
                "density FAIL is a genuine dense finding (not padding or an unedited essay),\n"
                "add it to ALLOWLIST in this script with a one-line reason and today's date —\n"
                "don't silently ignore it. See content/CONTENT-DENSITY.md for the ceiling\n"
                "table and rationale."
            )
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
