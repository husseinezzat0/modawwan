# Modawwan — Privacy Policy | سياسة الخصوصية

**Effective Date:** October 27, 2026  
**Developer & Maintainer:** Hussein Ezzat (حسين عزت)  
**Application:** Modawwan Desktop Application for Windows  
**License:** MIT License  

---

## 1. Core Principle: 100% Offline-First | المبدأ الأساسي: العمل محليًا بالكامل
Modawwan is designed from the ground up as an offline-first, privacy-respecting desktop application. Your data belongs exclusively to you. The application does not require user registration, account creation, or cloud authentication.

---

## 2. Local Data Storage | التخزين المحلي للبيانات
- **Storage Location:** All your notes, sub-pages, task boards, and personal financial transactions are stored strictly on your local machine in an SQLite database file at:
  ```text
  %APPDATA%\Modawwan\modawwan_notes.sqlite
  ```
- **Local SQLite Engine:** Data is processed through the built-in Node.js SQLite engine (`node:sqlite` / `DatabaseSync`) in WAL mode with prepared statements, running on your operating system.
- **Backups & Export:** Any exported JSON backups are written only to directories chosen explicitly by you via the native Windows file picker.

---

## 3. Telemetry & Analytics: Zero Collection | انعدام التتبع والإحصائيات
Modawwan contains:
- **NO** analytics SDKs (Google Analytics, Mixpanel, etc.).
- **NO** crash telemetry reporting (Sentry, Crashlytics, etc.).
- **NO** tracking cookies, user profiling, or background behavioral tracking.
- **NO** remote logging servers.

---

## 4. Network Communications (Update Checks) | الاتصالات الشبكية (فحص التحديثات)
The application initiates network communication **only** for checking software updates, under the following strict conditions:

1. **Trigger Mechanisms (Periodic & Manual):**
   - **Periodic Background Check:** When enabled, the application automatically queries for new releases once every 24 hours while running. Upon application startup, a check is performed only if 24 hours have elapsed since the recorded timestamp (`lastUpdateCheckAt`).
   - **Manual On-Demand Check:** The user can initiate an immediate check at any time by clicking **Check for Updates (التحقق من التحديثات)** in **Settings → Updates (الإعدادات ← التحديثات)**.
2. **Endpoints & Protocol:**
   - Update availability is queried exclusively over encrypted HTTPS directly from the official GitHub infrastructure:
     - Update manifest: https://github.com/husseinezzat0/modawwan/releases/latest/download/latest.yml
     - Release metadata: https://api.github.com/repos/husseinezzat0/modawwan/releases/latest
3. **Payload & Data Transmitted:**
   - The update request transmits **NO** personal data, **NO** notes, **NO** tasks, **NO** financial figures, and **NO** hardware/device identifiers.
   - The request contains only generic HTTP headers (`Accept: application/vnd.github+json` and User-Agent `Modawwan-Update-Check`) to query the latest release metadata.
4. **User Control & Disabling:**
   - Automatic update checking can be completely disabled at any time by toggling off **Automatic Update Checks (التحقق التلقائي من التحديثات)** in **Settings → Updates (الإعدادات ← التحديثات)**.
   - When disabled, background network communication is completely stopped.

---

## 5. Security & Isolation Architecture | بنية الأمان والعزل
- **Context Isolation:** Enabled (`contextIsolation: true`).
- **Node Integration Disabled:** Renderer processes run with `nodeIntegration: false`.
- **Content Security Policy (CSP):** Enforces a strict local-only CSP restricting scripts and styles to bundled application resources.
- **Database Path Sanitization:** Database operations validate arguments strictly to prevent directory traversal or remote injection.

---

## 6. Children's Privacy
Modawwan does not collect any personal information from any user, including children under the age of 13.

---

## 7. Contact
If you have questions about this Privacy Policy or Modawwan's data architecture:
- **Developer:** Hussein Ezzat
- **GitHub:** [@husseinezzat0](https://github.com/husseinezzat0)
- **Repository:** [https://github.com/husseinezzat0/modawwan](https://github.com/husseinezzat0/modawwan)
