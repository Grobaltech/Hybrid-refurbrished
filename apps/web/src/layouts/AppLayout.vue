<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
const router=useRouter(),auth=useAuth()
type NavigationLink=[label:string,path:string,roles:string[]]
const links:NavigationLink[]=[
 ['Dashboard','/dashboard',['admin','manager','cashier']],['Point of Sale','/pos',['admin','manager','cashier']],['Receipts','/receipts',['admin','manager','cashier']],['Sales history','/sales-history',['admin','manager']],['Products & inventory','/products',['admin','manager']],['Purchases','/purchases',['admin','manager']],['Customers','/customers',['admin','manager','cashier']],['Suppliers','/suppliers',['admin','manager']],['Customer credits','/credits',['admin','manager','cashier']],['Creditors','/creditors',['admin','manager']],['Expenses','/expenses',['admin','manager']],['Reports','/reports',['admin','manager']],['Balance','/balance',['admin']],['Search','/search',['admin','manager','cashier']],['Branch management','/branches',['admin']],['Users & access','/users',['admin']],['Activity','/activity',['admin']],['Settings','/settings',['admin']],['My account','/account',['admin','manager','cashier']]
]
const role=computed(()=>String(auth.profile?.role??'cashier'))
const branches=ref<{id:string;name:string;status:string}[]>([])
const activeBranch=ref('')
async function loadBranches(){
  if(role.value!=='admin'||!auth.profile?.shop_id)return
  const {data,error}=await supabase.from('branches').select('id,name,status').eq('status','active').order('name')
  if(error)return
  branches.value=data||[]
  activeBranch.value=String(auth.profile.branch_id||branches.value[0]?.id||'')
}
async function switchBranch(){
  if(!activeBranch.value)return
  const {error}=await supabase.rpc('set_active_branch',{p_branch_id:activeBranch.value})
  if(error){alert(error.message);return}
  await auth.loadProfile()
}
onMounted(async()=>{await auth.loadProfile();await loadBranches()})
const visible=computed(()=>links.filter(link=>link[2].includes(role.value)&&auth.profile?.pageAccess?.[link[1]]!==false))
async function logout(){await auth.signOut();await router.replace('/login')}
</script>
<template><div class="app-shell"><aside class="sidebar"><RouterLink to="/dashboard" class="brand"><span class="brand-mark">H</span><span>Hybrid Shop<small>Management workspace</small></span></RouterLink><div v-if="role==='admin'&&branches.length" class="branch-switcher"><label for="active-branch">Active branch</label><select id="active-branch" v-model="activeBranch" @change="switchBranch"><option v-for="b in branches" :key="b.id" :value="b.id">{{b.name}}</option></select></div><nav class="side-nav"><RouterLink v-for="link in visible" :key="link[1]" :to="link[1]">{{link[0]}}</RouterLink></nav><div class="side-bottom"><span class="role-label">{{role}}</span><RouterLink to="/account">My account</RouterLink><button @click="logout">Sign out</button></div></aside><main class="main-area"><header class="mobile-bar"><b>Hybrid Shop</b><button @click="logout">Sign out</button></header><RouterView /></main></div></template>