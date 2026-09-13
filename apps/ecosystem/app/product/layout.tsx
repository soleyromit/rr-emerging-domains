import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { ProductTabs } from "@/components/product-tabs";

// One route for "what Prism itself is": the capability map (page.tsx) and the
// system vocabulary (vocabulary/page.tsx) used to be two sidebar entries under
// Product, /prism and /prism/vocabulary. Both answer a question about the product
// rather than the market, so they are sibling tabs of one page now — same
// route-based tab shell as the domain hub (app/domains/[slug]/layout.tsx), with
// the tab list in the layout so it renders once for every tab.
// The breadcrumb lives HERE rather than in page.tsx, for the same reason the tab
// list does: a layout renders once above every tab, so /product and
// /product/vocabulary both get it, and neither can drift from the other. Same two
// crumbs and same component as the domain hub (app/domains/[slug]/layout.tsx):
// the sidebar group, then this destination. The group crumb carries no href
// because a nav group is a heading, not a route. Which TAB you are in is the tab
// list's job, directly below — the breadcrumb does not repeat it, exactly as on
// the domain hub.
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap={0}>
      <Section padding={6}>
        <Stack gap={4}>
          <Breadcrumbs>
            <BreadcrumbItem>What we ship today</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product</BreadcrumbItem>
          </Breadcrumbs>
          <ProductTabs />
        </Stack>
      </Section>
      {children}
    </Stack>
  );
}
