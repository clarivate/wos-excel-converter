export interface ExportConfig {
  sheetName: string;
  rowArrayPath: string;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
  sheets?: Array<SheetConfig>;
}

export interface SheetConfig {
  sheetName: string;
  mainPath: string;
  referenceColumns?: Array<string>;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
}

export interface ColumnCollectionConfig {
  mainPath: string;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
}

export interface ColumnConfig {
  name: string;
  path: string;
}
