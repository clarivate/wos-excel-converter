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
  invoke: (channel: string, ...data: any[]) => Promise<any>

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
