# Abbreviations & prosigns

Two related but **distinct** groups. Keep them separate.

- **Abbreviations** — shortened words/phrases sent as normal characters with
  normal spacing (`OM`, `ES`, `TNX`).
- **Prosigns** — two letters **run together as one symbol** (no inter-character
  gap) that act as punctuation/procedure signals (`AR`, `SK`). Morse-specific.

Checked against ITU-R M.1172, ITU-R M.1677-1 and the ON4UN/ON4WW operating
manual on 2026-10-13 — see [Verification notes](#verification-notes).

Wikipedia lists **~100** abbreviations; we should curate a **common** subset, not
ship all of them.

## Where the line is drawn

Sources disagree on a few signals, so the rule used here is the ITU one: a
signal is a prosign only if it is sent as one run-together symbol (written with
an overbar in the ITU text).

- `K`, `R`, `KN`, `BK` and `CL` are **abbreviations**. A single letter cannot be
  run together, ITU lists `BK` and `CL` without an overbar, and `KN` is not an
  ITU procedure signal at all.
- Each signal appears **once**. `K` and `R` were previously listed in both
  tables.

## Common CW abbreviations (curated starter set)

Meanings paraphrased. Several abbreviations have **more than one meaning**
(`GA`, `GD`, `CL`, `NR`, `SK`) — each is listed on its own line.

### Procedure

| Abbr | Meaning                         | Notes                                                                                              |
| ---- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| CQ   | General call to any station     |                                                                                                    |
| DE   | From / this is                  | Precedes the sender's call.                                                                        |
| K    | Invitation to transmit ("over") | Leaves the door open for any station.                                                              |
| KN   | Over to you only                | Only the named station should reply. Amateur usage, not ITU.                                       |
| BK   | Break                           | Quick back-and-forth without call signs; ITU: signal used to interrupt a transmission in progress. |
| R    | Received / roger                |                                                                                                    |
| CL   | Closing my station              | Also "call" (Wikipedia; not in the ITU text).                                                      |
| CFM  | Confirm / I confirm             |                                                                                                    |
| AGN  | Again                           |                                                                                                    |
| RPT  | Repeat                          |                                                                                                    |
| PSE  | Please                          |                                                                                                    |
| NR   | Number                          | Also "near".                                                                                       |
| HW   | How                             | Usually as `HW?` or `HW CPY?` = "how do you copy?"                                                 |
| CPY  | Copy                            |                                                                                                    |

### Courtesy and conversation

| Abbr              | Meaning                                    | Notes                                                                        |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| ES                | And                                        | From telegraph "&".                                                          |
| OM                | Old man (any male op)                      | Friendly, any age.                                                           |
| YL                | Young lady (female op)                     | Any age.                                                                     |
| XYL               | Wife                                       | "Ex-young lady".                                                             |
| FB                | Fine business (excellent)                  |                                                                              |
| UFB               | Ultra fine business                        |                                                                              |
| TU                | Thank you                                  |                                                                              |
| TNX / TKS         | Thanks                                     |                                                                              |
| SRI               | Sorry                                      |                                                                              |
| HI                | Laughter                                   | The CW "smiley".                                                             |
| GM / GA / GE / GN | Good morning / afternoon / evening / night |                                                                              |
| GA                | Go ahead                                   | Second meaning of `GA`.                                                      |
| GD                | Good day                                   | Also "good".                                                                 |
| GL                | Good luck                                  |                                                                              |
| CUL               | See you later                              |                                                                              |
| UR                | Your                                       |                                                                              |
| HR                | Here                                       |                                                                              |
| VY                | Very                                       |                                                                              |
| WID               | With                                       | Attested in use ("SKED WID …") but absent from the reference tables checked. |
| GUD               | Good                                       |                                                                              |
| NW                | Now                                        |                                                                              |

### Station and conditions

| Abbr    | Meaning                         | Notes |
| ------- | ------------------------------- | ----- |
| DX      | Long distance / distant station |       |
| WX      | Weather                         |       |
| RIG     | Station equipment               |       |
| ANT     | Antenna                         |       |
| RX / TX | Receiver / transmitter          |       |
| TRX     | Transceiver                     |       |
| PWR     | Power                           |       |
| OP      | Operator                        |       |
| RPRT    | Report                          |       |

`RST`, `59`, `599` and `5NN` are not abbreviation rows: they are searchable
entries that point to the RST section (see [`rst.md`](rst.md)).

## Prosigns

Written with an overbar in Morse literature (shown here as run-together). The
same sound can be spelled with different letters, so each prosign is **one
entry with aliases** — searching either spelling must find it.

| Prosign | Aliases | Meaning                                   | ITU name                        | Morse      |
| ------- | ------- | ----------------------------------------- | ------------------------------- | ---------- |
| AR      |         | End of transmission / end of message      | Cross sign; end of transmission | `.-.-.`    |
| SK      | VA      | End of contact                            | End of work                     | `...-.-`   |
| AS      |         | Wait / stand by                           | Wait                            | `.-...`    |
| BT      |         | Separator between parts of a transmission | Double hyphen                   | `-...-`    |
| KA      | CT      | Start of transmission / attention         | Starting signal                 | `-.-.-`    |
| SN      | VE      | Understood                                | Understood                      | `...-.`    |
| HH      |         | Error, correction follows                 | Error (eight dots)              | `........` |

ITU names its signals by function and spells the letter forms `VA` and `KA`;
`SK` and `CT` are the amateur spellings. `SK` is also used as an abbreviation
for "silent key" (a deceased operator).

## Verification notes

- **KN** was listed as a standard prosign. It is in neither ITU document — its
  Morse pattern is the left bracket — and ON4UN states that `KN` and `BK` are
  not prosigns. Moved to abbreviations.
- **BK** was described as "invite the other station to interrupt". Corrected.
- **CL** was missing.
- **GA** had only "good afternoon"; "go ahead" added.
- **HW** was glossed as "How do you copy?"; on its own it means "how".
- **WID** could not be found in a reference table, only in an example QSO.
- Added from ON4UN's "most used" list: `AGN`, `CPY`, `GD`, `GL`, `NW`, `OP`,
  `PWR`, `RPT`, `RPRT`, `SRI`, `TRX`, `UFB`, `VY`.
- **Not verified:** the ARRL CW abbreviations sheet could not be retrieved, so
  `GUD`, `RIG` and the conversational entries rest on ON4UN and Wikipedia.

**Open:** final size of the abbreviation set for v1.

## Sources

- [Rec. ITU-R M.1172 — Miscellaneous abbreviations and signals](https://www.itu.int/rec/R-REC-M.1172/en) (primary)
- [Rec. ITU-R M.1677-1 — International Morse code](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en) (primary)
- [ON4UN / ON4WW — Ethics and Operating Procedures for the Radio Amateur (PDF)](https://www.uba.be/sites/default/files/media/files/eth-en-site-on-uba-1jul2008.pdf)
- [Morse code abbreviations — Wikipedia](https://en.wikipedia.org/wiki/Morse_code_abbreviations)
- [Prosigns for Morse code — Wikipedia](https://en.wikipedia.org/wiki/Prosigns_for_Morse_code)
- [The CW Operators Guide — Prosigns (PDF)](http://nerdpit.ca/ham/cw/CW-Operators-Guide.pdf)
- [CW Common Abbreviations (hamradio.me)](https://www.hamradio.me/operating-tips/cw-common-abbreviations.html)
