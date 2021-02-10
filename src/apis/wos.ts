import axios, { AxiosResponse } from "axios";
import QueryFeedBack from "@/apis/helper/QueryFeedback";

const WOS_EXPANDED_URL = "https://api.clarivate.com/api/wos";

export default class WosExpanded {
  key?: string;

  constructor(key?: string) {
    this.key = key;
  }

  /**
   * verifies key and returns remaining tokens
   */
  verifyKey(): Promise<number> {
    return axios({
      method: "get",
      url: WOS_EXPANDED_URL + "/id/0",
      params: {
        count: 0,
        firstRecord: 1,
        databaseId: "WOS"
      },
      headers: {
        "X-ApiKey": this.key
      }
    }).then(function(response) {
      return Number(response.headers["x-rec-amtperyear-remaining"]);
    });
  }

  validateQuery(
    usrQuery: string,
    databaseId: string,
    edition: string | null = null,
    lang: string | null = null
  ): Promise<QueryFeedBack> {
    return axios({
      method: "get",
      url: WOS_EXPANDED_URL,
      params: {
        databaseId: databaseId,
        usrQuery: usrQuery,
        edition: edition,
        lang: lang,
        firstRecord: 1,
        count: 0
      },
      headers: {
        "X-ApiKey": this.key
      }
    }).then(function(response) {
      const queryResult = response.data["QueryResult"];
      const queryFeedback: QueryFeedBack = {
        recordsFound: Number(queryResult["RecordsFound"]),
        queryId: Number(queryResult["QueryID"]),
        remainingRecords: Number(response.headers["x-rec-amtperyear-remaining"])
      };
      return queryFeedback;
    });
  }

  runQueryIdRaw(
    queryId: number,
    startRecord: number,
    count: number
  ): Promise<AxiosResponse> {
    return axios({
      method: "get",
      url: WOS_EXPANDED_URL + "/query/" + queryId,
      params: {
        firstRecord: startRecord,
        count: count
      },
      headers: {
        "X-ApiKey": this.key
      }
    }).then(function(response) {
      return response;
    });
  }

  runQueryRaw(
    usrQuery: string,
    databaseId: string,
    edition: string | null = null,
    lang: string | null = null,
    startRecord: number,
    count: number
  ): Promise<AxiosResponse> {
    return axios({
      method: "get",
      url: WOS_EXPANDED_URL,
      params: {
        databaseId: databaseId,
        usrQuery: usrQuery,
        edition: edition,
        lang: lang,
        firstRecord: startRecord,
        count: count
      },
      headers: {
        "X-ApiKey": this.key
      }
    }).then(function(response) {
      return response;
    });
  }
}
