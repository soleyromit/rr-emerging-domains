import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { StandardsTabs } from "@/components/standards-tabs";

// One route for "what do the accreditors require, and what do their words mean":
// the cross-domain coverage map (page.tsx, was /crosswalk) and the accreditor
// glossary (glossary/page.tsx, was /synthesis/vocabulary) used to be two sidebar
// entries in two different groups. They are the two halves of one question — the
// map says which standards exist and how much of each domain Prism covers, the
// glossary says what the standards are actually saying — so they are sibling tabs
// of one page now, the same route-based tab shell as /product
// (app/product/layout.tsx), /competitive-landscape
// (app/competitive-landscape/layout.tsx) and the domain hub
// (app/domains/[slug]/layout.tsx), with the tab list in the layout so it renders
// once for every tab.
export default function StandardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap={0}>
      <Section padding={6}>
        {/* Breadcrumb in the layout, not the pages: it renders once above both tabs,
            so /standards and /standards/glossary both carry it. Same two crumbs and
            same component as the domain hub (app/domains/[slug]/layout.tsx) — the
            sidebar group, then this destination. It matters more here than anywhere
            else in this merge: the glossary used to live under a different sidebar
            group entirely (/synthesis/vocabulary, under `Strategy`), so a reader
            who remembers it from there needs the trail to say where it went. */}
        <Stack gap={4}>
          <Breadcrumbs>
            <BreadcrumbItem>Where we win or lose</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Standards &amp; glossary</BreadcrumbItem>
          </Breadcrumbs>
          <StandardsTabs />
        </Stack>
      </Section>
      {children}
    </Stack>
  );
}
