---
pmm_schema: pmm.task/v1
task_id: google-classroom-auth
parent_task_id: add-private-supabase-backend
task_kind: work-item
execution_status: ready-to-integrate
verification_status: passed
delivery_status: not-requested
owner: codex-root
branch: feat/google-classroom-auth
base_sha: c04daed12edc364cfc213065eb0bdc2f9093f847
revision: 4
verification_head: 46791e4f48b823abba033c13e692c2eedc144290
verification_source_hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
verified_at: 2026-09-05T13:18:01Z
updated_at: 2026-09-05T13:18:02Z
---

# Work Item

Purpose: Branch-isolated child work item owned by one execution context.
Read when: Starting, executing, verifying, integrating, or recovering this task.
Skip when: The task is unrelated to the current execution context.

## Status

- Title: Connect Google Classroom imports
- Runtime Profile: Sprint
- Risk Level: normal
- Loop Budget: 3
- Current Attempt: 1
- Stop Condition: required behavior is verified or a concrete blocker is recorded.

## Task

- Objective: Connect Google Classroom imports
- Scope: Google OAuth provider, read-only Classroom and Drive API services, import UI, tests, environment example, and project memory; no production deployment or Google Cloud mutations
- Allowed Files or Areas: Google OAuth provider, read-only Classroom and Drive API services, import UI, tests, environment example, and project memory; no production deployment or Google Cloud mutations
- Forbidden Actions: unrelated edits, destructive operations, publication, and production writes without explicit authorization.
- Source Artifacts: project instructions, current source, and task request.

## Harness

- Agent Mode: solo
- Owner: codex-root
- Branch: feat/google-classroom-auth
- Parent Task: add-private-supabase-backend
- Tools: project-local tools and pmm lifecycle helpers.
- Environment Notes: one writer owns this task file and branch.

## Verifier

- Required Checks: npm run lint; npm run test; npm run build; inspect token handling and failure paths
- Manual Acceptance: task-specific acceptance remains explicit.
- Evidence Needed: fresh command output bound to the current HEAD and source hash.

## Critic

- Pass/Fail: pass
- Missing Evidence: required checks have not completed.
- False-Pass Risk: stale or unrelated evidence must not count.
- Next Action: execute the first unverified acceptance step.

## Repair

- Last Failure: none
- Failure Class: none
- Attempted Fix: none
- Next Concrete Action: commit this operational checkpoint, merge the branch, then run pmm-task.sh integrate from the primary branch

## Record

- Verification Evidence: npm run lint passed; npm run test passed 21 tests; npm run build passed; local HTTP app shell responded; token and Supabase ownership paths reviewed
- Delivery Status: not-requested
- Delivery Evidence: pending
- Docs Updated: pending
- Remaining Risk: pending verification.
- Memory Promotion Decision: pending
- Last Updated: 2026-09-05T13:09:31Z
