import { notFound } from "next/navigation";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { PersonaSpecList } from "@/components/persona-spec-list";
import { ProseItemList } from "@/components/prose-item-list";
import { SentenceList } from "@/components/sentence-list";
import { stripFileCitations } from "@/lib/strip-file-citations";
import { FieldBlock } from "@/components/field-block";
import { getAccreditorTiers, getDomainHubData, resolveRelatedFlows } from "@/lib/content";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { dissectNodeHref, dissectionNodeId, dissectionNodeIds } from "@/lib/dissection-links";

export default async function DomainPersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAccreditorTiers()?.domains.find((d) => matchDisciplineMeta(d.domain)?.slug === slug);
  if (!entry) notFound();

  const { disciplinePersona: persona } = getDomainHubData(entry.domain, slug);

  if (!persona) {
    return (
      <Section padding={6}>
        <EmptyState title="No discipline persona yet" description="Populates as research completes for this domain." />
      </Section>
    );
  }

  const jtbdItems = (persona.jtbd ?? []).map((j) => ({
    primary: j.job,
    secondary: stripFileCitations(j.evidence_or_rationale),
    secondaryLabel: "Evidence / rationale",
    relatedFlows: resolveRelatedFlows(j.related_flows),
  }));

  // Opening vignette: this persona's own first sentence, not new prose — a
  // scenario needs a hook line before the metric strip, and archetype_summary
  // already opens with one; pulling it out just gives it visual weight.
  const vignette = stripFileCitations(persona.archetype_summary)?.split(/(?<=[.!?])\s+/)[0];

  // The three sections below (pressure -> tools -> switching trigger) are a
  // causal sequence today rendered as unlinked cards; this connects them as
  // one thread, each node jumping to its real section rather than restating it.
  //
  // Phase 6 adds a fourth, terminal node that leaves the page: this same persona
  // as an entity on the Dissection map, where the standards that cite it and the
  // competitors that serve it are edges rather than prose. It is the one step whose
  // href is absolute rather than an in-page anchor, which is why `href` is carried on
  // the step instead of built from `id` at the render site.
  //
  // Conditional on the node really existing: a discipline persona is only on the map
  // when some standard's persona_relevance or use-case audience names its file, which
  // is true for Pharmacy and Dentistry and NOT for DO or Medicine (whose graphs carry
  // only role-* persona nodes). Where it does not exist the thread simply ends at the
  // switching trigger, as it did before.
  const disciplinePersonaMapHref = dissectNodeHref(
    slug,
    dissectionNodeIds(slug, entry.domain),
    dissectionNodeId.persona(`discipline-${slug}`)
  );

  const narrativeSteps = [
    { id: "pressure", label: "Today's pressure", href: "#pressure", count: persona.accreditation_pressure?.length ?? 0 },
    { id: "tools", label: "Current tools", href: "#tools", count: persona.current_tools?.length ?? 0 },
    { id: "trigger", label: "What triggers switching", href: "#trigger", count: persona.switching_trigger ? 1 : 0 },
    {
      id: "map",
      label: "Where they sit on the map",
      href: disciplinePersonaMapHref ?? "",
      count: disciplinePersonaMapHref ? 1 : 0,
    },
  ].filter((s) => s.count > 0);

  return (
    <>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          {vignette ? (
            <Text type="body" size="lg" weight="semibold" style={{ fontStyle: "italic" }}>
              "{vignette}"
            </Text>
          ) : null}
          {narrativeSteps.length ? (
            <Stack direction="horizontal" wrap="nowrap" isScrollable gap={0} vAlign="stretch">
              {narrativeSteps.map((step, i) => (
                <Stack key={step.id} direction="horizontal" gap={0} vAlign="center" style={{ flexShrink: 0 }}>
                  <Link href={step.href}>
                    <Card variant="muted" padding={2}>
                      <Stack gap={0.5} width={160}>
                        <Text type="label" color="secondary" size="xsm">
                          {i + 1}
                        </Text>
                        <Text type="body" weight="semibold" size="sm">
                          {step.label}
                        </Text>
                      </Stack>
                    </Card>
                  </Link>
                  {i < narrativeSteps.length - 1 ? (
                    <Icon icon="chevronRight" size="sm" color="secondary" aria-hidden="true" />
                  ) : null}
                </Stack>
              ))}
            </Stack>
          ) : null}
          <MetadataList columns={4}>
            <MetadataListItem label="Pressure points">{persona.accreditation_pressure?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Current tools">{persona.current_tools?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Jobs to be done">{persona.jtbd?.length ?? 0}</MetadataListItem>
            <MetadataListItem label="Sources cited">{persona.sources?.length ?? 0}</MetadataListItem>
          </MetadataList>
          {persona.archetype_summary ? (
            // DENSITY-OK: dedicated persona tab — shown in full, not an index card's
            // 3-line teaser. maxWidth keeps it a readable column (same 720px
            // measure PageHeader's own description uses) instead of running
            // full-bleed across the content area — full-length prose set that
            // wide is a wall of text no matter how good the writing is.
            <Text type="body" style={{ maxWidth: 720, lineHeight: 1.6 }}>
              {stripFileCitations(persona.archetype_summary)}
            </Text>
          ) : null}
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Grid columns={{ minWidth: 340 }} gap={5}>
          {persona.accreditation_pressure?.length ? (
            <div id="pressure">
              <Stack gap={2}>
                <Text type="label" color="secondary">
                  Accreditation pressure ({persona.accreditation_pressure.length})
                </Text>
                <PersonaSpecList
                  items={persona.accreditation_pressure.map((p) => ({
                    label: stripFileCitations(p.point) ?? p.point,
                    text: stripFileCitations(p.detail) ?? p.detail,
                  }))}
                  fallbackIcon="clock"
                />
              </Stack>
            </div>
          ) : null}
          {persona.current_tools?.length ? (
            <div id="tools">
              <Stack gap={2}>
                <Text type="label" color="secondary">
                  Current tools ({persona.current_tools.length})
                </Text>
                {/* current_tools is the densest citation field in the persona corpus —
                    discipline-crna.yaml's entries name nine competitor files by bare
                    filename (medhub.yaml, e-value.yaml, elentra.yaml, one45.yaml,
                    core-elms.yaml, emedley.yaml, leo-davinci.yaml, …) because the research
                    is literally "we checked all nine teardowns". Correct in the YAML,
                    a raw path list on screen without this. */}
                <PersonaSpecList
                  items={persona.current_tools.map((p) => ({
                    label: stripFileCitations(p.point) ?? p.point,
                    text: stripFileCitations(p.detail) ?? p.detail,
                  }))}
                  fallbackIcon="wrench"
                />
              </Stack>
            </div>
          ) : null}
        </Grid>
      </Section>

      {jtbdItems.length ? (
        <Section padding={6} dividers={["bottom"]}>
          <Stack gap={3}>
            <Text type="label" color="secondary">
              Jobs to be done ({jtbdItems.length})
            </Text>
            <ProseItemList items={jtbdItems} />
          </Stack>
        </Section>
      ) : null}

      {persona.switching_trigger ? (
        <Section padding={6} dividers={["bottom"]}>
          <div id="trigger">
            <Card variant="pink" padding={4}>
              <Stack gap={2}>
                <Text type="label" weight="semibold" size="sm">
                  Switching trigger
                </Text>
                {/* Leaks live on /domains/crna/persona today: this persona's switching
                    trigger cites ../accreditation/coa.yaml twice and coca.yaml once, in
                    first-paint text. archetype_summary and sources on this same page were
                    already wrapped — this field was simply missed. */}
                <FieldBlock
                  text={stripFileCitations(persona.switching_trigger)}
                  maxLines={4}
                  triggerLabel="Read the full section"
                />
              </Stack>
            </Card>
          </div>
        </Section>
      ) : null}

      {persona.sources?.length ? (
        <Section padding={6}>
          <Collapsible defaultIsOpen={false} trigger={`Sources (${persona.sources.length})`}>
            <SentenceList
              items={persona.sources.map((s) => stripFileCitations(s) ?? s)}
              maxLines={2}
              fallbackIcon="copy"
            />
          </Collapsible>
        </Section>
      ) : null}
    </>
  );
}
