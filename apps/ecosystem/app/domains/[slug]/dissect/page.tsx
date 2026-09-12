import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { Takeaway } from "@/components/takeaway";
import { DissectionMatrix, type DissectionMatrixIncumbent } from "@/components/dissection-matrix";
import { SalesReferenceMatrix } from "@/components/sales-reference-matrix";
import { TopologyGraphPanel } from "@/components/dissect/topology-graph-panel";
import { buildDissectionGraph } from "@/lib/dissection-graph";
import { layoutDissectionGraph } from "@/lib/graph-layout";
import {
  dissectionAnsweredCount,
  dissectionInScopeIncumbents,
  getAccreditorTiers,
  getDissectionManifest,
  getFeatureComparisonMatrixForDomain,
  getVendorComparisonChart,
  listCompetitors,
  listDissectionDomains,
  type DissectionManifest,
} from "@/lib/content";
import { vendorComparisonStats } from "@/lib/vendor-comparison";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

// The Dissection tab: one domain answered against the standing six-question
// framework in content/dissection/<slug>.yaml, plus the evidence behind each
// answer. Two sections live in the CollapsibleGroup below today — `matrix` (the
// researched feature comparison) and `sales-reference` (the quarantined sales
// chart); later sections (the topology graph, node detail) are added as further
// children of the same group.
//
// The manifests are deliberately honest about how little is researched: 9 of the
// 13 routed domains have no manifest at all, and 3 of the 4 that do report
// coverage "none" on feature-comparison, i.e. zero rows in the lens this page's
// matrix reads. Rendering those states as real, named absences — with the
// manifest's own gap_note, not a paraphrase and not a placeholder row — is the
// point of this page, not an edge case in it.

/** Dissection data is read here rather than added to getDomainHubData: it is used by
 * this one tab, and every other tab under /domains/[slug] would otherwise pay two
 * extra YAML reads per render for data it never touches. */
function dissectionData(slug: string, domainLabel: string) {
  const manifest = getDissectionManifest(slug);
  const matrix = getFeatureComparisonMatrixForDomain(domainLabel);
  // The sales chart is NOT domain-scoped and cannot be: no row in it carries a
  // domain, and its own scope_note says it compares against a competitor set none of
  // these four domains actually runs on. So every domain renders the same 81 rows —
  // filtering it by domain would mean inventing a mapping the content does not have,
  // which is the exact fabrication this section exists to display rather than commit.
  const salesChart = getVendorComparisonChart();
  return { manifest, matrix, salesChart };
}

/** "A, B, C and D" — a readable list, not a JSON-ish join. */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "no domain yet";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function questionSummary(manifest: DissectionManifest) {
  const by = (...coverages: string[]) => manifest.questions.filter((q) => coverages.includes(q.coverage));
  return {
    answered: dissectionAnsweredCount(manifest),
    total: manifest.questions.length,
    researched: by("researched").length,
    partial: by("partial").length,
    unstarted: by("none", "stub"),
  };
}

export default async function DomainDissectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Same domain resolution as every sibling route under /domains/[slug] (see
  // layout.tsx, standards/page.tsx): accreditor-tiers is the canonical domain list
  // and matchDisciplineMeta maps its label to this URL segment.
  const tierDomains = getAccreditorTiers()?.domains ?? [];
  const entry = tierDomains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { manifest, matrix, salesChart } = dissectionData(slug, entry.domain);

  if (!manifest) {
    // Each manifest's own `domain:` is the RAW value ("MD"); resolve it to the label
    // the rest of the app shows ("Medicine") so this sentence matches the nav.
    const dissected = listDissectionDomains().map(
      (m) => tierDomains.find((d) => matchDisciplineMeta(d.domain)?.slug === m.slug)?.domain ?? m.domain,
    );
    return (
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Heading level={2}>Dissection</Heading>
          <EmptyState
            title="This domain has not been dissected yet"
            // The list of dissected domains is DERIVED, not hardcoded: it names
            // what is really there today and stays true the day a fifth manifest
            // lands. No paths or filenames in visible copy (UI-DENSITY-PATTERNS.md).
            description={`The six-question framework has not been run for ${entry.domain}. So far it has only been answered for ${formatList(dissected)} — until someone runs it here, this repo has no answer for this domain, and an empty framework is not one.`}
          />
        </Stack>
      </Section>
    );
  }

  const q = questionSummary(manifest);
  const inScope = dissectionInScopeIncumbents(manifest);
  const competitorNames = new Map(listCompetitors().map((c) => [c.slug, c.competitor]));

  // Columns: the manifest's in-scope incumbents, in manifest order. A vendor with
  // real cells in the lens but no incumbent_set entry is APPENDED rather than
  // dropped — a silently missing column would delete researched, sourced evidence
  // from the page. (No domain hits that today; it is a guard, not a workaround.)
  const incumbents: DissectionMatrixIncumbent[] = [
    ...inScope.map((i) => ({
      slug: i.competitor_slug,
      name: competitorNames.get(i.competitor_slug) ?? i.competitor_slug,
      role: i.role,
    })),
    ...matrix.competitorSlugs
      .filter((s) => !inScope.some((i) => i.competitor_slug === s))
      .map((s) => ({ slug: s, name: competitorNames.get(s) ?? s, role: "not in incumbent set" })),
  ];

  const featureComparisonQuestion = manifest.questions.find((question) => question.key === "feature-comparison");
  // The denominator counts COMPETITOR intersections only: capabilities × in-scope
  // incumbents. The rendered grid has one more column than that — Exxat's, pinned
  // first — so "14 / 30" and a 6 × 6 table on screen are both right but don't
  // match by eye. Every number below is derived, and the copy says out loud what
  // the 30 is and where Exxat sits, so the figure is self-explanatory beside the
  // table rather than only internally consistent.
  const possibleCells = matrix.rows.length * incumbents.length;
  const exxatRated = matrix.rows.filter((r) => r.exxatCell).length;
  // Counted here so the section's trigger and the table inside it read the same
  // arithmetic — the trigger states the size of what opening it costs.
  const salesStats = salesChart ? vendorComparisonStats(salesChart) : null;

  // Both the graph and its coordinates are computed HERE, on the server. The layout is
  // a pure function of the graph (lib/graph-layout.ts steps d3-force a fixed number of
  // times and stops), so the markup the server sends is already final — the client
  // component receives numbers, never a simulation, and d3-force stays out of the
  // browser bundle entirely.
  const graph = buildDissectionGraph(entry.domain, manifest);
  const graphLayout = layoutDissectionGraph(graph);

  return (
    <Stack gap={0}>
      {/* ---------- Scan layer: the coverage verdict and four real numbers ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Stack gap={1}>
            <Heading level={2}>Dissection</Heading>
            <Text type="supporting">
              The standing six-question domain analysis · last reviewed {manifest.last_reviewed}
            </Text>
          </Stack>

          <Takeaway
            status={q.unstarted.length === 0 ? "success" : q.answered === 0 ? "error" : "warning"}
            title={`${q.answered} of ${q.total} dissection questions have partial-or-better coverage`}
          >
            <Text type="supporting" maxLines={3}>
              {`${q.researched} researched, ${q.partial} partial, ${q.unstarted.length} still at stub or nothing${
                q.unstarted.length ? ` (${q.unstarted.map((question) => question.key).join(", ")})` : ""
              }.`}
            </Text>
          </Takeaway>

          <MetadataList columns={4}>
            <MetadataListItem label="Questions at partial-or-better">
              {q.answered} / {q.total}
            </MetadataListItem>
            <MetadataListItem label="Incumbents in scope">
              {inScope.length} / {manifest.incumbent_set.length}
            </MetadataListItem>
            <MetadataListItem
              label={
                possibleCells
                  ? `Competitor cells rated (${matrix.rows.length} capabilities × ${incumbents.length} incumbents)`
                  : "Competitor cells rated"
              }
            >
              {possibleCells ? `${matrix.cellCount} / ${possibleCells}` : matrix.cellCount}
            </MetadataListItem>
            <MetadataListItem label="GTM target">{manifest.is_gtm_target ? "Yes" : "No"}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      {/* ---------- Everything below is optional deep-dive reference ---------- */}
      <Section padding={6} variant="muted">
        <Stack gap={4}>
          <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
          {/* Later Phase 5 sections are added as further Collapsible children here,
              each with its own `value`. `matrix` is the ONLY member of defaultValue:
              it is this tab's researched evidence, and every other section — the
              quarantined sales chart first among them — has to be opened on purpose. */}
          <CollapsibleGroup type="multiple" hasDividers defaultValue={["matrix"]}>
            <Collapsible
              value="matrix"
              trigger={
                matrix.rows.length
                  ? `Feature comparison matrix (${matrix.cellCount} of ${possibleCells} competitor cells rated)`
                  : "Feature comparison matrix (no data yet)"
              }
            >
              {matrix.rows.length ? (
                <Stack gap={3}>
                  <Text type="supporting" maxLines={4}>
                    {`${matrix.rows.length} capabilities × ${incumbents.length} in-scope incumbents = ${possibleCells} competitor intersections, of which ${matrix.cellCount} are rated. Exxat's own verdict is the pinned first column and is counted separately (${exxatRated} of ${matrix.rows.length} rated), so the grid shows one more column than that ${possibleCells} covers. Click any rating for its rationale, evidence strength and sources; a dash means that vendor has not been researched on that capability — not that it falls short.`}
                  </Text>
                  <DissectionMatrix rows={matrix.rows} incumbents={incumbents} />
                </Stack>
              ) : (
                <EmptyState
                  title="No feature comparison yet"
                  // The manifest's OWN gap_note, verbatim — the file that owns this
                  // claim says why the cells are missing, and a paraphrase here
                  // would be this page asserting something no content file states.
                  description={
                    featureComparisonQuestion?.gap_note ??
                    `No capability has been rated for ${entry.domain} in the feature-comparison lens yet.`
                  }
                />
              )}
            </Collapsible>

            {/* The quarantined sibling of the section above, and deliberately its
                opposite in every respect: no evidence, no drill-down, no rating
                vocabulary, and closed by default — `defaultValue` above stays
                ["matrix"]. The researched matrix is what this tab is for; the sales
                chart is here to be argued with, so it should cost a click and should
                never be the thing a reader lands on already open. */}
            {salesChart && salesStats ? (
              <Collapsible
                value="sales-reference"
                // "3 of 4 vendors masked", not "4 masked vendors": Exxat's column is
                // named — it is the chart's author. Both numbers are counted.
                trigger={`Sales reference chart — unverified (${salesStats.rowCount} claimed rows × ${salesStats.columns.length} vendors, ${salesStats.maskedColumns.length} of them masked, not evidence)`}
              >
                <Stack gap={3}>
                  <Text type="supporting" maxLines={4}>
                    {`Exxat sales' own comparison chart, reproduced so it can be argued with. It is generic, not researched for ${entry.domain} — the same ${salesStats.rowCount} rows render on every domain, and it compares against a competitor set none of this domain's incumbents belong to. Nothing in it may be cited as fact, and no cell has anything to open.`}
                  </Text>
                  <SalesReferenceMatrix chart={salesChart} referenceHref="/reference/vendor-comparison-chart" />
                </Stack>
              </Collapsible>
            ) : null}

            {/* The third sibling: the same domain's evidence seen as a shape rather than
                a grid. Nothing in it is new research — every line is a field of a lens
                one of the sections above or a sibling tab already reads. Closed by
                default like `sales-reference`, for a different reason: this one is a
                second view of evidence the reader can already get, so it should not
                compete with the matrix for the landing position. */}
            <Collapsible
              value="standards-map"
              trigger={
                graph.nodes.length
                  ? `Standards topology map (${graph.nodes.length} entities, ${graph.edges.length} relationships across ${
                      Object.values(graph.edgesByKind).filter((n) => n > 0).length
                    } kinds)`
                  : "Standards topology map (no relationships yet)"
              }
            >
              <TopologyGraphPanel graph={graph} layout={graphLayout} domainLabel={entry.domain} />
            </Collapsible>
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
