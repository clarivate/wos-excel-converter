import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigsStore = defineStore('configs', () => {
  const configNames = ref<string[]>([])
  const selectedConfigName = ref('')

  async function fetchConfigs(): Promise<void> {
    const [names, current] = await Promise.all([
      window.mainApi.invoke('msgRequestGetAllConfigNames'),
      window.mainApi.invoke('msgRequestGetConfigName')
    ])
    configNames.value = names
    selectedConfigName.value = current
  }

  async function changeConfig(configName: string): Promise<void> {
    if (!configName || configName === selectedConfigName.value) return
    await window.mainApi.invoke('msgRequestChangeConfig', configName)
    selectedConfigName.value = configName
  }

  return {
    configNames,
    selectedConfigName,
    fetchConfigs,
    changeConfig
  }
})
