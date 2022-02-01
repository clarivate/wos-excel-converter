<template>
  <v-row no-gutters>
    <v-dialog
      v-model="icQueryDialog"
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
          class="text-none"
          v-bind="attrs"
          v-on="on"
          :disabled="!wos.icToken"
        >
          <span style="white-space: normal !important;">
            InCites API <br />Request Details
          </span>
        </v-btn>
      </template>
      <v-card>
        <v-app-bar dense dark color="#222222" fixed>
          <v-toolbar-title>InCites API Request Details</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn text @click="icQueryDialog = false">
              Close
            </v-btn>
          </v-toolbar-items>
        </v-app-bar>
        <v-container>
          <v-row class="mt-12">
            <v-col cols="12">
              <v-select
                v-model="icSchema"
                hint="Choose schema specific metrics"
                persistent-hint
                label="schema"
                :items="schemaName"
                outlined
                dense
                flat
              >
                <template v-slot:selection="data">
                  {{ data.item.code }} - {{ data.item.name }}
                </template>
                <template v-slot:item="data">
                  {{ data.item.code }} - {{ data.item.name }}
                </template>
              </v-select>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="icEsci"
                hint="Flag to return InCites baseline
              metrics with Emerging Sources Citation Index (ESCI) content.
              Accepts y/n case insensitive values only. y - returns InCites
              metrics with ESCI index, n - returns InCites metrics without ESCI
              index"
                persistent-hint
                :items="['y', 'n']"
                label="esci"
                outlined
                dense
                flat
              ></v-select>
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

@Component({})
export default class IcQuery extends Vue {
  schemaName = [
    { code: "anvur", name: "ANVUR" },
    { code: "for1", name: "Australia ERA 2018 FOR Level 1" },
    { code: "for2", name: "Australia ERA 2018 FOR Level 2" },
    { code: "capesl1", name: "CAPES Level 1" },
    { code: "capesl2", name: "CAPES Level 2" },
    { code: "capesl3", name: "CAPES Level 3" },
    { code: "scadcl1", name: "China SCADC Subject Categories 12 Broad levels" },
    {
      code: "scadcl2",
      name: "China SCADC Subject Categories 77 Narrow levels"
    },
    { code: "ct", name: "Citation Topics" },
    { code: "esi", name: "Essential Science Indicators" },
    { code: "fapesp", name: "FAPESP" },
    { code: "gipp", name: "GIPP" },
    { code: "kakenl2", name: "KAKEN Level 2" },
    { code: "kakenl3", name: "KAKEN Level 3" },
    { code: "oecd", name: "OECD" },
    { code: "pl19", name: "Polish classification of disciplines" },
    {
      code: "ris3",
      name: "Research and Innovation Strategies for Specialization (RIS3)"
    },
    { code: "ref2008", name: "UK REF 2008" },
    { code: "ref2014", name: "UK REF 2014" },
    { code: "ref2021", name: "UK REF 2021" },
    { code: "wos", name: "Web of Science" },
    { code: "sdg", name: "United Nations Sustainable Development Goals" }
  ];

  set icSchema(icSchema: { code: string; name: string }) {
    this.wos.updateIcSchema(icSchema);
  }

  get icSchema() {
    return this.wos.icSchema;
  }

  set icEsci(esci: "y" | "n") {
    this.wos.updateIcEsci(esci);
  }

  get icEsci() {
    return this.wos.icEsci;
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get icQueryDialog(): boolean {
    return this.wos.icQueryDialog;
  }

  set icQueryDialog(b: boolean) {
    this.wos.updateIcQueryDialog(b);
  }
}
</script>
