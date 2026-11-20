<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

type Branch = { id:string; name:string; code:string|null; address:string|null; phone:string|null; email:string|null; status:string; manager_id:string|null }
type Product = { id:string; name:string; sku:string; selling_price:number; quantity:number }
type Staff = { id:string; username:string; role:string; branch_id:string|null; disabled:boolean }
type Inventory = { id:string; branch_id:string; product_id:string; quantity:number; minimum_stock:number; product?:Product }
const auth=useAuth()
const branches=ref<Branch[]>([]), staff=ref<Staff[]>([]), products=ref<Product[]>([]), inventory=ref<Inventory[]>([])
const loading=ref(true), saving=ref(false), error=ref(''), notice=ref('')
const showCreate=ref(false), name=ref(''), code=ref(''), address=ref(''), phone=ref(''), email=ref('')
const selectedBranch=ref(''), manager=ref(''), assignStaff=ref(''), assignBranch=ref('')
const fromBranch=ref(''), toBranch=ref(''), transferProduct=ref(''), transferQty=ref(1), transferNotes=ref('')
const selected= computed(()=>branches.value.find(b=>b.id===selectedBranch.value))
const fmt=(n:number)=>new Intl.NumberFormat('en-UG').format(Number(n||0))
async function load(){
 loading.value=true;error.value=''
 try{
  const shopId=String(auth.profile?.shop_id||'')
  const [b,s,p]=await Promise.all([
   supabase.from('branches').select('*').order('created_at'),
   supabase.from('profiles').select('id,username,role,branch_id,disabled').eq('shop_id',shopId).in('role',['manager','cashier']).order('username'),
   supabase.from('products').select('id,name,sku,selling_price,quantity').eq('active',true).order('name')
  ])
  if(b.error)throw b.error;if(s.error)throw s.error;if(p.error)throw p.error
  branches.value=(b.data||[]) as Branch[];staff.value=(s.data||[]) as Staff[];products.value=(p.data||[]) as Product[]
  if(!selectedBranch.value&&branches.value.length)selectedBranch.value=branches.value[0].id
  if(!fromBranch.value&&branches.value.length)fromBranch.value=branches.value[0].id
  if(!toBranch.value&&branches.value.length>1)toBranch.value=branches.value[1].id
  await loadInventory()
 }catch(e:any){error.value=e.message||'Unable to load branch information'}finally{loading.value=false}
}
async function loadInventory(){
 if(!selectedBranch.value){inventory.value=[];return}
 const {data,error:e}=await supabase.from('branch_inventory').select('id,branch_id,product_id,quantity,minimum_stock,products(id,name,sku,selling_price,quantity)').eq('branch_id',selectedBranch.value).order('updated_at',{ascending:false})
 if(e)throw e
 inventory.value=(data||[]).map((x:any)=>({...x,product:x.products})) as Inventory[]
}
async function createBranch(){
 if(!name.value.trim())return
 saving.value=true;error.value='';notice.value=''
 try{
  const {data,error:e}=await supabase.from('branches').insert({shop_id:auth.profile?.shop_id,name:name.value.trim(),code:code.value.trim()||null,address:address.value.trim()||null,phone:phone.value.trim()||null,email:email.value.trim()||null,created_by:auth.user?.id}).select().single()
  if(e)throw e
  // Start the new branch with zero stock. The director can transfer stock into it.
  selectedBranch.value=data.id;showCreate.value=false;name.value='';code.value='';address.value='';phone.value='';email.value=''
  notice.value='Branch created. Transfer stock into it when it is ready to trade.'
  await load()
 }catch(e:any){error.value=e.message||'Could not create branch'}finally{saving.value=false}
}
async function saveManager(){
 if(!selected.value)return
 saving.value=true;error.value=''
 try{
  const {error:e}=await supabase.from('branches').update({manager_id:manager.value||null,updated_at:new Date().toISOString()}).eq('id',selectedBranch.value)
  if(e)throw e
  if(manager.value){const {error:ae}=await supabase.rpc('assign_staff_branch',{p_user_id:manager.value,p_branch_id:selectedBranch.value});if(ae)throw ae}
  await load();notice.value='Branch manager assignment saved.'
 }catch(e:any){error.value=e.message}finally{saving.value=false}
}
async function assign(){
 if(!assignStaff.value||!assignBranch.value)return
 saving.value=true;error.value=''
 try{const {error:e}=await supabase.rpc('assign_staff_branch',{p_user_id:assignStaff.value,p_branch_id:assignBranch.value});if(e)throw e;await load();notice.value='Staff member assigned to the selected branch.';assignStaff.value=''}
 catch(e:any){error.value=e.message}finally{saving.value=false}
}
async function transfer(){
 if(!fromBranch.value||!toBranch.value||!transferProduct.value||Number(transferQty.value)<=0)return
 saving.value=true;error.value='';notice.value=''
 try{const {error:e}=await supabase.rpc('transfer_branch_stock',{p_from_branch:fromBranch.value,p_to_branch:toBranch.value,p_product:transferProduct.value,p_quantity:Number(transferQty.value),p_notes:transferNotes.value||null});if(e)throw e
 notice.value='Stock transfer completed and recorded.';transferQty.value=1;transferNotes.value='';await loadInventory()
 }catch(e:any){error.value=e.message||'Stock transfer failed'}finally{saving.value=false}
}
async function setStatus(b:Branch){const next=b.status==='active'?'inactive':'active';const {error:e}=await supabase.from('branches').update({status:next,updated_at:new Date().toISOString()}).eq('id',b.id);if(e)error.value=e.message;else await load()}
onMounted(load)
</script>
<template>
<section class="space-y-6">
 <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-semibold text-indigo-600">SHOP OPERATIONS</p><h1 class="mt-2 text-3xl font-bold">Branch management</h1><p class="mt-1 text-sm text-slate-500">Manage locations, assign staff and move stock between your branches.</p></div><button class="btn btn-primary" @click="showCreate=true">＋ Add branch</button></div>
 <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{error}}</p><p v-if="notice" class="rounded-lg bg-green-50 p-3 text-sm text-green-700">{{notice}}</p>
 <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><article v-for="b in branches" :key="b.id" class="panel cursor-pointer p-4" :class="selectedBranch===b.id?'ring-2 ring-indigo-500':''" @click="selectedBranch=b.id;loadInventory()"><div class="flex items-start justify-between"><div><h2 class="font-bold">{{b.name}}</h2><p class="mt-1 text-xs text-slate-500">{{b.code||'No branch code'}}</p></div><span class="rounded-full px-2 py-1 text-xs" :class="b.status==='active'?'bg-green-50 text-green-700':'bg-slate-100 text-slate-600'">{{b.status}}</span></div><p class="mt-3 text-sm text-slate-600">{{b.address||'Address not added'}}</p><p class="mt-1 text-xs text-slate-500">{{staff.find(s=>s.id===b.manager_id)?.username||'No branch manager assigned'}}</p><button class="mt-3 text-xs font-semibold text-indigo-700" @click.stop="selectedBranch=b.id;loadInventory();setStatus(b)">{{b.status==='active'?'Deactivate branch':'Activate branch'}}</button></article><div v-if="!branches.length&&!loading" class="panel p-6 text-sm text-slate-500">No branches created yet.</div></div>
 <div v-if="selected" class="grid gap-6 xl:grid-cols-2">
  <div class="panel p-5"><div class="flex items-center justify-between"><div><p class="text-xs font-semibold text-indigo-600">SELECTED LOCATION</p><h2 class="mt-1 text-xl font-bold">{{selected.name}}</h2></div><span class="text-sm text-slate-500">{{inventory.length}} stock lines</span></div><div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label class="text-sm">Branch manager<select v-model="manager" class="field mt-1"><option value="">No manager assigned</option><option v-for="s in staff.filter(x=>!x.disabled&&x.role==='manager')" :key="s.id" :value="s.id">{{s.username}}</option></select></label><button class="btn btn-primary self-end" :disabled="saving" @click="saveManager">Save manager</button></div><div class="mt-5 overflow-x-auto"><table class="table w-full"><thead><tr><th>Product</th><th>SKU</th><th class="text-right">Available</th><th class="text-right">Reorder at</th></tr></thead><tbody><tr v-for="i in inventory" :key="i.id"><td class="font-medium">{{i.product?.name||'Product'}}</td><td>{{i.product?.sku||'—'}}</td><td class="text-right">{{fmt(i.quantity)}}</td><td class="text-right">{{fmt(i.minimum_stock)}}</td></tr><tr v-if="!inventory.length"><td colspan="4" class="py-5 text-center text-slate-500">No stock has been transferred to this branch yet.</td></tr></tbody></table></div></div>
  <div class="space-y-6"><div class="panel p-5"><h2 class="text-lg font-bold">Assign staff to a branch</h2><p class="mt-1 text-sm text-slate-500">Managers and cashiers can only work in their assigned branch.</p><div class="mt-4 grid gap-3"><label class="text-sm">Staff member<select v-model="assignStaff" class="field mt-1"><option value="">Choose staff</option><option v-for="s in staff.filter(x=>!x.disabled)" :key="s.id" :value="s.id">{{s.username}} · {{s.role}}</option></select></label><label class="text-sm">Branch<select v-model="assignBranch" class="field mt-1"><option value="">Choose branch</option><option v-for="b in branches.filter(x=>x.status==='active')" :key="b.id" :value="b.id">{{b.name}}</option></select></label><button class="btn btn-primary" :disabled="saving||!assignStaff||!assignBranch" @click="assign">Assign staff</button></div></div>
  <div class="panel p-5"><h2 class="text-lg font-bold">Transfer stock</h2><p class="mt-1 text-sm text-slate-500">Move available units from one branch to another. Every transfer is recorded.</p><div class="mt-4 grid gap-3"><label class="text-sm">From branch<select v-model="fromBranch" class="field mt-1"><option v-for="b in branches.filter(x=>x.status==='active')" :key="b.id" :value="b.id">{{b.name}}</option></select></label><label class="text-sm">To branch<select v-model="toBranch" class="field mt-1"><option v-for="b in branches.filter(x=>x.status==='active'&&x.id!==fromBranch)" :key="b.id" :value="b.id">{{b.name}}</option></select></label><label class="text-sm">Product<select v-model="transferProduct" class="field mt-1"><option value="">Choose product</option><option v-for="p in products" :key="p.id" :value="p.id">{{p.name}} · {{p.sku}}</option></select></label><label class="text-sm">Quantity<input v-model.number="transferQty" type="number" min="0.01" step="0.01" class="field mt-1"></label><label class="text-sm">Notes (optional)<input v-model="transferNotes" class="field mt-1" placeholder="Reason for transfer"></label><button class="btn btn-primary" :disabled="saving||!transferProduct||!fromBranch||!toBranch||fromBranch===toBranch" @click="transfer">{{saving?'Processing…':'Complete transfer'}}</button></div></div></div>
 </div>
 <div v-if="showCreate" class="modal-mask"><form class="modal-card space-y-4" @submit.prevent="createBranch"><div><h2 class="text-xl font-bold">Add a branch</h2><p class="mt-1 text-sm text-slate-500">Create another operating location under this shop.</p></div><label class="block text-sm">Branch name<input v-model="name" class="field mt-1" required placeholder="e.g. Ntinda Branch"></label><label class="block text-sm">Branch code<input v-model="code" class="field mt-1" placeholder="e.g. NTI"></label><label class="block text-sm">Address<input v-model="address" class="field mt-1"></label><div class="grid gap-3 sm:grid-cols-2"><label class="block text-sm">Phone<input v-model="phone" class="field mt-1"></label><label class="block text-sm">Email<input v-model="email" type="email" class="field mt-1"></label></div><div class="flex justify-end gap-2"><button type="button" class="btn btn-muted" @click="showCreate=false">Cancel</button><button class="btn btn-primary" :disabled="saving">{{saving?'Creating…':'Create branch'}}</button></div></form></div>
</section>
</template>