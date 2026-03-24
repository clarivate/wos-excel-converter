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
  test('shows query panel and validation warning when token is not verified', async ({ page }) => {
    await openQueryPanel(page)

    const validationMessage = page.locator('#query-summary-message')
    await expect(validationMessage).toBeVisible()
    await expect(validationMessage).toContainText(/verify your web of science token/i)
  })

  test('keeps query actions disabled when no valid token exists', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-open-wos-dialog-btn')).toBeDisabled()
    await expect(page.locator('#query-open-ic-dialog-btn')).toBeDisabled()
    await expect(page.locator('#query-ids-file-btn')).toBeDisabled()
  })

  test('shows default query preview text in the panel summary', async ({ page }) => {
    await openQueryPanel(page)

    await expect(page.locator('#query-summary-message')).toBeVisible()
    await expect(page.locator('text=TS=covid* and PY=2020')).toBeVisible()
  })
})
