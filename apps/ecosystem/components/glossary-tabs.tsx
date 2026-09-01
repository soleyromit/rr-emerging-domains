"use client";

import { useState, useEffect } from "react";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { Token, type TokenColor } from "@astryxdesign/core/Token";
import { Link } from "@astryxdesign/core/Link";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { DisciplineChip } from "@/components/discipline-chip";
import { CommonGroundIcon } from "@/components/concept-icons";
import { useVocabularyNav } from "@/components/vocabulary-nav-context";
import { extractLead } from "@/lib/markdown-sections";
import { resolvePrismFit, type GlossaryGroup, type MinimalAccreditationDoc } from "@/lib/glossary";

// Stable, DOM-safe anchor for a term — used to scroll to it after a Rosetta
// cell jump. Term headings can contain punctuation/quotes, so this isn't the
// term text itself, just something unique and queryable.
function termAnchorId(groupKey: string, term: string): string {
  return `glossary-term::${groupKey}::${encodeURIComponent(term)}`;
}

// Same fit → color language as components/fit-badge.tsx's FitBadge, reused
// here via Token instead of Badge — Badge is hard-capped at the design
// system's 12px supporting-text size with no override, Token accepts a
// `style` override, which is how the Prism-vocabulary page's pills stayed
// readable. See lib/glossary.ts's resolvePrismFit for how the match itself
// is derived (a structured element-id lookup, never prose extraction).
const FIT_TOKEN_COLOR: Record<string, TokenColor> = {
  transfer: "green",
  configure: "orange",
  build: "blue",
  gap: "red",
};

// Term browser: one tab per domain (plus the cross-domain set), each tab a scannable list
// of term name + one-line definition. The full entry — definition, Prism pillar, the
// "say it to a dean" line, and its source — stays collapsed until asked for, so nobody has
// to read ~60 entries top-to-bottom to find the one they need before a call.
export function GlossaryTabs({
  groups,
  accreditationDocs = [],
}: {
  groups: GlossaryGroup[];
  /** Passed through to resolvePrismFit for a real, structured fit pill per term. */
  accreditationDocs?: MinimalAccreditationDoc[];
}) {
  const [value, setValue] = useState(groups[0]?.key ?? "");
  const [openValues, setOpenValues] = useState<string[]>([]);
  const active = groups.find((g) => g.key === value) ?? groups[0];

  const { jumpTarget, consumeJump } = useVocabularyNav();

  // A Rosetta cell jump names a domain + term. Switch to that domain's tab,
  // force its Collapsible open, then scroll it into view once the new tab's
  // content has actually rendered (hence the rAF — the tab switch and the
  // scroll target's existence land in different commits).
  useEffect(() => {
    if (!jumpTarget) return;
    const group = groups.find((g) => g.key === jumpTarget.domainSlug);
    if (!group) return;
    setValue(group.key);
    const collapsibleValue = `${group.key}::${jumpTarget.termName}`;
    setOpenValues((prev) => (prev.includes(collapsibleValue) ? prev : [...prev, collapsibleValue]));
    const id = termAnchorId(group.key, jumpTarget.termName);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    consumeJump();
  }, [jumpTarget, groups, consumeJump]);

  if (!active) return null;

  // The per-domain intro is a scan-layer lead, not a paragraph to read on load: show the
  // first two sentences, and keep the rest one click down when there is more than that.
  const intro = active.intro?.trim() ?? "";
  const introLead = extractLead(intro, 2);
  const introHasMore = Boolean(intro) && (!introLead || intro.length > introLead.length + 40);

  return (
    <Stack gap={5}>
      <TabList value={active.key} onChange={setValue} hasDivider>
        {groups.map((g) => (
          <Tab
            key={g.key}
            value={g.key}
            label={g.label}
            endContent={<Badge variant="neutral" label={String(g.terms.length)} />}
          />
        ))}
      </TabList>

      <Stack gap={4}>
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          {active.subject ? <DisciplineChip subject={active.subject} /> : <CommonGroundIcon size={20} />}
          <Heading level={3}>{active.heading}</Heading>
          <Text type="supporting" size="sm">
            {active.terms.length} terms
          </Text>
        </Stack>

        {intro ? (
          <Stack gap={1}>
            {introLead ? (
              <Text type="supporting" maxLines={3}>
                {introLead}
              </Text>
            ) : null}
            {introHasMore ? (
              <Collapsible
                key={`${active.key}::intro`}
                value={`${active.key}::intro`}
                defaultIsOpen={false}
                trigger={
                  <Text type="label" color="secondary" size="sm">
                    Read the full introduction
                  </Text>
                }
              >
                <Markdown headingLevelStart={4} contentWidth={760} density="compact">
                  {intro}
                </Markdown>
              </Collapsible>
            ) : null}
          </Stack>
        ) : null}

        <CollapsibleGroup type="multiple" hasDividers density="compact" value={openValues} onChange={(v) => setOpenValues(Array.isArray(v) ? v : [v])}>
          {active.terms.map((t) => {
            const fits = resolvePrismFit(t, accreditationDocs);
            return (
            <Collapsible
              key={t.term}
              id={termAnchorId(active.key, t.term)}
              value={`${active.key}::${t.term}`}
              trigger={
                <Stack gap={0.5} maxWidth={720}>
                  <Text type="body" weight="semibold" size="lg">
                    {t.term}
                  </Text>
                  {t.summary ? (
                    <Text type="supporting" maxLines={2}>
                      {t.summary}
                    </Text>
                  ) : null}
                  {fits.length ? (
                    <Stack direction="horizontal" gap={1.5} wrap="wrap">
                      {fits.map((f) => (
                        <Token
                          key={`${f.domainSlug}-${f.fit}`}
                          label={fits.length > 1 ? `${f.domainSlug.toUpperCase()}: ${f.fit}` : f.fit}
                          color={FIT_TOKEN_COLOR[f.fit.toLowerCase()] ?? "gray"}
                          style={{ fontSize: "13px", fontWeight: 600 }}
                        />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              }
            >
              <Stack gap={2}>
                <Markdown headingLevelStart={4} contentWidth={760} density="compact">
                  {t.body}
                </Markdown>
                {t.relatedRosettaKey ? (
                  <Link href={`#rosetta-${t.relatedRosettaKey}`} size="sm" color="accent" hasUnderline>
                    Compare across all four domains →
                  </Link>
                ) : null}
              </Stack>
            </Collapsible>
            );
          })}
        </CollapsibleGroup>
      </Stack>
    </Stack>
  );
}
