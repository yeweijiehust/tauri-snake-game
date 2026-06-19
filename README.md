# Tauri Snake Game

A classic Snake game built with Tauri v2 + React 19 + TypeScript + Canvas.

## Features

- Canvas-rendered game grid
- Keyboard controls (WASD / Arrow keys)
- Pause / Resume
- Game over overlay with replay
- English / Chinese language toggle
- Game history (last 10 records, saved to localStorage)
- History modal with clear confirmation
- Space key to start / restart

## Getting Started

### Prerequisites

- Node.js >= 18
- Rust (for Tauri)

### Install

```bash
npm install
```

### Dev

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

The standalone executable will be at `src-tauri/target/release/tauri-snake-game.exe`.

### Test

```bash
npm run test
```

## Tech Stack

- **Tauri v2** — desktop framework
- **React 19** — UI
- **TypeScript** — type safety
- **Vite** — bundler
- **Canvas API** — game rendering
- **Vitest** — unit testing
