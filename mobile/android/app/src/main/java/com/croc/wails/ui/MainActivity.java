package com.croc.wails.ui;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "CrocMainActivity";
    private static Process daemonProcess = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        startCrocDaemon();
    }

    private void startCrocDaemon() {
        new Thread(() -> {
            try {
                File binDir = new File(getFilesDir(), "bin");
                if (!binDir.exists() && !binDir.mkdirs()) {
                    Log.e(TAG, "Failed to create binary directory: " + binDir.getAbsolutePath());
                }

                File daemonFile = new File(binDir, "croc-daemon");

                // Always copy daemon from APK assets to ensure it matches current app version
                String assetName = "bin/croc-daemon-arm64";
                try (InputStream in = getAssets().open(assetName);
                     OutputStream out = new FileOutputStream(daemonFile)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    out.flush();
                }

                if (!daemonFile.setExecutable(true, true)) {
                    Log.w(TAG, "setExecutable returned false for " + daemonFile.getAbsolutePath());
                }

                // If a daemon is already running, stop it first
                if (daemonProcess != null) {
                    try {
                        daemonProcess.destroy();
                    } catch (Exception ignored) {}
                }

                Log.i(TAG, "Launching croc-daemon on 127.0.0.1:8080...");
                ProcessBuilder pb = new ProcessBuilder(
                    daemonFile.getAbsolutePath(),
                    "-port", "8080",
                    "-host", "127.0.0.1"
                );
                pb.directory(getFilesDir());
                daemonProcess = pb.start();
                Log.i(TAG, "croc-daemon successfully started.");

            } catch (Exception e) {
                Log.e(TAG, "Error starting croc micro-daemon: " + e.getMessage(), e);
            }
        }).start();
    }

    @Override
    public void onDestroy() {
        if (daemonProcess != null) {
            try {
                Log.i(TAG, "Stopping croc micro-daemon...");
                daemonProcess.destroy();
                daemonProcess = null;
            } catch (Exception e) {
                Log.e(TAG, "Error stopping daemon: " + e.getMessage());
            }
        }
        super.onDestroy();
    }
}
