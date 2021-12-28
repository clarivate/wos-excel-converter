import { stream, Worksheet } from "exceljs";
import { ExportConfig, SheetConfig } from "@/apis/helper/ExportConfig";
import * as Excel from "exceljs";
import { flattenArrays, RawValue } from "@/util/parse";
import { JSONValue, search } from "@metrichor/jmespath";
import { mainPath, sheetColumns, sheetPath } from "@/util/jmesPath";
import WorkbookWriter = stream.xlsx.WorkbookWriter;
import { registerConcatFunction } from "@/util/io/wosJmesFunctions";
import adjustConfig from "@/apis/configs/adjustConfig";

interface WorkbookInternal {
  workbook: WorkbookWriter;
  mainSheet: Worksheet;
  otherSheets: Array<Worksheet>;
  mainHeader: Array<string>;
}
export class ExcelGenerator {
  private readonly _workBook: WorkbookInternal;
  private readonly _exportConfig: ExportConfig;
  private readonly _wosData: boolean;
  private readonly _icData: boolean;

  constructor(
    eConfig: ExportConfig,
    excelFile: string,
    wosData: boolean,
    icData: boolean
  ) {
    registerConcatFunction();

    this._wosData = wosData;
    this._icData = icData;
    this._exportConfig = adjustConfig(eConfig, wosData, icData);
    const options = {
      filename: excelFile,
      useStyles: false,
      useSharedStrings: false
    };
    const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = "WOS API Converter";
    workbook.lastModifiedBy = "WOS API Converter";
    workbook.created = new Date();
    workbook.modified = new Date();
    const resOutSheet = workbook.addWorksheet(this._exportConfig.sheetName);
    const header = sheetColumns(
      this._exportConfig.columns,
      this._exportConfig.columnCollection
    );
    resOutSheet.addRow(header).commit();
    const otherSheets = this._exportConfig.sheets?.map((sheet: SheetConfig) => {
      const sheetWB = workbook.addWorksheet(sheet.sheetName);
      let columnsHeader: Array<string>;
      if (sheet.referenceColumns) {
        columnsHeader = sheetColumns(sheet.columns, sheet.columnCollection, {
          referenceColumns: sheet.referenceColumns,
          mainHeader: header
        });
      } else {
        columnsHeader = sheetColumns(sheet.columns, sheet.columnCollection);
      }

      sheetWB.addRow(columnsHeader).commit();
      return sheetWB;
    });
    this._workBook = {
      workbook: workbook,
      mainSheet: resOutSheet,
      otherSheets: otherSheets ? otherSheets : [],
      mainHeader: header ? header : []
    };
  }

  exportData(wosResponse: JSONValue) {
    const mainJMESPath = mainPath(this._exportConfig);

    const parsedData = search(wosResponse, mainJMESPath) as Array<
      Array<RawValue>
    > | null;
    if (parsedData != null) {
      const rows = parsedData.flatMap(arr => flattenArrays(arr));
      rows.forEach(row => {
        this._workBook.mainSheet.addRow(row).commit();
      });

      this._exportConfig.sheets?.forEach((otherSheet, sheetIndex) => {
        rows.forEach((row, rowIndex) => {
          const wbSheet = this._workBook.otherSheets[sheetIndex];
          const referenceValues = otherSheet.referenceColumns
            ?.map(col =>
              this._workBook.mainHeader.findIndex(mainCol => mainCol == col)
            )
            .map(id => row[id]);
          const sheetJMESPath = sheetPath(
            rowIndex,
            otherSheet,
            this._exportConfig.rowArrayPath,
            referenceValues
          );
          const sheetParsedData = search(wosResponse, sheetJMESPath) as Array<
            Array<RawValue>
          > | null;
          if (sheetParsedData != null) {
            const sheetRows = sheetParsedData.flatMap(arr =>
              flattenArrays(arr)
            );
            sheetRows.forEach(row => wbSheet.addRow(row).commit());
          }
        });
      });
    }
  }

  async commitAll() {
    await this._workBook.workbook.commit();
  }
}
