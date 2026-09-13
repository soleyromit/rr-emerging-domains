"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavHeading, SideNavSection, SideNavItem } from "@astryxdesign/core/SideNav";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Stack } from "@astryxdesign/core/Stack";

// Six groups, ten rows — the final shape of the 2026-09-13 nav consolidation. Three
// things landed here in this pass: `Overview` became `Start here` (it names what a
// first-time reader should do, not what the page is); `Go-to-market` moved out of
// `Strategy` into `Market`, which deleted `Strategy` entirely; and `Enterprise repo`
// left the research nav for the SideNav footer below.
const SECTIONS = [
  { title: "Start here", items: [{ href: "/", label: "Executive summary" }] },
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
      // One entry, three anchored sections — NOT tabs. The where-to-play scorecard (was
      // /scorecard), the gap analysis (was /synthesis/gap-analysis) and the positioning
      // brief (was /synthesis/positioning) are three ordered steps of one decision —
      // which domain, what is missing there, what to say in the room — and had zero
      // links between them as three sidebar rows. They are now #which-domain /
      // #whats-missing / #what-to-say on /go-to-market, read front to back with
      // next/prev links (see app/go-to-market/page.tsx).
      // Moved here from the deleted `Strategy` group: it belongs in `Market` because it
      // is the conclusion the two rows above are the evidence for, and reads last for
      // that reason.
      { href: "/go-to-market", label: "Go-to-market" },
      // Listed here while it holds no entries, deliberately: the page states its own
      // absence and cites the session that planned the work, which is only readable if
      // the page is reachable. A nav item is not a claim that research exists behind it.
      // Last in the group on purpose — an acknowledged-empty placeholder should not sit
      // between the researched rows and the conclusion they feed.
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
  // One row, and that is fine: `Domains` lost its second row when /crosswalk was
  // absorbed into /standards, but it stays its own section rather than folding into
  // `Market`. The four domain hubs are the spine of the whole evidence base, not one
  // market artifact among several, and this repo already runs single-row sections
  // (`Product`, `Reference — unverified`) — a lone row is not by itself a reason to merge.
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
            <Stack gap={1} padding={2} width="100%">
              {/* The app's only footer, and it is the SideNav's — rendered by app/layout.tsx
                  on every route, so this link is reachable from every page without adding a
                  second chrome element. `Enterprise repo` lives here rather than in the
                  research nav above because which tool this evidence base is kept in is an
                  internal tooling decision, not product or market research; it was only ever
                  a row under `Strategy` for lack of anywhere else to put it. */}
              <Link
                href="/repo-comparison"
                type="supporting"
                size="2xs"
                color="secondary"
                display="block"
                hasUnderline
              >
                Enterprise repo
              </Link>
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
