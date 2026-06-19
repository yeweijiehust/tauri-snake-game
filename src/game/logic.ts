import type { Direction, GameState, Point } from './types';

const DIRECTIONS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

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

export function changeDirection(state: GameState, dir: Direction): GameState {
  if (dir === OPPOSITES[state.direction]) {
    return state;
  }
  return { ...state, nextDirection: dir };
}

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

function isOutOfBounds(point: Point, gridWidth: number, gridHeight: number): boolean {
  return point.x < 0 || point.x >= gridWidth || point.y < 0 || point.y >= gridHeight;
}

function hitsSelf(head: Point, snake: Point[], ate: boolean): boolean {
  const body = ate ? snake : snake.slice(0, -1);
  return body.some((seg) => seg.x === head.x && seg.y === head.y);
}
