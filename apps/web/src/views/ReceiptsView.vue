<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const rows = ref<any[]>([])
const error = ref('')
const q = ref('')
const loading = ref(true)
const router = useRouter()

const filteredRows = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return rows.value
  return rows.value.filter((sale) =>
    String(sale.sale_number ?? sale.id).toLowerCase().includes(term) ||
    String(sale.customers?.name ?? '').toLowerCase().includes(term) ||
    String(sale.customer_id ?? '').toLowerCase().includes(term),
  )
})

onMounted(async () => {
  const { data, error: queryError } = await supabase
    .from('sales')
    .select('id,sale_number,customer_id,total,payment_method,created_at,customers(name)')
    .order('created_at', { ascending: false })
    .limit(250)

  if (queryError) error.value = queryError.message
  else rows.value = data ?? []
  loading.value = false
})
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div>
        <h1>Receipts</h1>
        <p>Open, print or save completed sales receipts.</p>
      </div>
    </div>

    <input v-model="q" class="control search" placeholder="Search receipt number or customer">

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-else-if="loading" class="empty">Loading receipts…</p>
    <p v-else-if="!filteredRows.length" class="empty">No receipts found.</p>

    <div v-else class="table-scroll mt">
      <table>
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in filteredRows" :key="sale.id">
            <td>{{ sale.sale_number ?? sale.id }}</td>
            <td>{{ sale.customers?.name ?? 'Walk-in' }}</td>
            <td>UGX {{ Number(sale.total ?? 0).toLocaleString() }}</td>
            <td>{{ sale.payment_method }}</td>
            <td>{{ new Date(sale.created_at).toLocaleString() }}</td>
            <td>
              <button class="link" @click="router.push(`/receipts/${sale.id}`)">
                View receipt
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
