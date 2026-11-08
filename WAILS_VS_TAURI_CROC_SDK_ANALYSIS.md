# Wails v3 & Croc Integration: Comprehensive Architectural Analysis & Feasibility Study

**Project:** Croc Interface (Simple & Short Team GUI)  
**Location:** `/media/shaikh-family/Data/Code/Projects/Project-interface`  
**Date:** November 2026  
**Upstream Engine:** [schollz/croc](https://github.com/schollz/croc) (v11, Go)  

---

## 1. Wails v3: Complete Overview

### What is Wails v3?
Wails is an open-source framework that allows developers to build lightweight, cross-platform desktop applications using **Go** as the backend and standard web technologies (**HTML, CSS, JavaScript/TypeScript, React, Vue, Svelte**) as the frontend.

Unlike Electron (which packages an entire Chromium browser and Node.js runtime, weighing 150MB+), Wails uses the operating system's native webview engine:
* **Linux:** WebKitGTK (`webkit2gtk-4.1` / `gtk3`)
* **Windows:** Microsoft Edge WebView2
* **macOS:** WKWebView

### The Wails v3 Architecture
Wails v3 is a ground-up rewrite from v2:
* **Explicit Object Model:** Everything is an explicit Go object (`application.New(options)`, `app.NewWebviewWindowWithOptions(...)`).
* **Direct Event-Driven API:** Direct bidirectional event bus (`app.EmitEvent()`, `Events.On()`) connecting Go goroutines to frontend JavaScript.
* **Auto-Generated TypeScript Bindings:** Wails analyzes your Go structs and methods at build time and generates strictly typed TypeScript bindings in the frontend automatically.
* **Single Binary Output:** The compiled Go executable bundles the HTML/JS/CSS assets directly into the binary using Go's `embed` package (`//go:embed all:frontend/dist`).

### Wails v3: Advantages & Disadvantages

| Feature | Wails v3 Advantages | Wails v3 Disadvantages / Risks |
| :--- | :--- | :--- |
| **Language Fit** | **100% Go native.** Because `croc` is written in Go, both live in the same runtime memory space. | Requires Go toolchain and CGO compilation (`gcc`, `pkg-config`). |
| **Binary Size** | Tiny footprint (~15MB - 25MB total), instant launch time. | Linux requires `libwebkit2gtk-4.1-dev` installed to build. |
| **Process Model** | **In-process.** No child process zombies, no command-line escaping. | Any fatal panic in Go crashes the entire UI window. |
| **Developer DX** | Live-reload Vite dev server with native Go method hot-binding. | v3 has frequent updates and newer API changes compared to v2. |

---

## 2. In-Depth Comparison: Wails v3 vs. Tauri 2 for Croc

| Criteria | Wails v3 (Go + Webview) | Tauri 2 (Rust + Webview) |
| :--- | :--- | :--- |
| **Backend Language** | **Go** (Same as `croc`) | **Rust** (Mismatch with `croc`) |
| **How Croc is Run** | **Direct in-process function calls** (`c.Send()`, `c.Receive()`) | **Child subprocess** (`croc send ...` via `tauri-plugin-shell`) |
| **Progress Tracking** | Direct Go struct callbacks (`OnProgress(ProgressEvent)`) | Parsing messy ANSI string streams from `stderr` pipe |
| **User Prompts (Accept / Overwrite)** | Clean Go channel wait (`select { case ok := <-acceptChan: }`) | Impossible or fragile (must force `--yes` or hack stdin pipe) |
| **Toolchain on your OS** | Need to install `go` | `cargo` & `rustc` already installed |
| **Team Simplicity Goal** | **Superior**: Native dialogs, precise event states, no detached CLI | Requires packaging separate OS binaries into sidecar folder |

---

## 3. Can We Use Croc's Backend Repo as an SDK? (The Compatibility Truth)

### The Core Problem with Raw Upstream `schollz/croc`
Can we simply do `import "github.com/schollz/croc/v11/src/croc"`?
**Technically yes, but practically with major limitations unless handled properly.**

When inspecting the actual source code of `schollz/croc/src/croc/croc.go`:
1. **Hardcoded Terminal UI (`termui`):**
   * Upstream Croc hardcodes progress bars directly to `os.Stderr` (`termui.Output(os.Stderr)`).
   * It has **no built-in public callback** in standard `croc.Options` (no `OnProgress` func).
2. **Terminal `os.Stdin` Prompts:**
   * In `askReceiveOverwrite()`, Croc prompts via `utils.GetInputContext()`, which blocks on standard keyboard input (`os.Stdin`). If run in a GUI without a terminal, it deadlocks.
3. **Text Message Hijacking:**
   * When receiving text, Croc writes the text to a temporary file and prints it to `os.Stdout`.

### The Proven Solution: The Clean Callback Hook Adapter
Prior art in `croc-desktop` demonstrated the exact production solution:
Instead of rewriting Croc's cryptographic engine (SPAKE2, PAKE, AES-GCM, TCP/Tailcat), we add a lightweight **`Hooks`** interface to the engine:

```go
type Hooks struct {
    OnStateChange      func(state string)           // "connecting", "waiting", "transferring"
    OnProgress         func(p ProgressEvent)        // percentage, bytes, speed, ETA
    OnAcceptRequest    func(req AcceptRequest) bool // GUI prompt: "User X wants to send file Y (120MB). Accept?"
    OnOverwriteRequest func(path string, pct float64) bool
    OnText             func(text string)
}
```

This gives us the **dream architecture**:
* Upstream Croc handles all heavy lifting: encryption, P2P NAT punching, relay fallback, file chunking, resume hashing.
* The Go backend hooks directly into Wails v3 events.
* The Frontend (React/Vue/Svelte) renders clean, beautiful progress bars, drag-and-drop zones, and simple "Accept / Decline" buttons for non-technical team members!

---

## 4. Proposed User Experience for Non-Technical Teams

To make this effortless for team members who don't know CLI:

### 📤 1-Click Send Screen
1. **Drag & Drop:** Drop any file or folder onto the window.
2. **Instant Code Generation:** UI displays a huge, clean code phrase (e.g., `7-comet-orbit`) with a **"Click to Copy"** button and an optional **QR code**.
3. **Live Status:** Shows "Waiting for receiver...", then transitions to a smooth percentage bar with transfer speed (e.g., `42.5 MB/s`).

### 📥 1-Click Receive Screen
1. **Input Box:** Single input field: *"Paste code phrase here"*.
2. **Approval Modal:** *"Alice is sending you 'Q3-Report.pdf' (14.2 MB). Accept transfer? [Decline] [Accept]"*.
3. **Completion:** *"Downloaded to ~/Downloads/Q3-Report.pdf"*, with a **"Show in Folder"** button.

### ⚙️ Settings (Under the Hood)
* Option to toggle **"Local Network Only (LAN)"** for maximum speed within the office.
* Option to point to a custom company relay server (optional).
