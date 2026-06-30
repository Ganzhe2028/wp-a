#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const configPath = ".agent/protected-files.json";
const config = JSON.parse(readFileSync(configPath, "utf8"));
const protectedPatterns = config.protected ?? [];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function lines(output) {
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function changedFiles() {
  const staged = lines(git(["diff", "--cached", "--name-only"]));
  if (staged.length > 0) {
    return { mode: "staged", files: staged };
  }

  const working = lines(git(["diff", "--name-only"]));
  const untracked = lines(git(["ls-files", "--others", "--exclude-standard"]));
  return { mode: "working tree", files: [...new Set([...working, ...untracked])] };
}

function matchesPattern(file, pattern) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return file === prefix.slice(0, -1) || file.startsWith(prefix);
  }
  return file === pattern;
}

export function findProtectedFiles(files) {
  return files.filter((file) =>
    protectedPatterns.some((pattern) => matchesPattern(file, pattern))
  );
}

const { mode, files } = changedFiles();
const protectedFiles = findProtectedFiles(files);

if (protectedFiles.length === 0) {
  console.log(`[agent-protected] No protected files changed in ${mode}.`);
  process.exit(0);
}

console.error(`[agent-protected] Protected files changed in ${mode}:`);
for (const file of protectedFiles) {
  console.error(`- ${file}`);
}

if (process.env.AGENT_ALLOW_PROTECTED_CHANGE === "1") {
  console.error(
    "[agent-protected] AGENT_ALLOW_PROTECTED_CHANGE=1 is set. Continuing on the explicit human-approval path."
  );
  process.exit(0);
}

console.error(
  "\n[agent-protected] Run `npm run agent:review-bundle` and request independent review before committing protected changes."
);
process.exit(1);
