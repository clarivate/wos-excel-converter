import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getAppVersion, newVersion } from '@/renderer/utils'

export const useAppVersionStore = defineStore('appVersion', () => {
  const currentVersion = ref('n/a')
  const latestVersion = ref('n/a')

  const newVersionAlert = computed((): boolean => {
    return (
      latestVersion.value !== currentVersion.value &&
      latestVersion.value !== 'n/a' &&
      latestVersion.value > currentVersion.value
    )
  })

  async function fetchVersions() {
    if (latestVersion.value === 'n/a') {
      latestVersion.value = await newVersion()
    }
    if (currentVersion.value === 'n/a') {
      currentVersion.value = await getAppVersion()
    }
  }

  return {
    currentVersion,
    latestVersion,
    newVersionAlert,
    fetchVersions
  }
})
