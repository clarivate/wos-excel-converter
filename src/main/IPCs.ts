import { dialog, ipcMain, IpcMainEvent, shell } from 'electron'
import Constants from './utils/Constants'
import VersionChecker from './apis/version_checker'

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(): void {
    // Get the application version
    ipcMain.handle('msgRequestGetVersion', (): string => {
      return Constants.APP_VERSION
    })

    // Fetch the latest version from GitHub
    ipcMain.handle('msgRequestGetNewVersion', async (): Promise<string> => {
      return await VersionChecker.getInstance().getCurrentVersion()
    })

    // Open url via web browser
    ipcMain.on(
      'msgOpenExternalLink',
      async (event: IpcMainEvent, url: string) => {
        await shell.openExternal(url)
      }
    )

    // Open file
    ipcMain.handle(
      'msgOpenFile',
      async (event: IpcMainEvent, filter: string) => {
        const filters = []
        if (filter === 'text') {
          filters.push({ name: 'Text', extensions: ['txt', 'json'] })
        } else if (filter === 'zip') {
          filters.push({ name: 'Zip', extensions: ['zip'] })
        }
        const dialogResult = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters
        })
        return dialogResult
      }
    )
  }
}
