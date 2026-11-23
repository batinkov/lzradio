import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import {
  validateQuestionBank,
  compareQuestionBanks,
  checkQuestionImages,
  syllabusDates,
  SECTION_FILES
} from './questionBank.js'

const LANGS = ['en', 'bg']
const ROOT = new URL('../../', import.meta.url)

/**
 * Build a minimal valid section; tests break one thing at a time
 */
function validBank(lang) {
  const en = lang === 'en'
  const [a, b, c, d] = en ? ['A', 'B', 'C', 'D'] : ['А', 'Б', 'В', 'Г']
  return {
    class: en ? 'Amateur Radio Class 1' : 'Радиолюбителски клас 1',
    section: en ? 'Section 1' : 'Раздел 1',
    update: en ? 'Updated syllabus 11.08.2025' : 'Актуализиран конспект 11.08.2025 г.',
    questions: [
      {
        question_number: 1,
        question_body: en
          ? 'What is the time constant $\\tau$?'
          : 'Колко е времеконстантата $\\tau$?',
        correct_answer: c,
        choices: [
          { key: a, text: '$\\tau = \\dfrac{R}{C}$' },
          { key: b, text: en ? '$\\tau = 0.5 RC$' : '$\\tau = 0{,}5 RC$' },
          { key: c, text: '$\\tau = RC$' },
          { key: d, text: en ? '100 µF and 2 MΩ' : '100 µF и 2 MΩ' }
        ]
      },
      {
        question_number: 3,
        question_body: en ? 'Which symbol is a resistor?' : 'Кой символ е резистор?',
        image: 'Class1_Section1_3.png',
        correct_answer: a,
        choices: [a, b, c, d].map((key) => ({ key, text: '' }))
      }
    ]
  }
}

function readBank(lang, section) {
  const path = `data_${lang}/exam/${section}.json`
  try {
    return JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'))
  } catch (error) {
    throw new Error(`${path}: ${error.message}`, { cause: error })
  }
}

describe('questionBank', () => {
  describe('validateQuestionBank', () => {
    it.each(LANGS)('should accept a valid bank (%s)', (lang) => {
      expect(validateQuestionBank(validBank(lang), lang)).toEqual([])
    })

    it('should reject an unknown language', () => {
      expect(validateQuestionBank(validBank('en'), 'de')).toEqual(['unknown language "de"'])
    })

    it('should reject a bank without questions', () => {
      expect(validateQuestionBank({}, 'en')).toEqual(['questions must be an array'])
    })

    it('should require class, section and update', () => {
      const bank = validBank('en')
      delete bank.class
      bank.update = ' '
      expect(validateQuestionBank(bank, 'en')).toEqual(['class is required', 'update is required'])
    })

    it('should allow gaps in question numbers', () => {
      const bank = validBank('en')
      bank.questions[1].question_number = 30
      expect(validateQuestionBank(bank, 'en')).toEqual([])
    })

    it('should reject duplicate or decreasing question numbers', () => {
      const bank = validBank('en')
      bank.questions[1].question_number = 1
      expect(validateQuestionBank(bank, 'en')).toEqual([
        'Q1: question_number must be an integer above 1'
      ])
    })

    it('should require a question body', () => {
      const bank = validBank('en')
      bank.questions[0].question_body = ''
      expect(validateQuestionBank(bank, 'en')).toEqual(['Q1: question_body is required'])
    })

    it('should reject too few or too many choices', () => {
      const bank = validBank('en')
      bank.questions[0].choices.pop()
      bank.questions[1].choices.push({ key: 'E', text: '' })
      expect(validateQuestionBank(bank, 'en')).toEqual([
        'Q1: must have 4 choices',
        'Q3: must have 4 choices'
      ])
    })

    it('should reject keys out of order', () => {
      const bank = validBank('en')
      bank.questions[0].choices.reverse()
      expect(validateQuestionBank(bank, 'en')).toEqual(['Q1: choice keys must be A, B, C, D'])
    })

    it('should reject Latin keys in Bulgarian', () => {
      const bank = validBank('bg')
      bank.questions[0].choices[0].key = 'A'
      bank.questions[0].correct_answer = 'A'
      expect(validateQuestionBank(bank, 'bg')).toEqual(['Q1: choice keys must be А, Б, В, Г'])
    })

    it('should reject a correct answer that is not a key', () => {
      const bank = validBank('bg')
      bank.questions[0].correct_answer = 'C'
      expect(validateQuestionBank(bank, 'bg')).toEqual([
        'Q1: correct_answer "C" is not a choice key'
      ])
    })

    it('should allow empty choice text only with an image', () => {
      const bank = validBank('en')
      bank.questions[0].choices[1].text = ''
      delete bank.questions[1].image
      const errors = validateQuestionBank(bank, 'en')
      expect(errors).toContain('Q1 choice B: text may be empty only when the question has an image')
      expect(errors).toHaveLength(5)
    })

    it('should reject an empty image name', () => {
      const bank = validBank('en')
      bank.questions[1].image = ''
      const errors = validateQuestionBank(bank, 'en')
      expect(errors[0]).toBe('Q3: image must be a file name')
    })

    it('should reject an unbalanced formula', () => {
      const bank = validBank('en')
      bank.questions[0].choices[0].text = '$\\tau = RC'
      expect(validateQuestionBank(bank, 'en')).toEqual(['Q1 choice A: unbalanced $ in formula'])
    })

    it('should reject a Greek letter outside a formula', () => {
      const bank = validBank('bg')
      bank.questions[0].question_body = 'Какво означава параметърът β?'
      bank.questions[0].choices[3].text = '100 μF' // Greek mu, not the micro sign
      expect(validateQuestionBank(bank, 'bg')).toEqual([
        'Q1 body: Greek letter outside a formula',
        'Q1 choice Г: Greek letter outside a formula'
      ])
    })

    it('should reject Cyrillic letters in English', () => {
      const bank = validBank('en')
      bank.questions[0].question_body = 'Emission class А1А' // Cyrillic А
      bank.section = 'Раздел 1'
      expect(validateQuestionBank(bank, 'en')).toEqual([
        'section: Cyrillic letter in English text',
        'Q1 body: Cyrillic letter in English text'
      ])
    })

    it('should reject Bulgarian words that mix Cyrillic and Latin', () => {
      const bank = validBank('bg')
      bank.questions[0].question_body = 'Какво е СЕРТ и кодът QRPР?' // СЕРТ is all Cyrillic
      bank.questions[0].choices[0].text = 'Клас А1А' // Cyrillic А around a Latin-looking code
      expect(validateQuestionBank(bank, 'bg')).toEqual([
        'Q1 body: word "QRPР" mixes Cyrillic and Latin letters'
      ])
    })

    it('should reject a Cyrillic letter in a unit symbol', () => {
      const bank = validBank('bg')
      bank.questions[0].choices[3].text = '100 µF и 2 МΩ' // Cyrillic М
      expect(validateQuestionBank(bank, 'bg')).toEqual([
        'Q1 choice Г: word "МΩ" mixes Cyrillic and Latin letters'
      ])
    })

    it('should allow Latin codes and Cyrillic words side by side in Bulgarian', () => {
      const bank = validBank('bg')
      bank.questions[0].question_body = 'Радиостанция LZ75HAM на 145,550 MHz, клас A1A'
      expect(validateQuestionBank(bank, 'bg')).toEqual([])
    })
  })

  describe('compareQuestionBanks', () => {
    it('should accept banks that differ only in text', () => {
      expect(compareQuestionBanks(validBank('en'), validBank('bg'))).toEqual([])
    })

    it('should report different question numbers', () => {
      const bg = validBank('bg')
      bg.questions[1].question_number = 4
      expect(compareQuestionBanks(validBank('en'), bg)).toEqual([
        'question numbers or order differ'
      ])
    })

    it('should report a different correct answer', () => {
      const bg = validBank('bg')
      bg.questions[0].correct_answer = 'А'
      expect(compareQuestionBanks(validBank('en'), bg)).toEqual([
        'Q1: correct answer differs (en C, bg А)'
      ])
    })

    it('should report a different number of choices or image', () => {
      const bg = validBank('bg')
      bg.questions[0].choices.pop()
      bg.questions[1].image = 'other.png'
      expect(compareQuestionBanks(validBank('en'), bg)).toEqual([
        'Q1: number of choices differs',
        'Q3: image differs'
      ])
    })

    it('should report different formulas', () => {
      const bg = validBank('bg')
      bg.questions[0].choices[0].text = '$\\tau = R/C$'
      bg.questions[0].question_body = 'Колко е времеконстантата?'
      expect(compareQuestionBanks(validBank('en'), bg)).toEqual([
        'Q1 body: formulas differ',
        'Q1 choice A: formulas differ'
      ])
    })
  })

  describe('checkQuestionImages', () => {
    it('should accept matching images and ignore hidden files', () => {
      const files = ['Class1_Section1_3.png', '.gitkeep']
      expect(checkQuestionImages([validBank('en')], files)).toEqual([])
    })

    it('should report a missing image', () => {
      expect(checkQuestionImages([validBank('en')], [])).toEqual([
        'Class1_Section1_3.png: file missing'
      ])
    })

    it('should report an image no question uses', () => {
      const files = ['Class1_Section1_3.png', 'Class1_Section1_4.png']
      expect(checkQuestionImages([validBank('en')], files)).toEqual([
        'Class1_Section1_4.png: not used by any question'
      ])
    })
  })

  describe('syllabusDates', () => {
    it('should return each date once', () => {
      const banks = [validBank('en'), validBank('bg')]
      expect(syllabusDates(banks)).toEqual(['11.08.2025'])
    })

    it('should sort several dates oldest first', () => {
      const banks = [
        { update: 'Updated syllabus 01.03.2026' },
        { update: 'Updated syllabus 11.08.2025' },
        { update: 'Updated syllabus 20.12.2025' }
      ]
      expect(syllabusDates(banks)).toEqual(['11.08.2025', '20.12.2025', '01.03.2026'])
    })

    it('should skip banks without a date', () => {
      expect(syllabusDates([{ update: 'Updated syllabus' }, {}, null])).toEqual([])
    })
  })

  describe('shipped data', () => {
    const files = LANGS.flatMap((lang) => SECTION_FILES.map((section) => [lang, section]))

    it.each(files)('should be valid JSON (data_%s/exam/%s.json)', (lang, section) => {
      expect(() => readBank(lang, section)).not.toThrow()
    })

    it.each(files)('should pass validation (data_%s/exam/%s.json)', (lang, section) => {
      expect(validateQuestionBank(readBank(lang, section), lang)).toEqual([])
    })

    it.each(SECTION_FILES)('should match English in Bulgarian (%s)', (section) => {
      expect(compareQuestionBanks(readBank('en', section), readBank('bg', section))).toEqual([])
    })

    it('should have the same syllabus dates in both languages', () => {
      const dates = LANGS.map((lang) =>
        syllabusDates(SECTION_FILES.map((section) => readBank(lang, section)))
      )
      expect(dates[0]).not.toEqual([])
      expect(dates[1]).toEqual(dates[0])
    })

    it.each(LANGS)('should have exactly the images the questions use (%s)', (lang) => {
      const banks = SECTION_FILES.map((section) => readBank(lang, section))
      const folder = readdirSync(new URL(`public/images/questions/${lang}/`, ROOT))
      expect(checkQuestionImages(banks, folder)).toEqual([])
    })
  })
})
