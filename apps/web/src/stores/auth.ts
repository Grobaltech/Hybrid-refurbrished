import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export type AuthProfile = {
  id: string
  role: string
  disabled: boolean
  caps: string[]
  [key: string]: unknown
}

export const useAuth = defineStore('auth', () => {
  const user = ref<{ id: string; email?: string } | null>(null)
  const profile = ref<AuthProfile | null>(null)
  const loading = ref(true)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  async function loadProfile() {
    loading.value = true
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser ? { id: currentUser.id, email: currentUser.email } : null
      if (!currentUser) {
        profile.value = null
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (error) throw error
      profile.value = data ? {
        ...data,
        id: currentUser.id,
        role: String(data.role ?? 'cashier'),
        disabled: Boolean(data.disabled),
        caps: Array.isArray(data.caps) ? data.caps.map(String) : [],
      } : null
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  void loadProfile()
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      user.value = null
      profile.value = null
      loading.value = false
    } else if (user.value?.id !== session.user.id) {
      void loadProfile()
    }
  })

  return { user, profile, loading, isAdmin, loadProfile, signOut }
})
