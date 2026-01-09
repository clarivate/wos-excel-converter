<script setup lang="tsx">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiFitToScreenOutline, mdiGift, mdiHome } from '@mdi/js'
import { storeToRefs } from 'pinia'
import { useAppVersionStore } from '@/renderer/store/appVersion'
import { onMounted } from 'vue'
import { openExternal } from '@/renderer/utils'

const router = useRouter()
const route: any = useRoute()
const titleKey: string = (route?.meta?.titleKey || 'title.main') as string

const { t } = useI18n()

const handleRoute = (path: string): void => {
  router.push(path)
}

const isCurrentRoute = (path: string): boolean => {
  return path === route.path
}
const { currentVersion, latestVersion } = storeToRefs(useAppVersionStore())
const { fetchVersions, newVersionAlert } = useAppVersionStore()

onMounted(async () => {
  await fetchVersions()
})

const headerMenus: {
  icon: string
  text: string
  path: string
}[] = [
  {
    icon: mdiHome,
    text: 'title.main',
    path: '/'
  },
  {
    icon: mdiFitToScreenOutline,
    text: 'title.second',
    path: '/second'
  }
]
</script>
<template>
  <v-system-bar
    color="systembar"
    density="compact"
    app
  >
    <v-icon
      class="icon-white-fill"
      icon="$clarivate"
      size="90"
    />
    <v-spacer />
    <v-btn
      small
      :prepend-icon="mdiGift"
      class="text-none"
      elavation="24"
      rounded
      color="accent"
      v-if="newVersionAlert"
      @click="
        openExternal(
          'https://github.com/clarivate/wos-excel-converter/releases/latest'
        )
      "
      ><strong>New version {{ latestVersion }} available </strong></v-btn
    >
    {{ currentVersion }}
  </v-system-bar>
  <v-app-bar
    color="primary"
    density="compact"
  >
    <v-app-bar-title>{{ t(titleKey) }}</v-app-bar-title>
    <template #append>
      <v-btn
        v-for="menu in headerMenus"
        :key="menu.path"
        :prepend-icon="menu.icon"
        variant="text"
        :class="{ active: isCurrentRoute(menu.path) }"
        @click="handleRoute(menu.path)"
      >
        {{ t(menu.text) }}
      </v-btn>
    </template>
  </v-app-bar>
</template>
<style scoped>
.v-btn {
  opacity: 0.4;
}
.active {
  opacity: 1 !important;
}
.icon-white-fill {
  color: #ffffff !important;
  opacity: 1 !important;
}
</style>
