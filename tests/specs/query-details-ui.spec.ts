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
