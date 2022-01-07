<template>
  <v-container>
    <v-row class="no-gutters">
      <v-col cols="12" lg="8">
        <p>
          This tool allows you to convert the Web of Science API data to Excel
          by using the
          <a @click="openUrl('https://developer.clarivate.com/apis/wos')">
            Web of Science API Expanded</a
          >
          and
          <a @click="openUrl('https://developer.clarivate.com/apis/incites')"
            >InCites API</a
          >. The APIs require a paid license. Please get in touch with
          <a
            @click="
              openUrl(
                'https://support.clarivate.com/ScientificandAcademicResearch/s/?language=en_US'
              )
            "
            >Web of Science Support</a
          >
          or visit
          <a @click="openUrl('https://developer.clarivate.com')"
            >Developer Portal</a
          >
          to learn more about the subscription process.
        </p>
        <p>
          The initiative comes from the Web of Science API Product team to help
          the API users easily understand the data represented as tables.
          Furthermore, you can easily import to BI Tools, such as PowerBI or
          Tableau. The tool is free, licensed as open-source under GPL-3.0.
        </p>
        <p>
          Although the Web of Science API product team is the primary
          maintainer, we welcome anyone to contribute. If you found an issue or
          have an idea for a feature, please
          <a
            @click="
              openUrl(
                'https://github.com/Clarivate-SAR/wos-excel-converter/issues/new/choose'
              )
            "
            >report it in Github</a
          >
          instead of contacting Clarivate Support. This tool uses
          Electron/Typescript/Vue. If you are familiar with those technologies,
          feel free to make a pull request in Github with your ideas, we would
          appreciate it.
        </p>
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-col><v-btn text :to="{ name: 'main' }">Back</v-btn></v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { shell } from "electron";

@Component({})
export default class About extends Vue {
  openUrl(url: string) {
    shell.openExternal(url);
  }
}
</script>

<style scoped lang="scss">
#wosIcon {
  position: fixed;
  bottom: -30px;
  right: 10px;
}
</style>
