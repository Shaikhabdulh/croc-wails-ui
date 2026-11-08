# Croc Interface (Croc-GUI) — Design Document

**Date:** 2026-11-08  
**Status:** Pending User Approval  
**Project Path:** `/media/shaikh-family/Data/Code/Projects/Project-interface`  
**Core Technologies:** Go 1.23+, Wails v3, React + Tailwind CSS (Vite), Upstream Croc v11 Engine  

---

## 1. Intent and The "Why"

`schollz/croc` is one of the fastest, most secure peer-to-peer file transfer tools available, but its CLI interface prevents adoption by non-technical team members, designers, and project managers. 

The goal of **Croc Interface** is to create a dead-simple, single-window desktop application that abstracts all terminal commands away into an intuitive **Drag, Drop, and Share** experience.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
* **Zero CLI Knowledge Required:** Anyone who can drag a file can send it; anyone who can paste a phrase can receive it.
* **1-Click / Drag-and-Drop Send:** Dropping a file/folder immediately generates a human-friendly code phrase and a QR code with an auto-copy button.
* **Streamlined Receive:** Pasting a phrase begins the transfer automatically, saving directly to `~/Downloads`, followed by an **"Open Folder"** button.
* **Real-time Feedback:** Smooth progress bars reporting transfer percentage, live throughput (MB/s), and time remaining.
* **Local LAN Acceleration:** Automatic or toggleable LAN-only mode for office networks, bypassing external relays to hit gigabit speeds.
* **True Single Binary:** Compiled into a single, self-contained executable with zero external runtime dependencies.

### Non-Goals
* Cloud storage / hosting (files are transferred directly peer-to-peer and never stored on a third-party server).
* User accounts, sign-ups, or login systems.
* Modifying Croc’s underlying cryptography (SPAKE2 / PAKE / AES-256-GCM stay untouched).

### Anti-Goals
* **No Bloat:** No unnecessary tabs, complex wizard flows, or heavy background daemons.
* **No Terminal Deadlocks:** No unhandled stdin/stdout stalls; all interactions are handled through native UI events.

---

## 3. Evaluated Approaches & Selection

| Approach | Architecture | Verdict | Reason |
| :--- | :--- | :--- | :--- |
| **Approach 1: Tauri 2 + Subprocess** | Rust backend calling `croc` binary via shell | *Rejected* | Spawns external CLI processes, risks zombie processes, requires fragile regex parsing of terminal stderr, and language mismatch with Go. |
| **Approach 2: Wails v3 + In-Process Engine** | Go backend directly embedding Croc engine + Webview | **SELECTED** | Native Go compatibility, direct in-process function execution, typed event bus, zero subprocess overhead, single binary artifact. |

---

## 4. System Architecture & Components

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React + Tailwind)              │
│  [Send Tab: Dropzone]     │   [Receive Tab: Input Box] │
│  [QR Code / Phrase]       │   [Live Progress / MB/s]   │
└───────────────────────────▲────────────────────────────┘
                            │ Wails v3 Event Bus
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Go Application Backend                 │
│                 (Wails v3 Window & IPC)                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │             Croc Hook Adapter Layer              │  │
│  │   • OnProgress   -> emits "transfer:progress"    │  │
│  │   • OnState      -> emits "transfer:state"       │  │
│  │   • OnDone       -> emits "transfer:done"        │  │
│  │   • OnError      -> emits "transfer:error"       │  │
│  └──────────────────────────▲───────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │ In-Process Function Calls
┌─────────────────────────────▼──────────────────────────┐
│              Croc Engine (schollz/croc v11)            │
│  • PAKE (SPAKE2) Key Agreement                         │
│  • Local LAN Peer Discovery (UDP 9009)                 │
│  • End-to-End Encryption (AES-GCM)                     │
│  • TCP / Relay Data Multiplexing                       │
└────────────────────────────────────────────────────────┘
```

---

## 5. Feature Specifications

### 5.1 Send Workflow
1. User drops a file or folder into the dropzone (or clicks "Browse").
2. The UI switches to the **Active Transfer** state:
   * Generates code phrase (e.g., `4-courageous-donkey`).
   * Displays an interactive **Copy** button (copies code phrase with feedback).
   * Generates and displays a **QR Code** for mobile/camera hand-off.
3. Once the receiver connects:
   * State changes to `transferring`.
   * Displays real-time progress bar, speed in MB/s, and elapsed/remaining time.
4. On completion:
   * Shows success indicator and a "Send Another File" button.

### 5.2 Receive Workflow
1. User enters or pastes the code phrase into the input field and clicks **Receive**.
2. Transfer begins automatically (saving files directly to the user's `~/Downloads` directory).
3. Live progress bar shows file name, size, percentage, and current transfer rate.
4. On completion:
   * Displays a green checkmark with **"Saved to ~/Downloads"**.
   * Shows an **"Open Folder"** button that opens the system file manager directly to the received file.

### 5.3 Local LAN Mode (Office Wi-Fi Speedup)
* **How it works:** Croc uses UDP multicast discovery (`peerdiscovery` package). When both devices are on the same local subnet, Croc detects them and creates a direct internal TCP socket (e.g., `192.168.1.50:port`), bypassing the public relay entirely.
* **UI Control:** A simple toggle in the header: **"Local LAN Only"** (forces local transfer without internet relay for high-security or offline environments).

---

## 6. What Is Left to the Builder

* Establishing the clean Go module structure with Wails v3.
* Implementing the `Hooks` adapter to pipe progress events without terminal ANSI codes.
* Styling the clean, dark/light theme React interface using Tailwind CSS and Lucide icons.
* Verifying cross-platform folder opening (`xdg-open` on Linux, `open` on macOS, `explorer` on Windows).
