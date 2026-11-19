<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'

const rows = ref<any[]>([])
const error = ref('')
const selected = ref<any>(null)
const amount = ref(0)
const note = ref('')
const busy = ref(false)
const show = ref(false)
const historyId = ref<number | null>(null)
const form = ref({ name: '', phone: '', description: '', total_credit: 0 })
const latestPayments = computed(() => rows.value.flatMap(creditor =>
  (creditor.creditor_payments ?? []).map((payment: any) => ({ ...payment, creditorName: creditor.name, creditorId: creditor.id }))
).sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()).slice(0, 50))

function recentPayments(row: any) {
  return [...(row.creditor_payments ?? [])].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()).slice(0, 5)
}

async function load() {
  const { data, error: queryError } = await supabase
    .from('creditors')
    .select('*,creditor_payments(id,amount,paid_at,note)')
    .order('created_at', { ascending: false })
  if (queryError) error.value = queryError.message
  else rows.value = data ?? []
}

async function create() {
  busy.value = true
  error.value = ''
  try {
    const total = Number(form.value.total_credit)
    const { error: insertError } = await supabase.from('creditors').insert({
      ...form.value,
      total_credit: total,
      amount_paid: 0,
      balance: total,
    })
    if (insertError) throw insertError
    show.value = false
    form.value = { name: '', phone: '', description: '', total_credit: 0 }
    await load()
  } catch (cause: any) {
    error.value = cause.message ?? 'Could not save creditor'
  } finally {
    busy.value = false
  }
}

async function pay() {
  if (!selected.value) return
  busy.value = true
  error.value = ''
  try {
    const { error: paymentError } = await supabase.rpc('record_creditor_payment', {
      p_creditor_id: selected.value.id,
      p_amount: Number(amount.value),
      p_note: note.value || null,
    })
    if (paymentError) throw paymentError
    selected.value = null
    amount.value = 0
    note.value = ''
    await load()
  } catch (cause: any) {
    error.value = cause.message ?? 'Could not record repayment'
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div><h1>Creditors</h1><p>Track money the business owes, record repayments and review payment history.</p></div>
      <button class="btn primary" @click="show = true">＋ Add creditor</button>
    </div>
    <p v-if="error" class="alert">{{ error }}</p>
    <div class="table-scroll">
      <table>
        <thead><tr><th>Creditor</th><th>Phone</th><th>Description</th><th>Total credit</th><th>Paid</th><th>Balance</th><th>Actions</th></tr></thead>
        <tbody>
          <template v-for="row in rows" :key="row.id">
            <tr>
              <td>{{ row.name }}</td><td>{{ row.phone ?? '—' }}</td><td>{{ row.description ?? '—' }}</td>
              <td>UGX {{ Number(row.total_credit).toLocaleString() }}</td>
              <td>UGX {{ Number(row.amount_paid).toLocaleString() }}</td>
              <td>UGX {{ Number(row.balance).toLocaleString() }}</td>
              <td class="actions">
                <button class="link" @click="historyId = historyId === row.id ? null : row.id">Recent payments</button>
                <button v-if="Number(row.balance) > 0" class="link" @click="selected = row; amount = Number(row.balance)">Record payment</button>
              </td>
            </tr>
            <tr v-if="historyId === row.id">
              <td colspan="7">
                <div v-if="row.creditor_payments?.length" class="table-scroll">
                  <table><thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
                    <tbody><tr v-for="payment in recentPayments(row)" :key="payment.id">
                      <td>{{ new Date(payment.paid_at).toLocaleString() }}</td>
                      <td>UGX {{ Number(payment.amount).toLocaleString() }}</td>
                      <td>{{ payment.note ?? '—' }}</td>
                    </tr></tbody>
                  </table>
                </div>
                <p v-else class="empty">No recent payments.</p>
              </td>
            </tr>
          </template>
          <tr v-if="!rows.length"><td colspan="7" class="empty">No creditor records yet.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="panel mt">
      <h2>Latest repayments (up to 50)</h2>
      <div class="table-scroll">
        <table><thead><tr><th>Creditor</th><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
          <tbody><tr v-for="payment in latestPayments" :key="payment.id">
            <td>{{ payment.creditorName }} (#{{ payment.creditorId }})</td>
            <td>{{ new Date(payment.paid_at).toLocaleString() }}</td>
            <td>UGX {{ Number(payment.amount).toLocaleString() }}</td>
            <td>{{ payment.note ?? '—' }}</td>
          </tr><tr v-if="!latestPayments.length"><td colspan="4" class="empty">No repayments recorded yet.</td></tr></tbody>
        </table>
      </div>
    </div>
    <div v-if="show || selected" class="modal-backdrop" @click.self="show = false; selected = null">
      <form v-if="show" class="modal" @submit.prevent="create">
        <h2>Add creditor</h2>
        <label>Name<input v-model="form.name" class="control" required></label>
        <label>Phone<input v-model="form.phone" class="control"></label>
        <label>Description<textarea v-model="form.description" class="control" rows="2"></textarea></label>
        <label>Opening amount owed<input v-model.number="form.total_credit" type="number" min="0" step="0.01" class="control" required></label>
        <div class="modal-actions"><button type="button" class="btn" @click="show = false">Cancel</button><button class="btn primary" :disabled="busy">Save creditor</button></div>
      </form>
      <form v-else class="modal" @submit.prevent="pay">
        <h2>Record creditor payment</h2>
        <p>{{ selected.name }} · Balance UGX {{ Number(selected.balance).toLocaleString() }}</p>
        <label>Amount<input v-model.number="amount" type="number" min="0.01" :max="selected.balance" step="0.01" class="control" required></label>
        <label>Note<input v-model="note" class="control"></label>
        <div class="modal-actions"><button type="button" class="btn" @click="selected = null">Cancel</button><button class="btn primary" :disabled="busy || amount <= 0 || amount > selected.balance">Save payment</button></div>
      </form>
    </div>
  </section>
</template>
