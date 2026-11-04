export type PaperId = 'letter' | 'a4';

export interface PaperSpec {
  id: PaperId;
  label: string;
  shortLabel: string;
  widthMm: number;
  heightMm: number;
}

export const PAPERS: Record<PaperId, PaperSpec> = {
  letter: {
    id: 'letter',
    label: 'Carta (Letter)',
    shortLabel: 'Carta',
    widthMm: 279.4,
    heightMm: 215.9,
  },
  a4: {
    id: 'a4',
    label: 'A4',
    shortLabel: 'A4',
    widthMm: 297,
    heightMm: 210,
  },
};

/** CSS pixels per millimetre (96 dpi). */
export const PX_PER_MM = 96 / 25.4;

/** CSS pixels per typographic point. */
export const PT_TO_PX = 96 / 72;

export const mmToPx = (mm: number) => mm * PX_PER_MM;

export const panelWidthMm = (paper: PaperSpec) => paper.widthMm / 4;

export const panelHeightMm = (paper: PaperSpec) => paper.heightMm / 2;
