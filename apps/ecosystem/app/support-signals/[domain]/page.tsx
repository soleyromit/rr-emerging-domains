import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Divider } from "@astryxdesign/core/Divider";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { List, ListItem } from "@astryxdesign/core/List";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { stripFileCitations } from "@/lib/strip-file-citations";
import {
  listSupportSignalDomains,
  getLatestSupportTicketSnapshot,
  type SupportTicketEntry,
} from "@/lib/content";

// This page replaces app/zendesk/pharmacy-feature-gaps/page.tsx, which was
// `force-dynamic` and called fetchPharmacyFeatureGaps() on every request. That made it
// the only page in the app whose claims reached a reader with nothing citable behind
// them, and it kept the *reasoning* for its four hardcoded ticket ids in a source-code
// comment where no reader would ever see it. Here the data is a reviewed, committed
// snapshot under content/sources/support-tickets/, and the selection reasoning and
// coverage limit are rendered up top rather than left implicit.
//
// Static on purpose: no `export const dynamic`, and generateStaticParams enumerates the
// snapshot files at build time.

// The four values categorizeFeatureGap() in the app's Zendesk client can return. Kept as
// a lookup with a neutral fallback so a snapshot carrying an unrecognized (or null)
// category still renders instead of crashing on an undefined variant.
const CATEGORY_BADGE: Record<string, "error" | "warning" | "neutral"> = {
  Rejected: "error",
  "Parked for later": "warning",
  "Open — module gap": "warning",
  "Closed — module gap": "neutral",
};

export function generateStaticParams() {
  return listSupportSignalDomains().map((domain) => ({ domain }));
}

// A snapshot taken without live credentials records honest nulls. Say so in the row
// rather than rendering a blank line that reads like "nothing was wrong with it".
function ticketDescription(ticket: SupportTicketEntry): string {
  const parts: string[] = [];
  if (ticket.organization) parts.push(ticket.organization);
  if (ticket.status) parts.push(`Status: ${ticket.status}`);
  if (ticket.finding) parts.push(ticket.finding);
  if (parts.length === 0) {
    return "Ticket id recorded; subject, status and categorization not captured in this snapshot.";
  }
  return parts.join(" · ");
}

export default async function SupportSignalsPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const snapshot = getLatestSupportTicketSnapshot(domain);
  if (!snapshot) notFound();

  const { snapshot: meta, tickets } = snapshot;
  const orgs = meta.organizations_observed ?? [];
  const categorized = tickets.filter((t) => t.category).length;
  const unreviewed = tickets.filter((t) => t.redacted !== true).length;
  const selectionMethod = stripFileCitations(meta.selection_method);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Support signals"
            title={`${meta.domain}: unmet feature requests`}
            description="Helpdesk tickets from real customer programs where the support team marked the request rejected, parked, or outside what a module currently serves."
          />
          <Stack direction="horizontal" gap={1.5} wrap="wrap">
            <Badge variant="neutral" label={`Snapshot taken ${meta.taken}`} />
            {meta.system ? <Badge variant="neutral" label={meta.system} /> : null}
            {meta.access ? <Badge variant="neutral" label={`Access: ${meta.access}`} /> : null}
          </Stack>

          <Takeaway
            status="warning"
            title={meta.coverage_caveat ?? "Read the coverage limit before citing this."}
          >
            {selectionMethod}
          </Takeaway>

          <MetadataList columns={4}>
            <MetadataListItem label="Tickets in snapshot">{tickets.length}</MetadataListItem>
            <MetadataListItem label="Organizations">
              {orgs.length ? orgs.join(", ") : "Not captured"}
            </MetadataListItem>
            <MetadataListItem label="Tickets with a categorization">
              {categorized} of {tickets.length}
            </MetadataListItem>
            <MetadataListItem label="Awaiting PII review">{unreviewed}</MetadataListItem>
          </MetadataList>

          <Stack gap={2}>
            <Text type="label" color="secondary" size="sm">
              Tickets ({tickets.length})
            </Text>
            <List hasDividers>
              {tickets.map((ticket) => (
                <ListItem
                  key={ticket.ticket_id}
                  label={
                    <Text as="span" weight="medium">
                      #{ticket.ticket_id}
                      {ticket.subject ? ` ${ticket.subject}` : ""}
                    </Text>
                  }
                  description={
                    // DENSITY-OK: a joined one-line status string built above, not a
                    // long-form content field — but clamped anyway, since a reviewed
                    // snapshot's `finding` can run to a full sentence.
                    <Text type="supporting" size="sm" maxLines={2}>
                      {ticketDescription(ticket)}
                    </Text>
                  }
                  href={ticket.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  endContent={
                    <Badge
                      variant={ticket.category ? (CATEGORY_BADGE[ticket.category] ?? "neutral") : "neutral"}
                      label={ticket.category ?? "Not captured"}
                    />
                  }
                />
              ))}
            </List>
          </Stack>
        </Stack>
      </Section>

      <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />

      <Section padding={6}>
        <Collapsible defaultIsOpen={false} trigger="How this snapshot was made, and what it can't tell you">
          <Stack gap={3}>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Selection method
              </Text>
              <Text type="body">{selectionMethod ?? "Not recorded."}</Text>
            </Stack>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Query
              </Text>
              <Text type="body">
                {meta.selection_query ?? "None — the ticket ids were curated by hand, not returned by a search."}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Coverage limit
              </Text>
              <Text type="body">{meta.coverage_caveat ?? "Not recorded."}</Text>
            </Stack>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Why some fields are empty
              </Text>
              <Text type="body">
                A snapshot records only what the helpdesk actually returned when it was taken. Fields shown
                as &quot;Not captured&quot; were left deliberately empty rather than filled with a plausible
                guess, and a re-run with live credentials fills them in. Every ticket here has been reviewed
                for personal data before being committed.
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Snapshot id
              </Text>
              <Text type="body">{meta.id}</Text>
            </Stack>
          </Stack>
        </Collapsible>
      </Section>
    </Stack>
  );
}
