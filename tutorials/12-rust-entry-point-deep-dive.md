# 12 — Rust Entry Point Deep Dive

This tutorial examines every line of the Rust entry point files in detail, explaining what each part does and why it's needed.

## Prerequisites

- [11 — Rust Basics](11-rust-basics.md)
- Understanding of Rust syntax (function definitions, macros, attributes)

## The Call Chain

When you run a Tauri app, the call chain is:

```
OS → main.exe → main() → lib::run() → tauri::Builder → Tauri app window
```

The frontend (`dist/`) is embedded inside the Rust binary and served to the WebView.

## `main.rs` — The Program Entry Point

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri_snake_game_lib::run()
}
```

### What `windows_subsystem` Does

On Windows, executables can be:

- **Console subsystem** (`windows_subsystem = "console"`): Opens a terminal window in addition to the GUI. Good for debugging (you can see `println!` output).
- **Windows subsystem** (`windows_subsystem = "windows"`): No terminal window. The app runs silently. This is what you want for a released desktop app.

The `cfg_attr` ensures:
- **Debug builds** (running `npm run tauri dev`): Console appears (useful for Rust error messages)
- **Release builds** (running `npm run tauri build`): No console

If you ever need to debug Rust code in release mode, you can temporarily comment out this line.

### The `main` Function

```rust
fn main() {
    tauri_snake_game_lib::run()
}
```

This is incredibly minimal. It just calls `run()` from the library crate. The library crate contains all the actual logic.

## `lib.rs` — The Application Setup

### Why Have a Separate Library Crate?

The `[lib]` section in `Cargo.toml` declares this as a library:

```toml
[lib]
name = "tauri_snake_game_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

Having both `main.rs` (binary) and `lib.rs` (library) allows:
- **Testing**: You can test library functions without running the binary
- **Code organization**: The entry point is separate from the logic
- **Mobile support**: Tauri v2 requires a library crate for mobile targets
- **Code reuse**: Other Rust projects could import this library

### The Mobile Entry Point

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
```

The `cfg_attr(mobile, ...)` attribute means: **if we're compiling for Android or iOS**, mark this function with `tauri::mobile_entry_point`. This tells Tauri's mobile runtime how to initialize the app.

On desktop, this attribute has no effect — `run()` is just a normal public function.

### The Builder Pattern

```rust
tauri::Builder::default()
```

`tauri::Builder` is the main configuration object for a Tauri app. You configure what plugins, commands, windows, and event handlers to use, then call `.run()` to start the app.

`Builder::default()` creates a new builder with default settings. This is the Rust equivalent of:

```typescript
// TypeScript equivalent
const builder = new TauriBuilder();
```

### Registering Plugins: `.plugin()`

```rust
.plugin(tauri_plugin_opener::init())
```

`.plugin()` registers a Tauri plugin. Each plugin extends Tauri with additional capabilities.

`tauri_plugin_opener::init()` calls the initialization function of the `tauri-plugin-opener` crate. This plugin allows the frontend to open URLs and files using the operating system's default handler.

The plugin pattern is:
1. The plugin crate is listed in `Cargo.toml` under `[dependencies]`
2. The plugin's permissions are declared in `capabilities/default.json`
3. The plugin is registered in `lib.rs` with `.plugin()`
4. The frontend can then call the plugin's JavaScript API

Without step 2 (permissions), the plugin's API would be blocked by Tauri's security system.

### Registering Commands: `.invoke_handler()`

```rust
.invoke_handler(tauri::generate_handler![greet])
```

`.invoke_handler()` registers one or more Rust functions as **Tauri commands** that the frontend can call.

`tauri::generate_handler![greet]` is a macro that:
1. Takes a comma-separated list of function names
2. Generates the necessary code to dispatch incoming IPC calls to the correct function
3. Handles argument deserialization and return value serialization

If you had multiple commands, you'd write:

```rust
.invoke_handler(tauri::generate_handler![greet, save_score, load_score])
```

### Starting the App: `.run()`

```rust
.run(tauri::generate_context!())
.expect("error while running tauri application");
```

`tauri::generate_context!()` is a macro that:
1. Reads `tauri.conf.json` at compile time
2. Reads `capabilities/` files at compile time
3. Embeds the frontend dist files into the Rust binary
4. Returns a `tauri::Context` object

This is why `tauri.conf.json` changes require a recompile — the configuration is embedded in the binary at build time.

`.run()` starts the Tauri application event loop. It:
1. Creates the native window (or windows, depending on config)
2. Instantiates the WebView
3. Loads the frontend code
4. Sets up the IPC bridge
5. Starts the event loop (handles window events, IPC calls, timers)

`.run()` returns a `Result` — if it fails (e.g., cannot create the window), it returns an error. `.expect()` catches this and prints the error message before crashing.

## What If `run()` Succeeds?

If everything works, `.run()` never returns — or rather, it returns when the user closes the app window. A successful return means the app was closed normally. The `.expect()` call wouldn't trigger because there's no error.

## The `greet` Command

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
```

This is a Tauri command. Let's examine how it would be called from the frontend:

```typescript
// Frontend (TypeScript)
import { invoke } from '@tauri-apps/api/core';

const message = await invoke('greet', { name: 'Tauri' });
console.log(message); // "Hello, Tauri! You've been greeted from Rust!"
```

The flow:

```
1. Frontend calls invoke('greet', { name: 'Tauri' })
2. IPC serializes to JSON: {"cmd":"greet","args":{"name":"Tauri"}}
3. Rust receives JSON, deserializes name as &str
4. Runs greet("Tauri"), gets String "Hello, Tauri!..."
5. Serializes return value to JSON: "\"Hello, Tauri!...\""
6. Frontend receives the string
```

However, in our current project, we **removed** the `invoke('greet')` call from the frontend (it was part of the original template). The `greet` function still exists in Rust but is never called. This is harmless — unused commands don't cause errors.

### Why `&str` Works

Tauri commands can take any parameter that implements `serde::Deserialize`. Basic types like `&str`, `String`, `i32`, `bool` work automatically. For complex types, you need `#[derive(Deserialize)]`:

```rust
#[derive(Deserialize)]
struct GameData {
    score: i32,
    duration: f64,
}

#[tauri::command]
fn save_game(data: GameData) {
    // data.score and data.duration are available
}
```

## Key Takeaways

- **`main.rs`** is minimal — it just calls `lib::run()`
- **`lib.rs`** configures the Tauri app using the Builder pattern
- **`.plugin()`** registers plugins (extend functionality)
- **`.invoke_handler()`** registers IPC command handlers
- **`generate_context!()`** embeds configuration and frontend at compile time
- **`generate_handler![]`** generates dispatch code for commands
- **`cfg_attr`** enables conditional compilation based on target or build mode
- **Separate lib + main** allows testing and mobile support

---

Next: [13 — tauri.conf.json Deep Dive](13-tauri-conf-deep-dive.md)
