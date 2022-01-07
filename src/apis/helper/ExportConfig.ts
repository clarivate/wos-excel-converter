export interface ExportConfig {
  sheetName: string;
  api: "WOS" | "InCites" | "Journals";
  rowArrayPath: string;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
  sheets?: Array<SheetConfig>;
  csv?: CSVConfig;
}

export interface SheetConfig {
  sheetName: string;
  api: "WOS" | "InCites" | "Journals";
  mainPath: string;
  referenceColumns?: Array<string>;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
  csv?: CSVConfig;
}

export interface ColumnCollectionConfig {
  mainPath: string;
  api: "WOS" | "InCites" | "Journals";
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
}

export interface ColumnConfig {
  name: string;
  path: string;
}

export interface CSVConfig {
  fieldDelimiter: string;
  rowDelimiter: string;
  quote: string;
}
