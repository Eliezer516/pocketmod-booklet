import { sanitizeSettings, type Settings } from './settings';

const STORAGE_KEY = 'pocketmod.state.v1';

export interface SavedState {
  text: string;
  settings: Settings;
}

export function loadSavedState(): SavedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    const record = parsed as { text?: unknown; settings?: unknown };
    return {
      text: typeof record.text === 'string' ? record.text : '',
      settings: sanitizeSettings(record.settings),
    };
  } catch {
    return null;
  }
}

export function saveState(state: SavedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail in private mode or when it is full. The app still
    // works for the current session.
  }
}
