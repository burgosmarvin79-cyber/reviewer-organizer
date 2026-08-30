# Change Log

Purpose: Chronological record of durable project behavior, requirement, implementation, and operation changes.
Read when: You need recent durable changes or must record a state-changing task.
Skip when: You only need the active task or current state.

## 2026-08-31 — Keep the application account-free

- Change: Confirmed that Reviewer Organizer remains a personal standalone application without sign-up, sign-in, authentication, Supabase, or cloud synchronization.
- Evidence: Marvin explicitly rejected adding the sign-up feature after discussing an account-based architecture.
- Remaining risk: study data remains device-specific and must be moved using backup and restore.

## 2026-08-31 — GitHub Pages deployment

- Change: Published the application at `https://burgosmarvin79-cyber.github.io/reviewer-organizer/` using an automated GitHub Actions workflow.
- Change: Set Vite's repository base path to `/reviewer-organizer/` and used hash-based client navigation to prevent internal-page refresh errors on static hosting.
- Evidence: local lint, tests, and repository-path build passed; GitHub Actions run `33322288775` succeeded; live page, manifest, and service worker returned HTTPS 200.
- Remaining risk: installation prompts and the complete data workflow require acceptance testing on Marvin's phone and browser.

## 2026-08-31 — Version 1 foundation

- Change: Chose an installable Progressive Web App to preserve the requested web interface and standalone offline behavior.
- Change: Chose IndexedDB through Dexie because PDFs and structured study records exceed the practical purpose of localStorage.
- Change: Defined four mastery levels with promotion after three consecutive correct answers and one-level demotion after an incorrect answer.
- Change: Stored question snapshots in test history so later question edits do not rewrite the historical record.
- Change: Included complete local backup and restore because browser-local data has no cloud copy.
- Evidence: lint, four mastery tests, production build, dependency audit, and production HTTP smoke test passed.
- Remaining risk: browser-specific storage and install behavior needs manual acceptance on the user's target device.
