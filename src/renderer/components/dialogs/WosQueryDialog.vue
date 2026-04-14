<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQueryDetailsStore } from '@/renderer/store/queryDetails'
import { mdiCalendarRange, mdiChevronDown, mdiOpenInNew } from '@mdi/js'

const { t } = useI18n()
const queryStore = useQueryDetailsStore()

type WosDatabaseOption = {
  code: string
  label: string
}

type TimeSpanType = 'createdTimeSpan' | 'modifiedTimeSpan' | 'tcModifiedTimeSpan'

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
const timeSpanRawValue = ref('')
const presetMenuOpen = ref(false)
const typeMenuOpen = ref(false)

// Label IS the API parameter name the user has chosen
const selectedTimeSpanLabel = computed(() => selectedTimeSpanType.value)

const timeSpanTypeOptions = computed((): TimeSpanType[] => {
  const options: TimeSpanType[] = ['createdTimeSpan', 'modifiedTimeSpan', 'tcModifiedTimeSpan']
  if (props.databaseId === 'WOK') {
    return options.filter((o) => o === 'createdTimeSpan')
  }
  return options
})

const timeSpanHint = computed(() =>
  props.databaseId === 'WOK'
    ? t('query.wos.time-span-type-hint-wok')
    : t('query.wos.time-span-date-hint')
)

const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const presetRanges = computed(() => {
  const today = new Date()
  const fmt = formatDate
  const offset = (days: number) => {
    const d = new Date()
    d.setDate(today.getDate() - days)
    return d
  }
  return [
    { label: t('query.wos.time-span-preset-last-day'), value: `${fmt(offset(1))}+${fmt(today)}` },
    {
      label: t('query.wos.time-span-preset-last-3-days'),
      value: `${fmt(offset(3))}+${fmt(today)}`
    },
    { label: t('query.wos.time-span-preset-last-week'), value: `${fmt(offset(7))}+${fmt(today)}` },
    {
      label: t('query.wos.time-span-preset-last-month'),
      value: `${fmt(offset(30))}+${fmt(today)}`
    }
  ]
})

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
  timeSpanRawValue.value = getTimeSpanValueForType(selectedTimeSpanType.value)
}

watch(
  () => [props.databaseId, props.createdTimeSpan, props.modifiedTimeSpan, props.tcModifiedTimeSpan],
  syncTimeSpanStateFromProps,
  { immediate: true }
)

const persist = async (payload: Record<string, unknown>): Promise<void> => {
  await queryStore.updateQueryDetails(payload)
}

const persistTimeSpan = async (value: string): Promise<void> => {
  const type: TimeSpanType =
    props.databaseId === 'WOK' ? 'createdTimeSpan' : selectedTimeSpanType.value
  await persist({
    createdTimeSpan: type === 'createdTimeSpan' ? value : '',
    modifiedTimeSpan: type === 'modifiedTimeSpan' ? value : '',
    tcModifiedTimeSpan: type === 'tcModifiedTimeSpan' ? value : ''
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
  timeSpanRawValue.value = getTimeSpanValueForType(nextType)
  await persistTimeSpan(timeSpanRawValue.value)
}

const onTimeSpanRawChanged = async (value: string | null): Promise<void> => {
  timeSpanRawValue.value = String(value || '')
  await persistTimeSpan(timeSpanRawValue.value)
}

const applyPreset = async (value: string): Promise<void> => {
  timeSpanRawValue.value = value
  presetMenuOpen.value = false
  await persistTimeSpan(value)
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
            xl="8"
            lg="8"
          >
            <!--
              Single combo-style field:
              – label   = the selected API parameter name (e.g. createdTimeSpan)
              – prepend = chip to switch between parameter types
              – value   = raw API date range yyyy-mm-dd+yyyy-mm-dd
              – append  = preset quick-pick button
            -->
            <v-text-field
              id="query-time-span"
              :model-value="timeSpanRawValue"
              :label="selectedTimeSpanLabel"
              :hint="timeSpanHint"
              persistent-hint
              placeholder="yyyy-mm-dd+yyyy-mm-dd"
              variant="outlined"
              @update:model-value="onTimeSpanRawChanged($event)"
            >
              <template #prepend-inner>
                <v-menu
                  v-model="typeMenuOpen"
                  :close-on-content-click="true"
                  location="bottom start"
                >
                  <template #activator="{ props: typeProps }">
                    <v-chip
                      v-bind="typeProps"
                      size="small"
                      variant="tonal"
                      :disabled="databaseId === 'WOK'"
                      class="mr-2 type-chip"
                    >
                      {{ selectedTimeSpanType }}
                      <v-icon
                        :icon="mdiChevronDown"
                        size="x-small"
                        end
                      />
                    </v-chip>
                  </template>
                  <v-list
                    density="compact"
                    nav
                  >
                    <v-list-item
                      v-for="opt in timeSpanTypeOptions"
                      :key="opt"
                      :title="opt"
                      :active="selectedTimeSpanType === opt"
                      @click="onTimeSpanTypeChanged(opt)"
                    />
                  </v-list>
                </v-menu>
              </template>
              <template #append-inner>
                <v-menu
                  v-model="presetMenuOpen"
                  :close-on-content-click="false"
                  location="bottom end"
                >
                  <template #activator="{ props: presetProps }">
                    <v-btn
                      v-bind="presetProps"
                      :icon="mdiCalendarRange"
                      size="small"
                      variant="text"
                      :title="t('query.wos.time-span-presets')"
                    />
                  </template>
                  <v-list
                    density="compact"
                    nav
                  >
                    <v-list-item
                      v-for="preset in presetRanges"
                      :key="preset.value"
                      :title="preset.label"
                      :subtitle="preset.value"
                      @click="applyPreset(preset.value)"
                    />
                  </v-list>
                </v-menu>
              </template>
            </v-text-field>
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

<style scoped>
.type-chip {
  cursor: pointer;
  user-select: none;
}
</style>
