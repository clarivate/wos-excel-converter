/**
 * Type definitions for the mainApi exposed by the preload bridge
 */

export interface MainApi {
  /**
   * Send a message to the main process
   * @param channel - The IPC channel name
   * @param data - Data to send
   */
  send: (channel: string, ...data: any[]) => void

  /**
   * Listen for events from the main process
   * @param channel - The IPC channel name
   * @param listener - Callback function
   */
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void

  /**
   * Listen for a single event from the main process
   * @param channel - The IPC channel name
   * @param listener - Callback function
   */
  once: (channel: string, listener: (event: any, ...args: any[]) => void) => void

  /**
   * Stop listening for events from the main process
   * @param channel - The IPC channel name
   * @param listener - Callback function to remove
   */
  off: (channel: string, listener: (event: any, ...args: any[]) => void) => void

  /**
   * Invoke an IPC handler and get a response
   * @param channel - The IPC channel name
   * @param data - Data to send
   * @returns Promise with the response
   */
  invoke: {
    (channel: 'msgRequestGetApiTokens'): Promise<{ wosExpandedToken: string; icToken: string }>
    (
      channel: 'msgRequestSetApiTokens',
      payload: { wosExpandedToken?: string; icToken?: string }
    ): Promise<void>
    (
      channel: 'msgRequestVerifyWosToken',
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
    }>
    (
      channel: 'msgRequestVerifyIcToken',
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
    }>
    (channel: 'msgRequestGetQueryDetails'): Promise<{
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
    }>
    (
      channel: 'msgRequestSetQueryDetails',
      payload: Partial<{
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
      }>
    ): Promise<void>
    (
      channel: 'msgRequestValidateWosQuery',
      payload?: Partial<{
        databaseId: string
        edition: string
        lang: string
        createdTimeSpan: string
        modifiedTimeSpan: string
        tcModifiedTimeSpan: string
        usrQuery: string
      }>
    ): Promise<{
      type: 'success' | 'warning' | 'error'
      messageKey: string
      messageParams?: Record<string, string | number>
      recordsFound: number | null
      queryId: number | null
    }>
    (
      channel: 'msgRequestParseIdsFile',
      payload: { filePath: string; allowExpandedIds: boolean }
    ): Promise<{
      ids: string[]
      invalidIds: number
      duplicates: number
      totalRows: number
      error: string | null
    }>
    (channel: string, ...data: any[]): Promise<any>
  }

  /**
   * Send a log message to the main process
   * @param level - Log level ('log', 'warn', 'error', 'info')
   * @param message - Message to log
   */
  sendToLog: (level: string, message: string) => void
}

declare global {
  interface Window {
    /**
     * Main API exposed by the preload bridge
     * Used for IPC communication with the main process
     */
    mainApi: MainApi
  }
}

export {}
