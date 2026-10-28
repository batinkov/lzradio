import Fuse from 'fuse.js'

/**
 * Radio Codes Search
 *
 * One search answers both directions: a code finds its meaning (forward
 * lookup) and words from a meaning find the code (reverse lookup). Codes are
 * matched directly first; fuzzy matching over the meaning text runs only when
 * no code matches, so "QRM" finds QRM and not the similar-looking QRN or QRP.
 */

// Meaning text searched by the fuzzy pass
const MEANING_KEYS = ['question', 'answer', 'usage', 'meanings', 'note']

/**
 * Create a Fuse.js index over the meaning text of every entry and of RST
 * @param {{ categories: Array, rst: Object }} codes - Loaded codes reference
 * @returns {Fuse} Index whose items are { categoryId, entry }
 */
export function createCodesIndex(codes) {
  const items = codes.categories.flatMap((category) =>
    category.entries.map((entry) => ({ categoryId: category.id, entry }))
  )
  // RST has no entries; its title and intro stand in for the meaning text
  items.push({
    categoryId: codes.rst.id,
    entry: { answer: codes.rst.title, note: codes.rst.intro }
  })

  return new Fuse(items, {
    keys: MEANING_KEYS.map((key) => `entry.${key}`),
    threshold: 0.3, // Balanced fuzzy threshold
    ignoreLocation: true, // Match anywhere in string
    minMatchCharLength: 2 // Don't match single characters
  })
}

/**
 * Normalise a query for code matching: case, surrounding spaces and a
 * trailing question mark ("qrm?" asks the same as "QRM") do not matter
 * @param {string} query - Raw search query
 * @returns {string} Upper-case code to compare against
 */
export function normalizeCodeQuery(query) {
  return query.trim().replace(/\?+$/, '').trim().toUpperCase()
}

/**
 * Split a code into the part the query matches and the rest, for highlighting.
 * Codes match by prefix, so the matched part is always at the start.
 * @param {string} code - Code or alias as shown
 * @param {string} query - Raw search query
 * @returns {{ match: string, rest: string }|null} Parts of the code, or null when it does not match
 */
export function splitCodeMatch(code, query) {
  const normalized = normalizeCodeQuery(query)
  if (normalized === '' || !code.toUpperCase().startsWith(normalized)) {
    return null
  }
  return { match: code.slice(0, normalized.length), rest: code.slice(normalized.length) }
}

/**
 * Rank how well a list of code strings matches a normalised query
 * @param {Array<string>} codes - Code and aliases of one entry
 * @param {string} code - Normalised query
 * @returns {number|null} 0 for an exact match, 1 for a prefix match, null for none
 */
function codeRank(codes, code) {
  if (codes.some((candidate) => candidate.toUpperCase() === code)) {
    return 0
  }
  if (codes.some((candidate) => candidate.toUpperCase().startsWith(code))) {
    return 1
  }
  return null
}

/**
 * Search the codes reference
 * @param {{ categories: Array, rst: Object }} codes - Loaded codes reference
 * @param {string} query - Search query
 * @param {Fuse} [index] - Index from createCodesIndex, reused across searches
 * @returns {{ categories: Array, rst: boolean }} Every category with only its
 *   matching entries (best first), and whether the RST section matches
 */
export function searchCodes(codes, query, index) {
  const code = normalizeCodeQuery(query)

  // Show all if search is empty
  if (code === '') {
    return { categories: codes.categories, rst: true }
  }

  // Direct pass: codes and aliases equal to or starting with the query
  const rstMatch = codeRank(codes.rst.aliases, code) !== null
  const direct = codes.categories.map((category) => ({
    ...category,
    entries: category.entries
      .map((entry) => ({ entry, rank: codeRank([entry.code, ...(entry.aliases ?? [])], code) }))
      .filter(({ rank }) => rank !== null)
      .sort((a, b) => a.rank - b.rank)
      .map(({ entry }) => entry)
  }))

  if (rstMatch || direct.some((category) => category.entries.length > 0)) {
    return { categories: direct, rst: rstMatch }
  }

  // Fuzzy pass over the meaning text, results already ordered best first
  const text = query.trim()
  if (text.length < 2) {
    return { categories: direct, rst: false }
  }

  const results = (index ?? createCodesIndex(codes)).search(text).map((result) => result.item)
  return {
    categories: codes.categories.map((category) => ({
      ...category,
      entries: results.filter((item) => item.categoryId === category.id).map((item) => item.entry)
    })),
    rst: results.some((item) => item.categoryId === codes.rst.id)
  }
}
