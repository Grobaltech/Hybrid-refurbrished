<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'category', label: 'Category', type: 'text', required: true },
  { key: 'amount', label: 'Amount (UGX)', type: 'number', required: true },
  { key: 'note', label: 'Note', type: 'textarea', required: false }
]
</script>
<template><ResourceView title="Expenses" table="expenses" :fields="fields" :columns="undefined" :search-keys="['date', 'category', 'amount', 'note']" :can-delete="true" /></template>
