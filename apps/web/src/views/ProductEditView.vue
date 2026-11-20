<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
const route = useRoute(), router = useRouter()
const row = ref<any>({ sku: '', name: '', category: '', barcode: '', selling_price: 0, quantity: 0, minimum_stock: 0, unit: 'piece', active: true })
const busy = ref(false), error = ref('')
onMounted(async () => {
  if (route.params.id === 'new') return
  const { data, error: e } = await supabase.from('products').select('id,sku,name,category,barcode,selling_price,quantity,minimum_stock,unit,active').eq('id', String(route.params.id)).single()
  if (e) error.value = e.message
  else row.value = data
})
async function save() {
  busy.value = true; error.value = ''
  try {
    const payload = { ...row.value, selling_price: Number(row.value.selling_price), quantity: Number(row.value.quantity), minimum_stock: Number(row.value.minimum_stock) }
    const query = route.params.id === 'new' ? supabase.from('products').insert(payload) : supabase.from('products').update(payload).eq('id', String(route.params.id))
    const { error: e } = await query
    if (e) throw e
    await router.push('/products')
  } catch (e: any) { error.value = e.message } finally { busy.value = false }
}
</script>
<template><section class="page-wrap"><div class="page-heading"><h1>{{ route.params.id === 'new' ? 'Add product' : 'Edit product' }}</h1><button class="btn" @click="router.back()">Back</button></div>
<form class="panel" style="max-width:650px;display:grid;gap:13px" @submit.prevent="save">
<label>SKU<input v-model="row.sku" class="control" required></label><label>Product name<input v-model="row.name" class="control" required></label><label>Category<input v-model="row.category" class="control"></label><label>Barcode<input v-model="row.barcode" class="control"></label>
<label>Selling price (UGX)<input v-model.number="row.selling_price" type="number" min="0" step="0.01" class="control" required></label>
<label>Stock quantity<input v-model.number="row.quantity" type="number" min="0" step="1" class="control" required></label><label>Minimum stock alert<input v-model.number="row.minimum_stock" type="number" min="0" step="1" class="control" required></label><label>Unit<input v-model="row.unit" class="control" required></label><label class="flex gap-2 items-center"><input v-model="row.active" type="checkbox"> Active product</label>
<p v-if="error" class="alert">{{ error }}</p><button class="btn primary" :disabled="busy">{{ busy ? 'Saving…' : 'Save product' }}</button></form></section></template>