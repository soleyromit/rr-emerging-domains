"use client";

import { useMemo, useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { Button } from "@astryxdesign/core/Button";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { DisciplineChip } from "@/components/discipline-chip";
import { StandardsCrosswalkTable } from "@/components/standards-crosswalk-table";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import type { StandardsCrosswalkForDomain } from "@/lib/content";

export function CrosswalkView({
  domains,
  priorityDomains,
}: {
  domains: StandardsCrosswalkForDomain[];
  priorityDomains: string[];
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"priority" | "all">("all");
  const slugs = useMemo(
    () => domains.map((d) => matchDisciplineMeta(d.domain)?.slug ?? d.domain),
    [domains]
  );
  const [openSlugs, setOpenSlugs] = useState<string[]>(slugs);

  const visible = domains.filter((d) => {
    if (scope === "priority" && !priorityDomains.includes(d.domain)) return false;
    if (query && !d.domain.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <Stack gap={5}>
      <Toolbar
        label="Standards crosswalk controls"
        startContent={
          <TextInput
            label="Filter by domain"
            isLabelHidden
            value={query}
            onChange={setQuery}
            placeholder="Filter by domain name…"
            width={240}
          />
        }
        endContent={
          <Stack direction="horizontal" gap={3} vAlign="center">
            <SegmentedControl label="Domain scope" value={scope} onChange={(v) => setScope(v as "priority" | "all")}>
              <SegmentedControlItem value="priority" label="Priority domains" />
              <SegmentedControlItem value="all" label="All 12" />
            </SegmentedControl>
            <ButtonGroup label="Expand or collapse all domains">
              <Button label="Expand all" variant="secondary" size="sm" onClick={() => setOpenSlugs(slugs)} />
              <Button label="Collapse all" variant="secondary" size="sm" onClick={() => setOpenSlugs([])} />
            </ButtonGroup>
          </Stack>
        }
      />

      {visible.length === 0 ? (
        <EmptyState title="No domains match that filter" description="Clear the filter or switch scope above." />
      ) : (
        <CollapsibleGroup type="multiple" hasDividers value={openSlugs} onChange={(v) => setOpenSlugs(v as string[])}>
          {visible.map((d) => {
            const slug = matchDisciplineMeta(d.domain)?.slug ?? d.domain;
            return (
              <Collapsible
                key={d.domain}
                value={slug}
                trigger={
                  <Stack direction="horizontal" gap={2} vAlign="center">
                    <DisciplineChip subject={d.domain} />
                    <Text type="body" weight="semibold" size="base">
                      {d.domain}
                    </Text>
                    <Text type="supporting" size="sm" color="secondary">
                      {d.accreditor}
                    </Text>
                  </Stack>
                }
              >
                <Stack gap={3}>
                  <StandardsCrosswalkTable standardsCrosswalk={d} />
                  <Divider />
                </Stack>
              </Collapsible>
            );
          })}
        </CollapsibleGroup>
      )}
    </Stack>
  );
}
