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

test.describe('Token IPC Handler Tests', () => {
  test.beforeAll(async ({ page }: { page: any }) => {
    await resetConfigs(page)
  })

  test.afterAll(async ({ page }: { page: any }) => {
    await resetConfigs(page)
  })

  test('IPC: set/get API tokens persists values on current config', async ({ page }) => {
    await page.evaluate(async () => {
      await window.mainApi.invoke('msgRequestSetApiTokens', {
        wosExpandedToken: 'wos-token-test',
        icToken: 'ic-token-test'
      })
    })

    const tokens = await page.evaluate(() => window.mainApi.invoke('msgRequestGetApiTokens'))
    expect(tokens.wosExpandedToken).toBe('wos-token-test')
    expect(tokens.icToken).toBe('ic-token-test')
  })

  test('IPC: tokens are isolated per config', async ({ page }) => {
    await page.evaluate(() => window.mainApi.invoke('msgRequestChangeConfig', 'Default'))

    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetApiTokens', {
        wosExpandedToken: 'wos-default',
        icToken: 'ic-default'
      })
    )

    const copyName = await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
    expect(copyName).toContain('Copy')

    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetApiTokens', {
        wosExpandedToken: 'wos-copy',
        icToken: 'ic-copy'
      })
    )

    const copyTokens = await page.evaluate(() => window.mainApi.invoke('msgRequestGetApiTokens'))
    expect(copyTokens.wosExpandedToken).toBe('wos-copy')
    expect(copyTokens.icToken).toBe('ic-copy')

    await page.evaluate(() => window.mainApi.invoke('msgRequestChangeConfig', 'Default'))
    const defaultTokens = await page.evaluate(() => window.mainApi.invoke('msgRequestGetApiTokens'))
    expect(defaultTokens.wosExpandedToken).toBe('wos-default')
    expect(defaultTokens.icToken).toBe('ic-default')
  })

  test('IPC: verify endpoints return structured status', async ({ page }) => {
    const wosStatus = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestVerifyWosToken', '')
    )
    const icStatus = await page.evaluate(() => window.mainApi.invoke('msgRequestVerifyIcToken', ''))

    expect(['success', 'warning', 'error']).toContain(wosStatus.type)
    expect(typeof wosStatus.message).toBe('string')

    expect(['success', 'warning', 'error']).toContain(icStatus.type)
    expect(typeof icStatus.message).toBe('string')
  })
})
