
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exiftool-vendored"],
  allowedDevOrigins: ["192.168.1.36"],
};

export default nextConfig;
