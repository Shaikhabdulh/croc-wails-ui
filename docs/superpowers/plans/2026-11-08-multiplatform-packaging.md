# Multi-Platform & Multi-Architecture Build Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide complete, automated multi-platform and multi-architecture build pipelines, packaging, and runtime compatibility for Linux (all distros, amd64/arm64), Windows (x86_64, arm64, 386), macOS (Apple Silicon, Intel, Universal DMG), Android (APK/AAB), and iOS.

**Architecture:** A dual-mode runtime architecture where Desktop platforms run through native Wails v3 window managers (WebKitGTK, WebView2, Cocoa) and Mobile/Web platforms communicate through an embedded local HTTP/WebSocket daemon. Automated multi-OS GitHub Actions workflow matrix builds all targets natively in the cloud, while local Linux packaging scripts generate `.deb`, `.rpm`, `.AppImage`, and `.tar.gz` directly.

**Tech Stack:** Go 1.23+, React 19, TypeScript, Vite, Tailwind CSS, Wails v3, Capacitor, GitHub Actions, dpkg-deb, AppImageKit, MinGW-w64, lipo.

**Spec:** Documented in conversation brainstorming transcript (2026-11-08) covering Linux (all distros: Ubuntu/Debian/Fedora/Arch/SUSE across x86_64 and aarch64), Windows (x86_64, ARM64, 386), macOS (Apple Silicon, Intel, Universal), Android (APK/AAB), and iOS (Xcode/IPA).

## Global Constraints

- Must maintain 100% test pass rate across backend Go tests and frontend Vitest tests.
- Desktop binaries must remain standalone with zero external runtime dependencies on users' machines.
- Linux packaging must support standard system installation (`/usr/bin`, `/usr/share/applications`, `/usr/share/icons`).
- Mobile shell must reuse the exact same responsive React UI without duplicating design or business logic.
- Cloud CI/CD matrix must compile all binaries natively using GitHub Actions standard runners (`ubuntu-latest`, `windows-latest`, `macos-latest`).

## Review Focus

1. **Dual-Mode API Resilience:** When running in Wails, frontend calls native Wails IPC; when running in Mobile/Web, frontend seamlessly falls back to HTTP/WebSocket without crashing.
2. **Path Separator Compatibility:** File path manipulation across Windows (`\`) and Unix (`/`) must not corrupt download paths or staged files.
3. **Linux Desktop Integration:** The `.desktop` file, icon assets, and mime types must adhere to Freedesktop standards for GNOME, KDE Plasma, XFCE, and tiling WMs.
4. **AppImage Portability:** The `.AppImage` must be executable across older and newer glibc versions without dynamic linker errors.
5. **ARM64 Architecture Alignment:** Cross-compilation flags for aarch64 (Raspberry Pi, Apple Silicon, Windows on ARM) must disable incompatible CGo/Tailcat flags (`croc_no_tailcat`).

---

### Task 1: Dual-Mode Micro-Daemon in Backend & Frontend API Adapter

**Files:**
- Create: `backend/server/http_server.go`
- Create: `backend/server/http_server_test.go`
- Modify: `main.go`
- Modify: `frontend/src/api.ts`
- Test: `backend/server/http_server_test.go`
- Test: `frontend/src/api.test.ts`

**Interfaces:**
- Consumes: `service.AppService` methods (`SendFiles`, `ReceiveFile`, `GetConfig`, etc.)
- Produces: `StartLocalServer(port int, appSvc *service.AppService)` exposing `/api/*` endpoints and `/events` WebSocket/SSE stream.
- `frontend/src/api.ts`: Auto-detects `window.wails` vs HTTP backend.

- [ ] **Step 1: Write backend HTTP server unit test**
- [ ] **Step 2: Implement `backend/server/http_server.go`**
- [ ] **Step 3: Update `main.go` to support `--server` or headless/mobile micro-daemon flag**
- [ ] **Step 4: Update `frontend/src/api.ts` with dual-mode detection and tests**
- [ ] **Step 5: Run tests and verify 100% pass**

---

### Task 2: Linux Native & Universal Distro Packagers (.deb, .AppImage, .tar.gz)

**Files:**
- Create: `build/linux/croc-wails-ui.desktop`
- Create: `scripts/package-linux.sh`
- Modify: `Makefile`
- Test: Build and verify `.deb`, `.AppImage`, and `.tar.gz` artifacts

**Interfaces:**
- Produces:
  - `build/dist/croc-wails-ui_amd64.deb`
  - `build/dist/croc-wails-ui-x86_64.AppImage`
  - `build/dist/croc-wails-ui-linux-x86_64.tar.gz`

- [ ] **Step 1: Create Freedesktop `.desktop` and metadata files**
- [ ] **Step 2: Implement `scripts/package-linux.sh` generating `.deb`, AppImage structure, and `.tar.gz`**
- [ ] **Step 3: Add `package-deb`, `package-appimage`, `package-tar`, and `package-all-linux` targets to `Makefile`**
- [ ] **Step 4: Execute packaging scripts and verify file integrity, permissions, and archive extraction**

---

### Task 3: Comprehensive GitHub Actions CI/CD Multi-Platform Matrix

**Files:**
- Create: `.github/workflows/build-all.yml`
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Matrix Targets:
  - `matrix.os: [ubuntu-latest, windows-latest, macos-latest]`
  - `matrix.arch: [amd64, arm64, 386]`
  - Output Artifacts:
    - Linux: `croc-wails-ui-linux-amd64.deb`, `croc-wails-ui-linux-arm64.deb`, `.rpm`, `.AppImage`, `.tar.gz`
    - Windows: `croc-wails-ui-windows-amd64.exe`, `croc-wails-ui-windows-arm64.exe`, `croc-wails-ui-windows-386.exe`
    - macOS: `croc-wails-ui-macos-arm64.dmg`, `croc-wails-ui-macos-intel.dmg`, `croc-wails-ui-macos-Universal.dmg`
    - Android: `croc-wails-ui-android.apk`

- [ ] **Step 1: Create `.github/workflows/build-all.yml` with multi-OS and multi-arch jobs**
- [ ] **Step 2: Add automated tagging and release pipeline in `.github/workflows/release.yml`**
- [ ] **Step 3: Validate workflow syntax with action-validator / linter**

---

### Task 4: Mobile Scaffolding & Responsive Configuration (Android & iOS)

**Files:**
- Create: `mobile/capacitor.config.json`
- Create: `mobile/package.json`
- Create: `mobile/README.md`
- Modify: `frontend/index.html` (mobile viewport meta tags, safe-area-insets)
- Modify: `frontend/src/index.css` (iOS overscroll bouncing & safe areas)

**Interfaces:**
- Produces: Standalone Capacitor project linking directly to `frontend/dist`
- Enables: `npx cap add android` and `npx cap add ios` to build native mobile binaries

- [ ] **Step 1: Add mobile responsive meta tags and safe-area viewport CSS to frontend**
- [ ] **Step 2: Scaffolding Capacitor configuration in `mobile/`**
- [ ] **Step 3: Add mobile build targets to root `Makefile` (`make mobile-sync`)**
- [ ] **Step 4: Document mobile building instructions for Android Studio and Xcode**

---

### Task 5: End-to-End Verification, Documentation & Audit

**Files:**
- Modify: `README.md` (add Installation & Multi-Platform Matrix guide)
- Modify: `docs/INSTALL.md` (distro-specific install instructions for apt, dnf, pacman, AppImage, Windows, Mac, Android)

- [ ] **Step 1: Run full test suite (`make test` and `bun run test`)**
- [ ] **Step 2: Run local Linux packaging and test install/run on host**
- [ ] **Step 3: Update `README.md` and `docs/INSTALL.md` with complete installation guides**
- [ ] **Step 4: Commit and push changes to GitHub**
- [ ] **Step 5: Dispatch Independent Verification Auditor to verify all deliverables**
