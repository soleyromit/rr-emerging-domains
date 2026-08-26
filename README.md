# rr-emerging-domains

The enterprise research repo for Exxat PRISM's expansion into four adjacent
doctoral-level domains: **DO (Osteopathic Medicine), Pharmacy (PharmD),
Dentistry (DDS/DMD), and Medicine (MD)**.

Owners: Romit Soley (Product Research) × Ruchi (Marketing Consultant).

## Why a git repo instead of Dovetail/Notion/Airtable

See [`content/enterprise-repo/tool-comparison.md`](content/enterprise-repo/tool-comparison.md)
for the full comparison. Short version: every claim in this research needs a
citation and a history — a git repo of plain YAML/Markdown gives both for
free (`git log`, `git blame`, `git diff`), works offline, isn't locked behind
a per-seat SaaS subscription, and is trivial to keep in sync with the
existing Obsidian vault workflow (`scripts/sync_to_vault.py`) and Excel
tracker (`scripts/sync_to_tracker.py`).

## Layout

```
content/              canonical, cited research data — the actual "repo"
  prism/               Exxat PRISM's real capability map (grounded in
                        internal product docs, not assumptions)
  domains/              market context per domain (DO/Pharmacy/Dentistry/Medicine)
  competitors/           feature-level teardown per incumbent, cited
  accreditation/          standard -> evidence -> software behavior -> Prism
                          fit (Transfer/Configure/Build/Gap), per accreditor
  personas/               discipline layer, role layer, competitor lens
  journeys/                current-state vs. gap-state, per journey
  scorecard/                the real Where-to-Play weighted scorecard
  synthesis/                 gap analysis + the "vocabulary-ahead" glossary
  enterprise-repo/            why this repo shape, vs. alternatives
  interviews/                  EMPTY templates only — real CS/AM/leadership
                                interviews go here as Romit conducts them

apps/ecosystem/        the real, dependency-installed visual app (Next.js +
                        shadcn/ui + d3 + Observable Plot) that renders
                        content/ for a leadership/marketing audience.
                        Run locally: `cd apps/ecosystem && npm run dev`

scripts/
  sync_to_vault.py       mirrors content/ into ~/Downloads/PRISM-Expansion-Vault
                         (the existing Obsidian vault) — run after any
                         research update so Romit's daily Obsidian workflow
                         stays current
  sync_to_tracker.py     updates ~/Downloads/PRISM_Domain_Research_Tracker.xlsx
                         (Plan Tracker status, Competitor Matrix teardown
                         status, Domain Scorecard) from the same source
```

## Companion documents

- `~/Downloads/PRISM_Domain_Expansion_Plan.docx` — the full working-draft
  plan (executive summary, role charter, borrowed strategy practices,
  phased timeline). This repo is where that plan's evidence actually lives.
- `~/Downloads/PRISM-Expansion-Vault/` — the Obsidian vault for day-to-day
  capture (inbox, interview notes, weekly synthesis). Kept in sync with
  `content/` via `scripts/sync_to_vault.py`, but 40-Interviews,
  70-GTM-with-Ruchi, 90-Templates, and 00-Inbox stay human-owned.
- `~/Downloads/PRISM_Domain_Research_Tracker.xlsx` — the weekly-cadence
  tracker. Kept in sync via `scripts/sync_to_tracker.py`.

## Updating research

Content under `content/` is written by research agents following the
`_TEMPLATE*.yaml` schema in each subfolder — every non-trivial claim carries
a `source`. To refresh a section, re-run the relevant research and overwrite
the file; the app in `apps/ecosystem` reads `content/` at request time, so
changes show up on `npm run dev` without a rebuild.
