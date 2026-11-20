<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
type NavigationLink = { label: string; path: string; roles: string[]; group: string; hint: string }
const links: NavigationLink[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['admin','manager','cashier'], group: 'Overview', hint: 'Business overview' },
  { label: 'Point of Sale', path: '/pos', roles: ['admin','manager','cashier'], group: 'Sales & service', hint: 'Create a sale' },
  { label: 'Receipts', path: '/receipts', roles: ['admin','manager','cashier'], group: 'Sales & service', hint: 'Find receipts' },
  { label: 'Sales history', path: '/sales-history', roles: ['admin','manager'], group: 'Sales & service', hint: 'Review transactions' },
  { label: 'Products & inventory', path: '/products', roles: ['admin','manager'], group: 'Stock & purchasing', hint: 'Products and stock' },
  { label: 'Purchases', path: '/purchases', roles: ['admin','manager'], group: 'Stock & purchasing', hint: 'Supplier purchases' },
  { label: 'Customers', path: '/customers', roles: ['admin','manager','cashier'], group: 'People', hint: 'Customer directory' },
  { label: 'Suppliers', path: '/suppliers', roles: ['admin','manager'], group: 'People', hint: 'Supplier directory' },
  { label: 'Customer credits', path: '/credits', roles: ['admin','manager','cashier'], group: 'Finance', hint: 'Customer balances' },
  { label: 'Creditors', path: '/creditors', roles: ['admin','manager'], group: 'Finance', hint: 'Supplier balances' },
  { label: 'Expenses', path: '/expenses', roles: ['admin','manager'], group: 'Finance', hint: 'Record expenses' },
  { label: 'Reports', path: '/reports', roles: ['admin','manager'], group: 'Finance', hint: 'Business reports' },
  { label: 'Balance', path: '/balance', roles: ['admin'], group: 'Finance', hint: 'Financial position' },
  { label: 'Search', path: '/search', roles: ['admin','manager','cashier'], group: 'Tools', hint: 'Search records' },
  { label: 'Branch management', path: '/branches', roles: ['admin'], group: 'Shop administration', hint: 'Branches and transfers' },
  { label: 'Users & access', path: '/users', roles: ['admin'], group: 'Shop administration', hint: 'Staff and permissions' },
  { label: 'Activity', path: '/activity', roles: ['admin'], group: 'Shop administration', hint: 'Audit activity' },
  { label: 'Settings', path: '/settings', roles: ['admin'], group: 'Shop administration', hint: 'Configure your shop' },
  { label: 'My account', path: '/account', roles: ['admin','manager','cashier'], group: 'Account', hint: 'Profile and security' }
]
const role = computed(() => String(auth.profile?.role ?? 'cashier'))
const visible = computed(() => links.filter(link => link.roles.includes(role.value) && auth.profile?.pageAccess?.[link.path] !== false))
const mobileMenuOpen = ref(false)
const menuSearch = ref('')
const filteredGroups = computed(() => {
  const q = menuSearch.value.trim().toLowerCase()
  const filtered = visible.value.filter(link => !q || (link.label + ' ' + link.hint + ' ' + link.group).toLowerCase().includes(q))
  const order = ['Overview','Sales & service','Stock & purchasing','People','Finance','Tools','Shop administration','Account']
  return order.map(name => ({ name, links: filtered.filter(link => link.group === name) })).filter(group => group.links.length)
})
const currentPage = computed(() => visible.value.find(link => route.path === link.path || (link.path !== '/dashboard' && route.path.startsWith(link.path + '/')))?.label || 'Hybrid Shop')

const branches = ref<{id:string;name:string;status:string}[]>([])
const activeBranch = ref('')
async function loadBranches() {
  if (role.value !== 'admin' || !auth.profile?.shop_id) return
  const { data, error } = await supabase.from('branches').select('id,name,status').eq('status','active').order('name')
  if (error) return
  branches.value = data || []
  activeBranch.value = String(auth.profile.branch_id || branches.value[0]?.id || '')
}
async function switchBranch() {
  if (!activeBranch.value) return
  const { error } = await supabase.rpc('set_active_branch', { p_branch_id: activeBranch.value })
  if (error) { alert(error.message); return }
  await auth.loadProfile()
}
function closeMobileMenu() { mobileMenuOpen.value = false }
async function logout() {
  closeMobileMenu()
  await auth.signOut()
  await router.replace('/login')
}
onMounted(async () => { await auth.loadProfile(); await loadBranches() })
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar desktop-sidebar">
      <RouterLink to="/dashboard" class="brand">
        <span class="brand-mark">H</span>
        <span>Hybrid Shop<small>Management workspace</small></span>
      </RouterLink>
      <div v-if="role==='admin' && branches.length" class="branch-switcher px-3 py-3 mx-2 mb-3 rounded-xl bg-slate-800 text-white">
        <label for="active-branch-desktop" class="block text-xs font-semibold text-slate-300 mb-2">ACTIVE BRANCH</label>
        <select id="active-branch-desktop" class="w-full rounded-lg bg-slate-700 border border-slate-600 p-2 text-sm" v-model="activeBranch" @change="switchBranch">
          <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>
      <nav class="side-nav">
        <RouterLink v-for="link in visible" :key="link.path" :to="link.path">{{ link.label }}</RouterLink>
      </nav>
      <div class="side-bottom">
        <span class="role-label">{{ role.replace('_',' ') }}</span>
        <RouterLink to="/account">My account</RouterLink>
        <button @click="logout">Sign out</button>
      </div>
    </aside>

    <header class="mobile-bar">
      <button class="mobile-menu-trigger" aria-label="Open navigation menu" :aria-expanded="mobileMenuOpen" @click="mobileMenuOpen = true">
        <span class="hamburger-lines"><i></i><i></i><i></i></span>
      </button>
      <RouterLink to="/dashboard" class="mobile-brand" @click="closeMobileMenu">
        <span class="brand-mark">H</span>
        <span><strong>Hybrid Shop</strong><small>{{ currentPage }}</small></span>
      </RouterLink>
      <button class="mobile-account" aria-label="Open my account" @click="router.push('/account')"> <span>●</span> </button>
    </header>

    <Transition name="mobile-menu-fade">
      <button v-if="mobileMenuOpen" class="mobile-menu-backdrop" aria-label="Close navigation menu" @click="closeMobileMenu"></button>
    </Transition>
    <Transition name="mobile-menu-slide">
      <aside v-if="mobileMenuOpen" class="mobile-drawer" aria-label="Mobile navigation">
        <div class="drawer-header">
          <RouterLink to="/dashboard" class="brand" @click="closeMobileMenu">
            <span class="brand-mark">H</span>
            <span>Hybrid Shop<small>Management workspace</small></span>
          </RouterLink>
          <button class="drawer-close" aria-label="Close menu" @click="closeMobileMenu">×</button>
        </div>
        <div class="drawer-user">
          <span class="drawer-avatar">{{ role === 'admin' ? 'D' : role === 'manager' ? 'M' : 'C' }}</span>
          <span><strong>{{ role === 'admin' ? 'Shop Director' : role === 'manager' ? 'Manager' : 'Cashier' }}</strong><small>{{ role.replace('_',' ') }} workspace</small></span>
        </div>
        <div v-if="role==='admin' && branches.length" class="drawer-branch">
          <label for="active-branch-mobile">ACTIVE BRANCH</label>
          <select id="active-branch-mobile" v-model="activeBranch" @change="switchBranch">
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <label class="drawer-search">
          <span>⌕</span>
          <input v-model="menuSearch" type="search" placeholder="Find a menu item..." />
        </label>
        <nav class="drawer-nav">
          <section v-for="group in filteredGroups" :key="group.name" class="drawer-group">
            <h3>{{ group.name }}</h3>
            <RouterLink v-for="link in group.links" :key="link.path" :to="link.path" :class="{ 'drawer-link-active': route.path === link.path || (link.path !== '/dashboard' && route.path.startsWith(link.path + '/')) }" @click="closeMobileMenu">
              <span class="drawer-link-mark"></span>
              <span class="drawer-link-copy"><strong>{{ link.label }}</strong><small>{{ link.hint }}</small></span>
              <span class="drawer-chevron">›</span>
            </RouterLink>
          </section>
          <p v-if="!filteredGroups.length" class="drawer-no-results">No menu items match your search.</p>
        </nav>
        <div class="drawer-footer">
          <RouterLink to="/account" @click="closeMobileMenu">My account</RouterLink>
          <button @click="logout">Sign out</button>
        </div>
      </aside>
    </Transition>

    <main class="main-area">
      <RouterView :key="String(auth.profile?.branch_id || 'unassigned')" />
    </main>
  </div>
</template>
