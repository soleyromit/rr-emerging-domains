"use client";

import { List, ListItem } from "@astryxdesign/core/List";
import { Stack } from "@astryxdesign/core/Stack";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DisciplineChip } from "@/components/discipline-chip";
import { GapSeverityBadge, TrendCoverageBadge } from "@/components/fit-badge";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { KeyFinding } from "@/lib/content";

// The scan-first layer for a block of research prose: one line per finding — subject
// chip, short headline, severity badge — so a reader gets the shape of a stage's
// findings without opening any of the long-form variance text underneath.
//
// `severityVocabulary` lets a caller keep the same severity *values*
// (none | configure-needed | gap) and the same color language while relabelling
// the badge for its own subject matter — /domains/[slug]/trends passes "trend",
// because "Configure needed" says nothing about a market trend. It's a plain
// string, NOT a render function: this is a client component and its callers are
// server components, and a function prop cannot cross that boundary ("Functions
// cannot be passed directly to Client Components"). Defaults to "gap-severity",
// so every existing caller is unaffected.
//
// `emptyTitle`/`emptyDescription` likewise let a caller be specific about *what*
// is missing instead of showing the generic extraction message.
export function KeyFindingList({
  findings,
  severityVocabulary = "gap-severity",
  emptyTitle = "No structured findings extracted yet",
  emptyDescription,
}: {
  findings?: KeyFinding[];
  severityVocabulary?: "gap-severity" | "trend";
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!findings?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <List hasDividers>
      {findings.map((f, i) => (
        <ListItem
          key={i}
          startContent={<DisciplineChip subject={f.subject} />}
          // headline needs the same treatment as detail: it is the same author's prose,
          // and it cites files just as freely — it was simply the half nobody wrapped.
          label={stripFileCitations(f.headline)}
          description={stripFileCitations(f.detail)}
          endContent={
            f.severity ? (
              <Stack align="end">
                {severityVocabulary === "trend" ? (
                  <TrendCoverageBadge severity={f.severity} />
                ) : (
                  <GapSeverityBadge severity={f.severity} />
                )}
              </Stack>
            ) : undefined
          }
        />
      ))}
    </List>
  );
}
