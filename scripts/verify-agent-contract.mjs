#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const requiredFiles = [
  "PRODUCT_INVARIANTS.md",
  "TASK.md",
  "REVIEWER.md",
  "AGENT_LOOP.md",
  ".agent/protected-files.json",
  ".githooks/pre-commit",
  ".githooks/pre-push",
];

let ok = true;

for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`[agent-verify] OK ${file}`);
  } else {
    console.error(`[agent-verify] Missing required file: ${file}`);
    ok = false;
  }
}

try {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  if (packageJson.scripts?.["agent:check"]) {
    console.log("[agent-verify] OK package.json scripts.agent:check");
  } else {
    console.error("[agent-verify] Missing package.json script: agent:check");
    ok = false;
  }
} catch (error) {
  console.error(`[agent-verify] Could not read package.json: ${error.message}`);
  ok = false;
}

function rg(pattern) {
  try {
    return execFileSync("rg", ["-n", pattern, "app", "lib", "components", "docs", "README.md", "AGENTS.md"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

const warnings = [
  {
    name: "/loc login gate references",
    output: rg("Both `/u|/loc[^\\n]*(require login|强制登录|session gate)"),
  },
  {
    name: "published display assumptions",
    output: rg("published.*唯一|manual admin approval|hidden publish switch"),
  },
  {
    name: "settings page claims",
    output: rg("设置页|settings page"),
  },
];

for (const warning of warnings) {
  if (warning.output) {
    console.warn(`[agent-verify] WARNING ${warning.name}:`);
    console.warn(warning.output);
  }
}

if (!ok) {
  process.exit(1);
}

console.log("[agent-verify] Agent contract is present.");
