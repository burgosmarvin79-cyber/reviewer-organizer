# Reviewer Organizer Product Requirements

## Purpose

Reviewer Organizer is an installable, offline-first web application that helps students keep study materials together and turn questions into a progressive mastery routine.

## Version 1 Scope

- Create, edit, search, and delete subjects.
- Store PDF reviewers within a subject; add, open, and delete them.
- Create, edit, search, and delete notes within a subject.
- Create, edit, filter, and delete multiple-choice questions with 2–6 choices, one correct answer, and an explanation.
- Run randomized tests for one subject and one mastery level at a time.
- Promote after three consecutive correct answers; demote one level after an incorrect answer.
- Record completed test history and answer snapshots.
- Display dashboard totals, mastery distribution, recent tests, and suggested next steps.
- Export and restore a complete local backup, including PDFs.
- Work offline after the first successful load and support installation as a Progressive Web App.

## Mastery Levels

1. Test 1 — new questions.
2. Test 2 — questions the student is starting to master.
3. Test 3 — questions mastered from Test 2.
4. Final Test Reviewer — questions mastered from Test 3.

Promotion requires three consecutive correct answers at the current level. Promotion resets the streak. An incorrect answer resets the streak and moves the question back one level, except that Test 1 cannot move lower.

## Approved Product Rules

- Version 1 uses multiple-choice questions only.
- Tests contain up to 10 questions by default and never repeat a question in one session.
- Tests cover one subject and one mastery level.
- Answers lock after the student chooses **Check answer**.
- Deleting a subject requires typing its name and removes its related content and history.
- PDFs above 25 MB show a warning; PDFs above 100 MB are rejected.
- Version 1 has no account or cloud synchronization.
- Do not add sign-up, sign-in, user accounts, or authentication unless Marvin explicitly reverses this decision in a future request.
- Student data stays in the browser database and is not committed to GitHub.

## Main Limitation

Local browser data can be lost if site data is cleared. Backup and restore are therefore core safety features, not optional extras.
