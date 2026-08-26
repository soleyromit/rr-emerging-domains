import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Divider } from "@astryxdesign/core/Divider";
import { Icon } from "@astryxdesign/core/Icon";
import { SourceLine } from "@/components/source-line";

interface Claim {
  claim: string;
  source?: string;
}

// A real side-by-side comparison, not two stacked accordions. Counts are
// asymmetric (4-7 each across real competitors) so the two columns are
// independent — not a paired table row per index. Claims render in full:
// at 167-430+ chars each, ListItem's label/description would silently
// single-line-ellipsis with no tooltip (see UI-DENSITY-PATTERNS.md).
export function CompetitorProsCons({
  strengths,
  weaknesses,
}: {
  strengths?: Claim[];
  weaknesses?: Claim[];
}) {
  if (!strengths?.length && !weaknesses?.length) return null;
  return (
    <Grid columns={{ minWidth: 360 }} gap={4}>
      <Card variant="green" padding={3}>
        <Stack gap={3}>
          <Heading level={3}>Strengths</Heading>
          <Stack gap={3}>
            {(strengths ?? []).map((s, i) => (
              <Stack key={i} gap={1}>
                {i > 0 ? <Divider variant="subtle" /> : null}
                <Stack direction="horizontal" gap={2}>
                  <Icon icon="success" color="success" size="sm" />
                  {/* DENSITY-OK: claims shown in full — this page's whole purpose is showing them */}
                  <Text type="body" size="sm">
                    {s.claim}
                  </Text>
                </Stack>
                <SourceLine source={s.source} />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Card>
      <Card variant="red" padding={3}>
        <Stack gap={3}>
          <Heading level={3}>Weaknesses</Heading>
          <Stack gap={3}>
            {(weaknesses ?? []).map((w, i) => (
              <Stack key={i} gap={1}>
                {i > 0 ? <Divider variant="subtle" /> : null}
                <Stack direction="horizontal" gap={2}>
                  <Icon icon="warning" color="warning" size="sm" />
                  <Text type="body" size="sm">
                    {w.claim}
                  </Text>
                </Stack>
                <SourceLine source={w.source} />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Card>
    </Grid>
  );
}
