"use client";

// Client component only because it hands lucide icon *components* to Icon —
// a function prop can't cross the server/client boundary (see feature-status.tsx,
// same reason). Nothing here is interactive.

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Globe,
  Link2,
  MessagesSquare,
  Newspaper,
  Video,
} from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { SourceLine } from "@/components/source-line";
import type { SourceRegistryEntry } from "@/lib/content";
import type { BadgeVariant } from "@/lib/discipline-meta";

type KindMeta = { label: string; variant: BadgeVariant; icon: typeof Video };

// `webinar` is the one kind that gets a non-neutral color: a recorded product
// webinar is the strongest first-party evidence in this research base (it's a
// competitor demoing their own behavior), so it should pop out of a reference
// list that's otherwise mostly docs and product pages.
const KIND_META: Record<string, KindMeta> = {
  webinar: { label: "Webinar", variant: "purple", icon: Video },
  // A first-party internal interview is the only source kind in this registry that
  // isn't publicly checkable — neutral variant (no new color), distinct icon/label so
  // a reader can tell it apart from a vendor page at a glance.
  interview: { label: "Interview", variant: "neutral", icon: MessagesSquare },
  doc: { label: "Doc", variant: "neutral", icon: FileText },
  press: { label: "Press", variant: "neutral", icon: Newspaper },
  "product-page": { label: "Product page", variant: "neutral", icon: Globe },
  analyst: { label: "Analyst", variant: "neutral", icon: BarChart3 },
  // `analyst` used to cover peer-reviewed papers too; they're `research-paper`
  // as of the 2026-09-11 registry re-type, and 15 of the 16 entries that moved
  // land here. Without these two the badge falls back to a bare "Source".
  "research-paper": { label: "Research paper", variant: "neutral", icon: BookOpen },
  conference: { label: "Conference", variant: "neutral", icon: CalendarDays },
  other: { label: "Other", variant: "neutral", icon: Link2 },
};

const UNKNOWN_KIND: KindMeta = { label: "Source", variant: "neutral", icon: Link2 };

export function SourceBadge({ kind }: { kind?: string }) {
  const meta = KIND_META[kind?.toLowerCase().trim() ?? ""] ?? UNKNOWN_KIND;
  return <Badge variant={meta.variant} label={meta.label} icon={<Icon icon={meta.icon} size="xsm" />} />;
}

// A tight reference list for an already-open detail panel — deliberately not a
// Card grid or a ReferencesList-style bibliography, both of which would dominate
// the panel they sit inside. One row per source: kind pill, title, link, and the
// publisher/date line that makes a citation checkable.
export function SourceList({
  sources,
  label = "Sources",
}: {
  sources: SourceRegistryEntry[];
  label?: string;
}) {
  if (!sources.length) return null;
  return (
    <Stack gap={1}>
      {label ? (
        <Text type="label" color="secondary" size="xsm">
          {label}
        </Text>
      ) : null}
      <Stack gap={1}>
        {sources.map((s) => {
          const meta = [s.publisher, s.date].filter(Boolean).join(" · ");
          return (
            <Stack key={s.id} direction="horizontal" gap={1.5} vAlign="start" wrap="wrap">
              <SourceBadge kind={s.type} />
              <Stack gap={0}>
                {/* Only render the title separately when there's also a URL —
                    otherwise SourceLine below already renders it as prose. */}
                {s.title && s.url ? (
                  <Text type="supporting" size="xsm" maxLines={2}>
                    {s.title}
                  </Text>
                ) : null}
                <SourceLine source={s.url ?? s.title} size="xsm" />
                {meta ? (
                  <Text type="supporting" size="xsm" color="secondary">
                    {meta}
                  </Text>
                ) : null}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
