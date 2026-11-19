<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
  { key: 'username', label: 'User', type: 'text', required: false },
  { key: 'action', label: 'Action', type: 'text', required: false },
  { key: 'entity_type', label: 'Record type', type: 'text', required: false },
  { key: 'entity_id', label: 'Record ID', type: 'number', required: false },
  { key: 'message', label: 'Details', type: 'textarea', required: false },
  { key: 'page', label: 'Page', type: 'text', required: false },
  { key: 'created_at', label: 'Date', type: 'text', required: false }
]
</script>
<template><ResourceView title="Activity" table="audit_logs" :fields="fields" :columns="['id','username','action','entity_type','entity_id','message','page','created_at']" :search-keys="['id', 'username', 'action', 'entity_type', 'entity_id', 'message', 'page', 'created_at']" :can-create="false" :can-edit="false" :can-delete="false"/></template>
