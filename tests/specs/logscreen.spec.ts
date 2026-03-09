import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

test.describe('LogScreen Component Tests', () => {
  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen navigation and visibility', async ({ page, util }) => {
    try {
      // Navigate to log screen by clicking the log button
      const logButton = page.locator('#log-btn')
      await expect(logButton, 'Confirm Log button exists').toBeVisible()
      await logButton.click()

      // Wait for navigation
      await page.waitForTimeout(500)

      // Verify we're on the log screen by checking URL or content
      const url = page.url()
      expect(url, 'Confirm navigated to log route').toContain('/log')

      await util.captureScreenshot(page, 'logscreen-navigation')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen buttons are visible', async ({ page, util }) => {
    try {
      // Navigate to log screen
      const logButton = page.locator('#log-btn')
      await logButton.click()
      await page.waitForTimeout(500)

      // Check for "Open Log File" button
      const openLogFileBtn = page.getByText(/Open Log File|Log-Datei öffnen/i)
      await expect(openLogFileBtn, 'Confirm Open Log File button is visible').toBeVisible()

      // Check for "Throw Renderer Error" button
      const throwRendererErrorBtn = page.getByText(/Throw Renderer Error|Renderer-Fehler auslösen/i)
      await expect(
        throwRendererErrorBtn,
        'Confirm Throw Renderer Error button is visible'
      ).toBeVisible()

      // Check for "Throw Main Error" button
      const throwMainErrorBtn = page.getByText(/Throw Main Error|Main-Fehler auslösen/i)
      await expect(throwMainErrorBtn, 'Confirm Throw Main Error button is visible').toBeVisible()

      await util.captureScreenshot(page, 'logscreen-buttons')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen textarea is visible and contains logs', async ({ page, util }) => {
    try {
      // Navigate to log screen
      const logButton = page.locator('#log-btn')
      await logButton.click()
      await page.waitForTimeout(1000) // Give time for logs to load

      // Find the textarea (should be a v-textarea component)
      const textarea = page.locator('textarea').first()
      await expect(textarea, 'Confirm log textarea is visible').toBeVisible()

      // Check if textarea has readonly or disabled attribute
      const isReadonly =
        (await textarea.getAttribute('readonly')) !== null ||
        (await textarea.getAttribute('aria-readonly')) === 'true'
      expect(isReadonly, 'Confirm textarea is readonly').toBe(true)

      // Check if textarea has content (logs should be pre-loaded)
      const textContent = await textarea.inputValue()
      expect(textContent.length, 'Confirm logs are loaded').toBeGreaterThan(0)

      await util.captureScreenshot(page, 'logscreen-textarea')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen label shows file size', async ({ page, util }) => {
    try {
      // Navigate to log screen
      const logButton = page.locator('#log-btn')
      await logButton.click()
      await page.waitForTimeout(1000)

      // Find the label that should contain file size
      // In English: "Application Logs - File Size: X KB/MB"
      // In German: "Anwendungsprotokolle - Dateigröße: X KB/MB"
      const labelText = await page
        .locator('label')
        .filter({ hasText: /File Size|Dateigröße/i })
        .first()
        .textContent()

      expect(labelText, 'Confirm label contains file size info').toBeTruthy()
      expect(labelText, 'Confirm file size is displayed in label').toMatch(
        /\d+(\.\d+)?\s*(B|KB|MB|GB)/i
      )

      await util.captureScreenshot(page, 'logscreen-filesize')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen i18n support - English', async ({ page, util }) => {
    try {
      // Make sure we're in English mode
      const langSelector = page.locator('#language-selector-btn')
      await langSelector.click()
      await page.waitForTimeout(300)

      // Select English from menu list
      const enOption = page.locator('#language-menu-list').getByText('en', { exact: true })
      if ((await enOption.count()) > 0) {
        await enOption.click()
        await page.waitForTimeout(500)
      }

      // Navigate to log screen
      const logButton = page.locator('#log-btn')
      await logButton.click()
      await page.waitForTimeout(500)

      // Verify English text
      await expect(page.getByText('Open Log File')).toBeVisible()
      await expect(page.getByText('Throw Renderer Error')).toBeVisible()
      await expect(page.getByText('Throw Main Error')).toBeVisible()

      const label = await page
        .locator('label')
        .filter({ hasText: /Application Logs/i })
        .first()
      await expect(label).toBeVisible()

      await util.captureScreenshot(page, 'logscreen-english')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen i18n support - German', async ({ page, util }) => {
    try {
      // Switch to German
      const langSelector = page.locator('#language-selector-btn')
      await langSelector.click()
      await page.waitForTimeout(300)

      // Select German from menu list
      const deOption = page.locator('#language-menu-list').getByText('de', { exact: true })
      if ((await deOption.count()) > 0) {
        await deOption.click()
        await page.waitForTimeout(600)
      }

      // Navigate to log screen
      const logButton = page.locator('#log-btn')
      await logButton.click()
      await page.waitForTimeout(500)

      // Verify German text
      await expect(page.getByText('Log-Datei öffnen')).toBeVisible()
      await expect(page.getByText('Renderer-Fehler auslösen')).toBeVisible()
      await expect(page.getByText('Main-Fehler auslösen')).toBeVisible()

      // Check label exists (may be hidden by Vuetify CSS)
      const labelCount = await page
        .locator('label')
        .filter({ hasText: /Anwendungsprotokolle/i })
        .count()
      expect(labelCount, 'Confirm German label exists').toBeGreaterThan(0)

      await util.captureScreenshot(page, 'logscreen-german')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen real-time log updates', async ({ page, util }) => {
    try {
      // Navigate to log screen
      const logButton = page.locator('#log-btn')
      await logButton.click()
      await page.waitForTimeout(500)

      // Get initial log content
      const textarea = page.locator('textarea').first()
      const initialContent = await textarea.inputValue()
      const initialLineCount = initialContent.split('\n').length

      // Trigger a log event by clicking throw renderer error
      const throwRendererErrorBtn = page.getByText(/Throw Renderer Error|Renderer-Fehler auslösen/i)
      await throwRendererErrorBtn.click()

      // Wait for log to update
      await page.waitForTimeout(500)

      // Get updated log content
      const updatedContent = await textarea.inputValue()
      const updatedLineCount = updatedContent.split('\n').length

      // Verify logs increased
      expect(updatedLineCount, 'Confirm logs increased after error').toBeGreaterThan(
        initialLineCount
      )

      await util.captureScreenshot(page, 'logscreen-realtime-update')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })
})
