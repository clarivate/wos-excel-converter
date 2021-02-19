import { Workbook, Worksheet } from "exceljs";
import { ExportConfig, SheetConfig } from "@/apis/helper/ExportConfig";
import * as Excel from "exceljs";
import { flattenArrays, RawValue } from "@/util/parse";
import {
  JSONValue,
  search,
  registerFunction,
  TYPE_ANY,
  TYPE_STRING,
  TYPE_NULL
} from "@metrichor/jmespath";
import { mainPath, sheetColumns, sheetPath } from "@/util/jmesPath";
import fs from "fs";

interface WorkbookInternal {
  workbook: Workbook;
  mainSheet: Worksheet;
  otherSheets: Array<Worksheet>;
  mainHeader: Array<string>;
}

export class ExcelGenerator {
  static functionRegistered = false;
  private readonly _workBook: WorkbookInternal;
  private readonly _exportConfig: ExportConfig;

  constructor(exportConfig: ExportConfig) {
    if (!ExcelGenerator.functionRegistered) {
      registerFunction(
        "concat",
        resolvedArgs => {
          const [maybeArr, separator] = resolvedArgs;
          if (Array.isArray(maybeArr)) {
            return maybeArr.map(elem => elem.toString()).join(separator);
          } else if (maybeArr != null) {
            return maybeArr.toString();
          }
          return null;
        },
        [
          {
            types: [TYPE_ANY, TYPE_NULL]
          },
          { types: [TYPE_STRING] }
        ]
      );
      ExcelGenerator.functionRegistered = true;
    }
    this._exportConfig = exportConfig;
    const workbook = new Excel.Workbook();
    workbook.creator = "WOS API Converter";
    workbook.lastModifiedBy = "WOS API Converter";
    workbook.created = new Date();
    workbook.modified = new Date();
    const resOutSheet = workbook.addWorksheet(exportConfig.sheetName);
    const header = sheetColumns(
      exportConfig.columns,
      exportConfig.columnCollection
    );
    resOutSheet.addRow(header);
    const otherSheets = exportConfig.sheets?.map((sheet: SheetConfig) => {
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

      sheetWB.addRow(columnsHeader);
      return sheetWB;
    });
    this._workBook = {
      workbook: workbook,
      mainSheet: resOutSheet,
      otherSheets: otherSheets ? otherSheets : [],
      mainHeader: header ? header : []
    };
  }

  exportData(responseData: JSONValue) {
    const mainJMESPath = mainPath(this._exportConfig);

    const parsedData = search(responseData, mainJMESPath) as Array<
      Array<RawValue>
    > | null;
    if (parsedData != null) {
      const rows = parsedData.flatMap(arr => flattenArrays(arr));
      this._workBook.mainSheet.addRows(rows);

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
          const sheetParsedData = search(responseData, sheetJMESPath) as Array<
            Array<RawValue>
          > | null;
          if (sheetParsedData != null) {
            const sheetRows = sheetParsedData.flatMap(arr =>
              flattenArrays(arr)
            );
            wbSheet.addRows(sheetRows);
          }
        });
      });
    }
  }

  async saveFile(fileName: string) {
    const buffer = await this._workBook.workbook.xlsx.writeBuffer();
    fs.writeFileSync(fileName, new Uint8Array(buffer));
  }
}
