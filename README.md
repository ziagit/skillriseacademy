# SkillRise Academy

Website and learning platform for **skillriseacademy.org**, a non-profit that teaches free online courses in AI, graphic design, digital marketing, content creation, journalism, computer skills, English, Amazon/e-commerce, painting and more.

Built with **React 19 + Vite + Tailwind CSS 4**, backed by **Supabase** (Postgres, Auth, Storage), and deployed on **Vercel**.

## What's included

| Area | Features |
| --- | --- |
| **Public site** | Home, course catalog (search, filter by category/level), course pages with curriculum and free preview lessons, About, Blog, Donate, Contact, Become a teacher, certificate verification |
| **Student portal** | Dashboard, my courses with progress, course player (YouTube/Vimeo lessons, notes, progress tracking), quizzes, assignments, course announcements, certificates |
| **Teacher portal** | Overview stats, course builder (details, sections, lessons, quizzes, assignments, students, announcements), submission grading, blog writing |
| **Admin dashboard** | Platform stats and charts, users (roles, suspend), teacher applications, course review/publishing/featuring, categories, blog moderation, site-wide announcements, certificates (revoke), contact messages, site settings (contact info, donation link/bank details, social links) |

### How the roles work

- Everyone signs up as a **student**. Sign-up has an "I also want to teach" option, or students can apply later from `/teach`.
- An **admin** approves applications, which promotes the user to **teacher**.
- Teachers build courses and submit them **for review**. Admins publish them, or return them with a note. Blog posts follow the same flow.
- Students who complete all lessons and pass all quizzes can claim a **certificate** with a unique ID (`SRA-XXXXXXXXXX`). Anyone can verify it at `/verify`.

Security lives in the database, not only the UI. Row Level Security protects every table. Quiz answers are graded server-side, so answer keys never reach the browser. Students can't grade their own work, change their own role, or publish content.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com). A region close to your learners is best, e.g. `ap-south-1` (Mumbai).
2. Apply the migrations in `supabase/migrations/` **in order**, using either:
   - **SQL Editor**: paste and run `20261101000000_init_schema.sql`, then `20261101000100_seed_data.sql`, or
   - **Supabase CLI**: `supabase link --project-ref <ref>` then `supabase db push`.
3. **Authentication → URL Configuration**:
   - Site URL: `https://skillriseacademy.org`
   - Redirect URLs: `https://skillriseacademy.org/**`, `http://localhost:5173/**`
4. *(Recommended)* **Authentication → Emails**: customise the confirmation and password-reset templates with your branding, and set up custom SMTP for production email volume.

### Make yourself an admin

Sign up on the site, then run this in the SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

After that, promote other users from **Admin → Users**.

## 2. Run locally

```bash
cp .env.example .env   # then fill in your project URL and anon/publishable key
npm install
npm run dev
```

The keys are in Supabase under **Project Settings → API**. Never put the `service_role` key in this app.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository and import it in Vercel. Vercel auto-detects Vite: build `npm run build`, output `dist`.
2. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Add the domain `skillriseacademy.org` under **Settings → Domains**.

`vercel.json` already rewrites all routes to `index.html`, so deep links like `/courses/my-course` work.

## After launch

- **Admin → Site settings**: add your donation link (PayPal, Stripe Payment Link, etc.) and/or bank details, contact info, and social links.
- **Admin → Categories**: adjust the 10 starter categories.

## Notes

- **Videos** are YouTube (public or unlisted) or Vimeo links. Nothing is uploaded to Supabase, which keeps storage and bandwidth free.
- **Images** (avatars, thumbnails, blog covers) go to the public `media` storage bucket, max 5 MB each. Each user can only write to their own folder.
- **Lesson content** is readable by anyone who can see a published course, because all courses are free. The app still requires enrollment to use the course player and track progress.
- **Assignments** accept text plus a link (Google Drive, Canva, Behance…) rather than file uploads.

## Project structure

```
src/
  components/      shared UI (buttons, modals, cards…) and app components
  context/         auth + site settings providers
  layouts/         public site layout, dashboard layout
  lib/             supabase client, helpers, data hooks
  pages/
    public/        marketing site, catalog, blog, certificate
    auth/          login, sign-up, password reset
    student/       dashboard, my courses, course player, certificates
    teacher/       dashboard, course builder, submissions, blog
    admin/         admin dashboard and management pages
    shared/        announcements, profile settings
supabase/migrations/   database schema, RLS policies, functions, seed data
```
