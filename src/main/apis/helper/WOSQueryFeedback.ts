export default interface WOSQueryFeedback {
  recordsFound: number
  queryId: number
  remainingRecords: ['Month' | 'Year', number]
}
