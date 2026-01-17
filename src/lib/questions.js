/**
 * Exam Questions Data Layer
 *
 * Dynamically loads exam questions from data_en/ or data_bg/ based on current locale.
 * Provides utilities for filtering, randomizing, and accessing question data.
 * Questions are organized in JSON files: ClassX_SectionY.json
 */

import { get } from 'svelte/store'
import { locale } from 'svelte-i18n'

// Cache for loaded questions
let cachedLocale = null
let cachedSections = null

/**
 * Load sections for current locale
 * @returns {Promise<Object>} Sections object with class data
 */
async function loadSections() {
  const currentLocale = get(locale)
  const lang = currentLocale?.startsWith('bg') ? 'bg' : 'en'

  // Return cached if same locale
  if (cachedLocale === lang && cachedSections) {
    return cachedSections
  }

  // Dynamically import based on locale
  const modules = await Promise.all([
    import(`../../data_${lang}/Class1_Section1.json`),
    import(`../../data_${lang}/Class1_Section2.json`),
    import(`../../data_${lang}/Class1_Section3.json`),
    import(`../../data_${lang}/Class2_Section1.json`),
    import(`../../data_${lang}/Class2_Section2.json`),
    import(`../../data_${lang}/Class2_Section3.json`)
  ])

  cachedSections = {
    1: [modules[0].default, modules[1].default, modules[2].default],
    2: [modules[3].default, modules[4].default, modules[5].default]
  }
  cachedLocale = lang

  return cachedSections
}

/**
 * Get all questions for a class
 * @param {number} classNum - Class number (1 or 2)
 * @returns {Promise<Array>} All questions for the class
 */
export async function getAllQuestions(classNum) {
  const sections = await loadSections()
  const classSections = sections[classNum]
  return classSections.flatMap((section) => section.questions)
}

/**
 * Get questions filtered by class and sections
 * @param {number} classNum - Class number (1 or 2)
 * @param {number[]} sectionNumbers - Array of section numbers to include (1, 2, 3)
 * @param {boolean} randomize - Whether to randomize the order
 * @returns {Promise<Array>} Filtered (and optionally randomized) questions
 */
export async function getQuestions(classNum, sectionNumbers = [1, 2, 3], randomize = false) {
  const sections = await loadSections()
  const classSections = sections[classNum]

  // Filter sections and extract questions
  let questions = classSections
    .filter((section, index) => sectionNumbers.includes(index + 1))
    .flatMap((section) => section.questions)

  if (randomize) {
    // Fisher-Yates shuffle
    questions = [...questions]
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[questions[i], questions[j]] = [questions[j], questions[i]]
    }
  }

  return questions
}

/**
 * Get a subset of questions for simulated exam
 * @param {number} classNum - Class number (1 or 2)
 * @param {number} count - Number of questions to select
 * @returns {Promise<Array>} Random subset of questions
 */
export async function getSimulatedExamQuestions(classNum, count = 60) {
  const allQuestions = await getAllQuestions(classNum)

  // Fisher-Yates shuffle
  const shuffled = [...allQuestions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, count)
}

/**
 * Get section information (class name, section name, update info)
 * @param {number} classNum - Class number (1 or 2)
 * @param {number} sectionNum - Section number (1, 2, or 3)
 * @returns {Promise<Object>} Section metadata
 */
export async function getSectionInfo(classNum, sectionNum) {
  const sections = await loadSections()
  const classSections = sections[classNum]
  const section = classSections[sectionNum - 1]
  return {
    class: section.class,
    section: section.section,
    update: section.update,
  }
}

/**
 * Get metadata for all sections of a class
 * @param {number} classNum - Class number (1 or 2)
 * @returns {Promise<Object>} Class and update info
 */
export async function getClassInfo(classNum) {
  const sections = await loadSections()
  const classSections = sections[classNum]
  // All sections should have the same class and update info
  return {
    class: classSections[0].class,
    update: classSections[0].update,
  }
}
