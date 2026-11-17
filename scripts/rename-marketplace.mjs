#!/usr/bin/env node
// Turns a copy of this template into your own marketplace.
//
//   node scripts/rename-marketplace.mjs <owner/repo> <marketplace-name> [--owner "Your Name"] [--email you@example.com]
//
// Rewrites, in every tracked text file:
//   CarterCole/example-ai-marketplace  ->  <owner/repo>
//   example-ai-marketplace             ->  <marketplace-name>   (install suffix, marketplace name, settings keys)
// and with --owner / --email, the marketplace owner and every plugin's author.
// Symlinks are left alone. Run `node scripts/check.mjs` afterwards.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OLD_REPO = "CarterCole/example-ai-marketplace";
const OLD_NAME = "example-ai-marketplace";
const OLD_OWNER = "Carter Cole";
const OLD_EMAIL = "carter@cartercole.com";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const owner = flag("--owner");
const email = flag("--email");
const [repo, name] = args;

if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? "") || !/^[a-z0-9]+([._-][a-z0-9]+)*$/.test(name ?? "")) {
  console.error('usage: node scripts/rename-marketplace.mjs <owner/repo> <marketplace-name> [--owner "Your Name"] [--email you@example.com]');
  console.error("marketplace-name: lowercase letters, digits, and . _ - between them (it becomes the @suffix in install commands)");
  process.exit(1);
}

// Tracked files that are not symlinks (git mode 120000).
const tracked = execFileSync("git", ["ls-files", "-s"], { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((l) => !l.startsWith("120000"))
  .map((l) => l.split("\t")[1])
  .filter((f) => f !== "scripts/rename-marketplace.mjs");

const changed = [];
for (const file of tracked) {
  const path = join(ROOT, file);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  if (text.includes("\0")) continue; // binary
  let next = text.split(OLD_REPO).join(repo).split(OLD_NAME).join(name);
  if (owner) next = next.split(`"name": "${OLD_OWNER}"`).join(`"name": ${JSON.stringify(owner)}`);
  if (email) next = next.split(OLD_EMAIL).join(email);
  if (next !== text) {
    writeFileSync(path, next);
    changed.push(file);
  }
}

console.log(`Updated ${changed.length} files:`);
for (const f of changed) console.log(`  ${f}`);
console.log(`
Still to do by hand:
  - README.md title and intro, and metadata.description in .claude-plugin/marketplace.json
  - LICENSE copyright line (root and each plugin)
  - remove example plugins you don't want: delete plugins/<name> and its entry in .claude-plugin/marketplace.json
  - node scripts/check.mjs`);
