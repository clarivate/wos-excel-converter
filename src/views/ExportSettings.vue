<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="showAnotherIcon">
      <v-toolbar-title>Export Settings</v-toolbar-title>
      <template v-slot:actions>
        <v-icon v-if="showAnotherIcon" :color="anotherColor">
          {{ icons.succeed }}
        </v-icon>
      </template>
      <template v-slot:default="{ open }">
        <v-row no-gutters>
          <v-col cols="12">
            <v-toolbar-title>
              Export Settings
            </v-toolbar-title>
          </v-col>
          <v-col cols="12" v-if="!open" class="text--secondary pt-2">
            Folder: {{ chosenDirectory }}
          </v-col>
          <v-col cols="12" v-if="!open" class="text--secondary pt-2">
            Selected range: {{ range }}
            <span v-if="!validRange" class="warning"> (Invalid range)</span>
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-form class="pt-8">
        <v-row no-gutters>
          <v-col lg="6">
            <v-text-field
              dense
              flat
              outlined
              readonly
              label="Directory of files"
              :append-icon="icons.folder"
              @click:append="chooseDirectory"
              v-model="chosenDirectory"
              persistent-hint
              hint="A sub-folder with your local date and time will be created each time you generate. The exported data will be structured for each format in sub-folders."
              class="text-sm-body-2"
              @click="chooseDirectory"
            >
            </v-text-field>
          </v-col>
        </v-row>

        <v-row no-gutters class="mb-6">
          <v-col lg="12">
            <v-card flat color="transparent">
              <v-card-subtitle
                >Define the range of records you want to export?
              </v-card-subtitle>
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
                      style="width: 70px"
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
                      style="width: 70px"
                      @change="$set(range, 1, $event)"
                      @input="$set(range, 1, $event)"
                    ></v-text-field>
                  </template>
                </v-range-slider>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
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
import { mdiFolderOpen } from "@mdi/js";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";

const dialog = require("electron").remote.dialog;

@Component({
  components: { AdvancedExportConfig }
})
export default class ExportSettings extends Vue {
  get icons(): Record<string, string> {
    return {
      excel: mdiMicrosoftExcel,
      csv: mdiFileDelimitedOutline,
      json: mdiCodeJson,
      xml: mdiXml,
      config: mdiCog,
      succeed: mdiCheckCircle,
      wosfile: mdiFileDocumentOutline,
      folder: mdiFolderOpen
    };
  }

  get range(): number[] {
    return this.wos.range;
  }

  set range(v: number[]) {
    this.wos.updateRange(v);
  }

  get showAnotherIcon() {
    return this.wos.chosenDirectory && this.validRange;
  }

  get validRange(): boolean {
    return (
      this.range[1] - this.range[0] >= 0 &&
      this.range[0] !== 0 &&
      this.range[1] !== 0
    );
  }

  get anotherColor() {
    if (this.showAnotherIcon) return "green";
    else return "";
  }

  get maxSelect(): number {
    let max = 0;
    if (this.wos.queryFeedback?.recordsFound && !this.wos.disableWosQuery) {
      // api allows maximum 100k records to paginate out of a query
      max = Math.min(this.wos.queryFeedback?.recordsFound, 100000);
    } else if (this.wos.fileContent?.length) {
      max = this.wos.fileContent?.length;
    }
    if (max < this.range[1]) this.range[1] = max;
    return max;
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

  get chosenDirectory(): string {
    return this.wos.chosenDirectory;
  }

  set chosenDirectory(dir: string) {
    this.wos.updateChosenDirectory(dir);
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get exportPossible(): boolean {
    return (
      (this.wos.queryStatus > 0 || this.wos.fileContent.length > 0) &&
      this.chosenDirectory != null &&
      !this.wos.exportConfigError
    );
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

<style scoped lang="scss">
.activeBtn {
  color: white;
}

.text-error {
  color: red;
}
</style>
