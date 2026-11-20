<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
import { useAuth } from '@/stores/auth'
const auth=useAuth()
const fields=[
 {key:'expense_number',label:'Expense number',type:'text',required:true},
 {key:'description',label:'Description',type:'text',required:true},
 {key:'category_id',label:'Category ID (optional)',type:'text'},
 {key:'amount',label:'Amount (UGX)',type:'number',required:true},
 {key:'expense_date',label:'Date and time',type:'datetime-local',required:true},
 {key:'payment_method',label:'Payment method',options:['cash','bank','mobile_money'],required:true},
 {key:'reference_number',label:'Reference',type:'text'},
 {key:'notes',label:'Notes',type:'textarea'},
]
</script>
<template><ResourceView title="Expenses" table="expenses" :fields="fields" :columns="['expense_number','description','category_id','amount','expense_date','payment_method','reference_number']" :search-keys="['expense_number','description','amount','payment_method','reference_number']" :can-delete="false" :can-create="auth.isAdmin" :can-edit="auth.isAdmin" /></template>