-- Run this once in Supabase Dashboard > SQL Editor.
-- Enables RLS on orders and allows authenticated users to insert/read their own orders.

alter table public.orders enable row level security;

-- Allow authenticated users to insert their own orders
drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow authenticated users to read their own orders
drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow service role full access (for admin operations)
drop policy if exists "Service role can manage orders" on public.orders;
create policy "Service role can manage orders"
  on public.orders
  for all
  to service_role
  using (true)
  with check (true);
