-- Add every synchronized table to Supabase Realtime exactly once.
-- Realtime notifications tell other signed-in devices when they should refresh.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['subjects', 'pdf_reviewers', 'notes', 'questions', 'test_sessions']
  loop
    -- The existence check makes this migration safe to rerun.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
