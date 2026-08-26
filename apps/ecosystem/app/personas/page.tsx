import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { PersonaTabs } from "@/components/persona-tabs";
import { DisciplineChip } from "@/components/discipline-chip";
import { matchDisciplineMeta } from "@/lib/discipline-meta";
import { firstSentence } from "@/lib/text";
import {
  listDisciplinePersonas,
  listRolePersonas,
  listCompetitorLensPersonas,
  type DisciplinePersona,
} from "@/lib/content";

function DisciplinePersonaGrid({ personas }: { personas: DisciplinePersona[] }) {
  return (
    <Grid columns={{ minWidth: 320 }} gap={4}>
      {personas.map((p) => (
        <ClickableCard key={p.slug} href={`/personas/discipline/${p.slug}`} label={p.persona_name ?? p.domain}>
          <Stack gap={2}>
            <DisciplineChip subject={p.domain} />
            <Heading level={3}>{p.persona_name}</Heading>
            {p.archetype_summary ? (
              <Text type="supporting" maxLines={2}>
                {firstSentence(p.archetype_summary)}
              </Text>
            ) : null}
            <Text type="supporting" size="xsm">
              {p.accreditation_pressure?.length ?? 0} pressure points · {p.current_tools?.length ?? 0} tools ·{" "}
              {p.jtbd?.length ?? 0} JTBD
            </Text>
          </Stack>
        </ClickableCard>
      ))}
    </Grid>
  );
}

export default function PersonasPage() {
  const discipline = listDisciplinePersonas();
  const roles = listRolePersonas();
  const lenses = listCompetitorLensPersonas();
  const totalJtbd = discipline.reduce((sum, p) => sum + (p.jtbd?.length ?? 0), 0);

  const domainPersonas = discipline.filter((p) => matchDisciplineMeta(p.domain)?.kind === "domain");
  const disciplinePersonas = discipline.filter((p) => matchDisciplineMeta(p.domain)?.kind !== "domain");

  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          <PageHeader
            eyebrow="Customer"
            title="Every persona wants the same missing thing — compliance and competency proof that extends past the student"
            description="Three layers: the discipline (the program itself, per domain), the role (cross-cutting, the people who touch Prism day to day), and the competitor lens (how incumbents implicitly serve — or ignore — each role)."
          />
          <Takeaway title="The entity model stops at the student in all four domains">
            Prism&apos;s compliance gating is real and shipped — but it only points at students. Every accreditor asks
            it to point somewhere else: the clinical site (executed agreement), the preceptor (license, orientation
            before assignment), faculty (calibration), or an affiliated GME program. And the lowest-tolerance user in
            the whole system — the external, often-unpaid community preceptor — has no access story at all: every
            login wall is a reason to stop hosting students, feeding straight back into the site-capacity shortage
            named across DO and MD.
          </Takeaway>
          <MetadataList columns={4}>
            <MetadataListItem label="Discipline personas">{discipline.length}</MetadataListItem>
            <MetadataListItem label="Role personas">{roles.length}</MetadataListItem>
            <MetadataListItem label="Competitor-lens personas">{lenses.length}</MetadataListItem>
            <MetadataListItem label="Jobs to be done">{totalJtbd}</MetadataListItem>
          </MetadataList>
        </Stack>
      </Section>

      <Section padding={6}>
        <PersonaTabs
          discipline={
            discipline.length === 0 ? (
              <EmptyState title="No discipline personas yet" description="Populates as research completes." />
            ) : (
              <Stack gap={6}>
                {domainPersonas.length ? (
                  <Stack gap={3}>
                    <Text type="label" color="secondary">
                      4 expansion domains
                    </Text>
                    <DisciplinePersonaGrid personas={domainPersonas} />
                  </Stack>
                ) : null}
                {disciplinePersonas.length ? (
                  <Stack gap={3}>
                    <Text type="label" color="secondary">
                      8 existing disciplines
                    </Text>
                    <DisciplinePersonaGrid personas={disciplinePersonas} />
                  </Stack>
                ) : null}
              </Stack>
            )
          }
          role={
            roles.length === 0 ? (
              <EmptyState title="No role personas yet" description="Populates as research completes." />
            ) : (
              <Stack gap={3}>
                <Text type="supporting" size="xsm" color="secondary">
                  Every role file's &quot;applies across domains&quot; list is identical (DO/Pharmacy/Dentistry/Medicine)
                  and predates the 12-discipline expansion — a content backlog item, not filtered or corrected here.
                </Text>
                <Grid columns={{ minWidth: 320 }} gap={4}>
                {roles.map((r) => (
                  <ClickableCard key={r.slug} href={`/personas/role/${r.slug}`} label={r.role_name}>
                    <Stack gap={2}>
                      <Heading level={3}>{r.role_name}</Heading>
                      {r.day_in_the_life_summary ? (
                        <Text type="supporting" maxLines={2}>
                          {firstSentence(r.day_in_the_life_summary)}
                        </Text>
                      ) : null}
                      <Text type="supporting" size="xsm">
                        {r.top_pains?.length ?? 0} pains · {r.tools_touched?.length ?? 0} tools touched
                      </Text>
                    </Stack>
                  </ClickableCard>
                ))}
                </Grid>
              </Stack>
            )
          }
          lens={
            lenses.length === 0 ? (
              <EmptyState title="No competitor-lens personas yet" description="Populates as research completes." />
            ) : (
              <Grid columns={{ minWidth: 320 }} gap={4}>
                {lenses.map((l) => (
                  <ClickableCard key={l.slug} href={`/personas/lens/${l.slug}`} label={l.competitor}>
                    <Stack gap={2}>
                      <Heading level={3}>{l.competitor}</Heading>
                      <Text type="supporting" size="xsm">
                        {l.how_they_implicitly_serve_roles?.length ?? 0} roles profiled ·{" "}
                        {l.gaps_prism_can_exploit?.length ?? 0} exploitable gaps
                      </Text>
                    </Stack>
                  </ClickableCard>
                ))}
              </Grid>
            )
          }
        />
      </Section>
    </Stack>
  );
}
