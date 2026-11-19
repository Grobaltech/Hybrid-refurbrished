<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'

const fields = [
  { key: 'slug', label: 'Content key', required: true },
  { key: 'title', label: 'Title', required: true },
  { key: 'body', label: 'Content', type: 'textarea' },
  { key: 'image_url', label: 'Image URL' },
  { key: 'published', label: 'Published', type: 'text' },
]
</script>

<template>
  <ResourceView
    title="Company content"
    table="site_content"
    :fields="fields"
    :columns="['id', 'slug', 'title', 'published', 'updated_at']"
    :search-keys="['slug', 'title', 'body']"
    order-by="updated_at"
    description="Manage public-facing company pages, notices and catalog content."
  />
</template>
