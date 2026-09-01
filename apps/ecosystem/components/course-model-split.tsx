import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

function ModelBox({ who, outerLabel, outerName, innerLabel, innerName, note }: {
  who: string;
  outerLabel: string;
  outerName: string;
  innerLabel: string;
  innerName: string;
  note: string;
}) {
  return (
    <Card variant="default" padding={4}>
      <Stack gap={3}>
        <Text type="label" color="secondary" size="xsm">
          {who}
        </Text>
        <Card variant="muted" padding={3}>
          <Stack gap={2}>
            <Stack gap={0.5}>
              <Text type="label" color="secondary" size="xsm">
                {outerLabel}
              </Text>
              <Text type="body" weight="semibold" size="sm">
                {outerName}
              </Text>
            </Stack>
            <Card variant="transparent" padding={2}>
              <Stack gap={0.5} paddingInlineStart={3}>
                <Text type="label" color="secondary" size="xsm">
                  {innerLabel}
                </Text>
                <Text type="body" weight="semibold" size="sm">
                  {innerName}
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Card>
        <Text type="supporting" size="sm">
          {note}
        </Text>
      </Stack>
    </Card>
  );
}

// Not a labeling difference — it changes what a Slot is even attached to.
// Rendered as literal nested boxes (outer = the wrapping record, inner = what
// lives inside it) so the containment direction reads at a glance.
export function CourseModelSplit() {
  return (
    <Grid columns={{ minWidth: 320, max: 2 }} gap={3}>
      <ModelBox
        who="PT/PTA · OT/OTA · NURSING"
        outerLabel="Course"
        outerName="= a timeframe"
        innerLabel="Rotation"
        innerName="its own course, one per timeframe"
        note="Each rotation is modeled as its own Course. A Slot attaches to one rotation, in one setting."
      />
      <ModelBox
        who="PHYSICIAN ASSISTANT"
        outerLabel="Rotation"
        outerName="= the wrapping period"
        innerLabel="Course"
        innerName="the clinical setting itself"
        note="A Rotation can span multiple Courses — an admin must specify which Course a student is completing when placing them in a Slot."
      />
    </Grid>
  );
}
