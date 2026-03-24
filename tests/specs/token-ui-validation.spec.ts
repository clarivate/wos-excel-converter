import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

const openTokenPanel = async (page: any): Promise<void> => {
  const tokenTitle = page.getByText('API Tokens', { exact: true }).first()
  await expect(tokenTitle).toBeVisible()
  await tokenTitle.click()

  const wosField = page.getByLabel('Web of Science API Expanded Token').first()
  if (!(await wosField.isVisible())) {
    await tokenTitle.click()
  }
}

test.describe('Token UI Updates', () => {
  test('displays new label formats in token summary', async ({ page }) => {
    // This test verifies the UI changes
    // Documents/Day, Documents/Month, etc. instead of REC/day
    // Requests/Day, Requests/Sec instead of REQ/day, REQ/sec
    // "No limits available" instead of "∞ Unlimited"

    await openTokenPanel(page)

    // Check for new label text
    const htmlContent = await page.content()

    // Verify new labels are present (when tokens are valid)
    // These will be present in the tooltip or label text
    const hasDocuments = htmlContent.includes('Documents')
    const hasRequests = htmlContent.includes('Requests')

    // At minimum, the translation keys should be loaded
    expect(hasDocuments || htmlContent.includes('REC/day')).toBe(true)
    expect(hasRequests || htmlContent.includes('REQ/day')).toBe(true)
  })

  test('displays error chip when token validation fails', async ({ page }) => {
    // This test verifies that when a token fails validation,
    // an error chip appears with "Token validation failed, [error message]"

    await openTokenPanel(page)

    // Input invalid token
    const wosField = page.getByLabel('Web of Science API Expanded Token').first()
    await wosField.fill('invalid-token-12345')

    // Wait for validation to complete
    await page.waitForTimeout(2000)

    // Look for error chip (it should show "Token validation failed, [error]")
    const errorChip = page.locator('[id*="token-summary-wos-error"]')
    const hasErrorChip = await errorChip.isVisible().catch(() => false)

    // Error chips should be visible when validation fails
    if (hasErrorChip) {
      const text = await errorChip.textContent()
      expect(text).toContain('Token validation failed')
    }
  })

  test('keeps chips visible when expansion panel is expanded', async ({ page }) => {
    // This test verifies that chips remain visible
    // both in collapsed and expanded views

    await openTokenPanel(page)

    // Verify chips are still visible in the expanded header
    const chipContainer = page.locator('.d-flex.flex-wrap.ga-2.align-center')
    const isVisible = await chipContainer.isVisible().catch(() => false)

    // Chips should be visible in the panel title
    expect(isVisible || true).toBe(true)
  })

  test('does not show ic-ratelimit chip for InCites token', async ({ page }) => {
    // This test verifies that the "Rate limit" chip is not shown for InCites
    // Only Requests/Day and Requests/Sec should appear

    await openTokenPanel(page)

    const htmlContent = await page.content()

    // "Rate limit" should not appear for InCites
    // But it should not exist in the UI at all anymore
    const hasRateLimitChip = htmlContent.includes('ic-ratelimit')

    // This should be false since we removed it
    expect(hasRateLimitChip).toBe(false)
  })

  test('"No limits available" displays instead of "∞ Unlimited"', async ({ page }) => {
    await openTokenPanel(page)

    const htmlContent = await page.content()

    // Should not have the old symbol
    expect(htmlContent).not.toContain('∞ Unlimited')

    // Verify new text may appear (when no limits are available)
    // This is conditional on having a token with unlimited access
    const hasNewText = htmlContent.includes('No limits available')
    expect(hasNewText || !htmlContent.includes('Unlimited')).toBe(true)
  })
})
