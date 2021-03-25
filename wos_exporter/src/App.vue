<template>
  <v-app>
    <v-overlay :value="generationStarted" opacity="0"> </v-overlay>
    <v-navigation-drawer left app permanent>
      <v-overlay :value="generationStarted" opacity="0"> </v-overlay>
      <template v-slot:prepend>
        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="title">
                <strong style="color:black">Web of Science</strong
                ><span class="text-sm-h6">&trade;</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                <span style="color: black">
                  <strong>API Expanded</strong> Excel Converter</span
                >
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
      </template>

      <v-list>
        <v-list-item link :to="{ name: 'token' }">
          <v-list-item-content>
            <v-list-item-title>1. API Token</v-list-item-title>
            <v-list-item-subtitle
              v-show="tokenSucceeded && remainingRecordsAvailable"
            >
              Remaining records:
              <strong>{{ remainingRecords }}</strong></v-list-item-subtitle
            >
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon color="green" v-if="tokenSucceeded">
              {{ icons.succeed }}
            </v-icon>
            <v-icon color="red" v-if="tokenFailed"> {{ icons.failed }}</v-icon>
            <v-icon color="orange" v-if="tokenWarning">
              {{ icons.failed }}
            </v-icon>
          </v-list-item-icon>
        </v-list-item>

        <v-list-item link :to="{ name: 'query' }">
          <v-list-item-content>
            <v-list-item-title>2. Search details</v-list-item-title>
            <v-list-item-subtitle v-show="queryRecordsAvailable">
              Records found: <strong>{{ queryRecords }}</strong>
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon color="green" v-if="querySucceeded">
              {{ icons.succeed }}
            </v-icon>
            <v-icon color="red" v-if="queryFailed"> {{ icons.failed }}</v-icon>
            <v-icon color="orange" v-if="queryWarning">
              {{ icons.failed }}
            </v-icon>
          </v-list-item-icon>
        </v-list-item>

        <v-list-item link :to="{ name: 'attrSelection' }">
          <v-list-item-content>
            <v-list-item-title>3. Attribute selection</v-list-item-title>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon color="green" v-if="!configFailure">
              {{ icons.succeed }}
            </v-icon>
            <v-icon color="red" v-if="configFailure">
              {{ icons.failed }}
            </v-icon>
          </v-list-item-icon>
        </v-list-item>

        <v-list-item link :to="{ name: 'genFile' }">
          <v-list-item-content>
            <v-list-item-title>4. Generate File</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <v-list>
          <v-list-item link :to="{ name: 'about' }">
            <v-list-item-content>
              <v-list-item-title>About</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <router-view />
      <div id="wosIcon">
        Powered by
        <v-icon size="150">$wos</v-icon>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { mdiKey, mdiCheckCircle, mdiAlert } from "@mdi/js";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";

@Component({})
export default class App extends Vue {
  get generationStarted(): boolean {
    return this.wos.generationStarted;
  }

  get icons(): Record<string, string> {
    return {
      token: mdiKey,
      succeed: mdiCheckCircle,
      failed: mdiAlert
    };
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
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
    return "text-" + this.wos.tokenMessageType;
  }

  get tokenSucceeded(): boolean {
    return this.wos.tokenMessageType == "success";
  }

  get tokenFailed(): boolean {
    return this.wos.tokenMessageType == "error";
  }

  get tokenWarning(): boolean {
    return this.wos.tokenMessageType == "warning";
  }

  get querySucceeded(): boolean {
    return this.wos.queryMessageType == "success";
  }

  get queryFailed(): boolean {
    return this.wos.queryMessageType == "error";
  }

  get queryWarning(): boolean {
    return this.wos.queryMessageType == "warning";
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
