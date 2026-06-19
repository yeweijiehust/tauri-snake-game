import type { GameRecord } from '../game/types';

const STORAGE_KEY = 'snake-game-history';
const MAX_RECORDS = 10;

export function loadHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(score: number): void {
  const records = loadHistory();
  records.push({ score, date: new Date().toISOString() });
  records.sort((a, b) => b.score - a.score);
  const trimmed = records.slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
