-- Products tracked by users
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  url text not null,
  current_price numeric,
  currency text not null default 'PLN',
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, url)
);

-- Price check history
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  price numeric not null,
  currency text not null default 'PLN',
  checked_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists price_history_product_id_idx on public.price_history (product_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.price_history enable row level security;

-- Products RLS
create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id);

create policy "Users can delete own products"
  on public.products for delete
  using (auth.uid() = user_id);

-- Price history RLS (via product ownership)
create policy "Users can view own price history"
  on public.price_history for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert own price history"
  on public.price_history for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own price history"
  on public.price_history for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.user_id = auth.uid()
    )
  );
