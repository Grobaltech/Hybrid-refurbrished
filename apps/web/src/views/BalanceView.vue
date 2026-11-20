<script setup lang="ts">
import {onMounted,ref} from 'vue'
import {supabase} from '@/lib/supabase'
const data=ref({cashSales:0,creditSales:0,customerOwed:0,supplierOwed:0,expenses:0,stockCost:null as number|null})
const error=ref(''),loading=ref(true)
function print(){window.print()}
onMounted(async()=>{const [s,c,v,e]=await Promise.all([
 supabase.from('sales').select('total,payment_method'),
 supabase.from('customer_credits').select('balance').gt('balance',0),
 supabase.from('supplier_credits').select('balance').gt('balance',0),
 supabase.from('expenses').select('amount'),
]);for(const r of [s,c,v,e])if(r.error){error.value=r.error.message;loading.value=false;return}
const sales=s.data??[];data.value={cashSales:sales.filter(x=>x.payment_method==='cash').reduce((a,x)=>a+Number(x.total||0),0),creditSales:sales.filter(x=>x.payment_method==='credit').reduce((a,x)=>a+Number(x.total||0),0),customerOwed:(c.data??[]).reduce((a,x)=>a+Number(x.balance||0),0),supplierOwed:(v.data??[]).reduce((a,x)=>a+Number(x.balance||0),0),expenses:(e.data??[]).reduce((a,x)=>a+Number(x.amount||0),0),stockCost:null};loading.value=false})
</script>
<template><section class="page-wrap"><div class="page-heading"><div><h1>Business balance</h1><p>Current sales, customer receivables, supplier payables and recorded expenses.</p></div><button class="btn" @click="print">Print / Save PDF</button></div><p v-if="error" class="alert">{{error}}</p><p v-if="loading" class="empty">Calculating balance…</p><div v-else class="stats-grid">
<article class="stat"><span>Cash sales recorded</span><strong>UGX {{data.cashSales.toLocaleString()}}</strong></article><article class="stat"><span>Credit sales recorded</span><strong>UGX {{data.creditSales.toLocaleString()}}</strong></article><article class="stat"><span>Customers owe</span><strong>UGX {{data.customerOwed.toLocaleString()}}</strong></article><article class="stat"><span>Business owes suppliers</span><strong>UGX {{data.supplierOwed.toLocaleString()}}</strong></article><article class="stat"><span>Recorded expenses</span><strong>UGX {{data.expenses.toLocaleString()}}</strong></article><article class="stat"><span>Inventory at cost</span><strong>Restricted / not included</strong></article>
</div></section></template>