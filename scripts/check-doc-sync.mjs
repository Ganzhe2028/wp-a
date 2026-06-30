#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function list(output) {
  return output.split(/\r?\n/).filter(Boolean);
}

const staged = list(git(["diff", "--cached", "--name-only"]));
const files =
  staged.length > 0
    ? staged
    : [...new Set([...list(git(["diff", "--name-only"])), ...list(git(["ls-files", "--others", "--exclude-standard"]))])];

const changedDocs = files.some((file) => file === "README.md" || file === "AGENTS.md" || file.startsWith("docs/"));
const warnings = [];

if (files.includes("prisma/schema.prisma") && !changedDocs) {
  warnings.push("prisma/schema.prisma changed; check whether data model docs need updates.");
}

if (files.some((file) => file.startsWith("app/api/")) && !changedDocs) {
  warnings.push("app/api changed; check whether API docs need updates.");
}

if (
  files.some((file) => /^app\/(loc|u|admin)(\/.*)?\/page\.tsx$/.test(file) || /^app\/(loc|u|admin)\//.test(file)) &&
  !changedDocs
) {
  warnings.push("core route UI changed; check PRD, handoff docs, and invariants.");
}

if (warnings.length === 0) {
  console.log("[agent-doc-sync] No doc sync warnings.");
} else {
  for (const warning of warnings) {
    console.warn(`[agent-doc-sync] WARNING ${warning}`);
  }
}
