import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type TokenMessageType = 'success' | 'warning' | 'error'

export const useTokensStore = defineStore('tokens', () => {
  const wosExpandedToken = ref('')
  const icToken = ref('')

  const wosTokenMessage = ref<string | null>(null)
  const wosTokenMessageType = ref<TokenMessageType | null>(null)
  const icTokenMessage = ref<string | null>(null)
  const icTokenMessageType = ref<TokenMessageType | null>(null)

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
    wosTokenMessage.value = null
    wosTokenMessageType.value = null
    icTokenMessage.value = null
    icTokenMessageType.value = null
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
      wosTokenMessage.value = null
      wosTokenMessageType.value = null
      return
    }

    wosValidationInProgress.value = true
    try {
      const result = await window.mainApi.invoke('msgRequestVerifyWosToken', token)
      wosTokenMessage.value = result.message
      wosTokenMessageType.value = result.type
    } finally {
      wosValidationInProgress.value = false
    }
  }

  async function verifyIcToken(tokenOverride?: string): Promise<void> {
    const token = tokenOverride ?? icToken.value
    if (!token.trim()) {
      icTokenMessage.value = null
      icTokenMessageType.value = null
      return
    }

    icValidationInProgress.value = true
    try {
      const result = await window.mainApi.invoke('msgRequestVerifyIcToken', token)
      icTokenMessage.value = result.message
      icTokenMessageType.value = result.type
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
    wosTokenMessage,
    wosTokenMessageType,
    icTokenMessage,
    icTokenMessageType,
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
