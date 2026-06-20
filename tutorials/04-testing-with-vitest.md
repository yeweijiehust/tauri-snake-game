# 04 — Testing with Vitest

We wrote pure functions in the previous tutorial. Now let's verify they work correctly using **Vitest**, a unit testing framework.

## Prerequisites

- [03 — Pure Game Logic](03-pure-game-logic.md)
- Familiarity with `describe`, `it`, `expect` from other testing frameworks (Jest, Mocha) is helpful but not required

## Why Test Pure Functions?

Pure functions are the easiest thing to test in any codebase because:

- No setup needed — just call the function with arguments
- No mocking needed — no network, no database, no DOM
- Deterministic — same input always gives same output
- Fast — tests run in milliseconds

If you only test one thing, test the pure game logic.

## Vitest Overview

**Vitest** is a testing framework designed for Vite projects. It's nearly identical to Jest (the most popular JavaScript test framework) but integrates natively with Vite's configuration.

The test command is in `package.json`:

```json
"scripts": {
  "test": "vitest run"
}
```

- `vitest run` — runs all tests once and exits (used in CI)
- `vitest` — runs in watch mode (re-runs on file changes during development)

## `src/game/logic.test.ts` — Line by Line

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { createInitialState, changeDirection, tick, spawnFood } from './logic';
import type { GameState } from './types';
```

- We import test utilities from `vitest` (no global variables)
- We import only the functions we want to test
- `import type` for the type (removed at compile time)

Tests are organized in a **nested structure**:

```
describe("createInitialState")       → test group
  it("creates a snake of length 3")  → individual test
  it("food is not on the snake")     → individual test
describe("changeDirection")
  it("updates nextDirection")
  it("ignores opposite direction")
describe("tick")
  it("does nothing when IDLE")
  it("moves snake forward")          → and so on...
describe("spawnFood")
  it("does not spawn on the snake")
```

### Testing `createInitialState`

```typescript
describe('createInitialState', () => {
  it('creates a snake of length 3 at center', () => {
    const state = createInitialState(20, 20);
    expect(state.snake).toHaveLength(3);
    expect(state.snake[0]).toEqual({ x: 10, y: 10 });
    expect(state.direction).toBe('RIGHT');
    expect(state.status).toBe('IDLE');
    expect(state.score).toBe(0);
  });
});
```

- `expect(value)` creates an assertion
- `.toHaveLength(3)` — checks array length
- `.toEqual({ x: 10, y: 10 })` — deep equality check (compares properties)
- `.toBe('RIGHT')` — strict equality (like `===`)

> **Prerequisite concept: matchers**
> `.toHaveLength()`, `.toEqual()`, `.toBe()` are called **matchers**. Vitest provides many: `.toBeGreaterThan()`, `.toContain()`, `.toBeNull()`, etc.

```typescript
it('food is not on the snake', () => {
  const state = createInitialState(20, 20);
  const onSnake = state.snake.some(
    (s) => s.x === state.food.x && s.y === state.food.y,
  );
  expect(onSnake).toBe(false);
});
```

This test ensures `spawnFood` (called inside `createInitialState`) never places food on top of the snake.

### Testing `changeDirection`

```typescript
describe('changeDirection', () => {
  it('updates nextDirection', () => {
    const state = createInitialState();
    const next = changeDirection(state, 'UP');
    expect(next.nextDirection).toBe('UP');
  });

  it('ignores opposite direction', () => {
    const state = createInitialState();  // direction is 'RIGHT'
    const next = changeDirection(state, 'LEFT');
    expect(next.nextDirection).toBe('RIGHT'); // unchanged
  });
});
```

Two simple tests that verify the direction queuing logic:

1. Normal case: direction is accepted
2. Opposite case: 180° turn is rejected

### Testing `tick`

**Tick when IDLE:**

```typescript
it('does nothing when IDLE', () => {
  const state = createInitialState();
  const next = tick(state);
  expect(next).toBe(state); // Same object reference
});
```

`.toBe()` checks **reference equality** (same object), not just value equality. Since `tick` returns `state` unchanged when status is not `PLAYING`, both variables point to the exact same object.

**Tick when PLAYING:**

```typescript
it('moves snake forward when PLAYING', () => {
  const state: GameState = { ...createInitialState(), status: 'PLAYING' };
  const next = tick(state);
  expect(next.snake[0].x).toBe(state.snake[0].x + 1);
  expect(next.snake[0].y).toBe(state.snake[0].y);
  expect(next.snake).toHaveLength(3);
});
```

The snake head moves right by 1 cell, length stays 3 (no food eaten).

**Eating food:**

```typescript
it('grows when eating food', () => {
  const state: GameState = {
    ...createInitialState(20, 20),
    status: 'PLAYING',
    food: { x: 11, y: 10 },
  };
  const next = tick(state);
  expect(next.snake).toHaveLength(4);
  expect(next.score).toBe(1);
});
```

We place food directly in front of the snake's head (which is at `(10, 10)`, moving RIGHT). The next head position will be `(11, 10)` — exactly where the food is. Result: snake grows by 1, score increases.

**Wall collision:**

```typescript
it('ends game on wall collision', () => {
  const state: GameState = {
    ...createInitialState(20, 20),
    snake: [{ x: 0, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 10 }],
    direction: 'LEFT',
    nextDirection: 'LEFT',
    status: 'PLAYING',
  };
  const next = tick(state);
  expect(next.status).toBe('GAME_OVER');
});
```

Head at x=0, moving LEFT. New head would be at x=-1 — out of bounds.

**Self collision:**

```typescript
it('ends game on self collision', () => {
  const snake = [
    { x: 5, y: 5 },  // head → going RIGHT
    { x: 4, y: 5 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
    { x: 6, y: 5 },  // blocking segment
    { x: 6, y: 6 },  // tail
  ];
  const state: GameState = {
    ...createInitialState(20, 20),
    snake,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    status: 'PLAYING',
    food: { x: 15, y: 15 },
  };
  const next = tick(state);
  expect(next.status).toBe('GAME_OVER');
});
```

This snake forms a pattern where the head at (5,5) moves RIGHT into position (6,5), which is occupied by another body segment (the second-to-last segment at index 5). The tail at (6,6) is excluded from collision check, but (6,5) is not the tail — collision detected.

### Testing `spawnFood`

```typescript
describe('spawnFood', () => {
  it('does not spawn on the snake', () => {
    const snake = [{ x: 5, y: 5 }];
    const food = spawnFood(snake, 20, 20);
    const onSnake = snake.some((s) => s.x === food.x && s.y === food.y);
    expect(onSnake).toBe(false);
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(20);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeLessThan(20);
  });
});
```

Three assertions:
1. Food is not on the snake
2. Food x is within [0, 20)
3. Food y is within [0, 20)

## Running the Tests

```bash
npm run test
```

Or in watch mode during development:

```bash
npx vitest
```

## Key Takeaways

- **`describe`** groups related tests, **`it`** defines individual tests
- **`expect` + matcher** makes assertions
- **Pure functions are trivially testable** — no mocks, no setup
- Tests for game logic cover: initialization, movement, eating, collision, food spawning
- Run with `npm run test` or `npx vitest` (watch mode)

---

Next: [05 — React Basics](05-react-basics.md)
