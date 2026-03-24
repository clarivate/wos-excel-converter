import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

test.describe('LogScreen Component Tests', () => {
  // @ts-expect-error: `util` is not using types in playwright
  test('LogScreen navigation does not emit SVG path parse errors', async ({ page, util }) => {
    const svgPathErrors: string[] = []
    const svgErrorMatcher = /<path> attribute d: Expected number/i

    const onPageError = (error: Error) => {
      if (svgErrorMatcher.test(error.message)) {
        svgPathErrors.push(error.message)
      }
    }

    const onConsole = (message: { type: () => string; text: () => string }) => {
      if (message.type() === 'error' && svgErrorMatcher.test(message.text())) {
        svgPathErrors.push(message.text())
      }
    }

    page.on('pageerror', onPageError)
    page.on('console', onConsole)

    try {
      const logButton = page.locator('#log-btn')
      await expect(logButton, 'Confirm Log button exists').toBeVisible()
      await logButton.click()
      await page.waitForTimeout(500)

      expect(page.url(), 'Confirm navigated to log route').toContain('/log')
      expect(svgPathErrors, 'Confirm no SVG path parse errors are logged').toEqual([])

      await util.captureScreenshot(page, 'logscreen-no-svg-parse-errors')
    } catch (error) {
      throw await util.onTestError(error)
    } finally {
      page.off('pageerror', onPageError)
      page.off('console', onConsole)
    }
  })

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

      // Check for log action buttons using stable ids
      const openLogFileBtn = page.locator('#open-log-file-btn')
      await expect(openLogFileBtn, 'Confirm Open Log File button is visible').toBeVisible()

      const throwRendererErrorBtn = page.locator('#throw-renderer-error-btn')
      await expect(
        throwRendererErrorBtn,
        'Confirm Throw Renderer Error button is visible'
      ).toBeVisible()

      const throwMainErrorBtn = page.locator('#throw-main-error-btn')
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

      const textarea = page
        .locator('textarea#application-logs-textarea, .log-textarea textarea')
        .first()
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

      // Get the label by id
      const label = page.locator('#application-logs-textarea-label')
      const labelText = await label.textContent()

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

      // Verify English text on id-anchored controls
      await expect(page.locator('#open-log-file-btn')).toContainText('Open Log File')
      await expect(page.locator('#throw-renderer-error-btn')).toContainText('Throw Renderer Error')
      await expect(page.locator('#throw-main-error-btn')).toContainText('Throw Main Error')
      await expect(page.locator('#application-logs-textarea-label')).toContainText(
        'Application Logs'
      )

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

      // Verify German text on id-anchored controls
      await expect(page.locator('#open-log-file-btn')).toContainText('Log-Datei öffnen')
      await expect(page.locator('#throw-renderer-error-btn')).toContainText(
        'Renderer-Fehler auslösen'
      )
      await expect(page.locator('#throw-main-error-btn')).toContainText('Main-Fehler auslösen')
      await expect(page.locator('#application-logs-textarea-label')).toContainText(
        'Anwendungsprotokolle'
      )

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
      const textarea = page
        .locator('textarea#application-logs-textarea, .log-textarea textarea')
        .first()
      const initialContent = await textarea.inputValue()
      const initialLineCount = initialContent.split('\n').length

      // Trigger a log event by clicking throw renderer error
      const throwRendererErrorBtn = page.locator('#throw-renderer-error-btn')
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
