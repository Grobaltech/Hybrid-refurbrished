<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'

const fields = [
  { key: 'sale_number', label: 'Receipt number', type: 'text', required: false },
  { key: 'customer_id', label: 'Customer ID', type: 'text', required: false },
  { key: 'subtotal', label: 'Subtotal', type: 'number', required: false },
  { key: 'discount', label: 'Discount', type: 'number', required: false },
  { key: 'tax', label: 'Tax', type: 'number', required: false },
  { key: 'total', label: 'Total', type: 'number', required: false },
  { key: 'amount_paid', label: 'Amount paid', type: 'number', required: false },
  { key: 'balance', label: 'Balance', type: 'number', required: false },
  { key: 'payment_method', label: 'Payment method', type: 'text', required: false },
  { key: 'payment_status', label: 'Payment status', type: 'text', required: false },
  { key: 'created_at', label: 'Date', type: 'text', required: false },
]
</script>

<template>
  <ResourceView
    title="Sales history"
    table="sales"
    :fields="fields"
    :columns="['sale_number','customer_id','subtotal','discount','tax','total','amount_paid','balance','payment_method','payment_status','created_at']"
    :search-keys="['sale_number','customer_id','payment_method','payment_status','created_at']"
    :can-delete="false"
    :can-create="false"
    :can-edit="false"
  />
</template>
