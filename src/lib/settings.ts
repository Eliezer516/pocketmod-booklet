import type { PaperId } from './paper';

export type FontId = 'serif' | 'sans' | 'mono';

export interface Settings {
  paper: PaperId;
  font: FontId;
  fontSizePt: number;
  lineHeight: number;
  marginMm: number;
  justify: boolean;
  pageNumbers: boolean;
  guides: boolean;
}

export const FONT_STACKS: Record<FontId, string> = {
  serif:
    '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  sans:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono:
    'ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, "Liberation Mono", monospace',
};

export const FONT_LABELS: Record<FontId, string> = {
  serif: 'Serif',
  sans: 'Sans',
  mono: 'Mono',
};

export const MIN_FONT_PT = 7;
export const MAX_FONT_PT = 14;
export const MIN_AUTO_FONT_PT = 6;
export const FOOTER_RESERVE_MM = 5;

export const DEFAULT_SETTINGS: Settings = {
  paper: 'letter',
  font: 'serif',
  fontSizePt: 10.5,
  lineHeight: 1.35,
  marginMm: 5,
  justify: true,
  pageNumbers: true,
  guides: false,
};

const clamp = (value: number, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

/** Merge persisted or untrusted settings with safe defaults. */
export function sanitizeSettings(input: unknown): Settings {
  const raw =
    input !== null && typeof input === 'object'
      ? (input as Partial<Settings>)
      : {};

  return {
    paper: raw.paper === 'a4' ? 'a4' : 'letter',
    font: raw.font === 'sans' || raw.font === 'mono' ? raw.font : 'serif',
    fontSizePt: clamp(
      typeof raw.fontSizePt === 'number' ? raw.fontSizePt : NaN,
      MIN_FONT_PT,
      MAX_FONT_PT,
      DEFAULT_SETTINGS.fontSizePt,
    ),
    lineHeight: clamp(
      typeof raw.lineHeight === 'number' ? raw.lineHeight : NaN,
      1.1,
      1.7,
      DEFAULT_SETTINGS.lineHeight,
    ),
    marginMm: clamp(
      typeof raw.marginMm === 'number' ? raw.marginMm : NaN,
      3,
      10,
      DEFAULT_SETTINGS.marginMm,
    ),
    justify: typeof raw.justify === 'boolean' ? raw.justify : true,
    pageNumbers:
      typeof raw.pageNumbers === 'boolean' ? raw.pageNumbers : true,
    guides: raw.guides === true,
  };
}
