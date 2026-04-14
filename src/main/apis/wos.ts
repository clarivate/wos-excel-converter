import axios, { AxiosInstance, AxiosResponse } from 'axios'
import WOSQueryFeedback from './helper/WOSQueryFeedback'
import throttleScheduler from './throttle_scheduler'

type WosQuotaSnapshot = {
  recordsPerDayRemaining: number | null
  recordsPerMonthRemaining: number | null
  recordsPerYearRemaining: number | null
  requestsPerSecondRemaining: number | null
  requestsPerDayRemaining: number | null
  requestsPerYearRemaining: number | null
}

type WosVerificationInfo = {
  period: 'Year' | 'Month' | 'Day' | null
  remaining: number | null
  headers: WosQuotaSnapshot
}

export default class WosExpanded {
  private static instance: WosExpanded
  private readonly _key: string

  private _axiosInstance: AxiosInstance

  get key(): string {
    return this._key
  }

  private constructor(key: string) {
    this._key = key
    this._axiosInstance = axios.create({
      baseURL: 'https://api.clarivate.com/api/wos',
      headers: {
        'X-ApiKey': this._key
      }
    })
    const scheduler = throttleScheduler('x-req-reqpersec-remaining')

    this._axiosInstance.interceptors.response.use(scheduler)
  }

  public static getInstance(token: string | null): WosExpanded | undefined {
    if (!WosExpanded.instance) {
      if (token !== null) {
        WosExpanded.instance = new WosExpanded(token)
      } else {
        WosExpanded.instance = new WosExpanded('')
      }
    } else if (WosExpanded.instance.key !== token && token !== null) {
      WosExpanded.instance = new WosExpanded(token)
    }

    return WosExpanded.instance
  }

  /**
   * verifies key and returns remaining records
   */
  async verifyKey(): Promise<WosVerificationInfo> {
    const response = await this._axiosInstance.get('/id/0', {
      params: {
        count: 0,
        firstRecord: 1,
        databaseId: 'WOK'
      }
    })
    return this.quotaHeader(response)
  }

  private parseHeaderNumber(value: unknown): number | null {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  private quotaHeader(response: AxiosResponse): WosVerificationInfo {
    const headers: WosQuotaSnapshot = {
      recordsPerDayRemaining: this.parseHeaderNumber(response.headers['x-rec-amtperday-remaining']),
      recordsPerMonthRemaining: this.parseHeaderNumber(
        response.headers['x-rec-amtpermonth-remaining']
      ),
      recordsPerYearRemaining: this.parseHeaderNumber(
        response.headers['x-rec-amtperyear-remaining']
      ),
      requestsPerSecondRemaining: this.parseHeaderNumber(
        response.headers['x-req-reqpersec-remaining']
      ),
      requestsPerDayRemaining: this.parseHeaderNumber(
        response.headers['x-req-reqperday-remaining']
      ),
      requestsPerYearRemaining: this.parseHeaderNumber(
        response.headers['x-req-reqperyear-remaining']
      )
    }

    if (headers.recordsPerYearRemaining !== null) {
      return {
        period: 'Year',
        remaining: headers.recordsPerYearRemaining,
        headers
      }
    }

    if (headers.recordsPerMonthRemaining !== null) {
      return {
        period: 'Month',
        remaining: headers.recordsPerMonthRemaining,
        headers
      }
    }

    if (headers.recordsPerDayRemaining !== null) {
      return {
        period: 'Day',
        remaining: headers.recordsPerDayRemaining,
        headers
      }
    }

    return {
      period: null,
      remaining: null,
      headers
    }
  }

  async validateQuery(
    usrQuery: string,
    databaseId: string,
    edition: string | null = null,
    lang: string | null = null,
    createdSpan: string | null = null,
    modifiedSpan: string | null = null,
    tcModifiedSpan: string | null = null
  ): Promise<WOSQueryFeedback> {
    const params: Record<string, string | number | null> = {
      databaseId: databaseId,
      usrQuery: usrQuery,
      edition: edition,
      lang: lang,
      createdTimeSpan: createdSpan,
      firstRecord: 1,
      count: 0
    }

    if (databaseId !== 'WOK' && modifiedSpan) params.modifiedTimeSpan = modifiedSpan
    if (databaseId !== 'WOK' && tcModifiedSpan) params.tcModifiedTimeSpan = tcModifiedSpan

    const response = await this._axiosInstance.post('/', params)
    if (response.status !== 200) {
      throw new Error(
        'Query validation failed, request: ' + response.request + ', response: ' + response.data
      )
    } else {
      const queryResult = response.data['QueryResult']
      const quota = this.quotaHeader(response)

      return {
        recordsFound: Number(queryResult['RecordsFound']),
        queryId: Number(queryResult['QueryID']),
        remainingRecords: [quota.period, quota.remaining]
      }
    }
  }

  async getByQueryId(
    queryId: number,
    startRecord: number,
    count: number,
    isXml = false
  ): Promise<AxiosResponse> {
    const response = await this._axiosInstance.get('/query/' + queryId, {
      params: {
        firstRecord: startRecord,
        count: count
      },
      headers: {
        Accept: isXml ? 'application/xml' : 'application/json'
      }
    })
    if (response.status !== 200) {
      throw new Error(
        'Expanded API getByQueryId failed, request: ' +
          response.request +
          ', response: ' +
          response.data
      )
    } else {
      return response.data
    }
  }

  async getByQuery(
    usrQuery: string,
    databaseId: string,
    edition: string | null = null,
    lang: string | null = null,
    startRecord: number,
    count: number,
    createdSpan: string | null = null,
    modifiedSpan: string | null = null,
    tcModifiedSpan: string | null = null,
    isXml = false
  ): Promise<AxiosResponse> {
    const params: Record<string, string | number | null> = {
      databaseId: databaseId,
      usrQuery: usrQuery,
      edition: edition,
      firstRecord: startRecord,
      count: count,
      createdTimeSpan: createdSpan,
      sortField: 'LD+D'
    }
    if (lang) {
      params.lang = lang
    }
    if (databaseId !== 'WOK' && modifiedSpan) {
      params.modifiedSpan = modifiedSpan
    }
    if (databaseId !== 'WOK' && tcModifiedSpan) {
      params.tcModifiedTimeSpan = tcModifiedSpan
    }

    const response = await this._axiosInstance.post('', params, {
      headers: {
        Accept: isXml ? 'application/xml' : 'application/json'
      }
    })
    if (response.status !== 200) {
      throw new Error(
        'Expanded API getByQuery failed, request: ' +
          response.request +
          ', response: ' +
          response.data
      )
    } else {
      return response.data
    }
  }

  async getCiting(
    uniqueId: string,
    databaseId: string,
    startRecord: number,
    count: number
  ): Promise<AxiosResponse> {
    const response = await this._axiosInstance.get('/citing', {
      params: {
        uniqueId: uniqueId,
        databaseId: databaseId,
        count: count,
        firstRecord: startRecord
      }
    })
    if (response.status !== 200) {
      throw new Error(
        'Expanded API getCitingRefs failed, request: ' +
          response.request +
          ', response: ' +
          response.data
      )
    } else {
      return response.data
    }
  }

  async getAllCited(
    uniqueId: string,
    databaseId: string,
    isXml: boolean
  ): Promise<{ Data: Array<any> }> {
    let start: number
    const count = 100

    const result = {
      Data: []
    }
    let recordsFound = count

    for (start = 1; start < recordsFound; start = start + count) {
      const response = await this.citedReferencesWithRetries(
        uniqueId,
        databaseId,
        start,
        count,
        isXml
      )
      if (response.status === 200) {
        const responseData = response.data
        result.Data = result.Data.concat(responseData.Data)
        recordsFound = responseData.QueryResult.RecordsFound
      } else {
        console.error(response.request, response.data, response.status)
        return Promise.reject(
          'Failed to fetch references for ' +
            uniqueId +
            'in ' +
            databaseId +
            '. Response ' +
            response.data
        )
      }
    }

    return result
  }

  private async citedReferencesWithRetries(
    uniqueId: string,
    databaseId: string,
    startRecord: number,
    count: number,
    isXml: boolean
  ): Promise<AxiosResponse> {
    let retries = 0
    let response = await this.getCited(uniqueId, databaseId, startRecord, count, isXml)
    while (response.status >= 400 && retries < 3) {
      retries = retries + 1
      response = await this.getCited(uniqueId, databaseId, startRecord, count)
    }
    return response
  }

  async getCited(
    uniqueId: string,
    databaseId: string,
    startRecord: number,
    count: number,
    isXml = false
  ): Promise<AxiosResponse> {
    const response = await this._axiosInstance.get('/references', {
      params: {
        uniqueId: uniqueId,
        databaseId: databaseId,
        count: count,
        firstRecord: startRecord
      },
      headers: {
        Accept: isXml ? 'application/xml' : 'application/json'
      }
    })

    if (response.status !== 200) {
      throw new Error(
        'Expanded API getCited failed, request: ' +
          response.request +
          ', response: ' +
          response.data
      )
    } else {
      return response.data
    }
  }
}
