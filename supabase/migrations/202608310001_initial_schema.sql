-- Initial private cloud schema for Reviewer Organizer.
-- Tables store account-owned study data; RLS and Storage policies isolate users.

-- UUID generation is used for records created on any device.
create extension if not exists pgcrypto;

-- Core study-content tables. Deleting an account or subject cascades to its children.
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pdf_reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  content text not null default '',
  note_level smallint not null default 1 check (note_level between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  prompt text not null,
  accepted_answers text[] not null default '{}',
  explanation text not null default '',
  level smallint not null default 1 check (level between 1 and 4),
  total_attempts integer not null default 0,
  total_correct integer not null default 0,
  last_answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  subject_name text not null,
  level smallint not null check (level between 1 and 4),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  question_count integer not null default 0,
  correct_count integer not null default 0,
  skipped_count integer not null default 0,
  percentage numeric(5,2) not null default 0,
  answers jsonb not null default '[]'::jsonb
);

-- Indexes keep the app's per-user and per-subject queries fast as data grows.
create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists pdf_reviewers_user_subject_idx on public.pdf_reviewers(user_id, subject_id);
create index if not exists notes_user_subject_idx on public.notes(user_id, subject_id);
create index if not exists questions_user_subject_level_idx on public.questions(user_id, subject_id, level);
create index if not exists test_sessions_user_subject_idx on public.test_sessions(user_id, subject_id, completed_at desc);

-- PostgreSQL maintains updated_at consistently instead of trusting each client.
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at before update on public.subjects for each row execute function public.set_updated_at();
drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions for each row execute function public.set_updated_at();

-- Row Level Security (RLS) is the main boundary between student accounts.
alter table public.subjects enable row level security;
alter table public.pdf_reviewers enable row level security;
alter table public.notes enable row level security;
alter table public.questions enable row level security;
alter table public.test_sessions enable row level security;

-- USING controls readable/changeable rows; WITH CHECK controls newly written rows.
create policy "Users manage their own subjects" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own PDFs" on public.pdf_reviewers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own questions" on public.questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own test sessions" on public.test_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PDFs use a private bucket; temporary signed URLs provide time-limited access.
insert into storage.buckets (id, name, public)
values ('reviewer-pdfs', 'reviewer-pdfs', false)
on conflict (id) do nothing;

-- The first path folder must equal the authenticated user ID (user/subject/pdf.pdf).
create policy "Users read their own reviewer PDFs" on storage.objects for select to authenticated
using (bucket_id = 'reviewer-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users upload their own reviewer PDFs" on storage.objects for insert to authenticated
with check (bucket_id = 'reviewer-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their own reviewer PDFs" on storage.objects for update to authenticated
using (bucket_id = 'reviewer-pdfs' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'reviewer-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their own reviewer PDFs" on storage.objects for delete to authenticated
using (bucket_id = 'reviewer-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
