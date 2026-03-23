import dotenv from 'dotenv'

dotenv.config({ quiet: true })

export const wosExpandedToken = process.env.WOS_EXPANDED_TOKEN?.trim() ?? ''
export const incitesToken = process.env.INCITES_TOKEN?.trim() ?? ''

export const hasTokenEnv = wosExpandedToken.length > 0 && incitesToken.length > 0
