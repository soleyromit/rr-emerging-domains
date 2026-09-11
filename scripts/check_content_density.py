#!/usr/bin/env python3
"""Enforce the character-ceiling table in content/CONTENT-DENSITY.md.

A length brief was given for key_finding.detail ("1-2 sentences") during the
rotation-lifecycle journey build and was silently ignored — 98% of that
journey's entries ended up 3-4x over target, because the brief was requested
in a prompt but never mechanically checked. This script is the check: it
walks content/**/*.yaml, measures the same fields against the same ceilings
written down in content/CONTENT-DENSITY.md, and exits non-zero on any FAIL so
an agent can't declare authoring work done while still over budget.

Usage: python3 scripts/check_content_density.py [--warn-only]
"""
import argparse
import pathlib
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
    unresearched = summarize_unresearched_accreditation()

    if not results and not integrity_problems:
        print("check_content_density: 0 WARN, 0 FAIL — all fields within ceiling.")
    else:
        warns = [r for r in results if r[0] == "WARN"]
        fails = [r for r in results if r[0] == "FAIL"]

        for severity, fname, path, n, hard in results:
            print(f"{severity}  {fname}  {path}  {n} chars (hard ceiling {hard})")
        for problem in integrity_problems:
            print(f"FAIL  {problem}")

        print(f"\n{len(warns)} WARN, {len(fails) + len(integrity_problems)} FAIL")

    # Unconditional — runs even on a clean pass, so an empty/stub accreditation file
    # can never silently read as "fully researched" just because nothing FAILed.
    if unresearched:
        print(f"\n{len(unresearched)} accreditation file(s) marked unresearched: " + ", ".join(unresearched))

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
