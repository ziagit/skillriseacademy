-- Demo instructor that owns the demo courses (run before demo_courses.sql).
-- It has no password, so nobody can sign in as it. Move its courses to a real
-- teacher later with: update public.courses set teacher_id = '<uuid>' where teacher_id = '<this id>';
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       'demo-instructor@skillriseacademy.org', '',
       '{"provider": "email", "providers": ["email"]}', '{"full_name": "SkillRise Academy Team"}',
       now(), now()
where not exists (select 1 from auth.users where email = 'demo-instructor@skillriseacademy.org');

update public.profiles
set role = 'teacher',
    headline = 'Volunteer instructors at SkillRise Academy',
    bio = 'Our team of volunteer instructors builds free, practical courses to help learners everywhere gain job-ready skills.'
where id = (select id from auth.users where email = 'demo-instructor@skillriseacademy.org');
