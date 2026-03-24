<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { mdiAlert, mdiCheckCircle } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useConfigsStore } from '@/renderer/store/configs'
import { useQueryDetailsStore } from '@/renderer/store/queryDetails'
import { useTokensStore } from '@/renderer/store/tokens'
import WosQueryDialog from '@/renderer/components/dialogs/WosQueryDialog.vue'
import IncitesQueryDialog from '@/renderer/components/dialogs/IncitesQueryDialog.vue'

const { t } = useI18n()

const configsStore = useConfigsStore()
const tokensStore = useTokensStore()
const queryStore = useQueryDetailsStore()

const { selectedConfigName } = storeToRefs(configsStore)
const { wosTokenSucceeded, icTokenSucceeded, atLeastOneTokenValid } = storeToRefs(tokensStore)
const {
  databaseId,
  edition,
  lang,
  createdTimeSpan,
  modifiedTimeSpan,
  usrQuery,
  disableWosQuery,
  addCitedReferences,
  idsFile,
  icSchema,
  icEsci,
  fileContent,
  invalidIds,
  duplicates,
  fileReadError,
  wosValidationType,
  wosValidationMessageKey,
  wosValidationMessageParams,
  wosRecordsFound,
  validationInProgress,
  queryPreview,
  queryValidated,
  panelStatusColor
} = storeToRefs(queryStore)

const wosDialogOpen = ref(false)
const icDialogOpen = ref(false)

const wosMessage = computed(() => {
  if (!wosValidationMessageKey.value) return ''
  return t(wosValidationMessageKey.value, wosValidationMessageParams.value ?? {})
})

type SummaryChip = { id: string; label: string }

const showQuerySummary = computed(() => queryValidated.value && wosTokenSucceeded.value)
const showQueryMessageChip = computed(
  () => showQuerySummary.value && !!wosMessage.value && wosValidationType.value !== 'success'
)

const querySummaryChips = computed((): SummaryChip[] => {
  if (!showQuerySummary.value) return []

  const chips: SummaryChip[] = [
    {
      id: 'query',
      label: `${t('query.summary.query')}: ${queryPreview.value}`
    },
    {
      id: 'database-id',
      label: `${t('query.summary.database-id-short')}: ${databaseId.value}`
    }
  ]

  if (edition.value)
    chips.push({
      id: 'edition',
      label: `${t('query.summary.edition-short')}: ${edition.value}`
    })
  if (createdTimeSpan.value)
    chips.push({
      id: 'created-time-span',
      label: `${t('query.summary.created-short')}: ${createdTimeSpan.value}`
    })
  if (modifiedTimeSpan.value)
    chips.push({
      id: 'modified-time-span',
      label: `${t('query.summary.modified-short')}: ${modifiedTimeSpan.value}`
    })
  if (wosRecordsFound.value !== null)
    chips.push({
      id: 'records-found',
      label: `${t('query.summary.records-short')}: ${wosRecordsFound.value}`
    })

  return chips
})

const showStatusIcon = computed(() => atLeastOneTokenValid.value)
const statusColor = computed(() => panelStatusColor.value || 'error')
const statusIcon = computed(() => (panelStatusColor.value === 'green' ? mdiCheckCircle : mdiAlert))

const disableIdsFileUpload = computed(() => {
  return !(
    (wosTokenSucceeded.value && disableWosQuery.value) ||
    (icTokenSucceeded.value && !wosTokenSucceeded.value)
  )
})

const fileRequired = computed(() => {
  return !idsFile.value && (disableWosQuery.value || !wosTokenSucceeded.value)
})

const persist = async (payload: Record<string, unknown>): Promise<void> => {
  await queryStore.updateQueryDetails(payload)
}

const validate = async (): Promise<void> => {
  await queryStore.validateWosQuery()
}

const chooseIdsFile = async (): Promise<void> => {
  await queryStore.chooseIdsFile(wosTokenSucceeded.value)
}

onMounted(async () => {
  await queryStore.loadQueryDetails()
  if (idsFile.value) {
    await queryStore.parseIdsFile(wosTokenSucceeded.value)
  }
  await validate()
})

watch(selectedConfigName, async () => {
  await queryStore.loadQueryDetails()
  if (idsFile.value) {
    await queryStore.parseIdsFile(wosTokenSucceeded.value)
  }
  await validate()
})

watch(wosTokenSucceeded, async () => {
  if (idsFile.value) {
    await queryStore.parseIdsFile(wosTokenSucceeded.value)
  }
})
</script>

<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <template #actions>
        <v-icon
          v-if="showStatusIcon"
          :icon="statusIcon"
          :color="statusColor"
        />
      </template>
      <template #default>
        <v-row no-gutters>
          <v-col cols="12">
            <v-toolbar-title>{{ t('query.title') }}</v-toolbar-title>
          </v-col>

          <v-col
            v-if="showQuerySummary"
            cols="12"
            class="pt-2"
          >
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-chip
                v-if="showQueryMessageChip"
                id="query-summary-message"
                size="small"
                :color="wosValidationType === 'warning' ? 'orange' : 'error'"
                variant="outlined"
              >
                {{ wosMessage }}
              </v-chip>

              <v-chip
                size="small"
                variant="tonal"
              >
                WOS
              </v-chip>

              <v-chip
                v-for="chip in querySummaryChips"
                :id="`query-summary-chip-${chip.id}`"
                :key="chip.id"
                size="small"
                variant="outlined"
              >
                {{ chip.label }}
              </v-chip>

              <v-tooltip
                v-if="addCitedReferences"
                location="top"
              >
                <template #activator="{ props }">
                  <v-chip
                    id="query-summary-cited-warning"
                    v-bind="props"
                    size="small"
                    color="orange"
                    variant="tonal"
                  >
                    {{ t('query.summary.cited-references-short') }}
                  </v-chip>
                </template>
                <span>{{ t('query.summary.cited-references-warning') }}</span>
              </v-tooltip>
            </div>
          </v-col>

          <v-col
            v-if="icTokenSucceeded"
            cols="12"
            class="pt-2"
          >
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>{{ t('query.incites.title') }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>
                  {{ t('query.incites.schema') }}: {{ icSchema.code }} - {{ icSchema.name }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{ t('query.incites.esci') }}: {{ icEsci }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col
            v-if="idsFile && !disableIdsFileUpload"
            cols="12"
            class="pt-2"
          >
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>
                  {{ t('query.ids-file.title') }}
                  <strong :class="fileContent.length > 0 ? 'text-success' : 'text-error'">
                    ({{ fileContent.length }} IDs)
                  </strong>
                  <span
                    v-if="fileReadError"
                    class="text-error text-caption"
                  >
                    {{ fileReadError }}
                  </span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>
                  {{ idsFile }}
                  <v-btn
                    id="query-ids-remove-btn"
                    variant="text"
                    class="text-none"
                    @click="queryStore.clearIdsFile()"
                  >
                    {{ t('query.ids-file.remove') }}
                  </v-btn>
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="invalidIds > 0">
                <v-list-item-title class="text-warning">
                  {{ t('query.ids-file.invalid-rows', { count: invalidIds }) }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="duplicates > 0">
                <v-list-item-title class="text-warning">
                  {{ t('query.ids-file.duplicate-rows', { count: duplicates }) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col
            v-if="fileRequired && showStatusIcon && disableIdsFileUpload"
            cols="12"
            class="pt-2"
          >
            <v-alert
              id="query-file-required-alert"
              type="error"
              variant="tonal"
              density="compact"
            >
              {{ t('query.ids-file.required') }}
            </v-alert>
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <v-row class="pt-3">
        <v-col
          cols="12"
          md="4"
          class="border-right"
        >
          <v-btn
            id="query-open-wos-dialog-btn"
            block
            variant="outlined"
            class="text-none mb-4"
            :disabled="!wosTokenSucceeded || disableWosQuery"
            @click="wosDialogOpen = true"
          >
            {{ t('query.wos.open-dialog') }}
          </v-btn>

          <v-switch
            id="query-disable-wos-switch"
            :model-value="disableWosQuery"
            :label="t('query.disable-wos')"
            :disabled="!wosTokenSucceeded"
            @update:model-value="persist({ disableWosQuery: !!$event })"
          />

          <v-switch
            id="query-add-cited-switch"
            :model-value="addCitedReferences"
            :label="t('query.add-cited-references')"
            :disabled="!wosTokenSucceeded"
            @update:model-value="persist({ addCitedReferences: !!$event })"
          />
        </v-col>

        <v-col
          cols="12"
          md="4"
          class="border-right"
        >
          <v-btn
            id="query-open-ic-dialog-btn"
            block
            variant="outlined"
            class="text-none"
            :disabled="!icTokenSucceeded"
            @click="icDialogOpen = true"
          >
            {{ t('query.incites.open-dialog') }}
          </v-btn>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-btn
            id="query-ids-file-btn"
            block
            variant="outlined"
            class="text-none"
            :disabled="disableIdsFileUpload"
            @click="chooseIdsFile"
          >
            {{ t('query.ids-file.button') }}
          </v-btn>
          <p class="text-medium-emphasis mt-2 text-body-2">
            {{ t('query.ids-file.help1') }}<br />
            UT:000271248500020
            <template v-if="wosTokenSucceeded">
              <br />DOI:10.1111/j.1532-5415.2009.02523.x <br />PMID:20121955
            </template>
          </p>
        </v-col>
      </v-row>
    </v-expansion-panel-text>
  </v-expansion-panel>

  <WosQueryDialog
    v-model="wosDialogOpen"
    :wos-token-succeeded="wosTokenSucceeded"
    :database-id="databaseId"
    :edition="edition"
    :lang="lang"
    :created-time-span="createdTimeSpan"
    :modified-time-span="modifiedTimeSpan"
    :usr-query="usrQuery"
    :wos-validation-type="wosValidationType"
    :wos-validation-message-key="wosValidationMessageKey"
    :wos-validation-message-params="wosValidationMessageParams"
    :validation-in-progress="validationInProgress"
  />

  <IncitesQueryDialog
    v-model="icDialogOpen"
    :ic-token-succeeded="icTokenSucceeded"
    :ic-schema="icSchema"
    :ic-esci="icEsci"
  />
</template>

<style scoped>
.border-right {
  border-right: 1px solid rgb(var(--v-theme-on-surface), 0.2);
}

@media (max-width: 960px) {
  .border-right {
    border-right: 0;
  }
}
</style>
