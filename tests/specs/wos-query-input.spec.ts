import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

const openWosQueryDialog = async (page: any): Promise<void> => {
  const existingDialog = page.locator('[role="dialog"]')
  if (await existingDialog.isVisible()) {
    return
  }

  await page.evaluate(() =>
    window.mainApi.invoke('msgRequestSetQueryDetails', {
      disableWosQuery: false
    })
  )

  const queryTitle = page.getByText('Query Details', { exact: true }).first()
  await expect(queryTitle).toBeVisible()

  let wosButton = page.locator('#query-open-wos-dialog-btn')
  if (!(await wosButton.isVisible())) {
    await queryTitle.click({ force: true })
  }

  const dialog = page.locator('[role="dialog"]')
  for (let attempt = 0; attempt < 3; attempt++) {
    wosButton = page.locator('#query-open-wos-dialog-btn')
    await expect(wosButton).toBeVisible()
    await expect(wosButton).toBeEnabled()
    await wosButton.click()
    if (await dialog.isVisible()) return
    await page.waitForTimeout(200)
  }

  await expect(dialog).toBeVisible()
}

test.describe('WosQueryInput Autocomplete Keyboard Navigation', () => {
  test('shows autocomplete guidance with documentation link', async ({ page }) => {
    await openWosQueryDialog(page)

    await expect(
      page.getByText(/Typeahead suggestions are provided as guidance only/i)
    ).toBeVisible()
    await expect(page.getByText('Open query documentation', { exact: true })).toBeVisible()
  })

  test('navigates through suggestions with arrow keys', async ({ page }) => {
    await openWosQueryDialog(page)

    const queryTextarea = page.locator('#query-usr-query')
    await expect(queryTextarea).toBeVisible()

    // Type a partial field tag to trigger autocomplete
    await page.locator('#query-usr-query').focus()
    await page.locator('#query-usr-query').fill('TS')

    // Wait for autocomplete menu to appear
    const autocompleteMenu = page.locator('.wos-ac-menu')
    await expect(autocompleteMenu).toBeVisible({ timeout: 1000 })

    // Get all suggestion items
    const items = page.locator('.wos-ac-item')
    const itemCount = await items.count()
    expect(itemCount).toBeGreaterThan(0)

    // Verify no item is selected initially
    const activeItems = page.locator('.wos-ac-item.active')
    await expect(activeItems).toHaveCount(0)

    // Press ArrowDown to select first item
    await page.locator('#query-usr-query').press('ArrowDown')
    await page.waitForTimeout(100)

    // Verify first item is now active
    const firstItem = items.first()
    await expect(firstItem).toHaveClass(/active/)

    // Press ArrowDown to select second item
    await page.locator('#query-usr-query').press('ArrowDown')
    await page.waitForTimeout(100)

    // Verify second item is now active
    if (itemCount > 1) {
      const secondItem = items.nth(1)
      await expect(secondItem).toHaveClass(/active/)
      await expect(firstItem).not.toHaveClass(/active/)
    }

    // Press ArrowUp to go back to first item
    await page.locator('#query-usr-query').press('ArrowUp')
    await page.waitForTimeout(100)

    // Verify first item is active again
    await expect(firstItem).toHaveClass(/active/)
  })

  test('selects suggestion with Enter key', async ({ page }) => {
    await openWosQueryDialog(page)

    const queryTextarea = page.locator('#query-usr-query')
    await expect(queryTextarea).toBeVisible()

    // Type a partial field tag to trigger autocomplete
    await page.locator('#query-usr-query').focus()
    await page.locator('#query-usr-query').fill('TS')

    // Wait for autocomplete menu to appear
    const autocompleteMenu = page.locator('.wos-ac-menu')
    await expect(autocompleteMenu).toBeVisible({ timeout: 1000 })

    // Get first suggestion item's code
    const firstItem = page.locator('.wos-ac-item').first()
    const firstItemCode = await firstItem.locator('.wos-ac-code').textContent()

    // Navigate to first item and press Enter
    await page.locator('#query-usr-query').press('ArrowDown')
    await page.waitForTimeout(100)
    await page.locator('#query-usr-query').press('Enter')
    await page.waitForTimeout(200)

    // Verify autocomplete menu is closed
    await expect(autocompleteMenu).not.toBeVisible()

    // Verify textarea contains the selected suggestion
    const textareaValue = await page.locator('#query-usr-query').inputValue()
    expect(textareaValue).toContain(firstItemCode)
  })

  test('closes autocomplete menu with Escape key', async ({ page }) => {
    await openWosQueryDialog(page)

    const queryTextarea = page.locator('#query-usr-query')
    await expect(queryTextarea).toBeVisible()

    // Type a partial field tag to trigger autocomplete
    await page.locator('#query-usr-query').focus()
    await page.locator('#query-usr-query').fill('TS')

    // Wait for autocomplete menu to appear
    const autocompleteMenu = page.locator('.wos-ac-menu')
    await expect(autocompleteMenu).toBeVisible({ timeout: 1000 })

    // Press Escape to close menu
    await page.locator('#query-usr-query').press('Escape')
    await page.waitForTimeout(100)

    // Verify autocomplete menu is closed
    await expect(autocompleteMenu).not.toBeVisible()
  })

  test('handles boolean operator suggestions with keyboard', async ({ page }) => {
    await openWosQueryDialog(page)

    const queryTextarea = page.locator('#query-usr-query')
    await expect(queryTextarea).toBeVisible()

    // Type a query with closing parenthesis to trigger boolean operator suggestions
    await page.fill('#query-usr-query', 'TS=(query) AND')

    // Wait for autocomplete menu to appear - should suggest boolean operators
    const autocompleteMenu = page.locator('.wos-ac-menu')
    await expect(autocompleteMenu).toBeVisible({ timeout: 1000 })

    // Verify boolean operator items are present
    const boolItems = page.locator('.wos-ac-item.wos-ac-bool')
    const boolCount = await boolItems.count()
    expect(boolCount).toBeGreaterThan(0)

    // Navigate and select
    await page.locator('#query-usr-query').press('ArrowDown')
    await page.waitForTimeout(100)

    const firstBoolItem = boolItems.first()
    await expect(firstBoolItem).toHaveClass(/active/)
  })
})
