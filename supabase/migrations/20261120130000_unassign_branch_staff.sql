-- Allow a Shop Director to remove a manager/cashier from all branch access.
create or replace function public.unassign_staff_branch(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_shop uuid; v_target_shop uuid;
begin
 if not public.app_is_active() or not public.app_is_admin() then raise exception 'Shop Director permission required'; end if;
 select shop_id into v_shop from public.profiles where id=auth.uid();
 select shop_id into v_target_shop from public.profiles where id=p_user_id and role in ('manager','cashier');
 if v_target_shop is distinct from v_shop then raise exception 'Staff member is not part of this shop'; end if;
 update public.branches set manager_id=null,updated_at=now() where manager_id=p_user_id and shop_id=v_shop;
 update public.profiles set branch_id=null where id=p_user_id;
 return jsonb_build_object('success',true,'user_id',p_user_id,'branch_id',null);
end $$;
revoke all on function public.unassign_staff_branch(uuid) from public;
grant execute on function public.unassign_staff_branch(uuid) to authenticated;
