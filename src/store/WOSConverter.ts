import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";
import QueryFeedBack from "@/apis/helper/QueryFeedback";
import WosExpanded from "@/apis/wos";
import { ExportConfig } from "@/apis/helper/ExportConfig";
import { defaultConfig } from "@/apis/configs/defaultConfig";
import ConverterStorageService from "@/store/ConverterStorageService";
import InCites from "@/apis/incites";

enum WosQueryStatus {
  Uninitialized,
  Initialized,
  TooManyRecords,
  QuoteNotEnough
}

@Module({ name: "wosModule" })
export default class WOSConverter extends VuexModule {
  private _configName: string = ConverterStorageService.getInstance()
    .configName;
  private _allConfigNames: Array<string> = ConverterStorageService.getInstance()
    .allConfigNames;
  private _wosExpToken: string = ConverterStorageService.getInstance().wosToken;
  private _icToken: string = ConverterStorageService.getInstance().icToken;
  private _remainingRecords = 0;
  private _remainingIcRequests = 0;
  private _messageWosToken: string | null = null;
  private _messageWosTypeToken: string | null = null;
  private _messageIcToken: string | null = null;
  private _messageIcTypeToken: string | null = null;
  private _selectedPanel = 0;

  private _databaseId =
    ConverterStorageService.getInstance().wosDatabaseId || "WOS";

  private _useWosQuery = ConverterStorageService.getInstance().useWosQuery;
  private _icSchema: {
    code: string;
    name: string;
  } = ConverterStorageService.getInstance().icSchema || {
    code: "wos",
    name: "Web of Science"
  };

  private _icEsci: "y" | "n" = ConverterStorageService.getInstance().esci;
  private _lang: string | null = ConverterStorageService.getInstance().wosLang;
  private _edition: string | null = ConverterStorageService.getInstance()
    .wosEdition;
  private _timeSpan: string | null = ConverterStorageService.getInstance()
    .wosTimeSpan;
  private _usrQuery: string | null =
    ConverterStorageService.getInstance().wosUsrQuery ||
    "TS=(covid) AND PY=2020";
  private _queryStatus: WosQueryStatus = WosQueryStatus.Uninitialized;
  private _queryFeedback: QueryFeedBack | null = null;

  private _wosQueryDialog = false;
  private _icQueryDialog = false;
  private _advancedExportDialog = false;

  private _queryWosMessage: string | null = null;
  private _queryWosMessageType: string | null = null;

  private _exportConfigError = false;
  private _exportConfigText = JSON.stringify(defaultConfig, null, 2);

  private _chosenDirectory =
    localStorage._chosenDirectory || require("os").homedir();
  private _fileName: string | undefined = "WOS_Export";

  private _plainFileWithIds =
    ConverterStorageService.getInstance().idsFile || "";

  private _generationStarted = false;

  private _packageVersion = process.env.PACKAGE_VERSION || "0";

  get packageVersion(): string {
    return this._packageVersion;
  }

  get useWosQuery(): boolean {
    return this._useWosQuery;
  }
  @Mutation
  updateUseWosQuery(b: boolean) {
    ConverterStorageService.getInstance().useWosQuery = b;
    this._useWosQuery = ConverterStorageService.getInstance().useWosQuery;
  }

  get wosQueryDialog(): boolean {
    return this._wosQueryDialog;
  }
  @Mutation
  updateWosQueryDialog(b: boolean) {
    this._wosQueryDialog = b;
  }

  get icQueryDialog(): boolean {
    return this._icQueryDialog;
  }
  @Mutation
  updateIcQueryDialog(b: boolean) {
    this._icQueryDialog = b;
  }

  get advancedExportDialog(): boolean {
    return this._advancedExportDialog;
  }
  @Mutation
  updateAdvancedExportDialog(b: boolean) {
    this._advancedExportDialog = b;
  }

  get selectedPanel(): number {
    return this._selectedPanel;
  }
  @Mutation
  updateSelectedPanel(index: number) {
    this._selectedPanel = index;
  }

  @Mutation
  nextPanel() {
    this._selectedPanel++;
  }

  get allConfigNames(): Array<string> {
    return this._allConfigNames;
  }

  get configName(): string {
    return this._configName;
  }

  get timeSpan(): string | null {
    return this._timeSpan;
  }

  @Mutation
  updateConfigName(configName: string) {
    ConverterStorageService.getInstance().configName = configName;
    this._configName = configName;
    this._allConfigNames = ConverterStorageService.getInstance().allConfigNames;
  }
  get generationStarted(): boolean {
    return this._generationStarted;
  }

  get icEsci() {
    return this._icEsci;
  }

  @Mutation
  updateIcEsci(val: "y" | "n") {
    ConverterStorageService.getInstance().esci = val;
    this._icEsci = ConverterStorageService.getInstance().esci;
  }

  get plainFileWithIds() {
    return this._plainFileWithIds;
  }

  @Mutation
  updatePlainFileWithIds(val: string) {
    ConverterStorageService.getInstance().idsFile = val;
    this._plainFileWithIds = ConverterStorageService.getInstance().idsFile;
  }

  @Mutation
  updateGenerationStarted(started: boolean) {
    this._generationStarted = started;
  }

  get chosenDirectory(): string | undefined {
    return this._chosenDirectory;
  }

  @Mutation
  updateChosenDirectory(dir: string | undefined) {
    this._chosenDirectory = dir;
  }

  get fileName(): string | undefined {
    return this._fileName;
  }

  @Mutation
  updateFileName(filename: string | undefined) {
    this._fileName = filename;
  }

  get exportConfigText(): string {
    return this._exportConfigText;
  }

  @Mutation
  updateExportConfigText(jsonTxt: string) {
    this._exportConfigText = jsonTxt;
  }

  get exportConfig(): ExportConfig | undefined {
    if (!this._exportConfigError) {
      return JSON.parse(this.exportConfigText) as ExportConfig;
    }
  }

  get exportConfigError(): boolean {
    return this._exportConfigError;
  }

  @Mutation
  updateExportConfigError(error: boolean) {
    this._exportConfigError = error;
  }

  get wosExpToken(): string | null {
    return this._wosExpToken;
  }

  get icToken(): string | null {
    return this._icToken;
  }

  get wosClient(): WosExpanded | undefined {
    return WosExpanded.getInstance(this._wosExpToken);
  }

  get icClient(): InCites | undefined {
    return InCites.getInstance(this._icToken);
  }

  get wosTokenMessage(): string | null {
    return this._messageWosToken;
  }

  get icTokenMessage(): string | null {
    return this._messageIcToken;
  }

  get wosTokenMessageType(): string | null {
    return this._messageWosTypeToken;
  }

  get icTokenMessageType(): string | null {
    return this._messageIcTypeToken;
  }

  get remainingRecords(): number {
    return this._remainingRecords;
  }
  get remainingIcRequests(): number {
    return this._remainingIcRequests;
  }

  get queryWosMessage(): string | null {
    return this._queryWosMessage;
  }

  get queryWosMessageType(): string | null {
    return this._queryWosMessageType;
  }

  get databaseId(): string {
    return this._databaseId;
  }

  get icSchema(): { code: string; name: string } {
    return this._icSchema;
  }

  get lang(): string | null {
    return this._lang;
  }

  get edition(): string | null {
    return this._edition;
  }

  get usrQuery(): string | null {
    return this._usrQuery;
  }

  get queryStatus(): WosQueryStatus {
    return this._queryStatus;
  }

  get queryFeedback(): QueryFeedBack | null {
    return this._queryFeedback;
  }

  @Mutation
  updateRemainingRecords(records: number) {
    this._remainingRecords = records;
  }

  @Mutation
  updateIcRemainingRequests(requests: number) {
    this._remainingIcRequests = requests;
  }

  @Mutation
  updateWosExpToken(token: string | null) {
    ConverterStorageService.getInstance().wosToken = token ? token : "";
    this._wosExpToken = ConverterStorageService.getInstance().wosToken;
  }
  @Mutation
  updateIcToken(token: string | null) {
    ConverterStorageService.getInstance().icToken = token ? token : "";
    this._icToken = ConverterStorageService.getInstance().icToken;
  }

  @Mutation
  updateWosMessagesToken(msgObject: { msg: string; msgType: string }) {
    this._messageWosToken = msgObject.msg;
    this._messageWosTypeToken = msgObject.msgType;
  }

  @Mutation
  updateIcMessagesToken(msgObject: { msg: string; msgType: string }) {
    this._messageIcToken = msgObject.msg;
    this._messageIcTypeToken = msgObject.msgType;
  }

  @Mutation
  updateMessagesQuery(msgObject: { msg: string; msgType: string }) {
    this._queryWosMessage = msgObject.msg;
    this._queryWosMessageType = msgObject.msgType;
  }

  @Mutation
  updateDatabaseId(databaseId: string) {
    ConverterStorageService.getInstance().wosDatabaseId = databaseId;
    this._databaseId = ConverterStorageService.getInstance().wosDatabaseId;
  }

  @Mutation
  updateIcSchema(icSchema: { code: string; name: string }) {
    ConverterStorageService.getInstance().icSchema = icSchema;
    this._icSchema = ConverterStorageService.getInstance().icSchema;
  }

  @Mutation
  updateLang(lang: string | null) {
    ConverterStorageService.getInstance().wosLang = lang || "";
    this._lang = ConverterStorageService.getInstance().wosLang;
  }

  @Mutation
  updateEdition(edition: string | null) {
    ConverterStorageService.getInstance().wosEdition = edition || "";
    this._edition = ConverterStorageService.getInstance().wosEdition;
  }

  @Mutation
  updateUsrQuery(usrQuery: string | null) {
    ConverterStorageService.getInstance().wosUsrQuery = usrQuery || "";
    this._usrQuery = ConverterStorageService.getInstance().wosUsrQuery;
  }

  @Mutation
  updateTimeSpan(timespan: string | null) {
    ConverterStorageService.getInstance().wosTimeSpan = timespan || "";
    this._timeSpan = ConverterStorageService.getInstance().wosTimeSpan;
  }

  @Mutation
  updateQueryFeedback(queryFeedback: QueryFeedBack) {
    this._queryFeedback = queryFeedback;
  }

  @Mutation
  updateQueryStatus(queryStatus: WosQueryStatus) {
    this._queryStatus = queryStatus;
  }

  @Mutation
  changeConfig(to: string) {
    const s = ConverterStorageService.getInstance();
    s.changeConfig(to);
    this._wosExpToken = s.wosToken;
    this._useWosQuery = s.useWosQuery;
    this._configName = s.configName;
    this._icToken = s.icToken;
    this._allConfigNames = s.allConfigNames;
    this._timeSpan = s.wosTimeSpan;
    this._usrQuery = s.wosUsrQuery;
    this._databaseId = s.wosDatabaseId;
    this._edition = s.wosEdition;
    this._lang = s.wosLang;
    this._icSchema = s.icSchema;
    this._icEsci = s.esci;
  }

  @Action
  copyConfig() {
    const newName = ConverterStorageService.getInstance().copyConfig();
    this.context.commit("changeConfig", newName);
  }

  @Action
  deleteConfig() {
    ConverterStorageService.getInstance().deleteCurrent();
    this.context.commit(
      "changeConfig",
      ConverterStorageService.getInstance().configName
    );
  }
  @Action
  async verifyWosToken() {
    if (this.wosExpToken == null || this.wosExpToken.trim() == "") {
      this.context.commit("updateWosMessagesToken", {
        msg: "Your Web of Science API Expanded token is empty",
        msgType: "warning"
      });
    } else {
      this.wosClient
        ?.verifyKey()
        .then(records => {
          const format = new Intl.NumberFormat("en-us", {
            minimumFractionDigits: 0
          });
          this.context.commit("updateRemainingRecords", records);
          this.context.commit("updateWosMessagesToken", {
            msg:
              "Web of Science API Expanded validation succeeded. Remaining records (year) <strong>" +
              (records != -1 ? format.format(records) : "unlimited") +
              "</strong>.",
            msgType: "success"
          });
        })
        .catch(ex => {
          this.context.commit("updateRemainingRecords", 0);
          this.context.commit("updateWosMessagesToken", {
            msg:
              ex.message +
              " " +
              ex.response.data.code +
              ". Reason: " +
              ex.response.data.message,
            msgType: "error"
          });
        })
        .finally(() => {
          this.context.commit(
            "updateQueryStatus",
            WosQueryStatus.Uninitialized
          );
          this.context.commit("updateMessagesQuery", {
            msg: null,
            msgType: null
          });
        });
    }
  }

  @Action
  async verifyIcToken() {
    if (this.icToken == null || this.icToken.trim() == "") {
      this.context.commit("updateIcMessagesToken", {
        msg: "Your InCites API token is empty",
        msgType: "warning"
      });
    } else {
      this.icClient
        ?.verifyKey()
        .then(records => {
          const format = new Intl.NumberFormat("en-us", {
            minimumFractionDigits: 0
          });
          this.context.commit("updateIcRemainingRequests", records);
          this.context.commit("updateIcMessagesToken", {
            msg:
              "InCites API validation succeeded. Remaining requests (day) <strong>" +
              (records != -1
                ? format.format(records) +
                  "</strong> ~ " +
                  records * 100 +
                  " records"
                : "<strong>unlimited</strong>") +
              ".",
            msgType: "success"
          });
        })
        .catch(ex => {
          this.context.commit("updateIcRemainingRequests", 0);
          this.context.commit("updateIcMessagesToken", {
            msg:
              ex.message +
              " " +
              ex.response.data.code +
              ". Reason: " +
              ex.response.data.message,
            msgType: "error"
          });
        });
    }
  }

  @Action
  async validateQuery() {
    if (this.usrQuery != null) {
      this.wosClient
        ?.validateQuery(
          this.usrQuery,
          this.databaseId,
          this.edition,
          this.lang == "" ? null : this.lang,
          this.timeSpan
        )
        .then(feedback => {
          const format = new Intl.NumberFormat("en-us", {
            minimumFractionDigits: 0
          });
          this.context.commit("updateQueryFeedback", feedback);
          if (feedback.recordsFound > 100000) {
            this.context.commit(
              "updateQueryStatus",
              WosQueryStatus.TooManyRecords
            );
            this.context.commit("updateMessagesQuery", {
              msg:
                "Web of Science API Query passed. Records found: <strong>" +
                format.format(feedback.recordsFound) +
                "</strong>. You can export max 100k records through API.",
              msgType: "warning"
            });
          } else if (feedback.recordsFound > feedback.remainingRecords) {
            this.context.commit(
              "updateQueryStatus",
              WosQueryStatus.QuoteNotEnough
            );
            this.context.commit("updateMessagesQuery", {
              msg:
                "Web of Science API Query passed. Records found: <strong>" +
                format.format(feedback.recordsFound) +
                "</strong>. You do not have enough remaining records.",
              msgType: "warning"
            });
          } else {
            this.context.commit(
              "updateQueryStatus",
              WosQueryStatus.Initialized
            );
            this.context.commit("updateMessagesQuery", {
              msg:
                "Web of Science API Query passed. Records found: <strong>" +
                format.format(feedback.recordsFound) +
                "</strong>",
              msgType: "success"
            });
          }
        })
        .catch(ex => {
          ex.response.code;
          this.context.commit("updateMessagesQuery", {
            msg:
              ex.message +
              " " +
              ex.response.data.code +
              ". Reason: " +
              ex.response.data.message,
            msgType: "error"
          });
          this.context.commit("updateQueryFeedback", null);
          this.context.commit(
            "updateQueryStatus",
            WosQueryStatus.Uninitialized
          );
        });
    } else {
      this.context.commit("updateMessagesQuery", {
        msg: "usrQuery cannot be empty",
        msgType: "warning"
      });
      this.context.commit("updateQueryFeedback", null);
      this.context.commit("updateQueryStatus", WosQueryStatus.Uninitialized);
    }
  }

  @Action
  async runQueryId(payload: { startRecord: number; count: number }) {
    if (this.queryFeedback != null && this.wosClient != undefined) {
      const response = await this.wosClient.runQueryIdRaw(
        this.queryFeedback.queryId,
        payload.startRecord,
        payload.count
      );
      const queryFeedback: QueryFeedBack = {
        recordsFound: this.queryFeedback.recordsFound,
        queryId: this.queryFeedback.queryId,
        remainingRecords: Number(response.headers["x-rec-amtperyear-remaining"])
      };
      this.context.commit("updateQueryFeedback", queryFeedback);
      return response.data;
    }
  }

  @Action
  async runQuery(payload: { startRecord: number; count: number }) {
    if (this.wosClient != undefined && this.usrQuery != null) {
      let badRequest = false;
      let tries = 0;
      while (!badRequest || (badRequest && tries <= 3)) {
        const response = await this.wosClient.runQueryRaw(
          this.usrQuery,
          this.databaseId,
          this.edition,
          this.lang,
          payload.startRecord,
          payload.count
        );
        if (response.status > 400) {
          badRequest = true;
          tries++;
        } else {
          const queryResult = response.data["QueryResult"];
          const queryFeedback: QueryFeedBack = {
            recordsFound: Number(queryResult["RecordsFound"]),
            queryId: Number(queryResult["QueryID"]),
            remainingRecords: Number(
              response.headers["x-rec-amtperyear-remaining"]
            )
          };
          this.context.commit("updateQueryFeedback", queryFeedback);

          return response.data;
        }
      }
    }
  }
}
