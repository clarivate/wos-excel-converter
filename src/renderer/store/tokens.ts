import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type TokenMessageType = 'success' | 'warning' | 'error'
type TokenMessageParams = Record<string, string | number>

type WosRateLimits = {
  recordsPerDayRemaining: number | null
  recordsPerMonthRemaining: number | null
  recordsPerYearRemaining: number | null
  requestsPerSecondRemaining: number | null
  requestsPerDayRemaining: number | null
  requestsPerYearRemaining: number | null
}

type IcRateLimits = {
  requestsPerDayRemaining: number | null
  requestsPerDayLimit: number | null
  requestsPerSecondRemaining: number | null
  requestsPerSecondLimit: number | null
  rateLimitRemaining: number | null
  rateLimitResetSeconds: number | null
}

export const useTokensStore = defineStore('tokens', () => {
  const wosExpandedToken = ref('')
  const icToken = ref('')

  const wosTokenMessageKey = ref<string | null>(null)
  const wosTokenMessageParams = ref<TokenMessageParams | undefined>(undefined)
  const wosTokenMessageType = ref<TokenMessageType | null>(null)
  const wosRateLimits = ref<WosRateLimits | null>(null)
  const icTokenMessageKey = ref<string | null>(null)
  const icTokenMessageParams = ref<TokenMessageParams | undefined>(undefined)
  const icTokenMessageType = ref<TokenMessageType | null>(null)
  const icRateLimits = ref<IcRateLimits | null>(null)

  const wosValidationInProgress = ref(false)
  const icValidationInProgress = ref(false)

  const validationProgress = computed(
    () => wosValidationInProgress.value || icValidationInProgress.value
  )

  const wosTokenSucceeded = computed(() => wosTokenMessageType.value === 'success')
  const icTokenSucceeded = computed(() => icTokenMessageType.value === 'success')
  const atLeastOneTokenValid = computed(() => wosTokenSucceeded.value || icTokenSucceeded.value)

  const combinedStatusIcon = computed(() => {
    return atLeastOneTokenValid.value ? 'success' : 'error'
  })

  const combinedStatusColor = computed(() => {
    if (
      (wosTokenSucceeded.value && !icToken.value.length) ||
      (icTokenSucceeded.value && !wosExpandedToken.value.length)
    ) {
      return 'success'
    }
    if (wosTokenSucceeded.value && icTokenSucceeded.value) {
      return 'success'
    }
    if (wosTokenSucceeded.value || icTokenSucceeded.value) {
      return 'warning'
    }
    return 'error'
  })

  async function loadTokens(): Promise<void> {
    const tokens = await window.mainApi.invoke('msgRequestGetApiTokens')
    wosExpandedToken.value = tokens.wosExpandedToken ?? ''
    icToken.value = tokens.icToken ?? ''

    // Clear stale status when switching between configs.
    wosTokenMessageKey.value = null
    wosTokenMessageParams.value = undefined
    wosTokenMessageType.value = null
    wosRateLimits.value = null
    icTokenMessageKey.value = null
    icTokenMessageParams.value = undefined
    icTokenMessageType.value = null
    icRateLimits.value = null
  }

  async function saveWosToken(token: string): Promise<void> {
    wosExpandedToken.value = token
    await window.mainApi.invoke('msgRequestSetApiTokens', { wosExpandedToken: token })
  }

  async function saveIcToken(token: string): Promise<void> {
    icToken.value = token
    await window.mainApi.invoke('msgRequestSetApiTokens', { icToken: token })
  }

  async function verifyWosToken(tokenOverride?: string): Promise<void> {
    const token = tokenOverride ?? wosExpandedToken.value
    if (!token.trim()) {
      wosTokenMessageKey.value = null
      wosTokenMessageParams.value = undefined
      wosTokenMessageType.value = null
      wosRateLimits.value = null
      return
    }

    wosValidationInProgress.value = true
    try {
      const result = await window.mainApi.invoke('msgRequestVerifyWosToken', token)
      wosTokenMessageKey.value = result.messageKey
      wosTokenMessageParams.value = result.messageParams
      wosTokenMessageType.value = result.type
      wosRateLimits.value = result.rateLimits
    } finally {
      wosValidationInProgress.value = false
    }
  }

  async function verifyIcToken(tokenOverride?: string): Promise<void> {
    const token = tokenOverride ?? icToken.value
    if (!token.trim()) {
      icTokenMessageKey.value = null
      icTokenMessageParams.value = undefined
      icTokenMessageType.value = null
      icRateLimits.value = null
      return
    }

    icValidationInProgress.value = true
    try {
      const result = await window.mainApi.invoke('msgRequestVerifyIcToken', token)
      icTokenMessageKey.value = result.messageKey
      icTokenMessageParams.value = result.messageParams
      icTokenMessageType.value = result.type
      icRateLimits.value = result.rateLimits
    } finally {
      icValidationInProgress.value = false
    }
  }

  async function loadAndVerifyExistingTokens(): Promise<void> {
    await loadTokens()
    await Promise.all([
      wosExpandedToken.value.trim() ? verifyWosToken(wosExpandedToken.value) : Promise.resolve(),
      icToken.value.trim() ? verifyIcToken(icToken.value) : Promise.resolve()
    ])
  }

  return {
    wosExpandedToken,
    icToken,
    wosTokenMessageKey,
    wosTokenMessageParams,
    wosTokenMessageType,
    wosRateLimits,
    icTokenMessageKey,
    icTokenMessageParams,
    icTokenMessageType,
    icRateLimits,
    validationProgress,
    wosTokenSucceeded,
    icTokenSucceeded,
    atLeastOneTokenValid,
    combinedStatusIcon,
    combinedStatusColor,
    saveWosToken,
    saveIcToken,
    verifyWosToken,
    verifyIcToken,
    loadAndVerifyExistingTokens
  }
})
