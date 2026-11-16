-- Removes everything demo_catalog.sql created: its instructors and, through
-- foreign-key cascades, their courses, modules, lessons, quizzes, assignments,
-- enrollments on those courses and blog posts.
delete from public.courses where teacher_id in (select id from auth.users where email like '%@demo.skillriseacademy.org');
delete from auth.users where email like '%@demo.skillriseacademy.org';
