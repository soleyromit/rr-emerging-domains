"use client";

import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { DisciplineChip } from "@/components/discipline-chip";
import { IconTile } from "@/components/status-pill";
import { useVocabularyNav } from "@/components/vocabulary-nav-context";
import {
  AccreditorIcon,
  ExamIcon,
  ReviewIcon,
  RotationIcon,
  InstructorIcon,
  PlacementIcon,
  DocumentIcon,
} from "@/components/concept-icons";
import type { RosettaRow, RosettaTermIndex } from "@/lib/glossary";

const ICON_BY_KEY: Record<string, (props: { size?: number }) => React.ReactElement> = {
  accreditor: AccreditorIcon,
  "licensure-exam": ExamIcon,
  "eval-instrument": ReviewIcon,
  rotation: RotationIcon,
  instructor: InstructorIcon,
  "program-accredited": PlacementIcon,
  "self-study": DocumentIcon,
};

const DOMAIN_ORDER = ["do", "pharmacy", "dentistry", "medicine"] as const;

// The Rosetta Stone, transposed from discipline-profile-cards.tsx: there,
// card = discipline and row = concept; here, card = concept and row =
// domain — same idiom (icon tile + domain-colored chip + text), reused
// directly because it's the exact same shape of problem. Cells are short
// phrases meant to stay fully visible (this section is an intentional
// always-open on-ramp, not a lookup), so there's no Collapsible here.
//
// Each cell is clickable when termIndex has one or more matching glossary
// terms for that (concept, domain) pair — clicking jumps to that term's full
// entry (definition, Prism fit, source) in the tabbed browser below, via
// VocabularyNavProvider. A cell with no match, or with more than one
// candidate term, degrades to plain text (or, for 2+, one small link per
// candidate) rather than guessing which term the cell means.
export function RosettaCards({ rows, termIndex }: { rows: RosettaRow[]; termIndex: RosettaTermIndex }) {
  const { requestJump } = useVocabularyNav();
  if (!rows.length) return null;

  return (
    <Grid columns={{ minWidth: 300 }} gap={3}>
      {rows.map((row) => {
        const Icon = ICON_BY_KEY[row.key] ?? AccreditorIcon;
        return (
          <Card key={row.key} id={`rosetta-${row.key}`} variant="default" padding={4}>
            <Stack gap={3}>
              <Stack direction="horizontal" gap={2} vAlign="center">
                <IconTile variant="neutral">
                  <Icon size={20} />
                </IconTile>
                <Text type="body" weight="semibold" size="lg">
                  {row.concept}
                </Text>
              </Stack>
              <Stack gap={2}>
                {DOMAIN_ORDER.filter((d) => row.cells[d]).map((d) => {
                  const candidates = termIndex[row.key]?.[d] ?? [];
                  return (
                    <Stack key={d} direction="horizontal" gap={2} vAlign="start" wrap="wrap">
                      <DisciplineChip subject={d} />
                      {candidates.length === 1 ? (
                        <Link size="sm" color="accent" hasUnderline onClick={() => requestJump(d, candidates[0])}>
                          {row.cells[d]}
                        </Link>
                      ) : (
                        <Text type="supporting" size="sm">
                          {row.cells[d]}
                        </Text>
                      )}
                      {candidates.length > 1
                        ? candidates.map((term) => (
                            <Link
                              key={term}
                              size="xsm"
                              color="accent"
                              hasUnderline
                              onClick={() => requestJump(d, term)}
                            >
                              → {term}
                            </Link>
                          ))
                        : null}
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          </Card>
        );
      })}
    </Grid>
  );
}
