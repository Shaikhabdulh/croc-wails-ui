# Croc Interface (Croc-GUI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimalist, cross-platform desktop GUI for `croc` using Wails v3 and React + Tailwind CSS that allows non-technical team members to send and receive encrypted files peer-to-peer via 1-click drag-and-drop and code phrases.

**Architecture:** A Wails v3 Go backend embeds the `schollz/croc` transfer engine directly in-process via an asynchronous callback adapter (`Hooks`), publishing state, progress, and file completion events over the Wails event bus to a lightweight React + Tailwind single-window frontend.

**Tech Stack:** Go 1.23+, Wails v3 (`github.com/wailsapp/wails/v3`), React 18, TypeScript, Tailwind CSS, Lucide React, Upstream `schollz/croc/v11`

**Spec:** `/media/shaikh-family/Data/Code/Projects/Project-interface/docs/superpowers/specs/2026-11-08-croc-interface-design.md`

## Global Constraints

- **Single Binary Artifact:** The application must compile to a single standalone executable embedding all web assets.
- **In-Process Croc Engine:** No spawning of CLI child processes; transfers must run directly in Go goroutines.
- **Non-Blocking GUI:** Zero terminal standard I/O calls (`os.Stdin` / `os.Stdout`) during transfer operations; all progress and confirmations flow through Wails events.
- **Safe Defaults:** Received files save to the user's OS `~/Downloads` directory by default.
- **Local Network Support:** Support UDP-based LAN peer discovery to allow high-speed transfers without internet relays.

## Review Focus

1. **Simultaneous Transfers:** Initiating a new transfer while another is active must be cleanly rejected with a friendly status rather than corrupting state.
2. **Network Disconnection / Timeout:** If peer disconnects mid-transfer, error state must reset UI cleanly with an actionable message.
3. **Cancellation Handling:** User clicking "Cancel" must immediately abort Go network sockets without lingering orphan goroutines.
4. **Duplicate File Overwrite:** Existing file in `~/Downloads` must either auto-resume or auto-rename safely without terminal deadlock.
5. **Cross-Platform Folder Opening:** Opening `~/Downloads` must succeed across Linux (`xdg-open`), macOS (`open`), and Windows (`explorer.exe`).

---

### Task 1: Scaffolding and Environment Setup

**Files:**
- Create: `go.mod`
- Create: `main.go`
- Create: `build/config.json`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/App.tsx`
- Test: `main_test.go`

**Interfaces:**
- Produces: Base Wails v3 application scaffolding and dev environment.

- [ ] **Step 1: Write tests verifying Go and build environment sanity**

```go
// main_test.go
package main

import "testing"

func TestApplicationInit(t *testing.T) {
    if appName != "Croc Interface" {
        t.Fatalf("expected appName 'Croc Interface', got '%s'", appName)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test . -v`  
Expected: FAIL (`appName undefined`)

- [ ] **Step 3: Initialize Go module, Wails v3 structure, and frontend scaffolding**

Set up `go.mod` with Wails v3 and create `main.go` with `const appName = "Croc Interface"`. Scaffold Vite + React in `frontend/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test . -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold wails v3 project and frontend base"
```

---

### Task 2: Croc Engine Hook Adapter Layer

**Files:**
- Create: `backend/transfer/hooks.go`
- Create: `backend/transfer/manager.go`
- Test: `backend/transfer/manager_test.go`

**Interfaces:**
- Produces: `TransferManager` struct with `StartSend`, `StartReceive`, `Cancel`, and event callbacks.
- Consumes: `github.com/schollz/croc/v11/src/croc`

- [ ] **Step 1: Write unit tests for TransferManager lifecycle and state events**

```go
// backend/transfer/manager_test.go
package transfer

import (
    "testing"
)

func TestTransferManagerLifecycle(t *testing.T) {
    tm := NewTransferManager()
    if tm.IsRunning() {
        t.Fatal("expected manager not running on init")
    }
    _, err := tm.TryStart(true)
    if err != nil {
        t.Fatalf("failed to start: %v", err)
    }
    if !tm.IsRunning() {
        t.Fatal("expected manager to be running")
    }
    // Attempting concurrent transfer must fail
    _, errConcurrent := tm.TryStart(false)
    if errConcurrent == nil {
        t.Fatal("expected error on concurrent transfer start")
    }
    tm.Cancel()
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./backend/transfer -v`  
Expected: FAIL with missing package/methods.

- [ ] **Step 3: Implement `TransferManager` and `Hooks` adapter**

Create `backend/transfer/manager.go` and `hooks.go` implementing thread-safe state tracking, cancellation contexts, and callbacks (`OnProgress`, `OnStateChange`, `OnDone`, `OnError`).

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./backend/transfer -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/transfer
git commit -m "feat(transfer): implement Croc TransferManager and hook adapter"
```

---

### Task 3: Wails IPC Bridge & Native Services

**Files:**
- Create: `backend/service/app_service.go`
- Create: `backend/service/fs_utils.go`
- Test: `backend/service/app_service_test.go`

**Interfaces:**
- Produces: `AppService` exposed to Wails frontend:
  - `SendFile(path string, isLocalOnly bool) (string, error)`
  - `ReceiveFile(codePhrase string, isLocalOnly bool) error`
  - `CancelTransfer() error`
  - `OpenDownloadsFolder(filename string) error`
- Consumes: `TransferManager` from Task 2.

- [ ] **Step 1: Write failing tests for AppService methods**

```go
// backend/service/app_service_test.go
package service

import "testing"

func TestAppServiceValidation(t *testing.T) {
    svc := NewAppService()
    err := svc.ReceiveFile("", false)
    if err == nil {
        t.Fatal("expected error when receiving with empty code phrase")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./backend/service -v`  
Expected: FAIL

- [ ] **Step 3: Implement `AppService` and cross-platform folder opener**

Implement `AppService` wiring `TransferManager` events into Wails `app.EmitEvent()`. Add `OpenDownloadsFolder()` using `xdg-open` on Linux, `open` on macOS, and `explorer` on Windows.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./backend/service -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/service
git commit -m "feat(service): implement Wails AppService and IPC bridge"
```

---

### Task 4: Frontend State & Wails Event Subscriptions

**Files:**
- Create: `frontend/src/types/transfer.ts`
- Create: `frontend/src/hooks/useTransfer.ts`
- Test: `frontend/src/hooks/useTransfer.test.ts`

**Interfaces:**
- Produces: `useTransfer()` React hook providing:
  - `state`: `'idle' | 'preparing' | 'waiting' | 'transferring' | 'completed' | 'error'`
  - `progress`: `{ percentage: number, speedMBs: number, etaSeconds: number, fileName: string }`
  - `codePhrase`: `string`
  - `actions`: `{ send(file: string), receive(code: string), cancel(), openFolder() }`

- [ ] **Step 1: Write test for transfer state transitions**

```typescript
// frontend/src/hooks/useTransfer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTransfer } from './useTransfer';

test('initializes with idle state', () => {
  const { result } = renderHook(() => useTransfer());
  expect(result.current.state).toBe('idle');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test` (or `npm test`)  
Expected: FAIL

- [ ] **Step 3: Implement `useTransfer` hook**

Implement `useTransfer.ts` subscribing to Wails events `transfer:state`, `transfer:progress`, `transfer:done`, and `transfer:error`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): implement useTransfer state hook"
```

---

### Task 5: Minimalist Send Component (Dropzone, Code, QR, Progress)

**Files:**
- Create: `frontend/src/components/SendView.tsx`
- Create: `frontend/src/components/QRCodeModal.tsx`
- Create: `frontend/src/components/ProgressBar.tsx`
- Test: `frontend/src/components/SendView.test.tsx`

**Interfaces:**
- Consumes: `useTransfer()` actions & state.
- Produces: Drag-and-drop send UI with live progress and QR code display.

- [ ] **Step 1: Write failing component test for SendView states**

```tsx
// frontend/src/components/SendView.test.tsx
import { render, screen } from '@testing-library/react';
import { SendView } from './SendView';

test('renders dropzone when idle', () => {
  render(<SendView state="idle" />);
  expect(screen.getByText(/drag and drop a file/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test`  
Expected: FAIL

- [ ] **Step 3: Implement SendView, QRCodeModal, and ProgressBar**

Build interactive drag-and-drop zone using Tailwind CSS. Render large code phrase with copy button, animated SVG progress bar, and QR code representation.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components
git commit -m "feat(ui): implement SendView with QR code and live progress"
```

---

### Task 6: 1-Click Receive Component (Code Input, Auto-Accept, Open Folder)

**Files:**
- Create: `frontend/src/components/ReceiveView.tsx`
- Test: `frontend/src/components/ReceiveView.test.tsx`

**Interfaces:**
- Consumes: `useTransfer()` receive actions.
- Produces: Receive interface with input box, live progress, and "Open Folder" action.

- [ ] **Step 1: Write failing component test for ReceiveView**

```tsx
// frontend/src/components/ReceiveView.test.tsx
import { render, screen } from '@testing-library/react';
import { ReceiveView } from './ReceiveView';

test('renders code input box', () => {
  render(<ReceiveView state="idle" onReceive={jest.fn()} />);
  expect(screen.getByPlaceholderText(/paste code phrase/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test`  
Expected: FAIL

- [ ] **Step 3: Implement ReceiveView component**

Create autofocus input box with paste button, auto-accept receive flow, progress status, and completion view with prominent `Open Folder` button.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ReceiveView.tsx
git commit -m "feat(ui): implement ReceiveView with auto-accept and folder opener"
```

---

### Task 7: Header, LAN Toggle & Main App Shell

**Files:**
- Create: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Produces: Navigation header with Send/Receive tab switcher and "Local LAN Only" toggle switch.

- [ ] **Step 1: Write test for tab switching and LAN toggle**

```tsx
// frontend/src/App.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('switches between Send and Receive tabs', () => {
  render(<App />);
  const receiveTab = screen.getByRole('tab', { name: /receive/i });
  fireEvent.click(receiveTab);
  expect(screen.getByPlaceholderText(/paste code phrase/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test`  
Expected: FAIL

- [ ] **Step 3: Implement Header and assemble App.tsx**

Wire Header with Send/Receive tabs, dark mode toggle, and "Local LAN Only" switch connected to AppService settings.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(ui): assemble App shell with Header and LAN toggle"
```

---

### Task 8: End-to-End Integration & Single-Binary Build

**Files:**
- Create: `e2e/transfer_e2e_test.go`
- Modify: `Makefile`
- Test: `e2e/transfer_e2e_test.go`

**Interfaces:**
- Produces: Standalone binary `build/bin/croc-interface` and automated E2E test.

- [ ] **Step 1: Write E2E loopback transfer test**

```go
// e2e/transfer_e2e_test.go
package e2e

import (
    "os"
    "path/filepath"
    "testing"
    "time"
)

func TestLoopbackTransfer(t *testing.T) {
    // Verifies sender and receiver complete file transfer via in-memory manager
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./e2e -v`  
Expected: FAIL before build integration.

- [ ] **Step 3: Configure build pipeline and compile single binary**

Configure Wails build task in `Makefile` bundling frontend into Go binary.

- [ ] **Step 4: Run E2E test and build verification**

Run: `go test ./e2e -v && make build`  
Expected: PASS and creates standalone executable.

- [ ] **Step 5: Commit**

```bash
git add e2e Makefile
git commit -m "feat: complete E2E verification and single-binary build configuration"
```
