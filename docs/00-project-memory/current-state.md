# Current State

Purpose: Current project phase, stable facts, blockers, and next recommended actions.
Read when: Starting or resuming project work.
Skip when: Only reading historical decisions or one-off command output.

## Phase

Version 1 foundation deployed for user acceptance testing.

## Current Top Objective

Complete and validate the private Supabase workflow while refining the application through a simple BatStateU-inspired interface.

## Stable Facts

- Repository: public GitHub repository `burgosmarvin79-cyber/reviewer-organizer`.
- Product format: browser-based web application.
- Development must include beginner-friendly explanations of each important component, its purpose, how it connects to the system, verification steps, and meaningful tradeoffs or risks.

## What Exists

- Local Git repository and public GitHub repository.
- Project memory and active build task.
- React and TypeScript Progressive Web App with responsive navigation and offline service worker.
- IndexedDB database for subjects, PDFs, notes, questions, settings, and test-history snapshots.
- Subject, PDF, note, question-bank, practice-test, dashboard, history, and backup interfaces.
- Question Bank bulk import for `.txt` or `.json` questionnaires, including strict validation, duplicate filtering, and selectable review before saving.
- Main dashboard now presents subjects only; each subject workspace contains its own PDF, question, mastery, score, and test summary.
- Question Bank supports selecting visible questions and deleting a confirmed batch from Supabase and local storage.
- Authenticated account switches clear the previous account's IndexedDB cache before hydrating the new account, preventing cross-account local-data leakage.
- Subject workspaces now show mastery progress, last-study date, and a Continue Test action; the sidebar shows offline, syncing, synced, or error status and retries on reconnect/focus.
- Manual and bulk question saves now wait for confirmed private Supabase persistence before updating the local question bank, preventing phone uploads from appearing successful before cloud synchronization finishes.
- Automated mastery-rule tests and production build configuration.
- Email authentication, per-user Supabase study-data synchronization, deletion synchronization, and realtime subscriptions.
- Private Supabase PDF upload, cross-device metadata synchronization, signed five-minute open links, cloud deletion, and automatic migration of legacy browser PDFs.
- Awaited note persistence, foreground/online resynchronization, and Supabase Realtime publication for subjects, PDF metadata, notes, questions, and test history.
- BatStateU-inspired red, white, and warm-neutral application shell using the university seal already provided for the project.

## What Works

- Lint, seven automated tests, and production build pass after the 2026-08-31 interface update.
- Questionnaire import validation is covered by four focused tests; the complete suite now contains twelve passing tests.
- Production output serves the application shell, service worker, and install manifest successfully.
- GitHub Pages deploys automatically from `main` and the live HTTPS site returns the app shell, PWA manifest, and service worker successfully.

## Known Issues

- Complete two-account RLS isolation, live note and PDF cross-device behavior, offline conflict behavior, and recovery paths still require verification.
- Manual desktop and phone visual acceptance of the BatStateU-inspired interface remains required.
- An iPhone Safari subject-route crash was reported. A local repair now cleans up Realtime channels, coalesces cloud events, incrementally reconciles IndexedDB, and removes `color-mix()` from subject surfaces; live iPhone verification remains pending deployment.

## Current Blockers

- None. Product direction and repository visibility are confirmed.

## Next Recommended Actions

- Deploy the locally verified private-PDF workflow, then upload on phone, open on laptop, test deletion, and confirm a second account cannot access the signed-in owner's PDF.

## Last Updated

2026-08-31
