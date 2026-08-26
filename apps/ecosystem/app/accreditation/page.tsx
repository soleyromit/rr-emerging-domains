import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { FitDistributionChart } from "@/components/charts/fit-distribution-chart";
import { listAccreditation, type AccreditationDoc } from "@/lib/content";

const DOMAIN_LINKS = [
  { slug: "do", label: "DO", full: "Osteopathic Medicine", accreditor: "COCA" },
  { slug: "pharmacy", label: "Pharmacy", full: "PharmD", accreditor: "ACPE" },
  { slug: "dentistry", label: "Dentistry", full: "DDS/DMD", accreditor: "CODA" },
  { slug: "medicine", label: "Medicine", full: "MD", accreditor: "LCME" },
];

function fitCounts(doc?: AccreditationDoc) {
  const counts = { Transfer: 0, Configure: 0, Gap: 0 };
  for (const s of doc?.standards ?? []) {
    const fit = (s.prism_fit ?? "").toLowerCase();
    if (fit.includes("transfer")) counts.Transfer += 1;
    else if (fit.includes("configure")) counts.Configure += 1;
    else if (fit.includes("gap")) counts.Gap += 1;
  }
  return counts;
}

export default function AccreditationIndexPage() {
  const docs = listAccreditation();
  const totals = docs.reduce(
    (acc, d) => {
      const c = fitCounts(d);
      acc.total += d.standards?.length ?? 0;
      acc.Transfer += c.Transfer;
      acc.Configure += c.Configure;
      acc.Gap += c.Gap;
      return acc;
    },
    { total: 0, Transfer: 0, Configure: 0, Gap: 0 }
  );

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Market"
            title={`${totals.total} standards mapped — only ${totals.Transfer} transfer as-is, ${totals.Gap} are hard gaps`}
            description="Standard → evidence programs must produce → required software behavior → Prism fit, mapped at the individual element level per accreditor, not just the standard area."
          />
          <Takeaway status="warning" title="The gaps clump into one unshipped pillar, and DO has the fewest wins">
            14 of {totals.Gap} Gap ratings sit in three buckets — standards-to-evidence mapping, external outcome-data
            ingestion, and closed-loop CQI — all the job of one unshipped Accreditation Management pillar. COCA (DO)
            is the only accreditor with zero Transfer ratings; ACPE (Pharmacy) transfers the most, largely because
            Prism&apos;s placement/compliance model already maps onto pharmacy&apos;s one-to-one preceptor structure.
          </Takeaway>
          <MetadataList columns={4}>
            <MetadataListItem label="Elements mapped">{totals.total}</MetadataListItem>
            <MetadataListItem label="Transfer">{totals.Transfer}</MetadataListItem>
            <MetadataListItem label="Configure">{totals.Configure}</MetadataListItem>
            <MetadataListItem label="Gap">{totals.Gap}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>Prism fit distribution, by accreditor</Heading>
          <Text type="supporting">How many mapped standards fall into each fit category.</Text>
          <FitDistributionChart docs={docs} />
        </Stack>
      </Section>

      <Section padding={6}>
        <Grid columns={{ minWidth: 260 }} gap={4}>
          {DOMAIN_LINKS.map((d) => {
            const doc = docs.find((x) => x.slug === d.accreditor.toLowerCase());
            const c = fitCounts(doc);
            return (
              <ClickableCard key={d.slug} href={`/accreditation/${d.slug}`} label={`${d.label} — ${d.accreditor}`}>
                <Stack gap={2}>
                  <Stack direction="horizontal" hAlign="between" vAlign="center">
                    <Text type="body" weight="semibold">
                      {d.label} — {d.full}
                    </Text>
                    <Badge variant="neutral" label={d.accreditor} />
                  </Stack>
                  <Text type="supporting">
                    {doc?.standards?.length
                      ? `${doc.standards.length} mapped · ${c.Transfer} Transfer / ${c.Configure} Configure / ${c.Gap} Gap`
                      : "Not yet researched"}
                  </Text>
                </Stack>
              </ClickableCard>
            );
          })}
        </Grid>
      </Section>
    </Stack>
  );
}
