# Croc Mobile Shell (Android & iOS)

This directory provides the Capacitor native mobile wrapper that bundles the exact same React 19 + Tailwind frontend as the desktop app for **Android** (`.apk` / `.aab`) and **iOS** (`.ipa` / Xcode).

---

### Prerequisites

- **Node.js 18+** or **Bun 1.2+**
- **Android Studio** (for building Android APK/AAB) with Android SDK 26+ and NDK
- **Xcode** (on macOS, for building iOS IPA / running on iPhone or Simulator)

---

### Quick Setup

1. **Build the shared web frontend:**
   ```bash
   cd ../frontend
   bun install
   bun run build
   ```

2. **Install mobile dependencies:**
   ```bash
   cd ../mobile
   bun install
   ```

3. **Initialize Native Android & iOS Projects:**
   ```bash
   # Add Android project (generates mobile/android/)
   bunx cap add android

   # Add iOS project (generates mobile/ios/ on macOS)
   bunx cap add ios

   # Sync the built frontend assets into native folders
   bunx cap sync
   ```

---

### Building for Android

- **To open in Android Studio:**
  ```bash
  bunx cap open android
  ```
- **To build debug APK directly via command line:**
  ```bash
  cd android && ./gradlew assembleDebug
  ```
  The generated APK is located at:
  `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

- **To build production Google Play Store AAB:**
  ```bash
  cd android && ./gradlew bundleRelease
  ```

---

### Building for iOS (Requires macOS)

- **To open in Xcode:**
  ```bash
  bunx cap open ios
  ```
- Select your target device (iPhone or Simulator) and click **Run**, or choose **Product > Archive** to export `.ipa`.

---

### How the Go Core Runs on Mobile

The Go backend communicates with the mobile WebView using the **Dual-Mode Adapter** implemented in `frontend/src/api.ts`:
- On Android, the Go micro-daemon can run as an embedded foreground service or via Gomobile (`croc.aar`).
- The React UI automatically detects non-Wails environments and connects through the internal REST & SSE endpoints on `127.0.0.1`.
