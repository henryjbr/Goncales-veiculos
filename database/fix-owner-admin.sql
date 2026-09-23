-- Goncales Veiculos - correcao rapida para area do dono sem login
-- Rode este arquivo no SQL Editor do Supabase se o banco ja existia com login.

grant select on table public.store_settings to anon, authenticated;
grant select on table public.vehicles to anon, authenticated;
grant select on table public.vehicle_images to anon, authenticated;

grant insert, update, delete on table public.store_settings to anon, authenticated;
grant insert, update, delete on table public.vehicles to anon, authenticated;
grant insert, update, delete on table public.vehicle_images to anon, authenticated;

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

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'vehicle-images';

drop policy if exists "Admins can update store settings" on public.store_settings;
drop policy if exists "Owner panel can update store settings without login" on public.store_settings;
create policy "Owner panel can update store settings without login"
on public.store_settings
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public can read available vehicles" on public.vehicles;
drop policy if exists "Admins can read all vehicles" on public.vehicles;
drop policy if exists "Owner panel can read all vehicles without login" on public.vehicles;
create policy "Owner panel can read all vehicles without login"
on public.vehicles
for select
to anon, authenticated
using (true);

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
drop policy if exists "Admins can read all vehicle images" on public.vehicle_images;
drop policy if exists "Owner panel can read vehicle images without login" on public.vehicle_images;
create policy "Owner panel can read vehicle images without login"
on public.vehicle_images
for select
to anon, authenticated
using (true);

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

drop policy if exists "Admins can upload vehicle images" on storage.objects;
drop policy if exists "Owner panel can upload vehicle images without login" on storage.objects;
create policy "Owner panel can upload vehicle images without login"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'vehicle-images');

drop policy if exists "Admins can update vehicle images" on storage.objects;
drop policy if exists "Owner panel can update stored vehicle images without login" on storage.objects;
create policy "Owner panel can update stored vehicle images without login"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'vehicle-images')
with check (bucket_id = 'vehicle-images');

drop policy if exists "Admins can delete vehicle images" on storage.objects;
drop policy if exists "Owner panel can delete stored vehicle images without login" on storage.objects;
create policy "Owner panel can delete stored vehicle images without login"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'vehicle-images');
