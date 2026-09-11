#!/usr/bin/env python3
"""Exercise every Phase 1 integrity check in check_content_density.py against
deliberately-bad synthetic content.

WHY THIS FILE EXISTS. All six Phase 1 content families are empty or near-empty, so every
one of those checks runs over zero rows on a real invocation — which means a check that
silently does nothing is indistinguishable from a check that passes. That is not
hypothetical: the first draft of the two isolation scans handed a pathlib.Path to walk()
instead of the parsed document, so they scanned zero fields and reported a clean pass on
a repo where a quarantined citation had been planted. Nothing in a normal run would ever
have shown it. This harness did, immediately.

HOW IT WORKS. content/ is copied into a temp tree, the checker module is re-pointed at
the copy, one known-bad fixture is written per rule, and the expected message substring is
asserted against what the check reports. Fixtures never touch the real content/ tree.
Several cases assert the opposite direction too — that a correct fixture, and the real
committed content, report nothing — because a check that fires on everything is as useless
as one that fires on nothing.

Run it whenever you change a check or add a rule:
    python3 scripts/test_phase1_checks.py
Exits non-zero on any failure.
"""
import importlib.util
import pathlib
import shutil
import sys
import tempfile

import yaml

REPO = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ccd", REPO / "scripts" / "check_content_density.py")
ccd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ccd)

tmp = pathlib.Path(tempfile.mkdtemp())
shutil.copytree(REPO / "content", tmp / "content")
ccd.CONTENT = tmp / "content"
ccd.VENDOR_CHART_PATH = ccd.CONTENT / "sources" / "vendor-comparison-chart.yaml"
ccd.GTM_DIR = ccd.CONTENT / "gtm"
C = ccd.CONTENT

failures = []
passes = []


def write(rel, data):
    p = C / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True))


def reset_caches():
    ccd._SOURCE_IDS_CACHE = None
    ccd._SOURCE_HOME_PROBLEMS.clear()
    ccd._ACCREDITATION_ELEMENTS_CACHE = None
    ccd._COMPETITOR_PILLARS_CACHE = None
    ccd._PRISM_PILLARS_CACHE = None
    ccd._DOMAIN_RAW_CACHE = None
    ccd.INTEGRITY_WARNINGS.clear()
    ccd.COVERAGE_LINES.clear()


def expect(label, fn, needles, channel="problems"):
    reset_caches()
    problems = fn()
    found = problems if channel == "problems" else ccd.INTEGRITY_WARNINGS
    blob = " || ".join(found)
    # EVERY missing needle is reported, never just the first. This loop used to `return`
    # on the first miss, which meant one broken rule masked every other broken rule in the
    # same case: Task 2.2's review saw 1 failure, fixed it, re-ran, saw the next — three
    # round trips for damage a single run should have shown whole. A test harness that
    # reports one failure at a time is itself a source of masked failures.
    missing = [n for n in needles if n not in blob]
    if missing:
        detail = "\n      ".join(f"missing {n!r}" for n in missing)
        failures.append(
            f"{label}: {len(missing)} of {len(needles)} expected substring(s) not in {channel}\n"
            f"      {detail}\n      got: {blob[:900]}"
        )
    else:
        passes.append(label)


def expect_clean(label, fn):
    reset_caches()
    problems = fn()
    if problems:
        failures.append(f"{label}: expected NO problems, got {problems}")
    else:
        passes.append(label)


SRC = "interview-wilson-market-penetration-2026-08-22"   # a real, resolving source_id
BAD = "source-that-does-not-exist"

# ---------------------------------------------------------------- 1. registry
reg = yaml.safe_load((C / "sources" / "registry.yaml").read_text())
reg["sources"].append({"id": reg["sources"][0]["id"], "type": "event", "origin": "vendor",
                       "access": "semi-public", "url": None, "title": "dupe"})
reg["sources"].append({"id": "public-with-no-url", "type": "doc", "origin": "third-party",
                       "access": "public", "title": "x"})
write("sources/registry.yaml", reg)
expect("1 registry: dupe id / bad type / bad origin / bad access / public-without-url",
       ccd.check_source_registry_integrity,
       ["duplicate id", "type 'event'", "origin 'vendor'", "access 'semi-public'",
        "access 'public' requires a url"])
expect("1 registry: no url and no path -> WARN", ccd.check_source_registry_integrity,
       ["has neither url nor path"], channel="warnings")
shutil.copy(REPO / "content" / "sources" / "registry.yaml", C / "sources" / "registry.yaml")

# ---------------------------------------------------------------- 2. sessions
sess = (C / "interviews" / "bad-session.md")
sess.write_text("---\n" + yaml.safe_dump({
    "id": "interview-wilson-market-penetration-2026-08-22",  # duplicate of a real one
    "type": "chat", "date": "22-08-2026", "title": "t",
    "domains": ["MD"], "access": "semi-public", "evidence_status": "raw",
}, sort_keys=False) + "---\n\nbody\n")
expect("2 sessions: dupe id / bad type / bad evidence_status / bad access / bad date / raw domain label",
       ccd.check_sessions_integrity,
       ["duplicate session id", "type 'chat'", "evidence_status 'raw'", "access 'semi-public'",
        "is not an ISO YYYY-MM-DD", "domains value 'MD'"])
sess.unlink()
expect_clean("2 sessions: the four real committed sessions pass", ccd.check_sessions_integrity)

# ---------------------------------------------------------------- 3. support tickets
write("sources/support-tickets/bad-2026-01-01.yaml", {
    "snapshot": {"id": "support-tickets-bad-2026-01-01", "type": "support-ticket",
                 "taken": None, "selection_method": "  "},
    "tickets": [{"source_id": "support-ticket-1", "redacted": False},
                {"source_id": "support-ticket-2"}],
})
expect("3 support tickets: redacted false / redacted missing / no taken / empty selection_method",
       ccd.check_support_ticket_snapshots_integrity,
       ["redacted is False", "redacted is None", "snapshot.taken is missing",
        "snapshot.selection_method is empty"])
(C / "sources" / "support-tickets" / "bad-2026-01-01.yaml").unlink()
expect_clean("3 support tickets: the real pharmacy snapshot passes",
             ccd.check_support_ticket_snapshots_integrity)

# ---------------------------------------------------------------- 4. product gaps
write("lenses/product-gaps.yaml", {"last_updated": "2026-09-11", "gaps": [
    {"id": "g1", "domain": "MD", "gap": "", "kind": "nope", "build_shape": "nope",
     "severity": "blocking", "demand_evidence": "inferred", "blocks": ["nope"],
     "prism_feature_ref": "Compliance Management", "prism_status": "roadmap",
     "element_ids": ["not-an-element"], "competitor_has_it": [{"competitor_slug": "nope", "source_id": BAD}],
     "audience": ["nope"], "target": "Q1 2027", "detail": "d", "sources": []},
    {"id": "g1", "domain": "Pharmacy", "gap": "g", "kind": "ux", "build_shape": "build",
     "severity": "material", "demand_evidence": "rfp", "blocks": ["deal"],
     "prism_feature_ref": None, "prism_status": "shipped",
     "element_ids": ["not-an-element"],
     "sources": [{"source_id": BAD}]},
]})
expect("4 product gaps: every enum, anti-drift, blocking+inferred, null-ref pairing, dupe id, dangling refs",
       ccd.check_product_gaps_integrity,
       ["domain 'MD' is not a recognized", "gap headline is empty", "kind 'nope'",
        "build_shape 'nope'", "blocks value 'nope'",
        "disagrees with capability-map.yaml, which states 'shipped'",
        "severity 'blocking' with demand_evidence 'inferred'",
        "element_id 'not-an-element'", "competitor_slug 'nope'", "audience 'nope'",
        "target 'Q1 2027' is not", "no sources[]", "duplicate id 'g1'",
        "'absent' is the value that pairs with a null ref",
        f"source_id '{BAD}' not found"])
shutil.copy(REPO / "content" / "lenses" / "product-gaps.yaml", C / "lenses" / "product-gaps.yaml")

# ---------------------------------------------------------------- 5. differentiation
write("lenses/competitor-differentiation.yaml", {"last_updated": "2026-09-11", "differentiators": [
    {"domain": "MD", "competitor_slug": "nope", "axis": "vibes", "direction": "sideways",
     "counter_move_status": "maybe", "claim": "", "prism_feature_ref": "No Such Pillar",
     "sources": []},
    {"domain": "Pharmacy", "competitor_slug": "core-elms", "axis": "price",
     "direction": "parity", "counter_move_status": "proposed", "claim": "c",
     "competitor_feature_ref": "No Such Teardown Pillar",
     "evidence_strength": "verified", "evidence_note": "should be forbidden",
     "persona_relevance": ["nope"], "sources": [{"source_id": SRC}]},
    {"domain": "Pharmacy", "competitor_slug": "core-elms", "axis": "price",
     "direction": "parity", "counter_move_status": "proposed", "claim": "c",
     "evidence_strength": "directional", "sources": [{"source_id": SRC}]},
]})
expect("5 differentiation: enums, required two-value evidence_strength, note forbidden on verified, refs",
       ccd.check_competitor_differentiation_integrity,
       ["axis 'vibes'", "direction 'sideways'", "counter_move_status 'maybe'",
        "claim is empty", "prism_feature_ref 'No Such Pillar'",
        "competitor_slug 'nope'", "evidence_strength is required on every entry",
        "'verified' forbids an evidence_note",
        "competitor_feature_ref 'No Such Teardown Pillar'",
        "persona_relevance 'nope'", "no sources[]",
        "'directional' requires a non-empty evidence_note"])
shutil.copy(REPO / "content" / "lenses" / "competitor-differentiation.yaml",
            C / "lenses" / "competitor-differentiation.yaml")

# ---------------------------------------------------------------- 6. feature matrix
write("lenses/feature-comparison-matrix.yaml", {"last_updated": "2026-09-11",
  "cells": [
    {"domain": "Pharmacy", "pillar": "Compliance Management", "capability": "c",
     "capability_id": "pharmacy-orphan", "competitor_slug": "core-elms",
     "rating": "fully-meeting", "evidence_strength": "verified",
     "sources": [{"source_id": "sales-collateral-exxat-vendor-comparison-chart"}]},
    {"domain": "Pharmacy", "pillar": "No Such Pillar", "capability": "",
     "capability_id": "pharmacy-dupe", "competitor_slug": "core-elms",
     "rating": "kinda", "evidence_strength": "verified", "sources": [{"source_id": SRC}]},
    {"domain": "Pharmacy", "pillar": "Compliance Management", "capability": "c",
     "capability_id": "pharmacy-dupe", "competitor_slug": "core-elms",
     "rating": "fully-meeting", "evidence_strength": "verified", "sources": [{"source_id": SRC}]},
  ],
  "exxat_cells": [
    {"domain": "Pharmacy", "capability_id": "pharmacy-dupe", "exxat_coverage": "unresearched",
     "prism_status": "absent", "prism_feature_ref": None, "rating": "fully-meeting"},
    {"domain": "Pharmacy", "capability_id": "pharmacy-not-in-cells", "exxat_coverage": "maybe",
     "prism_status": "shipped", "prism_feature_ref": "Exam Management"},
  ]})
expect("6 matrix: THE isolation rule, quarantined citation, dupe cell, enums, exxat_coverage rules",
       ccd.check_feature_comparison_matrix_integrity,
       ["'pharmacy-orphan' (Pharmacy) is rated for a competitor in cells[] but has no exxat_cells[] entry",
        "an id from the quarantined", "pillar 'No Such Pillar'", "capability label is empty",
        "rating 'kinda'", "duplicate cell",
        "exxat_coverage 'maybe'",
        "'pharmacy-not-in-cells' does not appear in cells[]",
        "exxat_coverage 'unresearched' but rating is set",
        "disagrees with capability-map.yaml, which states 'roadmap'"])
# partial is the one allowed narrowing, and a plain unresearched row is clean
write("lenses/feature-comparison-matrix.yaml", {"last_updated": "2026-09-11",
  "cells": [{"domain": "Pharmacy", "pillar": "Compliance Management", "capability": "c",
             "capability_id": "pharmacy-ok", "competitor_slug": "core-elms",
             "rating": "fully-meeting", "evidence_strength": "verified",
             "sources": [{"source_id": SRC}]}],
  "exxat_cells": [{"domain": "Pharmacy", "capability_id": "pharmacy-ok",
                   "prism_status": "partial", "prism_feature_ref": "Compliance Management",
                   "rating": "partially-meeting", "evidence_strength": "directional",
                   "evidence_note": "n", "sources": [{"source_id": SRC}]}]})
expect_clean("6 matrix: a well-formed row with prism_status 'partial' passes",
             ccd.check_feature_comparison_matrix_integrity)
shutil.copy(REPO / "content" / "lenses" / "feature-comparison-matrix.yaml",
            C / "lenses" / "feature-comparison-matrix.yaml")

# ---------------------------------------------------------------- 7. market sizing
dom = yaml.safe_load((C / "domains" / "pharmacy.yaml").read_text())
ms = dom["market_sizing"]
ms["as_of"] = "2026/01/01"
ms["confidence"] = "vibes"
ms["tam"]["programs"] = "142"
ms["accredited_programs"]["count"] = 142
ms["enrollment"]["students"] = 42312
ms["enrollment"]["source_id"] = BAD
ms["enrollment"]["trend"] = "wobbling"
ms["sam"]["programs"] = 100
ms["som"]["programs"] = 10
ms["som"]["basis"] = ""
# This fixture starts from the REAL pharmacy.yaml, so every field the assertions
# below expect to be NULL must be nulled here explicitly rather than inherited.
# Task 2.2 populated Pharmacy's market_sizing with real data and silently disabled
# three assertions that had been free-riding on the empty schema (the number-set-
# but-source_id-null rule, and both sam-derivation rules). The check regressed to
# 30/31 while still reporting green, because expect() bails on the first missing
# needle. Set them, don't assume them.
ms["accredited_programs"]["source_id"] = None   # -> count set but source_id null
ms["tam"]["source_id"] = None                   # -> sam derived from an unsourced tam
ms["sam"]["derived_from"] = []                  # -> sam.programs set, no stated filters
# Same class of latent free-ride, nulled now rather than after it breaks: the
# revenue-without-acv assertion below needs acv.value_usd null, which is true of
# the real file only until someone sources a price.
ms["acv"]["value_usd"] = None                   # -> revenue_potential_usd set, acv null
ms["current_clients"]["count"] = 20
ms["current_clients"]["source_id"] = SRC
ms["penetration_pct"] = 99.0
ms["revenue_potential_usd"] = 1000000
ms["acv"]["confidence"] = "sorta"
dom["org_structure"]["buying_roles"] = [{"persona_ref": "nope", "decision_role": "wizard"}]
write("domains/pharmacy.yaml", dom)
expect("7 market sizing: string number, unsourced number, revenue-without-acv, enums, sam/som rules, org roles",
       ccd.check_market_sizing_integrity,
       ["tam.programs: '142' is a str, not a number", "as_of: '2026/01/01' is not an ISO",
        "confidence: 'vibes'", "accredited_programs.count: is set but accredited_programs.source_id is null",
        f"source_id '{BAD}' not found", "enrollment.trend: 'wobbling'",
        "sam.derived_from is empty", "tam.source_id is null",
        "som.programs: set but som.basis is empty",
        "revenue_potential_usd: set while acv.value_usd is null",
        "acv.confidence: 'sorta'", "persona_ref 'nope'", "decision_role 'wizard'"])
# penetration mismatch is WARN, not FAIL
ms["tam"]["programs"] = 142
ms["tam"]["source_id"] = SRC
write("domains/pharmacy.yaml", dom)
expect("7 market sizing: penetration_pct disagreement is a WARN, not a FAIL",
       ccd.check_market_sizing_integrity, ["penetration_pct: states 99.0"], channel="warnings")
shutil.copy(REPO / "content" / "domains" / "pharmacy.yaml", C / "domains" / "pharmacy.yaml")
expect_clean("7 market sizing: the four real blocks pass — 3 all-null, Pharmacy fully populated",
             ccd.check_market_sizing_integrity)

# ---------------------------------------------------------------- 8. market programs
write("market/programs/pharmacy.yaml", {
    "domain": "MD",
    "source_of_record": {"source_id": BAD, "row_count": 9,
                         "pii_policy": "p", "extracted": "2026-01-01"},
    "programs": [
        # row A omits grid_matched entirely; row B carries the STRING "false", which reads
        # true-ish to anything that forgets to check the type — both must be caught, or an
        # unmatched institution goes back to counting as a confirmed no-cross-sell.
        {"slug": "a-pharmacy", "institution": "A", "accreditation_status": "nope",
         "exxat_status": "nope", "incumbent_vendor": "made-up-vendor",
         "notes": "reach dean@example.edu or 555-123-4567", "sources": []},
        {"slug": "a-pharmacy", "institution": "B", "accreditation_status": "accredited",
         "exxat_status": "client", "grid_matched": "false", "incumbent_vendor": "core-elms",
         "sources": [{"source_id": SRC}]},
    ]})
expect("8 market programs: row_count, dupe slug, enums, incumbent rules, grid_matched, PII gate, dangling source",
       ccd.check_market_programs_integrity,
       ["domain 'MD' is not a recognized", "row_count is 9 but programs[] holds 2",
        f"source_of_record.source_id '{BAD}' not found", "duplicate slug 'a-pharmacy'",
        "accreditation_status 'nope'", "exxat_status 'nope'",
        "incumbent_vendor 'made-up-vendor' is neither", "looks like it contains an email address",
        "looks like it contains a phone number", "no sources[]",
        "requires an incumbent_evidence source_id",
        "grid_matched None is not a boolean", "grid_matched 'false' is not a boolean"])
# a null source_of_record.source_id is an honest unpopulated state, not a dangling ref
write("market/programs/pharmacy.yaml", {
    "domain": "Pharmacy",
    "source_of_record": {"source_id": None, "row_count": 0, "pii_policy": "p"},
    "programs": []})
expect_clean("8 market programs: source_of_record.source_id null + programs: [] is clean",
             ccd.check_market_programs_integrity)
# The other direction for grid_matched: a row whose institution never matched the
# cross-sell grid is VALID content, not an error. grid_matched: false beside an empty
# other_disciplines_on_campus is exactly the honest unknown the field exists to record,
# so the check must fire on the missing/mistyped cases above and stay silent here.
write("market/programs/pharmacy.yaml", {
    "domain": "Pharmacy",
    "source_of_record": {"source_id": None, "row_count": 2, "pii_policy": "p"},
    "programs": [
        {"slug": "matched-pharmacy", "institution": "M", "accreditation_status": "accredited",
         "exxat_status": "not-tracked", "grid_matched": True,
         "other_disciplines_on_campus": ["Nursing"], "incumbent_vendor": "unknown",
         "incumbent_evidence": None, "sources": [{"source_id": SRC}]},
        {"slug": "unmatched-pharmacy", "institution": "U", "accreditation_status": "accredited",
         "exxat_status": "not-tracked", "grid_matched": False,
         "other_disciplines_on_campus": [], "incumbent_vendor": "unknown",
         "incumbent_evidence": None, "sources": [{"source_id": SRC}]},
    ]})
expect_clean("8b market programs: grid_matched true and false both pass on otherwise-valid rows",
             ccd.check_market_programs_integrity)
(C / "market" / "programs" / "pharmacy.yaml").unlink()

# ---------------------------------------------------------------- 9. dissection
tpl = yaml.safe_load((C / "dissection" / "_TEMPLATE.yaml").read_text())


def manifest(**over):
    m = {
        "domain": "MD", "slug": "medicine", "is_gtm_target": False,
        "template_of_record": None, "last_reviewed": "2026-09-11",
        "incumbent_set": [{"competitor_slug": "medhub", "role": "primary"}],
        "questions": [
            {"key": k, "answered_in": [], "coverage": "none", "confidence": "low",
             "gap_note": "nothing yet"} for k in ccd.DISSECTION_QUESTION_KEYS
        ],
    }
    m.update(over)
    return m


good = manifest()
good["questions"][0]["answered_in"] = ["lenses/product-gaps.yaml"]
good["questions"][2]["answered_in"] = ["domains/medicine.yaml#market_sizing"]
good["questions"][1]["answered_in"] = ["competitors/*.yaml"]
good["questions"][5]["answered_in"] = [
    "computed — audience/persona_relevance tags and sources[] across the lenses above"]
write("dissection/medicine.yaml", good)
expect_clean("9 dissection: raw domain 'MD', a glob, a #fragment and the computed prose marker all pass",
             ccd.check_dissection_integrity)

# is_gtm_target is checked on its own fixture: it needs a RESOLVABLE raw domain, and the
# manifest below deliberately breaks the domain field, which (correctly) suppresses it.
gtm_wrong = manifest(is_gtm_target=True)
write("dissection/medicine.yaml", gtm_wrong)
expect("9b dissection: is_gtm_target true on a domain that is not where-to-play's actual_gtm_target",
       ccd.check_dissection_integrity, ["actual_gtm_target is 'Pharmacy'"])

bad = manifest(domain="Medicine", slug="wrong", last_reviewed="9/11/2026",
               template_of_record=BAD)
bad["incumbent_set"] = [
    {"competitor_slug": "nope", "role": "enemy"},
    {"competitor_slug": "medhub", "role": "not-a-target"},
    {"competitor_slug": "one45", "role": "primary", "exclusion_reason": "should be forbidden"},
]
bad["questions"] = bad["questions"][:5]
bad["questions"][0]["coverage"] = "loads"
bad["questions"][1]["confidence"] = "certain"
bad["questions"][2]["gap_note"] = ""
bad["questions"][3]["answered_in"] = ["lenses/no-such-file.yaml", "no/such/*.yaml"]
write("dissection/medicine.yaml", bad)
expect("9 dissection: LABEL instead of raw domain, six-key rule, role/exclusion pairing, dangling answered_in",
       ccd.check_dissection_integrity,
       ["domain 'Medicine' does not match any content/domains", "slug 'wrong' does not match the filename",
        "last_reviewed '9/11/2026' is not an ISO", f"template_of_record '{BAD}' not found",
        "competitor_slug 'nope'", "role 'enemy'",
        "role 'not-a-target' requires an exclusion_reason",
        "exclusion_reason is set on role 'primary'",
        "the manifest family fixes it at", "coverage 'loads'", "confidence 'certain'",
        "requires a gap_note", "'lenses/no-such-file.yaml' does not exist",
        "'no/such/*.yaml' matches no file"])
(C / "dissection" / "medicine.yaml").unlink()

# ---------------------------------------------------------------- 10. gtm isolation
lens = yaml.safe_load((REPO / "content" / "lenses" / "standards-use-cases.yaml").read_text())
lens["use_cases"] = [{"domain": "Pharmacy", "sources": [{"source_id": "pharmacy-competitive-analysis"}],
                      "answered_in": ["content/gtm/research-pipeline.yaml"]}]
write("lenses/standards-use-cases.yaml", lens)
write("gtm/research-pipeline.yaml", {
    "last_updated": "2026-09-11",
    "stages": [{"key": k} for k in ["competitive-analysis", "market-sizing"]],
    "workstreams": [
        {"id": "pharmacy-competitive-analysis", "domain": "MD", "stage": "nope",
         "status": "blocked", "started": "11/09/2026", "target": None,
         "objective": "o", "inputs": [{"source_id": BAD}],
         "produces": ["lenses/no-such.yaml", "dissection/pharmacy.yaml"], "feeds": ["revenue"]},
        {"id": "pharmacy-competitive-analysis", "domain": "Pharmacy", "stage": "market-sizing",
         "status": "done", "blocked_by": "should be forbidden", "feeds": ["sales"]},
    ]})
expect("10 gtm isolation: downward citation caught by id AND by path; stage list, enums, blocked_by pairing",
       ccd.check_gtm_isolation,
       ["cites 'content/gtm/research-pipeline.yaml'", "cites 'pharmacy-competitive-analysis'",
        "the seven fixed stages are", "domain 'MD' is not a recognized", "stage 'nope'",
        "started '11/09/2026' is not an ISO", f"inputs[0]: source_id '{BAD}' not found",
        "'lenses/no-such.yaml' does not exist", "feeds value 'revenue'",
        "duplicate id 'pharmacy-competitive-analysis'",
        "blocked_by is set on status 'done'", "status 'blocked' requires blocked_by"])
shutil.copy(REPO / "content" / "lenses" / "standards-use-cases.yaml", C / "lenses" / "standards-use-cases.yaml")
shutil.copy(REPO / "content" / "gtm" / "research-pipeline.yaml", C / "gtm" / "research-pipeline.yaml")

# collateral routing table
WEBINAR = "webinar-axium-chart-audit-report-2022"          # registry type "webinar"
CONFERENCE = "event-aacp-experiential-education-institute-2026"  # registry type "conference"
DOC = "doc-acpe-standards-2025-full-text"                  # registry type "doc"
QUARANTINED = "sales-collateral-exxat-vendor-comparison-chart"

write("gtm/collateral.yaml", {"last_updated": "2026-09-11", "assets": [
    {"id": "a1", "kind": "sandbox", "domain": "Pharmacy", "status": "published",
     "owner_team": "sales", "claims_review_status": "not-reviewed",
     "becomes_source_id": DOC, "grounded_in": []},
    {"id": "a2", "kind": "webinar", "domain": "Pharmacy", "status": "published",
     "owner_team": "marketing", "claims_review_status": "not-reviewed",
     "becomes_source_id": QUARANTINED},
    {"id": "a3", "kind": "conference-abstract", "domain": "Pharmacy", "status": "published",
     "owner_team": "research", "claims_review_status": "not-reviewed",
     "becomes_source_id": DOC},
    {"id": "a4", "kind": "video", "domain": "Pharmacy", "status": "retired",
     "owner_team": "marketing", "claims_review_status": "not-reviewed",
     "becomes_source_id": DOC},
    {"id": "a5", "kind": "podcast", "domain": "Pharmacy", "status": "published",
     "owner_team": "marketing", "claims_review_status": "not-reviewed",
     "becomes_source_id": None},
    {"id": "a6", "kind": "brochure", "domain": "MD", "status": "shipped",
     "owner_team": "legal", "claims_review_status": "fine", "target_date": "soon",
     "published_url": "http://x", "audience": ["nope"],
     "grounded_in": ["lenses/nope.yaml"]},
]})
expect("10b collateral: per-kind becomes_source_id routing, published/retired pairing, enums",
       ccd.check_gtm_isolation,
       ["kind 'sandbox' routes to a `citable_as_fact: false` home",
        "kind 'webinar' routes to content/sources/registry.yaml, but becomes_source_id",
        "type 'doc'; kind 'conference-abstract' routes to ['conference']",
        "becomes_source_id is set on status 'retired'",
        "status 'published' requires becomes_source_id",
        "kind 'brochure'", "owner_team 'legal'", "claims_review_status 'fine'",
        "target_date 'soon'", "published_url is set on status 'shipped'",
        "audience 'nope'", "'lenses/nope.yaml' does not exist"])

# the routing table's happy paths, one per kind with a fixed destination
write("gtm/collateral.yaml", {"last_updated": "2026-09-11", "assets": [
    {"id": "ok-webinar", "kind": "webinar", "domain": "Pharmacy", "status": "published",
     "owner_team": "marketing", "claims_review_status": "reviewed-against-content",
     "becomes_source_id": WEBINAR},
    {"id": "ok-conf", "kind": "conference-abstract", "domain": "Pharmacy", "status": "published",
     "owner_team": "marketing", "claims_review_status": "not-reviewed",
     "becomes_source_id": CONFERENCE},
    {"id": "ok-sandbox", "kind": "sandbox", "domain": "Pharmacy", "status": "published",
     "owner_team": "sales", "claims_review_status": "contains-unverified-claims",
     "becomes_source_id": QUARANTINED},
    {"id": "ok-whitepaper", "kind": "whitepaper", "domain": "Pharmacy", "status": "published",
     "owner_team": "research", "claims_review_status": "reviewed-against-content",
     "grounded_in": ["lenses/product-gaps.yaml", "dissection/pharmacy.yaml"],
     "becomes_source_id": DOC},
    {"id": "ok-idea", "kind": "video", "domain": "DO", "status": "idea",
     "owner_team": "marketing", "claims_review_status": "not-reviewed",
     "becomes_source_id": None},
]})
reset_caches()
_probs = [p for p in ccd.check_gtm_isolation() if "origin" not in p]
if _probs:
    failures.append(f"10d collateral: correct routing should be clean, got {_probs}")
else:
    passes.append("10d collateral: correct per-kind routing + a documented forward reference pass clean")
shutil.copy(REPO / "content" / "gtm" / "collateral.yaml", C / "gtm" / "collateral.yaml")
expect_clean("10c gtm: the real committed pair is clean", ccd.check_gtm_isolation)

# ---------------------------------------------------------------- 11. vendor isolation
tr = yaml.safe_load((REPO / "content" / "trends" / "pharmacy.yaml").read_text())
tr["trends"][0]["sources"] = ["sales-collateral-exxat-vendor-comparison-chart"]
write("trends/pharmacy.yaml", tr)
expect("11 vendor isolation: a source_id resolving to the quarantined chart is caught",
       ccd.check_vendor_comparison_isolation, ["from the quarantined vendor-comparison-chart.yaml"])
shutil.copy(REPO / "content" / "trends" / "pharmacy.yaml", C / "trends" / "pharmacy.yaml")

vc = yaml.safe_load((C / "sources" / "vendor-comparison-chart.yaml").read_text())
vc["artifact"]["citable_as_fact"] = True
vc["artifact"]["known_contradictions"].append(vc["artifact"]["unmasked_only_vendor_rows"][0])
vc["sections"][0]["rows"].pop()
vc["module_grouping"][0]["row_count"] = 999
write("sources/vendor-comparison-chart.yaml", vc)
expect("11b vendor chart: citable_as_fact flipped to true is a hard FAIL",
       ccd.check_vendor_comparison_isolation, ["artifact.citable_as_fact is not false"])
expect("11c vendor chart: re-derived counts disagreeing with the prose are WARNs, named loudly",
       ccd.check_vendor_comparison_isolation,
       ["sections hold 80 rows, but the file's prose states 81",
        "known_contradictions holds 8, prose states 7",
        "appear in BOTH known_contradictions and unmasked_only_vendor_rows",
        "belongs in the other list",
        "row_count 999 != 39 listed row_ids",
        "module partition does not cover the transcribed rows exactly"],
       channel="warnings")
shutil.copy(REPO / "content" / "sources" / "vendor-comparison-chart.yaml",
            C / "sources" / "vendor-comparison-chart.yaml")

# ---------------------------------------------------------------- 12. scorecard
sc = yaml.safe_load((C / "scorecard" / "where-to-play.yaml").read_text())
sc["criteria"][0]["scoring_basis"] = "computed"
sc["criteria"][1]["scoring_basis"] = "qualitative-with-metric-refs"
sc["criteria"][2]["metric_refs"] = [{"path": "domains/pharmacy.yaml#market_sizing.tam.nope"},
                                    {"path": "domains/nope.yaml#market_sizing.tam.programs"}]
sc["criteria"][3]["scoring_basis"] = "qualitative-with-metric-refs"
sc["criteria"][3]["metric_refs"] = [{"path": "domains/pharmacy.yaml#market_sizing.tam.programs"}]
write("scorecard/where-to-play.yaml", sc)
expect("12 scorecard: scoring_basis enum is the file's own TWO values; metric_refs resolve into market_sizing",
       ccd.check_scorecard_metric_refs,
       ["scoring_basis 'computed' not in ['qualitative', 'qualitative-with-metric-refs']",
        "'qualitative-with-metric-refs' but metric_refs is empty",
        "'qualitative' but metric_refs is populated",
        "does not resolve to a field in pharmacy's market_sizing block",
        "does not name a content/domains/*.yaml file"])
expect("12b scorecard: market_sizing.as_of postdating the scorecard's last_updated is a WARN",
       ccd.check_scorecard_metric_refs, ["postdates the scorecard's own last_updated"],
       channel="warnings")
shutil.copy(REPO / "content" / "scorecard" / "where-to-play.yaml", C / "scorecard" / "where-to-play.yaml")
expect_clean("12c scorecard: the real 5 qualitative criteria pass", ccd.check_scorecard_metric_refs)

# ---------------------------------------------------------------- 13. capability roadmap
cap = yaml.safe_load((C / "prism" / "capability-map.yaml").read_text())
pillars = cap["core_ring"]["pillars"]
exam = next(p for p in pillars if p["name"] == "Exam Management")
exam["roadmap"] = {"target": "2027-Q2", "commitment": "maybe", "source_id": BAD}
acc = next(p for p in pillars if p["name"] == "Accreditation Management")
acc["roadmap"]["target"] = "Q4 2027"          # diverges from the flat target: "Q3 2027"
shipped = next(p for p in pillars if p["status"] == "shipped")
shipped["roadmap"] = {"target": "Q1 2028"}
write("prism/capability-map.yaml", cap)
expect("13 roadmap: bad target form, bad commitment, dangling source_id, flat/sub-object mirror divergence",
       ccd.check_capability_roadmap_integrity,
       ["roadmap.target '2027-Q2' does not match the file's own documented form",
        "roadmap.commitment 'maybe'", f"roadmap.source_id '{BAD}' not found",
        "flat target 'Q3 2027' and roadmap.target 'Q4 2027' disagree",
        "carries a roadmap: object but status is 'shipped'"],
       channel="warnings")
reset_caches()
if ccd.check_capability_roadmap_integrity():
    failures.append("13 roadmap: must be WARN-ONLY, but it returned hard FAILs")
else:
    passes.append("13 roadmap: WARN-only — returns no hard FAILs even on fully broken input")
# a status: roadmap entry with NO roadmap: object must not warn
for p in pillars:
    p.pop("roadmap", None)
write("prism/capability-map.yaml", cap)
reset_caches()
ccd.check_capability_roadmap_integrity()
if ccd.INTEGRITY_WARNINGS:
    failures.append(f"13 roadmap: a status:roadmap entry with no roadmap: object should not WARN, got {ccd.INTEGRITY_WARNINGS}")
else:
    passes.append("13 roadmap: status 'roadmap' with no roadmap: object is valid and silent")
shutil.copy(REPO / "content" / "prism" / "capability-map.yaml", C / "prism" / "capability-map.yaml")

# ---------------------------------------------------------------- report
for p in passes:
    print(f"PASS  {p}")
for f in failures:
    print(f"FAIL  {f}")
print(f"\n{len(passes)} passed, {len(failures)} failed")
shutil.rmtree(tmp)
sys.exit(1 if failures else 0)
