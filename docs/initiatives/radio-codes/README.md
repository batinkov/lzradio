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
  (`QRM?` = "Are you being interfered with?" / `QRM.` = "I am being
  interfered with") — so the reference is actually correct, not flattened.
- Fully offline and client-side, consistent with the rest of the app; static
  data files following the existing `data_en/` + `data_bg/` pattern.

## Non-goals

<!-- Proposed — needs PO/PM + Maintainer agreement before it's binding. -->

- No user-editable or user-added entries. Curated, read-only data.
- No per-country / per-region code variants. Standard ITU + common ham usage.
- No RST calculator. _(Open: whether RST appears at all — see questions.)_
- No integration into LogBook contact entry (autocomplete, inline lookup) in
  v1. Standalone page only; integration is a possible later initiative.
- Not a Morse/CW trainer. Codes only, not code *learning*.

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
- **2026-07-12** — _Open:_ deep-linking to a single code. Hash routing forbids
  in-page anchors, so a shareable per-code link needs a route param
  (`/#/codes/qrm`); the alternative is a filter-only page with no deep links.
  Reuse the existing `logbookSearch.js` pattern for the filter either way.
