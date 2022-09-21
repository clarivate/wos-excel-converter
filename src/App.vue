<template>
  <v-app>
    <v-system-bar app color="black" dark height="30">
      <v-icon size="90">$clarivate</v-icon>

      <v-spacer></v-spacer>
      <v-btn
        small
        color="red"
        class="text-none"
        elevation="25"
        rounded
        v-if="disableNewVersion"
        @click="
          openUrl(
            'https://github.com/clarivate/wos-excel-converter/releases/latest'
          )
        "
      >
        <v-icon color="white" small> {{ icons.newVersion }}</v-icon>
        <strong>New version {{ version }} available</strong>
      </v-btn>
      <v-btn
        small
        color="black"
        class="text-none"
        @click="openUrl('https://developer.clarivate.com/')"
      >
        <v-icon color="white" small> {{ icons.openNew }}</v-icon>
        <strong>Developer Portal</strong>
      </v-btn>
      <v-btn small color="black" class="text-none" :to="{ name: 'about' }">
        <v-icon color="white" small> {{ icons.info }}</v-icon>
        <strong>About</strong></v-btn
      >
    </v-system-bar>
    <v-app-bar app color="white" elevation="1">
      <v-container class="fill-height">
        <v-toolbar-title class="mr-10">
          <v-icon size="200" class="pr-1 mb" style="height: 0">$wos</v-icon>
          API Exporter
        </v-toolbar-title>
      </v-container>
      <v-spacer></v-spacer>
      <v-chip-group
        show-arrows
        mandatory
        style="max-width:800px"
        center-active
        :value="allConfigNames.indexOf(configName)"
      >
        <v-chip
          active-class="primary white--text"
          v-for="name in allConfigNames"
          :key="name"
          @click="changeConfig(name)"
          :disabled="generationStarted"
        >
          {{ name }}
        </v-chip>
      </v-chip-group>
    </v-app-bar>
    <v-main app>
      <router-view />
      <v-container>
        <v-row>
          <v-col cols="12" v-if="generationStarted || finished" class="pt-8">
            <v-alert type="info" outlined>
              <div class="text-sm-body-2">
                Your files will be saved at {{ currentDirectory }}
                <a @click="openFile(currentDirectory)">Open</a>
              </div>
            </v-alert>
          </v-col>
        </v-row>
        <v-alert type="error" class="mt-3" v-if="error != null">
          <v-row class="pb-4">
            Something went wrong at startRecord = {{ range[0] }}.
            <a
              style="text-decoration: underline; color: white;"
              class="pl-3"
              @click="
                openUrl(
                  'https://github.com/clarivate/wos-excel-converter/issues/new/choose'
                )
              "
            >
              Please report and help us improve.</a
            >.
          </v-row>
          <v-row>
            {{ error.length > 400 ? error.substr(0, 400) : error }}
          </v-row>
        </v-alert>
      </v-container>
    </v-main>
    <v-footer app>
      <v-row>
        <v-col cols="2" v-show="!generationStarted">
          <v-btn
            large
            color="primary"
            :disabled="!exportPossible"
            block
            @click="exportData(100)"
            >{{ finished ? "Export again" : "Export" }}
          </v-btn>
        </v-col>

        <v-col cols="10" v-if="!exportPossible" class="mt-3">
          <span class="text--secondary pl-2 mb-n4"
            >Export not possible yet. Check your details above. Make sure that
            each section is marked with
            <v-icon color="green">{{ icons.succeed }}</v-icon>
          </span>
        </v-col>
        <v-col cols="2" v-show="generationStarted">
          <v-btn large color="primary" block @click="stopGeneration()"
            >Stop & save</v-btn
          >
        </v-col>
        <v-col
          cols="10"
          class="pl-1 mt-n1"
          v-if="generationStarted || finished"
        >
          <v-row>
            <v-col cols="12">
              <span
                class="text-sm-body-2"
                v-if="generationStarted || finished"
                >{{ remainingTime }}</span
              >
            </v-col>
            <v-col cols="12" class="mt-n6">
              <v-progress-linear
                class="pl-3"
                :value="progress"
                height="25"
                disabled
                dark
                v-if="generationStarted || finished"
              >
                <strong>{{ Math.ceil(progress) }} %</strong>
              </v-progress-linear>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
  mdiAlert,
  mdiApps,
  mdiCheckCircle,
  mdiGift,
  mdiInformation,
  mdiKey,
  mdiOpenInNew
} from "@mdi/js";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";
import { ipcRenderer, remote, shell } from "electron";
import { ExcelGenerator } from "@/util/io/ExcelGenerator";
import os from "os";
import dateFormat from "dateformat";
import * as fs from "fs";
import VersionChecker from "@/apis/version_checker";
import CsvGenerator from "@/util/io/CsvGenerator";
import { JSONArray, JSONObject, JSONValue, search } from "@metrichor/jmespath";
import { wosUTs } from "@/util/jmesPath";
import JsonGenerator from "@/util/io/JsonGenerator";
import { select, SelectedValue, useNamespaces } from "xpath";
import XmlGenerator from "@/util/io/XmlGenerator";
import { wosStandard } from "@/apis/configs/wosStandard";

const NEW_FILE_AFTER_RECORD = 10000;
const pathSeparator = os
  .type()
  .toLowerCase()
  .startsWith("win")
  ? "\\"
  : "/";

const EXCEL_FOLDER = "excel";
const EXCEL_EXTENSION = "xlsx";
const CSV = "csv";
const JSON = "json";
const XML = "xml";
const WOS = "wos";
const EXPORT_FILE = "export";

const selectWithIsi = useNamespaces({
  isi: "http://www.isinet.com/xrpc42"
});

@Component({})
export default class App extends Vue {
  private excelGenerator?: ExcelGenerator;
  private csvGenerator?: CsvGenerator;
  private wosGenerator?: CsvGenerator;
  private jsonGenerator?: JsonGenerator;
  private xmlGenerator?: XmlGenerator;

  private progress = 0;

  private error: string | null = null;
  private finished = false;

  private batchAvgDuration = 0;
  private batchSum = 0;
  private remainingBatches = 0;
  private overallTime = 0;
  private exportCounter = 0;
  private fileIsSaving = false;
  private part = 1;
  private version = "unknowns";
  currentDirectory: string | null = null;
  utsForInCites: Array<string> = [];
  stopped = false;

  get generationStarted(): boolean {
    return this.wos.generationStarted;
  }

  set generationStarted(v: boolean) {
    this.wos.updateGenerationStarted(v);
  }

  get range(): number[] {
    return this.wos.range;
  }

  set range(v: number[]) {
    this.wos.updateRange(v);
  }

  get validRange(): boolean {
    return (
      this.range[1] - this.range[0] >= 0 &&
      this.range[0] !== 0 &&
      this.range[1] !== 0
    );
  }

  openUrl(url: string) {
    shell.openExternal(url);
  }

  updateProgress(p: number) {
    if (p >= 100) {
      ipcRenderer.send("end-progress");
    } else if (p >= 89) {
      ipcRenderer.send("progress", 1);
    } else {
      ipcRenderer.send("progress", p / 100);
    }
    this.progress = p;
  }

  async changeConfig(to: string) {
    if (this.configName === to) return;
    this.wos.changeConfig(to);
    if (this.wos.wosExpToken) {
      await this.wos.verifyWosToken();
      await this.wos.validateQuery();
    }
    if (this.wos.icToken) {
      await this.wos.verifyIcToken();
    }
    this.finished = false;
  }

  get icons(): Record<string, string> {
    return {
      token: mdiKey,
      succeed: mdiCheckCircle,
      failed: mdiAlert,
      myApps: mdiApps,
      info: mdiInformation,
      openNew: mdiOpenInNew,
      newVersion: mdiGift
    };
  }

  mounted(): void {
    this.versionInGithub().then(value => (this.version = value));
  }

  get disableNewVersion(): boolean {
    return process.env.PACKAGE_VERSION !== this.version;
  }

  async versionInGithub(): Promise<string> {
    return await VersionChecker.getInstance().getCurrentVersion();
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get allConfigNames(): Array<string> {
    return this.wos.allConfigNames;
  }

  get configName(): string {
    return this.wos.configName;
  }

  get remainingRecordsAvailable(): boolean {
    return this.tokenSucceeded || this.wos.queryStatus > 0;
  }

  get remainingRecords(): string {
    let remainingRecords = 0;
    const format = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 0
    });
    if (this.wos.queryStatus > 0) {
      if (
        this.wos.queryFeedback != null &&
        this.wos.queryFeedback.remainingRecords != null
      )
        remainingRecords = this.wos.queryFeedback.remainingRecords;
    } else {
      remainingRecords = this.wos.remainingRecords;
    }
    return format.format(remainingRecords);
  }

  get queryRecords(): string {
    let queryRecords = 0;
    const format = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 0
    });
    if (this.wos.queryStatus > 0) {
      if (
        this.wos.queryFeedback != null &&
        this.wos.queryFeedback.recordsFound != null
      )
        queryRecords = this.wos.queryFeedback.recordsFound;
    }
    return format.format(queryRecords);
  }

  get remainingRecTextClass(): string {
    return "text-" + this.wos.wosTokenMessageType;
  }

  get tokenSucceeded(): boolean {
    return this.wos.wosTokenMessageType == "success";
  }

  get icTokenSucceeded(): boolean {
    return this.wos.icTokenMessageType == "success";
  }

  get tokenFailed(): boolean {
    return this.wos.wosTokenMessageType == "error";
  }

  get tokenWarning(): boolean {
    return this.wos.wosTokenMessageType == "warning";
  }

  get configFailure(): boolean {
    return this.wos.exportConfigError;
  }

  get exportPossible(): boolean {
    return (
      (this.wos.queryStatus > 0 || this.wos.fileContent.length > 0) &&
      this.wos.chosenDirectory != null &&
      !this.configFailure &&
      this.validRange &&
      !this.wos.errorFileRead &&
      (this.wos.excel ||
        this.wos.csv ||
        this.wos.json ||
        this.wos.xml ||
        (this.wos.wosDefault && this.tokenSucceeded))
    );
  }

  get chosenDirectory(): string | undefined {
    return this.wos.chosenDirectory;
  }

  set chosenDirectory(dir: string | undefined) {
    this.wos.updateChosenDirectory(dir);
  }

  get remainingTime(): string {
    if (this.finished) {
      return "Generation finished";
    }
    return (
      "Generating - No changes allowed. Remaining time: " +
      this.msToTime(this.remainingBatches * this.batchAvgDuration)
    );
  }

  get generationDuration(): string {
    return this.msToTime(this.overallTime);
  }

  msToTime(duration: number): string {
    if (duration === -Infinity || duration === Infinity || isNaN(duration))
      return "calculating...";
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    return hours + "h " + minutes + " min " + seconds + " sec ";
  }

  batchIds(start: number, batchSize: number): string[] {
    const idArrStart = start - 1;
    const idArrayEnd =
      start - 1 + batchSize >= this.wos.fileContent.length
        ? this.wos.fileContent.length
        : start - 1 + batchSize;
    return this.wos.fileContent.slice(idArrStart, idArrayEnd);
  }

  generateWosQuery(start: number, batchSize: number): string {
    return this.batchIds(start, batchSize)
      .map(value => {
        if (value.startsWith("UT")) {
          return "UT=" + value.replace("UT:", "WOS:");
        } else if (value.startsWith("DOI")) {
          return "DO=" + '"' + value.replace("DOI:", "") + '"';
        } else if (value.startsWith("PMID")) {
          return "PMID=" + value.replace("PMID:", "");
        }
      })
      .join(" OR ");
  }

  async exportBatch(start: number, batchSize: number) {
    if (this.wos.xml) {
      const data = await this.mergedXmlResponseData(start, batchSize);
      this.xmlGenerator?.exportData(data);
    } else {
      const data = await this.mergedResponseData(start, batchSize);

      if (this.wos.excel) this.excelGenerator?.exportData(data);
      if (this.wos.csv) this.csvGenerator?.exportData(data);
      if (this.wos.wosDefault) this.wosGenerator?.exportData(data);
      if (this.wos.json)
        this.jsonGenerator?.exportData(
          data as { Data: { Records: { records: { REC: Array<JSONValue> } } } }
        );
    }
  }

  async mergedXmlResponseData(
    start: number,
    batchSize: number
  ): Promise<Document | null> {
    let wosData: Document | null = null;
    let icData: Document | null = null;
    let uts: string[] | null;

    if (this.tokenSucceeded) {
      const query = this.wos.disableWosQuery
        ? this.generateWosQuery(start, batchSize)
        : undefined;
      const wosResponse = await this.wos.runQuery({
        startRecord: this.wos.disableWosQuery ? 1 : start,
        count: batchSize,
        differentQuery: query
      });

      const xml = new DOMParser().parseFromString(
        wosResponse as string,
        "application/xml"
      );

      const recordsTxt = (selectWithIsi(
        "//isi:map/isi:val[@name='Records']/text()",
        xml
      ) as unknown) as [CDATASection];

      wosData = new DOMParser().parseFromString(
        recordsTxt[0].data,
        "application/xml"
      );

      uts = this.extractUTsFromWosXml(wosData);
    } else {
      uts = this.batchIds(start, batchSize)
        .filter(value => value.startsWith("UT:"))
        .map(value => value.replace("UT:", ""));
    }
    if (this.icTokenSucceeded) {
      const icResponse = await this.wos.runIcQuery({
        uts: uts
      });
      icData = new DOMParser().parseFromString(
        icResponse as string,
        "application/xml"
      );
    }
    let finalData: Document | null = null;
    const parser = new DOMParser();
    if (wosData && icData) {
      const icMap = this.convertIcResponseToMapXml(icData);
      const recs = wosData.children[0].children;
      for (let i = 0; i < recs.length; i++) {
        const ut = recs[i].getElementsByTagName("UID")[0].innerHTML;
        const icMetricsMap = icMap.get(ut);
        if (icMetricsMap) {
          const xmlString = "<incites_api_metrics></incites_api_metrics>";

          const icTag = parser.parseFromString(xmlString, "text/xml");
          icTag.children[0].appendChild(icMetricsMap);
          recs[i].appendChild(icTag.documentElement);
        }
      }
      finalData = wosData;
    } else if (!wosData && icData) {
      const icMap = this.convertIcResponseToMapXml(icData);
      const records = parser.parseFromString("<records></records>", "text/xml");
      icMap.forEach((icMetricsMap, ut) => {
        const xmlString = "<incites_api_metrics></incites_api_metrics>";

        const icTag = parser.parseFromString(xmlString, "text/xml");
        icTag.children[0].appendChild(icMetricsMap);
        const xmlStringUid = "<UID>" + ut + "</UID>";
        const uid = parser.parseFromString(xmlStringUid, "text/xml");
        const rec = parser.parseFromString("<REC></REC>", "text/xml");
        rec.children[0].appendChild(uid.documentElement);
        rec.children[0].appendChild(icTag.documentElement);
        records.children[0].appendChild(rec.documentElement);
      });

      finalData = records;
    } else if (wosData && !icData) {
      finalData = wosData;
    }
    return finalData;
  }

  async mergedResponseData(
    start: number,
    batchSize: number
  ): Promise<JSONValue> {
    let wosData: JSONValue = null;
    let icData: JSONValue = null;
    let uts: string[] | null;
    if (this.tokenSucceeded) {
      const query = this.wos.disableWosQuery
        ? this.generateWosQuery(start, batchSize)
        : undefined;
      wosData = await this.wos.runQuery({
        startRecord: this.wos.disableWosQuery ? 1 : start,
        count: batchSize,
        differentQuery: query
      });
      uts = this.extractUTsFromWosJson(wosData);
      if (uts.length === 0) {
        return {
          Data: {
            Records: {
              records: {
                REC: []
              }
            }
          }
        };
      }
      if (this.wos.addCitedReferences) {
        let recs: JSONArray;
        if (!this.wos.disableWosQuery) {
          recs = ((((wosData as JSONObject)["Data"] as JSONObject)[
            "Records"
          ] as JSONObject)["records"] as JSONObject)["REC"] as JSONArray;
        } else {
          recs = ((((wosData as JSONObject)["Data"] as JSONObject)[
            "Records"
          ] as JSONObject)["records"] as JSONObject)["REC"] as JSONArray;
        }
        for (let i = 0; i < recs.length; i++) {
          const rec = recs[i] as JSONObject;
          rec["cited_references"] = await this.wos.getAllReferences({
            uniqueId: rec["UID"] as string
          });
          recs[i] = rec;
        }
        if (!this.wos.disableWosQuery) {
          wosData = {
            Data: {
              Records: {
                records: {
                  REC: recs
                }
              }
            }
          };
        } else {
          wosData = {
            Data: {
              Records: {
                records: {
                  REC: recs
                }
              }
            }
          };
        }
      }
    } else {
      uts = this.batchIds(start, batchSize)
        .filter(value => value.startsWith("UT:"))
        .map(value => value.replace("UT:", ""));
    }

    if (this.icTokenSucceeded) {
      icData = await this.wos.runIcQuery({
        uts: uts
      });
    }
    let finalData: JSONValue = {};
    if (wosData && icData) {
      const icMap = this.convertIcResponseToMapJson(icData);
      let recs: JSONArray;
      if (!this.wos.disableWosQuery) {
        recs = ((((wosData as JSONObject)["Data"] as JSONObject)[
          "Records"
        ] as JSONObject)["records"] as JSONObject)["REC"] as JSONArray;
      } else {
        recs = ((((wosData as JSONObject)["Data"] as JSONObject)[
          "Records"
        ] as JSONObject)["records"] as JSONObject)["REC"] as JSONArray;
      }
      recs.map(value => {
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        const rec = value as any;
        rec["incites_api_metrics"] = icMap.get(
          (value as JSONObject)["UID"] as string
        );
        return rec as JSONValue;
      });
      finalData = {
        Data: {
          Records: {
            records: {
              REC: recs
            }
          }
        }
      };
    } else if (wosData && !icData) {
      const recs = ((((wosData as JSONObject)["Data"] as JSONObject)[
        "Records"
      ] as JSONObject)["records"] as JSONObject)["REC"] as JSONArray;
      finalData = {
        Data: {
          Records: {
            records: {
              REC: recs
            }
          }
        }
      };
    } else if (!wosData && icData) {
      const icMap = this.convertIcResponseToMapJson(icData);
      const recs = Array.from(icMap.entries()).map(value => {
        return {
          UID: value[0],
          // eslint-disable-next-line  @typescript-eslint/camelcase
          incites_api_metrics: value[1]
        };
      });
      finalData = {
        Data: {
          Records: {
            records: {
              REC: recs
            }
          }
        }
      };
    }

    return finalData;
  }

  extractUTsFromWosJson(wosData: JSONValue): string[] {
    const allUts = search(wosData, wosUTs(!this.wos.disableWosQuery)) as Array<
      string
    >;
    if (allUts) {
      //filter only wos cc
      const filteredUts = allUts.filter(value => value.startsWith("WOS:"));
      return filteredUts.map(value => value.replace("WOS:", ""));
    } else {
      return [];
    }
  }

  extractUTsFromWosXml(wosData: Document): string[] {
    const utsNodes = select("/records/REC/UID/text()", wosData) as Array<
      SelectedValue
    >;
    const allUts = utsNodes.map(node => (node as Text).nodeValue as string);
    const filteredUts = allUts.filter(value => value.startsWith("WOS:"));
    return filteredUts.map(value => value.replace("WOS:", ""));
  }

  convertIcResponseToMapJson(icData: JSONValue): Map<string, JSONValue> {
    const icArray = (((icData as JSONObject)[
      "api"
    ] as JSONArray)[0] as JSONObject)["rval"] as JSONArray;
    const map = new Map<string, JSONValue>();

    icArray.map(value => {
      const ut = "WOS:" + ((value as JSONObject)["ACCESSION_NUMBER"] as string);
      map.set(ut, value);
    });

    return map;
  }

  convertIcResponseToMapXml(icData: Document): Map<string, Node> {
    const icResArray = selectWithIsi(
      "/isi:response/isi:fn/isi:list/isi:map",
      icData
    ) as Array<Node>;

    const result = new Map<string, Node>();

    for (let i = 0, n = null, ut = null; i < icResArray.length; i++) {
      n = icResArray[i];
      ut = selectWithIsi(
        "//isi:val[@name='ACCESSION_NUMBER']/text()",
        n
      ) as Array<Node>;
      result.set("WOS:" + ut[i].nodeValue, n);
    }
    console.assert(icResArray.length === result.size, "not the same");
    return result;
  }

  async exportData(batchSize = 100) {
    try {
      this.resetGenerationProgress();
      const startOverall = Date.now();
      ipcRenderer.send("start-progress");
      const dateNow = new Date();
      this.createFolders(dateNow);

      this.finished = false;
      this.updateProgress(0);
      this.wos.updateGenerationStarted(true);
      if (this.wos.exportConfig) {
        if (this.wos.excel) {
          const fileName = this.exportFileName(EXCEL_FOLDER, EXCEL_EXTENSION);
          this.excelGenerator = new ExcelGenerator(
            this.wos.exportConfig,
            fileName,
            this.tokenSucceeded,
            this.icTokenSucceeded
          );
        }
        if (this.wos.csv) {
          this.csvGenerator = new CsvGenerator(
            this.wos.exportConfig,
            this.currentDirectory + pathSeparator + CSV,
            this.tokenSucceeded,
            this.icTokenSucceeded
          );
        }

        if (this.wos.wosDefault) {
          this.wosGenerator = new CsvGenerator(
            wosStandard,
            this.currentDirectory + pathSeparator + WOS,
            this.tokenSucceeded,
            this.icTokenSucceeded
          );
        }

        if (this.wos.json) {
          this.jsonGenerator = new JsonGenerator(
            this.exportFileName(JSON, JSON)
          );
        }
        if (this.wos.xml) {
          this.xmlGenerator = new XmlGenerator(this.exportFileName(XML, XML));
        }
        this.updateProgress(1);
        const progressStep = 90 / ((this.range[1] - this.range[0]) / batchSize);
        let workbookEmpty = true;
        for (let i = this.range[0]; i <= this.range[1]; i += batchSize) {
          if (this.stopped) {
            if (!workbookEmpty && this.wos.excel) this.saveExcelFiles();
            if (this.wos.csv && !workbookEmpty) this.csvGenerator?.commitAll();
            this.updateProgress(100);
            this.generationStarted = false;
            this.finished = true;
            const endOverall = Date.now();
            this.overallTime = endOverall - startOverall;
            this.stopped = false;
            return;
          }
          const start = Date.now();
          let finalBatchSize;
          if (i + batchSize > this.range[1]) {
            finalBatchSize = this.range[1] - i + 1;
          } else {
            finalBatchSize = batchSize;
          }
          this.range[0] = i + finalBatchSize;
          //console.log("startRecord:" + i + ", batch:" + finalBatchSize);
          await this.exportBatch(i, finalBatchSize);
          workbookEmpty = false;
          this.updateProgress(this.progress + progressStep);
          const end = Date.now();
          this.remainingBatches = (this.range[1] - this.range[0]) / batchSize;
          this.batchSum += end - start;
          this.batchAvgDuration =
            this.batchSum / (this.exportCounter / batchSize);
          this.exportCounter += batchSize;
          if (
            this.exportCounter % NEW_FILE_AFTER_RECORD == 0 &&
            this.wos.excel
          ) {
            this.fileIsSaving = true;
            this.saveExcelFiles();
            this.fileIsSaving = false;
            const fileName = this.exportFileName(EXCEL_FOLDER, EXCEL_EXTENSION);
            this.excelGenerator = new ExcelGenerator(
              this.wos.exportConfig,
              fileName,
              this.tokenSucceeded,
              this.icTokenSucceeded
            );
            workbookEmpty = true;
          }
        }
        if (!workbookEmpty && this.wos.excel) this.saveExcelFiles();
        if (this.wos.csv) this.csvGenerator?.commitAll();
        if (this.wos.json) this.jsonGenerator?.commitAll();
        if (this.wos.xml) this.xmlGenerator?.commitAll();
        this.updateProgress(100);
        this.generationStarted = false;
        this.finished = true;
        const endOverall = Date.now();
        this.overallTime = endOverall - startOverall;
      }
    } catch (e) {
      this.error = e.toString();
      this.generationStarted = false;
      this.finished = true;
      throw e;
    }
  }

  resetGenerationProgress(): void {
    this.part = 1;
    this.finished = false;
    this.generationStarted = false;
    this.error = null;
    this.updateProgress(-1);
  }

  createFolders(date: Date) {
    const folderName = dateFormat(date, "dd-mm-yyyy_HH-MM");
    this.currentDirectory =
      this.wos.chosenDirectory +
      pathSeparator +
      this.configName +
      pathSeparator +
      folderName;
    if (!fs.existsSync(this.currentDirectory)) {
      fs.mkdirSync(this.currentDirectory, { recursive: true });
    }
    if (this.wos.excel)
      if (
        !fs.existsSync(this.currentDirectory + pathSeparator + EXCEL_FOLDER)
      ) {
        fs.mkdirSync(this.currentDirectory + pathSeparator + EXCEL_FOLDER);
      }
    if (this.wos.csv)
      if (!fs.existsSync(this.currentDirectory + pathSeparator + CSV)) {
        fs.mkdirSync(this.currentDirectory + pathSeparator + CSV);
      }
    if (this.wos.json)
      if (!fs.existsSync(this.currentDirectory + pathSeparator + JSON)) {
        fs.mkdirSync(this.currentDirectory + pathSeparator + JSON);
      }
    if (this.wos.xml)
      if (!fs.existsSync(this.currentDirectory + pathSeparator + XML)) {
        fs.mkdirSync(this.currentDirectory + pathSeparator + XML);
      }
    if (this.wos.wosDefault)
      if (!fs.existsSync(this.currentDirectory + pathSeparator + WOS)) {
        fs.mkdirSync(this.currentDirectory + pathSeparator + WOS);
      }
  }

  saveExcelFiles() {
    this.excelGenerator?.commitAll();
    this.part++;
  }

  async openFile(filePath: string) {
    await remote.shell.openPath(filePath);
  }
  stopGeneration(): void {
    this.stopped = true;
  }

  exportFileName(folder: string, extension: string): string {
    let fileName =
      this.currentDirectory +
      pathSeparator +
      folder +
      pathSeparator +
      EXPORT_FILE;
    if (folder == EXCEL_FOLDER) {
      fileName += " part" + this.part;
    }
    fileName += "." + extension;

    return fileName;
  }
}
</script>

<style lang="scss" scoped>
html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
}

#wosIcon {
  position: fixed;
  bottom: -30px;
  right: 10px;
}
</style>
