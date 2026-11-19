<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const data = ref({
  cashSales: 0,
  creditSales: 0,
  customerOwed: 0,
  creditorOwed: 0,
  expenses: 0,
  stockCost: null as number | null,
})
const error = ref('')
const loading = ref(true)

function print() {
  window.print()
}

onMounted(async () => {
  const [salesResult, creditsResult, creditorsResult, expensesResult] = await Promise.all([
    supabase.from('sales').select('grand_total,payment_method'),
    supabase.from('credits').select('balance').eq('status', 'open'),
    supabase.from('creditors').select('balance'),
    supabase.from('expenses').select('amount'),
  ])

  for (const result of [salesResult, creditsResult, creditorsResult, expensesResult]) {
    if (result.error) {
      error.value = result.error.message
      loading.value = false
      return
    }
  }

  const sales = salesResult.data ?? []
  const credits = creditsResult.data ?? []
  const creditors = creditorsResult.data ?? []
  const expenses = expensesResult.data ?? []

  let stockCost: number | null = null
  if (auth.isAdmin || auth.profile?.caps.includes('view_costs')) {
    const { data: inventoryValue, error: inventoryError } = await supabase.rpc('inventory_value')
    if (inventoryError) error.value = inventoryError.message
    else stockCost = Number(inventoryValue ?? 0)
  }

  data.value = {
    cashSales: sales
      .filter((sale) => sale.payment_method === 'cash')
      .reduce((total, sale) => total + Number(sale.grand_total || 0), 0),
    creditSales: sales
      .filter((sale) => sale.payment_method === 'credit')
      .reduce((total, sale) => total + Number(sale.grand_total || 0), 0),
    customerOwed: credits.reduce((total, credit) => total + Number(credit.balance || 0), 0),
    creditorOwed: creditors.reduce((total, creditor) => total + Number(creditor.balance || 0), 0),
    expenses: expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0),
    stockCost,
  }
  loading.value = false
})
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div>
        <h1>Business balance</h1>
        <p>Current receivables, payables, stock value and recorded expenses.</p>
      </div>
      <button class="btn" @click="print">Print / Save PDF</button>
    </div>
    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="loading" class="empty">Calculating balance…</p>
    <div v-else class="stats-grid">
      <article class="stat"><span>Cash sales recorded</span><strong>UGX {{ data.cashSales.toLocaleString() }}</strong></article>
      <article class="stat"><span>Credit sales recorded</span><strong>UGX {{ data.creditSales.toLocaleString() }}</strong></article>
      <article class="stat"><span>Customers owe</span><strong>UGX {{ data.customerOwed.toLocaleString() }}</strong></article>
      <article class="stat"><span>Business owes suppliers/creditors</span><strong>UGX {{ data.creditorOwed.toLocaleString() }}</strong></article>
      <article class="stat"><span>Recorded expenses</span><strong>UGX {{ data.expenses.toLocaleString() }}</strong></article>
      <article class="stat"><span>Inventory at cost</span><strong>{{ data.stockCost === null ? 'Restricted' : 'UGX ' + data.stockCost.toLocaleString() }}</strong></article>
    </div>
  </section>
</template>
