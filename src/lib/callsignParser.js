/**
 * Callsign Parser
 *
 * Utilities for parsing amateur radio callsigns with prefixes and suffixes.
 * Examples:
 *   W1ABC       -> { base: 'W1ABC', prefix: null, suffix: null }
 *   W1ABC/M     -> { base: 'W1ABC', prefix: null, suffix: 'M' }
 *   HB/W1ABC    -> { base: 'W1ABC', prefix: 'HB', suffix: null }
 *   HB/W1ABC/P  -> { base: 'W1ABC', prefix: 'HB', suffix: 'P' }
 */

/**
 * Parse a callsign into base, prefix, and suffix components
 *
 * @param {string} callsign - Full callsign (e.g., 'HB/W1ABC/P')
 * @returns {{ base: string, prefix: string | null, suffix: string | null }}
 */
export function parseCallsign(callsign) {
  if (!callsign || typeof callsign !== 'string') {
    return { base: '', prefix: null, suffix: null }
  }

  const trimmed = callsign.trim().toUpperCase()
  const parts = trimmed.split('/')

  if (parts.length === 1) {
    // Simple callsign: W1ABC
    return { base: parts[0], prefix: null, suffix: null }
  } else if (parts.length === 2) {
    // Either prefix/base or base/suffix
    // Heuristic: if first part is 1-3 characters, it's likely a prefix
    if (parts[0].length <= 3) {
      // Likely prefix/base: HB/W1ABC
      return { base: parts[1], prefix: parts[0], suffix: null }
    } else {
      // Likely base/suffix: W1ABC/M
      return { base: parts[0], prefix: null, suffix: parts[1] }
    }
  } else if (parts.length === 3) {
    // prefix/base/suffix: HB/W1ABC/P
    return { base: parts[1], prefix: parts[0], suffix: parts[2] }
  }

  // Fallback for unusual formats - treat the whole thing as base
  return { base: trimmed, prefix: null, suffix: null }
}

/**
 * Reconstruct full callsign from base, prefix, and suffix
 *
 * @param {string} base - Base callsign (e.g., 'W1ABC')
 * @param {string | null} prefix - Prefix (e.g., 'HB')
 * @param {string | null} suffix - Suffix (e.g., 'M', 'P')
 * @returns {string} Full callsign (e.g., 'HB/W1ABC/P')
 */
export function buildCallsign(base, prefix, suffix) {
  const parts = []
  if (prefix) parts.push(prefix)
  parts.push(base)
  if (suffix) parts.push(suffix)
  return parts.join('/')
}
