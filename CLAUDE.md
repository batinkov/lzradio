# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Principles

**Be Critical, Not Compliant**: The user values honest technical feedback over agreement. Challenge proposals when you see potential issues, suggest alternatives when there are better approaches, and point out trade-offs. Don't hesitate to disagree or recommend a different direction if it leads to a better solution. The goal is rigorous thinking and optimal outcomes, not validation.

## Project Overview

LZ Radio is a fully client-side web application for amateur radio operators. It provides:
- **LogBook**: Log and track radio contacts with full CRUD operations and IndexedDB persistence
- **Exam Prep**: Practice for Bulgarian amateur radio license exams (Class 1 and Class 2)

**Technology Stack:**
- Svelte 5 (UI framework)
- Vite (build tool)
- svelte-spa-router (client-side routing with hash mode)
- svelte-i18n (internationalization - English and Bulgarian)
- KaTeX (math formula rendering in exam questions)

## Common Commands

### Development
```bash
# Start development server (http://localhost:5173)
npm run dev
```

### Building
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui
```

**Test Coverage:** 297 passing unit tests across all business logic modules.

### Linting
```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format code
npm run format
```

**Tools:** ESLint + Prettier with Svelte support.

## Architecture

### High-Level Structure
Fully client-side single-page application (SPA). No backend server. All data stored locally in user's browser using a unified storage adapter architecture. LocalStorage for preferences (via storage adapters), IndexedDB with Dexie.js for LogBook data persistence.

### Key Components
- **Routes** (`src/routes/`): Page-level components (Home, LogBook, Exam pages)
- **Shared Components** (`src/components/shared/`): Navigation, modals
- **Feature Components** (`src/components/logbook/`, `src/components/exam/`): Directories exist but not yet utilized
- **Library** (`src/lib/`):
  - `i18n.js` - Internationalization setup and language switching (uses localStorageAdapter)
  - `questions.js` - Dynamic question loading based on locale
  - `katex.js` - Math formula rendering
  - `examConfig.js` - Exam configuration constants
  - `examScoring.js` - Exam scoring and answer validation logic (pure functions, tested)
  - `examTimer.js` - Timer utilities and time formatting (pure functions, tested)
  - `examProgress.js` - Progress tracking calculations (pure functions, tested)
  - `navigationGuard.js` - Navigation protection during exams (tested)
  - `urlParams.js` - Type-safe URL parameter parsing (tested)
  - `logbookDB.js` - IndexedDB operations with Dexie.js (tested)
  - `callsignParser.js` - Parse/build callsigns with prefix/base/suffix (tested)
  - `importValidator.js` - Validate LogBook import JSON files (tested)
  - `importStatistics.js` - Calculate import statistics and detect duplicates (tested)
  - `toastStore.js` - Toast notification system (tested)
  - `storage/` - Storage adapter architecture:
    - `storageAdapter.js` - Base adapter with unified API (tested)
    - `localStorage.js` - LocalStorage adapter
    - `sessionStorage.js` - SessionStorage adapter
- **Styles** (`src/styles/`): Shared component styles extracted for reuse
- **Locales** (`src/locales/`): Translation files (en.json, bg.json)

### Routing
**Hash-based routing** using `svelte-spa-router`:
- URLs use `#` for routes: `/#/logbook`, `/#/exam/class1`, `/#/exam/class2`
- Works on ANY static hosting with zero configuration
- **Important limitation**: Cannot use traditional in-page anchors (`#section-id`)
- If in-page anchors become necessary, can migrate to history mode (requires server config)

**Main Routes:**
- `/` - Home page
- `/logbook` - View contacts (with export/import)
- `/logbook/add` - Add new contact
- `/logbook/edit/:id` - Edit existing contact
- `/exam` - Exam home page
- `/exam/class1` - Class 1 exam selection
- `/exam/class2` - Class 2 exam selection
- `/exam/class1/prep` - Class 1 practice mode
- `/exam/class2/prep` - Class 2 practice mode
- `/exam/class1/simulated` - Class 1 timed exam
- `/exam/class2/simulated` - Class 2 timed exam

### Data Storage

**Storage Architecture:**
- **Storage Adapters**: Unified API for all storage operations (`src/lib/storage/`)
  - Automatic JSON serialization/deserialization
  - Error handling with graceful fallbacks
  - Testable via dependency injection with mock storage
  - Methods: `get()`, `set()`, `remove()`, `clear()`, `has()`, `keys()`, `size()`

**Currently Implemented:**
- **Language preference**: LocalStorage via `localStorageAdapter` - persists user's language choice
- **Question banks**: Static JSON files bundled with app (separate files for Bulgarian and English)
- **Exam practice answers**: In-memory state only (intentionally NOT persisted - ephemeral by design)
- **Exam simulated mode**: In-memory state only (intentionally NOT persisted - real exam behavior)
- **LogBook contacts**: IndexedDB with Dexie.js v4.2.1 - full CRUD operations, persistent local storage
- **LogBook export/import**: JSON files with validation, duplicate detection, and metadata

**Planned for Future:**
- **Exam history/statistics**: Use storage adapters to save past exam results
- **Operator settings**: Store user's own callsign and station preferences

### External Dependencies
None. Fully offline-capable. No external APIs or services.

### Internationalization
- **Supported Languages**: English (en) and Bulgarian (bg)
- **Default Language**: English
- **Language Detection**: Falls back to browser language, then English
- **Persistence**: Language preference saved via `localStorageAdapter`
- **Question Banks**: Separate JSON files for each language (`data_en/`, `data_bg/`)
- **UI Translations**: All UI text uses translation keys from locale files
- **Implementation**: `i18n.js` uses storage adapter for consistent persistence

## Project-Specific Conventions

### Code Organization
- Routes in `src/routes/` - one file per page
- Shared components in `src/components/shared/`
- Feature components in `src/components/[feature]/`
- Utility functions in `src/lib/`
- Design system variables in `src/app.css`

### Configuration
- Build config: `vite.config.js`
- Svelte config: `svelte.config.js`
- Dependencies: `package.json`

### State Management
- Local component state using Svelte's reactive declarations (`$:`)
- Svelte stores for shared state (toast notifications, theme preferences)
- Storage adapters for persistent data (LocalStorage, SessionStorage)
- IndexedDB with Dexie.js for LogBook data (contacts with auto-incrementing IDs, indexed fields)
- No global state management library (not needed for this scale)

### Design System
CSS variables in `src/app.css` define colors, spacing, typography, shadows. All components use these variables for consistency.

## Implementation Status

### ✅ Completed Features

**Core Functionality:**
- Basic routing structure (hash-based routing)
- Internationalization (English/Bulgarian) with localStorageAdapter
- Exam practice mode with question navigation
- Exam simulated mode with timer (40 minutes, 60 questions, 48 correct to pass)
  - Countdown timer with visual warnings (yellow at 10min, red at 5min)
  - Browser navigation warning during exam
  - Submit confirmation with unanswered question count
  - Auto-submit on timer expiration
  - Results screen with pass/fail determination
  - Review mode to see all answers after completion
- Question bank loading based on locale
- Math formula rendering in questions (KaTeX)
- Responsive design
- Language preference persistence
- Toast notification system

**LogBook (Fully Implemented):**
- IndexedDB persistence with Dexie.js v4.2.1
- Complete CRUD operations (Create, Read, Update, Delete)
- Contact form with validation (callsign, date, time, frequency, mode required)
- Smart callsign parsing (handles prefix/base/suffix: HB/W1ABC/P)
- Edit mode for existing contacts
- Delete confirmation modal
- JSON export with metadata, statistics, and date ranges
- JSON import with comprehensive validation:
  - Schema version checking
  - Required field validation
  - Date/time format validation
  - Duplicate detection (by callsign + date + time + frequency)
- Import preview modal showing new/duplicate/total counts
- Toast notifications for export/import feedback

**Architecture & Code Quality:**
- Business logic separation from UI components
- Storage adapter architecture (LocalStorage, SessionStorage)
- Type-safe URL parameter parsing
- Navigation guard system
- Loading states for async operations
- Testing framework (Vitest) with 297 passing unit tests
  - importValidator.js (40 tests) ✅
  - urlParams.js (33 tests)
  - storageAdapter.js (31 tests)
  - toastStore.js (27 tests) ✅
  - callsignParser.js (23 tests) ✅
  - navigationGuard.js (23 tests)
  - examProgress.js (22 tests)
  - examTimer.js (19 tests)
  - logbookDB.js (18 tests) ✅
  - importStatistics.js (17 tests) ✅
  - examScoring.js (16 tests)
  - theme.js (14 tests) ✅
- Linting (ESLint + Prettier with Svelte support)

### 📋 Planned Features
- Operator settings page (store user's own callsign)
- Country flag indicators based on callsign prefix
- Q-code and C-code reference section
- Exam history/statistics tracking (save results via storage adapters)
- PWA support (manifest.json, service worker)
- Keyboard shortcuts for exam navigation
- "Mark for review" feature during exams
- Error boundaries and question data validation
