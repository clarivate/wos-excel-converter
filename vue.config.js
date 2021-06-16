// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

const packageJson = fs.readFileSync("./package.json");
const version = JSON.parse(packageJson).version || 0;

module.exports = {
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
  configureWebpack: {
    target: "electron-renderer",
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          PACKAGE_VERSION: '"' + version + '"'
        }
      })
    ]
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.clarivate.wos-excel-converter",
        productName: "WOS API Exporter",
        copyright: "Copyright © 2021 Clarivate Analytics"
      },
      externals: ["exceljs"],
      nodeIntegration: true
    },
    i18n: {
      locale: "en",
      fallbackLocale: "en",
      localeDir: "locales",
      enableInSFC: false
    }
  }
};
