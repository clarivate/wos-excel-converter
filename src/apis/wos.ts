import axios, { AxiosInstance, AxiosResponse } from "axios";
import QueryFeedBack from "@/apis/helper/QueryFeedback";
import throttleScheduler from "@/apis/throttle_scheduler";

export default class WosExpanded {
  private static instance: WosExpanded;
  private readonly _key: string;

  private _axiosInstance: AxiosInstance;

  get key(): string {
    return this._key;
  }
  private constructor(key: string) {
    this._key = key;
    this._axiosInstance = axios.create({
      baseURL: "https://api.clarivate.com/api/wos",
      headers: {
        "X-ApiKey": this._key
      }
    });
    const scheduler = throttleScheduler("x-req-reqpersec-remaining");

    this._axiosInstance.interceptors.response.use(scheduler);
  }

  public static getInstance(token: string | null): WosExpanded | undefined {
    if (!WosExpanded.instance) {
      if (token != null) {
        WosExpanded.instance = new WosExpanded(token);
      } else {
        WosExpanded.instance = new WosExpanded("");
      }
    } else if (WosExpanded.instance.key != token && token != null) {
      WosExpanded.instance = new WosExpanded(token);
    }

    return WosExpanded.instance;
  }

  /**
   * verifies key and returns remaining records of the year
   */
  verifyKey(): Promise<number> {
    return this._axiosInstance
      .get("/id/0", {
        params: {
          count: 0,
          firstRecord: 1,
          databaseId: "WOK"
        }
      })
      .then(function(response) {
        const remaining = response.headers["x-rec-amtperyear-remaining"];
        return Number(remaining ? remaining : "-1");
      });
  }

  validateQuery(
    usrQuery: string,
    databaseId: string,
    edition: string | null = null,
    lang: string | null = null,
    timeSpan: string | null = null
  ): Promise<QueryFeedBack> {
    return this._axiosInstance("", {
      params: {
        databaseId: databaseId,
        usrQuery: usrQuery,
        edition: edition,
        lang: lang,
        loadTimeSpan: timeSpan,
        firstRecord: 1,
        count: 0
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
    return this._axiosInstance
      .get("/query/" + queryId, {
        params: {
          firstRecord: startRecord,
          count: count
        }
      })
      .then(function(response) {
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
    return this._axiosInstance
      .get("", {
        params: {
          databaseId: databaseId,
          usrQuery: usrQuery,
          edition: edition,
          lang: lang,
          firstRecord: startRecord,
          count: count,
          sortField: "LD+D"
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }
}
