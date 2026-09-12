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
    items: [
      { href: "/prism", label: "PRISM capability map" },
      { href: "/prism/vocabulary", label: "System vocabulary" },
    ],
  },
  {
    title: "Market",
    items: [
      { href: "/feature-map", label: "Feature map" },
      { href: "/competitors", label: "Competitor matrix" },
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
      { href: "/synthesis/vocabulary", label: "Vocabulary glossary" },
      { href: "/repo-comparison", label: "Enterprise repo" },
    ],
  },
  {
    title: "Domains",
    items: [
      { href: "/domains", label: "Domains" },
      { href: "/crosswalk", label: "Crosswalk" },
    ],
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

// Longest-prefix match only — otherwise a parent route like "/prism" stays
// highlighted alongside a more specific child like "/prism/vocabulary".
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
