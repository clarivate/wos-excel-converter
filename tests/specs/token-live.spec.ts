import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import { hasTokenEnv, wosExpandedToken, incitesToken } from '../env.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

const openTokenPanel = async (page: any): Promise<void> => {
  const tokenTitle = page.getByText('API Tokens', { exact: true }).first()
  await expect(tokenTitle).toBeVisible()
  await tokenTitle.click()
}

const fillTokenField = async (page: any, label: string, token: string): Promise<void> => {
  const field = page.getByLabel(label).first()
  await expect(field).toBeVisible()
  await field.fill(token)
}

const ensureDarkTheme = async (page: any): Promise<void> => {
  const hasDarkTheme = await page.evaluate(() => !!document.querySelector('.v-theme--dark'))
  if (!hasDarkTheme) {
    await page.locator('#theme-toggle-btn').click()
  }
}

test.describe('@requires-token Token Live Verification', () => {
  test.skip(!hasTokenEnv, 'WOS_EXPANDED_TOKEN and INCITES_TOKEN are required for live token tests')

  // @ts-expect-error: `util` is not using types in playwright
  test('validates live Web of Science token', async ({ page, util }) => {
    await openTokenPanel(page)
    await fillTokenField(page, 'Web of Science API Expanded Token', wosExpandedToken)

    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          wosExpandedToken: token
        }),
      wosExpandedToken
    )

    const result = await page.evaluate(
      (token) => window.mainApi.invoke('msgRequestVerifyWosToken', token),
      wosExpandedToken
    )

    expect(result.type).toBe('success')
    expect(result.period === 'Year' || result.period === 'Month' || result.period === 'Day').toBe(
      true
    )
    expect(result.remaining === null || typeof result.remaining === 'number').toBe(true)

    // WOS may provide one or many REC/REQ headers depending on tenant limits.
    expect(typeof result.rateLimits).toBe('object')
    expect(
      result.rateLimits.recordsPerDayRemaining === null ||
        typeof result.rateLimits.recordsPerDayRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.recordsPerMonthRemaining === null ||
        typeof result.rateLimits.recordsPerMonthRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.recordsPerYearRemaining === null ||
        typeof result.rateLimits.recordsPerYearRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.requestsPerSecondRemaining === null ||
        typeof result.rateLimits.requestsPerSecondRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.requestsPerDayRemaining === null ||
        typeof result.rateLimits.requestsPerDayRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.requestsPerYearRemaining === null ||
        typeof result.rateLimits.requestsPerYearRemaining === 'number'
    ).toBe(true)

    await page.waitForTimeout(800)
    await util.captureScreenshot(page, 'token-live-wos-verified')
  })

  // @ts-expect-error: `util` is not using types in playwright
  test('validates live InCites token', async ({ page, util }) => {
    await openTokenPanel(page)
    await fillTokenField(page, 'InCites API Token', incitesToken)

    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          icToken: token
        }),
      incitesToken
    )

    const result = await page.evaluate(
      (token) => window.mainApi.invoke('msgRequestVerifyIcToken', token),
      incitesToken
    )

    expect(result.type).toBe('success')
    expect(result.remainingPerDay === null || typeof result.remainingPerDay === 'number').toBe(true)

    // InCites only exposes request-oriented rate-limit headers.
    expect(typeof result.rateLimits).toBe('object')
    expect(
      result.rateLimits.requestsPerDayRemaining === null ||
        typeof result.rateLimits.requestsPerDayRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.requestsPerDayLimit === null ||
        typeof result.rateLimits.requestsPerDayLimit === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.requestsPerSecondRemaining === null ||
        typeof result.rateLimits.requestsPerSecondRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.requestsPerSecondLimit === null ||
        typeof result.rateLimits.requestsPerSecondLimit === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.rateLimitRemaining === null ||
        typeof result.rateLimits.rateLimitRemaining === 'number'
    ).toBe(true)
    expect(
      result.rateLimits.rateLimitResetSeconds === null ||
        typeof result.rateLimits.rateLimitResetSeconds === 'number'
    ).toBe(true)

    await page.waitForTimeout(800)
    await util.captureScreenshot(page, 'token-live-incites-verified')
  })

  test('keeps token summary tooltip text readable in dark mode', async ({ page }) => {
    await openTokenPanel(page)
    await fillTokenField(page, 'Web of Science API Expanded Token', wosExpandedToken)

    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          wosExpandedToken: token
        }),
      wosExpandedToken
    )

    await page.evaluate(
      (token) => window.mainApi.invoke('msgRequestVerifyWosToken', token),
      wosExpandedToken
    )

    const summaryChip = page.locator('[id^="token-summary-wos-"]:not([id$="-error"])').first()
    await expect(summaryChip).toBeVisible({ timeout: 10000 })

    await ensureDarkTheme(page)
    await summaryChip.hover()

    const tooltip = page.locator('.token-summary-tooltip').last()
    await expect(tooltip).toBeVisible({ timeout: 5000 })

    const tooltipColor = await tooltip.evaluate((element) => window.getComputedStyle(element).color)
    expect(tooltipColor).not.toBe('rgb(0, 0, 0)')
    expect(tooltipColor.startsWith('rgba(0, 0, 0')).toBe(false)
  })
})
