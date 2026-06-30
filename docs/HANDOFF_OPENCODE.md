# OpenCode Handoff

This repo has a local agent harness for product and engineering guardrails.

## Before editing

- Read `PRODUCT_INVARIANTS.md`, `TASK.md`, and `AGENT_LOOP.md`.
- Treat `docs/04_开发文档_v2.0_账号系统迁移.md` as the current executable product spec.
- Do not change product behavior unless the decision is recorded in `PRODUCT_INVARIANTS.md` or the task explicitly requires it.

## Checks

Run:

```bash
npm run agent:check
```

This runs lint, build, contract checks, env-doc sync checks, stale-reference warnings, doc-sync warnings, and protected-file checks.

## Protected-file review

If protected files changed, generate the bundle:

```bash
npm run agent:review-bundle
```

Send `.agent/review/reviewer-prompt.md` plus the bundle files to an independent reviewer. Do not commit protected changes until review and human approval are complete.
