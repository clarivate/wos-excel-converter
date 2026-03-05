<script setup lang="tsx">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  mdiBrightness6,
  mdiInformation,
  mdiOpenInNew,
  mdiTranslate,
  mdiDownload,
  mdiConsoleLine
} from '@mdi/js'
import { storeToRefs } from 'pinia'
import { useAppVersionStore } from '@/renderer/store/appVersion'
import { computed, onMounted, ref } from 'vue'
import { openExternal } from '@/renderer/utils'
import { useTheme } from 'vuetify/framework'

const router = useRouter()
const route: any = useRoute()

const { t, locale, availableLocales } = useI18n()
const languages = ref(['en'])
const theme = useTheme()

const handleRoute = (path: string): void => {
  if (path !== route.path) router.push(path)
}

const versionAlert = ref(false)

const { currentVersion, latestVersion } = storeToRefs(useAppVersionStore())
const { fetchVersions } = useAppVersionStore()

const handleChangeTheme = (): void => {
  theme.change(theme.global.current.value.dark ? 'light' : 'dark')
}

const themeMode = computed(() => {
  return theme.global.current.value.dark ? t('header.light-mode') : t('header.dark-mode')
})

const handleChangeLanguage = (val: string): void => {
  locale.value = val
}

onMounted(() => {
  languages.value = availableLocales
  fetchVersions().then(() => {
    versionAlert.value =
      latestVersion.value !== 'n/a' && currentVersion.value !== latestVersion.value
    console.log(`Version alert set to ${versionAlert.value}`)
  })
})
</script>
<template>
  <v-system-bar
    color="systembar"
    density="compact"
    app
  >
    <v-icon
      class="clarivateIcon opacity-100"
      icon="$clarivate"
      size="90"
    />
    <v-spacer />

    <v-btn
      text
      size="small"
      variant="plain"
      density="compact"
      class="opacity-100"
      :prepend-icon="mdiBrightness6"
      @click="handleChangeTheme"
    >
      <strong>
        {{ themeMode }}
      </strong>
    </v-btn>
    <v-menu location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="opacity-100"
          text
          size="small"
          variant="plain"
          density="compact"
          :prepend-icon="mdiTranslate"
          v-bind="props"
        >
          <strong>
            {{ locale }}
          </strong>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          dense
          density="compact"
          v-for="item in languages"
          :key="item"
          :value="item"
          @click="handleChangeLanguage(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn
      text
      size="small"
      variant="plain"
      class="opacity-100"
      density="compact"
      :prepend-icon="mdiOpenInNew"
      @click="openExternal('https://developer.clarivate.com/')"
    >
      <strong>{{ t('header.developer-portal') }}</strong>
    </v-btn>
    <v-btn
      text
      size="small"
      variant="plain"
      class="opacity-100"
      density="compact"
      :prepend-icon="mdiInformation"
      @click="handleRoute('/about')"
    >
      <strong>{{ t('header.about') }}</strong>
    </v-btn>
    <v-btn
      text
      size="small"
      variant="plain"
      class="opacity-100"
      density="compact"
      :prepend-icon="mdiConsoleLine"
      @click="handleRoute('/log')"
    >
      <strong>{{ t('header.log') }}</strong>
    </v-btn>
    <v-btn
      size="small"
      :prepend-icon="mdiDownload"
      rounded
      density="comfortable"
      color="success"
      v-if="versionAlert"
      @click="openExternal('https://github.com/clarivate/wos-excel-converter/releases/latest')"
    >
      <strong>
        {{ t('header.new-version') }}
      </strong>
    </v-btn>
  </v-system-bar>
  <v-app-bar
    color="background"
    density="comfortable"
    elevation="1"
  >
    <v-app-bar-title
      class="cursor-pointer"
      @click="handleRoute('/')"
    >
      <v-icon
        class="mb-2"
        icon="$wos"
        size="160"
      />
      <span class="ml-2">
        <strong>{{ t('header.api-exporter') }}</strong>
      </span>
    </v-app-bar-title>
    <v-spacer />
    <v-chip-group
      show-arrows
      mandatory
      style="max-width: 70%"
      center-active
      value="test"
    >
      <v-chip
        class="primary white--text"
        active-class="primary white--text"
        key="test"
      >
        test1
      </v-chip>
      <v-chip active-class="primary">test1</v-chip>
      <v-chip active-class="primary">test1</v-chip>
    </v-chip-group>
  </v-app-bar>
</template>
<style scoped>
.active {
  opacity: 1 !important;
}
</style>
