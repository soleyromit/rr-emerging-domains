import { Stack } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import type { DisciplineJourneyStage } from "@/lib/content";
import { stripFileCitations } from "@/lib/strip-file-citations";

// Closes a gap exploration found: content/journeys/*.yaml has genuinely deep,
// sourced narrative for every one of the 4 expansion domains (discipline_notes
// or key_findings citing the domain by name at several stages of every
// journey) that was reachable only via the separate top-level Journeys nav,
// with no link back from any domain page. Originally built Pharmacy-only
// (as PharmacyScenario); generalized once the same pattern was confirmed to
// hold for DO/Dentistry/Medicine too — see DOMAIN_SCENARIO_JOURNEY in
// app/domains/[slug]/page.tsx, which picks each domain's single richest
// journey by citation count rather than showing all 5. Same Card+chevron
// idiom as charts/flow-diagram.tsx / charts/journey-stepper.tsx /
// clinical-education-timeline.tsx, but each node carries the domain's own
// narrative detail (the actual value here) instead of a severity bar — this
// is a scenario preview, not another gap-severity view.
export function DomainScenario({
  domainLabel,
  journeyName,
  journeySlug,
  stages,
}: {
  domainLabel: string;
  journeyName: string;
  journeySlug: string;
  stages: DisciplineJourneyStage[];
}) {
  if (!stages.length) return null;
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text type="label" color="secondary" size="sm">
          See this as a scenario
        </Text>
        <Text type="body" color="secondary" maxLines={3}>
          "{journeyName}" is a cross-domain journey this repo tracks screen-by-screen. {domainLabel} has its own
          documented reality at {stages.length} of its stages — here's where it diverges.
        </Text>
      </Stack>
      <Stack direction="horizontal" wrap="nowrap" isScrollable gap={0} vAlign="stretch" paddingBlockEnd={2}>
        {stages.map((stage, i) => (
          <Stack key={stage.index} direction="horizontal" gap={0} vAlign="center" style={{ flexShrink: 0 }}>
            <Card variant="default" padding={3}>
              <Stack gap={1.5} width={240}>
                <Text type="label" color="secondary" size="xsm">
                  Stage {stage.index + 1}
                </Text>
                <Text type="body" weight="semibold" size="sm" maxLines={2}>
                  {stage.stageLabel.replace(/^\d+[.)]\s*/, "")}
                </Text>
                {stage.headline ? (
                  <Text type="body" size="xsm" weight="semibold" maxLines={3}>
                    {stripFileCitations(stage.headline)}
                  </Text>
                ) : null}
                <Text type="supporting" size="xsm" maxLines={5}>
                  {stripFileCitations(stage.disciplineDetail)}
                </Text>
                {stage.flowSlug && stage.flowName ? (
                  <Link href={`/flows/${stage.flowSlug}`} color="accent" hasUnderline>
                    View this screen flow →
                  </Link>
                ) : null}
              </Stack>
            </Card>
            {i < stages.length - 1 ? (
              <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
            ) : null}
          </Stack>
        ))}
      </Stack>
      <Text type="label" color="secondary" size="xsm">
        <Link href={`/journeys/${journeySlug}`} color="accent" hasUnderline>
          View the full {journeyName} journey (all stages, every domain) →
        </Link>
      </Text>
    </Stack>
  );
}
