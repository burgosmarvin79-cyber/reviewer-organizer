# Change Log

Purpose: Chronological record of durable project behavior, requirement, implementation, and operation changes.
Read when: You need recent durable changes or must record a state-changing task.
Skip when: You only need the active task or current state.

## 2026-08-31 — Adopt multi-user Supabase authentication

- Change: Reversed the earlier account-free boundary and approved public email/password sign-up, sign-in, sign-out, email verification, and password recovery.
- Change: Each cloud table and PDF object must belong to an authenticated user and be protected by Row Level Security and private storage policies.
- Change: IndexedDB remains as a per-user offline cache rather than the only data source.
- Evidence: Marvin explicitly requested that different people use the application without sharing data.
- Remaining risk: Supabase project configuration, SMTP readiness, security policies, synchronization conflicts, and existing local-data ownership migration require implementation and verification before live release.

## 2026-08-31 — Identification tests with manual mastery levels

- Change: Replaced multiple-choice questions with typed identification answers supporting multiple accepted variants and normalized case/spacing.
- Change: Removed automatic promotion and demotion. After checking an answer, the student explicitly chooses the previous level, current level, or next level.
- Change: Moved all four Start Test actions into each subject's Question Bank and removed the global Practice Test navigation entry.
- Change: Added skip handling, manual level decisions in history, database conversion for existing questions, and backward-compatible restore for version 1 backups.
- Evidence: lint, seven focused identification/manual-level and legacy-backup tests, TypeScript checking, production PWA build, and production dependency audit passed.
- Remaining risk: live phone acceptance and migration testing with a real user-created version 1 backup remain recommended.

## 2026-08-31 — Responsive laptop-to-mobile preview

- Change: Expanded the compact-layout breakpoint to 850 CSS pixels and strengthened phone layouts for navigation, cards, files, forms, history, tests, and modals.
- Change: Added a dismissible backdrop for the slide-out navigation and short-screen handling for landscape or highly zoomed windows.
- Evidence: lint, four mastery tests, TypeScript checking, production build, and CSS breakpoint inspection passed.
- Remaining risk: final visual acceptance depends on Marvin's laptop scaling and target phone/browser.

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
