"use client";

import { Citation } from "@astryxdesign/core/Citation";
import { HoverCard } from "@astryxdesign/core/HoverCard";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { SourceBadge } from "@/components/source-list";
import { SourceLine } from "@/components/source-line";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { NumberedCitation } from "@/lib/page-citations";
import type { SourceRegistryEntry } from "@/lib/content";

// ---------------------------------------------------------------------------
// Inline citation marks, Wikipedia's Reference Previews shape.
//
// The two citation mechanisms already in this app are both HEAVY: a numbered
// badge that resolves to a ReferencesList at the bottom of the block
// (ProseItemList), and a click-to-open detail panel carrying a full SourceList.
// Neither fits a paragraph of leadership prose — one puts a bibliography under
// a three-sentence takeaway, the other makes the reader open a panel to find
// out whether a claim is sourced at all.
//
// Reference Previews is the light complement: a superscript marker in the
// sentence, and hover/focus/tap opens the source IN PLACE. Nothing navigates,
// nothing expands, and the page keeps no visible wall of footnotes.
//
// THE ONE RULE THIS COMPONENT MUST NOT BREAK. lib/strip-file-citations.ts
// exists because raw content filenames ("../accreditation/acpe.yaml") were
// leaking out of content prose onto the screen; there is a 37-case regression
// suite guarding it. This component surfaces a citation rather than stripping
// one, which is the exact place that leak could be reintroduced — so a mark is
// NEVER built from a file path. It renders only a resolved
// SourceRegistryEntry: curated title / publisher / date / url / what_it_supports
// from the Level 0.5 source homes, the same fields SourceList renders. The two
// prose-shaped fields still go through stripFileCitations on the way out, so
// even a future registry entry whose title names a content file humanizes
// instead of leaking.
// ---------------------------------------------------------------------------

/** Where a flagged citation goes. PitchBook's pattern is that correction must be
 * visibly POSSIBLE next to sourced content — not that it be automated — so this
 * is deliberately one prefilled link, not a workflow. It defaults to this repo's
 * own issue tracker, which is where a wrong citation actually gets fixed (the fix
 * is a content/ edit). Set NEXT_PUBLIC_CITATION_FEEDBACK_EMAIL to route it to a
 * mailbox instead, for an audience without repo access. */
const FEEDBACK_EMAIL = process.env.NEXT_PUBLIC_CITATION_FEEDBACK_EMAIL;
const FEEDBACK_ISSUE_URL = "https://github.com/soleyromit/rr-emerging-domains/issues/new";

function flagHref(source: SourceRegistryEntry, claim?: string): string {
  const subject = `Citation correction — ${source.title ?? source.id}`;
  const body = [
    "Flagged from an inline citation preview in the research app.",
    claim ? `Claim it is attached to: ${claim}` : undefined,
    `Source: ${source.title ?? "(untitled registry entry)"}`,
    // The registry id is the only thing that makes the report actionable (it is
    // what a fixer greps for). It lives in the prefilled report body, never in
    // the visible preview — same reason internal identifiers stay off screen
    // everywhere else in this app.
    `Source id: ${source.id}`,
    "",
    "What is wrong, and what it should say instead:",
    "",
  ]
    .filter(Boolean)
    .join("\n");
  const query = `title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return FEEDBACK_EMAIL
    ? `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : `${FEEDBACK_ISSUE_URL}?${query}`;
}

/**
 * A superscript citation marker whose source previews in place on hover, focus
 * or tap.
 *
 * `citation` is optional and a missing one renders NOTHING — so a page can mark
 * a sentence whose source id may not resolve without its own guard, and a
 * sentence with no real source behind it simply never gets a mark. See
 * numberCitations in lib/page-citations.ts.
 *
 * `claim` is a short human summary of what the mark is attached to. It names the
 * preview for assistive tech and prefills the correction report, so a flagged
 * citation arrives with the sentence it was flagged on.
 */
export function CitationMark({ citation, claim }: { citation?: NumberedCitation; claim?: string }) {
  if (!citation) return null;
  const { number, source } = citation;
  const title = stripFileCitations(source.title) ?? source.title;
  return (
    <HoverCard
      placement="below"
      alignment="start"
      label={claim ? `Source for: ${claim}` : `Source ${number}`}
      content={<CitationPreviewCard citation={citation} claim={claim} />}
    >
      {/* Deliberately NOT given source.url: a Citation with a url renders an
          anchor that opens the source in a new tab, which is the navigation
          this mechanism exists to avoid. The link lives inside the preview,
          where the reader chooses it. tabIndex makes the marker focusable so
          the preview is reachable from the keyboard, not hover-only.

          The cost of withholding the url is that Citation also withholds its own
          numberInteractive/numberHover styles, which it applies only when href is
          set — leaving a marker that opens a preview on hover but says nothing
          about being interactive, and carries no margin to separate it from a
          neighbouring mark. Both are restored by the .citation-mark rule in
          app/globals.css (which explains the cascade layer it sits in). Styling
          lives there rather than here because a hover state cannot be expressed
          in the inline `style` prop this app otherwise uses, and this app does
          not run the StyleX compiler that `xstyle` would need. */}
      <Citation
        number={number}
        variant="number"
        source={{ title }}
        tabIndex={0}
        className="citation-mark"
      />
    </HoverCard>
  );
}

function CitationPreviewCard({ citation, claim }: { citation: NumberedCitation; claim?: string }) {
  const { source } = citation;
  // Both fields are prose the registry authored by hand, so they get the same
  // humanizing every other prose surface in this app gets. Today no registry
  // entry names a content file in either — this is the guard that keeps the one
  // that eventually does from rendering a raw path inside a citation preview.
  const title = stripFileCitations(source.title) ?? source.title;
  const supports = stripFileCitations(source.what_it_supports);
  const meta = [source.publisher, source.date].filter(Boolean).join(" · ");
  return (
    <Stack gap={2} maxWidth={340} padding={3}>
      <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
        <SourceBadge kind={source.type} />
        <Text type="label" color="secondary" size="xsm">
          Source {citation.number}
        </Text>
      </Stack>
      {title ? (
        <Text type="body" weight="semibold" size="sm" maxLines={3}>
          {title}
        </Text>
      ) : null}
      {meta ? (
        <Text type="supporting" size="xsm" color="secondary">
          {meta}
        </Text>
      ) : null}
      {supports ? (
        <Stack gap={1}>
          <Text type="label" color="secondary" size="xsm">
            What this source supports
          </Text>
          <Text type="supporting" size="xsm" maxLines={4}>
            {supports}
          </Text>
        </Stack>
      ) : null}
      {source.url ? (
        <SourceLine source={source.url} size="xsm" />
      ) : (
        // An internal source (interview record, help-center article, playbook)
        // has no public url by definition. Say so, rather than rendering a dead
        // link or silently showing nothing where every other preview shows one.
        <Text type="supporting" size="xsm" color="secondary">
          Internal source — no public link
        </Text>
      )}
      <Link href={flagHref(source, claim)} isExternalLink size="xsm">
        Flag this citation
      </Link>
    </Stack>
  );
}
