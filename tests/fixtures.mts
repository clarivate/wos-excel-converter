import * as base from '@playwright/test'
import { _electron as electron, Page, ElectronApplication } from 'playwright'
import { join } from 'path'
import { main } from '../package.json'
import TestUtil from './testUtil.mjs'

let appElectron: ElectronApplication
let page: Page

const __cwd = process.cwd()
const __isCiProcess = process.env.CI === 'true'
const __testPath = join(__cwd, 'tests')
const __testResultPath = join(__testPath, 'results')
const __testScreenshotPath = join(__testResultPath, 'screenshots')

export const beforeAll = async () => {
  // Open Electron app from build directory
  appElectron = await electron.launch({
    args: [
      main,
      ...(__isCiProcess ? ['--no-sandbox'] : []),
      '--enable-logging',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-blocklist',
      '--ignore-gpu-blocklist'
    ],
    locale: 'en-US',
    colorScheme: 'light',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  })
  page = await appElectron.firstWindow()

  await page.waitForEvent('load')

  page.on('console', console.log)
  page.on('pageerror', console.log)

  // Bind to the actual launched page window; focused window can be null/flaky in test runs.
  const browserWindowHandle = await appElectron.browserWindow(page)
  const hasWindow = await browserWindowHandle.evaluate((windowInstance: any) => {
    if (!windowInstance || windowInstance.isDestroyed?.()) {
      return false
    }

    windowInstance.setPosition(50, 50)
    windowInstance.setSize(1080, 560)
    return true
  })

  base.expect(hasWindow, 'failed to resolve a valid BrowserWindow for the first page').toBe(true)

  const evaluateResult = await appElectron.evaluate(async ({ app }) => {
    return {
      packaged: app.isPackaged,
      dataPath: app.getPath('userData')
    }
  })

  base.expect(evaluateResult.packaged, 'app is not packaged').toBe(false)
}

export const afterAll = async () => {
  await appElectron.close()
}

export const test = base.test.extend({
  // eslint-disable-next-line no-empty-pattern
  page: async ({}, use) => {
    await use(page)
  },
  // @ts-expect-error: `util` is not using types in playwright
  util: async ({ page }, use, testInfo) => {
    await use(new TestUtil(page, testInfo, __testScreenshotPath))
  }
})

export const expect = base.expect

export default {
  test,
  expect,
  beforeAll,
  afterAll
}
