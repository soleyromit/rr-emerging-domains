"use client";

import { useRouter } from "next/navigation";
import { Stack } from "@astryxdesign/core/Stack";
import { Selector } from "@astryxdesign/core/Selector";
import type { SelectorOptionData } from "@astryxdesign/core/Selector";
// The import-free URL module, NOT lib/journey-comparison.ts: that one reads content/
// through node:fs and cannot be pulled into a client bundle.
import { journeyCompareHref } from "@/lib/journey-compare-url";

// The three choices /journeys/[slug]/compare is made of — which journey, and which two
// disciplines — as one control row. Client only because a Selector is interactive; it
// owns no state of its own. Every choice writes the URL and the SERVER re-renders the
// comparison from it, the same read-the-query-param-on-the-server contract the
// Dissection tab's `?node=` deep link uses, which is what makes a comparison a link
// someone can paste into a meeting rather than a local UI state nobody else can see.
//
// `replace`, not `push`: flipping between disciplines is refining one question, not
// walking a history of separate pages, so Back should leave the comparison entirely
// rather than step through every combination tried on the way here.

export interface JourneyCompareOption {
  slug: string;
  label: string;
  stageCount: number;
}

function disciplineOptions(
  options: JourneyCompareOption[],
  excludeSlug: string,
  totalStages: number,
): SelectorOptionData[] {
  return options.map((o) => ({
    value: o.slug,
    label: o.label,
    // The coverage is on the option itself so picking is informed rather than a
    // gamble — a reader can see that Medicine has nothing written on this journey
    // before choosing it, instead of discovering an empty column afterwards.
    description: o.stageCount ? `${o.stageCount} of ${totalStages} stages written` : "Nothing written on this journey",
    // A discipline can't be compared with itself; disabling it in the OTHER selector
    // is how that stays impossible rather than being silently corrected server-side.
    disabled: o.slug === excludeSlug,
  }));
}

export function JourneyComparePicker({
  journeys,
  journeySlug,
  disciplines,
  totalStages,
  aSlug,
  bSlug,
}: {
  journeys: { slug: string; name: string }[];
  journeySlug: string;
  disciplines: JourneyCompareOption[];
  totalStages: number;
  aSlug: string;
  bSlug: string;
}) {
  const router = useRouter();
  const go = (nextJourney: string, nextA: string, nextB: string) =>
    router.replace(journeyCompareHref(nextJourney, nextA, nextB), { scroll: false });

  return (
    <Stack direction="horizontal" gap={3} wrap="wrap" vAlign="end">
      <Selector
        label="Journey"
        value={journeySlug}
        options={journeys.map((j) => ({ value: j.slug, label: j.name }))}
        onChange={(value) => go(value, aSlug, bSlug)}
        width={280}
      />
      <Selector
        label="Compare"
        value={aSlug}
        options={disciplineOptions(disciplines, bSlug, totalStages)}
        onChange={(value) => go(journeySlug, value, bSlug)}
        width={280}
      />
      <Selector
        label="Against"
        value={bSlug}
        options={disciplineOptions(disciplines, aSlug, totalStages)}
        onChange={(value) => go(journeySlug, aSlug, value)}
        width={280}
      />
    </Stack>
  );
}
