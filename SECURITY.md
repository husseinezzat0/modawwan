# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.2.x | ✅ (Current Stable) |
| 1.1.x | ⚠️ |
| 1.0.x | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Contact the maintainer **Hussein Ezzat** via a private channel (GitHub security advisory /
"Report a vulnerability" button on the Security tab once the repository is public).

Include: affected version, steps to reproduce, and impact. You will get an
acknowledgment within 7 days.

## Scope & design guarantees

- All data stays local (`%APPDATA%\Modawwan`) — no network services.
- Renderer is sandboxed with context isolation; IPC is sender-validated and
  argument-validated in the main process (`src/main/validation.cjs`).
- Strict CSP; no remote code, fonts, frames, or webviews.
- Backup imports are schema- and integrity-validated with explicit user consent.

Out of scope: social engineering, physical access to an unlocked machine,
Windows SmartScreen warnings for the unsigned installer.
