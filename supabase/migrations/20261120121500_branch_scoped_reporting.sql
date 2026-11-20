-- Ensure report views respect the caller's branch RLS and branch-specific inventory.
alter view public.report_cashier_sales set (security_invoker=true);
alter view public.report_customer_debts set (security_invoker=true);
alter view public.report_daily_sales set (security_invoker=true);
alter view public.report_expenses set (security_invoker=true);
alter view public.report_monthly_sales set (security_invoker=true);
alter view public.report_supplier_debts set (security_invoker=true);

create or replace view public.report_stock_levels with (security_invoker=true) as
select p.id as product_id,p.name as product_name,p.sku,p.category,
 coalesce(bi.quantity,0)::numeric(14,2) as quantity,
 coalesce(bi.minimum_stock,p.minimum_stock)::numeric(14,2) as minimum_stock,
 p.selling_price,p.active,
 case when coalesce(bi.quantity,0)<=0 then 'out_of_stock'
      when coalesce(bi.quantity,0)<=coalesce(bi.minimum_stock,p.minimum_stock) then 'low_stock'
      else 'in_stock' end as stock_status
from public.products p
left join public.branch_inventory bi on bi.product_id=p.id and bi.branch_id=public.app_current_branch_id()
where p.active=true;

create or replace view public.report_low_stock with (security_invoker=true) as
select p.id as product_id,p.name as product_name,p.sku,p.category,
 coalesce(bi.quantity,0)::numeric(14,2) as quantity,
 coalesce(bi.minimum_stock,p.minimum_stock)::numeric(14,2) as minimum_stock
from public.products p
left join public.branch_inventory bi on bi.product_id=p.id and bi.branch_id=public.app_current_branch_id()
where p.active=true and coalesce(bi.quantity,0)<=coalesce(bi.minimum_stock,p.minimum_stock);

create or replace view public.report_stock_valuation with (security_invoker=true) as
select count(*) as product_count,coalesce(sum(bi.quantity),0)::numeric as total_units,
 coalesce(sum(bi.quantity*p.purchase_price),0)::numeric as stock_purchase_value,
 coalesce(sum(bi.quantity*p.selling_price),0)::numeric as stock_selling_value
from public.products p join public.branch_inventory bi on bi.product_id=p.id
where p.active=true and bi.branch_id=public.app_current_branch_id() and public.app_can_view_financials();
