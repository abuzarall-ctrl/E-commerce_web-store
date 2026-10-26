-- Run this once in Supabase Dashboard > SQL Editor.
-- Allows guest checkout (orders placed without an account).
-- Safe to run even if the column is already nullable.

alter table public.orders
  alter column user_id drop not null;
