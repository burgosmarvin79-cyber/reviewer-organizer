-- Link imported subjects to their source course so repeat syncs update instead of duplicate.
alter table public.subjects
add column if not exists google_classroom_course_id text;

create unique index if not exists subjects_user_classroom_course_idx
on public.subjects(user_id, google_classroom_course_id)
where google_classroom_course_id is not null;
