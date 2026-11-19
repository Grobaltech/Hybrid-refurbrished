<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
  { key: 'receipt_no', label: 'Receipt number', type: 'text', required: false },
  { key: 'customer_id', label: 'Customer ID', type: 'number', required: false },
  { key: 'total', label: 'Subtotal', type: 'number', required: false },
  { key: 'tax_amount', label: 'Tax', type: 'number', required: false },
  { key: 'grand_total', label: 'Total', type: 'number', required: false },
  { key: 'payment_method', label: 'Payment method', type: 'text', required: false },
  { key: 'created_at', label: 'Date', type: 'text', required: false }
]
</script>
<template><ResourceView title="Sales history" table="sales_public" :fields="fields" :columns="['id','receipt_no','customer_id','total','tax_amount','grand_total','payment_method','created_at']" :search-keys="['id', 'receipt_no', 'customer_id', 'total', 'tax_amount', 'grand_total', 'payment_method', 'created_at']" :can-delete="false" :can-create="false" :can-edit="false" /></template>
