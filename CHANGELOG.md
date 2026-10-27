# Changelog

All notable changes to Modawwan | مُدَوَّن are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] — 2026-10-27

### Added
- Automatic update checks for stable GitHub Releases with an opt-out, limited to once per 24 hours, with release notes, download progress, and an explicit Install & Restart action after pending note edits flush.
- Arabic and English update settings; portable builds link to Releases and require manual replacement.
- Windows Actions workflows for checks on `main` and tagged stable releases, including version, security, and package-metadata gates.

### Changed
- Replaced the prior icon set with MIT-licensed Phosphor icons to enable public redistribution; original application branding is retained.
- Existing 1.1.0 and earlier installations must install this update-capable version manually once.

### Security
- Updates are downloaded only from the configured public GitHub repository over HTTPS and are never installed without an explicit user action. Windows code signing remains optional and must be configured through repository secrets.

## [1.1.0] — 2026-10-26

### Fixed
- **Trash system rewritten around soft delete** — deleting a note or sub-page moves the whole
  `parent_id` subtree to the trash instead of hard-deleting it; deleting a folder recovers its
  notes into the trash before removing the folder records (folders stay non-restorable).
- Root cause of the "trash is always empty" bug: the app state never loaded `is_deleted=1`
  notes. `TrashView` and the sidebar badge both read the new `trashNotes` state; counts and
  lists refresh immediately after delete/restore/permanent delete.
- `deleteNote`/`restoreNote` now reload from the database so sub-pages leave the notes list and
  appear in the trash immediately; restoring a sub-page also restores its trashed ancestors.
- Layout: block-boundary spacing in note previews ("Inert HTML testBlocked" glue), and the
  "Add Sub-page" button moved next to the "Linked Sub-pages" label.
- Window state button logic no longer guesses; the title bar subscribes to live
  `maximize`/`unmaximize` events (double-click, Win+Up / Aero Snap included).

### Added
- **Typography settings**: bundled variable fonts **Cairo** and **Inter** (SIL OFL, files under
  `src/assets/fonts/`) with a Settings selector for the interface font (live `data-ui-font`
  switch) and the editor font, plus a live preview line and persistence across restarts.
- macOS-style window-state transition (160 ms opacity/scale animation on maximize/restore),
  disabled automatically under `prefers-reduced-motion`; minimize/maximize/close stay native.
- Custom `ConfirmDialog` replaces blocking `window.confirm` for trash actions (clear
  confirmation before permanent delete or emptying the trash; cancel keeps everything).
- Sidebar collapse/expand icons are now dedicated double-chevrons from the icon library
  (`doubleChevronLeft`/`doubleChevronRight`), mirroring automatically in Arabic RTL mode.
- Extended packaged end-to-end QA: trash lifecycle (soft delete → trash → restore → cascade →
  cancel + confirm dialogs), font settings flow with restart persistence, maximize/restore
  layout integrity, and a SQLite cascade regression test (`test/trash-cascade.cjs`).

## [1.0.1] — 2026-10-26

### Changed
- Unified all UI icons on the **Platforms Code (Community)** design-system library through
  the shared `AppIcon` component (added the `link` icon mapping).
- Replaced emoji-as-icons in Tasks UI (priority dots → CSS design dots, due date → calendar
  icon, complete/reopen → tick/restore icons) and the backlink chips now use the library
  link/file icons.
- Removed the unused `lucide-react` dependency.
- Added developer identity: Hussein Ezzat (حسين عزت) in About, package metadata, Windows
  version resources, and documentation. © 2026 Hussein Ezzat.
- Preparing the repository for open-source release: README (EN/AR), LICENSE (MIT),
  SECURITY.md, CONTRIBUTING.md, THIRD_PARTY_NOTICES.md, icon-governance tests, Windows CI.

### Security
- GitHub-ready hardening audit completed: IPC sender validation, argument validation,
  strict CSP, backup validation, path/policy review (no new code-signed claims).

## [1.0.0] — 2026-10

### Added
- Initial release: rich-text & block notes with slash commands, nested pages, internal
  links & backlinks, tasks with Kanban + calendar, finance management with charts, note
  templates, search & filters, backup/restore, Arabic/English with full RTL support,
  light/dark themes, auto-save with local SQLite storage.
