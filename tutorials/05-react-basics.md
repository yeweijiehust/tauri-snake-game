# 05 — React Basics

Now we move from pure TypeScript into React. This tutorial covers the React concepts used in the project.

## Prerequisites

- [01 — Project Structure](01-project-structure.md)
- Basic understanding of HTML and JavaScript functions

## What is React?

React is a library for building user interfaces with **components**. A component is a function that returns a description of what should appear on screen.

```tsx
function Welcome() {
  return <h1>Hello, World!</h1>;
}
```

The HTML-like syntax (`<h1>`) is called **JSX**. It's a JavaScript extension that compiles to function calls:

```tsx
// JSX:
return <h1>Hello, World!</h1>;

// Compiled JavaScript:
return React.createElement('h1', null, 'Hello, World!');
```

## Components in Our Project

### `src/main.tsx` — The Entry Point

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

This is the **root of the React tree**:

1. `document.getElementById("root")` finds the empty `<div id="root">` in `index.html`
2. `ReactDOM.createRoot()` creates a React root attached to that DOM element
3. `.render(<App />)` tells React to render the `App` component

> **Prerequisite concept: StrictMode**
> `<React.StrictMode>` is a development-only wrapper that double-invokes certain functions to detect side effects. This is why our history-saving logic needed to be in `useEffect` instead of inside `setState` (see tutorial 09).

### `src/App.tsx` — The Main Component

`App.tsx` actually exports two components:

```typescript
function GameBoard() {
  // ... all the game logic ...
}

export default function App() {
  return (
    <I18nProvider>
      <GameBoard />
    </I18nProvider>
  );
}
```

- **`App`** is the top-level component. It wraps everything in `I18nProvider` (from our i18n utility).
- **`GameBoard`** contains all the game state and UI.

## React Hooks

**Hooks** are functions that let you "hook into" React features. All hooks start with `use`.

### `useState`

```typescript
const [state, setState] = useState<GameState>(() => createInitialState());
const [records, setRecords] = useState<GameRecord[]>(() => loadHistory());
const [showHistory, setShowHistory] = useState(false);
const [showClearConfirm, setShowClearConfirm] = useState(false);
```

`useState` returns a pair: `[currentValue, functionToUpdateIt]`.

- The first call runs the initializer function (`() => createInitialState()`) to get the starting value
- `setState(newValue)` triggers a **re-render** — React calls the component function again with the new state

> **Lazy initialization**
> Passing a function `() => createInitialState()` instead of calling `createInitialState()` directly means React only runs it on the first render. This is important if the initialization is expensive.

### `useEffect`

```typescript
useEffect(() => {
  if (state.status === 'GAME_OVER' && prevStatusRef.current === 'PLAYING') {
    saveRecord(state.score);
    setRecords(loadHistory());
  }
  prevStatusRef.current = state.status;
}, [state.status, state.score]);
```

`useEffect` runs code **after** the component renders (as a side effect). It's perfect for:
- Saving data to localStorage
- Starting/canceling animations
- Adding/removing event listeners

The **dependency array** `[state.status, state.score]` tells React: "only re-run this effect when `state.status` or `state.score` changes."

> **Prerequisite concept: effect cleanup**
> If the callback returns a function, React calls it when the component unmounts or before re-running the effect. This is used for cleanup:
> ```typescript
> useEffect(() => {
>   window.addEventListener('keydown', handler);
>   return () => window.removeEventListener('keydown', handler);
> }, []);
> ```

### `useRef`

```typescript
const frameRef = useRef<number>(0);
const lastTimeRef = useRef<number>(0);
```

`useRef` creates a mutable object that **persists across renders** without causing re-renders when changed.

- `frameRef` holds the `requestAnimationFrame` ID (needed to cancel it)
- `lastTimeRef` tracks the last tick timestamp

Unlike `useState`, changing a ref doesn't re-render the component. Use refs for values that the component doesn't display.

### `useCallback`

```typescript
const gameLoop = useCallback((time: number) => {
  // ...
}, []);
```

`useCallback` memoizes a function — it returns the **same function reference** unless the dependencies change. This prevents unnecessary re-renders of child components and avoids infinite loops in `useEffect`.

## The Flow of a React App

1. **First render** — `App` → `I18nProvider` → `GameBoard`. All `useState` initializers run. `useEffect` callbacks are scheduled.
2. **After render** — `useEffect` runs: game loop starts, keyboard listener added.
3. **User action** — key press triggers `setState`. React schedules a re-render.
4. **Re-render** — `GameBoard` runs again with new state. React computes what changed in the virtual DOM.
5. **Commit** — React updates the real DOM to match the new virtual DOM.
6. **After render** — `useEffect` runs again if dependencies changed. The game loop renders to canvas.

## Key Takeaways

- **Components** are functions returning JSX
- **`useState`** for values that change and affect the UI
- **`useEffect`** for side effects (after render)
- **`useRef`** for mutable values that don't trigger re-renders
- **`useCallback`** for stable function references
- React re-renders when state changes, then updates the DOM

---

Next: [06 — Canvas Rendering](06-canvas-rendering.md)
