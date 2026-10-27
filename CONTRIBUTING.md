# Contributing to Modawwan

Thank you for contributing.

## Ground rules

1. Core notes, tasks, and finance features must work offline. Update checks are opt-out, limited to once per 24 hours, and use the configured public GitHub Releases feed only.
2. Use the MIT-licensed Phosphor React icons through the semantic map in `src/components/common/iconsMap.ts`. Do not embed assets without redistribution rights.
3. Keep the renderer sandboxed. Add each IPC channel to `src/main/validation.cjs` with strict argument validation; use prepared SQL statements.
4. Add every interface string in Arabic and English (`src/i18n/translations.ts`) and check RTL/LTR behavior.
5. `npm run typecheck` and `npm test` must pass.

## Workflow

1. Fork and create a focused branch.
2. Run `npm ci && npm run dev` to work locally.
3. Run `npm run typecheck && npm test` before pushing.
4. Open a pull request describing the change; Arabic and English are both welcome.

## Bug reports

Include Windows version, app version (Settings → About), reproduction steps, and a screenshot when useful. Never attach note, task, or finance data; redact private content.