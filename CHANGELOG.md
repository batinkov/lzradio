# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

