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
import { readMarkdownFile } from "@/lib/content";
import { splitSectionsAtLevel, getPreamble } from "@/lib/markdown-sections";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "error";

// The ratings the memo's comparison table actually uses in its per-requirement
// columns. "Mixed" is the fallback for a cell that opens with prose instead of a
// rating word, so an unparsed cell degrades to a neutral badge rather than a lie.
const RATINGS = ["Native", "Strong", "Medium", "Weak", "None", "Good"] as const;
type Rating = (typeof RATINGS)[number] | "Mixed";

const RATING_VARIANT: Record<Rating, BadgeVariant> = {
  Native: "success",
  Strong: "success",
  Good: "info",
  Medium: "warning",
  Weak: "error",
  None: "error",
  Mixed: "neutral",
};

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

// Minimal GFM pipe-table reader. Only used on the memo's one table, whose cells
// contain links and bold but never an escaped pipe.
function parsePipeTable(md: string): ParsedTable {
  const lines = md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 2) return { headers: [], rows: [] };

  const cells = (line: string) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  return {
    headers: cells(lines[0]),
    rows: lines.slice(1).filter((l) => !/^\|[\s:|-]+$/.test(l)).map(cells),
  };
}

// "**Strong** — highlights cite back to source clips", "None natively",
// "Strong *if disciplined* — every note can carry a `source:` field" all resolve.
// "No native sync; would need a plugin…" is the one cell that spells None as "No".
function readRating(cell: string): Rating {
  const flat = (cell ?? "").replace(/[*_`]/g, "").trim();
  const match = RATINGS.find((r) => new RegExp(`^${r}\\b`, "i").test(flat));
  if (match) return match;
  return /^no\b/i.test(flat) ? "None" : "Mixed";
}

function columnIndex(headers: string[], needle: string): number {
  return headers.findIndex((h) => h.toLowerCase().includes(needle));
}

interface ToolRow {
  name: string;
  bestAt: string;
  citability: Rating;
  versionControl: Rating;
  obsidianSync: Rating;
  isDiy: boolean;
  /** Every cell of this row, verbatim, relabeled with its column header. */
  body: string;
}

function parseToolRow(headers: string[], row: string[], idx: Record<string, number>): ToolRow {
  const cell = (i: number) => (i >= 0 ? (row[i] ?? "") : "");
  const name = cell(idx.tool).replace(/\*\*/g, "").trim();

  return {
    name,
    bestAt: cell(idx.bestAt).replace(/[*`]/g, "").trim(),
    citability: readRating(cell(idx.citability)),
    versionControl: readRating(cell(idx.versionControl)),
    obsidianSync: readRating(cell(idx.obsidian)),
    isDiy: /diy/i.test(name),
    body: headers
      .map((h, i) => (i === idx.tool ? null : `**${h}** — ${row[i] ?? ""}`))
      .filter(Boolean)
      .join("\n\n"),
  };
}

export default function RepoComparisonPage() {
  const content = readMarkdownFile("enterprise-repo/tool-comparison.md");

  if (!content) {
    return (
      <Section padding={6}>
        <EmptyState
          title="Not yet researched"
          description="content/enterprise-repo/tool-comparison.md has not been written."
        />
      </Section>
    );
  }

  // ---------- document structure ----------
  const preamble = getPreamble(content);
  const sections = splitSectionsAtLevel(content, 2);
  const tableSection = sections.find((s) => s.title.toLowerCase().includes("comparison table"));
  const requirementsSection = sections.find((s) => s.title.toLowerCase().includes("requirements"));
  const sourcesSection = sections.find((s) => s.title.toLowerCase() === "sources");

  // ---------- source-derived numbers (never hand-typed) ----------
  const table = tableSection ? parsePipeTable(tableSection.body) : { headers: [], rows: [] };
  const idx = {
    tool: columnIndex(table.headers, "tool"),
    bestAt: columnIndex(table.headers, "best at"),
    citability: columnIndex(table.headers, "citability"),
    versionControl: columnIndex(table.headers, "version control"),
    obsidian: columnIndex(table.headers, "obsidian"),
  };
  const tools = table.rows.map((row) => parseToolRow(table.headers, row, idx));

  const hostedCount = tools.filter((t) => !t.isDiy).length;
  const diyCount = tools.filter((t) => t.isDiy).length;
  const gitGrade = tools.filter((t) => t.versionControl === "Strong").length;
  const nativeSync = tools.filter((t) => t.obsidianSync === "Native").length;
  const strongCitability = tools.filter((t) => t.citability === "Strong").length;
  // Options clearing both of the requirements the table rates hardest.
  const versionedAndSynced = tools.filter(
    (t) => t.versionControl === "Strong" && t.obsidianSync === "Native"
  ).length;

  const requirementCount = requirementsSection
    ? requirementsSection.body.split("\n").filter((l) => /^\d+\.\s/.test(l)).length
    : 0;
  const sourceCount = sourcesSection
    ? sourcesSection.body.split("\n").filter((l) => l.trim().startsWith("- [")).length
    : 0;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <Stack gap={0}>
      {/* ---------- Bite-sized: headline + one takeaway ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Strategy"
            title={`${tools.length} repository tools, ${requirementCount} hard requirements, 1 decision: a git repo of Markdown/YAML`}
            description="Scan the requirement scorecard below; the full decision memo — every option, every price, every source — is still here, one click down."
            endContent={
              <IconTile variant="success">
                <Icon icon="arrowsUpDown" size="lg" />
              </IconTile>
            }
          />
          <Takeaway
            status="success"
            title="No hosted repository tool clears all four requirements, and the one DIY setup that nearly does fails on the second person"
          >
            Of the {tools.length} options compared, exactly {versionedAndSynced} (Obsidian + git) has both git-grade version
            control and native Obsidian sync — and that one pushes merge conflicts and commit hygiene onto a
            non-engineer. The decision is Obsidian+git with precisely that weakness removed: structured Markdown/YAML
            in <code>rr-emerging-domains/content</code>, where citation is enforced as schema rather than habit, every
            edit is a diffable and revertable commit, <code>content/</code> doubles as the live Obsidian vault, and a
            small internal Next.js app gives the non-technical collaborator readable pages instead of a terminal. The
            honest trade-off, stated in the memo: Dovetail&rsquo;s AI tagging, highlight reels, and
            &ldquo;Ask Dovetail&rdquo; search really are more polished — better tool, different job, and
            ~$150&ndash;200+/mo for a small cross-functional group.
          </Takeaway>
        </Stack>
      </Section>

      {/* ---------- Stat row: the whole memo in 10 seconds ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <MetadataList columns={3}>
          <MetadataListItem label="Options compared">
            {tools.length} ({hostedCount} hosted SaaS, {diyCount} DIY)
          </MetadataListItem>
          <MetadataListItem label="Hard requirements">
            {requirementCount} non-negotiable, all four must hold
          </MetadataListItem>
          <MetadataListItem label="Strong citability">
            {strongCitability} of {tools.length}
          </MetadataListItem>
          <MetadataListItem label="Git-grade version control">
            {gitGrade} of {tools.length}
          </MetadataListItem>
          <MetadataListItem label="Native Obsidian sync">
            {nativeSync} of {tools.length}
          </MetadataListItem>
          <MetadataListItem label="Memo length">
            {wordCount.toLocaleString()} words · {sections.length} sections · {sourceCount} cited sources
          </MetadataListItem>
        </MetadataList>
      </Section>

      {/* ---------- The scannable core: one row per tool, verdict on open ---------- */}
      {tools.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading level={2}>Tool by tool, against the three testable requirements</Heading>
              <Text type="supporting">
                Badges read straight off the memo&rsquo;s comparison table — citability, version control, and
                Obsidian sync are the three requirements it rates categorically. The fourth (usable by two people with
                very different tool comfort) is prose, and sits inside each row along with pricing and the verdict.
              </Text>
            </Stack>
            <CollapsibleGroup type="single" hasDividers density="compact">
              {tools.map((t) => (
                <Collapsible
                  key={t.name}
                  value={t.name}
                  trigger={
                    <Stack direction="horizontal" hAlign="between" vAlign="start" gap={3} wrap="wrap" width="100%">
                      <Stack gap={0.5}>
                        <Text type="body" weight="semibold">
                          {t.name}
                        </Text>
                        {t.bestAt ? (
                          <Text type="supporting" size="xsm" maxLines={2}>
                            {t.bestAt}
                          </Text>
                        ) : null}
                      </Stack>
                      <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
                        <Badge variant={RATING_VARIANT[t.citability]} label={`Cite: ${t.citability}`} />
                        <Badge variant={RATING_VARIANT[t.versionControl]} label={`Versioning: ${t.versionControl}`} />
                        <Badge variant={RATING_VARIANT[t.obsidianSync]} label={`Obsidian: ${t.obsidianSync}`} />
                      </Stack>
                    </Stack>
                  }
                >
                  <Stack paddingBlockStart={2}>
                    <Markdown headingLevelStart={4} contentWidth={760}>
                      {t.body}
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
          <Heading level={3}>The full memo, section by section</Heading>
          <Text type="supporting">
            Nothing is summarized away — each section below is the verbatim source text from{" "}
            <code>content/enterprise-repo/tool-comparison.md</code>, including the comparison table the scan rows
            above are derived from.
          </Text>
          <CollapsibleGroup type="multiple" hasDividers density="compact">
            {preamble ? (
              <Collapsible value="__preamble" trigger="What this memo decides">
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={3} contentWidth={760}>
                    {preamble}
                  </Markdown>
                </Stack>
              </Collapsible>
            ) : null}
            {sections.map((s) => (
              <Collapsible key={s.title} value={s.title} trigger={s.title}>
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={3} contentWidth={760}>
                    {s.body}
                  </Markdown>
                </Stack>
              </Collapsible>
            ))}
          </CollapsibleGroup>
        </Stack>
      </Section>
    </Stack>
  );
}
