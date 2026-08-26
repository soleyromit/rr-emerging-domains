---
title: "Research Repository Tool Comparison"
doc_type: decision-memo
status: decided
owners:
  - Romit Soley
  - Ruchi
date: 2026-08-24
decision: "Git repo of structured Markdown/YAML in rr-emerging-domains/content, rendered by an internal Next.js app"
---

# Research Repository Tool Comparison

**Why the canonical repo for the Exxat emerging-domains research initiative is a git repo of
Markdown/YAML — not Dovetail, Notion, Airtable, Condens, EnjoyHQ, or Aurelius.**

## The requirements this decision has to satisfy

This isn't a generic "pick a research tool" decision. The initiative has four hard constraints
that most repository tools are not built around:

1. **Citable** — every claim (a persona trait, a journey pain point, a competitor capability, an
   accreditation requirement) has to trace to a specific source: an interview transcript, a public
   filing, a screenshot, a standards document. Not "AI-summarized from your corpus" — a literal,
   auditable pointer.
2. **Version-controlled** — this runs for months. Personas and competitor teardowns will be
   revised as new evidence comes in, and the team needs to see *what changed, when, and why*, with
   the ability to diff or revert any single file.
3. **Usable by two people with very different tool comfort** — Romit (product researcher, lives in
   code/structured data) and Ruchi (marketing consultant, works in docs and decks, is not going to
   learn a query language).
4. **Syncs with an existing Obsidian vault workflow** — Romit already keeps working notes in
   Obsidian. The repository can't be a second silo that has to be manually re-entered.

Below is what each mainstream option is actually good at, what it costs, and where it breaks
against these four constraints.

## Comparison table

| Tool | Best at | Pricing signal (2025/2026) | Citability | Version control | Fits multi-person / low-code-comfort collab | Obsidian sync | Fit for this initiative |
|---|---|---|---|---|---|---|---|
| **Dovetail** | Purpose-built research repo: tagging, highlight reels, AI-generated insight cards with source citations back to the original transcript/clip | Free tier (≤3 seats, limited storage); Professional ~$29–39/editor/mo; Business ~$39–49/editor/mo (annual); Enterprise custom. A 5-person team runs ~$145–195/mo, ~$11k+/yr fully cross-functional ([Vendr](https://www.vendr.com/marketplace/dovetail), [CleverX](https://cleverx.com/blog/dovetail-pricing-plans-explained/)) | **Strong** — highlights and "Ask Dovetail" answers cite back to source clips/insights ([Dovetail](https://dovetail.com/blog/how-we-built-ai-in-dovetail-magic-search-and-ask-dovetail/)) | Weak — internal revision history only, not real diff/branch/rollback; no git-grade audit trail | Good for researchers; non-researcher collaborators (Ruchi) usually need paid/viewer seats, adding cost per person | None — proprietary hosted store, no file-level export/sync path into a vault | Best-in-class *inside its own walled garden*, but the content lives in Dovetail's database, not in files Romit and Ruchi can both edit, diff, or keep in Obsidian. Per-seat cost also scales badly for a two-person team that needs both people as full editors long-term. |
| **Notion (as repo)** | Flexible docs + linked databases; good for connecting research to PRDs/roadmap items; real-time co-editing | Free (limited); Plus ~$10/seat/mo; Business ~$18–20/seat/mo; Enterprise custom | Weak — citation is manual (a link or quoted text pasted in); nothing enforces "every claim has a source" | Weak — page history exists but there's no meaningful diff/branch model, and it degrades with large databases | Very good — easiest tool here for a non-technical collaborator | No native sync; would need a plugin/export pipeline that keeps breaking | Easy to start, easy to make messy. At months-long scale with dozens of competitor/persona/journey docs, Notion's structure erodes without a schema, and there's no way to prove a claim's source at a glance. It's a fine *notes* tool, a weak *evidence system*. |
| **Airtable** | Structured, relational data — good if research repo = rows of tagged insights linked to studies/participants | Free; Team $20/seat/mo (annual); Business $45/seat/mo; Enterprise Scale from ~$60/seat/mo, custom ([various 2026 pricing roundups](https://tinycommand.com/blogs/airtable-pricing-explained)) | Medium — you *can* build a "source" field/linked record per insight, but nothing enforces it structurally; it's DIY schema discipline | Weak — revision history exists on paid tiers but no branch/diff workflow | Medium — spreadsheet mental model is approachable, but relational views/automations need setup work only one person will own | None natively | Structurally closer to what's needed (relational, tabular) but it's the same problem as Notion: proprietary hosted store, per-seat pricing, no git-grade history, no file sync. Good template ideas ([Airtable's own UX research templates](https://www.airtable.com/articles/ux-research-repositories)), wrong storage layer for this team. |
| **Condens** | Cheapest dedicated research repository; clean tagging + evidence-linking UX built specifically for UX research | ~$15/user/mo, free plan available — well below Dovetail ([Looppanel](https://www.looppanel.com/blog/condens-alternatives), [Koji](https://www.koji.so/blog/best-ux-research-repository-tools-2026)) | Strong within its domain — insights link back to source notes/transcripts | Weak — same category limitation as Dovetail: internal history, not git-grade | Good — simpler than Dovetail, still a hosted proprietary app | None | Cheaper Dovetail-class alternative, but the core problem is identical: it's a hosted SaaS database, not files. Everything below (portability, diffability, Obsidian sync) still fails. |
| **EnjoyHQ / User Interviews (repo product)** | Centralizing interviews/feedback into searchable "stories"; was an early, credible repository category leader | Contact-sales pricing at scale; industry commentary in 2026 notes stalled roadmap momentum since the UserTesting/Thoma Bravo/UserZoom consolidation and teams actively migrating off it ([BuildBetter](https://blog.buildbetter.ai/best-enjoyhq-alternatives-in-2026/)) | Medium — supports source linking, but tooling investment has visibly slowed | Weak | Medium | None | Vendor-risk problem on top of the same structural issues as Dovetail/Condens — a multi-month initiative shouldn't build its canonical source of truth on a platform with acknowledged roadmap uncertainty. |
| **Aurelius** | Lightweight repository + analysis board (tagging, affinity clustering) aimed at solo/small research teams and agencies | Professional (solo/agency) ~$49/mo; Team/Premium ~$199/mo; Enterprise custom ([G2](https://www.g2.com/products/aurelius/pricing)) | Medium — tag/evidence linking exists, less mature than Dovetail/Condens | Weak | Good for a 2-person team specifically, priced for exactly that | None | Reasonably priced for a two-person team, but still a closed hosted database with the same portability and Obsidian-sync gap as every other SaaS option on this list. |
| **Obsidian + git (DIY)** | Plain-text notes with full version control, when paired with the `obsidian-git` plugin or a plain repo | Obsidian free for personal/commercial single-vault use; git/GitHub effectively free at this scale; no per-seat SaaS fee | Strong *if disciplined* — every note can carry an explicit `source:` field/link, enforced by convention/schema rather than app UI | **Strong** — real git history: every edit is a commit, fully diffable, branchable, revertable, blameable ([obsidian-git plugin](https://github.com/Vinzent03/obsidian-git)) | Workable for two people, but git merge conflicts are a real barrier for a non-engineer without guardrails ([Fleece AI](https://fleeceai.company/blog/obsidian-for-teams-2026)) | **Native** — it *is* the Obsidian vault | Closest fit, but "raw Obsidian+git" pushes git mechanics (merge conflicts, commit hygiene) directly onto Ruchi with no structure enforcing consistent citation fields across files. |

## Why "structured Markdown/YAML in git, rendered by a small Next.js app" beats all of the above

The chosen approach is best understood as **Obsidian+git's strengths, with the DIY approach's one
real weakness (no structure, no non-technical UI) removed**:

- **Citability is structural, not a habit.** Every competitor teardown, persona, journey, and
  accreditation-standard entry is a YAML/Markdown file with required fields (e.g., `source_url`,
  `source_type`, `date_collected`, `confidence`). A claim without a source field doesn't validate —
  citation isn't a norm the team has to remember, it's schema. None of Dovetail, Notion, Airtable,
  or Condens can enforce this at the data layer; they can only make citation *convenient*.
- **Version control is git, the real thing.** Every change is a commit with a diff, an author, and
  a timestamp. Romit can see exactly how a persona evolved over four months, revert a bad edit, or
  branch a draft accreditation mapping before merging it — capabilities that Dovetail/Condens/Notion
  approximate with a page-history feature and Airtable barely offers at all. This directly matters
  for a document leadership will eventually audit.
- **It syncs with Obsidian natively, because it *is* a vault.** The `content/` folder opens
  directly as an Obsidian vault — Romit keeps working in the tool he already uses daily, with no
  export/import pipeline to maintain or let drift out of sync. Every other option in the table
  either has no sync path or requires a brittle third-party bridge.
- **Ruchi doesn't need git fluency to contribute.** The small internal Next.js app is the answer to
  Obsidian+git's real weakness: it renders the same files as readable, navigable pages (and, if
  needed later, a simple form-based editor) so Ruchi can read, comment, and contribute structured
  entries without resolving a merge conflict or learning YAML by hand. This is the piece pure
  "Obsidian+git" DIY setups lack.
- **No per-seat SaaS tax, no vendor risk, full data ownership.** Dovetail alone can run ~$150–200+/mo
  for a small cross-functional group and thousands per year at scale; Condens and Aurelius are
  cheaper but still recurring per-seat costs; EnjoyHQ carries visible roadmap/vendor risk after its
  acquisition chain. A git repo has no seat fee, can't be sunset by a vendor, and the content
  outlives any tool built on top of it — critical for a multi-month, cross-functional initiative
  whose output (personas, journeys, teardowns) needs to remain the durable source of truth long
  after this research phase ends.
- **It composes with the rest of the codebase.** Because `content/` is plain files in the same
  repo as the Next.js renderer, the scorecard, capability maps, and persona/journey data can be
  cross-linked, validated with scripts (e.g., "flag any competitor claim missing a source"), and
  rendered into whatever views leadership needs (comparison tables, journey maps) — the same
  workflow-composability that generic "git-based CMS" architectures are built around, and that a
  closed SaaS repository cannot offer because the data never leaves its database ([git-based CMS
  overview](https://gitcms.dev/blog/git-based-cms-vs-headless-cms/)).

**The honest trade-off**, for leadership context: Dovetail's AI-assisted tagging, transcript
highlight reels, and "Ask Dovetail" natural-language search over a large interview corpus are
genuinely more polished than anything the internal Next.js app will have on day one — Dovetail is
the better tool if the job were *purely* running and re-analyzing dozens of live interview
recordings. But that isn't this initiative's job. The core output here is structured, cited,
long-lived reference data (personas, journeys, competitor teardowns, accreditation mappings) that
must survive for months, be jointly editable by a researcher and a marketing consultant, be
auditable claim-by-claim, and live inside a workflow Romit already runs in Obsidian. On those four
requirements specifically, every hosted repository tool trades away either portability, real
version control, enforced citation, or Obsidian-native sync to gain a nicer UI — and a UI is the
one gap a small internal Next.js app can close without giving up the other three.

## Recommendation

**Adopt the git repo of structured Markdown/YAML (`rr-emerging-domains/content`) as the canonical
research repository**, rendered by the internal Next.js app for readable/navigable views, with the
`content/` folder doubling as Romit's live Obsidian vault. Do not adopt Dovetail, Notion, Airtable,
Condens, EnjoyHQ, or Aurelius as the system of record — each is a reasonable *interview-capture or
notes tool* but fails at least two of the four hard requirements (citability-as-schema, real
version control, Obsidian-native sync, no per-seat vendor lock-in). If raw interview recordings and
transcripts need dedicated capture/tagging tooling at some point, a lightweight tool like Condens
(cheapest, simplest) could sit *upstream* of this repo purely for the interview-processing step —
but the canonical, citable, versioned source of truth for personas, journeys, teardowns, and
accreditation mappings should remain the git repo, not a SaaS database.

## Sources

- [Dovetail Pricing 2026 — G2](https://www.g2.com/products/dovetail-research-pty-ltd-dovetail/pricing)
- [Dovetail Software Pricing & Plans 2026 — Vendr](https://www.vendr.com/marketplace/dovetail)
- [Dovetail pricing plans explained: what you actually pay in 2026 — CleverX](https://cleverx.com/blog/dovetail-pricing-plans-explained/)
- [How we built AI in Dovetail — magic search and Ask Dovetail](https://dovetail.com/blog/how-we-built-ai-in-dovetail-magic-search-and-ask-dovetail/)
- [Notion Review 2026 — Taskade](https://www.taskade.com/blog/notion-review)
- [Notion Reviews 2026 — Capterra](https://www.capterra.com/p/186596/Notion/reviews/)
- [Airtable Pricing 2026 — TinyCommand](https://tinycommand.com/blogs/airtable-pricing-explained)
- [9 best research repositories for UX (2026) — Airtable](https://www.airtable.com/articles/ux-research-repositories)
- [Best Condens Alternatives in 2025 — Looppanel](https://www.looppanel.com/blog/condens-alternatives)
- [Best UX Research Repository Tools in 2026 — Koji](https://www.koji.so/blog/best-ux-research-repository-tools-2026)
- [Best EnjoyHQ Alternatives in 2026 — BuildBetter](https://blog.buildbetter.ai/best-enjoyhq-alternatives-in-2026/)
- [Aurelius Pricing 2025 — G2](https://www.g2.com/products/aurelius/pricing)
- [6 Best UX Research Repository Tools (2025) — Looppanel](https://www.looppanel.com/blog/repository-tools)
- [Obsidian for Teams in 2026: What Works, What Breaks — Fleece AI](https://fleeceai.company/blog/obsidian-for-teams-2026)
- [obsidian-git plugin — GitHub](https://github.com/Vinzent03/obsidian-git)
- [How to sync your Obsidian vault using GitHub — DEV Community](https://dev.to/padiazg/how-to-sync-your-obsidian-vault-using-github-a-complete-guide-2l08)
- [Git-Based CMS vs API-Based Headless CMS: How They Compare in 2026 — GitCMS](https://gitcms.dev/blog/git-based-cms-vs-headless-cms/)
- [What Is a Git-Based CMS? — Crafter CMS](https://craftercms.com/blog/2021/07/what-is-a-git-based-cms)
