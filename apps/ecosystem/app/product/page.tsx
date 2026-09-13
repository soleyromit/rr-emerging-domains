import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Token } from "@astryxdesign/core/Token";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { List, ListItem } from "@astryxdesign/core/List";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Link } from "@astryxdesign/core/Link";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { StatusBadge } from "@/components/fit-badge";
import { PrismFeaturesChart } from "@/components/charts/prism-features-chart";
import { getCapabilityMap } from "@/lib/content";
import { stripFileCitations } from "@/lib/strip-file-citations";

// The "Capability map" tab of /product (default). Its sibling tab, Vocabulary,
// is vocabulary/page.tsx; the tab list lives in layout.tsx.
export default function ProductCapabilityMapPage() {
  const capMap = getCapabilityMap();

  if (!capMap) {
    return (
      <Section padding={6}>
        <EmptyState title="No capability map yet" description="content/prism/capability-map.yaml has not been written." />
      </Section>
    );
  }

  const pillarsWithRationale = capMap.core_ring.pillars.filter((p) => p.why_it_matters || p.notes);
  const pillarsWithFeatures = capMap.core_ring.pillars.filter((p) => p.features?.length);
  const totalFeatures = pillarsWithFeatures.reduce((n, p) => n + (p.features?.length ?? 0), 0);

  return (
    <Stack gap={0}>
      {/* ---------- Bite-sized: headline, one takeaway, one chart ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          {/* No eyebrow: it said "Product", naming the sidebar group, and the
              breadcrumb in app/product/layout.tsx now states that trail above the tabs. */}
          <PageHeader title={`${capMap.product} today — three pillars ship, three are on the roadmap`} description={capMap.tagline} />
          <Takeaway title="The roadmap gap is not generic — it's the exact shape of what four accreditors ask for">
            Every accreditation file researched independently converges on the same missing object: something that
            knows what an accreditation standard is, tracks evidence against it, and records that a finding changed
            something — the unshipped Accreditation Management pillar (Q3 2027). See{" "}
            <Link href="/go-to-market#whats-missing" hasUnderline>gap analysis</Link> for the full case.
          </Takeaway>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Heading level={2}>Confirmed features, by pillar</Heading>
          <Text type="supporting">
            {totalFeatures} concrete features confirmed from real internal product playbooks (PA, OT, PT) — not the
            marketing infographic.
          </Text>
          {/* Projected, not passed whole: the chart is a client component and needs three
              scalars per pillar. Handing it the pillar objects shipped every pillar's notes,
              why_it_matters and feature details into the flight payload — the entire
              remaining raw-filename surface on this route once the visible renders above
              were sanitized. Same bug as /feature-map's `sources` prop, same fix. */}
          <PrismFeaturesChart
            pillars={capMap.core_ring.pillars.map((p) => ({
              name: p.name,
              featureCount: p.features?.length ?? 0,
              status: p.status,
            }))}
          />
        </Stack>
      </Section>

      {/* ---------- Six pillar cards: status + one-line read, nothing more ---------- */}
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={4}>
          <Text type="supporting" maxLines={3}>
            {capMap.core_ring.description}
          </Text>
          <Grid columns={{ minWidth: 280 }} gap={4}>
            {capMap.core_ring.pillars.map((p) => (
              <Card key={p.name} variant={p.status === "roadmap" ? "yellow" : "green"}>
                <Stack gap={2}>
                  <Stack direction="horizontal" hAlign="between" vAlign="center">
                    <Text type="body" weight="semibold">
                      {p.name}
                    </Text>
                    <StatusBadge status={p.status} />
                  </Stack>
                  {p.target ? <Text type="supporting">Target: {p.target}</Text> : null}
                  {p.notes ? (
                    <Text type="supporting" maxLines={3}>
                      {stripFileCitations(p.notes)}
                    </Text>
                  ) : null}
                  {p.features?.length ? (
                    <Stack direction="horizontal" gap={1} wrap="wrap">
                      {p.features.slice(0, 4).map((f) => (
                        <Token key={f.name} label={f.name} size="sm" />
                      ))}
                      {p.features.length > 4 ? <Token label={`+${p.features.length - 4} more`} size="sm" color="gray" /> : null}
                    </Stack>
                  ) : null}
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Section>

      {/* ---------- Everything below is optional deep-dive reference ---------- */}
      <Section padding={6} variant="muted">
        <Divider label="DEEP DIVE — OPTIONAL DETAIL BELOW" />
      </Section>

      {pillarsWithFeatures.length ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={3}>Full feature list</Heading>
            <CollapsibleGroup type="multiple" hasDividers density="compact">
              {pillarsWithFeatures.map((p) => (
                <Collapsible key={p.name} value={p.name} defaultIsOpen={false} trigger={`${p.name} (${p.features!.length})`}>
                  <List hasDividers density="compact">
                    {p.features!.map((f) => (
                      <ListItem
                        key={f.name}
                        label={f.name}
                        description={
                          f.detail ? (
                            <Text type="supporting" maxLines={2}>
                              {stripFileCitations(f.detail)}
                            </Text>
                          ) : undefined
                        }
                      />
                    ))}
                  </List>
                </Collapsible>
              ))}
            </CollapsibleGroup>
          </Stack>
        </Section>
      ) : null}

      {pillarsWithRationale.length ? (
        <Section padding={6} dividers={["bottom"]} variant="muted">
          <Stack gap={3}>
            <Heading level={3}>Pillar rationale</Heading>
            <CollapsibleGroup type="multiple" hasDividers density="compact">
              {pillarsWithRationale.map((p) => (
                <Collapsible
                  key={p.name}
                  value={p.name}
                  defaultIsOpen={false}
                  trigger={p.target ? `${p.name} — ${p.target}` : p.name}
                >
                  <Text type="body" textWrap="wrap">
                    {stripFileCitations(p.why_it_matters ?? p.notes)}
                  </Text>
                </Collapsible>
              ))}
            </CollapsibleGroup>
          </Stack>
        </Section>
      ) : null}

      <Section padding={6} dividers={["bottom"]} variant="muted">
        <Grid columns={{ minWidth: 300 }} gap={4}>
          <Card>
            <Stack gap={2}>
              <Text type="body" weight="semibold">
                Intelligence layer
              </Text>
              <Text type="supporting" maxLines={3}>
                {capMap.intelligence_layer.description}
              </Text>
              <List hasDividers density="compact">
                {capMap.intelligence_layer.capabilities.map((c) => {
                  const [label, ...rest] = c.split(" — ");
                  const detail = rest.join(" — ");
                  return (
                    <ListItem
                      key={c}
                      label={label}
                      description={
                        detail ? (
                          <Text type="supporting" maxLines={2}>
                            {detail}
                          </Text>
                        ) : undefined
                      }
                    />
                  );
                })}
              </List>
            </Stack>
          </Card>
          <Card>
            <Stack gap={2}>
              <Text type="body" weight="semibold">
                Exxat advantage layer
              </Text>
              <Text type="supporting" maxLines={3}>
                {capMap.exxat_advantage_layer.description}
              </Text>
              <Stack direction="horizontal" gap={1.5} wrap="wrap">
                {capMap.exxat_advantage_layer.items.map((c) => (
                  <Badge key={c} variant="neutral" label={c} />
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Section>

      {capMap.served_today || capMap.open_questions_for_phase_2?.length ? (
        <Section padding={6} variant="muted">
          <Stack gap={3}>
            {capMap.served_today ? (
              <Stack gap={1}>
                <Text type="label" size="xsm">
                  Served today
                </Text>
                <Text type="supporting" size="sm" maxLines={3}>
                  {stripFileCitations(capMap.served_today.note)}
                </Text>
              </Stack>
            ) : null}
            {capMap.open_questions_for_phase_2?.length ? (
              <Collapsible defaultIsOpen={false} trigger={`Open questions (${capMap.open_questions_for_phase_2.length})`}>
                <List hasDividers density="compact">
                  {/* Sanitize ONCE and use the result for both the key and the label. React
                      serializes an element's key into the flight payload verbatim, so
                      `key={q}` shipped the raw question text — filenames included — even
                      though the label beside it was correctly humanized. Two of the three
                      raw paths left in this route's payload were keys, not rendered text. */}
                  {capMap.open_questions_for_phase_2.map((q) => {
                    const question = stripFileCitations(q) ?? q;
                    return (
                      <ListItem
                        key={question}
                        label={
                          <Text type="body" maxLines={2}>
                            {question}
                          </Text>
                        }
                      />
                    );
                  })}
                </List>
              </Collapsible>
            ) : null}
            {/* Sanitized per element, then joined — not the other way round. Joining first
                would hand the sanitizer one string in which "…transcripts.md · TEVideos…"
                puts a citation-looking token immediately after a "·", and BARE_CONTENT_PATH's
                slash-list lookbehind is the only place it tolerates a match starting
                mid-token. Per-element also means one unparseable source can never affect
                its neighbours. This is the highest-traffic raw-filename site in the app:
                eight of these entries are transcript/interview filenames, rendered
                unclamped and outside any collapsible. */}
            <Text type="supporting" size="xsm">
              Sources: {capMap.sources.map((s) => stripFileCitations(s) ?? s).join(" · ")} — last updated{" "}
              {capMap.last_updated}
            </Text>
          </Stack>
        </Section>
      ) : null}
    </Stack>
  );
}
