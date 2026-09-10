import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { List } from "@astryxdesign/core/List";
import { ListItem } from "@astryxdesign/core/List";
import { Badge } from "@astryxdesign/core/Badge";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { fetchPharmacyFeatureGaps, type FeatureGapCategory } from "@/lib/zendesk/client";

const CATEGORY_BADGE: Record<FeatureGapCategory, "error" | "warning" | "neutral"> = {
  Rejected: "error",
  "Parked for later": "warning",
  "Open — module gap": "warning",
  "Closed — module gap": "neutral",
};

export const dynamic = "force-dynamic";

export default async function PharmacyFeatureGapsPage() {
  const tickets = await fetchPharmacyFeatureGaps();
  const universities = new Set(tickets.map((t) => t.organizationName));

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Zendesk — live"
            title="Pharmacy universities: unmet feature requests"
            description="Tickets from real pharmacy-program customers where Exxat's support team marked the request rejected, parked, or outside what a module currently serves."
          />
          <Takeaway status="warning" title="Only one pharmacy program shows this pattern: Oregon Health & Science University">
            Zendesk has no &quot;Pharmacy&quot; option in its own Domain field, and a plain
            text search for &quot;pharmacy&quot; is mostly false positives (an internal Exxat
            sales-demo org, and a college whose tickets are actually tagged as its
            Nursing department). Filtering to tickets Zendesk itself tagged as rejected,
            parked, or module-unserved narrows this to one confirmed pharmacy customer —
            not a broad market signal, a single account&apos;s repeated experience.
          </Takeaway>
          <MetadataList columns={2}>
            <MetadataListItem label="Pharmacy universities found">{universities.size}</MetadataListItem>
            <MetadataListItem label="Unmet-feature tickets">{tickets.length}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6}>
        <List hasDividers>
          {tickets.map((t) => (
            <ListItem
              key={t.ticketId}
              label={
                <Text as="span" weight="medium">
                  {t.organizationName} — #{t.ticketId} {t.subject}
                </Text>
              }
              description={`Status: ${t.status}`}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              endContent={<Badge variant={CATEGORY_BADGE[t.category]} label={t.category} />}
            />
          ))}
        </List>
      </Section>
    </Stack>
  );
}
