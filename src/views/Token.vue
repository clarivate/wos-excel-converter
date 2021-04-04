<template>
  <v-container>
    <v-form id="verify-token" @submit.prevent="verifyToken">
      <v-row no-gutters>
        <v-col md="8" lg="6">
          <v-text-field
            v-model="wosExpToken"
            :append-icon="show ? icons.eye : icons.eyeOff"
            :type="show ? 'text' : 'password'"
            name="input-10-1"
            label="WOS API Expanded Token"
            @click:append="show = !show"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col md="8" lg="6">
          <v-text-field
            v-model="icToken"
            :append-icon="show ? icons.eye : icons.eyeOff"
            :type="show ? 'text' : 'password'"
            name="input-10-1"
            label="InCites API Token (optional)"
            @click:append="show = !show"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col cols="3" md="2" lg="2" xl="1">
          <v-btn type="submit" @click="verifyToken" form="verify-token"
            >Verify
          </v-btn>
        </v-col>
        <v-col cols="9" md="6" lg="4" xl="5">
          <v-alert
            v-if="tokenMessageType != null"
            dense
            text
            :type="tokenMessageType"
            v-html="tokenMessage"
          />
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mdiEye, mdiEyeOff } from "@mdi/js";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";

@Component({})
export default class Token extends Vue {
  show = false;

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get icons(): Record<string, string> {
    return {
      eye: mdiEye,
      eyeOff: mdiEyeOff
    };
  }

  get tokenMessage(): string | null {
    return this.wos.tokenMessage;
  }

  get tokenMessageType(): string | null {
    return this.wos.tokenMessageType;
  }

  set wosExpToken(token: string | null) {
    this.wos.updateWosExpToken(token);
  }

  get wosExpToken(): string | null {
    return this.wos.wosExpToken;
  }

  set icToken(token: string | null) {
    this.wos.updateIcToken(token);
  }

  get icToken(): string | null {
    return this.wos.icToken;
  }

  verifyToken() {
    this.wos.verifyWithMessages();
  }
}
</script>
