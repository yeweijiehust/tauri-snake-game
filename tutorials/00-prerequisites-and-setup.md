# 00 — Prerequisites & Setup

Welcome to the Tauri Snake Game tutorial series! By the end of this series, you will understand every line of code in this project and the concepts behind it.

## Prerequisites

Before starting, you should have a basic understanding of:

- **JavaScript / TypeScript** — variables, functions, arrays, objects
- **Web basics** — HTML, CSS, DOM
- **Command line** — running commands in a terminal

No prior knowledge of React, Tauri, or Rust is needed — we will cover everything from the ground up.

## Installing Required Tools

### 1. Node.js

Node.js is a JavaScript runtime that runs on your computer (outside the browser). We use it to run the development server, install packages, and build the frontend.

- Download and install Node.js from [nodejs.org](https://nodejs.org/) (version 18 or later)
- Verify installation:

```bash
node --version
npm --version
```

`npm` (Node Package Manager) comes bundled with Node.js. It installs dependencies listed in `package.json`.

### 2. Rust

Rust is a systems programming language. Tauri uses Rust as its backend to create native desktop windows, access system APIs, and build distributable binaries.

- Install Rust via [rustup.rs](https://rustup.rs/)
- Verify installation:

```bash
rustc --version
cargo --version
```

`cargo` is Rust's build system and package manager — similar to `npm` for JavaScript.

### 3. Git

Git is version control software. We use it to track changes and push code to GitHub.

- Download from [git-scm.com](https://git-scm.com/)
- Verify:

```bash
git --version
```

## Understanding the Tech Stack

This project brings together four major technologies. Let's understand each at a high level.

### Vite

**Vite** is a frontend build tool. It serves your code during development (instant hot-reload) and bundles it for production. Think of it as a replacement for older tools like webpack — faster, simpler, and more modern.

Configuration file: `vite.config.ts`

### React

**React** is a JavaScript library for building user interfaces. Instead of manually manipulating the DOM (like you would with plain JavaScript), React lets you describe your UI as **components** — reusable pieces of code that return HTML-like JSX.

Example mental model:

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
```

React automatically updates the page when the data changes.

### Tauri

**Tauri** is a framework for building desktop applications. It combines a **web frontend** (React, in our case) with a **Rust backend**.

- The frontend runs inside a **WebView** (like a stripped-down browser window)
- The backend (Rust) handles native operations — creating windows, file system access, system tray, etc.
- The frontend and backend communicate via an **IPC bridge** (Inter-Process Communication)

Tauri is often compared to **Electron**. The key difference:

| Aspect | Tauri | Electron |
|--------|-------|----------|
| Backend language | Rust | Node.js |
| App size | ~5 MB | ~150+ MB |
| Memory usage | Low | High |
| Security | Capability-based | CSP-based |

### TypeScript

**TypeScript** is JavaScript with static types. It adds type annotations that help catch bugs at compile time rather than at runtime.

```typescript
// JavaScript (no type checking)
function add(a, b) { return a + b; }
add("hello", 5); // "hello5" — probably a bug

// TypeScript (type checked)
function add(a: number, b: number): number { return a + b; }
add("hello", 5); // ❌ Compiler error
```

## Creating a Tauri + React Project (for reference)

This project was scaffolded with:

```bash
npm create tauri-app@latest
```

You would choose:
- Project name: `tauri-snake-game`
- Frontend: `React + TypeScript`
- Package manager: `npm`

This generates the entire project structure we will explore in the next tutorial.

## Key Takeaways

- **Node.js** runs JavaScript on the server/desktop; **npm** installs packages
- **Rust** is Tauri's backend language; **cargo** is its package manager
- **Vite** builds and serves the frontend code
- **React** builds the UI from components
- **Tauri** wraps the frontend in a native desktop window with a Rust backend
- **TypeScript** adds type safety to JavaScript

---

Next: [01 — Project Structure](01-project-structure.md)
