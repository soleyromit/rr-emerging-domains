"use client";

import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { NodeDetailPanel, type CrossLinks } from "@/components/dissect/node-detail-panel";
import { FieldBlock } from "@/components/field-block";
import type { PillarNodeDetail } from "@/lib/dissection-node-detail";

// One Prism pillar, as content/prism/capability-map.yaml defines it.
//
// NOT the same question as dissection-matrix.tsx's row panel, and the two must not be
// merged. That one answers "how did every competitor rate on this one capability row,
// and what is the evidence" — it reads the feature-comparison lens at capability
// granularity. This one answers "what IS this pillar, does it ship today, and what is
// under it" — it reads the product map. Same word ("pillar"), different file, different
// question, different audience. Unifying them would force one component to render two
// unrelated schemas.
export function PillarDetailPanel({
  detail,
  domainSlug,
  domainLabel,
  connections,
}: {
  detail: PillarNodeDetail;
  domainSlug: string;
  domainLabel: string;
  /** The graph panel's "how this connects on the map" section, rendered as the last
   * member of this panel's group. See node-detail-panel.tsx. */
  connections?: ReactNode;
}) {
  // /product's capability-map tab renders all six pillars as cards and has no per-pillar
  // anchor or query param to jump to (re-checked against app/product/page.tsx as of this
  // task) — so this links to the map plainly rather than to a fragment that would
  // silently do nothing.
  const crossLinks: CrossLinks = [
    { label: "The full Prism capability map", href: "/product" },
    { label: `${domainLabel} overview`, href: `/domains/${domainSlug}` },
  ];

  const isRoadmap = detail.status === "roadmap";
  const title = !detail.found
    ? `${detail.name} is not in the capability map`
    : isRoadmap
      ? `${detail.name} is on the roadmap${detail.roadmapTarget ? `, targeted ${detail.roadmapTarget}` : ""} — it does not ship today`
      : `${detail.name} ships today`;

  return (
    <NodeDetailPanel
      status={!detail.found ? "warning" : isRoadmap ? "warning" : "success"}
      title={title}
      crossLinks={crossLinks}
      connections={connections}
      defaultValue={detail.notes ? ["what"] : detail.features.length ? ["features"] : undefined}
      takeaway={
        <Stack gap={1.5}>
          {!detail.found ? (
            <Text type="supporting" maxLines={4}>
              The map draws edges into this pillar because {domainLabel}&apos;s content names it, but
              no pillar in the capability map carries this exact name any more — most likely it was
              renamed there and the lenses still use the old spelling. Nothing below can be shown
              until the two agree.
            </Text>
          ) : (
            // DELIBERATELY NOT the pillar's `notes`. Two reasons, both found by opening
            // this on screen: the section right below is open by default and holds the
            // same field, so a clamped copy here rendered the same paragraph twice in a
            // row — the exact duplication FieldBlock's own comment warns about — and
            // these notes are internal reconciliation prose that really does open
            // "CORRECTION to prior research:" / "CONFIRMED SHIPPED —", which is a bad
            // sentence to lead a panel with. So the scan line states what is countable
            // and the prose stays one section down, where it reads as what it is.
            <Text type="supporting" maxLines={3}>
              {detail.features.length
                ? `The capability map records ${detail.features.length} feature${detail.features.length === 1 ? "" : "s"} under this pillar${detail.notes ? ", plus the working notes below" : " and no summary note of its own"}.`
                : "The capability map records this pillar as a name and a status and nothing else — no description, and no features under it yet. That is the whole entry."}
            </Text>
          )}
          <Stack direction="horizontal" gap={1} wrap="wrap">
            {detail.status ? (
              <Badge variant={isRoadmap ? "yellow" : "green"} label={isRoadmap ? "Roadmap" : "Shipped"} />
            ) : null}
            {detail.features.length ? (
              <Badge
                variant="neutral"
                label={`${detail.features.length} feature${detail.features.length === 1 ? "" : "s"}`}
              />
            ) : null}
          </Stack>
        </Stack>
      }
    >
      <Collapsible value="what" trigger="What this pillar does">
        <Stack gap={3}>
          {detail.notes ? <FieldBlock label="In the capability map's words" text={detail.notes} maxLines={6} /> : null}
          {detail.whyItMatters ? <FieldBlock label="Why it matters" text={detail.whyItMatters} maxLines={6} /> : null}
          {!detail.notes && !detail.whyItMatters ? (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              The capability map gives this pillar a name and a status and no prose description.
              That is the whole record — there is nothing withheld here.
            </Text>
          ) : null}
        </Stack>
      </Collapsible>

      <Collapsible
        value="features"
        trigger={
          detail.features.length ? `Features (${detail.features.length})` : "Features (none listed)"
        }
      >
        {detail.features.length ? (
          <Stack gap={3}>
            {detail.features.map((f, i) => (
              <Stack key={`${f.name}-${i}`} gap={1}>
                <Text type="body" weight="semibold" textWrap="wrap">
                  {f.name}
                </Text>
                <FieldBlock text={f.detail} type="supporting" maxLines={3} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
            No feature is listed under this pillar in the capability map yet.
          </Text>
        )}
      </Collapsible>

      {/* Rendered ONLY where a real roadmap entry exists. A "Roadmap: none" section on
          the four shipped pillars would be four empty sections inviting a click that
          answers nothing, and worse, would imply the map tracks roadmap state for
          pillars it does not. */}
      {detail.hasRoadmap ? (
        <Collapsible value="roadmap" trigger="Roadmap">
          <Stack gap={2}>
            {detail.roadmapTarget ? (
              <Stack gap={1}>
                <Text type="label" color="secondary" size="xsm">
                  Target
                </Text>
                <Text type="body">{detail.roadmapTarget}</Text>
              </Stack>
            ) : null}
            {/* The one thing this section must not do is present an uncited date as a
                sourced commitment. Every `source_id` under a roadmap entry in the
                capability map is null today; saying so is the honest render. */}
            <Text type="supporting" size="sm" color="secondary" maxLines={4} style={{ fontStyle: "italic" }}>
              {detail.roadmapSourceId
                ? "This date is cited in the capability map."
                : "The capability map states this date with no source id behind it — it is the product map's own assertion, not something this repo can trace to a document. Treat it as a plan, not a commitment you can quote."}
            </Text>
          </Stack>
        </Collapsible>
      ) : null}
    </NodeDetailPanel>
  );
}
