# 15 — Tauri Plugins

Tauri's functionality is extended through plugins. This tutorial explains how plugins work, how to use them, and the plugin our project currently uses.

## Prerequisites

- [10 — Tauri Architecture](10-tauri-architecture.md)
- [12 — Rust Entry Point Deep Dive](12-rust-entry-point-deep-dive.md)
- [14 — Tauri Commands and IPC](14-tauri-commands-and-ipc.md)

## What is a Tauri Plugin?

A **Tauri plugin** is a reusable package that adds native functionality to your app. Each plugin typically provides three things:

```
Tauri Plugin
├── Rust crate     — Backend implementation (.plugin() in lib.rs)
├── JS package     — Frontend API (npm @tauri-apps/plugin-xxx)
└── Permissions    — Capability declarations (capabilities/*.json)
```

Examples of what plugins can do:
- Read/write files (`tauri-plugin-fs`)
- Open file dialogs (`tauri-plugin-dialog`)
- Send desktop notifications (`tauri-plugin-notification`)
- Run shell commands (`tauri-plugin-shell`)
- Access the SQLite database (`tauri-plugin-sql`)
- Read/write persistent key-value store (`tauri-plugin-store`)

## Our Plugin: `tauri-plugin-opener`

Our project uses one plugin: **`tauri-plugin-opener`**. It allows the app to open URLs and files using the operating system's default handler.

### Why Include It?

The Tauri template includes it as a default. Even though our snake game doesn't open URLs, the plugin infrastructure is there if we ever want to add features like:
- Clicking a link in the game (e.g., "Rate this game")
- Opening a help file
- Opening the score export location

### Three Parts of the Opener Plugin

**1. Rust side** — `Cargo.toml` dependency:

```toml
[dependencies]
tauri-plugin-opener = "2"
```

Registered in `lib.rs`:

```rust
.plugin(tauri_plugin_opener::init())
```

**2. Frontend side** — npm package:

```json
"dependencies": {
  "@tauri-apps/plugin-opener": "^2"
}
```

If we wanted to use it:

```typescript
import { openUrl } from '@tauri-apps/plugin-opener';

await openUrl('https://example.com');
```

**3. Permissions** — in `capabilities/default.json`:

```json
"permissions": [
  "core:default",
  "opener:default"
]
```

The `"opener:default"` permission allows the basic open functionality.

## Finding and Adding a Plugin

### Where to Find Plugins

Official Tauri plugins are listed at:
- [https://tauri.app/plugin/](https://tauri.app/plugin/)
- [https://crates.io/](https://crates.io/) (Rust crates tagged with `tauri-plugin`)
- [https://www.npmjs.com/](https://www.npmjs.com/) (npm packages `@tauri-apps/plugin-*`)

### Steps to Add a New Plugin

Let's say we want to add the **store plugin** (key-value storage, useful for saving game settings):

**Step 1: Install the npm package**

```bash
npm install @tauri-apps/plugin-store
```

**Step 2: Add the Rust crate**

In `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-store = "2"
```

**Step 3: Register the plugin**

In `src-tauri/src/lib.rs`:

```rust
.plugin(tauri_plugin_store::Builder::default().build())
```

**Step 4: Add permissions**

In `capabilities/default.json`:

```json
"permissions": [
  "core:default",
  "opener:default",
  "store:default"
]
```

**Step 5: Use in frontend**

```typescript
import { load } from '@tauri-apps/plugin-store';

const store = await load('settings.json');
await store.set('language', 'en');
await store.save();
```

## How Plugins Work Internally

A Tauri plugin is essentially a struct that implements the `tauri::plugin::Plugin` trait:

```rust
pub struct MyPlugin;

impl Plugin for MyPlugin {
    fn name(&self) -> &'static str {
        "my-plugin"
    }

    fn initialize(&mut self, app: &AppHandle) -> PluginResult<()> {
        // Setup code here
        Ok(())
    }

    fn extend_context(&mut self, context: &mut Context) -> PluginResult<()> {
        // Add commands, menus, etc.
        Ok(())
    }
}
```

When you call `.plugin(MyPlugin)`, Tauri:

1. Calls `initialize()` to set up the plugin
2. Calls `extend_context()` to register commands and menus
3. Adds the plugin's permissions to the permission system
4. Makes the plugin's frontend API available

## Plugin Categories

| Category | Plugins | Use Case |
|----------|---------|----------|
| **File System** | `fs`, `dialog` | Read/write files, open/save dialogs |
| **System** | `shell`, `process`, `clipboard-manager` | Run commands, manage processes, clipboard |
| **UI** | `notification`, `dialog`, `window-state` | Native notifications, dialogs, save window position |
| **Data** | `store`, `sql` | Persistent storage, SQLite databases |
| **Network** | `http`, `updater` | HTTP requests, auto-updates |
| **Media** | `fs`, `dialog` (open file) | Open media files |
| **Auth** | `oauth` | OAuth login flows |

## Building a Custom Plugin

If you have functionality you want to reuse across multiple Tauri apps, you can create your own plugin:

```
my-plugin/
├── src/
│   └── lib.rs          # Plugin implementation + commands
├── permissions/         # Default permission sets
│   └── default.toml
├── Cargo.toml           # Rust package definition
├── package.json         # npm package (generated)
└── webview-src/         # Frontend JS API source
```

Creating custom plugins is advanced — beyond this tutorial series. But knowing the plugin architecture helps you understand how Tauri apps are structured.

## Key Takeaways

- **Plugins** extend Tauri with native functionality (files, notifications, dialogs, etc.)
- **Three parts**: Rust crate + npm package + permissions
- **`tauri-plugin-opener`** is included by default in the template
- To add a plugin: install npm package + add Cargo dependency + register + add permissions
- Plugins implement the `Plugin` trait and are registered with `.plugin()`
- The permission system controls what each plugin can do

---

Next: [16 — Building and Distribution](16-building-and-distribution.md)
