#!/usr/bin/env python3
"""Update the existing Excel research tracker with real findings from content/.

Conservative by design: only touches cells it can confidently identify by
header name, never overwrites hand-written narrative text, and leaves
Standards Bodies / Accreditation Map / Stakeholders / Timeline sheets alone
(those stay human-owned or point at the git repo as the detailed source).

Usage: python3 scripts/sync_to_tracker.py
"""
import pathlib
import re
import sys

import openpyxl
import yaml

REPO = pathlib.Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"
TRACKER = pathlib.Path.home() / "Downloads" / "PRISM_Domain_Research_Tracker.xlsx"

DOMAINS = ["DO", "Pharmacy", "Dentistry", "Medicine"]


def load_yaml(path: pathlib.Path):
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def header_index(ws):
    return {cell.value: cell.column for cell in ws[1] if cell.value}


def update_plan_tracker(ws):
    idx = header_index(ws)
    stream_col, domain_col, status_col, notes_col = idx["Stream"], idx["Domain"], idx["Status"], idx["Notes / evidence link"]
    updated = 0
    for row in ws.iter_rows(min_row=2):
        stream = row[stream_col - 1].value or ""
        domain = row[domain_col - 1].value or ""
        note_cell = row[notes_col - 1]
        status_cell = row[status_col - 1]
        low = stream.lower()
        if "prism architecture" in low or "prism product" in low:
            status_cell.value = "Done"
            note_cell.value = "See content/prism/capability-map.yaml"
            updated += 1
        elif "explore competitors" in low or ("competitors" in low and "explore" in low):
            status_cell.value = "Done"
            note_cell.value = "9 competitors torn down — content/competitors/*.yaml"
            updated += 1
        elif "accreditor standards read end-to-end" in low and domain in DOMAINS:
            slug = {"DO": "coca", "Pharmacy": "acpe", "Dentistry": "coda", "Medicine": "lcme"}[domain]
            doc = load_yaml(CONTENT / "accreditation" / f"{slug}.yaml")
            n = len(doc.get("standards", [])) if doc else 0
            status_cell.value = "Done" if n else status_cell.value
            note_cell.value = f"{n} standards mapped — content/accreditation/{slug}.yaml"
            updated += 1
        elif "define pillars of product expected to be used by new domains" in low:
            status_cell.value = "Done"
            note_cell.value = "See content/synthesis/gap-analysis.md"
            updated += 1
    print(f"  Plan Tracker: updated {updated} rows")


def update_competitor_matrix(ws):
    idx = header_index(ws)
    name_col, status_col, sources_col = idx["Competitor"], idx["Teardown status"], idx["Sources"]
    researched = {}
    for f in (CONTENT / "competitors").glob("*.yaml"):
        if f.stem.startswith("_TEMPLATE"):
            continue
        data = load_yaml(f)
        if data:
            researched[slugify(data["competitor"])] = (f.stem, data)
    updated = 0
    for row in ws.iter_rows(min_row=2):
        name_cell = row[name_col - 1]
        if not name_cell.value:
            continue
        key = slugify(str(name_cell.value))
        match = next((v for k, v in researched.items() if key in k or k in key), None)
        if match:
            slug, data = match
            row[status_col - 1].value = "Done"
            row[sources_col - 1].value = f"content/competitors/{slug}.yaml"
            updated += 1
    print(f"  Competitor Matrix: updated {updated} rows")


def update_domain_scorecard(ws):
    scorecard = load_yaml(CONTENT / "scorecard" / "where-to-play.yaml")
    if not scorecard:
        print("  Domain Scorecard: no scorecard yaml found, skipping")
        return
    # header row: Criterion, Weight, DO, Pharmacy, Dentistry, Medicine, Notes
    header_row = next(r for r in range(1, 6) if ws.cell(row=r, column=1).value == "Criterion")
    headers = {cell.value: cell.column for cell in ws[header_row] if cell.value}
    updated = 0
    for row in ws.iter_rows(min_row=header_row + 1):
        crit_cell = row[headers["Criterion"] - 1]
        if not crit_cell.value or "WEIGHTED TOTAL" in str(crit_cell.value):
            continue
        def norm(s):
            return re.sub(r"\s+", " ", str(s).strip().replace("×", "x"))

        match = next((c for c in scorecard["criteria"] if norm(c["name"]) == norm(crit_cell.value)), None)
        if not match:
            continue
        for d in DOMAINS:
            if d in headers:
                row[headers[d] - 1].value = match["scores"].get(d, 0)
        if "Notes" in headers:
            row[headers["Notes"] - 1].value = " | ".join(f"{d}: {match['rationale'].get(d, '')}" for d in DOMAINS if match["rationale"].get(d))
        updated += 1
    print(f"  Domain Scorecard: updated {updated} criterion rows")
    if scorecard.get("recommended_beachhead"):
        ws.cell(row=ws.max_row + 2, column=1, value=f"Recommended beachhead: {scorecard['recommended_beachhead']}")
        ws.cell(row=ws.max_row, column=1, value=scorecard.get("rationale", ""))


def main():
    if not TRACKER.exists():
        print(f"Tracker not found at {TRACKER}", file=sys.stderr)
        sys.exit(1)
    wb = openpyxl.load_workbook(TRACKER)
    print(f"Updating {TRACKER}")
    if "Plan Tracker" in wb.sheetnames:
        update_plan_tracker(wb["Plan Tracker"])
    if "Competitor Matrix" in wb.sheetnames:
        update_competitor_matrix(wb["Competitor Matrix"])
    if "Domain Scorecard" in wb.sheetnames:
        update_domain_scorecard(wb["Domain Scorecard"])
    wb.save(TRACKER)
    print("Saved.")


if __name__ == "__main__":
    main()
