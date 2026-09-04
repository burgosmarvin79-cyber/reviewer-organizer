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
revision: 7
verification_head: none
verification_source_hash: none
verified_at: none
updated_at: 2026-08-31T05:05:12Z
---

# Active Task

Purpose: Single primary task contract, verifier, retry state, and integration checkpoint.
Read when: Starting, executing, verifying, integrating, or recovering this task.
Skip when: The task is unrelated to the current execution context.

## Status

- Title: Complete private Supabase workflow and BatStateU-inspired interface
- Runtime Profile: Sprint
- Risk Level: normal
- Loop Budget: 3
- Current Attempt: 1
- Stop Condition: required behavior is verified or a concrete blocker is recorded.

## Task

- Objective: Complete the private Supabase workflow and present it through a simple, organized BatStateU-inspired interface
- Scope: Backend architecture, migrations, RLS, private storage, private login, IndexedDB migration, synchronization, interface layout and visual system, tests, documentation, and deployment
- Allowed Files or Areas: Supabase and local-data code, authentication and application interface, styling and branding assets, tests, project documentation, and deployment configuration
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
- Next Concrete Action: Confirm the deployed tolerant import with Marvin's real ChatGPT output

## Record

- Verification Evidence: On 2026-09-04, questionnaire import accepted ChatGPT commentary and Markdown fences in six focused tests; all 17 app tests, source lint, TypeScript build, and PWA generation passed locally. Live acceptance remains pending.
- Delivery Status: deployed after Marvin's explicit publication request
- Delivery Evidence: GitHub Pages workflow 33846147157 completed successfully and the live bundle contained the repaired importer on 2026-09-04.
- Docs Updated: pending
- Remaining Risk: Live acceptance with Marvin's original questionnaire remains pending.
- Memory Promotion Decision: pending
- Last Updated: 2026-08-30T17:10:59Z
