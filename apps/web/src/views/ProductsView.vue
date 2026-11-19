<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
  { key: 'sku', label: 'SKU', type: 'text', required: true },
  { key: 'name', label: 'Product name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'text', required: false },
  { key: 'barcode', label: 'Barcode', type: 'text', required: false },
    { key: 'price_sell', label: 'Selling price', type: 'number', required: true },
  { key: 'stock', label: 'Stock quantity', type: 'number', required: true },
  { key: 'track_inventory', label: 'Track stock for this item', type: 'checkbox', required: false }
]
</script>
<template><ResourceView title="Products" table="products" :fields="fields" :source-table="'products_for_sale'" :columns="undefined" :search-keys="['sku', 'name', 'category', 'barcode', 'price_cost', 'price_sell', 'stock']" :can-delete="true" /></template>
