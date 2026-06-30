# PRODUCT_INVARIANTS.md

This file records product and engineering invariants that ordinary coding agents must not silently break.

## Product invariants

1. `/loc/{code}` is a low-friction location page. It should be viewable without login. Login is required only when the user tries to favorite someone.
2. `/u/{code}` must not depend on a manual admin approval or hidden publish switch. A profile is displayable when it has enough student-provided content; otherwise it shows the empty/unset state.
3. Admin is responsible for hiding/taking down abnormal content. Admin is not responsible for approving every ordinary student profile.
4. Admin information architecture should follow the operator workflow, not expose API-shaped feature tabs as the primary structure.
5. Offline event reliability matters more than feature richness.

## Engineering invariants

1. The agent must not lower tests, scripts, or checks just to make the task pass.
2. If a product contract changes, docs and scripts must change together.
3. If a route, field, or workflow is retired, old references must be removed or explicitly marked as legacy.
4. Environment variables used by code must be documented in the env template or setup docs.
5. The final response of a coding agent must include exact commands run and their results.

## Protected-file rule

Changes to this file require independent review and human approval.
