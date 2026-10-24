-- Run this once in Supabase Dashboard > SQL Editor after promoting the main
-- account to super_admin with scripts/make-super-admin.mjs.
-- Super admins keep full product access in the browser client.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'));
