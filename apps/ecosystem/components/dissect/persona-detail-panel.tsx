"use client";

import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { NodeDetailPanel, type CrossLinks } from "@/components/dissect/node-detail-panel";
import { FieldBlock } from "@/components/field-block";
import { CompetitorLogo } from "@/components/competitor-logo";
import type { PersonaNodeDetail } from "@/lib/dissection-node-detail";

// One persona, as the map's persona lane knows it — and the lane really holds TWO
// kinds of thing, not one.
//
// content/personas/ mixes role-*.yaml (a job: "Dean / Program Director") with
// discipline-*.yaml (a whole domain's archetype: "Pharmacy"), and the fields
// persona_relevance[] / audience[] point at both. Pharmacy's own graph carries five
// role personas AND discipline-pharmacy; Dentistry's carries discipline-dentistry.
// They have different schemas and different detail pages, so this panel branches on
// which kind the node really is rather than rendering a role-shaped panel with four
// empty sections for a discipline.
//
// The "how competitors implicitly serve this role" section is the persona-competitor
// EDGE made concrete: the same lens-file rows dissection-graph.ts matched with
// roleNameMatches to build those edges, with the lens's own `read` sentence attached.
// One caveat it states out loud rather than papering over: the lens files are not
// domain-scoped, so this list can name a vendor the map did NOT draw an edge to for
// this domain (the graph scopes those edges to the domain's in-scope incumbents).
export function PersonaDetailPanel({
  detail,
  domainSlug,
  domainLabel,
  connections,
}: {
  detail: PersonaNodeDetail;
  domainSlug: string;
  domainLabel: string;
  /** The graph panel's "how this connects on the map" section, rendered as the last
   * member of this panel's group. See node-detail-panel.tsx. */
  connections?: ReactNode;
}) {
  const isRole = detail.kind === "role";
  const roleSlug = detail.key.replace(/^role-/, "");

  // A role persona has its own page under /roles/{slug} (the persona file's slug minus
  // the role- prefix — the same value listRolePersonas exposes and generateStaticParams
  // registers). A discipline persona does not: since the 2026-09-13 tab consolidation
  // its home is the Buyer profile section of this domain's Overview
  // (/domains/{slug}#buyer-profile — the retired /domains/{slug}/persona tab). Linking a
  // discipline node at /roles/... would 404, so it doesn't.
  const crossLinks: CrossLinks = isRole
    ? [
        { label: `${detail.name} in full`, href: `/roles/${roleSlug}` },
        { label: `${domainLabel}'s buyer profile`, href: `/domains/${domainSlug}#buyer-profile` },
      ]
    : [
        { label: `${domainLabel}'s buyer profile in full`, href: `/domains/${domainSlug}#buyer-profile` },
        { label: `${domainLabel} overview`, href: `/domains/${domainSlug}` },
      ];

  const summary = isRole ? detail.dayInTheLifeSummary : detail.archetypeSummary;
  const title = isRole
    ? `${detail.name} — a role ${domainLabel} standards land on`
    : `${detail.name} — the discipline archetype, not one person's job`;

  return (
    <NodeDetailPanel
      status="info"
      title={detail.found ? title : `${detail.name} has no persona file behind it`}
      crossLinks={crossLinks}
      connections={connections}
      defaultValue={summary ? ["summary"] : undefined}
      takeaway={
        <Stack gap={1.5}>
          {!detail.found ? (
            <Text type="supporting" maxLines={4}>
              {domainLabel}&apos;s standards name this persona, but no persona file in this repo
              matches it any more — the reference is stale. The map keeps the node because the
              relationship is real; there is simply nothing to read about the person.
            </Text>
          ) : (
            // NOT the summary itself. "Day in the life" opens by default directly below
            // and holds that same paragraph — putting a 4-line clamp of it up here
            // rendered the identical opening sentences twice, one above the other, which
            // is what opening this panel in a browser actually showed. The scan line
            // states what is countable instead, and the prose keeps its one home.
            <Text type="supporting" maxLines={3}>
              {summary
                ? isRole
                  ? `What this role's day looks like is below, along with the ${detail.topTasks.length} task${detail.topTasks.length === 1 ? "" : "s"} it is measured on and every vendor lens that names it.`
                  : "This discipline's archetype, the accreditation pressure on it and what makes it switch are below."
                : "No summary has been written for this persona yet — the file exists, the opening description does not."}
            </Text>
          )}
          <Stack direction="horizontal" gap={1} wrap="wrap">
            {isRole && detail.topTasks.length ? (
              <Badge
                variant="neutral"
                label={`${detail.topTasks.length} top task${detail.topTasks.length === 1 ? "" : "s"}`}
              />
            ) : null}
            {isRole && detail.competitorReads.length ? (
              <Badge
                variant="neutral"
                label={`${detail.competitorReads.length} vendor lens${detail.competitorReads.length === 1 ? "" : "es"}`}
              />
            ) : null}
            {!isRole && detail.accreditationPressure.length ? (
              <Badge
                variant="neutral"
                label={`${detail.accreditationPressure.length} pressure point${detail.accreditationPressure.length === 1 ? "" : "s"}`}
              />
            ) : null}
          </Stack>
        </Stack>
      }
    >
      <Collapsible
        value="summary"
        trigger={isRole ? "Day in the life" : "The archetype, in full"}
      >
        {summary ? (
          <FieldBlock text={summary} maxLines={6} />
        ) : (
          <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
            This persona file carries no summary paragraph yet.
          </Text>
        )}
      </Collapsible>

      {isRole ? (
        <Collapsible
          value="tasks"
          trigger={detail.topTasks.length ? `Top tasks (${detail.topTasks.length})` : "Top tasks (none listed)"}
        >
          {detail.topTasks.length ? (
            <Stack gap={1.5}>
              {detail.topTasks.map((t, i) => (
                <Text key={`${t}-${i}`} type="body" size="sm" textWrap="wrap">
                  {t}
                </Text>
              ))}
            </Stack>
          ) : (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              No top tasks are listed for this role yet.
            </Text>
          )}
        </Collapsible>
      ) : (
        <Collapsible
          value="pressure"
          trigger={
            detail.accreditationPressure.length
              ? `Accreditation pressure (${detail.accreditationPressure.length})`
              : "Accreditation pressure (none listed)"
          }
        >
          {detail.accreditationPressure.length ? (
            <Stack gap={3}>
              {detail.accreditationPressure.map((p, i) => (
                <Stack key={`${p.point}-${i}`} gap={1}>
                  <Text type="body" weight="semibold" textWrap="wrap">
                    {p.point}
                  </Text>
                  <FieldBlock text={p.detail} type="supporting" maxLines={3} />
                </Stack>
              ))}
            </Stack>
          ) : (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              No accreditation pressure points are recorded for this discipline persona yet.
            </Text>
          )}
        </Collapsible>
      )}

      {isRole ? (
        <Collapsible
          value="competitors"
          trigger={
            detail.competitorReads.length
              ? `How competitors implicitly serve this role (${detail.competitorReads.length} vendor lenses)`
              : "How competitors implicitly serve this role (no vendor lens covers it)"
          }
        >
          {detail.competitorReads.length ? (
            <Stack gap={3}>
              <Text type="supporting" size="sm" color="secondary" maxLines={3}>
                Every vendor lens on file that names this role — not only the vendors this map draws
                a line to. The lens files are not written per domain, so a vendor can appear here and
                still not be one of {domainLabel}&apos;s incumbents.
              </Text>
              {detail.competitorReads.map((r, i) => (
                <Stack key={`${r.competitorSlug}-${i}`} gap={1.5}>
                  <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                    <CompetitorLogo slug={r.competitorSlug} competitor={r.competitor} size={20} />
                    <Text type="body" weight="semibold">
                      {r.competitor}
                    </Text>
                  </Stack>
                  <FieldBlock text={r.read} type="supporting" maxLines={4} />
                </Stack>
              ))}
            </Stack>
          ) : (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              No vendor lens in this repo names this role — so the map has no
              competitor-serves-persona line into it, and neither does this panel.
            </Text>
          )}
        </Collapsible>
      ) : null}

      {isRole && detail.appliesAcrossDomains.length ? (
        <Collapsible value="domains" trigger={`Applies across domains (${detail.appliesAcrossDomains.length})`}>
          <Stack gap={2}>
            {/* The same caveat /roles/{slug} states on this field, repeated rather than
                dropped: the list is identical in all five role files and predates the
                12-discipline expansion, so it is how it was authored, not a per-role
                finding. A panel that showed the chips without it would be asserting a
                signal the content does not have. */}
            <Text type="supporting" size="sm" color="secondary" maxLines={3}>
              As authored — this list is identical across all five role files and is likely stale
              since the discipline expansion, so treat it as how it was written, not as a per-role
              signal.
            </Text>
            <Stack direction="horizontal" gap={1} wrap="wrap">
              {detail.appliesAcrossDomains.map((d) => (
                <Badge key={d} variant="neutral" label={d} />
              ))}
            </Stack>
          </Stack>
        </Collapsible>
      ) : null}

      {!isRole && detail.switchingTrigger ? (
        <Collapsible value="trigger" trigger="What triggers a switch">
          <FieldBlock text={detail.switchingTrigger} maxLines={6} />
        </Collapsible>
      ) : null}
    </NodeDetailPanel>
  );
}
