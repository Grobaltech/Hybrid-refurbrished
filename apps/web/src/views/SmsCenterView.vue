<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'

type SmsStatus = { configured:boolean; environment:string; senderIdConfigured:boolean; historyCount:number; staffCount:number; provider:string }
type SmsLog = { id:string; recipient_phone:string; message:string; provider_status:string; created_at:string }
const status = ref<SmsStatus | null>(null)
const history = ref<SmsLog[]>([])
const message = ref('')
const loading = ref(true)
const sending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const remaining = computed(() => 1500 - message.value.length)
const timeLabel = (value:string) => new Date(value).toLocaleString()

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data, error } = await supabase.functions.invoke('sms-center', { body: { action: 'status' } })
    if (error) throw error
    status.value = data as SmsStatus
    const { data: rows, error: historyError } = await supabase.from('sms_messages')
      .select('id,recipient_phone,message,provider_status,created_at')
      .order('created_at', { ascending:false }).limit(30)
    if (historyError) throw historyError
    history.value = rows || []
  } catch (e:any) {
    errorMessage.value = e.message || 'Could not load the SMS Centre.'
  } finally { loading.value = false }
}
async function sendBroadcast() {
  errorMessage.value = ''
  successMessage.value = ''
  if (!message.value.trim()) { errorMessage.value = 'Write a message first.'; return }
  if (!window.confirm('Send this SMS only to active staff members who have opted in to SMS updates?')) return
  sending.value = true
  try {
    const { data, error } = await supabase.functions.invoke('sms-center', {
      body: { action:'send_staff_broadcast', message:message.value.trim() }
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    successMessage.value = data.message || 'SMS request submitted.'
    message.value = ''
    await loadData()
  } catch (e:any) {
    errorMessage.value = e.message || 'SMS could not be sent.'
  } finally { sending.value = false }
}
onMounted(loadData)
</script>

<template>
  <section class="sms-page">
    <header class="page-heading">
      <div><h1>SMS Centre</h1><p>Send important shop updates to staff who have explicitly opted in.</p></div>
      <button class="btn" :disabled="loading" @click="loadData">↻ Refresh</button>
    </header>

    <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success">{{ successMessage }}</div>

    <div class="sms-stat-grid">
      <article class="panel sms-stat"><span>Gateway</span><strong>Africa's Talking</strong><small>{{ status?.configured ? 'Credentials detected' : 'Credentials not connected' }}</small></article>
      <article class="panel sms-stat"><span>Environment</span><strong>{{ status?.environment || '—' }}</strong><small>{{ status?.environment === 'production' ? 'Live SMS' : 'Sandbox testing' }}</small></article>
      <article class="panel sms-stat"><span>Staff accounts</span><strong>{{ status?.staffCount ?? '—' }}</strong><small>Active managers and cashiers</small></article>
      <article class="panel sms-stat"><span>Messages logged</span><strong>{{ status?.historyCount ?? '—' }}</strong><small>SMS history for this shop</small></article>
    </div>

    <div class="sms-content-grid">
      <article class="panel sms-compose">
        <div class="sms-section-heading"><div><h2>Send staff announcement</h2><p>Recipients must have a valid Ugandan phone number and SMS consent enabled in My Profile.</p></div><span class="sms-icon">✉</span></div>
        <label class="sms-field-label" for="sms-message">Message</label>
        <textarea id="sms-message" v-model="message" class="field sms-message-box" maxlength="1500" rows="7" placeholder="Write your staff announcement here..."></textarea>
        <div class="sms-compose-footer"><small :class="{ 'sms-count-warning': remaining < 100 }">{{ message.length }} / 1,500 characters</small><button class="btn primary" :disabled="sending || !message.trim() || !status?.configured" @click="sendBroadcast">{{ sending ? 'Submitting…' : 'Send to opted-in staff' }}</button></div>
        <p class="sms-footnote">Sending is restricted to opted-in staff in this shop. Customer marketing messages are not enabled until customer consent is captured separately.</p>
      </article>

      <aside class="panel sms-setup">
        <div class="sms-section-heading"><div><h2>Gateway setup</h2><p>Secure server-side credentials</p></div><span class="sms-icon">⌘</span></div>
        <div class="sms-setup-status"><span class="sms-status-dot" :class="{ 'is-ready':status?.configured }"></span><strong>{{ status?.configured ? 'Gateway credentials detected' : 'Connect your API credentials' }}</strong></div>
        <p>API credentials must be stored as Supabase Edge Function secrets. They are never placed in the browser or database.</p>
        <ol>
          <li>Open your Supabase project.</li>
          <li>Go to <strong>Edge Functions → Secrets</strong>.</li>
          <li>Add the secret names shown below.</li>
          <li>Use <strong>sandbox</strong> first, then switch to production when your live account is ready.</li>
        </ol>
        <div class="sms-secret-list">
          <code>AT_API_KEY</code>
          <code>AT_USERNAME</code>
          <code>AT_ENV</code>
          <code>AT_SENDER_ID</code> <small>Optional until sender ID is approved</small>
        </div>
        <p class="sms-footnote">For sandbox, use the username <strong>sandbox</strong> and the sandbox API key. For live delivery, use the username and key from your production application.</p>
        <a href="https://help.africastalking.com/en/articles/2258472-how-do-i-start-sending-messages" target="_blank" rel="noreferrer">Africa's Talking setup guide ↗</a>
      </aside>
    </div>

    <article class="panel sms-history">
      <div class="sms-section-heading"><div><h2>Recent SMS activity</h2><p>Latest messages submitted by this shop.</p></div></div>
      <div v-if="loading" class="sms-empty">Loading SMS activity…</div>
      <div v-else-if="!history.length" class="sms-empty">No SMS messages have been sent yet.</div>
      <div v-else class="sms-table-wrap">
        <table class="data-table sms-table">
          <thead><tr><th>Date</th><th>Recipient</th><th>Message</th><th>Provider status</th></tr></thead>
          <tbody><tr v-for="item in history" :key="item.id"><td>{{ timeLabel(item.created_at) }}</td><td>{{ item.recipient_phone }}</td><td class="sms-message-cell">{{ item.message }}</td><td><span class="sms-status-pill">{{ item.provider_status }}</span></td></tr></tbody>
        </table>
      </div>
    </article>
  </section>
</template>
