import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ug.co.grobaltech.hybridshop',
  appName: 'Hybrid Shop',
  webDir: 'apps/web/dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
}

export default config
