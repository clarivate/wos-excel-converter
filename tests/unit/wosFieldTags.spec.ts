import { test, expect } from '@playwright/test'
import {
  WOS_FIELD_TAGS,
  WOS_BOOLEAN_OPERATORS,
  WOS_RESERVED_WORDS,
  parseFieldTags,
  getFieldTagSuggestions,
  isInsideQuotes,
  getFieldTagAtPosition
} from '../../src/renderer/utils/wosFieldTags'

test.describe('wosFieldTags', () => {
  test.describe('Field Tags Data', () => {
    test('should have common field tags defined', () => {
      const codes = WOS_FIELD_TAGS.map((tag) => tag.code)
      expect(codes).toContain('TS')
      expect(codes).toContain('AU')
      expect(codes).toContain('TI')
      expect(codes).toContain('SO')
      expect(codes).toContain('WC')
      expect(codes).toContain('PY')
      expect(codes).toContain('DO')
      expect(codes).toContain('ALL')
      expect(codes).toContain('PMID')
    })

    test('should have descriptions for all field tags', () => {
      WOS_FIELD_TAGS.forEach((tag) => {
        expect(tag.description.length).toBeGreaterThan(0)
        expect(tag.label.length).toBeGreaterThan(0)
      })
    })

    test('should include boolean operators', () => {
      expect(WOS_BOOLEAN_OPERATORS).toContain('AND')
      expect(WOS_BOOLEAN_OPERATORS).toContain('OR')
      expect(WOS_BOOLEAN_OPERATORS).toContain('NOT')
    })

    test('should include reserved words', () => {
      expect(WOS_RESERVED_WORDS).toContain('AND')
      expect(WOS_RESERVED_WORDS).toContain('OR')
      expect(WOS_RESERVED_WORDS).toContain('NOT')
      expect(WOS_RESERVED_WORDS).toContain('NEAR')
      expect(WOS_RESERVED_WORDS).toContain('SAME')
    })
  })

  test.describe('parseFieldTags', () => {
    test('should parse simple field tag', () => {
      const result = parseFieldTags('TS=(cancer)')
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('TS')
      expect(result[0].start).toBe(0)
      expect(result[0].end).toBe(3) // 'TS='
    })

    test('should parse multiple field tags', () => {
      const result = parseFieldTags('TS=(cancer) AND AU=(smith)')
      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('TS')
      expect(result[1].code).toBe('AU')
    })

    test('should not parse field tags inside quotes', () => {
      const result = parseFieldTags('TS=("AU=test")')
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('TS')
    })

    test('should handle single quotes', () => {
      const result = parseFieldTags("TS=('AU=test')")
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('TS')
    })

    test('should parse field tags in complex query', () => {
      const result = parseFieldTags('TS=(cancer OR tumor) AND AU=(smith) OR WC=(oncology)')
      expect(result).toHaveLength(3)
      expect(result.map((r) => r.code)).toEqual(['TS', 'AU', 'WC'])
    })

    test('should handle documented 2-5 character field tags', () => {
      const result1 = parseFieldTags('T=(test)')
      expect(result1).toHaveLength(0) // T is not a valid 2+ char tag

      const result2 = parseFieldTags('TI=(test)')
      expect(result2).toHaveLength(1)
      expect(result2[0].code).toBe('TI')

      const result3 = parseFieldTags('PMID=(1234567)')
      expect(result3).toHaveLength(1)
      expect(result3[0].code).toBe('PMID')

      const result4 = parseFieldTags('TST=(test)')
      expect(result4).toHaveLength(0) // TST is not a documented tag
    })

    test('should ignore invalid field tags', () => {
      const result = parseFieldTags('TS=(cancer) AND XX=(invalid) OR AU=(smith)')
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.code)).toEqual(['TS', 'AU'])
    })

    test('should handle escaped quotes', () => {
      const result = parseFieldTags('TS=("cancer\\"test") AND AU=(smith)')
      // The escaped quote should not close the quote context
      expect(result.length).toBeGreaterThan(0)
    })

    test('should parse field tags at different positions', () => {
      const result = parseFieldTags('AU=(smith) TS=(cancer)')
      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('AU')
      expect(result[1].code).toBe('TS')
    })

    test('should handle empty query', () => {
      const result = parseFieldTags('')
      expect(result).toHaveLength(0)
    })

    test('should handle query with only field tags', () => {
      const result = parseFieldTags('TS= AU= WC=')
      expect(result).toHaveLength(3)
    })
  })

  test.describe('getFieldTagSuggestions', () => {
    test('should suggest field tags starting with letter', () => {
      const result = getFieldTagSuggestions('T', 1)
      expect(result.length).toBeGreaterThan(0)
      result.forEach((tag) => {
        expect(tag.code.startsWith('T')).toBe(true)
      })
    })

    test('should filter suggestions by code prefix', () => {
      const result = getFieldTagSuggestions('TS', 2)
      expect(result.length).toBeGreaterThan(0)
      result.forEach((tag) => {
        expect(tag.code.startsWith('TS')).toBe(true)
      })
    })

    test('should return empty for non-matching prefix', () => {
      const result = getFieldTagSuggestions('XYZ', 3)
      expect(result).toHaveLength(0)
    })

    test('should work mid-query after space', () => {
      const query = 'TS=(cancer) AND A'
      const result = getFieldTagSuggestions(query, query.length)
      expect(result.length).toBeGreaterThan(0)
      result.forEach((tag) => {
        expect(tag.code.startsWith('A') || tag.label.toUpperCase().startsWith('A')).toBe(true)
      })
    })

    test('should handle lowercase input', () => {
      const result = getFieldTagSuggestions('ts', 2)
      expect(result.length).toBeGreaterThan(0)
      // Tags are stored in uppercase
      result.forEach((tag) => {
        expect(tag.code[0]).toBe('T')
      })
    })

    test('should return empty for empty prefix', () => {
      const result = getFieldTagSuggestions('TS=(cancer)', 10)
      expect(result).toHaveLength(0)
    })
  })

  test.describe('isInsideQuotes', () => {
    test('should detect position inside double quotes', () => {
      const result = isInsideQuotes('TS=("cancer")', 5)
      expect(result).toBe(true)
    })

    test('should detect position outside double quotes', () => {
      const result = isInsideQuotes('TS=("cancer") AND', 12)
      expect(result).toBe(false)
    })

    test('should handle single quotes', () => {
      const result1 = isInsideQuotes("TS=('cancer')", 5)
      expect(result1).toBe(true)

      const result2 = isInsideQuotes("TS=('cancer') AND", 12)
      expect(result2).toBe(false)
    })

    test('should handle multiple quoted sections', () => {
      const query = 'TS=("cancer") AND AU=("smith")'
      expect(isInsideQuotes(query, 5)).toBe(true)
      expect(isInsideQuotes(query, 12)).toBe(false)
      expect(isInsideQuotes(query, 27)).toBe(true)
    })

    test('should handle nested quotes of different types', () => {
      const query = 'TS=("cancer\'s" OR "tumor")'
      expect(isInsideQuotes(query, 5)).toBe(true)
      expect(isInsideQuotes(query, 8)).toBe(true)
      expect(isInsideQuotes(query, 14)).toBe(false)
      expect(isInsideQuotes(query, 20)).toBe(true)
    })

    test('should return false for position at end', () => {
      const result = isInsideQuotes('TS=("cancer")', 13)
      expect(result).toBe(false)
    })

    test('should handle empty query', () => {
      const result = isInsideQuotes('', 0)
      expect(result).toBe(false)
    })

    test('should handle unclosed quote', () => {
      const result = isInsideQuotes('TS=("cancer', 5)
      expect(result).toBe(true)
    })
  })

  test.describe('getFieldTagAtPosition', () => {
    test('should return field tag at position', () => {
      const result = getFieldTagAtPosition('TS=(cancer)', 1)
      expect(result).not.toBeNull()
      expect(result?.code).toBe('TS')
    })

    test('should return null outside field tags', () => {
      const result = getFieldTagAtPosition('TS=(cancer)', 5)
      expect(result).toBeNull()
    })

    test('should return correct tag in multi-tag query', () => {
      const result1 = getFieldTagAtPosition('TS=(cancer) AND AU=(smith)', 1)
      expect(result1?.code).toBe('TS')

      const result2 = getFieldTagAtPosition('TS=(cancer) AND AU=(smith)', 18)
      expect(result2?.code).toBe('AU')
    })

    test('should return null for invalid tag positions', () => {
      const result = getFieldTagAtPosition('TS=(cancer) AND XY=(test)', 18)
      expect(result).toBeNull()
    })

    test('should handle end of tag', () => {
      const result = getFieldTagAtPosition('TS=', 2)
      expect(result?.code).toBe('TS')
    })
  })

  test.describe('Integration scenarios', () => {
    test('should handle typical WOS query', () => {
      const query = 'TS=(cancer AND treatment) AND AU=(smith OR jones) AND PY=(2020-2023)'
      const tags = parseFieldTags(query)
      expect(tags.map((t) => t.code)).toEqual(['TS', 'AU', 'PY'])
    })

    test('should handle query with quoted phrases', () => {
      const query =
        'TS=("cancer treatment" OR "tumor therapy") AND AU=("John Smith") AND SO=(Nature)'
      const tags = parseFieldTags(query)
      expect(tags.length).toBe(3)
      expect(tags.map((t) => t.code)).toEqual(['TS', 'AU', 'SO'])
    })

    test('should provide suggestions at different query stages', () => {
      let suggestions = getFieldTagSuggestions('', 0)
      expect(suggestions).toHaveLength(0)

      suggestions = getFieldTagSuggestions('T', 1)
      expect(suggestions.length).toBeGreaterThan(0)

      const query = 'TS=(cancer) A'
      suggestions = getFieldTagSuggestions(query, query.length)
      expect(suggestions.length).toBeGreaterThan(0)
      suggestions.forEach((s) =>
        expect(s.code.startsWith('A') || s.label.toUpperCase().startsWith('A')).toBe(true)
      )
    })

    test('should correctly identify quote context in complex query', () => {
      const query = 'TS=("TS=test" OR other) AND AU=(test)'
      expect(isInsideQuotes(query, 5)).toBe(true) // inside quotes with TS=
      expect(isInsideQuotes(query, 25)).toBe(false) // after quotes
      expect(isInsideQuotes(query, 35)).toBe(false) // no quotes around AU value
    })
  })
})
