# rr-emerging-domains — orientation

This repo is a research evidence base (`content/`) plus a Next.js app that renders it
(`apps/ecosystem/`). Read `content/ARCHITECTURE.md` before adding any claim to
`content/` — it explains the citation rule (every file cites only the level below it)
that the whole repo depends on for traceability.

## Before writing content in `content/`

Read `content/CONTENT-DENSITY.md`. It has a character-ceiling table per field type and
the "decompose into a list before you write an essay" rule — both exist because a
length brief given only in a prompt was silently ignored on one journey file (98% of
entries ran 3-4x over target). Before declaring content-writing work done, run:

```
python3 scripts/check_content_density.py
```

from the repo root. Zero unexplained `FAIL`s, or an explicit reason added to the
script's `ALLOWLIST` — not a silent overage.

## Before building or editing a page/component in `apps/ecosystem/`

Read `apps/ecosystem/UI-DENSITY-PATTERNS.md`. It names the reusable components
(`FieldBlock`, `KeyFindingList`, `DisciplineVarianceList`, `SeverityDistributionChart`,
`DisciplineChip`) and the two-zone page shape (scan layer → `Divider` → closed
deep-dive) that every content-heavy page should follow, with reference implementations
cited by file path. Before declaring UI work done, run:

```
cd apps/ecosystem && npm run check:density && npx next build
```

Both checks are enforced, not optional. A `Collapsible`-wrapping component that looks
right in the source but wraps non-collapsible children will pass `next build` and still
be wrong — open the page in a browser and actually click things before calling it done.

## Both checks exist because a request alone didn't hold

An audit of this repo's own content found a written brief ("1-2 sentences") that a
content-writing agent didn't follow once handed rich source material, and a rendering
bug (a fake `CollapsibleGroup`) that shipped because it type-checked and built cleanly.
Neither of the two docs above is new process for its own sake — both are the direct fix
for a specific, measured failure. Read them before you repeat it.
