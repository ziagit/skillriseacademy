-- Fixes from Supabase security/performance advisors.

-- Trigger functions should never be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Evaluate auth.uid() once per query instead of once per row.
do $$
declare
  p record;
  stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
  loop
    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if p.qual is not null then
      stmt := stmt || format(' using (%s)', replace(p.qual, 'auth.uid()', '(select auth.uid())'));
    end if;
    if p.with_check is not null then
      stmt := stmt || format(' with check (%s)', replace(p.with_check, 'auth.uid()', '(select auth.uid())'));
    end if;
    execute stmt;
  end loop;
end;
$$;

-- "for all" manage policies overlap the read policies on SELECT; split them
-- into insert/update/delete so reads are checked by a single policy.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('categories', 'categories: admin write', 'public.is_admin()'),
      ('site_settings', 'settings: admin write', 'public.is_admin()'),
      ('modules', 'modules: manage', 'public.can_manage_course(course_id)'),
      ('lessons', 'lessons: manage', 'public.can_manage_course(course_id)'),
      ('quizzes', 'quizzes: manage', 'public.can_manage_course(course_id)'),
      ('assignments', 'assignments: manage', 'public.can_manage_course(course_id)'),
      ('quiz_questions', 'questions: manage',
       'exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id))')
    ) as v(tbl, pol, expr)
  loop
    execute format('drop policy if exists %I on public.%I', t.pol, t.tbl);
    execute format('create policy %I on public.%I for insert with check (%s)', t.pol || ' (insert)', t.tbl, t.expr);
    execute format('create policy %I on public.%I for update using (%s) with check (%s)', t.pol || ' (update)', t.tbl, t.expr, t.expr);
    execute format('create policy %I on public.%I for delete using (%s)', t.pol || ' (delete)', t.tbl, t.expr);
  end loop;
end;
$$;

-- Cover foreign keys used by joins and cascades.
create index if not exists announcements_author_id_idx on public.announcements (author_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);
create index if not exists quizzes_module_id_idx on public.quizzes (module_id);
create index if not exists submissions_graded_by_idx on public.submissions (graded_by);
create index if not exists teacher_applications_reviewed_by_idx on public.teacher_applications (reviewed_by);
