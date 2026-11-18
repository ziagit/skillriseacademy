create table if not exists public.home_featured_teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  headline text,
  photo_url text,
  youtube_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists home_featured_teachers_order_idx
  on public.home_featured_teachers (published, sort_order, created_at);

alter table public.home_featured_teachers enable row level security;

drop policy if exists "home_featured_teachers: read" on public.home_featured_teachers;
create policy "home_featured_teachers: read"
  on public.home_featured_teachers for select
  using (published or public.is_admin());

drop policy if exists "home_featured_teachers: admin write" on public.home_featured_teachers;
create policy "home_featured_teachers: admin write"
  on public.home_featured_teachers for all
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
