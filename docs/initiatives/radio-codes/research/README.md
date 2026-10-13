# Radio Codes — Research Findings

Deliverable for issue **#9 "Research: amateur radio codes landscape"**. These are
reference notes, not the app data model — we decide separately how to turn this
into `data_en/` + `data_bg/`. Detailed lists live in the sibling files; this page
is the summary and the resolved decisions.

Status: **draft** · last updated 2026-10-13 (source verification pass)

## Files

- [`q-codes.md`](q-codes.md) — Q-codes, with both interrogative and affirmative forms
- [`number-codes.md`](number-codes.md) — 73, 88, 33, 55, 161, 30 (telegraph-era number codes)
- [`abbreviations-and-prosigns.md`](abbreviations-and-prosigns.md) — CW abbreviations + prosigns
- [`rst.md`](rst.md) — the RST signal-report system

## The families at a glance

| Family | What it is | Structure | Telegraphy origin | Count (common ham subset) |
|---|---|---|---|---|
| **Q-codes** | 3-letter `Q__` codes | **Dual form** (question / answer), plus ham usage | Yes (1909→1912) | ~30 |
| **Number codes** | Numeric shorthand (73, 88…) | Single meaning | Yes (1859/1879) | ~6 |
| **Abbreviations** | Shortened words (CQ, ES, OM…) | One or more meanings | Yes (telegraph) | ~45 curated, of ~100 |
| **Prosigns** | Run-together procedure signals (AR, SK…) | Single meaning, with alias spellings | Yes | 7 |
| **RST** | Signal report (Readability/Strength/Tone) | **Rating scales**, not a lookup | Yes (1934) | 3 scales |

## Resolved open questions

1. **Interrogative vs. affirmative — confirmed.** Only **Q-codes** carry the dual
   form (`QRL?` = "Are you busy?" / `QRL` = "I am busy"). Number codes,
   abbreviations, and prosigns are single-meaning. RST is neither.

2. **RST — now IN scope** (per your call, for completeness). But it is a
   *rating system*, not a lookup vocabulary, so it is a short **explainer + the
   three scales**, not flat "59 = …" rows. See [`rst.md`](rst.md).

3. **Overlapping entries (2026-10-13).** Each signal appears once. `K` and `R`
   are abbreviations, not prosigns. Prosigns with two spellings (`SK`/`VA`,
   `KA`/`CT`, `SN`/`VE`) are one entry with aliases. `RST`, `59`, `599` and
   `5NN` are searchable pointers to the RST section.

## Source verification (2026-10-13)

The lists were checked against the two ITU recommendations (M.1172, M.1677-1),
the ARRL Q-signals sheet and the ON4UN/ON4WW operating manual. Each file has a
"Verification notes" section with the detail. What it means for the data model:

- **Q-codes have two layers** — the official ITU meaning and the on-air ham
  usage (`QRM`, `QRT`, `QRL`, `QTH`, `QSO`, `QSL`). They are now in separate
  columns.
- **An entry may have more than one meaning** (`GA`, `GD`, `CL`, `NR`, `SK`).
- **Five Q-codes carry a rating scale** (`QRK`, `QSA`, `QRM`, `QRN`, `QRI`).
- **Prosigns are only the run-together signals**; `K`, `KN`, `BK`, `R` and `CL`
  are abbreviations.

Still open: whether rare and slang Q-codes ship in v1, the final size of the
abbreviation set, and whether `55` stays (one source calls it CB slang).

Not verified against a primary source: `33`, `161`, `30`, `QLF`, `QRRR`, the
RST suffixes D/M/S, and the ARRL CW abbreviations sheet (could not be
retrieved).

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
[Rec. ITU-R M.1172](https://www.itu.int/rec/R-REC-M.1172/en) ·
[Rec. ITU-R M.1677-1](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en) ·
[ON4UN/ON4WW operating manual (PDF)](https://www.uba.be/sites/default/files/media/files/eth-en-site-on-uba-1jul2008.pdf) ·
[Q code (Wikipedia)](https://en.wikipedia.org/wiki/Q_code) ·
[Morse code abbreviations (Wikipedia)](https://en.wikipedia.org/wiki/Morse_code_abbreviations) ·
[R-S-T system (Wikipedia)](https://en.wikipedia.org/wiki/R-S-T_system) ·
[ARRL Q-Signals (PDF)](https://www.arrl.org/files/file/Get%20on%20the%20Air/Comm%20w%20Other%20Hams-Q%20Signals.pdf) ·
[On the Origin of "73" (signalharbor)](http://www.signalharbor.com/73.html)

**Licensing note:** meanings in these files are paraphrased for our own authoring.
Do not paste any single glossary's exact phrasing into the app (MIT project); cite
the ITU allocation and write our own wording. The ITU recommendations and the
ON4UN/ON4WW manual are themselves copyrighted, so the same rule applies to them.
