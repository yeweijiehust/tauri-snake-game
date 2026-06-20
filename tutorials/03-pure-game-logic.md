# 03 — Pure Game Logic

Now we write the heart of the game: pure functions that compute the next state from the current state.

## Prerequisites

- [02 — TypeScript Game Types](02-typescript-game-types.md)
- Understanding of `GameState`, `Direction`, `Point` from the previous tutorial

## What is a Pure Function?

A **pure function** has two properties:

1. **Same input → same output** — given the same arguments, it always returns the same result
2. **No side effects** — it doesn't modify anything outside its scope, doesn't write to files, doesn't make network requests

Pure functions are:
- Easy to test (no setup needed, just pass arguments)
- Easy to reason about (no hidden state)
- Safe to call anywhere, anytime

Our entire game logic is written as pure functions.

## `src/game/logic.ts` — Line by Line

### Direction Vectors

```typescript
const DIRECTIONS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
```

A **direction vector** tells us how the head moves for each direction:
- Moving UP means y decreases by 1 (0, -1)
- Moving RIGHT means x increases by 1 (1, 0)

In computer graphics, the y-axis is inverted from math class — **increasing y goes downward**. So `UP` is `y: -1`, `DOWN` is `y: 1`.

> **Prerequisite concept: `Record<K, V>`**
> A TypeScript utility type that defines an object where all keys are type `K` and all values are type `V`. `Record<Direction, Point>` means "an object with Direction keys and Point values."

### Opposite Directions

```typescript
const OPPOSITES: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};
```

This prevents the snake from reversing into itself. If the snake is moving RIGHT and the player presses LEFT, we ignore the input.

### `createInitialState()`

```typescript
export function createInitialState(gridWidth = 20, gridHeight = 20): GameState {
  const midX = Math.floor(gridWidth / 2);
  const midY = Math.floor(gridHeight / 2);
  const snake: Point[] = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
  return {
    snake,
    food: spawnFood(snake, gridWidth, gridHeight),
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    status: 'IDLE',
    score: 0,
    gridWidth,
    gridHeight,
  };
}
```

This function creates a brand new game. Key design choices:

- **Snake length 3**, positioned horizontally at the center of the grid
- **Starting direction RIGHT** — matches the snake orientation
- **Status IDLE** — the game hasn't started yet (waiting for player action)
- **Parameters with defaults** — you can call `createInitialState()` for a 20×20 grid, or `createInitialState(30, 30)` for a larger one

### `spawnFood()`

```typescript
export function spawnFood(snake: Point[], gridWidth: number, gridHeight: number): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  return free[Math.floor(Math.random() * free.length)];
}
```

This is the **only impure function** in `logic.ts` because it uses `Math.random()`. It must be impure — we want random food placement!

The algorithm:
1. Convert the snake array to a `Set` of strings like `"5,10"` for fast lookup
2. Iterate every cell on the grid
3. Collect cells not occupied by the snake
4. Pick one at random

> **Why `Set`?**
> Checking `Set.has()` is O(1) (instant), while `Array.includes()` is O(n) (scans the whole array). For efficiency.

### `changeDirection()`

```typescript
export function changeDirection(state: GameState, dir: Direction): GameState {
  if (dir === OPPOSITES[state.direction]) {
    return state;
  }
  return { ...state, nextDirection: dir };
}
```

**Note on immutability**: This function returns a **new object** instead of modifying the input. The spread operator `...state` creates a shallow copy, then we override `nextDirection`.

If the player tries to reverse direction, we return the unchanged state (no-op).

### `tick()` — The Core Game Loop

```typescript
export function tick(state: GameState): GameState {
  if (state.status !== 'PLAYING') {
    return state;
  }

  const direction = state.nextDirection;
  const head = state.snake[0];
  const move = DIRECTIONS[direction];
  const newHead: Point = { x: head.x + move.x, y: head.y + move.y };

  if (isOutOfBounds(newHead, state.gridWidth, state.gridHeight)) {
    return { ...state, direction, status: 'GAME_OVER' };
  }

  const ate = newHead.x === state.food.x && newHead.y === state.food.y;

  if (hitsSelf(newHead, state.snake, ate)) {
    return { ...state, direction, status: 'GAME_OVER' };
  }

  const newSnake = [newHead, ...state.snake];
  if (!ate) {
    newSnake.pop();
  }

  return {
    ...state,
    snake: newSnake,
    direction,
    food: ate ? spawnFood(newSnake, state.gridWidth, state.gridHeight) : state.food,
    score: ate ? state.score + 1 : state.score,
  };
}
```

This is called by `requestAnimationFrame` every ~150ms. Let's trace the logic step by step:

**Step 1: Guard clause**
```typescript
if (state.status !== 'PLAYING') return state;
```
If the game hasn't started or is paused, do nothing.

**Step 2: Calculate new head position**
```typescript
const direction = state.nextDirection;
const head = state.snake[0];
const move = DIRECTIONS[direction];
const newHead = { x: head.x + move.x, y: head.y + move.y };
```
Add the direction vector to the current head position.

**Step 3: Check wall collision**
```typescript
if (isOutOfBounds(newHead, state.gridWidth, state.gridHeight)) {
  return { ...state, direction, status: 'GAME_OVER' };
}
```
If the new head is outside the grid, game over.

**Step 4: Check if eating food**
```typescript
const ate = newHead.x === state.food.x && newHead.y === state.food.y;
```
We determine this **before** modifying the snake, because eating affects how we check self-collision.

**Step 5: Check self collision**
```typescript
if (hitsSelf(newHead, state.snake, ate)) {
  return { ...state, direction, status: 'GAME_OVER' };
}
```
If eating, check against the full body (tail stays). If not eating, exclude the tail (it will move).

**Step 6: Move the snake**
```typescript
const newSnake = [newHead, ...state.snake];
if (!ate) {
  newSnake.pop();
}
```
- Prepend the new head
- If not eating, remove the tail (`.pop()`)
- If eating, keep the tail (snake grows by 1)

**Step 7: Return new state**
```typescript
return {
  ...state,
  snake: newSnake,
  direction,
  food: ate ? spawnFood(...) : state.food,
  score: ate ? state.score + 1 : state.score,
};
```

### Helper Functions

```typescript
function isOutOfBounds(point: Point, gridWidth: number, gridHeight: number): boolean {
  return point.x < 0 || point.x >= gridWidth || point.y < 0 || point.y >= gridHeight;
}

function hitsSelf(head: Point, snake: Point[], ate: boolean): boolean {
  const body = ate ? snake : snake.slice(0, -1);
  return body.some((seg) => seg.x === head.x && seg.y === head.y);
}
```

**`isOutOfBounds`** — checks if the point is outside the valid range `[0, gridWidth) × [0, gridHeight)`.

**`hitsSelf`** — checks if the new head overlaps any body segment. The `ate` parameter is crucial:
- If the snake **ate** food, the tail stays — check against **all** segments
- If the snake **didn't eat**, the tail will be removed — exclude it from the check

Without this distinction, the snake would die when its head reaches the position the tail just vacated (which would be a false positive in a real game).

## Key Takeaways

- **Pure functions** are predictable and testable
- **`tick()`** is the heart of the game — it processes one time step
- **Immutability** — every function returns a new object, never modifies the input
- **Collision detection** must account for tail removal
- The only impure function (`spawnFood`) is isolated and uses `Math.random()`

---

Next: [04 — Testing with Vitest](04-testing-with-vitest.md)
