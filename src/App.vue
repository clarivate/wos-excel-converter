<template>
  <v-app>
    <v-system-bar app color="black" dark height="30">
      <v-icon size="90">$clarivate</v-icon>
      <v-spacer></v-spacer>
      <v-btn
        small
        color="black"
        class="text-none"
        @click="openUrl('https://developer.clarivate.com/')"
        ><v-icon color="white" small> {{ icons.openNew }}</v-icon
        ><strong>Developer Portal</strong>
      </v-btn>
      <v-btn small color="black" class="text-none" :to="{ name: 'about' }"
        ><v-icon color="white" small> {{ icons.info }}</v-icon>
        <strong>About</strong></v-btn
      >
    </v-system-bar>
    <v-app-bar app color="white" elevation="1">
      <v-container class="fill-height">
        <v-toolbar-title class="mr-10">
          <v-icon size="200" class="pr-1 mb" style="height: 0">$wos</v-icon> API
          Exporter
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
        >
          {{ name }}
        </v-chip>
      </v-chip-group>
    </v-app-bar>
    <v-main app>
      <router-view />
    </v-main>
    <v-footer app>
      <v-row>
        <v-col cols="12">
          <v-btn large color="primary">Export</v-btn>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  mdiKey,
  mdiCheckCircle,
  mdiAlert,
  mdiApps,
  mdiInformation,
  mdiOpenInNew
} from "@mdi/js";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";
import SelectAPIs from "@/views/SelectAPIs.vue";
import WosQuery from "@/views/WosQuery.vue";
import Token from "@/views/Token.vue";
import ExportFormat from "@/views/ExportFormat.vue";
import { shell } from "electron";

@Component({
  components: { ExportFormat, WosQuery, SelectAPIs, Token }
})
export default class App extends Vue {
  get generationStarted(): boolean {
    return this.wos.generationStarted;
  }
  openUrl(url: string) {
    shell.openExternal(url);
  }

  async changeConfig(to: string) {
    this.wos.changeConfig(to);
    await this.wos.verifyWosToken();
    await this.wos.verifyIcToken();
    await this.wos.validateQuery();
  }

  get icons(): Record<string, string> {
    return {
      token: mdiKey,
      succeed: mdiCheckCircle,
      failed: mdiAlert,
      myApps: mdiApps,
      info: mdiInformation,
      openNew: mdiOpenInNew
    };
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

  get queryRecordsAvailable(): boolean {
    return this.wos.queryStatus > 0;
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

  get tokenFailed(): boolean {
    return this.wos.wosTokenMessageType == "error";
  }

  get tokenWarning(): boolean {
    return this.wos.wosTokenMessageType == "warning";
  }

  get querySucceeded(): boolean {
    return this.wos.queryWosMessageType == "success";
  }

  get queryFailed(): boolean {
    return this.wos.queryWosMessageType == "error";
  }

  get queryWarning(): boolean {
    return this.wos.queryWosMessageType == "warning";
  }

  get configFailure(): boolean {
    return this.wos.exportConfigError;
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
