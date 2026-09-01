import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { firstSentence } from "@/lib/text";
import { listRolePersonas } from "@/lib/content";

// Cross-cutting people who touch Prism day to day, independent of any one domain —
// kept separate from the domain hub (unlike discipline personas, which moved to
// /domains/[slug]/persona) because a role's content is meant to apply across
// multiple domains at once, not be scoped to one.
export default function RolesIndexPage() {
  const roles = listRolePersonas();
  const totalPains = roles.reduce((sum, r) => sum + (r.top_pains?.length ?? 0), 0);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Customer"
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
            <Text type="supporting" size="xsm" color="secondary">
              Every role file&apos;s &quot;applies across domains&quot; list is identical (DO/Pharmacy/Dentistry/Medicine)
              and predates the 12-discipline expansion — a content backlog item, not filtered or corrected here.
            </Text>
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
