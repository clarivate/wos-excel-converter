<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQueryDetailsStore } from '@/renderer/store/queryDetails'
import { mdiOpenInNew } from '@mdi/js'

const { t } = useI18n()
const queryStore = useQueryDetailsStore()

type WosDatabaseOption = {
  code: string
  label: string
}

const wosDatabaseOptions: WosDatabaseOption[] = [
  { code: 'WOS', label: 'Web of Science Core Collection (WOS)' },
  { code: 'BCI', label: 'BIOSIS Citation Index (BCI)' },
  { code: 'BIOABS', label: 'Biological Abstracts (BIOABS)' },
  { code: 'BIOSIS', label: 'BIOSIS Previews (BIOSIS)' },
  { code: 'CABI', label: 'CABI: CAB Abstracts and Global Health (CABI)' },
  { code: 'CCC', label: 'Current Contents Connect (CCC)' },
  { code: 'CSCD', label: 'Chinese Science Citation Database (CSCD)' },
  { code: 'DCI', label: 'Data Citation Index (DCI)' },
  { code: 'DIIDW', label: 'Derwent Innovations Index (DIIDW)' },
  { code: 'FSTA', label: 'FSTA - the food science resource (FSTA)' },
  { code: 'GRANTS', label: 'Grants Index (GRANTS)' },
  { code: 'INSPEC', label: 'Inspec (INSPEC)' },
  { code: 'MEDLINE', label: 'MEDLINE (MEDLINE)' },
  { code: 'PPRN', label: 'Preprint Citation Index (PPRN)' },
  { code: 'PQDT', label: 'ProQuest Dissertations and Theses Citation Index (PQDT)' },
  { code: 'RC', label: 'Research Commons (RC)' },
  { code: 'SCIELO', label: 'SciELO Citation Index (SCIELO)' },
  { code: 'WOK', label: 'All Databases (WOK)' },
  { code: 'ZOOREC', label: 'Zoological Record (ZOOREC)' }
]

const props = defineProps<{
  modelValue: boolean
  wosTokenSucceeded: boolean
  databaseId: string
  edition: string
  lang: string
  createdTimeSpan: string
  modifiedTimeSpan: string
  usrQuery: string
  wosValidationType: 'success' | 'error' | 'warning' | 'info' | null | undefined
  wosValidationMessageKey: string | null
  wosValidationMessageParams: Record<string, any> | null | undefined
  validationInProgress: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const wosMessage = computed(() => {
  if (!props.wosValidationMessageKey) return ''
  return t(props.wosValidationMessageKey, props.wosValidationMessageParams ?? {})
})

const persist = async (payload: Record<string, unknown>): Promise<void> => {
  await queryStore.updateQueryDetails(payload)
}

const validate = async (): Promise<void> => {
  await queryStore.validateWosQuery()
}

const openWosDocs = (): void => {
  window.mainApi.send(
    'msgOpenExternalLink',
    'https://webofscience.zendesk.com/hc/en-us/articles/26916347018257-Web-of-Science-Core-Collection-Advanced-Search-Field-Tags'
  )
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
        density="compact"
        color="systembar"
        style="position: sticky; top: 0; z-index: 10"
      >
        <v-toolbar-title>{{ t('query.wos.dialog-title') }}</v-toolbar-title>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('query.close') }}
        </v-btn>
      </v-app-bar>

      <v-container
        class="overflow-y-auto flex-grow-1 mt-4"
        style="overflow-x: hidden"
      >
        <v-row>
          <v-col
            cols="12"
            lg="6"
            xl="6"
          >
            <v-select
              id="query-database-id"
              :model-value="databaseId"
              :label="t('query.wos.database-id')"
              :hint="t('query.wos.database-id-hint')"
              persistent-hint
              :items="wosDatabaseOptions"
              item-title="label"
              item-value="code"
              variant="outlined"
              @update:model-value="persist({ databaseId: String($event || 'WOS') })"
            />
          </v-col>
          <v-col
            cols="12"
            lg="6"
            xl="6"
          >
            <v-text-field
              id="query-edition"
              :model-value="edition"
              :label="t('query.wos.edition')"
              :hint="t('query.wos.edition-hint')"
              persistent-hint
              variant="outlined"
              @update:model-value="persist({ edition: String($event || '') })"
            />
          </v-col>
          <v-col
            cols="12"
            xl="4"
            lg="4"
          >
            <v-text-field
              id="query-lang"
              :model-value="lang"
              :label="t('query.wos.lang')"
              :hint="t('query.wos.lang-hint')"
              persistent-hint
              variant="outlined"
              @update:model-value="persist({ lang: String($event || '') })"
            />
          </v-col>
          <v-col
            cols="12"
            xl="4"
            lg="4"
          >
            <v-text-field
              id="query-created-time-span"
              :model-value="createdTimeSpan"
              :label="t('query.wos.created-time-span')"
              :hint="t('query.wos.created-time-span-hint')"
              persistent-hint
              variant="outlined"
              @update:model-value="persist({ createdTimeSpan: String($event || '') })"
            />
          </v-col>
          <v-col
            cols="12"
            xl="4"
            lg="4"
          >
            <v-text-field
              id="query-modified-time-span"
              :model-value="modifiedTimeSpan"
              :label="t('query.wos.modified-time-span')"
              :hint="t('query.wos.modified-time-span-hint')"
              persistent-hint
              variant="outlined"
              @update:model-value="persist({ modifiedTimeSpan: String($event || '') })"
            />
          </v-col>
        </v-row>

        <v-row class="pt-4">
          <v-col cols="12">
            <v-textarea
              id="query-usr-query"
              :model-value="usrQuery"
              :label="t('query.wos.usr-query')"
              :hint="t('query.wos.usr-query-hint')"
              persistent-hint
              variant="outlined"
              @update:model-value="persist({ usrQuery: String($event || '') })"
            >
              <template #message>
                <a
                  href="#"
                  @click.prevent="openWosDocs"
                >
                  {{ t('query.wos.open-docs') }}
                  <v-icon
                    :icon="mdiOpenInNew"
                    size="small"
                  />
                </a>
              </template>
            </v-textarea>
          </v-col>
        </v-row>

        <v-row>
          <v-col
            cols="12"
            md="2"
          >
            <v-btn
              id="query-validate-btn"
              block
              :disabled="!wosTokenSucceeded || validationInProgress"
              @click="validate"
            >
              {{ t('query.wos.validate') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            md="10"
          >
            <v-alert
              v-if="!wosTokenSucceeded"
              type="info"
              variant="tonal"
              density="compact"
            >
              {{ t('query.wos.verify-token-first') }}
            </v-alert>
            <v-alert
              v-if="wosValidationType"
              id="query-validation-alert"
              :type="wosValidationType"
              variant="tonal"
              density="compact"
              v-html="wosMessage"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>
