import { JSONFilePreset } from 'lowdb/node'
import { app } from 'electron'
import path from 'node:path'
import os from 'node:os'
import { defaultConfig } from './defaultConfig'

/**
 * LowDB cannot serialize Map. Use a JSON-friendly shape:
 * {
 *   configs: { [name]: WOSConverterConfig },
 *   chosenConfigName: string
 * }
 */

const STORAGE_NAME = 'apiConverterConfigs.json'

const DEFAULT_CONFIG: WOSConverterConfig = {
  name: 'Default',
  wosExpandedToken: '',
  icToken: '',
  wosSearchDetails: {
    databaseId: 'WOS',
    editions: '',
    lang: '',
    usrQuery: 'TS=covid* and PY=2020',
    timeSpan: '',
    modifiedTimeSpan: '',
    tcModifiedTimeSpan: ''
  },
  disableWosQuery: false,
  addCitedReferences: true,
  idsFile: '',
  incitesQueryDetails: {
    schema: { code: 'wos', name: 'Web of Science' },
    esci: 'n'
  },
  exportSettings: {
    excel: true,
    csv: false,
    json: true,
    xml: false,
    wosDefault: false,
    exportConfig: JSON.stringify(defaultConfig),
    chosenDirectory: os.homedir(),
    rangeStart: 0,
    rangeStop: 10
  }
}

type StoreData = {
  configs: Record<string, WOSConverterConfig>
  chosenConfigName: string
}

export default class ConfigStore {
  private static _instance: ConfigStore

  private readonly _storeFile: string
  private readonly _dbPromise: Promise<import('lowdb').Low<StoreData>>

  // Serialize writes to avoid overlapping file writes
  private _writeQueue: Promise<void> = Promise.resolve()

  private constructor() {
    this._storeFile = path.join(app.getPath('userData'), STORAGE_NAME)
    const defaults: StoreData = {
      configs: { [DEFAULT_CONFIG.name]: DEFAULT_CONFIG },
      chosenConfigName: DEFAULT_CONFIG.name
    }
    this._dbPromise = JSONFilePreset<StoreData>(this._storeFile, defaults)
  }

  static getInstance(): ConfigStore {
    if (!ConfigStore._instance) {
      ConfigStore._instance = new ConfigStore()
    }
    return ConfigStore._instance
  }

  // --- helpers --------------------------------------------------------------

  private async db() {
    return await this._dbPromise
  }

  private async read() {
    const db = await this.db()
    await db.read()
    if (!db.data) {
      db.data = {
        configs: { [DEFAULT_CONFIG.name]: DEFAULT_CONFIG },
        chosenConfigName: DEFAULT_CONFIG.name
      }
    }
    return db
  }

  private async enqueueWrite(fn: () => Promise<void>) {
    const next = this._writeQueue.then(fn, fn)
    this._writeQueue = next.catch(() => Promise.resolve())
    return next
  }

  private async getChosenName(): Promise<string> {
    const db = await this.read()
    return db.data!.chosenConfigName
  }

  private async getChosenConfig(): Promise<WOSConverterConfig> {
    const db = await this.read()
    const name = db.data!.chosenConfigName
    const cfg = db.data!.configs[name]
    if (!cfg) {
      // If missing, rehydrate Default
      db.data!.configs[DEFAULT_CONFIG.name] = DEFAULT_CONFIG
      db.data!.chosenConfigName = DEFAULT_CONFIG.name
      await db.write()
      return DEFAULT_CONFIG
    }
    return cfg
  }

  private async setChosenConfig(mutator: (cfg: WOSConverterConfig) => void): Promise<void> {
    const db = await this.read()
    const name = db.data!.chosenConfigName
    const current = db.data!.configs[name]
    if (!current) throw new Error('Chosen config not found')
    const updated: WOSConverterConfig = { ...current }
    mutator(updated)
    db.data!.configs[name] = updated
    await db.write()
  }

  // --- discovery and selection API (old equivalents) -----------------------

  // old: getAllConfigNames()
  async getAllConfigNames(): Promise<string[]> {
    const db = await this.read()
    return Object.keys(db.data!.configs)
  }

  // old: allConfigNames getter
  async allConfigNames(): Promise<string[]> {
    return this.getAllConfigNames()
  }

  // old: changeConfig(to: string)
  async changeConfig(to: string): Promise<void> {
    const db = await this.read()
    if (!db.data!.configs[to]) {
      throw new Error(`Config "${to}" does not exist`)
    }
    db.data!.chosenConfigName = to
    await db.write()
  }

  // old: copyConfig(): string
  async copyConfig(): Promise<string> {
    const db = await this.read()
    const chosen = db.data!.configs[db.data!.chosenConfigName]
    if (!chosen) throw new Error('Chosen config not found')

    // Check if name already ends with " Copy" or " Copy{digits}"
    const baseName = chosen.name.replace(/\s+Copy(\d*)$/, '')
    const hasCopy = chosen.name !== baseName

    let newName: string
    if (hasCopy) {
      // Already has " Copy" at end, so start with number
      newName = baseName + ' Copy1'
    } else {
      // Doesn't have " Copy" yet, so add it
      newName = chosen.name + ' Copy'
    }

    let i = 1
    const names = new Set(Object.keys(db.data!.configs))
    while (names.has(newName)) {
      i++
      if (hasCopy) {
        newName = baseName + ' Copy' + i
      } else {
        newName = chosen.name + ' Copy' + i
      }
    }

    const copy: WOSConverterConfig = { ...chosen, name: newName }
    db.data!.configs[newName] = copy
    db.data!.chosenConfigName = newName
    await db.write()
    return newName
  }

  // old: deleteCurrent()
  async deleteCurrent(): Promise<void> {
    const db = await this.read()
    const names = Object.keys(db.data!.configs)
    if (names.length <= 1) {
      // Recreate default rather than leaving empty
      db.data!.configs = { [DEFAULT_CONFIG.name]: DEFAULT_CONFIG }
      db.data!.chosenConfigName = DEFAULT_CONFIG.name
      await db.write()
      return
    }
    const current = db.data!.chosenConfigName
    const currentIndex = names.indexOf(current)
    delete db.data!.configs[current]
    const remaining = Object.keys(db.data!.configs)
    const nextIndex = currentIndex < remaining.length ? currentIndex : currentIndex - 1
    db.data!.chosenConfigName = remaining[nextIndex]
    await db.write()
  }

  // old: configName getter
  async getConfigName(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.name
  }

  // old: configName setter
  async setConfigName(name: string): Promise<void> {
    const db = await this.read()
    const currentName = db.data!.chosenConfigName
    const cur = db.data!.configs[currentName]
    if (!cur) throw new Error('Chosen config not found')

    if (name === currentName) return

    if (db.data!.configs[name]) {
      throw new Error(`Config "${name}" already exists`)
    }

    const renamed: WOSConverterConfig = { ...cur, name }
    // remove old key, insert new key
    delete db.data!.configs[currentName]
    db.data!.configs[name] = renamed
    db.data!.chosenConfigName = name
    await db.write()
  }

  // Alias for setConfigName
  async renameConfig(name: string): Promise<void> {
    return this.setConfigName(name)
  }

  // --- field getters and setters (old equivalents) -------------------------

  async setEsci(val: 'y' | 'n'): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.incitesQueryDetails.esci = val
    })
  }
  async getEsci(): Promise<'y' | 'n'> {
    const cfg = await this.getChosenConfig()
    return cfg.incitesQueryDetails.esci
  }

  async setWosToken(token: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosExpandedToken = token
    })
  }
  async getWosToken(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.wosExpandedToken
  }

  async setChosenDirectory(dir: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.chosenDirectory = dir
    })
  }
  async getChosenDirectory(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.chosenDirectory
  }

  async setDisableWosQuery(b: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.disableWosQuery = b
    })
  }
  async getDisableWosQuery(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.disableWosQuery
  }

  async setAddCitedReferences(b: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.addCitedReferences = b
    })
  }
  async getAddCitedReferences(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.addCitedReferences
  }

  async setIcToken(token: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.icToken = token
    })
  }
  async getIcToken(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.icToken
  }

  async setWosDatabaseId(databaseId: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.databaseId = databaseId
    })
  }
  async getWosDatabaseId(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.databaseId
  }

  async setIcSchema(schema: { code: string; name: string }): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.incitesQueryDetails.schema = schema
    })
  }
  async getIcSchema(): Promise<{ code: string; name: string }> {
    const cfg = await this.getChosenConfig()
    return cfg.incitesQueryDetails.schema
  }

  async setWosEdition(edition: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.editions = edition
    })
  }
  async getWosEdition(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.editions
  }

  async setWosLang(lang: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.lang = lang
    })
  }
  async getWosLang(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.lang
  }

  async setWosTimeSpan(timeSpan: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.timeSpan = timeSpan
    })
  }
  async getWosTimeSpan(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.timeSpan
  }

  async setModifiedTimeSpan(timeSpan: string | null): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.modifiedTimeSpan = timeSpan
    })
  }
  async getModifiedTimeSpan(): Promise<string | null> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.modifiedTimeSpan
  }

  async setTcModifiedTimeSpan(timeSpan: string | null): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.tcModifiedTimeSpan = timeSpan
    })
  }
  async getTcModifiedTimeSpan(): Promise<string | null> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.tcModifiedTimeSpan ?? null
  }

  async setWosUsrQuery(usrQuery: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.wosSearchDetails.usrQuery = usrQuery
    })
  }
  async getWosUsrQuery(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.wosSearchDetails.usrQuery
  }

  async setExcel(v: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.excel = v
    })
  }
  async getExcel(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.excel
  }

  async setCsv(v: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.csv = v
    })
  }
  async getCsv(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.csv
  }

  async setJson(v: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.json = v
    })
  }
  async getJson(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.json
  }

  async setXml(v: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.xml = v
    })
  }
  async getXml(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.xml
  }

  async setWosDefault(v: boolean): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.wosDefault = v
    })
  }
  async getWosDefault(): Promise<boolean> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.wosDefault
  }

  async getExportConfig(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.exportSettings.exportConfig
  }
  async setExportConfig(v: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.exportConfig = v
    })
  }

  async getIdsFile(): Promise<string> {
    const cfg = await this.getChosenConfig()
    return cfg.idsFile
  }
  async setIdsFile(file: string): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.idsFile = file
    })
  }

  async setRange(v: [number, number]): Promise<void> {
    await this.setChosenConfig((cfg) => {
      cfg.exportSettings.rangeStart = v[0]
      cfg.exportSettings.rangeStop = v[1]
    })
  }
  async getRange(): Promise<[number, number]> {
    const cfg = await this.getChosenConfig()
    return [cfg.exportSettings.rangeStart, cfg.exportSettings.rangeStop]
  }
}

// --- types ------------------------------------------------------------------

export interface WOSConverterConfig {
  name: string
  wosExpandedToken: string
  icToken: string
  wosSearchDetails: WOSExpandedQueryDetails
  disableWosQuery: boolean
  addCitedReferences: boolean
  idsFile: string
  incitesQueryDetails: InCitesQueryDetails
  exportSettings: ExportSettings
}

export interface WOSExpandedQueryDetails {
  databaseId: string
  editions: string
  lang: string
  usrQuery: string
  timeSpan: string
  modifiedTimeSpan: string | null
  tcModifiedTimeSpan?: string | null
}

export interface InCitesQueryDetails {
  schema: { code: string; name: string }
  esci: 'y' | 'n'
}

export interface ExportSettings {
  excel: boolean
  csv: boolean
  json: boolean
  xml: boolean
  wosDefault: boolean
  exportConfig: string
  chosenDirectory: string
  rangeStart: number
  rangeStop: number
}
