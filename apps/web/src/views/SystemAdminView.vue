<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const email = ref('')
const shopDirectorExists = ref(false)
const checking = ref(true)
const initials = computed(() => (email.value.split('@')[0] || 'SA').slice(0, 2).toUpperCase())

onMounted(async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    email.value = user?.email ?? ''
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role,disabled').eq('id', user?.id ?? '').maybeSingle()
    if (profileError) throw profileError
    if (!profile || profile.role !== 'super_admin' || profile.disabled) {
      await supabase.auth.signOut()
      await router.replace('/login')
      return
    }

    shopDirectorExists.value = false
  } catch (cause: unknown) {
    loadError.value = cause instanceof Error ? cause.message : 'Could not load system information.'
  } finally {
    loading.value = false
    checking.value = false
  }
})

async function signOut() {
  await supabase.auth.signOut()
  await router.replace('/login')
}
</script>

<template>
  <main class="system-admin">
    <aside class="system-sidebar">
      <a class="system-brand" href="/system-admin">
        <span class="system-mark">H</span>
        <span><b>HYBRID</b><small>SYSTEM CONTROL</small></span>
      </a>
      <div class="sidebar-caption">CONTROL CENTRE</div>
      <a class="system-nav active" href="/system-admin"><span>◫</span> Overview</a>
      <div class="sidebar-caption spaced">MANAGEMENT</div>
      <div class="system-nav muted"><span>▣</span> Shop setup <small>Coming next</small></div>
      <div class="system-nav muted"><span>♙</span> System accounts</div>
      <div class="system-nav muted"><span>⌘</span> Security & access</div>
      <div class="system-nav muted"><span>◷</span> Activity logs</div>
      <div class="system-sidebar-bottom">
        <div class="super-profile"><span class="avatar">{{ initials }}</span><span><b>System Super Admin</b><small>{{ email }}</small></span></div>
        <button class="signout" @click="signOut">↪ <span>Sign out</span></button>
      </div>
    </aside>

    <section class="system-main">
      <header class="system-topbar">
        <div><span class="crumb">Hybrid /</span> System overview</div>
        <div class="top-admin"><span class="online-dot"></span> System administrator <span class="top-avatar">{{ initials }}</span></div>
      </header>

      <div class="system-content">
        <div class="welcome-row">
          <div>
            <div class="system-eyebrow">SYSTEM CONTROL CENTRE</div>
            <h1>Welcome to Hybrid.</h1>
            <p>Manage your shop environment, its administrator and system access from one place.</p>
          </div>
          <div class="date-chip">⌁ &nbsp; {{ new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}</div>
        </div>

        <div v-if="loadError" class="system-alert">{{ loadError }}</div>
        <div v-if="loading" class="system-loading">Loading your system overview…</div>

        <template v-else>
          <div class="status-banner">
            <div class="status-icon">✓</div>
            <div><b>System administrator account active</b><span>You are signed in with system-level access.</span></div>
            <span class="status-pill">ACTIVE</span>
          </div>

          <div class="overview-grid">
            <article class="overview-card primary-card">
              <div class="card-top"><span class="card-icon purple">▣</span><span class="card-label">REGISTERED STAFF PROFILES</span></div>
              <strong>Active</strong>
              <p>System administrator profile verified</p>
            </article>
            <article class="overview-card">
              <div class="card-top"><span class="card-icon teal">⌂</span><span class="card-label">SHOP ENVIRONMENT</span></div>
              <strong>1</strong>
              <p>Hybrid Shop workspace</p>
            </article>
            <article class="overview-card">
              <div class="card-top"><span class="card-icon amber">♙</span><span class="card-label">SHOP DIRECTOR</span></div>
              <strong class="status-text">{{ shopDirectorExists ? 'Registered' : 'Not created' }}</strong>
              <p>Primary operational administrator</p>
            </article>
          </div>

          <div class="section-heading"><div><h2>Get your shop ready</h2><p>Complete these steps to bring your Hybrid workspace online.</p></div><span class="progress-label">SETUP IN PROGRESS</span></div>
          <div class="setup-card">
            <div class="setup-step done">
              <span class="step-number">✓</span>
              <div><b>Register system super administrator</b><p>Your system-level account is active and verified.</p></div>
              <span class="step-state">COMPLETE</span>
            </div>
            <div class="setup-step current">
              <span class="step-number">2</span>
              <div><b>Create the Shop Director account</b><p>Give the shop director access to manage daily shop operations and staff.</p></div>
              <span class="step-state">NEXT STEP</span>
            </div>
            <div class="setup-step">
              <span class="step-number">3</span>
              <div><b>Configure shop profile</b><p>Set the shop name, contact details, currency and operating preferences.</p></div>
              <span class="step-state">PENDING</span>
            </div>
          </div>

          <div class="bottom-grid">
            <article class="info-panel">
              <div class="panel-heading"><span class="panel-icon">♙</span><div><h3>Shop Director account</h3><p>The next account to create</p></div></div>
              <p class="panel-copy">The Shop Director will manage the business workspace. This account will not have system super administrator privileges.</p>
              <button class="disabled-action" disabled>Create Shop Director account <span>→</span></button>
              <small class="action-note">Account creation will be enabled after the secure server-side provisioning function is connected.</small>
            </article>
            <article class="info-panel security-panel">
              <div class="panel-heading"><span class="panel-icon shield">◇</span><div><h3>Access boundaries</h3><p>Two separate levels of authority</p></div></div>
              <div class="access-line"><span class="access-dot system"></span><div><b>System Super Admin</b><small>System setup, director provisioning and system access</small></div></div>
              <div class="access-line"><span class="access-dot director"></span><div><b>Shop Director</b><small>Shop staff, products, stock, sales and business reports</small></div></div>
            </article>
          </div>
        </template>
        <footer class="system-footer">HYBRID SYSTEM CONTROL <span>•</span> Secure administration workspace</footer>
      </div>
    </section>
  </main>
</template>

<style scoped>
.system-admin{min-height:100vh;background:#f5f7fb;color:#19243b;display:grid;grid-template-columns:252px minmax(0,1fr);font-family:Inter,ui-sans-serif,system-ui,sans-serif}
.system-sidebar{background:#111d38;color:#fff;min-height:100vh;padding:25px 16px 18px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.system-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:white;padding:4px 9px 35px}.system-mark{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(140deg,#8394ff,#5266d5);font-size:24px;font-weight:900;box-shadow:0 8px 20px #080f2b66}.system-brand b{display:block;font-size:15px;letter-spacing:.18em}.system-brand small{display:block;color:#95a6c8;font-size:8px;letter-spacing:.2em;margin-top:4px;font-weight:700}
.sidebar-caption{font-size:9px;letter-spacing:.16em;color:#7183a8;font-weight:800;padding:0 12px 10px}.sidebar-caption.spaced{margin-top:27px}
.system-nav{display:flex;align-items:center;gap:12px;padding:12px;border-radius:9px;color:#c4cee2;text-decoration:none;font-size:12px;margin:2px 0}.system-nav span{font-size:16px;width:18px;text-align:center}.system-nav.active{background:#293b68;color:#fff;box-shadow:inset 3px 0 #8fa0ff}.system-nav.muted{color:#8d9dbb}.system-nav small{font-size:8px;margin-left:auto;color:#7485a6;text-transform:uppercase;letter-spacing:.06em}
.system-sidebar-bottom{margin-top:auto;border-top:1px solid #293858;padding:17px 5px 0}.super-profile{display:flex;align-items:center;gap:10px;min-width:0}.avatar,.top-avatar{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#334878;color:#dce4ff;font-size:11px;font-weight:800;flex:none}.super-profile b{display:block;font-size:10px}.super-profile small{display:block;font-size:9px;color:#93a3c1;margin-top:4px;overflow:hidden;text-overflow:ellipsis;max-width:155px}.signout{margin-top:17px;width:100%;padding:10px;border:0;border-radius:8px;text-align:left;color:#aebbd3;background:transparent;font-size:12px}.signout:hover{background:#243455;color:white}
.system-main{min-width:0}.system-topbar{height:67px;background:#fff;border-bottom:1px solid #e9edf4;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,4vw,55px);font-size:11px;color:#26334e}.crumb{color:#9aa5b8}.top-admin{display:flex;align-items:center;gap:9px;color:#6d7890;font-size:10px}.online-dot{width:7px;height:7px;border-radius:50%;background:#36bd91;box-shadow:0 0 0 3px #e1f7ef}.top-avatar{width:29px;height:29px;border-radius:9px;margin-left:5px;background:#e9edff;color:#5266d5}
.system-content{max-width:1440px;margin:auto;padding:38px clamp(20px,4vw,55px) 24px}.welcome-row{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:25px}.system-eyebrow{font-size:9px;font-weight:850;letter-spacing:.19em;color:#6577d7}.welcome-row h1{font-size:29px;letter-spacing:-.04em;margin:8px 0 7px;font-weight:850;color:#172440}.welcome-row p{margin:0;color:#7d899e;font-size:12px}.date-chip{border:1px solid #e4e9f1;background:#fff;color:#78849a;padding:9px 12px;border-radius:9px;font-size:10px;white-space:nowrap}
.status-banner{display:flex;align-items:center;gap:13px;padding:14px 17px;border:1px solid #d9f0e7;border-radius:12px;background:linear-gradient(100deg,#f0fbf6,#f8fdfb);margin-bottom:17px}.status-icon{width:29px;height:29px;display:grid;place-items:center;border-radius:9px;background:#d9f5e8;color:#15956c;font-weight:900}.status-banner b{display:block;font-size:11px;color:#24664f}.status-banner span:not(.status-pill){display:block;font-size:10px;color:#729487;margin-top:3px}.status-pill{margin-left:auto;font-size:8px;letter-spacing:.1em;font-weight:850;color:#16845f;background:#dff7ec;padding:6px 9px;border-radius:20px}
.overview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:30px}.overview-card{padding:18px 19px;background:#fff;border:1px solid #e8ecf3;border-radius:13px;box-shadow:0 4px 16px #1b2b4a05;min-width:0}.card-top{display:flex;align-items:center;gap:9px}.card-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;font-size:15px}.card-icon.purple{background:#eef0ff;color:#6475db}.card-icon.teal{background:#e7f8f5;color:#229b88}.card-icon.amber{background:#fff5e6;color:#c18a36}.card-label{font-size:8px;letter-spacing:.12em;color:#8a96aa;font-weight:850}.overview-card>strong{display:block;font-size:27px;letter-spacing:-.04em;margin:14px 0 3px;color:#1b2945}.overview-card>strong.status-text{font-size:19px;color:#c18a36;margin-top:18px}.overview-card>p{margin:0;color:#929caf;font-size:10px}
.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.section-heading h2{font-size:16px;margin:0 0 5px;letter-spacing:-.02em}.section-heading p{font-size:10px;color:#8995a8;margin:0}.progress-label{font-size:8px;font-weight:850;letter-spacing:.1em;color:#a77a35;background:#fff5e6;padding:7px 10px;border-radius:20px}
.setup-card{background:#fff;border:1px solid #e8ecf3;border-radius:13px;padding:4px 20px;margin-bottom:17px}.setup-step{display:flex;align-items:center;gap:13px;padding:17px 0;border-bottom:1px solid #f0f2f6}.setup-step:last-child{border-bottom:0}.step-number{width:27px;height:27px;flex:none;border:1px solid #e0e5ed;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:800;color:#9ba6b8}.setup-step.done .step-number{background:#e3f7ee;border-color:#e3f7ee;color:#1b9b70}.setup-step.current .step-number{background:#eef0ff;border-color:#dfe3ff;color:#596bd4}.setup-step b{font-size:11px;color:#26334e}.setup-step p{font-size:10px;color:#8c97a9;margin:4px 0 0}.step-state{margin-left:auto;font-size:8px;letter-spacing:.08em;font-weight:850;color:#9aa5b7;white-space:nowrap}.setup-step.done .step-state{color:#269b75}.setup-step.current .step-state{color:#6475d7}
.bottom-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.info-panel{background:#fff;border:1px solid #e8ecf3;border-radius:13px;padding:19px}.panel-heading{display:flex;align-items:center;gap:11px}.panel-icon{width:33px;height:33px;border-radius:10px;display:grid;place-items:center;background:#eef0ff;color:#6274d8;font-size:17px}.panel-icon.shield{background:#e8f7f3;color:#229b88}.panel-heading h3{font-size:12px;margin:0 0 4px}.panel-heading p{font-size:9px;color:#929caf;margin:0}.panel-copy{font-size:10px;line-height:1.7;color:#7e899c;margin:16px 0}.disabled-action{width:100%;display:flex;justify-content:space-between;align-items:center;padding:11px 13px;border:0;border-radius:9px;background:#e8ebf7;color:#7885bc;font-size:10px;font-weight:800;cursor:not-allowed}.disabled-action span{font-size:17px}.action-note{display:block;color:#a0a9b8;font-size:8px;line-height:1.5;margin-top:9px}.access-line{display:flex;align-items:flex-start;gap:10px;margin-top:19px}.access-dot{width:8px;height:8px;border-radius:50%;margin-top:3px;flex:none}.access-dot.system{background:#687be2;box-shadow:0 0 0 4px #eef0ff}.access-dot.director{background:#22a18a;box-shadow:0 0 0 4px #e7f8f5}.access-line b{display:block;font-size:10px}.access-line small{display:block;font-size:9px;color:#929caf;margin-top:4px;line-height:1.4}
.system-alert{background:#fff0ef;color:#b42318;padding:12px;border-radius:9px;font-size:11px;margin-bottom:15px;overflow-wrap:anywhere}.system-loading{padding:35px;text-align:center;color:#8b97aa;font-size:12px}.system-footer{display:flex;align-items:center;gap:8px;color:#a0a9b8;font-size:8px;letter-spacing:.1em;margin-top:28px}.system-footer span{color:#c1c8d3}
@media(max-width:1050px){.system-admin{grid-template-columns:220px minmax(0,1fr)}.system-sidebar{padding-left:12px;padding-right:12px}.overview-grid{gap:9px}.card-label{font-size:7px}}
@media(max-width:760px){.system-admin{display:block}.system-sidebar{position:relative;top:auto;height:auto;min-height:0;padding:14px 16px}.system-brand{padding:0 4px 13px}.system-sidebar>.sidebar-caption,.system-sidebar>.system-nav,.system-sidebar>.spaced{display:none}.system-sidebar-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:0;padding:12px 3px 0}.signout{width:auto;margin:0;padding:8px 10px}.system-topbar{height:53px;padding:0 18px}.system-content{padding:25px 17px}.welcome-row{align-items:flex-start;flex-direction:column}.welcome-row h1{font-size:25px}.date-chip{display:none}.overview-grid{grid-template-columns:1fr 1fr}.overview-card{padding:14px}.overview-card:last-child{grid-column:span 2}.bottom-grid{grid-template-columns:1fr}.setup-card{padding:2px 13px}.setup-step{gap:10px}.step-state{font-size:7px}.top-admin{font-size:0}.top-avatar{font-size:10px}}
@media(max-width:390px){.overview-grid{grid-template-columns:1fr}.overview-card:last-child{grid-column:auto}.step-state{display:none}}
</style>
