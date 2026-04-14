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

const openQueryPanel = async (page: any): Promise<void> => {
  const queryTitle = page.getByText('Query Details', { exact: true }).first()
  await expect(queryTitle).toBeVisible()
  await queryTitle.click()

  const idsButton = page.locator('#query-ids-file-btn')
  if (!(await idsButton.isVisible())) {
    await queryTitle.click()
  }
}

const seedLiveWosState = async (page: any, usrQuery: string): Promise<void> => {
  await page.evaluate(
    ({ token, query }) =>
      Promise.all([
        window.mainApi.invoke('msgRequestSetApiTokens', {
          wosExpandedToken: token
        }),
        window.mainApi.invoke('msgRequestSetQueryDetails', {
          databaseId: 'WOS',
          edition: '',
          lang: '',
          createdTimeSpan: '',
          modifiedTimeSpan: '',
          tcModifiedTimeSpan: '',
          usrQuery: query,
          disableWosQuery: false
        })
      ]),
    { token: wosExpandedToken, query: usrQuery }
  )

  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await openQueryPanel(page)
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

  test('validates a live successful WOS query', async ({ page }) => {
    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          wosExpandedToken: token
        }),
      wosExpandedToken
    )

    const result = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestValidateWosQuery', {
        databaseId: 'WOS',
        usrQuery: 'PY=2017'
      })
    )

    expect(result.type).toBe('success')
    expect(result.messageKey).toBe('query.validation.success')
    expect(typeof result.recordsFound).toBe('number')
    expect(result.recordsFound).toBeGreaterThan(0)
    expect(result.queryId === null || typeof result.queryId === 'number').toBe(true)
  })

  test('returns a user-friendly error for an invalid live WOS query', async ({ page }) => {
    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          wosExpandedToken: token
        }),
      wosExpandedToken
    )

    const result = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestValidateWosQuery', {
        databaseId: 'WOS',
        usrQuery: 'PYS=2017'
      })
    )

    expect(result.type).toBe('error')
    expect(result.messageKey).toBe('query.validation.error')
    expect(result.recordsFound).toBeNull()
    expect(result.queryId).toBeNull()
    expect(result.messageParams?.error).toContain('PYS')
    expect(result.messageParams?.error).toContain('field tag')
  })

  test('reuses the same records-found and error feedback patterns in summary and WOS dialog', async ({
    page
  }) => {
    await seedLiveWosState(page, 'PY=2017')

    const summaryRecordsChip = page.locator('#query-summary-chip-records-found')
    await expect(summaryRecordsChip).toBeVisible({ timeout: 15000 })
    await expect(summaryRecordsChip).toContainText('Records found')

    const wosButton = page.locator('#query-open-wos-dialog-btn')
    await expect(wosButton).toBeEnabled({ timeout: 15000 })
    await wosButton.click()

    const dialogRecordsChip = page.locator('#query-validation-records')
    await expect(dialogRecordsChip).toBeVisible({ timeout: 15000 })
    await expect(dialogRecordsChip).toContainText('Records found')

    await page.locator('#query-validate-btn').click()
    await expect(dialogRecordsChip).toBeVisible({ timeout: 15000 })

    await page.getByText('Close', { exact: true }).click()

    await seedLiveWosState(page, 'PYS=2017')

    const summaryErrorChip = page.locator('#query-summary-message')
    await expect(summaryErrorChip).toBeVisible({ timeout: 15000 })
    await expect(summaryErrorChip).toContainText('Unknown field tag "PYS"')

    await page.locator('#query-open-wos-dialog-btn').click()
    const dialogErrorChip = page.locator('#query-validation-alert')
    await expect(dialogErrorChip).toBeVisible({ timeout: 15000 })
    await expect(dialogErrorChip).toContainText('Unknown field tag "PYS"')
    await page.getByText('Close', { exact: true }).click()
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
})
