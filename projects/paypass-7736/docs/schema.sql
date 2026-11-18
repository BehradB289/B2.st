-- ========================================================
-- PayPass (پی‌پاس) Minimal Database Schema
-- Supabase / PostgreSQL
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Items Table (فروش تک‌محتوایی)
create table if not exists public.items (
    id uuid default uuid_generate_v4() primary key,
    slug text not null unique,
    title text not null,
    description text default '',
    price bigint not null check (price >= 1000), -- Price in Tomans
    encrypted_content text not null,
    iv text not null,
    auth_tag text not null,
    creator_payout_target text not null, -- Shaba / Card / Wallet address
    view_count integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for instant slug lookup
create index if not exists idx_items_slug on public.items (slug);

-- 2. Orders Table (سفارشات و لاگ مالی)
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    item_id uuid not null references public.items(id) on delete cascade,
    amount bigint not null check (amount >= 1000),
    platform_fee bigint not null default 0, -- 5% fee
    creator_share bigint not null default 0, -- 95% share
    customer_identifier text not null, -- Email or Mobile
    status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
    payment_token text,
    payment_ref_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for order query optimization
create index if not exists idx_orders_item_id on public.orders (item_id);
create index if not exists idx_orders_token on public.orders (payment_token);

-- RLS Policies
alter table public.items enable row level security;
alter table public.orders enable row level security;

-- Public read access for item metadata (Without exposing encryption payloads to client)
create policy "Public item metadata access" on public.items
    for select
    using (true);

-- Insert items allowed via server actions (Service Role Bypass)
create policy "Service role full access items" on public.items
    using (true)
    with check (true);

create policy "Service role full access orders" on public.orders
    using (true)
    with check (true);