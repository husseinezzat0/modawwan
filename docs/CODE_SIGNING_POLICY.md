# Modawwan — Code Signing & Release Security Policy

## 1. Project Overview & Governance
- **Project Name:** Modawwan | مُدَوَّن
- **Repository:** [https://github.com/husseinezzat0/modawwan](https://github.com/husseinezzat0/modawwan)
- **Primary Maintainer & Developer:** Hussein Ezzat (حسين عزت)
- **License:** MIT License (Open Source Initiative approved)
- **Application Type:** Offline-first personal productivity desktop application (Notes, Tasks, Finance) for Windows 10/11.

---

## 2. Open Source Commitment & Distribution
1. **Public Availability:** The complete source code is maintained publicly on GitHub without closed-source extensions, paywalled components, or telemetry libraries.
2. **Standard Tooling:** The application is built using standard, publicly auditable tools: Node.js, Vite, React, TypeScript, Electron, and better-sqlite3.
3. **No Dual-Licensing:** The entire codebase and distributed binaries are governed strictly under the MIT License.

---

## 3. Build & Release Security Pipeline
1. **Automated Reproducible Builds:**
   - All production releases are compiled and packaged exclusively via isolated GitHub Actions runners (`windows-latest`).
   - Workflows enforce TypeScript strict checks (`npm run typecheck`), automated security and SQLite retention test suites (`npm test`), secret scans, and dependency audits (`npm audit --audit-level=high`) prior to packaging.
2. **Artifact Integrity:**
   - Packaging is managed by `electron-builder`.
   - Every released executable produces an accompanying cryptographic SHA-512 checksum recorded in `latest.yml` and an NSIS blockmap file.
3. **Access Control:**
   - Only the repository owner (Hussein Ezzat) has administrative access to tag releases, configure repository secrets, and approve production deployments.
   - Branch protection and mandatory workflow checks prevent unreviewed direct pushes to stable release tags.

---

## 4. Code Signing Objectives & Key Management
1. **Objective:**
   - Digitally sign the Windows NSIS setup installer (`Modawwan-Setup-*.exe`) and application executable (`Modawwan.exe`) to provide users with cryptographic proof of provenance, ensure tamper-resistance, and eliminate untrusted publisher warnings (SmartScreen).
2. **Key Security:**
   - Private signing keys must never be stored in the Git repository, local developer machines, or unencrypted storage.
   - Signing credentials are to be managed strictly via hardware-backed security modules (HSM) or dedicated signing providers (e.g., SignPath Foundation or Azure Trusted Signing) integrated through GitHub Secrets.
3. **Revocation & Incident Response:**
   - In the event of suspected key compromise or vulnerability discovery, releases will be immediately flagged and superseded by an urgent hotfix release, with corresponding revocations processed via the certificate provider.

---

## 5. Contact & Security Inquiries
For security concerns, vulnerability disclosures, or signing verification inquiries:
- **Developer:** Hussein Ezzat
- **GitHub:** [@husseinezzat0](https://github.com/husseinezzat0)
- **Policy Reference:** [SECURITY.md](file:///d:/Notes/SECURITY.md)
