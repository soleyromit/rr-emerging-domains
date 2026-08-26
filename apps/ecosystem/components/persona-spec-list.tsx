import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Banner } from "@astryxdesign/core/Banner";
import type { IconName } from "@astryxdesign/core/Icon";
import { IconFactCard } from "@/components/icon-fact-card";
import { pickThemeIcon } from "@/lib/theme-icon";

export interface SpecListItem {
  label: string;
  text: string;
}

// A researcher's methodology caveat ("NOTE: no dedicated accreditation file
// exists yet...") is a different kind of thing than a finding — it explains
// how the findings below were sourced, it isn't one itself. Mixed into the
// fact-card grid as an equal-weight card, it reads as confusing noise (a
// "finding" that's actually about the absence of a source file). Pulled out
// into its own disclaimer instead. Confirmed present in 4 of 12 discipline
// files, always as a leading entry starting with "note".
const NOTE_PATTERN = /^note[:\s]/i;

// Icon-led fact cards, not a term/definition accordion: point (4-65 chars
// everywhere, measured) is always the card's visible headline, detail
// (272-498 char avg prose) clamped to 2 lines with a real click-through for
// the rest. Replaces PressurePointList's one-real-Collapsible-per-point
// approach, which hid a short label behind a click even when the detail
// underneath was only 2-3 lines. Used for discipline accreditation_pressure/
// current_tools, which have no per-item source field — no citation badge is
// fabricated for these.
export function PersonaSpecList({
  items,
  fallbackIcon = "info",
}: {
  items?: SpecListItem[];
  fallbackIcon?: IconName;
}) {
  if (!items?.length) return null;
  const notes = items.filter((item) => NOTE_PATTERN.test(item.text));
  const facts = items.filter((item) => !NOTE_PATTERN.test(item.text));
  return (
    <Stack gap={3}>
      {notes.map((note, i) => (
        <Banner key={`note-${i}`} status="info" title="Methodology note" description={note.text} container="card" />
      ))}
      {facts.length ? (
        <Grid columns={{ minWidth: 260 }} gap={3}>
          {facts.map((item, i) => (
            <IconFactCard
              key={`${item.label}-${i}`}
              icon={pickThemeIcon(`${item.label} ${item.text}`, fallbackIcon)}
              headline={item.label}
              text={item.text}
            />
          ))}
        </Grid>
      ) : null}
    </Stack>
  );
}
