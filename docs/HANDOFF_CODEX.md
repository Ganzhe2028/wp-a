# Codex Handoff

This repo uses a minimal agent harness. Read these files before editing:

1. `PRODUCT_INVARIANTS.md`
2. `TASK.md`
3. `AGENT_LOOP.md`
4. Relevant docs under `docs/`

## Required loop

1. Fill or confirm `TASK.md`.
2. Make the smallest coherent code change.
3. Update docs when behavior, commands, env vars, or workflows change.
4. Run `npm run agent:check`.
5. If protected files changed, run `npm run agent:review-bundle` and stop for independent review.

## Protected files

Protected files are listed in `.agent/protected-files.json`. They are not forbidden to change, but they require independent review and human approval before commit.

Use this only on the explicit approval path:

```bash
AGENT_ALLOW_PROTECTED_CHANGE=1 npm run agent:check
```

## Final handoff

Include exact commands run, their results, whether protected files changed, and whether human approval is needed.
