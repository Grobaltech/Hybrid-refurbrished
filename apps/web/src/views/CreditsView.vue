<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'

const rows = ref<any[]>([])
const busy = ref(false)
const error = ref('')
const selected = ref<any>(null)
const historyId = ref<number | null>(null)
const statusFilter = ref<'open' | 'all'>('open')
const amount = ref(0)
const method = ref('cash')
const note = ref('')
const visibleRows = computed(() => statusFilter.value === 'open' ? rows.value.filter(row => row.status === 'open') : rows.value)

async function load() {
  const { data, error: queryError } = await supabase
    .from('credits')
    .select('*,customers(name,phone),sales(receipt_no),credit_payments(id,amount,method,note,notes,paid_at)')
    .order('created_at', { ascending: false })
  if (queryError) error.value = queryError.message
  else rows.value = data ?? []
}

async function pay() {
  if (!selected.value) return
  busy.value = true
  error.value = ''
  try {
    const { error: paymentError } = await supabase.rpc('record_credit_payment', {
      p_credit_id: selected.value.id,
      p_amount: Number(amount.value),
      p_method: method.value,
      p_note: note.value || null,
    })
    if (paymentError) throw paymentError
    selected.value = null
    amount.value = 0
    note.value = ''
    await load()
  } catch (cause: any) {
    error.value = cause.message ?? 'Could not record payment'
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div><h1>Customer credits</h1><p>Track amounts customers owe, receive repayments and inspect payment history.</p></div>
      <button class="btn" @click="load">Refresh</button>
    </div>
    <div class="toolbar">
      <button class="btn" :class="{ primary: statusFilter === 'open' }" @click="statusFilter = 'open'">Open</button>
      <button class="btn" :class="{ primary: statusFilter === 'all' }" @click="statusFilter = 'all'">All credits</button>
    </div>
    <p v-if="error" class="alert">{{ error }}</p>
    <div class="table-scroll">
      <table>
        <thead><tr><th>Customer</th><th>Receipt</th><th>Amount</th><th>Balance</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          <template v-for="row in visibleRows" :key="row.id">
            <tr>
              <td>{{ row.customers?.name ?? '—' }}</td>
              <td>{{ row.sales?.receipt_no ?? row.sale_id }}</td>
              <td>UGX {{ Number(row.amount).toLocaleString() }}</td>
              <td>UGX {{ Number(row.balance).toLocaleString() }}</td>
              <td>{{ row.status }}</td>
              <td>{{ new Date(row.created_at).toLocaleDateString() }}</td>
              <td class="actions">
                <button class="link" @click="historyId = historyId === row.id ? null : row.id">History</button>
                <button v-if="row.status === 'open'" class="link" @click="selected = row; amount = Number(row.balance)">Take payment</button>
              </td>
            </tr>
            <tr v-if="historyId === row.id">
              <td colspan="7">
                <strong>Payment history</strong>
                <div v-if="row.credit_payments?.length" class="table-scroll">
                  <table>
                    <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Notes</th></tr></thead>
                    <tbody><tr v-for="payment in row.credit_payments" :key="payment.id">
                      <td>{{ new Date(payment.paid_at).toLocaleString() }}</td>
                      <td>UGX {{ Number(payment.amount).toLocaleString() }}</td>
                      <td>{{ payment.method ?? 'cash' }}</td>
                      <td>{{ payment.notes ?? payment.note ?? '—' }}</td>
                    </tr></tbody>
                  </table>
                </div>
                <p v-else class="empty">No payments recorded yet.</p>
              </td>
            </tr>
          </template>
          <tr v-if="!visibleRows.length"><td colspan="7" class="empty">No credits found.</td></tr>
        </tbody>
      </table>
    </div>
    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <form class="modal" @submit.prevent="pay">
        <h2>Record customer payment</h2>
        <p>{{ selected.customers?.name }} · Balance UGX {{ Number(selected.balance).toLocaleString() }}</p>
        <label>Amount<input v-model.number="amount" type="number" min="0.01" :max="selected.balance" step="0.01" class="control" required></label>
        <label>Method<select v-model="method" class="control"><option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile_money">Mobile money</option></select></label>
        <label>Note<input v-model="note" class="control"></label>
        <div class="modal-actions">
          <button type="button" class="btn" @click="selected = null">Cancel</button>
          <button class="btn primary" :disabled="busy || amount <= 0 || amount > selected.balance">{{ busy ? 'Saving…' : 'Save payment' }}</button>
        </div>
      </form>
    </div>
  </section>
</template>
