import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, shell } from 'electron'
import log from 'electron-log/main'
import Constants from './utils/Constants'
import VersionChecker from './apis/version_checker'
import { join } from 'path'

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(): void {
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
      const logPath = join(app.getPath('userData'), 'logs', 'wosapiexporter.log')
      await shell.openPath(logPath)
    })

    // Get the application version
    ipcMain.handle('msgRequestGetVersion', (): string => {
      return Constants.APP_VERSION
    })

    // Fetch the latest version from GitHub
    ipcMain.handle('msgRequestGetNewVersion', async (): Promise<string> => {
      return await VersionChecker.getInstance().getCurrentVersion()
    })

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
