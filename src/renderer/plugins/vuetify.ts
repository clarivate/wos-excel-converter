import { createVuetify } from 'vuetify'
import {
  ko,
  en,
  zhHans,
  zhHant,
  de,
  es,
  ja,
  fr,
  ru,
  pt,
  nl
} from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'

import ClarivateIcon from '@/renderer/components/icons/ClarivateIcon.vue'
import WosIcon from '@/renderer/components/icons/WosIcon.vue'

export default createVuetify({
  locale: {
    messages: { ko, en, zhHans, zhHant, de, es, ja, fr, ru, pt, nl },
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
          systembar: '#000000',
          clarivateIcon: '#FFFFFF'
        }
      },

      dark: {
        dark: true,
        colors: {
          // brand colors slightly brightened for dark backgrounds
          primary: '#5e33bf', // lighter than #5e33bf for better contrast on dark
          secondary: '#bdbdbd', // light neutral for text/icons on dark
          accent: '#22c10a', // a touch brighter than #16ab03
          // status colors tuned for dark themes
          error: '#cf6679', // Material dark error
          info: '#64b5f6',
          success: '#34c759',
          warning: '#ffb74d',
          systembar: '#333333'
        }
      }
    }
  }
})
