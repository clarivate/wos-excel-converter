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
  wosTokenMessage,
  wosTokenMessageType,
  icTokenMessage,
  icTokenMessageType,
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
            v-if="wosTokenMessage && wosExpandedToken"
            cols="12"
            class="pt-2"
          >
            <span :class="`text-${wosTokenMessageType}`">{{ wosTokenMessage }}</span>
          </v-col>
          <v-col
            v-if="icTokenMessage && icToken"
            cols="12"
            class="pt-2"
          >
            <span :class="`text-${icTokenMessageType}`">{{ icTokenMessage }}</span>
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
            title="(Re-)Validate token with Web of Science API servers"
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
            title="(Re-)Validate token with Web of Science API servers"
            @click="tokensStore.verifyIcToken()"
          >
            <v-icon :icon="mdiRefresh" />
          </v-btn>
        </v-col>
      </v-row>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
