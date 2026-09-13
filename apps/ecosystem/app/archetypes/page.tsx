import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { List, ListItem } from "@astryxdesign/core/List";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { SourceLine } from "@/components/source-line";
import { SourceList } from "@/components/source-list";
import { listArchetypes, resolveSourceIds } from "@/lib/content";
import type { BadgeVariant } from "@/lib/discipline-meta";

// The session that assigned this work — an interviews/*.md front-matter id, resolved
// through the same five-home source index every other citation in this app uses. Named
// by id rather than written into the copy as prose ("a planning meeting on 2026-09-12")
// so the citation resolves to a real record a reader can be pointed at, which is exactly
// the fix the closest_analog work landed one commit earlier.
const PLAN_SOURCE_ID = "interview-romit-ruchi-pharmacy-domain-planning-2026-09-12";

// The `exxat_footprint` enum, in targeting order: already ours, someone else's, nobody's.
// Three visually distinct variants rather than three tints of one — a footprint is the
// single axis this whole family segments on, so the three values must not be
// pattern-matched to each other at a glance.
const FOOTPRINT_META: Record<string, { label: string; variant: BadgeVariant }> = {
  "current-customer": { label: "Exxat customer", variant: "success" },
  "competitor-customer": { label: "Competitor customer", variant: "warning" },
  unengaged: { label: "Unengaged", variant: "neutral" },
};
const FOOTPRINT_ORDER = ["current-customer", "competitor-customer", "unengaged"];

// An out-of-schema value renders as itself, humanized — never as a raw hyphenated slug
// (UI-DENSITY-PATTERNS.md's no-raw-slugs rule) and never silently folded into one of the
// three legal values, which would show a reader a footprint the content never claimed.
function footprintMeta(value: string | undefined): { label: string; variant: BadgeVariant } {
  const key = value?.toLowerCase().trim() ?? "";
  return (
    FOOTPRINT_META[key] ?? {
      label: key ? key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "Footprint not stated",
      variant: "neutral",
    }
  );
}

// University segments by vendor footprint — who is already inside the institution, and
// what that implies for how it gets approached.
//
// THIS PAGE IS EMPTY ON PURPOSE AND SHIPPED THAT WAY. content/archetypes/ holds only its
// schema template: the 2026-09-12 planning session assigned archetype universities to the
// consultant side as strategy work, and no research has produced one since. An
// illustrative row here would be indistinguishable from a researched one the moment it
// rendered, so the page states the absence and cites the session that planned the work.
// When the first real file lands in content/archetypes/, the grid below renders it with
// no further change.
export default function ArchetypesPage() {
  const archetypes = [...listArchetypes()].sort((a, b) => {
    const rank = (v: string | undefined) => {
      const i = FOOTPRINT_ORDER.indexOf(v?.toLowerCase().trim() ?? "");
      return i === -1 ? FOOTPRINT_ORDER.length : i;
    };
    return rank(a.exxat_footprint) - rank(b.exxat_footprint) || a.name.localeCompare(b.name);
  });

  // Only asserted if it resolves. A sentence naming a meeting the source index can't
  // find would read as sourced while pointing at nothing.
  const planSources = resolveSourceIds([{ source_id: PLAN_SOURCE_ID }]);
  const emptyDescription = planSources.length
    ? "Archetype universities segmented by Exxat footprint were assigned as strategy work in the 2026-09-12 pharmacy domain planning session cited below; that session recorded the intent, and no research has produced an archetype since."
    : "No research has produced an archetype yet.";

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title="University archetypes"
            description="Institutions grouped by who is already inside them — Exxat, a competitor, or nobody — with the identifying traits that put a university in a group and the approach that follows from it."
          />
          {archetypes.length ? (
            <MetadataList columns={2}>
              <MetadataListItem label="Archetypes">{archetypes.length}</MetadataListItem>
              <MetadataListItem label="Footprints covered">
                {new Set(archetypes.map((a) => a.exxat_footprint)).size} of {FOOTPRINT_ORDER.length}
              </MetadataListItem>
            </MetadataList>
          ) : null}
        </Stack>
      </Section>

      <Section padding={6}>
        {archetypes.length === 0 ? (
          <Stack gap={4}>
            <EmptyState title="No university archetypes documented yet" description={emptyDescription} />
            <SourceList sources={planSources} label="Where the plan to build these is recorded" />
          </Stack>
        ) : (
          <Grid columns={{ minWidth: 320 }} gap={4}>
            {archetypes.map((a) => {
              const footprint = footprintMeta(a.exxat_footprint);
              return (
                <Card key={a.name} padding={4}>
                  <Stack gap={2}>
                    <Stack direction="horizontal" gap={2} hAlign="between" vAlign="start" wrap="wrap">
                      <Heading level={3}>{a.name}</Heading>
                      <Badge variant={footprint.variant} label={footprint.label} />
                    </Stack>
                    {a.description ? (
                      <Text type="supporting" maxLines={3}>
                        {a.description}
                      </Text>
                    ) : null}
                    {a.identifying_traits?.length ? (
                      <Stack gap={1}>
                        <Text type="label" color="secondary" size="xsm">
                          Identifying traits
                        </Text>
                        <List hasDividers>
                          {a.identifying_traits.map((trait) => (
                            <ListItem key={trait} label={trait} />
                          ))}
                        </List>
                      </Stack>
                    ) : null}
                    {a.gtm_approach ? (
                      <Stack gap={1}>
                        <Text type="label" color="secondary" size="xsm">
                          How this segment gets approached
                        </Text>
                        <Text type="supporting" maxLines={3}>
                          {a.gtm_approach}
                        </Text>
                      </Stack>
                    ) : null}
                    <SourceLine source={sourceDisplay(a.source)} />
                  </Stack>
                </Card>
              );
            })}
          </Grid>
        )}
      </Section>
    </Stack>
  );
}

// `source` is a Level 0.5 source id or a URL. A bare id is not readable text, so resolve
// it to the source's own title before rendering; a URL falls through to SourceLine's link
// branch untouched, and an id that resolves to nothing stays out of the UI rather than
// showing a reader an identifier.
function sourceDisplay(source: string | undefined): string | undefined {
  if (!source) return undefined;
  if (source.trim().startsWith("http")) return source;
  return resolveSourceIds([{ source_id: source }])[0]?.title;
}
