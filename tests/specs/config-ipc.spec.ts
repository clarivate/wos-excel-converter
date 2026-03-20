import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

async function resetConfigs(page: any): Promise<void> {
  let names: string[] = await page.evaluate(() =>
    window.mainApi.invoke('msgRequestGetAllConfigNames')
  )
  while (names.length > 1) {
    await page.evaluate(() => window.mainApi.invoke('msgRequestDeleteConfig'))
    names = await page.evaluate(() => window.mainApi.invoke('msgRequestGetAllConfigNames'))
  }
}

async function ensureDefaultBaseline(page: any): Promise<void> {
  await resetConfigs(page)
  const current = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
  if (current !== 'Default') {
    await page.evaluate(() => window.mainApi.invoke('msgRequestRenameConfig', 'Default'))
  }
}

test.describe('Config IPC Handler Tests', () => {
  // Ensure a clean state before and after the whole suite
  test.beforeAll(async ({ page }: { page: any }) => {
    await ensureDefaultBaseline(page)
  })

  test.beforeEach(async ({ page }: { page: any }) => {
    await ensureDefaultBaseline(page)
  })

  test.afterAll(async ({ page }: { page: any }) => {
    await ensureDefaultBaseline(page)
  })

  // -------------------------------------------------------------------------
  // Read-only queries
  // -------------------------------------------------------------------------

  // @ts-expect-error: util not typed in playwright
  test('IPC: msgRequestGetAllConfigNames returns an array', async ({ page, util }) => {
    try {
      const names = await page.evaluate(() => window.mainApi.invoke('msgRequestGetAllConfigNames'))
      expect(Array.isArray(names)).toBe(true)
      expect(names.length).toBeGreaterThan(0)
      expect(names).toContain('Default')
      await util.captureScreenshot(page, 'config-ipc-get-all-names')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: util not typed in playwright
  test('IPC: msgRequestGetConfigName returns current config name', async ({ page, util }) => {
    try {
      const name = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
      expect(typeof name).toBe('string')
      expect(name).toBe('Default')
      await util.captureScreenshot(page, 'config-ipc-get-config-name')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // -------------------------------------------------------------------------
  // Copy
  // -------------------------------------------------------------------------

  // @ts-expect-error: util not typed in playwright
  test('IPC: msgRequestCopyConfig creates a copy with " Copy" suffix', async ({ page, util }) => {
    try {
      const newName = await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      expect(newName).toBe('Default Copy')

      const names = await page.evaluate(() => window.mainApi.invoke('msgRequestGetAllConfigNames'))
      expect(names).toContain('Default')
      expect(names).toContain('Default Copy')

      const current = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
      expect(current).toBe('Default Copy')
      await util.captureScreenshot(page, 'config-ipc-copy')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  test('IPC: copying a name ending with " Copy" produces " Copy1" not " Copy Copy"', async ({
    page,
    // @ts-expect-error: util not typed in playwright
    util
  }) => {
    try {
      await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      const newName = await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      expect(newName).toBe('Default Copy1')
      expect(newName).not.toContain('Copy Copy')
      await util.captureScreenshot(page, 'config-ipc-copy-of-copy')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // -------------------------------------------------------------------------
  // Rename
  // -------------------------------------------------------------------------

  // @ts-expect-error: util not typed in playwright
  test('IPC: msgRequestRenameConfig renames the current config', async ({ page, util }) => {
    try {
      await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      await page.evaluate(() => window.mainApi.invoke('msgRequestRenameConfig', 'Renamed Config'))
      const current = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
      expect(current).toBe('Renamed Config')

      const names = await page.evaluate(() => window.mainApi.invoke('msgRequestGetAllConfigNames'))
      expect(names).toContain('Renamed Config')
      expect(names).not.toContain('Default Copy1')
      await util.captureScreenshot(page, 'config-ipc-rename')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // -------------------------------------------------------------------------
  // Change config
  // -------------------------------------------------------------------------

  // @ts-expect-error: util not typed in playwright
  test('IPC: msgRequestChangeConfig switches the active config', async ({ page, util }) => {
    try {
      await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      await page.evaluate(() => window.mainApi.invoke('msgRequestChangeConfig', 'Default'))
      const current = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
      expect(current).toBe('Default')
      await util.captureScreenshot(page, 'config-ipc-change')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // -------------------------------------------------------------------------
  // Delete – index behaviour
  // -------------------------------------------------------------------------

  // @ts-expect-error: util not typed in playwright
  test('IPC: deleting a middle config selects the same-index successor', async ({ page, util }) => {
    try {
      // Build deterministic state with two generated copy names.
      const firstCopy = await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      await page.evaluate(() => window.mainApi.invoke('msgRequestChangeConfig', 'Default'))
      const secondCopy = await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))

      // Switch to the first copy (middle index) and delete it.
      await page.evaluate(
        (name) => window.mainApi.invoke('msgRequestChangeConfig', name),
        firstCopy
      )
      await page.evaluate(() => window.mainApi.invoke('msgRequestDeleteConfig'))

      // Same-index successor should be the second generated copy.
      const current = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
      expect(current).toBe(secondCopy)

      const names = await page.evaluate(() => window.mainApi.invoke('msgRequestGetAllConfigNames'))
      expect(names).not.toContain(firstCopy)
      await util.captureScreenshot(page, 'config-ipc-delete-middle')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: util not typed in playwright
  test('IPC: deleting the last config selects index-1', async ({ page, util }) => {
    try {
      // State: ["Default", "Default Copy"], current = "Default Copy" (last, index 1)
      await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
      await page.evaluate(() => window.mainApi.invoke('msgRequestDeleteConfig'))

      // Remaining: ["Default"]; was last → index-1 = 0 → "Default"
      const current = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))
      expect(current).toBe('Default')

      const names = await page.evaluate(() => window.mainApi.invoke('msgRequestGetAllConfigNames'))
      expect(names).toEqual(['Default'])
      await util.captureScreenshot(page, 'config-ipc-delete-last')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })

  // @ts-expect-error: util not typed in playwright
  test('IPC: deleting the only config is prevented – list stays intact', async ({ page, util }) => {
    try {
      // Only "Default" remains
      const namesBefore = await page.evaluate(() =>
        window.mainApi.invoke('msgRequestGetAllConfigNames')
      )
      expect(namesBefore).toHaveLength(1)

      await page.evaluate(() => window.mainApi.invoke('msgRequestDeleteConfig'))

      const namesAfter = await page.evaluate(() =>
        window.mainApi.invoke('msgRequestGetAllConfigNames')
      )
      // Store recreates "Default" rather than leaving empty
      expect(namesAfter).toHaveLength(1)
      expect(namesAfter).toContain('Default')
      await util.captureScreenshot(page, 'config-ipc-delete-only')
    } catch (error) {
      throw await util.onTestError(error)
    }
  })
})
