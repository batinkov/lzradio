# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Principles

**Be Critical, Not Compliant**: The user values honest technical feedback over agreement. Challenge proposals when you see potential issues, suggest alternatives when there are better approaches, and point out trade-offs. Don't hesitate to disagree or recommend a different direction if it leads to a better solution. The goal is rigorous thinking and optimal outcomes, not validation.

## Project Overview

LZ Radio is a fully client-side web application for amateur radio operators. It provides:
- **Callbook**: Log and track radio contacts
- **Exam Prep**: Practice for amateur radio license exams (Technician, General, Extra)

**Technology Stack:**
- Svelte 5 (UI framework)
- Vite (build tool)
- svelte-spa-router (client-side routing with hash mode)
- Dexie.js (IndexedDB wrapper for data storage)

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
Fully client-side single-page application (SPA). No backend server. All data stored locally in user's browser using IndexedDB.

### Key Components
- **Routes** (`src/routes/`): Page-level components (Home, Callbook, Exam pages)
- **Shared Components** (`src/components/shared/`): Navigation, modals
- **Feature Components** (`src/components/callbook/`, `src/components/exam/`): Feature-specific UI
- **Library** (`src/lib/`): Storage utilities, export/import logic, question bank loader

### Routing
**Hash-based routing** using `svelte-spa-router`:
- URLs use `#` for routes: `/#/callbook`, `/#/exam/technician`
- Works on ANY static hosting with zero configuration
- **Important limitation**: Cannot use traditional in-page anchors (`#section-id`)
- If in-page anchors become necessary, can migrate to history mode (requires server config)

### Data Storage
- **Callbook contacts**: IndexedDB (via Dexie.js) - persistent local storage
- **Exam progress**: LocalStorage - simple key-value pairs
- **Question banks**: Static JSON files bundled with app
- **Export/Import**: JSON files for data backup/restore

### External Dependencies
None. Fully offline-capable. No external APIs or services.

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
