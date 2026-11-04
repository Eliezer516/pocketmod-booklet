export interface SheetSlot {
  /** Page number in reading order (1-8). */
  page: number;
  row: 0 | 1;
  column: 0 | 1 | 2 | 3;
  /** The lower row is printed upside down. */
  rotated: boolean;
}

/**
 * PocketMod imposition for a single-sided landscape sheet.
 *
 *   ┌────┬────┬────┬────┐
 *   │ 2  │ 3  │ 4  │ 5  │  normal
 *   ├────┼────┼────┼────┤
 *   │ 1↻ │ 8↻ │ 7↻ │ 6↻ │  180°
 *   └────┴────┴────┴────┘
 *
 * This is the same mapping used by the LaTeX pocketmod package and pdfjam.
 */
export const SHEET_SLOTS: readonly SheetSlot[] = [
  { page: 2, row: 0, column: 0, rotated: false },
  { page: 3, row: 0, column: 1, rotated: false },
  { page: 4, row: 0, column: 2, rotated: false },
  { page: 5, row: 0, column: 3, rotated: false },
  { page: 1, row: 1, column: 0, rotated: true },
  { page: 8, row: 1, column: 1, rotated: true },
  { page: 7, row: 1, column: 2, rotated: true },
  { page: 6, row: 1, column: 3, rotated: true },
] as const;

export const PAGES_PER_BOOKLET = 8;
