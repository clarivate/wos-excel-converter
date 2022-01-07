<template>
  <v-row no-gutters>
    <v-dialog
      v-model="advancedExportDialog"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-badge v-show="isError" color="error" dot>
          <v-btn
            icon
            outlined
            elevation="0"
            small
            class="ml-3"
            :disabled="isConfigEnabled"
            color="error"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>
              {{ icons.config }}
            </v-icon>
          </v-btn>
        </v-badge>
        <v-btn
          v-show="!isError"
          icon
          outlined
          elevation="0"
          small
          class="ml-3"
          :disabled="isConfigEnabled"
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>
            {{ icons.config }}
          </v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-app-bar dense dark color="#222222" fixed>
          <v-toolbar-title
            >Advanced Export Settings for Excel/CSV
          </v-toolbar-title>
          <v-btn-toggle outlined text class="ml-3" mandatory v-model="mode">
            <v-btn class="text-none" disabled
              >Beginner (Actively exploring)</v-btn
            >
            <v-btn class="text-none">Expert</v-btn>
          </v-btn-toggle>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn text @click="advancedExportDialog = false">
              Close
            </v-btn>
          </v-toolbar-items>
        </v-app-bar>
        <v-container>
          <v-row class="mt-12" v-show="mode === 1">
            <v-col cols="12">
              <span class="text-sm-body-2">
                This configuration defines sheets, its columns and the values
                with JSON path selection. The JSON path selection is based on
                <a class="text-none" @click="openJmesGithub">JMES Path</a>. This
                configuration is optimized only for Web of Science Core
                Collection responses. For CSV new files are created for sheet
                configurations.
              </span>
              <div id="jsoneditor" style="height: 600px; width: auto"></div>
              <v-btn @click="resetDefault" class="text-none mt-3"
                >Reset default configuration
              </v-btn>
            </v-col>
          </v-row>
          <v-row class="mt-12" v-show="mode === 0">
            <v-col cols="12" md="6" lg="4"> Database</v-col>
            <v-col cols="12" md="6" lg="4"> Database</v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import WOSConverter from "@/store/WOSConverter";
import { shell } from "electron";
import { mdiCog } from "@mdi/js";
import JSONEditor, {
  JSONEditorOptions,
  ParseError,
  SchemaValidationError
} from "jsoneditor";
import { defaultConfig } from "@/apis/configs/defaultConfig";

import "jsoneditor/dist/jsoneditor.min.css";

import ConfigSchema from "@/apis/helper/ConfigSchema";
import { ExportConfig } from "@/apis/helper/ExportConfig";

@Component({})
export default class AdvancedExportConfig extends Vue {
  @Prop(Boolean) readonly isConfigEnabled!: boolean;

  mode = 1;
  editor: JSONEditor | null = null;
  jsonEditorMounted = false;

  get mainConfig(): ExportConfig {
    return defaultConfig;
  }

  onValidationError(err: readonly (SchemaValidationError | ParseError)[]) {
    this.wos.updateExportConfigError(err.length > 0);
  }

  onUserChange(jsonString: string) {
    this.wos.updateExportConfigText(jsonString);
  }

  get isError(): boolean {
    return this.wos.exportConfigError;
  }

  resetDefault() {
    this.wos.updateExportConfigError(false);
    this.wos.updateExportConfigText(JSON.stringify(this.mainConfig, null, 2));
    this.editor?.set(this.wos.exportConfig);
  }

  openJmesGithub() {
    shell.openExternal("https://github.com/nanoporetech/jmespath-ts");
  }

  mounted() {
    this.renderJsonEditor();
  }

  updated() {
    this.renderJsonEditor();
  }

  renderJsonEditor() {
    if (this.jsonEditorMounted) {
      this.editor?.setText(this.wos.exportConfigText);
      return;
    }
    const container = document.getElementById("jsoneditor") as HTMLElement;
    const options: JSONEditorOptions = {
      mode: "code",
      enableSort: false,
      enableTransform: false,
      history: false,
      schema: ConfigSchema,
      onValidationError: err => this.onValidationError(err),
      onChangeText: jsonString => this.onUserChange(jsonString),
      onChange: () => {
        const text = this.wos.exportConfigText;
        this.onUserChange(text);
      }
    };
    try {
      this.editor = new JSONEditor(container, options);
      this.editor.setText(this.wos.exportConfigText);
      this.jsonEditorMounted = true;
    } catch (e) {
      this.jsonEditorMounted = e.name === "SyntaxError";
      console.log("Error by mounting jsoneditor" + e);
    }
  }

  get icons(): Record<string, string> {
    return {
      config: mdiCog
    };
  }

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  get advancedExportDialog(): boolean {
    return this.wos.advancedExportDialog;
  }

  set advancedExportDialog(b: boolean) {
    this.wos.updateAdvancedExportDialog(b);
  }
}
</script>

<style lang="scss">
.jsoneditor-menu {
  background-color: #5e33bf !important;
  border-bottom: #5e33bf !important;
}

.jsoneditor-menu > .jsoneditor-modes > button:disabled,
.jsoneditor-menu > button:disabled {
  color: white !important;
  opacity: 0.5 !important;
  background-color: #c4b5cf;
}

.jsoneditor-poweredBy {
  display: none !important;
}
</style>
