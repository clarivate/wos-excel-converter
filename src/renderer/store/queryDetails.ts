import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type MessageType = 'success' | 'warning' | 'error'

type QueryDetailsPayload = {
  databaseId: string
  edition: string
  lang: string
  createdTimeSpan: string
  modifiedTimeSpan: string
  tcModifiedTimeSpan: string
  usrQuery: string
  disableWosQuery: boolean
  addCitedReferences: boolean
  idsFile: string
  icSchema: { code: string; name: string }
  icEsci: 'y' | 'n'
}

type WosValidationResult = {
  type: MessageType
  messageKey: string
  messageParams?: Record<string, string | number>
  recordsFound: number | null
  queryId: number | null
}

const defaultState: QueryDetailsPayload = {
  databaseId: 'WOS',
  edition: '',
  lang: '',
  createdTimeSpan: '',
  modifiedTimeSpan: '',
  tcModifiedTimeSpan: '',
  usrQuery: 'TS=covid* and PY=2020',
  disableWosQuery: false,
  addCitedReferences: true,
  idsFile: '',
  icSchema: { code: 'wos', name: 'Web of Science' },
  icEsci: 'n'
}

export const icSchemaOptions: Array<{ code: string; name: string }> = [
  { code: 'anvur', name: 'ANVUR' },
  { code: 'for1', name: 'Australia ERA 2018 FOR Level 1' },
  { code: 'for2', name: 'Australia ERA 2018 FOR Level 2' },
  { code: 'capesl1', name: 'CAPES Level 1' },
  { code: 'capesl2', name: 'CAPES Level 2' },
  { code: 'capesl3', name: 'CAPES Level 3' },
  { code: 'scadcl1', name: 'China SCADC Subject Categories 12 Broad levels' },
  { code: 'scadcl2', name: 'China SCADC Subject Categories 77 Narrow levels' },
  { code: 'ct', name: 'Citation Topics' },
  { code: 'esi', name: 'Essential Science Indicators' },
  { code: 'fapesp', name: 'FAPESP' },
  { code: 'gipp', name: 'GIPP' },
  { code: 'kakenl2', name: 'KAKEN Level 2' },
  { code: 'kakenl3', name: 'KAKEN Level 3' },
  { code: 'oecd', name: 'OECD' },
  { code: 'pl19', name: 'Polish classification of disciplines' },
  { code: 'ris3', name: 'Research and Innovation Strategies for Specialization (RIS3)' },
  { code: 'ref2008', name: 'UK REF 2008' },
  { code: 'ref2014', name: 'UK REF 2014' },
  { code: 'ref2021', name: 'UK REF 2021' },
  { code: 'wos', name: 'Web of Science' },
  { code: 'sdg', name: 'United Nations Sustainable Development Goals' }
]

export const useQueryDetailsStore = defineStore('queryDetails', () => {
  const AUTO_VALIDATE_DELAY_MS = 450

  const databaseId = ref(defaultState.databaseId)
  const edition = ref(defaultState.edition)
  const lang = ref(defaultState.lang)
  const createdTimeSpan = ref(defaultState.createdTimeSpan)
  const modifiedTimeSpan = ref(defaultState.modifiedTimeSpan)
  const tcModifiedTimeSpan = ref(defaultState.tcModifiedTimeSpan)
  const usrQuery = ref(defaultState.usrQuery)
  const disableWosQuery = ref(defaultState.disableWosQuery)
  const addCitedReferences = ref(defaultState.addCitedReferences)
  const idsFile = ref(defaultState.idsFile)
  const icSchema = ref(defaultState.icSchema)
  const icEsci = ref<'y' | 'n'>(defaultState.icEsci)

  const fileContent = ref<string[]>([])
  const invalidIds = ref(0)
  const duplicates = ref(0)
  const fileReadError = ref<string | null>(null)

  const wosValidationType = ref<MessageType | null>(null)
  const wosValidationMessageKey = ref<string | null>(null)
  const wosValidationMessageParams = ref<Record<string, string | number> | undefined>(undefined)
  const wosRecordsFound = ref<number | null>(null)
  const wosQueryId = ref<number | null>(null)
  const validationInProgress = ref(false)
  let autoValidateTimer: ReturnType<typeof setTimeout> | null = null
  let latestValidationRunId = 0

  const queryPreview = computed(() =>
    usrQuery.value.length > 60 ? `${usrQuery.value.slice(0, 60)}...` : usrQuery.value
  )

  const queryValidated = computed(() => !disableWosQuery.value && !!wosValidationType.value)

  const panelStatusColor = computed(() => {
    if (!disableWosQuery.value) {
      return wosValidationType.value
    }

    if (!idsFile.value || fileReadError.value || fileContent.value.length === 0) {
      return 'error'
    }
    return 'success'
  })

  const showStatusIcon = computed(() => {
    return panelStatusColor.value === 'success' || panelStatusColor.value === 'warning'
  })

  async function loadQueryDetails(): Promise<void> {
    if (autoValidateTimer) {
      clearTimeout(autoValidateTimer)
      autoValidateTimer = null
    }

    const payload = await window.mainApi.invoke('msgRequestGetQueryDetails')
    databaseId.value = payload.databaseId
    edition.value = payload.edition
    lang.value = payload.lang
    createdTimeSpan.value = payload.createdTimeSpan
    modifiedTimeSpan.value = payload.modifiedTimeSpan
    tcModifiedTimeSpan.value = payload.tcModifiedTimeSpan
    usrQuery.value = payload.usrQuery
    disableWosQuery.value = payload.disableWosQuery
    addCitedReferences.value = payload.addCitedReferences
    idsFile.value = payload.idsFile
    icSchema.value = payload.icSchema
    icEsci.value = payload.icEsci

    if (idsFile.value) {
      fileReadError.value = null
      fileContent.value = []
      invalidIds.value = 0
      duplicates.value = 0
    }

    wosValidationType.value = null
    wosValidationMessageKey.value = null
    wosValidationMessageParams.value = undefined
    wosRecordsFound.value = null
    wosQueryId.value = null
  }

  const payloadAffectsWosValidation = (payload: Partial<QueryDetailsPayload>): boolean => {
    return (
      typeof payload.databaseId === 'string' ||
      typeof payload.edition === 'string' ||
      typeof payload.lang === 'string' ||
      typeof payload.createdTimeSpan === 'string' ||
      typeof payload.modifiedTimeSpan === 'string' ||
      typeof payload.tcModifiedTimeSpan === 'string' ||
      typeof payload.usrQuery === 'string'
    )
  }

  const scheduleAutoValidate = (): void => {
    if (disableWosQuery.value) return

    if (autoValidateTimer) {
      clearTimeout(autoValidateTimer)
    }

    autoValidateTimer = setTimeout(() => {
      autoValidateTimer = null
      void validateWosQuery()
    }, AUTO_VALIDATE_DELAY_MS)
  }

  const normalizeWosTimeSpans = (
    currentDatabaseId: string,
    nextCreatedTimeSpan: string,
    nextModifiedTimeSpan: string,
    nextTcModifiedTimeSpan: string
  ): { createdTimeSpan: string; modifiedTimeSpan: string; tcModifiedTimeSpan: string } => {
    if (currentDatabaseId === 'WOK') {
      return {
        createdTimeSpan: nextCreatedTimeSpan,
        modifiedTimeSpan: '',
        tcModifiedTimeSpan: ''
      }
    }

    if (nextCreatedTimeSpan) {
      return {
        createdTimeSpan: nextCreatedTimeSpan,
        modifiedTimeSpan: '',
        tcModifiedTimeSpan: ''
      }
    }

    if (nextModifiedTimeSpan) {
      return {
        createdTimeSpan: '',
        modifiedTimeSpan: nextModifiedTimeSpan,
        tcModifiedTimeSpan: ''
      }
    }

    if (nextTcModifiedTimeSpan) {
      return {
        createdTimeSpan: '',
        modifiedTimeSpan: '',
        tcModifiedTimeSpan: nextTcModifiedTimeSpan
      }
    }

    return {
      createdTimeSpan: '',
      modifiedTimeSpan: '',
      tcModifiedTimeSpan: ''
    }
  }

  async function updateQueryDetails(payload: Partial<QueryDetailsPayload>): Promise<void> {
    const nextDatabaseId =
      typeof payload.databaseId === 'string' ? payload.databaseId : databaseId.value
    const hasTimeSpanUpdate =
      typeof payload.createdTimeSpan === 'string' ||
      typeof payload.modifiedTimeSpan === 'string' ||
      typeof payload.tcModifiedTimeSpan === 'string' ||
      nextDatabaseId === 'WOK'

    const payloadToPersist: Partial<QueryDetailsPayload> = { ...payload }
    if (hasTimeSpanUpdate) {
      const normalized = normalizeWosTimeSpans(
        nextDatabaseId,
        typeof payload.createdTimeSpan === 'string'
          ? payload.createdTimeSpan
          : createdTimeSpan.value,
        typeof payload.modifiedTimeSpan === 'string'
          ? payload.modifiedTimeSpan
          : modifiedTimeSpan.value,
        typeof payload.tcModifiedTimeSpan === 'string'
          ? payload.tcModifiedTimeSpan
          : tcModifiedTimeSpan.value
      )
      payloadToPersist.createdTimeSpan = normalized.createdTimeSpan
      payloadToPersist.modifiedTimeSpan = normalized.modifiedTimeSpan
      payloadToPersist.tcModifiedTimeSpan = normalized.tcModifiedTimeSpan
    }

    await window.mainApi.invoke('msgRequestSetQueryDetails', payloadToPersist)

    if (typeof payloadToPersist.databaseId === 'string') {
      databaseId.value = payloadToPersist.databaseId
    }
    if (typeof payloadToPersist.edition === 'string') edition.value = payloadToPersist.edition
    if (typeof payloadToPersist.lang === 'string') lang.value = payloadToPersist.lang
    if (typeof payloadToPersist.createdTimeSpan === 'string')
      createdTimeSpan.value = payloadToPersist.createdTimeSpan
    if (typeof payloadToPersist.modifiedTimeSpan === 'string')
      modifiedTimeSpan.value = payloadToPersist.modifiedTimeSpan
    if (typeof payloadToPersist.tcModifiedTimeSpan === 'string')
      tcModifiedTimeSpan.value = payloadToPersist.tcModifiedTimeSpan
    if (typeof payloadToPersist.usrQuery === 'string') usrQuery.value = payloadToPersist.usrQuery
    if (typeof payloadToPersist.disableWosQuery === 'boolean')
      disableWosQuery.value = payloadToPersist.disableWosQuery
    if (typeof payloadToPersist.addCitedReferences === 'boolean') {
      addCitedReferences.value = payloadToPersist.addCitedReferences
    }
    if (typeof payloadToPersist.idsFile === 'string') idsFile.value = payloadToPersist.idsFile
    if (payloadToPersist.icSchema) icSchema.value = payloadToPersist.icSchema
    if (payloadToPersist.icEsci) icEsci.value = payloadToPersist.icEsci

    if (payloadAffectsWosValidation(payloadToPersist)) {
      scheduleAutoValidate()
    }
  }

  async function validateWosQuery(): Promise<WosValidationResult> {
    if (autoValidateTimer) {
      clearTimeout(autoValidateTimer)
      autoValidateTimer = null
    }

    const currentRunId = ++latestValidationRunId
    validationInProgress.value = true
    try {
      const result = await window.mainApi.invoke('msgRequestValidateWosQuery', {
        databaseId: databaseId.value,
        edition: edition.value,
        lang: lang.value,
        createdTimeSpan: createdTimeSpan.value,
        modifiedTimeSpan: modifiedTimeSpan.value,
        tcModifiedTimeSpan: tcModifiedTimeSpan.value,
        usrQuery: usrQuery.value
      })

      if (currentRunId === latestValidationRunId) {
        wosValidationType.value = result.type
        wosValidationMessageKey.value = result.messageKey
        wosValidationMessageParams.value = result.messageParams
        wosRecordsFound.value = result.recordsFound
        wosQueryId.value = result.queryId
      }

      return result
    } finally {
      if (currentRunId === latestValidationRunId) {
        validationInProgress.value = false
      }
    }
  }

  async function chooseIdsFile(allowExpandedIds: boolean): Promise<void> {
    const result = await window.mainApi.invoke('msgOpenFile', 'text')
    const filePath = result?.filePaths?.[0] ?? ''
    await updateQueryDetails({ idsFile: filePath })
    await parseIdsFile(allowExpandedIds)
  }

  async function clearIdsFile(): Promise<void> {
    await updateQueryDetails({ idsFile: '' })
    fileContent.value = []
    invalidIds.value = 0
    duplicates.value = 0
    fileReadError.value = null
  }

  async function parseIdsFile(allowExpandedIds: boolean): Promise<void> {
    if (!idsFile.value) {
      fileContent.value = []
      invalidIds.value = 0
      duplicates.value = 0
      fileReadError.value = null
      return
    }

    const parsed = await window.mainApi.invoke('msgRequestParseIdsFile', {
      filePath: idsFile.value,
      allowExpandedIds
    })
    fileContent.value = parsed.ids
    invalidIds.value = parsed.invalidIds
    duplicates.value = parsed.duplicates
    fileReadError.value = parsed.error
  }

  return {
    databaseId,
    edition,
    lang,
    createdTimeSpan,
    modifiedTimeSpan,
    tcModifiedTimeSpan,
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
    panelStatusColor,
    showStatusIcon,
    loadQueryDetails,
    updateQueryDetails,
    validateWosQuery,
    chooseIdsFile,
    clearIdsFile,
    parseIdsFile
  }
})
