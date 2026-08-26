import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { Competitor } from "@/lib/content";

// company.founded/hq/ownership are often full hedged sentences with parenthetical
// caveats ("founded 1989... per search-engine-summarized secondary sources, not
// independently confirmed"), not clean single-line facts — a MetadataList's
// label-beside-value row assumes the latter. Independent cards let each fact grow
// to its own height instead of forcing three into one cramped row.
export function CompetitorCompanyFacts({ company }: { company?: Competitor["company"] }) {
  if (!company) return null;
  const facts: { label: string; value?: string }[] = [
    { label: "Founded", value: company.founded },
    { label: "HQ", value: company.hq },
    { label: "Ownership", value: company.ownership },
  ].filter((f) => f.value);
  if (!facts.length) return null;
  return (
    <Grid columns={{ minWidth: 260 }} gap={3}>
      {facts.map((f) => (
        <Card key={f.label} variant="muted" padding={3}>
          <Stack gap={1}>
            <Text type="label" color="secondary" size="xsm">
              {f.label}
            </Text>
            {/* DENSITY-OK: company facts are the whole point of this block, shown in full */}
            <Text type="body" size="sm">
              {f.value}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
