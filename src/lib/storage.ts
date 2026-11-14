import { sanitizePageImages, type PageImages } from './page-images';
import { sanitizeSettings, type Settings } from './settings';

const STORAGE_KEY = 'pocketmod.state.v1';

// Saving runs after every change, so a full storage would otherwise show the
// same alert on each edit.
let quotaWarned = false;

export interface SavedState {
  text: string;
  settings: Settings;
  pageImages: PageImages;
}

export function loadSavedState(): SavedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    const record = parsed as {
      text?: unknown;
      settings?: unknown;
      pageImages?: unknown;
    };
    return {
      text: typeof record.text === 'string' ? record.text : '',
      settings: sanitizeSettings(record.settings),
      pageImages: sanitizePageImages(record.pageImages),
    };
  } catch {
    return null;
  }
}

export function saveState(state: SavedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (      error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      !quotaWarned
    ) {
      quotaWarned = true;
      window.alert(
        'No hay espacio suficiente para guardar el documento. Prueba a reducir el tamaño o el número de imágenes.',
      );
    }
    // Storage can fail in private mode or when it is full. The app still
    // works for the current session.
  }
}
