<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const fullName = ref('')
const phone = ref('')
const avatarUrl = ref('')
const smsEnabled = ref(false)
const email = ref('')
const password = ref('')
const confirm = ref('')
const profileMessage = ref('')
const profileError = ref('')
const passwordMessage = ref('')
const passwordError = ref('')
const savingProfile = ref(false)
const savingPassword = ref(false)
const browserPermission = ref<NotificationPermission>(typeof Notification === 'undefined' ? 'default' : Notification.permission)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  email.value = user.email || ''
  fullName.value = String(user.user_metadata?.full_name || user.user_metadata?.name || auth.profile?.full_name || '')
  phone.value = String(user.user_metadata?.phone || auth.profile?.phone || '')
  avatarUrl.value = String(user.user_metadata?.avatar_url || '')
  smsEnabled.value = Boolean(user.user_metadata?.sms_notifications_enabled)
})
async function saveProfile() {
  profileMessage.value = ''; profileError.value = ''
  if (smsEnabled.value && !phone.value.trim()) { profileError.value = 'Add a phone number before enabling SMS updates.'; return }
  savingProfile.value = true
  try {
    const { error } = await supabase.auth.updateUser({ data: {
      full_name: fullName.value.trim(),
      phone: phone.value.trim(),
      avatar_url: avatarUrl.value.trim(),
      sms_notifications_enabled: smsEnabled.value,
    } })
    if (error) throw error
    await auth.loadProfile()
    profileMessage.value = 'Your profile and notification preferences have been saved.'
  } catch (e: any) { profileError.value = e.message || 'Could not save your profile.' }
  finally { savingProfile.value = false }
}
async function changePassword() {
  passwordMessage.value = ''; passwordError.value = ''
  if (password.value.length < 10) { passwordError.value = 'Use at least 10 characters.'; return }
  if (password.value !== confirm.value) { passwordError.value = 'Passwords do not match.'; return }
  savingPassword.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    passwordMessage.value = 'Password changed successfully.'
    password.value = ''; confirm.value = ''
  } catch (e: any) { passwordError.value = e.message }
  finally { savingPassword.value = false }
}
async function enableBrowserNotifications() {
  if (typeof Notification === 'undefined') return
  browserPermission.value = await Notification.requestPermission()
}
</script>

<template>
  <section class="account-page">
    <header class="page-heading">
      <div><h1>My profile</h1><p>Manage your personal details, security and notification preferences.</p></div>
      <span class="account-role-pill">{{ String(auth.profile?.role || 'team member').replace('_',' ') }}</span>
    </header>

    <div class="account-grid">
      <div class="panel account-profile-panel">
        <div class="account-section-title"><span class="account-section-icon">◉</span><div><h2>Profile information</h2><p>Keep your contact details up to date.</p></div></div>
        <div class="profile-preview"><div class="profile-avatar">{{ (fullName || email || 'U').slice(0,1).toUpperCase() }}</div><div><strong>{{ fullName || 'Complete your profile' }}</strong><small>{{ email }}</small></div></div>
        <form class="account-form" @submit.prevent="saveProfile">
          <label>Full name<input v-model="fullName" class="field" type="text" autocomplete="name" placeholder="Enter your full name" required></label>
          <label>Email address<input :value="email" class="field" type="email" readonly disabled></label>
          <label>Phone number<input v-model="phone" class="field" type="tel" autocomplete="tel" placeholder="+256 7XX XXX XXX"></label>
          <label>Profile photo URL <span class="optional-label">Optional</span><input v-model="avatarUrl" class="field" type="url" placeholder="https://..."></label>
          <div class="account-consent">
            <label class="consent-line"><input v-model="smsEnabled" type="checkbox"><span><strong>Receive SMS updates</strong><small>I agree to receive operational alerts and important shop updates by SMS on the phone number above. Message charges may apply.</small></span></label>
          </div>
          <p v-if="profileError" class="alert">{{ profileError }}</p><p v-if="profileMessage" class="success">{{ profileMessage }}</p>
          <button class="btn primary" :disabled="savingProfile">{{ savingProfile ? 'Saving profile…' : 'Save profile' }}</button>
        </form>
      </div>

      <div class="account-side-column">
        <div class="panel">
          <div class="account-section-title"><span class="account-section-icon">♧</span><div><h2>Notification settings</h2><p>Choose how this device can alert you.</p></div></div>
          <div class="account-notification-row"><div><strong>Browser notifications</strong><small>{{ browserPermission === 'granted' ? 'Enabled on this device' : browserPermission === 'denied' ? 'Blocked by browser settings' : 'Not enabled on this device' }}</small></div><button class="btn" :disabled="browserPermission !== 'default'" @click="enableBrowserNotifications">{{ browserPermission === 'granted' ? 'Enabled' : 'Enable' }}</button></div>
          <div class="account-notification-row"><div><strong>SMS notifications</strong><small>{{ smsEnabled ? 'You have opted in to SMS updates' : 'SMS updates are currently off' }}</small></div><span class="account-status">{{ smsEnabled ? 'Opted in' : 'Off' }}</span></div>
          <p class="account-footnote">SMS consent is saved with your profile. Actual SMS delivery requires the shop administrator to configure an SMS gateway.</p>
        </div>
        <div class="panel">
          <div class="account-section-title"><span class="account-section-icon">⌑</span><div><h2>Account security</h2><p>Change your sign-in password.</p></div></div>
          <form class="account-form" @submit.prevent="changePassword">
            <label>New password<input v-model="password" class="field" type="password" minlength="10" autocomplete="new-password" placeholder="At least 10 characters" required></label>
            <label>Confirm new password<input v-model="confirm" class="field" type="password" minlength="10" autocomplete="new-password" placeholder="Repeat your new password" required></label>
            <p v-if="passwordError" class="alert">{{ passwordError }}</p><p v-if="passwordMessage" class="success">{{ passwordMessage }}</p>
            <button class="btn primary" :disabled="savingPassword">{{ savingPassword ? 'Updating…' : 'Update password' }}</button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
