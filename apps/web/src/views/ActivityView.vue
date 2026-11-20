<script setup lang="ts">
import ResourceView from '@/components/ResourceView.vue'
const fields=[
 {key:'id',label:'Log ID',readonly:true},
 {key:'user_id',label:'User ID',readonly:true},
 {key:'action',label:'Action',readonly:true},
 {key:'table_name',label:'Table',readonly:true},
 {key:'record_id',label:'Record ID',readonly:true},
 {key:'old_data',label:'Previous data',readonly:true},
 {key:'new_data',label:'New data',readonly:true},
 {key:'ip_address',label:'IP address',readonly:true},
 {key:'created_at',label:'Date',readonly:true},
]
</script>
<template><ResourceView title="Activity" table="audit_logs" :fields="fields" :columns="['created_at','user_id','action','table_name','record_id','ip_address','old_data','new_data']" :search-keys="['id','user_id','action','table_name','record_id','ip_address']" :can-create="false" :can-edit="false" :can-delete="false" /></template>