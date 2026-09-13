"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabList, Tab } from "@astryxdesign/core/TabList";

// Route-based tabs, not local-state tabs — the same mechanism /product
// (components/product-tabs.tsx) and app/domains/[slug]
// (components/domain-hub-tabs.tsx) use, for the same reason: each pivot is a real
// URL under /competitive-landscape/**, so only the active pivot's content is ever
// in the DOM (and in the flight payload — the by-competitor pivot's teardown
// objects and the by-pillar pivot's 24 pillar cells are both large enough that
// this matters).
const TABS = [
  { segment: "", label: "By competitor" },
  { segment: "by-pillar", label: "By pillar" },
  // The third pivot (task 4.2): the same depth judgments placed on two named axes.
  { segment: "by-quadrant", label: "By quadrant" },
];

export function CompetitiveLandscapeTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = "/competitive-landscape";
  const current = pathname === base ? "" : (pathname.slice(base.length + 1).split("/")[0] ?? "");

  // `?domain=` is carried across a pivot switch on purpose. The pivot is the
  // mutually-exclusive choice and therefore a route segment; the domain is an
  // orthogonal narrowing layered on top of whichever pivot is active, so a reader
  // who arrived from one domain's Competitors tab stays scoped to that domain when
  // they flip from pillars to competitors instead of being silently widened back
  // out to all four.
  const domain = searchParams.get("domain");
  const query = domain ? `?domain=${encodeURIComponent(domain)}` : "";

  return (
    <TabList
      value={current}
      onChange={(v) => router.push(v ? `${base}/${v}${query}` : `${base}${query}`)}
      hasDivider
    >
      {TABS.map((t) => (
        <Tab key={t.segment} value={t.segment} label={t.label} />
      ))}
    </TabList>
  );
}
