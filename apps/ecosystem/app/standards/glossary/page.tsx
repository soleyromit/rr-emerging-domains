import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { Divider } from "@astryxdesign/core/Divider";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Link } from "@astryxdesign/core/Link";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { IconTile } from "@/components/status-pill";
import { GlossaryTabs } from "@/components/glossary-tabs";
import { RosettaCards } from "@/components/rosetta-cards";
import { VocabularyNavProvider } from "@/components/vocabulary-nav-context";
import { readMarkdownFile, listAccreditation } from "@/lib/content";
import { stripFileCitationsInMarkdown } from "@/lib/strip-file-citations";
import { parseGlossary, buildRosettaTermIndex } from "@/lib/glossary";

// The "Glossary" tab of /standards. Was /synthesis/vocabulary (now a permanent
// redirect here, see next.config.ts), and renamed Vocabulary → Glossary because
// /product's own second tab is the Prism system vocabulary — two sidebar rows
// called Vocabulary was the collision this merge closes. Its sibling tab, the
// coverage map, is ../page.tsx; the tab list lives in ../layout.tsx.
export default function StandardsGlossaryPage() {
  const content = stripFileCitationsInMarkdown(readMarkdownFile("synthesis/vocabulary-glossary.md"));

  if (!content) {
    return (
      <Section padding={6}>
        <EmptyState title="Not yet synthesized" description="content/synthesis/vocabulary-glossary.md has not been written." />
      </Section>
    );
  }

  const glossary = parseGlossary(content);
  const accreditationDocs = listAccreditation();
  const rosettaTermIndex = buildRosettaTermIndex(glossary.groups);

  return (
    <VocabularyNavProvider>
    <Stack gap={0}>
      {/* ---------- Bite-sized: what this is, how much of it there is ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          {/* No eyebrow — the layout's breadcrumb states the trail above both tabs. */}
          <PageHeader
            title="Speak COCA, ACPE, CODA, and LCME before the first call"
            description="Organized by domain: term → plain-English definition → which Prism pillar it touches → how to say it to a dean. Roadmap pillars are labeled honestly, not oversold."
            endContent={
              <IconTile variant="neutral">
                <Icon icon="search" size="lg" />
              </IconTile>
            }
          />
          <Takeaway title="Nobody reads a glossary end to end — look up the four terms that will come up on your call">
            Start with the Rosetta Stone below: every term here has an allied-health equivalent the team already
            uses daily. Then open the tab for the domain you&rsquo;re walking into and scan the term names —
            each row expands to the full entry only if you need it. Looking for Prism&rsquo;s own product terms —
            Placement, Slot, Wishlist — instead? See{" "}
            <Link href="/product/vocabulary" hasUnderline>
              the Vocabulary tab under Product
            </Link>
            .
          </Takeaway>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <MetadataList columns={3}>
          <MetadataListItem label="Terms defined">{glossary.totalTerms}</MetadataListItem>
          <MetadataListItem label="Expansion domains">{glossary.domainCount}</MetadataListItem>
          <MetadataListItem label="Cross-domain terms (learn first)">{glossary.crossDomainTerms}</MetadataListItem>
        </MetadataList>
      </Section>

      {/* ---------- The on-ramp: the translation table, in full, uncollapsed ---------- */}
      {glossary.rosettaRows.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Heading level={2}>{glossary.rosetta?.title.replace(/^\d+\.\s*/, "")}</Heading>
            {/* SCAN-LAYER: intentional on-ramp cards, not prose — do not gate behind Collapsible */}
            <RosettaCards rows={glossary.rosettaRows} termIndex={rosettaTermIndex} />
          </Stack>
        </Section>
      ) : null}

      {/* ---------- Everything below is lookup reference, not reading ---------- */}
      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      {glossary.groups.length ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading level={2}>Every term, by domain</Heading>
              <Text type="supporting">
                Scan the names. Expand a row for the full entry — definition, the Prism pillar it touches, the line
                to say to a dean, and the source file it came from.
              </Text>
            </Stack>
            <GlossaryTabs groups={glossary.groups} accreditationDocs={accreditationDocs} />
          </Stack>
        </Section>
      ) : null}

      <Section padding={6} variant="muted">
        <CollapsibleGroup type="multiple" hasDividers density="compact">
          {glossary.howToUse ? (
            <Collapsible value="how-to-use" defaultIsOpen={false} trigger="How to use this glossary — sourcing rules, Prism pillar statuses, and the COCA legal flag">
              <Markdown headingLevelStart={4} contentWidth={860}>
                {glossary.howToUse}
              </Markdown>
            </Collapsible>
          ) : null}
          {glossary.appendix.map((section) => (
            <Collapsible key={section.title} value={section.title} defaultIsOpen={false} trigger={section.title}>
              <Markdown headingLevelStart={4} contentWidth={860}>
                {section.body}
              </Markdown>
            </Collapsible>
          ))}
        </CollapsibleGroup>
      </Section>
    </Stack>
    </VocabularyNavProvider>
  );
}
