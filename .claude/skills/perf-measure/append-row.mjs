#!/usr/bin/env node
/**
 * perf-measure — append-only results writer.
 *
 * Owns the results-HTML format. `COLUMNS` is the single source of truth for the
 * columns and their order (the fixed team-contract set, plus any project extras
 * at the end). Inserts exactly one <tr> before the <!-- PERF_ROWS --> marker and
 * REFUSES to write if the marker is missing or duplicated, so history can't be
 * silently corrupted.
 *
 * Usage:
 *   node append-row.mjs <payload.json> [--results docs/perf/frontend-runs.html]
 *   node append-row.mjs --self-test        # writes a throwaway doc to verify invariants
 *
 * The payload supplies scenario/throttle/metrics; git + machine + UTC timestamp
 * are derived here so callers can't forget them. Timing fields may be a plain
 * number or a { median, min, max } object — rendered as "median (min–max)".
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import os from "node:os";

const MARKER = "<!-- PERF_ROWS -->";
const DEFAULT_RESULTS = "docs/perf/frontend-runs.html";

// --- Column contract. Order here == column order in the doc. -----------------
// group is cosmetic (header grouping); `fmt` optional per-cell formatter.
export const COLUMNS = [
  // run context
  { key: "utcTimestamp", label: "UTC", group: "context" },
  { key: "scenario", label: "Scenario", group: "context" },
  { key: "gitBranch", label: "Branch", group: "context" },
  { key: "gitCommit", label: "Commit", group: "context" },
  { key: "machine", label: "Machine", group: "context" },
  { key: "chromeVersion", label: "Chrome", group: "context" },
  { key: "cpuThrottle", label: "CPU×", group: "context" },
  { key: "networkPreset", label: "Network", group: "context" },
  { key: "coldWarm", label: "Cache", group: "context" },
  { key: "dataItemCount", label: "Items", group: "context" },
  { key: "runs", label: "N", group: "context" },
  // headline (content-based) — reported as median (min–max)
  { key: "timeToDataRenderedMs", label: "TTData (ms)", group: "headline" },
  { key: "timeToNetworkQuietMs", label: "TTNetQuiet (ms)", group: "headline" },
  // network waterfall
  { key: "dataRequestCount", label: "#Data reqs", group: "network" },
  { key: "slowestDataRequestMs", label: "Slowest req (ms)", group: "network" },
  // reference (not ranked on)
  { key: "ttfbMs", label: "TTFB (ms)", group: "reference" },
  { key: "fcpMs", label: "FCP (ms)", group: "reference" },
  { key: "loadEventMs", label: "load (ms)", group: "reference" },
  { key: "cls", label: "CLS", group: "reference" },
  { key: "lcpMs", label: "LCP (ms)", group: "reference" },
  // memory + weight
  { key: "jsHeapUsedMb", label: "JS heap (MB)", group: "memory" },
  { key: "heapSnapshotMb", label: "Heap snap (MB)", group: "memory" },
  { key: "domNodes", label: "DOM nodes", group: "weight" },
  { key: "resourceCount", label: "#Resources", group: "weight" },
  { key: "transferKb", label: "Transfer (KB)", group: "weight" },
  // free-text last
  { key: "notes", label: "Notes", group: "context" },
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// A cell value can be a number, string, null, or { median, min, max }.
function fmtCell(v) {
  if (v == null) return "—";
  if (typeof v === "object" && "median" in v) {
    const { median, min, max } = v;
    if (median == null) return "—";
    return min == null || max == null || min === max
      ? `${median}`
      : `${median} (${min}–${max})`;
  }
  return String(v);
}

function sh(cmd) {
  try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return ""; }
}

function derivedContext() {
  return {
    utcTimestamp: new Date().toISOString(),
    gitBranch: sh("git rev-parse --abbrev-ref HEAD") || "?",
    gitCommit: sh("git rev-parse --short HEAD") || "?",
    machine: `${os.cpus()?.[0]?.model?.replace(/\s+/g, " ").trim() || "cpu?"} · ${os.cpus()?.length || "?"} cores · ${os.type()} ${os.release()}`,
  };
}

function newDoc() {
  const headCells = COLUMNS.map((c) => `<th title="${esc(c.group)}">${esc(c.label)}</th>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Frontend perf runs — rnd-the-fe</title>
<style>
  body { font: 13px/1.4 system-ui, sans-serif; margin: 24px; color: #111; }
  h1 { font-size: 18px; }
  .note { background: #fff8e1; border: 1px solid #ffe082; padding: 8px 12px; border-radius: 6px; max-width: 900px; }
  table { border-collapse: collapse; margin-top: 16px; font-variant-numeric: tabular-nums; }
  th, td { border: 1px solid #ddd; padding: 4px 8px; white-space: nowrap; text-align: right; }
  th { position: sticky; top: 0; background: #f5f5f5; z-index: 1; }
  td:first-child, td:nth-child(2), th:first-child, th:nth-child(2) { text-align: left; }
  tbody tr:nth-child(even) { background: #fafafa; }
</style>
</head>
<body>
<h1>Frontend performance runs — rnd-the-fe</h1>
<div class="note">
  <strong>How to read this:</strong> the headline ranking metric is
  <strong>TTData</strong> (navigation → the "page ready" content signal) and, when a
  real network layer exists, <strong>TTNetQuiet</strong> (data layer idle). The browser
  <code>load</code> event and <strong>LCP</strong> are recorded for reference only —
  <strong>LCP is often blank for SPAs, which is expected</strong>, not an error, because
  the largest content is client-rendered after first paint. All timings are
  <strong>median of N (min–max)</strong> with the warm-up run dropped. Two rows are only
  comparable when Machine, CPU×, Network, Cache and Items match. Newest rows at the bottom.
</div>
<table>
<thead><tr>${headCells}</tr></thead>
<tbody>
${MARKER}
</tbody>
</table>
</body>
</html>
`;
}

function buildRow(payload) {
  const ctx = derivedContext();
  const full = { ...ctx, ...payload }; // payload may override derived (e.g. notes)
  const cells = COLUMNS.map((c) => {
    const align = c.key === "utcTimestamp" || c.key === "scenario" || c.key === "notes" ? "" : "";
    return `<td>${esc(fmtCell(full[c.key]))}</td>`;
  }).join("");
  return `<tr>${cells}</tr>`;
}

function appendRow(resultsPath, payload) {
  const abs = resolve(resultsPath);
  if (!existsSync(abs)) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, newDoc());
  }
  let html = readFileSync(abs, "utf8");
  const markerCount = html.split(MARKER).length - 1;
  if (markerCount !== 1) {
    throw new Error(`Refusing to write: expected exactly 1 "${MARKER}" marker, found ${markerCount} in ${abs}`);
  }
  const row = buildRow(payload);
  // Insert the new row BEFORE the marker → newest row ends up at the bottom of tbody.
  html = html.replace(MARKER, `${row}\n${MARKER}`);
  writeFileSync(abs, html);
  return abs;
}

// --- self-test: proves create + append-without-corruption invariants ---------
function selfTest() {
  const tmp = resolve(os.tmpdir(), `perf-selftest-${process.pid}.html`);
  const sample = {
    scenario: "self-test",
    chromeVersion: "test",
    cpuThrottle: "6",
    networkPreset: "Fast 3G",
    coldWarm: "warm",
    dataItemCount: 200,
    runs: 5,
    timeToDataRenderedMs: { median: 820, min: 780, max: 910 },
    timeToNetworkQuietMs: null,
    dataRequestCount: 0,
    slowestDataRequestMs: null,
    ttfbMs: 12, fcpMs: 140, loadEventMs: 210, cls: 0.001, lcpMs: null,
    jsHeapUsedMb: 18.4, heapSnapshotMb: null,
    domNodes: 640, resourceCount: 14, transferKb: 512,
    notes: "self-test row",
  };
  appendRow(tmp, sample);
  appendRow(tmp, { ...sample, notes: "second row" });
  const html = readFileSync(tmp, "utf8");
  const markers = html.split(MARKER).length - 1;
  const rows = html.split("<tr>").length - 1 - 1; // minus the thead row
  if (markers !== 1) throw new Error(`self-test FAILED: marker count = ${markers}, expected 1`);
  if (rows !== 2) throw new Error(`self-test FAILED: data row count = ${rows}, expected 2`);
  console.log(`self-test OK → ${tmp} (markers=1, dataRows=2, columns=${COLUMNS.length})`);
}

// --- CLI ---------------------------------------------------------------------
function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test")) return selfTest();

  const resultsIdx = argv.indexOf("--results");
  const resultsPath = resultsIdx >= 0 ? argv[resultsIdx + 1] : DEFAULT_RESULTS;
  const consumed = new Set();
  if (resultsIdx >= 0) { consumed.add(resultsIdx); consumed.add(resultsIdx + 1); }
  const payloadArg = argv.find((a, i) => !consumed.has(i) && !a.startsWith("--"));
  if (!payloadArg) {
    console.error("usage: node append-row.mjs <payload.json> [--results path.html]  |  --self-test");
    process.exit(2);
  }
  const payload = JSON.parse(readFileSync(resolve(payloadArg), "utf8"));
  const abs = appendRow(resultsPath, payload);
  console.log(`appended 1 row → ${abs}`);
}

main();
