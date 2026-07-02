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
  { key: "initialJsKb", label: "Initial JS (KB gz)", group: "weight" },
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

// Column index (1-based) helpers derived from COLUMNS, so CSS nth-child rules
// stay correct if the column set ever changes.
const colIndex = (key) => COLUMNS.findIndex((c) => c.key === key) + 1;
const TEXT_COLS = ["utcTimestamp", "scenario", "gitBranch", "gitCommit", "machine", "networkPreset", "coldWarm", "notes"];

// Two-tier <thead>: a top row of group bands (colspan) + a bottom row of labels.
// Consecutive columns sharing a `group` collapse into one band; a lone trailing
// notes column is labelled "Notes" rather than repeating its group.
function groupedHead() {
  const NAMES = { context: "Context", headline: "Headline", network: "Network", reference: "Reference (not ranked)", memory: "Memory", weight: "Weight" };
  const runs = [];
  for (const c of COLUMNS) {
    const last = runs[runs.length - 1];
    if (last && last.group === c.group) last.cols.push(c);
    else runs.push({ group: c.group, cols: [c] });
  }
  const bands = runs
    .map((r) => {
      const isNotes = r.cols.length === 1 && r.cols[0].key === "notes";
      const g = isNotes ? "notes" : r.group;
      const label = isNotes ? "Notes" : NAMES[r.group] || r.group;
      return `<th class="grp g-${g}" colspan="${r.cols.length}">${esc(label)}</th>`;
    })
    .join("");
  const labels = COLUMNS.map((c) => {
    const g = c.key === "notes" ? "notes" : c.group;
    return `<th class="lbl g-${g}">${esc(c.label)}</th>`;
  }).join("");
  return `<tr class="grp">${bands}</tr>\n<tr class="lbl">${labels}</tr>`;
}

// Production-dependency footprint. Each package bundled ALONE (esbuild, minified,
// peers external, `import *`) → its full standalone gzipped cost, independent of
// which slice this app tree-shakes onto any one route. Bytes; snapshot below.
// Refresh with: node .claude/skills/perf-measure/dep-sizes.mjs (see README).
const PROD_DEPS_SNAPSHOT = { commit: "9d6d78a", tool: "esbuild --bundle --minify (peers external, import *)" };
const PROD_DEPS = [
  { name: "@kobalte/core", ver: "0.13.11", min: 253149, gz: 74133 },
  { name: "@tanstack/solid-table", ver: "8.21.3", min: 58156, gz: 15668 },
  { name: "@tanstack/solid-query", ver: "5.101.2", min: 46297, gz: 13944 },
  { name: "@solidjs/router", ver: "0.15.4", min: 23983, gz: 9606 },
  { name: "solid-js", ver: "1.9.13", min: 22267, gz: 8629 },
  { name: "@tanstack/solid-virtual", ver: "3.13.31", min: 23669, gz: 7253 },
  { name: "@0no-co/graphql.web", ver: "1.3.2", min: 12110, gz: 4010 },
  { name: "@solid-primitives/i18n", ver: "2.2.1", min: 1676, gz: 753 },
  { name: "gql.tada", ver: "1.11.2", min: 1226, gz: 695 },
];

function depsSection() {
  const kb = (b) => (b / 1024).toFixed(1);
  const maxGz = Math.max(...PROD_DEPS.map((d) => d.gz));
  const totalGz = PROD_DEPS.reduce((s, d) => s + d.gz, 0);
  const totalMin = PROD_DEPS.reduce((s, d) => s + d.min, 0);
  const rows = PROD_DEPS.map((d) => {
    const pct = ((d.gz / maxGz) * 100).toFixed(1);
    return `<tr class="dep"><td class="pkg">${esc(d.name)}</td><td class="ver">${esc(d.ver)}</td>` +
      `<td>${kb(d.min)}</td><td class="gz">${kb(d.gz)}</td>` +
      `<td class="bar"><span class="barfill" style="width:${pct}%"></span></td></tr>`;
  }).join("\n");
  return `<h2 class="h2">Production dependencies <span class="h2sub">— standalone gzipped size</span></h2>
<p class="sub">Each package bundled on its own (${esc(PROD_DEPS_SNAPSHOT.tool)}): its <strong>full-package</strong> cost,
not the tree-shaken slice this app actually ships. Sorted by gzipped size. Snapshot at commit <code>${esc(PROD_DEPS_SNAPSHOT.commit)}</code>.</p>
<div class="card deps">
<table>
<thead><tr class="lbl"><th>Package</th><th>Version</th><th>Min (KB)</th><th>Gzip (KB)</th><th class="barh">Relative (gz)</th></tr></thead>
<tbody>
${rows}
<tr class="total"><td class="pkg">Total (${PROD_DEPS.length} deps)</td><td></td><td>${kb(totalMin)}</td><td class="gz">${kb(totalGz)}</td><td></td></tr>
</tbody>
</table>
</div>`;
}

function newDoc() {
  const textRule = TEXT_COLS.map((k) => `td:nth-child(${colIndex(k)}), .lbl:nth-child(${colIndex(k)})`).join(", ");
  const hi1 = colIndex("timeToDataRenderedMs");
  const hi2 = colIndex("timeToNetworkQuietMs");
  const notesCol = colIndex("notes");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Frontend perf runs — rnd-the-fe</title>
<style>
  :root {
    --bg: #f4f5f7; --panel: #fff; --ink: #1f2430; --muted: #6b7280; --line: #e6e8ec;
    --accent: #2563eb; --accent-soft: rgba(37, 99, 235, 0.07);
    --g-context: #eef1f5; --g-headline: #fff3e0; --g-network: #e9f6ee;
    --g-reference: #f1eefb; --g-memory: #e8f2fb; --g-weight: #f7efe9; --g-notes: #f0f2f5;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; background: var(--bg); color: var(--ink);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 1440px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 650; margin: 0 0 2px; }
  .sub { color: var(--muted); font-size: 13px; margin: 0 0 20px; }
  .legend { background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
    padding: 14px 18px; margin-bottom: 18px; max-width: 980px; font-size: 13px; line-height: 1.65;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04); }
  .legend strong { color: var(--ink); }
  .legend code { background: #f0f2f5; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
  .legend .k { display: inline-block; margin-right: 14px; white-space: nowrap; }
  .legend .sw { display: inline-block; width: 10px; height: 10px; border-radius: 3px;
    vertical-align: -1px; margin-right: 5px; border: 1px solid rgba(0,0,0,.06); }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06); overflow: auto; max-height: 82vh; }
  table { border-collapse: separate; border-spacing: 0; width: 100%;
    font-variant-numeric: tabular-nums; white-space: nowrap; }
  th, td { padding: 8px 12px; border-bottom: 1px solid var(--line); text-align: right; }
  td { color: #374151; }
  /* sticky two-tier header */
  thead th { position: sticky; z-index: 2; background: var(--panel); }
  thead tr.grp th { top: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; color: #55607a; text-align: center; padding: 7px 12px;
    border-bottom: 1px solid var(--line); }
  thead tr.lbl th { top: 34px; font-size: 11.5px; font-weight: 600; color: #4b5563;
    border-bottom: 2px solid #d7dbe2; }
  /* group tints on the band row */
  .grp.g-context { background: var(--g-context); } .grp.g-headline { background: var(--g-headline); }
  .grp.g-network { background: var(--g-network); } .grp.g-reference { background: var(--g-reference); }
  .grp.g-memory { background: var(--g-memory); } .grp.g-weight { background: var(--g-weight); }
  .grp.g-notes { background: var(--g-notes); }
  /* body rows */
  tbody tr:nth-child(even) { background: #fafbfc; }
  tbody tr:hover { background: #eef4ff; }
  tbody tr:last-child td { border-bottom: none; }
  /* left-align the text columns (both label header + body) */
  ${textRule} { text-align: left; }
  /* headline emphasis */
  td:nth-child(${hi1}), td:nth-child(${hi2}) { background: var(--accent-soft); font-weight: 650; color: #0f1b3d; }
  .lbl:nth-child(${hi1}), .lbl:nth-child(${hi2}) { color: var(--accent); }
  tbody tr:hover td:nth-child(${hi1}), tbody tr:hover td:nth-child(${hi2}) { background: rgba(37,99,235,.12); }
  /* commit is a stable id → monospace */
  td:nth-child(4) { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
  /* notes: wrap + de-emphasise */
  td:nth-child(${notesCol}) { white-space: normal; min-width: 320px; max-width: 460px;
    color: var(--muted); font-size: 12px; line-height: 1.5; }
  /* --- production dependencies section --- */
  .h2 { font-size: 16px; font-weight: 650; margin: 28px 0 3px; }
  .h2sub { color: var(--muted); font-weight: 400; font-size: 13px; }
  .deps { max-width: 720px; }
  .deps table { width: 100%; }
  .deps th { text-align: right; font-size: 11.5px; font-weight: 600; color: #4b5563;
    border-bottom: 2px solid #d7dbe2; }
  .deps th:first-child, .deps th:nth-child(2), .deps th.barh { text-align: left; }
  .deps td { text-align: right; }
  .deps td.pkg { text-align: left; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; color: var(--ink); }
  .deps td.ver { text-align: left; color: var(--muted); font-size: 12px; }
  .deps td.gz { font-weight: 650; color: var(--accent); }
  .deps td.bar { width: 240px; padding-right: 16px; }
  .deps .barfill { display: block; height: 14px; border-radius: 3px;
    background: linear-gradient(90deg, #60a5fa, #2563eb); min-width: 2px; }
  .deps tbody tr:hover { background: #f6f9ff; }
  .deps tr.total td { font-weight: 650; color: var(--ink); border-top: 2px solid #d7dbe2; border-bottom: none; }
  .deps tr.total td.gz { color: var(--accent); }
</style>
</head>
<body>
<div class="wrap">
<h1>Frontend performance runs — rnd-the-fe</h1>
<p class="sub">Stocktakes screen · warm cache · 6× CPU / Fast 3G · median of N (min–max), warm-up dropped · newest at the bottom.</p>
<div class="legend">
  <strong>How to read this.</strong> The headline ranking metric is <strong>TTData</strong>
  (navigation → the "page ready" content signal); once a real network layer exists,
  <strong>TTNetQuiet</strong> (data layer idle) is the primary rank. The <code>load</code> event and
  <strong>LCP</strong> are reference-only — <strong>LCP is often blank for SPAs</strong> (expected, not an
  error), since the largest content is client-rendered after first paint. Two rows are comparable only when
  <strong>Machine, CPU×, Network, Cache and Items</strong> match; rows tagged <code>[ON BATTERY]</code> are
  not comparable to AC rows.
  <div style="margin-top:10px">
    <span class="k"><span class="sw" style="background:var(--g-headline)"></span>Headline</span>
    <span class="k"><span class="sw" style="background:var(--g-network)"></span>Network</span>
    <span class="k"><span class="sw" style="background:var(--g-reference)"></span>Reference</span>
    <span class="k"><span class="sw" style="background:var(--g-memory)"></span>Memory</span>
    <span class="k"><span class="sw" style="background:var(--g-weight)"></span>Weight</span>
  </div>
</div>
<div class="card">
<table>
<thead>
${groupedHead()}
</thead>
<tbody>
${MARKER}
</tbody>
</table>
</div>
${depsSection()}
</div>
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

// Re-emit the document shell (styles + header) around the EXISTING data rows.
// Presentation-only: preserves every <tr> verbatim and keeps exactly one marker,
// so history is untouched. Use after changing newDoc()/COLUMNS styling.
function reformat(resultsPath) {
  const abs = resolve(resultsPath);
  if (!existsSync(abs)) throw new Error(`Nothing to reformat: ${abs} does not exist`);
  const html = readFileSync(abs, "utf8");
  const markerCount = html.split(MARKER).length - 1;
  if (markerCount !== 1) {
    throw new Error(`Refusing to reformat: expected exactly 1 "${MARKER}" marker, found ${markerCount} in ${abs}`);
  }
  // Data rows = the lines between <tbody> and the marker.
  const tbodyOpen = html.indexOf("<tbody>");
  if (tbodyOpen < 0) throw new Error(`Refusing to reformat: no <tbody> in ${abs}`);
  const rowsStart = html.indexOf("\n", tbodyOpen) + 1;
  const rows = html.slice(rowsStart, html.indexOf(MARKER)).trim();
  const fresh = newDoc().replace(MARKER, rows ? `${rows}\n${MARKER}` : MARKER);
  writeFileSync(abs, fresh);
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
  // Data rows emit a bare `<tr>`; header rows are `<tr class="…">`, so a split on
  // the exact `<tr>` token counts data rows only (independent of header shape).
  const rows = html.split("<tr>").length - 1;
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

  if (argv.includes("--reformat")) {
    const abs = reformat(resultsPath);
    console.log(`reformatted (rows preserved) → ${abs}`);
    return;
  }

  const consumed = new Set();
  if (resultsIdx >= 0) { consumed.add(resultsIdx); consumed.add(resultsIdx + 1); }
  const payloadArg = argv.find((a, i) => !consumed.has(i) && !a.startsWith("--"));
  if (!payloadArg) {
    console.error("usage: node append-row.mjs <payload.json> [--results path.html]  |  --reformat [--results path.html]  |  --self-test");
    process.exit(2);
  }
  const payload = JSON.parse(readFileSync(resolve(payloadArg), "utf8"));
  const abs = appendRow(resultsPath, payload);
  console.log(`appended 1 row → ${abs}`);
}

main();
