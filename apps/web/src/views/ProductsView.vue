<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ResourceView from '@/components/ResourceView.vue'

const fields = [
  { key: 'sku', label: 'SKU', type: 'text', required: true },
  { key: 'name', label: 'Product name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'barcode', label: 'Barcode', type: 'text' },
  { key: 'selling_price', label: 'Selling price (UGX)', type: 'number', required: true },
  { key: 'quantity', label: 'Stock quantity', type: 'number', required: true },
  { key: 'minimum_stock', label: 'Low-stock threshold', type: 'number', required: true },
  { key: 'unit', label: 'Unit', type: 'text', required: true },
  { key: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
]
</script>

<template>
  <section class="page-wrap">
    <div class="page-heading">
      <div>
        <h1>Products</h1>
        <p>Manage the shared product catalogue and prices. Branch stock is tracked separately under Branch management.</p>
      </div>
      <RouterLink to="/products/new" class="btn primary">＋ Add product</RouterLink>
    </div>
    <ResourceView
      title="Product catalogue"
      table="products"
      :fields="fields"
      :columns="['sku','name','category','selling_price','minimum_stock','active']"
      :search-keys="['sku','name','category','barcode']"
      :can-create="true"
      :can-delete="false"
    />
  </section>
</template>
