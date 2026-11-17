-- Teacher profile videos are managed by admins and may be left unset.
alter table public.profiles add column youtube_url text;

create or replace function public.protect_profile_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.show_on_home := old.show_on_home;
    new.youtube_url := old.youtube_url;
  end if;
  return new;
end;
$$;
