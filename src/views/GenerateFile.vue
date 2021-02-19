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
            hint="For every 10.000 records a new file will be created with a postfix partX, e.g. if you 25.000 records to export, then three parts will be created, i.e. part1 contains 1-10.000 records, part2 contains 10.001-20.0000 and part3 contains 20.001-25.000."
            suffix="_ddMMyyyyHHmmss_partX.xlsx"
            persistent-hint
            v-model="fileName"
          >
          </v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters class="mb-6">
        <v-col lg="12">
          <v-card flat color="transparent">
            <v-card-subtitle
              >Define the range of records you want to export?</v-card-subtitle
            >
            <v-card-text>
              <v-range-slider
                v-model="range"
                :max="maxSelect"
                :min="1"
                hide-details
                class="align-center"
                :disabled="!exportPossible"
              >
                <template v-slot:prepend>
                  <v-text-field
                    :value="range[0]"
                    class="mt-0 pt-0"
                    hide-details
                    type="number"
                    hint="First record"
                    persistent-hint
                    style="width: 60px"
                    @change="$set(range, 0, $event)"
                    @input="$set(range, 0, $event)"
                  ></v-text-field>
                </template>
                <template v-slot:append>
                  <v-text-field
                    :value="range[1]"
                    class="mt-0 pt-0"
                    hide-details
                    type="number"
                    hint="Number of records"
                    persistent-hint
                    style="width: 60px"
                    @change="$set(range, 1, $event)"
                    @input="$set(range, 1, $event)"
                  ></v-text-field>
                </template>
              </v-range-slider>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-btn
          class="text-none ml-3"
          color="primary"
          @click="exportData(25)"
          :disabled="!exportPossible"
        >
          Start export
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
        <span
          class="text-sm-body-2"
          v-show="generationStarted && !finished && error == null"
          >{{ remainingTime }}</span
        >
      </v-col>
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
      <v-col cols="12" v-if="savedFiles.length > 0" class="pt-8">
        <v-alert type="info" outlined>
          <div class="text-sm-body-2">
            Saved Files:
            <v-list dense flat>
              <v-list-item
                dense
                link
                v-for="(filePath, index) in savedFiles"
                :key="index"
                @click="openFile(filePath)"
              >
                <v-list-item-content>{{ filePath }}</v-list-item-content>
              </v-list-item>
            </v-list>
            <span v-if="finished && error == null">
              Export finished successfully.<br />
              Duration : {{ generationDuration }}
            </span>
          </div>
        </v-alert>
      </v-col>
      <v-col cols="12" class="mt-5" v-if="generationStarted">
        Your file is being generated. Until then nothing is clickable.
      </v-col>
    </v-row>
    <v-alert type="error" class="mt-5" v-if="error != null">
      <v-row>
        Something went wrong at startRecord = {{ range[0] }}. You can save the
        excel with downloaded records.
        <v-btn class="text-none" @click="saveFile">
          Save current records
        </v-btn>
      </v-row>
      <v-row>
        {{ error }}
      </v-row>
    </v-alert>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mdiFolderOpen } from "@mdi/js";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";
import dateFormat from "dateformat";
import { ExcelGenerator } from "@/util/io/ExcelGenerator";
import os from "os";

const dialog = require("electron").remote.dialog;
const shell = require("electron").shell;

const NEW_FILE_AFTER_RECORD = 10000;

@Component({})
export default class GenerateFile extends Vue {
  private excelGenerator?: ExcelGenerator;

  private progress = 0;

  private error: string | null = null;
  private finished = false;

  private batchAvgDuration = 0;
  private batchSum = 0;
  private remainingBatches = 0;
  private overallTime = 0;
  private exportCounter = 0;
  private fileIsSaving = false;
  private savedFiles: Array<string> = [];
  private part = 1;

  range = [1, 10];

  get maxSelect(): number {
    if (this.wos.queryFeedback?.recordsFound) {
      return this.wos.queryFeedback?.recordsFound;
    } else {
      return 1;
    }
  }

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

  get remainingTime(): string {
    return (
      "Remaining time: " +
      this.msToTime(this.remainingBatches * this.batchAvgDuration)
    );
  }
  get generationDuration(): string {
    return this.msToTime(this.overallTime);
  }

  msToTime(duration: number): string {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    return hours + "h " + minutes + " min " + seconds + " sec ";
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

  completeFilePath(): string {
    const pathSeparator = os
      .type()
      .toLowerCase()
      .startsWith("win")
      ? "\\"
      : "/";
    return (
      this.chosenDirectory +
      pathSeparator +
      this.fileName +
      "_" +
      dateFormat(new Date(), "ddMMyyyyHHmmss") +
      "_part" +
      this.part +
      ".xlsx"
    );
  }

  async exportBatch(start: number, batchSize: number) {
    const data = await this.wos.runQuery({
      startRecord: start,
      count: batchSize
    });
    this.excelGenerator?.exportData(data);
  }

  async exportData(batchSize = 10) {
    try {
      const startOverall = Date.now();
      this.finished = false;
      this.progress = 0;
      this.wos.updateGenerationStarted(true);
      if (this.wos.exportConfig) {
        this.excelGenerator = new ExcelGenerator(this.wos.exportConfig);
        this.progress = 1;
        const progressStep = 90 / ((this.range[1] - this.range[0]) / batchSize);

        let workbookEmpty = true;

        for (let i = this.range[0]; i <= this.range[1]; i += batchSize) {
          const start = Date.now();
          this.range[0] = i;
          let finalBatchSize;
          if (i + batchSize > this.range[1]) {
            finalBatchSize = i + batchSize - this.range[1];
          } else {
            finalBatchSize = batchSize;
          }
          await this.exportBatch(i, finalBatchSize);
          workbookEmpty = false;
          this.progress += progressStep;
          const end = Date.now();
          this.remainingBatches = (this.range[1] - this.range[0]) / batchSize;
          this.batchSum += end - start;
          this.batchAvgDuration =
            this.batchSum / (this.exportCounter / batchSize);
          this.exportCounter += batchSize;
          if (this.exportCounter % NEW_FILE_AFTER_RECORD == 0) {
            this.fileIsSaving = true;
            await this.saveFile();
            this.fileIsSaving = false;
            this.excelGenerator = new ExcelGenerator(this.wos.exportConfig);
            workbookEmpty = true;
          }
        }
        if (!workbookEmpty) await this.saveFile();
        this.progress = 100;
        this.wos.updateGenerationStarted(false);
        this.finished = true;
        const endOverall = Date.now();
        this.overallTime = endOverall - startOverall;
      }
    } catch (e) {
      this.error = e.toString();
      this.wos.updateGenerationStarted(false);
      this.finished = true;
      throw e;
    }
  }

  async saveFile() {
    await this.excelGenerator?.saveFile(this.completeFilePath());
    this.savedFiles.push(this.completeFilePath());
    this.part++;
  }

  async openFile(filePath: string) {
    await shell.openPath(filePath);
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
