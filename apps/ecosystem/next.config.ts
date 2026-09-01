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
    ];
  },
};

export default nextConfig;
