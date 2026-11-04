import {
  FOOTER_RESERVE_MM,
  FONT_STACKS,
  MIN_AUTO_FONT_PT,
  type Settings,
} from './settings';
import {
  PAPERS,
  PT_TO_PX,
  mmToPx,
  panelHeightMm,
  panelWidthMm,
} from './paper';
import { PAGES_PER_BOOKLET } from './imposition';

export interface PageData {
  text: string;
  pageNumber: number;
  /** 0..1, how full the page is. */
  fill: number;
  empty: boolean;
}

export interface PaginationResult {
  booklets: PageData[][];
  usedFontSizePt: number;
  shrunk: boolean;
  linesPerPage: number;
  totalTextPages: number;
}

const MAX_PAGES = 512;

export function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

function trimPage(text: string): string {
  return text.replace(/[ \t]+$/gm, '').replace(/\n+$/, '');
}

function countLines(element: HTMLElement, lineHeightPx: number): number {
  if (!element.textContent || !element.textContent.trim()) return 0;
  const height = element.scrollHeight;
  if (height <= 0) return 0;
  return Math.max(1, Math.round(height / lineHeightPx));
}

function createMeasurer(
  widthPx: number,
  fontStack: string,
  justify: boolean,
): HTMLDivElement {
  const element = document.createElement('div');
  element.setAttribute('aria-hidden', 'true');
  element.style.position = 'fixed';
  element.style.left = '-10000px';
  element.style.top = '0';
  element.style.width = `${widthPx}px`;
  element.style.padding = '0';
  element.style.margin = '0';
  element.style.border = '0';
  element.style.visibility = 'hidden';
  element.style.pointerEvents = 'none';
  element.style.whiteSpace = 'pre-wrap';
  element.style.overflowWrap = 'break-word';
  element.style.wordBreak = 'normal';
  element.style.fontFamily = fontStack;
  element.style.fontWeight = '400';
  element.style.fontStyle = 'normal';
  element.style.letterSpacing = 'normal';
  element.style.textAlign = justify ? 'justify' : 'left';
  element.style.boxSizing = 'content-box';
  element.style.lineHeight = '1';
  element.style.fontSize = '16px';
  document.body.appendChild(element);
  return element;
}

/**
 * Finds the character index at which a given visual line begins.
 * Line 0 starts at index 0.
 */
function findCutAtLine(
  element: HTMLDivElement,
  text: string,
  targetLine: number,
  lineHeightPx: number,
  totalLines: number,
): number {
  if (targetLine <= 0) return 0;
  if (targetLine >= totalLines) return text.length;

  element.textContent = text;
  const node = element.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return text.length;

  const top = element.getBoundingClientRect().top;
  const range = document.createRange();

  const rectAt = (index: number): DOMRect | null => {
    if (index < 0 || index >= text.length) return null;
    range.setStart(node, index);
    range.setEnd(node, Math.min(index + 1, text.length));
    const rects = range.getClientRects();
    for (const rect of rects) {
      if (rect.height > 0 || rect.width > 0) return rect;
    }
    return null;
  };

  const lineOf = (index: number): number => {
    let j = index;
    while (j < text.length && text.charAt(j) === '\n') j++;
    let rect = rectAt(j);
    let attempts = 0;
    while (!rect && j < text.length - 1 && attempts < 8) {
      j += 1;
      rect = rectAt(j);
      attempts += 1;
    }
    if (!rect) return totalLines;
    const line = Math.round((rect.top - top) / lineHeightPx);
    return Math.max(0, Math.min(totalLines - 1, line));
  };

  let low = 0;
  let high = text.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (lineOf(middle) >= targetLine) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
}

function makeBlankPages(): PageData[] {
  return Array.from({ length: PAGES_PER_BOOKLET }, (_, index) => ({
    text: '',
    pageNumber: index + 1,
    fill: 0,
    empty: true,
  }));
}

export function paginateText(raw: string, settings: Settings): PaginationResult {
  if (typeof document === 'undefined') {
    return {
      booklets: [makeBlankPages()],
      usedFontSizePt: settings.fontSizePt,
      shrunk: false,
      linesPerPage: 1,
      totalTextPages: 0,
    };
  }

  const text = normalizeText(raw);
  const paper = PAPERS[settings.paper];
  const panelW = panelWidthMm(paper);
  const panelH = panelHeightMm(paper);
  const contentWidthPx = Math.max(
    40,
    mmToPx(panelW - settings.marginMm * 2) - 1,
  );
  const footerReserve = settings.pageNumbers ? FOOTER_RESERVE_MM : 0;
  const contentHeightPx = Math.max(
    40,
    mmToPx(panelH - settings.marginMm * 2 - footerReserve),
  );

  const measurer = createMeasurer(
    contentWidthPx,
    FONT_STACKS[settings.font],
    settings.justify,
  );

  try {
    const basePt = Math.min(
      24,
      Math.max(MIN_AUTO_FONT_PT, settings.fontSizePt),
    );

    const candidates: number[] = [];
    for (let pt = basePt; pt >= MIN_AUTO_FONT_PT + 0.25; pt -= 0.5) {
      candidates.push(Number(pt.toFixed(2)));
    }
    if (!candidates.includes(MIN_AUTO_FONT_PT)) {
      candidates.push(MIN_AUTO_FONT_PT);
    }

    let usedPt = candidates[0] ?? basePt;

    if (text.length > 0) {
      for (const pt of candidates) {
        const lineHeightPx = pt * PT_TO_PX * settings.lineHeight;
        measurer.style.fontSize = `${pt * PT_TO_PX}px`;
        measurer.style.lineHeight = `${lineHeightPx}px`;
        measurer.textContent = text;

        const totalLines = countLines(measurer, lineHeightPx);
        const perPage = Math.max(
          1,
          Math.floor(contentHeightPx / lineHeightPx + 0.001),
        );
        usedPt = pt;

        if (Math.ceil(totalLines / perPage) <= PAGES_PER_BOOKLET) break;
      }
    }

    const lineHeightPx = usedPt * PT_TO_PX * settings.lineHeight;
    measurer.style.fontSize = `${usedPt * PT_TO_PX}px`;
    measurer.style.lineHeight = `${lineHeightPx}px`;

    const linesPerPage = Math.max(
      1,
      Math.floor(contentHeightPx / lineHeightPx + 0.001),
    );

    const pageTexts: string[] = [];
    let remaining = text;

    while (pageTexts.length < MAX_PAGES) {
      // A page break can land right before a run of blank lines. Dropping them
      // avoids starting a fresh page with an empty line.
      remaining = remaining.replace(/^\n+/, '');
      if (remaining.length === 0) break;

      measurer.textContent = remaining;
      const totalLines = countLines(measurer, lineHeightPx);

      if (totalLines <= linesPerPage) {
        const last = trimPage(remaining);
        if (last.length > 0) pageTexts.push(last);
        remaining = '';
        break;
      }

      const cut = findCutAtLine(
        measurer,
        remaining,
        linesPerPage,
        lineHeightPx,
        totalLines,
      );

      // The binary search should always make progress. Keep a guard so a
      // measurement quirk can never create an infinite loop.
      const safeCut = cut > 0 ? cut : Math.max(1, Math.floor(remaining.length / 2));
      const pageText = trimPage(remaining.slice(0, safeCut));
      pageTexts.push(pageText);
      remaining = remaining.slice(safeCut);
    }

    if (remaining.length > 0) {
      pageTexts.push(trimPage(remaining));
    }

    const totalTextPages = Math.max(1, pageTexts.length);
    const bookletCount = Math.max(
      1,
      Math.ceil(totalTextPages / PAGES_PER_BOOKLET),
    );

    const booklets: PageData[][] = [];
    for (let booklet = 0; booklet < bookletCount; booklet += 1) {
      const pages: PageData[] = [];
      for (let page = 0; page < PAGES_PER_BOOKLET; page += 1) {
        const index = booklet * PAGES_PER_BOOKLET + page;
        const pageText = pageTexts[index] ?? '';
        let fill = 0;
        if (pageText.length > 0) {
          measurer.textContent = pageText;
          fill = Math.min(1, countLines(measurer, lineHeightPx) / linesPerPage);
        }
        pages.push({
          text: pageText,
          pageNumber: page + 1,
          fill,
          empty: pageText.trim().length === 0,
        });
      }
      booklets.push(pages);
    }

    return {
      booklets,
      usedFontSizePt: usedPt,
      shrunk: usedPt < settings.fontSizePt - 0.01,
      linesPerPage,
      totalTextPages,
    };
  } finally {
    measurer.remove();
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/u).length;
}
