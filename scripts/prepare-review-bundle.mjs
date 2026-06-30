#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reviewDir = ".agent/review";
mkdirSync(reviewDir, { recursive: true });

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function write(name, content) {
  writeFileSync(join(reviewDir, name), content.endsWith("\n") ? content : `${content}\n`);
}

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    return `Missing ${path}: ${error.message}\n`;
  }
}

function changedFiles() {
  const tracked = git(["diff", "--name-only"]);
  const staged = git(["diff", "--cached", "--name-only"]);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]);
  return [...new Set([...tracked.split(/\r?\n/), ...staged.split(/\r?\n/), ...untracked.split(/\r?\n/)].filter(Boolean))];
}

copyFileSync("TASK.md", join(reviewDir, "task.md"));
copyFileSync("PRODUCT_INVARIANTS.md", join(reviewDir, "invariants.md"));
write("changed-files.txt", changedFiles().join("\n"));

const diff = [
  git(["diff", "--cached", "--binary"]),
  git(["diff", "--binary"]),
].filter(Boolean).join("\n");
write("diff.patch", diff || "No tracked diff captured. Check changed-files.txt for untracked files.");

const check = spawnSync("npm", ["run", "agent:check"], {
  encoding: "utf8",
  env: { ...process.env, AGENT_ALLOW_PROTECTED_CHANGE: "1" },
  shell: process.platform === "win32",
});
write(
  "check.log",
  [
    "$ AGENT_ALLOW_PROTECTED_CHANGE=1 npm run agent:check",
    `exitCode=${check.status ?? 1}`,
    check.stdout ?? "",
    check.stderr ?? "",
  ].join("\n")
);

const protectedCheck = spawnSync("node", ["scripts/check-protected-files.mjs"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});
write(
  "protected-files.txt",
  [
    "$ node scripts/check-protected-files.mjs",
    `exitCode=${protectedCheck.status ?? 1}`,
    protectedCheck.stdout ?? "",
    protectedCheck.stderr ?? "",
  ].join("\n")
);

write(
  "reviewer-prompt.md",
  `# Independent Review Request

You are an independent reviewer. Do not rely on the main coding agent's explanation.

Review these bundle files:

- task.md
- invariants.md
- changed-files.txt
- diff.patch
- check.log
- protected-files.txt

Also apply the reviewer contract below:

${safeRead("REVIEWER.md")}
`
);

console.log(`[agent-review-bundle] Wrote review bundle to ${reviewDir}`);
