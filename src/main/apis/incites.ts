import axios, { AxiosInstance, AxiosResponse } from 'axios'
import throttleScheduler from './throttle_scheduler'

type InCitesQuotaSnapshot = {
  requestsPerDayRemaining: number | null
  requestsPerDayLimit: number | null
  requestsPerSecondRemaining: number | null
  requestsPerSecondLimit: number | null
  rateLimitRemaining: number | null
  rateLimitResetSeconds: number | null
}

type InCitesVerificationInfo = {
  remainingPerDay: number | null
  headers: InCitesQuotaSnapshot
}

export default class InCites {
  private static instance: InCites
  private readonly _key: string

  private _axiosInstance: AxiosInstance

  get key(): string {
    return this._key
  }

  private constructor(key: string) {
    this._key = key
    this._axiosInstance = axios.create({
      baseURL: 'https://api.clarivate.com/api/incites',
      headers: {
        'X-ApiKey': this._key
      }
    })
    const scheduler = throttleScheduler('x-ratelimit-remaining-second')

    this._axiosInstance.interceptors.response.use(scheduler)
  }

  public static getInstance(token: string | null): InCites | undefined {
    if (!InCites.instance) {
      if (token !== null) {
        InCites.instance = new InCites(token)
      } else {
        InCites.instance = new InCites('')
      }
    } else if (InCites.instance.key !== token && token !== null) {
      InCites.instance = new InCites(token)
    }

    return InCites.instance
  }

  /**
   * verifies key and returns remaining requests per day
   */
  verifyKey(): Promise<InCitesVerificationInfo> {
    return this._axiosInstance
      .get('/DocumentLevelMetricsByUT/json', {
        params: {
          UT: '00000000000000',
          ver: 2,
          schema: 'wos'
        }
      })
      .then((response) => {
        const parseHeaderNumber = (value: unknown): number | null => {
          const parsed = Number(value)
          return Number.isFinite(parsed) ? parsed : null
        }

        const headers: InCitesQuotaSnapshot = {
          requestsPerDayRemaining: parseHeaderNumber(response.headers['x-ratelimit-remaining-day']),
          requestsPerDayLimit: parseHeaderNumber(response.headers['x-ratelimit-limit-day']),
          requestsPerSecondRemaining: parseHeaderNumber(
            response.headers['x-ratelimit-remaining-second']
          ),
          requestsPerSecondLimit: parseHeaderNumber(response.headers['x-ratelimit-limit-second']),
          rateLimitRemaining: parseHeaderNumber(response.headers['ratelimit-remaining']),
          rateLimitResetSeconds: parseHeaderNumber(response.headers['ratelimit-reset'])
        }

        return {
          remainingPerDay: headers.requestsPerDayRemaining,
          headers
        }
      })
  }

  runQueryRawJson(
    uts: Array<string>,
    schema: string,
    esci: string | null = null
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get('/DocumentLevelMetricsByUT/json', {
        params: {
          UT: uts.join(','),
          ver: 2,
          schema: schema,
          esci: esci
        }
      })
      .then(function (response) {
        return response
      })
      .catch((ex) => ex.response)
  }

  runQueryRawXml(
    uts: Array<string>,
    schema: string,
    esci: string | null = null
  ): Promise<AxiosResponse> {
    return this._axiosInstance
      .get('/DocumentLevelMetricsByUT/xml', {
        params: {
          UT: uts.join(','),
          ver: 2,
          schema: schema,
          esci: esci
        }
      })
      .then(function (response) {
        return response
      })
      .catch((ex) => ex.response)
  }
}
