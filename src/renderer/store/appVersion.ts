import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppVersion, newVersion } from '@/renderer/utils'

export const useAppVersionStore = defineStore('appVersion', () => {
  const currentVersion = ref('n/a')
  const latestVersion = ref('n/a')

  async function fetchVersions() {
    if (latestVersion.value === 'n/a') {
      latestVersion.value = await newVersion()
      console.log('Fetched latest version: ' + latestVersion.value)
    }
    if (currentVersion.value === 'n/a') {
      currentVersion.value = await getAppVersion()
      console.log('Fetched current version: ' + currentVersion.value)
    }
  }

  return {
    currentVersion,
    latestVersion,
    fetchVersions
  }
})
