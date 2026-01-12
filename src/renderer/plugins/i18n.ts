import { createI18n } from 'vue-i18n'
import en from '@/renderer/locales/en.json'
import de from '@/renderer/locales/de.json'
import { getCurrentLocale } from '@/renderer/utils'

export default createI18n({
  locale: getCurrentLocale(),
  fallbackLocale: 'en',
  globalInjection: true,
  messages: {
    en,
    de
  }
})
