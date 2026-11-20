<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'

const customerFields = [
  { key: 'name', label: 'Customer name', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email', type: 'email' },
]

const noteFields = [
  { key: 'customer_id', label: 'Customer ID (UUID)', type: 'text', required: true },
  { key: 'note', label: 'Contact note', type: 'textarea', required: true },
]

const followupFields = [
  { key: 'customer_id', label: 'Customer ID', type: 'number', required: true },
  { key: 'due_at', label: 'Due date', type: 'datetime-local', required: true },
  { key: 'subject', label: 'Follow-up subject', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'status', label: 'Status', options: ['open', 'done', 'cancelled'], required: true },
]
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div>
        <h1>Customer relationship management</h1>
        <p>Customer records, contact notes and follow-up reminders.</p>
      </div>
    </div>

    <ResourceView
      title="Customers"
      table="customers"
      :fields="customerFields"
      :columns="['id', 'name', 'phone', 'email', 'created_at']"
      :search-keys="['name', 'phone', 'email']"
    />

    <div class="mt">
      <ResourceView
        title="Contact notes"
        table="crm_notes"
        :fields="noteFields"
        :columns="['id', 'customer_id', 'note', 'created_at']"
        :search-keys="['customer_id', 'note']"
      />
    </div>

    <div class="mt">
      <ResourceView
        title="Follow-ups"
        table="crm_followups"
        :fields="followupFields"
        :columns="['id', 'customer_id', 'due_at', 'subject', 'status']"
        :search-keys="['customer_id', 'subject', 'notes', 'status']"
        order-by="due_at"
      />
    </div>
  </section>
</template>
