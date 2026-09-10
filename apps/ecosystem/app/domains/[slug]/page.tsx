import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { Badge } from "@astryxdesign/core/Badge";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Takeaway } from "@/components/takeaway";
import { ExxatGapAnswer } from "@/components/exxat-gap-answer";
import { ClinicalEducationTimeline, type ClinicalEducationTimelineStage } from "@/components/clinical-education-timeline";
import { DomainScenario } from "@/components/domain-scenario";
import { FieldBlock } from "@/components/field-block";
import { SentenceList } from "@/components/sentence-list";
import { humanizeSourceRef } from "@/lib/strip-file-citations";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import {
  getAccreditorTiers,
  getDomainHubData,
  fitCounts,
  listDomains,
  getJourney,
  getJourneyStagesForDiscipline,
  type AccreditationDoc,
} from "@/lib/content";

// Keyed by route slug -> {journey slug, the exact key_findings/discipline_notes
// `subject` string it was tagged with}. Every one of the 5 content/journeys/*.yaml
// files cites all 4 expansion domains at multiple stages; this picks each
// domain's single richest journey by citation count (via
// getJourneyStagesForDiscipline) rather than surfacing all 5 journeys on one
// Overview page. Recompute by re-running the count if a journey gets
// substantially rewritten — this isn't derived at request time because it's a
// one-time editorial pick, not something that should silently change on a
// content edit elsewhere.
const DOMAIN_SCENARIO_JOURNEY: Partial<Record<string, { journeySlug: string; subject: string }>> = {
  do: { journeySlug: "accreditation-self-study", subject: "DO" },
  pharmacy: { journeySlug: "competency-verification", subject: "Pharmacy" },
  dentistry: { journeySlug: "accreditation-self-study", subject: "Dentistry" },
  medicine: { journeySlug: "preceptor-site-onboarding", subject: "Medicine" },
};

const STATE_VARIATION_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  confirmed: "warning",
  unconfirmed: "neutral",
  false: "success",
};
const STATE_VARIATION_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  unconfirmed: "Unconfirmed",
  false: "None",
};

interface DomainEditorial {
  headline: string;
  takeawayStatus: "info" | "warning" | "success" | "error";
  takeawayTitle: string;
  takeawayBody: string;
  structuralNote?: string;
}

// Hand-authored editorial analysis for the 4 domains researched in depth first
// (2026-08-24/25). Every other domain gets a headline/takeaway computed from its own
// real accreditation/*.yaml data instead — see computedEditorial() below — rather
// than invented prose standing in for research that hasn't happened yet. Moved here
// from the retired /accreditation/[domain] page.
const DOMAIN_EDITORIAL: Partial<Record<string, DomainEditorial>> = {
  do: {
    headline: "COCA — the toughest accreditation fit of the four, in the fastest-growing market",
    takeawayStatus: "warning",
    takeawayTitle: "Zero elements transfer as-is",
    takeawayBody:
      "7 of 12 researched COCA elements are hard Gaps, and most are threshold-triggered public reporting — a 30-day COMLEX pass-rate publication clock, an automatic improvement-plan trigger below 90% or 2 standard deviations, a <95% PGY-1 placement trigger. These fire from a number, not a committee's judgment, which is a materially different build than a report generator.",
    structuralNote:
      "OMM/OMT — 200-500 hours of hands-on osteopathic manipulative medicine, assessed DURING clerkships — has no analog in any other domain and must live on the rotation record, not the pre-clinical curriculum. COCA 10.3 also requires modelling \"Osteopathic Recognition\" (an AOA/ACGME joint credential) as its own status, not collapsed into generic ACGME accreditation.",
  },
  pharmacy: {
    headline: "ACPE — the best-fitting accreditor of the four",
    takeawayStatus: "success",
    takeawayTitle: "4 Transfer, 5 Configure, only 3 Gap",
    takeawayBody:
      "Pharmacy's one-to-one licensed-preceptor structure maps almost directly onto Prism's existing student-preceptor-placement data model. Preceptor gating is the same shipped student-compliance-gating pattern, just pointed at a second entity — one of the cheapest extensions in the whole research set.",
    structuralNote:
      "ACPE retired AACP's AAMS and now runs its own submission platform, PHARMS (live since July 2025). Scope Prism's Accreditation Management pillar as an evidence-export layer feeding PHARMS, not a competing self-study portal — ACPE, not the vendor, owns the system of record. State boards also license the practice facilities, so site records need a per-state licensure dimension for multi-campus/distance programs.",
  },
  dentistry: {
    headline: "CODA — the hardest structural mismatch of the four",
    takeawayStatus: "error",
    takeawayTitle: "This isn't a rotation model — the placement engine has little to anchor to",
    takeawayBody:
      "Dental clinical education is a longitudinal, in-house patient panel with per-procedure chairside sign-off, not block rotations. axiUm already sits at roughly 90% of U.S. dental schools as the combined EHR + billing + competency gradebook — reviewers call it \"outdated,\" but it's tolerated because institutional customers have few options.",
    structuralNote:
      "CODA 2-24 and 5-3 both need CDT-coded, tooth/surface-level procedure logging — likely the single largest dentistry-specific build if Prism enters. Any procedure log should speak CDT natively, since programs' clinic systems, insurance workflows, and CODA site-visit reviewers already think in CDT, not a parallel taxonomy.",
  },
  medicine: {
    headline: "LCME — Prism's strongest single fit in the whole research corpus",
    takeawayStatus: "success",
    takeawayTitle: "Element 8.6 is the best-fitting standard researched, and 9.7 is close behind",
    takeawayBody:
      "Central monitoring of required-experience completion (8.6) is rated Transfer. And Prism's confirmed anchor-relative scheduling — publish/due dates set as N days before/after a placement's start, mid, or end date — maps almost 1:1 onto LCME 9.7's midpoint-formative-feedback requirement. No competitor is documented shipping an equivalent primitive.",
    structuralNote:
      "Supervision is a team (attending → fellow → resident → intern) that rotates every 4-12 weeks, and a meaningful share of fourth-year rotations are away rotations at institutions with no prior relationship to the home school. 54.9% of AAMC-surveyed students report declining at least one away rotation on cost grounds — the most demanding possible test of a lightweight site/preceptor onboarding path.",
  },
};

// Hand-authored, same rationale as DOMAIN_EDITORIAL: a timeline is a claim about
// real structure (which years, how many hours, which rotation types), so it's
// only written for domains this repo has actually researched to that level —
// Pharmacy first, per the storytelling-redesign proof of concept. Sourced from
// content/domains/pharmacy.yaml's own clinical_education_shape field, just
// decomposed into stops instead of one paragraph.
const DOMAIN_CLINICAL_TIMELINE: Partial<Record<string, ClinicalEducationTimelineStage[]>> = {
  pharmacy: [
    {
      when: "Years 1-2 (didactic)",
      label: "IPPE",
      headlineStat: "300 hrs min",
      detail: "Short, recurring placements woven concurrently through coursework — 75 hrs community + 75 hrs hospital/health-system + 150 hrs patient-care.",
    },
    {
      when: "Year 4 (capstone)",
      label: "APPE",
      headlineStat: "1,440 hrs / 36 wks",
      detail: "6-7 full-time block rotations, 4-6 weeks each, no concurrent coursework. 4 mandatory settings: community, institutional/health-system, general medicine, ambulatory care.",
    },
    {
      when: "After graduation",
      label: "Licensure",
      headlineStat: "2 exams + state hours",
      detail: "NAPLEX (clinical competence) and MPJE (jurisprudence), both NABP-administered, plus state-tracked intern hours beyond the 1,440 APPE hours.",
    },
  ],
};

// Deterministic fallback for domains without hand-authored DOMAIN_EDITORIAL —
// headline and takeaway are built entirely from this domain's own real, already-
// cited standards data, never synthesized prose standing in for research that
// wasn't done.
function computedEditorial(doc: AccreditationDoc | null): DomainEditorial {
  if (!doc?.standards?.length) {
    return {
      headline: doc ? `${doc.accreditor.split("(")[0].trim()} — not yet researched` : "Not yet researched",
      takeawayStatus: "info",
      takeawayTitle: "No standards mapped yet",
      takeawayBody: doc?.research_status_note ?? "This domain has no researched accreditation standards in this repo yet.",
    };
  }
  const c = fitCounts(doc);
  const total = doc.standards.length;
  const gapRatio = c.Gap / total;
  const status = gapRatio > 0.4 ? "error" : gapRatio > 0.2 ? "warning" : "success";
  const gapElements = doc.standards.filter((s) => (s.prism_fit ?? "").toLowerCase().includes("gap"));
  return {
    headline: `${doc.accreditor.split("(")[0].trim()} — ${total} standards mapped, ${c.Gap} rated Gap`,
    takeawayStatus: status,
    takeawayTitle: `${c.Transfer} Transfer, ${c.Configure} Configure, ${c.Gap} Gap`,
    takeawayBody: gapElements.length
      ? `Gap-rated elements: ${gapElements.map((s) => s.element_id).join("; ")}.`
      : "No elements are rated Gap for this accreditor.",
  };
}

export default async function DomainOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { tierEntry, landscapeEntry, featureComparison, standardsCrosswalk, accreditationDoc } = getDomainHubData(
    entry.domain,
    slug
  );
  const editorial = DOMAIN_EDITORIAL[slug] ?? computedEditorial(accreditationDoc);
  const domainProfile = listDomains().find((d) => d.domain?.toLowerCase() === slug);
  const timelineStages = DOMAIN_CLINICAL_TIMELINE[slug] ?? [];
  const scenarioConfig = DOMAIN_SCENARIO_JOURNEY[slug];
  const scenarioJourney = scenarioConfig ? getJourney(scenarioConfig.journeySlug) : null;
  const scenarioStages = scenarioConfig
    ? getJourneyStagesForDiscipline(scenarioConfig.journeySlug, scenarioConfig.subject)
    : [];

  if (!tierEntry) return null;

  return (
    <>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Takeaway status={editorial.takeawayStatus} title={editorial.takeawayTitle}>
            {editorial.headline}. {editorial.takeawayBody}
          </Takeaway>
          <MetadataList columns={4}>
            <MetadataListItem label="Programmatic accreditor">{tierEntry.programmatic_accreditor}</MetadataListItem>
            <MetadataListItem label="Competitors active">{landscapeEntry?.competitors.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Standards tracked">{standardsCrosswalk?.rows.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Feature pillars rated">{featureComparison.rows.length}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <ExxatGapAnswer standardsCrosswalk={standardsCrosswalk} landscapeEntry={landscapeEntry} slug={slug} />
      </Section>

      {scenarioJourney && scenarioStages.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <DomainScenario
            domainLabel={entry.domain}
            journeyName={scenarioJourney.journey_name}
            journeySlug={scenarioJourney.slug}
            stages={scenarioStages}
          />
        </Section>
      ) : null}

      {domainProfile ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={2}>
            <Text type="label" color="secondary">Domain context</Text>
            {timelineStages.length ? (
              <ClinicalEducationTimeline stages={timelineStages} />
            ) : (
              <Text type="body" maxLines={2}>{domainProfile.clinical_education_shape}</Text>
            )}
            <Collapsible
              value="context"
              defaultIsOpen={false}
              trigger={
                <Text type="label" color="secondary" size="sm">
                  Read the full clinical-education structure
                </Text>
              }
            >
              <Text type="body">{domainProfile.clinical_education_shape}</Text>
            </Collapsible>
            {domainProfile.market ? (
              <MetadataList columns={2}>
                <MetadataListItem label="Programs">{domainProfile.market.program_count}</MetadataListItem>
                <MetadataListItem label="Trend">{domainProfile.market.program_count_trend}</MetadataListItem>
              </MetadataList>
            ) : null}
          </Stack>
        </Section>
      ) : null}

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Text type="label" color="secondary" size="sm">
            Accreditor structure
          </Text>
          <Stack direction="horizontal" gap={6} wrap="wrap">
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Regional layer
              </Text>
              <Tooltip
                content={
                  tierEntry.regional_accreditor
                    ? "Confirmed: a genuine regional accreditor tier on top of the programmatic one."
                    : "No regional accreditor tier confirmed for this domain."
                }
              >
                <Stack direction="horizontal" gap={1.5} vAlign="center">
                  <Icon
                    icon={tierEntry.regional_accreditor ? "success" : "close"}
                    size="sm"
                    color={tierEntry.regional_accreditor ? undefined : "secondary"}
                  />
                  <Text type="supporting" size="sm">
                    {tierEntry.regional_accreditor ? "Yes" : "No"}
                  </Text>
                </Stack>
              </Tooltip>
            </Stack>
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                State variation
              </Text>
              <Badge
                variant={STATE_VARIATION_VARIANT[tierEntry.state_licensure_variation] ?? "neutral"}
                label={STATE_VARIATION_LABEL[tierEntry.state_licensure_variation] ?? tierEntry.state_licensure_variation}
              />
            </Stack>
          </Stack>
          {tierEntry.consortium_note ? (
            <FieldBlock label="Consortium structure" text={tierEntry.consortium_note} type="body" size="sm" maxLines={2} />
          ) : null}
          {tierEntry.notes ? <FieldBlock label="Notes" text={tierEntry.notes} type="body" size="sm" maxLines={2} /> : null}
          {tierEntry.sources?.length ? (
            <Stack gap={1}>
              <Text type="label" color="secondary" size="xsm">
                Sources
              </Text>
              <SentenceList items={tierEntry.sources.map(humanizeSourceRef)} maxLines={2} fallbackIcon="copy" />
            </Stack>
          ) : null}
        </Stack>
      </Section>

      {editorial.structuralNote ? (
        <Section padding={6}>
          <Card variant="blue">
            <Stack gap={2}>
              <Text type="label" color="secondary">
                What makes this domain structurally different
              </Text>
              <Text type="body">{editorial.structuralNote}</Text>
            </Stack>
          </Card>
        </Section>
      ) : null}
    </>
  );
}
