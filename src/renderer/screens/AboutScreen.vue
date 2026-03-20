<script setup lang="tsx">
import { useI18n } from 'vue-i18n'
import { openExternal } from '@/renderer/utils'
import { useRouter } from 'vue-router'
import { mdiAlertBoxOutline, mdiArrowLeft, mdiOpenInNew } from '@mdi/js'
import { storeToRefs } from 'pinia'
import { useAppVersionStore } from '@/renderer/store/appVersion'

const { t } = useI18n()
const router = useRouter()
const handleRoute = (path: string): void => {
  router.push(path)
}
const { currentVersion } = storeToRefs(useAppVersionStore())
const EXPANDED_URL = 'https://developer.clarivate.com/apis/wos'
const INCITES_URL = 'https://developer.clarivate.com/apis/incites'
const SUPPORT_URL = 'https://support.clarivate.com/ScientificandAcademicResearch/s/?language=en_US'
const DEVPORTAL_URL = 'https://developer.clarivate.com'
const ISSUE_URL = 'https://github.com/clarivate/wos-excel-converter/issues/new/choose'
const GNU_LICENSE_URL = 'https://www.gnu.org/licenses/'
</script>

<template>
  <v-container>
    <v-row class="no-gutters">
      <v-col
        cols="12"
        lg="8"
      >
        <v-card-text>
          <v-row class="allow-center">
            <v-col>
              <v-btn
                text
                variant="plain"
                :prepend-icon="mdiArrowLeft"
                @click="handleRoute('/')"
              >
                {{ t('about.back') }}
              </v-btn>
            </v-col>
            <v-col class="text-disabled text-right">
              {{ t('header.current-version', { version: currentVersion }) }}
            </v-col>
          </v-row>
          <span class="text-h6">{{ t('about.title.this-tool') }}</span>
          <p>
            {{ t('about.desc1') }}
            <a
              class="text-info"
              @click="openExternal(EXPANDED_URL)"
            >
              {{ t('about.wos-api') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.and') }}
            <a
              class="text-info"
              @click="openExternal(INCITES_URL)"
            >
              {{ t('about.incites-api') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            .
            {{ t('about.paid-license') }}
            <a
              class="text-info"
              @click="openExternal(SUPPORT_URL)"
            >
              {{ t('about.support') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.or-visit') }}
            <a
              class="text-info"
              @click="openExternal(DEVPORTAL_URL)"
            >
              {{ t('about.dev-portal') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.to-learn-more') }}
          </p>
          <v-alert
            :text="t('about.note-product-terms')"
            :icon="mdiAlertBoxOutline"
            variant="flat"
          />
          <span class="text-h6">{{ t('about.title.why') }}</span>
          <p>{{ t('about.desc2') }}</p>
          <span class="text-h6">{{ t('about.title.involve') }}</span>
          <p>
            {{ t('about.desc3') }}
            <a
              class="text-info"
              @click="openExternal(ISSUE_URL)"
            >
              {{ t('about.report') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.desc4') }} {{ t('about.desc5') }}
          </p>
          <span class="text-h6">{{ t('about.title.copyright-and-license') }}</span>
          <p>
            {{ t('about.license-copyright', { year: new Date().getFullYear() }) }}
          </p>
          <p>{{ t('about.license-text1') }}</p>
          <p>{{ t('about.license-text2') }}</p>
          <p>
            {{ t('about.license-text3') }}
            <a
              class="text-info"
              @click="openExternal(GNU_LICENSE_URL)"
            >
              {{ GNU_LICENSE_URL }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            .
          </p>
        </v-card-text>
      </v-col>
    </v-row>
  </v-container>
</template>
<style scoped>
p {
  padding-bottom: 0.5rem;
  padding-top: 0.5rem;
}

a {
  cursor: pointer;
}
</style>
