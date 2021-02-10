<template>
  <v-container>
    <h3>4.Generate file</h3>
    <v-form class="pt-8">
      <v-row no-gutters>
        <v-col lg="6">
          <v-text-field
            dense
            flat
            outlined
            readonly
            label="Directory of file"
            :append-icon="icons.folder"
            @click:append="chooseDirectory"
            v-model="chosenDirectory"
            class="text-sm-body-2"
            @click="chooseDirectory"
          >
          </v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col lg="6">
          <v-text-field
            dense
            flat
            outlined
            label="Filename"
            suffix="_ddMMyyyyHHmmss.xlsx"
            v-model="fileName"
          >
          </v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-btn
          class="text-none"
          @click="exportSampleData"
          :disabled="!exportPossible"
        >
          Export sample of 10 records
        </v-btn>

        <v-btn
          class="text-none ml-3"
          color="primary"
          @click="exportAllData"
          :disabled="!exportPossible"
        >
          Export all
        </v-btn>
      </v-row>
      <v-alert
        v-if="!exportPossible"
        dense
        colored-border
        color="#eeeeee"
        elevation="0"
        type="info"
        >Validate query and choose a folder before exporting.
      </v-alert>
    </v-form>
    <v-row no-gutters class="pt-10">
      <v-col cols="12">
        <v-progress-linear
          class="pl-3 pl-3"
          :value="progress"
          height="25"
          disabled
          dark
          v-if="generationStarted || finished"
        >
          <strong>{{ Math.ceil(progress) }}%</strong>
        </v-progress-linear>
      </v-col>
      <v-col cols="12" v-if="finished && error == null" class="pt-8">
        <v-alert type="info" outlined>
          <span class="text-sm-body-2">
            File generated successfully at
            {{ completeFilePath(sampleClicked) }}</span
          ></v-alert
        >
      </v-col>
      <v-col cols="12" class="mt-5" v-if="generationStarted">
        Your file is being generated. Until then nothing is clickable.
      </v-col>
    </v-row>
    <v-alert type="error" class="mt-5" v-if="error != null">
      Something went wrong: {{ error }}
    </v-alert>
  </v-container>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "vue-property-decorator";
import { mdiFolderOpen } from "@mdi/js";
import { search } from "@metrichor/jmespath";
import fs from "fs";
import * as Excel from "exceljs";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";
import dateFormat from "dateformat";
import { Workbook, Worksheet } from "exceljs";
import { ColumnConfig, SheetConfig } from "@/apis/helper/ExportConfig";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dialog = require("electron").remote.dialog;

type RawParsed = string | number | Array<RawParsed>;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const cartesian = (a: Array<RawParsed>): Array<string | number> =>
  a
    .map(v => {
      if (!Array.isArray(v)) {
        return new Array([v]);
      } else {
        return v;
      }
    })
    .reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

@Component({})
export default class GenerateFile extends Vue {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  private _workBook: {
    workbook: Workbook;
    mainSheet: Worksheet;
    otherSheets: Array<Worksheet>;
    mainHeader: Array<string>;
  };

  private progress = 0;

  private error: string | null = null;
  private finished = false;
  private sampleClicked = false;

  get generationStarted(): boolean {
    return this.wos.generationStarted;
  }
  get fileName(): string | undefined {
    return this.wos.fileName;
  }

  set fileName(fileName: string | undefined) {
    this.wos.updateFileName(fileName);
  }

  get chosenDirectory(): string | undefined {
    return this.wos.chosenDirectory;
  }

  set chosenDirectory(dir: string | undefined) {
    this.wos.updateChosenDirectory(dir);
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get icons() {
    return {
      folder: mdiFolderOpen
    };
  }

  get exportPossible(): boolean {
    return (
      this.wos.queryStatus > 0 &&
      this.chosenDirectory != null &&
      !this.wos.exportConfigError &&
      this.fileName != null
    );
  }

  createWorkBookSheets(): {
    workbook: Workbook;
    mainSheet: Worksheet;
    otherSheets: Array<Worksheet>;
    mainHeader: Array<string>;
  } {
    const workbook = new Excel.Workbook();
    workbook.creator = "WOS API Converter";
    workbook.lastModifiedBy = "WOS API Converter";
    workbook.created = new Date();
    workbook.modified = new Date();

    const resOutSheet = workbook.addWorksheet(this.wos.exportConfig?.sheetName);
    const header = this.wos.exportConfig?.columns.map(col => {
      return col.name;
    });
    if (this.wos.exportConfig?.columnCollection) {
      this.wos.exportConfig.columnCollection.forEach(colColl => {
        colColl.columns.forEach(col => {
          if (header) {
            header.push(col.name);
          }
        });
      });
    }
    resOutSheet.addRow(header);
    const otherSheets = this.wos.exportConfig?.sheets.map(
      (sheet: SheetConfig) => {
        const sheetWB = workbook.addWorksheet(sheet.sheetName);

        const columnsHeader = sheet.columns.map((col: ColumnConfig) => {
          return col.name;
        });
        if (sheet.columnCollection) {
          sheet.columnCollection.forEach(colColl => {
            colColl.columns.forEach(col => {
              columnsHeader.push(col.name);
            });
          });
        }
        if (sheet.referenceColumns && header) {
          let correctReferences = true;
          sheet.referenceColumns.forEach(col => {
            correctReferences = correctReferences && header.includes(col);
            if (!correctReferences) {
              throw sheet.sheetName +
                " has defined reference column " +
                col +
                " which is not present in " +
                resOutSheet.name;
            }
          });
          sheet.referenceColumns
            .reverse()
            .forEach(refCol => columnsHeader.unshift(refCol));
        }
        sheetWB.addRow(columnsHeader);
        return sheetWB;
      }
    );

    this._workBook = {
      workbook: workbook,
      mainSheet: resOutSheet,
      otherSheets: otherSheets ? otherSheets : [],
      mainHeader: header ? header : []
    };
    return this._workBook;
  }

  completeFilePath(sample: boolean): string {
    return (
      this.chosenDirectory +
      "/" +
      (sample ? "sample_" : "") +
      this.fileName +
      "_" +
      dateFormat(new Date(), "ddMMyyyyHHmmss") +
      ".xlsx"
    );
  }

  async exportBatch10(startRecord: number) {
    const data = await this.wos.runQuery({
      startRecord: startRecord,
      count: 10
    });
    const jmesQuery = this.queryJmesPathResOut;
    const rows = search(data, jmesQuery) as Array<Array<RawParsed>>;
    const flattenedRows = rows.map(arr => cartesian(arr)).flat();
    this._workBook?.mainSheet.addRows(flattenedRows);
    flattenedRows.forEach((value, index) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      this._workBook?.otherSheets.forEach((otherSheet, sheetIndex) => {
        const referenceColumns = this.wos.exportConfig?.sheets[sheetIndex]
          .referenceColumns;
        let referenceValues;
        if (referenceColumns) {
          const referenceIds: number[] = referenceColumns.map(col =>
            this._workBook?.mainHeader.findIndex(mainCol => col == mainCol)
          );
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          referenceValues = referenceIds.map((id: number) => value[id]);
        }
        this.wos.exportConfig?.sheets[sheetIndex].rowArrayPath.forEach(
          mainPath => {
            const sheetJmesQuery = this.queryJmesPathOther(
              sheetIndex,
              index,
              mainPath,
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              referenceValues
            );
            const otherSheetRows = search(data, sheetJmesQuery) as Array<
              Array<RawParsed>
            >;

            if (otherSheetRows != null && otherSheetRows.length > 0) {
              const otherSheetRowsFlattened = otherSheetRows
                .map(arr => cartesian(arr))
                .flat();
              otherSheet.addRows(otherSheetRowsFlattened);
            }
          }
        );
      });
    });
  }

  async exportSampleData() {
    try {
      this.sampleClicked = true;
      this.finished = false;
      this.progress = 0;
      this.wos.updateGenerationStarted(true);
      const workbook = this.createWorkBookSheets();
      this.progress = 2;
      const data = await this.wos.runQuery({
        startRecord: 1,
        count: 10
      });
      this.progress = 25;
      const jmesQuery = this.queryJmesPathResOut;
      const rows = search(data, jmesQuery) as Array<Array<RawParsed>>;
      const flattenedRows = rows.map(arr => cartesian(arr)).flat();
      workbook?.mainSheet.addRows(flattenedRows);
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      flattenedRows.forEach((value: Array<number | string>, index: number) => {
        workbook?.otherSheets.forEach((otherSheet, sheetIndex) => {
          const referenceColumns = this.wos.exportConfig?.sheets[sheetIndex]
            .referenceColumns;
          let referenceValues: Array<string | number>;
          if (referenceColumns) {
            const referenceIds = referenceColumns.map(col =>
              workbook.mainHeader.findIndex(mainCol => col == mainCol)
            );
            referenceValues = referenceIds.map(id => value[id]);
          }
          this.wos.exportConfig?.sheets[sheetIndex].rowArrayPath.forEach(
            mainPath => {
              const sheetJmesQuery = this.queryJmesPathOther(
                sheetIndex,
                index,
                mainPath,
                referenceValues
              );
              const otherSheetRows = search(data, sheetJmesQuery) as Array<
                Array<RawParsed>
              >;

              if (otherSheetRows != null && otherSheetRows.length > 0) {
                const otherSheetRowsFlattened = otherSheetRows
                  .map(arr => cartesian(arr))
                  .flat();
                otherSheet.addRows(otherSheetRowsFlattened);
              }
            }
          );
        });
        this.progress += 7;
      });
      const buffer = await workbook?.workbook.xlsx.writeBuffer();
      if (buffer != undefined) {
        fs.writeFileSync(this.completeFilePath(true), new Uint8Array(buffer));
        this.progress = 100;
        this.wos.updateGenerationStarted(false);
        this.finished = true;
      }
    } catch (e) {
      this.error = e.toString();
      this.wos.updateGenerationStarted(false);
      this.finished = true;
      throw e;
    }
  }

  async exportAllData() {
    try {
      this.sampleClicked = false;
      this.finished = false;
      this.progress = 0;
      this.wos.updateGenerationStarted(true);
      this.createWorkBookSheets();
      this.progress = 1;
      if (this.wos.queryFeedback) {
        const progressStep = 95 / (this.wos.queryFeedback?.recordsFound / 10);
        for (let i = 1; i <= this.wos.queryFeedback?.recordsFound; i += 10) {
          await this.exportBatch10(i);
          this.progress += progressStep;
        }
      }

      const buffer = await this._workBook?.workbook.xlsx.writeBuffer();
      if (buffer != undefined) {
        fs.writeFileSync(
          this.completeFilePath(this.sampleClicked),
          new Uint8Array(buffer)
        );
        this.progress = 100;
        this.wos.updateGenerationStarted(false);
        this.finished = true;
      }
    } catch (e) {
      this.error = e.toString();
      this.wos.updateGenerationStarted(false);
      this.finished = true;
      throw e;
    }
  }

  get queryJmesPathResOut(): string {
    let queryPath =
      this.wos.exportConfig?.rowArrayPath +
      ".[" +
      this.wos.exportConfig?.columns.map(col => col.path).join(",");
    if (this.wos.exportConfig?.columnCollection) {
      this.wos.exportConfig.columnCollection.forEach(colColl => {
        queryPath +=
          "," +
          colColl.columns
            .map(col => colColl.mainPath + "." + col.path)
            .join(",");
      });
    }
    queryPath += "]";
    return queryPath;
  }

  queryJmesPathOther(
    otherSheetIndex: number,
    rowIndex: number,
    mainPath: string,
    referenceValues: Array<string | number> | undefined
  ): string {
    const sheetConfig = this.wos.exportConfig?.sheets[otherSheetIndex];
    let queryPath =
      this.wos.exportConfig?.rowArrayPath.replace("*", rowIndex + "") +
      "." +
      mainPath +
      ".[";

    if (referenceValues) {
      queryPath += referenceValues.map(val => "`" + val + "`").join(",") + ",";
    }
    queryPath += sheetConfig?.columns.map(col => col.path).join(",");
    if (sheetConfig?.columnCollection) {
      sheetConfig.columnCollection.forEach(colColl => {
        queryPath +=
          "," +
          colColl.columns
            .map(col => colColl.mainPath + "." + col.path)
            .join(",");
      });
    }
    queryPath += "]";
    return queryPath;
  }

  chooseDirectory() {
    dialog
      .showOpenDialog({
        title: "Select a folder",
        properties: ["openDirectory"]
      })
      .then((value: Electron.OpenDialogReturnValue) => {
        this.wos.updateChosenDirectory(value.filePaths[0]);
      });
  }
}
</script>

<style lang="scss">
.v-text-field__suffix {
  color: #8f8989 !important;
}
</style>
