<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
  { key: 'k', label: 'Setting key', type: 'text', required: true },
  { key: 'v', label: 'Setting value', type: 'textarea', required: false }
]
</script>
<template><ResourceView title="Settings" table="settings" :fields="fields" :columns="undefined" :search-keys="['k', 'v']" :can-delete="true" :order-by="'k'" primary-key="k" /></template>
