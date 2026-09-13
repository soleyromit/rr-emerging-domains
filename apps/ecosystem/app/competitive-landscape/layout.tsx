import { Suspense } from "react";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { CompetitiveLandscapeTabs } from "@/components/competitive-landscape-tabs";

// One route for "where does Prism stand against the field": the per-competitor
// teardown index (page.tsx, was /competitors) and the pillar × domain feature map
// (by-pillar/page.tsx, was /feature-map) used to be two sidebar entries under
// Market. They are the same question pivoted on different axes — one competitor's
// six pillars vs. one pillar's six competitors — so they are sibling tabs of one
// page now, the same route-based tab shell as /product (app/product/layout.tsx)
// and the domain hub (app/domains/[slug]/layout.tsx), with the tab list in the
// layout so it renders once for every tab.
//
// Suspense around the tab list because it reads `?domain=` via useSearchParams;
// without a boundary that opts the whole subtree out of static rendering.
export default function CompetitiveLandscapeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap={0}>
      <Section padding={6}>
        {/* Breadcrumb in the layout, not the pages: it renders once above all three
            pivots, so /competitive-landscape, /by-pillar and /by-quadrant all carry
            it. Same two crumbs and same component as the domain hub
            (app/domains/[slug]/layout.tsx) — sidebar group, then this destination.
            Outside the Suspense boundary on purpose: it reads nothing dynamic, so
            it should render statically rather than be held behind the tab list's
            useSearchParams. */}
        <Stack gap={4}>
          <Breadcrumbs>
            <BreadcrumbItem>Where we win or lose</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Competitive landscape</BreadcrumbItem>
          </Breadcrumbs>
          <Suspense fallback={null}>
            <CompetitiveLandscapeTabs />
          </Suspense>
        </Stack>
      </Section>
      {children}
    </Stack>
  );
}
