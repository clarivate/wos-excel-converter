import axios, { AxiosInstance } from "axios";

export default class VersionChecker {
  private static instance: VersionChecker;
  private _axiosInstance: AxiosInstance;

  private constructor() {
    this._axiosInstance = axios.create({
      baseURL: "https://api.github.com"
    });
  }

  public static getInstance(): VersionChecker {
    if (!VersionChecker.instance) {
      VersionChecker.instance = new VersionChecker();
    }
    return VersionChecker.instance;
  }

  public getCurrentVersion(): Promise<string> {
    return this._axiosInstance
      .get("/repos/clarivate/wos-excel-converter/releases/latest")
      .then(response => {
        return response.data["name"] as string;
      })
      .catch(() => {
        return "0.0.0";
      });
  }
}
