#!/usr/bin/env python3
"""Print every (domain, capability_id, competitor_slug) cell with no entry yet in
content/lenses/feature-comparison-matrix.yaml — the research punch-list for Phase 2/3,
and the sibling of scripts/list_missing_competitor_ratings.py one granularity down
(feature rows rather than accreditation standards).

WHERE THE SCOPE COMES FROM. The competitor axis is NOT every file in
content/competitors/: it is the `incumbent_set` a domain's own dissection manifest
(content/dissection/<slug>.yaml) declares, minus anyone marked role: "not-a-target". The
capability axis is the capability_id rows that already exist in the matrix for that
domain, grouped under the capability-map.yaml pillar each row names. That means this
script reports what is missing against a scope somebody actually decided, rather than
inventing a cross-product nobody committed to researching.

Three kinds of gap are reported, because they are three different jobs:
  MISSING CELL   a competitor in scope has no verdict on a row that exists
  MISSING EXXAT  a row is rated for a competitor but exxat_cells[] says nothing about
                 Exxat — the one gap that scripts/check_content_density.py treats as a
                 hard FAIL, since "Exxat: present on everything" with no evidence is the
                 exact failure content/sources/vendor-comparison-chart.yaml is
                 quarantined for
  EMPTY PILLAR   a pillar with no capability rows at all for this domain

Both families are still empty today (content/dissection/ holds only its _TEMPLATE), so
the honest output right now is a short "nothing to work from yet" line, not silence.

Usage: python3 scripts/list_missing_feature_matrix_cells.py [--domain "Pharmacy"]
"""
import argparse
import pathlib

import yaml

REPO = pathlib.Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"

# The canonical app-level domain label, mirrored by hand from
# apps/ecosystem/lib/content.ts — same convention as
# scripts/list_missing_competitor_ratings.py and check_content_density.py.
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
# A dissection manifest's top-level `domain:` deliberately carries the RAW
# content/domains/<slug>.yaml value, not the app label — medicine.yaml says "MD" while
# every lens joins on "Medicine". Both are correct for their own purpose; this is where
# the two meet, so this is where they get translated.
DOMAIN_SLUG_TO_LABEL = {"do": "DO", "pharmacy": "Pharmacy", "dentistry": "Dentistry", "medicine": "Medicine"}


def load(path):
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text()) or {}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", help="only list one domain, by its canonical label (e.g. 'Pharmacy')")
    args = parser.parse_args()

    raw_to_label = {}
    for f in sorted((CONTENT / "domains").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        raw = load(f).get("domain")
        label = DOMAIN_SLUG_TO_LABEL.get(f.stem)
        if raw and label:
            raw_to_label[raw] = label

    # scope: domain label -> in-scope competitor slugs, from the dissection manifests
    scope = {}
    manifests = 0
    for f in sorted((CONTENT / "dissection").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        manifests += 1
        doc = load(f)
        label = raw_to_label.get(doc.get("domain"), doc.get("domain"))
        slugs = sorted({
            e.get("competitor_slug")
            for e in (doc.get("incumbent_set") or [])
            if isinstance(e, dict) and e.get("role") != "not-a-target" and e.get("competitor_slug")
        })
        if slugs:
            scope.setdefault(label, []).extend(slugs)

    if not manifests:
        print("No dissection manifests found yet — content/dissection/ holds only _TEMPLATE.yaml.")
        print("A domain's incumbent_set is what scopes this worklist, so there is nothing to")
        print("cross against until the first per-domain manifest lands (Phase 2).")
        return

    pillars = [p.get("name") for p in (load(CONTENT / "prism" / "capability-map.yaml")
                                       .get("core_ring", {}).get("pillars") or []) if p.get("name")]

    matrix = load(CONTENT / "lenses" / "feature-comparison-matrix.yaml")
    cells = matrix.get("cells") or []
    exxat_cells = matrix.get("exxat_cells") or []
    rated = {(c.get("domain"), c.get("capability_id"), c.get("competitor_slug")) for c in cells}
    exxat_rated = {(c.get("domain"), c.get("capability_id")) for c in exxat_cells}

    # capability rows that exist, per (domain, pillar)
    rows_by_domain = {}
    pillar_of = {}
    for c in cells:
        domain, cap_id = c.get("domain"), c.get("capability_id")
        if not cap_id:
            continue
        rows_by_domain.setdefault(domain, set()).add(cap_id)
        pillar_of[(domain, cap_id)] = c.get("pillar")

    domains = [args.domain] if args.domain else sorted(scope)
    missing_cells, missing_exxat, empty_pillars = [], [], []
    for domain in domains:
        if domain not in scope:
            print(f"No dissection manifest (or no in-scope incumbents) for domain: {domain!r}")
            continue
        competitors = sorted(set(scope[domain]))
        cap_ids = sorted(rows_by_domain.get(domain, set()))
        for cap_id in cap_ids:
            for slug in competitors:
                if (domain, cap_id, slug) not in rated:
                    missing_cells.append((domain, cap_id, slug))
            if (domain, cap_id) not in exxat_rated:
                missing_exxat.append((domain, cap_id))
        covered = {pillar_of.get((domain, c)) for c in cap_ids}
        for pillar in pillars:
            if pillar not in covered:
                empty_pillars.append((domain, pillar))

    for domain, cap_id, slug in missing_cells:
        print(f"MISSING CELL\t{domain}\t{cap_id}\t{slug}")
    for domain, cap_id in missing_exxat:
        print(f"MISSING EXXAT\t{domain}\t{cap_id}")
    for domain, pillar in empty_pillars:
        print(f"EMPTY PILLAR\t{domain}\t{pillar}")

    if not (missing_cells or missing_exxat or empty_pillars):
        print("No missing feature-matrix cells — every in-scope domain x capability x competitor cell is rated.")
        return
    print(
        f"\n{len(missing_cells)} unrated domain x capability x competitor cell(s), "
        f"{len(missing_exxat)} row(s) with no Exxat verdict, "
        f"{len(empty_pillars)} pillar(s) with no capability rows at all."
    )


if __name__ == "__main__":
    main()
