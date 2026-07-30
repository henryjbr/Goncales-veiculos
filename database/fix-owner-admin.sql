-- Gonçales Veículos - correção rápida do acesso do dono
-- Rode este arquivo no SQL Editor do Supabase depois de criar o usuário em Authentication.

create or replace function public.claim_owner_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select email
  into current_email
  from auth.users
  where id = auth.uid();

  if lower(coalesce(current_email, '')) <> lower('henryjbrosal@gmail.com') then
    raise exception 'This user is not allowed to manage this store';
  end if;

  insert into public.app_admins (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  return true;
end;
$$;

revoke all on function public.claim_owner_admin() from public;
grant execute on function public.claim_owner_admin() to authenticated;

insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = lower('henryjbrosal@gmail.com')
on conflict (user_id) do nothing;
