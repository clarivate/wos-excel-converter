<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="atLeastOneTokenValid">
      <template v-slot:actions>
        <v-icon v-if="atLeastOneTokenValid" :color="anotherColor">
          {{ anotherIcon }}
        </v-icon>
      </template>
      <template v-slot:default="{ open }">
        <v-progress-linear
          indeterminate
          color="primary"
          v-if="!open && validationProgress"
          absolute
          top
        />
        <v-row no-gutters>
          <v-col cols="12"
            ><v-toolbar-title> API Tokens</v-toolbar-title></v-col
          >

          <v-col
            cols="12"
            v-if="wosTokenMsg != null && wosExpToken"
            class="text--secondary pt-2"
            ><span
              :class="wosRemainingRecTextClass"
              v-html="wosTokenMsg"
            ></span>
          </v-col>
          <v-col
            cols="12"
            v-if="icTokenMsg != null && icToken"
            class="text--secondary pt-2"
          >
            <span :class="icRemainingRecTextClass" v-html="icTokenMsg"></span>
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-progress-linear
        indeterminate
        color="primary"
        absolute
        v-if="validationProgress"
      />
      <v-row no-gutters class="pt-4">
        <v-col md="8" lg="6">
          <v-text-field
            v-model="wosExpToken"
            :append-icon="showWosToken ? icons.eye : icons.eyeOff"
            :type="showWosToken ? 'text' : 'password'"
            name="input-10-1"
            label="Web of Science API Expanded Token"
            @click:append="showWosToken = !showWosToken"
          ></v-text-field>
        </v-col>
        <v-col md="4" lg="6"
          ><v-btn
            color="accent"
            class="mt-5 ml-8 text-none"
            v-if="!wosExpToken"
            @click="openUrl('https://developer.clarivate.com/apis/wos')"
            >Request a Token</v-btn
          >
          <v-btn
            icon
            outlined
            v-if="wosExpToken"
            class="mt-4 ml-4"
            title="(Re-)Validate tokens with Web of Science API Servers"
            @click="wos.verifyWosToken()"
            ><v-icon>{{ icons.refresh }} </v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col md="8" lg="6">
          <v-text-field
            v-model="icToken"
            :append-icon="showIcToken ? icons.eye : icons.eyeOff"
            :type="showIcToken ? 'text' : 'password'"
            name="input-10-1"
            label="InCites API Token"
            @click:append="showIcToken = !showIcToken"
          ></v-text-field>
        </v-col>
        <v-col md="4" lg="6"
          ><v-btn
            color="accent"
            class="mt-5 ml-8 text-none"
            @click="openUrl('https://developer.clarivate.com/apis/incites')"
            v-if="!icToken"
            >Request a Token</v-btn
          >
          <v-btn
            icon
            outlined
            v-if="icToken"
            class="mt-4 ml-4"
            title="(Re-)Validate tokens with Web of Science API Servers"
            @click="wos.verifyIcToken()"
            ><v-icon>{{ icons.refresh }} </v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
  mdiAlert,
  mdiApps,
  mdiCheckCircle,
  mdiEye,
  mdiEyeOff,
  mdiInformation,
  mdiKey,
  mdiOpenInNew,
  mdiRefresh
} from "@mdi/js";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";
import { shell } from "electron";

@Component({})
export default class Token extends Vue {
  showWosToken = false;
  showIcToken = false;
  validationProgress = false;

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  mounted() {
    if (this.wosExpToken?.length && !this.wosTokenSucceeded) {
      this.validationProgress = true;
      this.wos.verifyWosToken().then(() => (this.validationProgress = false));
    }
    if (this.icToken?.length && !this.icTokenSucceeded) {
      this.validationProgress = true;
      this.wos.verifyIcToken().then(() => (this.validationProgress = false));
    }
  }

  get icons(): Record<string, string> {
    return {
      eye: mdiEye,
      eyeOff: mdiEyeOff,
      token: mdiKey,
      succeed: mdiCheckCircle,
      failed: mdiAlert,
      myApps: mdiApps,
      info: mdiInformation,
      openNew: mdiOpenInNew,
      refresh: mdiRefresh
    };
  }
  nextPanel() {
    this.wos.nextPanel();
  }

  get atLeastOneTokenValid(): boolean {
    return this.wosTokenSucceeded || this.icTokenSucceeded;
  }

  openUrl(url: string) {
    shell.openExternal(url);
  }
  get anotherIcon(): string {
    if (this.wosTokenSucceeded && !this.icToken?.length) {
      return this.icons.succeed;
    } else if (this.icTokenSucceeded && !this.wosExpToken?.length) {
      return this.icons.succeed;
    } else if (this.wosTokenSucceeded && this.icTokenSucceeded) {
      return this.icons.succeed;
    } else if (this.wosTokenSucceeded && !this.icTokenSucceeded) {
      return this.icons.failed;
    } else if (!this.wosTokenSucceeded && this.icTokenSucceeded) {
      return this.icons.failed;
    } else {
      return this.icons.failed;
    }
  }

  get anotherColor(): string {
    if (this.wosTokenSucceeded && !this.icToken?.length) {
      return "green";
    } else if (this.icTokenSucceeded && !this.wosExpToken?.length) {
      return "green";
    } else if (this.wosTokenSucceeded && this.icTokenSucceeded) {
      return "green";
    } else if (this.wosTokenSucceeded && !this.icTokenSucceeded) {
      return "orange";
    } else if (!this.wosTokenSucceeded && this.icTokenSucceeded) {
      return "orange";
    } else {
      return "red";
    }
  }

  set wosExpToken(token: string | null) {
    this.wos.updateWosExpToken(token);
    this.wos.verifyWosToken();
    this.wos.validateQuery();
  }

  get wosExpToken(): string | null {
    return this.wos.wosExpToken;
  }

  set icToken(token: string | null) {
    this.wos.updateIcToken(token);
    this.wos.verifyIcToken();
  }

  get icToken(): string | null {
    return this.wos.icToken;
  }

  get wosTokenMsg(): string | null {
    return this.wos.wosTokenMessage;
  }

  get wosTokenMsgType(): string | null {
    return this.wos.wosTokenMessageType;
  }

  get wosRemainingRecTextClass(): string {
    return "text-" + this.wos.wosTokenMessageType;
  }

  get wosTokenSucceeded(): boolean {
    return this.wos.wosTokenMessageType == "success";
  }

  get wosTokenFailed(): boolean {
    return this.wos.wosTokenMessageType == "error";
  }

  get wosTokenWarning(): boolean {
    return this.wos.wosTokenMessageType == "warning";
  }

  get icTokenMsg(): string | null {
    return this.wos.icTokenMessage;
  }

  get icTokenMsgType(): string | null {
    return this.wos.icTokenMessageType;
  }

  get icRemainingRecTextClass(): string {
    return "text-" + this.wos.icTokenMessageType;
  }

  get icTokenSucceeded(): boolean {
    return this.wos.icTokenMessageType == "success";
  }

  get icTokenFailed(): boolean {
    return this.wos.icTokenMessageType == "error";
  }

  get icTokenWarning(): boolean {
    return this.wos.icTokenMessageType == "warning";
  }
}
</script>

<style scoped lang="scss">
.text-success {
}
.text-warning {
  color: orange;
}

.text-error {
  color: red;
}
</style>
