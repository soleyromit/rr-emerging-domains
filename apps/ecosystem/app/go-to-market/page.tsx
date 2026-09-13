import type { ReactNode } from "react";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { DisciplineChip } from "@/components/discipline-chip";
import { IconTile } from "@/components/status-pill";
import { ScorecardChart } from "@/components/charts/scorecard-chart";
import { ScorecardMatrix } from "@/components/scorecard-matrix";
import { FitDistributionChart } from "@/components/charts/fit-distribution-chart";
import { VerdictDistributionChart } from "@/components/charts/verdict-distribution-chart";
import {
  readMarkdownFile,
  getScorecard,
  computeWeightedTotals,
  scorecardDomains,
  listDissectionDomains,
  listStandardsCrosswalkDomains,
  getStandardsCrosswalkForDomain,
} from "@/lib/content";
import { stripFileCitations, stripFileCitationsInMarkdown } from "@/lib/strip-file-citations";
import {
  splitSectionsAtLevel,
  getPreamble,
  extractLead,
  type MarkdownSection,
} from "@/lib/markdown-sections";

// ---------------------------------------------------------------------------
// 2026-09-13 IA consolidation. /scorecard, /synthesis/gap-analysis and
// /synthesis/positioning were three sidebar rows with ZERO links between them,
// even though they are three ordered steps of ONE decision: pick the domain ->
// find what the product is missing there -> decide what to say in the room.
//
// They are ANCHORED SECTIONS on one linear page, deliberately NOT route tabs
// like /product, /competitive-landscape and /standards (tasks 1.1-1.3 of this
// same consolidation). Tabs are the right shape for mutually exclusive views of
// one subject; these three are a sequence you read front to back, so each step
// ends with a real next/prev link instead of a tab strip that implies you may
// start anywhere.
// ---------------------------------------------------------------------------

const STEPS = [
  { id: "which-domain", n: 1, label: "Which domain" },
  { id: "whats-missing", n: 2, label: "What is missing" },
  { id: "what-to-say", n: 3, label: "What to say" },
] as const;

/** Keeps an anchored section's own heading clear of the viewport edge on jump. */
const ANCHOR_OFFSET = { scrollMarginTop: "var(--spacing-4, 16px)" } as const;

// The four domains this GTM funnel scopes — the same four the gap-analysis
// synthesis rates in its own §0 table, and a strict subset of the accreditor
// domains /standards' crosswalk covers. Filtered THROUGH
// listStandardsCrosswalkDomains() rather than used directly, so the order
// follows the app's own domain priority and a domain that loses its
// accreditation mapping drops out instead of rendering an empty column.
const EXPANSION_DOMAINS = ["Pharmacy", "DO", "Dentistry", "Medicine"];
const ALL_FOUR_DOMAINS = ["DO", "Pharmacy", "Dentistry", "Medicine"];

const PATTERN_SECTION_PREFIX = "4.";
const EXEC_SUMMARY_SECTION_PREFIX = "1.";
// Deep-dive sections start closed, matching /product and /standards/glossary.
const OPEN_BY_DEFAULT: string[] = [];

// Section titles the positioning step surfaces above the fold rather than
// leaving in the deep-dive stack. Matched on prefix so the headings can keep
// their trailing em-dash subtitles.
const HEADLINE_SECTION_PREFIX = "The one-sentence version";
const VERDICT_SECTION_PREFIX = "Verified lead / concede map";
const PERSONA_SECTION_PREFIX = "Who's in the room";
const GUARDRAIL_SECTION_PREFIX = "Guardrails";

// ---------------------------------------------------------------------------
// Shared step chrome
// ---------------------------------------------------------------------------

/**
 * A step's own header. Deliberately NOT `PageHeader`: that renders an `<h1>`,
 * and this page has one of those (the funnel title) with three `<h2>` steps
 * under it. Every heading that was an `<h2>` on the three source pages is an
 * `<h3>` here for the same reason.
 */
function StepHeader({
  step,
  title,
  description,
  endContent,
}: {
  step: (typeof STEPS)[number];
  title: string;
  description?: ReactNode;
  endContent?: ReactNode;
}) {
  return (
    <Stack direction="horizontal" hAlign="between" gap={4} wrap="wrap">
      <Stack gap={1.5} maxWidth={720}>
        <Text type="label" color="secondary" weight="semibold">
          Step {step.n} of {STEPS.length} — {step.label}
        </Text>
        <Heading level={2}>{title}</Heading>
        {description ? (
          <Text type="body" color="secondary">
            {description}
          </Text>
        ) : null}
      </Stack>
      {endContent}
    </Stack>
  );
}

/** The real next/prev links the three source pages never had between them. */
function StepNav({ index }: { index: number }) {
  const prev = STEPS[index - 1];
  const next = STEPS[index + 1];
  return (
    <Stack
      direction="horizontal"
      hAlign={prev && next ? "between" : prev ? "start" : "end"}
      gap={3}
      wrap="wrap"
      width="100%"
    >
      {prev ? (
        <Link href={`#${prev.id}`} color="accent" hasUnderline>
          ← Back to step {prev.n}: {prev.label}
        </Link>
      ) : null}
      {next ? (
        <Link href={`#${next.id}`} color="accent" hasUnderline>
          Next — step {next.n}: {next.label} →
        </Link>
      ) : null}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Step 2 parsing helpers (were app/synthesis/gap-analysis/page.tsx's)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Step 3 parsing helpers (were app/synthesis/positioning/page.tsx's)
// ---------------------------------------------------------------------------

type VerdictTone = "lead" | "hold" | "behind";

interface StageVerdict {
  /** "3. Compliance clearance gate" with the bold markers stripped. */
  stage: string;
  /** The verdict cell, e.g. `Lead (upgraded from "conditional")`. */
  verdict: string;
  tone: VerdictTone;
  /** "What changed after element-level verification" cell, verbatim markdown. */
  whatChanged: string;
  /** "Lead line" cell, verbatim markdown. */
  leadLine: string;
}

// Semantic variants only — `behind` is bad news on the same three-state scale as
// `lead`/`hold`, so it takes the semantic `error` rather than a non-semantic tint.
const BADGE_BY_TONE: Record<VerdictTone, "success" | "warning" | "error"> = {
  lead: "success",
  hold: "warning",
  behind: "error",
};

function stripInline(cell: string): string {
  return cell.replace(/\*\*/g, "").trim();
}

// A verdict is a "lead" only when the cell literally starts with Lead — the
// upgraded-from-conditional row still leads, the redirect/roadmap rows do not.
function classify(verdict: string): VerdictTone {
  const v = verdict.toLowerCase();
  if (v.startsWith("lead")) return "lead";
  if (v.startsWith("behind") || v.startsWith("do not claim")) return "behind";
  return "hold";
}

// Rows of the 4-column verdict table. Split on `|` rather than a table parser:
// no cell in this document contains a pipe, and a row that ever grows one would
// simply drop out of the list instead of rendering garbage.
function parseVerdictTable(body: string): StageVerdict[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && !/^\|[\s|:-]+\|$/.test(l))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((cells) => cells.length === 4 && !/^stage$/i.test(stripInline(cells[0])))
    .map((cells) => {
      const verdict = stripInline(cells[1]);
      return {
        stage: stripInline(cells[0]),
        verdict,
        tone: classify(verdict),
        whatChanged: cells[2],
        leadLine: cells[3],
      };
    });
}

/** Count of body rows in the first markdown table of a section. */
function countTableRows(section?: MarkdownSection): number {
  if (!section) return 0;
  return section.body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && !/^\|[\s|:-]+\|$/.test(l))
    .filter((l, i) => i > 0).length; // drop the header row
}

/** Count of top-level `1.` / `2.` … items in a section body. */
function countOrderedItems(section?: MarkdownSection): number {
  if (!section) return 0;
  return section.body.split("\n").filter((l) => /^\d+\.\s/.test(l)).length;
}

// ---------------------------------------------------------------------------

export default function GoToMarketPage() {
  // ===================== Step 1 — which domain =====================
  const scorecard = getScorecard();
  // Single source of truth for step 1's domain list — the table and the
  // placeholder check both read it, so neither can drift from the data.
  const scoredDomains = scorecard ? scorecardDomains(scorecard) : [];
  const totals = scorecard ? computeWeightedTotals(scorecard, scoredDomains) : null;
  const isPlaceholder =
    !!scorecard && scorecard.criteria.every((c) => scoredDomains.every((d) => (c.scores?.[d] ?? 0) === 0));
  // Derived, not assumed: all four scored domains happen to have a dissection
  // manifest today, but a fifth column could be added to where-to-play.yaml
  // tomorrow and its header must not link to a map that does not exist.
  const dissectedSlugs = listDissectionDomains().map((d) => d.slug);
  const ranked = totals ? Object.entries(totals).sort((a, b) => b[1] - a[1]) : [];
  const [leadDomain, runnerUp] = ranked;
  const gtmTarget = scorecard?.actual_gtm_target;

  // ===================== Step 2 — what is missing =====================
  //
  // DATA SOURCE, verified 2026-09-13 against both call paths:
  // the standards numbers below come from the SAME live accreditation data the
  // Coverage map at /standards reads — getStandardsCrosswalkForDomain()'s `rows`
  // ARE `content/accreditation/<slug>.yaml`'s `standards[]`, carrying the same
  // `prism_fit` field. Reading them through the crosswalk getter (rather than
  // through listAccreditation(), as the old /synthesis/gap-analysis page did)
  // changes no number; it makes the shared provenance structural, so the two
  // surfaces cannot drift apart later.
  //
  // What is NOT live: the platform-pattern synthesis and the five headline gap
  // themes are hand-authored prose sections of the synthesis document. They
  // have no equivalent in the crosswalk rows and are labelled as hand-authored
  // wherever they are rendered, rather than sitting unmarked beside the
  // computed counts.
  const crosswalkDomainCount = listStandardsCrosswalkDomains().length;
  const expansion = listStandardsCrosswalkDomains()
    .filter((d) => EXPANSION_DOMAINS.includes(d))
    .map((d) => getStandardsCrosswalkForDomain(d))
    .filter((d): d is NonNullable<typeof d> => d != null);
  const standards = expansion.flatMap((d) => d.rows);
  const fitCounts = standards.reduce<Record<string, number>>((acc, s) => {
    const k = normalizeFit(s.prism_fit);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const perAccreditor = expansion.map((d) => ({
    domain: d.domain,
    accreditor: d.accreditor.split("(")[0].trim(),
    total: d.rows.length,
    gaps: d.rows.filter((s) => normalizeFit(s.prism_fit) === "Gap").length,
    transfer: d.rows.filter((s) => normalizeFit(s.prism_fit) === "Transfer").length,
  }));
  // Heaviest build in the set, by share of elements rated Gap.
  const worst = [...perAccreditor].sort((a, b) => b.gaps / b.total - a.gaps / a.total)[0];
  const zeroTransfer = perAccreditor.filter((a) => a.transfer === 0);

  const gapContent = stripFileCitationsInMarkdown(readMarkdownFile("synthesis/gap-analysis.md"));
  const gapPreamble = gapContent ? getPreamble(gapContent) : "";
  const gapSections = gapContent ? splitSectionsAtLevel(gapContent, 2) : [];
  const patternSection = gapSections.find((s) => s.title.startsWith(PATTERN_SECTION_PREFIX));
  const execSummarySection = gapSections.find((s) => s.title.startsWith(EXEC_SUMMARY_SECTION_PREFIX));
  const otherGapSections = gapSections.filter((s) => s !== patternSection);
  const patternSubsections = patternSection ? splitSectionsAtLevel(patternSection.body, 3) : [];
  const patterns = patternSubsections.map(parsePattern);
  const letteredPatterns = patterns.filter((p) => p.letter);
  const allFourCount = letteredPatterns.filter((p) => p.domainCount === 4).length;
  // Intro prose between the `## 4.` heading and the first `### Pattern` heading.
  const patternIntro = patternSection ? patternSection.body.split("\n### ")[0].trim() : "";
  // The document's own §1 gap themes — editorial groupings of the element-level
  // Gap ratings, NOT a count of them. Counted from the document's `### Gap N`
  // headings so the figure cannot go stale against the prose it labels.
  const headlineGapThemes = execSummarySection
    ? splitSectionsAtLevel(execSummarySection.body, 3).filter((s) => /^Gap\s+\d/.test(s.title)).length
    : 0;

  // ===================== Step 3 — what to say =====================
  const positioningContent = stripFileCitationsInMarkdown(readMarkdownFile("synthesis/prism-positioning.md"));
  const positioningPreamble = positioningContent ? getPreamble(positioningContent) : "";
  const positioningSections = positioningContent ? splitSectionsAtLevel(positioningContent, 2) : [];
  const headlineSection = positioningSections.find((s) => s.title.startsWith(HEADLINE_SECTION_PREFIX));
  const verdictSection = positioningSections.find((s) => s.title.startsWith(VERDICT_SECTION_PREFIX));
  const personaSection = positioningSections.find((s) => s.title.startsWith(PERSONA_SECTION_PREFIX));
  const guardrailSection = positioningSections.find((s) => s.title.startsWith(GUARDRAIL_SECTION_PREFIX));
  const otherPositioningSections = positioningSections.filter((s) => s !== verdictSection);
  const verdicts = verdictSection ? parseVerdictTable(verdictSection.body) : [];
  const leadCount = verdicts.filter((v) => v.tone === "lead").length;
  const holdCount = verdicts.length - leadCount;
  const personaCount = countTableRows(personaSection);
  const guardrailCount = countOrderedItems(guardrailSection);
  // The brief's own one-sentence version, not a restatement of it.
  const headline = headlineSection ? extractLead(headlineSection.body, 1) : "";
  // Intro prose between the `## Verified lead / concede map` heading and the table.
  const verdictIntro = verdictSection ? verdictSection.body.split("\n|")[0].trim() : "";

  return (
    <Stack gap={0}>
      {/* ================= The funnel, and how to read it ================= */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            // Was "Strategy" — the eyebrow names the sidebar group, and this page moved
            // into `Market` when `Strategy` was deleted (2026-09-13 nav consolidation).
            eyebrow="Market"
            title="Go-to-market — which domain, what is missing, what to say"
            description="Three ordered steps of one decision, in the order you should read them. Pick the domain to enter, see what the product is missing once you are in it, then decide what is safe to claim in the room. Each step ends with a link to the next."
          />
          <Stack direction="horizontal" gap={2} wrap="wrap">
            {STEPS.map((s) => (
              <Link key={s.id} href={`#${s.id}`} color="accent" hasUnderline>
                {s.n}. {s.label}
              </Link>
            ))}
          </Stack>
        </Stack>
      </Section>

      {/* ================= STEP 1 — which domain ================= */}
      <Section padding={6} dividers={["bottom"]} id={STEPS[0].id} style={ANCHOR_OFFSET}>
        <Stack gap={5}>
          <StepHeader
            step={STEPS[0]}
            title={
              scorecard?.actual_gtm_target
                ? `${scorecard.actual_gtm_target} is the confirmed first domain to enter`
                : scorecard?.recommended_beachhead
                  ? `${scorecard.recommended_beachhead} is the recommended beachhead`
                  : "Where-to-play scorecard"
            }
            description={
              <>
                Borrowed from Lafley &amp; Martin&apos;s <em>Playing to Win</em> — score each domain, don&apos;t
                just list them. Weights sum to 100%.
              </>
            }
          />
          {!scorecard ? (
            <EmptyState title="No scorecard found" description="content/scorecard/where-to-play.yaml has not been written." />
          ) : isPlaceholder ? (
            <Banner status="warning" title="Scores are still placeholders" description="This view will fill in once the synthesis pass completes." />
          ) : (
            <Stack gap={3}>
              {scorecard.actual_gtm_target ? (
                <Card variant="blue">
                  <Stack gap={2}>
                    <Text type="label" color="secondary">
                      Confirmed GTM target{scorecard.actual_gtm_target_decided ? ` — ${scorecard.actual_gtm_target_decided}` : ""}
                    </Text>
                    <Text type="body" maxLines={6}>
                      {stripFileCitations(scorecard.actual_gtm_target_rationale)}
                    </Text>
                  </Stack>
                </Card>
              ) : null}
              {scorecard.recommended_beachhead ? (
                <Card variant="pink">
                  <Stack gap={2}>
                    <Text type="label" color="secondary">
                      {scorecard.actual_gtm_target ? "What the scorecard's own math says wins" : "Why it wins"}
                    </Text>
                    <Text type="body" maxLines={3}>
                      {stripFileCitations(scorecard.rationale)}
                    </Text>
                  </Stack>
                </Card>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Section>

      {scorecard ? (
        <>
          <Section padding={6} dividers={["bottom"]}>
            <Stack gap={3}>
              <Heading level={3}>Weighted scorecard</Heading>
              <ScorecardChart scorecard={scorecard} totals={totals ?? {}} />
            </Stack>
          </Section>

          <Section padding={6} dividers={["bottom"]}>
            <Stack gap={3}>
              <Stack gap={1}>
                <Heading level={3}>Scoring detail</Heading>
                <Text type="supporting">
                  1–5 per criterion per domain, with rationale. Click any score for the weight math and
                  every domain&apos;s rationale on that criterion.
                </Text>
              </Stack>
              <ScorecardMatrix criteria={scorecard.criteria} domains={scoredDomains} dissectedSlugs={dissectedSlugs} />
            </Stack>
          </Section>
        </>
      ) : null}

      <Section padding={6} dividers={["bottom"]} variant="muted">
        <StepNav index={0} />
      </Section>

      {/* ================= STEP 2 — what is missing ================= */}
      <Section padding={6} dividers={["bottom"]} id={STEPS[1].id} style={ANCHOR_OFFSET}>
        <Stack gap={5}>
          <StepHeader
            step={STEPS[1]}
            title={`${standards.length} accreditation elements rated, ${fitCounts.Gap ?? 0} of them hard gaps`}
            description="The same accreditation data the standards coverage map runs on, narrowed to the four expansion domains. Scan the counts and the platform patterns below; every section of the underlying analysis is still here, one click down."
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
            {fitCounts.Gap ?? 0} of {standards.length} researched accreditation elements are hard Gaps, and they
            clump into just three buckets: standards-to-evidence mapping, external outcome-data ingestion, and
            closed-loop CQI — all three the job description of the unshipped Accreditation Management pillar
            (Q3 2027). The twist is the market read: DO is the most attractive domain and the heaviest build,
            because {zeroTransfer.length === 1 ? `${zeroTransfer[0].accreditor} is` : "COCA is"} the only accreditor
            in the set with zero elements rated Transfer, and carries the highest share of Gaps of the four
            ({worst ? `${worst.gaps} of ${worst.total}` : "5 of 12"}).
          </Takeaway>
          {/* The honest-provenance line the two surfaces used to lack. Counts
              above/left are computed live; the pattern and theme counts beside
              them are read out of a hand-authored document, and say so. */}
          <Banner
            status="info"
            title="Where these numbers come from"
            description={`Element, fit and gap counts are computed live from the same accreditation data the standards coverage map reads — this is the ${expansion.length}-domain slice of a crosswalk that covers ${crosswalkDomainCount}. The platform-pattern synthesis and the ${headlineGapThemes} headline gap themes below are hand-authored prose from the gap-analysis document and have no computed equivalent.`}
          />
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <MetadataList columns={4}>
            <MetadataListItem label="Elements rated (live)">
              {standards.length} across {expansion.length} accreditors
            </MetadataListItem>
            <MetadataListItem label="Transfer / Configure / Gap (live)">
              {fitCounts.Transfer ?? 0} · {fitCounts.Configure ?? 0} · {fitCounts.Gap ?? 0}
            </MetadataListItem>
            <MetadataListItem label="Platform-level patterns (hand-authored)">
              {letteredPatterns.length} (A–{letteredPatterns[letteredPatterns.length - 1]?.letter ?? "J"})
            </MetadataListItem>
            <MetadataListItem label="Patterns hitting all 4 domains (hand-authored)">
              {allFourCount} of {letteredPatterns.length}
            </MetadataListItem>
          </MetadataList>
          <Stack gap={3}>
            <Heading level={3}>Prism fit distribution, by accreditor</Heading>
            <Text type="supporting">
              Counts derived from the <code>prism_fit</code> field on every {" "}
              {perAccreditor.map((a) => a.accreditor).join(", ")} element — the same rows the{" "}
              <Link href="/standards" hasUnderline>standards coverage map</Link> renders, so the two pages cannot
              disagree.
            </Text>
            <FitDistributionChart
              docs={expansion.map((d) => ({ accreditor: d.accreditor, domain: d.domain, standards: d.rows }))}
            />
          </Stack>
        </Stack>
      </Section>

      {patterns.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading level={3}>Cross-domain patterns — fund these once, at the platform layer</Heading>
              <Text type="supporting" size="xsm">
                Hand-authored synthesis, not a computed rollup: these are the gap-analysis document&apos;s own §4
                sections, counted from its headings.
              </Text>
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

      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      <Section padding={6} dividers={["bottom"]} variant="muted">
        <Stack gap={3}>
          <Heading level={3}>The full gap analysis, section by section</Heading>
          {gapContent ? (
            <>
              <Text type="supporting">
                Nothing is summarized away — each section below is the verbatim source text from{" "}
                <code>content/synthesis/gap-analysis.md</code>. This is the hand-authored half of this step; the
                counts above it are computed.
              </Text>
              <CollapsibleGroup
                type="multiple"
                hasDividers
                density="compact"
                defaultValue={otherGapSections
                  .filter((s) => OPEN_BY_DEFAULT.some((p) => s.title.startsWith(p)))
                  .map((s) => s.title)}
              >
                {otherGapSections.map((s) => (
                  <Collapsible key={s.title} value={s.title} trigger={s.title}>
                    <Stack paddingBlockStart={2}>
                      <Markdown headingLevelStart={4} contentWidth={760}>
                        {s.body}
                      </Markdown>
                    </Stack>
                  </Collapsible>
                ))}
                {gapPreamble ? (
                  <Collapsible value="__gap-preamble" trigger="Scope, sources & the 2026-08-24 correction">
                    <Stack paddingBlockStart={2}>
                      <Markdown headingLevelStart={4} contentWidth={760}>
                        {gapPreamble}
                      </Markdown>
                    </Stack>
                  </Collapsible>
                ) : null}
              </CollapsibleGroup>
            </>
          ) : (
            <EmptyState title="Not yet synthesized" description="content/synthesis/gap-analysis.md has not been written." />
          )}
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]} variant="muted">
        <StepNav index={1} />
      </Section>

      {/* ================= STEP 3 — what to say ================= */}
      <Section padding={6} dividers={["bottom"]} id={STEPS[2].id} style={ANCHOR_OFFSET}>
        <Stack gap={5}>
          <StepHeader
            step={STEPS[2]}
            title={
              gtmTarget
                ? `${gtmTarget} is confirmed first in market, and ${leadCount} of ${verdicts.length} rotation stages are safe to claim in the room`
                : leadDomain
                  ? `${leadDomain[0]} leads at ${leadDomain[1].toFixed(2)}, and ${leadCount} of ${verdicts.length} rotation stages are safe to claim in the room`
                  : `${leadCount} of ${verdicts.length} rotation stages are safe to claim in the room`
            }
            description="A positioning brief, not a research document: what to lead with, what to concede, and the guardrails underneath every claim. Each verdict is verified against an element-level flow file, not a pillar description."
            endContent={
              <IconTile variant="success">
                <Icon icon="arrowUp" size="lg" />
              </IconTile>
            }
          />
          {positioningContent ? (
            <Takeaway title="Sell the evidence ACPE Standards 2025 + PHARMS is about to demand — Pharmacy confirmed first, DO the analytical runner-up">
              {headline ||
                "PRISM is the system of record for clinical/experiential education, and ACPE's Standards 2025 + PHARMS transition ask for exactly the evidence our placement engine already produces."}
            </Takeaway>
          ) : (
            <EmptyState
              title="Not yet synthesized"
              description="The positioning brief for this section has not been written yet."
            />
          )}
        </Stack>
      </Section>

      {positioningContent ? (
        <>
          <Section padding={6} dividers={["bottom"]}>
            <MetadataList columns={4}>
              {gtmTarget ? (
                <MetadataListItem label="Confirmed GTM target">{gtmTarget}</MetadataListItem>
              ) : null}
              <MetadataListItem label={gtmTarget ? "Scorecard's analytical leader" : "Lead domain (weighted)"}>
                {leadDomain && runnerUp ? (
                  <>
                    {`${leadDomain[0]} ${leadDomain[1].toFixed(2)} vs ${runnerUp[0]} ${runnerUp[1].toFixed(2)}`}{" "}
                    <Link href={`#${STEPS[0].id}`} hasUnderline>
                      step 1
                    </Link>
                  </>
                ) : (
                  "DO"
                )}
              </MetadataListItem>
              <MetadataListItem label="Lead / hold back">
                {leadCount} of {verdicts.length} stages lead · {holdCount} do not
              </MetadataListItem>
              <MetadataListItem label="Personas in the room">{personaCount}</MetadataListItem>
              <MetadataListItem label="Non-negotiable guardrails">{guardrailCount}</MetadataListItem>
            </MetadataList>
          </Section>

          {verdicts.length ? (
            <Section padding={6} dividers={["bottom"]}>
              <VerdictDistributionChart rows={verdicts.map((v) => ({ stage: v.stage, tone: v.tone }))} />
            </Section>
          ) : null}

          {verdicts.length ? (
            <Section padding={6} dividers={["bottom"]}>
              <Stack gap={4}>
                <Stack gap={1}>
                  <Heading level={3}>Verified lead / concede map — the rotation lifecycle</Heading>
                  {verdictIntro ? <Text type="supporting">{verdictIntro}</Text> : null}
                </Stack>
                <CollapsibleGroup type="single" hasDividers density="compact">
                  {verdicts.map((v) => (
                    <Collapsible
                      key={v.stage}
                      value={v.stage}
                      trigger={
                        <Stack
                          direction="horizontal"
                          hAlign="between"
                          vAlign="start"
                          gap={3}
                          wrap="wrap"
                          width="100%"
                        >
                          <Text type="body" weight="semibold">
                            {v.stage}
                          </Text>
                          <Badge variant={BADGE_BY_TONE[v.tone]} label={v.verdict} />
                        </Stack>
                      }
                    >
                      <Stack gap={3} paddingBlockStart={2}>
                        <Stack gap={1}>
                          <Text type="label">What changed after element-level verification</Text>
                          <Markdown headingLevelStart={4} contentWidth={760}>
                            {v.whatChanged}
                          </Markdown>
                        </Stack>
                        <Stack gap={1}>
                          <Text type="label">Lead line</Text>
                          <Markdown headingLevelStart={4} contentWidth={760}>
                            {v.leadLine}
                          </Markdown>
                        </Stack>
                      </Stack>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Stack>
            </Section>
          ) : null}

          <Section padding={6} variant="muted">
            <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
          </Section>

          <Section padding={6} dividers={["bottom"]} variant="muted">
            <Stack gap={3}>
              <Heading level={3}>The full brief, section by section</Heading>
              <Text type="supporting">
                Nothing is summarized away — each section below is the verbatim source text from the
                positioning brief behind this page. Re-check any claim against its source file before
                it goes external; this brief is a snapshot, not a script.
              </Text>
              <CollapsibleGroup type="multiple" hasDividers density="compact">
                {otherPositioningSections.map((s) => (
                  <Collapsible key={s.title} value={s.title} trigger={s.title}>
                    <Stack paddingBlockStart={2}>
                      <Markdown headingLevelStart={4} contentWidth={760}>
                        {s.body}
                      </Markdown>
                    </Stack>
                  </Collapsible>
                ))}
                {positioningPreamble ? (
                  <Collapsible value="__positioning-preamble" trigger="Scope, sources & how to use this brief">
                    <Stack paddingBlockStart={2}>
                      <Markdown headingLevelStart={4} contentWidth={760}>
                        {positioningPreamble}
                      </Markdown>
                    </Stack>
                  </Collapsible>
                ) : null}
              </CollapsibleGroup>
            </Stack>
          </Section>
        </>
      ) : null}

      <Section padding={6} variant="muted">
        <StepNav index={2} />
      </Section>
    </Stack>
  );
}
