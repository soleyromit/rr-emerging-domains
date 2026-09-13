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
      { source: "/personas/discipline/:slug", destination: "/domains/:slug/persona", permanent: true },
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
      // /synthesis/gap-analysis and /synthesis/positioning stay where they are,
      // so only the one exact /synthesis child path is redirected.
      { source: "/crosswalk", destination: "/standards", permanent: true },
      { source: "/synthesis/vocabulary", destination: "/standards/glossary", permanent: true },
    ];
  },
};

export default nextConfig;
