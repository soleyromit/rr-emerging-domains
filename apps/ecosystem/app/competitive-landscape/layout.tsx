import { Suspense } from "react";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
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
        <Suspense fallback={null}>
          <CompetitiveLandscapeTabs />
        </Suspense>
      </Section>
      {children}
    </Stack>
  );
}
