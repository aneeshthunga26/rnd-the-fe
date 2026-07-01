# perf-measure

Measure this project's page performance under throttling and append one row to a
shared, comparable results doc (`docs/perf/frontend-runs.html`). Built for the
team bake-off: everyone's page differs, but the **measurement protocol** and the
**results format** are identical, so numbers line up.

The headline metric is **time-to-content** (navigation → the real content the
user came for is on screen), not the browser `load` event — see the gotchas in
`SKILL.md` for why.

## One-time setup

1. **Connect the chrome-devtools MCP.** From this worktree:
   ```bash
   claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
   ```
   (or use the committed `.mcp.json` at the repo root). Fully restart Claude
   Code, then confirm with `/mcp` that `chrome-devtools` is **connected**.
   Requires Node 20+ and a local Chrome install.
2. **(Only if a scenario needs auth)** `cp perf.local.example.json perf.local.json`
   and fill it in. `perf.local.json` is gitignored. This project's page needs no
   auth, so you can skip this.
3. Nothing to build — the Node scripts have no dependencies beyond Node itself.

## How to run

In Claude Code (with the MCP connected):

```
/perf-measure                 # measure every scenario in scenarios.json
/perf-measure stocktakes-list # measure one scenario
```

Claude will build (`pnpm build`) and serve the **production** build
(`pnpm preview` on :4173) — never the dev server — then run each scenario **5×**
at **6× CPU** + **Fast 3G**, drop the warm-up, and append one median-of-N row. It then prints the
headline and compares against the previous row for that scenario.

### Run the Node pieces directly (no browser)

```bash
# prove the appender's invariants (creates a throwaway doc, 2 rows, 1 marker)
node .claude/skills/perf-measure/append-row.mjs --self-test

# append a real row from a payload you built
node .claude/skills/perf-measure/append-row.mjs payload.json \
  --results docs/perf/frontend-runs.html

# heap snapshot → live MB
node .claude/skills/perf-measure/heap-size.mjs docs/perf/some.heapsnapshot
```

## Add a scenario

Edit `scenarios.json` and add an entry:

```jsonc
{
  "name": "my-page",                 // friendly id (used in the results row)
  "path": "/my-page",                // appended to baseUrl
  "readySelector": "…",              // CSS selector for the "content is here" element
  "readyMinCount": 1,                // how many must be present to count as ready
  "dataItemCountSelector": "…",      // counted for the "Items" column (comparability)
  "dataRequestUrlPattern": "/graphql" // regex of data calls; null if in-memory/mock
}
```

The "page ready" signal is the important one: pick the element that means the
**real content** is on screen (rows in the table), not first paint.

## Add a metric

1. Extend the returned object in `collect.js` (`collectSource()`), and **bump
   `COLLECTOR_VERSION`** — it's stamped on every row so old/new rows are
   distinguishable.
2. Add a matching `{ key, label, group }` entry to `COLUMNS` in `append-row.mjs`
   (order there == column order in the doc). Keep the fixed team-contract
   columns; add yours at the end.
3. Re-run `--self-test` to confirm the HTML still validates.

## The fixed column contract

Every row carries: UTC · scenario · git branch · commit · machine · Chrome ·
CPU× · network · cold/warm · **data-item count** · N · TTData · TTNetQuiet ·
#data reqs · slowest req · TTFB · FCP · load · CLS · LCP · JS heap · heap-snap ·
DOM nodes · #resources · transfer KB · notes. Timings are **median (min–max)**.
Don't drop these; extra columns are fine. Two rows compare only when machine,
throttle, cache, and item count match.
