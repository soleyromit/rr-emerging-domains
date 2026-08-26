import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { AccreditationStandardsTable } from "@/components/accreditation-standards-table";
import { FitDistributionChart } from "@/components/charts/fit-distribution-chart";
import { listAccreditation, listDomains } from "@/lib/content";

const DOMAIN_META: Record<
  string,
  {
    label: string;
    accreditorSlug: string;
    headline: string;
    takeawayStatus: "info" | "warning" | "success" | "error";
    takeawayTitle: string;
    takeawayBody: string;
    structuralNote: string;
  }
> = {
  do: {
    label: "DO — Osteopathic Medicine",
    accreditorSlug: "coca",
    headline: "COCA — the toughest accreditation fit of the four, in the fastest-growing market",
    takeawayStatus: "warning",
    takeawayTitle: "Zero elements transfer as-is",
    takeawayBody:
      "7 of 12 researched COCA elements are hard Gaps, and most are threshold-triggered public reporting — a 30-day COMLEX pass-rate publication clock, an automatic improvement-plan trigger below 90% or 2 standard deviations, a <95% PGY-1 placement trigger. These fire from a number, not a committee's judgment, which is a materially different build than a report generator.",
    structuralNote:
      "OMM/OMT — 200-500 hours of hands-on osteopathic manipulative medicine, assessed DURING clerkships — has no analog in any other domain and must live on the rotation record, not the pre-clinical curriculum. COCA 10.3 also requires modelling \"Osteopathic Recognition\" (an AOA/ACGME joint credential) as its own status, not collapsed into generic ACGME accreditation.",
  },
  pharmacy: {
    label: "Pharmacy — PharmD",
    accreditorSlug: "acpe",
    headline: "ACPE — the best-fitting accreditor of the four",
    takeawayStatus: "success",
    takeawayTitle: "4 Transfer, 5 Configure, only 3 Gap",
    takeawayBody:
      "Pharmacy's one-to-one licensed-preceptor structure maps almost directly onto Prism's existing student-preceptor-placement data model. Preceptor gating is the same shipped student-compliance-gating pattern, just pointed at a second entity — one of the cheapest extensions in the whole research set.",
    structuralNote:
      "ACPE retired AACP's AAMS and now runs its own submission platform, PHARMS (live since July 2025). Scope Prism's Accreditation Management pillar as an evidence-export layer feeding PHARMS, not a competing self-study portal — ACPE, not the vendor, owns the system of record. State boards also license the practice facilities, so site records need a per-state licensure dimension for multi-campus/distance programs.",
  },
  dentistry: {
    label: "Dentistry — DDS/DMD",
    accreditorSlug: "coda",
    headline: "CODA — the hardest structural mismatch of the four",
    takeawayStatus: "error",
    takeawayTitle: "This isn't a rotation model — the placement engine has little to anchor to",
    takeawayBody:
      "Dental clinical education is a longitudinal, in-house patient panel with per-procedure chairside sign-off, not block rotations. axiUm already sits at roughly 90% of U.S. dental schools as the combined EHR + billing + competency gradebook — reviewers call it \"outdated,\" but it's tolerated because institutional customers have few options.",
    structuralNote:
      "CODA 2-24 and 5-3 both need CDT-coded, tooth/surface-level procedure logging — likely the single largest dentistry-specific build if Prism enters. Any procedure log should speak CDT natively, since programs' clinic systems, insurance workflows, and CODA site-visit reviewers already think in CDT, not a parallel taxonomy.",
  },
  medicine: {
    label: "Medicine — MD",
    accreditorSlug: "lcme",
    headline: "LCME — Prism's strongest single fit in the whole research corpus",
    takeawayStatus: "success",
    takeawayTitle: "Element 8.6 is the best-fitting standard researched, and 9.7 is close behind",
    takeawayBody:
      "Central monitoring of required-experience completion (8.6) is rated Transfer. And Prism's confirmed anchor-relative scheduling — publish/due dates set as N days before/after a placement's start, mid, or end date — maps almost 1:1 onto LCME 9.7's midpoint-formative-feedback requirement. No competitor is documented shipping an equivalent primitive.",
    structuralNote:
      "Supervision is a team (attending → fellow → resident → intern) that rotates every 4-12 weeks, and a meaningful share of fourth-year rotations are away rotations at institutions with no prior relationship to the home school. 54.9% of AAMC-surveyed students report declining at least one away rotation on cost grounds — the most demanding possible test of a lightweight site/preceptor onboarding path.",
  },
};

export function generateStaticParams() {
  return Object.keys(DOMAIN_META).map((domain) => ({ domain }));
}

export default async function AccreditationDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const meta = DOMAIN_META[domain];
  if (!meta) notFound();

  const doc = listAccreditation().find((a) => a.slug === meta.accreditorSlug);
  const domainProfile = listDomains().find((d) => d.domain?.toLowerCase() === domain);

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <Breadcrumbs>
            <BreadcrumbItem href="/accreditation">Accreditation map</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{meta.label}</BreadcrumbItem>
          </Breadcrumbs>
          <PageHeader
            eyebrow={meta.label}
            title={meta.headline}
            description={doc ? `${doc.accreditor} — ${doc.governs}` : "Not yet researched."}
          />
          <Takeaway status={meta.takeawayStatus} title={meta.takeawayTitle}>
            {meta.takeawayBody}
          </Takeaway>
        </Stack>
      </Section>

      {domainProfile ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={2}>
            <Text type="label" color="secondary">Domain context</Text>
            <Text type="body" maxLines={2}>
              {domainProfile.clinical_education_shape}
            </Text>
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
          <Stack gap={1}>
            <Heading level={2}>Standards</Heading>
            {doc?.standards_document ? (
              <Text type="supporting">
                {doc.standards_document.title} {doc.standards_document.version_or_year}
              </Text>
            ) : null}
          </Stack>
          {doc?.standards?.length ? (
            <>
              <FitDistributionChart docs={[doc]} />
              <AccreditationStandardsTable standards={doc.standards} />
            </>
          ) : (
            <EmptyState title="No standards mapped yet" description="This section populates once accreditation research lands for this domain." />
          )}
        </Stack>
      </Section>

      {doc?.licensure_or_gme_layer?.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Heading level={2}>Licensure / GME / association layer</Heading>
            <Grid columns={{ minWidth: 260 }} gap={3}>
              {doc.licensure_or_gme_layer.map((b, i) => (
                <Card key={i}>
                  <Stack gap={1}>
                    {/* DENSITY-OK: b.body is the licensure body's short name (e.g. "AOA"), not prose */}
                    <Text type="body" weight="semibold">
                      {b.body}
                    </Text>
                    <Text type="supporting" maxLines={3}>
                      {b.what_it_governs}
                    </Text>
                    <Text type="supporting" maxLines={3}>
                      {b.relevance_to_product}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Section>
      ) : null}

      <Section padding={6}>
        <Card variant="blue">
          <Stack gap={2}>
            <Text type="label" color="secondary">
              What makes this domain structurally different
            </Text>
            <Text type="body">{meta.structuralNote}</Text>
          </Stack>
        </Card>
      </Section>
    </Stack>
  );
}
