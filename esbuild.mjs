import esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const dist = join(process.cwd(), "dist");

if (!existsSync(dist)) {
  mkdirSync(dist);
}

// ESM bundle
esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.esm.js",
    bundle: true,
    minify: true,
    format: "esm",
    platform: "browser",
    target: ["esnext"],
  })
  .catch(() => process.exit(1));
