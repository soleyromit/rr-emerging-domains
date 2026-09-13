import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { ProductTabs } from "@/components/product-tabs";

// One route for "what Prism itself is": the capability map (page.tsx) and the
// system vocabulary (vocabulary/page.tsx) used to be two sidebar entries under
// Product, /prism and /prism/vocabulary. Both answer a question about the product
// rather than the market, so they are sibling tabs of one page now — same
// route-based tab shell as the domain hub (app/domains/[slug]/layout.tsx), with
// the tab list in the layout so it renders once for every tab.
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap={0}>
      <Section padding={6}>
        <ProductTabs />
      </Section>
      {children}
    </Stack>
  );
}
