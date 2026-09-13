"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavHeading, SideNavSection, SideNavItem } from "@astryxdesign/core/SideNav";
import { Text } from "@astryxdesign/core/Text";
import { Stack } from "@astryxdesign/core/Stack";

const SECTIONS = [
  { title: "Overview", items: [{ href: "/", label: "Executive summary" }] },
  {
    title: "Product",
    // One entry, two tabs: the capability map and the system vocabulary are both
    // about Prism itself rather than the market, and neither carried a
    // perspective the other lacked, so they are sibling tabs under /product
    // (see app/product/layout.tsx) instead of two sidebar rows.
    items: [{ href: "/product", label: "Product" }],
  },
  {
    title: "Market",
    items: [
      // One entry, two pivots: the competitor teardown index (was /competitors)
      // and the pillar × domain feature map (was /feature-map) are the same
      // market sliced on different axes, so they are sibling tabs under
      // /competitive-landscape (see app/competitive-landscape/layout.tsx)
      // instead of two sidebar rows.
      { href: "/competitive-landscape", label: "Competitive landscape" },
      // One entry, two tabs: the cross-domain standards coverage map (was
      // /crosswalk, filed under Domains) and the accreditor glossary (was
      // /synthesis/vocabulary, filed under Strategy) are the two halves of one
      // question — which standards exist and how much Prism covers, and what
      // those standards are actually saying — so they are sibling tabs under
      // /standards (see app/standards/layout.tsx) instead of two sidebar rows in
      // two different groups.
      { href: "/standards", label: "Standards & glossary" },
      // Listed here while it holds no entries, deliberately: the page states its own
      // absence and cites the session that planned the work, which is only readable if
      // the page is reachable. A nav item is not a claim that research exists behind it.
      { href: "/archetypes", label: "University archetypes" },
    ],
  },
  {
    title: "Customer",
    items: [
      { href: "/roles", label: "Roles" },
      { href: "/journeys", label: "Journeys" },
    ],
  },
  {
    title: "Strategy",
    items: [
      { href: "/scorecard", label: "Where-to-play scorecard" },
      { href: "/synthesis/gap-analysis", label: "Gap analysis" },
      { href: "/synthesis/positioning", label: "Positioning brief" },
      { href: "/repo-comparison", label: "Enterprise repo" },
    ],
  },
  {
    title: "Domains",
    items: [{ href: "/domains", label: "Domains" }],
  },
  // Its own section, LAST, and never folded into "Market": everything above this
  // line is researched and cited, and this is not. A quarantined sales artifact
  // sitting as a peer of the competitor matrix would borrow that section's standing,
  // which is precisely what the label and the position exist to deny it.
  {
    title: "Reference — unverified",
    items: [{ href: "/reference/vendor-comparison-chart", label: "Vendor comparison chart (unverified)" }],
  },
];

const ALL_HREFS = SECTIONS.flatMap((s) => s.items.map((i) => i.href));

// Longest-prefix match only — otherwise a parent route that is itself a nav item
// would stay highlighted alongside a more specific child that is also a nav item.
// A sub-route with no nav row of its own (e.g. /product/vocabulary, a tab of the
// /product entry) correctly keeps its parent selected.
function isNavItemSelected(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (!pathname.startsWith(href)) return false;
  return !ALL_HREFS.some((other) => other !== href && other.length > href.length && pathname.startsWith(other));
}

export function AppNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell
      variant="section"
      contentPadding={0}
      sideNav={
        <SideNav
          header={
            <SideNavHeading
              heading="Domain Expansion"
              superheading="Exxat PRISM"
              subheading="Pharmacy · DO · Dentistry · Medicine"
              headingHref="/"
            />
          }
          footer={
            <Stack gap={0.5} padding={2} width="100%">
              <Text type="supporting" size="2xs" display="block" textWrap="wrap">
                Romit Soley × Ruchi — working draft
              </Text>
            </Stack>
          }
        >
          {SECTIONS.map((section) => (
            <SideNavSection key={section.title} title={section.title}>
              {section.items.map((item) => (
                <SideNavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isSelected={isNavItemSelected(item.href, pathname)}
                />
              ))}
            </SideNavSection>
          ))}
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
