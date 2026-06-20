# 01 — Project Structure

Now that we have our tools installed, let's explore the project layout. Understanding where everything lives is essential before we dive into code.

## Prerequisites

- [00 — Prerequisites & Setup](00-prerequisites-and-setup.md)
- Basic understanding of file systems and directories

## Top-Level Directory

```
tauri-snake-game/
├── .vscode/              # VS Code editor settings
├── public/               # Static assets (logos, favicon)
├── src/                  # Frontend source code (React + TypeScript)
├── src-tauri/            # Backend source code (Rust + Tauri config)
├── tutorials/            # This tutorial series
├── index.html            # HTML entry point
├── package.json          # Frontend dependencies & scripts
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript compiler options
├── tsconfig.node.json    # TypeScript config for Node (Vite config)
└── README.md             # Project overview
```

Let's walk through each file and directory.

### `package.json` — Frontend Dependencies

```json
{
  "name": "tauri-snake-game",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "test": "vitest run"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

Key sections:

- **`scripts`** — Commands you run with `npm run <name>`:
  - `npm run dev` — starts the Vite dev server (for web-only preview)
  - `npm run tauri dev` — starts the full Tauri desktop app
  - `npm run build` — TypeScript check + production build
  - `npm run test` — runs vitest unit tests
- **`dependencies`** — Runtime libraries:
  - `react` + `react-dom` — The React library and its DOM renderer
  - `@tauri-apps/api` — JavaScript API for invoking Rust commands
  - `@tauri-apps/plugin-opener` — Plugin for opening URLs/files
- **`devDependencies`** — Development-only tools (TypeScript, Vite, etc.)

### `vite.config.ts` — Build Configuration

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || false,
  },
}));
```

- `plugins: [react()]` — enables React JSX transformation
- `server.port: 1420` — Tauri expects the dev server on this port
- `strictPort: true` — fail if port 1420 is taken (Tauri can only connect to one URL)

### `tsconfig.json` — TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

- `strict: true` — enables all strict type-checking options
- `jsx: "react-jsx"` — tells TypeScript to use the modern React JSX transform (no need to `import React` in every file)
- `noUnusedLocals / noUnusedParameters` — catch dead code at compile time

### `index.html` — The HTML Shell

```html
<!doctype html>
<html lang="en">
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

This is the only HTML file. React will render everything inside `<div id="root">`. The `<script>` tag loads `main.tsx`, which is the JavaScript entry point.

## The `src/` Directory (Frontend)

```
src/
├── game/                 # Pure game logic (no React dependency)
│   ├── types.ts          # Type definitions
│   ├── logic.ts          # Pure functions (snake movement, collision)
│   └── logic.test.ts     # Unit tests
├── components/
│   └── GameCanvas.tsx    # Canvas rendering component
├── locales/              # Translation dictionaries
│   ├── en.ts
│   ├── zh.ts
│   └── types.ts
├── utils/                # Utility modules
│   ├── i18n.tsx          # Internationalization (React Context)
│   └── history.ts        # localStorage game history
├── App.tsx               # Main application component
├── App.css               # Styles
└── main.tsx              # React entry point
```

This separation is intentional:

- **`game/`** — pure TypeScript, zero React. This makes the logic easy to test with Vitest (no browser needed).
- **`components/`** — React components that depend on the DOM
- **`locales/` + `utils/`** — supporting modules with single responsibilities
- **`App.tsx`** — the orchestrator that wires everything together

## The `src-tauri/` Directory (Rust Backend)

```
src-tauri/
├── src/
│   ├── main.rs           # Rust entry point (calls lib::run())
│   └── lib.rs            # Tauri app builder + commands
├── capabilities/
│   └── default.json      # Permission declarations
├── icons/                # Application icons
├── gen/                  # Auto-generated schemas
├── Cargo.toml            # Rust dependencies
├── Cargo.lock            # Locked dependency versions
├── build.rs              # Build script
└── tauri.conf.json       # Tauri app configuration
```

We will explore the Rust side in depth starting from tutorial 10.

## Key Takeaways

- The project is split into **frontend** (`src/`) and **backend** (`src-tauri/`)
- `package.json` manages frontend dependencies; `Cargo.toml` manages Rust dependencies
- `vite.config.ts` controls how the frontend is built
- `tsconfig.json` controls TypeScript behavior
- The `game/` directory is kept React-free for testability

---

Next: [02 — TypeScript Game Types](02-typescript-game-types.md)
