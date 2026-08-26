"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavHeading, SideNavSection, SideNavItem } from "@astryxdesign/core/SideNav";
import { Text } from "@astryxdesign/core/Text";
import { Stack } from "@astryxdesign/core/Stack";

const SECTIONS = [
  { title: "Overview", items: [{ href: "/", label: "Executive summary" }] },
  { title: "Product", items: [{ href: "/prism", label: "PRISM capability map" }] },
  {
    title: "Market",
    items: [
      { href: "/feature-map", label: "Feature map" },
      { href: "/competitors", label: "Competitor matrix" },
      { href: "/accreditation", label: "Accreditation map" },
    ],
  },
  {
    title: "Customer",
    items: [
      { href: "/personas", label: "Personas" },
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
    title: "Lenses",
    items: [
      { href: "/lenses", label: "Lenses" },
      { href: "/crosswalk", label: "Crosswalk" },
      { href: "/domains", label: "Domains" },
    ],
  },
];

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
              subheading="DO · Pharmacy · Dentistry · Medicine"
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
                  isSelected={
                    item.href === "/" || item.href === "/lenses"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                  }
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
