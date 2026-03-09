import { createApp } from 'vue'

import App from '@/renderer/App.vue'
import router from '@/renderer/router'
import vuetify from '@/renderer/plugins/vuetify'
import i18n from '@/renderer/plugins/i18n'
import pinia from '@/renderer/plugins/pinia'
import '../types/mainApi.d.ts'

const levels = ['log', 'warn', 'error', 'info'] as const
levels.forEach((level) => {
  console[level] = (...args: any[]) => {
    const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')
    window.mainApi?.sendToLog(level, message)
  }
})

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  // Extract message and stack trace
  const errorMessage = err instanceof Error ? err.message : String(err)
  const stackTrace = err instanceof Error ? err.stack : 'No stack trace available'

  // Log it using your intercepted console.error (which goes to electron-log)
  console.error(`[Error] ${errorMessage}\nInfo: ${info}\nStack: ${stackTrace}`)
}

app.use(vuetify).use(i18n).use(router).use(pinia)

app.mount('#app')
