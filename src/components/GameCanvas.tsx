import { useRef, useEffect } from 'react';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  cellSize?: number;
}

const COLORS = {
  bg: '#1a1a2e',
  grid: '#16213e',
  snake: '#00ff88',
  snakeHead: '#00cc6a',
  food: '#ff4757',
};

export function GameCanvas({ state, cellSize = 24 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = state.gridWidth * cellSize;
  const height = state.gridHeight * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x < state.gridWidth; x++) {
      for (let y = 0; y < state.gridHeight; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = COLORS.grid;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    state.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
      ctx.fillRect(seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });

    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    const fx = state.food.x * cellSize + cellSize / 2;
    const fy = state.food.y * cellSize + cellSize / 2;
    ctx.arc(fx, fy, cellSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }, [state, cellSize, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '2px solid #0f3460', borderRadius: 4 }}
    />
  );
}
