import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures.js'

/**
 * Radio Codes page (/#/codes): black-box e2e tests of the search box.
 *
 * Tests are tagged with the use case ids (S-<n>) and assumptions (SA<n>) they
 * were written from; the use-case list itself is kept outside the repo.
 * Expected values are derived from data_en/codes/*.json and the locale files.
 */

const readJson = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
const loadCodes = (name) => readJson(`../../data_en/codes/${name}.json`)

const Q = loadCodes('q-codes')
const ABBR = loadCodes('abbreviations')
const PROSIGNS = loadCodes('prosigns')
const NUMBERS = loadCodes('number-codes')
const RST = loadCodes('rst')
const EN = readJson('../../src/locales/en.json')
const BG = readJson('../../src/locales/bg.json')

const ROW_SECTIONS = [Q, ABBR, PROSIGNS, NUMBERS]
const ALL_SECTIONS = [...ROW_SECTIONS, RST]
const ALL_ENTRIES = ROW_SECTIONS.flatMap((s) => s.entries)
const TOTAL = ALL_ENTRIES.length
const ORIGINS = ['itu', 'amateur', 'slang']

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Also resolves a simple ICU plural: {count, plural, one {# code} other {# codes}}
const fill = (template, value) => {
  const plural = template.match(/^\{\w+, plural, one \{([^}]*)\} other \{([^}]*)\}\}$/)
  if (plural) {
    return plural[value === 1 ? 1 : 2].replace('#', value)
  }
  return template.replace(/\{\w+\}/, value)
}

/** Exact code text, tolerating a combining overline after each letter. */
const badgeRe = (loc) =>
  new RegExp(`^\\s*(${ORIGINS.map((o) => esc(loc.codes.origin[o])).join('|')})\\s*$`)

const isAnalytics = (url) => /goatcounter\.com|zgo\.at|umami\.is/.test(url)

/** Entries whose code or an alias starts with the query (code matching, SA3). */
const codesWithPrefix = (prefix) =>
  ALL_ENTRIES.filter((e) =>
    [e.code, ...(e.aliases ?? [])].some((c) => c.toUpperCase().startsWith(prefix.toUpperCase()))
  ).map((e) => e.code)

// ---------------------------------------------------------------------------
// Locator helpers (user-perceivable only)
// ---------------------------------------------------------------------------

const sectionHeading = (page, title) =>
  page.getByRole('heading', { level: 2, name: new RegExp('^\\s*' + esc(title)) })

/** Rows: list items with an origin badge that hold no other such list item. */
const rows = (page, loc = EN) => {
  const badge = page.getByText(badgeRe(loc))
  return page
    .getByRole('listitem')
    .filter({ has: badge })
    .filter({ hasNot: page.getByRole('listitem').filter({ has: badge }) })
}

// Element whose whole text is the code. Found with XPath, not getByText,
// which picks the deepest match: a <mark>K</mark> inside "KN" would match K,
// and a fully marked code would resolve to the mark instead of the code.
const codeXPath = (code) =>
  `xpath=.//*[not(self::mark)][normalize-space(translate(., '\u0305', ''))='${code}']`

const rowFor = (page, code, loc = EN) =>
  rows(page, loc).filter({ has: page.locator(codeXPath(code)) })

const codeIn = (row, code) => row.locator(codeXPath(code)).first()

const chipGroup = (page, loc = EN) => page.getByLabel(loc.codes.jumpTo, { exact: true })
const chip = (page, title, loc = EN) =>
  chipGroup(page, loc)
    .getByRole('button')
    .filter({ hasText: new RegExp('^\\s*' + esc(title.split(' ')[0])) })

const rstBlock = (page, loc = EN) =>
  sectionHeading(page, RST.title).locator(
    `xpath=ancestor::*[contains(normalize-space(.), "${loc.codes.rstSuffixes}")][1]`
  )

const searchbox = (page, loc = EN) =>
  page.getByRole('searchbox', { name: loc.codes.searchLabel, exact: true })
const clearButton = (page, loc = EN) =>
  page.getByRole('button', { name: loc.codes.clearSearch, exact: true })
const noResults = (page, query, loc = EN) =>
  page.getByText(fill(loc.codes.noResults, query), { exact: true })

/** The total line, e.g. "1 code" (not matching "1 codes" or "11 codes"). */
const totalText = (page, count, loc = EN) =>
  page.getByText(new RegExp(`(^|\\D)${esc(fill(loc.codes.total, count))}(?![\\p{L}\\d])`, 'u'))

const countRe = (n) => new RegExp(`(^|\\D)${n}(\\D|$)`)

/** Text of each <mark> inside a locator, overlines stripped (SA6). */
const markTexts = (locator) =>
  locator.locator('mark').evaluateAll((ms) => ms.map((m) => m.textContent.replace(/̅/g, '').trim()))

async function openCodes(page) {
  await page.goto('/#/codes')
  await expect(page.getByRole('heading', { level: 1, name: EN.codes.title })).toBeVisible()
  await expect(sectionHeading(page, RST.title)).toBeVisible()
}

async function switchLanguage(page, lang) {
  await page.getByRole('button', { name: `Switch to ${lang}`, exact: true }).click()
}

/** Resolve once window scrolling has been still for a few frames. */
async function waitScrollEnd(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = -1
        let still = 0
        const tick = () => {
          const y = window.scrollY
          if (y === last) {
            if (++still >= 6) return resolve()
          } else {
            still = 0
            last = y
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
  )
}

async function scrollToBottom(page) {
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
  )
  await waitScrollEnd(page)
  expect(await scrollY(page), 'page is scrolled down').toBeGreaterThan(100)
}

const scrollY = (page) => page.evaluate(() => window.scrollY)

async function expectAtTop(page, message) {
  await waitScrollEnd(page)
  expect(await scrollY(page), message).toBeLessThanOrEqual(1)
}

/** Element is in the viewport and its centre is not covered by anything else. */
async function expectUnobscured(locator, message) {
  await expect(locator, message).toBeInViewport()
  await expect
    .poll(
      () =>
        locator.evaluate((el) => {
          const r = el.getBoundingClientRect()
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          return !!hit && el.contains(hit)
        }),
      { message: `${message} (not covered by a sticky element)` }
    )
    .toBe(true)
}

async function expectNoHorizontalPageScroll(page, message) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, message).toBeLessThanOrEqual(0)
}

/**
 * Filtered state for a code query: exactly these rows, RST shown or not,
 * sections, heading counts, chips, intros and total to match (SA9, SA10).
 */
async function expectResults(page, { codes, rst = false, tag }) {
  await expect(rows(page), `${tag}: ${codes.length} rows`).toHaveCount(codes.length)
  for (const c of codes) {
    await expect(rowFor(page, c), `${tag}: ${c} shown`).toBeVisible()
  }
  const total = codes.length + (rst ? 1 : 0)
  await expect(
    totalText(page, total),
    `${tag}: total "${fill(EN.codes.total, total)}"`
  ).toBeVisible()

  for (const s of ROW_SECTIONS) {
    const n = s.entries.filter((e) => codes.includes(e.code)).length
    if (n) {
      await expect(sectionHeading(page, s.title), `${tag}: "${s.title}" counts ${n}`).toHaveText(
        countRe(n)
      )
      await expect(chip(page, s.title), `${tag}: "${s.title}" chip enabled`).toBeEnabled()
    } else {
      await expect(sectionHeading(page, s.title), `${tag}: "${s.title}" hidden`).toBeHidden()
      await expect(chip(page, s.title), `${tag}: "${s.title}" chip disabled`).toBeDisabled()
    }
  }
  if (rst) {
    await expect(sectionHeading(page, RST.title), `${tag}: RST shown`).toBeVisible()
    await expect(chip(page, RST.title), `${tag}: RST chip enabled`).toBeEnabled()
  } else {
    await expect(sectionHeading(page, RST.title), `${tag}: RST hidden`).toBeHidden()
    await expect(chip(page, RST.title), `${tag}: RST chip disabled`).toBeDisabled()
  }
  for (const s of ALL_SECTIONS) {
    await expect(
      page.getByText(s.intro, { exact: true }),
      `${tag}: "${s.title}" intro hidden`
    ).toBeHidden()
  }
}

/** The unfiltered page: every row, section, intro and chip, no marks. */
async function expectFullList(page, tag) {
  await expect(searchbox(page), `${tag}: box empty`).toHaveValue('')
  await expect(rows(page), `${tag}: all rows`).toHaveCount(TOTAL)
  await expect(totalText(page, TOTAL), `${tag}: full total`).toBeVisible()
  for (const s of ALL_SECTIONS) {
    await expect(sectionHeading(page, s.title), `${tag}: "${s.title}" shown`).toBeVisible()
    await expect(page.getByText(s.intro, { exact: true }), `${tag}: intro back`).toBeVisible()
    await expect(chip(page, s.title), `${tag}: "${s.title}" chip enabled`).toBeEnabled()
  }
  await expect(page.locator('mark'), `${tag}: no highlights`).toHaveCount(0)
}

async function search(page, query, loc = EN) {
  await searchbox(page, loc).fill(query)
}

// Self-contained browser function: text contrast against the effective background.
const contrastInPage = (el) => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number)
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  const layers = []
  for (let n = el; n; n = n.parentElement) {
    const bg = parse(getComputedStyle(n).backgroundColor)
    if (bg && bg.a > 0) {
      layers.push(bg)
      if (bg.a >= 1) break
    }
  }
  let base = { r: 255, g: 255, b: 255 }
  for (const l of layers.reverse()) {
    base = {
      r: l.r * l.a + base.r * (1 - l.a),
      g: l.g * l.a + base.g * (1 - l.a),
      b: l.b * l.a + base.b * (1 - l.a)
    }
  }
  const fg0 = parse(getComputedStyle(el).color)
  if (!fg0) return { ratio: NaN }
  const fg = {
    r: fg0.r * fg0.a + base.r * (1 - fg0.a),
    g: fg0.g * fg0.a + base.g * (1 - fg0.a),
    b: fg0.b * fg0.a + base.b * (1 - fg0.a)
  }
  const lum = ({ r, g, b }) => {
    const ch = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
  }
  const a = lum(fg)
  const b = lum(base)
  return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
}

// ---------------------------------------------------------------------------

test.describe('Radio Codes search', () => {
  test.describe('A. The search box', () => {
    // S-1, S-3, S-33
    test('should offer a labelled searchbox that stays in view and scrolls results to the top', async ({
      page
    }) => {
      await openCodes(page)
      const box = searchbox(page)
      await expect(box, 'S-1: one searchbox named from codes.searchLabel').toHaveCount(1)
      await expect(box, 'S-1: input type search').toHaveAttribute('type', 'search')
      await expect(box, 'S-1: placeholder').toHaveAttribute(
        'placeholder',
        EN.codes.searchPlaceholder
      )
      await expect(box, 'S-1: starts empty').toHaveValue('')
      await expect(rows(page), 'S-1: all rows').toHaveCount(TOTAL)

      await scrollToBottom(page)
      await expectUnobscured(box, 'S-3: searchbox stays in view')

      // SA2: filtering is live, no Enter
      await search(page, 'qth')
      await expect(rows(page), 'S-3: filtered without Enter').toHaveCount(1)
      await expectAtTop(page, 'S-33: typing scrolled the page to the top')
      await expect(rowFor(page, 'QTH'), 'S-33: QTH in view').toBeInViewport()
    })

    // S-2
    test('should search English data with Bulgarian UI strings', async ({ page }) => {
      await openCodes(page)
      await switchLanguage(page, 'bg')
      const box = searchbox(page, BG)
      await expect(box, 'S-2: BG accessible name').toBeVisible()
      await expect(box, 'S-2: BG placeholder').toHaveAttribute(
        'placeholder',
        BG.codes.searchPlaceholder
      )

      await search(page, 'qth', BG)
      await expect(rows(page, BG), 'S-2: one row for qth').toHaveCount(1)
      await expect(rowFor(page, 'QTH', BG), 'S-2: QTH').toBeVisible()
      await expect(totalText(page, 1, BG), `S-2: total "${fill(BG.codes.total, 1)}"`).toBeVisible()

      await search(page, 'location', BG)
      await expect(rowFor(page, 'QTH', BG), 'S-2: English meaning search').toBeVisible()

      await search(page, 'zzzz', BG)
      await expect(noResults(page, 'zzzz', BG), 'S-2: BG empty state').toBeVisible()
    })
  })

  test.describe('B. Code and alias matching', () => {
    // S-4, S-5, S-6, S-23
    test('should match codes exactly and by prefix, ignoring case, spaces and "?"', async ({
      page
    }) => {
      await openCodes(page)

      for (const q of ['QRM', 'qrm', 'Qrm', '  qrm?  ', 'QRM?']) {
        await search(page, q)
        await expectResults(page, { codes: ['QRM'], tag: `S-4/S-5: "${q}"` })
      }

      // S-6: narrowing and widening again
      for (const q of ['q', 'qs', 'qsl', 'q']) {
        await search(page, q)
        const codes = codesWithPrefix(q)
        await expectResults(page, { codes, tag: `S-6: "${q}" (${codes.length})` })
      }
      expect(codesWithPrefix('q'), 'S-6: data has 33 Q-codes').toHaveLength(Q.entries.length)
      expect(codesWithPrefix('qs'), 'S-6: 11 codes start with QS').toHaveLength(11)

      // S-23
      await search(page, 'qr')
      const qr = codesWithPrefix('qr')
      expect(qr, 'S-23: 18 codes start with QR').toHaveLength(18)
      await expectResults(page, { codes: qr, tag: 'S-23: "qr"' })
    })

    // S-7, S-8, S-9, S-10
    test('should match single letters, aliases and numbers by code, not by meaning', async ({
      page
    }) => {
      await openCodes(page)
      const cases = [
        { q: 'k', codes: ['K', 'KN', 'KA'], tag: 'S-7' },
        { q: 'r', codes: ['R', 'RIG', 'RPRT', 'RPT', 'RX'], rst: true, tag: 'S-7' },
        { q: 'va', codes: ['SK'], tag: 'S-8' },
        { q: 'tks', codes: ['TNX'], tag: 'S-8' },
        { q: 'ct', codes: ['KA'], tag: 'S-8' },
        { q: 'v', codes: ['VY', 'SK', 'SN'], tag: 'S-8' },
        { q: '73', codes: ['73'], tag: 'S-9' },
        { q: '8', codes: ['88'], tag: 'S-9' },
        // Fuzzy would also find QRO/QRP ("operating") and QSD ("defective")
        { q: 'op', codes: ['OP'], tag: 'S-10' },
        { q: 'de', codes: ['DE'], tag: 'S-10' },
        { q: 'hi', codes: ['HI'], tag: 'S-10' }
      ]
      for (const { q, codes, rst, tag } of cases) {
        await search(page, q)
        await expectResults(page, { codes, rst, tag: `${tag}: "${q}"` })
      }
      await search(page, 'va')
      await expect(
        rowFor(page, 'SK').getByText(new RegExp(esc(fill(EN.codes.alsoKnownAs, 'VA')))),
        'S-8: SK shows "also VA"'
      ).toBeVisible()
    })
  })

  test.describe('C. RST', () => {
    // S-11, S-12, S-13, S-14
    test('should find RST by its aliases and description', async ({ page }) => {
      await openCodes(page)
      for (const q of ['59', '599', 'rst', 'RST']) {
        await search(page, q)
        await expectResults(page, { codes: [], rst: true, tag: `S-11: "${q}"` })
        await expect(rstBlock(page), `S-11: RST block for "${q}"`).toBeVisible()
        await expect(noResults(page, q), `S-11: no empty state for "${q}"`).toBeHidden()
      }
      for (const q of ['5nn', '5NN', '5']) {
        await search(page, q)
        await expectResults(page, { codes: ['5NN'], rst: true, tag: `S-12: "${q}"` })
      }

      await search(page, 'readability')
      await expect(sectionHeading(page, RST.title), 'S-13: RST by description').toBeVisible()
      await expect(chip(page, RST.title), 'S-13: RST chip enabled').toBeEnabled()

      await search(page, 'qth')
      await expect(sectionHeading(page, RST.title), 'S-14: RST hidden').toBeHidden()
      await expect(chip(page, RST.title), 'S-14: RST chip disabled').toBeDisabled()
    })
  })

  test.describe('D. Meaning search', () => {
    // S-15, S-16, S-17 (SA4: presence only)
    test('should find codes by meaning text, with typos and in any case', async ({ page }) => {
      await openCodes(page)
      const cases = [
        ['location', ['QTH']],
        ['busy', ['QRL']],
        ['drifts', ['QRH']],
        ['thunderstorms', ['QRN']],
        ['laughter', ['HI']],
        ['smiley', ['HI']],
        ['transmitter power', ['QRO', 'QRP']],
        ['locaton', ['QTH']],
        ['LOCATION', ['QTH']]
      ]
      for (const [q, codes] of cases) {
        await search(page, q)
        for (const c of codes) {
          await expect(rowFor(page, c), `S-15/S-16/S-17: "${q}" finds ${c}`).toBeVisible()
        }
        await expect(noResults(page, q), `S-15: "${q}" is not empty`).toBeHidden()
      }

      await search(page, 'location')
      const lower = await rows(page).count()
      await search(page, 'LOCATION')
      await expect(rows(page), 'S-17: same results in upper case').toHaveCount(lower)
    })
  })

  test.describe('E. Highlighting', () => {
    // S-18, S-19, S-21
    test('should mark the matched part of codes and aliases', async ({ page }) => {
      await openCodes(page)

      await search(page, 'qrm?')
      expect(await markTexts(codeIn(rowFor(page, 'QRM'), 'QRM')), 'S-18: "qrm?" marks QRM').toEqual(
        ['QRM']
      )

      await search(page, 'qr')
      for (const c of codesWithPrefix('qr')) {
        expect(await markTexts(codeIn(rowFor(page, c), c)), `S-18: "qr" marked in ${c}`).toEqual([
          'QR'
        ])
      }

      await search(page, 'k')
      for (const c of ['K', 'KN', 'KA']) {
        expect(await markTexts(codeIn(rowFor(page, c), c)), `S-18: "k" marked in ${c}`).toEqual([
          'K'
        ])
      }
      // S-21: no single-character marks in meaning text ("working" has a k)
      const kn = ABBR.entries.find((e) => e.code === 'KN').meanings[0]
      await expect(
        rowFor(page, 'KN').getByText(kn).locator('mark'),
        'S-21: no mark in KN meaning'
      ).toHaveCount(0)

      await search(page, 'va')
      expect(await markTexts(rowFor(page, 'SK')), 'S-19: alias VA marked in SK row').toContain('VA')

      await search(page, 'sk')
      expect(
        await markTexts(codeIn(rowFor(page, 'SK'), 'SK')),
        'S-19: overlined SK marked'
      ).toEqual(['SK'])
    })

    // S-20, S-34
    test('should mark literal hits in meaning text', async ({ page }) => {
      await openCodes(page)
      const qth = rowFor(page, 'QTH')

      await search(page, 'location')
      await expect(qth.getByText(/My location is/), 'S-20: answer shown').toBeVisible()
      expect(
        await markTexts(qth.getByText(/My location is/)),
        'S-20: "location" marked in answer'
      ).toEqual(['location'])
      expect(
        (await markTexts(qth)).filter((t) => t === 'location').length,
        'S-20: at least two marks (answer, usage)'
      ).toBeGreaterThanOrEqual(2)

      await search(page, 'LOCATION')
      expect(await markTexts(qth), 'S-20: mark keeps the original case').toContain('location')

      await search(page, 'op')
      expect(
        await markTexts(rowFor(page, 'OP').getByText('Operator', { exact: true })),
        'S-34: code match also marks "Op" in "Operator"'
      ).toEqual(['Op'])
    })
  })

  test.describe('F. Filtered page state', () => {
    // S-24, S-25, S-26
    test('should jump in a filtered list, show an empty state and ignore blank queries', async ({
      page
    }) => {
      await openCodes(page)

      await search(page, 'k')
      await chip(page, PROSIGNS.title).click()
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, PROSIGNS.title), 'S-24: Prosigns in view')
      await expect(rowFor(page, 'KA'), 'S-24: KA shown').toBeVisible()

      await search(page, 'zzzz')
      await expect(noResults(page, 'zzzz'), 'S-25: empty state').toBeVisible()
      await expect(rows(page), 'S-25: no rows').toHaveCount(0)
      for (const s of ALL_SECTIONS) {
        await expect(sectionHeading(page, s.title), `S-25: "${s.title}" hidden`).toBeHidden()
        await expect(chip(page, s.title), `S-25: "${s.title}" chip disabled`).toBeDisabled()
      }
      await search(page, 'qth')
      await expect(noResults(page, 'zzzz'), 'S-25: empty state gone').toBeHidden()
      await expect(rowFor(page, 'QTH'), 'S-25: results back').toBeVisible()

      await search(page, '   ')
      await expect(rows(page), 'S-26: blank query shows all rows').toHaveCount(TOTAL)
      for (const s of ALL_SECTIONS) {
        await expect(page.getByText(s.intro, { exact: true }), 'S-26: intros shown').toBeVisible()
        await expect(chip(page, s.title), 'S-26: chips enabled').toBeEnabled()
      }
      await expect(noResults(page, ''), 'S-26: no empty state').toBeHidden()
      await expect(page.locator('mark'), 'S-26: no marks').toHaveCount(0)
    })
  })

  test.describe('G. Clearing and keyboard', () => {
    // S-27, S-22, S-28
    test('should clear with the button and with Esc, restoring the list at the top', async ({
      page
    }) => {
      await openCodes(page)
      const box = searchbox(page)
      await expect(clearButton(page), 'S-27: no × while empty').toBeHidden()

      await search(page, 'q')
      await expect(page.locator('mark').first(), 'S-22: marks while searching').toBeVisible()
      await scrollToBottom(page)
      await clearButton(page).click()
      await expectFullList(page, 'S-27/S-22')
      await expectAtTop(page, 'S-27: scrolled to top')
      await expect(box, 'S-27: focus back in the box').toBeFocused()
      await expect(clearButton(page), 'S-27: × hidden again').toBeHidden()

      await search(page, 'q')
      await scrollToBottom(page)
      await box.press('Escape')
      await expectFullList(page, 'S-28')
      await expectAtTop(page, 'S-28: scrolled to top')
    })

    // S-29 (SA8)
    test('should focus the box with "/" unless typing in it', async ({ page }) => {
      await openCodes(page)
      const box = searchbox(page)

      await page.evaluate(() => document.activeElement?.blur?.())
      await page.keyboard.press('/')
      await expect(box, 'S-29: "/" from the page focuses the box').toBeFocused()
      await expect(box, 'S-29: no "/" typed').toHaveValue('')

      await chip(page, Q.title).focus()
      await page.keyboard.press('/')
      await expect(box, 'S-29: "/" from a chip focuses the box').toBeFocused()
      await expect(box, 'S-29: still no "/" typed').toHaveValue('')

      await box.fill('qr')
      await page.keyboard.press('/')
      await expect(box, 'S-29: "/" is typed inside the box').toHaveValue('qr/')
    })
  })

  test.describe('H. Interplay', () => {
    // S-30
    test('should clear the search before jumping to RST from See RST', async ({ page }) => {
      await openCodes(page)
      await search(page, '5nn')
      await rowFor(page, '5NN').getByRole('button', { name: EN.codes.seeRst, exact: true }).click()
      await expect(searchbox(page), 'S-30: search cleared').toHaveValue('')
      await expect(rows(page), 'S-30: all rows back').toHaveCount(TOTAL)
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, RST.title), 'S-30: RST heading in view')
    })

    // S-31
    test('should fit a phone width while searching', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 740 })
      await openCodes(page)
      for (const q of ['q', 'z'.repeat(60)]) {
        await search(page, q)
        await expectNoHorizontalPageScroll(page, `S-31: no page scroll for "${q.slice(0, 8)}"`)
        for (const [name, loc] of [
          ['searchbox', searchbox(page)],
          ['clear button', clearButton(page)]
        ]) {
          const b = await loc.boundingBox()
          expect(b, `S-31: ${name} has a box`).not.toBeNull()
          expect(b.x, `S-31: ${name} starts in view`).toBeGreaterThanOrEqual(0)
          expect(b.x + b.width, `S-31: ${name} ends in view`).toBeLessThanOrEqual(375)
        }
      }
      await expect(noResults(page, 'z'.repeat(60)), 'S-31: empty state shown').toBeVisible()
    })

    // S-32
    for (const scheme of ['light', 'dark']) {
      test(`should keep highlights readable in ${scheme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await openCodes(page)
        const html = page.locator('html')
        if ((await html.getAttribute('data-theme')) !== scheme) {
          await page.getByRole('button', { name: EN.nav.toggleTheme }).click()
          await page.waitForTimeout(300)
        }
        await expect(html, `S-32: ${scheme} theme active`).toHaveAttribute('data-theme', scheme)

        const low = []
        for (const [q, code] of [
          ['qrm', 'QRM'],
          ['location', 'QTH']
        ]) {
          await search(page, q)
          const mark = rowFor(page, code).locator('mark').first()
          await expect(mark, `S-32: mark for "${q}"`).toBeVisible()
          const { ratio } = await mark.evaluate(contrastInPage)
          if (!(ratio >= 4.5)) low.push(`${q}: ${ratio.toFixed(2)}`)
        }
        expect(low, `S-32: marks below 4.5:1 in ${scheme} theme`).toEqual([])
      })
    }

    // S-35
    test('should log no errors while searching, clearing and jumping', async ({ page }) => {
      const problems = []
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
      page.on('requestfailed', (r) => !isAnalytics(r.url()) && problems.push(`failed: ${r.url()}`))
      page.on(
        'response',
        (r) =>
          r.status() >= 400 && !isAnalytics(r.url()) && problems.push(`${r.status()}: ${r.url()}`)
      )

      await openCodes(page)
      for (const q of ['q', 'qrm?', 'location', 'zzzz', '59', '   ']) await search(page, q)
      await search(page, 'k')
      await chip(page, PROSIGNS.title).click()
      await clearButton(page).click()
      await search(page, 'qth')
      await searchbox(page).press('Escape')
      await search(page, '5nn')
      await page.getByRole('button', { name: EN.codes.seeRst, exact: true }).click()
      await waitScrollEnd(page)

      expect(problems, 'S-35: no errors').toEqual([])
    })
  })

  // Ticket 05: the search is part of the URL. Written against the ticket, not
  // from a use-case list, so these tests carry no S-<n> tags.
  test.describe('I. Search in the URL', () => {
    const URL_DELAY = 300 // ms the page waits after typing before updating the URL

    test('should open with the search from ?q=', async ({ page }) => {
      await page.goto('/#/codes?q=qrm')
      await expect(searchbox(page), 'URL: box holds q').toHaveValue('qrm')
      await expect(rowFor(page, 'QRM'), 'URL: QRM shown').toBeVisible()
      await expect(rowFor(page, 'QRN'), 'URL: QRN not shown').toBeHidden()

      await page.goto('/#/codes?q=end%20of%20contact')
      await expect(searchbox(page), 'URL: encoded q decoded').toHaveValue('end of contact')
      await expect(rowFor(page, 'QSO'), 'URL: QSO shown').toBeVisible()

      await page.goto('/#/codes?q=%20%20')
      await expect(searchbox(page), 'URL: blank q is no search').toHaveValue('')
      await expect(rows(page), 'URL: all rows for blank q').toHaveCount(TOTAL)
    })

    test('should follow typing with replace, keeping focus and Back history', async ({ page }) => {
      await page.goto('/#/')
      await page.goto('/#/codes')
      const historyLength = await page.evaluate(() => history.length)

      const box = searchbox(page)
      await box.click()
      await box.pressSequentially('qth', { delay: 50 })
      await expect(page, 'URL: q follows typing').toHaveURL(/#\/codes\?q=qth$/)
      await expect(box, 'URL: focus stays in the box').toBeFocused()
      expect(await page.evaluate(() => history.length), 'URL: no history entries added').toBe(
        historyLength
      )

      // A trailing space is trimmed in the URL but must survive in the box
      await box.pressSequentially(' ', { delay: 50 })
      await page.waitForTimeout(URL_DELAY * 2)
      await expect(box, 'URL: typed text kept as typed').toHaveValue('qth ')

      await page.goBack()
      await expect(page, 'URL: Back leaves the codes page').toHaveURL(/#\/$/)
    })

    test('should drop ?q= when the search is cleared', async ({ page }) => {
      await page.goto('/#/codes?q=qth')
      await clearButton(page).click()
      await expect(page, 'URL: clear button drops q').toHaveURL(/#\/codes$/)

      await page.goto('/#/codes?q=qth')
      await searchbox(page).press('Escape')
      await expect(page, 'URL: Esc drops q').toHaveURL(/#\/codes$/)
    })

    test('should keep the search after a reload', async ({ page }) => {
      await page.goto('/#/codes')
      await search(page, 'location')
      await expect(page).toHaveURL(/#\/codes\?q=location$/)
      await page.reload()
      await expect(searchbox(page), 'URL: search restored').toHaveValue('location')
      await expect(rowFor(page, 'QTH'), 'URL: QTH shown after reload').toBeVisible()
    })
  })
})
