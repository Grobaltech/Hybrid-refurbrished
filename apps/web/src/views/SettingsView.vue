<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'

type Shop = { id:string; shop_name:string|null; phone:string|null; email:string|null; address:string|null; currency:string; timezone:string; receipt_footer:string|null; setup_completed:boolean }
type Definition = { id:string; setting_key:string; label:string; description:string|null; input_type:string; options:string[]; default_value:unknown; required:boolean }
type ShopSetting = { setting_id:string; setting_value:unknown }
const shop=ref<Shop|null>(null), definitions=ref<Definition[]>([]), values=ref<Record<string,any>>({})
const loading=ref(true), savingProfile=ref(false), savingSetting=ref(''), error=ref(''), success=ref('')
const setupReady=computed(()=>!!shop.value?.shop_name?.trim())
function valueFor(d:Definition){return values.value[d.id] ?? d.default_value ?? (d.input_type==='boolean'?false:'')}
async function load(){
 loading.value=true;error.value=''
 try{
  const [{data:shopData,error:shopError},{data:defData,error:defError}]=await Promise.all([
   supabase.from('shops').select('id,shop_name,phone,email,address,currency,timezone,receipt_footer,setup_completed').maybeSingle(),
   supabase.from('system_setting_definitions').select('id,setting_key,label,description,input_type,options,default_value,required').eq('enabled',true).order('sort_order').order('label')
  ])
  if(shopError)throw shopError;if(defError)throw defError
  shop.value=shopData as Shop|null
  definitions.value=(defData??[]).map((d:any)=>({...d,options:Array.isArray(d.options)?d.options.map(String):[]}))
  values.value={}
  for(const d of definitions.value) values.value[d.id]=d.default_value ?? (d.input_type==='boolean'?false:'')
  if(shopData){
   const {data:settingData,error:settingError}=await supabase.from('shop_settings').select('setting_id,setting_value').eq('shop_id',shopData.id)
   if(settingError)throw settingError
   for(const item of (settingData??[]) as ShopSetting[]) values.value[item.setting_id]=item.setting_value
  }
 }catch(e:any){error.value=e.message??'Unable to load shop settings'}finally{loading.value=false}
}
async function saveProfile(){
 if(!shop.value)return
 savingProfile.value=true;error.value='';success.value=''
 try{
  const payload={shop_name:shop.value.shop_name?.trim()||null,phone:shop.value.phone?.trim()||null,email:shop.value.email?.trim()||null,address:shop.value.address?.trim()||null,currency:shop.value.currency,timezone:shop.value.timezone,receipt_footer:shop.value.receipt_footer?.trim()||null,setup_completed:!!shop.value.shop_name?.trim(),updated_at:new Date().toISOString()}
  const {error:e}=await supabase.from('shops').update(payload).eq('id',shop.value.id);if(e)throw e
  shop.value.setup_completed=payload.setup_completed;success.value='Shop details saved successfully.'
 }catch(e:any){error.value=e.message??'Unable to save shop details'}finally{savingProfile.value=false}
}
async function saveSetting(d:Definition){
 if(!shop.value)return
 savingSetting.value=d.id;error.value='';success.value=''
 try{
  let raw=valueFor(d)
  if(d.required && (raw==='' || raw===null || raw===undefined)) throw new Error(d.label+' is required.')
  let val:unknown=raw
  if(d.input_type==='number' && raw!=='' && raw!==null) val=Number(raw)
  if(d.input_type==='boolean') val=Boolean(raw)
  const {error:e}=await supabase.from('shop_settings').upsert({shop_id:shop.value.id,setting_id:d.id,setting_value:val,updated_by:(await supabase.auth.getUser()).data.user?.id??null,updated_at:new Date().toISOString()},{onConflict:'shop_id,setting_id'})
  if(e)throw e
  values.value[d.id]=val;success.value=d.label+' saved.'
 }catch(e:any){error.value=e.message??'Unable to save setting'}finally{savingSetting.value=''}
}
onMounted(load)
</script>
<template>
<section class="space-y-6">
 <header><p class="text-sm font-semibold uppercase tracking-wide text-indigo-600">SHOP MANAGEMENT</p><h1 class="mt-1 text-3xl font-bold text-slate-900">Shop settings</h1><p class="mt-2 text-sm text-slate-500">Set up your shop details and choose how your shop operates. Your changes apply only to this shop.</p></header>
 <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{error}}</p><p v-if="success" class="rounded-lg bg-green-50 p-3 text-sm text-green-700">{{success}}</p>
 <div v-if="loading" class="panel p-8 text-center text-slate-500">Loading your shop settings…</div>
 <template v-else-if="shop">
  <form class="panel space-y-5 p-5" @submit.prevent="saveProfile">
   <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-xl font-semibold">Shop information</h2><p class="mt-1 text-sm text-slate-500">Start by entering the details customers will see on receipts and shop records.</p></div><span class="rounded-full px-3 py-1 text-xs font-semibold" :class="shop.setup_completed?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'">{{shop.setup_completed?'Setup complete':'Setup not complete'}}</span></div>
   <div class="grid gap-4 md:grid-cols-2">
    <label class="text-sm font-medium text-slate-700">Shop name *<input v-model="shop.shop_name" class="field mt-1" required placeholder="Enter your shop name"></label>
    <label class="text-sm font-medium text-slate-700">Shop phone number<input v-model="shop.phone" class="field mt-1" placeholder="e.g. 07xx xxx xxx"></label>
    <label class="text-sm font-medium text-slate-700">Shop email address<input v-model="shop.email" type="email" class="field mt-1" placeholder="shop@example.com"></label>
    <label class="text-sm font-medium text-slate-700">Shop location / address<input v-model="shop.address" class="field mt-1" placeholder="Enter the shop location"></label>
    <label class="text-sm font-medium text-slate-700">Currency<select v-model="shop.currency" class="field mt-1"><option value="UGX">Ugandan Shilling (UGX)</option><option value="USD">US Dollar (USD)</option><option value="KES">Kenyan Shilling (KES)</option><option value="TZS">Tanzanian Shilling (TZS)</option></select></label>
    <label class="text-sm font-medium text-slate-700">Time zone<select v-model="shop.timezone" class="field mt-1"><option value="Africa/Kampala">East Africa Time — Kampala</option><option value="Africa/Nairobi">East Africa Time — Nairobi</option><option value="Africa/Dar_es_Salaam">East Africa Time — Dar es Salaam</option><option value="UTC">UTC</option></select></label>
    <label class="text-sm font-medium text-slate-700 md:col-span-2">Receipt footer message<textarea v-model="shop.receipt_footer" class="field mt-1" rows="2" placeholder="Thank you for shopping with us!"></textarea></label>
   </div>
   <div class="flex justify-end"><button class="btn btn-primary" :disabled="savingProfile">{{savingProfile?'Saving…':'Save shop information'}}</button></div>
  </form>
  <div class="panel space-y-4 p-5">
   <div><h2 class="text-xl font-semibold">Other shop preferences</h2><p class="mt-1 text-sm text-slate-500">These options are provided by your system administrator. Contact them if you need an additional setting.</p></div>
   <div v-if="!definitions.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">There are no additional settings available yet.</div>
   <div v-for="d in definitions" :key="d.id" class="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
    <div><label class="text-sm font-semibold text-slate-800">{{d.label}}{{d.required?' *':''}}</label><p v-if="d.description" class="mt-1 text-xs text-slate-500">{{d.description}}</p></div>
    <div>
     <input v-if="['text','email','phone','url','number'].includes(d.input_type)" v-model="values[d.id]" :type="d.input_type==='phone'?'tel':d.input_type" class="field" :required="d.required" :placeholder="'Enter '+d.label.toLowerCase()">
     <textarea v-else-if="d.input_type==='textarea'" v-model="values[d.id]" class="field" rows="2" :required="d.required"></textarea>
     <select v-else-if="d.input_type==='select'" v-model="values[d.id]" class="field" :required="d.required"><option value="">Choose an option</option><option v-for="option in d.options" :key="option" :value="option">{{option}}</option></select>
     <label v-else-if="d.input_type==='boolean'" class="flex items-center gap-2 rounded-lg border p-3 text-sm"><input v-model="values[d.id]" type="checkbox" class="h-4 w-4"> Enable {{d.label.toLowerCase()}}</label>
    </div>
    <button class="btn btn-muted" :disabled="savingSetting===d.id" @click="saveSetting(d)">{{savingSetting===d.id?'Saving…':'Save'}}</button>
   </div>
  </div>
 </template>
 <div v-else class="panel p-6 text-sm text-red-700">Your shop workspace has not been assigned. Please contact the System Super Admin.</div>
</section>
</template>