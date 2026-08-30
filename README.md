# Reviewer Organizer

An offline-first study organizer for subjects, PDF reviewers, notes, mastery-based question banks, and test history.

## Live application

Open Reviewer Organizer at <https://burgosmarvin79-cyber.github.io/reviewer-organizer/>.

On a phone, open the link in a browser and choose **Add to Home Screen** or **Install app**. Study data is stored separately on each device; use the built-in backup and restore tools to transfer it.

## Status

Version 1 is under active development.

## Local development

```bash
npm install
npm run dev
```

Then open the local address printed by Vite.

## Verification

```bash
npm run lint
npm run test
npm run build
```

## Data and privacy

The source code is public, but student content is stored locally in the browser using IndexedDB. PDFs, notes, questions, and test results are not uploaded to this GitHub repository.
