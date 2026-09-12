import { CollapsibleGroup, Collapsible } from "@astryxdesign/core/Collapsible";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Markdown } from "@astryxdesign/core/Markdown";
import type { SalesBrief } from "@/lib/sales-brief";

// §C of a domain's SALES.md brief, rendered as the deep-dive "objections you
// will hear" — question as the trigger, sourced rebuttal as the body. The
// addendum (today only Pharmacy's 2026-09-09 three extra objections) renders
// as its own labeled group so the dated annotation stays visible as an
// annotation rather than silently merged into the main list.
export function ObjectionList({
  objections,
  addendum,
}: {
  objections: SalesBrief["objections"];
  addendum?: SalesBrief["objectionAddendum"];
}) {
  if (!objections.length && !addendum?.objections.length) return null;

  return (
    <Stack gap={4}>
      {objections.length ? (
        <CollapsibleGroup type="multiple" hasDividers density="compact">
          {objections.map((o) => (
            <Collapsible key={o.question} value={o.question} trigger={o.question}>
              <Stack paddingBlockStart={2}>
                <Markdown headingLevelStart={4} contentWidth={720}>
                  {o.answer}
                </Markdown>
              </Stack>
            </Collapsible>
          ))}
        </CollapsibleGroup>
      ) : null}
      {addendum?.objections.length ? (
        <Stack gap={2}>
          <Text type="label" color="secondary" size="xsm">
            {addendum.title}
          </Text>
          <CollapsibleGroup type="multiple" hasDividers density="compact">
            {addendum.objections.map((o) => (
              <Collapsible key={o.question} value={o.question} trigger={o.question}>
                <Stack paddingBlockStart={2}>
                  <Markdown headingLevelStart={4} contentWidth={720}>
                    {o.answer}
                  </Markdown>
                </Stack>
              </Collapsible>
            ))}
          </CollapsibleGroup>
        </Stack>
      ) : null}
    </Stack>
  );
}
