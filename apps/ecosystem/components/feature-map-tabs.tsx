"use client";

import { useState } from "react";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { StatusIcon, StatusBadge } from "@/components/feature-status";
import { stripFileCitations } from "@/lib/strip-file-citations";
import type { FeatureMap } from "@/lib/content";

export function FeatureMapTabs({ featureMaps }: { featureMaps: FeatureMap[] }) {
  const [value, setValue] = useState(featureMaps[0]?.domain ?? "");

  const active = featureMaps.find((f) => f.domain === value);

  return (
    <Stack gap={5}>
      <TabList value={value} onChange={setValue} hasDivider>
        {featureMaps.map((f) => (
          <Tab key={f.domain} value={f.domain} label={f.domain} />
        ))}
      </TabList>

      {active ? (
        <Grid columns={{ minWidth: 320 }} gap={4}>
          {active.pillars.map((p) => (
            <Card key={p.pillar}>
              <Stack gap={3}>
                <Stack direction="horizontal" hAlign="between" vAlign="start" gap={2}>
                  <Stack direction="horizontal" gap={2} vAlign="center">
                    <StatusIcon status={p.status} />
                    <Text type="body" weight="semibold">
                      {p.pillar}
                    </Text>
                  </Stack>
                  <StatusBadge status={p.status} />
                </Stack>

                {p.leader ? (
                  <Text type="supporting" size="xsm">
                    Led by: {p.leader}
                  </Text>
                ) : null}

                <Text type="body" maxLines={4}>
                  {stripFileCitations(p.summary)}
                </Text>

                <Divider />

                <Stack gap={1}>
                  <Text type="label" color="secondary">
                    Opportunity for Exxat
                  </Text>
                  <Text type="supporting" maxLines={3}>
                    {p.opportunity}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Grid>
      ) : null}
    </Stack>
  );
}
