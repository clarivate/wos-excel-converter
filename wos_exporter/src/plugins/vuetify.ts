import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import WosIcon from "@/components/WosIcon.vue";

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: "mdiSvg",
    values: {
      wos: {
        component: WosIcon
      }
    }
  },
  theme: {
    options: {
      customProperties: true
    },
    themes: {
      light: {
        primary: "#5e33bf",
        secondary: "#e0e0e0",
        accent: "#16ab03",
        error: "#b00020",
        info: "#2196F3",
        success: "#128902",
        warning: "#f89324"
      }
    }
  }
});
