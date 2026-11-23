/**
 * Exam Question Bank Checks
 *
 * Validates the exam question banks in data_en/exam/ and data_bg/exam/ and
 * compares the two languages. The banks are extracted by hand from the official
 * PDF, so these checks catch what that process tends to break: invalid fields,
 * Cyrillic letters that look Latin (and the reverse), an answer changed in one
 * language only, or an image that is missing or no longer used.
 *
 * Every function is pure and returns a list of error messages, empty when the
 * data is valid. Reading the files is left to the caller.
 */

/**
 * Section file names, without the .json extension
 */
export const SECTION_FILES = [
  'Class1_Section1',
  'Class1_Section2',
  'Class1_Section3',
  'Class2_Section1',
  'Class2_Section2',
  'Class2_Section3'
]

/**
 * Answer keys in order, per language. Bulgarian uses Cyrillic letters.
 */
export const ANSWER_KEYS = {
  en: ['A', 'B', 'C', 'D'],
  bg: ['А', 'Б', 'В', 'Г']
}

const MATH = /\$[^$]*\$/g
const CYRILLIC = /\p{Script=Cyrillic}/u
// Unit symbols count as Latin, so that a Cyrillic М in МΩ is caught
const LATIN = /[\p{Script=Latin}Ωµ]/u
// Greek letters belong inside $…$ formulas; Ω is allowed as the ohm unit
const GREEK_OUTSIDE_MATH = /[\u0370-\u03A8\u03AA-\u03FF]/u

function isText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * Formulas in a text, with the Bulgarian decimal comma `{,}` written as a point
 * so that both languages compare equal
 * @param {string} text - Question or choice text
 * @returns {string[]} Formulas in order of appearance
 */
function formulas(text) {
  return (text.match(MATH) ?? []).map((formula) => formula.replaceAll('{,}', '.'))
}

/**
 * Check the characters of one text
 * @param {string} text - Question or choice text
 * @param {'en'|'bg'} lang - Language of the bank
 * @param {string} where - Prefix for error messages
 * @returns {string[]} Error messages
 */
function validateText(text, lang, where) {
  const errors = []
  const dollars = text.split('$').length - 1
  if (dollars % 2 !== 0) {
    errors.push(`${where}: unbalanced $ in formula`)
  }

  const prose = text.replace(MATH, ' ')
  if (GREEK_OUTSIDE_MATH.test(prose)) {
    errors.push(`${where}: Greek letter outside a formula`)
  }
  if (lang === 'en' && CYRILLIC.test(text)) {
    errors.push(`${where}: Cyrillic letter in English text`)
  }
  if (lang === 'bg') {
    for (const word of prose.match(/[\p{L}\p{N}]+/gu) ?? []) {
      if (CYRILLIC.test(word) && LATIN.test(word)) {
        errors.push(`${where}: word "${word}" mixes Cyrillic and Latin letters`)
      }
    }
  }
  return errors
}

/**
 * Validate one question
 * @param {Object} question - Question from a bank
 * @param {'en'|'bg'} lang - Language of the bank
 * @param {string} where - Prefix for error messages
 * @returns {string[]} Error messages
 */
function validateQuestion(question, lang, where) {
  const errors = []

  if (!isText(question.question_body)) {
    errors.push(`${where}: question_body is required`)
  } else {
    errors.push(...validateText(question.question_body, lang, `${where} body`))
  }

  if ('image' in question && !isText(question.image)) {
    errors.push(`${where}: image must be a file name`)
  }

  const choices = question.choices
  const keys = ANSWER_KEYS[lang]
  if (!Array.isArray(choices) || choices.length !== keys.length) {
    errors.push(`${where}: must have ${keys.length} choices`)
    return errors
  }

  if (choices.some((choice, i) => choice?.key !== keys[i])) {
    errors.push(`${where}: choice keys must be ${keys.join(', ')}`)
  }
  if (!choices.some((choice) => choice?.key === question.correct_answer)) {
    errors.push(`${where}: correct_answer "${question.correct_answer}" is not a choice key`)
  }

  for (const choice of choices) {
    const choiceWhere = `${where} choice ${choice?.key}`
    if (typeof choice?.text !== 'string') {
      errors.push(`${choiceWhere}: text is required`)
    } else if (choice.text.trim() === '') {
      if (!question.image) {
        errors.push(`${choiceWhere}: text may be empty only when the question has an image`)
      }
    } else {
      errors.push(...validateText(choice.text, lang, choiceWhere))
    }
  }

  return errors
}

/**
 * Validate one question bank (one section in one language)
 * @param {Object} bank - Parsed section file
 * @param {'en'|'bg'} lang - Language of the bank
 * @returns {string[]} Error messages, empty if the bank is valid
 */
export function validateQuestionBank(bank, lang) {
  if (!ANSWER_KEYS[lang]) {
    return [`unknown language "${lang}"`]
  }
  if (!bank || !Array.isArray(bank.questions)) {
    return ['questions must be an array']
  }

  const errors = []
  for (const field of ['class', 'section', 'update']) {
    if (!isText(bank[field])) {
      errors.push(`${field} is required`)
    } else {
      errors.push(...validateText(bank[field], lang, field))
    }
  }

  let previous = 0
  for (const question of bank.questions) {
    const number = question?.question_number
    if (!Number.isInteger(number) || number <= previous) {
      errors.push(`Q${number}: question_number must be an integer above ${previous}`)
    } else {
      previous = number
    }
    errors.push(...validateQuestion(question ?? {}, lang, `Q${number}`))
  }

  return errors
}

/**
 * Compare the Bulgarian bank of a section with the English one
 *
 * Only the text is translated. Question numbers and order, the correct answer,
 * the number of choices, the image and the formulas must match.
 * @param {Object} en - English section
 * @param {Object} bg - Bulgarian section
 * @returns {string[]} Differences, empty if the banks match
 */
export function compareQuestionBanks(en, bg) {
  const numbers = (bank) => bank.questions.map((question) => question.question_number)
  if (numbers(en).join() !== numbers(bg).join()) {
    return ['question numbers or order differ']
  }

  const errors = []
  en.questions.forEach((enQuestion, index) => {
    const bgQuestion = bg.questions[index]
    const where = `Q${enQuestion.question_number}`

    const enAnswer = ANSWER_KEYS.en.indexOf(enQuestion.correct_answer)
    const bgAnswer = ANSWER_KEYS.bg.indexOf(bgQuestion.correct_answer)
    if (enAnswer !== bgAnswer) {
      errors.push(
        `${where}: correct answer differs (en ${enQuestion.correct_answer}, bg ${bgQuestion.correct_answer})`
      )
    }
    if (enQuestion.choices.length !== bgQuestion.choices.length) {
      errors.push(`${where}: number of choices differs`)
    }
    if (enQuestion.image !== bgQuestion.image) {
      errors.push(`${where}: image differs`)
    }

    const texts = [
      ['body', enQuestion.question_body, bgQuestion.question_body],
      ...enQuestion.choices.map((choice, i) => [
        `choice ${choice.key}`,
        choice.text,
        bgQuestion.choices[i]?.text ?? ''
      ])
    ]
    for (const [part, enText, bgText] of texts) {
      if (formulas(enText).join('\n') !== formulas(bgText).join('\n')) {
        errors.push(`${where} ${part}: formulas differ`)
      }
    }
  })

  return errors
}

/**
 * Check the images of one language against the files in its image folder
 *
 * Every image a question names must exist, and every file in the folder must
 * be used by some question. Hidden files such as .gitkeep are ignored.
 * @param {Object[]} banks - All sections of one language
 * @param {string[]} files - File names in that language's image folder
 * @returns {string[]} Error messages, empty if they match
 */
export function checkQuestionImages(banks, files) {
  const used = new Set(
    banks.flatMap((bank) => bank.questions.map((question) => question.image).filter(Boolean))
  )
  const present = new Set(files.filter((file) => !file.startsWith('.')))

  return [
    ...[...used].filter((image) => !present.has(image)).map((image) => `${image}: file missing`),
    ...[...present]
      .filter((file) => !used.has(file))
      .map((file) => `${file}: not used by any question`)
  ]
}

/**
 * Syllabus dates of the question banks, for display
 *
 * Each bank's `update` field holds the date printed on the official PDF
 * (e.g. "Updated syllabus 11.08.2025"). Banks without a date are skipped.
 * @param {Object[]} banks - Parsed section files
 * @returns {string[]} Distinct dates as DD.MM.YYYY, oldest first
 */
export function syllabusDates(banks) {
  const dates = new Set()
  for (const bank of banks) {
    const match = /\b(\d{2})\.(\d{2})\.(\d{4})\b/.exec(bank?.update ?? '')
    if (match) dates.add(match[0])
  }
  const sortKey = (date) => date.split('.').reverse().join('')
  return [...dates].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
}
