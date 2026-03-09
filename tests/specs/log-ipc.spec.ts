import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

test.describe('Log IPC Handler Tests', () => {
  // @ts-expect-error: `util` is not using types in playwright
  test('IPC: msgRequestLogLines with default parameter', async ({ page, util }) => {
    try {
      // Call without parameters (should use default 100 lines)
      const logLines = await page.evaluate(async () => {
        return await window.mainApi.invoke('msgRequestLogLines')
      })

      expect(typeof logLines).toBe('string')
      expect(logLines.length).toBeGreaterThan(0)

      await util.captureScreenshot(page, 'ipc-log-lines-default')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('IPC: msgRequestLogFileSize returns formatted size', async ({ page, util }) => {
    try {
      const fileSize = await page.evaluate(async () => {
        return await window.mainApi.invoke('msgRequestLogFileSize')
      })

      // Verify we got a string response
      expect(typeof fileSize).toBe('string')

      // Should match format: "X B", "X KB", "X MB", or "X GB"
      expect(fileSize).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/)

      await util.captureScreenshot(page, 'ipc-log-file-size')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('IPC: msgOpenLogFile does not throw error', async ({ page, util }) => {
    try {
      // This IPC call opens the log file externally
      // We just verify it doesn't throw an error
      const result = await page.evaluate(async () => {
        try {
          await window.mainApi.send('msgOpenLogFile')
          return 'success'
        } catch (error) {
          return 'error: ' + error.message
        }
      })

      expect(result).toBe('success')

      await util.captureScreenshot(page, 'ipc-open-log-file')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('IPC: onLog event is received in renderer', async ({ page, util }) => {
    try {
      // Set up listener for log events
      const logReceived = await page.evaluate(async () => {
        return new Promise((resolve) => {
          let received = false
          const handler = (_event: any, message: string) => {
            if (message && message.length > 0) {
              received = true
              window.mainApi.off('onLog', handler)
              resolve(true)
            }
          }
          window.mainApi.on('onLog', handler)

          // Trigger a log by throwing an error
          window.mainApi.sendToLog('info', 'Test log message for IPC test')

          // Timeout after 2 seconds
          setTimeout(() => {
            window.mainApi.off('onLog', handler)
            resolve(received)
          }, 2000)
        })
      })

      expect(logReceived).toBe(true)

      await util.captureScreenshot(page, 'ipc-on-log-event')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('IPC: Log lines are limited to requested amount', async ({ page, util }) => {
    try {
      // Request only 10 lines
      const logLines = await page.evaluate(async () => {
        return await window.mainApi.invoke('msgRequestLogLines', 10)
      })

      const lines = logLines.split('\n').filter((line: string) => line.trim().length > 0)

      // Should have approximately 10 lines (give or take for edge cases)
      expect(lines.length).toBeLessThanOrEqual(15) // Some buffer for edge cases
      expect(lines.length).toBeGreaterThan(0)

      await util.captureScreenshot(page, 'ipc-log-lines-limited')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('IPC: Multiple consecutive log requests work correctly', async ({ page, util }) => {
    try {
      // Make multiple consecutive requests
      const results = await page.evaluate(async () => {
        const r1 = await window.mainApi.invoke('msgRequestLogLines', 10)
        const r2 = await window.mainApi.invoke('msgRequestLogFileSize')
        const r3 = await window.mainApi.invoke('msgRequestLogLines', 20)

        return {
          request1: r1,
          request2: r2,
          request3: r3
        }
      })

      expect(typeof results.request1).toBe('string')
      expect(typeof results.request2).toBe('string')
      expect(typeof results.request3).toBe('string')

      expect(results.request1.length).toBeGreaterThan(0)
      expect(results.request2).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/)
      expect(results.request3.length).toBeGreaterThan(0)

      await util.captureScreenshot(page, 'ipc-multiple-requests')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })
})
