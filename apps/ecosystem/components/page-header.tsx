import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import type { ReactNode } from "react";

// `eyebrow` is optional as of task 4.4 (2026-09-13 nav consolidation). On most
// pages it names the sidebar group the page sits in, which is the only in-page
// signal of where you are. The four merged destinations (/product,
// /competitive-landscape, /standards, /go-to-market) now carry a real
// `Breadcrumbs` trail in their layout instead — the same component and placement
// the domain hub uses (app/domains/[slug]/layout.tsx) — which states that group
// higher up the page and one level more precisely. Those pages pass no eyebrow
// rather than printing the same words twice, ~100px apart.
export function PageHeader({
  eyebrow,
  title,
  description,
  endContent,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  endContent?: ReactNode;
}) {
  return (
    <Stack direction="horizontal" hAlign="between" gap={4} wrap="wrap">
      <Stack gap={1.5} maxWidth={720}>
        {eyebrow ? (
          <Text type="label" color="secondary" weight="semibold">
            {eyebrow}
          </Text>
        ) : null}
        <Heading level={1}>{title}</Heading>
        {description ? (
          <Text type="body" color="secondary">
            {description}
          </Text>
        ) : null}
      </Stack>
      {endContent}
    </Stack>
  );
}
