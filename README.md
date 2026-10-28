<p align="center">
  <img src="build/icon.png" width="96" height="96" alt="Modawwan Logo" />
</p>

<h1 align="center">Modawwan | مُدَوَّن</h1>

<p align="center">
  <strong>An open-source, offline-first personal productivity desktop application for Windows.</strong><br />
  Notes with rich blocks and nested pages, Kanban tasks with calendar view, and personal finance tracking — with native Arabic (RTL) and English (LTR) support.
</p>

<p align="center">
  <a href="https://github.com/husseinezzat0/modawwan/releases/tag/v1.2.0"><img src="https://img.shields.io/badge/version-1.2.0-blue.svg" alt="Version 1.2.0" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6.svg?logo=windows&logoColor=white" alt="Platform: Windows" />
  <img src="https://img.shields.io/badge/stack-Electron%20%7C%20React%20%7C%20TypeScript%20%7C%20SQLite-4B32C3.svg" alt="Stack" />
</p>

<p align="center">
  <a href="https://github.com/husseinezzat0/modawwan/releases/latest/download/Modawwan-Setup.exe">
    <img src="https://img.shields.io/badge/Download_for_Windows-Setup.exe-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Download for Windows" />
  </a>
</p>

<p align="center">
  <sub><b>Windows 10 / 11 (64-bit)</b> • Offline-First • Free & Open Source</sub><br />
  <a href="https://github.com/husseinezzat0/modawwan/releases">📦 View All Releases & Release Notes</a>
</p>

<p align="center">
  <a href="#download--installation">Download</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#features">Features</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#development-setup">Development</a> •
  <a href="#automatic-updates--signing-status">Auto-Updates</a> •
  <a href="README.ar.md"><strong>النسخة العربية (Arabic README)</strong></a>
</p>

---

## 📌 Overview

**Modawwan** (Arabic: **مُدَوَّن**, meaning *the chronicler* or *one who records*) is designed for users who want total control, ownership, and privacy over their everyday productivity. Built from the ground up as a native Windows desktop suite, all notes, tasks, and financial transactions are stored locally in an embedded SQLite database inside your local Windows AppData.

No accounts, no external cloud dependencies, no trackers, and no subscription paywalls.

---

## 📸 Screenshots

### Notes & Rich Block Editor
| Arabic — Dark Theme (RTL) | English — Light Theme (LTR) |
|:---:|:---:|
| ![Notes Arabic Dark](docs/screenshots/notes-ar-dark.png) | ![Notes English Light](docs/screenshots/notes-en-light.png) |

### Tasks Kanban & Calendar View
| Interactive Kanban Board | Calendar Due-Date Scheduling |
|:---:|:---:|
| ![Kanban Board](docs/screenshots/tasks-kanban.png) | ![Calendar View](docs/screenshots/tasks-calendar.png) |

### Personal Finance & Application Settings
| Cash Flow & Monthly Analytics | Customization, Fonts & Preferences |
|:---:|:---:|
| ![Finance View](docs/screenshots/finance.png) | ![Settings View](docs/screenshots/settings.png) |

---

## ✨ Features

- **Rich Text & Block Notes** — Markdown support, slash menu commands (`/`), headings, bullet/numbered lists, quotes, code blocks, tables, callouts, and checklists.
- **Nested Pages & Note Linking** — Multi-level hierarchical pages, internal wiki-style cross-linking, backlinks explorer, pinned notes, and a recoverable trash bin with cascade restore.
- **Kanban Tasks** — Drag-and-drop workflow (`To Do`, `In Progress`, `Done`), category tags, priority flags (Low, Medium, High, Urgent), and completion velocity metrics.
- **Calendar Scheduling** — Full interactive calendar mapping task due dates, deadlines, and daily agendas.
- **Personal Finance Tracker** — Record income and expense cash flow, assign custom categories, and visualize monthly trends and savings rates with native, offline SVG charts.
- **Productivity Templates** — Instant scaffolding for meeting minutes, project roadmaps, daily journals, and budgeting.
- **Full-Text Instant Search** — Fast local SQLite indexing across all notes, tasks, and transactions.
- **Reliable Backup & Disaster Recovery** — One-click JSON backup export/import with schema verification and an automatic pre-restore snapshot to prevent accidental data loss.
- **Native Dual-Language (Bilingual)** — Fully tailored interface in both Arabic (RTL) and English (LTR) with typography optimized using Cairo and Inter variable fonts.

---

## 📥 Download & Installation

Download the official [**Windows Setup Installer (Modawwan-Setup.exe)**](https://github.com/husseinezzat0/modawwan/releases/latest/download/Modawwan-Setup.exe) directly, or view the release notes on the [GitHub Releases page](https://github.com/husseinezzat0/modawwan/releases).

- **NSIS Setup Installer (`Modawwan-Setup.exe`)**:
  - Primary release asset for Windows 10/11 (64-bit).
  - Per-user installation requiring **no administrator privileges**.
  - Full desktop integration with Start Menu and Desktop shortcuts.
  - Uninstalling preserves your local SQLite database intact.
  - *Note on Portable Build:* A standalone portable executable is not distributed as a pre-packaged release asset for v1.2.0; it can be compiled locally from source using `npm run build:win`.

---

## 💻 System Requirements

- **Operating System:** Windows 10 (Build 1809 or later) or Windows 11 (64-bit architecture).
- **RAM:** 2 GB minimum (4 GB recommended).
- **Disk Space:** ~250 MB free space for the application and database.
- **Network:** Completely optional; internet access is only used when checking for or downloading software updates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | [Electron 45](https://www.electronjs.org/) (Sandboxed, Context-Isolated, Hardened IPC) |
| **Frontend** | [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Bundler** | [Vite 6](https://vitejs.dev/) |
| **Database** | Embedded SQLite 3 via Node.js built-in `node:sqlite` (`src/main/db.cjs`, WAL mode, prepared statements, automatic schema migrations) |
| **Icons** | [Phosphor Icons](https://phosphoricons.com/) via `@phosphor-icons/react` (MIT Licensed) |
| **Typography** | Cairo Variable Font (OFL) for Arabic, Inter Variable Font (OFL) for Latin |
| **Packaging & Updates** | [electron-builder](https://www.electron.build/), [electron-updater](https://www.electron.build/auto-update) |

---

## 🚀 Development Setup

### Prerequisites
- Node.js (v20 or v22 LTS recommended)
- npm (v10+)
- Git

### Quick Start

```powershell
# Clone the repository
git clone https://github.com/husseinezzat0/modawwan.git
cd modawwan

# Install dependencies
npm install

# Start development mode (Vite dev server + Electron)
npm run dev
```

### Verification & Testing

```powershell
# TypeScript strict type checking
npm run typecheck

# Comprehensive test suite (Security, DB integrity, IPC boundary, Icon governance)
npm test

# Secret scanner validation
node test/secrets-scan.cjs
```

---

## 🔨 Building for Windows

To generate the production NSIS installer and portable executable:

```powershell
npm run build:win
```

Build outputs will be created in the `release/` directory:
- `Modawwan-Setup-1.2.0.exe` (Installer)
- `Modawwan-Setup-1.2.0.exe.blockmap` (Differential update blockmap)
- `Modawwan-Portable-1.2.0.exe` (Portable executable)
- `latest.yml` (Update manifest with SHA-512 checksum)

---

## 🔄 Automatic Updates & Signing Status

- **Channel:** Updates are published exclusively through official GitHub Releases.
- **In-App Detection:** The application automatically checks for new stable releases in the background (or manually on demand) and displays update notifications and release notes in Settings.
- **Manual Installation for v1.2.0:** Because code signing is currently in progress, automated in-app execution (`quitAndInstall`) is intentionally blocked in v1.2.0 to protect user systems. The application safely directs you to download and run the new installer manually.
- **Code Signing Status (Submitted — Awaiting Review):** The application to the **SignPath Foundation** free open-source code signing program has been **Submitted — Awaiting Review**; no certificate has been issued yet. Initial release v1.2.0 is distributed as an unsigned community package. Windows SmartScreen may present an informational prompt upon initial installation until certificate integration and reputation are established.
- **Differential Downloads:** Future signed updates will utilize NSIS blockmaps to download only binary diffs.
- **Safety First:** The application never restarts unexpectedly; pending edits are flushed to SQLite before any restart.
- **User Control:** Automatic background update checks can be toggled on or off at any time in **Settings → Updates**.

---

## 🔒 Data Storage & Privacy Architecture

- **Local Storage:** All your information is stored strictly on your local machine at:
  ```text
  %APPDATA%\Modawwan\modawwan_notes.sqlite
  ```
- **Zero Telemetry:** No analytics, no metrics collection, no crash telemetry, and no background network calls.
- **Comprehensive Policies:**
  - 🛡️ [Privacy Policy](docs/PRIVACY_POLICY.md) — Detailed offline storage and update network behavior.
  - ✍️ [Code Signing Policy](docs/CODE_SIGNING_POLICY.md) — Release security, build pipeline, and signing governance.
  - 🔒 [Security Policy](SECURITY.md) — Vulnerability reporting and isolation standards.
- **Hardened Electron Security:**
  - Sandboxed renderer process (`sandbox: true`).
  - Strict context isolation (`contextIsolation: true`).
  - Node integration disabled in renderer (`nodeIntegration: false`).
  - Enforced Content Security Policy (`script-src 'self'`).
  - Strict IPC schema validation for all parameters (`src/main/validation.cjs`).
  - Blocking of all arbitrary external navigations and webviews.

---

## 🤝 Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and our [Security Policy](SECURITY.md) before opening a pull request or submitting an issue.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`).
4. Ensure all tests and type checks pass (`npm test`, `npm run typecheck`).
5. Push to the Branch (`git push origin feature/AmazingFeature`).
6. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Third-party package licenses and notices are detailed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## 👤 Developer & Maintainer

**Created & Maintained by Hussein Ezzat**  
**المطور: حسين عزت**  
Website: [husseinezzat.com](https://www.husseinezzat.com) • GitHub: [@husseinezzat0](https://github.com/husseinezzat0)

*Copyright © 2026 Hussein Ezzat. All rights reserved.*
