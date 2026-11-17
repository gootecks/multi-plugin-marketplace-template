#!/usr/bin/env node
// Checks that the marketplace works for every vendor.
//
//   node scripts/check.mjs            all checks, plus `claude plugin validate` if claude is installed
//   node scripts/check.mjs --no-cli   skip the claude CLI step
//
// Claude Code's files are the source of truth. This script checks that the
// other vendors' files are either symlinks to them or real copies that agree
// with them, and that nothing would shadow them.

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const useCli = !process.argv.includes("--no-cli");
const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const rel = (p) => relative(ROOT, p) || ".";

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    err(`${rel(path)}: not valid JSON (${e.message})`);
    return null;
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    out.push(p);
    const st = lstatSync(p);
    if (st.isDirectory() && !st.isSymbolicLink()) walk(p, out);
  }
  return out;
}

function frontmatter(path) {
  const text = readFileSync(path, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return fields;
}

// 1. Symlinks: relative, resolvable, and inside the repo.
const files = walk(ROOT);
for (const p of files) {
  if (!lstatSync(p).isSymbolicLink()) continue;
  const target = readlinkSync(p);
  if (target.startsWith("/")) err(`${rel(p)}: symlink uses an absolute path (${target}); use a relative one`);
  if (!existsSync(p)) {
    err(`${rel(p)}: broken symlink -> ${target}`);
    continue;
  }
  const real = realpathSync(p);
  if (!(real + sep).startsWith(realpathSync(ROOT) + sep)) err(`${rel(p)}: symlink points outside the repo`);
}

// 2. Every JSON file parses.
for (const p of files) {
  if (p.endsWith(".json") && existsSync(p) && statSync(p).isFile()) readJson(p);
}

// 3. Marketplace.
const mktPath = join(ROOT, ".claude-plugin/marketplace.json");
const mkt = readJson(mktPath) ?? { plugins: [] };
const cursorMkt = join(ROOT, ".cursor-plugin/marketplace.json");
if (!existsSync(cursorMkt)) err(".cursor-plugin/marketplace.json is missing (symlink it to ../.claude-plugin/marketplace.json)");
else if (!lstatSync(cursorMkt).isSymbolicLink()) warn(".cursor-plugin/marketplace.json is a copy; a symlink keeps it in sync");
for (const shadow of ["marketplace.json", ".plugin/marketplace.json", ".github/plugin/marketplace.json", ".agents/plugins/marketplace.json"]) {
  const p = join(ROOT, shadow);
  if (existsSync(p) && !(lstatSync(p).isSymbolicLink() && realpathSync(p) === realpathSync(mktPath))) {
    err(`${shadow} exists and is not a symlink to .claude-plugin/marketplace.json; Copilot or Codex would read it instead`);
  }
}

const listed = new Map();
for (const entry of mkt.plugins ?? []) {
  if (typeof entry.source !== "string") continue; // remote sources are not checked here
  if (!entry.source.startsWith("./")) err(`marketplace entry ${entry.name}: source must start with "./" for Codex`);
  listed.set(resolve(ROOT, entry.source), entry);
}

const pluginsDir = join(ROOT, "plugins");
for (const name of existsSync(pluginsDir) ? readdirSync(pluginsDir) : []) {
  const dir = join(pluginsDir, name);
  if (!statSync(dir).isDirectory()) continue;
  const where = `plugins/${name}`;
  const entry = listed.get(dir);
  listed.delete(dir);
  if (!entry) err(`${where}: not listed in .claude-plugin/marketplace.json`);

  const manifestPath = join(dir, ".claude-plugin/plugin.json");
  if (!existsSync(manifestPath)) {
    err(`${where}: missing .claude-plugin/plugin.json`);
    continue;
  }
  const manifest = readJson(manifestPath) ?? {};
  if (manifest.name !== name) err(`${where}: plugin.json name "${manifest.name}" does not match the folder name`);
  if (entry && entry.name !== manifest.name) err(`${where}: marketplace name "${entry.name}" != plugin.json name "${manifest.name}"`);
  if (entry?.version && entry.version !== manifest.version) err(`${where}: marketplace version ${entry.version} != plugin.json version ${manifest.version}`);

  // Official-marketplace convention: every plugin ships its own README and LICENSE,
  // because only the plugin folder is copied on install.
  for (const f of ["README.md", "LICENSE"]) {
    if (!existsSync(join(dir, f))) err(`${where}: missing ${f}`);
  }

  // These manifests outrank .claude-plugin/plugin.json in Copilot and Codex
  // (root plugin.json also switches them to the Agent Plugins format). Never use them.
  for (const shadow of ["plugin.json", ".plugin/plugin.json"]) {
    const p = join(dir, shadow);
    if (existsSync(p) && !(lstatSync(p).isSymbolicLink() && realpathSync(p) === realpathSync(manifestPath))) {
      err(`${where}/${shadow} would be read instead of .claude-plugin/plugin.json; remove it`);
    }
  }

  // Vendor overlays: a symlink to Claude's manifest, or a real file whose
  // metadata matches it and whose component paths exist.
  const hasClaudeHooks = existsSync(join(dir, "hooks/hooks.json"));
  const overlays = {
    ".cursor-plugin/plugin.json": "Cursor",
    ".github/plugin/plugin.json": "Copilot",
    ".codex-plugin/plugin.json": "Codex",
  };
  const realOverlay = {};
  for (const [file, vendor] of Object.entries(overlays)) {
    const p = join(dir, file);
    if (!existsSync(p)) continue;
    if (lstatSync(p).isSymbolicLink()) {
      if (realpathSync(p) !== realpathSync(manifestPath)) err(`${where}/${file}: symlink must point to ../.claude-plugin/plugin.json`);
      continue;
    }
    const o = readJson(p) ?? {};
    realOverlay[vendor] = o;
    for (const key of ["name", "version", "description"]) {
      if (o[key] !== manifest[key]) err(`${where}/${file}: ${key} "${o[key]}" != Claude's "${manifest[key]}"`);
    }
    if (JSON.stringify(o.author) !== JSON.stringify(manifest.author)) err(`${where}/${file}: author differs from Claude's`);
    for (const key of ["skills", "agents", "commands", "hooks", "mcpServers", "lspServers"]) {
      for (const path of [o[key]].flat()) {
        if (typeof path === "string" && !existsSync(join(dir, path))) err(`${where}/${file}: ${key} path ${path} does not exist`);
      }
    }
  }

  // Cursor needs its own manifest; if the plugin has hooks it must be a real
  // file pointing at a Cursor-format hooks file.
  if (!existsSync(join(dir, ".cursor-plugin/plugin.json"))) err(`${where}: missing .cursor-plugin/plugin.json`);
  else if (hasClaudeHooks && !realOverlay.Cursor) err(`${where}: has hooks, so .cursor-plugin/plugin.json must be a real file with "hooks" pointing at a Cursor hooks file`);
  else if (hasClaudeHooks && !realOverlay.Cursor.hooks) err(`${where}/.cursor-plugin/plugin.json: needs "hooks", or Cursor reads the Claude-format hooks/hooks.json`);
  if (realOverlay.Cursor && existsSync(join(dir, ".mcp.json")) && !realOverlay.Cursor.mcpServers) {
    warn(`${where}/.cursor-plugin/plugin.json: Cursor looks for mcp.json; set "mcpServers": "./.mcp.json"`);
  }

  // Copilot has no default commands folder.
  const copilot = realOverlay.Copilot ?? manifest;
  if (existsSync(join(dir, "commands")) && !copilot.commands) {
    warn(`${where}: has commands/ but no "commands" field for Copilot, so Copilot will not load them`);
  }

  // Scripts referenced from hook and MCP files exist.
  const refFiles = [".mcp.json", ...(existsSync(join(dir, "hooks")) ? readdirSync(join(dir, "hooks")).filter((f) => f.endsWith(".json")).map((f) => `hooks/${f}`) : [])];
  for (const refFile of refFiles) {
    const p = join(dir, refFile);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const m of text.matchAll(/(?:\$\{(?:CLAUDE_|CURSOR_|COPILOT_)?PLUGIN_ROOT\}|\.)\/([\w./-]+\.\w+)/g)) {
      if (!existsSync(join(dir, m[1]))) err(`${where}/${refFile}: references ${m[1]}, which does not exist`);
    }
  }

  // Skills follow the Agent Skills spec, which every vendor reads.
  const skillsDir = join(dir, "skills");
  for (const skill of existsSync(skillsDir) ? readdirSync(skillsDir) : []) {
    const md = join(skillsDir, skill, "SKILL.md");
    if (!existsSync(md)) {
      err(`${where}/skills/${skill}: missing SKILL.md`);
      continue;
    }
    const fm = frontmatter(md);
    if (!fm) err(`${where}/skills/${skill}/SKILL.md: missing frontmatter`);
    else {
      if (fm.name !== skill) err(`${where}/skills/${skill}/SKILL.md: name "${fm.name}" must match the folder name`);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skill) || skill.length > 64) err(`${where}/skills/${skill}: name must be lowercase a-z, 0-9 and single hyphens, 64 chars max`);
      if (!fm.description) err(`${where}/skills/${skill}/SKILL.md: missing description`);
      else if (fm.description.length > 1024) err(`${where}/skills/${skill}/SKILL.md: description is over 1024 characters`);
    }
  }
}
for (const [dir, entry] of listed) err(`marketplace entry ${entry.name}: source ${rel(dir)} does not exist`);

// 4. Project-level copies that can't be symlinks (different file, same content) stay in sync.
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const p of files) {
  if (!existsSync(p) || lstatSync(p).isSymbolicLink()) continue;
  const project = dirname(dirname(p));
  if (p.endsWith(join(".claude", "settings.json"))) {
    const settings = readJson(p) ?? {};
    const codexHooks = join(project, ".codex/hooks.json");
    if (settings.hooks && existsSync(codexHooks) && !sameJson((readJson(codexHooks) ?? {}).hooks, settings.hooks)) {
      err(`${rel(codexHooks)}: "hooks" differs from ${rel(p)}`);
    }
  }
  if (p.endsWith(join(".gemini", "settings.json"))) {
    const gemini = readJson(p) ?? {};
    const mcp = join(project, ".mcp.json");
    if (gemini.mcpServers && existsSync(mcp) && !sameJson(gemini.mcpServers, (readJson(mcp) ?? {}).mcpServers)) {
      err(`${rel(p)}: "mcpServers" differs from ${rel(mcp)}`);
    }
  }
}

// 5. Relative links in Markdown point at files that exist.
for (const p of files) {
  if (!p.endsWith(".md") || !existsSync(p) || !statSync(p).isFile()) continue;
  const text = readFileSync(p, "utf8").replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = resolve(dirname(p), decodeURIComponent(href.split("#")[0]));
    if (!existsSync(target)) err(`${rel(p)}: link to ${href} is broken`);
  }
}

// 6. Claude Code's own validator.
if (useCli) {
  let haveClaude = true;
  try {
    execFileSync("claude", ["--version"], { stdio: "ignore" });
  } catch {
    haveClaude = false;
    warn("claude CLI not found; skipped `claude plugin validate` (install it or pass --no-cli)");
  }
  if (haveClaude) {
    const targets = [ROOT, ...[...(mkt.plugins ?? [])].filter((e) => typeof e.source === "string").map((e) => resolve(ROOT, e.source))];
    for (const t of targets) {
      try {
        execFileSync("claude", ["plugin", "validate", "--strict", t], { stdio: "pipe", encoding: "utf8" });
      } catch (e) {
        err(`claude plugin validate --strict ${rel(t)} failed:\n${(e.stdout || "") + (e.stderr || "")}`.trim());
      }
    }
  }
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`error ${e}`);
console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `ok (${warnings.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
