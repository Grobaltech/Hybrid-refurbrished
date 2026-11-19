<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const rows = ref<any[]>([])
const error = ref('')
const q = ref('')
const router = useRouter()

onMounted(async () => {
  const { data, error: queryError } = await supabase
    .from('sales')
    .select('id,receipt_no,customer_id,grand_total,payment_method,created_at,customers(name)')
    .order('created_at', { ascending: false })
    .limit(250)

  if (queryError) {
    error.value = queryError.message
  } else {
    rows.value = data ?? []
  }
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

    <input
      v-model="q"
      class="control search"
      placeholder="Search receipt number or customer ID"
    >

    <p v-if="error" class="alert">{{ error }}</p>

    <div class="table-scroll mt">
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
          <tr
            v-for="r in rows.filter(
              (x) =>
                String(x.receipt_no ?? x.id).toLowerCase().includes(q.toLowerCase()) ||
                String(x.customers?.name ?? '').toLowerCase().includes(q) || String(x.customer_id ?? '').includes(q),
            )"
            :key="r.id"
          >
            <td>{{ r.receipt_no ?? r.id }}</td>
            <td>{{ r.customers?.name ?? 'Walk-in' }}</td>
            <td>UGX {{ Number(r.grand_total).toLocaleString() }}</td>
            <td>{{ r.payment_method }}</td>
            <td>{{ new Date(r.created_at).toLocaleString() }}</td>
            <td>
              <button class="link" @click="router.push(`/receipts/${r.id}`)">
                View receipt
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
