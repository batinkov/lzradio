# Ways of Working

How we collaborate on LZ Radio. Written once, shared across all initiatives.
Kept short on purpose — if it grows past one screen, we've added ceremony we
don't need.

We work async and remote, syncing in person only occasionally. This document
exists so that decisions don't require a meeting: when we can't turn and ask,
the answer is here.

## Roles & decision rights

Two roles. The point of this section is a single thing: **who has the final
call**, so an async disagreement never deadlocks.

- **Product Owner / Project Manager (PO/PM)** — one person, both hats. Owns the
  *what* and *why*: final call on backlog priority and scope (what's in, what's
  out), and grooms the board. As PM, also owns how the work is run — cadence,
  process, and keeping the board and docs healthy.
- **Maintainer** — owns the *how*. Final call on technical and implementation
  decisions (architecture, libraries, code).
- **Both** — changes to an initiative's **goals or non-goals** require
  agreement from both. These are the stable frame; they change rarely and never
  unilaterally.

When in doubt about which bucket a decision falls in, the person who'd own the
*consequence* owns the call.

## The board vs. the brief

Each initiative has its own folder, `docs/initiatives/<name>/`, whose `README.md`
is the one-page **brief** (it renders as the folder's landing page). Any
supporting artifacts (research notes, etc.) live in subfolders alongside it.

- **GitHub Project board** = the backlog. Priorities, grooming, issue detail.
  The PO/PM's domain. This is the "what's happening now" view.
- **The brief** = the stable frame and the paper trail. Why the initiative
  exists, what's out of scope, and what we decided along the way.

Backlog detail must not leak into the brief, and strategy must not live only in
issue comments. If either happens, we have two half-maintained versions of the
truth.

## Definition of Ready

An issue is ready to build when it has:

- A clear outcome — what's true when this is done.
- Acceptance criteria — how we'll know it's done.
- Scope check — it doesn't violate the initiative's non-goals (or the non-goals
  are updated first, by agreement).

If an issue isn't Ready, it stays in the backlog, not in progress.

## Definition of Done

Work is done when:

- Acceptance criteria are met.
- Unit tests cover new business logic (pure functions in `src/lib/`), and the
  suite passes (`npm test`).
- User-facing text is translated in **both** `en` and `bg` — no half-translated
  releases.
- Lint and format pass (`npm run lint`, `npm run format:check`).
- `CHANGELOG.md` is updated if the change is user-visible.
- The initiative's decisions log captures anything we'd regret forgetting.

## Cadence

Async by default: issue comments carry the day-to-day, occasional in-person
syncs handle the rest. Decisions reached async get recorded in the relevant
initiative's decisions log so they survive the thread.
