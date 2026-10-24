-- Run this once in Supabase Dashboard > SQL Editor.
-- Adds storefront collections, online payment receipts and refund tracking.

-- Product collection flags managed from the admin panel.
alter table public.products
  add column if not exists is_fast_selling boolean not null default false;
alter table public.products
  add column if not exists is_good_reviews boolean not null default false;

-- Order payment + refund tracking.
alter table public.orders
  add column if not exists payment_method text;
alter table public.orders
  add column if not exists payment_status text not null default 'cod';
alter table public.orders
  add column if not exists payment_receipt_path text;
alter table public.orders
  add column if not exists payment_verified_at timestamptz;
alter table public.orders
  add column if not exists payment_note text;
alter table public.orders
  add column if not exists refund_status text not null default 'none';
alter table public.orders
  add column if not exists refund_reason text;
alter table public.orders
  add column if not exists refund_requested_at timestamptz;
alter table public.orders
  add column if not exists refund_note text;

-- Backfill existing orders.
update public.orders
set payment_method = 'cod'
where payment_method is null;

update public.orders
set payment_status = 'cod'
where payment_status is null;

-- Private bucket for transaction receipts. The server uploads with the
-- service role and creates short-lived signed links for the admin panel.
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- Lets the refund API resolve the short order code shown to customers
-- (for example A1B2C3D4) to the full order row. Only the server-side
-- service role can call it.
create or replace function public.find_order_by_short_code(short_code text)
returns setof public.orders
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.orders
  where id::text ilike (regexp_replace(coalesce(short_code, ''), '[^a-zA-Z0-9-]', '', 'g') || '%')
  limit 1;
$$;

revoke all on function public.find_order_by_short_code(text) from public;
grant execute on function public.find_order_by_short_code(text) to service_role;
