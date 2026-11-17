create table if not exists public.home_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  channel text,
  youtube_url text not null unique,
  thumbnail_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists home_videos_order_idx
  on public.home_videos (published, sort_order, created_at);

alter table public.home_videos enable row level security;

drop policy if exists "home_videos: read" on public.home_videos;
create policy "home_videos: read"
  on public.home_videos for select
  using (published or public.is_admin());

drop policy if exists "home_videos: admin write" on public.home_videos;
create policy "home_videos: admin write"
  on public.home_videos for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.home_videos (title, channel, youtube_url, thumbnail_url, sort_order) values
  ('But what is a neural network? | Deep learning chapter 1', '3Blue1Brown', 'https://www.youtube.com/watch?v=aircAruvnKk', 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg', 1),
  ('Learn Python - Full Course for Beginners [Tutorial]', 'freeCodeCamp.org', 'https://www.youtube.com/watch?v=rfscVS0vtbw', 'https://img.youtube.com/vi/rfscVS0vtbw/hqdefault.jpg', 2),
  ('HTML Full Course - Build a Website Tutorial', 'freeCodeCamp.org', 'https://www.youtube.com/watch?v=pQN-pnXPaVg', 'https://img.youtube.com/vi/pQN-pnXPaVg/hqdefault.jpg', 3),
  ('Learn JavaScript - Full Course for Beginners', 'freeCodeCamp.org', 'https://www.youtube.com/watch?v=PkZNo7MFNFg', 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg', 4)
on conflict (youtube_url) do nothing;

notify pgrst, 'reload schema';
