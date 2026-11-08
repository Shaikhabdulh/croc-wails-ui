# croc-wails-ui

> Unofficial cross-platform desktop UI for croc, built with Wails v3. Send and receive files and folders securely using croc's code phrases.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

**croc-wails-ui** provides a minimalist, clean desktop interface for [`schollz/croc`](https://github.com/schollz/croc). It brings the power of end-to-end encrypted peer-to-peer file transfer to everyone on your team—without requiring terminal or CLI experience.

### Features
- 🚀 **1-Click Drag & Drop Send:** Drop any file or folder to instantly generate a secure code phrase and QR code.
- 📥 **1-Click Auto Receive:** Paste a code phrase and download directly to your `~/Downloads` folder.
- ⚡ **Local LAN Mode:** Toggle local network transfer for maximum throughput without routing through public relays.
- 📊 **Real-Time Progress:** Live transfer progress, speed (MB/s), and ETA calculation.
- 🔒 **End-to-End Encrypted:** Leverages croc's proven PAKE (Password Authenticated Key Exchange) and AES-GCM encryption in-process.
- 🖥️ **Single Executable:** Compiles down to a standalone desktop binary powered by Wails v3 and React + Tailwind CSS.

---

## Getting Started

### Prerequisites
- [Go](https://go.dev/) 1.23+
- [Bun](https://bun.sh/) (or Node.js)
- Linux: `libwebkit2gtk-4.1-dev` and `build-essential`

### Development
```bash
# Clone the repository
git clone https://github.com/Shaikhabdulh/croc-wails-ui.git
cd croc-wails-ui

# Install frontend dependencies
cd frontend && bun install && cd ..

# Run tests
go test ./... -v
cd frontend && bun test && cd ..
```

---

## Legal & Attribution

This project is an unofficial UI for croc (https://github.com/schollz/croc),
licensed under the MIT License. See LICENSE and THIRD_PARTY_NOTICES.md.
