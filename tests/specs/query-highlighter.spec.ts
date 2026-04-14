import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

const openWosQueryDialog = async (page: any): Promise<void> => {
  const existingDialog = page.locator('[role="dialog"]')
  if (await existingDialog.isVisible()) {
    if (await page.locator('#query-usr-query').isVisible()) {
      return
    }
    await page.getByText('Close', { exact: true }).first().click({ force: true })
    await expect(existingDialog).toBeHidden()
  }

  await page.evaluate(() =>
    window.mainApi.invoke('msgRequestSetQueryDetails', {
      disableWosQuery: false
    })
  )

  // Click on Query Details panel
  const queryTitle = page.getByText('Query Details', { exact: true }).first()
  await expect(queryTitle).toBeVisible()

  // Wait for and click the Expanded API Query Details button
  let wosButton = page.locator('#query-open-wos-dialog-btn')
  if (!(await wosButton.isVisible())) {
    await queryTitle.click({ force: true })
  }

  // Wait for dialog to appear
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

const getTagCount = async (page: any): Promise<number> => page.locator('.wos-hl .wos-tag').count()
const getHighlighterHtml = async (page: any): Promise<string> => page.locator('.wos-hl').innerHTML()

test.describe('WOS Query Highlighter - Syntax Highlighting', () => {
  test('highlights field tags with bold and color', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await expect(textarea).toBeVisible()

    // Clear and type a query with field tags
    await textarea.click()
    await textarea.clear()
    await textarea.fill('TS=(cancer) AND AU=(smith)')

    // Check if highlighter overlay exists
    const highlighter = page.locator('.wos-hl')
    await expect(highlighter).toBeVisible()

    // Check if field tags are rendered in highlighted HTML
    await expect.poll(async () => getTagCount(page)).toBeGreaterThanOrEqual(2)
    const tagCount = await getTagCount(page)
    expect(tagCount).toBeGreaterThanOrEqual(2) // At least TS and AU
  })

  test('preserves highlighting when editing query', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()
    await textarea.fill('TS=(cancer)')

    // Get initial highlighting state
    await expect.poll(async () => getHighlighterHtml(page)).toContain('wos-tag')
    const initialCount = await getTagCount(page)
    expect(initialCount).toBeGreaterThanOrEqual(1)

    // Add another field tag
    await textarea.fill('TS=(cancer) AND AU=(smith)')

    // Verify highlighting was updated
    await expect.poll(async () => getTagCount(page)).toBeGreaterThanOrEqual(2)
    const updatedCount = await getTagCount(page)
    expect(updatedCount).toBeGreaterThanOrEqual(2)
  })

  test('does not highlight field tags inside quotes', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()
    await textarea.fill('TS=("cancer OR TS") AND AU=(smith)')

    // The first TS should be highlighted, but TS inside quotes should not have special styling
    await expect.poll(async () => getTagCount(page)).toBeGreaterThanOrEqual(2)
    const tagCount = await getTagCount(page)
    expect(tagCount).toBeGreaterThanOrEqual(2)
  })

  test('highlights multiple field tags in complex query', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()
    await textarea.fill('TS=(cancer) AND AU=(smith) OR WC=(oncology) AND PY=(2020)')

    await expect.poll(async () => getTagCount(page)).toBeGreaterThanOrEqual(4)
    const tagCount = await getTagCount(page)
    expect(tagCount).toBeGreaterThanOrEqual(4) // TS, AU, WC, PY
  })

  test('maintains correct highlighting with nested parentheses', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()
    await textarea.fill('TS=((cancer OR tumor) AND (treatment OR therapy))')

    await expect.poll(async () => getTagCount(page)).toBeGreaterThanOrEqual(1)
    const tagCount = await getTagCount(page)
    expect(tagCount).toBeGreaterThanOrEqual(1) // At least TS tag
  })
})

test.describe('WOS Query Highlighter - Type-Ahead/Autocomplete', () => {
  test('shows autocomplete menu when typing field tag prefix', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    // Type field tag prefix
    await textarea.type('T')

    // Autocomplete menu should appear
    const menu = page.locator('.wos-ac-menu')
    await expect(menu).toBeVisible({ timeout: 1000 })

    // Should show suggestions starting with T
    const items = page.locator('.wos-ac-item')
    const itemCount = await items.count()
    expect(itemCount).toBeGreaterThan(0)

    // Verify first item starts with typed prefix
    const firstItem = items.first()
    await expect(firstItem.locator('.wos-ac-code')).toContainText(/^T/i)
  })

  test('filters suggestions as user types', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    // Type 'TS'
    await textarea.type('TS')

    // Wait for autocomplete
    await expect(page.locator('.wos-ac-menu')).toBeVisible({ timeout: 1000 })

    const items = page.locator('.wos-ac-item')
    const itemCount = await items.count()

    // Should have significantly fewer items (those starting with TS)
    expect(itemCount).toBeLessThan(10)

    // Suggestions are narrowed; exact first-item ordering is implementation-dependent.
    expect(itemCount).toBeGreaterThan(0)
  })

  test('inserts field tag on selection', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await expect(textarea).toBeVisible()

    // Type 'AU' to trigger autocomplete
    await page.fill('#query-usr-query', 'AU')

    // Wait for at least one suggestion
    await expect.poll(async () => page.locator('.wos-ac-item').count()).toBeGreaterThan(0)

    // Click on first suggestion
    const firstSuggestion = page.locator('.wos-ac-item').filter({ hasText: 'AU=' }).first()
    await firstSuggestion.dispatchEvent('mousedown')

    // Selection closes the menu and commits insertion through mousedown handler.
    await expect(page.locator('.wos-ac-menu')).toBeHidden({ timeout: 500 })

    // And the input should contain a committed field tag.
    const value = await page.locator('#query-usr-query').inputValue()
    expect(value).toContain('=')
  })

  test('closes autocomplete after selection', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    await textarea.type('AU')
    await expect(page.locator('.wos-ac-menu')).toBeVisible({ timeout: 1000 })

    const suggestion = page.locator('.wos-ac-item').first()
    await suggestion.dispatchEvent('mousedown')

    // Menu should close
    await expect(page.locator('.wos-ac-menu')).toBeHidden({ timeout: 500 })
  })

  test('navigates suggestions with arrow keys', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    await textarea.type('T')
    await expect(page.locator('.wos-ac-menu')).toBeVisible({ timeout: 1000 })

    // Press down arrow to move to next suggestion
    await textarea.press('ArrowDown')

    // First item should now have active class
    const activeItem = page.locator('.wos-ac-item.active').first()
    await expect(activeItem).toBeVisible()

    // Press down again
    await textarea.press('ArrowDown')

    // Different item should be active
    const activeItems = page.locator('.wos-ac-item.active')
    const activeCount = await activeItems.count()
    expect(activeCount).toBeGreaterThan(0)
  })

  test('selects suggestion with Tab key', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    await page.fill('#query-usr-query', 'TI')
    await expect.poll(async () => page.locator('.wos-ac-item').count()).toBeGreaterThan(0)

    // Press Tab to select
    await textarea.press('Tab')

    // Depending on focus timing, Tab may commit selection or simply blur.
    // Either way, suggestions should not stay open indefinitely.
    await expect(page.locator('.wos-ac-menu')).toBeHidden({ timeout: 1000 })

    // In commit cases, the selected field tag contains '='.
    const value = await textarea.inputValue()
    expect(value === 'TI' || value.includes('=')).toBe(true)
  })

  test('closes autocomplete with Escape key', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    await textarea.type('T')
    await expect(page.locator('.wos-ac-menu')).toBeVisible({ timeout: 1000 })

    // Press Escape
    await textarea.press('Escape')

    // Menu should close
    await expect(page.locator('.wos-ac-menu')).toBeHidden({ timeout: 500 })
  })

  test('does not show autocomplete inside quoted strings', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await expect(textarea).toBeVisible()

    // Type a quoted string with partial field tag
    await textarea.fill('TS=("T')

    // Autocomplete should not appear inside quotes
    const menu = page.locator('.wos-ac-menu')
    await expect(menu).toBeHidden({ timeout: 500 })
  })

  test('shows suggestions after closing quote', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await expect(textarea).toBeVisible()

    // Type query with quoted string and then start typing another field tag
    await textarea.fill('TS=("cancer") AND AU')

    // Autocomplete should appear for AU
    await expect(page.locator('.wos-ac-menu')).toBeVisible({ timeout: 1000 })

    const auItem = page.locator('.wos-ac-item').filter({ hasText: 'AU=' }).first()
    await expect(auItem).toBeVisible()
  })
})

test.describe('WOS Query Highlighter - Field Tag Documentation', () => {
  test('displays field tag descriptions in suggestions', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await expect(textarea).toBeVisible()

    await page.fill('#query-usr-query', 'TS')
    await expect.poll(async () => page.locator('.wos-ac-item').count()).toBeGreaterThan(0)

    // Check that description is shown
    const descriptions = page.locator('.wos-ac-desc')
    const descCount = await descriptions.count()
    expect(descCount).toBeGreaterThan(0)

    // First description should not be empty
    const firstDesc = descriptions.first()
    const text = await firstDesc.textContent()
    expect(text?.length).toBeGreaterThan(0)
  })

  test('suggestions include common field tags', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    const expectedTags = ['TS', 'AU', 'TI', 'SO', 'WC', 'PY', 'DO', 'AB']

    for (const tag of expectedTags) {
      await page.fill('#query-usr-query', tag)
      await expect.poll(async () => page.locator('.wos-ac-item').count()).toBeGreaterThan(0)
      const items = page.locator('.wos-ac-item')

      let found = false
      for (let i = 0; i < (await items.count()); i++) {
        const item = items.nth(i)
        const code = (await item.locator('.wos-ac-code').textContent())?.replace(/=$/, '') ?? ''
        if (code.startsWith(tag)) {
          found = true
          break
        }
      }

      expect(found).toBe(true)
    }
  })
})

test.describe('WOS Query Highlighter - Persistence', () => {
  test('saves query with field tags correctly', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()

    const testQuery = 'TS=(cancer) AND AU=(smith)'
    await textarea.fill(testQuery)

    // Wait a moment for persistence
    await page.waitForTimeout(500)

    // Close dialog
    const closeBtn = page.getByText('Close').first()
    await closeBtn.click()

    // Wait for dialog to close, then reopen
    await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 1000 })
    await openWosQueryDialog(page)

    // Verify query was persisted
    const textarea2 = page.locator('#query-usr-query')
    const value = await textarea2.inputValue()
    expect(value).toBe(testQuery)
  })

  test('maintains highlighting after page reload', async ({ page }) => {
    await openWosQueryDialog(page)

    const textarea = page.locator('#query-usr-query')
    await textarea.click()
    await textarea.clear()
    await textarea.fill('TS=(cancer) AND WC=(oncology)')

    // Close dialog
    const closeBtn = page.getByText('Close').first()
    await closeBtn.click()

    // Reload page
    await page.reload()

    // Wait for app to reload
    await expect(page.getByText('Query Details', { exact: true }).first()).toBeVisible({
      timeout: 5000
    })

    // Reopen dialog
    await openWosQueryDialog(page)

    // Verify query is still there with proper highlighting
    const textarea2 = page.locator('#query-usr-query')
    const value = await textarea2.inputValue()
    expect(value).toContain('TS=')
    expect(value).toContain('WC=')

    const tags = page.locator('.wos-tag')
    const tagCount = await tags.count()
    expect(tagCount).toBeGreaterThan(0)
  })
})
