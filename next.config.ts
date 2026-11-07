import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old navigation pages, merged into Catalogue and Créateurs. The detail
  // pages (/artistes/[id], /studios/[id]) are unchanged.
  async redirects() {
    return [
      { source: "/categories", destination: "/catalogue", permanent: true },
      { source: "/artistes", destination: "/createurs", permanent: true },
      { source: "/studios", destination: "/createurs?type=studios", permanent: true },
    ];
  },
};

export default nextConfig;
