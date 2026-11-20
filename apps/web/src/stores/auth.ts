import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export type AuthProfile = {
  id: string
  role: string
  disabled: boolean
  caps: string[]
  pageAccess: Record<string, boolean>
  [key: string]: unknown
}

export const useAuth = defineStore('auth', () => {
  const user = ref<{ id: string; email?: string; full_name?: string; phone?: string; avatar_url?: string } | null>(null)
  const profile = ref<AuthProfile | null>(null)
  const loading = ref(true)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  async function loadProfile() {
    loading.value = true
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser ? { id: currentUser.id, email: currentUser.email, full_name: String(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || ''), phone: String(currentUser.user_metadata?.phone || ''), avatar_url: String(currentUser.user_metadata?.avatar_url || '') } : null
      if (!currentUser) { profile.value = null; return }
      const [p, c, a] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
        supabase.from('user_caps').select('cap,allowed').eq('user_id', currentUser.id),
        supabase.from('user_page_access').select('page,allowed').eq('user_id', currentUser.id),
      ])
      if (p.error) throw p.error
      if (!p.data) { profile.value = null; return }
      const caps = (c.data ?? []).filter(x => x.allowed).map(x => String(x.cap))
      const pageAccess: Record<string, boolean> = {}
      for (const row of a.data ?? []) pageAccess[String(row.page)] = Boolean(row.allowed)
      profile.value = {
        ...p.data,
        id: currentUser.id,
        role: String(p.data.role ?? 'cashier'),
        disabled: Boolean(p.data.disabled),
        caps,
        pageAccess,
      }
    } finally { loading.value = false }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  void loadProfile()
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) { user.value = null; profile.value = null; loading.value = false }
    else if (user.value?.id !== session.user.id) void loadProfile()
  })
  return { user, profile, loading, isAdmin, loadProfile, signOut }
})