# 07 — Game Loop and Controls

This tutorial covers the main game loop (powered by `requestAnimationFrame`) and keyboard input handling in `App.tsx`.

## Prerequisites

- [05 — React Basics](05-react-basics.md)
- [06 — Canvas Rendering](06-canvas-rendering.md)
- Understanding of `useEffect`, `useCallback`, `useRef`

## The Game Loop

The game loop is the heartbeat of any game. It runs repeatedly, updating the game state and rendering each frame.

For this snake game, the loop is simple:

```
loop:
  wait ~150ms
  if game is PLAYING:
    move snake one cell
    check collisions
    if collision → GAME_OVER
    if food → grow + spawn new food
  render (canvas redraws automatically via React state)
```

### `requestAnimationFrame`

`requestAnimationFrame(rAF)` is a browser API that schedules a function to run before the next screen repaint.

```typescript
const id = requestAnimationFrame(myFunction);
// id can be used to cancel: cancelAnimationFrame(id)
```

Unlike `setInterval`:
- rAF **pauses when the tab is in the background** (saves CPU/battery)
- rAF **syncs with the monitor's refresh rate** (usually 60fps)
- rAF gives you a high-resolution timestamp

### The Loop in `App.tsx`

```typescript
const TICK_INTERVAL = 150;
const frameRef = useRef<number>(0);
const lastTimeRef = useRef<number>(0);

const gameLoop = useCallback((time: number) => {
  if (time - lastTimeRef.current >= TICK_INTERVAL) {
    lastTimeRef.current = time;
    setState((prev) => tick(prev));
  }
  frameRef.current = requestAnimationFrame(gameLoop);
}, []);

useEffect(() => {
  frameRef.current = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(frameRef.current);
}, [gameLoop]);
```

Let's trace through this:

**1. Start the loop**
```typescript
useEffect(() => {
  frameRef.current = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(frameRef.current);
}, [gameLoop]);
```
When the component mounts, we start the loop. When it unmounts (cleanup function), we cancel it.

**2. Each frame**
```typescript
const gameLoop = useCallback((time: number) => {
  if (time - lastTimeRef.current >= TICK_INTERVAL) {
    lastTimeRef.current = time;
    setState((prev) => tick(prev));
  }
  frameRef.current = requestAnimationFrame(gameLoop);
}, []);
```
- `time` is provided by rAF (milliseconds since page load)
- We check if enough time has passed since the last tick (150ms)
- If yes: update `lastTimeRef`, call `tick()` via `setState`
- Always schedule the next frame with `requestAnimationFrame`

> **Why useRef for timing?**
> We need `lastTimeRef` to persist across renders without causing re-renders. If we used `useState`, every rAF call would trigger a re-render (even if the game didn't tick).

**3. Throttling (150ms ticks)**
```typescript
const TICK_INTERVAL = 150;
```
The snake moves once every 150ms (about 6.67 moves/second). This feels natural for a snake game — too fast would be unplayable, too slow would be boring.

The rAF callback runs ~60 times per second, but the game state only updates every ~4th frame (60fps / 6.67fps ≈ 9 frames between ticks).

### The `useCallback` Dependency

`gameLoop` has `[]` dependencies. This is intentional:
- The function doesn't capture any React state or props
- `lastTimeRef` and `frameRef` are refs (not state — they persist across renders)
- `TICK_INTERVAL` is a constant

This means `gameLoop` is created **once** and never recreated, which prevents the `useEffect` from restarting the loop unnecessarily.

## Keyboard Controls

```typescript
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    const dirMap: Record<string, Direction> = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
      w: 'UP',
      s: 'DOWN',
      a: 'LEFT',
      d: 'RIGHT',
    };
    const dir = dirMap[e.key];
    if (dir) {
      e.preventDefault();
      setState((prev) => changeDirection(prev, dir));
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      setState((prev) => {
        if (prev.status === 'IDLE' || prev.status === 'GAME_OVER') {
          return { ...createInitialState(), status: 'PLAYING' };
        }
        return prev;
      });
    }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, []);
```

### Direction Mapping

The `dirMap` supports two control schemes:
- **Arrow keys** — `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- **WASD** — `w`, `s`, `a`, `d` (common in games)

Both map to the same four `Direction` values.

### Space Key: Start / Restart

```typescript
if (e.key === ' ') {
  e.preventDefault();
  setState((prev) => {
    if (prev.status === 'IDLE' || prev.status === 'GAME_OVER') {
      return { ...createInitialState(), status: 'PLAYING' };
    }
    return prev;
  });
}
```

`e.preventDefault()` is important — otherwise pressing space would scroll the page down.

The `setState` updater function checks the current status:
- `IDLE` → start a new game
- `GAME_OVER` → restart
- `PLAYING` → ignore (space doesn't pause)

### Button Controls

In addition to keyboard, the UI has buttons for start/pause/resume:

```typescript
const startGame = useCallback(() => {
  setState((prev) => {
    if (prev.status === 'IDLE' || prev.status === 'GAME_OVER') {
      return { ...createInitialState(), status: 'PLAYING' };
    }
    return { ...prev, status: 'PLAYING' };
  });
}, []);
```

The button and space key use the same logic, but buttons also handle the `PAUSED → PLAYING` transition (space doesn't).

> **Why two separate functions?**
> The keyboard handler and button handlers could share code, but separating them makes each one simpler and more explicit. The small duplication is worth the clarity.

## The Tick-to-Render Pipeline

Here's the complete flow from player action to screen update:

```
1. Player presses ArrowUp
2. handleKey fires: setState(prev => changeDirection(prev, 'UP'))
3. React schedules a re-render
4. ~150ms later, gameLoop fires: setState(prev => tick(prev))
5. React schedules another re-render
6. GameBoard re-renders with new state
7. GameCanvas useEffect detects new state
8. Canvas redraws with new snake position
```

The total time from keypress to visual update is typically < 16ms (one frame at 60fps), but the snake only moves every 150ms.

## Key Takeaways

- **`requestAnimationFrame`** drives the game loop (efficient, syncs with monitor)
- **`useRef`** stores timing variables (no re-renders needed)
- **150ms tick interval** controls game speed
- **Keyboard handler** supports Arrow keys + WASD
- **Space key** starts / restarts the game
- **`useCallback` + empty deps** prevents unnecessary effect re-runs

---

Next: [08 — Internationalization](08-internationalization.md)
