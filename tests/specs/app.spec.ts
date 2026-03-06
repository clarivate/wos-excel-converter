import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

// @ts-expect-error: `util` is not using types in playwright
test('HeaderLayout component check', async ({ page, util }) => {
  try {
    // Verify system bar with Clarivate icon is visible
    const systemBar = page.locator('#header-system-bar')
    await expect(systemBar, 'Confirm system bar is visible').toBeVisible()

    // Verify Clarivate icon is visible
    const clarivateIcon = page.locator('#clarivate-icon')
    await expect(clarivateIcon, 'Confirm Clarivate icon is visible').toBeVisible()

    // Verify app bar is visible
    const appBar = page.locator('#header-app-bar')
    await expect(appBar, 'Confirm app bar is visible').toBeVisible()

    // Verify WOS icon is visible
    const wosIcon = page.locator('#wos-icon')
    await expect(wosIcon, 'Confirm WOS icon is visible').toBeVisible()

    // Verify WOS title is visible
    const wosTitle = page.locator('#wos-title')
    await expect(wosTitle, 'Confirm WOS API Exporter title is visible').toBeVisible()

    // Verify theme toggle button exists
    const themeButton = page.locator('#theme-toggle-btn')
    await expect(themeButton, 'Confirm theme toggle button exists').toBeVisible()

    // Verify language selector exists
    const languageSelector = page.locator('#language-selector-btn')
    await expect(languageSelector, 'Confirm language selector exists').toBeVisible()

    // Verify about button exists
    const aboutButton = page.locator('#about-btn')
    await expect(aboutButton, 'Confirm About button exists').toBeVisible()

    // Verify log button exists
    const logButton = page.locator('#log-btn')
    await expect(logButton, 'Confirm Log button exists').toBeVisible()

    // Verify developer portal button exists
    const devPortalButton = page.locator('#developer-portal-btn')
    await expect(devPortalButton, 'Confirm Developer Portal button exists').toBeVisible()

    await util.captureScreenshot(page, 'result')
  } catch (error) {
    throw await util.onTestError(error)
  }
})

// @ts-expect-error: `util` is not using types in playwright
test('HeaderLayout navigation check', async ({ page, util }) => {
  try {
    // Verify config selector/chip group is visible
    const chipGroup = page.locator('#config-chip-group')
    await expect(chipGroup, 'Confirm config selector is visible').toBeVisible()

    // Verify at least one chip (config) is available
    const chip = chipGroup.locator('div[class*="v-chip"]').first()
    await expect(chip, 'Confirm at least one config chip is available').toBeVisible()

    await util.captureScreenshot(page, 'navigation-result')
  } catch (error) {
    throw await util.onTestError(error)
  }
})
