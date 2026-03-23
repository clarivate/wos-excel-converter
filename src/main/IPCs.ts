import { BrowserWindow, dialog, ipcMain, IpcMainEvent, shell } from 'electron'
import log from 'electron-log/main'
import Constants from './utils/Constants'
import VersionChecker from './apis/version_checker'
import ConfigStore from './apis/configs/store'
import { LogManager, LOG_CONFIG } from './utils/LogManager'
import WosExpanded from './apis/wos'
import InCites from './apis/incites'

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(): void {
    const configStore = ConfigStore.getInstance()
    const safeErrorMessage = (error: unknown): string => {
      if (error instanceof Error) return error.message
      if (typeof error === 'string') return error
      return 'Unknown error'
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
