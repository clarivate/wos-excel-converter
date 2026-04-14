/**
 * Web of Science Advanced Search Field Tags
 * Based on: https://webofscience.zendesk.com/hc/en-us/articles/26916347018257
 */

export interface FieldTag {
  code: string
  label: string
  description: string
}

export const WOS_FIELD_TAGS: FieldTag[] = [
  // This allowlist is intentionally restricted to tags documented here:
  // https://webofscience.zendesk.com/hc/en-us/articles/26916347018257-Web-of-Science-Core-Collection-Advanced-Search-Field-Tags
  { code: 'AB', label: 'Abstract', description: 'Searches the Abstract field.' },
  { code: 'AD', label: 'Address', description: 'Searches institution and place names in Address.' },
  {
    code: 'AI',
    label: 'Author Identifiers',
    description: 'Searches ResearcherID and ORCID identifiers.'
  },
  { code: 'AK', label: 'Author Keywords', description: 'Searches the Author Keywords field.' },
  { code: 'ALL', label: 'All Fields', description: 'Searches terms across all searchable fields.' },
  { code: 'AU', label: 'Author', description: 'Searches author names.' },
  {
    code: 'CF',
    label: 'Conference',
    description: 'Searches conference title, location, date, and sponsors.'
  },
  { code: 'CI', label: 'City', description: 'Searches cities in addresses.' },
  { code: 'CU', label: 'Country/Region', description: 'Searches countries/regions in addresses.' },
  { code: 'DO', label: 'DOI', description: 'Searches the Digital Object Identifier.' },
  {
    code: 'DOP',
    label: 'Date of Publication',
    description: 'Searches publication date values and ranges.'
  },
  { code: 'ED', label: 'Editor', description: 'Searches editor names.' },
  { code: 'FD', label: 'Funding Details', description: 'Searches funding details.' },
  { code: 'FG', label: 'Grant Number', description: 'Searches grant numbers.' },
  { code: 'FO', label: 'Funding Agency', description: 'Searches funding agencies.' },
  {
    code: 'FPY',
    label: 'Final Publication Year',
    description: 'Searches the final publication year.'
  },
  { code: 'FT', label: 'Funding Text', description: 'Searches funding text.' },
  { code: 'GP', label: 'Group Author', description: 'Searches group/corporate author names.' },
  {
    code: 'IS',
    label: 'ISSN/ISBN',
    description: 'Documented as IS for ISSN and ISBN in the source table.'
  },
  { code: 'KP', label: 'Keywords Plus', description: 'Searches the Keywords Plus field.' },
  {
    code: 'OG',
    label: 'Organization-Enhanced',
    description: 'Searches preferred organization names and variants.'
  },
  { code: 'OO', label: 'Organization', description: 'Searches organization names.' },
  { code: 'PMID', label: 'PubMed ID', description: 'Searches PubMed identifiers.' },
  {
    code: 'PS',
    label: 'Province/State',
    description: 'Searches province and state values in addresses.'
  },
  { code: 'PUBL', label: 'Publisher', description: 'Searches publisher names.' },
  { code: 'PY', label: 'Year Published', description: 'Searches year published values.' },
  {
    code: 'SA',
    label: 'Street Address',
    description: 'Searches street address terms in affiliations.'
  },
  { code: 'SDG', label: 'Sustainable Development Goals', description: 'Searches UN SDG terms.' },
  { code: 'SG', label: 'Suborganization', description: 'Searches suborganizations in addresses.' },
  { code: 'SO', label: 'Publication Name', description: 'Searches publication/source names.' },
  { code: 'SU', label: 'Research Area', description: 'Searches research areas.' },
  { code: 'TI', label: 'Title', description: 'Searches document title.' },
  {
    code: 'TMAC',
    label: 'Macro Level Citation Topic',
    description: 'Searches macro citation topics.'
  },
  {
    code: 'TMIC',
    label: 'Micro Level Citation Topic',
    description: 'Searches micro citation topics.'
  },
  {
    code: 'TMSO',
    label: 'Meso Level Citation Topic',
    description: 'Searches meso citation topics.'
  },
  {
    code: 'TS',
    label: 'Topic',
    description: 'Searches topic terms in Title, Abstract, Author Keywords, and Keywords Plus.'
  },
  { code: 'UT', label: 'Accession Number', description: 'Searches the record accession number.' },
  {
    code: 'WC',
    label: 'Web of Science Category',
    description: 'Searches Web of Science categories.'
  },
  {
    code: 'ZP',
    label: 'Zip/Postal Code',
    description: 'Searches zip or postal codes in addresses.'
  }
]

export const WOS_BOOLEAN_OPERATORS = ['AND', 'OR', 'NOT']
export const WOS_RESERVED_WORDS = [...WOS_BOOLEAN_OPERATORS, 'NEAR', 'SAME']

/**
 * Extract field tag recommendations based on current cursor position
 */
export function getFieldTagSuggestions(query: string, cursorPos: number): FieldTag[] {
  const textBeforeCursor = query.substring(0, cursorPos)
  const parts = textBeforeCursor.split(/[\s()]/)
  const lastWord = parts[parts.length - 1]

  if (lastWord.length === 0) return []

  const upperWord = lastWord.toUpperCase()
  return WOS_FIELD_TAGS.filter(
    (tag) => tag.code.startsWith(upperWord) || tag.label.toUpperCase().startsWith(upperWord)
  )
}

/**
 * Parse and identify field tags in a query string
 * Returns array of { code, start, end } positions
 */
export interface FieldTagMatch {
  code: string
  start: number
  end: number
}

export function parseFieldTags(query: string): FieldTagMatch[] {
  const matches: FieldTagMatch[] = []
  // Match field tags: word characters followed by =
  // Field tags must not be inside quotes
  let inQuotes = false
  let quoteChar = ''
  let i = 0

  while (i < query.length) {
    const char = query[i]

    // Track quote state
    if ((char === '"' || char === "'") && (i === 0 || query[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuotes = false
      }
      i++
      continue
    }

    // Only process field tags outside of quotes
    if (!inQuotes) {
      // Match documented field tags: 2-5 uppercase letters followed by =
      const tagMatch = query.substring(i).match(/^([A-Z]{2,5})=/)
      if (tagMatch) {
        const tagCode = tagMatch[1]
        // Verify it's a valid WOS field tag
        if (WOS_FIELD_TAGS.some((tag) => tag.code === tagCode)) {
          matches.push({
            code: tagCode,
            start: i,
            end: i + tagCode.length + 1 // +1 for the '='
          })
          i += tagCode.length + 1
          continue
        }
      }
    }

    i++
  }

  return matches
}

/**
 * Get field tag at specific position
 */
export function getFieldTagAtPosition(query: string, pos: number): FieldTag | null {
  const matches = parseFieldTags(query)
  const match = matches.find((m) => m.start <= pos && pos <= m.end)
  if (!match) return null

  return WOS_FIELD_TAGS.find((tag) => tag.code === match.code) || null
}

/**
 * Detect if position is inside quotes
 */
export function isInsideQuotes(query: string, pos: number): boolean {
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < pos && i < query.length; i++) {
    const char = query[i]
    if ((char === '"' || char === "'") && (i === 0 || query[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuotes = false
      }
    }
  }

  return inQuotes
}
