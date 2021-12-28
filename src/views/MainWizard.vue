<template>
  <v-container>
    <v-row class="pl-1 pb-6">
      <v-col cols="6">
        <div class="text-h5" v-if="!editName">
          {{ configName }}
          <v-btn icon small :disabled="wos.generationStarted">
            <v-icon small @click="editName = !editName"
              >{{ icons.edit }}
            </v-icon>
          </v-btn>
        </div>
        <div v-if="editName">
          <v-text-field
            class="text-h5"
            v-model="configName"
            @keyup.enter="editName = !editName"
            counter="25"
            :rules="[
              v =>
                (v.length > 0 && v.length <= 25) ||
                'At least one character and maximum 25 characters are allowed',
              v => nameExists(v) || v + ' already exists'
            ]"
          >
            <template v-slot:append-outer>
              <v-btn
                text
                class="text-none"
                @click="editName = !editName"
                :disabled="wos.generationStarted"
                >Done
              </v-btn>
            </template>
          </v-text-field>
        </div>
      </v-col>
      <v-col cols="6">
        <div class="float-right">
          <v-btn
            text
            small
            @click="copyConfig()"
            :disabled="wos.generationStarted"
          >
            <v-icon small class="mr-2">{{ icons.duplicate }}</v-icon>
            Copy
          </v-btn>
          <v-btn
            text
            small
            color="red"
            v-if="wos.allConfigNames.length > 1"
            class="mr-2"
            @click="wos.deleteConfig()"
            :disabled="wos.generationStarted"
          >
            <v-icon small>{{ icons.delete }}</v-icon>
            Delete
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-expansion-panels
      focusable
      color="primary"
      v-model="selectedPanel"
      :disabled="wos.generationStarted"
    >
      <Token />
      <QueryDetails />
      <ExportFormat />
      <ExportSettings />
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
  mdiAlert,
  mdiApps,
  mdiCheckCircle,
  mdiInformation,
  mdiKey,
  mdiOpenInNew,
  mdiPencilOutline,
  mdiDelete,
  mdiContentDuplicate,
  mdiRefresh,
  mdiClose
} from "@mdi/js";
import Token from "@/views/Token.vue";
import ExportFormat from "@/views/ExportFormat.vue";
import ExportSettings from "@/views/ExportSettings.vue";
import { shell } from "electron";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";
import QueryDetails from "@/views/QueryDetails.vue";
import ConverterStorageService from "@/store/ConverterStorageService";

@Component({
  components: {
    QueryDetails,
    ExportFormat,
    ExportSettings,
    Token
  }
})
export default class MainWizard extends Vue {
  editName = false;

  get icons(): Record<string, string> {
    return {
      token: mdiKey,
      succeed: mdiCheckCircle,
      failed: mdiAlert,
      myApps: mdiApps,
      info: mdiInformation,
      openNew: mdiOpenInNew,
      edit: mdiPencilOutline,
      delete: mdiDelete,
      duplicate: mdiContentDuplicate,
      reset: mdiRefresh,
      finishEditName: mdiClose
    };
  }

  openUrl(url: string) {
    shell.openExternal(url);
  }

  copyConfig() {
    this.wos.copyConfig();
    this.editName = true;
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get selectedPanel(): number {
    if (this.wos.generationStarted) this.wos.updateSelectedPanel(-1);
    return this.wos.selectedPanel;
  }

  set selectedPanel(index: number) {
    this.wos.updateSelectedPanel(index);
  }

  get configName(): string {
    return this.wos.configName;
  }

  set configName(name: string) {
    if (name.length > 0 && name.length <= 25 && this.nameExists(name))
      this.wos.updateConfigName(name);
  }

  nameExists(name: string): boolean {
    if (name == this.configName) return true;
    else
      return !ConverterStorageService.getInstance().allConfigNames.includes(
        name
      );
  }
}
</script>

<style scoped></style>
