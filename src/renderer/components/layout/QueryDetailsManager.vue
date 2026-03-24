<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { mdiAlert, mdiCheckCircle } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useConfigsStore } from '@/renderer/store/configs'
import { icSchemaOptions, useQueryDetailsStore } from '@/renderer/store/queryDetails'
import { useTokensStore } from '@/renderer/store/tokens'

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
  wosQueryId,
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

const openWosDocs = (): void => {
  window.mainApi.send(
    'msgOpenExternalLink',
    'https://webofscience.help.clarivate.com/en-us/Content/advanced-search.html'
  )
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
            v-if="queryValidated"
            cols="12"
            class="pt-2"
          >
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title
                  id="query-summary-message"
                  :class="`text-${wosValidationType}`"
                  v-html="wosMessage"
                />
              </v-list-item>
              <v-list-item>
                <v-list-item-title>
                  {{ t('query.summary.usr-query') }}:
                  <code>{{ queryPreview }}</code>
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>
                  {{ t('query.summary.database-id') }}: {{ databaseId }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="edition">
                <v-list-item-title>
                  {{ t('query.summary.edition') }}: {{ edition }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="createdTimeSpan">
                <v-list-item-title>
                  {{ t('query.summary.created-time-span') }}: {{ createdTimeSpan }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="modifiedTimeSpan">
                <v-list-item-title>
                  {{ t('query.summary.modified-time-span') }}: {{ modifiedTimeSpan }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="addCitedReferences">
                <v-list-item-title class="text-warning">
                  {{ t('query.summary.cited-references-warning') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="wosRecordsFound !== null"
                id="query-summary-records"
              >
                <v-list-item-title>
                  {{ t('query.summary.records-found') }}: {{ wosRecordsFound }} | Query ID:
                  {{ wosQueryId }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
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

  <v-dialog
    v-model="wosDialogOpen"
    fullscreen
    transition="dialog-bottom-transition"
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
        <v-toolbar-title>{{ t('query.wos.dialog-title') }}</v-toolbar-title>
        <v-spacer />
        <v-btn
          variant="text"
          @click="wosDialogOpen = false"
        >
          {{ t('query.close') }}
        </v-btn>
      </v-app-bar>

      <v-container
        class="overflow-y-auto flex-grow-1"
        style="overflow-x: hidden"
      >
        <v-row>
          <v-col
            cols="12"
            xl="6"
          >
            <v-combobox
              id="query-database-id"
              :model-value="databaseId"
              :label="t('query.wos.database-id')"
              :hint="t('query.wos.database-id-hint')"
              persistent-hint
              :items="[
                'BCI',
                'BIOABS',
                'BIOSIS',
                'CCC',
                'DCI',
                'DIIDW',
                'MEDLINE',
                'WOK',
                'WOS',
                'ZOOREC'
              ]"
              variant="outlined"
              @update:model-value="persist({ databaseId: String($event || 'WOS') })"
            />
          </v-col>
          <v-col
            cols="12"
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

  <v-dialog
    v-model="icDialogOpen"
    fullscreen
    transition="dialog-bottom-transition"
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
          @click="icDialogOpen = false"
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
              :model-value="icSchema"
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
              <template #item="{ item, props }">
                <v-list-item
                  v-bind="props"
                  :title="`${item.raw.code} - ${item.raw.name}`"
                />
              </template>
            </v-select>
          </v-col>
          <v-col cols="12">
            <v-select
              id="query-ic-esci"
              :model-value="icEsci"
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
