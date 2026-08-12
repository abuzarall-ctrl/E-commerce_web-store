-- Run this once in Supabase Dashboard > SQL Editor.
-- It allows users whose app_metadata role is admin to manage products directly.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.products to service_role;
grant usage, select on all sequences in schema public to service_role;

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Service role can manage products" on public.products;
create policy "Service role can manage products"
  on public.products
  for all
  to service_role
  using (true)
  with check (true);
