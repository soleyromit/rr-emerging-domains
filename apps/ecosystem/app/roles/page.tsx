import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { firstSentence } from "@/lib/text";
import { listRolePersonas } from "@/lib/content";

// Cross-cutting people who touch Prism day to day, independent of any one domain —
// kept separate from the domain hub (unlike discipline personas, which live inside it
// — /domains/[slug]#buyer-profile since the 2026-09-13 tab consolidation) because a
// role's content is meant to apply across multiple domains at once, not be scoped to one.
export default function RolesIndexPage() {
  const roles = listRolePersonas();
  const totalPains = roles.reduce((sum, r) => sum + (r.top_pains?.length ?? 0), 0);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            // Names the sidebar group; "Customer" became an action title in task 4.4.
            eyebrow="Who we're building for"
            title="Roles"
            description="Cross-cutting roles — the people who touch Prism day to day, across every domain. Each role's page also links out to the domains and competitors that content is grounded in."
          />
          <MetadataList columns={2}>
            <MetadataListItem label="Roles">{roles.length}</MetadataListItem>
            <MetadataListItem label="Top pains cataloged">{totalPains}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6}>
        {roles.length === 0 ? (
          <EmptyState title="No role personas yet" description="Populates as research completes." />
        ) : (
          <Stack gap={3}>
            {/* A warning Takeaway, not small gray supporting text: this is a known,
                named defect in the data on the page below it — the same category as
                sales-reference-matrix.tsx's "not evidence" quarantine notice, which
                carries a warning Banner. A caveat a reader can skim past is a caveat
                that didn't land, so it gets that same weight. */}
            <Takeaway
              status="warning"
              title={`Every role file's "applies across domains" list is stale`}
            >
              All of them read the same four (DO/Pharmacy/Dentistry/Medicine) and predate the
              12-discipline expansion — a content backlog item, not filtered or corrected here.
            </Takeaway>
            <Grid columns={{ minWidth: 320 }} gap={4}>
              {roles.map((r) => (
                <ClickableCard key={r.slug} href={`/roles/${r.slug}`} label={r.role_name}>
                  <Stack gap={2}>
                    <Heading level={3}>{r.role_name}</Heading>
                    {r.day_in_the_life_summary ? (
                      <Text type="supporting" maxLines={2}>
                        {firstSentence(r.day_in_the_life_summary)}
                      </Text>
                    ) : null}
                    <Text type="supporting" size="xsm">
                      {r.top_pains?.length ?? 0} pains · {r.tools_touched?.length ?? 0} tools touched
                    </Text>
                  </Stack>
                </ClickableCard>
              ))}
            </Grid>
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
