<script setup lang="tsx">
import { useI18n } from 'vue-i18n'
import { openExternal } from '@/renderer/utils'
import { useRouter } from 'vue-router'
import { mdiOpenInNew } from '@mdi/js'
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
</script>

<template>
  <v-container>
    <v-row class="no-gutters">
      <v-col
        cols="12"
        lg="8"
      >
        <v-card-text>
          <p>
            {{ t('about.desc1') }}
            <a @click="openExternal(EXPANDED_URL)">
              {{ t('about.wos-api') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.and') }}
            <a @click="openExternal(INCITES_URL)">
              {{ t('about.incites-api') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            .
            {{ t('about.paid-license') }}
            <a @click="openExternal(SUPPORT_URL)">
              {{ t('about.support') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.or-visit') }}
            <a @click="openExternal(DEVPORTAL_URL)">
              {{ t('about.dev-portal') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.to-learn-more') }}
          </p>
          <p>
            {{ t('about.desc2') }}
          </p>
          <p>
            {{ t('about.desc3') }}
            <a @click="openExternal(ISSUE_URL)">
              {{ t('about.report') }}
              <v-icon
                :icon="mdiOpenInNew"
                size="small"
              />
            </a>
            {{ t('about.desc4') }} {{ t('about.desc5') }}
          </p>
          <v-divider />
          <br />

          <p v-html="t('about.license-text')" />
          <v-row class="justify-space-evenly">
            <v-col>
              <v-btn @click="handleRoute('/')">
                {{ t('about.back') }}
              </v-btn>
            </v-col>
            <v-col class="text-disabled">
              {{ t('header.current-version', { version: currentVersion }) }}
            </v-col>
          </v-row>
        </v-card-text>
      </v-col>
    </v-row>
  </v-container>
</template>
<style scoped>
p {
  padding-bottom: 1rem;
}

a {
  color: rgb(var(--v-theme-info));
  cursor: pointer;
}
</style>
