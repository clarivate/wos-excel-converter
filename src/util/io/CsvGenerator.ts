import { ExportConfig, SheetConfig } from "@/apis/helper/ExportConfig";
import * as fs from "fs";
import * as csv from "fast-csv";
import { registerConcatFunction } from "@/util/io/wosJmesFunctions";
import os from "os";
import { mainPath, sheetColumns, sheetPath } from "@/util/jmesPath";
import { CsvFormatterStream } from "@fast-csv/format/build/src/CsvFormatterStream";
import { Row } from "@fast-csv/format/build/src/types";
import { JSONValue, search } from "@metrichor/jmespath";
import { flattenArrays, RawValue } from "@/util/parse";
import adjustConfig from "@/apis/configs/adjustConfig";

interface CsvFilesInternal {
  mainCSV: CsvFormatterStream<Row, Row>;
  otherCSVs: Array<CsvFormatterStream<Row, Row>>;
  mainHeader: Array<string>;
}
const pathSeparator = os
  .type()
  .toLowerCase()
  .startsWith("win")
  ? "\\"
  : "/";
export default class CsvGenerator {
  private readonly _exportConfig: ExportConfig;
  private readonly _csvStreams: CsvFilesInternal;
  private readonly _wosData: boolean;
  private readonly _icData: boolean;

  constructor(
    eConfig: ExportConfig,
    dir: string,
    wosData: boolean,
    icData: boolean
  ) {
    registerConcatFunction();
    this._wosData = wosData;
    this._icData = icData;
    this._exportConfig = adjustConfig(eConfig, wosData, icData);
    const resOutStreamFile = fs.createWriteStream(
      dir + pathSeparator + this._exportConfig.sheetName + ".csv"
    );

    const csvFormat = {
      rowDelimiter: this._exportConfig.csv?.rowDelimiter
        ? this._exportConfig.csv?.rowDelimiter
        : "\n",
      delimiter: this._exportConfig.csv?.fieldDelimiter
        ? this._exportConfig.csv?.fieldDelimiter
        : ",",
      quote: this._exportConfig.csv?.quote
        ? this._exportConfig.csv?.quote
        : '"',
      escape: this._exportConfig.csv?.quote
        ? this._exportConfig.csv?.quote
        : '"'
    };
    const resOutStream = csv.format(csvFormat);
    resOutStream.pipe(resOutStreamFile);
    const header = sheetColumns(
      this._exportConfig.columns,
      this._exportConfig.columnCollection
    );
    resOutStream.write(header);
    const otherStreams = this._exportConfig.sheets?.map(
      (sheet: SheetConfig) => {
        const file = fs.createWriteStream(
          dir + pathSeparator + sheet.sheetName + ".csv"
        );
        const stream = csv.format(csvFormat);
        stream.pipe(file);
        let columnsHeader: Array<string>;
        if (sheet.referenceColumns) {
          columnsHeader = sheetColumns(sheet.columns, sheet.columnCollection, {
            referenceColumns: sheet.referenceColumns,
            mainHeader: header
          });
        } else {
          columnsHeader = sheetColumns(sheet.columns, sheet.columnCollection);
        }
        stream.write(columnsHeader);
        return stream;
      }
    );
    this._csvStreams = {
      mainCSV: resOutStream,
      otherCSVs: otherStreams ? otherStreams : [],
      mainHeader: header
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
        this._csvStreams.mainCSV.write(row);
      });

      this._exportConfig.sheets?.forEach((otherSheet, sheetIndex) => {
        rows.forEach((row, rowIndex) => {
          const sheetStream = this._csvStreams.otherCSVs[sheetIndex];
          const referenceValues = otherSheet.referenceColumns
            ?.map(col =>
              this._csvStreams.mainHeader.findIndex(mainCol => mainCol == col)
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
            sheetRows.forEach(row => sheetStream.write(row));
          }
        });
      });
    }
  }

  commitAll() {
    this._csvStreams.mainCSV.end();
    this._csvStreams.otherCSVs.forEach(stream => stream.end());
  }
}
