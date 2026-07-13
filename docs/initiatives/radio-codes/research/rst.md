# RST — the signal-report system

**Included in v1 per decision (2026-07-13), for completeness.** Note the shape:
RST is **not a lookup vocabulary**, it's a **rating system**. "59" isn't a code
you decode — it's a score you compute from what you're hearing. So it belongs as
an **explainer + three scales**, not as flat "59 = …" table rows.

## What it is

**R-S-T = Readability, Strength, Tone.** A signal report exchanged during a
contact to tell the other operator how well you're receiving them.

- **Voice (phone):** two digits — R and S (e.g. **"59"**).
- **CW / digital:** three digits — R, S and T (e.g. **"599"**).
- **Contests:** T and S often spoken as **"5NN"** (`N` = 9, faster to send).

History: devised by **Arthur W. Braaten (W2BSR) in 1934**; influenced the 1938 ITU
Radio Regulations.

## Readability (R): 1–5

| R | Meaning |
|---|---|
| 1 | Unreadable |
| 2 | Barely readable, occasional words |
| 3 | Readable with considerable difficulty |
| 4 | Readable with practically no difficulty |
| 5 | Perfectly readable |

## Signal strength (S): 1–9

| S | Meaning |
|---|---|
| 1 | Faint, barely perceptible |
| 2 | Very weak |
| 3 | Weak |
| 4 | Fair |
| 5 | Fairly good |
| 6 | Good |
| 7 | Moderately strong |
| 8 | Strong |
| 9 | Extremely strong |

(On HF, **S9 ≈ 50 µV** at the receiver input, 50 Ω. Signals over S9 are reported
as "S9 + xx dB".)

## Tone (T): 1–9 — CW/digital only

Quality of a Morse note, from **1 = extremely rough** (raw AC hum) to **9 =
perfect, pure tone, no ripple or modulation**. **Omitted for voice.** With modern
rigs almost everything is "9," so T is nearly always 9 in practice.

## Optional suffix letters

Appended to flag a defect: **A** (auroral distortion), **C** (chirp), **K** (key
clicks), **X** (stable/crystal-controlled).

## Sources

- [R-S-T system — Wikipedia](https://en.wikipedia.org/wiki/R-S-T_system)
