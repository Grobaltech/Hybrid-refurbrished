<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const sale = ref<any>(null)
const items = ref<any[]>([])
const customer = ref<any>(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  const { data, error: queryError } = await supabase
    .from('sales')
    .select('id,sale_number,customer_id,subtotal,discount,tax,total,amount_paid,balance,payment_method,payment_status,notes,created_at,sale_items(id,sale_id,product_id,quantity,unit_price,discount,total,products(name,sku)),customers(name,phone)')
    .eq('id', String(route.params.id))
    .single()

  if (queryError) {
    error.value = queryError.message
  } else {
    sale.value = data
    items.value = data.sale_items ?? []
    customer.value = data.customers
  }
  loading.value = false
})

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString()
}

function print() {
  window.print()
}
</script>

<template>
  <section class="page-wrap">
    <p v-if="error" class="alert">{{ error }}</p>
    <p v-else-if="loading" class="empty">Loading receipt…</p>

    <article v-else-if="sale" class="panel receipt">
      <div class="page-heading">
        <div>
          <h1>Receipt {{ sale.sale_number ?? sale.id }}</h1>
          <p>{{ new Date(sale.created_at).toLocaleString() }}</p>
        </div>
        <button class="btn" @click="print">Print / Save PDF</button>
      </div>

      <h2>Hybrid Shop</h2>
      <p v-if="customer">Customer: {{ customer.name }}<span v-if="customer.phone"> · {{ customer.phone }}</span></p>
      <p v-else>Customer: Walk-in</p>

      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Item</th><th>SKU</th><th>Qty</th><th>Unit price</th><th>Discount</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.products?.name ?? item.product_id }}</td>
              <td>{{ item.products?.sku ?? '—' }}</td>
              <td>{{ item.quantity }}</td>
              <td>UGX {{ money(item.unit_price) }}</td>
              <td>UGX {{ money(item.discount) }}</td>
              <td>UGX {{ money(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div>Subtotal <b>UGX {{ money(sale.subtotal) }}</b></div>
        <div>Discount <b>UGX {{ money(sale.discount) }}</b></div>
        <div>Tax <b>UGX {{ money(sale.tax) }}</b></div>
        <div class="grand">Total <b>UGX {{ money(sale.total) }}</b></div>
        <div>Amount paid <b>UGX {{ money(sale.amount_paid) }}</b></div>
        <div>Balance <b>UGX {{ money(sale.balance) }}</b></div>
        <div>Payment method <b>{{ sale.payment_method }}</b></div>
        <div>Payment status <b>{{ sale.payment_status }}</b></div>
        <div v-if="sale.notes">Notes <b>{{ sale.notes }}</b></div>
      </div>
    </article>
  </section>
</template>
