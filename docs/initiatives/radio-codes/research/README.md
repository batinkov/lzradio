# Radio Codes — Research Findings

Deliverable for issue **#9 "Research: amateur radio codes landscape"**. These are
reference notes, not the app data model — we decide separately how to turn this
into `data_en/` + `data_bg/`. Detailed lists live in the sibling files; this page
is the summary and the resolved decisions.

Status: **draft** · last updated 2026-07-13

## Files

- [`q-codes.md`](q-codes.md) — Q-codes, with both interrogative and affirmative forms
- [`number-codes.md`](number-codes.md) — 73, 88, 33, 55, 161, 30 (telegraph-era number codes)
- [`abbreviations-and-prosigns.md`](abbreviations-and-prosigns.md) — CW abbreviations + prosigns
- [`rst.md`](rst.md) — the RST signal-report system

## The families at a glance

| Family | What it is | Structure | Telegraphy origin | Count (common ham subset) |
|---|---|---|---|---|
| **Q-codes** | 3-letter `Q__` codes | **Dual form** (question / answer) | Yes (1909→1912) | ~25–40 |
| **Number codes** | Numeric shorthand (73, 88…) | Single meaning | Yes (1859/1879) | ~6 |
| **Abbreviations** | Shortened words (CQ, ES, OM…) | Single meaning | Yes (telegraph) | ~80–100 |
| **Prosigns** | Run-together procedure signals (AR, SK…) | Single meaning, Morse-specific | Yes | ~8–12 |
| **RST** | Signal report (Readability/Strength/Tone) | **Rating scales**, not a lookup | Yes (1934) | 3 scales |

## Resolved open questions

1. **Interrogative vs. affirmative — confirmed.** Only **Q-codes** carry the dual
   form (`QRL?` = "Are you busy?" / `QRL` = "I am busy"). Number codes,
   abbreviations, and prosigns are single-meaning. RST is neither.

2. **RST — now IN scope** (per your call, for completeness). But it is a
   *rating system*, not a lookup vocabulary, so it is a short **explainer + the
   three scales**, not flat "59 = …" rows. See [`rst.md`](rst.md).

## Telegraphy origin (the "how many come from telegraphy" question)

**Essentially all of them.** Every family predates or coincides with early radio
and comes from landline/wireless telegraphy:
- Number codes → Western Union **92 code (1859)** / **Phillips Code (1879)**.
- Q-codes → British lists **c.1909**, formalized **1912/1913**, ITU-standardized **1947**.
- Prosigns & abbreviations → direct from telegraph practice.
- RST → **1934** (relatively late, but still pre-WWII CW).

There is no meaningful "modern voice-era invented code" group here — voice
operators simply reuse the CW-era vocabulary as spoken shorthand.

## Sources

See per-file "Sources" sections. Primary references:
[Q code (Wikipedia)](https://en.wikipedia.org/wiki/Q_code) ·
[Morse code abbreviations (Wikipedia)](https://en.wikipedia.org/wiki/Morse_code_abbreviations) ·
[R-S-T system (Wikipedia)](https://en.wikipedia.org/wiki/R-S-T_system) ·
[ARRL Q-Signals (PDF)](https://www.arrl.org/files/file/Get%20on%20the%20Air/Comm%20w%20Other%20Hams-Q%20Signals.pdf) ·
[On the Origin of "73" (signalharbor)](http://www.signalharbor.com/73.html)

**Licensing note:** meanings in these files are paraphrased for our own authoring.
Do not paste any single glossary's exact phrasing into the app (MIT project); cite
the ITU allocation and write our own wording.
