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
import {
  dissectionAnsweredCount,
  dissectionInScopeIncumbents,
  getAccreditorTiers,
  getDissectionManifest,
  getFeatureComparisonMatrixForDomain,
  listCompetitors,
  listDissectionDomains,
  type DissectionManifest,
} from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

// The Dissection tab: one domain answered against the standing six-question
// framework in content/dissection/<slug>.yaml, plus the evidence behind each
// answer. This task builds the shell and its FIRST section, `matrix`; later
// sections (sales reference, the topology graph, node detail) are added as
// further children of the same CollapsibleGroup below.
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
  return { manifest, matrix };
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

  const { manifest, matrix } = dissectionData(slug, entry.domain);

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
              each with its own `value`. `matrix` opens by default because it is the
              only section with data today; that is a defaultValue, not an
              assumption about how many children this group has. */}
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
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
