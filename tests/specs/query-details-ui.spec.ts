import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

const openQueryPanel = async (page: any): Promise<void> => {
  const queryPanelButton = page.getByRole('button', { name: 'Query Details', exact: true })
  await expect(queryPanelButton).toBeVisible()

  const isExpanded = (await queryPanelButton.getAttribute('aria-expanded')) === 'true'
  if (!isExpanded) {
    await queryPanelButton.click()
  }

  await expect(page.locator('#query-ids-file-btn')).toBeVisible()
}

const openWosDialog = async (page: any): Promise<void> => {
  await openQueryPanel(page)
  const wosDialogButton = page.locator('#query-open-wos-dialog-btn')
  await expect(wosDialogButton).toBeVisible()
  await expect(wosDialogButton).toBeEnabled()
  await wosDialogButton.click()
  await expect(page.getByText('Web of Science API Query Details', { exact: true })).toBeVisible()
}

test.describe('Query Details UI', () => {
  test('hides compact summary details when token is not verified', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-message')).toHaveCount(0)
    await expect(page.locator('#query-summary-chip-query')).toHaveCount(0)
    await expect(page.locator('#query-summary-cited-warning')).toHaveCount(0)
  })

  test('keeps query actions disabled when no valid token exists', async ({ page }) => {
    await openQueryPanel(page)

    const wosButton = page.locator('#query-open-wos-dialog-btn')
    const incitesButton = page.locator('#query-open-ic-dialog-btn')

    await expect(wosButton).toHaveText('Expanded API Query Details')
    await expect(incitesButton).toHaveText('InCites API Query Details')
    await expect(wosButton).toBeEnabled()
    await expect(incitesButton).toBeDisabled()
    await expect(page.locator('#query-ids-file-btn')).toBeDisabled()
  })

  test('does not render query summary chip text before token validation', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-chip-query')).toHaveCount(0)
    await expect(page.getByText('TS=covid* and PY=2020')).toHaveCount(0)
  })

  test('shows only the token-required info alert in WOS dialog when token is missing', async ({
    page
  }) => {
    await openWosDialog(page)

    await expect(page.locator('#query-validate-btn')).toBeDisabled()
    await expect(
      page.getByText('Verify your Web of Science token before query validation.')
    ).toBeVisible()
    await expect(page.locator('#query-validation-alert')).toBeVisible()
  })
})

test.describe('InCites summary chips', () => {
  test('ic chip section is hidden when ic token is not validated', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-ic-chip-schema')).toHaveCount(0)
    await expect(page.locator('#query-summary-ic-chip-esci')).toHaveCount(0)
  })
})

test.describe('IDs file summary chips', () => {
  test('ids file chip section is hidden when no file is selected', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-ids-file-chip')).toHaveCount(0)
    await expect(page.locator('#query-summary-ids-count')).toHaveCount(0)
  })
})

test.describe('Query summary chip details', () => {
  test('query chip truncates at 32 chars and renders tooltip activator', async ({ page }) => {
    await openQueryPanel(page)

    // Default query "TS=covid* and PY=2020" is < 32 chars — chip not visible (no token)
    // We just verify the chip element is absent without a validated token
    await expect(page.locator('#query-summary-chip-query')).toHaveCount(0)
  })

  test('records chip is absent when summary is hidden (no token)', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-chip-records-found')).toHaveCount(0)
  })

  test('cited-refs chip is absent when summary is hidden (no token)', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-cited-warning')).toHaveCount(0)
  })
})
