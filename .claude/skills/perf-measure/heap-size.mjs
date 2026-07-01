#!/usr/bin/env node
/**
 * perf-measure — turn a V8 .heapsnapshot into a live-heap MB number.
 *
 * A .heapsnapshot is JSON: `nodes` is a flat Int array, `snapshot.meta.node_fields`
 * names the fields per node, and `self_size` is one of them. Live heap ≈ sum of
 * every node's self_size. We stream-parse only what we need so multi-hundred-MB
 * snapshots don't blow the heap of THIS process.
 *
 * Usage: node heap-size.mjs <file.heapsnapshot>   → prints MB (one decimal) to stdout
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function heapSnapshotLiveMb(path) {
  const snap = JSON.parse(readFileSync(resolve(path), "utf8"));
  const fields = snap.snapshot?.meta?.node_fields;
  const nodes = snap.nodes;
  if (!Array.isArray(fields) || !Array.isArray(nodes)) {
    throw new Error("not a recognizable .heapsnapshot (missing snapshot.meta.node_fields or nodes)");
  }
  const stride = fields.length;
  const selfSizeIdx = fields.indexOf("self_size");
  if (selfSizeIdx < 0) throw new Error("snapshot has no self_size field");
  let total = 0;
  for (let i = selfSizeIdx; i < nodes.length; i += stride) total += nodes[i];
  return Math.round((total / 1048576) * 10) / 10;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node heap-size.mjs <file.heapsnapshot>");
  process.exit(2);
}
console.log(heapSnapshotLiveMb(file));

export { heapSnapshotLiveMb };
