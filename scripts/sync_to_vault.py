#!/usr/bin/env python3
"""Mirror canonical research from content/ into the existing Obsidian vault.

Read-only with respect to content/ (the git repo is the source of truth).
Overwrites specific generated notes in the vault; never touches
40-Interviews, 70-GTM-with-Ruchi, 90-Templates, or 00-Inbox, since those are
Romit/Ruchi's own working notes, not generated content.

Usage: python3 scripts/sync_to_vault.py
"""
import pathlib
import sys

import yaml

REPO = pathlib.Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"
VAULT = pathlib.Path.home() / "Downloads" / "PRISM-Expansion-Vault"

DOMAIN_FOLDER = {"do": "DO", "pharmacy": "Pharmacy", "dentistry": "Dentistry", "medicine": "Medicine"}
DOMAIN_LABEL = {
    "do": "DO — Osteopathic Medicine",
    "pharmacy": "Pharmacy — PharmD",
    "dentistry": "Dentistry — DDS/DMD",
    "medicine": "Medicine — MD",
}


def load_yaml(path: pathlib.Path):
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def write(path: pathlib.Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(VAULT)}")


def sync_capability_map():
    data = load_yaml(CONTENT / "prism" / "capability-map.yaml")
    if not data:
        return
    lines = [f"# {data['product']} — Capability Map", "", data["tagline"], "", "## Core ring"]
    for p in data["core_ring"]["pillars"]:
        status = "🟢 Shipped" if p["status"] == "shipped" else f"🟡 Roadmap ({p.get('target', '')})"
        lines += [f"### {p['name']} — {status}", p.get("notes", "")]
        if p.get("why_it_matters"):
            lines += [f"> **Why it matters:** {p['why_it_matters']}"]
        if p.get("features"):
            lines.append("")
            lines += [f"- **{ft['name']}** — {ft.get('detail', '')}" for ft in p["features"]]
        lines.append("")
    lines += ["## Intelligence layer", data["intelligence_layer"]["description"], ""]
    lines += [f"- {c}" for c in data["intelligence_layer"]["capabilities"]]
    lines += ["", "## Exxat advantage layer", data["exxat_advantage_layer"]["description"], ""]
    lines += [f"- {c}" for c in data["exxat_advantage_layer"]["items"]]
    if data.get("served_today"):
        lines += ["", "## Served today", data["served_today"]["note"]]
    if data.get("open_questions_for_phase_2"):
        lines += ["", "## Open questions"]
        lines += [f"- [ ] {q}" for q in data["open_questions_for_phase_2"]]
    lines += ["", f"*Sources: {'; '.join(data['sources'])} — updated {data['last_updated']}*"]
    write(VAULT / "30-Product-Map" / "_PRISM Capability Map.md", "\n".join(lines))


def sync_domains():
    for f in sorted((CONTENT / "domains").glob("*.yaml")):
        if f.stem.startswith("_TEMPLATE"):
            continue
        data = load_yaml(f)
        if not data:
            continue
        folder = DOMAIN_FOLDER.get(f.stem, f.stem)
        lines = [f"# {data.get('full_name', f.stem)} — Domain Profile", ""]
        lines += [f"**Credential:** {data.get('credential', '')} · **Program length:** {data.get('program_length_years', '')} years", ""]
        if data.get("market"):
            m = data["market"]
            lines += ["## Market", f"- Programs: {m.get('program_count', '')} ({m.get('program_count_trend', '')})", f"- Enrollment: {m.get('total_enrollment', '')}", ""]
        if data.get("standards_bodies"):
            lines += ["## Standards bodies"]
            lines += [f"- **{b['name']}** — {b['type']}" for b in data["standards_bodies"]]
            lines.append("")
        if data.get("clinical_education_shape"):
            lines += ["## Clinical education shape", data["clinical_education_shape"], ""]
        if data.get("distinctive_pain_points"):
            lines += ["## Distinctive pain points"]
            lines += [f"- {p['claim']} #gap" for p in data["distinctive_pain_points"]]
        write(VAULT / "10-Domains" / folder / f"_{folder} Domain Profile.md", "\n".join(lines))


def sync_competitors():
    for f in sorted((CONTENT / "competitors").glob("*.yaml")):
        if f.stem.startswith("_TEMPLATE"):
            continue
        data = load_yaml(f)
        if not data:
            continue
        lines = [f"# {data['competitor']}", "", f"**Category:** {data.get('category', '')}", f"**Domains served:** {', '.join(data.get('domains_served', []))}", ""]
        if data.get("feature_teardown"):
            lines += ["## Feature teardown", "", "| Pillar | Capability | Depth vs. Prism |", "|---|---|---|"]
            for ft in data["feature_teardown"]:
                lines.append(f"| {ft.get('pillar','')} | {ft.get('competitor_capability','')} | {ft.get('depth_vs_prism','')} |")
            lines.append("")
        if data.get("strengths"):
            lines += ["## Strengths"] + [f"- {s['claim']}" for s in data["strengths"]] + [""]
        if data.get("weaknesses"):
            lines += ["## Weaknesses"] + [f"- {w['claim']}" for w in data["weaknesses"]] + [""]
        if data.get("exxat_opportunity"):
            lines += ["## Exxat opportunity #opportunity", data["exxat_opportunity"], ""]
        lines += [f"**Retention anchor:** {data.get('retention_anchor', '')}", f"**Pricing:** {data.get('pricing_signal', '')}", ""]
        if data.get("sources"):
            lines += ["## Sources"] + [f"- {s}" for s in data["sources"]]
        write(VAULT / "20-Competitors" / f"{data['competitor']}.md", "\n".join(lines))


def sync_accreditation():
    for f in sorted((CONTENT / "accreditation").glob("*.yaml")):
        if f.stem.startswith("_TEMPLATE"):
            continue
        data = load_yaml(f)
        if not data:
            continue
        lines = [f"# {data['accreditor']}", "", f"**Domain:** {data.get('domain', '')}", data.get("governs", ""), ""]
        if data.get("standards"):
            lines += ["## Standards", "", "| Element | Evidence required | Prism fit | Gap notes |", "|---|---|---|---|"]
            for s in data["standards"]:
                lines.append(f"| {s.get('element_id','')} | {s.get('evidence_programs_must_produce','')} | {s.get('prism_fit','')} | {s.get('gap_notes','')} #gap |")
            lines.append("")
        if data.get("licensure_or_gme_layer"):
            lines += ["## Licensure / GME / association layer"]
            lines += [f"- **{b['body']}** — {b.get('what_it_governs','')}" for b in data["licensure_or_gme_layer"]]
        write(VAULT / "50-Accreditation" / f"{data['accreditor'].split('(')[0].strip()}.md", "\n".join(lines))


def sync_personas_and_journeys():
    for f in sorted((CONTENT / "personas").glob("*.yaml")):
        if f.stem.startswith("_TEMPLATE"):
            continue
        data = load_yaml(f)
        if not data:
            continue
        name = data.get("persona_name") or data.get("role_name") or data.get("competitor") or f.stem
        lines = [f"# {name} #persona", "", yaml.safe_dump(data, sort_keys=False, allow_unicode=True)]
        write(VAULT / "60-Synthesis" / "Personas" / f"{f.stem}.md", "\n".join(lines))

    for f in sorted((CONTENT / "journeys").glob("*.yaml")):
        if f.stem.startswith("_TEMPLATE"):
            continue
        data = load_yaml(f)
        if not data:
            continue
        lines = [f"# {data['journey_name']}", "", f"**Domains:** {', '.join(data.get('domain_scope', []))} · **Persona:** {data.get('persona', '')}", ""]
        for s in data.get("stages", []):
            lines += [f"## {s['stage']}", f"- Current state: {s.get('current_state_in_prism', '')}", f"- Pain/gap: {s.get('pain_or_gap', '')} #gap", f"- Competitors: {s.get('competitor_comparison', '')}", ""]
        write(VAULT / "60-Synthesis" / "Journeys" / f"{f.stem}.md", "\n".join(lines))


def sync_synthesis_markdown():
    for src, dest in [
        (CONTENT / "synthesis" / "gap-analysis.md", VAULT / "60-Synthesis" / "Gap Analysis.md"),
        (CONTENT / "synthesis" / "vocabulary-glossary.md", VAULT / "60-Synthesis" / "Vocabulary Glossary.md"),
        (CONTENT / "synthesis" / "prism-positioning.md", VAULT / "60-Synthesis" / "PRISM Positioning.md"),
        (CONTENT / "synthesis" / "positioning-and-element-flows-plan.md", VAULT / "60-Synthesis" / "Positioning & Element-Flows Plan.md"),
        (CONTENT / "enterprise-repo" / "tool-comparison.md", VAULT / "60-Synthesis" / "Enterprise Repo Comparison.md"),
    ]:
        if src.exists():
            write(dest, src.read_text(encoding="utf-8"))


def sync_scorecard():
    data = load_yaml(CONTENT / "scorecard" / "where-to-play.yaml")
    if not data:
        return
    domains = ["DO", "Pharmacy", "Dentistry", "Medicine"]
    lines = ["# Where-to-Play Scorecard", "", "| Criterion | Weight | " + " | ".join(domains) + " |", "|---|---|" + "---|" * len(domains)]
    for c in data["criteria"]:
        row = [c["name"], f"{c['weight']:.0%}"] + [str(c["scores"].get(d, "")) for d in domains]
        lines.append("| " + " | ".join(row) + " |")
    lines += ["", f"**Recommended beachhead:** {data.get('recommended_beachhead', '')}", "", data.get("rationale", "")]
    write(VAULT / "60-Synthesis" / "Where-to-Play Scorecard.md", "\n".join(lines))


def main():
    if not VAULT.exists():
        print(f"Vault not found at {VAULT}", file=sys.stderr)
        sys.exit(1)
    print(f"Syncing {CONTENT} -> {VAULT}")
    sync_capability_map()
    sync_domains()
    sync_competitors()
    sync_accreditation()
    sync_personas_and_journeys()
    sync_synthesis_markdown()
    sync_scorecard()
    print("Done.")


if __name__ == "__main__":
    main()
