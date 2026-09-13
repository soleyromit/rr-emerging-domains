import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 2026-08-27 IA consolidation: /lenses, /accreditation, and /personas'
  // discipline/lens tabs were folded into the domain hub (/domains/[slug] and its
  // tabs) or /competitors/[slug]; the role tab moved to /roles. These redirects
  // keep old bookmarks/links working.
  async redirects() {
    return [
      { source: "/lenses", destination: "/domains", permanent: true },
      { source: "/accreditation", destination: "/domains", permanent: true },
      { source: "/accreditation/:domain", destination: "/domains/:domain/standards", permanent: true },
      { source: "/personas", destination: "/roles", permanent: true },
      // Re-pointed 2026-09-13 (see the nav-consolidation entry for
      // /domains/:slug/persona below). This entry's old destination was
      // /domains/:slug/persona, which no longer exists — leaving it would have made
      // this a redirect chain ending in a 404, which is worse than the bare 404 the
      // entry exists to prevent. It stays (rather than being deleted) because
      // /personas/discipline/:slug was a real, statically generated page until
      // 2026-08-27 and external bookmarks to it are exactly what these entries are
      // for; nothing in the app links to it. Its :slug is the same value
      // /domains/:slug uses — personas/discipline-*.yaml is keyed by the route slug,
      // not the domain label (see lib/content.ts's getDomainHubData) — so it maps
      // straight through with no translation.
      { source: "/personas/discipline/:slug", destination: "/domains/:slug#buyer-profile", permanent: true },
      { source: "/personas/role/:slug", destination: "/roles/:slug", permanent: true },
      { source: "/personas/lens/:slug", destination: "/competitors/:slug", permanent: true },
      // 2026-09-13 nav consolidation: /prism and /prism/vocabulary became the two
      // tabs of /product. Same reason as above — old bookmarks keep working.
      { source: "/prism", destination: "/product", permanent: true },
      { source: "/prism/vocabulary", destination: "/product/vocabulary", permanent: true },
      // 2026-09-13 nav consolidation: /competitors and /feature-map became the two
      // pivots of /competitive-landscape. Note /competitors/:slug is NOT redirected
      // and must not be — the per-competitor teardown pages still live there, and a
      // `source: "/competitors"` entry matches only the exact index path.
      { source: "/competitors", destination: "/competitive-landscape", permanent: true },
      { source: "/feature-map", destination: "/competitive-landscape/by-pillar", permanent: true },
      // 2026-09-13 nav consolidation: /crosswalk and /synthesis/vocabulary became
      // the two tabs of /standards, the second renamed Vocabulary → Glossary.
      { source: "/crosswalk", destination: "/standards", permanent: true },
      { source: "/synthesis/vocabulary", destination: "/standards/glossary", permanent: true },
      // 2026-09-13 nav consolidation: /scorecard, /synthesis/gap-analysis and
      // /synthesis/positioning became three anchored SECTIONS of one linear
      // /go-to-market page (not tabs — they are ordered steps of one decision),
      // so each old route redirects to its own step anchor rather than to the
      // page top. Nothing is left under /synthesis now; each of its two child
      // paths is redirected explicitly, matching the exact-path convention the
      // entries above use.
      { source: "/scorecard", destination: "/go-to-market#which-domain", permanent: true },
      { source: "/synthesis/gap-analysis", destination: "/go-to-market#whats-missing", permanent: true },
      { source: "/synthesis/positioning", destination: "/go-to-market#what-to-say", permanent: true },
      // 2026-09-13 nav consolidation: the domain hub's Persona tab was folded into its
      // Overview as the "Buyer profile" section, so the retired tab URL redirects to
      // that section's anchor rather than to the page top. The anchor renders for every
      // routed domain — including the one with no persona file, which shows the same
      // empty state the tab did — so this never lands on a missing target.
      { source: "/domains/:slug/persona", destination: "/domains/:slug#buyer-profile", permanent: true },
    ];
  },
};

export default nextConfig;
