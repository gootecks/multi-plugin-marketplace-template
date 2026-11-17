#!/usr/bin/env node
// Prints the last N kitchen-sink hook events and a count per tool and event.
//   node summarize.mjs [N]

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG = process.env.KITCHEN_SINK_LOG || join(homedir(), ".kitchen-sink", "events.jsonl");
const limit = Math.max(Number(process.argv[2]) || 20, 1);

let events;
try {
  events = readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
} catch {
  console.log(`No events logged yet (${LOG}).`);
  process.exit(0);
}

const recent = events.slice(-limit);
console.log(`Last ${recent.length} of ${events.length} events in ${LOG}\n`);
for (const e of recent) {
  const extra = [e.tool && `tool=${e.tool}`, e.source && `source=${e.source}`].filter(Boolean).join(" ");
  console.log(`${e.ts}  ${e.vendor.padEnd(8)} ${e.event.padEnd(22)} ${extra}`);
}

const counts = new Map();
for (const e of events) {
  const key = `${e.vendor} ${e.event}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
console.log("\nAll events by tool:");
for (const [key, n] of [...counts].sort()) console.log(`  ${String(n).padStart(5)}  ${key}`);
