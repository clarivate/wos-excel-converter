import { BrowserWindow, dialog, ipcMain, IpcMainEvent, shell } from 'electron'
import log from 'electron-log/main'
import { readFile } from 'node:fs/promises'
import Constants from './utils/Constants'
import VersionChecker from './apis/version_checker'
import ConfigStore from './apis/configs/store'
import { LogManager, LOG_CONFIG } from './utils/LogManager'
import WosExpanded from './apis/wos'
import InCites from './apis/incites'

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

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(): void {
    const configStore = ConfigStore.getInstance()
    const safeErrorMessage = (error: unknown): string => {
      const responseMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message.trim()
          : null

      if (responseMessage) {
        const parserPrefix = /^Server\.Parser\.[^,]+,\s*Translation Exception\s*:\s*/i
        const normalizedMessage = responseMessage.replace(parserPrefix, '').trim()
        const illegalTagMatch = normalizedMessage.match(/^Illegal tag name\s+([A-Z0-9_]+)/i)

        if (illegalTagMatch) {
          return `Unknown field tag "${illegalTagMatch[1]}". Check the field tags and query syntax.`
        }

        return normalizedMessage
      }

      if (error instanceof Error) return error.message
      if (typeof error === 'string') return error
      return 'Unknown error'
    }

    const normalizeWosTimeSpans = (
      databaseId: string,
      createdTimeSpan: string | null | undefined,
      modifiedTimeSpan: string | null | undefined,
      tcModifiedTimeSpan: string | null | undefined
    ): {
      createdTimeSpan: string
      modifiedTimeSpan: string | null
      tcModifiedTimeSpan: string | null
    } => {
      const created = createdTimeSpan ?? ''
      const modified = modifiedTimeSpan ?? ''
      const tcModified = tcModifiedTimeSpan ?? ''

      if (databaseId === 'WOK') {
        return {
          createdTimeSpan: created,
          modifiedTimeSpan: null,
          tcModifiedTimeSpan: null
        }
      }

      if (created) {
        return {
          createdTimeSpan: created,
          modifiedTimeSpan: null,
          tcModifiedTimeSpan: null
        }
      }

      if (modified) {
        return {
          createdTimeSpan: '',
          modifiedTimeSpan: modified,
          tcModifiedTimeSpan: null
        }
      }

      if (tcModified) {
        return {
          createdTimeSpan: '',
          modifiedTimeSpan: null,
          tcModifiedTimeSpan: tcModified
        }
      }

      return {
        createdTimeSpan: '',
        modifiedTimeSpan: null,
        tcModifiedTimeSpan: null
      }
    }

    log.hooks.push((message, transport) => {
      if (transport === log.transports.file) {
        if (typeof log.transports.file.format === 'string') {
          const text = log.transports.file.format
            .replace('{y}', message.date.getFullYear().toString())
            .replace('{m}', (message.date.getMonth() + 1).toString().padStart(2, '0'))
            .replace('{d}', message.date.getDate().toString().padStart(2, '0'))
            .replace('{h}', message.date.getHours().toString().padStart(2, '0'))
            .replace('{i}', message.date.getMinutes().toString().padStart(2, '0'))
            .replace('{s}', message.date.getSeconds().toString().padStart(2, '0'))
            .replace('{ms}', message.date.getMilliseconds().toString().padStart(3, '0'))
            .replace('{level}', message.level)
            .replace('{text}', message.data.join(' '))
          BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send('onLog', text)
          })

          // Check if log file needs archiving
          LogManager.checkAndArchiveLogFile()
        }
      }
      return message
    })
    ipcMain.on('renderer-log', (_event, { level, message }) => {
      if (log[level]) {
        log[level](`[Renderer] ${message}`)
      } else {
        log.info(`[Renderer] ${message}`)
      }
    })

    // Open the application log file
    ipcMain.on('msgOpenLogFile', async () => {
      await shell.openPath(LOG_CONFIG.LOG_FILE_PATH)
    })

    // Read the last N lines from the log file
    ipcMain.handle(
      'msgRequestLogLines',
      async (
        _event: IpcMainEvent,
        lines: number = LOG_CONFIG.MAX_LINES_TO_READ
      ): Promise<string> => {
        return LogManager.readLastLines(lines)
      }
    )

    // Get log file size
    ipcMain.handle('msgRequestLogFileSize', async (_event: IpcMainEvent): Promise<string> => {
      return LogManager.getLogFileSize()
    })

    // Get the application version
    ipcMain.handle('msgRequestGetVersion', (): string => {
      return Constants.APP_VERSION
    })

    // Fetch the latest version from GitHub
    ipcMain.handle('msgRequestGetNewVersion', async (): Promise<string> => {
      return await VersionChecker.getInstance().getCurrentVersion()
    })

    // Config management
    ipcMain.handle('msgRequestGetAllConfigNames', async (): Promise<string[]> => {
      return await configStore.getAllConfigNames()
    })

    ipcMain.handle('msgRequestGetConfigName', async (): Promise<string> => {
      return await configStore.getConfigName()
    })

    ipcMain.handle('msgRequestChangeConfig', async (_event, configName: string): Promise<void> => {
      await configStore.changeConfig(configName)
    })

    ipcMain.handle('msgRequestCopyConfig', async (): Promise<string> => {
      return await configStore.copyConfig()
    })

    ipcMain.handle('msgRequestRenameConfig', async (_event, newName: string): Promise<void> => {
      await configStore.renameConfig(newName)
    })

    ipcMain.handle('msgRequestDeleteConfig', async (): Promise<void> => {
      await configStore.deleteCurrent()
    })

    ipcMain.handle(
      'msgRequestGetApiTokens',
      async (): Promise<{ wosExpandedToken: string; icToken: string }> => {
        const [wosExpandedToken, icToken] = await Promise.all([
          configStore.getWosToken(),
          configStore.getIcToken()
        ])
        return { wosExpandedToken, icToken }
      }
    )

    ipcMain.handle(
      'msgRequestSetApiTokens',
      async (_event, payload: { wosExpandedToken?: string; icToken?: string }): Promise<void> => {
        if (typeof payload.wosExpandedToken === 'string') {
          await configStore.setWosToken(payload.wosExpandedToken)
        }
        if (typeof payload.icToken === 'string') {
          await configStore.setIcToken(payload.icToken)
        }
      }
    )

    ipcMain.handle('msgRequestGetQueryDetails', async (): Promise<QueryDetailsPayload> => {
      const [
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
        icEsci
      ] = await Promise.all([
        configStore.getWosDatabaseId(),
        configStore.getWosEdition(),
        configStore.getWosLang(),
        configStore.getWosTimeSpan(),
        configStore.getModifiedTimeSpan(),
        configStore.getTcModifiedTimeSpan(),
        configStore.getWosUsrQuery(),
        configStore.getDisableWosQuery(),
        configStore.getAddCitedReferences(),
        configStore.getIdsFile(),
        configStore.getIcSchema(),
        configStore.getEsci()
      ])

      return {
        databaseId,
        edition,
        lang,
        createdTimeSpan,
        modifiedTimeSpan: modifiedTimeSpan ?? '',
        tcModifiedTimeSpan: tcModifiedTimeSpan ?? '',
        usrQuery,
        disableWosQuery,
        addCitedReferences,
        idsFile,
        icSchema,
        icEsci
      }
    })

    ipcMain.handle(
      'msgRequestSetQueryDetails',
      async (_event, payload: Partial<QueryDetailsPayload>) => {
        // Sequential writes avoid stale read/write overlap with lowdb updates.
        if (typeof payload.databaseId === 'string') {
          await configStore.setWosDatabaseId(payload.databaseId)
        }
        if (typeof payload.edition === 'string') {
          await configStore.setWosEdition(payload.edition)
        }
        if (typeof payload.lang === 'string') {
          await configStore.setWosLang(payload.lang)
        }
        const hasTimeSpanUpdate =
          typeof payload.createdTimeSpan === 'string' ||
          typeof payload.modifiedTimeSpan === 'string' ||
          typeof payload.tcModifiedTimeSpan === 'string' ||
          payload.databaseId === 'WOK'

        if (hasTimeSpanUpdate) {
          const currentDatabaseId = await configStore.getWosDatabaseId()
          const [currentCreated, currentModified, currentTcModified] = await Promise.all([
            configStore.getWosTimeSpan(),
            configStore.getModifiedTimeSpan(),
            configStore.getTcModifiedTimeSpan()
          ])

          const normalized = normalizeWosTimeSpans(
            payload.databaseId ?? currentDatabaseId,
            typeof payload.createdTimeSpan === 'string' ? payload.createdTimeSpan : currentCreated,
            typeof payload.modifiedTimeSpan === 'string'
              ? payload.modifiedTimeSpan
              : currentModified,
            typeof payload.tcModifiedTimeSpan === 'string'
              ? payload.tcModifiedTimeSpan
              : currentTcModified
          )

          await configStore.setWosTimeSpan(normalized.createdTimeSpan)
          await configStore.setModifiedTimeSpan(normalized.modifiedTimeSpan)
          await configStore.setTcModifiedTimeSpan(normalized.tcModifiedTimeSpan)
        }
        if (typeof payload.usrQuery === 'string') {
          await configStore.setWosUsrQuery(payload.usrQuery)
        }
        if (typeof payload.disableWosQuery === 'boolean') {
          await configStore.setDisableWosQuery(payload.disableWosQuery)
        }
        if (typeof payload.addCitedReferences === 'boolean') {
          await configStore.setAddCitedReferences(payload.addCitedReferences)
        }
        if (typeof payload.idsFile === 'string') {
          await configStore.setIdsFile(payload.idsFile)
        }
        if (payload.icSchema) {
          await configStore.setIcSchema(payload.icSchema)
        }
        if (payload.icEsci === 'y' || payload.icEsci === 'n') {
          await configStore.setEsci(payload.icEsci)
        }
      }
    )

    ipcMain.handle(
      'msgRequestValidateWosQuery',
      async (
        _event,
        payload?: Partial<
          Pick<
            QueryDetailsPayload,
            | 'databaseId'
            | 'edition'
            | 'lang'
            | 'createdTimeSpan'
            | 'modifiedTimeSpan'
            | 'tcModifiedTimeSpan'
            | 'usrQuery'
          >
        >
      ): Promise<{
        type: 'success' | 'warning' | 'error'
        messageKey: string
        messageParams?: Record<string, string | number>
        recordsFound: number | null
        queryId: number | null
      }> => {
        const token = await configStore.getWosToken()
        if (!token.trim()) {
          return {
            type: 'warning',
            messageKey: 'query.validation.token-required',
            recordsFound: null,
            queryId: null
          }
        }

        const [
          databaseId,
          edition,
          lang,
          createdTimeSpan,
          modifiedTimeSpan,
          tcModifiedTimeSpan,
          usrQuery
        ] = await Promise.all([
          payload?.databaseId ?? configStore.getWosDatabaseId(),
          payload?.edition ?? configStore.getWosEdition(),
          payload?.lang ?? configStore.getWosLang(),
          payload?.createdTimeSpan ?? configStore.getWosTimeSpan(),
          payload?.modifiedTimeSpan ?? configStore.getModifiedTimeSpan(),
          payload?.tcModifiedTimeSpan ?? configStore.getTcModifiedTimeSpan(),
          payload?.usrQuery ?? configStore.getWosUsrQuery()
        ])

        const normalized = normalizeWosTimeSpans(
          databaseId,
          createdTimeSpan,
          modifiedTimeSpan,
          tcModifiedTimeSpan
        )

        if (!usrQuery?.trim()) {
          return {
            type: 'warning',
            messageKey: 'query.validation.empty',
            recordsFound: null,
            queryId: null
          }
        }

        try {
          const validation = await WosExpanded.getInstance(token)!.validateQuery(
            usrQuery,
            databaseId,
            edition || null,
            lang || null,
            normalized.createdTimeSpan || null,
            normalized.modifiedTimeSpan || null,
            normalized.tcModifiedTimeSpan || null
          )
          return {
            type: 'success',
            messageKey: 'query.validation.success',
            messageParams: {
              recordsFound: validation.recordsFound
            },
            recordsFound: validation.recordsFound,
            queryId: validation.queryId
          }
        } catch (error: unknown) {
          return {
            type: 'error',
            messageKey: 'query.validation.error',
            messageParams: {
              error: safeErrorMessage(error)
            },
            recordsFound: null,
            queryId: null
          }
        }
      }
    )

    ipcMain.handle(
      'msgRequestParseIdsFile',
      async (
        _event,
        payload: { filePath: string; allowExpandedIds: boolean }
      ): Promise<{
        ids: string[]
        invalidIds: number
        duplicates: number
        totalRows: number
        error: string | null
      }> => {
        if (!payload?.filePath) {
          return {
            ids: [],
            invalidIds: 0,
            duplicates: 0,
            totalRows: 0,
            error: null
          }
        }

        try {
          const raw = await readFile(payload.filePath, 'utf-8')
          const rows = raw.split(/\r?\n/)
          const accepted: string[] = []
          let invalidIds = 0

          for (const row of rows) {
            const value = row.trim()
            if (!value) {
              invalidIds++
              continue
            }

            const isValidUt = value.startsWith('UT:')
            const isExpandedOnly = value.startsWith('DOI:') || value.startsWith('PMID:')
            const isValid = isValidUt || (payload.allowExpandedIds && isExpandedOnly)

            if (isValid) {
              accepted.push(value)
            } else {
              invalidIds++
            }
          }

          const unique = [...new Set(accepted)]
          return {
            ids: unique,
            invalidIds,
            duplicates: accepted.length - unique.length,
            totalRows: rows.length,
            error: null
          }
        } catch (error: unknown) {
          return {
            ids: [],
            invalidIds: 0,
            duplicates: 0,
            totalRows: 0,
            error: safeErrorMessage(error)
          }
        }
      }
    )

    ipcMain.handle(
      'msgRequestVerifyWosToken',
      async (
        _event,
        tokenOverride?: string
      ): Promise<{
        type: 'success' | 'warning' | 'error'
        messageKey: string
        messageParams?: Record<string, string | number>
        period: 'Year' | 'Month' | 'Day' | null
        remaining: number | null
        rateLimits: {
          recordsPerDayRemaining: number | null
          recordsPerMonthRemaining: number | null
          recordsPerYearRemaining: number | null
          requestsPerSecondRemaining: number | null
          requestsPerDayRemaining: number | null
          requestsPerYearRemaining: number | null
        }
      }> => {
        const token = tokenOverride ?? (await configStore.getWosToken())
        const emptyWosRateLimits = {
          recordsPerDayRemaining: null,
          recordsPerMonthRemaining: null,
          recordsPerYearRemaining: null,
          requestsPerSecondRemaining: null,
          requestsPerDayRemaining: null,
          requestsPerYearRemaining: null
        }

        if (!token?.trim()) {
          return {
            type: 'warning',
            messageKey: 'token.validation.wos-empty',
            period: null,
            remaining: null,
            rateLimits: emptyWosRateLimits
          }
        }

        try {
          const verification = await WosExpanded.getInstance(token)!.verifyKey()
          return {
            type: 'success',
            messageKey:
              verification.remaining === null
                ? 'token.validation.wos-success-unlimited'
                : 'token.validation.wos-success',
            messageParams:
              verification.remaining === null
                ? undefined
                : {
                    period: verification.period?.toLowerCase() ?? 'day',
                    remaining: verification.remaining
                  },
            period: verification.period,
            remaining: verification.remaining,
            rateLimits: verification.headers
          }
        } catch (error: unknown) {
          return {
            type: 'error',
            messageKey: 'token.validation.wos-error',
            messageParams: {
              error: safeErrorMessage(error)
            },
            period: null,
            remaining: null,
            rateLimits: emptyWosRateLimits
          }
        }
      }
    )

    ipcMain.handle(
      'msgRequestVerifyIcToken',
      async (
        _event,
        tokenOverride?: string
      ): Promise<{
        type: 'success' | 'warning' | 'error'
        messageKey: string
        messageParams?: Record<string, string | number>
        remainingPerDay: number | null
        rateLimits: {
          requestsPerDayRemaining: number | null
          requestsPerDayLimit: number | null
          requestsPerSecondRemaining: number | null
          requestsPerSecondLimit: number | null
          rateLimitRemaining: number | null
          rateLimitResetSeconds: number | null
        }
      }> => {
        const token = tokenOverride ?? (await configStore.getIcToken())
        const emptyIcRateLimits = {
          requestsPerDayRemaining: null,
          requestsPerDayLimit: null,
          requestsPerSecondRemaining: null,
          requestsPerSecondLimit: null,
          rateLimitRemaining: null,
          rateLimitResetSeconds: null
        }

        if (!token?.trim()) {
          return {
            type: 'warning',
            messageKey: 'token.validation.ic-empty',
            remainingPerDay: null,
            rateLimits: emptyIcRateLimits
          }
        }

        try {
          const verification = await InCites.getInstance(token)!.verifyKey()
          return {
            type: 'success',
            messageKey:
              verification.remainingPerDay === null
                ? 'token.validation.ic-success-unlimited'
                : 'token.validation.ic-success',
            messageParams:
              verification.remainingPerDay === null
                ? undefined
                : {
                    remainingPerDay: verification.remainingPerDay
                  },
            remainingPerDay: verification.remainingPerDay,
            rateLimits: verification.headers
          }
        } catch (error: unknown) {
          return {
            type: 'error',
            messageKey: 'token.validation.ic-error',
            messageParams: {
              error: safeErrorMessage(error)
            },
            remainingPerDay: null,
            rateLimits: emptyIcRateLimits
          }
        }
      }
    )

    ipcMain.handle('msgThrowError', (_event, msg: string): void => {
      const error = new Error(msg)
      log.error(error)
      throw error
    })

    // Open url via web browser
    ipcMain.on('msgOpenExternalLink', async (_event: IpcMainEvent, url: string) => {
      await shell.openExternal(url)
    })

    // Open file
    ipcMain.handle('msgOpenFile', async (_event: IpcMainEvent, filter: string) => {
      const filters = []
      if (filter === 'text') {
        filters.push({ name: 'Text', extensions: ['txt', 'json'] })
      } else if (filter === 'zip') {
        filters.push({ name: 'Zip', extensions: ['zip'] })
      }

      return await dialog.showOpenDialog({
        properties: ['openFile'],
        filters
      })
    })
  }
}
