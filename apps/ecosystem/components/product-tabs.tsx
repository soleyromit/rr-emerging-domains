"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabList, Tab } from "@astryxdesign/core/TabList";

// Route-based tabs, not local-state tabs — the same mechanism app/domains/[slug]
// uses (components/domain-hub-tabs.tsx), for the same reason: each tab is a real
// URL under /product/**, so only the active tab's content is ever in the DOM (and
// in the flight payload — the capability map's pillar objects are large enough
// that this matters, see components/charts/prism-features-chart.tsx).
const TABS = [
  { segment: "", label: "Capability map" },
  { segment: "vocabulary", label: "Vocabulary" },
];

export function ProductTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const base = "/product";
  const current = pathname === base ? "" : (pathname.slice(base.length + 1).split("/")[0] ?? "");

  return (
    <TabList value={current} onChange={(v) => router.push(v ? `${base}/${v}` : base)} hasDivider>
      {TABS.map((t) => (
        <Tab key={t.segment} value={t.segment} label={t.label} />
      ))}
    </TabList>
  );
}
