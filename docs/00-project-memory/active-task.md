---
pmm_schema: pmm.task/v1
task_id: add-private-supabase-backend
parent_task_id: none
task_kind: primary
execution_status: active
verification_status: pending
delivery_status: not-requested
owner: codex-root
branch: main
base_sha: 5b51133c1658acec4e09e2994ea49ebd7d00c489
revision: 2
verification_head: none
verification_source_hash: none
verified_at: none
updated_at: 2026-08-30T17:22:29Z
---

# Active Task

Purpose: Single primary task contract, verifier, retry state, and integration checkpoint.
Read when: Starting, executing, verifying, integrating, or recovering this task.
Skip when: The task is unrelated to the current execution context.

## Status

- Title: Add private Supabase backend and offline sync
- Runtime Profile: Sprint
- Risk Level: normal
- Loop Budget: 3
- Current Attempt: 1
- Stop Condition: required behavior is verified or a concrete blocker is recorded.

## Task

- Objective: Add private Supabase backend and offline sync
- Scope: Backend architecture, migrations, RLS, private storage, private login, IndexedDB migration, synchronization, tests, documentation, and deployment
- Allowed Files or Areas: Backend architecture, migrations, RLS, private storage, private login, IndexedDB migration, synchronization, tests, documentation, and deployment
- Forbidden Actions: unrelated edits, destructive operations, publication, and production writes without explicit authorization.
- Source Artifacts: project instructions, current source, and task request.

## Harness

- Agent Mode: solo
- Owner: codex-root
- Branch: main
- Parent Task: none
- Tools: project-local tools and pmm lifecycle helpers.
- Environment Notes: one writer owns this task file and branch.

## Verifier

- Required Checks: Verify authentication success and denial paths, RLS isolation, private PDF access, offline sync, data migration, lint, tests, build, and deployment rollback readiness
- Manual Acceptance: task-specific acceptance remains explicit.
- Evidence Needed: fresh command output bound to the current HEAD and source hash.

## Critic

- Pass/Fail: pending
- Missing Evidence: required checks have not completed.
- False-Pass Risk: stale or unrelated evidence must not count.
- Next Action: execute the first unverified acceptance step.

## Repair

- Last Failure: none
- Failure Class: none
- Attempted Fix: none
- Next Concrete Action: Confirm local Supabase public configuration, then create multi-user schema, RLS policies, private PDF storage policies, and authentication flows

## Record

- Verification Evidence: pending after checkpoint
- Delivery Status: not-requested
- Delivery Evidence: pending
- Docs Updated: pending
- Remaining Risk: pending verification.
- Memory Promotion Decision: pending
- Last Updated: 2026-08-30T17:10:59Z
