<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQueryDetailsStore } from '@/renderer/store/queryDetails'
import { icSchemaOptions } from '@/renderer/store/queryDetails'

const { t } = useI18n()
const queryStore = useQueryDetailsStore()

interface IcSchema {
  code: string
  name: string
}

const props = defineProps<{
  modelValue: boolean
  icTokenSucceeded: boolean
  icSchema: IcSchema
  icEsci: 'y' | 'n'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const persist = async (payload: Record<string, unknown>): Promise<void> => {
  await queryStore.updateQueryDetails(payload)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card
      class="d-flex flex-column"
      style="height: 100%"
    >
      <v-app-bar
        density="comfortable"
        color="primary"
        style="position: sticky; top: 0; z-index: 10"
      >
        <v-toolbar-title>{{ t('query.incites.dialog-title') }}</v-toolbar-title>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('query.close') }}
        </v-btn>
      </v-app-bar>

      <v-container
        class="overflow-y-auto flex-grow-1"
        style="overflow-x: hidden"
      >
        <v-row>
          <v-col cols="12">
            <v-select
              id="query-ic-schema"
              :model-value="props.icSchema"
              :label="t('query.incites.schema')"
              :hint="t('query.incites.schema-hint')"
              persistent-hint
              :items="icSchemaOptions"
              item-title="name"
              return-object
              variant="outlined"
              @update:model-value="persist({ icSchema: $event })"
            >
              <template #selection="{ item }"> {{ item.raw.code }} - {{ item.raw.name }} </template>
              <template #item="{ item, props: itemProps }">
                <v-list-item
                  v-bind="itemProps"
                  :title="`${item.raw.code} - ${item.raw.name}`"
                />
              </template>
            </v-select>
          </v-col>
          <v-col cols="12">
            <v-select
              id="query-ic-esci"
              :model-value="props.icEsci"
              :label="t('query.incites.esci')"
              :hint="t('query.incites.esci-hint')"
              persistent-hint
              :items="['y', 'n']"
              variant="outlined"
              @update:model-value="persist({ icEsci: $event as 'y' | 'n' })"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>
