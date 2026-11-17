-- ─────────────────────────────────────────────────────────────
-- Home page content managed from Admin → Home page: hero slides,
-- partner organizations, learner reviews and FAQs, plus a switch
-- for which teachers appear on the home page.
-- `lang` null means the row shows in every language.
-- ─────────────────────────────────────────────────────────────

create table public.home_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  title text not null,
  body text,
  cta_label text,
  cta_url text,
  cta2_label text,
  cta2_url text,
  theme text not null default 'blue',
  art text not null default 'certificate',
  image_url text,
  audience text not null default 'all' check (audience in ('all', 'guests', 'members')),
  lang text check (lang in ('en', 'fa')),
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  logo_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  photo_url text,
  rating int not null default 5 check (rating between 1 and 5),
  lang text check (lang in ('en', 'fa')),
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  lang text check (lang in ('en', 'fa')),
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Everyone reads published rows; only admins see drafts and write.
do $$
declare t text;
begin
  foreach t in array array['home_slides', 'partners', 'testimonials', 'faqs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: read" on public.%I for select using (published or public.is_admin())', t, t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Teachers listed on the home page; admins choose, teachers can't change it themselves.
alter table public.profiles add column show_on_home boolean not null default true;

create or replace function public.protect_profile_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.show_on_home := old.show_on_home;
  end if;
  return new;
end;
$$;

-- Starting content: the slides and FAQs the site shipped with, plus sample partners and
-- reviews for admins to replace with real ones.
insert into public.home_slides (eyebrow, title, body, cta_label, cta_url, cta2_label, cta2_url, theme, art, audience, lang, sort_order) values
  ('Non-profit · 100% free learning', 'Learn without limits, completely free', 'Practical courses in AI, design, marketing, English and more, taught by real practitioners. Every course and certificate is free.', 'Join for free', '/signup', 'Explore courses', '/courses', 'blue', 'certificate', 'guests', 'en', 1),
  (null, 'Welcome back, {name}', 'Pick up where you left off, or find something new to learn today.', 'Go to My Learning', '/dashboard', null, null, 'blue', 'certificate', 'members', 'en', 1),
  ('For Teachers', 'Share your expertise with the world', 'Volunteer as a teacher and help learners build skills that change their lives.', 'Become a teacher', '/teach', null, null, 'dark', 'teacher', 'all', 'en', 2),
  ('Verified certificates', 'Earn certificates anyone can verify', 'Finish a course to get a free certificate with a unique ID that employers can check online.', 'Explore courses', '/courses', 'Verify a certificate', '/verify', 'green', 'badge', 'all', 'en', 3),
  ('Support the mission', 'Help keep learning free for everyone', 'SkillRise is a non-profit. Your donation funds new courses and reaches more learners.', 'Donate today', '/donate', null, null, 'violet', 'heart', 'all', 'en', 4);

insert into public.testimonials (name, role, quote, lang, sort_order) values
  ('Mariam A.', 'Graphic Design learner', 'I had never opened a design tool before. Six weeks later I delivered my first paid logo project to a local shop.', 'en', 1),
  ('Ahmad R.', 'Freelancing learner', 'The lessons are short and practical, so I could study on my phone after work. Now I find clients online every month.', 'en', 2),
  ('Sana K.', 'English Language learner', 'Being able to learn for free, at my own pace, made all the difference. My confidence in interviews has grown a lot.', 'en', 3),
  ('Farid N.', 'Artificial Intelligence learner', 'The teacher explained AI tools in a way I could use right away. I automate parts of my job I used to do by hand.', 'en', 4);

insert into public.faqs (question, answer, lang, sort_order) values
  ('Are the courses really free?', 'Yes. SkillRise Academy is a non-profit organization. Every course, quiz and certificate is free. We are funded by donations from people who believe in our mission.', 'en', 1),
  ('Do I get a certificate?', 'When you complete every lesson and pass all quizzes in a course, you can download a certificate with a unique verification code that employers can check on our website.', 'en', 2),
  ('Who teaches the courses?', 'Our teachers are practitioners and volunteers who work in the fields they teach. Every teacher is reviewed and approved by our team before they can publish courses.', 'en', 3),
  ('Do I need any special equipment?', 'Most courses only need a smartphone or computer and an internet connection. Course pages list any extra requirements, such as software.', 'en', 4),
  ('How can I support SkillRise?', 'You can donate, volunteer as a teacher, or simply share our courses with someone who could benefit from them.', 'en', 5);

insert into public.home_slides (eyebrow, title, body, cta_label, cta_url, cta2_label, cta2_url, theme, art, audience, lang, sort_order) values
  ('غیرانتفاعی · یادگیری ۱۰۰٪ رایگان', 'یادگیری بدون مرز، کاملاً رایگان', 'دوره‌های کاربردی در هوش مصنوعی، طراحی، بازاریابی، زبان انگلیسی و بیشتر، با تدریس متخصصان واقعی. همهٔ دوره‌ها و گواهینامه‌ها رایگان است.', 'ثبت‌نام رایگان', '/signup', 'مشاهدهٔ دوره‌ها', '/courses', 'blue', 'certificate', 'guests', 'fa', 1),
  (null, '{name}، خوش برگشتید', 'از همان جایی که ماندید ادامه دهید یا امروز چیز تازه‌ای برای یادگیری پیدا کنید.', 'رفتن به یادگیری من', '/dashboard', null, null, 'blue', 'certificate', 'members', 'fa', 1),
  ('برای مدرسان', 'دانش خود را با دنیا به اشتراک بگذارید', 'به‌عنوان مدرس داوطلب، به یادگیرندگان کمک کنید مهارت‌هایی بسازند که زندگی‌شان را تغییر می‌دهد.', 'مدرس شوید', '/teach', null, null, 'dark', 'teacher', 'all', 'fa', 2),
  ('گواهینامه‌های معتبر', 'گواهینامه‌ای بگیرید که همه می‌توانند استعلام کنند', 'دوره را تمام کنید و گواهینامه‌ای رایگان با شناسهٔ یکتا بگیرید که کارفرمایان می‌توانند آنلاین بررسی کنند.', 'مشاهدهٔ دوره‌ها', '/courses', 'استعلام گواهینامه', '/verify', 'green', 'badge', 'all', 'fa', 3),
  ('از مأموریت ما حمایت کنید', 'کمک کنید یادگیری برای همه رایگان بماند', 'اسکیل‌رایز سازمانی غیرانتفاعی است. کمک شما هزینهٔ دوره‌های تازه را تأمین می‌کند و به یادگیرندگان بیشتری می‌رسد.', 'همین امروز کمک کنید', '/donate', null, null, 'violet', 'heart', 'all', 'fa', 4);

insert into public.testimonials (name, role, quote, lang, sort_order) values
  ('مریم ا.', 'یادگیرندهٔ طراحی گرافیک', 'پیش از این هرگز با نرم‌افزار طراحی کار نکرده بودم. شش هفته بعد اولین پروژهٔ لوگوی پولی‌ام را برای یک مغازهٔ محلی تحویل دادم.', 'fa', 1),
  ('احمد ر.', 'یادگیرندهٔ فریلنسینگ', 'درس‌ها کوتاه و کاربردی‌اند، پس می‌توانستم بعد از کار با گوشی‌ام درس بخوانم. حالا هر ماه به‌صورت آنلاین مشتری پیدا می‌کنم.', 'fa', 2),
  ('ثنا ک.', 'یادگیرندهٔ زبان انگلیسی', 'یادگیری رایگان و با سرعت خودم همه‌چیز را تغییر داد. اعتمادبه‌نفسم در مصاحبه‌ها خیلی بیشتر شده است.', 'fa', 3),
  ('فرید ن.', 'یادگیرندهٔ هوش مصنوعی', 'استاد ابزارهای هوش مصنوعی را طوری توضیح داد که فوراً توانستم از آن‌ها استفاده کنم. حالا بخشی از کارهایم را خودکار انجام می‌دهم.', 'fa', 4);

insert into public.faqs (question, answer, lang, sort_order) values
  ('آیا دوره‌ها واقعاً رایگان هستند؟', 'بله. آکادمی اسکیل‌رایز یک سازمان غیرانتفاعی است. همهٔ دوره‌ها، آزمون‌ها و گواهینامه‌ها رایگان‌اند. هزینه‌های ما از کمک‌های افرادی تأمین می‌شود که به مأموریت ما باور دارند.', 'fa', 1),
  ('آیا گواهینامه دریافت می‌کنم؟', 'وقتی همهٔ درس‌های یک دوره را کامل کنید و در همهٔ آزمون‌ها قبول شوید، می‌توانید گواهینامه‌ای با کد استعلام یکتا دریافت کنید که کارفرمایان می‌توانند آن را در وب‌سایت ما بررسی کنند.', 'fa', 2),
  ('چه کسانی دوره‌ها را تدریس می‌کنند؟', 'مدرسان ما متخصصان و داوطلبانی هستند که در همان حوزه‌ای که تدریس می‌کنند کار می‌کنند. هر مدرس پیش از انتشار دوره توسط تیم ما بررسی و تأیید می‌شود.', 'fa', 3),
  ('آیا به تجهیزات خاصی نیاز دارم؟', 'بیشتر دوره‌ها فقط به یک گوشی هوشمند یا رایانه و اینترنت نیاز دارند. نیازهای اضافی، مثل نرم‌افزار، در صفحهٔ هر دوره ذکر شده است.', 'fa', 4),
  ('چگونه می‌توانم از اسکیل‌رایز حمایت کنم؟', 'می‌توانید کمک مالی کنید، به‌عنوان مدرس داوطلب شوید، یا به‌سادگی دوره‌های ما را با کسی که از آن‌ها بهره می‌برد به اشتراک بگذارید.', 'fa', 5);

insert into public.partners (name, sort_order) values
  ('Community Learning Network', 1),
  ('Youth Skills Foundation', 2),
  ('Women in Tech Initiative', 3),
  ('Open Education Alliance', 4),
  ('Digital Freelancers Hub', 5),
  ('Local Media Collective', 6);
