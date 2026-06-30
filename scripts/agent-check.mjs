#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const checks = [
  { label: "lint", command: "npm", args: ["run", "lint"], required: true },
  { label: "build", command: "npm", args: ["run", "build"], required: true },
  {
    label: "agent contract",
    command: "node",
    args: ["scripts/verify-agent-contract.mjs"],
    required: true,
  },
  {
    label: "dead references",
    command: "node",
    args: ["scripts/check-dead-references.mjs"],
    required: true,
  },
  {
    label: "env sync",
    command: "node",
    args: ["scripts/check-env-sync.mjs"],
    required: true,
  },
  {
    label: "doc sync",
    command: "node",
    args: ["scripts/check-doc-sync.mjs"],
    required: true,
  },
  {
    label: "protected files",
    command: "node",
    args: ["scripts/check-protected-files.mjs"],
    required: true,
  },
];

function packageScriptExists(name) {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  return Boolean(packageJson.scripts?.[name]);
}

function runCheck(check) {
  if (check.npmScript && !packageScriptExists(check.npmScript)) {
    console.log(`[agent-check] SKIP ${check.label}: npm script "${check.npmScript}" does not exist.`);
    return true;
  }

  console.log(`\n[agent-check] Running ${check.label}...`);
  const result = spawnSync(check.command, check.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status === 0) {
    console.log(`[agent-check] PASS ${check.label}`);
    return true;
  }

  const status = result.status ?? 1;
  console.error(`[agent-check] FAIL ${check.label}: command exited with ${status}`);
  return !check.required;
}

let ok = true;
for (const check of checks) {
  ok = runCheck(check) && ok;
}

if (!ok) {
  console.error("\n[agent-check] One or more required checks failed.");
  process.exit(1);
}

console.log("\n[agent-check] All required checks passed.");
