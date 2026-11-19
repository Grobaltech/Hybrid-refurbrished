<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
  { key: 'name', label: 'Supplier name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'text', required: false },
  { key: 'email', label: 'Email', type: 'email', required: false }
]
</script>
<template><ResourceView title="Suppliers" table="suppliers" :fields="fields" :columns="undefined" :search-keys="['name', 'phone', 'email']" :can-delete="true" /></template>
