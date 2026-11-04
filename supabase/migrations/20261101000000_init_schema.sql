-- SkillRise Academy — core schema
-- Roles: student (default), teacher (approved by admin), admin.

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.course_level as enum ('beginner', 'intermediate', 'advanced', 'all_levels');
create type public.content_status as enum ('draft', 'pending', 'published', 'archived');
create type public.application_status as enum ('pending', 'approved', 'rejected');
create type public.submission_status as enum ('submitted', 'graded', 'returned');

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  headline text,
  bio text,
  country text,
  role public.user_role not null default 'student',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expertise text not null,
  experience text,
  portfolio_url text,
  motivation text,
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.teacher_applications (user_id);
create index on public.teacher_applications (status);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text not null default 'BookOpen',
  color text not null default 'blue',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  level public.course_level not null default 'beginner',
  language text not null default 'English',
  thumbnail_url text,
  outcomes text[] not null default '{}',
  requirements text[] not null default '{}',
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  review_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.courses (teacher_id);
create index on public.courses (category_id);
create index on public.courses (status);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.modules (course_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  video_url text,
  content text,
  duration_minutes int not null default 0,
  is_preview boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.lessons (course_id);
create index on public.lessons (module_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (course_id, student_id)
);
create index on public.enrollments (student_id);

create table public.lesson_progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);
create index on public.lesson_progress (course_id, student_id);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  title text not null,
  description text,
  pass_percent int not null default 70 check (pass_percent between 0 and 100),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.quizzes (course_id);

-- Questions are readable by students; the correct answers live in a separate
-- table that only the course teacher and admins can read.
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question text not null,
  options text[] not null check (array_length(options, 1) between 2 and 6),
  position int not null default 0
);
create index on public.quiz_questions (quiz_id);

create table public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions (id) on delete cascade,
  correct_index int not null check (correct_index >= 0)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  answers int[] not null,
  score int not null,
  total int not null,
  percent int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts (quiz_id, student_id);
create index on public.quiz_attempts (student_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  instructions text,
  due_date timestamptz,
  max_points int not null default 100 check (max_points > 0),
  created_at timestamptz not null default now()
);
create index on public.assignments (course_id);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  content text,
  link_url text,
  status public.submission_status not null default 'submitted',
  grade int,
  feedback text,
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index on public.submissions (course_id);
create index on public.submissions (student_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade, -- null = site-wide
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.announcements (course_id);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  review_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.blog_posts (author_id);
create index on public.blog_posts (status, published_at desc);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  issued_at timestamptz not null default now(),
  unique (course_id, student_id)
);
create index on public.certificates (student_id);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Helper functions (security definer so policies don't recurse)
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin') and status = 'active'
  );
$$;

create or replace function public.owns_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses where id = p_course_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments where course_id = p_course_id and student_id = auth.uid()
  );
$$;

create or replace function public.course_is_visible(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (c.status = 'published' or c.teacher_id = auth.uid() or public.is_admin())
  );
$$;

create or replace function public.teaches_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.student_id = p_student_id and c.teacher_id = auth.uid()
  );
$$;

-- Can the current user manage (edit) this course's content?
create or replace function public.can_manage_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or (public.is_teacher() and public.owns_course(p_course_id));
$$;

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();
create trigger blog_posts_touch before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- New auth user → profile (+ optional teacher application from sign-up form)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if coalesce(new.raw_user_meta_data ->> 'apply_teacher', 'false') = 'true' then
    insert into public.teacher_applications (user_id, expertise, experience, portfolio_url)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'expertise', ''), 'Not specified'),
      new.raw_user_meta_data ->> 'experience',
      new.raw_user_meta_data ->> 'portfolio_url'
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change role/status. auth.uid() is null when run from the
-- SQL editor or with the service role, which is how the first admin is created.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Teachers can move courses/posts between draft and pending; only admins publish.
create or replace function public.guard_publishing()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.status in ('published', 'archived')
       and (tg_op = 'INSERT' or new.status is distinct from old.status) then
      raise exception 'Only administrators can publish or archive content';
    end if;
    if tg_table_name = 'courses' then
      new.featured := case when tg_op = 'INSERT' then false else old.featured end;
    end if;
    -- Editing published content keeps it live; teachers can't take ownership elsewhere.
    if tg_op = 'UPDATE' then
      if tg_table_name = 'courses' then
        new.teacher_id := old.teacher_id;
      else
        new.author_id := old.author_id;
      end if;
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger courses_guard before insert or update on public.courses
  for each row execute function public.guard_publishing();
create trigger blog_posts_guard before insert or update on public.blog_posts
  for each row execute function public.guard_publishing();

-- Students can edit their submission, but not its grade; teachers grade.
create or replace function public.guard_submission()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.can_manage_course(new.course_id) then
    if tg_op = 'UPDATE' then
      if old.status = 'graded' then
        raise exception 'This submission has already been graded';
      end if;
      new.grade := old.grade;
      new.feedback := old.feedback;
      new.graded_by := old.graded_by;
      new.graded_at := old.graded_at;
      new.submitted_at := now();
    else
      new.grade := null;
      new.feedback := null;
      new.graded_by := null;
      new.graded_at := null;
    end if;
    new.status := 'submitted';
  end if;
  -- Keep course_id consistent with the assignment.
  select a.course_id into new.course_id from public.assignments a where a.id = new.assignment_id;
  return new;
end;
$$;

create trigger submissions_guard before insert or update on public.submissions
  for each row execute function public.guard_submission();

-- lesson_progress.course_id must match the lesson.
create or replace function public.sync_progress_course()
returns trigger language plpgsql set search_path = '' as $$
begin
  select l.course_id into new.course_id from public.lessons l where l.id = new.lesson_id;
  return new;
end;
$$;

create trigger lesson_progress_sync before insert on public.lesson_progress
  for each row execute function public.sync_progress_course();

-- ─────────────────────────────────────────────────────────────
-- Row level security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.teacher_applications enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.announcements enable row level security;
alter table public.blog_posts enable row level security;
alter table public.certificates enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

-- profiles: teachers/admins are public (shown on course pages); students are
-- visible to themselves, admins, and teachers of courses they're enrolled in.
create policy "profiles: read" on public.profiles for select using (
  role in ('teacher', 'admin')
  or id = auth.uid()
  or public.is_admin()
  or public.teaches_student(id)
);
create policy "profiles: update own" on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- teacher applications
create policy "applications: read" on public.teacher_applications for select
  using (user_id = auth.uid() or public.is_admin());
create policy "applications: create own" on public.teacher_applications for insert
  with check (user_id = auth.uid() and status = 'pending');
create policy "applications: admin update" on public.teacher_applications for update
  using (public.is_admin()) with check (public.is_admin());
create policy "applications: admin delete" on public.teacher_applications for delete
  using (public.is_admin());

-- categories & settings: public read, admin write
create policy "categories: read" on public.categories for select using (true);
create policy "categories: admin write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "settings: read" on public.site_settings for select using (true);
create policy "settings: admin write" on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- courses
create policy "courses: read" on public.courses for select using (
  status = 'published' or teacher_id = auth.uid() or public.is_admin()
);
create policy "courses: teacher create" on public.courses for insert with check (
  public.is_teacher() and (teacher_id = auth.uid() or public.is_admin())
);
create policy "courses: owner update" on public.courses for update
  using ((teacher_id = auth.uid() and public.is_teacher()) or public.is_admin())
  with check ((teacher_id = auth.uid() and public.is_teacher()) or public.is_admin());
create policy "courses: delete" on public.courses for delete using (
  public.is_admin() or (teacher_id = auth.uid() and status = 'draft')
);

-- modules & lessons: outline is visible wherever the course is visible.
-- Courses are free, so lesson content is not hidden at the database level;
-- the app gates the player behind enrollment.
create policy "modules: read" on public.modules for select using (public.course_is_visible(course_id));
create policy "modules: manage" on public.modules for all
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

create policy "lessons: read" on public.lessons for select using (public.course_is_visible(course_id));
create policy "lessons: manage" on public.lessons for all
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- enrollments
create policy "enrollments: read" on public.enrollments for select using (
  student_id = auth.uid() or public.owns_course(course_id) or public.is_admin()
);
create policy "enrollments: enroll self" on public.enrollments for insert with check (
  student_id = auth.uid() and completed_at is null
  and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
);
create policy "enrollments: leave" on public.enrollments for delete using (
  student_id = auth.uid() or public.is_admin()
);
create policy "enrollments: admin update" on public.enrollments for update
  using (public.is_admin()) with check (public.is_admin());

-- lesson progress
create policy "progress: read" on public.lesson_progress for select using (
  student_id = auth.uid() or public.owns_course(course_id) or public.is_admin()
);
create policy "progress: mark" on public.lesson_progress for insert with check (
  student_id = auth.uid() and public.is_enrolled(course_id)
);
create policy "progress: unmark" on public.lesson_progress for delete using (student_id = auth.uid());

-- quizzes
create policy "quizzes: read" on public.quizzes for select using (public.course_is_visible(course_id));
create policy "quizzes: manage" on public.quizzes for all
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

create policy "questions: read" on public.quiz_questions for select using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and public.course_is_visible(q.course_id))
);
create policy "questions: manage" on public.quiz_questions for all using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id))
) with check (
  exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id))
);

create policy "answer keys: manage" on public.quiz_answer_keys for all using (
  exists (
    select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id and public.can_manage_course(q.course_id)
  )
) with check (
  exists (
    select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id and public.can_manage_course(q.course_id)
  )
);

-- attempts are inserted only through submit_quiz()
create policy "attempts: read" on public.quiz_attempts for select using (
  student_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.quizzes q where q.id = quiz_id and public.owns_course(q.course_id))
);

-- assignments
create policy "assignments: read" on public.assignments for select using (public.course_is_visible(course_id));
create policy "assignments: manage" on public.assignments for all
  using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- submissions
create policy "submissions: read" on public.submissions for select using (
  student_id = auth.uid() or public.can_manage_course(course_id)
);
create policy "submissions: submit" on public.submissions for insert with check (
  student_id = auth.uid() and public.is_enrolled(course_id)
);
create policy "submissions: update" on public.submissions for update
  using (student_id = auth.uid() or public.can_manage_course(course_id))
  with check (student_id = auth.uid() or public.can_manage_course(course_id));
create policy "submissions: delete" on public.submissions for delete using (
  (student_id = auth.uid() and status <> 'graded') or public.is_admin()
);

-- announcements
create policy "announcements: read" on public.announcements for select using (
  (course_id is null and auth.uid() is not null)
  or (course_id is not null and (public.is_enrolled(course_id) or public.can_manage_course(course_id)))
  or public.is_admin()
);
create policy "announcements: create" on public.announcements for insert with check (
  author_id = auth.uid()
  and ((course_id is null and public.is_admin()) or (course_id is not null and public.can_manage_course(course_id)))
);
create policy "announcements: update" on public.announcements for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
create policy "announcements: delete" on public.announcements for delete using (
  author_id = auth.uid() or public.is_admin()
);

-- blog posts
create policy "blog: read" on public.blog_posts for select using (
  status = 'published' or author_id = auth.uid() or public.is_admin()
);
create policy "blog: create" on public.blog_posts for insert with check (
  public.is_teacher() and author_id = auth.uid()
);
create policy "blog: update" on public.blog_posts for update
  using ((author_id = auth.uid() and public.is_teacher()) or public.is_admin())
  with check ((author_id = auth.uid() and public.is_teacher()) or public.is_admin());
create policy "blog: delete" on public.blog_posts for delete using (
  (author_id = auth.uid() and status <> 'published') or public.is_admin()
);

-- certificates are issued only through claim_certificate()
create policy "certificates: read" on public.certificates for select using (
  student_id = auth.uid() or public.owns_course(course_id) or public.is_admin()
);
create policy "certificates: admin delete" on public.certificates for delete using (public.is_admin());

-- contact messages: anyone can send, admins manage
create policy "messages: send" on public.contact_messages for insert with check (is_read = false);
create policy "messages: admin read" on public.contact_messages for select using (public.is_admin());
create policy "messages: admin update" on public.contact_messages for update
  using (public.is_admin()) with check (public.is_admin());
create policy "messages: admin delete" on public.contact_messages for delete using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- RPCs
-- ─────────────────────────────────────────────────────────────

-- Grade a quiz server-side so answer keys never reach the browser.
create or replace function public.submit_quiz(p_quiz_id uuid, p_answers int[])
returns public.quiz_attempts
language plpgsql security definer set search_path = '' as $$
declare
  v_quiz public.quizzes;
  v_total int;
  v_score int;
  v_percent int;
  v_attempt public.quiz_attempts;
begin
  select * into v_quiz from public.quizzes where id = p_quiz_id;
  if v_quiz.id is null then
    raise exception 'Quiz not found';
  end if;
  if not public.is_enrolled(v_quiz.course_id) then
    raise exception 'You must be enrolled in this course to take the quiz';
  end if;

  select count(*),
         count(*) filter (where p_answers[q.rn::int] = k.correct_index)
    into v_total, v_score
  from (
    select qq.id, row_number() over (order by qq.position, qq.id) as rn
    from public.quiz_questions qq where qq.quiz_id = p_quiz_id
  ) q
  left join public.quiz_answer_keys k on k.question_id = q.id;

  if v_total = 0 then
    raise exception 'This quiz has no questions yet';
  end if;

  v_percent := round(v_score * 100.0 / v_total);

  insert into public.quiz_attempts (quiz_id, student_id, answers, score, total, percent, passed)
  values (p_quiz_id, auth.uid(), p_answers, v_score, v_total, v_percent, v_percent >= v_quiz.pass_percent)
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- Course completion: every lesson done and every quiz passed.
create or replace function public.course_completion(p_course_id uuid, p_student_id uuid default auth.uid())
returns table (lessons_total int, lessons_done int, quizzes_total int, quizzes_passed int, complete boolean)
language sql stable security definer set search_path = '' as $$
  with l as (
    select count(*)::int as total,
           count(lp.lesson_id)::int as done
    from public.lessons ls
    left join public.lesson_progress lp on lp.lesson_id = ls.id and lp.student_id = p_student_id
    where ls.course_id = p_course_id
  ), q as (
    select count(*)::int as total,
           count(*) filter (where exists (
             select 1 from public.quiz_attempts a
             where a.quiz_id = qz.id and a.student_id = p_student_id and a.passed
           ))::int as passed
    from public.quizzes qz where qz.course_id = p_course_id
  )
  select l.total, l.done, q.total, q.passed,
         (l.total > 0 and l.done = l.total and q.passed = q.total)
  from l, q
  where p_student_id = auth.uid() or public.can_manage_course(p_course_id);
$$;

create or replace function public.claim_certificate(p_course_id uuid)
returns public.certificates
language plpgsql security definer set search_path = '' as $$
declare
  v_cert public.certificates;
  v_done boolean;
begin
  if not public.is_enrolled(p_course_id) then
    raise exception 'You are not enrolled in this course';
  end if;

  select * into v_cert from public.certificates
  where course_id = p_course_id and student_id = auth.uid();
  if v_cert.id is not null then
    return v_cert;
  end if;

  select complete into v_done from public.course_completion(p_course_id, auth.uid());
  if not coalesce(v_done, false) then
    raise exception 'Complete all lessons and pass all quizzes to earn your certificate';
  end if;

  update public.enrollments set completed_at = now()
  where course_id = p_course_id and student_id = auth.uid() and completed_at is null;

  insert into public.certificates (code, course_id, student_id)
  values ('SRA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), p_course_id, auth.uid())
  returning * into v_cert;
  return v_cert;
end;
$$;

-- Public certificate verification (no login needed).
create or replace function public.verify_certificate(p_code text)
returns table (code text, student_name text, course_title text, teacher_name text, issued_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.code, sp.full_name, co.title, tp.full_name, c.issued_at
  from public.certificates c
  join public.profiles sp on sp.id = c.student_id
  join public.courses co on co.id = c.course_id
  join public.profiles tp on tp.id = co.teacher_id
  where c.code = upper(trim(p_code));
$$;

create or replace function public.review_teacher_application(p_application_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review applications';
  end if;

  update public.teacher_applications
     set status = case when p_approve then 'approved'::public.application_status
                       else 'rejected'::public.application_status end,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_application_id
  returning user_id into v_user;

  if p_approve and v_user is not null then
    update public.profiles set role = 'teacher' where id = v_user and role = 'student';
  end if;
end;
$$;

-- Admin user list with emails from auth.users.
create or replace function public.admin_list_users()
returns table (
  id uuid, full_name text, email text, avatar_url text, role public.user_role,
  status public.account_status, country text, created_at timestamptz, last_sign_in_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  return query
    select p.id, p.full_name, u.email::text, p.avatar_url, p.role, p.status, p.country,
           p.created_at, u.last_sign_in_at
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_stats()
returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  return json_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'teachers', (select count(*) from public.profiles where role = 'teacher'),
    'courses_published', (select count(*) from public.courses where status = 'published'),
    'courses_pending', (select count(*) from public.courses where status = 'pending'),
    'enrollments', (select count(*) from public.enrollments),
    'completions', (select count(*) from public.enrollments where completed_at is not null),
    'certificates', (select count(*) from public.certificates),
    'applications_pending', (select count(*) from public.teacher_applications where status = 'pending'),
    'posts_pending', (select count(*) from public.blog_posts where status = 'pending'),
    'messages_unread', (select count(*) from public.contact_messages where not is_read),
    'signups_by_month', (
      select coalesce(json_agg(row_to_json(m) order by m.month), '[]'::json) from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*) as count
        from public.profiles
        where created_at > date_trunc('month', now()) - interval '5 months'
        group by 1
      ) m
    ),
    'enrollments_by_category', (
      select coalesce(json_agg(row_to_json(c) order by c.count desc), '[]'::json) from (
        select coalesce(cat.name, 'Uncategorized') as name, count(e.id) as count
        from public.enrollments e
        join public.courses co on co.id = e.course_id
        left join public.categories cat on cat.id = co.category_id
        group by 1
      ) c
    )
  );
end;
$$;

-- Public counters for the home page.
create or replace function public.public_stats()
returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'teachers', (select count(*) from public.profiles where role = 'teacher'),
    'courses', (select count(*) from public.courses where status = 'published'),
    'certificates', (select count(*) from public.certificates)
  );
$$;

-- Enrollment counts per published course (for catalog cards).
create or replace function public.course_enrollment_counts()
returns table (course_id uuid, students bigint)
language sql stable security definer set search_path = '' as $$
  select e.course_id, count(*) from public.enrollments e
  join public.courses c on c.id = e.course_id and c.status = 'published'
  group by e.course_id;
$$;

revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.review_teacher_application(uuid, boolean) from public, anon;
revoke execute on function public.submit_quiz(uuid, int[]) from public, anon;
revoke execute on function public.claim_certificate(uuid) from public, anon;
grant execute on function public.admin_list_users(), public.admin_stats(),
  public.review_teacher_application(uuid, boolean), public.submit_quiz(uuid, int[]),
  public.claim_certificate(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage: one public bucket for avatars, thumbnails, blog covers.
-- Files go under "<user id>/..." and only the owner can write there.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "media: owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
