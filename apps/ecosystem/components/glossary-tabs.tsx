"use client";

import { useState } from "react";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { DisciplineChip } from "@/components/discipline-chip";
import { extractLead } from "@/lib/markdown-sections";
import type { GlossaryGroup } from "@/lib/glossary";

// Term browser: one tab per domain (plus the cross-domain set), each tab a scannable list
// of term name + one-line definition. The full entry — definition, Prism pillar, the
// "say it to a dean" line, and its source — stays collapsed until asked for, so nobody has
// to read ~60 entries top-to-bottom to find the one they need before a call.
export function GlossaryTabs({ groups }: { groups: GlossaryGroup[] }) {
  const [value, setValue] = useState(groups[0]?.key ?? "");
  const active = groups.find((g) => g.key === value) ?? groups[0];

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
          {active.subject ? <DisciplineChip subject={active.subject} /> : null}
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

        <CollapsibleGroup type="multiple" hasDividers density="compact">
          {active.terms.map((t) => (
            <Collapsible
              key={t.term}
              value={`${active.key}::${t.term}`}
              defaultIsOpen={false}
              trigger={
                <Stack gap={0.5} maxWidth={720}>
                  <Text type="body" weight="semibold">
                    {t.term}
                  </Text>
                  {t.summary ? (
                    <Text type="supporting" maxLines={2}>
                      {t.summary}
                    </Text>
                  ) : null}
                </Stack>
              }
            >
              <Markdown headingLevelStart={4} contentWidth={760} density="compact">
                {t.body}
              </Markdown>
            </Collapsible>
          ))}
        </CollapsibleGroup>
      </Stack>
    </Stack>
  );
}
