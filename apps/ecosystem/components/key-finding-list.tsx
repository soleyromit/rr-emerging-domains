"use client";

import { List, ListItem } from "@astryxdesign/core/List";
import { Stack } from "@astryxdesign/core/Stack";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DisciplineChip } from "@/components/discipline-chip";
import { GapSeverityBadge } from "@/components/fit-badge";
import type { KeyFinding } from "@/lib/content";

// The scan-first layer for a block of research prose: one line per finding — subject
// chip, short headline, severity badge — so a reader gets the shape of a stage's
// findings without opening any of the long-form variance text underneath.
export function KeyFindingList({ findings }: { findings?: KeyFinding[] }) {
  if (!findings?.length) {
    return <EmptyState title="No structured findings extracted yet" />;
  }
  return (
    <List hasDividers>
      {findings.map((f, i) => (
        <ListItem
          key={i}
          startContent={<DisciplineChip subject={f.subject} />}
          label={f.headline}
          description={f.detail}
          endContent={
            f.severity ? (
              <Stack align="end">
                <GapSeverityBadge severity={f.severity} />
              </Stack>
            ) : undefined
          }
        />
      ))}
    </List>
  );
}
