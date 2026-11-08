# Croc Interface — Research & Architectural Knowledge Base

**Project Location:** `/media/shaikh-family/Data/Code/Projects/Project-interface`  
**Upstream Reference:** [schollz/croc](https://github.com/schollz/croc) (MIT License)

---

## 1. How Croc Works Under the Hood

`croc` is an encrypted, peer-to-peer file transfer engine authored by Zack Scholl in Go.

```
+------------+       1. Register Phrase       +------------------+
|   Sender   | -----------------------------> |                  |
|  (Client)  |                                |   Relay Server   |
+------------+                                |  (default public |
      |                                       | or self-hosted)  |
      | 2. PAKE Key Exchange (SPAKE2)         |                  |
      + - - - - - - - - - - - - - - - - - - - |                  |
      |                                       +------------------+
      |                                                ^
      |                                                | 1. Join with Phrase
      | 3. Direct P2P TCP Stream (Fallback to Relay)  |
      +==============================================> +------------+
      |        End-to-End Encrypted Payload           |  Receiver  |
      |          (AES-256-GCM / ChaCha20)             |  (Client)  |
      +----------------------------------------------> +------------+
```

### Core Protocols & Workflow
1. **Password-Authenticated Key Exchange (PAKE / SPAKE2):**
   * The sender generates a human-friendly code phrase (e.g., `7-comet-orbit`).
   * Both sender and receiver connect to a rendezvous relay server using this code phrase.
   * SPAKE2 cryptographic exchange allows both clients to compute an identical symmetric encryption key without ever revealing or transmitting the secret passphrase across the wire.
2. **End-to-End Encryption (E2EE):**
   * All file metadata, file names, directory hierarchies, and file chunks are encrypted with client-side keys (AES-256-GCM).
   * The relay server only forwards encrypted raw byte streams and cannot decrypt, inspect, or store files.
3. **Transport & NAT Traversal:**
   * Croc probes local network interfaces and public IP reflection (STUN-like).
   * It attempts a direct local/P2P TCP connection between machines. If blocked by firewalls or NAT, it smoothly falls back to multiplexing over the relay server.
4. **Resumption & Compression:**
   * Large files are chunked into blocks. If interrupted, `croc` verifies already received chunks and resumes without re-downloading from scratch.

---

## 2. CLI Automation & Stream Parsing

When driving `croc` from an external UI process:
* **Interactive vs. Unattended Flags:**
  * `--yes`: Bypasses confirmation prompts (`Overwrite existing file? y/N`).
  * `--overwrite`: Automatically allows updating/overwriting destination files.
  * `--stdout`: Pipes received payloads to standard out while streaming logs and progress metrics exclusively to `stderr`.
* **Sidecar Execution:**
  * The frontend process spawns the `croc` binary as a child process.
  * Real-time progress percentage, transfer speed, elapsed time, and errors are captured via `stderr` event parsing.

---

## 3. UI Architectural Approaches

| Approach | Frontend | Backend / Core | Strengths | Trade-offs |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Tauri 2 + React / TS** *(Recommended)* | React / Tailwind / Lucide Icons | Rust backend wrapping `croc` as an embedded sidecar binary | • Native OS footprint (~15MB RAM)<br>• Modern portfolio-grade UI<br>• Full Rust & Bun toolchains already present on machine<br>• Cross-platform compilation | Requires bundling the pre-compiled `croc` binary per target OS |
| **Option B: Wails v3 + Go** | Webview (React/Svelte) | Go backend importing `github.com/schollz/croc/v11/src` directly | In-process Go library calls without spawning separate subprocesses | Requires installing the Go toolchain (not currently installed on this system) |
| **Option C: Electron + Vite** | React / Tailwind | Node.js child_process | Broad platform support and quick prototyping | Heavy runtime memory consumption (~150MB+ idle) |

---

## 4. Prior Art & Benchmarks
* **interfluve-wav/croc-gui:** Built with Tauri + React. Demonstrates QR-code generation for code phrases and local-only network toggle.
* **KD-MM2/crock:** Built with Electron. Features binary auto-updater and session history.
* **SihanTeng/croc-desktop:** Built with Wails in Go. Demonstrates in-process Go SDK embedding.
