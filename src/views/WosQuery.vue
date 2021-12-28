<template>
  <v-row no-gutters>
    <v-dialog
      v-model="wosQueryDialog"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          block
          text
          x-large
          outlined
          class="text-none no-text-transform"
          v-bind="attrs"
          v-on="on"
          :disabled="!wos.wosExpToken || wos.disableWosQuery"
        >
          <span style="white-space: normal !important;">
            Web of Science API <br />Expanded Query Details
          </span>
        </v-btn>
      </template>
      <v-card>
        <v-app-bar dense dark color="#222222" fixed>
          <v-toolbar-title>Web of Science API Query Details</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn text @click="wosQueryDialog = false">
              Close
            </v-btn>
          </v-toolbar-items>
        </v-app-bar>
        <v-container>
          <v-row class="mt-12">
            <v-col cols="12" xl="6">
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
            <v-col cols="12" xl="6">
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
            <v-col cols="12" xl="4">
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

            <v-col cols="6" xl="4">
              <v-text-field
                v-model="createdTimeSpan"
                hint="Filter on when the record firstly created in Web of Science. Format yyyy-mm-dd+yyyy-mm-dd"
                persistent-hint
                label="createdTimeSpan"
                outlined
                dense
                flat
              ></v-text-field>
            </v-col>
            <v-col cols="6" xl="4">
              <v-text-field
                v-model="modifiedTimeSpan"
                hint="Filter on when the record modified in Web of Science. Format yyyy-mm-dd+yyyy-mm-dd"
                persistent-hint
                label="modifiedTimeSpan"
                outlined
                dense
                flat
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row no-gutters class="pt-6 pb-8">
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
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";
import { shell } from "electron";

@Component({})
export default class WosQuery extends Vue {
  mounted() {
    this.validate();
  }
  set databaseId(databaseId: string) {
    this.wos.updateDatabaseId(databaseId);
  }

  get databaseId() {
    return this.wos.databaseId;
  }

  set createdTimeSpan(timespan: string | null) {
    this.wos.updateCreatedTimeSpan(timespan);
  }

  get createdTimeSpan() {
    return this.wos.createdTimeSpan;
  }

  set modifiedTimeSpan(timespan: string | null) {
    this.wos.updateModifiedTimeSpan(timespan);
  }

  get modifiedTimeSpan() {
    return this.wos.modifiedTimeSpan;
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
    this.wos.validateQuery();
  }

  get usrQuery() {
    return this.wos.usrQuery;
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get wosQueryDialog(): boolean {
    return this.wos.wosQueryDialog;
  }

  set wosQueryDialog(b: boolean) {
    this.wos.updateWosQueryDialog(b);
  }

  get tokenVerified(): boolean {
    return this.wos.wosTokenMessageType === "success";
  }

  get queryMessage(): string | null {
    return this.wos.queryWosMessage;
  }

  get queryMessageType(): string | null {
    return this.wos.queryWosMessageType;
  }

  validate() {
    this.wos.validateQuery();
  }
  openWOSQueryDocumentation() {
    shell.openExternal(
      "https://webofscience.help.clarivate.com/en-us/Content/advanced-search.html"
    );
  }
}
</script>
