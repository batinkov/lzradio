# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Principles

**Be Critical, Not Compliant**: The user values honest technical feedback over agreement. Challenge proposals when you see potential issues, suggest alternatives when there are better approaches, and point out trade-offs. Don't hesitate to disagree or recommend a different direction if it leads to a better solution. The goal is rigorous thinking and optimal outcomes, not validation.

## Project Overview

LZ Radio is a fully client-side web application for amateur radio operators. It provides:
- **LogBook**: Log and track radio contacts (UI complete, data persistence planned)
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
Testing framework not yet implemented.

### Linting
No linter configured yet.

## Architecture

### High-Level Structure
Fully client-side single-page application (SPA). No backend server. All data stored locally in user's browser (currently LocalStorage for preferences only; IndexedDB planned for user data).

### Key Components
- **Routes** (`src/routes/`): Page-level components (Home, LogBook, Exam pages)
- **Shared Components** (`src/components/shared/`): Navigation, modals
- **Feature Components** (`src/components/logbook/`, `src/components/exam/`): Directories exist but not yet utilized
- **Library** (`src/lib/`):
  - `i18n.js` - Internationalization setup and language switching
  - `questions.js` - Dynamic question loading based on locale
  - `katex.js` - Math formula rendering
  - `examConfig.js` - Exam configuration constants
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
- `/logbook` - View contacts
- `/logbook/add` - Add new contact
- `/exam` - Exam home page
- `/exam/class1` - Class 1 exam selection
- `/exam/class2` - Class 2 exam selection
- `/exam/class1/prep` - Class 1 practice mode
- `/exam/class2/prep` - Class 2 practice mode
- `/exam/class1/simulated` - Class 1 timed exam
- `/exam/class2/simulated` - Class 2 timed exam

### Data Storage

**Currently Implemented:**
- **Language preference**: LocalStorage - persists user's language choice
- **Question banks**: Static JSON files bundled with app (separate files for Bulgarian and English)
- **Exam practice answers**: In-memory state only (not persisted between sessions)
- **Exam simulated mode**: SessionStorage - persists during tab session, auto-clears on tab close (includes timer, answers, results)

**Planned for Future:**
- **LogBook contacts**: IndexedDB (will use Dexie.js - not yet installed) - persistent local storage
- **Exam progress/history**: LocalStorage or IndexedDB - save practice session results
- **Export/Import**: JSON files for data backup/restore

### External Dependencies
None. Fully offline-capable. No external APIs or services.

### Internationalization
- **Supported Languages**: English (en) and Bulgarian (bg)
- **Default Language**: English
- **Language Detection**: Falls back to browser language, then English
- **Persistence**: Language preference saved to LocalStorage
- **Question Banks**: Separate JSON files for each language (`data_en/`, `data_bg/`)
- **UI Translations**: All UI text uses translation keys from locale files

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
- Svelte stores for shared state (when needed)
- IndexedDB for persistent data
- No global state management library (not needed for this scale)

### Design System
CSS variables in `src/app.css` define colors, spacing, typography, shadows. All components use these variables for consistency.

## Implementation Status

### ✅ Completed Features
- Basic routing structure
- Internationalization (English/Bulgarian)
- Exam practice mode with question navigation
- Exam simulated mode with timer (40 minutes, 60 questions, 48 correct to pass)
  - Countdown timer with visual warnings (yellow at 10min, red at 5min)
  - SessionStorage persistence (survives refresh, clears on tab close)
  - Browser navigation warning during exam
  - Submit confirmation with unanswered question count
  - Auto-submit on timer expiration
  - Results screen with pass/fail determination
  - Review mode to see all answers after completion
- Question bank loading based on locale
- Math formula rendering in questions
- Responsive design
- Language preference persistence

### 🚧 In Progress
- LogBook UI (static placeholder data only)

### 📋 Planned Features
- LogBook data persistence (will require installing Dexie.js for IndexedDB)
- LogBook CRUD operations
- Exam progress tracking and history (save results to localStorage/IndexedDB)
- Data export/import functionality
- Testing framework
- Linting configuration
