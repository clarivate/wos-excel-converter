import Vue from "vue";
import AppNew from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import i18n from "./i18n";

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: h => h(AppNew),
  created() {
    // Prevent blank screen in Electron builds
    try {
      this.$router.push("/");
    } catch (e) {
      //this happens only in test mode
    }
  }
}).$mount("#app");
