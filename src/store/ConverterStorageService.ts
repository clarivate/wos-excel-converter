const STORAGE_NAME = "apiConverterConfigs";

const DEFAULT_CONFIG: WOSConverterConfig = {
  name: "Default",
  wosExpandedToken: "",
  icToken: "",
  wosSearchDetails: {
    databaseId: "WOS",
    editions: "",
    lang: "",
    usrQuery: "TS=covid* and PY=2020",
    timeSpan: "1D"
  },
  useWosQuery: true,
  idsFile: "",
  incitesQueryDetails: {
    schema: { code: "wos", name: "Web of Science" },
    esci: "n"
  }
};

const map = new Map();
map.set(DEFAULT_CONFIG.name, DEFAULT_CONFIG);
const DEFAULT_CONFIGS: WOSConverterConfigs = {
  configs: map,
  chosenConfig: DEFAULT_CONFIG
};
// eslint-disable-next-line
const replacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries())
    };
  } else return value;
};
// eslint-disable-next-line
const reviver = (key: string, value: any) => {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    }
  }
  return value;
};
export default class ConverterStorageService {
  private static _instance: ConverterStorageService;
  private _chosenConfig: WOSConverterConfig = DEFAULT_CONFIG;
  private constructor() {
    const apiConverterConfStr = localStorage.getItem(STORAGE_NAME);
    if (apiConverterConfStr != null) {
      const localStorageConfig = JSON.parse(
        apiConverterConfStr
      ) as WOSConverterConfigs;
      this._chosenConfig = localStorageConfig.chosenConfig;
    } else {
      const str = JSON.stringify(DEFAULT_CONFIGS, replacer);
      localStorage.setItem(STORAGE_NAME, str);
    }
  }

  public static getInstance(): ConverterStorageService {
    if (!ConverterStorageService._instance) {
      return new ConverterStorageService();
    } else {
      return ConverterStorageService._instance;
    }
  }

  private static getStorageConfigs(): WOSConverterConfigs {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const apiConverterConfStr = localStorage.getItem(STORAGE_NAME)!;
    return JSON.parse(apiConverterConfStr, reviver) as WOSConverterConfigs;
  }

  private updateStorageConfigs(): void {
    const configs = ConverterStorageService.getStorageConfigs();
    configs.chosenConfig = this._chosenConfig;
    configs.configs.set(this._chosenConfig.name, this._chosenConfig);
    localStorage.setItem(STORAGE_NAME, JSON.stringify(configs, replacer));
  }
  public getAllConfigNames(): Array<string> {
    return Array.from(
      ConverterStorageService.getStorageConfigs().configs.keys()
    );
  }

  public changeConfig(to: string): void {
    this.updateStorageConfigs();
    const configTo = ConverterStorageService.getStorageConfigs().configs.get(
      to
    );
    if (configTo) {
      this._chosenConfig = configTo;
    }
    this.updateStorageConfigs();
  }

  public copyConfig(): string {
    let newName = this.configName + " Copy";
    let i = 1;
    while (this.allConfigNames.includes(newName)) {
      newName = newName + i;
      i++;
    }
    const configs = ConverterStorageService.getStorageConfigs();
    configs.configs.set(newName, configs.chosenConfig);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const copied = configs.configs.get(newName)!;
    copied.name = newName;
    configs.configs.set(newName, copied);
    localStorage.setItem(STORAGE_NAME, JSON.stringify(configs, replacer));
    this.changeConfig(newName);
    return newName;
  }

  public deleteCurrent() {
    const configs = ConverterStorageService.getStorageConfigs();
    configs.configs.delete(this._chosenConfig.name);
    localStorage.setItem(STORAGE_NAME, JSON.stringify(configs, replacer));
    const firstConfig = Array.from(configs.configs.keys())[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._chosenConfig = configs.configs.get(firstConfig)!;
    configs.chosenConfig = this._chosenConfig;
    localStorage.setItem(STORAGE_NAME, JSON.stringify(configs, replacer));
  }

  set esci(val: "y" | "n") {
    this._chosenConfig.incitesQueryDetails.esci = val;
    this.updateStorageConfigs();
  }

  get esci(): "y" | "n" {
    return this._chosenConfig.incitesQueryDetails.esci;
  }

  set configName(name: string) {
    const configs = ConverterStorageService.getStorageConfigs();
    configs.configs.delete(this._chosenConfig.name);
    configs.configs.get(name);
    this._chosenConfig.name = name;
    configs.configs.set(this._chosenConfig.name, this._chosenConfig);
    configs.chosenConfig = this._chosenConfig;
    localStorage.setItem(STORAGE_NAME, JSON.stringify(configs, replacer));
  }

  get configName(): string {
    return this._chosenConfig.name;
  }

  get allConfigNames(): Array<string> {
    const configs = ConverterStorageService.getStorageConfigs();
    return Array.from(configs.configs.keys());
  }

  set wosToken(token: string) {
    this._chosenConfig.wosExpandedToken = token;
    this.updateStorageConfigs();
  }

  get wosToken(): string {
    return this._chosenConfig.wosExpandedToken;
  }

  set useWosQuery(b: boolean) {
    this._chosenConfig.useWosQuery = b;
    this.updateStorageConfigs();
  }

  get useWosQuery(): boolean {
    return this._chosenConfig.useWosQuery;
  }

  set icToken(token: string) {
    this._chosenConfig.icToken = token;
    this.updateStorageConfigs();
  }

  get icToken(): string {
    return this._chosenConfig.icToken;
  }

  set wosDatabaseId(databaseId: string) {
    this._chosenConfig.wosSearchDetails.databaseId = databaseId;
    this.updateStorageConfigs();
  }

  get wosDatabaseId(): string {
    return this._chosenConfig.wosSearchDetails.databaseId;
  }

  set icSchema(icSchema: { code: string; name: string }) {
    this._chosenConfig.incitesQueryDetails.schema = icSchema;
    this.updateStorageConfigs();
  }

  get icSchema(): { code: string; name: string } {
    return this._chosenConfig.incitesQueryDetails.schema;
  }

  set wosEdition(edition: string) {
    this._chosenConfig.wosSearchDetails.editions = edition;
    this.updateStorageConfigs();
  }

  get wosEdition(): string {
    return this._chosenConfig.wosSearchDetails.editions;
  }

  set wosLang(lang: string) {
    this._chosenConfig.wosSearchDetails.lang = lang;
    this.updateStorageConfigs();
  }

  get wosLang(): string {
    return this._chosenConfig.wosSearchDetails.lang;
  }

  set wosTimeSpan(timeSpan: string) {
    this._chosenConfig.wosSearchDetails.timeSpan = timeSpan;
    this.updateStorageConfigs();
  }

  get wosTimeSpan(): string {
    return this._chosenConfig.wosSearchDetails.timeSpan;
  }

  set wosUsrQuery(usrQuery: string) {
    this._chosenConfig.wosSearchDetails.usrQuery = usrQuery;
    this.updateStorageConfigs();
  }

  get wosUsrQuery(): string {
    return this._chosenConfig.wosSearchDetails.usrQuery;
  }

  get idsFile(): string {
    return this._chosenConfig.idsFile;
  }

  set idsFile(file: string) {
    this._chosenConfig.idsFile = file;
    this.updateStorageConfigs();
  }
}

export interface WOSConverterConfigs {
  configs: Map<string, WOSConverterConfig>;
  chosenConfig: WOSConverterConfig;
}

export interface WOSConverterConfig {
  name: string;
  wosExpandedToken: string;
  icToken: string;
  wosSearchDetails: WOSExpandedQueryDetails;
  useWosQuery: boolean;
  idsFile: string;
  incitesQueryDetails: InCitesQueryDetails;
}

export interface WOSExpandedQueryDetails {
  databaseId: string;
  editions: string;
  lang: string;
  usrQuery: string;
  timeSpan: string;
}

export interface InCitesQueryDetails {
  schema: { code: string; name: string };
  esci: "y" | "n";
}
