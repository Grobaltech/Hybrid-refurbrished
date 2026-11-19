<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const showPassword = ref(false)

async function login() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })
    if (signInError) throw signInError
    await router.replace('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'We could not sign you in. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-glow login-glow-one" aria-hidden="true"></div>
    <div class="login-glow login-glow-two" aria-hidden="true"></div>

    <section class="login-showcase" aria-label="Hybrid Shop">
      <div class="showcase-top">
        <div class="hybrid-mark"><span>H</span><i></i></div>
        <div class="brand-copy">
          <strong>HYBRID</strong>
          <span>SHOP MANAGEMENT</span>
        </div>
      </div>

      <div class="showcase-message">
        <span class="eyebrow"><span class="eyebrow-dot"></span> YOUR BUSINESS, IN SYNC</span>
        <h1>Run your shop.<br /><em>Own every detail.</em></h1>
        <p>A clearer view of your sales, stock and team — all in one place.</p>

        <div class="showcase-visual" aria-hidden="true">
          <div class="visual-orbit orbit-one"></div>
          <div class="visual-orbit orbit-two"></div>
          <div class="visual-core">
            <div class="core-symbol">H</div>
            <span>HYBRID</span>
            <small>CONNECTED OPERATIONS</small>
          </div>
          <div class="float-card float-stock"><span class="float-icon">▦</span><div><b>Stock control</b><small>Stay organised</small></div><span class="float-check">✓</span></div>
          <div class="float-card float-sales"><span class="float-icon">↗</span><div><b>Sales insights</b><small>Know your numbers</small></div><span class="float-check">✓</span></div>
          <div class="visual-spark spark-one"></div>
          <div class="visual-spark spark-two"></div>
        </div>
      </div>

      <div class="showcase-footer">
        <span>SMARTER SHOP MANAGEMENT</span>
        <span class="footer-line"></span>
        <span>BUILT FOR BUSINESS</span>
      </div>
    </section>

    <section class="login-side">
      <div class="mobile-brand">
        <div class="hybrid-mark"><span>H</span><i></i></div>
        <div class="brand-copy"><strong>HYBRID</strong><span>SHOP MANAGEMENT</span></div>
      </div>

      <div class="login-card">
        <div class="welcome-icon"><span>✦</span></div>
        <p class="welcome-kicker">WELCOME BACK</p>
        <h2>Good to see you.</h2>
        <p class="login-intro">Sign in to continue to your workspace.</p>

        <form @submit.prevent="login">
          <div v-if="error" class="login-error" role="alert">
            <span class="error-symbol">!</span>
            <span>{{ error }}</span>
          </div>

          <label class="login-label" for="login-email">Email address</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2.5"></rect><path d="m4.5 7 7.5 6 7.5-6"></path></svg>
            <input id="login-email" v-model="email" type="email" placeholder="you@company.com" required autocomplete="username" />
          </div>

          <div class="password-heading">
            <label class="login-label" for="login-password">Password</label>
          </div>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><path d="M12 14v2"></path></svg>
            <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" required autocomplete="current-password" />
            <button class="password-toggle" type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
              {{ showPassword ? 'HIDE' : 'SHOW' }}
            </button>
          </div>

          <button class="login-submit" type="submit" :disabled="busy">
            <span>{{ busy ? 'Signing you in…' : 'Sign in to Hybrid' }}</span>
            <span class="submit-arrow" aria-hidden="true">→</span>
          </button>
        </form>

        <div class="login-security">
          <span class="security-icon">▣</span>
          <span>Secure access for authorised team members</span>
        </div>
      </div>

      <div class="side-bottom">
        <span>© {{ new Date().getFullYear() }} Hybrid Shop</span>
        <span class="side-bottom-dot"></span>
        <span>All rights reserved</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page{min-height:100vh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr);position:relative;overflow:hidden;background:#f7f8fc;color:#18233b}
.login-showcase{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:space-between;min-height:100vh;padding:42px clamp(32px,6vw,88px);overflow:hidden;background:radial-gradient(ellipse at 75% 68%,rgba(72,103,224,.34),transparent 35%),radial-gradient(ellipse at 10% 10%,rgba(31,176,190,.16),transparent 35%),linear-gradient(145deg,#101b36 0%,#14254a 55%,#172e5a 100%);color:white}
.login-showcase:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.12;background-image:linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(130deg,black,transparent 78%)}
.login-glow{position:absolute;pointer-events:none;border-radius:50%;filter:blur(2px)}
.login-glow-one{width:380px;height:380px;right:-170px;top:-170px;background:#687cf0;opacity:.10}
.login-glow-two{width:300px;height:300px;left:35%;bottom:-210px;background:#24b9b6;opacity:.09}
.showcase-top,.brand-copy{display:flex}.showcase-top{align-items:center;gap:13px;position:relative;z-index:1}
.hybrid-mark{width:46px;height:46px;display:grid;place-items:center;position:relative;flex:none;border-radius:15px;background:linear-gradient(145deg,#7789ff,#465bd2);box-shadow:0 8px 24px #080f2c55;color:white}
.hybrid-mark span{font-size:25px;font-weight:900;letter-spacing:-2px}.hybrid-mark i{position:absolute;width:8px;height:8px;border-radius:50%;background:#67e2d1;right:5px;top:5px;border:2px solid #6376e9}
.brand-copy{flex-direction:column;gap:3px}.brand-copy strong{font-size:17px;letter-spacing:.17em;font-weight:850}.brand-copy span{font-size:9px;letter-spacing:.2em;color:#aebbd7;font-weight:700}
.showcase-message{position:relative;z-index:1;margin:auto 0;padding:65px 0 35px;max-width:650px}
.eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:10px;letter-spacing:.2em;font-weight:800;color:#b8c7e8}
.eyebrow-dot{width:7px;height:7px;border-radius:50%;background:#63dfcf;box-shadow:0 0 14px #63dfcf}
.showcase-message h1{font-size:clamp(42px,5vw,68px);line-height:1.06;letter-spacing:-.055em;margin:24px 0 18px;font-weight:850}
.showcase-message h1 em{font-style:normal;color:#8fa2ff}
.showcase-message>p{max-width:390px;color:#bdc9df;font-size:15px;line-height:1.8;margin:0}
.showcase-visual{height:275px;max-width:530px;position:relative;margin-top:18px}
.visual-orbit{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);border:1px solid #91a5ef2b;border-radius:50%;width:245px;height:245px}
.orbit-two{width:330px;height:190px;transform:translate(-50%,-50%) rotate(-27deg);border-color:#63dfcf35}
.visual-core{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:144px;height:144px;border-radius:42px;background:linear-gradient(145deg,#263d75,#1a2a53);border:1px solid #a8b8ff44;box-shadow:0 20px 65px #060d255e,inset 0 1px #ffffff24;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px}
.core-symbol{font-size:46px;line-height:1;font-weight:900;letter-spacing:-5px;color:#aab8ff;text-shadow:0 0 28px #7b8fff66}
.visual-core>span{font-size:10px;letter-spacing:.22em;font-weight:800}.visual-core small{font-size:6px;letter-spacing:.16em;color:#9aabd0}
.float-card{position:absolute;display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #ffffff24;border-radius:13px;background:#ffffff12;backdrop-filter:blur(12px);box-shadow:0 12px 35px #08132d40}
.float-stock{top:27px;left:2%}.float-sales{right:0;bottom:28px}
.float-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:#7288ff30;color:#b8c5ff;font-size:17px}
.float-card div{display:grid;gap:4px}.float-card b{font-size:10px}.float-card small{font-size:9px;color:#b7c5df}.float-check{font-size:12px;color:#65e0c6;margin-left:5px}
.visual-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#6ce2d1;box-shadow:0 0 15px #6ce2d1}.spark-one{top:45px;right:23%}.spark-two{bottom:25px;left:20%;width:4px;height:4px;background:#a5b3ff}
.showcase-footer{display:flex;align-items:center;gap:13px;color:#91a2c4;font-size:8px;font-weight:800;letter-spacing:.17em;position:relative;z-index:1}.footer-line{height:1px;width:42px;background:#60749d}
.login-side{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:54px clamp(26px,5vw,76px);background:linear-gradient(145deg,#fbfcff,#f2f4fa)}
.login-card{width:100%;max-width:410px;margin:auto}
.welcome-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#e9edff;color:#5268d9;font-size:21px;margin-bottom:26px}
.welcome-kicker{font-size:10px;letter-spacing:.2em;font-weight:850;color:#6576d8;margin:0 0 9px}
.login-card h2{font-size:34px;letter-spacing:-.045em;line-height:1.15;color:#17233c;margin:0;font-weight:850}
.login-intro{font-size:13px;color:#7c879c;margin:11px 0 32px}
.login-label{display:block;font-size:11px;font-weight:800;color:#34415c;margin:0 0 9px}
.input-wrap{height:53px;display:flex;align-items:center;gap:12px;padding:0 15px;border:1px solid #e0e5ef;border-radius:12px;background:#fff;box-shadow:0 2px 5px #1c2b4a05;transition:border-color .2s,box-shadow .2s;margin-bottom:22px}
.input-wrap:focus-within{border-color:#7485e8;box-shadow:0 0 0 4px #7183e81a}
.input-wrap svg{width:18px;height:18px;flex:none;fill:none;stroke:#929db1;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.input-wrap input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#1b2942;font-size:13px}
.input-wrap input::placeholder{color:#a8b0bf}
.password-heading{display:flex;align-items:center;justify-content:space-between}
.password-toggle{border:0;background:transparent;color:#6576d8;font-size:9px;font-weight:850;letter-spacing:.1em;padding:6px 0}
.login-submit{width:100%;height:54px;border:0;border-radius:12px;display:flex;align-items:center;justify-content:space-between;padding:0 18px 0 21px;margin-top:8px;background:linear-gradient(105deg,#5268d9,#4659c2);color:white;font-size:13px;font-weight:800;box-shadow:0 10px 22px #5268d936;transition:transform .2s,box-shadow .2s,opacity .2s}
.login-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 28px #5268d94a}.login-submit:disabled{opacity:.65;cursor:wait}
.submit-arrow{font-size:20px;font-weight:400}
.login-error{display:flex;align-items:flex-start;gap:9px;background:#fff1f0;border:1px solid #ffd6d2;color:#b42318;border-radius:10px;padding:11px 12px;margin:-8px 0 20px;font-size:11px;line-height:1.5;overflow-wrap:anywhere}
.error-symbol{width:17px;height:17px;display:grid;place-items:center;border-radius:50%;background:#ffe0dd;font-weight:900;flex:none}
.login-security{display:flex;align-items:center;justify-content:center;gap:8px;color:#8994a7;font-size:10px;margin-top:27px}
.security-icon{font-size:13px;color:#6e80d9}
.side-bottom{position:absolute;bottom:25px;left:20px;right:20px;display:flex;align-items:center;justify-content:center;gap:10px;color:#a0a9b8;font-size:9px}
.side-bottom-dot{width:3px;height:3px;border-radius:50%;background:#b5bdca}
.mobile-brand{display:none}
@media(max-width:900px){.login-page{grid-template-columns:minmax(0,.95fr) minmax(390px,1.05fr)}.login-showcase{padding:32px}.showcase-message h1{font-size:48px}.showcase-visual{transform:scale(.9);transform-origin:left center}}
@media(max-width:680px){.login-page{display:block;min-height:100svh;background:radial-gradient(ellipse at 50% 0%,#e9edff 0%,#f7f8fc 48%)}.login-showcase{display:none}.login-side{min-height:100svh;padding:34px 24px 72px;background:transparent;display:flex;flex-direction:column;justify-content:center}.mobile-brand{display:flex;align-items:center;gap:11px;margin:0 auto 44px}.mobile-brand .hybrid-mark{width:41px;height:41px;border-radius:13px}.mobile-brand .brand-copy strong{color:#1b2945}.mobile-brand .brand-copy span{color:#8994aa}.login-card{max-width:430px}.welcome-icon{margin-bottom:22px}.login-card h2{font-size:31px}.login-intro{margin-bottom:29px}.side-bottom{bottom:24px}.login-security{font-size:9px}}
@media(prefers-reduced-motion:reduce){.login-submit,.input-wrap{transition:none}}
</style>
