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

    if not results:
        print("check_content_density: 0 WARN, 0 FAIL — all fields within ceiling.")
        return 0

    warns = [r for r in results if r[0] == "WARN"]
    fails = [r for r in results if r[0] == "FAIL"]

    for severity, fname, path, n, hard in results:
        print(f"{severity}  {fname}  {path}  {n} chars (hard ceiling {hard})")

    print(f"\n{len(warns)} WARN, {len(fails)} FAIL")
    if fails and not args.warn_only:
        print(
            "\nFAIL means a field is over its hard ceiling. If this is a genuine dense\n"
            "finding (not padding or an unedited essay), add it to ALLOWLIST in this\n"
            "script with a one-line reason and today's date — don't silently ignore it.\n"
            "See content/CONTENT-DENSITY.md for the ceiling table and rationale."
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
