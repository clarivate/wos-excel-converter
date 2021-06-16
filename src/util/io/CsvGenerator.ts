import { ExportConfig } from "@/apis/helper/ExportConfig";
import * as fs from "fs";
import * as path from "path";
import * as csv from "fast-csv";
import { registerConcatFunction } from "@/util/io/wosJmesFunctions";

export default class CsvGenerator {
  private readonly _exportConfig: ExportConfig;
  constructor(exportConfig: ExportConfig) {
    registerConcatFunction();
    this._exportConfig = exportConfig;
  }
}
