import {
  ColumnCollectionConfig,
  ExportConfig
} from "@/apis/helper/ExportConfig";

const filterCcs = (
  ccs: ColumnCollectionConfig[] | undefined,
  filter: (cc: ColumnCollectionConfig) => boolean
): ColumnCollectionConfig[] | undefined => {
  if (!ccs) return ccs;
  const result = ccs.filter(filter);
  result.forEach(
    cc => (cc.columnCollection = filterCcs(cc.columnCollection, filter))
  );
  return result;
};
/**
 * This method helps to filter attributes from exportConfig if one of the tokens is not defined
 * @param exportConfig
 * @param wosData
 * @param icData
 */
const adjustConfig = (
  exportConfig: ExportConfig,
  wosData: boolean,
  icData: boolean
): ExportConfig => {
  const result = Object.assign({}, exportConfig);
  if (wosData && !icData) {
    result.columnCollection = filterCcs(
      result.columnCollection,
      cc => cc.api != "InCites"
    );
    result.sheets = result.sheets?.filter(s => s.api != "InCites");
  } else if (!wosData && icData) {
    result.columns = result.columns.filter(c => c.path == "UID");
    result.columnCollection = filterCcs(
      result.columnCollection,
      cc => cc.api != "WOS"
    );
    result.sheets = result.sheets?.filter(s => s.api != "WOS");
  }
  return result;
};

export default adjustConfig;
