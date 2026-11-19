<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const role = ref('cashier')
type NavigationLink = [label: string, path: string, roles: string[]]
const links: NavigationLink[] = [
  ['Dashboard','/dashboard',['admin','manager','cashier']],
  ['New sale','/sales',['admin','manager','cashier']],
  ['Receipts','/receipts',['admin','manager','cashier']],
  ['Sales history','/sales-history',['admin','manager']],
  ['Products & inventory','/products',['admin','manager']],
  ['Purchases','/purchases',['admin','manager']],
  ['Customers','/customers',['admin','manager','cashier']],
  ['Suppliers','/suppliers',['admin','manager']],
  ['Customer credits','/credits',['admin','manager','cashier']],
  ['Creditors','/creditors',['admin','manager']],
  ['Expenses','/expenses',['admin','manager']],
  ['Reports','/reports',['admin','manager']],
  ['Balance','/balance',['admin']],
  ['Search','/search',['admin','manager','cashier']],
  ['Users & access','/users',['admin']],
  ['Activity','/activity',['admin']],
  ['Settings','/settings',['admin']],
  ['My account','/account',['admin','manager','cashier']],
]
const visible = computed(() => links.filter(link => link[2].includes(role.value)))
async function logout() {
  await supabase.auth.signOut()
  await router.replace('/login')
}
supabase.auth.getUser().then(async ({ data }) => {
  if (data.user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (profile?.role) role.value = String(profile.role)
  }
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/dashboard" class="brand"><span class="brand-mark">H</span><span>Hybrid Shop<small>Management workspace</small></span></RouterLink>
      <nav class="side-nav"><RouterLink v-for="link in visible" :key="link[1]" :to="link[1]">{{ link[0] }}</RouterLink></nav>
      <div class="side-bottom"><span class="role-label">{{ role }}</span><RouterLink to="/account">My account</RouterLink><button @click="logout">Sign out</button></div>
    </aside>
    <main class="main-area"><header class="mobile-bar"><b>Hybrid Shop</b><button @click="logout">Sign out</button></header><RouterView /></main>
  </div>
</template>
