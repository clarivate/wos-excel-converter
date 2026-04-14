import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
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

test.describe('Query Details IPC Handler Tests', () => {
  test.beforeAll(async ({ page }: { page: any }) => {
    await resetConfigs(page)
  })

  test.afterAll(async ({ page }: { page: any }) => {
    await resetConfigs(page)
  })

  test('IPC: get/set query details persists values on current config', async ({ page }) => {
    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetQueryDetails', {
        databaseId: 'WOK',
        edition: 'WOS+SCI',
        lang: 'en',
        createdTimeSpan: '2020-01-01+2020-12-31',
        modifiedTimeSpan: '',
        tcModifiedTimeSpan: '',
        usrQuery: 'TS=(cadmium)',
        disableWosQuery: true,
        addCitedReferences: false,
        idsFile: 'C:/tmp/ids.txt',
        icSchema: { code: 'esi', name: 'Essential Science Indicators' },
        icEsci: 'y'
      })
    )

    const details = await page.evaluate(() => window.mainApi.invoke('msgRequestGetQueryDetails'))
    expect(details.databaseId).toBe('WOK')
    expect(details.edition).toBe('WOS+SCI')
    expect(details.lang).toBe('en')
    expect(details.createdTimeSpan).toBe('2020-01-01+2020-12-31')
    expect(details.modifiedTimeSpan).toBe('')
    expect(details.tcModifiedTimeSpan).toBe('')
    expect(details.usrQuery).toBe('TS=(cadmium)')
    expect(details.disableWosQuery).toBe(true)
    expect(details.addCitedReferences).toBe(false)
    expect(details.idsFile).toBe('C:/tmp/ids.txt')
    expect(details.icSchema.code).toBe('esi')
    expect(details.icEsci).toBe('y')
  })

  test('IPC: supports all configured WOS database codes', async ({ page }) => {
    const supportedDatabaseCodes = [
      'WOS',
      'BCI',
      'BIOABS',
      'BIOSIS',
      'CABI',
      'CCC',
      'CSCD',
      'DCI',
      'DIIDW',
      'FSTA',
      'GRANTS',
      'INSPEC',
      'MEDLINE',
      'PPRN',
      'PQDT',
      'RC',
      'SCIELO',
      'WOK',
      'ZOOREC'
    ]

    for (const code of supportedDatabaseCodes) {
      await page.evaluate(
        (databaseId) =>
          window.mainApi.invoke('msgRequestSetQueryDetails', {
            databaseId
          }),
        code
      )

      const details = await page.evaluate(() => window.mainApi.invoke('msgRequestGetQueryDetails'))
      expect(details.databaseId).toBe(code)
    }
  })

  test('IPC: enforces only one time span field at a time', async ({ page }) => {
    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetQueryDetails', {
        databaseId: 'WOS',
        createdTimeSpan: '2020-01-01+2020-01-31',
        modifiedTimeSpan: '2021-01-01+2021-01-31',
        tcModifiedTimeSpan: '2022-01-01+2022-01-31'
      })
    )

    const details = await page.evaluate(() => window.mainApi.invoke('msgRequestGetQueryDetails'))
    expect(details.createdTimeSpan).toBe('2020-01-01+2020-01-31')
    expect(details.modifiedTimeSpan).toBe('')
    expect(details.tcModifiedTimeSpan).toBe('')

    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetQueryDetails', {
        databaseId: 'WOS',
        createdTimeSpan: '',
        modifiedTimeSpan: '',
        tcModifiedTimeSpan: '2022-01-01+2022-01-31'
      })
    )

    const tcOnly = await page.evaluate(() => window.mainApi.invoke('msgRequestGetQueryDetails'))
    expect(tcOnly.createdTimeSpan).toBe('')
    expect(tcOnly.modifiedTimeSpan).toBe('')
    expect(tcOnly.tcModifiedTimeSpan).toBe('2022-01-01+2022-01-31')
  })

  test('IPC: WOK rejects modified and tcModified time spans', async ({ page }) => {
    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetQueryDetails', {
        databaseId: 'WOK',
        createdTimeSpan: '2020-01-01+2020-01-31',
        modifiedTimeSpan: '2021-01-01+2021-01-31',
        tcModifiedTimeSpan: '2022-01-01+2022-01-31'
      })
    )

    const details = await page.evaluate(() => window.mainApi.invoke('msgRequestGetQueryDetails'))
    expect(details.databaseId).toBe('WOK')
    expect(details.createdTimeSpan).toBe('2020-01-01+2020-01-31')
    expect(details.modifiedTimeSpan).toBe('')
    expect(details.tcModifiedTimeSpan).toBe('')
  })

  test('IPC: query details remain isolated per config', async ({ page }) => {
    const baseName = await page.evaluate(() => window.mainApi.invoke('msgRequestGetConfigName'))

    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetQueryDetails', {
        usrQuery: 'TS=(default-query)',
        databaseId: 'WOS'
      })
    )

    const copyName = await page.evaluate(() => window.mainApi.invoke('msgRequestCopyConfig'))
    expect(copyName).toContain('Copy')

    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetQueryDetails', {
        usrQuery: 'TS=(copy-query)',
        databaseId: 'WOK'
      })
    )

    const copyDetails = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestGetQueryDetails')
    )
    expect(copyDetails.usrQuery).toBe('TS=(copy-query)')
    expect(copyDetails.databaseId).toBe('WOK')

    await page.evaluate((name) => window.mainApi.invoke('msgRequestChangeConfig', name), baseName)
    const baseDetails = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestGetQueryDetails')
    )
    expect(baseDetails.usrQuery).toBe('TS=(default-query)')
    expect(baseDetails.databaseId).toBe('WOS')
  })

  test('IPC: validate query returns warning when WOS token is missing', async ({ page }) => {
    await page.evaluate(() =>
      window.mainApi.invoke('msgRequestSetApiTokens', {
        wosExpandedToken: ''
      })
    )

    const result = await page.evaluate(() =>
      window.mainApi.invoke('msgRequestValidateWosQuery', {
        usrQuery: 'TS=(covid)',
        databaseId: 'WOS'
      })
    )

    expect(result.type).toBe('warning')
    expect(result.messageKey).toBe('query.validation.token-required')
    expect(result.recordsFound).toBeNull()
    expect(result.queryId).toBeNull()
  })

  test('IPC: parse IDs file cleans invalid rows and duplicates', async ({ page }) => {
    const tempDir = mkdtempSync(join(tmpdir(), 'query-ids-ipc-'))
    const idsPath = join(tempDir, 'ids.txt')

    try {
      writeFileSync(
        idsPath,
        ['UT:0001', 'UT:0001', 'DOI:10.10/abc', 'PMID:123', 'INVALID', '', 'UT:0002'].join('\n'),
        'utf-8'
      )

      const wosOnly = await page.evaluate((filePath) => {
        return window.mainApi.invoke('msgRequestParseIdsFile', {
          filePath,
          allowExpandedIds: false
        })
      }, idsPath)

      expect(wosOnly.ids).toEqual(['UT:0001', 'UT:0002'])
      expect(wosOnly.duplicates).toBe(1)
      expect(wosOnly.invalidIds).toBe(4)

      const expanded = await page.evaluate((filePath) => {
        return window.mainApi.invoke('msgRequestParseIdsFile', {
          filePath,
          allowExpandedIds: true
        })
      }, idsPath)

      expect(expanded.ids).toEqual(['UT:0001', 'DOI:10.10/abc', 'PMID:123', 'UT:0002'])
      expect(expanded.duplicates).toBe(1)
      expect(expanded.invalidIds).toBe(2)
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
