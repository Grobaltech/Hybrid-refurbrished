<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

type Setting = {
  id: string
  setting_key: string
  setting_value: unknown
  description: string | null
  updated_at: string
}
const auth = useAuth()
const rows = ref<Setting[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const search = ref('')
const editing = ref<Setting | null>(null)
const showForm = ref(false)
const settingKey = ref('')
const settingValue = ref('{}')
const description = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? rows.value.filter(r => [r.setting_key, r.description ?? '', JSON.stringify(r.setting_value)].some(v => v.toLowerCase().includes(q))) : rows.value
})

function openForm(row?: Setting) {
  editing.value = row ?? null
  settingKey.value = row?.setting_key ?? ''
  settingValue.value = JSON.stringify(row?.setting_value ?? {}, null, 2)
  description.value = row?.description ?? ''
  error.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: e } = await supabase
      .from('business_settings')
      .select('id,setting_key,setting_value,description,updated_at')
      .order('setting_key', { ascending: true })
    if (e) throw e
    rows.value = (data ?? []) as Setting[]
  } catch (e: any) {
    error.value = e.message ?? 'Unable to load settings'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    let parsedValue: unknown
    try {
      parsedValue = JSON.parse(settingValue.value)
    } catch {
      throw new Error('Setting value must be valid JSON. For text values, put the text inside double quotes.')
    }
    const payload = {
      setting_key: settingKey.value.trim(),
      setting_value: parsedValue,
      description: description.value.trim() || null,
      updated_by: auth.user?.id ?? null,
      updated_at: new Date().toISOString()
    }
    if (!payload.setting_key) throw new Error('Setting key is required.')
    const result = editing.value
      ? await supabase.from('business_settings').update(payload).eq('id', editing.value.id)
      : await supabase.from('business_settings').insert(payload)
    if (result.error) throw result.error
    closeForm()
    await load()
  } catch (e: any) {
    error.value = e.message ?? 'Unable to save setting'
  } finally {
    saving.value = false
  }
}

async function remove(row: Setting) {
  if (!auth.isAdmin || !confirm(`Delete the setting "${row.setting_key}"?`)) return
  const { error: e } = await supabase.from('business_settings').delete().eq('id', row.id)
  if (e) error.value = e.message
  else await load()
}

function displayValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

onMounted(load)
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div><h1>Settings</h1><p>Manage configuration values for this business.</p></div>
      <button v-if="auth.isAdmin" class="btn primary" @click="openForm()">＋ Add Setting</button>
    </div>
    <div class="toolbar">
      <input v-model="search" class="control search" placeholder="Search settings…">
      <button class="btn" @click="load">Refresh</button>
      <span class="muted">{{ filtered.length }} settings</span>
    </div>
    <p v-if="error" class="alert">{{ error }}</p>
    <div v-if="loading" class="empty">Loading settings…</div>
    <div v-else class="table-scroll">
      <table>
        <thead><tr><th>Setting key</th><th>Setting value</th><th>Description</th><th>Last updated</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <td>{{ row.setting_key }}</td>
            <td class="value-cell">{{ displayValue(row.setting_value) }}</td>
            <td>{{ row.description || '—' }}</td>
            <td>{{ new Date(row.updated_at).toLocaleString() }}</td>
            <td class="actions">
              <button v-if="auth.isAdmin" class="link" @click="openForm(row)">Edit</button>
              <button v-if="auth.isAdmin" class="link danger" @click="remove(row)">Delete</button>
            </td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="5" class="empty">No settings have been added yet.</td></tr>
        </tbody>
      </table>
    </div>
    <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
      <form class="modal" @submit.prevent="save">
        <div class="page-heading"><h2>{{ editing ? 'Edit Setting' : 'New Setting' }}</h2><button type="button" class="link" @click="closeForm">Close</button></div>
        <label>Setting key<input v-model="settingKey" class="control" required maxlength="120" :disabled="!!editing"></label>
        <label>Setting value (valid JSON)<textarea v-model="settingValue" class="control" rows="7" required spellcheck="false"></textarea></label>
        <label>Description (optional)<textarea v-model="description" class="control" rows="2"></textarea></label>
        <p v-if="error" class="alert">{{ error }}</p>
        <div class="modal-actions"><button type="button" class="btn" @click="closeForm">Cancel</button><button class="btn primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save setting' }}</button></div>
      </form>
    </div>
  </section>
</template>
