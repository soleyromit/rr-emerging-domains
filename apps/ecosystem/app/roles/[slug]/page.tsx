import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Link } from "@astryxdesign/core/Link";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { ProseItemList } from "@/components/prose-item-list";
import { SentenceList } from "@/components/sentence-list";
import { ComparisonCardGrid } from "@/components/comparison-card-grid";
import { DisciplineChip } from "@/components/discipline-chip";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { listRolePersonas, getRolePersona, getCompetitorReadsForRole, resolveRelatedFlows } from "@/lib/content";

export function generateStaticParams() {
  return listRolePersonas().map((r) => ({ slug: r.slug }));
}

export default async function RolePersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRolePersona(slug);
  if (!role) notFound();

  const painItems = (role.top_pains ?? []).map((p) => ({
    primary: p.pain,
    reference: p.accreditation_link,
    relatedFlows: resolveRelatedFlows(p.related_flows),
  }));
  const painsWithCitation = (role.top_pains ?? []).filter((p) => p.accreditation_link).length;
  const competitorReads = getCompetitorReadsForRole(role.role_name);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/roles">Roles</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{role.role_name}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader eyebrow="Role" title={role.role_name} />
          {role.day_in_the_life_summary ? (
            // DENSITY-OK: dedicated persona detail page — shown in full, not the
            // index card's 3-line teaser
            <Text type="body">{role.day_in_the_life_summary}</Text>
          ) : null}
          <MetadataList columns={4}>
            <MetadataListItem label="Top tasks">{role.top_tasks?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Top pains">{role.top_pains?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Pains with an accreditation citation">
              {painsWithCitation} of {role.top_pains?.length ?? 0}
            </MetadataListItem>
            <MetadataListItem label="Tools touched">{role.tools_touched?.length ?? 0}</MetadataListItem>
          </MetadataList>
          {role.applies_across_domains?.length ? (
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Applies across domains (as authored — identical across all 5 role files, likely
                stale since the 12-discipline expansion — not a per-role signal yet)
              </Text>
              <Stack direction="horizontal" gap={1.5} wrap="wrap">
                {role.applies_across_domains.map((d) => {
                  const routeSlug = matchDisciplineMeta(d)?.slug;
                  const chip = <DisciplineChip subject={d} />;
                  return routeSlug ? (
                    <Link key={d} href={`/domains/${routeSlug}/persona`}>
                      {chip}
                    </Link>
                  ) : (
                    <span key={d}>{chip}</span>
                  );
                })}
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </Section>

      {role.top_tasks?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={2}>
            <Text type="label" color="secondary">
              Top tasks ({role.top_tasks.length})
            </Text>
            <SentenceList items={role.top_tasks} fallbackIcon="checkDouble" />
          </Stack>
        </Section>
      ) : null}

      {role.tools_touched?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={2}>
            <Text type="label" color="secondary">
              Tools touched ({role.tools_touched.length})
            </Text>
            <SentenceList items={role.tools_touched} fallbackIcon="wrench" />
          </Stack>
        </Section>
      ) : null}

      {painItems.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Text type="label" color="secondary">
              Top pains ({painItems.length})
            </Text>
            <ProseItemList items={painItems} fallbackIcon="warning" />
          </Stack>
        </Section>
      ) : null}

      {competitorReads.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Text type="label" color="secondary">
              How each competitor implicitly serves this role ({competitorReads.length})
            </Text>
            <ComparisonCardGrid
              items={competitorReads.map((r) => ({
                key: r.slug,
                label: (
                  <Link href={`/competitors/${r.slug}`} type="body" weight="semibold" color="accent" hasUnderline>
                    {r.competitor}
                  </Link>
                ),
                text: r.read,
                relatedFlows: r.relatedFlows,
              }))}
            />
          </Stack>
        </Section>
      ) : null}

      {role.sources?.length ? (
        <Section padding={6}>
          <Collapsible defaultIsOpen={false} trigger={`Sources (${role.sources.length})`}>
            <SentenceList items={role.sources} maxLines={2} fallbackIcon="copy" />
          </Collapsible>
        </Section>
      ) : null}
    </Stack>
  );
}
