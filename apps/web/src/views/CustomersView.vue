<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
import { useAuth } from '@/stores/auth'
const auth=useAuth()
const fields=[
 {key:'name',label:'Customer name',type:'text',required:true},
 {key:'phone',label:'Phone',type:'text'},
 {key:'email',label:'Email',type:'email'},
]
</script>
<template><ResourceView title="Customers" table="customers" :fields="fields" :columns="undefined" :search-keys="['name','phone','email']" :can-delete="true" :can-create="auth.profile?.role!=='cashier'" :can-edit="auth.profile?.role!=='cashier'" /></template>