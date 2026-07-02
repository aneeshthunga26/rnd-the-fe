#!/usr/bin/env node
/**
 * dep-sizes — measure the standalone gzipped size of each PRODUCTION dependency.
 *
 * Each package is bundled on its own with esbuild (--bundle --minify, ESM,
 * browser), with the OTHER prod deps marked external and an `import *` entry so
 * nothing is tree-shaken away. This is the full-package cost (bundlephobia-style),
 * NOT the slice this app actually ships onto a route.
 *
 * Prints a ready-to-paste `PROD_DEPS` array for append-row.mjs.
 * Run from the project root:  node .claude/skills/perf-measure/dep-sizes.mjs
 */
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const root = process.cwd();
const appReq = createRequire(join(root, "package.json"));
const DEPS = Object.keys(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).dependencies || {});

// Locate esbuild's install dir (pnpm nests it) and load its JS API.
let esbuildDir;
try {
  esbuildDir = execSync("node -e \"process.stdout.write(require('esbuild').__dirname||'')\"", { cwd: root }).toString();
} catch {}
if (!esbuildDir) {
  const found = execSync("ls -d node_modules/.pnpm/esbuild@*/node_modules/esbuild 2>/dev/null | head -1", { cwd: root }).toString().trim();
  esbuildDir = join(root, found);
}
const esbuild = createRequire(join(esbuildDir, "package.json"))("esbuild");

const results = [];
for (const dep of DEPS) {
  const external = DEPS.filter((d) => d !== dep).flatMap((d) => [d, d + "/*"]);
  let ver = "?";
  try { ver = JSON.parse(readFileSync(join(root, "node_modules", dep, "package.json"), "utf8")).version; }
  catch { try { ver = appReq(`${dep}/package.json`).version; } catch {} }
  try {
    const r = await esbuild.build({
      stdin: { contents: `import * as m from ${JSON.stringify(dep)}; globalThis.__x = m;`, resolveDir: root, loader: "js" },
      bundle: true, minify: true, format: "esm", platform: "browser", write: false, logLevel: "silent",
      external, absWorkingDir: root,
    });
    const buf = Buffer.from(r.outputFiles[0].contents);
    results.push({ name: dep, ver, min: buf.length, gz: gzipSync(buf, { level: 9 }).length });
  } catch (e) {
    results.push({ name: dep, ver, min: null, gz: null, err: String(e.message || e).slice(0, 140) });
  }
}
results.sort((a, b) => (b.gz || 0) - (a.gz || 0));

const ok = results.filter((r) => r.gz != null);
for (const r of results) {
  if (r.gz == null) { console.error(`${r.name}  ERROR ${r.err}`); continue; }
  console.error(`${r.name.padEnd(26)} ${(r.min / 1024).toFixed(1).padStart(7)} KB min ${(r.gz / 1024).toFixed(1).padStart(6)} KB gz  v${r.ver}`);
}
console.error(`${"TOTAL".padEnd(26)} ${" ".padStart(7)}        ${(ok.reduce((s, r) => s + r.gz, 0) / 1024).toFixed(1).padStart(6)} KB gz`);

// Paste-ready snapshot for append-row.mjs → PROD_DEPS
console.log("\n// paste into append-row.mjs (bytes):");
console.log("const PROD_DEPS = [");
for (const r of ok) console.log(`  { name: ${JSON.stringify(r.name)}, ver: ${JSON.stringify(r.ver)}, min: ${r.min}, gz: ${r.gz} },`);
console.log("];");
