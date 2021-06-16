<template>
  <v-expansion-panel>
    <v-expansion-panel-header disable-icon-rotate>
      <v-toolbar-title>Export Formats</v-toolbar-title>
      <template v-slot:actions>
        <v-icon v-if="true" color="green">
          {{ icons.succeed }}
        </v-icon>
      </template>
      <template v-slot:default="{ open }">
        <v-row no-gutters>
          <v-col cols="12"
            ><v-toolbar-title>
              Export Formats
            </v-toolbar-title></v-col
          >
          <v-col cols="12" v-if="!open" class="text--secondary pt-2">
            Selected formats: Excel, CSV, JSON, XML
            <!--            <v-icon class="px-1">{{ icons.excel }}</v-icon>-->
            <!--            <v-icon class="px-1">{{ icons.csv }}</v-icon>-->
            <!--            <v-icon class="px-1">{{ icons.json }}</v-icon>-->
            <!--            <v-icon class="px-1">{{ icons.xml }}</v-icon>-->
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-card dense elevation="0" class="pt-3">
        <v-row>
          <v-col cols="4" style="border-right: 1px solid #a1a1a1"
            >Advanced export</v-col
          >
          <v-col cols="4" style="border-right: 1px solid #a1a1a1"
            >Raw export</v-col
          >
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
                <v-btn outlined text class="text-none">
                  <v-icon class="pr-1">{{ icons.excel }}</v-icon> Excel
                </v-btn>
                <v-btn outlined text class="text-none">
                  <v-icon class="pr-1">{{ icons.csv }}</v-icon> CSV
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
                <v-btn outlined text class="text-none">
                  <v-icon class="pr-1">{{ icons.json }}</v-icon> JSON
                </v-btn>
                <v-btn outlined text class="text-none">
                  <v-icon class="pr-1">{{ icons.xml }}</v-icon> XML
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
              >
                <v-btn outlined text class="text-none" height="60">
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
            <v-icon small>{{ icons.config }}</v-icon> to select which metadata
            do you want to export and define the structure of the data.</v-col
          >
          <v-col
            cols="4"
            class="text--secondary text-sm-body-2"
            style="border-right: 1px solid #a1a1a1"
            >Use this format if you want to analyse the data programmatically.
            Please note that API can either respond with XML or JSON.
            <!--            <span style="color:#f89324">-->
            <!--              If you choose both formats or XML with other Export formats, we-->
            <!--              make two requests which leads to a double consumption of records.-->
            <!--              We parse JSON to generate other formats.</span-->
            <!--            >-->
          </v-col>
          <v-col cols="4" class="text--secondary text-sm-body-2"
            >Use this format if you want to import the data in other tools,e.g.,
            VOSViewer. Please note that API does not expose all information,
            e.g. corresponding emails. These fields will be empty.
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

@Component({
  components: { AdvancedExportConfig }
})
export default class ExportFormat extends Vue {
  advancedExport = [];
  rawExport = [];
  wosDefaultFormat = [];

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
}
</script>

<style scoped lang="scss">
.activeBtn {
  color: white;
}
</style>
