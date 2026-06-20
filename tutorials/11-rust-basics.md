# 11 — Rust Basics

Before diving into the Tauri Rust code, we need enough Rust knowledge to read the boilerplate. This tutorial covers the minimum Rust concepts you need.

## Prerequisites

- [10 — Tauri Architecture](10-tauri-architecture.md)
- Programming experience in any language (JavaScript, Python, etc.)
- No prior Rust knowledge required

## Why Does Tauri Use Rust?

Rust was chosen for Tauri's backend because:

1. **Performance** — Rust compiles to native machine code (no garbage collector, no interpreter)
2. **Safety** — Rust's ownership system prevents memory bugs at compile time
3. **Small binaries** — No runtime, minimal overhead
4. **Cross-platform** — Compiles to Windows, macOS, Linux, Android, iOS

## Rust vs JavaScript: A Quick Comparison

| Concept | JavaScript | Rust |
|---------|-----------|------|
| Variable declaration | `let x = 5;` | `let x = 5;` |
| Constant declaration | `const x = 5;` | `const x: i32 = 5;` |
| Function | `function add(a, b) { ... }` | `fn add(a: i32, b: i32) -> i32 { ... }` |
| String | `"hello"` | `"hello"` (string slice `&str`) |
| Object / Struct | `{ name: "Tauri" }` | `struct App { name: String }` |
| Array / Vector | `[1, 2, 3]` | `vec![1, 2, 3]` |
| Import | `import { x } from './y'` | `use crate::module::x;` |
| Export | `export fn x()` | `pub fn x()` |

## Reading Rust Code in Our Project

Let's examine every Rust file in `src-tauri/` and understand the syntax.

### `src-tauri/src/main.rs`

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri_snake_game_lib::run()
}
```

**Comments**: `//` for line comments. `//!` for inner doc comments (not used here).

**Attribute macro**: `#![cfg_attr(...)]` is an **attribute** that applies conditional compilation.

Let's break down `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`:

- `#![]` — An inner attribute (applies to the enclosing item, i.e., the entire file)
- `cfg_attr` — "configuration attribute": apply the second argument only if the first condition is true
- `not(debug_assertions)` — true when **not** in debug mode (i.e., release build)
- `windows_subsystem = "windows"` — On Windows, don't open a console window

**Result**: In release builds on Windows, the app runs without showing a terminal/console window. In debug builds, the console appears (useful for `println!` debugging).

> **Prerequisite concept: attributes**
> In Rust, `#[...]` is an **attribute** — metadata applied to code. Common uses:
> - `#[derive(Debug)]` — auto-implement the Debug trait
> - `#[cfg(target_os = "windows")]` — conditional compilation
> - `#[tauri::command]` — mark a function as a Tauri IPC command

**`fn main()`**: The program entry point. Every Rust executable has a `main` function. It takes no arguments and returns nothing (implicitly `()`).

**`tauri_snake_game_lib::run()`**: Calls the `run()` function from the `tauri_snake_game_lib` crate (defined in `lib.rs`). The `::` is the path separator.

### `src-tauri/src/lib.rs`

```rust
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### The `greet` Function

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
```

- `#[tauri::command]` — This attribute marks the function as a Tauri IPC command. The frontend can call it via `invoke('greet', { name: '...' })`.
- `fn greet(name: &str) -> String` — Defines a function named `greet` that takes a **string slice** (`&str`) and returns a `String`.
- `&str` vs `String`: `&str` is a **borrowed** string (like a read-only reference), `String` is an **owned** string.
- `format!()` — A macro that creates a `String` using a format string (like JavaScript template literals but with `{}` instead of `${}`).

> **Prerequisite concept: `&` — borrowing**
> The `&` symbol means "borrow" rather than "own". When you pass `name: &str`, you're borrowing the string — the caller retains ownership. This is Rust's way of avoiding unnecessary copying.
>
> Think of it like JavaScript's pass-by-reference, but with compile-time guarantees that you won't modify it or let it dangle.

#### The `run` Function

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- `pub fn run()` — A **public** function (accessible from `main.rs` via the crate name)
- `#[cfg_attr(mobile, tauri::mobile_entry_point)]` — If compiling for mobile (Android/iOS), this is the mobile entry point annotation

**Method chaining** (Builder pattern):

```rust
tauri::Builder::default()           // Create a new Tauri builder
    .plugin(...)                    // Register a plugin
    .invoke_handler(...)            // Register command handlers
    .run(...)                       // Start the app
    .expect(...);                   // Handle any error from run()
```

This is the **Builder pattern** — a common Rust pattern where methods return `self` to allow chaining.

- `tauri::Builder::default()` — Creates a default builder instance
- `.plugin(tauri_plugin_opener::init())` — Registers the opener plugin (for opening URLs/files)
- `.invoke_handler(tauri::generate_handler![greet])` — Tells Tauri which functions are available as IPC commands. `generate_handler!` is a macro that creates the handler registry.
- `.run(tauri::generate_context!())` — Starts the app. `generate_context!()` reads `tauri.conf.json` at **compile time** and embeds the configuration (and frontend files) into the binary.
- `.expect("message")` — If `run()` returns an error, panic with this message. `expect()` is like unwrapping a `Result` but with a custom error message.

> **Prerequisite concept: `Result` and `expect`**
> Rust doesn't have exceptions. Functions that can fail return `Result<T, E>` which is either `Ok(T)` (success) or `Err(E)` (failure). `.expect()` gets the value if `Ok`, or panics (crashes) with a message if `Err`.
>
> In JavaScript terms: `result.expect("msg")` is like `result.value` that throws `new Error("msg")` instead of a generic TypeError.

### `src-tauri/build.rs`

```rust
fn main() {
    tauri_build::build()
}
```

This is a **build script** that runs before the main compilation. `tauri_build::build()` generates code based on `tauri.conf.json` — specifically the resource embedding and schema generation.

### `src-tauri/Cargo.toml`

```toml
[package]
name = "tauri-snake-game"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"

[lib]
name = "tauri_snake_game_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

This is TOML (Tom's Obvious, Minimal Language) — Rust's configuration format.

**`[package]`** — Metadata about the Rust crate (package):
- `name` — The crate name
- `version` — Semantic version
- `edition = "2021"` — Rust edition (language version, analogous to ES6/ES2020 for JavaScript)

**`[lib]`** — Library configuration:
- `name = "tauri_snake_game_lib"` — The name used when importing from other Rust files (e.g., `tauri_snake_game_lib::run()`)
- `crate-type` — What kind of library to build:
  - `staticlib` — Static library (`.lib` on Windows)
  - `cdylib` — C-compatible dynamic library (`.dll` on Windows)
  - `rlib` — Rust native library format

**`[dependencies]`** — Other crates this project depends on (like npm packages):
- `tauri = { version = "2", features = [] }` — The main Tauri framework, version 2
- `tauri-plugin-opener = "2"` — The opener plugin for opening URLs/files
- `serde = { version = "1", features = ["derive"] }` — Serialization/deserialization framework (needed for Tauri commands)
- `serde_json = "1"` — JSON support for serde

> **Prerequisite concept: `features = ["derive"]`**
> Serde's `derive` feature enables `#[derive(Serialize, Deserialize)]` which automatically generates serialization code for your structs. Without it, you'd have to write serialization manually.

## Rust Concepts Summary

| Concept | JS Equivalent | Rust |
|---------|--------------|------|
| Function | `function f(x) { }` | `fn f(x: i32) { }` |
| Return type | Implicit | `fn f() -> i32 { 5 }` |
| String | `String` | `String` (owned) / `&str` (borrowed) |
| Macro | N/A (special syntax) | `println!()`, `format!()`, `vec![]` |
| Attribute | Decorator / Annotation | `#[derive(Debug)]`, `#[tauri::command]` |
| Error handling | try/catch | `Result<T, E>` + `.expect()` / `?` |
| Import | `import { x } from 'y'` | `use crate::module::x;` |
| Export | `export function x()` | `pub fn x()` |
| Package | `package.json` | `Cargo.toml` |
| Method chaining | `obj.method().method()` | `obj.method().method()` |

## Key Takeaways

- **`fn`** defines functions, **`pub`** makes them public
- **`&`** means borrow (like read-only reference), **`&str`** is a borrowed string
- **`format!()`** creates strings from templates, **`println!()`** prints them
- **`#[...]`** are attributes — metadata that modifies behavior
- **`Result::expect()`** handles errors with a custom panic message
- **`Cargo.toml`** is like `package.json` — it lists dependencies and metadata
- **Builder pattern** (`.method().method().method()`) is common in Rust APIs

---

Next: [12 — Rust Entry Point Deep Dive](12-rust-entry-point-deep-dive.md)
