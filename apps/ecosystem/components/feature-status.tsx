"use client";

import { Crown, TrendingDown, Lightbulb } from "lucide-react";
import { Icon } from "@astryxdesign/core/Icon";
import { Badge } from "@astryxdesign/core/Badge";
import type { FeatureMapStatus } from "@/lib/content";

export const STATUS_META: Record<
  FeatureMapStatus,
  { label: string; badgeVariant: "success" | "error" | "info"; icon: any; iconColor: "success" | "error" | "accent" }
> = {
  leading: { label: "Prism leads", badgeVariant: "success", icon: Crown, iconColor: "success" },
  behind: { label: "Competitor leads", badgeVariant: "error", icon: TrendingDown, iconColor: "error" },
  opportunity: { label: "Whitespace opportunity", badgeVariant: "info", icon: Lightbulb, iconColor: "accent" },
};

export function StatusIcon({ status, size = "md" }: { status: FeatureMapStatus; size?: "sm" | "md" | "lg" }) {
  const meta = STATUS_META[status];
  return <Icon icon={meta.icon} color={meta.iconColor} size={size} label={meta.label} />;
}

export function StatusBadge({ status }: { status: FeatureMapStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.badgeVariant} label={meta.label} />;
}
