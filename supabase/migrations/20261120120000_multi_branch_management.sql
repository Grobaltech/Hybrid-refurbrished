-- Multi-branch shop operations: branch directory, isolated stock balances, staff assignments and transfers.
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  code text,
  phone text,
  email text,
  address text,
  status text not null default 'active' check(status in ('active','inactive')),
  manager_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shop_id,name), unique(shop_id,code)
);
alter table public.profiles add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.sales add column if not exists branch_id uuid references public.branches(id);
alter table public.purchases add column if not exists branch_id uuid references public.branches(id);
alter table public.expenses add column if not exists branch_id uuid references public.branches(id);
alter table public.stock_movements add column if not exists branch_id uuid references public.branches(id);
alter table public.customer_credits add column if not exists branch_id uuid references public.branches(id);
alter table public.supplier_credits add column if not exists branch_id uuid references public.branches(id);

create table if not exists public.branch_inventory (
 id uuid primary key default gen_random_uuid(),
 branch_id uuid not null references public.branches(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 quantity numeric(14,2) not null default 0 check(quantity>=0),
 minimum_stock numeric(14,2) not null default 0 check(minimum_stock>=0),
 updated_at timestamptz not null default now(),
 unique(branch_id,product_id)
);
create table if not exists public.branch_stock_transfers (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.shops(id) on delete cascade,
 from_branch_id uuid not null references public.branches(id),
 to_branch_id uuid not null references public.branches(id),
 product_id uuid not null references public.products(id),
 quantity numeric(14,2) not null check(quantity>0),
 notes text,
 status text not null default 'completed' check(status in ('completed','cancelled')),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 check(from_branch_id<>to_branch_id)
);

insert into public.branches(shop_id,name,code,address,created_by)
select s.id,coalesce(nullif(s.shop_name,''),'Main Branch'),'MAIN',s.address,s.director_id
from public.shops s where not exists(select 1 from public.branches b where b.shop_id=s.id);
update public.profiles p set branch_id=b.id from public.branches b
where p.shop_id=b.shop_id and p.role='admin' and p.branch_id is null;
insert into public.branch_inventory(branch_id,product_id,quantity,minimum_stock)
select b.id,p.id,p.quantity,p.minimum_stock from public.branches b
cross join public.products p on conflict(branch_id,product_id) do nothing;
update public.sales s set branch_id=p.branch_id from public.profiles p where s.created_by=p.id and s.branch_id is null;
update public.purchases s set branch_id=p.branch_id from public.profiles p where s.created_by=p.id and s.branch_id is null;
update public.expenses s set branch_id=p.branch_id from public.profiles p where s.recorded_by=p.id and s.branch_id is null;
update public.stock_movements s set branch_id=p.branch_id from public.profiles p where s.created_by=p.id and s.branch_id is null;
update public.customer_credits c set branch_id=s.branch_id from public.sales s where c.sale_id=s.id and c.branch_id is null;
update public.supplier_credits c set branch_id=p.branch_id from public.purchases p where c.purchase_id=p.id and c.branch_id is null;

create index if not exists branches_shop_idx on public.branches(shop_id);
create index if not exists profiles_branch_idx on public.profiles(branch_id);
create index if not exists sales_branch_date_idx on public.sales(branch_id,sale_date desc);
create index if not exists purchases_branch_date_idx on public.purchases(branch_id,purchase_date desc);
create index if not exists expenses_branch_date_idx on public.expenses(branch_id,expense_date desc);
create index if not exists branch_inventory_branch_idx on public.branch_inventory(branch_id);

create or replace function public.app_current_branch_id()
returns uuid language sql stable security definer set search_path=''
as $$ select p.branch_id from public.profiles p where p.id=(select auth.uid()) and p.disabled=false $$;
revoke all on function public.app_current_branch_id() from public;
grant execute on function public.app_current_branch_id() to authenticated;

create or replace function public.app_can_access_branch(p_branch_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.profiles p join public.branches b on b.id=p_branch_id and b.shop_id=p.shop_id
 where p.id=(select auth.uid()) and p.disabled=false and (p.role='admin' or p.branch_id=p_branch_id))
$$;
revoke all on function public.app_can_access_branch(uuid) from public;
grant execute on function public.app_can_access_branch(uuid) to authenticated;

create or replace function public.assign_staff_branch(p_user_id uuid,p_branch_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_shop uuid; v_target_shop uuid; v_role text;
begin
 if not public.app_is_active() or not public.app_is_admin() then raise exception 'Shop Director permission required'; end if;
 select shop_id into v_shop from public.profiles where id=auth.uid();
 select shop_id,role::text into v_target_shop,v_role from public.profiles where id=p_user_id and disabled=false;
 if v_target_shop is distinct from v_shop or v_role not in ('manager','cashier') then raise exception 'Staff member is not assignable to this shop'; end if;
 if not exists(select 1 from public.branches where id=p_branch_id and shop_id=v_shop and status='active') then raise exception 'Select an active branch belonging to your shop'; end if;
 update public.profiles set branch_id=p_branch_id where id=p_user_id;
 return jsonb_build_object('success',true,'user_id',p_user_id,'branch_id',p_branch_id);
end $$;
revoke all on function public.assign_staff_branch(uuid,uuid) from public;
grant execute on function public.assign_staff_branch(uuid,uuid) to authenticated;

create or replace function public.set_active_branch(p_branch_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_shop uuid;
begin
 if not public.app_is_active() or not public.app_is_admin() then raise exception 'Only the Shop Director can switch active branches'; end if;
 select shop_id into v_shop from public.profiles where id=auth.uid();
 if not exists(select 1 from public.branches where id=p_branch_id and shop_id=v_shop and status='active') then raise exception 'Branch is unavailable'; end if;
 update public.profiles set branch_id=p_branch_id where id=auth.uid();
 return jsonb_build_object('success',true,'branch_id',p_branch_id);
end $$;
revoke all on function public.set_active_branch(uuid) from public;
grant execute on function public.set_active_branch(uuid) to authenticated;

create or replace function public.transfer_branch_stock(p_from_branch uuid,p_to_branch uuid,p_product uuid,p_quantity numeric,p_notes text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_shop uuid; v_from_shop uuid; v_to_shop uuid; v_available numeric; v_transfer uuid;
begin
 if not public.app_is_active() or not public.app_is_admin() then raise exception 'Only the Shop Director can transfer stock between branches'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Transfer quantity must be greater than zero'; end if;
 select shop_id into v_shop from public.profiles where id=auth.uid();
 select shop_id into v_from_shop from public.branches where id=p_from_branch and status='active';
 select shop_id into v_to_shop from public.branches where id=p_to_branch and status='active';
 if v_from_shop is distinct from v_shop or v_to_shop is distinct from v_shop or p_from_branch=p_to_branch then raise exception 'Both branches must be active branches in your shop'; end if;
 select quantity into v_available from public.branch_inventory where branch_id=p_from_branch and product_id=p_product for update;
 if coalesce(v_available,0)<p_quantity then raise exception 'Insufficient stock in the sending branch'; end if;
 update public.branch_inventory set quantity=quantity-p_quantity,updated_at=now() where branch_id=p_from_branch and product_id=p_product;
 insert into public.branch_inventory(branch_id,product_id,quantity) values(p_to_branch,p_product,p_quantity)
 on conflict(branch_id,product_id) do update set quantity=public.branch_inventory.quantity+excluded.quantity,updated_at=now();
 insert into public.branch_stock_transfers(shop_id,from_branch_id,to_branch_id,product_id,quantity,notes,created_by)
 values(v_shop,p_from_branch,p_to_branch,p_product,p_quantity,p_notes,auth.uid()) returning id into v_transfer;
 insert into public.stock_movements(product_id,movement_type,quantity,reference_type,reference_id,notes,created_by,branch_id)
 values(p_product,'transfer_out',p_quantity,'branch_transfer',v_transfer,p_notes,auth.uid(),p_from_branch),
 (p_product,'transfer_in',p_quantity,'branch_transfer',v_transfer,p_notes,auth.uid(),p_to_branch);
 return jsonb_build_object('success',true,'transfer_id',v_transfer);
end $$;
revoke all on function public.transfer_branch_stock(uuid,uuid,uuid,numeric,text) from public;
grant execute on function public.transfer_branch_stock(uuid,uuid,uuid,numeric,text) to authenticated;

alter table public.branches enable row level security;
alter table public.branch_inventory enable row level security;
alter table public.branch_stock_transfers enable row level security;
drop policy if exists "shop directors manage branches" on public.branches;
create policy "shop directors manage branches" on public.branches for all to authenticated
using(public.app_is_active() and public.app_is_admin() and shop_id=(select shop_id from public.profiles where id=auth.uid()))
with check(public.app_is_active() and public.app_is_admin() and shop_id=(select shop_id from public.profiles where id=auth.uid()));
drop policy if exists "staff read their branch" on public.branches;
create policy "staff read their branch" on public.branches for select to authenticated using(public.app_is_active() and public.app_can_access_branch(id));
drop policy if exists "staff read branch inventory" on public.branch_inventory;
create policy "staff read branch inventory" on public.branch_inventory for select to authenticated using(public.app_is_active() and public.app_can_access_branch(branch_id));
drop policy if exists "directors manage branch inventory" on public.branch_inventory;
create policy "directors manage branch inventory" on public.branch_inventory for all to authenticated
using(public.app_is_active() and public.app_is_admin() and exists(select 1 from public.branches b where b.id=branch_id and b.shop_id=(select shop_id from public.profiles where id=auth.uid())))
with check(public.app_is_active() and public.app_is_admin() and exists(select 1 from public.branches b where b.id=branch_id and b.shop_id=(select shop_id from public.profiles where id=auth.uid())));
drop policy if exists "directors read branch transfers" on public.branch_stock_transfers;
create policy "directors read branch transfers" on public.branch_stock_transfers for select to authenticated
using(public.app_is_active() and public.app_is_admin() and shop_id=(select shop_id from public.profiles where id=auth.uid()));
grant select,insert,update,delete on public.branches,public.branch_inventory to authenticated;
grant select on public.branch_stock_transfers to authenticated;

do $$
declare t text;
begin
 foreach t in array array['sales','purchases','expenses','stock_movements','customer_credits','supplier_credits'] loop
  execute format('drop policy if exists branch_scope_guard on public.%I',t);
  execute format('create policy branch_scope_guard on public.%I as restrictive for all to authenticated using(public.app_is_active() and (public.app_is_admin() or branch_id=public.app_current_branch_id())) with check(public.app_is_active() and (public.app_is_admin() or branch_id=public.app_current_branch_id()))',t);
 end loop;
end $$;

create or replace function public.set_record_branch()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_branch uuid; v_actor uuid;
begin
 if tg_table_name='expenses' then v_actor:=new.recorded_by; else v_actor:=new.created_by; end if;
 select branch_id into v_branch from public.profiles where id=auth.uid() and disabled=false;
 if v_branch is null and v_actor is not null then select branch_id into v_branch from public.profiles where id=v_actor and disabled=false; end if;
 if new.branch_id is null then new.branch_id:=v_branch; end if;
 return new;
end $$;
drop trigger if exists stamp_sales_branch on public.sales;
create trigger stamp_sales_branch before insert on public.sales for each row execute function public.set_record_branch();
drop trigger if exists stamp_purchases_branch on public.purchases;
create trigger stamp_purchases_branch before insert on public.purchases for each row execute function public.set_record_branch();
drop trigger if exists stamp_expenses_branch on public.expenses;
create trigger stamp_expenses_branch before insert on public.expenses for each row execute function public.set_record_branch();
drop trigger if exists stamp_stock_movements_branch on public.stock_movements;
create trigger stamp_stock_movements_branch before insert on public.stock_movements for each row execute function public.set_record_branch();

create or replace function public.stamp_credit_branch()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if new.branch_id is null then
  if tg_table_name='customer_credits' then select branch_id into new.branch_id from public.sales where id=new.sale_id;
  else select branch_id into new.branch_id from public.purchases where id=new.purchase_id; end if;
 end if;
 return new;
end $$;
drop trigger if exists stamp_customer_credit_branch on public.customer_credits;
create trigger stamp_customer_credit_branch before insert on public.customer_credits for each row execute function public.stamp_credit_branch();
drop trigger if exists stamp_supplier_credit_branch on public.supplier_credits;
create trigger stamp_supplier_credit_branch before insert on public.supplier_credits for each row execute function public.stamp_credit_branch();

create or replace function public.consume_branch_stock_for_sale()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_branch uuid; v_product_name text;
begin
 select branch_id into v_branch from public.sales where id=new.sale_id;
 if v_branch is null then raise exception 'Your account is not assigned to a branch. Ask the Shop Director to assign one before making sales.'; end if;
 select name into v_product_name from public.products where id=new.product_id;
 update public.branch_inventory set quantity=quantity-new.quantity,updated_at=now()
 where branch_id=v_branch and product_id=new.product_id and quantity>=new.quantity;
 if not found then raise exception 'Insufficient stock at this branch for %',coalesce(v_product_name,'product'); end if;
 return new;
end $$;
drop trigger if exists consume_branch_stock_after_sale_item on public.sale_items;
create trigger consume_branch_stock_after_sale_item after insert on public.sale_items for each row execute function public.consume_branch_stock_for_sale();

create or replace function public.receive_branch_purchase_stock()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_item record;
begin
 if new.status='received' and old.status is distinct from 'received' then
  if new.branch_id is null then raise exception 'Purchase cannot be received until the user is assigned to a branch'; end if;
  for v_item in select product_id,quantity from public.purchase_items where purchase_id=new.id loop
   insert into public.branch_inventory(branch_id,product_id,quantity) values(new.branch_id,v_item.product_id,v_item.quantity)
   on conflict(branch_id,product_id) do update set quantity=public.branch_inventory.quantity+excluded.quantity,updated_at=now();
  end loop;
 end if;
 return new;
end $$;
drop trigger if exists receive_branch_purchase_stock on public.purchases;
create trigger receive_branch_purchase_stock after update of status on public.purchases for each row execute function public.receive_branch_purchase_stock();

create or replace function public.seed_new_product_in_active_branch()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_branch uuid;
begin
 select branch_id into v_branch from public.profiles where id=auth.uid() and disabled=false;
 if v_branch is not null and new.quantity>0 then
  insert into public.branch_inventory(branch_id,product_id,quantity,minimum_stock)
  values(v_branch,new.id,new.quantity,new.minimum_stock) on conflict(branch_id,product_id) do nothing;
 end if;
 return new;
end $$;
drop trigger if exists seed_product_branch_inventory on public.products;
create trigger seed_product_branch_inventory after insert on public.products for each row execute function public.seed_new_product_in_active_branch();
