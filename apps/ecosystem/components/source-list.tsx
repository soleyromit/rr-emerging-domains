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

// How faithfully an interview record captures what was said (`evidence_status` in the
// session front-matter). Only the *degraded* tiers are listed: a citation says nothing
// extra when the record is verbatim or verbatim-cleaned, because that is the normal case
// for this corpus and a badge on 100% of rows carries no information — the same
// "don't badge the honest default" cut ClaimedBadge and the derived-edge dashed line make.
//
// Unmapped or missing values render no caveat, deliberately: `SESSION_EVIDENCE_STATUS` in
// `scripts/check_content_density.py` already FAILs the build on a status outside the
// schema, so it is the gate — and silently mislabelling a verbatim source as summarized
// would be a worse honesty failure than staying quiet. If a new degraded tier is added to
// the schema, add it here too or it will cite as if it were verbatim.
const DEGRADED_EVIDENCE_NOTE: Record<string, string> = {
  "summary-only": "Summarized, not verbatim",
};

function evidenceStatusNote(evidenceStatus?: string): string | undefined {
  return DEGRADED_EVIDENCE_NOTE[evidenceStatus?.toLowerCase().trim() ?? ""];
}

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
          // Kept off the meta line on purpose: publisher/date are checkable facts about
          // the source, this is a caveat about the record itself. Same supporting weight
          // so it reads as a footnote to the citation, not a second classification of it.
          const evidenceNote = evidenceStatusNote(s.evidence_status);
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
                {evidenceNote ? (
                  <Text type="supporting" size="xsm" color="secondary">
                    {evidenceNote}
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
