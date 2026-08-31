-- Add note progression buckets for existing Supabase projects.
alter table public.notes
  add column if not exists note_level smallint not null default 1;

alter table public.notes
  drop constraint if exists notes_note_level_check;

alter table public.notes
  add constraint notes_note_level_check check (note_level between 1 and 3);
