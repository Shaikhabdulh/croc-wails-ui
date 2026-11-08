#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERSION="0.1.0"
APP_NAME="croc-wails-ui"
BIN_SRC="${ROOT_DIR}/build/bin/${APP_NAME}"
DIST_DIR="${ROOT_DIR}/build/dist"
DESKTOP_SRC="${ROOT_DIR}/build/linux/${APP_NAME}.desktop"
ICON_SRC="${ROOT_DIR}/croc-wails-ui-logo.png"

# Detect architecture
UNAME_M="$(uname -m)"
case "${UNAME_M}" in
    x86_64)
        ARCH_DEB="amd64"
        ARCH_RPM="x86_64"
        ARCH_APPIMAGE="x86_64"
        ;;
    aarch64|arm64)
        ARCH_DEB="arm64"
        ARCH_RPM="aarch64"
        ARCH_APPIMAGE="aarch64"
        ;;
    armv7l|armhf)
        ARCH_DEB="armhf"
        ARCH_RPM="armv7hl"
        ARCH_APPIMAGE="armhf"
        ;;
    i386|i686)
        ARCH_DEB="i386"
        ARCH_RPM="i686"
        ARCH_APPIMAGE="i686"
        ;;
    *)
        ARCH_DEB="${UNAME_M}"
        ARCH_RPM="${UNAME_M}"
        ARCH_APPIMAGE="${UNAME_M}"
        ;;
esac

echo "=================================================="
echo " Packaging ${APP_NAME} v${VERSION} for Linux (${ARCH_DEB})"
echo "=================================================="

if [[ ! -f "${BIN_SRC}" ]]; then
    echo "==> Binary not found. Building ${BIN_SRC} first..."
    cd "${ROOT_DIR}" && make build
fi

mkdir -p "${DIST_DIR}"

# ----------------------------------------------------
# 1. Package Portable Tarball (.tar.gz)
# ----------------------------------------------------
echo "==> Creating portable tarball..."
TAR_TMP="${ROOT_DIR}/build/tmp_tar"
rm -rf "${TAR_TMP}"
mkdir -p "${TAR_TMP}/${APP_NAME}"

cp "${BIN_SRC}" "${TAR_TMP}/${APP_NAME}/${APP_NAME}"
cp "${DESKTOP_SRC}" "${TAR_TMP}/${APP_NAME}/${APP_NAME}.desktop"
cp "${ICON_SRC}" "${TAR_TMP}/${APP_NAME}/icon.png"

cat << 'EOF' > "${TAR_TMP}/${APP_NAME}/install.sh"
#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_BIN="/usr/local/bin/croc-wails-ui"
INSTALL_DESKTOP="/usr/share/applications/croc-wails-ui.desktop"
INSTALL_ICON="/usr/share/icons/hicolor/512x512/apps/croc-wails-ui.png"

echo "Installing croc-wails-ui..."
sudo cp "${DIR}/croc-wails-ui" "${INSTALL_BIN}"
sudo chmod +x "${INSTALL_BIN}"
sudo mkdir -p /usr/share/icons/hicolor/512x512/apps
sudo cp "${DIR}/icon.png" "${INSTALL_ICON}"
sudo cp "${DIR}/croc-wails-ui.desktop" "${INSTALL_DESKTOP}"
echo "Installation complete! Run 'croc-wails-ui' or find it in your application menu."
EOF
chmod +x "${TAR_TMP}/${APP_NAME}/install.sh"

TAR_OUTPUT="${DIST_DIR}/${APP_NAME}-${VERSION}-linux-${ARCH_DEB}.tar.gz"
tar -czf "${TAR_OUTPUT}" -C "${TAR_TMP}" "${APP_NAME}"
rm -rf "${TAR_TMP}"
echo "✓ Generated: ${TAR_OUTPUT}"

# ----------------------------------------------------
# 2. Package Debian Package (.deb)
# ----------------------------------------------------
echo "==> Creating Debian (.deb) package..."
DEB_TMP="${ROOT_DIR}/build/tmp_deb"
rm -rf "${DEB_TMP}"
mkdir -p "${DEB_TMP}/DEBIAN"
mkdir -p "${DEB_TMP}/usr/bin"
mkdir -p "${DEB_TMP}/usr/share/applications"
mkdir -p "${DEB_TMP}/usr/share/icons/hicolor/512x512/apps"
mkdir -p "${DEB_TMP}/usr/share/pixmaps"

cp "${BIN_SRC}" "${DEB_TMP}/usr/bin/${APP_NAME}"
chmod 755 "${DEB_TMP}/usr/bin/${APP_NAME}"
cp "${DESKTOP_SRC}" "${DEB_TMP}/usr/share/applications/${APP_NAME}.desktop"
chmod 644 "${DEB_TMP}/usr/share/applications/${APP_NAME}.desktop"
cp "${ICON_SRC}" "${DEB_TMP}/usr/share/icons/hicolor/512x512/apps/${APP_NAME}.png"
cp "${ICON_SRC}" "${DEB_TMP}/usr/share/pixmaps/${APP_NAME}.png"

cat << EOF > "${DEB_TMP}/DEBIAN/control"
Package: ${APP_NAME}
Version: ${VERSION}
Section: net
Priority: optional
Architecture: ${ARCH_DEB}
Maintainer: Abdulhadi Shaikh <shaikhabdulh@github.com>
Depends: libgtk-3-0, libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37
Description: Minimalist, secure desktop GUI for croc peer-to-peer file transfer
 Fast, end-to-end encrypted file transfer between computers, mobiles, and servers.
 Uses SPAKE2 password-authenticated key exchange and ChaCha20-Poly1305 stream cipher.
EOF

DEB_OUTPUT="${DIST_DIR}/${APP_NAME}_${VERSION}_${ARCH_DEB}.deb"
if command -v dpkg-deb >/dev/null 2>&1; then
    dpkg-deb --build "${DEB_TMP}" "${DEB_OUTPUT}" >/dev/null
else
    # Pure POSIX ar / tar fallback
    echo "2.0" > "${DEB_TMP}/debian-binary"
    (cd "${DEB_TMP}/DEBIAN" && tar -czf "${DEB_TMP}/control.tar.gz" control)
    (cd "${DEB_TMP}" && tar --exclude='./DEBIAN' --exclude='./debian-binary' --exclude='./control.tar.gz' -czf "${DEB_TMP}/data.tar.gz" ./usr)
    ar rcs "${DEB_OUTPUT}" "${DEB_TMP}/debian-binary" "${DEB_TMP}/control.tar.gz" "${DEB_TMP}/data.tar.gz"
fi
rm -rf "${DEB_TMP}"
echo "✓ Generated: ${DEB_OUTPUT}"

# ----------------------------------------------------
# 3. Create Universal AppDir & AppImage
# ----------------------------------------------------
echo "==> Assembling Universal AppDir..."
APPDIR="${DIST_DIR}/${APP_NAME}.AppDir"
rm -rf "${APPDIR}"
mkdir -p "${APPDIR}/usr/bin"
mkdir -p "${APPDIR}/usr/share/icons/hicolor/512x512/apps"

cp "${BIN_SRC}" "${APPDIR}/usr/bin/${APP_NAME}"
cp "${DESKTOP_SRC}" "${APPDIR}/${APP_NAME}.desktop"
cp "${ICON_SRC}" "${APPDIR}/${APP_NAME}.png"
cp "${ICON_SRC}" "${APPDIR}/.DirIcon"

cat << 'EOF' > "${APPDIR}/AppRun"
#!/bin/sh
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export PATH="${HERE}/usr/bin/:${PATH}"
exec "${HERE}/usr/bin/croc-wails-ui" "$@"
EOF
chmod 755 "${APPDIR}/AppRun"

APPIMAGE_OUTPUT="${DIST_DIR}/${APP_NAME}-${VERSION}-${ARCH_APPIMAGE}.AppImage"
if command -v appimagetool >/dev/null 2>&1; then
    ARCH="${ARCH_APPIMAGE}" appimagetool "${APPDIR}" "${APPIMAGE_OUTPUT}"
    echo "✓ Generated: ${APPIMAGE_OUTPUT}"
else
    echo "ℹ Note: 'appimagetool' not detected locally. AppDir created at:"
    echo "  ${APPDIR}"
    echo "  (Will be converted to standalone .AppImage automatically in GitHub Actions CI/CD)."
fi

echo "=================================================="
echo " Linux Packaging Completed Successfully!"
echo " Artifacts located in: ${DIST_DIR}"
echo "=================================================="
ls -lh "${DIST_DIR}"
