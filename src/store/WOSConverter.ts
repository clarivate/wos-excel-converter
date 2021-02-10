import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";
import QueryFeedBack from "@/apis/helper/QueryFeedback";
import WosExpanded from "@/apis/wos";
import { defaultConfig, ExportConfig } from "@/apis/helper/ExportConfig";

enum QueryStatus {
  Uninitialized,
  Initialized,
  TooManyRecords,
  QuoteNotEnough
}

@Module({ name: "wosModule" })
export default class WOSConverter extends VuexModule {
  private _token: string | null = null;
  private _remainingRecords = 0;
  private _messageToken: string | null = null;
  private _messageTypeToken: string | null = null;

  private _databaseId = "WOS";
  private _lang: string | null = null;
  private _edition: string | null = null;
  private _usrQuery: string | null = "TS=(covid) AND PY=2020";
  private _queryStatus: QueryStatus = QueryStatus.Uninitialized;
  private _queryFeedback: QueryFeedBack | null = null;

  private _queryMessage: string | null = null;
  private _queryMessageType: string | null = null;

  private _exportConfigError = false;
  private _exportConfigText = JSON.stringify(defaultConfig, null, 2);

  private _chosenDirectory = require("os").homedir();
  private _fileName: string | undefined = "WOS_Export";

  private _generationStarted = false;

  get generationStarted(): boolean {
    return this._generationStarted;
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

  get token(): string | null {
    return this._token;
  }

  get wosExpandedClient(): WosExpanded | undefined {
    if (this._token != null) return new WosExpanded(this._token);
  }

  get tokenMessage(): string | null {
    return this._messageToken;
  }

  get tokenMessageType(): string | null {
    return this._messageTypeToken;
  }

  get remainingRecords(): number {
    return this._remainingRecords;
  }

  get queryMessage(): string | null {
    return this._queryMessage;
  }

  get queryMessageType(): string | null {
    return this._queryMessageType;
  }

  get databaseId(): string {
    return this._databaseId;
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

  get queryStatus(): QueryStatus {
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
  updateToken(token: string | null) {
    this._token = token;
  }

  @Mutation
  updateMessagesToken(msgObject: { msg: string; msgType: string }) {
    this._messageToken = msgObject.msg;
    this._messageTypeToken = msgObject.msgType;
  }

  @Mutation
  updateMessagesQuery(msgObject: { msg: string; msgType: string }) {
    this._queryMessage = msgObject.msg;
    this._queryMessageType = msgObject.msgType;
  }

  @Mutation
  updateDatabaseId(databaseId: string) {
    this._databaseId = databaseId;
  }

  @Mutation
  updateLang(lang: string | null) {
    this._lang = lang;
  }

  @Mutation
  updateEdition(edition: string | null) {
    this._edition = edition;
  }

  @Mutation
  updateUsrQuery(usrQuery: string | null) {
    this._usrQuery = usrQuery;
  }

  @Mutation
  updateQueryFeedback(queryFeedback: QueryFeedBack) {
    this._queryFeedback = queryFeedback;
  }

  @Mutation
  updateQueryStatus(queryStatus: QueryStatus) {
    this._queryStatus = queryStatus;
  }

  @Action
  async verifyWithMessages() {
    if (this.token == null || this.token.trim() == "") {
      this.context.commit("updateMessagesToken", {
        msg: "Your token is empty",
        msgType: "warning"
      });
    } else {
      this.wosExpandedClient
        ?.verifyKey()
        .then(records => {
          const format = new Intl.NumberFormat("en-us", {
            minimumFractionDigits: 0
          });
          this.context.commit("updateRemainingRecords", records);
          this.context.commit("updateMessagesToken", {
            msg:
              "Successful. Remaining records <strong>" +
              format.format(records) +
              "</strong>.",
            msgType: "success"
          });
        })
        .catch(ex => {
          this.context.commit("updateRemainingRecords", 0);
          this.context.commit("updateMessagesToken", {
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
          this.context.commit("updateQueryStatus", QueryStatus.Uninitialized);
          this.context.commit("updateMessagesQuery", {
            msg: null,
            msgType: null
          });
        });
    }
  }

  @Action
  async validateQuery() {
    if (this.usrQuery != null) {
      this.wosExpandedClient
        ?.validateQuery(this.usrQuery, this.databaseId, this.edition, this.lang)
        .then(feedback => {
          const format = new Intl.NumberFormat("en-us", {
            minimumFractionDigits: 0
          });
          this.context.commit("updateQueryFeedback", feedback);
          if (feedback.recordsFound > 100000) {
            this.context.commit(
              "updateQueryStatus",
              QueryStatus.TooManyRecords
            );
            this.context.commit("updateMessagesQuery", {
              msg:
                "Validation passed. Records found: <strong>" +
                format.format(feedback.recordsFound) +
                "</strong>. You can export max 100k records through API.",
              msgType: "warning"
            });
          } else if (feedback.recordsFound > feedback.remainingRecords) {
            this.context.commit(
              "updateQueryStatus",
              QueryStatus.QuoteNotEnough
            );
            this.context.commit("updateMessagesQuery", {
              msg:
                "Validation passed. Records found: <strong>" +
                format.format(feedback.recordsFound) +
                "</strong>. You do not have enough remaining records.",
              msgType: "warning"
            });
          } else {
            this.context.commit("updateQueryStatus", QueryStatus.Initialized);
            this.context.commit("updateMessagesQuery", {
              msg:
                "Validation passed. Records found: <strong>" +
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
          this.context.commit("updateQueryStatus", QueryStatus.Uninitialized);
        });
    } else {
      this.context.commit("updateMessagesQuery", {
        msg: "usrQuery cannot be empty",
        msgType: "warning"
      });
      this.context.commit("updateQueryFeedback", null);
      this.context.commit("updateQueryStatus", QueryStatus.Uninitialized);
    }
  }

  @Action
  async runQueryId(payload: { startRecord: number; count: number }) {
    if (this.queryFeedback != null && this.wosExpandedClient != undefined) {
      const response = await this.wosExpandedClient.runQueryIdRaw(
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
    if (this.wosExpandedClient != undefined && this.usrQuery != null) {
      const response = await this.wosExpandedClient.runQueryRaw(
        this.usrQuery,
        this.databaseId,
        this.edition,
        this.lang,
        payload.startRecord,
        payload.count
      );
      const queryResult = response.data["QueryResult"];
      const queryFeedback: QueryFeedBack = {
        recordsFound: Number(queryResult["RecordsFound"]),
        queryId: Number(queryResult["QueryID"]),
        remainingRecords: Number(response.headers["x-rec-amtperyear-remaining"])
      };
      this.context.commit("updateQueryFeedback", queryFeedback);
      return response.data;
    }
  }
}
