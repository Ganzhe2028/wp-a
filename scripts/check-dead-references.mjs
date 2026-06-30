#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const checks = [
  { label: "retired edit route", pattern: "/edit/" },
  { label: "editToken references", pattern: "editToken" },
  { label: "localStorage favorites", pattern: "localStorage.*收藏|收藏.*localStorage" },
  { label: "publish switch wording", pattern: "发布开关" },
  { label: "who favorited me", pattern: "who favorited me|谁收藏了我" },
];

let warningCount = 0;

for (const check of checks) {
  try {
    const output = execFileSync(
      "rg",
      [
        "-n",
        "--glob",
        "!app/generated/**",
        check.pattern,
        "app",
        "components",
        "lib",
        "docs",
        "README.md",
        "AGENTS.md",
      ],
      { encoding: "utf8" }
    ).trim();
    if (output) {
      warningCount += 1;
      console.warn(`[agent-dead-refs] WARNING ${check.label}:`);
      console.warn(output);
    }
  } catch {
    // rg exits 1 when no matches are found.
  }
}

if (warningCount === 0) {
  console.log("[agent-dead-refs] No dead-reference keywords found.");
} else {
  console.warn(`[agent-dead-refs] ${warningCount} warning group(s). Review whether these are legacy docs or stale references.`);
}
