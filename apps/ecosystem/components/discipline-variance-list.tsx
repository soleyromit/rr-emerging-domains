"use client";

import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { DisciplineChip } from "@/components/discipline-chip";
import { firstSentence } from "@/lib/text";
import type { DisciplineVarianceNote } from "@/lib/content";

// A stage's discipline_variance used to be one ~19,000-character essay behind a single
// "read the full section" toggle — all-or-nothing, and nobody reads it. Split per
// discipline, the same prose becomes a scannable list: chip + first sentence per row,
// the discipline's full passage only for the one or two a reader actually cares about.

export function DisciplineVarianceList({ notes }: { notes?: DisciplineVarianceNote[] }) {
  if (!notes?.length) return null;
  return (
    <Stack gap={1}>
      <Text type="label" color="secondary" size="xsm">
        Discipline variance (PT/PTA · OT/OTA · PA · SLP · Nursing · Social Work · Teacher Ed · CRNA)
      </Text>
      <CollapsibleGroup type="multiple" hasDividers density="compact">
        {notes.map((note, i) => (
          <Collapsible
            key={`${note.subject}-${i}`}
            value={`discipline-note-${i}`}
            defaultIsOpen={false}
            trigger={
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap" maxWidth={760}>
                <DisciplineChip subject={note.subject} />
                <Text type="supporting" maxLines={2}>
                  {firstSentence(note.detail)}
                </Text>
              </Stack>
            }
          >
            <Text type="body" textWrap="wrap">
              {note.detail}
            </Text>
          </Collapsible>
        ))}
      </CollapsibleGroup>
    </Stack>
  );
}
