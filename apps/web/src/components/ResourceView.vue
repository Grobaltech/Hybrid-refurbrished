<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

type Field = { key:string; label:string; type?:string; required?:boolean; options?:string[]; readonly?:boolean }
const props = defineProps<{ title:string; table:string; fields:Field[]; columns?:string[]; searchKeys?:string[]; canDelete?:boolean; orderBy?:string; limit?:number; description?:string; canCreate?:boolean; canEdit?:boolean; sourceTable?:string; primaryKey?:string }>()
const auth = useAuth()
const rows = ref<any[]>([]), loading = ref(false), saving = ref(false), error = ref(''), query = ref('')
const editing = ref<any|null>(null), form = ref<Record<string,any>>({})
const visibleFields = computed(()=>props.fields.filter(f=>!f.readonly))
const filtered = computed(()=>{ const q=query.value.trim().toLowerCase(); if(!q)return rows.value; return rows.value.filter(r=>(props.searchKeys?.length?props.searchKeys:Object.keys(r)).some(k=>String(r[k]??'').toLowerCase().includes(q))) })
function start(row?:any){ editing.value=row??null; form.value={}; for(const f of visibleFields.value) form.value[f.key]=row?.[f.key]??(f.type==='number'?0:f.type==='checkbox'?true:''); error.value='' }
async function load(){ loading.value=true; error.value=''; try { let req=supabase.from(props.sourceTable??props.table).select('*').order(props.orderBy??'created_at',{ascending:false}).limit(props.limit??250); const {data,error:e}=await req; if(e)throw e; rows.value=data??[] } catch(e:any){error.value=e.message??'Unable to load records'} finally{loading.value=false} }
async function save(){ saving.value=true; error.value=''; try { const payload={...form.value}; for(const f of visibleFields.value){if(f.type==='number' && payload[f.key]!=='' )payload[f.key]=Number(payload[f.key]); if(payload[f.key]==='')payload[f.key]=null} if(editing.value){const {error:e}=await supabase.from(props.table).update(payload).eq(props.primaryKey??'id',editing.value[props.primaryKey??'id']);if(e)throw e}else{const {error:e}=await supabase.from(props.table).insert(payload);if(e)throw e} editing.value=null; form.value={}; await load() }catch(e:any){error.value=e.message??'Save failed'}finally{saving.value=false} }
async function remove(row:any){if(!confirm(`Delete this ${props.title.toLowerCase()} record?`))return; const {error:e}=await supabase.from(props.table).delete().eq(props.primaryKey??'id',row[props.primaryKey??'id']); if(e)error.value=e.message;else await load()}
function display(v:any){if(v===null||v===undefined||v==='')return '—'; if(typeof v==='boolean')return v?'Yes':'No'; if(typeof v==='object')return JSON.stringify(v);return String(v)}
onMounted(load); watch(()=>props.table,load)
</script>
<template>
<section class="page-wrap">
  <div class="page-heading"><div><h1>{{title}}</h1><p v-if="description">{{description}}</p></div><button v-if="canCreate!==false" class="btn primary" @click="start()">＋ Add {{title.replace(/s$/,'')}}</button></div>
  <div class="toolbar"><input v-model="query" class="control search" placeholder="Search records…"><button class="btn" @click="load">Refresh</button><span class="muted">{{filtered.length}} records</span></div>
  <p v-if="error" class="alert">{{error}}</p><div v-if="loading" class="empty">Loading…</div>
  <div v-else class="table-scroll"><table><thead><tr><th v-for="k in (columns??fields.map(f=>f.key))" :key="k">{{fields.find(f=>f.key===k)?.label??k}}</th><th>Actions</th></tr></thead><tbody><tr v-for="row in filtered" :key="row.id"><td v-for="k in (columns??fields.map(f=>f.key))" :key="k">{{display(row[k])}}</td><td class="actions"><button v-if="canEdit!==false" class="link" @click="start(row)">Edit</button><button v-if="canDelete!==false && auth.isAdmin" class="link danger" @click="remove(row)">Delete</button></td></tr><tr v-if="!filtered.length"><td :colspan="(columns??fields.map(f=>f.key)).length+1" class="empty">No records found.</td></tr></tbody></table></div>
  <div v-if="editing!==null || Object.keys(form).length" class="modal-backdrop" @click.self="editing=null;form={}"><form class="modal" @submit.prevent="save"><div class="page-heading"><h2>{{editing?'Edit':'New'}} {{title.replace(/s$/,'')}}</h2><button type="button" class="link" @click="editing=null;form={}">Close</button></div><label v-for="f in visibleFields" :key="f.key">{{f.label}}<select v-if="f.options" v-model="form[f.key]" class="control" :required="f.required"><option value="">Select…</option><option v-for="o in f.options" :key="o" :value="o">{{o}}</option></select><input v-else-if="f.type==='checkbox'" v-model="form[f.key]" type="checkbox"><textarea v-else-if="f.type==='textarea'" v-model="form[f.key]" class="control" rows="3"/><input v-else v-model="form[f.key]" class="control" :type="f.type??'text'" :required="f.required" :step="f.type==='number'?'0.01':undefined"></label><p v-if="error" class="alert">{{error}}</p><div class="modal-actions"><button type="button" class="btn" @click="editing=null;form={}">Cancel</button><button class="btn primary" :disabled="saving">{{saving?'Saving…':'Save record'}}</button></div></form></div>
</section>
</template>
