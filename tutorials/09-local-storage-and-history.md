# 09 — Local Storage and History

This tutorial covers saving game scores to `localStorage` and the history modal UI pattern.

## Prerequisites

- [05 — React Basics](05-react-basics.md)
- [07 — Game Loop and Controls](07-game-loop-and-controls.md)
- [08 — Internationalization](08-internationalization.md)
- Understanding of `JSON.parse` / `JSON.stringify`

## `localStorage` Basics

`localStorage` is a browser API that stores key-value pairs persistently. Unlike `sessionStorage`, data survives browser restarts.

```typescript
// Save
localStorage.setItem('key', 'value');

// Load
const value = localStorage.getItem('key'); // Returns string | null

// Delete
localStorage.removeItem('key');
```

**Important**: `localStorage` only stores **strings**. To store objects/arrays, we convert to JSON:

```typescript
const data = [{ score: 5, date: '2026-01-01' }];
localStorage.setItem('history', JSON.stringify(data));

const loaded = JSON.parse(localStorage.getItem('history') || '[]');
```

> **Prerequisite concept: JSON**
> JSON (JavaScript Object Notation) is a text format for representing structured data. `JSON.stringify()` converts an object to a JSON string. `JSON.parse()` converts a JSON string back to an object.

## `src/utils/history.ts` — The History Utility

```typescript
import type { GameRecord } from '../game/types';

const STORAGE_KEY = 'snake-game-history';
const MAX_RECORDS = 10;
```

Constants:
- `STORAGE_KEY` — the localStorage key we'll use
- `MAX_RECORDS` — maximum number of records to keep

### `loadHistory()`

```typescript
export function loadHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameRecord[];
  } catch {
    return [];
  }
}
```

The `try/catch` handles edge cases:
- First time playing: `getItem` returns `null` → return `[]`
- Corrupted data: `JSON.parse` throws → return `[]` (graceful degradation)

### `saveRecord()`

```typescript
export function saveRecord(score: number): void {
  const records = loadHistory();
  records.push({ score, date: new Date().toISOString() });
  records.sort((a, b) => b.score - a.score);
  const trimmed = records.slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}
```

Steps:
1. Load existing records
2. Add the new record with current timestamp (`new Date().toISOString()`)
3. Sort by score descending (highest first)
4. Keep only top 10
5. Save back

`Date.toISOString()` returns a string like `"2026-06-19T12:34:56.789Z"` (ISO 8601 format).

### `clearHistory()`

```typescript
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

Simply removes the key from localStorage.

## When is History Saved?

In `App.tsx`, a `useEffect` watches for game state transitions:

```typescript
const prevStatusRef = useRef<GameStatus>(state.status);

useEffect(() => {
  if (state.status === 'GAME_OVER' && prevStatusRef.current === 'PLAYING') {
    saveRecord(state.score);
    setRecords(loadHistory());
  }
  prevStatusRef.current = state.status;
}, [state.status, state.score]);
```

This pattern:
1. Tracks the previous status in a ref
2. When status changes from `PLAYING` to `GAME_OVER`, it saves the score
3. Updates the local records state (so the UI refreshes immediately)

**Why not save inside `tick()`?** We originally did, but it caused a bug: React StrictMode double-invokes updater functions in development, causing duplicate saves. By moving the side effect to `useEffect`, it only runs once per actual state change.

## The History Modal

The history is displayed in a **modal** (a popup overlay).

### State

```typescript
const [showHistory, setShowHistory] = useState(false);
const [showClearConfirm, setShowClearConfirm] = useState(false);
```

- `showHistory` controls the modal visibility
- `showClearConfirm` controls the confirmation sub-dialog

### Opening the Modal

```typescript
<button onClick={() => setShowHistory(true)}>
  {t('history.button')}
</button>
```

### The Modal

```typescript
{showHistory && (
  <div className="modal-overlay" onClick={() => setShowHistory(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{t('history.title')}</h3>
        <button className="modal-close" onClick={() => setShowHistory(false)}>
          &times;
        </button>
      </div>
      {/* content ... */}
    </div>
  </div>
)}
```

Key interaction patterns:

**Click outside to close**: The overlay has `onClick={() => setShowHistory(false)}`. The content has `onClick={(e) => e.stopPropagation()}`. So clicking outside (on the overlay) closes the modal, but clicking inside (on the content) doesn't bubble up.

**Close button**: The `×` button explicitly closes the modal.

### Content: Table or Empty State

```typescript
{records.length === 0 ? (
  <p>{t('history.empty')}</p>
) : (
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>{t('history.score')}</th>
        <th>{t('history.date')}</th>
      </tr>
    </thead>
    <tbody>
      {records.map((r, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td>{r.score}</td>
          <td>{new Date(r.date).toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
```

Two states:
- **Empty**: show a message "No records yet"
- **Has records**: show a table with rank, score, and formatted date

`new Date(r.date).toLocaleString()` converts the ISO string to a human-readable format based on the user's locale.

### Clear Confirmation Pattern

```typescript
{showClearConfirm ? (
  <div className="confirm-prompt">
    <p>{t('history.confirm')}</p>
    <div className="confirm-actions">
      <button className="confirm-yes" onClick={() => {
        clearHistory();
        setRecords([]);
        setShowClearConfirm(false);
      }}>
        {t('history.yes')}
      </button>
      <button className="confirm-no" onClick={() => setShowClearConfirm(false)}>
        {t('history.no')}
      </button>
    </div>
  </div>
) : (
  <>
    {/* table or empty message */}
    <div className="modal-footer">
      <button className="btn-danger" onClick={() => setShowClearConfirm(true)}>
        {t('history.clear')}
      </button>
    </div>
  </>
)}
```

This is a **confirmation before destructive action** pattern:

1. User clicks "Clear" → `showClearConfirm = true`
2. The modal content swaps from the table to a confirmation prompt
3. User clicks "Yes" → history is cleared, records state reset, prompt closed
4. User clicks "No" → prompt closed, returns to table view

This prevents accidental deletion. The pattern is common for delete operations in many applications.

## Key Takeaways

- **`localStorage`** persists data across sessions (key-value, strings only)
- **JSON serialization** converts objects to/from strings for storage
- **`saveRecord()`** appends, sorts by score, and trims to 10
- **`useEffect`** watches state transitions to trigger saves safely
- **Modal pattern**: overlay + content + click-outside-to-close
- **Confirmation pattern**: swap content to Yes/No before destructive actions

---

Next: [10 — Tauri Architecture](10-tauri-architecture.md)
