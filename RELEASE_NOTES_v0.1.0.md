# Croc GUI v0.1.0 — Initial Multi-Platform Release

An elegant, modern cross-platform GUI for [croc](https://github.com/schollz/croc) (created by **Zack Scholl, PhD**), built with Wails v3, React 19, TypeScript, and Tailwind CSS. Enables secure, encrypted peer-to-peer file transfers across any local network or the Internet with human-readable code phrases.

---

### 📦 Platform Download Matrix

| Platform | Architecture | Recommended Package | Description |
| :--- | :--- | :--- | :--- |
| **Android** | `arm64-v8a` / Universal | [`app-debug.apk`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/app-debug.apk) | Native Android Mobile Application (with integrated background daemon & QR scanner) |
| **Android / IoT** | `arm64` | [`croc-daemon-arm64`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-daemon-arm64) | Headless background micro-daemon |
| **iOS (iPhone/iPad)** | `arm64` / Universal | [`croc-wails-ui-ios-xcode-project.zip`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-ios-xcode-project.zip) | Ready-to-deploy Xcode Workspace (open in Xcode & run on physical iPhone) |
| **Linux** | `x86_64` (amd64) | [`croc-wails-ui-0.1.0-x86_64.AppImage`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-0.1.0-x86_64.AppImage) | Universal single-file executable (all Linux distros) |
| **Linux** | `x86_64` (amd64) | [`croc-wails-ui_0.1.0_amd64.deb`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui_0.1.0_amd64.deb) | Ubuntu / Debian / Linux Mint installer package |
| **Linux** | `x86_64` (amd64) | [`croc-wails-ui-0.1.0-linux-amd64.tar.gz`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-0.1.0-linux-amd64.tar.gz) | Standalone tarball with binary & desktop launcher |
| **Linux** | `arm64` (aarch64) | [`croc-wails-ui_0.1.0_arm64.deb`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui_0.1.0_arm64.deb) | Raspberry Pi 4/5 & ARM64 Debian/Ubuntu installer |
| **Linux** | `arm64` (aarch64) | [`croc-wails-ui-0.1.0-linux-arm64.tar.gz`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-0.1.0-linux-arm64.tar.gz) | ARM64 standalone tarball |
| **macOS** | Universal (Intel + Apple Silicon) | [`croc-wails-ui-Universal.dmg`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-Universal.dmg) | Drag-and-drop macOS disk image installer |
| **macOS** | Universal (Intel + Apple Silicon) | [`croc-wails-ui-macos-Universal.zip`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-macos-Universal.zip) | Standalone zipped `Croc.app` application bundle |
| **Windows** | `x86_64` (64-bit Intel/AMD) | [`croc-wails-ui-x86_64.exe`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-x86_64.exe) | Native Windows 64-bit GUI executable |
| **Windows** | `arm64` (ARM PCs) | [`croc-wails-ui-arm64.exe`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-arm64.exe) | Snapdragon X Elite / Surface Pro ARM64 executable |
| **Windows** | `x86` (32-bit legacy) | [`croc-wails-ui-x86.exe`](https://github.com/Shaikhabdulh/croc-wails-ui/releases/download/v0.1.0/croc-wails-ui-x86.exe) | Native Windows 32-bit executable |

---

### 📱 Mobile Setup Notes
- **Android**: Install `app-debug.apk` directly on any Android phone (enable "Install unknown apps"). Automatically extracts and runs the Croc engine, with camera QR code scanning and direct download to your phone's Downloads folder.
- **iOS (iPhone/iPad)**: Download `croc-wails-ui-ios-xcode-project.zip`, open `ios/App/App.xcworkspace` in Xcode on Mac, select your free personal Apple ID under Signing & Capabilities, and press Run to install directly on your device.

---

### ✨ Key Features
- **Live QR Scanner**: Receive files effortlessly by scanning the sender's QR code directly with your device's camera.
- **End-to-End Encryption**: PAKE (Password Authenticated Key Exchange) with zero-knowledge secret phrases.
- **NAT Traversal & Local Discovery**: Auto-detects computers on the local network or relays securely through public/custom relays.
- **Multi-File Queue**: Send and receive batches of files or complete folder hierarchies.
- **Desktop & Mobile Parity**: Consistent dark-mode UI with transfer speed charts, sound alerts, and file size formatting.
- **Native Clipboard Paste**: Press `Ctrl+V` / `Cmd+V` or tap Paste to immediately stage clipboard images or files.

### 💖 Credits & Acknowledgments
- **Core Engine**: [croc](https://github.com/schollz/croc) by **Zack Scholl, PhD** ([@schollz](https://github.com/schollz)).
