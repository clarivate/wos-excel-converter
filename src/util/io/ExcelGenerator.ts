import { stream, Worksheet } from "exceljs";
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
import WorkbookWriter = stream.xlsx.WorkbookWriter;

interface WorkbookInternal {
  workbook: WorkbookWriter;
  mainSheet: Worksheet;
  otherSheets: Array<Worksheet>;
  mainHeader: Array<string>;
}

export class ExcelGenerator {
  static functionRegistered = false;
  private readonly _workBook: WorkbookInternal;
  private readonly _exportConfig: ExportConfig;

  constructor(exportConfig: ExportConfig, fileName: string) {
    if (!ExcelGenerator.functionRegistered) {
      try {
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
      } catch (e) {
        //noop
      }
    }
    this._exportConfig = exportConfig;
    const options = {
      filename: fileName,
      useStyles: false,
      useSharedStrings: false
    };
    const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = "WOS API Converter";
    workbook.lastModifiedBy = "WOS API Converter";
    workbook.created = new Date();
    workbook.modified = new Date();
    const resOutSheet = workbook.addWorksheet(exportConfig.sheetName);
    const header = sheetColumns(
      exportConfig.columns,
      exportConfig.columnCollection
    );
    resOutSheet.addRow(header).commit();
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

  exportData(responseData: JSONValue) {
    const mainJMESPath = mainPath(this._exportConfig);

    const parsedData = search(responseData, mainJMESPath) as Array<
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
          const sheetParsedData = search(responseData, sheetJMESPath) as Array<
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
    // const buffer = await this._workBook.workbook.xlsx.writeBuffer();
    // fs.writeFileSync(fileName, new Uint8Array(buffer));
  }
}
