"use client";

import { useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text, type TextSize, type TextType } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";

// The default answer for "I have one string that might be long": a clamp with an
// automatic hover tooltip, plus a "read full" toggle for anything past a skim
// length. See UI-DENSITY-PATTERNS.md. Reused across journey stage fields and flow
// element gap notes so truncation always has a click-through, not just a tooltip.
//
// Toggles ONE Text between clamped and full (via maxLines), rather than rendering
// the clamped preview and the full text at once inside a Collapsible — that
// earlier version showed the same opening lines twice once expanded.
export function FieldBlock({
  id,
  label,
  text,
  type = "body",
  maxLines = 2,
  size,
  triggerLabel = "Read the full section",
}: {
  id?: string;
  label?: string;
  text?: string;
  type?: TextType;
  maxLines?: number;
  size?: TextSize;
  triggerLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  if (!text) return null;
  const isLong = text.length > 180;
  return (
    <Stack gap={1}>
      {label ? (
        <Text type="label" color="secondary" size="xsm">
          {label}
        </Text>
      ) : null}
      <Text type={type} size={size} maxLines={isOpen ? 0 : maxLines} textWrap={isOpen ? "wrap" : undefined}>
        {text}
      </Text>
      {isLong ? (
        <Link size="sm" color="accent" hasUnderline onClick={() => setIsOpen((o) => !o)}>
          {isOpen ? "Show less" : triggerLabel}
        </Link>
      ) : null}
    </Stack>
  );
}
