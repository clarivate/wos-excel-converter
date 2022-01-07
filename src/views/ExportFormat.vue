<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="showAnotherIcon">
      <v-toolbar-title>File Formats</v-toolbar-title>
      <template v-slot:actions>
        <v-icon v-if="showAnotherIcon" :color="anotherColor">
          {{ icons.succeed }}
        </v-icon>
      </template>
      <template v-slot:default="{ open }">
        <v-row no-gutters>
          <v-col cols="12">
            <v-toolbar-title>
              File Formats
            </v-toolbar-title>
          </v-col>
          <v-col v-show="isError" cols="12" class="text--secondary pt-2">
            <span class="text-error"
              >We found errors in your export definition.</span
            >
          </v-col>
          <v-col
            cols="12"
            v-if="!open && tokenSucceeded"
            class="text--secondary pt-2"
          >
            Selected formats: {{ exportedList }}
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-card dense elevation="0" class="pt-3">
        <v-row>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1"
            >Advanced export
          </v-col>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1"
            >Raw export
          </v-col>
          <v-col cols="4">Web of Science Default format</v-col>
        </v-row>
        <v-row>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1">
            <v-toolbar elevation="0" dense>
              <v-btn-toggle
                v-model="advancedExport"
                active-class="accent lighten-4"
                multiple
              >
                <v-btn
                  outlined
                  text
                  class="text-none"
                  :disabled="!tokenSucceeded"
                >
                  <v-icon class="pr-1">{{ icons.excel }}</v-icon>
                  Excel
                </v-btn>
                <v-btn
                  outlined
                  text
                  class="text-none"
                  :disabled="!tokenSucceeded"
                >
                  <v-icon class="pr-1">{{ icons.csv }}</v-icon>
                  CSV
                </v-btn>
              </v-btn-toggle>
              <AdvancedExportConfig
                :is-config-enabled="advancedExport.length === 0"
              />
            </v-toolbar>
          </v-col>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1">
            <v-toolbar elevation="0" dense>
              <v-btn-toggle
                v-model="rawExport"
                multiple
                active-class="accent lighten-4"
              >
                <v-btn
                  outlined
                  text
                  class="text-none"
                  :disabled="!tokenSucceeded"
                >
                  <v-icon class="pr-1">{{ icons.json }}</v-icon>
                  JSON
                </v-btn>
                <v-btn
                  outlined
                  text
                  class="text-none"
                  :disabled="!tokenSucceeded"
                >
                  <v-icon class="pr-1">{{ icons.xml }}</v-icon>
                  XML
                </v-btn>
              </v-btn-toggle>
            </v-toolbar>
          </v-col>
          <v-col cols="4">
            <v-toolbar elevation="0" dense>
              <v-btn-toggle
                v-model="wosDefaultFormat"
                multiple
                active-class="accent lighten-4"
                :disabled="!wosTokenSucceeded"
              >
                <v-btn
                  outlined
                  text
                  class="text-none"
                  height="60"
                  :disabled="!wosTokenSucceeded"
                >
                  <v-icon class="pr-1">{{ icons.wosfile }}</v-icon>
                  <span class="pa-2">
                    Tab-delimited (UTF-8)<br />
                    Full Record <br />and Cited References
                  </span>
                </v-btn>
              </v-btn-toggle>
            </v-toolbar>
          </v-col>
        </v-row>
        <v-row>
          <v-col
            cols="4"
            class="text--secondary text-sm-body-2"
            style="border-right: 1px solid #a1a1a1"
            >Use this format if you want to analyse the data BI Tools, e.g.,
            Power BI or Tableau. Click
            <v-icon small>{{ icons.config }}</v-icon>
            to select which metadata do you want to export and define the
            structure of the data.
          </v-col>
          <v-col
            cols="4"
            class="text--secondary text-sm-body-2"
            style="border-right: 1px solid #a1a1a1"
            >Use this format if you want to analyse the data programmatically.
            Please note that API can either respond with XML or JSON. We use
            JSON to generate other formats, therefore JSON can be combined with
            others.
          </v-col>
          <v-col cols="4" class="text--secondary text-sm-body-2"
            >Use this format if you want to import the data in other tools,e.g.,
            VOSViewer. Please note that API does not expose all information,
            e.g. corresponding emails. These fields will be empty. This requires
            an API Expanded token.
          </v-col>
        </v-row>
      </v-card>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
  mdiMicrosoftExcel,
  mdiFileDelimitedOutline,
  mdiCodeJson,
  mdiXml,
  mdiCog,
  mdiCheckCircle,
  mdiFileDocumentOutline
} from "@mdi/js";
import AdvancedExportConfig from "@/views/AdvancedExportConfig.vue";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";

@Component({
  components: { AdvancedExportConfig }
})
export default class ExportFormat extends Vue {
  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get icons(): Record<string, string> {
    return {
      excel: mdiMicrosoftExcel,
      csv: mdiFileDelimitedOutline,
      json: mdiCodeJson,
      xml: mdiXml,
      config: mdiCog,
      succeed: mdiCheckCircle,
      wosfile: mdiFileDocumentOutline
    };
  }

  get showAnotherIcon() {
    return (
      (this.wos.xml ||
        (this.wos.json && !this.wos.csv && !this.wos.excel) ||
        (this.wos.wosDefault && !this.wos.csv && !this.wos.excel) ||
        (this.wos.excel && !this.wos.exportConfigError) ||
        (this.wos.csv && !this.wos.exportConfigError)) &&
      this.tokenSucceeded
    );
  }

  get anotherColor() {
    if (this.showAnotherIcon) return "green";
    else return "";
  }
  get tokenSucceeded(): boolean {
    return (
      this.wos.wosTokenMessageType === "success" ||
      this.wos.icTokenMessageType === "success"
    );
  }

  get wosTokenSucceeded(): boolean {
    return this.wos.wosTokenMessageType === "success";
  }

  get isError() {
    return this.wos.exportConfigError;
  }

  set wosDefaultFormat(v: number[]) {
    if (v.length > 0) {
      this.wos.updateWosDefault(true);
      this.wos.updateXml(false);
    } else {
      this.wos.updateWosDefault(false);
    }
  }

  get wosDefaultFormat(): number[] {
    if (!this.wosTokenSucceeded) {
      this.wos.updateWosDefault(false);
    }
    if (this.wos.wosDefault) {
      this.wos.updateAddCitedReferences(true);
      return [0];
    } else return [];
  }

  set advancedExport(advancedExport: number[]) {
    advancedExport.forEach(value => {
      if (value == 0) {
        this.wos.updateExcel(true);
        this.wos.updateXml(false);
      } else if (value == 1) {
        this.wos.updateCsv(true);
        this.wos.updateXml(false);
      }
    });
    if (advancedExport.length == 0) {
      this.wos.updateExcel(false);
      this.wos.updateCsv(false);
    } else if (advancedExport.length == 1) {
      if (advancedExport[0] == 0) {
        this.wos.updateCsv(false);
      } else {
        this.wos.updateExcel(false);
      }
    }
  }

  get advancedExport(): number[] {
    if (this.wos.excel && this.wos.csv) {
      return [0, 1];
    } else if (this.wos.excel) {
      return [0];
    } else if (this.wos.csv) {
      return [1];
    } else {
      return [];
    }
  }

  get rawExport(): number[] {
    if (this.wos.json && this.wos.xml) {
      return [1];
    } else if (this.wos.json) {
      return [0];
    } else if (this.wos.xml) {
      return [1];
    } else {
      return [];
    }
  }

  set rawExport(v: number[]) {
    v.forEach(value => {
      if (value == 0) {
        this.wos.updateJson(true);
        this.wos.updateXml(false);
      } else if (value == 1) {
        this.wos.updateXml(true);
        this.wos.updateJson(false);
        this.wos.updateExcel(false);
        this.wos.updateCsv(false);
        this.wos.updateWosDefault(false);
      }
    });
    if (v.length == 0) {
      this.wos.updateJson(false);
      this.wos.updateXml(false);
    } else if (v.length == 1) {
      if (v[0] == 0) {
        this.wos.updateXml(false);
      } else {
        this.wos.updateJson(false);
      }
    }
  }

  get excel() {
    return this.wos.excel;
  }

  get csv() {
    return this.wos.csv;
  }

  get json() {
    return this.wos.json;
  }

  get xml() {
    return this.wos.xml;
  }

  get wosDefault() {
    return this.wos.wosDefault;
  }

  get exportedList() {
    let list = "";
    let before = false;
    if (this.wos.excel) {
      if (before) list += "," + " Excel";
      else list += "Excel";
      before = true;
    }
    if (this.wos.csv) {
      if (before) list += "," + " CSV";
      else list += "CSV";
      before = true;
    }
    if (this.wos.json) {
      if (before) list += "," + " JSON";
      else list += "JSON";
      before = true;
    }
    if (this.wos.xml) {
      if (before) list += "," + " XML";
      else list += "XML";
      before = true;
    }
    if (this.wos.wosDefault) {
      if (before)
        list += "," + " Tab-delimited (UTF-8) Full Record and Cited References";
      else list += "Tab-delimited (UTF-8) Full Record and Cited References";
      before = true;
    }
    if (before) return list;
    else
      return "No export format selected. You need to choose at least one to export.";
  }
}
</script>

<style scoped lang="scss">
.activeBtn {
  color: white;
}

.text-error {
  color: red;
}
</style>
