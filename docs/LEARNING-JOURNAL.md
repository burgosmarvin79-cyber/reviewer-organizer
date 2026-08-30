# Reviewer Organizer Learning Journal

This journal records practical concepts learned while building the project. It intentionally excludes credentials, private student data, and noisy command logs.

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
