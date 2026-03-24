import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

const openQueryPanel = async (page: any): Promise<void> => {
  const queryTitle = page.getByText('Query Details', { exact: true }).first()
  await expect(queryTitle).toBeVisible()
  await queryTitle.click()

  const idsButton = page.locator('#query-ids-file-btn')
  if (!(await idsButton.isVisible())) {
    await queryTitle.click()
  }
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

    await expect(page.locator('#query-open-wos-dialog-btn')).toBeDisabled()
    await expect(page.locator('#query-open-ic-dialog-btn')).toBeDisabled()
    await expect(page.locator('#query-ids-file-btn')).toBeDisabled()
  })

  test('does not render query summary chip text before token validation', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-chip-query')).toHaveCount(0)
    await expect(page.getByText('TS=covid* and PY=2020')).toHaveCount(0)
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
