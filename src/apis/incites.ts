import axios, { AxiosInstance, AxiosResponse } from "axios";
import throttleScheduler from "@/apis/throttle_scheduler";

export default class InCites {
  private static instance: InCites;
  private readonly _key: string;

  private _axiosInstance: AxiosInstance;

  get key(): string {
    return this._key;
  }

  private constructor(key: string) {
    this._key = key;
    this._axiosInstance = axios.create({
      baseURL: "https://api.clarivate.com/api/incites",
      headers: {
        "X-ApiKey": this._key
      }
    });
    const scheduler = throttleScheduler("x-ratelimit-remaining-second");

    this._axiosInstance.interceptors.response.use(scheduler);
  }

  public static getInstance(token: string | null): InCites | undefined {
    if (!InCites.instance) {
      if (token != null) {
        InCites.instance = new InCites(token);
      } else {
        InCites.instance = new InCites("");
      }
    } else if (InCites.instance.key != token && token != null) {
      InCites.instance = new InCites(token);
    }

    return InCites.instance;
  }

  /**
   * verifies key and returns remaining requests per day
   */
  verifyKey(): Promise<number> {
    return this._axiosInstance
      .get("/DocumentLevelMetricsByUT/json", {
        params: {
          UT: "00000000000000",
          ver: 2,
          schema: "wos"
        }
      })
      .then(function(response) {
        const remaining = response.headers["x-ratelimit-remaining-day"];
        return Number(remaining ? remaining : "-1");
      });
  }

  runQueryRawJson(
    uts: Array<string>,
    schema: string,
    esci: string | null = null
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get("/DocumentLevelMetricsByUT/json", {
        params: {
          UT: uts.join(","),
          ver: 2,
          schema: schema,
          esci: esci
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }

  runQueryRawXml(
    uts: Array<string>,
    schema: string,
    esci: string | null = null
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get("/DocumentLevelMetricsByUT/xml", {
        params: {
          UT: uts.join(","),
          ver: 2,
          schema: schema,
          esci: esci
        }
      })
      .then(function(response) {
        return response;
      })
      .catch(ex => ex.response);
  }
}
