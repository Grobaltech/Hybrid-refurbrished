-- Keep one assigned branch-manager record per manager and synchronize branch.manager_id.
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
 if v_role='manager' then
  update public.branches set manager_id=null,updated_at=now() where manager_id=p_user_id and id<>p_branch_id;
  update public.branches set manager_id=p_user_id,updated_at=now() where id=p_branch_id;
 end if;
 update public.profiles set branch_id=p_branch_id where id=p_user_id;
 return jsonb_build_object('success',true,'user_id',p_user_id,'branch_id',p_branch_id);
end $$;
revoke all on function public.assign_staff_branch(uuid,uuid) from public;
grant execute on function public.assign_staff_branch(uuid,uuid) to authenticated;
