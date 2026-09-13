"use client";

// Client component only because it hands lucide icon *components* to Icon — a function
// prop can't cross the server/client boundary (see source-list.tsx and feature-status.tsx,
// same reason). Nothing here is interactive beyond the existing Tooltip.

import {
  Brain,
  BriefcaseMedical,
  Clipboard,
  Dumbbell,
  GraduationCap,
  Hand,
  HeartHandshake,
  HeartPulse,
  Pill,
  Smile,
  Speech,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon, type IconType } from "@astryxdesign/core/Icon";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { matchDisciplineMeta, type DisciplineGlyph } from "@/lib/discipline-meta";

// The one key -> icon map for lib/discipline-meta.ts's `glyph` field. Typed as an
// exhaustive Record so a new DisciplineGlyph member fails the build here instead of
// rendering a chip with no shape cue. `Record` is what keeps the two files in sync —
// don't loosen it to a partial/indexed type.
const GLYPH_ICONS: Record<DisciplineGlyph, IconType> = {
  stethoscope: Stethoscope,
  hand: Hand,
  syringe: Syringe,
  pill: Pill,
  clipboard: Clipboard,
  // lucide has no tooth; Smile is the closest dentistry shape and is unmistakable
  // against its orange tint-mate HeartPulse.
  tooth: Smile,
  pulse: HeartPulse,
  bag: BriefcaseMedical,
  speech: Speech,
  dumbbell: Dumbbell,
  cap: GraduationCap,
  handshake: HeartHandshake,
  brain: Brain,
};

// Consistent short-code + color chip for a domain/discipline, used in matrices, tables,
// and finding cards so scanning across pages is pattern-matching on color/code, not
// re-reading a full label every time. Falls back to the raw subject text if unmatched.
//
// The leading glyph is the *second* dimension: there are more entries than usable tints
// (see lib/discipline-meta.ts), so purple alone can't tell DO from OT from CRNA — the
// stethoscope/hand/syringe shapes can. Icon inherits the Badge variant's text color by
// default and `xsm` (12px) matches Badge's 12px label, so the pair reads as one mark.
// The glyph is decorative here on purpose (no `label`): the code text beside it already
// carries the same information to assistive tech, and the Tooltip supplies the full name.
export function DisciplineChip({ subject }: { subject: string }) {
  const meta = matchDisciplineMeta(subject);
  if (!meta) return <Badge variant="neutral" label={subject} />;
  return (
    <Tooltip content={meta.label}>
      <Badge
        variant={meta.badgeVariant}
        label={meta.code}
        icon={<Icon icon={GLYPH_ICONS[meta.glyph]} size="xsm" />}
      />
    </Tooltip>
  );
}
