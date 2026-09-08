-- Add adaptive flashcard scheduling without changing existing mastery tiers.
alter table public.questions
  add column if not exists review_state text not null default 'new'
    check (review_state in ('new', 'learning', 'review', 'mastered')),
  add column if not exists review_interval_minutes integer not null default 0
    check (review_interval_minutes >= 0),
  add column if not exists review_ease numeric(4,2) not null default 2.30
    check (review_ease between 1.30 and 3.50),
  add column if not exists review_due_at timestamptz,
  add column if not exists review_repetitions integer not null default 0
    check (review_repetitions >= 0),
  add column if not exists review_lapses integer not null default 0
    check (review_lapses >= 0);

create index if not exists questions_user_subject_due_idx
on public.questions(user_id, subject_id, review_due_at);
