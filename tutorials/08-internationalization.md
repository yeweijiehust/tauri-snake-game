# 08 — Internationalization (i18n)

This tutorial explains how the game supports switching between English and Chinese using React Context.

## Prerequisites

- [05 — React Basics](05-react-basics.md)
- Understanding of `useState`, `createContext`, `useContext`

## What is i18n?

**Internationalization** (abbreviated **i18n** — 18 letters between 'i' and 'n') is the process of designing software to support multiple languages.

A typical i18n system provides:

- **Translation dictionaries** — key-value pairs mapping abstract keys (`'game.score'`) to translated strings (`'Score'` or `'分数'`)
- **A `t()` function** — `t('game.score')` returns the string in the current language
- **Language switching** — a way to change the active language at runtime

## Architecture

Our i18n system uses **React Context** to avoid "prop drilling" (passing the `t()` function through every component in the tree).

```
I18nProvider (wraps the entire app)
  └─ holds current locale + t() function
      └─ any component can call useI18n() to get t()
```

## The Translation Dictionaries

### `src/locales/types.ts`

```typescript
export type LocaleKey =
  | 'app.title'
  | 'game.start'
  | 'game.pause'
  | 'game.resume'
  | 'game.over'
  // ... more keys ...

export type LocaleDict = Record<LocaleKey, string>;
```

`LocaleKey` is a **union type** listing every possible translation key. `LocaleDict` is a `Record` — an object where every key must be present.

> **Why a union type?**
> By listing every key explicitly, TypeScript will give a **compile error** if:
> - You miss a key in one language
> - You typo a key when calling `t()`
> - You add a key in English but forget to add it in Chinese

### `src/locales/en.ts` and `zh.ts`

```typescript
// en.ts
const en: LocaleDict = {
  'app.title': 'Snake Game',
  'game.start': 'Start',
  'game.pause': 'Pause',
  // ... every key must be present ...
};

// zh.ts
const zh: LocaleDict = {
  'app.title': '贪吃蛇',
  'game.start': '开始',
  // ...
};
```

Both dictionaries export objects with the same keys but different values. The `LocaleDict` type ensures they match.

## The I18n Context

### `src/utils/i18n.tsx`

```typescript
import { createContext, useContext, useState, type ReactNode } from 'react';
import en from '../locales/en';
import zh from '../locales/zh';
import type { LocaleDict, LocaleKey } from '../locales/types';

type Locale = 'en' | 'zh';

const dicts: Record<Locale, LocaleDict> = { en, zh };
```

First, we define that we support two languages (`'en'` and `'zh'`), and create a lookup object mapping language codes to their dictionaries.

### The Context Type

```typescript
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: LocaleKey) => string;
}
```

The context provides three things:
1. `locale` — the current language code (for UI display or conditional rendering)
2. `setLocale` — a function to switch languages
3. `t` — the translation function

### Creating the Context

```typescript
const I18nContext = createContext<I18nContextValue | null>(null);
```

`createContext` creates a context object with a default value (`null`). We use `null` because the default is never used — we always wrap the app in `I18nProvider`.

### The Provider Component

```typescript
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = (key: LocaleKey): string => dicts[locale][key];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
```

The provider:
1. Holds the current `locale` in state (default: English)
2. Defines `t()` as a lookup in the current dictionary
3. Wraps `children` in the context provider, passing down the values

When `setLocale` is called with `'zh'`, `locale` changes, `t()` starts looking up Chinese translations, and React re-renders all consuming components.

### The Consumer Hook

```typescript
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
```

A custom hook that:
1. Calls `useContext(I18nContext)` to get the current context value
2. Throws an error if called outside the provider (helpful debugging)
3. Returns the typed context value

> **Prerequisite concept: custom hooks**
> Any function starting with `use` is a custom hook. Custom hooks let you extract and reuse stateful logic across components.

## Usage in Components

### In `App.tsx`

```typescript
function GameBoard() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="app-layout">
      <h1 className="app-title">{t('app.title')}</h1>
      <div className="lang-bar">
        <button
          className={locale === 'en' ? 'active' : ''}
          onClick={() => setLocale('en')}
        >
          {t('lang.en')}
        </button>
        <button
          className={locale === 'zh' ? 'active' : ''}
          onClick={() => setLocale('zh')}
        >
          {t('lang.zh')}
        </button>
      </div>
      <span className="score">{t('game.score')}: {state.score}</span>
      <button>{t('game.start')}</button>
      <button>{t('history.button')}</button>
      {/* ... */}
    </div>
  );
}
```

The `active` class highlights the currently selected language button.

### In the Wrapper

```typescript
export default function App() {
  return (
    <I18nProvider>
      <GameBoard />
    </I18nProvider>
  );
}
```

The `I18nProvider` wraps the entire game, making `useI18n()` available to `GameBoard` and any future child components.

## Adding a New Language

To add a third language (e.g., Japanese):

1. Add new keys to `LocaleKey` in `types.ts` (if any)
2. Create `src/locales/ja.ts` with all translations
3. Add `'ja'` to the `Locale` type in `i18n.tsx`
4. Add `ja` to the `dicts` object
5. Add a button in `App.tsx`

The TypeScript compiler will enforce that all keys are present.

## Key Takeaways

- **i18n** = internationalization = supporting multiple languages
- **React Context** provides global state without prop drilling
- **`createContext` + `Provider` + `useContext`** = the Context pattern
- **Union types** enforce that all translation keys exist
- **Custom hooks** (`useI18n`) encapsulate context consumption
- The `t()` function is a simple dictionary lookup by key

---

Next: [09 — Local Storage and History](09-local-storage-and-history.md)
