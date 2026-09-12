"use client";

import { useState } from "react";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { StatusIcon, StatusBadge } from "@/components/feature-status";
import type { FeatureMap } from "@/lib/content";

// No sanitizer import here on purpose. `summary` and `opportunity` arrive already
// sanitized from listFeatureMaps, which runs on the server. Sanitizing again in this
// client component would be harmless but misleading — it would suggest the raw text ever
// reaches the browser, and the whole point of moving it server-side is that it does not.

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
                  {p.summary}
                </Text>

                <Divider />

                <Stack gap={1}>
                  <Text type="label" color="secondary">
                    Opportunity for Exxat
                  </Text>
                  {/* `opportunity` was the field still carrying a raw
                      "content/prism/capability-map.yaml" after /feature-map's dead `sources`
                      prop was dropped — `summary` beside it had been sanitized, this had
                      not. Both are now cleaned in listFeatureMaps before the prop is built.
                      Worth knowing why a markup scan never flagged it: this is a client
                      component, so a non-selected tab's cards live only in the flight
                      payload until the reader clicks that tab. */}
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
