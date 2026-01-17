/**
 * URL Parameters Module
 *
 * Utilities for parsing and validating URL parameters for exam routes.
 * Provides type-safe parameter extraction with sensible defaults.
 */

/**
 * Valid question order options
 */
export const QUESTION_ORDER = {
  SEQUENTIAL: 'sequential',
  RANDOM: 'random'
}

/**
 * Valid class numbers
 */
export const VALID_CLASSES = [1, 2]

/**
 * Valid section numbers
 */
export const VALID_SECTIONS = [1, 2, 3]

/**
 * Default exam parameters
 */
export const DEFAULT_PARAMS = {
  classNum: '1',
  questionOrder: QUESTION_ORDER.SEQUENTIAL,
  sections: [1, 2, 3]
}

/**
 * Extracts class number from location path
 *
 * @param {string} location - The location path (e.g., "/exam/class2/prep")
 * @returns {'1'|'2'} The class number as a string
 */
export function parseClassNumber(location) {
  if (typeof location !== 'string') {
    return DEFAULT_PARAMS.classNum
  }
  return location.includes('class2') ? '2' : '1'
}

/**
 * Parses question order from URL parameter
 *
 * @param {string|null} orderParam - The 'order' URL parameter value
 * @returns {'sequential'|'random'} Valid question order
 */
export function parseQuestionOrder(orderParam) {
  if (orderParam === QUESTION_ORDER.RANDOM) {
    return QUESTION_ORDER.RANDOM
  }
  return QUESTION_ORDER.SEQUENTIAL
}

/**
 * Parses section numbers from comma-separated string
 *
 * @param {string|null} categoriesParam - Comma-separated section numbers (e.g., "1,2,3")
 * @returns {Array<number>} Array of valid section numbers
 */
export function parseSections(categoriesParam) {
  if (!categoriesParam || typeof categoriesParam !== 'string') {
    return DEFAULT_PARAMS.sections
  }

  const sections = categoriesParam
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(num => !isNaN(num) && VALID_SECTIONS.includes(num))

  // Remove duplicates
  const uniqueSections = [...new Set(sections)]

  // Return default if no valid sections found
  return uniqueSections.length > 0 ? uniqueSections : DEFAULT_PARAMS.sections
}

/**
 * Parses all exam parameters from location and query string
 *
 * @param {string} location - The location path
 * @param {string} querystring - The query string (without '?')
 * @returns {Object} Parsed exam parameters
 * @returns {string} return.classNum - Class number ('1' or '2')
 * @returns {'sequential'|'random'} return.questionOrder - Question order
 * @returns {Array<number>} return.sections - Section numbers
 */
export function parseExamParams(location, querystring) {
  const urlParams = new URLSearchParams(querystring)

  return {
    classNum: parseClassNumber(location),
    questionOrder: parseQuestionOrder(urlParams.get('order')),
    sections: parseSections(urlParams.get('categories'))
  }
}

/**
 * Validates class number
 *
 * @param {string|number} classNum - Class number to validate
 * @returns {boolean} True if valid
 */
export function isValidClass(classNum) {
  const num = typeof classNum === 'string' ? parseInt(classNum, 10) : classNum
  return VALID_CLASSES.includes(num)
}

/**
 * Validates section number
 *
 * @param {number} section - Section number to validate
 * @returns {boolean} True if valid
 */
export function isValidSection(section) {
  return VALID_SECTIONS.includes(section)
}
