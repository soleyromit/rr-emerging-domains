import type { Metadata } from "next";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { PageHeader } from "@/components/page-header";
import { FieldBlock } from "@/components/field-block";
import { SalesReferenceMatrix } from "@/components/sales-reference-matrix";
import { getVendorComparisonChart, type VendorComparisonSheetDiff } from "@/lib/content";
import { vendorComparisonStats } from "@/lib/vendor-comparison";

// The standalone home of the quarantined sales chart. It exists so the embedded
// section on a domain's Dissection tab can stay compact and still have somewhere to
// send a reader who wants the provenance — the contradiction list, the unmasking key,
// where the workbook came from — without any of that being carried into a domain page.
//
// It is `noindex, nofollow` deliberately: a page of unverified sales claims about
// named competitors is the last thing in this app that should be reachable from a
// search result stripped of the banner that frames it. Nothing else in this app sets
// robots metadata; this is the first, and the reason is the content, not the route.
export const metadata: Metadata = {
  title: "Exxat Vendor Comparison Chart — unverified sales reference",
  description:
    "Exxat sales' own internal vendor comparison chart, quarantined: reproduced so it can be argued with, never citable as fact.",
  robots: { index: false, follow: false },
};

/**
 * A STATIC CITATION, not a derived figure — and deliberately one string carrying BOTH
 * numbers rather than a 41 interpolated next to a counted 81, which would age at two
 * different rates in one sentence.
 *
 * The artifact's YAML says, in a PROSE COMMENT rather than a field, that on 41 of its
 * 81 rows the masked columns agree and the named sheet still credits a vendor the
 * masked sheet has no column for. A comment cannot be read by the loader, and the
 * per-row data needed to recount it only exists for the 2 rows listed below — so this
 * cannot be computed here, at all.
 *
 * If content/sources/vendor-comparison-chart.yaml is ever re-transcribed, THIS STRING
 * MUST BE RE-READ BY HAND from that file's comment above `unmasked_only_vendor_rows`.
 * It is the one figure on this page that does not follow the data by itself.
 */
const SOURCE_NOTE_AGREEING_ROWS_WITH_EXTRA_VENDOR = "41 of the 81 rows";

/** One row the two sheets read differently. The two readings sit side by side because
 * the disagreement IS the finding — a single "correct" answer would be this page
 * picking a winner between two unsourced sheets. */
function SheetDiff({ diff }: { diff: VendorComparisonSheetDiff }) {
  return (
    <Stack gap={1}>
      <Text type="body" weight="semibold">
        {diff.row}
      </Text>
      <Text type="supporting" maxLines={2}>
        {`Masked sheet marks: ${diff.sheet2}`}
      </Text>
      <Text type="supporting" maxLines={2}>
        {`Named sheet marks: ${diff.sheet1}`}
      </Text>
      {diff.sheet1_extra_vendors ? (
        <Text type="supporting" size="xsm" color="secondary" maxLines={2}>
          {`Plus, in columns the masked sheet does not have: ${diff.sheet1_extra_vendors}`}
        </Text>
      ) : null}
    </Stack>
  );
}

export default function VendorComparisonChartPage() {
  const chart = getVendorComparisonChart();

  if (!chart) {
    return (
      <Section padding={6}>
        <EmptyState
          title="The vendor comparison chart is not in this checkout"
          description="This page renders one transcribed artifact and has nothing of its own to show without it."
        />
      </Section>
    );
  }

  const { artifact } = chart;
  const stats = vendorComparisonStats(chart);
  const unmaskedOnlyColumns = chart.unmasking_key.filter((entry) => !entry.sheet2_label);

  return (
    <Stack gap={0}>
      {/* ---------- Scan layer: what this is, and the numbers that disqualify it ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Reference — unverified"
            title={artifact.title}
            description="Exxat sales' own internal comparison chart, transcribed verbatim so it can be pointed at and argued with. It is not research, and nothing in this repo cites it."
          />

          {/* Not collapsed and not dismissable: this is the page's own framing, and a
              reader must not be able to remove it and be left with a clean-looking
              table of competitor claims. The collapsed banner further down is a
              different thing — it guards the DATA, this states the verdict. */}
          <Banner
            status="error"
            container="card"
            title="Not citable as fact — anywhere, for any purpose"
            description={`This artifact is quarantined: no file in this repo may cite it as a source, and no claim in it has been checked against any competitor's product. It is a record of what Exxat sales has been claiming, not of what is true. Transcribed ${artifact.transcribed} from an internal workbook that carries no version or date of its own.`}
          />

          <MetadataList columns={4}>
            <MetadataListItem label="Feature rows claimed">
              {stats.rowCount} across {stats.sectionCount} sections
            </MetadataListItem>
            <MetadataListItem label="Rows marking Exxat present">
              {stats.claimedByColumn.EXXAT ?? 0} / {stats.rowCount}
            </MetadataListItem>
            <MetadataListItem label="Rows where the two sheets disagree">
              {stats.contradictionCount} / {stats.rowCount}
            </MetadataListItem>
            <MetadataListItem label="Cells carrying any evidence">0</MetadataListItem>
          </MetadataList>

          <FieldBlock label="Why it is quarantined, in the artifact's own words" text={artifact.provenance_note} maxLines={4} />
          <FieldBlock label="What it does and does not compare" text={artifact.scope_note} maxLines={4} />
        </Stack>
      </Section>

      {/* ---------- Everything below is optional deep-dive reference ---------- */}
      <Section padding={6} variant="muted">
        <Stack gap={4}>
          <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />

          {/* The same component the Dissection tab embeds, not a second rendering of
              the same data: one place decides how these claims look, so the domain
              page and this page cannot drift into two different levels of warning.
              No `referenceHref` — this page IS the detail that link points at. */}
          <SalesReferenceMatrix chart={chart} />

          <CollapsibleGroup type="multiple" hasDividers>
            <Collapsible
              value="contradictions"
              trigger={`${stats.contradictionCount} rows where the workbook's two sheets contradict each other`}
            >
              <Stack gap={3}>
                <Text type="supporting" maxLines={4}>
                  {`Computed by diffing the two sheets exhaustively, not spot-checked: these are every row where the masked sheet and the named sheet give different answers for the same vendor. They disagree in both directions — on some rows the masked sheet is the generous one — so neither sheet can be treated as the corrected version of the other.`}
                </Text>
                {artifact.known_contradictions.map((diff) => (
                  <SheetDiff key={diff.row_id} diff={diff} />
                ))}
              </Stack>
            </Collapsible>

            <Collapsible
              value="unmasked-only"
              trigger={`${stats.unmaskedOnlyCount} rows recorded as contradictions that are not ones`}
            >
              <Stack gap={3}>
                <Text type="supporting" maxLines={4}>
                  {`On these rows the two sheets agree, and the named sheet merely credits a vendor the masked sheet has no column for. The planning brief named them as contradictions; they are kept out of the count above and recorded here so that correction is not silently lost. The list is not exhaustive — the artifact's own note records the same pattern on ${SOURCE_NOTE_AGREEING_ROWS_WITH_EXTRA_VENDOR}, which is a property of the masked sheet's narrower scope rather than a defect.`}
                </Text>
                {artifact.unmasked_only_vendor_rows.map((diff) => (
                  <SheetDiff key={diff.row_id} diff={diff} />
                ))}
              </Stack>
            </Collapsible>

            <Collapsible value="unmasking" trigger="What the masked column labels stand for">
              <Stack gap={3}>
                <Text type="supporting" maxLines={4}>
                  {`The workbook carries a second, unmasked sheet that names the vendors the masked one hides. The masking is part of why this artifact is not citable, so the matrix above keeps the labels it was authored with; this mapping is recorded as a research note, not as a display convention.`}
                </Text>
                <Stack gap={1}>
                  {chart.unmasking_key
                    .filter((entry) => entry.sheet2_label)
                    .map((entry) => (
                      <Text key={entry.sheet1_name} type="body">
                        {`${entry.sheet2_label} — ${entry.sheet1_name}`}
                      </Text>
                    ))}
                </Stack>
                {unmaskedOnlyColumns.length ? (
                  <Text type="supporting" maxLines={3}>
                    {`${unmaskedOnlyColumns.map((entry) => entry.sheet1_name).join(", ")} appear only on the named sheet — the masked sheet the matrix above renders has no column for them at all.`}
                  </Text>
                ) : null}
              </Stack>
            </Collapsible>

            <Collapsible value="provenance" trigger="Where this file came from">
              <Stack gap={3}>
                <Stack gap={1}>
                  {artifact.workbook.map((sheet) => (
                    <Text key={sheet.sheet} type="body">
                      {`${sheet.sheet} — ${sheet.vendor_columns} vendor columns, ${sheet.masked ? "masked" : "named"}`}
                    </Text>
                  ))}
                </Stack>
                <Text type="supporting" maxLines={4}>
                  {`Transcribed mechanically on ${artifact.transcribed} from a downloaded copy of the workbook, not retyped by hand. Source typos are preserved verbatim rather than corrected. The canonical vault location recorded for it is ${artifact.path_status === "unverified" ? "unverified — it could not be checked from the machine that transcribed the file" : artifact.path_status}, and at least two downloaded revisions of the workbook exist side by side with no version or date in either.`}
                </Text>
                <Text type="supporting" size="xsm" color="secondary" maxLines={2}>
                  {`Artifact type: ${artifact.type} · origin: ${artifact.origin} · access: ${artifact.access} · citable as fact: ${artifact.citable_as_fact ? "yes" : "no"}`}
                </Text>
              </Stack>
            </Collapsible>
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
