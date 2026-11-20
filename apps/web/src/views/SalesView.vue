<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
const router = useRouter()
const auth = useAuth()
const products = ref<any[]>([]), customers = ref<any[]>([]), barcodeInput = ref<HTMLInputElement | null>(null)
const videoPreview = ref<HTMLVideoElement | null>(null)
const cameraActive = ref(false), cameraBusy = ref(false), cameraMessage = ref('')
const codeReader = new BrowserMultiFormatReader()
let scannerControls: { stop: () => void } | null = null
const cart = ref<{product_id:string;name:string;quantity:number;unit_price:number;stock:number}[]>([])
const customer = ref<string | null>(null), showCustomer = ref(false), newCustomerName = ref(''), newCustomerPhone = ref('')
const payment = ref('cash'), taxRate = ref(0), discount = ref(0), notes = ref(''), search = ref(''), busy = ref(false), error = ref('')
const subtotal = computed(() => cart.value.reduce((sum, item) => sum + item.quantity * item.unit_price, 0))
const taxAmount = computed(() => subtotal.value * Number(taxRate.value || 0) / 100)
const total = computed(() => Math.max(0, subtotal.value - Number(discount.value || 0) + taxAmount.value))
const matches = computed(() => products.value.filter(p => (p.name + ' ' + p.sku + ' ' + (p.barcode ?? '')).toLowerCase().includes(search.value.toLowerCase())))
async function load() {
  const [p, c] = await Promise.all([
    supabase.from('products').select('id,sku,name,barcode,selling_price,quantity,active').eq('active', true).order('name'),
    supabase.from('customers').select('id,name,phone').order('name'),
  ])
  if (p.error) error.value = p.error.message
  else products.value = (p.data ?? []).filter(x => Number(x.quantity) > 0)
  if (c.error) error.value = c.error.message
  else customers.value = c.data ?? []
}
async function add(p: any) {
  const item = cart.value.find(x => x.product_id === p.id)
  if (item) { if (item.quantity < Number(p.quantity)) item.quantity++ }
  else cart.value.push({ product_id: p.id, name: p.name, quantity: 1, unit_price: Number(p.selling_price), stock: Number(p.quantity) })
  await nextTick(); barcodeInput.value?.focus()
}
async function processBarcode(codeValue: string) {
  const code = codeValue.trim()
  if (!code) return
  const product = products.value.find(p => String(p.barcode ?? '').trim() === code || String(p.sku ?? '').trim().toLowerCase() === code.toLowerCase())
  if (!product) { error.value = `No active product found for barcode: ${code}`; return }
  if (Number(product.quantity) <= 0) { error.value = `${product.name} is out of stock`; return }
  error.value = ''; await add(product)
}
async function scanBarcode() {
  const code = String(barcodeInput.value?.value ?? '').trim()
  if (!code) return
  await processBarcode(code)
  if (barcodeInput.value) barcodeInput.value.value = ''
  await nextTick(); barcodeInput.value?.focus()
}
async function startCameraScan() {
  if (cameraBusy.value || cameraActive.value) return
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.value = 'Camera access is unavailable. Open this page over HTTPS in a supported browser, or use a handheld scanner.'
    return
  }
  cameraBusy.value = true; cameraMessage.value = 'Requesting camera access…'; error.value = ''
  try {
    await nextTick()
    if (!videoPreview.value) throw new Error('Camera preview could not be opened.')
    scannerControls = await codeReader.decodeFromConstraints(
      { audio: false, video: { facingMode: { ideal: 'environment' } } },
      videoPreview.value,
      async (result) => {
        if (!result || !cameraActive.value) return
        const code = result.getText()
        stopCameraScan()
        cameraMessage.value = `Scanned ${code}. The item has been added if it matches a product barcode.`
        await processBarcode(code)
        await nextTick(); barcodeInput.value?.focus()
      }
    )
    cameraActive.value = true
    cameraMessage.value = 'Camera is ready. Point it at a product barcode.'
  } catch (e: any) {
    stopCameraScan()
    cameraMessage.value = e?.name === 'NotAllowedError'
      ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
      : (e?.message || 'Could not start the camera. Check camera permission and try again.')
  } finally { cameraBusy.value = false }
}
function stopCameraScan() {
  scannerControls?.stop()
  scannerControls = null
  cameraActive.value = false
}
async function createCustomer() {
  const name = newCustomerName.value.trim()
  if (!name) return
  const { data, error: e } = await supabase.from('customers').insert({ name, phone: newCustomerPhone.value || null }).select('id,name,phone').single()
  if (e) { error.value = e.message; return }
  customers.value = [...customers.value, data]; customer.value = data.id
  newCustomerName.value = ''; newCustomerPhone.value = ''; showCustomer.value = false
}
async function checkout() {
  if (!cart.value.length) return
  if (payment.value === 'credit' && !customer.value) { error.value = 'Select a customer for a credit sale.'; return }
  busy.value = true; error.value = ''
  try {
    const saleNumber = 'SALE-' + Date.now().toString()
    const { data, error: e } = await supabase.rpc('create_sale', {
      p_sale_number: saleNumber,
      p_customer_id: customer.value,
      p_items: cart.value.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
      p_amount_paid: payment.value === 'credit' ? 0 : total.value,
      p_payment_method: payment.value,
      p_discount: Number(discount.value || 0),
      p_tax: taxAmount.value,
      p_notes: notes.value || null,
    })
    if (e) throw e
    if (!data?.sale_id) throw new Error(data?.message || 'Sale saved but no receipt identifier was returned.')
    cart.value = []; notes.value = ''
    await router.push('/receipts/' + data.sale_id)
  } catch (e: any) { error.value = e.message ?? 'Could not complete sale' } finally { busy.value = false }
}
onMounted(async () => { await load(); await nextTick(); barcodeInput.value?.focus() })
onBeforeUnmount(() => stopCameraScan())
</script>
<template><section class="page-wrap"><div class="page-heading"><div><h1>Point of Sale</h1><p>Scan barcodes using your phone camera or a USB/Bluetooth scanner, or search products to build a sale.</p></div></div>
<p v-if="error" class="alert">{{ error }}</p><div class="sales-grid">
<div class="panel"><h2>Scan or find products</h2>
<div class="camera-scan"><div class="camera-actions"><button type="button" class="btn primary" :disabled="cameraBusy || cameraActive" @click="startCameraScan">{{ cameraBusy ? 'Opening camera…' : cameraActive ? 'Camera active' : 'Scan with phone camera' }}</button><button v-if="cameraActive" type="button" class="btn" @click="stopCameraScan">Stop camera</button></div><video v-show="cameraActive" ref="videoPreview" class="barcode-video" autoplay muted playsinline></video><p v-if="cameraMessage" class="muted">{{ cameraMessage }}</p><p v-else class="muted">On a phone, use the rear camera to scan product barcodes.</p></div>
<label>Handheld barcode scanner<input ref="barcodeInput" class="control" placeholder="Scan barcode then press Enter" autocomplete="off" @keydown.enter.prevent="scanBarcode"></label><p class="muted">USB/Bluetooth scanners work like a keyboard and usually send Enter automatically.</p><input v-model="search" class="control" placeholder="Or search product, SKU or barcode"><div class="product-pick"><button v-for="p in matches" :key="p.id" class="product-option" @click="add(p)"><b>{{ p.name }}</b><span>{{ p.sku }} · UGX {{ Number(p.selling_price).toLocaleString() }}</span><small>{{ p.quantity }} in stock</small></button></div></div>
<div class="panel"><h2>Sale cart</h2><div v-if="!cart.length" class="empty">No items added yet.</div>
<div v-for="item in cart" :key="item.product_id" class="cart-line"><div><b>{{ item.name }}</b><small>UGX {{ item.unit_price.toLocaleString() }} each</small></div><input v-model.number="item.quantity" type="number" min="1" :max="item.stock" class="control qty"><b>UGX {{ (item.quantity * item.unit_price).toLocaleString() }}</b><button class="link danger" @click="cart = cart.filter(x => x.product_id !== item.product_id)">×</button></div>
<label>Customer<select v-model="customer" class="control"><option :value="null">Walk-in customer</option><option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} {{ c.phone ? '· ' + c.phone : '' }}</option></select><button v-if="auth.profile?.role !== 'cashier'" type="button" class="link" @click="showCustomer = true">＋ Add new customer</button></label>
<label>Payment method<select v-model="payment" class="control"><option value="cash">Cash</option><option value="credit">Credit</option><option value="mobile_money">Mobile money</option><option value="bank">Bank</option></select></label>
<label>Discount (UGX)<input v-model.number="discount" type="number" min="0" :max="subtotal" class="control"></label><label>Tax rate (%)<input v-model.number="taxRate" type="number" min="0" max="100" class="control"></label><label>Notes<textarea v-model="notes" class="control" rows="2"/></label>
<div class="totals"><div>Subtotal <b>UGX {{ subtotal.toLocaleString() }}</b></div><div>Discount <b>UGX {{ Number(discount).toLocaleString() }}</b></div><div>Tax <b>UGX {{ taxAmount.toLocaleString() }}</b></div><div class="grand">Total <b>UGX {{ total.toLocaleString() }}</b></div></div>
<button class="btn primary full" :disabled="busy || !cart.length || cart.some(x => x.quantity < 1 || x.quantity > x.stock) || discount < 0 || discount > subtotal" @click="checkout">{{ busy ? 'Processing…' : 'Complete sale' }}</button></div></div>
<div v-if="showCustomer" class="modal-backdrop" @click.self="showCustomer = false"><form class="modal" @submit.prevent="createCustomer"><h2>New customer</h2><label>Name<input v-model="newCustomerName" class="control" required></label><label>Phone<input v-model="newCustomerPhone" class="control"></label><div class="modal-actions"><button type="button" class="btn" @click="showCustomer = false">Cancel</button><button class="btn primary">Save customer</button></div></form></div>
</section></template>
<style scoped>
.camera-scan{margin:14px 0 18px;padding:14px;border:1px solid #dbe3ef;border-radius:12px;background:#f8fafc}
.camera-actions{display:flex;gap:10px;flex-wrap:wrap}
.barcode-video{display:block;width:100%;max-height:300px;margin-top:12px;border-radius:10px;background:#0f172a;object-fit:cover}
</style>