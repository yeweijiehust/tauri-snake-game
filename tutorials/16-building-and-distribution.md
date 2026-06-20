# 16 — Building and Distribution

The final step: turning your source code into a distributable Windows executable.

## Prerequisites

- [10 — Tauri Architecture](10-tauri-architecture.md)
- [13 — tauri.conf.json Deep Dive](13-tauri-conf-deep-dive.md)
- [15 — Tauri Plugins](15-tauri-plugins.md)

## The Build Command

```bash
npm run tauri build
```

This one command does everything:

1. **Builds the frontend** — Runs `npm run build` (TypeScript check + Vite production build)
2. **Compiles Rust** — Runs `cargo build --release` (optimized, no debug symbols)
3. **Embeds the frontend** — The Vite output (`dist/`) is embedded into the Rust binary
4. **Creates the executable** — A standalone `.exe` file
5. **Creates installers** — NSIS and/or MSI packages (depending on config)

## The Build Output

After a successful build, the output is in `src-tauri/target/release/`:

```
src-tauri/target/release/
├── tauri-snake-game.exe          ← Standalone executable (~5-8 MB)
└── bundle/
    ├── msi/
    │   └── Tauri Snake Game.msi  ← MSI installer
    └── nsis/
        └── Tauri Snake Game Setup.exe  ← NSIS installer
```

### The Standalone Executable

`src-tauri/target/release/tauri-snake-game.exe` is the raw binary. It's a **single file** that contains:
- The compiled Rust backend
- The embedded frontend files (HTML, JS, CSS)
- The WebView2 loader DLL

This file can be **copied to any Windows 10/11 machine and run directly**. No installation needed.

**File size**: ~5-8 MB. Compare to an Electron app which would be ~150+ MB.

**Requirements on target machine**:
- Windows 10 or later (Windows 7/8 might need WebView2 installed separately)
- No admin privileges needed (for the standalone exe)

### The Installers

**NSIS installer** (`Tauri Snake Game Setup.exe`):
- Smaller file (~3-5 MB)
- Installs to Program Files
- Creates Start Menu shortcut
- Can add Desktop shortcut
- Supports custom install location
- Can be signed with a code signing certificate

**MSI installer** (`Tauri Snake Game.msi`):
- Microsoft standard format
- Supports enterprise deployment (Group Policy)
- Can be silently installed (`msiexec /i "app.msi" /quiet`)
- Required for some enterprise environments

## Bundle Configuration

From tutorial 13, our config:

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": [...]
}
```

Changing `targets`:

```json
// Only NSIS (recommended for most users)
"targets": "nsis"

// Only MSI (enterprise environments)
"targets": "msi"

// Both
"targets": ["nsis", "msi"]
// or
"targets": "all"
```

## About the Console Window

Remember this line from `main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

- **Debug builds** (`tauri dev`): A console window appears — you can see `println!` output from Rust
- **Release builds** (`tauri build`): No console window — the app runs silently

If you want to see Rust error messages in a release build (for debugging), you can temporarily remove this attribute:

```rust
// Remove or comment out to see console in release builds
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    tauri_snake_game_lib::run()
}
```

But remember to add it back before distributing.

## The Build Pipeline in Detail

```
1. npm run build
   ├── tsc --noEmit          (TypeScript type check)
   └── vite build             (Bundle frontend → dist/)

2. cargo build --release
   ├── Compiles lib.rs        (Builder, plugins, commands)
   ├── Compiles main.rs       (Entry point)
   ├── Links dependencies     (tauri, tauri-plugin-opener, serde, etc.)
   ├── Embeds dist/           (Via tauri::generate_context!())
   └── Outputs .exe

3. tauri-bundler
   ├── Reads tauri.conf.json  (Bundle config, icons)
   ├── Creates NSIS installer (If target includes NSIS)
   └── Creates MSI installer  (If target includes MSI)
```

## Common Build Issues

### "Linker" errors on Windows

If you see errors about `LNK` or `link.exe`, you may need the **Microsoft C++ Build Tools**:

```bash
# Install Visual Studio Build Tools or
# Install only the required components via winget
winget install Microsoft.VisualStudio.2022.BuildTools
```

During installation, select "Desktop development with C++".

### WebView2 not found

If the user gets "WebView2 runtime not found" on an older system, they can download it from:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

Or you can bundle it with the installer by setting:

```json
"bundle": {
  "windows": {
    "wix": {
      "webviewInstallMode": "embedBootstrapper"
    }
  }
}
```

This adds the WebView2 bootstrapper to the installer (larger file size, but no separate download).

### Icon conversion fails

If the build fails on icon conversion, make sure you have the required icon format for your target:
- Windows: needs `.ico` file
- macOS: needs `.icns` file
- Linux: needs `.png` files

The `npm create tauri-app` template provides default icons. You can replace them with your own.

## Distribution Options

### 1. Direct executable

Copy `tauri-snake-game.exe` to any Windows machine. Simple but no installer experience.

### 2. Installer

Use the NSIS or MSI installer. Provides proper installation experience:
- Start Menu shortcut
- Add/Remove Programs entry
- File associations (if configured)
- Auto-update support (with `tauri-plugin-updater`)

### 3. Microsoft Store

Tauri apps can be packaged for the Microsoft Store. This requires:
- An MSI installer
- A Microsoft Partner account
- App submission through Partner Center

### 4. Auto-updater

Tauri has a built-in auto-update mechanism. With the `tauri-plugin-updater` plugin, you can:
- Host update files on a server
- Check for updates on startup
- Download and install updates silently
- Users always have the latest version

Setting up auto-updates is beyond this tutorial, but the infrastructure exists if you need it.

## Verifying the Build

After building, verify:

1. The executable runs standalone (outside the project folder)
2. All features work (game, i18n, history, modal)
3. The window title and icon are correct
4. The executable is virus-free (scan with Windows Defender)

## Key Takeaways

- **`npm run tauri build`** compiles everything into a distributable binary
- **3 outputs**: standalone `.exe`, NSIS installer, MSI installer
- **Standalone `.exe`** can be copied directly, no installation needed
- **NSIS** is the recommended installer format for most users
- **MSI** is for enterprise environments
- **Build pipeline**: TypeScript → Vite → Cargo compile → Bundle → Installer
- **Common issues**: C++ build tools, WebView2 missing, icon conversion
- **Distribution options**: Direct exe, installer, Microsoft Store, auto-updater

---

Congratulations! You've completed the tutorial series. You now understand every aspect of this Tauri Snake Game project — from TypeScript types and pure game logic to Rust entry points and Windows distribution.
