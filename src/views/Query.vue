<template>
  <v-container>
    <h3>2. Search details</h3>
    <v-form id="validate-query" @submit.prevent="validate">
      <v-container>
        <v-row class="pb-8">
          <v-col cols="12" lg="4">
            <v-combobox
              v-model="databaseId"
              hint="Database to search. WOK represents all databases."
              persistent-hint
              label="databaseId"
              :items="[
                'BCI',
                'BIOABS',
                'BIOSIS',
                'CCC',
                'DCI',
                'DIIDW',
                'MEDLINE',
                'WOK',
                'WOS',
                'ZOOREC'
              ]"
              outlined
              dense
              flat
            ></v-combobox>
          </v-col>
          <v-col cols="12" lg="4">
            <v-text-field
              v-model="lang"
              hint="Language of search. This element can take only one value: en for English. If no language is specified, English is passed by default."
              persistent-hint
              label="lang"
              outlined
              dense
              flat
            ></v-text-field>
          </v-col>
          <v-col cols="12" lg="4">
            <v-text-field
              v-model="edition"
              hint="Edition(s) to be searched. If empty, user permissions will be substituted. Must include the name of the collection and edition name separated by '+', ex: WOS+SCI.
              Multiple editions are separated by ','. Editions available for collection (WOS) - AHCI,CCR,IC,ISSHP,ISTP,SCI,SSCI,BHCI,BSCI and ESCI."
              persistent-hint
              label="edition"
              outlined
              dense
              flat
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row no-gutters class="pb-8">
          <v-textarea
            outlined
            name="input-7-1"
            label="usrQuery"
            value="TS=(cadmium)"
            v-model="usrQuery"
            hint="User query for requesting data, ex: TS=(cadmium). The query parser will return errors for invalid queries."
            persistent-hint
            dense
            flat
          >
            <template v-slot:message="{ message }">
              <span v-html="message"></span>
              <a target="_blank" @click="openWOSQueryDocumentation"
                >Click here</a
              >
              for more details.
            </template>
          </v-textarea>
        </v-row>
        <v-row no-gutters class="pb-8">
          <v-col cols="3" sm="3" md="3" lg="2" xl="1">
            <v-btn
              type="submit"
              @click="validate"
              form="validate-query"
              :disabled="!tokenVerified"
              >Validate
            </v-btn>
          </v-col>
          <v-col cols="9" sm="9" md="8" lg="4" xl="5">
            <v-alert
              v-if="!tokenVerified"
              dense
              colored-border
              color="#eeeeee"
              elevation="0"
              type="info"
              >Verify your token first
            </v-alert>
            <v-alert
              v-if="queryMessageType != null"
              dense
              text
              :type="queryMessageType"
              v-html="queryMessage"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";
import { shell } from "electron";

@Component({})
export default class Query extends Vue {
  set databaseId(databaseId: string) {
    this.wos.updateDatabaseId(databaseId);
  }

  get databaseId() {
    return this.wos.databaseId;
  }

  set edition(edition: string | null) {
    this.wos.updateEdition(edition);
  }

  get edition() {
    return this.wos.edition;
  }

  set lang(lang: string | null) {
    this.wos.updateLang(lang);
  }

  get lang() {
    return this.wos.lang;
  }

  set usrQuery(usrQuery: string | null) {
    this.wos.updateUsrQuery(usrQuery);
  }

  get usrQuery() {
    return this.wos.usrQuery;
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get tokenVerified(): boolean {
    return this.wos.tokenMessageType === "success";
  }

  get queryMessage(): string | null {
    return this.wos.queryMessage;
  }

  get queryMessageType(): string | null {
    return this.wos.queryMessageType;
  }

  validate() {
    this.wos.validateQuery();
  }
  openWOSQueryDocumentation() {
    shell.openExternal(
      "http://images.webofknowledge.com//WOKRS529AR7/help/WOS/hp_advanced_examples.html"
    );
  }
}
</script>
