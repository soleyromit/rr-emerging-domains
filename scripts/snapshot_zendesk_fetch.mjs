// Thin Node wrapper around apps/ecosystem/lib/zendesk/client.ts, used only by
// scripts/snapshot_zendesk.py. It exists so the snapshot reuses the SAME
// ticket-selection and categorization logic the app already ships
// (PHARMACY_FEATURE_GAP_TICKET_IDS + categorizeFeatureGap) instead of
// reimplementing it in Python, where it would immediately drift.
//
// Why a .mjs wrapper and not `tsx`/`ts-node`: apps/ecosystem has neither as a
// devDependency (see its package.json), and adding one just to run a snapshot
// script is not worth a new dependency. Node >= 22.6 strips TypeScript types
// natively, and client.ts uses only erasable syntax (type aliases, `as` casts,
// a type predicate) — no enums, no namespaces, no decorators — so it imports
// as-is. Node 22.18+ has type stripping on by default; the flag is passed
// explicitly by the Python caller so older 22.x still works.
//
// Auth: this deliberately uses the static ZENDESK_EMAIL / ZENDESK_API_TOKEN
// path in client.ts's authHeader() by calling fetchPharmacyFeatureGaps() with
// no bearer token. The OAuth routes under app/api/zendesk/ stay as they are for
// interactive one-off testing; nothing here changes them.
//
// Output: the raw FeatureGapTicket[] as JSON on stdout. All diagnostics go to
// stderr so stdout stays machine-readable.

import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.resolve(here, "..", "apps", "ecosystem", "lib", "zendesk", "client.ts");

const REQUIRED_ENV = ["ZENDESK_SUBDOMAIN", "ZENDESK_EMAIL", "ZENDESK_API_TOKEN"];

async function main() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `snapshot_zendesk_fetch: missing env var(s): ${missing.join(", ")}.\n` +
        "Set them (static API-token auth) and re-run. This script does not use the OAuth flow.",
    );
    process.exit(2);
  }

  const { fetchPharmacyFeatureGaps } = await import(clientPath);
  const tickets = await fetchPharmacyFeatureGaps();
  process.stdout.write(JSON.stringify(tickets, null, 2));
}

main().catch((error) => {
  console.error(`snapshot_zendesk_fetch: ${error?.message ?? error}`);
  process.exit(1);
});
