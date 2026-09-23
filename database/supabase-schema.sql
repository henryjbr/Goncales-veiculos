-- Gonçales Veículos - Supabase schema
-- Cole este arquivo no SQL Editor do Supabase.
--
-- Antes de rodar:
-- 1. Confirme a URL e anon key em js/supabase-config.js.
-- 2. Rode o SQL inteiro.
--
-- Modelo de acesso:
-- - O catálogo público consulta somente veículos publicados e reservados pelo frontend.
-- - A área do dono abre sem login e pode criar/editar/remover usando a anon key.
-- - RLS fica ativa em todas as tabelas públicas.
-- - Imagens ficam em bucket público para o site estático conseguir exibir,
--   e upload/update/delete ficam liberados para o painel sem login.
--
-- Importante:
-- Nunca use a service_role key no frontend. Use somente anon/public key no site.

create extension if not exists pgcrypto;

do $$
begin
  create type public.vehicle_status as enum ('draft', 'published', 'reserved', 'sold', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.vehicle_fuel as enum ('flex', 'gasolina', 'diesel', 'hibrido', 'eletrico');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.vehicle_transmission as enum ('manual', 'automatico', 'cvt');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id boolean primary key default true,
  store_name text not null default 'Gonçales Veículos',
  whatsapp text not null default '',
  instagram_url text,
  address text,
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id),
  constraint store_settings_whatsapp_digits check (whatsapp ~ '^[0-9]{0,20}$')
);

insert into public.store_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  model_year text not null,
  mileage_km integer not null default 0,
  price_cents integer not null,
  fuel public.vehicle_fuel not null default 'flex',
  transmission public.vehicle_transmission not null default 'automatico',
  color text not null,
  status public.vehicle_status not null default 'draft',
  cover_image_url text,
  highlights text[] not null default '{}',
  engine text,
  horsepower integer,
  torque text,
  drivetrain text,
  doors integer,
  seats integer,
  plate_final text,
  description text not null default '',
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_name_length check (char_length(name) between 2 and 120),
  constraint vehicles_version_length check (char_length(version) between 2 and 180),
  constraint vehicles_model_year_length check (char_length(model_year) between 4 and 20),
  constraint vehicles_mileage_nonnegative check (mileage_km >= 0),
  constraint vehicles_price_positive check (price_cents > 0),
  constraint vehicles_color_length check (char_length(color) between 2 and 60),
  constraint vehicles_engine_length check (engine is null or char_length(engine) <= 80),
  constraint vehicles_horsepower_range check (horsepower is null or horsepower between 1 and 2000),
  constraint vehicles_torque_length check (torque is null or char_length(torque) <= 50),
  constraint vehicles_drivetrain_length check (drivetrain is null or char_length(drivetrain) <= 60),
  constraint vehicles_doors_range check (doors is null or doors between 1 and 8),
  constraint vehicles_seats_range check (seats is null or seats between 1 and 12),
  constraint vehicles_plate_final_length check (plate_final is null or plate_final ~ '^[0-9A-Za-z]{1}$'),
  constraint vehicles_description_length check (char_length(description) <= 2000),
  constraint vehicles_highlights_limit check (array_length(highlights, 1) is null or array_length(highlights, 1) <= 8)
);

alter table public.vehicles
  add column if not exists engine text,
  add column if not exists horsepower integer,
  add column if not exists torque text,
  add column if not exists drivetrain text,
  add column if not exists doors integer,
  add column if not exists seats integer,
  add column if not exists plate_final text;

do $$
begin
  alter table public.vehicles add constraint vehicles_engine_length check (engine is null or char_length(engine) <= 80);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.vehicles add constraint vehicles_horsepower_range check (horsepower is null or horsepower between 1 and 2000);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.vehicles add constraint vehicles_torque_length check (torque is null or char_length(torque) <= 50);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.vehicles add constraint vehicles_drivetrain_length check (drivetrain is null or char_length(drivetrain) <= 60);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.vehicles add constraint vehicles_doors_range check (doors is null or doors between 1 and 8);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.vehicles add constraint vehicles_seats_range check (seats is null or seats between 1 and 12);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.vehicles add constraint vehicles_plate_final_length check (plate_final is null or plate_final ~ '^[0-9A-Za-z]{1}$');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint vehicle_images_alt_length check (char_length(alt_text) <= 180)
);

create index if not exists vehicles_public_catalog_idx
  on public.vehicles (status, sort_order desc, created_at desc)
  where status in ('published', 'reserved');

create index if not exists vehicle_images_vehicle_idx
  on public.vehicle_images (vehicle_id, sort_order asc, created_at asc);

create or replace function public.enforce_vehicle_images_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.vehicle_images
    where vehicle_id = new.vehicle_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 10 then
    raise exception 'Cada veiculo pode ter no maximo 10 fotos.';
  end if;

  return new;
end;
$$;

drop trigger if exists vehicle_images_limit_trigger on public.vehicle_images;
create trigger vehicle_images_limit_trigger
before insert or update of vehicle_id on public.vehicle_images
for each row execute function public.enforce_vehicle_images_limit();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_vehicle_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  end if;

  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_vehicles_updated_at on public.vehicles;
drop trigger if exists set_vehicles_audit_fields on public.vehicles;
create trigger set_vehicles_audit_fields
before insert or update on public.vehicles
for each row execute function public.set_vehicle_audit_fields();

alter table public.app_admins enable row level security;
alter table public.store_settings enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;

revoke all on table public.app_admins from anon, authenticated;
revoke all on table public.store_settings from anon, authenticated;
revoke all on table public.vehicles from anon, authenticated;
revoke all on table public.vehicle_images from anon, authenticated;

grant select on table public.store_settings to anon, authenticated;
grant select on table public.vehicles to anon, authenticated;
grant select on table public.vehicle_images to anon, authenticated;

grant insert, update, delete on table public.store_settings to anon, authenticated;
grant insert, update, delete on table public.vehicles to anon, authenticated;
grant insert, update, delete on table public.vehicle_images to anon, authenticated;
grant select on table public.app_admins to authenticated;

drop policy if exists "Admins can read admin list" on public.app_admins;
create policy "Admins can read admin list"
on public.app_admins
for select
to authenticated
using (public.is_app_admin());

drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings"
on public.store_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can update store settings" on public.store_settings;
drop policy if exists "Owner panel can update store settings without login" on public.store_settings;
create policy "Owner panel can update store settings without login"
on public.store_settings
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public can read available vehicles" on public.vehicles;
drop policy if exists "Owner panel can read all vehicles without login" on public.vehicles;
create policy "Owner panel can read all vehicles without login"
on public.vehicles
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can read all vehicles" on public.vehicles;

drop policy if exists "Admins can insert vehicles" on public.vehicles;
drop policy if exists "Owner panel can insert vehicles without login" on public.vehicles;
create policy "Owner panel can insert vehicles without login"
on public.vehicles
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can update vehicles" on public.vehicles;
drop policy if exists "Owner panel can update vehicles without login" on public.vehicles;
create policy "Owner panel can update vehicles without login"
on public.vehicles
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admins can delete vehicles" on public.vehicles;
drop policy if exists "Owner panel can delete vehicles without login" on public.vehicles;
create policy "Owner panel can delete vehicles without login"
on public.vehicles
for delete
to anon, authenticated
using (true);

drop policy if exists "Public can read images for available vehicles" on public.vehicle_images;
drop policy if exists "Owner panel can read vehicle images without login" on public.vehicle_images;
create policy "Owner panel can read vehicle images without login"
on public.vehicle_images
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can read all vehicle images" on public.vehicle_images;

drop policy if exists "Admins can insert vehicle images" on public.vehicle_images;
drop policy if exists "Owner panel can insert vehicle images without login" on public.vehicle_images;
create policy "Owner panel can insert vehicle images without login"
on public.vehicle_images
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can update vehicle images" on public.vehicle_images;
drop policy if exists "Owner panel can update vehicle images without login" on public.vehicle_images;
create policy "Owner panel can update vehicle images without login"
on public.vehicle_images
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admins can delete vehicle images" on public.vehicle_images;
drop policy if exists "Owner panel can delete vehicle images without login" on public.vehicle_images;
create policy "Owner panel can delete vehicle images without login"
on public.vehicle_images
for delete
to anon, authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view vehicle image objects" on storage.objects;
create policy "Public can view vehicle image objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'vehicle-images');

drop policy if exists "Admins can upload vehicle images" on storage.objects;
drop policy if exists "Owner panel can upload vehicle images without login" on storage.objects;
create policy "Owner panel can upload vehicle images without login"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'vehicle-images'
);

drop policy if exists "Admins can update vehicle images" on storage.objects;
drop policy if exists "Owner panel can update stored vehicle images without login" on storage.objects;
create policy "Owner panel can update stored vehicle images without login"
on storage.objects
for update
to anon, authenticated
using (
  bucket_id = 'vehicle-images'
)
with check (
  bucket_id = 'vehicle-images'
);

drop policy if exists "Admins can delete vehicle images" on storage.objects;
drop policy if exists "Owner panel can delete stored vehicle images without login" on storage.objects;
create policy "Owner panel can delete stored vehicle images without login"
on storage.objects
for delete
to anon, authenticated
using (
  bucket_id = 'vehicle-images'
);

-- Compatibilidade com instalacoes antigas que ainda tenham dono autenticado.
insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = lower('henryjbrosal@gmail.com')
on conflict (user_id) do nothing;

-- Exemplo opcional de leitura pública usada pelo site:
-- select * from public.vehicles where status in ('published', 'reserved') order by sort_order desc, created_at desc;
