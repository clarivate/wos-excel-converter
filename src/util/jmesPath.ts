import {
  ColumnCollectionConfig,
  ColumnConfig,
  ExportConfig,
  SheetConfig
} from "@/apis/helper/ExportConfig";
import { ScalarValue } from "@/util/parse";

export const configArrayToJMES = (columns: Array<ColumnConfig>): string => {
  return columns.map(c => c.path).join(",");
};

export const collectionColumnConfigToJMES = (
  colConfig: ColumnCollectionConfig
): string => {
  let result = colConfig.mainPath + ".[" + configArrayToJMES(colConfig.columns);
  if (colConfig.columnCollection && colConfig.columnCollection.length > 0) {
    result +=
      "," +
      colConfig.columnCollection
        ?.map(cc => collectionColumnConfigToJMES(cc))
        .join(",") +
      "]";
  } else {
    result += "]";
  }
  return result;
};

const configAndCollection = (
  columns: Array<ColumnConfig>,
  colColl?: Array<ColumnCollectionConfig>
): string => {
  let result = configArrayToJMES(columns);
  if (colColl && colColl.length > 0) {
    result += "," + colColl?.map(cc => collectionColumnConfigToJMES(cc)) + "]";
  } else {
    result += "]";
  }
  return result;
};

export const sheetPath = (
  rowNumber: number,
  sheetConfig: SheetConfig,
  rowArrayPath: string,
  referenceValues?: Array<ScalarValue>
): string => {
  const adaptedRowPath = rowArrayPath.replace("*", rowNumber + "");
  let result = adaptedRowPath + "." + sheetConfig.mainPath + ".[";
  if (referenceValues) {
    result += referenceValues.map(val => "'" + val + "'").join(",") + ",";
  }
  result += configAndCollection(
    sheetConfig.columns,
    sheetConfig.columnCollection
  );
  return result;
};

export const mainPath = (config: ExportConfig): string => {
  let result = config.rowArrayPath + ".[";
  result += configAndCollection(config.columns, config.columnCollection);
  return result;
};
const columnNames = (columns: Array<ColumnConfig>): Array<string> => {
  return columns.map(c => c.name);
};

const columnCollectionNames = (
  colColl: ColumnCollectionConfig
): Array<string> => {
  let result: Array<string> = [];
  result = result.concat(columnNames(colColl.columns));
  colColl.columnCollection?.forEach(
    cc => (result = result.concat(columnCollectionNames(cc)))
  );
  return result;
};
const columnCollectionsNames = (
  ccs?: Array<ColumnCollectionConfig>
): Array<string> => {
  let result: Array<string> = [];
  ccs?.forEach(cc => (result = result.concat(columnCollectionNames(cc))));
  return result;
};

export const sheetColumns = (
  columns: Array<ColumnConfig>,
  ccs?: Array<ColumnCollectionConfig>,
  withReferences?: {
    referenceColumns: Array<string>;
    mainHeader: Array<string>;
  }
): Array<string> => {
  let result: Array<string> = [];
  if (withReferences) {
    const correctReferences = withReferences.referenceColumns
      .map(ref => withReferences.mainHeader.includes(ref))
      .reduce((prev, next) => prev && next);
    if (!correctReferences) {
      throw new Error(
        "References " +
          withReferences.referenceColumns +
          "are not present in " +
          withReferences.mainHeader
      );
    } else {
      result = result.concat(withReferences.referenceColumns);
    }
  }
  result = result.concat(columnNames(columns));
  result = result.concat(columnCollectionsNames(ccs));
  return result;
};

export const incitesUTs = (): string => {
  return "api[].rval[].ACCESSION_NUMBER";
};

export const wosUTs = (isQuery: boolean): string => {
  return isQuery
    ? "Records.records.REC[].UID"
    : "Data.Records.records.REC[].UID";
};
