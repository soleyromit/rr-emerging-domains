"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabList, Tab } from "@astryxdesign/core/TabList";

// Route-based tabs, not local-state tabs — the same mechanism /product
// (components/product-tabs.tsx), /competitive-landscape
// (components/competitive-landscape-tabs.tsx) and app/domains/[slug]
// (components/domain-hub-tabs.tsx) use, for the same reason: each tab is a real
// URL under /standards/**, so only the active tab's content is ever in the DOM
// (and in the flight payload — the coverage map carries every domain's full
// crosswalk row set and the glossary carries ~60 parsed term bodies, so this
// matters on both sides).
//
// "Glossary", not "Vocabulary": /product's own second tab is the Prism system
// vocabulary, and two tabs called Vocabulary in one sidebar was the name
// collision this merge exists to close.
const TABS = [
  { segment: "", label: "Coverage map" },
  { segment: "glossary", label: "Glossary" },
];

export function StandardsTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const base = "/standards";
  const current = pathname === base ? "" : (pathname.slice(base.length + 1).split("/")[0] ?? "");

  return (
    <TabList value={current} onChange={(v) => router.push(v ? `${base}/${v}` : base)} hasDivider>
      {TABS.map((t) => (
        <Tab key={t.segment} value={t.segment} label={t.label} />
      ))}
    </TabList>
  );
}
