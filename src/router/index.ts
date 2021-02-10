import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Token from "../views/Token.vue";
import Query from "../views/Query.vue";
import About from "../views/About.vue";
import AttributeSelection from "@/views/AttributeSelection.vue";
import GenerateFile from "@/views/GenerateFile.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/token",
    alias: "/",
    name: "token",
    component: Token
  },
  {
    path: "/query",
    name: "query",
    component: Query
  },
  {
    path: "/selection",
    name: "attrSelection",
    component: AttributeSelection
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

export default router;
