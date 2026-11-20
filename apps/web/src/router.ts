import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from './lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/LoginView.vue') },
    { path: '/system-admin', component: () => import('./views/SystemAdminView.vue') },
    { path: '/system-settings', component: () => import('./views/SystemSettingsView.vue') },
    { path: '/', component: () => import('./layouts/AppLayout.vue'), children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('./views/DashboardView.vue') },
      { path: 'pos', component: () => import('./views/SalesView.vue'), meta: { roles: ['admin','manager','cashier'] } },
      { path: 'sales', redirect: '/pos' },
      { path: 'receipts', component: () => import('./views/ReceiptsView.vue'), meta: { roles: ['admin','manager','cashier'] } },
      { path: 'receipts/:id', component: () => import('./views/ReceiptDetailView.vue'), meta: { roles: ['admin','manager','cashier'] } },
      { path: 'sales-history', component: () => import('./views/SalesHistoryView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'products', component: () => import('./views/ProductsView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'products/:id', component: () => import('./views/ProductEditView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'purchases', component: () => import('./views/PurchasesView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'customers', component: () => import('./views/CustomersView.vue'), meta: { roles: ['admin','manager','cashier'] } },
      { path: 'suppliers', component: () => import('./views/SuppliersView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'credits', component: () => import('./views/CreditsView.vue'), meta: { roles: ['admin','manager','cashier'] } },
      { path: 'creditors', component: () => import('./views/CreditorsView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'expenses', component: () => import('./views/ExpensesView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'reports', component: () => import('./views/ReportsView.vue'), meta: { roles: ['admin','manager'] } },
      { path: 'balance', component: () => import('./views/BalanceView.vue'), meta: { roles: ['admin'] } },
      { path: 'search', component: () => import('./views/SearchView.vue') },
      { path: 'users', component: () => import('./views/UsersView.vue'), meta: { roles: ['admin'] } },
      { path: 'activity', component: () => import('./views/ActivityView.vue'), meta: { roles: ['admin'] } },
      { path: 'crm', component: () => import('./views/CrmHomeView.vue'), meta: { roles: ['admin'] } },
      { path: 'cms', component: () => import('./views/ContentHomeView.vue'), meta: { roles: ['admin'] } },
      { path: 'account', component: () => import('./views/AccountView.vue') },
      { path: 'settings', component: () => import('./views/SettingsView.vue'), meta: { roles: ['admin'] } },
      { path: 'forbidden', component: () => import('./views/ForbiddenView.vue') },
    ]},
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return to.path === '/login' ? true : '/login'

  const { data: profile, error } = await supabase.from('profiles').select('role,disabled').eq('id', session.user.id).maybeSingle()
  if (error || !profile || profile.disabled) { await supabase.auth.signOut(); return '/login' }
  const role = String(profile.role)

  if (to.path === '/login' || to.path === '/') return role === 'super_admin' ? '/system-admin' : '/dashboard'
  if (role === 'super_admin') return ['/system-admin','/system-settings'].includes(to.path) ? true : '/system-admin'
  if (to.path === '/system-admin' || to.path === '/system-settings') return '/forbidden'

  const { data: override, error: accessError } = await supabase.from('user_page_access')
    .select('allowed').eq('user_id', session.user.id).eq('page', to.path).maybeSingle()
  if (accessError) return '/forbidden'
  if (override && !override.allowed) return '/forbidden'
  if (!override) {
    const allowed = to.meta.roles as string[] | undefined
    if (allowed && !allowed.includes(role)) return '/forbidden'
  }
  return true
})
export default router