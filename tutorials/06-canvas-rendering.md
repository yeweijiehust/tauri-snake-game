# 06 — Canvas Rendering

The game board is drawn using the HTML Canvas API. This tutorial explains how `GameCanvas.tsx` works.

## Prerequisites

- [05 — React Basics](05-react-basics.md)
- Basic understanding of `<canvas>` as an HTML element

## The Canvas API

`<canvas>` is an HTML element that provides a **bitmap drawing surface**. Unlike DOM elements (divs, spans, etc.), canvas content is drawn pixel-by-pixel using JavaScript.

```html
<canvas width="480" height="480"></canvas>
```

You get a **2D drawing context** from the canvas:

```typescript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
// ctx has methods like fillRect(), arc(), fillText(), etc.
```

Canvas is ideal for games because:
- **Performance** — drawing many simple shapes is faster than DOM manipulation
- **Control** — every pixel is under your control
- **No layout** — no CSS box model to worry about

## `src/components/GameCanvas.tsx` — Line by Line

### Props

```typescript
interface Props {
  state: GameState;
  cellSize?: number;
}
```

The component receives the full `GameState` and an optional `cellSize` (default 24 pixels per grid cell).

### Component Structure

```typescript
export function GameCanvas({ state, cellSize = 24 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = state.gridWidth * cellSize;
  const height = state.gridHeight * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ... drawing code ...

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
```

Key design:

**`useRef` for canvas** — We use `useRef<HTMLCanvasElement>(null)` to get a reference to the actual DOM `<canvas>` element. Unlike `document.querySelector('canvas')`, this ref is tied to this specific component instance.

**`useEffect` for drawing** — Drawing is a side effect. We run the drawing code whenever `state` changes. The dependency array `[state, cellSize, width, height]` ensures we redraw whenever the game updates.

**Canvas dimensions** — `width` and `height` are computed from grid size × cell size. These are set as attributes on the `<canvas>` element, which determines the resolution of the drawing surface (not to be confused with CSS size).

> **Prerequisite concept: canvas width/height attributes**
> `<canvas width="480" height="480">` sets the coordinate system (0 to 480 in both axes). If you set width/height via CSS instead of attributes, the canvas content will be scaled/stretched.

### Drawing the Background

```typescript
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
```

A **checkerboard pattern** creates visual contrast between cells:
- Every cell where `(x + y)` is even gets a slightly lighter fill
- Odd cells remain the background color

This gives the classic game grid appearance.

### Drawing the Snake

```typescript
state.snake.forEach((seg, i) => {
  ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
  ctx.fillRect(seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2);
});
```

Each segment is drawn as a filled rectangle:
- **Head** (`i === 0`) gets a different color for visual clarity
- `+1` and `-2` create a 1-pixel gap between segments for definition (otherwise they'd blend into one block)

### Drawing the Food

```typescript
ctx.fillStyle = COLORS.food;
ctx.beginPath();
const fx = state.food.x * cellSize + cellSize / 2;
const fy = state.food.y * cellSize + cellSize / 2;
ctx.arc(fx, fy, cellSize / 2 - 2, 0, Math.PI * 2);
ctx.fill();
```

Food is drawn as a **circle** (using `arc`) instead of a square to make it visually distinct from the snake.
- `cellSize / 2 - 2` — radius slightly smaller than half a cell (with a 2px margin)
- `0, Math.PI * 2` — full circle (0 to 2π radians)

### Color Constants

```typescript
const COLORS = {
  bg: '#1a1a2e',
  grid: '#16213e',
  snake: '#00ff88',
  snakeHead: '#00cc6a',
  food: '#ff4757',
};
```

Defined as a constant outside the component — no need to recreate this object on every render.

## Canvas vs DOM for Game Rendering

A common question is why not use `<div>` elements for each snake segment?

| Aspect | Canvas | DOM (`<div>`) |
|--------|--------|---------------|
| Performance | Fast for many elements | Slower with many elements |
| Drawing types | Lines, arcs, gradients, images | Only rectangular boxes (CSS) |
| Hit detection | Manual (math) | Automatic (event listeners) |
| Accessibility | Poor (just a raster image) | Better (each element is accessible) |
| Animation | Full redraw each frame | React updates diff |

For a simple snake game, either approach works. Canvas is used here because it's more natural for game-like visuals (circles, custom shapes).

## Why This Component is "Dumb"

`GameCanvas` is a **pure render component**:
- It receives the full game state as props
- It draws whatever state it receives
- It has no internal game logic
- It doesn't handle keyboard events

This separation means:
- The canvas component is reusable (give it any game state)
- Testing is cleaner (mock the canvas and verify the component renders)
- Logic changes don't require rendering changes

## Key Takeaways

- **Canvas** provides pixel-level drawing control
- **`useRef`** gets a reference to the canvas DOM element
- **`useEffect`** triggers redrawing when state changes
- **Checkerboard** pattern for grid, **fillRect** for snake, **arc** for food
- The canvas component is deliberately "dumb" — it only renders

---

Next: [07 — Game Loop and Controls](07-game-loop-and-controls.md)
