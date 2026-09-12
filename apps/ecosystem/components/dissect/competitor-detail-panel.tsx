"use client";

import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { NodeDetailPanel, type CrossLinks } from "@/components/dissect/node-detail-panel";
import { CompetitorCompanyFacts } from "@/components/competitor-company-facts";
import { CompetitorFeatureDossier } from "@/components/competitor-feature-dossier";
import type { CompetitorNodeDetail } from "@/lib/dissection-node-detail";

// One vendor, as the map's competitor lane knows it.
//
// The company facts and the feature teardown are rendered by the SAME two components
// /competitors/{slug} uses (CompetitorCompanyFacts, CompetitorFeatureDossier) rather
// than a second, shorter rendering of the same YAML — a reader who opens a vendor from
// the map and then follows the link to its own page should recognise what they already
// read, not discover the map gave them an abridged version. Both are plain presentation
// components over plain data, so they work here unchanged.
//
// THE OUT-OF-SCOPE DISCLOSURE IS THE TAKEAWAY, not a footnote. A vendor can have real,
// sourced ratings for this domain and still not be one of the vendors the domain is
// trying to win against — Pharmacy's RxPreceptor is exactly that. The graph card greys
// it and the tree badges it; if this panel opened with "RxPreceptor — Experiential
// education software" and buried the exclusion, the most detailed of the three surfaces
// would be the one that misleads. So the manifest's own reason leads, and the vendor's
// category follows it.
export function CompetitorDetailPanel({
  detail,
  domainSlug,
  domainLabel,
  connections,
}: {
  detail: CompetitorNodeDetail;
  domainSlug: string;
  domainLabel: string;
  /** The graph panel's "how this connects on the map" section, rendered as the last
   * member of this panel's group. See node-detail-panel.tsx. */
  connections?: ReactNode;
}) {
  const crossLinks: CrossLinks = [
    { label: `${detail.name} in full`, href: `/competitors/${detail.slug}` },
    { label: `${domainLabel} competitor landscape`, href: `/domains/${domainSlug}/competitors` },
  ];

  const title = detail.outOfScope
    ? `${detail.name} is rated for ${domainLabel} but is not a target here`
    : `${detail.name} is one of ${domainLabel}'s incumbents`;

  return (
    <NodeDetailPanel
      status={detail.outOfScope ? "warning" : "info"}
      title={title}
      crossLinks={crossLinks}
      connections={connections}
      defaultValue={detail.featureTeardown.length ? undefined : ["company"]}
      takeaway={
        <Stack gap={1.5}>
          {detail.scopeNote ? (
            <Text type="supporting" maxLines={4}>
              {/* The manifest's own sentence, not a paraphrase of it — and joined with a
                  full stop only when it does not already end in one. Pharmacy's
                  exclusion_reason for RxPreceptor ends "...the platform depth." and a
                  hardcoded "." after it rendered a real doubled period on screen. */}
              {`${detail.scopeNote.replace(/[.!?]\s*$/, "")}. Its ratings and trend entries are real research and stay on the map; they are just not evidence about a vendor this domain has to beat.`}
            </Text>
          ) : null}
          {detail.category ? (
            <Text type="supporting" maxLines={3}>
              {detail.category}
            </Text>
          ) : null}
          {detail.domainsServed.length ? (
            <Stack direction="horizontal" gap={1} wrap="wrap">
              {detail.domainsServed.map((d) => (
                <Badge key={d} variant="neutral" label={d} />
              ))}
            </Stack>
          ) : null}
          {!detail.hasDossier ? (
            <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
              This vendor is named by {domainLabel}&apos;s ratings or trends but has no competitor
              write-up in this repo yet — there is no category, company record or teardown to show,
              because nobody has written one.
            </Text>
          ) : null}
        </Stack>
      }
    >
      <Collapsible
        value="company"
        trigger={
          detail.company
            ? "Company"
            : "Company (nothing recorded)"
        }
      >
        {detail.company ? (
          <CompetitorCompanyFacts company={detail.company} />
        ) : (
          <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
            No founding date, headquarters or ownership has been researched for this vendor yet —
            absent, not unknowable.
          </Text>
        )}
      </Collapsible>

      {/* Closed by default and counted in the trigger, because a full teardown is six
          or seven multi-paragraph blocks with quoted evidence under each — the single
          longest thing any of these five panels can open. The count is what tells a
          reader what opening it costs. */}
      <Collapsible
        value="teardown"
        trigger={
          detail.featureTeardown.length
            ? `Feature teardown by pillar (${detail.featureTeardown.length})`
            : "Feature teardown by pillar (none yet)"
        }
      >
        {detail.featureTeardown.length ? (
          <CompetitorFeatureDossier features={detail.featureTeardown} />
        ) : (
          <Text type="supporting" size="sm" color="secondary" maxLines={3} style={{ fontStyle: "italic" }}>
            No pillar-by-pillar teardown has been written for this vendor. The map still connects it
            to pillars where a rating or a trend names one — those edges are real; this dossier is
            simply not written yet.
          </Text>
        )}
      </Collapsible>
    </NodeDetailPanel>
  );
}
