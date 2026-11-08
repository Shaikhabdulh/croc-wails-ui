# Installation & Platform Guide

This document outlines how to install and run **croc-wails-ui** on all supported operating systems, Linux distributions, architectures, and mobile platforms.

---

## 1. Linux Distributions

### Ubuntu, Debian, Linux Mint, Pop!_OS, Zorin OS (`.deb`)
Download the `.deb` package matching your CPU architecture (`amd64` for Intel/AMD or `arm64` for Raspberry Pi / ARM):
```bash
# Install via apt (automatically resolves WebKitGTK / GTK3 dependencies)
sudo apt install ./croc-wails-ui_1.0.0_amd64.deb
```
Or via dpkg:
```bash
sudo dpkg -i croc-wails-ui_1.0.0_amd64.deb
sudo apt-get install -f
```
Once installed, launch `croc-wails-ui` from your terminal or application launcher.

---

### Fedora, RHEL, AlmaLinux, Rocky Linux, openSUSE (`.rpm`)
Download the `.rpm` package:
```bash
# On Fedora / RHEL
sudo dnf install ./croc-wails-ui.x86_64.rpm

# On openSUSE
sudo zypper install ./croc-wails-ui.x86_64.rpm
```

---

### Universal Linux Portable (`.AppImage`)
Runs on any Linux distribution without needing root permissions or installation:
```bash
chmod +x croc-wails-ui-1.0.0-x86_64.AppImage
./croc-wails-ui-1.0.0-x86_64.AppImage
```

---

### Arch Linux, Manjaro, EndeavourOS (Tarball or AUR)
Extract the portable tarball to `/usr/local`:
```bash
tar -xzf croc-wails-ui-1.0.0-linux-amd64.tar.gz
cd croc-wails-ui
sudo ./install.sh
```

---

## 2. Windows 10 & Windows 11

### Standard 64-bit Windows (`x86_64`)
- Download `croc-wails-ui-x86_64.exe`.
- Double-click to launch. Requires no external dependencies (uses Windows built-in WebView2 runtime).

### Windows on ARM (`arm64`)
- Download `croc-wails-ui-arm64.exe` for native execution on Snapdragon X Elite and Surface Pro ARM devices.

### Legacy Windows 32-bit (`x86`)
- Download `croc-wails-ui-x86.exe` for older 32-bit Windows systems.

---

## 3. macOS (Apple Silicon & Intel)

### Universal `.dmg` Installer
1. Download `croc-wails-ui-Universal.dmg`.
2. Double-click the `.dmg` file to open.
3. Drag **Croc** into your **Applications** folder.
4. Launch Croc from Launchpad or Spotlight.

*Note for macOS Gatekeeper:* If prompted on first launch, right-click `Croc.app` and select **Open**, or allow it under **System Settings > Privacy & Security**.

---

## 4. Android (Mobile & Tablet)

1. Download `croc-ui.apk`.
2. Transfer or download the APK to your Android device.
3. Tap the file in your file manager to install (enable "Install unknown apps" if prompted).
4. Launch Croc to send and receive files directly with your phone storage.

---

## 5. Headless / Server / Web Mode

On servers or NAS devices without a display, run the built-in micro-daemon:
```bash
croc-wails-ui --server --port 8080
```
Open `http://localhost:8080` or `http://<server-ip>:8080` in any web browser on your local network to access the full transfer interface.
