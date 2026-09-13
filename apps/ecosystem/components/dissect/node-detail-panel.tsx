"use client";

import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";
import { CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { Takeaway } from "@/components/takeaway";

// The shape every Dissection node detail panel has, so five different entities read
// the same way: ONE real verdict sentence, a Divider, named closed sections, and a row
// of links out. That is UI-DENSITY-PATTERNS.md's two-zone shape, and it is also the
// exact shape components/dissect/standard-detail-panel.tsx's StandardDetail already
// had before this component existed — which is why StandardDetail is NOT refactored
// onto this shell. It is a pure, byte-identical extraction of an already-reviewed
// component that happens to satisfy the same contract by hand; rewriting it to take
// `sections` as a prop would have been a large unforced diff on the one panel nobody
// asked to change. Four panels use this shell; the fifth matches its shape as
// committed. Both facts are stated in Task 5.5's report rather than hidden.
//
// This is a THIRD panel mechanism in this codebase and deliberately not a unification
// of the other two. lib/table-detail-panel.tsx opens a full-width row under a Table
// row; ComparisonMatrix's rowPanel + Fact/Impact/Act slots open one under a matrix row. Both
// are about a ROW of a grid and both hook into a table's own layout. This one is about
// a NODE of a graph, has no table to insert itself into, and is rendered by ordinary
// composition. Nothing would be shared by merging them except the word "panel".

export interface CrossLink {
  label: string;
  href: string;
}

/** At least two, enforced by the type rather than by a comment nobody reads.
 *
 * The plan's wording is "enforced as a required prop, so no panel can be a dead end",
 * which is a compile-time claim: a panel that shipped with one link would be a reader's
 * cul-de-sac, and the failure mode is silent. A tuple with two required members and a
 * rest element makes `crossLinks={[a]}` a type error at the call site, the same
 * structural enforcement ComparisonMatrix uses when it types its unverified variant's
 * `rowPanel?: never`. */
export type CrossLinks = [CrossLink, CrossLink, ...CrossLink[]];

export function NodeDetailPanel({
  status = "info",
  title,
  takeaway,
  defaultValue,
  crossLinks,
  connections,
  children,
}: {
  status?: "info" | "warning" | "success" | "error";
  /** The one-sentence verdict. A heading, not a label — it names the thing AND says
   * what is true about it, so a reader who opens nothing still leaves with an answer. */
  title: string;
  takeaway: ReactNode;
  /** Which section starts open. One at most, per UI-DENSITY-PATTERNS.md's "pick a
   * sensible default and set it on the group" rule — a panel with everything open is
   * the two-zone shape in name only. */
  defaultValue?: string[];
  crossLinks: CrossLinks;
  /** The caller's "how this connects on the map" `Collapsible`, rendered as the LAST
   * member of the group rather than after the link row. It is passed in rather than
   * built here because the map's edge vocabulary belongs to the graph panel, not to a
   * presentational shell — but it has to sit inside the accordion: a lone Collapsible
   * row below the links reads as detached from the panel, and it puts the link row in
   * the middle of the sections instead of at the end where "here is where to go next"
   * belongs. */
  connections?: ReactNode;
  /** The `Collapsible` children of the group. */
  children: ReactNode;
}) {
  return (
    <Stack gap={4}>
      <Takeaway status={status} title={title}>
        {takeaway}
      </Takeaway>

      <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />

      <CollapsibleGroup type="multiple" hasDividers density="compact" defaultValue={defaultValue}>
        {children}
        {connections}
      </CollapsibleGroup>

      {/* The same "Text label xsm + Link" idiom StandardDetail's own link row uses (and
          exxat-gap-answer.tsx, and domain-scenario.tsx) rather than a new size/weight
          invented for this one surface — a reader moving between the standards table's
          panel and the map's panels should not notice they changed components. */}
      <Stack direction="horizontal" gap={3} wrap="wrap">
        {crossLinks.map((l) => (
          <Text key={l.href + l.label} type="label" color="secondary" size="xsm">
            <Link href={l.href} color="accent" hasUnderline>
              {l.label} →
            </Link>
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}
