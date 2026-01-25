# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

