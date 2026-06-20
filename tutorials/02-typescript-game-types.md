# 02 — TypeScript Game Types

Before writing any game logic, we need to define the fundamental building blocks. In TypeScript, we do this with **types** and **interfaces**.

## Prerequisites

- [01 — Project Structure](01-project-structure.md)
- Basic TypeScript: variables, functions, arrays

## Why Define Types First?

In the Snake game, many things need to be represented as data:

- Where is the snake? → an array of points
- Where is the food? → a single point
- Which direction is the snake moving? → up, down, left, or right
- Is the game running? → idle, playing, paused, or game over

If we define these concepts as **types** first, the rest of the code becomes clearer and safer. The TypeScript compiler will catch mistakes like passing a string where a `Point` is expected.

## `src/game/types.ts` — Line by Line

### Point

```typescript
export interface Point {
  x: number;
  y: number;
}
```

An **interface** in TypeScript describes the shape of an object. A `Point` is simply an object with `x` and `y` coordinates (both numbers).

> **Prerequisite concept: interface**
> An `interface` is like a contract. If a function says it returns a `Point`, you can be sure the returned object has `x` and `y` properties.

### Direction

```typescript
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
```

A **type alias** with a **union** of four string literals. This means a `Direction` can only be one of these four values — nothing else.

> **Prerequisite concept: union types**
> The `|` symbol means "or". `'UP' | 'DOWN'` means either the string `'UP'` or the string `'DOWN'`. The compiler will error if you try to use `'UPP'` (typo) or `'NORTH'`.

### GameStatus

```typescript
export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
```

The game has a lifecycle:

```
IDLE ──→ PLAYING ──→ PAUSED (toggle)
                 └──→ GAME_OVER ──→ IDLE (restart)
```

Each state changes what the UI shows and what the game loop does:
- `IDLE` — waiting for the player to start
- `PLAYING` — the game is running (snake moves each tick)
- `PAUSED` — the game is frozen (no movement, but keep the state)
- `GAME_OVER` — the snake hit a wall or itself

### GameState

```typescript
export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;
  gridWidth: number;
  gridHeight: number;
}
```

This is the **complete snapshot** of the game at any moment. It contains everything needed to render the game or compute the next tick.

Let's examine each field:

| Field | Type | Purpose |
|-------|------|---------|
| `snake` | `Point[]` | Array of segments. `snake[0]` is the head. |
| `food` | `Point` | Current food position |
| `direction` | `Direction` | Current movement direction (used this tick) |
| `nextDirection` | `Direction` | Queued direction for next tick (prevents 180° turns) |
| `status` | `GameStatus` | Current lifecycle state |
| `score` | `number` | Number of food items eaten |
| `gridWidth` | `number` | Grid width in cells |
| `gridHeight` | `number` | Grid height in cells |

**Why both `direction` and `nextDirection`?**

This is a design decision to handle fast keyboard input. If the player presses two keys quickly (e.g., RIGHT then DOWN), we want to queue the second direction so it takes effect on the next tick. We also need to prevent the snake from reversing into itself:

- If currently moving RIGHT and player presses LEFT, that's a 180° turn — we **ignore** it
- If currently moving RIGHT and player presses UP, we store it as `nextDirection`

The `tick()` function (next tutorial) applies `nextDirection` and then clears it.

### GameRecord

```typescript
export interface GameRecord {
  score: number;
  date: string;
}
```

A historical record saved after each game over. `date` stores an ISO 8601 timestamp string (like `"2026-06-19T12:00:00.000Z"`), which can be formatted for display.

## Exporting Types

The `export` keyword makes these types available in other files:

```typescript
// In types.ts
export interface Point { ... }

// In logic.ts
import type { Point } from './types';
```

Note `import type` instead of `import`. This is a TypeScript feature that tells the compiler we only need the type information, not actual runtime code. It gets removed during compilation.

## Why These Types?

Every type in this file was chosen to make the game logic **impossible to represent incorrectly**:

- `Direction` cannot be a typo'd string
- `GameStatus` cannot be an invalid state
- `GameState` always has all required fields
- `Point` enforces the x/y coordinate structure

This is the power of TypeScript — we catch entire categories of bugs before running the code.

## Key Takeaways

- **`interface`** defines the shape of an object
- **`type`** with union (`|`) restricts values to specific options
- **`GameState`** is a single immutable snapshot of everything in the game
- **Two directions** (`direction` + `nextDirection`) prevent 180° reversals
- **`export` / `import type`** shares types between modules without runtime cost

---

Next: [03 — Pure Game Logic](03-pure-game-logic.md)
