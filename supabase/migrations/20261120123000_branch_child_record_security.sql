-- Scope child transaction rows to their parent branch; prevents receipt and purchase-item cross-branch reads.
alter table public.sale_items enable row level security;
alter table public.purchase_items enable row level security;
alter table public.customer_credit_payments enable row level security;
alter table public.supplier_payments enable row level security;

drop policy if exists branch_scope_guard on public.sale_items;
create policy branch_scope_guard on public.sale_items as restrictive for all to authenticated
using(public.app_is_active() and exists(select 1 from public.sales s where s.id=sale_id and (public.app_is_admin() or s.branch_id=public.app_current_branch_id())))
with check(public.app_is_active() and exists(select 1 from public.sales s where s.id=sale_id and (public.app_is_admin() or s.branch_id=public.app_current_branch_id())));

drop policy if exists branch_scope_guard on public.purchase_items;
create policy branch_scope_guard on public.purchase_items as restrictive for all to authenticated
using(public.app_is_active() and exists(select 1 from public.purchases p where p.id=purchase_id and (public.app_is_admin() or p.branch_id=public.app_current_branch_id())))
with check(public.app_is_active() and exists(select 1 from public.purchases p where p.id=purchase_id and (public.app_is_admin() or p.branch_id=public.app_current_branch_id())));

drop policy if exists branch_scope_guard on public.customer_credit_payments;
create policy branch_scope_guard on public.customer_credit_payments as restrictive for all to authenticated
using(public.app_is_active() and exists(select 1 from public.customer_credits c where c.id=credit_id and (public.app_is_admin() or c.branch_id=public.app_current_branch_id())))
with check(public.app_is_active() and exists(select 1 from public.customer_credits c where c.id=credit_id and (public.app_is_admin() or c.branch_id=public.app_current_branch_id())));

drop policy if exists branch_scope_guard on public.supplier_payments;
create policy branch_scope_guard on public.supplier_payments as restrictive for all to authenticated
using(public.app_is_active() and exists(select 1 from public.supplier_credits c where c.id=supplier_credit_id and (public.app_is_admin() or c.branch_id=public.app_current_branch_id())))
with check(public.app_is_active() and exists(select 1 from public.supplier_credits c where c.id=supplier_credit_id and (public.app_is_admin() or c.branch_id=public.app_current_branch_id())));
