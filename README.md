# 📻 LZ Radio

> **Open-source web application for Bulgarian amateur radio operators**

[![Live Demo](https://img.shields.io/badge/demo-lzradio.eu-blue?style=flat-square)](https://lzradio.eu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen?style=flat-square)](https://github.com/batinkov/lzradio/actions)
[![Version](https://img.shields.io/github/package-json/v/batinkov/lzradio?style=flat-square&color=orange)](CHANGELOG.md)

**LZ Radio** is a fully client-side web application designed for amateur radio operators in Bulgaria and worldwide. It provides tools for logging contacts (QSOs) and practicing for Bulgarian amateur radio license exams.

🌐 **Live Application:** [lzradio.eu](https://lzradio.eu)
📚 **Documentation:** [Wiki](https://github.com/batinkov/lzradio/wiki) ([English](https://github.com/batinkov/lzradio/wiki/en-Home) | [Български](https://github.com/batinkov/lzradio/wiki/bg-Home))

---

## ✨ Features

### 📖 LogBook
- **Contact Management** - Full CRUD operations for radio contacts
- **Smart Callsign Parsing** - Handles prefix/base/suffix (e.g., HB/W1ABC/P)
- **Data Persistence** - Local storage using IndexedDB (Dexie.js)
- **Export/Import** - JSON format with validation and duplicate detection
- **Offline-Capable** - Works completely offline, no backend required

### 🎓 Exam Preparation
- **Official Question Banks** - Based on Bulgarian CRC exam syllabus (2025)
- **Two License Classes** - Class 1 (374 questions) and Class 2 (237 questions)
- **Practice Mode** - Study at your own pace with instant feedback
- **Simulated Exams** - Timed 40-minute exams with real exam rules
- **Math Formula Rendering** - Technical questions with proper mathematical notation (KaTeX)
- **Bilingual Support** - Full English and Bulgarian translations

### 🌍 Internationalization
- **Two Languages** - English and Bulgarian UI
- **Language Preference** - Persisted locally across sessions
- **Aligned Question Banks** - Semantically verified translations

### 🔒 Privacy & Data
- **100% Client-Side** - No backend server, no data leaves your device
- **No Tracking** - Privacy-focused analytics architecture (optional)
- **Local Storage** - All data stored in browser (IndexedDB + LocalStorage)
- **No Cookies** - Respects user privacy

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/batinkov/lzradio.git
cd lzradio

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint and format
npm run lint
npm run format
```

**More commands:** See [Testing](#-testing) section below for additional options.

---

## 🛠️ Tech Stack

### Core Framework
- **[Svelte 5](https://svelte.dev/)** - Reactive UI framework
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server

### Routing & State
- **[svelte-spa-router](https://github.com/ItalyPaleAle/svelte-spa-router)** - Hash-based client-side routing
- **Svelte Stores** - Reactive state management

### Data & Storage
- **[Dexie.js](https://dexie.org/)** - IndexedDB wrapper for LogBook persistence
- **LocalStorage** - User preferences and settings
- **Storage Adapters** - Unified API for different storage backends

### Internationalization
- **[svelte-i18n](https://github.com/kaisermann/svelte-i18n)** - i18n framework
- **Languages:** English (en), Bulgarian (bg)

### UI & Styling
- **CSS Variables** - Design system with consistent theming
- **Responsive Design** - Mobile-first approach
- **[KaTeX](https://katex.org/)** - Math formula rendering in exam questions

### Testing & Quality
- **[Vitest](https://vitest.dev/)** - Unit testing framework (377 tests)
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Code quality and formatting

### Development Tools
- **Hot Module Replacement** - Fast development feedback
- **Code Splitting** - Optimized bundle sizes
- **Git Hooks** - Pre-commit checks for code quality

---

## 📁 Project Structure

```
lzradio/
├── src/
│   ├── routes/              # Page-level components
│   │   ├── Home.svelte
│   │   ├── LogBook.svelte
│   │   ├── ExamPrep.svelte
│   │   └── ...
│   ├── components/          # Reusable components
│   │   ├── shared/          # Shared UI components
│   │   ├── logbook/         # LogBook-specific components
│   │   └── exam/            # Exam-specific components
│   ├── lib/                 # Business logic & utilities
│   │   ├── analytics.js     # Analytics observer pattern
│   │   ├── logbookDB.js     # IndexedDB operations
│   │   ├── examScoring.js   # Exam scoring logic
│   │   ├── i18n.js          # Internationalization setup
│   │   └── storage/         # Storage adapter architecture
│   ├── locales/             # Translation files
│   │   ├── en.json          # English translations
│   │   └── bg.json          # Bulgarian translations
│   ├── data_en/             # English question banks
│   └── data_bg/             # Bulgarian question banks
├── tests/
│   └── e2e/                 # End-to-end tests
├── public/                  # Static assets
├── CLAUDE.md                # AI assistant documentation
├── CHANGELOG.md             # Version history
└── package.json
```

---

## 🏗️ Architecture

### Design Patterns
- **Observer Pattern** - Analytics system with pluggable providers
- **Factory Pattern** - Testable component instantiation
- **Storage Adapter Pattern** - Unified API for different storage backends
- **Pure Functions** - Business logic separated from UI (fully tested)

### Key Principles
- **Client-Side Only** - No backend server, no external dependencies
- **Offline-First** - All functionality works without internet
- **Privacy-Focused** - No data collection, no tracking by default
- **Test-Driven** - Comprehensive unit test coverage (377 tests)
- **Separation of Concerns** - Business logic isolated from UI components

### Hash-Based Routing
Uses hash-based routing (`/#/page`) for compatibility with static hosting (GitHub Pages) without server configuration. Routes like `/#/logbook`, `/#/exam/class1`.

---

## 🚢 Deployment

The application is deployed to [GitHub Pages](https://lzradio.eu) via GitHub Actions when a semver tag (`vX.Y.Z`) is pushed. Pushing to `master` runs CI only — it does **not** deploy.

**Release Workflow:**
1. Merge work to `master` — CI runs lint, unit tests, and build
2. Bump `version` in `package.json` and add a `CHANGELOG.md` entry
3. Commit, then tag: `git tag -a vX.Y.Z -m "Release X.Y.Z"`
4. Push both: `git push origin master && git push origin vX.Y.Z`
5. The deploy workflow verifies the tag before building:
   - strict semver (`vX.Y.Z`, no prerelease suffix)
   - matches `version` in `package.json`
   - the tagged commit is an ancestor of `master`

Prerelease tags (`v1.2.3-rc.1`) are ignored and never trigger a deploy.

**Workflows:**
| File | Trigger | Does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | push to `master`, pull requests | lint, unit tests, build |
| `.github/workflows/deploy.yml` | push of a `vX.Y.Z` tag | verify, build, publish to Pages |

**Manual Deployment:**
```bash
npm run build
# Deploy the dist/ directory to your static hosting provider
```

---

## 🧪 Testing

### Unit Tests
- **377 passing tests** across all business logic modules
- **Test-Driven Development** - Pure functions fully tested
- **Frameworks:** Vitest with jsdom

```bash
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:ui          # Interactive UI
```

### E2E Tests
- **Playwright** - Full browser automation
- Tests user workflows: navigation, LogBook CRUD, exam completion

```bash
npm run test:e2e
```

### Code Quality
```bash
npm run lint             # ESLint
npm run format           # Prettier
npm run format:check     # Check formatting
```

---

## 🤝 Contributing

Contributions are welcome! This project is designed for Bulgarian amateur radio operators, but improvements to code quality, tests, and architecture are always appreciated.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Guidelines
- Follow existing code style (ESLint + Prettier)
- Write unit tests for business logic
- Keep UI and business logic separated
- Update documentation if needed

### Reporting Issues
Found a bug or have a feature request? [Open an issue](https://github.com/batinkov/lzradio/issues)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2026 Atanas Batinkov
```

You are free to use, modify, and distribute this software for any purpose, including commercial applications.

---

## 🙏 Credits & Acknowledgments

### Question Banks
- Exam questions based on official syllabus from **[Bulgarian Communications Regulation Commission (CRC)](https://crc.bg)**
- Class 1: 374 questions across 3 sections
- Class 2: 237 questions across 3 sections
- Last updated: August 11, 2025 (Syllabus: 11.08.2025)

### Technologies
Built with open-source technologies:
- [Svelte](https://svelte.dev/) - Cybernetically enhanced web apps
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Dexie.js](https://dexie.org/) - Minimalistic IndexedDB wrapper
- [KaTeX](https://katex.org/) - Fast math typesetting library

### Community
Special thanks to:
- Bulgarian amateur radio community
- Open-source contributors
- All operators using and testing the application

---

## 📞 Contact & Support

- **Website:** [lzradio.eu](https://lzradio.eu)
- **Issues:** [GitHub Issues](https://github.com/batinkov/lzradio/issues)
- **Documentation:** [Wiki](https://github.com/batinkov/lzradio/wiki)
- **Author:** Atanas Batinkov

---

## 🎯 Project Status

**Status:** Active development

**Latest Release:** See [Changelog](CHANGELOG.md) for version history

**Features:**
- ✅ LogBook with full CRUD operations
- ✅ Exam preparation with official 2025 question banks
- ✅ Bilingual support (English & Bulgarian)
- ✅ Analytics infrastructure (ready for provider integration)
- 🚧 Planned: Operator settings, PWA support, exam statistics

---

<div align="center">

**73 de LZ Radio** 📻

*Open-source tools for amateur radio operators*

[⬆ Back to Top](#-lz-radio)

</div>
