<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields = [
  { key: 'sku', label: 'SKU', type: 'text', required: true },
  { key: 'name', label: 'Product name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'barcode', label: 'Barcode', type: 'text' },
  { key: 'purchase_price', label: 'Purchase price (UGX)', type: 'number', required: true },
  { key: 'selling_price', label: 'Selling price (UGX)', type: 'number', required: true },
  { key: 'quantity', label: 'Stock quantity', type: 'number', required: true },
  { key: 'minimum_stock', label: 'Low-stock threshold', type: 'number', required: true },
  { key: 'unit', label: 'Unit', type: 'text', required: true },
  { key: 'active', label: 'Active', type: 'checkbox' },
]
</script>
<template><ResourceView title="Products" table="products" :fields="fields" :columns="['sku','name','category','selling_price','quantity','minimum_stock','active']" :search-keys="['sku','name','category','barcode']" :can-delete="false" /></template>