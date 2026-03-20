<script setup lang="tsx">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useConfigsStore } from '@/renderer/store/configs'
import { mdiPencil, mdiContentDuplicate, mdiDelete } from '@mdi/js'

const { t } = useI18n()
const configStore = useConfigsStore()
const { configNames, selectedConfigName } = storeToRefs(configStore)

const editName = ref(false)
const configName = ref(selectedConfigName.value)

// Watch for changes to selectedConfigName and update local ref
watch(selectedConfigName, (newValue) => {
  configName.value = newValue
})

const isValidName = computed(() => {
  const v = configName.value
  return (
    v.length > 0 &&
    v.length <= 25 &&
    (v === selectedConfigName.value || !configNames.value.includes(v))
  )
})

const handleEditName = async (): Promise<void> => {
  if (!isValidName.value) return
  if (configName.value === selectedConfigName.value) {
    editName.value = false
    return
  }
  try {
    await configStore.renameConfig(configName.value)
    editName.value = false
  } catch (error) {
    console.error('Error renaming config:', error)
    configName.value = selectedConfigName.value
  }
}

const handleCopyConfig = async (): Promise<void> => {
  try {
    await configStore.copyConfig()
  } catch (error) {
    console.error('Error copying config:', error)
  }
}

const handleDeleteConfig = async (): Promise<void> => {
  try {
    await configStore.deleteConfig()
  } catch (error) {
    console.error('Error deleting config:', error)
  }
}

const handleCancel = (): void => {
  configName.value = selectedConfigName.value
  editName.value = false
}
</script>

<template>
  <v-row class="pl-1 pb-6">
    <v-col cols="6">
      <div
        v-if="!editName"
        id="config-name-display"
        class="text-h5 d-flex align-center"
      >
        {{ configName }}
        <v-btn
          id="config-edit-name-btn"
          icon
          size="small"
          class="ml-2"
          variant="plain"
          @click="editName = true"
        >
          <v-icon
            :icon="mdiPencil"
            size="small"
          />
        </v-btn>
      </div>
      <div v-if="editName">
        <v-text-field
          id="config-name-field"
          v-model="configName"
          class="text-h5"
          counter="25"
          :rules="[
            (v: string) =>
              (v.length > 0 && v.length <= 25) || t('config.name-validation'),
            (v: string) =>
              (v === selectedConfigName || !configNames.includes(v)) ||
              (v + ' ' + t('config.name-exists'))
          ]"
          @keyup.enter="handleEditName"
        >
          <template #append>
            <v-btn
              id="config-done-btn"
              text
              size="small"
              class="text-none"
              @click="handleEditName"
              :disabled="!isValidName"
            >
              {{ t('config.done') }}
            </v-btn>
            <v-btn
              id="config-cancel-btn"
              text
              size="small"
              class="text-none"
              @click="handleCancel"
            >
              Cancel
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-col>
    <v-col cols="6">
      <div class="d-flex justify-end gap-2">
        <v-btn
          id="config-copy-btn"
          text
          size="small"
          @click="handleCopyConfig"
        >
          <v-icon
            :icon="mdiContentDuplicate"
            size="small"
            class="mr-2"
          />
          {{ t('config.copy') }}
        </v-btn>
        <v-btn
          v-if="configNames.length > 1"
          id="config-delete-btn"
          text
          size="small"
          color="red"
          @click="handleDeleteConfig"
        >
          <v-icon
            :icon="mdiDelete"
            size="small"
          />
          {{ t('config.delete') }}
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>
