import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "@astryxdesign/core/Icon";
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
  getAccreditationForDomain,
  accreditorShortName,
  fitCounts,
} from "@/lib/content";

// "H1/H2/H3" was internal shorthand leaking straight onto the page as a badge
// label — meaningless to a reader who wasn't in the planning doc it came
// from. These three are a real sequence (today's base -> the active research
// -> where the roadmap ultimately lands), so they're named and rendered as
// one now, chevron-chained like every other causal/sequential content shape
// in this app (see DESIGN.md).
const HORIZONS = [
  {
    phase: "Today",
    title: "Deepen current disciplines",
    body: "Nursing + allied health (PT, OT, PA, SLP, athletic training, social work, public health, nutrition) — Prism's proven base today.",
  },
  {
    phase: "This research",
    title: "Four new domains",
    body: "DO, Pharmacy, Dentistry, Medicine — larger budgets, higher-stakes accreditation, multi-year student lifecycles. This research initiative.",
  },
  {
    phase: "Where it lands",
    title: "AI-native accreditation intelligence",
    body: "Where Prism's own Q3 2027 Accreditation Management pillar should ultimately land — de-risked by the new-domains research.",
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

  // The Takeaway below quotes Pharmacy's pillar-fit split. It used to hard-type
  // "4 Transfer / 12 Configure / 4 Gap" — figures that had gone stale against
  // content/accreditation/acpe.yaml (really 4 / 13 / 3) and survived three
  // rounds of number fixes only because the wrong pair still summed to 20.
  // Derived now, off the same `prism_fit` field and the same exported
  // fitCounts() helper /domains/[slug] and /go-to-market#whats-missing read,
  // so it cannot drift again. Null-guarded: if the ACPE doc ever goes missing
  // the sentence drops the parenthetical rather than printing a stale one.
  const acpeDoc = getAccreditationForDomain("Pharmacy")[0] ?? null;
  const acpeFit = acpeDoc ? fitCounts(acpeDoc) : null;

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={6}>
          <PageHeader
            eyebrow="Leadership layer — read this section first"
            title="Start with Pharmacy — the confirmed first domain to enter"
            description="Prism today is the system of record for clinical and experiential education in nursing and allied health. Four adjacent doctoral-level domains run the same workflow — didactic → clinical rotations → competency verification → accreditation reporting — served today by aging, fragmented incumbents. This site is the cited evidence base behind the research: every claim traces to a competitor page, an accreditor's own standards document, or a primary Exxat product doc."
          />

          <Takeaway status="info" title="Pharmacy is the confirmed GTM target — per stakeholder direction, 2026-09-10">
            The where-to-play scorecard's own math still names DO the analytical leader (4.40 / 5, on growth and
            incumbent disruption) with Pharmacy a close second (4.05 / 5) — that scoring is real and unedited, see the{" "}
            <Link href="/go-to-market#which-domain" hasUnderline>scorecard</Link>. Pharmacy is the domain actually being targeted
            first, for reasons outside that weighted model. The two conclusions aren&apos;t in conflict: Pharmacy
            also has the highest pillar-fit ratio of any domain researched
            {acpeFit && acpeDoc ? (
              <>
                {" "}({acpeFit.Transfer} Transfer / {acpeFit.Configure} Configure / {acpeFit.Gap} Gap on{" "}
                {accreditorShortName(acpeDoc)})
              </>
            ) : null}
            , the smallest accreditation build, and a live switching-cost window as ACPE retires AAMS for its
            own PHARMS platform — see the{" "}
            <Link href="/domains/pharmacy" hasUnderline>Pharmacy domain hub</Link>,{" "}
            <Link href="/go-to-market#whats-missing" hasUnderline>gap analysis</Link>, or{" "}
            <Link href="/domains/pharmacy/win" hasUnderline>how we win Pharmacy</Link> for the full
            evidence.
          </Takeaway>

          <Stack direction="horizontal" gap={2} wrap="wrap" vAlign="stretch">
            {HORIZONS.map((h, i) => (
              <Stack key={h.phase} direction="horizontal" gap={2} vAlign="center" style={{ flex: "1 1 260px" }}>
                <Card style={{ flex: 1 }}>
                  <Stack gap={2}>
                    <Badge variant={i === 1 ? "info" : "neutral"} label={h.phase} />
                    <Text type="body" weight="semibold">
                      {h.title}
                    </Text>
                    {/* DENSITY-OK: h.body is a short hardcoded HORIZONS const above, not a content/ field */}
                    <Text type="supporting">{h.body}</Text>
                  </Stack>
                </Card>
                {i < HORIZONS.length - 1 ? (
                  <Icon icon="chevronRight" size="md" color="secondary" aria-hidden="true" />
                ) : null}
              </Stack>
            ))}
          </Stack>

          <MetadataList columns={4}>
            <MetadataListItem label="Confirmed GTM target">Pharmacy</MetadataListItem>
            <MetadataListItem label="Domains in scope">Pharmacy · DO · Dentistry · Medicine</MetadataListItem>
            <MetadataListItem label="Domain profiles researched">{domains.length} / 4</MetadataListItem>
            {/* This figure is computed here by an independent
                getScorecard()+computeWeightedTotals() call — the same pair
                /go-to-market's step 1 and every domain's Win tab each call for
                themselves. The link is the trace-back: it lands on the weighted
                table the number falls out of, so a reader never has to take it
                on trust. */}
            <MetadataListItem label="Scorecard's analytical leader">
              {leader ? (
                <>
                  {`${leader[0]} — ${leader[1].toFixed(2)} / 5`}{" "}
                  <Link href="/go-to-market#which-domain" hasUnderline>
                    see the scoring
                  </Link>
                </>
              ) : (
                "Not yet scored"
              )}
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

      {/* Last section on the page since the "Explore the research" card grid was removed
          (2026-09-13 nav consolidation) — so no bottom divider, which would otherwise
          dangle under the final block. */}
      {capMap ? (
        <Section padding={6} variant="muted">
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
    </Stack>
  );
}
