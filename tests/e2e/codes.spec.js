import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures.js'

/**
 * Radio Codes page (/#/codes): black-box e2e tests.
 *
 * Tests are tagged with the use case ids (UC-<n>) and assumptions (A<n>) they
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
const ALL_ENTRIES = ROW_SECTIONS.flatMap((s) => s.entries)
const TOTAL = ALL_ENTRIES.length
const SECTION_TITLES = [...ROW_SECTIONS.map((s) => s.title), RST.title]

// The Bulgarian translation: same codes, Bulgarian text
const loadBgCodes = (name) => readJson(`../../data_bg/codes/${name}.json`)
const BG_Q = loadBgCodes('q-codes')
const BG_ABBR = loadBgCodes('abbreviations')
const BG_ROW_SECTIONS = [BG_Q, BG_ABBR, loadBgCodes('prosigns'), loadBgCodes('number-codes')]
const BG_RST = loadBgCodes('rst')
const BG_SECTION_TITLES = [...BG_ROW_SECTIONS.map((s) => s.title), BG_RST.title]
const ORIGINS = ['itu', 'amateur', 'slang']
const countOrigin = (entries, origin) => entries.filter((e) => e.origin === origin).length

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Also resolves a simple ICU plural: {count, plural, one {# code} other {# codes}}
const fill = (template, value) => {
  const plural = template.match(/^\{\w+, plural, one \{([^}]*)\} other \{([^}]*)\}\}$/)
  if (plural) {
    return plural[value === 1 ? 1 : 2].replace('#', value)
  }
  return template.replace(/\{\w+\}/, value)
}

/** Exact code text, tolerating a combining overline after each letter (A10). */
const codeRe = (code) =>
  new RegExp('^\\s*' + [...code].map((c) => esc(c) + '\\u0305?').join('') + '\\s*$')

const badgeRe = (loc) =>
  new RegExp(`^\\s*(${ORIGINS.map((o) => esc(loc.codes.origin[o])).join('|')})\\s*$`)

const isAnalytics = (url) => /goatcounter\.com|zgo\.at|umami\.is/.test(url)

// ---------------------------------------------------------------------------
// Locator helpers (user-perceivable only)
// ---------------------------------------------------------------------------

const sectionHeading = (page, title) =>
  page.getByRole('heading', { level: 2, name: new RegExp('^\\s*' + esc(title)) })

/**
 * Rows: list items that carry an origin badge and do not contain another such
 * list item (A6). Nested lists for meanings or scale chips are excluded
 * because they hold no badge.
 */
const rows = (page, loc = EN) => {
  const badge = page.getByText(badgeRe(loc))
  return page
    .getByRole('listitem')
    .filter({ has: badge })
    .filter({ hasNot: page.getByRole('listitem').filter({ has: badge }) })
}

const rowFor = (page, code, loc = EN) =>
  rows(page, loc).filter({ has: page.getByText(codeRe(code)) })

const codeIn = (row, code) => row.getByText(codeRe(code)).first()

/** Chip group labelled "Jump to section" (A12). */
const chipGroup = (page, loc = EN) => page.getByLabel(loc.codes.jumpTo, { exact: true })
const chips = (page, loc = EN) => chipGroup(page, loc).getByRole('button')
const chip = (page, title, loc = EN) =>
  chips(page, loc).filter({ hasText: new RegExp('^\\s*' + esc(title.split(' ')[0])) })

/** An RST scale caption: may be prefixed with its letter, e.g. "R · Readability". */
const scaleName = (name) => new RegExp(esc(name) + '\\s*$')

/** The RST block: nearest ancestor of the RST heading that holds the suffix list. */
const rstBlock = (page, loc = EN) =>
  sectionHeading(page, loc === BG ? BG_RST.title : RST.title).locator(
    `xpath=ancestor::*[contains(normalize-space(.), "${loc.codes.rstSuffixes}")][1]`
  )

const navLink = (page, name) => page.getByRole('link', { name, exact: true })

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

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await waitScrollEnd(page)
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

async function expectStillOnCodes(page, message) {
  await expect(page, message).toHaveURL(/\/#\/codes$/)
}

const box = async (locator) => {
  const b = await locator.boundingBox()
  expect(b, 'element has a layout box').not.toBeNull()
  return b
}

async function expectNoHorizontalPageScroll(page, message) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, message).toBeLessThanOrEqual(0)
}

// Self-contained browser functions (serialised into the page).

/** Text contrast ratio of an element against its effective background (A13). */
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
  if (!fg0) return { ratio: NaN, bgLum: NaN }
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
  return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), bgLum: b }
}

const styleSignature = (el) => {
  const s = getComputedStyle(el)
  return [s.backgroundColor, s.color, s.borderColor, s.fontStyle, s.fontWeight].join('|')
}

/** Own background is white or near-white (all channels >= 240, opaque). */
const hasLightBackground = (el) => {
  const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/)
  if (!m) return false
  const p = m[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number)
  const a = p.length > 3 ? p[3] : 1
  return a > 0.5 && p[0] >= 240 && p[1] >= 240 && p[2] >= 240
}

const hasOverline = (el) => {
  const all = [el, ...el.querySelectorAll('*')]
  return (
    el.textContent.includes('̅') ||
    all.some((e) => {
      const s = getComputedStyle(e)
      return (
        s.textDecorationLine.includes('overline') ||
        (s.borderTopStyle !== 'none' && parseFloat(s.borderTopWidth) > 0)
      )
    })
  )
}

/** Visible text plus aria-label/title attributes, Morse glyphs normalised (A11). */
const morseText = (el) => {
  const attrs = [el, ...el.querySelectorAll('*')]
    .flatMap((e) => [e.getAttribute('aria-label'), e.getAttribute('title')])
    .filter(Boolean)
  return [el.innerText, ...attrs].join(' ')
}
const normaliseMorse = (s) =>
  s
    .replace(/[·•∙⋅●]/g, '.')
    .replace(/[−–—_▬]/g, '-')
    .replace(/\s+/g, '')

// ---------------------------------------------------------------------------

test.describe('Radio Codes page', () => {
  test.describe('A. Reaching the page', () => {
    // UC-01, UC-02
    test('should be reachable from the desktop and mobile navigation', async ({ page }) => {
      await page.goto('/')
      const desktopLinks = page.getByRole('navigation').first().getByRole('link')
      await expect(desktopLinks, 'UC-01: nav links in order').toHaveText([
        EN.nav.brand,
        EN.nav.logbook,
        EN.nav.examPrep,
        EN.nav.codes
      ])

      await navLink(page, EN.nav.codes).click()
      await expect(page, 'UC-01: URL').toHaveURL(/#\/codes$/)
      await expect(
        page.getByRole('heading', { level: 1, name: EN.codes.title }),
        'UC-01: page heading'
      ).toBeVisible()
      // A1: the active state is only a CSS class.
      await expect(navLink(page, EN.nav.codes), 'UC-01: link marked active').toHaveClass(
        /\bactive\b/
      )

      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/')
      await expect(navLink(page, EN.nav.codes), 'UC-02: desktop links hidden').toBeHidden()
      await page.getByRole('button', { name: EN.nav.menu }).click()
      await navLink(page, EN.nav.codes).click()
      await expect(page, 'UC-02: URL').toHaveURL(/#\/codes$/)
      await expect(
        page.getByRole('heading', { level: 1, name: EN.codes.title }),
        'UC-02: page heading'
      ).toBeVisible()
    })

    // UC-03
    test('should open from the Home feature card', async ({ page }) => {
      await page.goto('/')
      const cards = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 2 }) })
      await expect(cards).toHaveCount(3)

      const card = page.getByRole('link').filter({ hasText: EN.home.codes.description })
      await expect(card).toContainText(EN.home.codes.title)
      await expect(card).toHaveAttribute('href', '#/codes')

      await card.click()
      await expect(page).toHaveURL(/#\/codes$/)
      await expect(page.getByRole('heading', { level: 1, name: EN.codes.title })).toBeVisible()
    })

    // UC-04, UC-06
    test('should load by direct URL, survive a reload and 404 on unknown sub-routes', async ({
      page
    }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      for (const step of ['direct URL', 'reload']) {
        if (step === 'direct URL') await page.goto('/#/codes')
        else await page.reload()
        await expect(
          page.getByRole('heading', { level: 1, name: EN.codes.title }),
          `UC-04: h1 after ${step}`
        ).toBeVisible()
        for (const title of SECTION_TITLES) {
          await expect(sectionHeading(page, title), `UC-04: "${title}" after ${step}`).toBeVisible()
        }
      }
      expect(errors, 'UC-04: no console errors').toEqual([])

      await page.goto('/#/codes/xyz')
      await expect(
        page.getByRole('heading', { level: 1, name: EN.notFound.title }),
        'UC-06: Not Found page'
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { level: 1, name: EN.codes.title }),
        'UC-06: not the codes page'
      ).toHaveCount(0)
    })

    // UC-05, UC-51
    test('should keep history clean on jumps and start at the top when revisited', async ({
      page
    }) => {
      const urls = []
      page.on('framenavigated', (f) => f === page.mainFrame() && urls.push(f.url()))

      await page.goto('/')
      await navLink(page, EN.nav.codes).click()
      await expect(sectionHeading(page, RST.title)).toBeVisible()

      for (const title of SECTION_TITLES) {
        await chip(page, title).click()
        await waitScrollEnd(page)
      }
      await page.getByRole('button', { name: EN.codes.seeRst }).click()
      await waitScrollEnd(page)

      // A2: no in-page anchors in the URL at any point.
      for (const url of urls) {
        expect(new URL(url).hash, `UC-05: URL ${url} has no in-page anchor`).toMatch(
          /^(#\/|#\/codes)?$/
        )
      }

      await page.goBack()
      await expect(page, 'UC-05: Back leaves the page in one step').toHaveURL(/\/(#\/)?$/)
      await expect(
        page.getByRole('heading', { level: 1, name: EN.home.title }),
        'UC-05: Home after Back'
      ).toBeVisible()

      // UC-51: Codes -> LogBook -> Codes
      await navLink(page, EN.nav.codes).click()
      await chip(page, RST.title).click()
      await waitScrollEnd(page)
      await navLink(page, EN.nav.logbook).click()
      await expect(page).toHaveURL(/#\/logbook$/)
      await navLink(page, EN.nav.codes).click()
      await expect(rows(page), 'UC-51: all rows render again').toHaveCount(TOTAL)
      await waitScrollEnd(page)
      expect(
        await page.evaluate(() => window.scrollY),
        'UC-51: starts at the top'
      ).toBeLessThanOrEqual(1)
      await expect(
        page.getByRole('heading', { level: 1, name: EN.codes.title }),
        'UC-51: h1 in view'
      ).toBeInViewport()
    })
  })

  test.describe('B. Page structure', () => {
    // UC-07, UC-08, UC-09, UC-10
    test('should show header, total and sections in order with counts and intros', async ({
      page
    }) => {
      await openCodes(page)

      await expect(page.getByText(EN.codes.subtitle), 'UC-07: subtitle').toBeVisible()
      await expect(
        page.getByText(new RegExp(`(^|\\D)${esc(fill(EN.codes.total, TOTAL))}`)),
        `UC-07: total "${fill(EN.codes.total, TOTAL)}"`
      ).toBeVisible()

      // A4: one level-2 heading per section, titled from the data.
      const tops = []
      for (const title of SECTION_TITLES) {
        const h = sectionHeading(page, title)
        await expect(h, `UC-08: heading "${title}"`).toHaveCount(1)
        tops.push((await box(h)).y)
      }
      expect(tops, 'UC-08: section order').toEqual([...tops].sort((a, b) => a - b))

      // A5: count is a bare number in the heading text.
      for (const s of ROW_SECTIONS) {
        await expect(
          sectionHeading(page, s.title),
          `UC-09: "${s.title}" heading shows ${s.entries.length}`
        ).toHaveText(new RegExp(`(^|\\D)${s.entries.length}(\\D|$)`))
      }

      const all = [...ROW_SECTIONS, RST]
      for (let i = 0; i < all.length; i++) {
        const intro = page.getByText(all[i].intro, { exact: true })
        await expect(intro, `UC-10: intro of "${all[i].title}"`).toBeVisible()
        const y = (await box(intro)).y
        expect(y, `UC-10: intro below "${all[i].title}" heading`).toBeGreaterThan(tops[i])
        if (i + 1 < tops.length) {
          expect(y, `UC-10: intro above the next heading`).toBeLessThan(tops[i + 1])
        }
      }
    })

    // UC-11, UC-12
    test('should render one row per data entry, in order, each with its origin badge', async ({
      page
    }) => {
      await openCodes(page)
      const all = rows(page)

      // A6, A7, A8
      await expect(all, `UC-11: ${TOTAL} rows in total`).toHaveCount(TOTAL)
      for (let i = 0; i < ALL_ENTRIES.length; i++) {
        await expect(
          codeIn(all.nth(i), ALL_ENTRIES[i].code),
          `UC-11: row ${i + 1} is ${ALL_ENTRIES[i].code}`
        ).toBeVisible()
      }

      // Rows sit under their own section heading (layout-based, markup-free).
      const headingTops = []
      for (const title of SECTION_TITLES) {
        headingTops.push(
          await sectionHeading(page, title).evaluate(
            (el) => el.getBoundingClientRect().top + window.scrollY
          )
        )
      }
      const rowTops = await all.evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect().top + window.scrollY)
      )
      let i = 0
      ROW_SECTIONS.forEach((s, k) => {
        for (const e of s.entries) {
          expect(rowTops[i], `UC-11: ${e.code} is below "${s.title}"`).toBeGreaterThan(
            headingTops[k]
          )
          expect(rowTops[i], `UC-11: ${e.code} is above the next section`).toBeLessThan(
            headingTops[k + 1]
          )
          i++
        }
      })

      // UC-12: exactly one badge per row, matching the entry's origin.
      const labels = ORIGINS.map((o) => EN.codes.origin[o])
      const badgesPerRow = await all.evaluateAll(
        (els, labels) =>
          els.map((row) =>
            [row, ...row.querySelectorAll('*')]
              .filter((e) => e.children.length === 0 && labels.includes(e.textContent.trim()))
              .map((e) => e.textContent.trim())
          ),
        labels
      )
      expect(badgesPerRow, 'UC-12: one badge per row, matching origin').toEqual(
        ALL_ENTRIES.map((e) => [EN.codes.origin[e.origin]])
      )
      for (const o of ORIGINS) {
        await expect(
          page.getByText(EN.codes.origin[o], { exact: true }),
          `UC-12: "${EN.codes.origin[o]}" badges on the page`
        ).toHaveCount(countOrigin(ALL_ENTRIES, o))
      }
    })

    // No UC id yet: the ITU badge spells out its full name on hover
    test('should spell out ITU in the badge tooltip, in both languages', async ({ page }) => {
      await openCodes(page)
      const ituCount = countOrigin(ALL_ENTRIES, 'itu')

      for (const loc of [EN, BG]) {
        if (loc === BG) await switchLanguage(page, 'bg')
        const full = loc.codes.originFull.itu
        const tooltips = page.getByTitle(full, { exact: true })

        await expect(tooltips, `"${full}" on every ITU badge`).toHaveCount(ituCount)
        await expect(tooltips.first(), 'tooltip sits on the badge text').toHaveText(
          loc.codes.origin.itu
        )
        for (const o of ORIGINS.filter((x) => x !== 'itu')) {
          const titled = await page
            .getByText(loc.codes.origin[o], { exact: true })
            .evaluateAll((els) => els.filter((e) => e.closest('[title]')).length)
          expect(titled, `"${loc.codes.origin[o]}" badges carry no tooltip`).toBe(0)
        }
      }
    })
  })

  test.describe('C. Entry content', () => {
    // UC-14, UC-15, UC-16, UC-17, UC-18, UC-19
    test('should show Q-code questions, answers, usage, scales and notes', async ({ page }) => {
      await openCodes(page)

      // UC-14 (A9)
      const qrm = Q.entries.find((e) => e.code === 'QRM')
      const qrmRow = rowFor(page, 'QRM')
      await expect(qrmRow, 'UC-14: QRM row').toHaveCount(1)
      await expect(qrmRow, 'UC-14: QRM? + question').toContainText(
        new RegExp(`QRM\\?\\s*${esc(qrm.question)}`)
      )
      await expect(qrmRow, 'UC-14: QRM + answer').toContainText(
        new RegExp(`QRM\\s*${esc(qrm.answer)}`)
      )
      await expect(qrmRow, 'UC-14: On air + usage').toContainText(
        new RegExp(`${esc(EN.codes.onAir)}\\s*${esc(qrm.usage)}`)
      )
      await expect(qrmRow, 'UC-14: scale chips in order').toContainText(
        new RegExp(qrm.scale.map((s) => `${s.value}\\s*${esc(s.label)}`).join('[\\s\\S]*'))
      )

      // UC-15, UC-16, UC-18: every Q-code against its data.
      const scaleLabels = [
        ...new Set(Q.entries.flatMap((e) => (e.scale || []).map((s) => s.label)))
      ]
      const anyScaleChip = new RegExp(`(^|\\D)[1-9]\\s*(${scaleLabels.map(esc).join('|')})\\b`)
      for (const e of Q.entries) {
        const row = rowFor(page, e.code)
        await expect(row, `${e.code} row`).toHaveCount(1)
        if (e.question) {
          await expect(row, `${e.code}: question`).toContainText(e.question)
        }
        await expect(row, `${e.code}: answer`).toContainText(e.answer)
        if (e.note) await expect(row, `UC-18: ${e.code}: note`).toContainText(e.note)
        if (e.usage) {
          await expect(row, `UC-16: ${e.code}: usage line`).toContainText(
            new RegExp(`${esc(EN.codes.onAir)}\\s*${esc(e.usage)}`)
          )
        } else {
          await expect(row, `UC-16: ${e.code}: no usage line`).not.toContainText(EN.codes.onAir)
        }
        if (e.scale) {
          for (const s of e.scale) {
            await expect(row, `UC-15: ${e.code}: chip ${s.value} ${s.label}`).toContainText(
              new RegExp(`(^|\\D)${s.value}\\s*${esc(s.label)}`)
            )
          }
        } else {
          await expect(row, `UC-15: ${e.code}: no scale chips`).not.toContainText(anyScaleChip)
        }
      }
      await expect(
        rows(page).filter({ hasText: EN.codes.onAir }),
        'UC-16: usage lines only on Q-codes that have usage'
      ).toHaveCount(Q.entries.filter((e) => e.usage).length)

      // UC-17: Q-codes without a question form.
      for (const e of Q.entries.filter((x) => !x.question)) {
        const row = rowFor(page, e.code)
        await expect(row, `UC-17: ${e.code}: no question form`).not.toContainText(`${e.code}?`)
        await expect(
          row.getByText(EN.codes.origin[e.origin], { exact: true }),
          `UC-17: ${e.code}: badge`
        ).toBeVisible()
      }

      // UC-19: slang entry and its distinct badge.
      const slang = Q.entries.filter((e) => e.origin === 'slang')
      for (const e of slang) {
        await expect(
          rowFor(page, e.code).getByText(EN.codes.origin.slang, { exact: true }),
          `UC-19: ${e.code} has the Slang badge`
        ).toBeVisible()
      }
      const sig = (label) => page.getByText(label, { exact: true }).first().evaluate(styleSignature)
      const slangSig = await sig(EN.codes.origin.slang)
      expect(slangSig, 'UC-19: Slang badge differs from ITU').not.toBe(
        await sig(EN.codes.origin.itu)
      )
      expect(slangSig, 'UC-19: Slang badge differs from Amateur').not.toBe(
        await sig(EN.codes.origin.amateur)
      )
    })

    // UC-20, UC-21, UC-22, UC-26
    test('should show abbreviation meanings, notes, aliases and no stray RST rows', async ({
      page
    }) => {
      await openCodes(page)

      for (const e of ABBR.entries) {
        const row = rowFor(page, e.code)
        await expect(row, `${e.code} row`).toHaveCount(1)
        // A15: each meaning is its own element with exactly the meaning text.
        const tag = e.meanings.length > 1 ? 'UC-20 (multi-meaning)' : 'UC-20'
        for (const m of e.meanings) {
          await expect(
            row.getByText(m, { exact: true }),
            `${tag}: ${e.code} shows "${m}" as its own item`
          ).toBeVisible()
        }
        if (e.note) await expect(row, `UC-21: ${e.code}: note`).toContainText(e.note)
        if (e.aliases) {
          await expect(row, `UC-22: ${e.code}: aliases`).toContainText(
            fill(EN.codes.alsoKnownAs, e.aliases.join(', '))
          )
          for (const a of e.aliases) {
            await expect(
              rows(page).filter({ hasText: new RegExp(`^\\s*${esc(a)}\\b`) }),
              `UC-22: no separate row for alias ${a}`
            ).toHaveCount(0)
          }
        }
      }

      for (const code of RST.aliases.filter((a) => a !== '5NN')) {
        await expect(rowFor(page, code), `UC-26: no row for ${code}`).toHaveCount(0)
      }
      const fiveNN = rowFor(page, '5NN')
      await expect(fiveNN, 'UC-26: one 5NN row').toHaveCount(1)
      const y = (await box(fiveNN)).y
      expect(y, 'UC-26: 5NN row is in Abbreviations').toBeGreaterThan(
        (await box(sectionHeading(page, ABBR.title))).y
      )
      expect(y, 'UC-26: 5NN row is in Abbreviations').toBeLessThan(
        (await box(sectionHeading(page, PROSIGNS.title))).y
      )
    })

    // UC-23, UC-24
    test('should show prosigns overlined, with aliases, meanings and Morse', async ({ page }) => {
      await openCodes(page)

      for (const e of PROSIGNS.entries) {
        const row = rowFor(page, e.code)
        await expect(row, `${e.code} row`).toHaveCount(1)

        // A10
        expect(
          await codeIn(row, e.code).evaluate(hasOverline),
          `UC-23/24: ${e.code} is overlined`
        ).toBe(true)

        for (const m of e.meanings) {
          await expect(row.getByText(m, { exact: true }), `UC-23: ${e.code}: "${m}"`).toBeVisible()
        }
        if (e.note) await expect(row, `UC-23: ${e.code}: note`).toContainText(e.note)

        if (e.aliases) {
          await expect(row, `UC-24: ${e.code}: aliases`).toContainText(
            fill(EN.codes.alsoKnownAs, e.aliases.join(', '))
          )
        } else {
          await expect(row, `UC-24: ${e.code}: no alias text`).not.toContainText(
            fill(EN.codes.alsoKnownAs, '').trim()
          )
        }

        // A11
        const text = normaliseMorse(await row.evaluate(morseText))
        expect(text, `UC-23/24: ${e.code} shows Morse ${e.morse}`).toContain(e.morse)
      }
    })

    // UC-25
    test('should show number codes with meanings, notes and badges', async ({ page }) => {
      await openCodes(page)
      for (const e of NUMBERS.entries) {
        const row = rowFor(page, e.code)
        await expect(row, `UC-25: ${e.code} row`).toHaveCount(1)
        for (const m of e.meanings) {
          await expect(row.getByText(m, { exact: true }), `UC-25: ${e.code}: "${m}"`).toBeVisible()
        }
        if (e.note) await expect(row, `UC-25: ${e.code}: note`).toContainText(e.note)
        await expect(
          row.getByText(EN.codes.origin[e.origin], { exact: true }),
          `UC-25: ${e.code}: badge`
        ).toBeVisible()
      }
    })
  })

  test.describe('D. RST block', () => {
    // UC-27, UC-28, UC-29, UC-30
    test('should explain RST formats, scales and suffixes without rows or badges', async ({
      page
    }) => {
      await openCodes(page)
      const rst = rstBlock(page)
      await expect(rst, 'RST block found').toHaveCount(1)
      const text = await rst.evaluate((el) => el.innerText)

      for (const f of RST.formats) {
        // Compare case-insensitively: CSS may change how the label looks, not what it says
        expect(text.toLowerCase(), `UC-27: format "${f.mode}"`).toContain(f.mode.toLowerCase())
        await expect(
          rst.getByText(f.example, { exact: true }),
          `UC-27: example ${f.example}`
        ).toBeVisible()
        expect(text, `UC-27: description of ${f.example}`).toContain(f.description)
      }

      for (const s of RST.scales) {
        await expect(rst.getByText(scaleName(s.name)), `UC-28: scale "${s.name}"`).toBeVisible()
        for (const v of s.values) {
          expect(text, `UC-28: ${s.name} ${v.value} = "${v.label}"`).toMatch(
            new RegExp(`(^|\\D)${v.value}\\W*${esc(v.label)}(\\W|$)`)
          )
        }
        if (s.note) expect(text, `UC-28: ${s.name} note`).toContain(s.note)
      }

      await expect(
        rst.getByText(EN.codes.rstSuffixes, { exact: true }),
        'UC-29: suffix heading'
      ).toBeVisible()
      expect(text, 'UC-29: suffix letters in order with meanings').toMatch(
        new RegExp(RST.suffixes.map((s) => `\\b${s.letter}\\W*${esc(s.meaning)}`).join('[\\s\\S]*'))
      )

      await expect(rst.getByText(badgeRe(EN)), 'UC-30: no origin badge in RST').toHaveCount(0)
      const rstTop = (await box(sectionHeading(page, RST.title))).y
      for (const s of ROW_SECTIONS) {
        expect((await box(sectionHeading(page, s.title))).y, 'UC-30: RST is last').toBeLessThan(
          rstTop
        )
      }
    })
  })

  test.describe('E. Jump navigation', () => {
    // UC-31, UC-32, UC-33
    test('should jump to each section from the sticky chips', async ({ page }) => {
      await openCodes(page)

      // A12, A16
      const expected = SECTION_TITLES.map((t) =>
        t === RST.title ? /^\s*RST( signal reports)?\s*$/ : new RegExp(`^\\s*${esc(t)}\\s*$`)
      )
      await expect(chips(page), 'UC-31: five chips, in order, titles only').toHaveText(expected)
      for (let i = 0; i < SECTION_TITLES.length; i++) {
        await expect(chips(page).nth(i), `UC-31: chip ${i + 1} enabled`).toBeEnabled()
      }

      const order = [...SECTION_TITLES, ...[...SECTION_TITLES].reverse()]
      for (const title of order) {
        await chip(page, title).click()
        await waitScrollEnd(page)
        await expectUnobscured(sectionHeading(page, title), `UC-32: "${title}" heading in view`)
        await expectStillOnCodes(page, `UC-32: URL unchanged after "${title}"`)
      }

      // UC-33
      await chip(page, RST.title).click()
      await waitScrollEnd(page)
      await expect(chipGroup(page), 'UC-33: chips visible at the bottom').toBeInViewport()
      await expectUnobscured(chip(page, Q.title), 'UC-33: Q-codes chip not covered')
      await chip(page, Q.title).click()
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, Q.title), 'UC-33: back to Q-codes')
    })

    // UC-34, UC-36
    test('should jump by keyboard from chips and the See RST button', async ({ page }) => {
      await openCodes(page)

      await scrollToTop(page)
      await expect(sectionHeading(page, PROSIGNS.title)).not.toBeInViewport()
      await chip(page, ABBR.title).focus()
      await page.keyboard.press('Tab')
      await expect(chip(page, PROSIGNS.title), 'UC-34: Tab reaches Prosigns chip').toBeFocused()
      await page.keyboard.press('Enter')
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, PROSIGNS.title), 'UC-34: Enter jumps')

      await scrollToTop(page)
      await expect(sectionHeading(page, NUMBERS.title)).not.toBeInViewport()
      await chip(page, NUMBERS.title).focus()
      await page.keyboard.press('Space')
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, NUMBERS.title), 'UC-34: Space jumps')

      await scrollToTop(page)
      const seeRst = page.getByRole('button', { name: EN.codes.seeRst })
      await seeRst.focus()
      await expect(seeRst, 'UC-36: See RST is focusable').toBeFocused()
      await waitScrollEnd(page)
      await expect(sectionHeading(page, RST.title)).not.toBeInViewport()
      await page.keyboard.press('Enter')
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, RST.title), 'UC-36: Enter jumps to RST')
      await expectStillOnCodes(page, 'UC-36: URL unchanged')
    })

    // UC-35
    test('should jump from the 5NN row to RST', async ({ page }) => {
      await openCodes(page)
      const seeRst = page.getByRole('button', { name: EN.codes.seeRst, exact: true })
      const pointers = ALL_ENTRIES.filter((e) => e.see === 'rst')
      await expect(seeRst, 'UC-35: one See RST button per pointer').toHaveCount(pointers.length)
      for (const e of pointers) {
        await expect(
          rowFor(page, e.code).getByRole('button', { name: EN.codes.seeRst, exact: true }),
          `UC-35: button inside ${e.code}`
        ).toHaveCount(1)
      }

      await seeRst.first().click()
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, RST.title), 'UC-35: RST heading in view')
      await expectStillOnCodes(page, 'UC-35: URL unchanged')
    })
  })

  test.describe('F. Bulgarian UI', () => {
    // UC-37, UC-38
    test('should show Bulgarian labels and Bulgarian code data', async ({ page }) => {
      await page.goto('/')
      await switchLanguage(page, 'bg')
      await navLink(page, BG.nav.codes).click()
      await expect(page).toHaveURL(/#\/codes$/)

      await expect(
        page.getByRole('heading', { level: 1, name: BG.codes.title }),
        'UC-37: h1'
      ).toBeVisible()
      await expect(page.getByText(BG.codes.subtitle), 'UC-37: subtitle').toBeVisible()
      await expect(
        page.getByText(new RegExp(`(^|\\D)${esc(fill(BG.codes.total, TOTAL))}`)),
        'UC-37: total'
      ).toBeVisible()
      await expect(chipGroup(page, BG), 'UC-37: chip group label').toBeVisible()
      await expect(
        rows(page, BG).filter({ hasText: BG.codes.onAir }),
        'UC-37: usage label'
      ).toHaveCount(Q.entries.filter((e) => e.usage).length)
      for (const e of [...ABBR.entries, ...PROSIGNS.entries].filter((x) => x.aliases)) {
        await expect(rowFor(page, e.code, BG), `UC-37: ${e.code} aliases`).toContainText(
          fill(BG.codes.alsoKnownAs, e.aliases.join(', '))
        )
      }
      await expect(
        page.getByRole('button', { name: BG.codes.seeRst, exact: true }),
        'UC-37: See RST button'
      ).toHaveCount(ALL_ENTRIES.filter((e) => e.see).length)
      await expect(
        page.getByText(BG.codes.rstSuffixes, { exact: true }),
        'UC-37: suffix heading'
      ).toBeVisible()
      for (const o of ORIGINS) {
        await expect(
          page.getByText(BG.codes.origin[o], { exact: true }),
          `UC-37: "${BG.codes.origin[o]}" badges`
        ).toHaveCount(countOrigin(ALL_ENTRIES, o))
      }

      // No English UI labels left.
      for (const o of ORIGINS) {
        await expect(
          page.getByText(EN.codes.origin[o], { exact: true }),
          `UC-37: no English "${EN.codes.origin[o]}"`
        ).toHaveCount(0)
      }
      await expect(page.getByText(EN.codes.onAir), 'UC-37: no "On air:"').toHaveCount(0)
      await expect(
        page.getByText(new RegExp(`^\\s*${esc(fill(EN.codes.alsoKnownAs, ''))}`)),
        'UC-37: no "also …"'
      ).toHaveCount(0)
      await expect(
        page.getByRole('button', { name: EN.codes.seeRst }),
        'UC-37: no English See RST'
      ).toHaveCount(0)
      await expect(page.getByText(EN.codes.rstSuffixes), 'UC-37: no "Suffix letters"').toHaveCount(
        0
      )
      await expect(page.getByText(EN.codes.subtitle), 'UC-37: no English subtitle').toHaveCount(0)

      // UC-38: the code data is the Bulgarian translation, the codes themselves unchanged.
      await expect(rows(page, BG), 'UC-38: all rows present').toHaveCount(TOTAL)
      for (const s of [...BG_ROW_SECTIONS, BG_RST]) {
        await expect(sectionHeading(page, s.title), `UC-38: heading "${s.title}"`).toBeVisible()
        await expect(
          page.getByText(s.intro, { exact: true }),
          `UC-38: intro "${s.title}"`
        ).toBeVisible()
      }
      const qth = BG_Q.entries.find((e) => e.code === 'QTH')
      await expect(rowFor(page, 'QTH', BG), 'UC-38: QTH question').toContainText(qth.question)
      for (const m of BG_ABBR.entries.find((e) => e.code === 'GA').meanings) {
        await expect(rowFor(page, 'GA', BG), `UC-38: GA "${m}"`).toContainText(m)
      }
      const rst = rstBlock(page, BG)
      for (const s of BG_RST.scales) {
        await expect(rst.getByText(scaleName(s.name)), `UC-38: scale "${s.name}"`).toBeVisible()
        await expect(rst, `UC-38: "${s.values[0].label}"`).toContainText(s.values[0].label)
      }

      // No English code data left.
      for (const s of [...ROW_SECTIONS, RST]) {
        await expect(
          page.getByText(s.intro, { exact: true }),
          `UC-38: no English intro "${s.title}"`
        ).toHaveCount(0)
      }
      await expect(rowFor(page, 'QTH', BG), 'UC-38: no English QTH question').not.toContainText(
        Q.entries.find((e) => e.code === 'QTH').question
      )
    })

    // UC-39, UC-40
    test('should switch language live on the page and keep it after reload', async ({ page }) => {
      await openCodes(page)
      await chip(page, PROSIGNS.title).click()
      await waitScrollEnd(page)

      const h1 = (loc) => page.getByRole('heading', { level: 1, name: loc.codes.title })
      const sk = (loc) => rowFor(page, 'SK', loc)

      await switchLanguage(page, 'bg')
      await expect(h1(BG), 'UC-39: BG h1').toBeVisible()
      await expect(sk(BG), 'UC-39: BG alias label').toContainText(fill(BG.codes.alsoKnownAs, 'VA'))
      await expect(rows(page, BG), 'UC-39: rows intact in BG').toHaveCount(TOTAL)

      await switchLanguage(page, 'en')
      await expect(h1(EN), 'UC-39: EN h1').toBeVisible()
      await expect(sk(EN), 'UC-39: EN alias label').toContainText(fill(EN.codes.alsoKnownAs, 'VA'))
      await expect(rows(page, EN), 'UC-39: rows intact in EN').toHaveCount(TOTAL)

      await chip(page, NUMBERS.title).click()
      await waitScrollEnd(page)
      await expectUnobscured(
        sectionHeading(page, NUMBERS.title),
        'UC-39: chips still work after switching'
      )

      await switchLanguage(page, 'bg')
      await expect(h1(BG)).toBeVisible()
      await page.reload()
      await expect(h1(BG), 'UC-40: still Bulgarian after reload').toBeVisible()
    })
  })

  test.describe('G. Themes', () => {
    /** Open the page already in the given theme, so no colour is caught mid-transition. */
    const openInTheme = async (page, scheme) => {
      await page.emulateMedia({ colorScheme: scheme })
      await openCodes(page)
      const html = page.locator('html')
      if ((await html.getAttribute('data-theme')) !== scheme) {
        await page.getByRole('button', { name: EN.nav.toggleTheme }).click()
        // Buttons animate their colours; let that finish before measuring
        await page.waitForTimeout(300)
      }
      await expect(html, `UC-41: ${scheme} theme active`).toHaveAttribute('data-theme', scheme)
    }

    // UC-41
    for (const scheme of ['light', 'dark']) {
      test(`should keep text readable in ${scheme} theme`, async ({ page }) => {
        await openInTheme(page, scheme)

        const h1 = page.getByRole('heading', { level: 1, name: EN.codes.title })
        const { bgLum } = await h1.evaluate(contrastInPage)
        if (scheme === 'dark') {
          expect(bgLum, 'UC-41: page background is dark').toBeLessThan(0.2)
        } else {
          expect(bgLum, 'UC-41: page background is light').toBeGreaterThan(0.8)
        }

        const qrm = rowFor(page, 'QRM')
        const samples = {
          h1,
          'section intro': page.getByText(Q.intro, { exact: true }),
          code: codeIn(qrm, 'QRM'),
          meaning: rowFor(page, 'GA').getByText('Go ahead', { exact: true }),
          note: page.getByText(ABBR.entries.find((e) => e.code === 'KN').note),
          'scale chip': qrm.getByText(/none/).first(),
          'ITU badge': page.getByText(EN.codes.origin.itu, { exact: true }).first(),
          'Amateur badge': page.getByText(EN.codes.origin.amateur, { exact: true }).first(),
          'Slang badge': page.getByText(EN.codes.origin.slang, { exact: true }).first(),
          'jump chip': chip(page, Q.title),
          'See RST button': page.getByRole('button', { name: EN.codes.seeRst }),
          'RST scale label': rstBlock(page).getByText(RST.scales[0].values[4].label).first()
        }
        // Collect every failure, so one run reports all low-contrast elements
        const low = []
        for (const [name, loc] of Object.entries(samples)) {
          const { ratio } = await loc.evaluate(contrastInPage)
          if (!(ratio >= 4.5)) low.push(`${name}: ${ratio.toFixed(2)}`)
        }
        expect(low, `UC-41: elements below 4.5:1 in ${scheme} theme`).toEqual([])
      })
    }

    // UC-42
    test('should have no light islands in dark theme', async ({ page }) => {
      await openInTheme(page, 'dark')

      const lightRows = []
      for (const r of await rows(page).all()) {
        if (await r.evaluate(hasLightBackground)) {
          lightRows.push((await r.textContent()).trim().slice(0, 20))
        }
      }
      expect(lightRows, 'UC-42: no rows with a white background').toEqual([])
      for (const [name, loc] of Object.entries({
        toolbar: chipGroup(page),
        'jump chip': chip(page, Q.title),
        'RST block': rstBlock(page)
      })) {
        expect(await loc.evaluate(hasLightBackground), `UC-42: ${name} not white`).toBe(false)
      }

      const sig = (label) => page.getByText(label, { exact: true }).first().evaluate(styleSignature)
      const slangSig = await sig(EN.codes.origin.slang)
      expect(slangSig, 'UC-42: Slang distinct from ITU').not.toBe(await sig(EN.codes.origin.itu))
      expect(slangSig, 'UC-42: Slang distinct from Amateur').not.toBe(
        await sig(EN.codes.origin.amateur)
      )
    })
  })

  test.describe('H. Layout', () => {
    // UC-43, UC-44, UC-45, UC-46, UC-47
    test('should fit phone widths with stacked rows and a sideways chip row', async ({ page }) => {
      for (const width of [320, 375, 640]) {
        await page.setViewportSize({ width, height: 800 })
        await openCodes(page)
        await expectNoHorizontalPageScroll(page, `UC-43: no page scroll at ${width}px (top)`)
        const overflowing = await rows(page).evaluateAll((els) =>
          els
            .filter((e) => e.scrollWidth > e.clientWidth + 1)
            .map((e) => e.textContent.trim().slice(0, 20))
        )
        expect(overflowing, `UC-43: no row overflows at ${width}px`).toEqual([])
        const rstOverflow = await rstBlock(page).evaluate((el) => el.scrollWidth - el.clientWidth)
        expect(rstOverflow, `UC-43: RST block fits at ${width}px`).toBeLessThanOrEqual(1)

        await chip(page, RST.title).scrollIntoViewIfNeeded()
        await chip(page, RST.title).click()
        await waitScrollEnd(page)
        await expectNoHorizontalPageScroll(page, `UC-43: no page scroll at ${width}px (RST)`)
      }

      await page.setViewportSize({ width: 375, height: 812 })
      await openCodes(page)

      // UC-44
      const chipTops = await chips(page).evaluateAll((els) =>
        els.map((e) => Math.round(e.getBoundingClientRect().top))
      )
      expect(chipTops.length, 'UC-44: five chips').toBe(SECTION_TITLES.length)
      for (const t of chipTops) {
        expect(Math.abs(t - chipTops[0]), 'UC-44: chips on one line').toBeLessThanOrEqual(2)
      }
      await chip(page, RST.title).scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => window.scrollX), 'UC-44: page did not scroll sideways').toBe(
        0
      )
      await chip(page, RST.title).click()
      await waitScrollEnd(page)
      await expectUnobscured(sectionHeading(page, RST.title), 'UC-44: RST chip jumps at 375px')

      // UC-45, UC-46 (A8, A9)
      const qrm = Q.entries.find((e) => e.code === 'QRM')
      const row = rowFor(page, 'QRM')
      await row.scrollIntoViewIfNeeded()
      const code = await box(codeIn(row, 'QRM'))
      const badge = await box(row.getByText(EN.codes.origin.itu, { exact: true }))
      const question = await box(row.getByText(qrm.question).first())
      const answer = await box(row.getByText(qrm.answer).first())
      expect(
        Math.min(code.y + code.height, badge.y + badge.height) - Math.max(code.y, badge.y),
        'UC-45: code and badge share the top line'
      ).toBeGreaterThan(0)
      expect(question.y, 'UC-45: content starts below the code').toBeGreaterThanOrEqual(
        code.y + code.height - 1
      )
      expect(answer.y, 'UC-46: answer below question').toBeGreaterThanOrEqual(
        question.y + question.height - 1
      )

      // UC-47: each scale starts below the previous scale's last value.
      const rst = rstBlock(page)
      for (let i = 1; i < RST.scales.length; i++) {
        const prev = RST.scales[i - 1]
        const prevLast = await box(rst.getByText(prev.values[prev.values.length - 1].label).first())
        const name = await box(rst.getByText(scaleName(RST.scales[i].name)))
        expect(
          name.y,
          `UC-47: "${RST.scales[i].name}" below "${prev.name}"`
        ).toBeGreaterThanOrEqual(prevLast.y + prevLast.height - 1)
      }
    })

    // UC-48
    test('should lay out rows and RST scales side by side on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await openCodes(page)

      const qrm = Q.entries.find((e) => e.code === 'QRM')
      const row = rowFor(page, 'QRM')
      await row.scrollIntoViewIfNeeded()
      const code = await box(codeIn(row, 'QRM'))
      const question = await box(row.getByText(qrm.question).first())
      const badge = await box(row.getByText(EN.codes.origin.itu, { exact: true }))
      expect(question.x, 'UC-48: content right of code').toBeGreaterThan(code.x + code.width - 1)
      expect(badge.x, 'UC-48: badge right of content start').toBeGreaterThan(question.x)
      expect(
        Math.min(code.y + code.height, question.y + question.height) - Math.max(code.y, question.y),
        'UC-48: code and content on one line'
      ).toBeGreaterThan(0)

      // A14
      const rst = rstBlock(page)
      const names = []
      for (const s of RST.scales) names.push(await box(rst.getByText(scaleName(s.name))))
      for (let i = 1; i < names.length; i++) {
        expect(Math.abs(names[i].y - names[0].y), 'UC-48: RST scales on one row').toBeLessThan(5)
        expect(names[i].x, 'UC-48: RST scales side by side').toBeGreaterThan(names[i - 1].x)
      }
    })
  })

  test.describe('I. Robustness', () => {
    // UC-50
    test('should log no errors across languages, themes and jumps', async ({ page }) => {
      const problems = []
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
      page.on('requestfailed', (r) => !isAnalytics(r.url()) && problems.push(`failed: ${r.url()}`))
      page.on(
        'response',
        (r) =>
          r.status() >= 400 && !isAnalytics(r.url()) && problems.push(`${r.status()}: ${r.url()}`)
      )

      const clickAllChips = async (loc) => {
        for (const title of loc === BG ? BG_SECTION_TITLES : SECTION_TITLES) {
          await chip(page, title, loc).click()
          await waitScrollEnd(page)
        }
      }

      await openCodes(page)
      await clickAllChips(EN)
      await switchLanguage(page, 'bg')
      await expect(page.getByRole('heading', { level: 1, name: BG.codes.title })).toBeVisible()
      await clickAllChips(BG)
      await page.getByRole('button', { name: BG.nav.toggleTheme }).click()
      await clickAllChips(BG)
      await switchLanguage(page, 'en')
      await clickAllChips(EN)

      expect(problems, 'UC-50: no errors').toEqual([])
    })
  })
})
