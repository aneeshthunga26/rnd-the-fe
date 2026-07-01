---
name: perf-measure
description: >-
  Measure frontend performance of a page in this project under CPU/network
  throttling and append one row to the shared results doc. Use when asked to
  "measure page performance", "run a perf test", "benchmark this screen",
  "check time-to-network-quiet", or compare a page against previous perf runs.
  Drives real Chrome via the chrome-devtools MCP.
argument-hint: "[scenario-name] (default: all scenarios in scenarios.json)"
---

# perf-measure

Produce **comparable** frontend performance numbers for a page in this project
and append them to `docs/perf/frontend-runs.html`. Part of a team-wide bake-off:
everyone builds their own page but shares one measurement protocol and one
results format, so numbers line up.

## Prerequisites

- **chrome-devtools MCP connected** (`new_page`, `navigate_page`, `emulate_cpu`,
  `performance_start_trace`/`stop`, `take_heapsnapshot`, `evaluate_script`,
  `wait_for`). Verify with `/mcp` before starting.
- Node 20+ and local Chrome.
- The app dev server reachable at `scenarios.json` → `baseUrl`.

## Files (this folder)

- `collect.js` — the deterministic in-page collector, **versioned**
  (`COLLECTOR_VERSION`). Exports `instrumentationSource(config)` (inject BEFORE
  page scripts) and `collectSource()` (evaluate after ready). Read it verbatim
  each run — never hand-write measurement JS.
- `append-row.mjs` — owns the results-HTML format; `COLUMNS` is the single
  source of truth for columns; inserts one `<tr>` before `<!-- PERF_ROWS -->`
  and refuses to write if the marker isn't exactly present once.
- `heap-size.mjs` — `.heapsnapshot` → live MB.
- `scenarios.json` — pages to measure + defaults. `scenarios.example.json` is
  the committed template.
- `perf.local.example.json` — copy to `perf.local.json` (gitignored) only if a
  scenario needs login. This project's page needs none.

## Procedure

1. **Read config.** Load `scenarios.json` (and `perf.local.json` if present).
   Pick the requested scenario, or iterate all. Confirm defaults: CPU 6×,
   network `Fast 3G`, `runs: 5`, drop warm-up.
2. **Build, then serve the production build.** Run `buildCommand` (`pnpm build`)
   to produce `dist/`, then start `runCommand` (`pnpm preview --port 4173
   --strictPort`) in the background and wait for `baseUrl` to respond. Measure
   the **prod build**, never `pnpm dev` — the dev server ships unminified code
   with HMR/transform overhead and is not representative. Put `prod` in the
   row's `notes` so dev-server rows can never be mistaken for prod ones. Rebuild
   whenever the source changed since the last `dist/`.
3. **Open a page** via `new_page`. Capture the Chrome version (for the row).
4. **Install instrumentation before any page script.** Read `collect.js`, call
   `instrumentationSource({ readySelector, readyMinCount, dataRequestUrlPattern })`,
   and register it as an init script that runs on new document (so buffered
   PerformanceObserver entries and the fetch/XHR wrappers are in place before the
   SPA boots — buffered APIs miss post-route-change SPA candidates otherwise).
5. **Throttle** via `emulate_cpu` (6×) and the network preset from config.
6. **Run N times** (default 5), reloading between runs:
   - Navigate to `baseUrl + path`.
   - `wait_for` the `readySelector` to reach `readyMinCount` (the "page ready"
     signal), with a timeout.
   - Evaluate `collectSource()` → the metric JSON. Record `dataItemCount` from
     `dataItemCountSelector`.
   - On the last run, optionally `take_heapsnapshot` → save to
     `docs/perf/<scenario>-<commit>.heapsnapshot` (gitignored) and run
     `heap-size.mjs` for `heapSnapshotMb`.
   - **Renderer crash handling:** under heavy CPU throttle the target can report
     "Target crashed". Detect it, wait for recovery, and **re-run that sample**
     rather than recording a bad one.
7. **Aggregate.** Drop run 1 (warm-up). For the timing metrics
   (`timeToDataRenderedMs`, `timeToNetworkQuietMs`, `slowestDataRequestMs`)
   compute `{ median, min, max }` across the remaining runs. For the rest, take
   the value from the median run.
8. **Append.** Build the payload JSON (scenario, chromeVersion, cpuThrottle,
   networkPreset, coldWarm, dataItemCount, runs, all metric fields, notes) and
   run `node append-row.mjs <payload.json>`. Git branch/commit, machine, and UTC
   timestamp are filled in by the appender.
9. **Report.** Print the headline (TTData median + spread, TTNetQuiet) and
   compare against the previous row for the same scenario (regression/improvement).

## Gotchas (do not skip — hard-won)

- **Never use `load` or LCP as the headline for an SPA.** On a real app `load`
  fired ~441 ms while data finished ~4.2 s, missing 16 post-`load` data calls.
  **LCP is frequently null** for a client-rendered table — that's expected, not a
  bug. Headline = content-based `timeToDataRenderedMs`; primary ranking =
  `timeToNetworkQuietMs` once a real network layer exists.
- **This app has no network data layer yet** — the mock API resolves in memory,
  so `dataRequestUrlPattern` is `null` and `timeToNetworkQuietMs` is `null`.
  That's correct here. Set the pattern to `/graphql` when the real open-mSupply
  server is wired in, and TTNetQuiet becomes the ranking metric.
- **One run is noise** (20–40% swing from cold/warm cache, GC, throttle-induced
  renderer hiccups). Always N runs, drop the warm-up, report median (min–max).
- **Comparability needs context on every row:** machine, CPU×, network preset,
  cold/warm, and **data-item count** must match for two rows to be comparable
  (a 20-row vs 2000-row page is not the same measurement).
- **Determinism:** always inject `collect.js` verbatim; bump `COLLECTOR_VERSION`
  if you change what's collected. Never edit metric JS inline per run.
- **Append-only:** `append-row.mjs` refuses to write without exactly one marker,
  so history can't be silently corrupted. Don't hand-edit the results HTML rows.
