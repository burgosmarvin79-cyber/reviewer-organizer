---
pmm_schema: pmm.task/v1
task_id: google-classroom-auth
parent_task_id: add-private-supabase-backend
task_kind: work-item
execution_status: active
verification_status: pending
delivery_status: not-requested
owner: codex-root
branch: feat/google-classroom-auth
base_sha: c04daed12edc364cfc213065eb0bdc2f9093f847
revision: 2
verification_head: none
verification_source_hash: none
verified_at: none
updated_at: 2026-09-05T13:17:22Z
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

- Pass/Fail: pending
- Missing Evidence: required checks have not completed.
- False-Pass Risk: stale or unrelated evidence must not count.
- Next Action: execute the first unverified acceptance step.

## Repair

- Last Failure: none
- Failure Class: none
- Attempted Fix: none
- Next Concrete Action: Run final checks, commit the isolated work item, integrate it into main, then perform manual Google acceptance before deployment.

## Record

- Verification Evidence: pending after checkpoint
- Delivery Status: not-requested
- Delivery Evidence: pending
- Docs Updated: pending
- Remaining Risk: pending verification.
- Memory Promotion Decision: pending
- Last Updated: 2026-09-05T13:09:31Z
