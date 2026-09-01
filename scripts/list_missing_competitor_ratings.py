#!/usr/bin/env python3
"""Print every (domain, standard, competitor) triple with no entry yet in
content/lenses/standards-competitor-ratings.yaml — the always-current research
punch-list for Part 2 of the accreditation-coverage fix (2026-08-27): the crosswalk's
competitor columns are honestly "unresearched" by default, and this script is how a
human finds out exactly what to research next instead of guessing from the UI.

Mirrors the domain/competitor matching in apps/ecosystem/lib/content.ts's
getStandardsCrosswalkForDomain() — kept in sync by hand, same as
check_content_density.py's own DOMAIN_TO_ACCREDITATION_SLUG mirror.

Usage: python3 scripts/list_missing_competitor_ratings.py [--domain "Physical Therapy"]
"""
import argparse
import pathlib

import yaml

REPO = pathlib.Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"

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
DOMAIN_TO_COMPETITOR_CODE = {"Medicine": "MD"}
PRIORITY_DOMAINS = ["Physician Assistant", "Occupational Therapy", "Nursing"]


def matches_domain(served, domain):
    a, b = served.lower(), domain.lower()
    return a == b or a in b or b in a


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", help="only list one domain, by its canonical label (e.g. 'Physical Therapy')")
    args = parser.parse_args()

    competitors = []
    for f in sorted((CONTENT / "competitors").glob("*.yaml")):
        if f.name.startswith("_TEMPLATE"):
            continue
        doc = yaml.safe_load(f.read_text()) or {}
        if doc.get("slug"):
            competitors.append(doc)

    rated = set()
    ratings_path = CONTENT / "lenses" / "standards-competitor-ratings.yaml"
    if ratings_path.exists():
        ratings_doc = yaml.safe_load(ratings_path.read_text()) or {}
        for r in ratings_doc.get("ratings") or []:
            rated.add((r.get("domain"), r.get("element_id"), r.get("competitor_slug")))

    domains = [args.domain] if args.domain else list(DOMAIN_TO_ACCREDITATION_SLUG)
    domains.sort(key=lambda d: (PRIORITY_DOMAINS.index(d) if d in PRIORITY_DOMAINS else len(PRIORITY_DOMAINS), d))

    missing = []
    for domain in domains:
        slug = DOMAIN_TO_ACCREDITATION_SLUG.get(domain)
        if not slug:
            print(f"Unknown domain: {domain!r}")
            continue
        accreditation_file = CONTENT / "accreditation" / f"{slug}.yaml"
        if not accreditation_file.exists():
            continue
        adoc = yaml.safe_load(accreditation_file.read_text()) or {}
        standards = adoc.get("standards") or []
        code = DOMAIN_TO_COMPETITOR_CODE.get(domain, domain)
        domain_competitors = [
            c
            for c in competitors
            if any(matches_domain(s, code) or matches_domain(s, domain) for s in c.get("domains_served") or [])
        ]
        for s in standards:
            for c in domain_competitors:
                key = (domain, s.get("element_id"), c["slug"])
                if key not in rated:
                    missing.append((domain, s.get("element_id"), c["slug"]))

    if not missing:
        print("No missing competitor ratings — every standard x competitor cell in scope is rated.")
        return

    for domain, element_id, slug in missing:
        print(f"{domain}\t{element_id}\t{slug}")
    print(f"\n{len(missing)} unrated standard x competitor cells.")


if __name__ == "__main__":
    main()
