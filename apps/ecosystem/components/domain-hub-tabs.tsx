"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabList, Tab } from "@astryxdesign/core/TabList";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "standards", label: "Standards" },
  { segment: "competitors", label: "Competitors" },
  { segment: "persona", label: "Persona" },
];

// Route-based tabs, not local-state tabs — each tab is a real URL under
// /domains/[slug]/**, so only the active tab's content is ever in the DOM.
// Reintroduces the tab pattern that was explicitly dropped from this page once
// before (see app/domains/[slug]/layout.tsx's comment) — this time to fix "too much
// vertical scroll," not to relitigate that call.
export function DomainHubTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/domains/${slug}`;
  const current = pathname === base ? "" : (pathname.slice(base.length + 1).split("/")[0] ?? "");

  return (
    <TabList value={current} onChange={(v) => router.push(v ? `${base}/${v}` : base)} hasDivider>
      {TABS.map((t) => (
        <Tab key={t.segment} value={t.segment} label={t.label} />
      ))}
    </TabList>
  );
}
