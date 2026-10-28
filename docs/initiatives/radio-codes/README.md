# Radio Codes Reference

_One-page brief. See docs/ways-of-working.md._

**Status:** proposed
**Board:** _(to be created)_

## Context / Why

Amateur operators constantly use shorthand — Q-codes (QRM, QTH, QSY), number
codes (73, 88), and on-air abbreviations (CQ, DE, OM, YL) — but a newcomer, or
anyone mid-QSO, often has to look them up somewhere off-app. LZ Radio already
serves LZ operators (LogBook, exam prep); a quick, offline, bilingual codes
reference is a natural, low-cost addition that keeps them in one app.

People reach for it three ways:

- **Forward lookup** — I have the code, I want the meaning. (Hear "tell me your
  QTH" on the radio, don't know what QTH is.)
- **Reverse lookup** — I have the meaning, I want the code. (Know there's a
  Q-code for location, search "location" to find `QTH`.)
- **Browse** — no target in mind, just show me what exists and let me learn.

## Goals

- A standalone reference page listing the common on-air codes with their
  meanings, in both English and Bulgarian, supporting all three access patterns:
  forward lookup (by code), **reverse lookup (by meaning/keyword)**, and browse.
  Reverse lookup is called out because it's the non-trivial one — it means
  searching over meaning text, not just code strings, and it must not get
  dropped under time pressure.
- Q-codes represented in **both** forms — the interrogative and the affirmative
  (`QRM?` = "Is my transmission being interfered with?" / `QRM` = "Your
  transmission is being interfered with") — so the reference is actually correct, not flattened.
- Fully offline and client-side, consistent with the rest of the app; static
  data files following the existing `data_en/` + `data_bg/` pattern.

## Non-goals

<!-- Proposed — needs PO/PM + Maintainer agreement before it's binding. -->

- No user-editable or user-added entries. Curated, read-only data.
- No per-country / per-region code variants. Standard ITU + common ham usage.
- No RST calculator. RST is explained (formats, scales, suffix letters), not
  computed.
- No integration into LogBook contact entry (autocomplete, inline lookup) in
  v1. Standalone page only; integration is a possible later initiative.
- Not a Morse/CW trainer. Codes only, not code _learning_.

## Success measure

<!--
Honest constraint: analytics are pageview-level only and production-only
(GoatCounter/Umami), so the strongest available signal is traffic to the codes
route. No per-user behaviour is tracked, by design.
-->

- **Measure:** pageviews on the codes route once live (does anyone use it), plus
  issues/feedback filed. If that's too thin to bother with, we state the honest
  version: built because it's obviously useful to LZ operators.
- **Outcome:** _(filled in when the initiative closes)_

## Decisions log

<!-- Newest at top. Items below are proposed, pending PO/PM sign-off. -->

- **2026-10-28** — Bulgarian code data added (`data_bg/codes/`). The Bulgarian
  page searches Bulgarian meaning text only (codes match in any language), so
  `location` finds nothing there and `местонахождение` finds QTH. Wording comes
  from the exam question bank first, then the LZ2NB Q-code and CW lists
  (qsl.net/lz2nb), then our own (usage lines, notes, RST tone labels and
  suffixes). Pending review by a Bulgarian operator.

- **2026-10-28** — RST is in scope as an explainer block (report formats, the
  three scales, suffix letters), not as code rows: a report is worked out from
  what you hear, not looked up. `59`, `599`, `5NN` and `RST` find it by search.
- **2026-10-28** — English v1 ships 33 Q-codes (31 ITU, QST, QLF), 48
  abbreviations, 7 prosigns and the number codes 73 and 88. Left out: `55`
  (disputed; called CB slang by ON4UN/ON4WW), `33`, `161`, `30` and `QRRR` (no
  primary source found). The research files keep them, marked as not shipped.
- **2026-10-28** — Corrected the QRM example in Goals to the ITU wording (the
  question asks about _my_ transmission). The earlier receiver-side phrasing
  was wrong; see research/q-codes.md.

- **2026-10-28** — Resolved deep-linking (open since 2026-07-12) as a search
  link, not a per-code route: `/#/codes?q=qrm`. A link to one code is a search
  for it, so a single mechanism covers sharing a search and sharing a code, and
  there is no `/#/codes/:code` route to keep in sync with the data. The URL
  follows typing via `replace`, so the Back history is not filled.

- **2026-07-20** — Scoped the brief around three access patterns (forward /
  reverse / browse) from PO/PM use cases. Reverse lookup implies searching
  Bulgarian meaning text too, not just English — "search location" has to work
  in both languages or the feature silently works in one. Flagged here so it
  doesn't surprise us at build time; the search index must cover `data_bg/`.
- **2026-07-12** — _Proposed:_ model Q-codes as `{ code, question, answer }`
  from day one. Costs nothing now; retrofitting the dual form later means
  touching every row in both languages.
- **2026-07-12** — _Proposed:_ meanings written by us and sourced from the ITU
  Q-code allocation, not copied from a copyrighted glossary (project is MIT).
  Bulgarian phrasing follows conventional LZ usage; mine existing `data_bg/`
  exam content for vetted wording where it overlaps.
- **2026-07-12** — _Open (resolved 2026-10-28, see above):_ deep-linking to a single code. Hash routing forbids
  in-page anchors, so a shareable per-code link needs a route param
  (`/#/codes/qrm`); the alternative is a filter-only page with no deep links.
  Reuse the existing `logbookSearch.js` pattern for the filter either way.
