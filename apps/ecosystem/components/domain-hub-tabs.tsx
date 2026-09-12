"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabList, Tab } from "@astryxdesign/core/TabList";

const BASE_TABS = [
  { segment: "", label: "Overview" },
  // Dissection sits directly after Overview: it is the six-question answer to
  // "what do we actually know about this domain", which frames every tab after
  // it. Inserted into BASE_TABS rather than prepended, so a domain with a sales
  // brief still reads "How we win" → Overview → Dissection.
  { segment: "dissect", label: "Dissection" },
  { segment: "standards", label: "Standards" },
  // Trends sits right after Standards: both answer "what does this domain
  // demand of the product", standards from the accreditor and trends from the
  // market, and both are read before the competitor-by-competitor detail.
  { segment: "trends", label: "Trends" },
  { segment: "competitors", label: "Competitors" },
  { segment: "persona", label: "Persona" },
];

// "How we win" is prepended — the whole point is to be the most discoverable
// tab, not one more item after the five a reader already scans past. This
// doesn't change the default landing route (`/domains/[slug]` with no segment
// still renders Overview, per the routing below); it only changes which tab
// reads first. Present only for domains with a real sales/positioning brief
// (content/synthesis/{slug}/SALES.md), same Partial<Record>-style convention
// as DOMAIN_EDITORIAL in app/domains/[slug]/page.tsx: populated only where the
// research exists, absent everywhere else rather than showing an empty tab.
const WIN_TAB = { segment: "win", label: "How we win" };

// Route-based tabs, not local-state tabs — each tab is a real URL under
// /domains/[slug]/**, so only the active tab's content is ever in the DOM.
// Reintroduces the tab pattern that was explicitly dropped from this page once
// before (see app/domains/[slug]/layout.tsx's comment) — this time to fix "too much
// vertical scroll," not to relitigate that call.
export function DomainHubTabs({ slug, hasWinBrief = false }: { slug: string; hasWinBrief?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/domains/${slug}`;
  const current = pathname === base ? "" : (pathname.slice(base.length + 1).split("/")[0] ?? "");
  const tabs = hasWinBrief ? [WIN_TAB, ...BASE_TABS] : BASE_TABS;

  return (
    <TabList value={current} onChange={(v) => router.push(v ? `${base}/${v}` : base)} hasDivider>
      {tabs.map((t) => (
        <Tab key={t.segment} value={t.segment} label={t.label} />
      ))}
    </TabList>
  );
}
