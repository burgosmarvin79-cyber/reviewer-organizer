# Verifier Map

Purpose: Project-specific map from task types to required checks and evidence.
Read when: Defining or reviewing the verifier for an active task.
Skip when: The active task already has a complete verifier.

## Default Checks

- Code: `npm run lint`, `npm run test`, and `npm run build`.
- Frontend: serve `dist`, verify the app shell and responsive layout, then manually exercise the core workflow in a browser.
- Backend/API: no remote backend; test IndexedDB persistence, cascade deletion, PDF blobs, and backup restoration.
- Docs/skills: confirm README commands, PRD rules, and project-memory state match the source.
- Recovery:
- Release: run all checks after the final source change and verify the PWA manifest and service worker return HTTP 200.
- Security/high risk: `npm audit`; confirm no student data or backup files are tracked by Git.

## Required Evidence

- Command output summary: exact pass/fail status for lint, tests, build, audit, and production smoke test.
- Manual inspection: desktop and mobile layout plus complete create-study-test-history-backup flow.
- Screenshot or artifact: production `dist` build and install manifest.
- Remaining risk: browser-specific storage limits and install behavior.

## False-Pass Guards

- Do not report skipped checks as passed.
- Do not delete or weaken failing checks without recording why.
- Do not treat mocks as real integration evidence.
- Do not mark high-risk tasks done without confirmation and rollback notes.
