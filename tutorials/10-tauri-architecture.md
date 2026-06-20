# 10 — Tauri Architecture

This tutorial provides a high-level understanding of Tauri's architecture. We'll explore how Tauri differs from other desktop frameworks and how its components work together.

## Prerequisites

- [00 — Prerequisites & Setup](00-prerequisites-and-setup.md)
- [01 — Project Structure](01-project-structure.md)
- No prior Tauri or desktop app knowledge required

## What is Tauri?

**Tauri** is a framework for building **desktop applications** using web technologies (HTML, CSS, JavaScript/TypeScript) combined with a **Rust backend**.

Every Tauri app consists of two parts:

```
┌─────────────────────────────────────┐
│            Tauri App                 │
│                                      │
│  ┌────────────────┐  ┌────────────┐  │
│  │   WebView      │  │  Rust Core │  │
│  │  (Frontend)    │  │ (Backend)  │  │
│  │                │  │            │  │
│  │  React / Vue   │  │  Window    │  │
│  │  / Svelte etc. │  │  Mgmt     │  │
│  │                │  │  File Sys  │  │
│  │  Canvas / DOM  │◀─┤  Commands  │  │
│  │                │  │  Plugins   │  │
│  └────────────────┘  └────────────┘  │
└─────────────────────────────────────┘
```

- **WebView**: Renders the frontend (React, in our case). This is not a full browser — it's a lightweight web rendering control provided by the operating system.
- **Rust Core**: Manages the native window, handles system-level operations, runs Tauri commands, and loads plugins.

## Tauri vs Electron

To understand Tauri, it helps to compare it with the most popular alternative: **Electron** (used by VS Code, Slack, Discord, etc.).

| Aspect | Tauri | Electron |
|--------|-------|----------|
| **Frontend** | WebView (OS-native) | Chromium (bundled) |
| **Backend** | Rust | Node.js |
| **App size** | ~3-10 MB | ~150-300 MB |
| **Memory** | ~50-150 MB | ~200-500 MB |
| **Security** | Capability-based + CSP | CSP only |
| **Language** | Rust (compiled) | JavaScript (interpreted) |
| **Package management** | Cargo (Rust) + npm (JS) | npm only |

**Why is Tauri smaller?**

Electron bundles an entire Chromium browser with every app — that's ~150MB of duplicated browser engine. Tauri uses the **OS-native WebView** (Edge WebView2 on Windows, WebKit on macOS/Linux), which is already installed on modern systems.

On Windows 10/11, Edge WebView2 comes pre-installed. This means a Tauri app's installer can be as small as 3-5 MB.

## The WebView

A **WebView** is an operating system component that renders web content without the full browser UI (no address bar, no tabs, no bookmarks).

- **Windows**: Edge WebView2 (based on Chromium)
- **macOS**: WKWebView (based on Safari/WebKit)
- **Linux**: WebKitGTK

The WebView is like an iframe that fills the entire window. You can't access browser developer tools from outside the app (though Tauri provides a devtools plugin for development).

## The Rust Core

When you start a Tauri app, the Rust binary runs, creates the native window, instantiates the WebView, and loads your frontend code.

The Rust core handles:

1. **Window management**: creating, resizing, minimizing, closing windows
2. **IPC bridge**: receiving commands from the frontend and sending responses
3. **Plugin system**: loading Tauri plugins that add native functionality
4. **System integration**: tray icons, notifications, file dialogs, etc.
5. **App lifecycle**: startup, shutdown, updates

## The IPC Bridge

The frontend (JavaScript) and backend (Rust) communicate through **IPC** (Inter-Process Communication). But wait — aren't they in the same process?

Actually, in modern Tauri (v2), the frontend runs in the WebView process (potentially separate from the Rust process, depending on the platform). The IPC bridge serializes messages as JSON strings and passes them through a channel.

The flow for a Tauri command:

```
1. JavaScript calls: invoke('my_command', { arg1: 'hello' })
2. IPC serializes this to JSON: {"cmd":"my_command","args":{"arg1":"hello"}}
3. Rust receives the JSON, deserializes it
4. Rust finds the #[tauri::command] handler function
5. Runs the function, gets the return value
6. Serializes the return value to JSON
7. JavaScript receives the JSON response
```

We'll explore this in detail in tutorial 14.

## Process Architecture

Tauri v2 has two possible process models:

**Multi-process (default)**: The WebView runs in a separate process from the Rust core. This improves security and stability — if the frontend crashes, the Rust core keeps running.

**Single-process**: Everything runs in one process. Simpler but less secure.

The process model is handled automatically by Tauri — you don't need to configure it.

## The Plugin Ecosystem

Tauri functionality is extended through **plugins**. Each plugin typically provides:

- A **Rust crate** (backend functionality)
- A **JavaScript API** (frontend bindings)
- **Permissions** (capability declarations)

Our app uses `tauri-plugin-opener`, which provides the ability to open URLs/files with the OS default handler. Even though we don't explicitly call it in our code, it's included by the Tauri template and registered in `lib.rs`.

Common Tauri plugins:
- `tauri-plugin-fs` — File system access
- `tauri-plugin-shell` — Run shell commands
- `tauri-plugin-dialog` — Native file open/save dialogs
- `tauri-plugin-notification` — Desktop notifications
- `tauri-plugin-store` — Persistent key-value store

## The Build Pipeline

When you run `npm run tauri build`, the pipeline is:

```
1. npm run build (TypeScript → Vite → dist/)
2. Cargo compiles src-tauri/ (lib.rs, main.rs)
3. Rust binary embeds dist/ as static assets
4. Binary is linked with WebView2 loader
5. Output: executable + installer
```

The compiled executable contains both the Rust binary and the compressed frontend files. When the user runs the app, Rust extracts the frontend to a temporary location and instructs the WebView to load it.

## Security Model

Tauri v2 uses a **capability-based security model**. Instead of the frontend having unlimited access to the Rust backend, the app must explicitly declare permissions in `src-tauri/capabilities/`.

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default"
  ]
}
```

This declares:
- This permission set applies to the `main` window
- It allows default core operations
- It allows default opener plugin operations

If a plugin requires specific permissions (e.g., writing files), they must be explicitly added here. This prevents the frontend from accidentally using capabilities it doesn't need.

## Key Takeaways

- **Tauri** = WebView frontend + Rust backend
- **Much smaller and lighter** than Electron (uses OS-native WebView)
- **IPC bridge** connects JavaScript and Rust via JSON messages
- **Plugins** extend native functionality
- **Capability-based security** restricts what the frontend can do
- **Build pipeline**: Vite builds frontend → Cargo compiles Rust → Bundled into executable

---

Next: [11 — Rust Basics](11-rust-basics.md)
