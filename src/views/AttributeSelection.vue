<template>
  <div>
    <v-container>
      <h3>3. Attribute selection</h3>
      <span class="text-sm-body-2">
        This configuration defines sheets, its columns and the values with JSON
        path selection. The JSON path selection is based on
        <a text class="text-none" @click="openJmesGithub">JMES Path</a>. This
        configuration is optimized only WOS Core responses.
      </span>
      <div id="jsoneditor" style="height: 600px"></div>
      <v-btn @click="resetDefault" class="text-none mt-3"
        >Reset default configuration
      </v-btn>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { defaultConfig } from "@/apis/configs/defaultConfig";
import JSONEditor, {
  JSONEditorOptions,
  ParseError,
  SchemaValidationError
} from "jsoneditor";
import "jsoneditor/dist/jsoneditor.min.css";
import ConfigSchema from "@/apis/helper/ConfigSchema";
import WOSConverter from "@/store/WOSConverter";
import { getModule } from "vuex-module-decorators";
import { shell } from "electron";
import { ExportConfig } from "@/apis/helper/ExportConfig";

interface SelectedConfig {
  name: string;
  config: ExportConfig;
  hint: string;
}

@Component({})
export default class AttributeSelection extends Vue {
  editor: JSONEditor | null = null;

  get wos(): WOSConverter {
    return getModule(WOSConverter, this.$store);
  }

  onValidationError(err: readonly (SchemaValidationError | ParseError)[]) {
    this.wos.updateExportConfigError(err.length > 0);
  }

  onUserChange(jsonString: string) {
    this.wos.updateExportConfigText(jsonString);
  }

  resetDefault() {
    this.wos.updateExportConfigText(JSON.stringify(defaultConfig, null, 2));
    this.editor?.set(this.wos.exportConfig);
  }
  openJmesGithub() {
    shell.openExternal("https://github.com/nanoporetech/jmespath-ts");
  }

  mounted() {
    const container = document.getElementById("jsoneditor") as HTMLElement;
    const options: JSONEditorOptions = {
      mode: "code",
      enableSort: false,
      enableTransform: false,
      history: false,
      schema: ConfigSchema,
      onValidationError: err => this.onValidationError(err),
      onChangeText: jsonString => this.onUserChange(jsonString)
    };
    this.editor = new JSONEditor(container, options);
    this.editor.setText(this.wos.exportConfigText);
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
