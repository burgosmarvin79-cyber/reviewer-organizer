# Reviewer Organizer Product Requirements

## Purpose

Reviewer Organizer is an installable, offline-first web application that helps students keep study materials together and turn questions into a progressive mastery routine.

## Version 1 Scope

- Create, edit, search, and delete subjects.
- Store PDF reviewers within a subject; add, open, and delete them.
- Create, edit, search, and delete notes within a subject.
- Create, edit, filter, and delete identification questions with one primary answer, optional accepted alternatives, and an explanation.
- Run randomized tests for one subject and one mastery level at a time.
- Let the student manually keep a question at its current level or move it one level forward or backward after checking an answer.
- Allow questions to be skipped without changing their level or counting them as answered.
- Record completed test history and answer snapshots.
- Display dashboard totals, mastery distribution, recent tests, and suggested next steps.
- Export and restore a complete local backup, including PDFs.
- Work offline after the first successful load and support installation as a Progressive Web App.

## Mastery Levels

1. Test 1 — new questions.
2. Test 2 — questions the student is starting to master.
3. Test 3 — questions mastered from Test 2.
4. Final Test Reviewer — questions mastered from Test 3.

Level changes are manual. Correct and incorrect answers update statistics but never move a question automatically. After checking an answer, the student chooses **Previous level**, **Keep here**, or **Next level**. Test 1 cannot move backward and the Final Test Reviewer cannot move forward.

## Approved Product Rules

- Version 1 uses identification questions. Answer checking ignores capitalization and repeated surrounding/internal spaces, and each question may define multiple accepted answers.
- Tests contain up to 10 questions by default and never repeat a question in one session.
- Tests cover one subject and one mastery level.
- Typed answers lock after the student chooses **Check answer**. The correct answer and explanation appear immediately, followed by the manual level controls.
- Deleting a subject requires typing its name and removes its related content and history.
- PDFs above 25 MB show a warning; PDFs above 100 MB are rejected.
- Version 1 has no account or cloud synchronization.
- Do not add sign-up, sign-in, user accounts, or authentication unless Marvin explicitly reverses this decision in a future request.
- Student data stays in the browser database and is not committed to GitHub.

## Main Limitation

Local browser data can be lost if site data is cleared. Backup and restore are therefore core safety features, not optional extras.
