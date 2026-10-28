import { describe, it, expect } from 'vitest'
import {
  loadCodes,
  validateCodes,
  compareCodes,
  codesLanguage,
  CATEGORY_IDS,
  RST_ID
} from './codes.js'

/**
 * Build a minimal valid codes reference; tests break one thing at a time
 */
function validCodes() {
  return {
    categories: [
      {
        id: 'q-codes',
        title: 'Q-codes',
        intro: 'Intro',
        entries: [
          {
            id: 'qrm',
            code: 'QRM',
            origin: 'itu',
            question: 'Is my transmission being interfered with?',
            answer: 'Your transmission has interference.',
            scale: [
              { value: 1, label: 'none' },
              { value: 2, label: 'slight' }
            ]
          }
        ]
      },
      {
        id: 'abbreviations',
        title: 'Abbreviations',
        intro: 'Intro',
        entries: [
          { id: 'ga', code: 'GA', origin: 'amateur', meanings: ['Good afternoon', 'Go ahead'] },
          { id: '5nn', code: '5NN', origin: 'amateur', meanings: ['599'], see: 'rst' }
        ]
      },
      {
        id: 'prosigns',
        title: 'Prosigns',
        intro: 'Intro',
        entries: [
          {
            id: 'sk',
            code: 'SK',
            aliases: ['VA'],
            origin: 'itu',
            meanings: ['End of contact'],
            morse: '...-.-'
          }
        ]
      }
    ],
    rst: {
      id: 'rst',
      title: 'RST',
      intro: 'Intro',
      aliases: ['RST', '59', '599', '5NN'],
      formats: [{ mode: 'Voice', example: '59', description: 'R and S' }],
      scales: [{ id: 'r', name: 'Readability', values: [{ value: 1, label: 'Unreadable' }] }],
      suffixes: [{ letter: 'C', meaning: 'Chirp' }]
    }
  }
}

describe('codes', () => {
  describe('validateCodes', () => {
    it('should accept a valid reference', () => {
      expect(validateCodes(validCodes())).toEqual([])
    })

    it('should reject a reference without categories', () => {
      expect(validateCodes(null)).toEqual(['codes: categories must be an array'])
      expect(validateCodes({})).toEqual(['codes: categories must be an array'])
    })

    it('should reject an unknown category', () => {
      const codes = validCodes()
      codes.categories[0].id = 'c-codes'
      expect(validateCodes(codes)).toContain('c-codes: unknown category')
    })

    it('should reject a category without title or intro', () => {
      const codes = validCodes()
      delete codes.categories[1].intro
      expect(validateCodes(codes)).toContain('abbreviations: title and intro are required')
    })

    it('should reject a category with no entries', () => {
      const codes = validCodes()
      codes.categories[1].entries = []
      expect(validateCodes(codes)).toContain('abbreviations: entries must be a non-empty array')
    })

    it('should reject an id that is not lowercase', () => {
      const codes = validCodes()
      codes.categories[1].entries[0].id = 'GA'
      expect(validateCodes(codes)).toContain('abbreviations/GA: id must be a lowercase string')
    })

    it('should reject an entry without a code', () => {
      const codes = validCodes()
      delete codes.categories[1].entries[0].code
      expect(validateCodes(codes)).toContain('abbreviations/ga: code is required')
    })

    it('should reject an unknown origin', () => {
      const codes = validCodes()
      codes.categories[1].entries[0].origin = 'common'
      expect(validateCodes(codes)).toContain(
        'abbreviations/ga: origin must be one of itu, amateur, slang'
      )
    })

    it('should reject empty aliases', () => {
      const codes = validCodes()
      codes.categories[2].entries[0].aliases = []
      expect(validateCodes(codes)).toContain(
        'prosigns/sk: aliases must be a non-empty list of strings'
      )
    })

    it('should reject a see target other than RST', () => {
      const codes = validCodes()
      codes.categories[1].entries[1].see = 'q-codes'
      expect(validateCodes(codes)).toContain('abbreviations/5nn: see must point to "rst"')
    })

    it('should require an answer for a Q-code', () => {
      const codes = validCodes()
      delete codes.categories[0].entries[0].answer
      expect(validateCodes(codes)).toContain('q-codes/qrm: answer is required')
    })

    it('should allow a Q-code without a question', () => {
      const codes = validCodes()
      delete codes.categories[0].entries[0].question
      expect(validateCodes(codes)).toEqual([])
    })

    it('should reject a scale that is not numbered from 1', () => {
      const codes = validCodes()
      codes.categories[0].entries[0].scale[1].value = 3
      expect(validateCodes(codes)).toContain(
        'q-codes/qrm: scale must be numbered from 1, each step with a label'
      )
    })

    it('should require meanings outside Q-codes', () => {
      const codes = validCodes()
      codes.categories[1].entries[0].meanings = []
      expect(validateCodes(codes)).toContain(
        'abbreviations/ga: meanings must be a non-empty list of strings'
      )
    })

    it('should require a Morse pattern for a prosign', () => {
      const codes = validCodes()
      codes.categories[2].entries[0].morse = '...-x-'
      expect(validateCodes(codes)).toContain(
        'prosigns/sk: morse must be a pattern of dots and dashes'
      )
    })

    it('should reject a duplicate id across categories', () => {
      const codes = validCodes()
      codes.categories[2].entries[0].id = 'ga'
      expect(validateCodes(codes)).toContain('prosigns/ga: duplicate id')
    })

    it('should reject an alias that repeats another entry code, ignoring case', () => {
      const codes = validCodes()
      codes.categories[2].entries[0].aliases = ['ga']
      expect(validateCodes(codes)).toContain('prosigns/sk: code or alias "ga" is used twice')
    })

    it('should allow an RST alias that is also an entry code', () => {
      // 5NN is both an abbreviation and an RST alias
      expect(validateCodes(validCodes())).toEqual([])
    })

    it('should reject a malformed RST section', () => {
      const codes = validCodes()
      codes.rst.scales[0].values = []
      codes.rst.suffixes[0].letter = 'ch'
      expect(validateCodes(codes)).toEqual([
        'rst: each scale needs an id, a name and values numbered from 1',
        'rst: each suffix needs a single capital letter and a meaning'
      ])
    })

    it('should reject a missing RST section', () => {
      const codes = validCodes()
      delete codes.rst
      expect(validateCodes(codes)).toEqual(['rst: must be an object'])
    })
  })

  describe('codesLanguage', () => {
    it('should pick Bulgarian for Bulgarian locales', () => {
      expect(codesLanguage('bg')).toBe('bg')
      expect(codesLanguage('bg-BG')).toBe('bg')
    })

    it('should pick English for anything else', () => {
      expect(codesLanguage('en')).toBe('en')
      expect(codesLanguage('de')).toBe('en')
      expect(codesLanguage(null)).toBe('en')
      expect(codesLanguage(undefined)).toBe('en')
    })
  })

  describe('loadCodes', () => {
    it('should load every category in display order, plus RST', async () => {
      const codes = await loadCodes('en')
      expect(codes.categories.map((c) => c.id)).toEqual(CATEGORY_IDS)
      expect(codes.rst.id).toBe(RST_ID)
    })

    it('should load the Bulgarian files for a Bulgarian locale', async () => {
      const codes = await loadCodes('bg')
      expect(codes.categories.map((c) => c.id)).toEqual(CATEGORY_IDS)
      expect(codes.categories[0].title).toBe('Q-кодове')
    })

    it('should fall back to English without a locale', async () => {
      expect(await loadCodes()).toBe(await loadCodes('en'))
    })

    it('should return the cached reference on later calls', async () => {
      expect(await loadCodes('en')).toBe(await loadCodes('en'))
      expect(await loadCodes('bg')).toBe(await loadCodes('bg'))
      expect(await loadCodes('bg')).not.toBe(await loadCodes('en'))
    })
  })

  describe('compareCodes', () => {
    it('should accept a translation that changes only text', () => {
      const translation = validCodes()
      translation.categories[0].title = 'Q-кодове'
      translation.categories[0].entries[0].answer = 'Превод'
      translation.categories[1].entries[0].meanings = ['Добър следобед']
      translation.rst.scales[0].name = 'Разбираемост'
      expect(compareCodes(validCodes(), translation)).toEqual([])
    })

    it('should report entries in a different order', () => {
      const translation = validCodes()
      translation.categories[1].entries.reverse()
      expect(compareCodes(validCodes(), translation)).toEqual([
        'abbreviations: entry ids or order differ'
      ])
    })

    it('should report a changed code, alias, origin or see target', () => {
      const translation = validCodes()
      const [ga, fiveNn] = translation.categories[1].entries
      ga.code = 'GE'
      ga.aliases = ['GAA']
      ga.origin = 'itu'
      delete fiveNn.see
      expect(compareCodes(validCodes(), translation)).toEqual([
        'abbreviations/ga: code differs',
        'abbreviations/ga: aliases differs',
        'abbreviations/ga: origin differs',
        'abbreviations/5nn: see differs'
      ])
    })

    it('should report an optional field present in one language only', () => {
      const translation = validCodes()
      translation.categories[0].entries[0].usage = 'Само на български'
      expect(compareCodes(validCodes(), translation)).toEqual([
        'q-codes/qrm: usage is in one language only'
      ])
    })

    it('should report different scale values', () => {
      const translation = validCodes()
      translation.categories[0].entries[0].scale.pop()
      expect(compareCodes(validCodes(), translation)).toEqual(['q-codes/qrm: scale values differ'])
    })

    it('should report RST differences that searches and layout rely on', () => {
      const translation = validCodes()
      translation.rst.aliases = ['RST']
      translation.rst.suffixes = []
      expect(compareCodes(validCodes(), translation)).toEqual([
        'rst: aliases differ',
        'rst: suffix letters differ'
      ])
    })
  })

  describe('shipped data', () => {
    it.each(['en', 'bg'])('should pass validation (%s)', async (locale) => {
      expect(validateCodes(await loadCodes(locale))).toEqual([])
    })

    it('should translate only the text in the Bulgarian data', async () => {
      expect(compareCodes(await loadCodes('en'), await loadCodes('bg'))).toEqual([])
    })
  })
})
