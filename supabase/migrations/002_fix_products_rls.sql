-- Auto-set user_id from JWT on insert (defense in depth)
create or replace function public.set_product_user_id()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists products_set_user_id on public.products;
create trigger products_set_user_id
  before insert on public.products
  for each row execute function public.set_product_user_id();

-- Simpler insert policy: authenticated users only (user_id set by trigger)
drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
  on public.products for insert
  to authenticated
  with check (auth.uid() is not null);
