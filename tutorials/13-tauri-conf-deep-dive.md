# 13 — tauri.conf.json Deep Dive

`tauri.conf.json` is the central configuration file for your Tauri app. Changes here control everything from window size to installer format.

## Prerequisites

- [10 — Tauri Architecture](10-tauri-architecture.md)
- Basic understanding of JSON format

## Full Configuration

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "tauri-snake-game",
  "version": "0.1.0",
  "identifier": "com.ye.tauri-snake-game",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "tauri-snake-game",
        "width": 900,
        "height": 750
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

## Top-Level Fields

### `$schema`

```json
"$schema": "https://schema.tauri.app/config/2"
```

A JSON Schema URL that provides **autocompletion and validation** in editors like VS Code. When you edit this file, your editor can show documentation, suggest values, and flag errors.

### `productName`

```json
"productName": "tauri-snake-game"
```

The display name of the application. This appears in:
- The window title bar (unless overridden by `app.windows[].title`)
- The installer (e.g., "Tauri Snake Game Setup.exe")
- The Start Menu shortcut
- "Add or Remove Programs" list

### `version`

```json
"version": "0.1.0"
```

Semantic version. Used in:
- Installer metadata
- `Cargo.toml` version
- Update notifications (if using Tauri's updater)

### `identifier`

```json
"identifier": "com.ye.tauri-snake-game"
```

A **reverse-domain-name** identifier (like Android's package name). It should be globally unique. Tauri uses this to:
- Generate unique file paths for app data
- Register the app with the operating system
- Distinguish your app from others

## The `build` Section

```json
"build": {
  "beforeDevCommand": "npm run dev",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "npm run build",
  "frontendDist": "../dist"
}
```

This section orchestrates the frontend build process.

### `beforeDevCommand`

```json
"beforeDevCommand": "npm run dev"
```

Command run **before** `tauri dev` starts. It launches the Vite dev server (which serves the frontend on port 1420).

Tauri waits for this command to start serving before opening the window. The dev server's URL is then loaded into the WebView.

### `devUrl`

```json
"devUrl": "http://localhost:1420"
```

The URL the WebView loads in development mode. This matches Vite's configured port in `vite.config.ts`.

### `beforeBuildCommand`

```json
"beforeBuildCommand": "npm run build"
```

Command run **before** `tauri build`. It runs TypeScript type checking and Vite production build, outputting files to `dist/`.

### `frontendDist`

```json
"frontendDist": "../dist"
```

Path to the built frontend files, **relative to `src-tauri/`**. So `"../dist"` means the `dist/` directory at the project root.

In production builds, Tauri embeds these files into the Rust binary. They are extracted at runtime and served to the WebView.

> **Why relative to src-tauri/?**
> The Rust build process (`cargo build`) runs from the `src-tauri/` directory, so all paths in `tauri.conf.json` are relative to `src-tauri/`.

## The `app` Section

### Windows Configuration

```json
"windows": [
  {
    "title": "tauri-snake-game",
    "width": 900,
    "height": 750
  }
]
```

`windows` is an **array** — you can have multiple windows. Each window has:

**Basic options:**
- `title` — Window title text
- `width` / `height` — Initial window size in pixels
- `x` / `y` — Initial window position on screen (optional)
- `minWidth` / `minHeight` — Minimum window size (optional)
- `maxWidth` / `maxHeight` — Maximum window size (optional)
- `resizable` — Can the user resize the window? (default: `true`)
- `fullscreen` — Start in fullscreen? (default: `false`)

**Advanced options:**
- `decorations` — Show OS window chrome (title bar, borders)? (default: `true`)
- `transparent` — Make the window background transparent (requires specific WebView features)
- `alwaysOnTop` — Keep window above others (default: `false`)
- `skipTaskbar` — Don't show in taskbar (default: `false`)
- `visible` — Start visible? (default: `true`)

For a game like ours, you might want:

```json
{
  "title": "Snake Game",
  "width": 900,
  "height": 750,
  "resizable": true,
  "decorations": true,
  "center": true
}
```

The `center: true` option (not shown in our config) centers the window on the screen when it opens.

### Security Configuration

```json
"security": {
  "csp": null
}
```

**CSP** stands for **Content Security Policy**. It's a web security standard that restricts what resources the page can load and what actions it can perform.

A CSP string might look like:

```json
"csp": "default-src 'self'; img-src 'self' https:; style-src 'self' 'unsafe-inline'"
```

This would allow:
- Scripts/styles from the same origin (`'self'`)
- Images from HTTPS sources
- Inline styles (`'unsafe-inline'`)

Setting `"csp": null` disables CSP entirely. For development this is convenient, but for production you should set a proper CSP to prevent XSS attacks.

## The `bundle` Section

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
}
```

Controls how the app is packaged for distribution.

### `active`

```json
"active": true
```

If `false`, no installer/bundle is generated — you get only the raw executable.

### `targets`

```json
"targets": "all"
```

Which installer formats to generate. On Windows, the available targets are:

| Target | Description | File Extension |
|--------|-------------|----------------|
| `"nsis"` | NSIS installer (lightweight) | `.exe` |
| `"msi"` | Microsoft Installer | `.msi` |
| `"all"` | Both NSIS and MSI | Both |

NSIS is recommended for most users — it's smaller, faster, and supports custom installation paths.

On other platforms:
- macOS: `"dmg"`, `"app"`, or `"all"`
- Linux: `"deb"`, `"appimage"`, `"rpm"`, or `"all"`

You can specify an array to select specific targets:

```json
"targets": ["nsis", "msi"]
```

### `icon`

```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.icns",
  "icons/icon.ico"
]
```

Application icons in various formats and sizes:
- `.png` — Used for various OS purposes
- `.icns` — macOS icon format
- `.ico` — Windows icon format

When you run `npm run tauri build`, the icons are converted to the appropriate format for each target platform.

### Other Bundle Options

Not in our config, but useful:

```json
"bundle": {
  "publisher": "Your Name",
  "copyright": "2026",
  "licenseFile": "../LICENSE",
  "externalBin": ["../sidecar.exe"],
  "resources": ["../assets/*"],
  "shortDescription": "A fun snake game",
  "longDescription": "A classic snake game built with Tauri..."
}
```

- `publisher` / `copyright` — Metadata for the installer
- `externalBin` — Additional binaries bundled with the app
- `resources` — Extra files bundled with the app (accessible via resource path API)
- `shortDescription` / `longDescription` — Descriptions for package managers

## Capabilities: `capabilities/default.json`

While not part of `tauri.conf.json`, this file is critical:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default"
  ]
}
```

- `windows: ["main"]` — This capability applies to the window labeled `"main"`
- `permissions` — What operations this window is allowed to perform
  - `"core:default"` — Basic Tauri operations (window management, etc.)
  - `"opener:default"` — Default permissions for the opener plugin

If you add a plugin that needs specific permissions (e.g., `"fs:allow-read"` or `"shell:allow-open"`), you add them here.

## Key Takeaways

- **`tauri.conf.json`** controls everything from window size to installer format
- **`build` section** orchestrates the frontend build pipeline
- **`app.windows`** configures one or more windows (size, position, behavior)
- **`app.security.csp`** restricts what the WebView can load (null = disabled)
- **`bundle`** controls how the app is packaged (NSIS, MSI, DMG, etc.)
- **`identifier`** must be globally unique (reverse-domain format)
- **Capabilities** declare what each window is allowed to do

---

Next: [14 — Tauri Commands and IPC](14-tauri-commands-and-ipc.md)
