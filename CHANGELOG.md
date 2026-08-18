# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.5] - 2026-08-18

Infrastructure release. No application source changes.

### Changed
- Deployment is now triggered by pushing a semver tag (`vX.Y.Z`) instead of by pushing to `master`, so the version shown in the app always matches the deployed build
- Split CI and deployment into separate workflows: `.github/workflows/ci.yml` runs on `master` pushes and pull requests; `.github/workflows/deploy.yml` runs only on tag pushes
- CI now runs ESLint in addition to unit tests and the production build; linting previously ran only locally

### Added
- Release guards in the deploy workflow: the tag must be strict semver, must match `version` in `package.json`, and must be an ancestor of `master`
- Prerelease tags (`vX.Y.Z-rc.1`) are filtered out and never trigger a deployment
- CI warning when `master` has commits that have not been released
- `Release Process` section in `CLAUDE.md` documenting the tag-based release steps

### Fixed
- README deployment section described a `gh-pages` branch that has never existed; the project uses GitHub Pages artifact deployment

## [0.5.4] - 2026-08-18

Maintenance release. No application source changes — dependency updates only.

### Security
- Resolved `npm_and_yarn` advisories in build/test tooling: `brace-expansion` 1.1.12 → 1.1.18, `js-yaml` 4.1.1 → 4.3.1, `postcss` 8.5.15 → 8.5.26, `devalue` 5.6.4 → 5.8.1
- Known remaining (all development-only, not shipped in `dist/`): `flatted` / `yaml` transitives via `@vitest/ui` and `postcss-load-config`, and `esbuild` via `svelte-i18n` (dev-server advisory; fix requires a breaking `svelte-i18n` downgrade)

### Changed
- Build tooling major upgrades: `vite` 6.4.2 → 8.0.16, `@sveltejs/vite-plugin-svelte` 5.0.2 → 7.1.2
- Dependency bumps: `svelte` 5.53.12 → 5.55.7, `vitest` 4.0.8 → 4.1.0
- Verified against the upgraded toolchain: lint clean, 377/377 unit tests passing, production build succeeds

## [0.5.3] - 2026-04-25

### Fixed
- Analytics scripts (GoatCounter, Umami) now only load on the production host (`lzradio.eu` / `www.lzradio.eu`); external CDN requests no longer happen in local development, preview deploys, or e2e tests, fixing intermittent test flakes caused by slow CDN responses delaying the page `load` event
- E2E tests now use a system-installed Chromium when available, with fallback to Playwright's bundled browser (Fedora compatibility, supports `PLAYWRIGHT_CHROMIUM_PATH` env override)

### Added
- Playwright e2e fixture (`tests/e2e/fixtures.js`) that blocks analytics requests at the network layer as defense in depth; all 10 spec files now import `test`/`expect` from this fixture

### Changed
- E2E dev server pinned to port 5173 with `--strictPort` to fail loudly on port conflicts instead of silently binding to another port
- Dependency bumps: `svelte` 5.53.0 → 5.53.12, `vite` 6.4.1 → 6.4.2, plus transitive updates (`rollup`, `postcss`, `minimatch`, `picomatch`, `flatted`, `devalue`)

## [0.5.2] - 2026-01-30

### Added
- Umami analytics integration with manual pageview tracking
- Localhost blocking via data-domains attribute and hostname check
- Callback-based tracking pattern for hash-based routing support

## [0.5.1] - 2026-01-30

### Added
- GoatCounter analytics integration

## [0.5.0] - 2026-01-30

### Added
- Analytics observer pattern for pageview tracking (infrastructure ready for provider integration)
- Comprehensive README.md with project overview, quick start, and development guide
- 23 unit tests for analytics system (377 total tests, up from 297)

### Changed
- Updated CLAUDE.md with analytics documentation and test count

## [0.4.2] - 2026-01-28

### Fixed
- Updated changelog URL from `main` to `master` branch in version notification
- Updated E2E test to match corrected changelog URL

## [0.4.1] - 2026-01-28

### Added
- Pre-commit hook to enforce email consistency and prevent accidental email leaks
  - Checks `git config user.email` against expected email
  - Blocks commits with `GIT_AUTHOR_EMAIL` environment variable override
  - Warns if `GIT_AUTHOR_NAME` is overridden
  - Hook stored in `scripts/hooks/pre-commit` (version controlled)
  - Installed via symbolic link to `.git/hooks/pre-commit`

### Changed
- Switched default branch from `main` to `master`
- Updated GitHub Actions deploy workflow to trigger on `master` branch

## [0.4.0] - 2026-01-28

### Changed
- Replaced Unicode fraction (½) with plain text "1/2" in Class 1 Section 1 questions (Q136, Q137)
- Verified full semantic alignment of all 611 exam questions across Bulgarian and English versions
  - Class 1: 374 questions (226 + 92 + 56 across 3 sections) - fully aligned
  - Class 2: 237 questions (111 + 53 + 73 across 3 sections) - fully aligned
  - All structural checks passed: question counts, answer mappings, choice counts, choice keys
  - Semantic verification completed via representative sampling across all sections

### Added
- Question Bank Information section to wiki exam guides (English and Bulgarian)
  - Last update date: August 11, 2025 (official syllabus: 11.08.2025)
  - Complete question breakdown by class and section
  - Note about Bulgarian-English alignment verification
  - Link to CRC official exam materials (Bulgarian guide)

## [0.3.0] - 2026-01-26

### Added
- Reusable Banner component for displaying dismissible/non-dismissible notices
- Language warning banner on exam home page (English users only)
- Warning message: "Official amateur radio exams in Bulgaria are conducted only in Bulgarian"
- 11 E2E tests for Banner component behavior (LogBook and ExamHome)

### Changed
- Updated Class 2 Section 1 question bank to 2025 syllabus
- Updated question images for Class 2 Section 1 (1400x370 resolution, both BG and EN)
- Increased question image display size from 40% to 70% width on desktop, 100% on mobile
- Changed LogBook alpha banner text from "ALPHA" to "Alpha Version"

### Fixed
- Question image locale detection (was using wrong locale variable, always defaulted to English)

## [0.2.0] - 2026-01-25

### Added
- Version update notification system with toast and changelog link
- Enhanced toast notifications with clickable link support
- Documentation link to help menu with language-aware wiki URLs
- Section names displayed in exam category selection
- GitHub Pages deployment configuration and issue templates
- Help menu split into Features and About modals with feedback links

### Changed
- Updated question banks to 2025 syllabus (Class 2 Sections 1, 2, 3)
- Improved checkbox alignment for multi-line section names

### Fixed
- Keyboard shortcuts now work after clicking answer buttons
- js-yaml dependency updated to resolve prototype pollution vulnerability (CVE-2023-2251)
- Build warnings and implemented code splitting

## [0.0.1] - 2025-01-18

Initial versioned release.

