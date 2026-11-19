<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'

const loading = ref(true)
const error = ref('')
const stats = ref({ sales: 0, revenue: 0, products: 0, lowStock: 0, credits: 0, expenses: 0 })
const recent = ref<any[]>([])

onMounted(async () => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const dateKey = today.toISOString().slice(0, 10)

    const [salesResult, productsResult, creditsResult, expensesResult, recentResult] = await Promise.all([
      supabase.from('sales').select('grand_total,created_at').gte('created_at', startOfDay),
      supabase.from('products').select('id,stock,track_inventory'),
      supabase.from('credits').select('balance').eq('status', 'open'),
      supabase.from('expenses').select('amount').gte('date', dateKey),
      supabase.from('sales').select('id,receipt_no,grand_total,payment_method,created_at').order('created_at', { ascending: false }).limit(8),
    ])

    for (const result of [salesResult, productsResult, creditsResult, expensesResult, recentResult]) {
      if (result.error) throw result.error
    }

    const sales = salesResult.data ?? []
    const products = productsResult.data ?? []
    const credits = creditsResult.data ?? []
    const expenses = expensesResult.data ?? []

    stats.value = {
      sales: sales.length,
      revenue: sales.reduce((total, sale) => total + Number(sale.grand_total || 0), 0),
      products: products.length,
      lowStock: products.filter((product) => product.track_inventory && product.stock <= 5).length,
      credits: credits.reduce((total, credit) => total + Number(credit.balance || 0), 0),
      expenses: expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0),
    }
    recent.value = recentResult.data ?? []
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : 'Dashboard unavailable'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div>
        <h1>Dashboard</h1>
        <p>Business overview · {{ new Date().toLocaleDateString() }}</p>
      </div>
    </div>
    <p v-if="error" class="alert">{{ error }}</p>
    <div v-if="loading" class="empty">Loading dashboard…</div>
    <template v-else>
      <div class="stats-grid">
        <article class="stat"><span>Today's sales</span><strong>{{ stats.sales }}</strong></article>
        <article class="stat"><span>Today's revenue</span><strong>UGX {{ stats.revenue.toLocaleString() }}</strong></article>
        <article class="stat"><span>Products</span><strong>{{ stats.products }}</strong></article>
        <article class="stat"><span>Low stock (≤5)</span><strong>{{ stats.lowStock }}</strong></article>
        <article class="stat"><span>Customer credit outstanding</span><strong>UGX {{ stats.credits.toLocaleString() }}</strong></article>
        <article class="stat"><span>Today's expenses</span><strong>UGX {{ stats.expenses.toLocaleString() }}</strong></article>
      </div>
      <div class="panel mt">
        <h2>Recent sales</h2>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Receipt</th><th>Date</th><th>Payment</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-for="sale in recent" :key="sale.id">
                <td>{{ sale.receipt_no ?? sale.id }}</td>
                <td>{{ new Date(sale.created_at).toLocaleString() }}</td>
                <td>{{ sale.payment_method }}</td>
                <td>UGX {{ Number(sale.grand_total).toLocaleString() }}</td>
              </tr>
              <tr v-if="!recent.length"><td colspan="4" class="empty">No sales recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>
