import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { List, ListItem } from "@astryxdesign/core/List";
import { Item } from "@astryxdesign/core/Item";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Link } from "@astryxdesign/core/Link";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import {
  getCapabilityMap,
  listDomains,
  listCompetitors,
  getScorecard,
  computeWeightedTotals,
} from "@/lib/content";

const HORIZONS = [
  {
    label: "H1",
    title: "Deepen current disciplines",
    body: "Nursing + allied health (PT, OT, PA, SLP, athletic training, social work, public health, nutrition) — Prism's proven base today.",
  },
  {
    label: "H2",
    title: "Four new domains",
    body: "DO, Pharmacy, Dentistry, Medicine — larger budgets, higher-stakes accreditation, multi-year student lifecycles. This research initiative.",
  },
  {
    label: "H3",
    title: "AI-native accreditation intelligence",
    body: "Where Prism's own Q3 2027 Accreditation Management pillar should ultimately land — de-risked by H2's standards research.",
  },
];

// 2-month window from kickoff (2026-08-24) to the leadership readout (~2026-10-24).
const TIMELINE = [
  {
    phase: "Week 1 — Foundation",
    dates: "Aug 24–30",
    status: "complete" as const,
    detail: "Repo + vault + tracker stood up; PRISM capability map grounded in real product docs.",
  },
  {
    phase: "Weeks 2–4 — Secondary research",
    dates: "Aug 31–Sep 20",
    status: "complete" as const,
    detail: "9 competitor teardowns, 4 accreditors mapped at element level, domain profiles, personas, journeys, scorecard — completed ahead of schedule.",
  },
  {
    phase: "Weeks 4–6 — Internal mining",
    dates: "Sep 14–Oct 4",
    status: "upcoming" as const,
    detail: "CS / AM / leadership interviews + Zendesk mining, to validate the secondary-research hypotheses against real institutional voice. Needs Romit's access.",
  },
  {
    phase: "Weeks 6–7 — Synthesis + GTM alignment",
    dates: "Oct 5–18",
    status: "upcoming" as const,
    detail: "Beachhead memo, PR/FAQ per domain, vocabulary rollout plan with Ruchi — revised using interview evidence.",
  },
  {
    phase: "Week 8 — Leadership readout",
    dates: "Oct 19–24",
    status: "upcoming" as const,
    detail: "Beachhead recommendation + draft product/GTM plan to leadership and the product team.",
  },
];

export default function OverviewPage() {
  const capMap = getCapabilityMap();
  const domains = listDomains();
  const competitors = listCompetitors();
  const scorecard = getScorecard();
  const totals = scorecard ? computeWeightedTotals(scorecard) : null;
  const leader = totals ? Object.entries(totals).sort((a, b) => b[1] - a[1])[0] : null;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={6}>
          <PageHeader
            eyebrow="Leadership layer — read this section first"
            title="Start with DO — the fastest-growing market and the toughest accreditation build in the portfolio"
            description="Prism today is the system of record for clinical and experiential education in nursing and allied health. Four adjacent doctoral-level domains run the same workflow — didactic → clinical rotations → competency verification → accreditation reporting — served today by aging, fragmented incumbents. This site is the cited evidence base behind that recommendation: every claim traces to a competitor page, an accreditor's own standards document, or a primary Exxat product doc."
          />

          <Takeaway status="warning" title="The market case and the accreditation-fit case point in opposite directions">
            DO wins the where-to-play score (4.40 / 5) on growth (40,905 students, an all-time high, +59% over a decade)
            and incumbent disruption (three of six DO/MD vendors are mid-acquisition right now). But COCA is the{" "}
            <strong>worst</strong> accreditation fit of the four accreditors researched — zero of 12 mapped elements
            transfer as-is, and seven are hard gaps, mostly threshold-triggered public reporting (COMLEX pass rates,
            PGY-1 placement) with no analog anywhere else in the corpus. See the{" "}
            <Link href="/scorecard" hasUnderline>scorecard</Link> and{" "}
            <Link href="/synthesis/gap-analysis" hasUnderline>gap analysis</Link> for the full evidence.
          </Takeaway>

          <Grid columns={{ minWidth: 260 }} gap={4}>
            {HORIZONS.map((h) => (
              <Card key={h.label}>
                <Stack gap={2}>
                  <Badge variant="neutral" label={h.label} />
                  <Text type="body" weight="semibold">
                    {h.title}
                  </Text>
                  {/* DENSITY-OK: h.body is a short hardcoded HORIZONS const above, not a content/ field */}
                  <Text type="supporting">{h.body}</Text>
                </Stack>
              </Card>
            ))}
          </Grid>

          <MetadataList columns={4}>
            <MetadataListItem label="Domains in scope">DO · Pharmacy · Dentistry · Medicine</MetadataListItem>
            <MetadataListItem label="Domain profiles researched">{domains.length} / 4</MetadataListItem>
            <MetadataListItem label="Competitors torn down">{competitors.length}</MetadataListItem>
            <MetadataListItem label="Leading beachhead candidate">
              {leader ? `${leader[0]} — ${leader[1].toFixed(2)} / 5` : "Not yet scored"}
            </MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={4}>
          <Stack gap={1}>
            <Heading level={2}>Timeline — 2 months, kickoff to readout</Heading>
            <Text type="supporting">Aug 24 → Oct 24, 2026. Research is running ahead of schedule; interviews are the critical path now.</Text>
          </Stack>
          <List hasDividers>
            {TIMELINE.map((t) => (
              <ListItem
                key={t.phase}
                startContent={
                  <StatusDot
                    variant={t.status === "complete" ? "success" : "neutral"}
                    label={t.status === "complete" ? "Complete" : "Upcoming"}
                  />
                }
                label={t.phase}
                description={t.detail}
                endContent={
                  <Stack gap={1} align="end">
                    <Badge variant={t.status === "complete" ? "success" : "neutral"} label={t.status === "complete" ? "Done" : "Upcoming"} />
                    <Text type="supporting" size="2xs">
                      {t.dates}
                    </Text>
                  </Stack>
                }
              />
            ))}
          </List>
        </Stack>
      </Section>

      {capMap ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={2}>
            <Heading level={2}>Where this stands on Prism&apos;s own roadmap</Heading>
            <Text type="supporting">
              From {capMap.product}&apos;s public capability map — see the full PRISM capability map for detail.
            </Text>
            <List hasDividers>
              {capMap.core_ring.pillars
                .filter((p) => p.status === "roadmap")
                .map((p) => (
                  <Item
                    key={p.name}
                    label={p.name}
                    description={`Targeted ${p.target}. ${p.why_it_matters ?? ""}`}
                    endContent={<Badge variant="info" label="Roadmap" />}
                  />
                ))}
            </List>
          </Stack>
        </Section>
      ) : null}

      <Section padding={6}>
        <Stack gap={4}>
          <Heading level={2}>Explore the research</Heading>
          <Grid columns={{ minWidth: 260 }} gap={4}>
            <NavCard href="/prism" title="PRISM capability map" desc="What Prism is today, and what's on its own roadmap." />
            <NavCard href="/feature-map" title="Feature map" desc="Every pillar × domain — who leads, and the whitespace nobody's built yet." />
            <NavCard href="/competitors" title="Competitor matrix" desc="Incumbents per domain, feature-level teardown vs. Prism." />
            <NavCard href="/domains" title="Domains" desc="One hub per discipline — accreditor structure, standards, competitors, and persona." />
            <NavCard href="/roles" title="Roles" desc="Cross-cutting roles — top tasks, pains, and how each competitor implicitly serves them." />
            <NavCard href="/journeys" title="Journeys" desc="Current-state vs. gap-state, across the 4 domains." />
            <NavCard href="/scorecard" title="Where-to-play scorecard" desc="Which domain to enter first, and why." />
          </Grid>
        </Stack>
      </Section>
    </Stack>
  );
}

function NavCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <ClickableCard href={href} label={title}>
      <Stack gap={1.5}>
        <Text type="body" weight="semibold">
          {title}
        </Text>
        <Text type="supporting">{desc}</Text>
      </Stack>
    </ClickableCard>
  );
}
