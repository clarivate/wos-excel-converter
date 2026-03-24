<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { mdiAlert, mdiCheckCircle, mdiEye, mdiEyeOff, mdiRefresh } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useConfigsStore } from '@/renderer/store/configs'
import { useTokensStore } from '@/renderer/store/tokens'

const { t } = useI18n()
const configStore = useConfigsStore()
const tokensStore = useTokensStore()
const { selectedConfigName } = storeToRefs(configStore)
const {
  wosExpandedToken,
  icToken,
  wosTokenMessageType,
  wosTokenMessageParams,
  wosTokenMessageKey,
  wosRateLimits,
  icTokenMessageType,
  icTokenMessageParams,
  icTokenMessageKey,
  icRateLimits,
  validationProgress,
  atLeastOneTokenValid,
  combinedStatusColor,
  combinedStatusIcon
} = storeToRefs(tokensStore)

const showWosToken = ref(false)
const showIcToken = ref(false)
let wosVerifyTimer: ReturnType<typeof setTimeout> | null = null
let icVerifyTimer: ReturnType<typeof setTimeout> | null = null

const statusIcon = computed(() =>
  combinedStatusIcon.value === 'success' ? mdiCheckCircle : mdiAlert
)
const statusColor = computed(() => combinedStatusColor.value)

const fmt = (value: number): string => new Intl.NumberFormat().format(value)

type Chip = { id: string; label: string }

const compactWosChips = computed((): Chip[] => {
  if (wosTokenMessageType.value !== 'success' || !wosRateLimits.value) return []

  const r = wosRateLimits.value
  const chips: Chip[] = []

  if (r.recordsPerDayRemaining !== null)
    chips.push({
      id: 'wos-rec-day',
      label: `${t('token.summary.wos-rec-day')}: ${fmt(r.recordsPerDayRemaining)}`
    })
  if (r.recordsPerMonthRemaining !== null)
    chips.push({
      id: 'wos-rec-month',
      label: `${t('token.summary.wos-rec-month')}: ${fmt(r.recordsPerMonthRemaining)}`
    })
  if (r.recordsPerYearRemaining !== null)
    chips.push({
      id: 'wos-rec-year',
      label: `${t('token.summary.wos-rec-year')}: ${fmt(r.recordsPerYearRemaining)}`
    })
  if (r.requestsPerSecondRemaining !== null)
    chips.push({
      id: 'wos-req-second',
      label: `${t('token.summary.wos-req-second')}: ${fmt(r.requestsPerSecondRemaining)}`
    })
  if (r.requestsPerDayRemaining !== null)
    chips.push({
      id: 'wos-req-day',
      label: `${t('token.summary.wos-req-day')}: ${fmt(r.requestsPerDayRemaining)}`
    })
  if (r.requestsPerYearRemaining !== null)
    chips.push({
      id: 'wos-req-year',
      label: `${t('token.summary.wos-req-year')}: ${fmt(r.requestsPerYearRemaining)}`
    })

  if (chips.length === 0)
    chips.push({
      id: 'wos-unlimited',
      label: t('token.summary.unlimited-short')
    })

  return chips
})

const compactIcChips = computed((): Chip[] => {
  if (icTokenMessageType.value !== 'success' || !icRateLimits.value) return []

  const r = icRateLimits.value
  const chips: Chip[] = []

  if (r.requestsPerDayRemaining !== null) {
    const label =
      r.requestsPerDayLimit !== null
        ? `${t('token.summary.ic-req-day')}: ${fmt(r.requestsPerDayRemaining)}/${fmt(r.requestsPerDayLimit)}`
        : `${t('token.summary.ic-req-day')}: ${fmt(r.requestsPerDayRemaining)}`
    chips.push({ id: 'ic-req-day', label })
  }

  if (r.requestsPerSecondRemaining !== null) {
    const label =
      r.requestsPerSecondLimit !== null
        ? `${t('token.summary.ic-req-second')}: ${fmt(r.requestsPerSecondRemaining)}/${fmt(r.requestsPerSecondLimit)}`
        : `${t('token.summary.ic-req-second')}: ${fmt(r.requestsPerSecondRemaining)}`
    chips.push({ id: 'ic-req-second', label })
  }

  if (chips.length === 0)
    chips.push({
      id: 'ic-unlimited',
      label: t('token.summary.unlimited-short')
    })

  return chips
})

const wosValidationErrorChip = computed((): Chip | null => {
  if (wosTokenMessageType.value !== 'error' || !wosTokenMessageKey.value) return null

  const errorMsg = wosTokenMessageParams?.value?.error || 'Unknown error'
  const message = t('token.validation.wos-error', { error: errorMsg })
  return {
    id: 'wos-error',
    label: message
  }
})

const icValidationErrorChip = computed((): Chip | null => {
  if (icTokenMessageType.value !== 'error' || !icTokenMessageKey.value) return null

  const errorMsg = icTokenMessageParams?.value?.error || 'Unknown error'
  const message = t('token.validation.ic-error', { error: errorMsg })
  return {
    id: 'ic-error',
    label: message
  }
})

const scheduleWosVerification = (): void => {
  if (wosVerifyTimer) clearTimeout(wosVerifyTimer)
  wosVerifyTimer = setTimeout(() => {
    void tokensStore.verifyWosToken()
  }, 400)
}
const scheduleIcVerification = (): void => {
  if (icVerifyTimer) clearTimeout(icVerifyTimer)
  icVerifyTimer = setTimeout(() => {
    void tokensStore.verifyIcToken()
  }, 400)
}
const onWosTokenInput = async (value: string): Promise<void> => {
  await tokensStore.saveWosToken(value)
  scheduleWosVerification()
}
const onIcTokenInput = async (value: string): Promise<void> => {
  await tokensStore.saveIcToken(value)
  scheduleIcVerification()
}
const openExternal = (url: string): void => {
  window.mainApi.send('msgOpenExternalLink', url)
}

onMounted(async () => {
  await tokensStore.loadAndVerifyExistingTokens()
})
watch(selectedConfigName, async () => {
  await tokensStore.loadAndVerifyExistingTokens()
})
</script>
<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <template #actions>
        <v-icon
          v-if="atLeastOneTokenValid"
          :icon="statusIcon"
          :color="statusColor"
        />
      </template>
      <template #default="{ expanded }">
        <v-progress-linear
          v-if="!expanded && validationProgress"
          indeterminate
          color="primary"
          absolute
          top
        />
        <v-row no-gutters>
          <v-col cols="12">
            <v-toolbar-title>{{ t('token.title') }}</v-toolbar-title>
          </v-col>
          <v-col
            v-if="compactWosChips.length"
            cols="12"
            class="pt-2"
          >
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-chip
                size="small"
                variant="tonal"
              >
                {{ t('token.summary.wos') }}
              </v-chip>
              <v-chip
                v-for="chip in compactWosChips"
                :key="chip.id"
                :id="`token-summary-${chip.id}`"
                size="small"
                variant="outlined"
              >
                {{ chip.label }}
              </v-chip>
            </div>
          </v-col>
          <v-col
            v-if="compactIcChips.length"
            cols="12"
            class="pt-2"
          >
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-chip
                size="small"
                variant="tonal"
              >
                {{ t('token.summary.ic') }}
              </v-chip>
              <v-chip
                v-for="chip in compactIcChips"
                :key="chip.id"
                :id="`token-summary-${chip.id}`"
                size="small"
                variant="outlined"
              >
                {{ chip.label }}
              </v-chip>
            </div>
          </v-col>
          <v-col
            v-if="wosValidationErrorChip"
            cols="12"
            class="pt-2"
          >
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-chip
                :id="`token-summary-wos-error`"
                size="small"
                color="error"
                variant="outlined"
              >
                {{ wosValidationErrorChip.label }}
              </v-chip>
            </div>
          </v-col>
          <v-col
            v-if="icValidationErrorChip"
            cols="12"
            class="pt-2"
          >
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-chip
                :id="`token-summary-ic-error`"
                size="small"
                color="error"
                variant="outlined"
              >
                {{ icValidationErrorChip.label }}
              </v-chip>
            </div>
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-progress-linear
        v-if="validationProgress"
        indeterminate
        color="primary"
        absolute
      />
      <v-row
        no-gutters
        class="pt-4"
      >
        <v-col
          md="8"
          lg="6"
        >
          <v-text-field
            :model-value="wosExpandedToken"
            :label="t('token.wos-label')"
            :append-inner-icon="showWosToken ? mdiEyeOff : mdiEye"
            :type="showWosToken ? 'text' : 'password'"
            @click:append-inner="showWosToken = !showWosToken"
            @update:model-value="onWosTokenInput"
            variant="underlined"
          />
        </v-col>
        <v-col
          md="4"
          lg="6"
        >
          <v-btn
            v-if="!wosExpandedToken"
            color="accent"
            class="mt-5 ml-8 text-none"
            @click="openExternal('https://developer.clarivate.com/apis/wos')"
          >
            {{ t('token.request') }}
          </v-btn>
          <v-btn
            v-else
            icon
            variant="outlined"
            class="mt-4 ml-4"
            :title="t('token.verify-wos-title')"
            @click="tokensStore.verifyWosToken()"
          >
            <v-icon :icon="mdiRefresh" />
          </v-btn>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col
          md="8"
          lg="6"
        >
          <v-text-field
            :model-value="icToken"
            :label="t('token.ic-label')"
            :append-inner-icon="showIcToken ? mdiEyeOff : mdiEye"
            :type="showIcToken ? 'text' : 'password'"
            @click:append-inner="showIcToken = !showIcToken"
            @update:model-value="onIcTokenInput"
            variant="underlined"
          />
        </v-col>
        <v-col
          md="4"
          lg="6"
        >
          <v-btn
            v-if="!icToken"
            color="accent"
            class="mt-5 ml-8 text-none"
            @click="openExternal('https://developer.clarivate.com/apis/incites')"
          >
            {{ t('token.request') }}
          </v-btn>
          <v-btn
            v-else
            icon
            variant="outlined"
            class="mt-4 ml-4"
            :title="t('token.verify-ic-title')"
            @click="tokensStore.verifyIcToken()"
          >
            <v-icon :icon="mdiRefresh" />
          </v-btn>
        </v-col>
      </v-row>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
