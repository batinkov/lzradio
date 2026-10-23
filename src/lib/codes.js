/**
 * Radio Codes Data Layer
 *
 * Loads the radio codes reference from data_en/codes/ and validates its shape.
 * Each category lives in its own file; RST is a set of rating scales rather
 * than a list of codes, so it has a structure of its own.
 */

/**
 * Category ids in display order. Each id is also the data file name.
 */
export const CATEGORY_IDS = ['q-codes', 'abbreviations', 'prosigns', 'number-codes']

/**
 * Section id of the RST explainer, the only valid `see` target
 */
export const RST_ID = 'rst'

/**
 * Valid values for an entry's origin
 */
export const ORIGINS = ['itu', 'amateur', 'slang']

// Cache for loaded codes
let cachedCodes = null

/**
 * Load the codes reference
 *
 * Only English data exists for now, so every locale gets it. When data_bg/codes/
 * is added, choose the language here the same way questions.js does.
 * @returns {Promise<{ categories: Array, rst: Object }>} Categories in display order, plus RST
 */
export async function loadCodes() {
  if (cachedCodes) {
    return cachedCodes
  }

  const modules = await Promise.all([
    import('../../data_en/codes/q-codes.json'),
    import('../../data_en/codes/abbreviations.json'),
    import('../../data_en/codes/prosigns.json'),
    import('../../data_en/codes/number-codes.json'),
    import('../../data_en/codes/rst.json')
  ])

  cachedCodes = {
    categories: CATEGORY_IDS.map((id, index) => ({ id, ...modules[index].default })),
    rst: { id: RST_ID, ...modules[CATEGORY_IDS.length].default }
  }

  return cachedCodes
}

/**
 * Check that a value is a non-empty string
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a string with visible content
 */
function isText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * Check that a value is a non-empty array of non-empty strings
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a list of text
 */
function isTextList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isText)
}

/**
 * Validate a rating scale: values numbered 1, 2, 3, … each with a label
 * @param {any} scale - Scale values to check
 * @returns {boolean} True if the scale is well formed
 */
function isValidScale(scale) {
  return (
    Array.isArray(scale) &&
    scale.length > 0 &&
    scale.every((step, index) => step?.value === index + 1 && isText(step.label))
  )
}

/**
 * Validate one entry against the rules of its category
 * @param {Object} entry - Entry to check
 * @param {string} categoryId - Id of the category the entry belongs to
 * @returns {string[]} Error messages, empty if the entry is valid
 */
function validateEntry(entry, categoryId) {
  const where = `${categoryId}/${entry?.id ?? '?'}`
  const errors = []

  if (!entry || typeof entry !== 'object') {
    return [`${where}: entry must be an object`]
  }
  if (!isText(entry.id) || entry.id !== entry.id.toLowerCase()) {
    errors.push(`${where}: id must be a lowercase string`)
  }
  if (!isText(entry.code)) {
    errors.push(`${where}: code is required`)
  }
  if (!ORIGINS.includes(entry.origin)) {
    errors.push(`${where}: origin must be one of ${ORIGINS.join(', ')}`)
  }
  if (entry.aliases !== undefined && !isTextList(entry.aliases)) {
    errors.push(`${where}: aliases must be a non-empty list of strings`)
  }
  if (entry.note !== undefined && !isText(entry.note)) {
    errors.push(`${where}: note must be a non-empty string`)
  }
  if (entry.see !== undefined && entry.see !== RST_ID) {
    errors.push(`${where}: see must point to "${RST_ID}"`)
  }

  if (categoryId === 'q-codes') {
    // The question form is optional: amateur and slang Q-codes such as QST have none
    if (!isText(entry.answer)) {
      errors.push(`${where}: answer is required`)
    }
    if (entry.question !== undefined && !isText(entry.question)) {
      errors.push(`${where}: question must be a non-empty string`)
    }
    if (entry.usage !== undefined && !isText(entry.usage)) {
      errors.push(`${where}: usage must be a non-empty string`)
    }
    if (entry.scale !== undefined && !isValidScale(entry.scale)) {
      errors.push(`${where}: scale must be numbered from 1, each step with a label`)
    }
  } else if (!isTextList(entry.meanings)) {
    errors.push(`${where}: meanings must be a non-empty list of strings`)
  }

  if (categoryId === 'prosigns' && !/^[.-]+$/.test(entry.morse ?? '')) {
    errors.push(`${where}: morse must be a pattern of dots and dashes`)
  }

  return errors
}

/**
 * Validate the RST section
 * @param {Object} rst - RST data to check
 * @returns {string[]} Error messages, empty if RST is valid
 */
function validateRst(rst) {
  const errors = []

  if (!rst || typeof rst !== 'object') {
    return ['rst: must be an object']
  }
  if (!isText(rst.title) || !isText(rst.intro)) {
    errors.push('rst: title and intro are required')
  }
  if (!isTextList(rst.aliases)) {
    errors.push('rst: aliases must be a non-empty list of strings')
  }
  if (
    !Array.isArray(rst.formats) ||
    rst.formats.length === 0 ||
    !rst.formats.every((f) => isText(f?.mode) && isText(f.example) && isText(f.description))
  ) {
    errors.push('rst: each format needs a mode, an example and a description')
  }
  if (
    !Array.isArray(rst.scales) ||
    rst.scales.length === 0 ||
    !rst.scales.every((s) => isText(s?.id) && isText(s.name) && isValidScale(s.values))
  ) {
    errors.push('rst: each scale needs an id, a name and values numbered from 1')
  }
  if (
    !Array.isArray(rst.suffixes) ||
    !rst.suffixes.every((s) => /^[A-Z]$/.test(s?.letter ?? '') && isText(s.meaning))
  ) {
    errors.push('rst: each suffix needs a single capital letter and a meaning')
  }

  return errors
}

/**
 * Validate the whole codes reference
 *
 * Besides each entry's own fields, ids must be unique across all categories,
 * and so must the strings a user can search for (codes and aliases), otherwise
 * a code lookup could land on two entries. RST aliases are left out of that
 * check on purpose: 5NN is both an abbreviation and a way to find RST.
 * @param {{ categories: Array, rst: Object }} codes - Loaded codes reference
 * @returns {string[]} Error messages, empty if the reference is valid
 */
export function validateCodes(codes) {
  if (!codes || !Array.isArray(codes.categories)) {
    return ['codes: categories must be an array']
  }

  const errors = []
  const ids = new Set()
  const codeStrings = new Set()

  for (const category of codes.categories) {
    const categoryId = category?.id ?? '?'

    if (!CATEGORY_IDS.includes(categoryId)) {
      errors.push(`${categoryId}: unknown category`)
    }
    if (!isText(category?.title) || !isText(category?.intro)) {
      errors.push(`${categoryId}: title and intro are required`)
    }
    if (!Array.isArray(category?.entries) || category.entries.length === 0) {
      errors.push(`${categoryId}: entries must be a non-empty array`)
      continue
    }

    for (const entry of category.entries) {
      errors.push(...validateEntry(entry, categoryId))

      if (ids.has(entry?.id)) {
        errors.push(`${categoryId}/${entry.id}: duplicate id`)
      }
      ids.add(entry?.id)

      for (const text of [entry?.code, ...(entry?.aliases ?? [])]) {
        const key = String(text).toUpperCase()
        if (codeStrings.has(key)) {
          errors.push(`${categoryId}/${entry.id}: code or alias "${text}" is used twice`)
        }
        codeStrings.add(key)
      }
    }
  }

  errors.push(...validateRst(codes.rst))

  return errors
}
