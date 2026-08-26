import { Badge } from "@astryxdesign/core/Badge";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { matchDisciplineMeta } from "@/lib/discipline-meta";

// Consistent short-code + color chip for a domain/discipline, used in matrices, tables,
// and finding cards so scanning across pages is pattern-matching on color/code, not
// re-reading a full label every time. Falls back to the raw subject text if unmatched.
export function DisciplineChip({ subject }: { subject: string }) {
  const meta = matchDisciplineMeta(subject);
  if (!meta) return <Badge variant="neutral" label={subject} />;
  return (
    <Tooltip content={meta.label}>
      <Badge variant={meta.badgeVariant} label={meta.code} />
    </Tooltip>
  );
}
