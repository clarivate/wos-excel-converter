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
    createdSpan: string | null = null,
    modifiedSpan: string | null = null
  ): Promise<QueryFeedBack> {
    const params: Record<string, any> = {
      databaseId: databaseId,
      usrQuery: usrQuery,
      edition: edition,
      lang: lang,
      createdTimeSpan: createdSpan,
      firstRecord: 1,
      count: 0
    };

    if (databaseId !== "WOK" || modifiedSpan)
      params.modifiedTimeSpan = modifiedSpan;

    return this._axiosInstance.post("", params).then(function(response) {
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
    count: number,
    isXml = false
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get("/query/" + queryId, {
        params: {
          firstRecord: startRecord,
          count: count
        },
        headers: {
          Accept: isXml ? "application/xml" : "application/json"
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }

  runQueryRaw(
    usrQuery: string,
    databaseId: string,
    edition: string | null = null,
    lang: string | null = null,
    startRecord: number,
    count: number,
    createdSpan: string | null = null,
    modifiedSpan: string | null = null,
    isXml = false
  ): Promise<AxiosResponse> {
    const params: Record<string, any> = {
      databaseId: databaseId,
      usrQuery: usrQuery,
      edition: edition,
      firstRecord: startRecord,
      count: count,
      createdTimeSpan: createdSpan,
      sortField: "LD+D"
    };
    if (lang) {
      params.lang = lang;
    }
    if (databaseId !== "WOK" || modifiedSpan) {
      params.modifiedSpan = modifiedSpan;
    }

    return this._axiosInstance
      .post("", params, {
        headers: {
          Accept: isXml ? "application/xml" : "application/json"
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }

  getCitingReferences(
    uniqueId: string,
    databaseId: string,
    startRecord: number,
    count: number
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get("/citing", {
        params: {
          uniqueId: uniqueId,
          databaseId: databaseId,
          count: count,
          firstRecord: startRecord
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }

  async getAllReferences(
    uniqueId: string,
    databaseId: string
  ): Promise<CitedReferences> {
    let start: number;
    const count = 100;

    const result: CitedReferences = {
      Data: []
    };
    let recordsFound = count;

    for (start = 1; start < recordsFound; start = start + count) {
      const response = await this.citedReferencesWithRetries(
        uniqueId,
        databaseId,
        start,
        count
      );
      if (response.status == 200) {
        const responseData = response.data as CitedReferencesResponse;
        result.Data = result.Data.concat(responseData.Data);
        recordsFound = responseData.QueryResult.RecordsFound;
      } else {
        return Promise.reject(
          "Failed to fetch references for " +
            uniqueId +
            "in " +
            databaseId +
            ". Response " +
            response.data
        );
      }
    }

    return Promise.resolve(result);
  }

  private async citedReferencesWithRetries(
    uniqueId: string,
    databaseId: string,
    startRecord: number,
    count: number
  ): Promise<AxiosResponse> {
    let tries = 0;
    let response = await this.getCitedReferences(
      uniqueId,
      databaseId,
      startRecord,
      count
    );
    while (response.status >= 400 && tries < 3) {
      tries = tries + 1;
      response = await this.getCitedReferences(
        uniqueId,
        databaseId,
        startRecord,
        count
      );
    }
    return response;
  }

  getCitedReferences(
    uniqueId: string,
    databaseId: string,
    startRecord: number,
    count: number,
    isXml = false
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get("/references", {
        params: {
          uniqueId: uniqueId,
          databaseId: databaseId,
          count: count,
          firstRecord: startRecord
        },
        headers: {
          Accept: isXml ? "application/xml" : "application/json"
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }
}

export type CitedReference = {
  UID: string;
  CitedAuthor: string;
  TimesCited: string;
  Year: string;
  Page: string;
  Volume: string;
  CitedWork: string;
  CitedTitle: string;
};

export type CitedReferences = {
  Data: Array<CitedReference>;
};

interface CitedReferencesResponse extends CitedReferences {
  QueryResult: {
    QueryID: number;
    RecordsSearched: number;
    RecordsFound: number;
  };
}
