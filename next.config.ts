import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this application: a parent lockfile must not
  // become the project root in a nested workspace.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
