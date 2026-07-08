/**
 * Cloudflare Workers free-tier bundle gate: the deployed Worker must be <= 3 MB
 * gzipped. We ask wrangler to bundle exactly as it would for a real deploy
 * (`--dry-run`) and parse the gzip size it reports — the authoritative number,
 * not a naive sum of every file on disk.
 *
 * Run `pnpm cf:build` first, then `pnpm cf:bundle-check`.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LIMIT_MB = 3;

function main() {
  if (!fs.existsSync(path.join(process.cwd(), ".open-next", "worker.js"))) {
    console.error("No .open-next/worker.js — run `pnpm cf:build` first.");
    process.exit(1);
  }

  let out: string;
  try {
    out = execSync("npx wrangler deploy --dry-run --outdir /tmp/pb-cf-bundle-check 2>&1", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
  } catch (e) {
    console.error("wrangler dry-run failed:\n", (e as { stdout?: string }).stdout ?? e);
    process.exit(1);
  }

  const match = out.match(/gzip:\s*([\d.]+)\s*KiB/i);
  if (!match) {
    console.error("Could not parse gzip size from wrangler output:\n", out);
    process.exit(1);
  }
  const gzipMb = parseFloat(match[1]) / 1024;
  console.log(`Worker bundle gzipped: ${gzipMb.toFixed(2)} MB (limit ${LIMIT_MB} MB)`);

  if (gzipMb > LIMIT_MB) {
    console.error(`✗ Over the ${LIMIT_MB} MB free-tier limit by ${(gzipMb - LIMIT_MB).toFixed(2)} MB.`);
    process.exit(1);
  }
  console.log(`✓ Within the Cloudflare free-tier bundle limit (${(LIMIT_MB - gzipMb).toFixed(2)} MB headroom).`);
}

main();
