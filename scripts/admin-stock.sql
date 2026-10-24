-- Run this once in Supabase Dashboard > SQL Editor.
-- Adds quantity-based stock tracking and order stock bookkeeping.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'stock_quantity'
  ) then
    alter table public.products
      add column stock_quantity integer not null default 0;

    -- Give the existing catalogue a sensible starting quantity.
    update public.products
    set stock_quantity = case
      when stock_status = 'out of stock' then 0
      when stock_status = 'low stock' then 4
      else 25
    end;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'stock_deducted'
  ) then
    alter table public.orders
      add column stock_deducted boolean not null default false;

    -- Existing confirmed/shipped/delivered orders already consumed stock.
    update public.orders
    set stock_deducted = true
    where status in ('confirmed', 'shipped', 'delivered');
  end if;
end $$;

grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.orders to service_role;
