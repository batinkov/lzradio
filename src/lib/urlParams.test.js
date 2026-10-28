import { describe, it, expect } from 'vitest'
import {
  parseClassNumber,
  parseQuestionOrder,
  parseSections,
  parseExamParams,
  parseCodesParams,
  buildCodesLocation,
  isValidClass,
  isValidSection,
  QUESTION_ORDER,
  DEFAULT_PARAMS
} from './urlParams.js'

describe('urlParams', () => {
  describe('parseClassNumber', () => {
    it('should return "1" for class1 paths', () => {
      expect(parseClassNumber('/exam/class1')).toBe('1')
      expect(parseClassNumber('/exam/class1/prep')).toBe('1')
      expect(parseClassNumber('/exam/class1/simulated')).toBe('1')
    })

    it('should return "2" for class2 paths', () => {
      expect(parseClassNumber('/exam/class2')).toBe('2')
      expect(parseClassNumber('/exam/class2/prep')).toBe('2')
      expect(parseClassNumber('/exam/class2/simulated')).toBe('2')
    })

    it('should default to "1" for ambiguous paths', () => {
      expect(parseClassNumber('/exam')).toBe('1')
      expect(parseClassNumber('/other')).toBe('1')
      expect(parseClassNumber('')).toBe('1')
    })

    it('should handle invalid input gracefully', () => {
      expect(parseClassNumber(null)).toBe('1')
      expect(parseClassNumber(undefined)).toBe('1')
      expect(parseClassNumber(123)).toBe('1')
    })
  })

  describe('parseQuestionOrder', () => {
    it('should return "random" for random parameter', () => {
      expect(parseQuestionOrder('random')).toBe('random')
    })

    it('should return "sequential" for sequential parameter', () => {
      expect(parseQuestionOrder('sequential')).toBe('sequential')
    })

    it('should default to "sequential" for missing parameter', () => {
      expect(parseQuestionOrder(null)).toBe('sequential')
      expect(parseQuestionOrder(undefined)).toBe('sequential')
    })

    it('should default to "sequential" for invalid values', () => {
      expect(parseQuestionOrder('invalid')).toBe('sequential')
      expect(parseQuestionOrder('')).toBe('sequential')
      expect(parseQuestionOrder('RANDOM')).toBe('sequential')
    })
  })

  describe('parseSections', () => {
    it('should parse comma-separated section numbers', () => {
      expect(parseSections('1,2,3')).toEqual([1, 2, 3])
      expect(parseSections('1,2')).toEqual([1, 2])
      expect(parseSections('3')).toEqual([3])
    })

    it('should handle sections in different order', () => {
      expect(parseSections('3,1,2')).toEqual([3, 1, 2])
      expect(parseSections('2,3')).toEqual([2, 3])
    })

    it('should filter out invalid section numbers', () => {
      expect(parseSections('1,4,2')).toEqual([1, 2])
      expect(parseSections('0,1,2,5')).toEqual([1, 2])
      expect(parseSections('999')).toEqual([1, 2, 3]) // defaults when no valid
    })

    it('should handle whitespace', () => {
      expect(parseSections('1, 2, 3')).toEqual([1, 2, 3])
      expect(parseSections(' 1 , 2 ')).toEqual([1, 2])
    })

    it('should remove duplicates', () => {
      expect(parseSections('1,1,2')).toEqual([1, 2])
      expect(parseSections('2,2,2')).toEqual([2])
      expect(parseSections('1,2,1,3,2')).toEqual([1, 2, 3])
    })

    it('should default to [1,2,3] for missing parameter', () => {
      expect(parseSections(null)).toEqual([1, 2, 3])
      expect(parseSections(undefined)).toEqual([1, 2, 3])
      expect(parseSections('')).toEqual([1, 2, 3])
    })

    it('should handle invalid input gracefully', () => {
      expect(parseSections('abc')).toEqual([1, 2, 3])
      expect(parseSections('1,abc,2')).toEqual([1, 2])
      expect(parseSections(',,,')).toEqual([1, 2, 3])
    })

    it('should handle edge cases', () => {
      expect(parseSections('1,')).toEqual([1])
      expect(parseSections(',1')).toEqual([1])
      expect(parseSections('1,,2')).toEqual([1, 2])
    })
  })

  describe('parseExamParams', () => {
    it('should parse all parameters correctly', () => {
      const result = parseExamParams('/exam/class2/prep', 'order=random&categories=1,3')

      expect(result).toEqual({
        classNum: '2',
        questionOrder: 'random',
        sections: [1, 3]
      })
    })

    it('should use defaults for missing parameters', () => {
      const result = parseExamParams('/exam/class1/prep', '')

      expect(result).toEqual({
        classNum: '1',
        questionOrder: 'sequential',
        sections: [1, 2, 3]
      })
    })

    it('should handle partial parameters', () => {
      const result = parseExamParams('/exam/class2/simulated', 'order=random')

      expect(result).toEqual({
        classNum: '2',
        questionOrder: 'random',
        sections: [1, 2, 3]
      })
    })

    it('should handle URL-encoded parameters', () => {
      const result = parseExamParams('/exam/class1/prep', 'categories=1%2C2%2C3')

      expect(result.sections).toEqual([1, 2, 3])
    })

    it('should handle complex query strings', () => {
      const result = parseExamParams(
        '/exam/class1/prep',
        'order=random&categories=2,3&unused=value'
      )

      expect(result).toEqual({
        classNum: '1',
        questionOrder: 'random',
        sections: [2, 3]
      })
    })
  })

  describe('parseCodesParams', () => {
    it('should return the search query', () => {
      expect(parseCodesParams('q=qth')).toEqual({ query: 'qth' })
    })

    it('should return an empty query when q is missing', () => {
      expect(parseCodesParams('')).toEqual({ query: '' })
      expect(parseCodesParams('order=random')).toEqual({ query: '' })
    })

    it('should return an empty query when q is empty or whitespace', () => {
      expect(parseCodesParams('q=')).toEqual({ query: '' })
      expect(parseCodesParams('q=%20%20')).toEqual({ query: '' })
    })

    it('should trim the query', () => {
      expect(parseCodesParams('q=%20qth%20')).toEqual({ query: 'qth' })
    })

    it('should decode URL-encoded values', () => {
      expect(parseCodesParams('q=qrm%3F')).toEqual({ query: 'qrm?' })
      expect(parseCodesParams('q=end%20of%20contact')).toEqual({ query: 'end of contact' })
      expect(parseCodesParams('q=end+of+contact')).toEqual({ query: 'end of contact' })
      expect(parseCodesParams('q=%D0%BC%D1%8F%D1%81%D1%82%D0%BE')).toEqual({ query: 'място' })
    })
  })

  describe('buildCodesLocation', () => {
    it('should put the query in q', () => {
      expect(buildCodesLocation('qth')).toBe('/codes?q=qth')
    })

    it('should drop q for a blank query', () => {
      expect(buildCodesLocation('')).toBe('/codes')
      expect(buildCodesLocation('   ')).toBe('/codes')
      expect(buildCodesLocation(undefined)).toBe('/codes')
    })

    it('should trim and encode the query', () => {
      expect(buildCodesLocation(' qrm? ')).toBe('/codes?q=qrm%3F')
      expect(buildCodesLocation('a&b=c')).toBe('/codes?q=a%26b%3Dc')
    })

    it('should round-trip through parseCodesParams', () => {
      for (const query of ['qth', 'qrm?', 'end of contact', 'място', 'a&b=c#d']) {
        const querystring = buildCodesLocation(query).split('?')[1]
        expect(parseCodesParams(querystring).query).toBe(query)
      }
    })
  })

  describe('isValidClass', () => {
    it('should return true for valid classes', () => {
      expect(isValidClass(1)).toBe(true)
      expect(isValidClass(2)).toBe(true)
      expect(isValidClass('1')).toBe(true)
      expect(isValidClass('2')).toBe(true)
    })

    it('should return false for invalid classes', () => {
      expect(isValidClass(0)).toBe(false)
      expect(isValidClass(3)).toBe(false)
      expect(isValidClass('3')).toBe(false)
      expect(isValidClass(-1)).toBe(false)
    })

    it('should handle invalid input', () => {
      expect(isValidClass('abc')).toBe(false)
      expect(isValidClass(null)).toBe(false)
      expect(isValidClass(undefined)).toBe(false)
    })
  })

  describe('isValidSection', () => {
    it('should return true for valid sections', () => {
      expect(isValidSection(1)).toBe(true)
      expect(isValidSection(2)).toBe(true)
      expect(isValidSection(3)).toBe(true)
    })

    it('should return false for invalid sections', () => {
      expect(isValidSection(0)).toBe(false)
      expect(isValidSection(4)).toBe(false)
      expect(isValidSection(-1)).toBe(false)
    })

    it('should handle invalid input', () => {
      expect(isValidSection('1')).toBe(false) // string, not number
      expect(isValidSection(null)).toBe(false)
      expect(isValidSection(undefined)).toBe(false)
    })
  })

  describe('constants', () => {
    it('should export QUESTION_ORDER constants', () => {
      expect(QUESTION_ORDER.SEQUENTIAL).toBe('sequential')
      expect(QUESTION_ORDER.RANDOM).toBe('random')
    })

    it('should export DEFAULT_PARAMS', () => {
      expect(DEFAULT_PARAMS).toEqual({
        classNum: '1',
        questionOrder: 'sequential',
        sections: [1, 2, 3]
      })
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical class1 prep URL', () => {
      const result = parseExamParams('/exam/class1/prep', 'order=sequential&categories=1,2,3')

      expect(result).toEqual({
        classNum: '1',
        questionOrder: 'sequential',
        sections: [1, 2, 3]
      })
    })

    it('should handle class2 with random order and subset of sections', () => {
      const result = parseExamParams('/exam/class2/prep', 'order=random&categories=2')

      expect(result).toEqual({
        classNum: '2',
        questionOrder: 'random',
        sections: [2]
      })
    })

    it('should gracefully handle malformed URLs', () => {
      const result = parseExamParams('', 'order=invalid&categories=99,100')

      expect(result).toEqual({
        classNum: '1',
        questionOrder: 'sequential',
        sections: [1, 2, 3]
      })
    })

    it('should handle empty query string', () => {
      const result = parseExamParams('/exam/class1/prep', '')

      expect(result).toEqual({
        classNum: '1',
        questionOrder: 'sequential',
        sections: [1, 2, 3]
      })
    })
  })
})
