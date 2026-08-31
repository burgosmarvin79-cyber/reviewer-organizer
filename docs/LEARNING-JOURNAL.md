# Reviewer Organizer Learning Journal

This journal records practical concepts learned while building the project. It intentionally excludes credentials, private student data, and noisy command logs.

## 2026-08-31 — A theme is a small visual system

A coherent university-inspired interface does not require decorating every element. A limited palette, consistent corner shapes, clear spacing, and one obvious active-navigation style create stronger identity with less visual noise.

Interface labels must also follow real system behavior. Once study data can synchronize through Supabase, a label saying that everything only stays locally becomes misleading. Good interface design includes accurate status language, not just colors and logos.

A familiar navigation model can be reused without copying another product's appearance. The useful Classroom pattern is the relationship between a subject card and its focused workspace. Reviewer Organizer keeps its own BatStateU-inspired identity while using that understandable card-to-content flow.

Realtime subscriptions need a lifecycle. A React screen must remove its channel when the user session ends or changes; otherwise stale connections can consume resources and trigger duplicate work. Cloud events should also be grouped, and local synchronization should update only changed or removed records instead of clearing and rebuilding the entire database each time.

A file list should not contain the full files it describes. Keeping PDF metadata and binary Blobs in separate IndexedDB tables lets the interface count and display reviewers without loading megabytes into memory. Supabase Storage becomes the private source of truth, while a short-lived signed URL allows the authenticated student to open one selected PDF without making the bucket public.

Saving locally and starting a cloud request are not the same as confirming synchronization. A reliable form waits for the remote response, shows progress, and explains failure while preserving recoverable local work. Realtime also requires both client subscription code and database publication membership; Row Level Security still decides which published rows each authenticated user may receive.

## 2026-08-31 — How the first version fits together

### Source code and student data are different

GitHub stores the public source code: the instructions that make the application work. A student's subjects, PDFs, notes, questions, and scores are not source code. They are saved in that student's browser database and are never committed automatically.

### A Progressive Web App is an installable website

The project uses web technologies, but its manifest and service worker allow supported browsers to install it and reopen its interface offline. The service worker saves the application shell; IndexedDB saves the student's content.

### IndexedDB is the local database

IndexedDB can hold structured records and binary files such as PDFs. Dexie provides a simpler, safer interface to IndexedDB and keeps React screens updated when stored records change.

### Test history uses snapshots

A snapshot is a copy of a question at the moment it was answered. Without snapshots, editing a question later could make an old test record misleading. Historical answers therefore keep the old prompt, choices, correct answer, and explanation.

### Verification has different layers

- Linting detects suspicious or inconsistent code.
- Unit tests prove focused business rules such as mastery promotion and demotion.
- Type-checking catches incompatible data before the app runs.
- A production build proves the application can be packaged.
- A browser smoke test proves the packaged files can be served.

Passing one layer does not replace the others.

## 2026-08-31 — Source code is not a deployed website

Pushing files to a GitHub repository stores and versions them, but it does not automatically create a website. GitHub Pages is the hosting service that serves the production build over HTTPS.

The deployment workflow is an automated recipe. Whenever verified code reaches the `main` branch, GitHub installs the exact dependencies, runs checks, builds the application, and publishes the `dist` production folder.

Because a project Pages site lives below `/reviewer-organizer/` rather than at the domain root, the build must include that base path. Hash-based navigation keeps screens such as `#/subjects` inside the already-loaded application and avoids static-host 404 errors.

## 2026-08-31 — Responsive design uses effective width

A responsive layout reacts to CSS viewport width, not whether the physical device is a laptop or phone. Narrowing the laptop window or increasing browser zoom reduces the effective width. At 850 CSS pixels, Reviewer Organizer switches from its permanent desktop sidebar to the compact mobile navigation.

Responsive work includes more than shrinking text. Actions must stack, long filenames must wrap, dialogs must fit the visible height, navigation must remain dismissible, and horizontal scrolling must be prevented without hiding useful content.

## 2026-08-31 — Business rules should match user control

The first mastery engine moved questions automatically based on correct-answer streaks. Marvin clarified that mastery is a personal judgment, so the application now records correctness separately from level placement. After feedback, only an explicit student action changes the level.

Identification checking normalizes capitalization and repeated spaces, then compares the result against the question's accepted-answer list. This stays predictable and fully offline. It does not attempt fuzzy or AI grading, so spelling variants must be added explicitly.

Changing stored data shapes requires a database migration. Existing multiple-choice questions are converted by taking their former correct choice as the first accepted identification answer. Backup restoration performs the same conversion for older backup files.

## 2026-08-31 — AI output needs a data contract

A data contract is an agreed structure that both ChatGPT and Reviewer Organizer understand. Here, ChatGPT produces versioned JSON containing a prompt, accepted answers, explanation, and mastery level. The app does not blindly trust that output: it validates every field, rejects malformed files, detects duplicates, and asks the student to review selected questions before saving.

The source notes and PDF belong in ChatGPT; only the generated questionnaire belongs in the app's import screen. Keeping those steps separate avoids placing an AI API key in the browser while still making question entry much faster.

## 2026-08-31 — A local save is not proof of cloud synchronization

Question imports can contain many records, so starting unobserved background uploads creates a false-success risk: the dialog may close even if Supabase rejects the request or the phone loses its connection. The import workflow now waits for one authenticated batch upsert to succeed before writing the same questions into the local browser database. Manual question saves follow the same confirmation rule.

This makes failure recoverable because the form stays open with its content and an error message. Realtime then tells another signed-in device to fetch the confirmed cloud records.

## 2026-08-31 — Keep summaries close to their owner

When a dashboard shows totals from many unrelated subjects, the numbers are less useful and the screen becomes crowded. The dashboard now acts as a subject launcher. PDFs, questions, mastery progress, average score, and completed-test counts are shown in the workspace of the subject they belong to, which keeps context and navigation together.

## 2026-08-31 — Sync state should be visible

Cloud synchronization can be offline, in progress, complete, or failed. The sidebar now shows those states directly and the app retries when the device returns online, regains focus, or becomes visible again. This helps a student distinguish “saved on this device” from “confirmed in the private cloud.”

## 2026-08-31 — Bulk actions need an explicit scope

Selection mode makes a destructive action understandable: the student first chooses specific visible questions, sees the selected count, and confirms the batch. The app deletes only those IDs for the signed-in owner, while historical test snapshots remain because they represent past answers rather than live question-bank records.

## 2026-08-31 — Cloud privacy also needs local privacy

Row Level Security protects rows when the app asks Supabase for data, but a browser's IndexedDB cache is local and does not automatically know which account is currently signed in. The app now stores only a small account-owner identifier and clears the previous user's local study cache before loading another user's records. This closes the gap where a new account could briefly see old cached data while synchronization was starting.
