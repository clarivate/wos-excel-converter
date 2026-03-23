import { test, expect, beforeAll, afterAll } from '../fixtures.mjs'
import { hasTokenEnv, wosExpandedToken, incitesToken } from '../env.mjs'
import '../../src/types/mainApi.d.ts'

test.beforeAll(beforeAll)
test.afterAll(afterAll)

test.describe('@requires-token Token Live Verification', () => {
  test.skip(!hasTokenEnv, 'WOS_EXPANDED_TOKEN and INCITES_TOKEN are required for live token tests')

  test('validates live Web of Science token', async ({ page }) => {
    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          wosExpandedToken: token
        }),
      wosExpandedToken
    )

    const result = await page.evaluate(
      (token) => window.mainApi.invoke('msgRequestVerifyWosToken', token),
      wosExpandedToken
    )

    expect(result.type).toBe('success')
    expect(result.period === 'Year' || result.period === 'Month').toBe(true)
    expect(typeof result.remaining).toBe('number')
  })

  test('validates live InCites token', async ({ page }) => {
    await page.evaluate(
      (token) =>
        window.mainApi.invoke('msgRequestSetApiTokens', {
          icToken: token
        }),
      incitesToken
    )

    const result = await page.evaluate(
      (token) => window.mainApi.invoke('msgRequestVerifyIcToken', token),
      incitesToken
    )

    expect(result.type).toBe('success')
    expect(typeof result.remainingPerDay).toBe('number')
  })
})
