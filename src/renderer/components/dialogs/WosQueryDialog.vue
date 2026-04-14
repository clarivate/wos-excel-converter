<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQueryDetailsStore } from '@/renderer/store/queryDetails'
import { mdiOpenInNew } from '@mdi/js'

const { t } = useI18n()
const queryStore = useQueryDetailsStore()

type WosDatabaseOption = {
  code: string
  label: string
}

type TimeSpanType = 'createdTimeSpan' | 'modifiedTimeSpan' | 'tcModifiedTimeSpan'
type TimeSpanPreset = 'custom' | 'lastDay' | 'last3Days' | 'lastWeek' | 'lastMonth'

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
  tcModifiedTimeSpan: string
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

const selectedTimeSpanType = ref<TimeSpanType>('createdTimeSpan')
const selectedTimeSpanPreset = ref<TimeSpanPreset>('custom')
const timeSpanStartDate = ref('')
const timeSpanEndDate = ref('')

const timeSpanTypeOptions = computed(() => {
  const options: Array<{ value: TimeSpanType; label: string }> = [
    { value: 'createdTimeSpan', label: t('query.wos.created-time-span') },
    { value: 'modifiedTimeSpan', label: t('query.wos.modified-time-span') },
    { value: 'tcModifiedTimeSpan', label: t('query.wos.tc-modified-time-span') }
  ]

  if (props.databaseId === 'WOK') {
    return options.filter((option) => option.value === 'createdTimeSpan')
  }

  return options
})

const timeSpanPresetOptions = computed(() => [
  { value: 'lastDay', label: t('query.wos.time-span-preset-last-day') },
  { value: 'last3Days', label: t('query.wos.time-span-preset-last-3-days') },
  { value: 'lastWeek', label: t('query.wos.time-span-preset-last-week') },
  { value: 'lastMonth', label: t('query.wos.time-span-preset-last-month') },
  { value: 'custom', label: t('query.wos.time-span-preset-custom') }
])

const timeSpanTypeHint = computed(() =>
  props.databaseId === 'WOK'
    ? t('query.wos.time-span-type-hint-wok')
    : t('query.wos.time-span-type-hint')
)

const parseTimeSpanRange = (value: string): { start: string; end: string } => {
  if (!value) return { start: '', end: '' }
  const [start, end] = value.split('+')
  return {
    start: start ?? '',
    end: end ?? ''
  }
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getPresetRange = (
  preset: Exclude<TimeSpanPreset, 'custom'>
): { start: string; end: string } => {
  const endDate = new Date()
  const startDate = new Date()

  if (preset === 'lastDay') startDate.setDate(endDate.getDate() - 1)
  if (preset === 'last3Days') startDate.setDate(endDate.getDate() - 3)
  if (preset === 'lastWeek') startDate.setDate(endDate.getDate() - 7)
  if (preset === 'lastMonth') startDate.setDate(endDate.getDate() - 30)

  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  }
}

const buildTimeSpanRange = (start: string, end: string): string => {
  if (!start || !end) return ''
  return `${start}+${end}`
}

const getTimeSpanValueForType = (type: TimeSpanType): string => {
  if (type === 'createdTimeSpan') return props.createdTimeSpan
  if (type === 'modifiedTimeSpan') return props.modifiedTimeSpan
  return props.tcModifiedTimeSpan
}

const getActiveTypeFromProps = (): TimeSpanType => {
  if (props.databaseId === 'WOK') return 'createdTimeSpan'
  if (props.createdTimeSpan) return 'createdTimeSpan'
  if (props.modifiedTimeSpan) return 'modifiedTimeSpan'
  if (props.tcModifiedTimeSpan) return 'tcModifiedTimeSpan'
  return 'createdTimeSpan'
}

const syncTimeSpanStateFromProps = (): void => {
  selectedTimeSpanType.value = getActiveTypeFromProps()
  selectedTimeSpanPreset.value = 'custom'
  const range = parseTimeSpanRange(getTimeSpanValueForType(selectedTimeSpanType.value))
  timeSpanStartDate.value = range.start
  timeSpanEndDate.value = range.end
}

watch(
  () => [props.databaseId, props.createdTimeSpan, props.modifiedTimeSpan, props.tcModifiedTimeSpan],
  syncTimeSpanStateFromProps,
  { immediate: true }
)

const persist = async (payload: Record<string, unknown>): Promise<void> => {
  await queryStore.updateQueryDetails(payload)
}

const persistSelectedTimeSpan = async (value: string): Promise<void> => {
  const effectiveType: TimeSpanType =
    props.databaseId === 'WOK' ? 'createdTimeSpan' : selectedTimeSpanType.value

  await persist({
    createdTimeSpan: effectiveType === 'createdTimeSpan' ? value : '',
    modifiedTimeSpan: effectiveType === 'modifiedTimeSpan' ? value : '',
    tcModifiedTimeSpan: effectiveType === 'tcModifiedTimeSpan' ? value : ''
  })
}

const onDatabaseChanged = async (value: string | null): Promise<void> => {
  const nextDatabaseId = String(value || 'WOS')
  await persist({
    databaseId: nextDatabaseId,
    ...(nextDatabaseId === 'WOK' ? { modifiedTimeSpan: '', tcModifiedTimeSpan: '' } : {})
  })
}

const onTimeSpanTypeChanged = async (value: TimeSpanType | null): Promise<void> => {
  const nextType = props.databaseId === 'WOK' ? 'createdTimeSpan' : (value ?? 'createdTimeSpan')
  selectedTimeSpanType.value = nextType
  selectedTimeSpanPreset.value = 'custom'

  const range = parseTimeSpanRange(getTimeSpanValueForType(nextType))
  timeSpanStartDate.value = range.start
  timeSpanEndDate.value = range.end

  await persistSelectedTimeSpan(buildTimeSpanRange(range.start, range.end))
}

const onTimeSpanPresetChanged = async (value: TimeSpanPreset | null): Promise<void> => {
  const nextPreset = value ?? 'custom'
  selectedTimeSpanPreset.value = nextPreset

  if (nextPreset === 'custom') {
    await persistSelectedTimeSpan(
      buildTimeSpanRange(timeSpanStartDate.value, timeSpanEndDate.value)
    )
    return
  }

  const range = getPresetRange(nextPreset)
  timeSpanStartDate.value = range.start
  timeSpanEndDate.value = range.end
  await persistSelectedTimeSpan(buildTimeSpanRange(range.start, range.end))
}

const onTimeSpanDateChanged = async (): Promise<void> => {
  selectedTimeSpanPreset.value = 'custom'
  await persistSelectedTimeSpan(buildTimeSpanRange(timeSpanStartDate.value, timeSpanEndDate.value))
}

const onTimeSpanStartChanged = async (value: string | null): Promise<void> => {
  timeSpanStartDate.value = String(value || '')
  await onTimeSpanDateChanged()
}

const onTimeSpanEndChanged = async (value: string | null): Promise<void> => {
  timeSpanEndDate.value = String(value || '')
  await onTimeSpanDateChanged()
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
              @update:model-value="onDatabaseChanged($event)"
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
            <v-select
              id="query-time-span-type"
              :model-value="selectedTimeSpanType"
              :label="t('query.wos.time-span-type')"
              :hint="timeSpanTypeHint"
              persistent-hint
              :items="timeSpanTypeOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              :disabled="databaseId === 'WOK'"
              @update:model-value="onTimeSpanTypeChanged($event)"
            />
          </v-col>
          <v-col
            cols="12"
            xl="4"
            lg="4"
          >
            <v-select
              id="query-time-span-preset"
              :model-value="selectedTimeSpanPreset"
              :label="t('query.wos.time-span-preset')"
              :hint="t('query.wos.time-span-preset-hint')"
              persistent-hint
              :items="timeSpanPresetOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              @update:model-value="onTimeSpanPresetChanged($event)"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col
            cols="12"
            xl="6"
            lg="6"
          >
            <v-text-field
              id="query-time-span-start"
              :model-value="timeSpanStartDate"
              :label="t('query.wos.time-span-start')"
              :hint="t('query.wos.time-span-date-hint')"
              persistent-hint
              type="date"
              variant="outlined"
              @update:model-value="onTimeSpanStartChanged($event)"
            />
          </v-col>
          <v-col
            cols="12"
            xl="6"
            lg="6"
          >
            <v-text-field
              id="query-time-span-end"
              :model-value="timeSpanEndDate"
              :label="t('query.wos.time-span-end')"
              :hint="t('query.wos.time-span-date-hint')"
              persistent-hint
              type="date"
              variant="outlined"
              @update:model-value="onTimeSpanEndChanged($event)"
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
