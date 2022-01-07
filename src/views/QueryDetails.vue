<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="showAnotherIcon">
      <template v-slot:actions>
        <v-icon v-if="showAnotherIcon" :color="anotherColor">
          {{ anotherIcon }}
        </v-icon>
      </template>
      <template v-slot:default="{}">
        <v-row no-gutters>
          <v-col cols="12">
            <v-toolbar-title>
              Query Settings
            </v-toolbar-title>
          </v-col>
          <v-col cols="12" class="text--secondary" v-if="wosQueryExecuted">
            <v-list>
              <v-list-item-title class="text--secondary pb-1"
                ><span
                  v-html="wosQueryMsg"
                  :class="'text-' + wos.queryWosMessageType"
                />
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                >usrQuery:
                <span style="font-family: 'Consolas',serif; font-size: 0.8em">{{
                  queryMax60Chars
                }}</span>
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                >databaseId: {{ wos.databaseId }}
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                v-if="wos.edition"
                style="font-size: 0.9em"
                >edition: {{ wos.edition }}
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                v-if="wos.createdTimeSpan"
                >loadTimeSpan: {{ wos.createdTimeSpan }}
              </v-list-item-title>
            </v-list>
          </v-col>
          <v-col cols="12" v-if="wos.icToken">
            <v-list>
              <v-list-item-title class="text--secondary pt-2 pb-1"
                >InCites Query Settings
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                >schema: {{ wos.icSchema.code }} - {{ wos.icSchema.name }}
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                >esci: {{ wos.icEsci }}
              </v-list-item-title>
            </v-list>
          </v-col>
          <v-col
            cols="12"
            v-if="wos.plainFileWithIds !== '' && !disableFileIDS"
          >
            <v-list>
              <v-list-item-title class="text--secondary pt-2 pb-1"
                >File with IDs
                <strong
                  :class="
                    fileContent.length > 0 ? 'text-success' : 'text-error'
                  "
                >
                  ({{ fileContent.length }} IDs)
                </strong>
                <span
                  class="text-error"
                  style="font-size: 0.8em"
                  v-if="errorFileRead"
                  >{{ errorFileRead }}</span
                >
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
              >
                {{ wos.plainFileWithIds }}.
                <v-btn
                  text
                  class="text-none"
                  small
                  @click="
                    wos.updatePlainFileWithIds('');
                    fileContent = [];
                  "
                  >Remove
                </v-btn>
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                v-if="invalidIds > 0"
              >
                <span class="text-warning"
                  >Removed {{ invalidIds }} invalid rows.</span
                >
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
                v-if="duplicates > 0"
              >
                <span class="text-warning"
                  >Removed {{ duplicates }} duplicated rows.</span
                >
              </v-list-item-title>
            </v-list>
          </v-col>
          <v-col
            cols="12"
            v-if="
              fileRequired &&
                showAnotherIcon &&
                (disableWosQuery || icTokenSucceeded)
            "
          >
            <v-list>
              <v-list-item-title class="text--secondary pt-2 pb-1"
                >File with IDs
              </v-list-item-title>
              <v-list-item-title
                class="text--secondary pb-1"
                style="font-size: 0.9em"
              >
                {{
                  wos.plainFileWithIds === ""
                    ? "No file chosen"
                    : wos.plainFileWithIds
                }}.
                <span class="text-error">
                  Required by disabling API Expanded Query Settings or missing
                  token.</span
                >
              </v-list-item-title>
            </v-list>
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-card dense elevation="0" class="pt-3">
        <v-row>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1">
            <WosQuery />
            <v-switch
              v-model="disableWosQuery"
              label="Disable query (you need to provide IDs by selecting a file)"
              :disabled="!wos.wosExpToken"
            >
            </v-switch>
            <v-switch
              v-model="addCitedReferences"
              label="Add cited references (required for Web of Science default format)"
              :disabled="!wos.wosExpToken || wos.wosDefault"
            >
            </v-switch>
          </v-col>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1">
            <IcQuery />
          </v-col>
          <v-col cols="4">
            <v-btn
              outlined
              text
              class="text-none"
              x-large
              block
              @click="chooseFile()"
              :disabled="disableFileIDS"
            >
              <span style="white-space: normal !important;">
                Plain file with IDs (UTF-8)
              </span>
            </v-btn>
            <span class="text--secondary text-sm-body-2">
              Provide a file that includes an ID per line instead of using Web
              of Science API Query, e.g.,
              <br />UT:000271248500020
              <span v-if="wos.wosExpToken"
                ><br />DOI:10.1111/j.1532-5415.2009.02523.x
                <br />PMID:20121955</span
              >
            </span>
          </v-col>
        </v-row>
      </v-card>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import {
  mdiMicrosoftExcel,
  mdiFileDelimitedOutline,
  mdiCodeJson,
  mdiXml,
  mdiCog,
  mdiCheckCircle,
  mdiAlert
} from "@mdi/js";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";
import WosQuery from "@/views/WosQuery.vue";
import IcQuery from "@/views/IcQuery.vue";
import fs from "fs";

const dialog = require("electron").remote.dialog;

@Component({
  components: { IcQuery, WosQuery }
})
export default class QueryDetails extends Vue {
  invalidIds = 0;
  duplicates = 0;

  get icons(): Record<string, string> {
    return {
      excel: mdiMicrosoftExcel,
      csv: mdiFileDelimitedOutline,
      json: mdiCodeJson,
      xml: mdiXml,
      config: mdiCog,
      succeed: mdiCheckCircle,
      failed: mdiAlert
    };
  }

  get disableFileIDS(): boolean {
    //this calculates when to enable the upload button
    return !(
      (this.wosTokenSucceeded && this.disableWosQuery) ||
      (this.icTokenSucceeded && !this.wosTokenSucceeded)
    );
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get fileContent(): string[] {
    return this.wos.fileContent;
  }

  set fileContent(v: string[]) {
    this.wos.updateFileContent(v);
  }

  get configName(): string {
    return this.wos.configName;
  }

  get wosQueryExecuted(): boolean {
    return (
      !this.disableWosQuery &&
      this.wos.wosExpToken != null &&
      this.wos.wosExpToken != "" &&
      this.wos.queryWosMessageType != null &&
      this.wos.queryWosMessageType != ""
    );
  }

  get fileRequired(): boolean {
    return (
      this.wos.plainFileWithIds === "" &&
      (!this.wos.wosExpToken || !this.wosTokenSucceeded || this.disableWosQuery)
    );
  }

  get disableWosQuery(): boolean {
    return this.wos.disableWosQuery;
  }

  set disableWosQuery(b: boolean) {
    this.wos.updateDisableWosQuery(b);
  }

  get addCitedReferences(): boolean {
    return this.wos.addCitedReferences;
  }

  set addCitedReferences(b: boolean) {
    this.wos.updateAddCitedReferences(b);
  }

  mounted() {
    if (!this.wos.wosExpToken) this.disableWosQuery = true;
    this.onConfigChangeReloadFileContent();
  }

  set errorFileRead(v: string | null) {
    this.wos.updateErrorFileRead(v);
  }

  get errorFileRead(): string | null {
    return this.wos.errorFileRead;
  }

  reloadFileContent() {
    this.errorFileRead = null;
    this.invalidIds = 0;
    this.duplicates = 0;
    if (this.wos.plainFileWithIds != "") {
      try {
        this.fileContent = fs
          .readFileSync(this.wos.plainFileWithIds, "utf-8")
          .split("\n");
        this.cleanUpIds();
      } catch (e) {
        this.errorFileRead = e.message;
      }
    }
  }

  @Watch("configName")
  onConfigChangeReloadFileContent() {
    this.wos.verifyWosToken().then(() => {
      return this.reloadFileContent();
    });
  }

  get showAnotherIcon(): boolean {
    return this.atLeastOneTokenValid;
  }

  get atLeastOneTokenValid(): boolean {
    return this.wosTokenSucceeded || this.icTokenSucceeded;
  }

  get wosTokenSucceeded(): boolean {
    return this.wos.wosTokenMessageType == "success";
  }

  get icTokenSucceeded(): boolean {
    return this.wos.icTokenMessageType == "success";
  }

  get wosQueryMsg(): string | null {
    return this.wos.queryWosMessage;
  }

  get anotherColor(): string {
    if (!this.disableWosQuery) {
      switch (this.wos.queryWosMessageType) {
        case null:
          this.wos.validateQuery();
          return "";
        case "error":
          return "red";
        case "warning":
          return "orange";
        case "success":
          return "green";
      }
    } else {
      if (this.wos.plainFileWithIds === "" || this.errorFileRead) return "red";
      else return "green";
    }
    return "";
  }

  get anotherIcon(): string {
    if (this.anotherColor === "green") return this.icons.succeed;
    else return this.icons.failed;
  }

  get queryMax60Chars(): string | null {
    if (this.wos.usrQuery && this.wos.usrQuery.length > 60) {
      return this.wos.usrQuery.substring(0, 60) + "...";
    } else {
      return this.wos.usrQuery;
    }
  }

  chooseFile() {
    dialog
      .showOpenDialog({
        title: "Select file with IDs",
        properties: ["openFile"],
        filters: [
          { name: "Plain (UTF-8) files (.txt)", extensions: ["txt", ""] },
          { name: "All Files", extensions: ["*"] }
        ]
      })
      .then((value: Electron.OpenDialogReturnValue) => {
        this.wos.updatePlainFileWithIds(value.filePaths[0] || "");
        this.reloadFileContent();
      });
  }

  cleanUpIds() {
    this.fileContent = this.removeInvalidIds();
    this.fileContent = this.removeDuplicates();
  }

  removeInvalidIds(): string[] {
    const cleanUpIds: string[] = [];
    this.fileContent.forEach(v => {
      if (this.wosTokenSucceeded) {
        if (
          v.startsWith("UT:") ||
          v.startsWith("DOI:") ||
          v.startsWith("PMID:")
        ) {
          cleanUpIds.push(v);
        } else {
          this.invalidIds++;
        }
      } else {
        if (v.startsWith("UT:")) {
          cleanUpIds.push(v);
        } else {
          this.invalidIds++;
        }
      }
    });
    return cleanUpIds;
  }

  removeDuplicates(): string[] {
    const uniqueSet = new Set(this.fileContent);

    const backToArray = [...uniqueSet];
    this.duplicates = this.fileContent.length - backToArray.length;

    return backToArray;
  }
}
</script>

<style scoped lang="scss">
.activeBtn {
  color: white;
}

.text-success {
}

.text-warning {
  color: orange;
}

.text-error {
  color: red;
}
</style>
