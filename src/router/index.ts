import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import About from "../views/About.vue";
import MainWizard from "@/views/MainWizard.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "",
    name: "main",
    alias: "/",
    component: MainWizard
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
