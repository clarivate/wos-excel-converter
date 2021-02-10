import Vue from "vue";
import Vuex from "vuex";
import WOSConverter from "@/store/WOSConverter";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    WOSConverter: WOSConverter
  }
});
