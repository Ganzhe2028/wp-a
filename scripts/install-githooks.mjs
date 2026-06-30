#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: "inherit", ...options });
}

run("git", ["config", "core.hooksPath", ".githooks"]);

if (process.platform === "win32") {
  console.warn("[agent-hooks] chmod skipped on Windows. Ensure .githooks/pre-commit and .githooks/pre-push are executable where required.");
} else {
  run("chmod", ["+x", ".githooks/pre-commit"]);
  run("chmod", ["+x", ".githooks/pre-push"]);
}

console.log("[agent-hooks] Git hooks installed with core.hooksPath=.githooks");
