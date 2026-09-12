"use client";

import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { NodeDetailPanel, type CrossLinks } from "@/components/dissect/node-detail-panel";
import { FieldBlock } from "@/components/field-block";
import { CompetitorLogo } from "@/components/competitor-logo";
import { SourceList } from "@/components/source-list";
import type { TrendNodeDetail } from "@/lib/dissection-node-detail";
import { stripFileCitations } from "@/lib/strip-file-citations";

// One market trend, as content/trends/{domain}.yaml records it.
//
// THE EMPTY CASE IS THE COMMON CASE AND IS THE POINT. Of Pharmacy's 14 trends, 10 have
// an empty addressed_by_competitors; all 8 of DO's are empty. "No competitor on record
// addresses this" is a real, load-bearing research finding — it is where a white-space
// claim comes from — and it is destroyed the moment a panel fills the space with
// something plausible instead. So the competitor section renders the absence in words
// and says explicitly that nobody has been researched against it, which is not the same
// claim as "nobody does it".
//
// Same discipline on exxat_ref: on an `unaddressed` trend that field holds a sentence
// about what Prism does NOT do (which is why dissection-graph.ts refuses to draw it as
// a trend->pillar edge). Rendering it under a heading like "How Exxat addresses this"
// would invert its meaning, so the heading and the framing follow exxat_status.
export function TrendDetailPanel({
  detail,
  domainSlug,
  domainLabel,
  connections,
}: {
  detail: TrendNodeDetail;
  domainSlug: string;
  domainLabel: string;
  /** The graph panel's "how this connects on the map" section, rendered as the last
   * member of this panel's group. See node-detail-panel.tsx. */
  connections?: ReactNode;
}) {
  const status = detail.exxatStatus;
  const covered = status === "shipped" || status === "roadmap";

  // There is no per-trend route in this app (confirmed: /domains/[slug]/trends is the
  // only trends page) — so the first link is always the domain's full trend list. The
  // second is the first named competitor when the trend has one, and the domain
  // overview when it does not, so the two-link floor is met either way rather than by a
  // link that would point at nothing.
  const first = detail.addressedBy[0];
  const crossLinks: CrossLinks = [
    { label: `All ${domainLabel} trends`, href: `/domains/${domainSlug}/trends` },
    first
      ? { label: `${first.competitor ?? first.slug} in full`, href: `/competitors/${first.slug}` }
      : { label: `${domainLabel} overview`, href: `/domains/${domainSlug}` },
  ];

  const statusWord =
    status === "shipped"
      ? "Exxat ships an answer to this today"
      : status === "roadmap"
        ? "Exxat's answer to this is on the roadmap, not shipped"
        : status === "unaddressed"
          ? "Exxat does not address this today"
          : `Exxat's status on this is recorded as "${status}"`;

  return (
    <NodeDetailPanel
      status={status === "shipped" ? "success" : status === "roadmap" ? "warning" : "error"}
      title={statusWord}
      crossLinks={crossLinks}
      connections={connections}
      defaultValue={["whats-happening"]}
      takeaway={
        <Stack gap={1.5}>
          <Text type="supporting" maxLines={4}>
            {detail.trend}
          </Text>
          <Stack direction="horizontal" gap={1} wrap="wrap">
            <Badge
              variant={status === "shipped" ? "green" : status === "roadmap" ? "yellow" : "red"}
              label={status === "shipped" ? "Shipped" : status === "roadmap" ? "Roadmap" : "Unaddressed"}
            />
            <Badge
              variant="neutral"
              label={
                detail.addressedBy.length
                  ? `${detail.addressedBy.length} competitor${detail.addressedBy.length === 1 ? "" : "s"} on record`
                  : "No competitor on record"
              }
            />
          </Stack>
        </Stack>
      }
    >
      <Collapsible value="whats-happening" trigger="What's happening">
        <Stack gap={3}>
          {detail.detail ? (
            <FieldBlock text={stripFileCitations(detail.detail)} maxLines={6} />
          ) : (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              This trend is recorded as a headline with no detail paragraph behind it yet.
            </Text>
          )}
          {detail.sources.length ? <SourceList sources={detail.sources} /> : null}
        </Stack>
      </Collapsible>

      <Collapsible
        value="exxat"
        trigger={covered ? "How Exxat addresses this" : "Where Exxat stands on this"}
      >
        <Stack gap={2}>
          <Text type="body" size="sm" textWrap="wrap">
            {statusWord}.
          </Text>
          {detail.exxatRef ? (
            <FieldBlock
              // The heading has to follow the status, not the field name: on an
              // unaddressed trend this same field holds a sentence about the GAP.
              label={covered ? "The capability that answers it" : "What the gap is, in the file's own words"}
              text={detail.exxatRef}
              type="supporting"
              maxLines={5}
            />
          ) : (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              No Exxat capability or gap note is recorded against this trend.
            </Text>
          )}
        </Stack>
      </Collapsible>

      <Collapsible
        value="competitors"
        trigger={
          detail.addressedBy.length
            ? `How competitors address this (${detail.addressedBy.length})`
            : "How competitors address this (nobody researched)"
        }
      >
        {detail.addressedBy.length ? (
          <Stack gap={3}>
            {detail.addressedBy.map((c, i) => (
              <Stack key={`${c.slug}-${i}`} gap={1.5}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <CompetitorLogo slug={c.slug} competitor={c.competitor ?? c.slug} size={20} />
                  <Text type="body" weight="semibold">
                    {c.competitor ?? c.slug}
                  </Text>
                </Stack>
                {c.capabilityRef ? (
                  <Text type="supporting" size="sm" maxLines={3}>
                    {/* The vendor's OWN name for the thing, which is why it is quoted
                        rather than mapped to a pillar here — some of these really are
                        not pillars at all ("MSPE letter generation"). */}
                    {c.capabilityRef}
                  </Text>
                ) : (
                  <Text type="supporting" size="sm" color="secondary" style={{ fontStyle: "italic" }}>
                    Named as addressing this trend with no capability recorded.
                  </Text>
                )}
                {/* A resolved registry entry, so the same SourceList every other
                    evidence surface uses — not a bare URL rendered by hand. */}
                {c.source ? <SourceList sources={[c.source]} /> : null}
              </Stack>
            ))}
          </Stack>
        ) : (
          <Text type="supporting" size="sm" color="secondary" maxLines={4} style={{ fontStyle: "italic" }}>
            No competitor has been researched against this trend. That is an absence of research,
            not a finding that no vendor addresses it — and it is exactly the state a white-space
            claim would have to be checked against before anyone made one.
          </Text>
        )}
      </Collapsible>
    </NodeDetailPanel>
  );
}
