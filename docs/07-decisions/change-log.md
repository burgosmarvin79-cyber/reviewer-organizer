# Change Log

Purpose: Chronological record of durable project behavior, requirement, implementation, and operation changes.
Read when: You need recent durable changes or must record a state-changing task.
Skip when: You only need the active task or current state.

## 2026-08-31 — Version 1 foundation

- Change: Chose an installable Progressive Web App to preserve the requested web interface and standalone offline behavior.
- Change: Chose IndexedDB through Dexie because PDFs and structured study records exceed the practical purpose of localStorage.
- Change: Defined four mastery levels with promotion after three consecutive correct answers and one-level demotion after an incorrect answer.
- Change: Stored question snapshots in test history so later question edits do not rewrite the historical record.
- Change: Included complete local backup and restore because browser-local data has no cloud copy.
- Evidence: lint, four mastery tests, production build, dependency audit, and production HTTP smoke test passed.
- Remaining risk: browser-specific storage and install behavior needs manual acceptance on the user's target device.
