import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@night-food/types"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  output: "standalone",
  basePath
};

export default nextConfig;
