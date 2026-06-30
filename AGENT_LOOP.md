# AGENT_LOOP.md

Every coding task follows this loop:

1. Read `PRODUCT_INVARIANTS.md`, `TASK.md`, and relevant docs.
2. Identify whether the task is engineering-only or requires product judgment.
3. Write or confirm acceptance criteria before editing.
4. Make the smallest coherent change.
5. Remove obsolete routes, text, references, and assumptions.
6. Sync docs when product contracts, commands, env vars, or workflows change.
7. Run `npm run agent:check`.
8. If checks fail, fix only the failing class of problem.
9. If protected files changed, stop and generate a review bundle.
10. Final handoff must include commands run and results.

The agent must not claim completion based only on reasoning or visual inspection.
