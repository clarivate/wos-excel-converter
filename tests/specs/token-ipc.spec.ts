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

async function assertTokenRoundTripWithRetry(
  page: any,
  expected: { wosExpandedToken: string; icToken: string },
  attempts = 6
): Promise<void> {
  let lastRead: { wosExpandedToken: string; icToken: string } | null = null

  for (let i = 0; i < attempts; i++) {
    await page.evaluate(async (payload) => {
      await window.mainApi.invoke('msgRequestSetApiTokens', payload)
    }, expected)

    lastRead = await page.evaluate(() => window.mainApi.invoke('msgRequestGetApiTokens'))

    if (
      lastRead.wosExpandedToken === expected.wosExpandedToken &&
      lastRead.icToken === expected.icToken
    ) {
      return
    }

    await page.waitForTimeout(50)
  }

  expect(lastRead?.wosExpandedToken).toBe(expected.wosExpandedToken)
  expect(lastRead?.icToken).toBe(expected.icToken)
}

test.describe('Token IPC Handler Tests', () => {
  test.beforeAll(async ({ page }: { page: any }) => {
    await resetConfigs(page)
  })

  test.afterAll(async ({ page }: { page: any }) => {
    await resetConfigs(page)
  })

  test('IPC: set/get API tokens persists values on current config', async ({ page }) => {
    await assertTokenRoundTripWithRetry(page, {
      wosExpandedToken: 'wos-token-test',
      icToken: 'ic-token-test'
    })
  })

  test('IPC: tokens are isolated per config', async ({ page }) => {
    const baseConfigName = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestGetConfigName')
    )

    await page.evaluate(
      (name) => window.mainApi.invoke('msgRequestChangeConfig', name),
      baseConfigName
    )

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

    await page.evaluate(
      (name) => window.mainApi.invoke('msgRequestChangeConfig', name),
      baseConfigName
    )
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
    expect(typeof wosStatus.messageKey).toBe('string')

    expect(['success', 'warning', 'error']).toContain(icStatus.type)
    expect(typeof icStatus.messageKey).toBe('string')
  })
})
