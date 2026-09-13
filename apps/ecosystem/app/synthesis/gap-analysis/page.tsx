import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "@astryxdesign/core/Icon";
import { Divider } from "@astryxdesign/core/Divider";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { DisciplineChip } from "@/components/discipline-chip";
import { IconTile } from "@/components/status-pill";
import { FitDistributionChart } from "@/components/charts/fit-distribution-chart";
import { readMarkdownFile, listAccreditation } from "@/lib/content";
import { stripFileCitationsInMarkdown } from "@/lib/strip-file-citations";
import {
  splitSectionsAtLevel,
  getPreamble,
  extractLead,
  type MarkdownSection,
} from "@/lib/markdown-sections";

// The four expansion accreditors this document actually rates. content/accreditation/
// now holds more accreditors than the 4-domain thesis covers, so the page filters to
// the same set the markdown's §0 table counts — otherwise the chart and the prose
// would report different totals.
const EXPANSION_ACCREDITORS = ["coca", "lcme", "acpe", "coda"];
const ALL_FOUR_DOMAINS = ["DO", "Pharmacy", "Dentistry", "Medicine"];

const PATTERN_SECTION_PREFIX = "4.";
// Deep-dive sections start closed, matching /product and /synthesis/vocabulary.
const OPEN_BY_DEFAULT: string[] = [];

interface CrossDomainPattern {
  /** "A" … "J", or null for the non-lettered closing subsection. */
  letter: string | null;
  headline: string;
  domainCount: number | null;
  domains: string[];
  lead: string;
  body: string;
  value: string;
}

function normalizeFit(f?: string): "Transfer" | "Configure" | "Build" | "Gap" | "unknown" {
  const s = (f ?? "").toLowerCase();
  if (s.startsWith("transfer")) return "Transfer";
  if (s.startsWith("configure")) return "Configure";
  if (s.startsWith("build")) return "Build";
  if (s.startsWith("gap")) return "Gap";
  return "unknown";
}

// "Pattern A — The entity model stops at the student (4/4 domains)" and
// "Pattern G — CORRECTED …: … (3/4 domains: DO, Pharmacy, Medicine)" both parse here.
function parsePattern(section: MarkdownSection): CrossDomainPattern {
  const letterMatch = section.title.match(/^Pattern\s+([A-Z])\s*[—-]\s*(.*)$/);
  const letter = letterMatch ? letterMatch[1] : null;
  let headline = letterMatch ? letterMatch[2] : section.title;

  const domainMatch = headline.match(/\s*\((\d)\/4\s+domains(?::\s*([^)]*))?\)\s*$/);
  let domainCount: number | null = null;
  let domains: string[] = [];
  if (domainMatch) {
    headline = headline.slice(0, domainMatch.index).trim();
    domainCount = Number(domainMatch[1]);
    domains = domainMatch[2]
      ? domainMatch[2].split(",").map((d) => d.trim()).filter(Boolean)
      : ALL_FOUR_DOMAINS;
  }

  return {
    letter,
    headline,
    domainCount,
    domains,
    lead: extractLead(section.body, 2),
    body: section.body,
    value: letter ? `pattern-${letter}` : section.title,
  };
}

export default function GapAnalysisPage() {
  // Humanized once, here, before the document is split into sections — every Markdown
  // block on this page reads from `content`, so one call upstream covers all of them.
  const content = stripFileCitationsInMarkdown(readMarkdownFile("synthesis/gap-analysis.md"));

  if (!content) {
    return (
      <Section padding={6}>
        <EmptyState title="Not yet synthesized" description="content/synthesis/gap-analysis.md has not been written." />
      </Section>
    );
  }

  // ---------- source-derived numbers (never hand-typed) ----------
  const docs = listAccreditation().filter((d) => EXPANSION_ACCREDITORS.includes(d.slug));
  const standards = docs.flatMap((d) => d.standards ?? []);
  const fitCounts = standards.reduce<Record<string, number>>((acc, s) => {
    const k = normalizeFit(s.prism_fit);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const worst = docs
    .map((d) => ({
      doc: d,
      gaps: (d.standards ?? []).filter((s) => normalizeFit(s.prism_fit) === "Gap").length,
      total: (d.standards ?? []).length,
    }))
    .sort((a, b) => b.gaps / b.total - a.gaps / a.total)[0];

  // ---------- document structure ----------
  const preamble = getPreamble(content);
  const sections = splitSectionsAtLevel(content, 2);
  const patternSection = sections.find((s) => s.title.startsWith(PATTERN_SECTION_PREFIX));
  const otherSections = sections.filter((s) => s !== patternSection);

  const patternSubsections = patternSection ? splitSectionsAtLevel(patternSection.body, 3) : [];
  const patterns = patternSubsections.map(parsePattern);
  const letteredPatterns = patterns.filter((p) => p.letter);
  const allFourCount = letteredPatterns.filter((p) => p.domainCount === 4).length;
  // Intro prose that sits between the `## 4.` heading and the first `### Pattern` heading.
  const patternIntro = patternSection ? patternSection.body.split("\n### ")[0].trim() : "";

  return (
    <Stack gap={0}>
      {/* ---------- Bite-sized: headline + one takeaway ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Strategy"
            title={`${standards.length} standards, 5 gaps, ${letteredPatterns.length} platform-level patterns — the full evidence trail`}
            description="Scan the numbers and the platform patterns below; every section of the underlying analysis is still here, one click down."
            endContent={
              <IconTile variant="warning">
                <Icon icon="warning" size="lg" />
              </IconTile>
            }
          />
          <Takeaway
            status="warning"
            title="The gaps are not scattered — they clump, and they all point at one unshipped pillar"
          >
            {fitCounts.Gap} of {standards.length} researched accreditation elements are hard Gaps, and 14 of those
            sit in just three buckets: standards-to-evidence mapping, external outcome-data ingestion, and closed-loop
            CQI — all three the job description of the unshipped Accreditation Management pillar (Q3 2027). The twist
            is the market read: DO is the most attractive domain and the heaviest build, because COCA is the only
            accreditor in the set with zero elements rated Transfer and the only one where Gaps outnumber Configures
            ({worst ? `${worst.gaps} of ${worst.total}` : "7 of 12"}).
          </Takeaway>
        </Stack>
      </Section>

      {/* ---------- Stat row + one chart: the whole study in 10 seconds ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <MetadataList columns={4}>
            <MetadataListItem label="Elements rated">
              {standards.length} across {docs.length} accreditors
            </MetadataListItem>
            <MetadataListItem label="Transfer / Configure / Gap">
              {fitCounts.Transfer ?? 0} · {fitCounts.Configure ?? 0} · {fitCounts.Gap ?? 0}
            </MetadataListItem>
            <MetadataListItem label="Platform-level patterns">
              {letteredPatterns.length} (A–{letteredPatterns[letteredPatterns.length - 1]?.letter ?? "J"})
            </MetadataListItem>
            <MetadataListItem label="Patterns hitting all 4 domains">
              {allFourCount} of {letteredPatterns.length}
            </MetadataListItem>
          </MetadataList>
          <Stack gap={3}>
            <Heading level={2}>Prism fit distribution, by accreditor</Heading>
            <Text type="supporting">
              Counts derived from the <code>prism_fit</code> field on every entry in{" "}
              {/* The accreditors by name, not by filename: this sentence was building
                  "coca.yaml, lcme.yaml, ..." in the app itself — the one place a raw
                  filename reached the screen without any content field being involved. */}
              {EXPANSION_ACCREDITORS.map((s) => s.toUpperCase()).join(", ")} — the same source as §0&rsquo;s
              table.
            </Text>
            <FitDistributionChart docs={docs} />
          </Stack>
        </Stack>
      </Section>

      {/* ---------- The scannable core: 10 cross-domain patterns, one row each ---------- */}
      {patterns.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading level={2}>Cross-domain patterns — fund these once, at the platform layer</Heading>
              {patternIntro ? (
                <Text type="supporting" maxLines={3}>
                  {patternIntro}
                </Text>
              ) : null}
            </Stack>
            <CollapsibleGroup type="single" hasDividers density="compact">
              {patterns.map((p) => (
                <Collapsible
                  key={p.value}
                  value={p.value}
                  trigger={
                    <Stack direction="horizontal" hAlign="between" vAlign="start" gap={3} wrap="wrap" width="100%">
                      <Stack direction="horizontal" gap={2} vAlign="start">
                        <Badge variant={p.letter ? "info" : "neutral"} label={p.letter ?? "★"} />
                        <Stack gap={0.5}>
                          <Text type="body" weight="semibold">
                            {p.headline}
                          </Text>
                          {p.lead ? (
                            <Text type="supporting" size="xsm" maxLines={2}>
                              {p.lead}
                            </Text>
                          ) : null}
                        </Stack>
                      </Stack>
                      <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
                        {p.domainCount ? <Badge variant={p.domainCount === 4 ? "red" : "warning"} label={`${p.domainCount}/4`} /> : null}
                        {p.domains.map((d) => (
                          <DisciplineChip key={d} subject={d} />
                        ))}
                      </Stack>
                    </Stack>
                  }
                >
                  <Stack paddingBlockStart={2}>
                    <Markdown headingLevelStart={4} contentWidth={760}>
                      {p.body}
                    </Markdown>
                  </Stack>
                </Collapsible>
              ))}
            </CollapsibleGroup>
          </Stack>
        </Section>
      ) : null}

      {/* ---------- Everything below is optional deep-dive reference ---------- */}
      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      <Section padding={6} variant="muted">
        <Stack gap={3}>
          <Heading level={3}>The full analysis, section by section</Heading>
          <Text type="supporting">
            Nothing is summarized away — each section below is the verbatim source text from{" "}
            <code>content/synthesis/gap-analysis.md</code>.
          </Text>
          <CollapsibleGroup
            type="multiple"
            hasDividers
            density="compact"
            defaultValue={otherSections
              .filter((s) => OPEN_BY_DEFAULT.some((p) => s.title.startsWith(p)))
              .map((s) => s.title)}
          >
            {otherSections.map((s) => (
              <Collapsible key={s.title} value={s.title} trigger={s.title}>
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={3} contentWidth={760}>
                    {s.body}
                  </Markdown>
                </Stack>
              </Collapsible>
            ))}
            {preamble ? (
              <Collapsible value="__preamble" trigger="Scope, sources & the 2026-08-24 correction">
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={3} contentWidth={760}>
                    {preamble}
                  </Markdown>
                </Stack>
              </Collapsible>
            ) : null}
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
