import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import WosQuery from "../views/WosQuery.vue";
import About from "../views/About.vue";
import AdvancedAttributeJsonConfig from "@/views/AdvancedAttributeJsonConfig.vue";
import GenerateFile from "@/views/GenerateFile.vue";
import SelectAPIs from "@/views/SelectAPIs.vue";
import Token from "@/views/Token.vue";
import ExportFormat from "@/views/ExportFormat.vue";
import MainWizard from "@/views/MainWizard.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "main",
    component: MainWizard
  },

  {
    path: "/token",
    name: "token",
    component: Token
  },
  {
    path: "/select-api",
    name: "select-api",
    component: SelectAPIs
  },
  {
    path: "/export-format",
    name: "export-format",
    component: ExportFormat
  },
  {
    path: "/query",
    name: "query",
    component: WosQuery
  },
  {
    path: "/selection",
    name: "attrSelection",
    component: AdvancedAttributeJsonConfig
  },
  {
    path: "/generate",
    name: "genFile",
    component: GenerateFile
  },
  {
    path: "/about",
    name: "about",
    component: About
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});
router.afterEach(() => {
  // Use next tick to handle router history correctly
  // see: https://github.com/vuejs/vue-router/issues/914#issuecomment-384477609
  Vue.nextTick(() => {
    document.title =
      "Web of Science API Exporter " + process.env.PACKAGE_VERSION;
  });
});
export default router;
