#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ignored = new Set(["NODE_ENV", "NEXT_PHASE"]);
const codeTargets = ["app", "components", "lib", "prisma", "prisma.config.ts", "next.config.ts"];
const docTargets = ["README.md", ".env.example", "docs"];
const envVars = new Set();

function scanFile(path) {
  const text = readFileSync(path, "utf8");
  const patterns = [
    /process\.env\.([A-Z0-9_]+)/g,
    /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
    /\benv\(['"]([A-Z0-9_]+)['"]\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const name = match[1];
      if (!ignored.has(name)) envVars.add(name);
    }
  }
}

function filesUnder(target) {
  if (!existsSync(target)) return [];
  try {
    return execFileSync("rg", ["--files", target], { encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [target];
  }
}

for (const target of codeTargets) {
  for (const file of filesUnder(target)) {
    if (/\.(ts|tsx|js|mjs|cjs|prisma)$/.test(file)) {
      scanFile(file);
    }
  }
}

const documentedText = docTargets
  .flatMap(filesUnder)
  .map((file) => {
    try {
      return readFileSync(file, "utf8");
    } catch {
      return "";
    }
  })
  .join("\n");

console.log("[agent-env-sync] Environment variables used by code:");
for (const name of [...envVars].sort()) {
  console.log(`- ${name}`);
}

const missing = [...envVars].sort().filter((name) => !documentedText.includes(name));

if (missing.length > 0) {
  console.error("[agent-env-sync] Environment variables missing from README, .env.example, or docs:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

if (!existsSync(".env.example")) {
  console.warn("[agent-env-sync] WARNING .env.example is missing. Add one before tightening this check.");
}

console.log("[agent-env-sync] Env documentation is in sync.");
