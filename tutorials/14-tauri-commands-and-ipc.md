# 14 — Tauri Commands and IPC

This tutorial explains how the frontend and backend communicate — the IPC bridge and Tauri commands.

## Prerequisites

- [11 — Rust Basics](11-rust-basics.md)
- [12 — Rust Entry Point Deep Dive](12-rust-entry-point-deep-dive.md)
- Understanding of serialization (JSON)

## What is IPC?

**IPC** (Inter-Process Communication) is how two processes send messages to each other. In Tauri v2, the frontend (WebView) and backend (Rust) may run in separate processes, so they communicate via JSON messages through an IPC channel.

```
 ┌─── Frontend (WebView) ───┐        ┌─── Rust Backend ───────────┐
 │                           │   IPC   │                            │
 │  invoke('command', args)  │ ──────→ │  #[tauri::command] handler │
 │                           │ ←────── │                            │
 │  await → result           │   JSON  │  return value              │
 └───────────────────────────┘        └────────────────────────────┘
```

## Defining a Command (Rust Side)

A Tauri command is just a Rust function with the `#[tauri::command]` attribute:

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
```

### Rules for Command Functions

1. **Return type must be serializable** — It must implement `serde::Serialize`. Basic types (`String`, `i32`, `bool`) implement this automatically.

2. **Parameters must be deserializable** — They must implement `serde::Deserialize`. Basic types work automatically. For complex types, add `#[derive(Deserialize)]`:

```rust
#[derive(Deserialize)]
struct PlayerInput {
    name: String,
    age: u8,
}

#[tauri::command]
fn register_player(input: PlayerInput) -> String {
    format!("Registered {} (age {})", input.name, input.age)
}
```

3. **Can return `Result` for error handling**:

```rust
#[tauri::command]
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Cannot divide by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

On the frontend, an `Err` result becomes a rejected promise.

4. **Can access Tauri state** — Through special parameters like `app_handle: tauri::AppHandle` or `window: tauri::Window`:

```rust
#[tauri::command]
fn get_window_title(window: tauri::Window) -> String {
    window.title().unwrap_or_default()
}
```

### Registering Commands

Commands must be registered in `lib.rs`:

```rust
.invoke_handler(tauri::generate_handler![greet, register_player, divide])
```

## Calling a Command (Frontend Side)

### Basic Call

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('greet', { name: 'Tauri' });
console.log(result); // "Hello, Tauri! You've been greeted from Rust!"
```

- The first argument is the command name (as a string)
- The second argument is an object with the command parameters
- The function returns a Promise (async)

### With Error Handling

```typescript
try {
  const result = await invoke('divide', { a: 10, b: 0 });
} catch (error) {
  console.error(error); // "Cannot divide by zero"
}
```

### Without return value (void commands)

```typescript
await invoke('log_event', { message: 'Game started' });
```

Rust side:

```rust
#[tauri::command]
fn log_event(message: String) {
    println!("Event: {}", message);
}
```

## The `serde` Framework

**Serde** is Rust's serialization framework. It's how Tauri converts between Rust types and JSON.

### Serialize (Rust → JSON)

```rust
#[derive(Serialize)]
struct HighScore {
    player: String,
    score: i32,
    date: String,
}

// Tauri automatically serializes this to JSON when returning
#[tauri::command]
fn get_high_score() -> HighScore {
    HighScore {
        player: "Alice".into(),
        score: 42,
        date: "2026-06-20".into(),
    }
}
```

Frontend receives:

```json
{
  "player": "Alice",
  "score": 42,
  "date": "2026-06-20"
}
```

### Deserialize (JSON → Rust)

```rust
#[derive(Deserialize)]
struct GameConfig {
    grid_width: u32,
    grid_height: u32,
    speed: f64,
}

#[tauri::command]
fn configure_game(config: GameConfig) {
    // config.grid_width, config.grid_height, config.speed available
}
```

Frontend sends:

```typescript
await invoke('configure_game', {
  config: {
    grid_width: 20,
    grid_height: 20,
    speed: 1.5
  }
});
```

The JSON parameter keys use **snake_case** (Rust convention), while the frontend can use either `snake_case` or `camelCase` thanks to serde's rename attributes.

## Security: Permissions and Capabilities

Commands are **blocked by default** in Tauri v2. To allow the frontend to call a command, you must declare it in the capabilities file.

### `capabilities/default.json`

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

To allow a custom command, you'd add:

```json
"permissions": [
  "core:default",
  "opener:default",
  "my-app:allow-greet"
]
```

Where `my-app` is the app identifier and `greet` is the command name. The permission format is:

```
<app-identifier>:allow-<command-name>
```

For the deny variant (explicitly block a command):

```
<app-identifier>:deny-<command-name>
```

### How Permissions Work

When the frontend calls `invoke('greet')`, Tauri checks:
1. Which capability applies to the calling window?
2. Does that capability include `"my-app:allow-greet"`?
3. If yes → execute the command
4. If no → return an error ("command not allowed")

This prevents malicious frontend code (e.g., via XSS) from calling arbitrary Rust functions.

## Asynchronous Commands

Commands can be async (for I/O operations):

```rust
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}
```

On the frontend, the call is the same:

```typescript
const content = await invoke('read_file', { path: 'data.txt' });
```

Tauri's IPC handles the async/await bridging automatically — the command runs on a thread pool and the Promise resolves when it completes.

## Project State: Our App Doesn't Call Commands

In our current project, the `greet` command exists in Rust but is never called from the frontend. This is fine — the game logic runs entirely in the frontend (JavaScript), and Tauri is used purely as a desktop wrapper.

If we wanted to move some logic to Rust (e.g., storing scores in a file, or running game logic on a separate thread), we would:

1. Define a `#[tauri::command]` in `lib.rs`
2. Register it in `generate_handler![]`
3. Add the permission to `capabilities/default.json`
4. Call `invoke('command_name', { ... })` from the frontend

## Key Takeaways

- **`#[tauri::command]`** marks a Rust function as callable from the frontend
- **`invoke()`** calls a Tauri command from JavaScript (returns a Promise)
- **Serde** handles JSON serialization/deserialization automatically
- **`#[derive(Serialize/Deserialize)]`** enables custom types in commands
- **Commands are blocked by default** — permissions must be explicitly declared
- **Async commands** support I/O operations without blocking the UI
- Our app currently doesn't use commands (pure frontend game), but the infrastructure is ready

---

Next: [15 — Tauri Plugins](15-tauri-plugins.md)
