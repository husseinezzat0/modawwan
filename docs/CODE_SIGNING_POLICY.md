# Modawwan — Code Signing Policy

> **Certificate Status Notice:**
> The application to the SignPath Foundation program has been officially **Submitted — Awaiting Review**. The code-signing certificate for Modawwan has **NOT** yet been issued. This policy document defines the governance model, organizational roles, release controls, and security architecture required for onboarding and public verification once approved.

---

## 1. Project Governance & Organizational Roles
- **Project Name:** Modawwan | مُدَوَّن
- **Repository:** [https://github.com/husseinezzat0/modawwan](https://github.com/husseinezzat0/modawwan)
- **Author & Sole Maintainer:** Hussein Ezzat (حسين عزت) — GitHub: [@husseinezzat0](https://github.com/husseinezzat0)
- **License:** MIT License (Open Source Initiative approved)
- **Application Scope:** Offline-first personal desktop productivity application (Notes, Tasks, Personal Finance) for Windows 10/11 (64-bit).

### Defined Roles & Responsibilities:
1. **Project Owner & Maintainer (Hussein Ezzat — [@husseinezzat0](https://github.com/husseinezzat0)):**
   - Holds administrative responsibility for the project repository, architecture, and code quality.
   - Manages repository secrets, configuration, and SignPath onboarding credentials.
2. **Release Approver (Hussein Ezzat):**
   - Authorizes each signing request explicitly before the SignPath HSM signs any binary.
   - Verifies the Git tag, commit provenance, automated test results, and release notes.
3. **CI / Build Agent (GitHub Actions):**
   - Automated ephemeral runner (`windows-latest`) responsible for compiling source code deterministically.
   - Has read-only source access and limited, token-scoped permissions to submit signing jobs.
4. **Code Signing Provider (SignPath Foundation):**
   - Secure Hardware Security Module (HSM) infrastructure providing Authenticode digital signatures under the Austrian non-profit SignPath Foundation certificate authority.

---

## 2. Signing Scope & Limitations
1. **Permitted Artifacts:**
   Code signing is strictly restricted to binary artifacts compiled directly from this open-source repository:
   - NSIS Windows Installer: `Modawwan-Setup-<version>.exe` and `Modawwan-Setup.exe`
   - Unpacked Application Binary: `Modawwan.exe`
2. **Prohibited Scope:**
   - No third-party binaries, external dependencies, or modified community binaries may be signed under this project.
   - Dual-licensing, closed-source additions, or paywalled extensions are strictly prohibited.
3. **Publisher Identity:**
   Upon approval by the SignPath Foundation, signed artifacts will carry the verified publisher identity:
   `CN=SignPath Foundation, O=SignPath Foundation, L=Vienna, C=AT`
   The matching identifier `SignPath Foundation` will be configured in `app-update.yml` (`publisherName`) for client-side Authenticode verification.

---

## 3. Trusted Build Environment & Pipeline Integrity
1. **Build Source of Truth:**
   All production builds are compiled exclusively on ephemeral, Microsoft-hosted GitHub Actions runners (`windows-latest`). Local developer workstation builds are never submitted for production signing.
2. **Deterministic Prerequisites:**
   Before submission to any signing pipeline, the build workflow enforces:
   - Strict TypeScript typechecking (`npm run typecheck`).
   - Comprehensive test suite execution (`npm test` — verifying IPC safety, SQLite persistence, and updater guards).
   - High-severity dependency vulnerability audit (`npm audit --audit-level=high`).
   - Cryptographic secret scanner execution (`node test/secrets-scan.cjs`).
3. **Manual Authorization Required:**
   Automated continuous deployment is disabled for release signing. Every production release requires explicit manual triggering via `workflow_dispatch` by the maintainer (Hussein Ezzat), binding the exact Git tag (e.g., `v1.3.0`) to the HEAD commit of `main`.

---

## 4. Key Management & Separation of Concerns
1. **Zero Private Key Storage:**
   No private signing keys, PFX files, or certificates are stored in the Git repository, local developer systems, or unencrypted storage. Signing credentials remain safely secured within the SignPath Foundation Hardware Security Module (HSM).
2. **Decoupled Verification Architecture:**
   - **Windows Authenticode & SmartScreen Reputation:**
     Authenticode signing provides cryptographic proof of publisher identity and binary integrity, identifying the verified publisher in Windows security dialogs. While Authenticode signing is an essential prerequisite for building reputation with Microsoft Defender SmartScreen, it does not guarantee the immediate suppression of SmartScreen warnings; reputation develops progressively over time based on download history, certificate age, and telemetry.
   - **Update Manifest Cryptographic Integrity:**
     Decoupled from Authenticode; update metadata (`latest.yml`) enforces independent HTTPS delivery, SHA-512 binary hashing, and cryptographic Ed25519 manifest signing once stable.
   - In-app automatic updates remain disabled until both layers are cryptographically verified and tested end-to-end.

---

## 5. Security Incident & Key Revocation Procedure
In the event of a suspected security vulnerability, compromised workflow token, or malicious pull request:
1. The maintainer will immediately revoke active signing tokens in GitHub Repository Secrets.
2. The SignPath Foundation will be contacted to review and revoke any compromised signatures or certificates.
3. An advisory will be published via [SECURITY.md](https://github.com/husseinezzat0/modawwan/blob/main/SECURITY.md) and GitHub Releases.

---

## 6. Contact & Public Verification
- **Maintainer:** Hussein Ezzat
- **GitHub:** [@husseinezzat0](https://github.com/husseinezzat0)
- **Security Disclosures:** Refer to [SECURITY.md](https://github.com/husseinezzat0/modawwan/blob/main/SECURITY.md)
