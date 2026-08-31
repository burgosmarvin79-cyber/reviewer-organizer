# Change Log

Purpose: Chronological record of durable project behavior, requirement, implementation, and operation changes.
Read when: You need recent durable changes or must record a state-changing task.
Skip when: You only need the active task or current state.

## 2026-08-31 — Make note synchronization observable and resilient

- Change: Note creation and editing now await direct Supabase persistence, display a saving state, preserve the local copy on failure, and surface the cloud error instead of silently closing.
- Change: Note deletion now confirms remote deletion before removing the local record.
- Change: Authenticated data resynchronizes when the browser regains internet, returns to the foreground, or receives focus, covering missed Realtime events.
- Change: Added an idempotent migration enabling subjects, PDF metadata, notes, questions, and test history in the `supabase_realtime` publication without changing RLS policies.
- Evidence: Marvin confirmed the production SQL completed successfully; ESLint, eight automated tests, TypeScript, and production PWA build pass locally.
- Remaining risk: phone-to-laptop note create, edit, and delete plus two-account denial require live acceptance after deployment.

## 2026-08-31 — Store reviewer PDFs privately across devices

- Change: Added private `reviewer-pdfs` uploads with per-user paths, `pdf_reviewers` metadata synchronization, short-lived signed open URLs, and coordinated cloud deletion.
- Change: Added IndexedDB version 3, separating lightweight PDF metadata from temporary local binary files so subject pages do not load every PDF into iPhone memory.
- Change: Existing browser PDFs migrate automatically after sign-in; their local binary remains intact until both Storage upload and metadata persistence succeed.
- Change: Backup format version 3 downloads cloud-only PDFs when creating a complete backup and restores them as pending local files for secure re-upload.
- Evidence: ESLint, eight automated tests, TypeScript, production PWA build, and diff validation pass locally.
- Remaining risk: authenticated production upload, signed opening on iPhone, phone-to-laptop visibility, deletion, legacy-data migration, and two-account denial still require live acceptance after deployment.

## 2026-08-31 — Reduce iPhone subject-route resource pressure

- Change: Added explicit Supabase Realtime channel cleanup when the authenticated user lifecycle changes.
- Change: Coalesced bursts of Realtime table notifications and queued one follow-up synchronization instead of running overlapping refreshes.
- Change: Replaced full clear-and-rebuild local synchronization with incremental upserts and deletion reconciliation across subjects, notes, questions, and test history.
- Change: Removed `color-mix()` from subject cards and banners for broader iPhone WebKit compatibility.
- Evidence: ESLint, seven automated tests, TypeScript, and production PWA build pass locally.
- Remaining risk: the screenshot proves an iPhone Safari content-process crash but not its exact internal WebKit cause; the repair requires live deployment and reproduction testing on Marvin's phone.

## 2026-08-31 — Adopt a simple BatStateU-inspired application shell

- Change: Replaced the navy and blue application shell with a restrained deep-red, white, warm-gray, and gold visual system inspired by Batangas State University.
- Change: Reused the project-provided university seal in the sidebar, simplified card shapes, strengthened active navigation, and grouped synchronization and account controls in the sidebar footer.
- Change: Adopted a Classroom-inspired subject flow: each subject is a fully clickable rectangular card with a colored banner and live PDF, note, and question counts; opening it reveals the existing content tabs in a clearer workspace banner.
- Change: Corrected the former local-only status label to describe private cloud synchronization with offline device availability.
- Evidence: ESLint, seven automated tests, TypeScript production build, PWA generation, and production-logo presence checks passed.
- Remaining risk: Marvin must visually accept the desktop and phone layouts before this design is considered final; the production build also reports a non-blocking JavaScript chunk-size warning, and the change has not been deployed by this task.

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
## 2026-08-31 — Review-first questionnaire import

- Change: Added `.txt` and `.json` bulk import for ChatGPT-generated identification questionnaires inside each subject's Question Bank.
- Change: Required a versioned JSON contract, rejected malformed questions, filtered duplicates, and added a selectable preview before records are saved and synchronized.
- Evidence: lint, twelve automated tests including four focused import-validation cases, TypeScript checking, and the production PWA build passed.
- Remaining risk: a real questionnaire generated from Marvin's uploaded notes still needs manual content and cross-device acceptance testing.
