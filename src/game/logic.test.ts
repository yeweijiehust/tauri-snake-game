import { describe, it, expect } from 'vitest';
import { createInitialState, changeDirection, tick, spawnFood } from './logic';
import type { GameState } from './types';

describe('createInitialState', () => {
  it('creates a snake of length 3 at center', () => {
    const state = createInitialState(20, 20);
    expect(state.snake).toHaveLength(3);
    expect(state.snake[0]).toEqual({ x: 10, y: 10 });
    expect(state.direction).toBe('RIGHT');
    expect(state.status).toBe('IDLE');
    expect(state.score).toBe(0);
  });

  it('food is not on the snake', () => {
    const state = createInitialState(20, 20);
    const onSnake = state.snake.some(
      (s) => s.x === state.food.x && s.y === state.food.y,
    );
    expect(onSnake).toBe(false);
  });
});

describe('changeDirection', () => {
  it('updates nextDirection', () => {
    const state = createInitialState();
    const next = changeDirection(state, 'UP');
    expect(next.nextDirection).toBe('UP');
  });

  it('ignores opposite direction', () => {
    const state = createInitialState();
    const next = changeDirection(state, 'LEFT');
    expect(next.nextDirection).toBe('RIGHT');
  });
});

describe('tick', () => {
  it('does nothing when IDLE', () => {
    const state = createInitialState();
    const next = tick(state);
    expect(next).toBe(state);
  });

  it('moves snake forward when PLAYING', () => {
    const state: GameState = { ...createInitialState(), status: 'PLAYING' };
    const next = tick(state);
    expect(next.snake[0].x).toBe(state.snake[0].x + 1);
    expect(next.snake[0].y).toBe(state.snake[0].y);
    expect(next.snake).toHaveLength(3);
  });

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

  it('ends game on self collision', () => {
    const snake = [
      { x: 5, y: 5 },  // head → going RIGHT
      { x: 4, y: 5 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
      { x: 6, y: 5 },  // this segment will block the head
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
});

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
