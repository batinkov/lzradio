/**
 * Exam Questions Data Layer
 *
 * Loads and manages exam questions from data_en/ directory.
 * Provides utilities for filtering, randomizing, and accessing question data.
 * Questions are organized in JSON files: ClassX_SectionY.json
 */

// Import JSON files for each class and section
import class1Section1 from '../../data_en/Class1_Section1.json'
import class1Section2 from '../../data_en/Class1_Section2.json'
import class1Section3 from '../../data_en/Class1_Section3.json'
import class2Section1 from '../../data_en/Class2_Section1.json'
import class2Section2 from '../../data_en/Class2_Section2.json'
import class2Section3 from '../../data_en/Class2_Section3.json'

// Store the raw section data (includes class, section, update, questions)
const class1Sections = [class1Section1, class1Section2, class1Section3]
const class2Sections = [class2Section1, class2Section2, class2Section3]

// Combined sections data for each class
export const sections = {
  1: class1Sections,
  2: class2Sections,
}

/**
 * Get all questions for a class
 * @param {number} classNum - Class number (1 or 2)
 * @returns {Array} All questions for the class
 */
export function getAllQuestions(classNum) {
  const classSections = sections[classNum]
  return classSections.flatMap((section) => section.questions)
}

/**
 * Get questions filtered by class and sections
 * @param {number} classNum - Class number (1 or 2)
 * @param {number[]} sectionNumbers - Array of section numbers to include (1, 2, 3)
 * @param {boolean} randomize - Whether to randomize the order
 * @returns {Array} Filtered (and optionally randomized) questions
 */
export function getQuestions(classNum, sectionNumbers = [1, 2, 3], randomize = false) {
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
 * @returns {Array} Random subset of questions
 */
export function getSimulatedExamQuestions(classNum, count = 60) {
  const allQuestions = getAllQuestions(classNum)

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
 * @returns {Object} Section metadata
 */
export function getSectionInfo(classNum, sectionNum) {
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
 * @returns {Object} Class and update info
 */
export function getClassInfo(classNum) {
  const classSections = sections[classNum]
  // All sections should have the same class and update info
  return {
    class: classSections[0].class,
    update: classSections[0].update,
  }
}
