import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  endContent,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  endContent?: ReactNode;
}) {
  return (
    <Stack direction="horizontal" hAlign="between" gap={4} wrap="wrap">
      <Stack gap={1.5} maxWidth={720}>
        <Text type="label" color="secondary" weight="semibold">
          {eyebrow}
        </Text>
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
