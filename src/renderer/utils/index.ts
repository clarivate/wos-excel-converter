export function getCurrentLocale(): string {
  return navigator?.language?.split('-')[0] || 'en'
}

export async function openExternal(url: string): Promise<void> {
  await window.mainApi.send('msgOpenExternalLink', url)
}

export async function openFile(type: string): Promise<any> {
  return window.mainApi.invoke('msgOpenFile', type)
}

export function openLogFile(): void {
  return window.mainApi.send('msgOpenLogFile')
}

export async function newVersion(): Promise<string> {
  return window.mainApi.invoke('msgRequestGetNewVersion')
}

export async function getAppVersion(): Promise<string> {
  return window.mainApi.invoke('msgRequestGetVersion')
}

export function throwError(msg: string, main: boolean = true) {
  if (main) window.mainApi.invoke('msgThrowError', msg)
  else throw new Error(msg)
}
