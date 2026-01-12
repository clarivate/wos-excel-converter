import { createVuetify } from 'vuetify'
import { en, de } from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'

import ClarivateIcon from '@/renderer/components/icons/ClarivateIcon.vue'
import WosIcon from '@/renderer/components/icons/WosIcon.vue'

export default createVuetify({
  locale: {
    messages: { en, de },
    locale: 'en',
    fallback: 'en'
  },
  defaults: {
    VBtn: {
      style: [
        {
          // Do not force capitalization of a button text
          textTransform: 'none'
        }
      ]
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases: { ...aliases, clarivate: ClarivateIcon, wos: WosIcon },
    sets: {
      mdi
    }
  },
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#5e33bf',
          secondary: '#e0e0e0',
          accent: '#16ab03',
          error: '#b00020',
          info: '#2196F3',
          success: '#128902',
          warning: '#f89324',
          wosIcon: '#000000',
          background: '#FFFFFF',
          systembar: '#000000',
          clarivateIcon: '#FFFFFF'
        }
      },

      dark: {
        dark: true,
        colors: {
          primary: '#7e5ce6', // Lighter shade of your primary for visibility
          secondary: '#424242', // Dark gray for secondary elements
          accent: '#16ab03', // Keep accent as is for consistency
          error: '#cf6679', // Standard dark theme error color
          info: '#64B5F6', // Softer blue for info
          success: '#4CAF50', // Brighter green for success
          warning: '#FFB74D', // Warm orange for warning
          wosIcon: '#FFFFFF', // White icons for dark background
          background: '#555555' // Typical dark theme background
        }
      }
    }
  }
})
