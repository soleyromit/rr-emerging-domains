"use client";

// Client component only because it hands a lucide icon *component* to Icon —
// a function prop can't cross the server/client boundary (see feature-status.tsx).
// Nothing here is interactive.

import { SearchX } from "lucide-react";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { IconTile, type PillVariant } from "@/components/status-pill";

// An honest "how much of this is actually researched" line, sitting in the scan
// layer above the Divider so nobody reads a half-populated table as a finished
// one. Deliberately states the raw fraction rather than a percentage or a
// reassuring adjective — the whole repo's traceability rule (content/ARCHITECTURE.md)
// depends on unresearched staying visibly unresearched.
export function CoverageGapsCallout({
  ratedCount,
  totalCount,
  domain,
  trendCount,
  directionalCount,
  isCompact = false,
}: {
  ratedCount: number;
  totalCount: number;
  domain?: string;
  /** Omit when trends aren't relevant to this surface; 0 means "sourced nothing yet". */
  trendCount?: number;
  /** How many of `ratedCount` are first-pass directional reads rather than verified
   * element-by-element research. Optional — every existing caller omits it and is
   * unaffected. Layer 3 of the design spec's caveat mechanism: a reader must not be
   * able to see the rated fraction without also seeing how much of it is provisional. */
  directionalCount?: number;
  isCompact?: boolean;
}) {
  const lines: string[] = [];

  if (totalCount > 0) {
    lines.push(`${ratedCount} of ${totalCount} standard × competitor cells rated`);
  } else {
    lines.push("No competitor research covers this domain's standards yet");
  }

  if (directionalCount && directionalCount > 0) {
    lines.push(`${directionalCount} directional first-pass, pending a full standards-gap audit`);
  }

  if (trendCount === 0) {
    lines.push(domain ? `Trends not yet sourced for ${domain}` : "Trends not yet sourced");
  }

  const variant: PillVariant =
    totalCount > 0 && ratedCount === totalCount ? "success" : ratedCount > 0 ? "warning" : "error";

  if (isCompact) {
    return (
      <Text type="supporting" size="sm" color="secondary">
        {lines.join(" · ")}
      </Text>
    );
  }

  return (
    <Stack direction="horizontal" gap={3} vAlign="center">
      <IconTile variant={variant}>
        <Icon icon={SearchX} size="md" />
      </IconTile>
      <Stack gap={0.5}>
        <Text type="label" color="secondary" size="xsm">
          Research coverage
        </Text>
        {lines.map((line) => (
          <Text key={line} type="body" size="sm">
            {line}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}
