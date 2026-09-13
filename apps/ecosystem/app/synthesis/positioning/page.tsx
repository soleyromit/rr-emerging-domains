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
import { IconTile } from "@/components/status-pill";
import { VerdictDistributionChart } from "@/components/charts/verdict-distribution-chart";
import { readMarkdownFile, getScorecard, computeWeightedTotals } from "@/lib/content";
import { stripFileCitationsInMarkdown } from "@/lib/strip-file-citations";
import {
  splitSectionsAtLevel,
  getPreamble,
  extractLead,
  type MarkdownSection,
} from "@/lib/markdown-sections";

// Section titles this page surfaces above the fold rather than leaving in the
// deep-dive stack. Matched on prefix so the headings can keep their trailing
// em-dash subtitles ("Verified lead / concede map (rotation lifecycle — …)").
const HEADLINE_SECTION_PREFIX = "The one-sentence version";
const VERDICT_SECTION_PREFIX = "Verified lead / concede map";
const PERSONA_SECTION_PREFIX = "Who's in the room";
const GUARDRAIL_SECTION_PREFIX = "Guardrails";

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
// `lead`/`hold`, so it takes the semantic `error` rather than the non-semantic `red`
// tint it used to carry (which rendered lighter than every other bad-news badge in
// this app and read as a weaker signal than it is).
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

export default function PositioningPage() {
  const content = stripFileCitationsInMarkdown(readMarkdownFile("synthesis/prism-positioning.md"));

  if (!content) {
    return (
      <Section padding={6}>
        <EmptyState
          title="Not yet synthesized"
          description="The positioning brief for this section has not been written yet."
        />
      </Section>
    );
  }

  // ---------- document structure ----------
  const preamble = getPreamble(content);
  const sections = splitSectionsAtLevel(content, 2);
  const headlineSection = sections.find((s) => s.title.startsWith(HEADLINE_SECTION_PREFIX));
  const verdictSection = sections.find((s) => s.title.startsWith(VERDICT_SECTION_PREFIX));
  const personaSection = sections.find((s) => s.title.startsWith(PERSONA_SECTION_PREFIX));
  const guardrailSection = sections.find((s) => s.title.startsWith(GUARDRAIL_SECTION_PREFIX));
  const otherSections = sections.filter((s) => s !== verdictSection);

  const verdicts = verdictSection ? parseVerdictTable(verdictSection.body) : [];
  const leadCount = verdicts.filter((v) => v.tone === "lead").length;
  const holdCount = verdicts.length - leadCount;
  const personaCount = countTableRows(personaSection);
  const guardrailCount = countOrderedItems(guardrailSection);
  // The brief's own one-sentence version, not a restatement of it.
  const headline = headlineSection ? extractLead(headlineSection.body, 1) : "";
  // Intro prose between the `## Verified lead / concede map` heading and the table.
  const verdictIntro = verdictSection ? verdictSection.body.split("\n|")[0].trim() : "";

  // ---------- source-derived numbers (never hand-typed) ----------
  const scorecard = getScorecard();
  const ranked = scorecard
    ? Object.entries(computeWeightedTotals(scorecard)).sort((a, b) => b[1] - a[1])
    : [];
  const [leadDomain, runnerUp] = ranked;
  const gtmTarget = scorecard?.actual_gtm_target;

  return (
    <Stack gap={0}>
      {/* ---------- Bite-sized: headline + the one-sentence version ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Strategy"
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
          <Takeaway title="Sell the evidence ACPE Standards 2025 + PHARMS is about to demand — Pharmacy confirmed first, DO the analytical runner-up">
            {headline ||
              "PRISM is the system of record for clinical/experiential education, and ACPE's Standards 2025 + PHARMS transition ask for exactly the evidence our placement engine already produces."}
          </Takeaway>
        </Stack>
      </Section>

      {/* ---------- Stat row: the brief in 10 seconds ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <MetadataList columns={4}>
          {gtmTarget ? (
            <MetadataListItem label="Confirmed GTM target">{gtmTarget}</MetadataListItem>
          ) : null}
          <MetadataListItem label={gtmTarget ? "Scorecard's analytical leader" : "Lead domain (weighted)"}>
            {leadDomain && runnerUp
              ? `${leadDomain[0]} ${leadDomain[1].toFixed(2)} vs ${runnerUp[0]} ${runnerUp[1].toFixed(2)}`
              : "DO"}
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

      {/* ---------- The scannable core: what to lead with, stage by stage ---------- */}
      {verdicts.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading level={2}>Verified lead / concede map — the rotation lifecycle</Heading>
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

      {/* ---------- Everything below is optional deep-dive reference ---------- */}
      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      <Section padding={6} variant="muted">
        <Stack gap={3}>
          <Heading level={3}>The full brief, section by section</Heading>
          <Text type="supporting">
            Nothing is summarized away — each section below is the verbatim source text from the
            positioning brief behind this page. Re-check any claim against its source file before
            it goes external; this brief is a snapshot, not a script.
          </Text>
          <CollapsibleGroup type="multiple" hasDividers density="compact">
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
              <Collapsible value="__preamble" trigger="Scope, sources & how to use this brief">
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
