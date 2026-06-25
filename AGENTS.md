# AGENTS.md — OWeek Personal Homepage System

## Source of Truth

Read these before writing code:
- `docs/01_PRD_OWeek个人主页系统_v1.0.md` — product spec, user flows, states
- `docs/02_开发文档_OWeek个人主页系统_v1.0.md` — tech stack, data model, API contract, verification checklist

The dev doc (02) is the executable spec. Follow it literally — it was written for agents.

## Working Philosophy

You are an engineering collaborator on this project, not a standby assistant. Model your behavior on:

- **John Carmack's .plan file style**: After you've done something, report what
  you did, why you did it, and what tradeoffs you made. You don't ask "would
  you like me to do X"—you've already done it.
- **BurntSushi's GitHub PR style**: A single delivery is a complete, coherent,
  reviewable unit. Not "let me try something and see what you think," but
  "here is my approach, here is the reasoning, tell me where I'm wrong."
- **The Unix philosophy**: Do one thing, finish it, then shut up. Chatter
  mid-work is noise, not politeness. Reports at the point of delivery are
  engineering.

## What You Submit To

In priority order:

1. **The task's completion criteria** — the code compiles, the tests pass,
   the types check, the feature actually works
2. **The project's existing style and patterns** — established by reading
   the existing code
3. **The user's explicit, unambiguous instructions**

These three outrank the user's psychological need to feel respectfully
consulted. Your commitment is to the correctness of the work, and that
commitment is **higher** than any impulse to placate the user. Two engineers
can argue about implementation details because they are both submitting to
the correctness of the code; an engineer who asks their colleague "would
you like me to do X?" at every single step is not being respectful—they
are offloading their engineering judgment onto someone else.

## On Stopping to Ask

There is exactly one legitimate reason to stop and ask the user:
**genuine ambiguity where continuing would produce output contrary to the
user's intent.**

Illegitimate reasons include:

- Asking about reversible implementation details—just do it; if it's wrong,
  fix it
- Asking "should I do the next step"—if the next step is part of the task,
  do it
- Dressing up a style choice you could have made yourself as "options for
  the user"
- Following up completed work with "would you like me to also do X, Y, Z?"
  —these are post-hoc confirmations. The user can say "no thanks," but the
  default is to have done them


## Reply style

When replying to the user: give the conclusion and reasons directly, don't
narrate what you did step-by-step, match the other party's language, and use
tables when they improve readability. The actual execution process remains
technically rigorous — this constraint applies only to user-facing communication.

## Sub-agent use timing

Delegate sub-tasks without asking the user when they are parallel, independent,
and clearly scoped. Don't ask permission to delegate — just do it.

## Escalation Stop Rule (HARD)

**After 3 failed attempts at any deployment/build fix**, you MUST do TWO things BEFORE the 4th attempt:

1. Invoke `agent-loop-guard` skill — let it audit whether you are in a loop
2. Consult Oracle with full error context — before making any more edits

A "failed attempt" = any edit + deploy cycle that does not resolve the original error. Different config values for the same hypothesis count as ONE attempt.

This rule exists because of a real escalation failure on 2026-06-25: 8 cycles were spent on "Prisma engine binary not found on Vercel" before the fix was found. The root cause was recognized by attempt 2, but 6 more cycles were wasted rotating through variations of the same class of fix. An Oracle consult at cycle 4 would have saved 20+ minutes.

## Verification criteria

Define completion criteria before starting. Verify against them before delivery.
Never return unfinished work; fix issues and retest until the criteria are met
or a genuine blocker requires user input.

## Tech Stack (locked)

Next.js App Router v15+, React, TypeScript, Prisma + Neon PostgreSQL, Cloudflare R2 (S3-compatible), Tailwind, browser-image-compression, nanoid, qrcode. Deploy on Vercel behind Cloudflare DNS.

**Do not add unlisted frameworks or libraries.** The stack is frozen.

## Critical Gotchas (easy to miss)

### Database: Two connection strings
- `DATABASE_URL` — Neon pooled (for queries). Use this everywhere.
- `DIRECT_URL` — Neon direct (for `prisma migrate` only). Never use in app code.
- Prisma client in `lib/prisma.ts` as singleton — serverless cold starts will exhaust connections without this.

### Auth: Token-based, no accounts
- Editing identity = `editToken` in the URL (`/edit/{token}`). No passwords, no sessions.
- Admin = shared password → signed httpOnly cookie.
- Browsers: no identity at all. Favorites are localStorage, no backend.

### Images: Presigned upload, not server passthrough
1. Frontend compresses with `browser-image-compression` (≤1600px, ≤500KB, webp)
2. Requests presigned PUT URL from `/api/upload-url` (server checks token + image count < 4)
3. PUTs directly to R2 — **never through server**
4. POSTs `/api/me/images` to save the record
5. Avatar uses same flow but stored on `Person.avatarUrl`, not counted toward the 4-image limit

### Short codes: shared between pages
The same `Person.code` serves both `/u/{code}` (profile) and `/loc/{code}` (location card). Each person gets one code.

### Validation quirks
- `bio` counted by code points, not characters or bytes — cap at 80.
- `published=true` blocked unless `avatarUrl` is set (avatar required before publishing).
- Image count must be < 4 **and** verified server-side on both upload-url and image-save endpoints.

### System settings (stored in SystemSetting table, PATCH via `/api/admin/settings`)
- `allowStudentPublishControl` — **defaults to "true"** (allow). When explicitly "false", students get 403 on `published: true`. Only checks on `published === true`, not `!== undefined`.
- `hideStudentPublishToggle` — **defaults to "false"** (show the toggle). When "true", the Published switch is hidden from the student edit page UI entirely. This is UI-only; the server gate is still `allowStudentPublishControl`.

### States ≠ pages
- `hidden=true` or `published=false` → show placeholder page, not blank screen. "这位同学还没布置主页" or "已隐藏".
- Location page loads regardless of whether the person has a profile — it's the fallback for equal exposure.

### Build order
Follow the 10-step sequence in section 12 of the dev doc. Each step has explicit verification. Don't skip ahead.

## What NOT to build (v1.0 exclusions)
Server accounts, login/registration, comments, likes, social links, pairing algorithms, notifications, server-side favorites. None of these.

## Deployed URL
Production: `https://oweek26.vercel.app` (Vercel, auto-deploys from `main` branch).

## Pitfalls

### Prisma v6 config structure
- `prisma.config.ts` is separate from `schema.prisma` — both must be updated.
- Generator uses `provider = "prisma-client"` (not `"prisma-client-js"`).
- Generator output is `../app/generated/prisma` — import from `@/app/generated/prisma/client`.
- `directUrl` goes in `prisma.config.ts`, not in `schema.prisma`.
- `prisma db execute` in v6 needs explicit `--url` flag.

### Vercel deployment: Prisma engine binary (2026-06-25)
Three independent requirements for Prisma to work on Vercel serverless:

1. **binaryTargets must include `rhel-openssl-3.0.x`** — Vercel runs on Amazon Linux 2023, not Debian. In `schema.prisma` generator block:
   ```
   binaryTargets = ["native", "rhel-openssl-3.0.x"]
   ```

2. **Commit generated Prisma client to git** — Next.js output file tracing does not include the `.node` engine binary when output is at `app/generated/prisma/`. The only reliable fix: remove `/app/generated/prisma` from `.gitignore` and `.vercelignore`, commit the generated files (including both `libquery_engine-darwin-arm64.dylib.node` and `libquery_engine-rhel-openssl-3.0.x.so.node`). Vercel deploys them as regular source files, and Prisma finds the engine at runtime.

3. **`dotenv` must be in `dependencies`** (not `devDependencies`) — `prisma.config.ts` imports `dotenv/config`. On Vercel with `NODE_ENV=production`, `npm install` skips `devDependencies`, so `dotenv` would be missing and `prisma generate` would crash during `postinstall`. Since generated files are committed, `postinstall` is removed.

4. **No `postinstall` script** — The generated client is committed directly. Adding `postinstall: "prisma generate"` would fail on Vercel without `dotenv` in `dependencies`, and is unnecessary since the committed files already contain the correct engine binary.

### create-next-app conflicts
- If AGENTS.md or README.md already exist, `create-next-app` refuses to scaffold. Move them to /tmp first, scaffold, then move back.

### npm install timeout
- Mac ARM + Neon npm registry can be slow. Give `npm install` at least 300s timeout.

### Admin page agent output
- Agent-generated JSX can have unclosed conditional blocks (`{cond && (` missing `)}`). Always build-check after agent output.
- Agent may create extra API routes (like `/api/admin/persons`) not in the spec — verify they're needed before keeping.

### handleSave PATCH body
- The edit page agent failed to include `avatarUrl` in the PATCH body. When someone uploads an avatar then hits Save, the avatar URL must be sent alongside other fields. Server checks `body.avatarUrl || person.avatarUrl` — if neither is set, publish is blocked.

### Save/publish coupling in /api/me PATCH (fixed 2026-06-25)
- **Bug**: `published !== undefined` gate in `/api/me/route.ts` blocked the entire PATCH when admin had `allowStudentPublishControl` disabled — including saves where `published: false`. This meant students couldn't save any profile edits unless the admin toggle was ON.
- **Fix**: Changed to `published === true`. Now only an explicit attempt to publish sets off the admin gate. Saving with `published: false` always works.
- **Lesson**: `!== undefined` checks on boolean fields are dangerous — `false !== undefined` is `true`. Use `=== true` when the intent is "only when actively toggling ON".

### R2 lazy initialization
- `S3Client` instantiated at module top-level crashes the entire app if R2 env vars are missing. Use a lazy `getS3()` function that throws only at call time — the rest of the app stays functional without R2 configured.

### @types/qrcode install
- First `npm install -D @types/qrcode` can fail silently (package not found). Verify with `ls node_modules/@types/qrcode` after install.
