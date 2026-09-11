#!/usr/bin/env python3
"""Take a reviewable, citable snapshot of the curated pharmacy Zendesk tickets.

Why this script exists
----------------------
`apps/ecosystem/app/zendesk/pharmacy-feature-gaps/page.tsx` used to be a
`force-dynamic` page that called `fetchPharmacyFeatureGaps()` on every request
and rendered the result straight to the UI. That was the one place in the whole
app where a claim reached a reader with no `source:` behind it — it bypassed the
evidence model in content/ARCHITECTURE.md entirely, and the *reasoning* for the
four hardcoded ticket ids lived only in a source-code comment.

This script moves the output of that logic from "fetched live on every page
view" to "fetched once, reviewed by a human, committed as content." It does NOT
change the selection logic: it imports and calls the app's existing
`fetchPharmacyFeatureGaps()` unchanged, via scripts/snapshot_zendesk_fetch.mjs.

Auth
----
Static API-token auth only: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN.
The OAuth routes under apps/ecosystem/app/api/zendesk/ are untouched and remain
available for interactive one-off testing.

Usage
-----
    ZENDESK_SUBDOMAIN=... ZENDESK_EMAIL=... ZENDESK_API_TOKEN=... \
        python3 scripts/snapshot_zendesk.py [--domain Pharmacy] [--date YYYY-MM-DD]

Writes content/sources/support-tickets/<domain-slug>-<date>.yaml and refuses to
clobber an existing file unless --force is passed.
"""
import argparse
import datetime as dt
import json
import os
import pathlib
import subprocess
import sys

import yaml

REPO = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = REPO / "content" / "sources" / "support-tickets"
FETCHER = REPO / "scripts" / "snapshot_zendesk_fetch.mjs"

# Quoted verbatim from the docstring on PHARMACY_FEATURE_GAP_TICKET_IDS in
# apps/ecosystem/lib/zendesk/client.ts. Kept here so the snapshot carries the
# reasoning as content, not only as a code comment.
SELECTION_METHOD = (
    'Curated ticket-id list, not a query. Zendesk\'s own Domain taxonomy has no Pharmacy value, and a\n'
    'full-text "pharmacy" search is dominated by unrelated results. These 4 ids were manually\n'
    "identified and hardcoded in apps/ecosystem/lib/zendesk/client.ts.\n"
)

REVIEW_REMINDER = (
    "Review this file for PII before committing. Every ticket must have "
    "`redacted: true` set only after a human has reviewed it."
)


def fetch_tickets() -> list[dict]:
    """Run the Node wrapper and return the raw FeatureGapTicket[] it prints."""
    if not FETCHER.exists():
        sys.exit(f"Missing fetcher: {FETCHER}")
    proc = subprocess.run(
        [
            "node",
            # Node >= 22.6 strips TS types; explicit so 22.6-22.17 works too.
            "--experimental-strip-types",
            # client.ts sits under a package.json with no "type": "module";
            # Node reparses it as ESM and warns. The warning is cosmetic.
            "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
            str(FETCHER),
        ],
        capture_output=True,
        text=True,
        cwd=REPO,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
        sys.exit(
            f"snapshot_zendesk: fetch failed (exit {proc.returncode}). "
            "Set ZENDESK_SUBDOMAIN / ZENDESK_EMAIL / ZENDESK_API_TOKEN and retry."
        )
    return json.loads(proc.stdout)


def build_snapshot(tickets: list[dict], domain: str, taken: str) -> dict:
    """Map FeatureGapTicket[] onto the content/sources/support-tickets schema.

    Field names on the right-hand side are the ones client.ts's FeatureGapTicket
    actually returns (ticketId, subject, status, organizationId,
    organizationName, category, url) — do not rename them here without reading
    that file first.
    """
    slug = domain.strip().lower().replace(" ", "-")
    org_names = sorted({t.get("organizationName") for t in tickets if t.get("organizationName")})
    ticket_ids = [t["ticketId"] for t in tickets]

    return {
        "snapshot": {
            "id": f"support-tickets-{slug}-{taken}",
            "type": "support-ticket",
            "system": "zendesk",
            "origin": "first-party",
            "access": "internal",
            "taken": taken,
            "domain": domain,
            "selection_method": SELECTION_METHOD,
            "selection_query": None,
            "ticket_ids": ticket_ids,
            "organizations_observed": org_names,
            "coverage_caveat": (
                f"{len(ticket_ids)} tickets, {len(org_names)} organization"
                f"{'' if len(org_names) == 1 else 's'} — "
                "one account's repeated experience, not a market signal."
                if len(org_names) <= 1
                else f"{len(ticket_ids)} tickets across {len(org_names)} organizations — "
                "a curated slice, not a market signal."
            ),
        },
        "tickets": [
            {
                "source_id": f"support-ticket-{t['ticketId']}",
                "ticket_id": t["ticketId"],
                "url": t["url"],
                "subject": t.get("subject"),
                "status": t.get("status"),
                "organization": t.get("organizationName"),
                "organization_id": t.get("organizationId"),
                "category": t.get("category"),
                # A finding is a human judgement about what the ticket means.
                # The API returns no such field; it stays null until someone
                # writes one during the PII review pass.
                "finding": None,
                # Written false on purpose: the reviewer flips it to true only
                # after reading the ticket and confirming no name, email, or
                # phone number survived into subject/finding.
                "redacted": False,
            }
            for t in tickets
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--domain", default="Pharmacy")
    parser.add_argument("--date", default=dt.date.today().isoformat())
    parser.add_argument("--force", action="store_true", help="overwrite an existing snapshot file")
    args = parser.parse_args()

    tickets = fetch_tickets()
    snapshot = build_snapshot(tickets, args.domain, args.date)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{args.domain.strip().lower().replace(' ', '-')}-{args.date}.yaml"
    if out_path.exists() and not args.force:
        sys.exit(f"Refusing to overwrite {out_path.relative_to(REPO)} — pass --force if you mean it.")

    header = (
        f"# Level 0.5 — written by scripts/snapshot_zendesk.py on {args.date}, reviewed by a\n"
        "# human before commit (PII). See content/sources/support-tickets/_TEMPLATE.yaml.\n"
    )
    with out_path.open("w", encoding="utf-8") as handle:
        handle.write(header)
        yaml.safe_dump(snapshot, handle, sort_keys=False, allow_unicode=True, width=100)

    print(f"Wrote {out_path.relative_to(REPO)} ({len(snapshot['tickets'])} tickets).")
    print()
    print(REVIEW_REMINDER)
    print()
    print("Every ticket was written with `redacted: false`. Read each one, strip any name,")
    print("email, or phone number from `subject`, then set `redacted: true` by hand.")


if __name__ == "__main__":
    main()
