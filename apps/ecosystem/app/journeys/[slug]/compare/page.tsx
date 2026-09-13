import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { Link } from "@astryxdesign/core/Link";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { FieldBlock } from "@/components/field-block";
import { DisciplineChip } from "@/components/discipline-chip";
import { JourneyComparePicker } from "@/components/journey-compare-picker";
import { getJourney, listJourneys, type DisciplineJourneyStage } from "@/lib/content";
import { stripFileCitations } from "@/lib/strip-file-citations";
import {
  buildJourneyComparison,
  listComparableDisciplines,
  resolveComparePair,
  type ComparableDiscipline,
  type JourneyComparisonRow,
} from "@/lib/journey-comparison";

// One journey, two disciplines, stage by stage — the "where do these two actually
// diverge?" question the 2026-09-12 Pharmacy planning session answered by hand for
// OT/PT vs. Pharmacy.
//
// There is no new content behind this page and no new data function: every cell is
// getJourneyStagesForDiscipline(journeySlug, subject), the SAME call the Overview
// tab's scenario strip already makes for one discipline, made twice and aligned on the
// journey's own stage list (lib/journey-comparison.ts). If a future change to this page
// starts wanting a new field on journey content, the comparison has drifted away from
// what the evidence base actually holds.
//
// Dynamic, like /domains/[slug]/dissect and for the same reason: the pair lives in the
// query string so a specific comparison is a link, not a local UI state.

/** The app's established empty cell — see components/comparison-matrix.tsx, where an
 * absent row × column pair renders exactly this. A real finding stays visually loud
 * because the gaps around it are quiet. */
function EmptyCell() {
  return (
    <Text type="supporting" size="sm" color="secondary">
      —
    </Text>
  );
}

function ComparisonCell({
  discipline,
  stage,
}: {
  discipline: ComparableDiscipline;
  stage?: DisciplineJourneyStage;
}) {
  return (
    <Card variant="default" padding={3}>
      <Stack gap={1.5}>
        {/* The chip gets a horizontal Stack of its own: a vertical Stack stretches its
            children, which turns a Badge into a full-width banner across the top of the
            card — the same failure components/comparison-matrix.tsx documents for its
            own cell content, and it shipped visibly here before a screenshot caught it. */}
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <DisciplineChip subject={discipline.subject} />
        </Stack>
        {stage ? (
          <>
            {stage.headline ? (
              <Text type="body" size="sm" weight="semibold" maxLines={2}>
                {stripFileCitations(stage.headline)}
              </Text>
            ) : null}
            <FieldBlock text={stage.disciplineDetail} type="supporting" size="xsm" maxLines={3} />
            {stage.flowSlug && stage.flowName ? (
              <Link href={`/flows/${stage.flowSlug}`} color="accent" hasUnderline>
                View this screen flow →
              </Link>
            ) : null}
          </>
        ) : (
          <EmptyCell />
        )}
      </Stack>
    </Card>
  );
}

/** The divergence marker: named, not just a color — the whole reason a reader opened
 * this page is to find the stages where exactly one side has something written. */
function DivergenceBadge({ row, a, b }: { row: JourneyComparisonRow; a: ComparableDiscipline; b: ComparableDiscipline }) {
  if (row.a && row.b) return null;
  if (!row.a && !row.b) return <Badge variant="neutral" label="Neither" />;
  return <Badge variant="warning" label={`Only ${row.a ? a.code : b.code}`} />;
}

export default async function JourneyComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const journey = getJourney(slug);
  if (!journey) notFound();

  const disciplines = listComparableDisciplines(slug);
  const pair = resolveComparePair(disciplines, query.a, query.b);

  const header = (
    <Stack gap={5}>
      <Breadcrumbs>
        <BreadcrumbItem href="/journeys">Journeys</BreadcrumbItem>
        <BreadcrumbItem href={`/journeys/${slug}`}>{journey.journey_name}</BreadcrumbItem>
        <BreadcrumbItem isCurrent>Compare across domains</BreadcrumbItem>
      </Breadcrumbs>
      <PageHeader
        eyebrow="Journey comparison"
        title={journey.journey_name}
        description="The same journey, two disciplines, stage by stage — so the stages where one has something written and the other has nothing are visible rather than inferred."
      />
    </Stack>
  );

  if (!pair) {
    return (
      <Section padding={6}>
        <Stack gap={5}>
          {header}
          <EmptyState
            title="Nothing to compare on this journey yet"
            description="A comparison needs two disciplines that this repo's journey content names by name, and fewer than two are written anywhere in it today."
          />
        </Stack>
      </Section>
    );
  }

  const { a, b } = pair;
  const comparison = buildJourneyComparison(slug, a, b);
  const divergentCount = comparison.onlyACount + comparison.onlyBCount;
  // Status is derived from what the comparison really found, not decoration: an empty
  // column is the loudest thing this page can report, divergence is the thing it was
  // opened to find, and full agreement is genuinely a clean result.
  const emptyColumns = [a, b].filter((d) => d.stageCount === 0);
  const status = emptyColumns.length > 0 ? "warning" : divergentCount > 0 ? "info" : "success";
  const takeawayTitle =
    emptyColumns.length === 2
      ? `Neither ${a.label} nor ${b.label} is written on this journey`
      : emptyColumns.length === 1
        ? `${emptyColumns[0].label} has nothing written on this journey`
        : divergentCount > 0
          ? `${a.code} and ${b.code} diverge at ${divergentCount} of ${comparison.stageCount} stages`
          : `${a.code} and ${b.code} are written at the same ${comparison.bothCount} stages`;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          {header}

          <JourneyComparePicker
            journeys={listJourneys().map((j) => ({ slug: j.slug, name: j.journey_name }))}
            journeySlug={slug}
            disciplines={disciplines.map((d) => ({ slug: d.slug, label: d.label, stageCount: d.stageCount }))}
            totalStages={comparison.stageCount}
            aSlug={a.slug}
            bSlug={b.slug}
          />

          <Takeaway status={status} title={takeawayTitle}>
            <Text type="supporting" maxLines={4}>
              {`${comparison.bothCount} of ${comparison.stageCount} stages are written for both. ${
                comparison.onlyACount
              } ${comparison.onlyACount === 1 ? "is" : "are"} written only for ${a.label}, ${
                comparison.onlyBCount
              } only for ${b.label}, and ${comparison.neitherCount} for neither. A dash means nothing has been ` +
                "written for that discipline at that stage — not that the stage does not apply to it."}
            </Text>
          </Takeaway>

          <MetadataList columns={4}>
            <MetadataListItem label="Stages in this journey">{comparison.stageCount}</MetadataListItem>
            <MetadataListItem label="Written for both">{comparison.bothCount}</MetadataListItem>
            <MetadataListItem label={`Only ${a.code}`}>{comparison.onlyACount}</MetadataListItem>
            <MetadataListItem label={`Only ${b.code}`}>{comparison.onlyBCount}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6}>
        {comparison.rows.length === 0 ? (
          <EmptyState title="No stages mapped yet" description="This journey has no stages to compare." />
        ) : (
          <Stack gap={5}>
            {/* The column headers, once, above the stages — the discipline chips inside
                each cell repeat them, which is what keeps the single-column layout
                readable once the grid stacks under ~680px and these headers are far
                above the cell being read. */}
            <Grid columns={{ minWidth: 320, max: 2 }} gap={3}>
              <Heading level={2}>{a.label}</Heading>
              <Heading level={2}>{b.label}</Heading>
            </Grid>

            {comparison.rows.map((row) => (
              <Stack key={row.index} gap={2}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <Text type="label" weight="semibold">
                    {row.label}
                  </Text>
                  <DivergenceBadge row={row} a={a} b={b} />
                </Stack>
                {/* Two columns above ~680px, one below it: `max: 2` caps the track
                    count and `minWidth: 320` is what makes the second track drop —
                    the same responsive pair components/course-model-split.tsx uses,
                    rather than a hand-written media query. */}
                <Grid columns={{ minWidth: 320, max: 2 }} gap={3}>
                  <ComparisonCell discipline={a} stage={row.a} />
                  <ComparisonCell discipline={b} stage={row.b} />
                </Grid>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
