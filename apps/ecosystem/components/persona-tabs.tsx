"use client";

import { useState } from "react";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Stack } from "@astryxdesign/core/Stack";
import type { ReactNode } from "react";

export function PersonaTabs({
  discipline,
  role,
  lens,
}: {
  discipline: ReactNode;
  role: ReactNode;
  lens: ReactNode;
}) {
  const [value, setValue] = useState("discipline");

  return (
    <Stack gap={5}>
      <TabList value={value} onChange={setValue} hasDivider>
        <Tab value="discipline" label="Discipline layer" />
        <Tab value="role" label="Role layer" />
        <Tab value="lens" label="Competitor lens" />
      </TabList>
      {value === "discipline" ? discipline : null}
      {value === "role" ? role : null}
      {value === "lens" ? lens : null}
    </Stack>
  );
}
