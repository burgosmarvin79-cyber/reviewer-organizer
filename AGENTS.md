# Project Instructions

Purpose: Canonical project entrypoint and hot-path instructions for future agents.
Read when: Entering the project, starting a task, resuming work, or checking safety boundaries.
Skip when: Never skip during project work.

<!-- pmm-runtime:start -->
## PMM Runtime

- Managed runtime version: `0.5.1`.
- Before non-trivial task writes, run the installed `pmm-task.sh upgrade --project . --auto --owner <agent-id>` Upgrade Gate.
- Treat `docs/00-project-memory/runtime-state.md` as project runtime state; compatibility readers are for migration, recovery, rollback, and ambiguity review only.
- Keep exactly one primary task in `active-task.md`; concurrent writers use isolated branches/worktrees and work-item files.
<!-- pmm-runtime:end -->

## Project Identity

- Name: Reviewer Organizer
- One-sentence positioning: An offline-first study organizer for subjects, PDF reviewers, notes, mastery-based questions, and practice history.
- Project type: Installable Progressive Web App built with React and TypeScript.
- Current phase: Version 1 foundation and verification.
- Current top objective: Deliver and validate the complete local-first version 1 workflow.

## Runtime Profile

Default profile: Sprint

Use:
- Pulse for tiny edits or known-file lookups
- Sprint for normal implementation
- Project for new project or major requirements work
- Recovery for interrupted or failed-retryable work
- Audit for release, security, production, auth, payment, or compatibility risk

## Mandatory Reading Order

1. `AGENTS.md`
2. `docs/00-project-memory/active-task.md` for non-trivial task start/resume
3. Relevant sections of `current-state.md` only when project facts are needed
4. Relevant sections of `verifier-map.md` only when the task lacks complete checks
5. Task-specific source docs only when needed

Reuse content already present in the current context; do not reopen an unchanged file unless a required section was not loaded.

## Task Reading Map

- Product/features: `PRD.md` by default; split product docs only when needed
- UI/design: `src/styles.css` and `src/App.tsx`
- Frontend: `src/App.tsx`, `src/main.tsx`, and `src/types.ts`
- Backend/API/database: no remote backend; local data lives in `src/db.ts` and backup behavior in `src/backup.ts`
- Auth/payment/permissions:
- PRD/requirements/source review: `PRD.md` plus concrete source artifacts
- Deployment/operations:
- Testing/bug fixing: `src/mastery.test.ts`, then the relevant source module
- Recovery:
- Audit/release:

## Execution Rules

- Keep project state in project docs, not in agent-global memory.
- Respond to Marvin in natural Taglish by default. Keep programming and product terms in clear English, then explain them in Tagalog when that improves understanding. Use another language only when Marvin requests it.
- Treat development as guided learning for Marvin. Before and during meaningful changes, explain in beginner-friendly Taglish what the system component does, why it is needed, and how it connects to the rest of Reviewer Organizer.
- Define unfamiliar software terms when they first appear and use a short example when helpful. Do not assume prior knowledge of programming, Git, databases, testing, or deployment.
- After each implemented feature, explain what changed, how Marvin can see or test it, the important tradeoffs or risks, and the main lesson to remember.
- Keep explanations practical and proportional: emphasize decisions and concepts that help Marvin understand and eventually maintain the system, without burying him in noisy command logs or trivial syntax details.
- Keep an ephemeral in-session read set; do not write it into project memory.
- Inspect size and headings before reading text files over 200 lines or 32 KiB, then load only relevant ranges.
- Do not create standalone plan, handoff, or evidence files that duplicate the owned task and target source.
- Batch durable task/doc updates at real state transitions; do not persist commentary or raw command transcripts.
- Run the Workspace Gate before the Subagent Gate: inspect the primary task, branch/worktree, owner, allowed scope, and existing work items.
- Reuse a matching current-branch PMM claim; continue or resume it instead of creating or switching worktrees. A default `start` from another active, checked-out worktree may auto-route to a child work item.
- Keep exactly one primary task in `active-task.md`; never append a second task contract.
- Use `docs/00-project-memory/work-items/<task-id>.md` only for branch/worktree-isolated child work.
- Put queued, paused, confirmation-gated, deployment, and release work in an optional task queue instead of the active hot path.
- Update the owned task file before broad, risky, or long-running work.
- Define Task, Harness, Verifier, Critic, Repair, and Stop Condition for substantial tasks.
- Choose Agent Mode before broad work: `solo`, `assisted`, `parallel`, or `review-only`.
- Use specialized skills or subagents only when they add value, ownership is clear, and the parent agent keeps final verification.
- Never allow two active writers to share one branch/worktree; overlapping scopes execute sequentially.
- Keep one non-idle primary claim across local worktrees, including paused/blocked tasks; require each non-idle task file to match its complete owner/branch/parent/kind claim, and never reuse an archived task ID.
- Use the lifecycle CLI for whole-file task transactions; interrupted writes must leave neither partial task state nor orphan temporary files/claims, and an interrupted takeover must restore the owner matching the durable task file.
- Treat any source-touching commit after verification as stale evidence even when a later commit reverts it.
- Keep a verified child claim at `ready-to-integrate` until its commit is merged and the primary owner runs `pmm-task.sh integrate`; then reverify the primary task.
- Do not copy full project rules into agent-specific adapters.

## Safety Boundaries

- Do not store secrets in files, docs, logs, or chat.
- This is Marvin's workspace. Before any GitHub read or write, verify that GitHub CLI is using `burgosmarvin79-cyber`; switch to that account if needed. Never publish Marvin's work through `morkmork26`.
- Keep this repository's local Git author identity set to Marvin's GitHub username and GitHub-provided no-reply email.
- Product boundary: Reviewer Organizer is a personal standalone app. Do not add sign-up, sign-in, authentication, Supabase, or other account infrastructure unless Marvin explicitly requests a new direction.
- Do not delete, migrate, overwrite, publish, charge, message, or change production data without confirmation.
- Do not modify payment, user, order, permission, billing, credential, or external publication behavior without confirmation.
- Do not use mock data as proof of real integration.

## Definition Of Done

- Requested behavior implemented or blocker recorded.
- Verifier run after the final change and evidence still matches the current HEAD/source hash, or limitation recorded.
- Critic checked false-pass risk.
- `active-task.md`, `current-state.md`, `change-log.md`, and source docs updated only when durable state changed.
- Remaining risk is explicit.
- Every child work item is merged, explicitly integrated, and followed by fresh primary-task verification.

## Portfolio-Quality Git History

- Treat every commit, push, pull request, release, and public repository page as part of Marvin's professional developer portfolio.
- Create focused commits that represent one coherent outcome. Do not mix unrelated work merely to reduce the number of commits.
- Write concise, specific, professional commit subjects in imperative style that explain the meaningful outcome; never use vague messages such as `update`, `changes`, `work`, or `fix stuff`.
- Before committing application changes, run the relevant linting, tests, type-checking, build, or focused verification. Do not present unverified or broken work on `main` as portfolio-ready.
- Keep README files, product documentation, learning notes, release descriptions, and user-facing text polished, truthful, beginner-readable, and suitable for recruiters or future collaborators.
- When a change has an important reason, tradeoff, limitation, or verification method, record it in the appropriate project documentation without adding noisy command logs.
- Never fabricate activity, authorship, features, test results, dates, or engineering experience. Professional presentation must reflect real work and real verification.
- Preserve Marvin's Git author identity and verify that GitHub CLI is using `burgosmarvin79-cyber` before any GitHub write from this workspace.
