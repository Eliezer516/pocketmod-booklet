import { PAGES_PER_BOOKLET } from './imposition';
import { markdownWordCount, renderMarkdown } from './markdown';
import {
  PAPERS,
  PT_TO_PX,
  mmToPx,
  panelHeightMm,
  panelWidthMm,
} from './paper';
import {
  FOOTER_RESERVE_MM,
  FONT_STACKS,
  MIN_AUTO_FONT_PT,
  type Settings,
} from './settings';

export interface PageData {
  html: string;
  pageNumber: number;
  /** 0..1, how full the page is. */
  fill: number;
  empty: boolean;
}

export interface PaginationResult {
  booklets: PageData[][];
  usedFontSizePt: number;
  shrunk: boolean;
  totalTextPages: number;
}

interface MeasuredPage {
  html: string;
  fill: number;
}

interface PaginatedPages {
  pages: MeasuredPage[];
  overflow: boolean;
}

interface SplitResult {
  before: Element;
  after: Element | null;
}

const MAX_PAGES = 512;
const SAFETY_PX = 1;

const WORD_CHAR = /[\p{L}\p{N}]/u;

function normalizeMarkdown(input: string): string {
  return input.replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
}

function makeBlankPages(): PageData[] {
  return Array.from({ length: PAGES_PER_BOOKLET }, (_, index) => ({
    html: '',
    pageNumber: index + 1,
    fill: 0,
    empty: true,
  }));
}

function blankResult(settings: Settings): PaginationResult {
  return {
    booklets: [makeBlankPages()],
    usedFontSizePt: settings.fontSizePt,
    shrunk: false,
    totalTextPages: 0,
  };
}

function createHost(): HTMLDivElement {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'visible';
  host.style.visibility = 'hidden';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);
  return host;
}

function createPage(
  host: HTMLElement,
  settings: Settings,
  fontSizePx: number,
  contentWidthPx: number,
  contentHeightPx: number,
): HTMLDivElement {
  const page = document.createElement('div');
  page.className = 'pocket-markdown';
  page.style.width = `${contentWidthPx}px`;
  page.style.fontFamily = FONT_STACKS[settings.font];
  page.style.fontSize = `${fontSizePx}px`;
  page.style.lineHeight = String(settings.lineHeight);
  page.style.textAlign = settings.justify ? 'justify' : 'left';
  page.style.setProperty('--page-content-height', `${contentHeightPx}px`);
  host.appendChild(page);
  return page;
}

function collectTextNodes(root: Element): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    if ((text.nodeValue?.length ?? 0) > 0) nodes.push(text);
    current = walker.nextNode();
  }
  return nodes;
}

function locateOffset(
  textNodes: Text[],
  ends: number[],
  offset: number,
): { node: Text; offset: number } {
  let low = 0;
  let high = ends.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((ends[middle] ?? 0) >= offset) high = middle;
    else low = middle + 1;
  }
  const start = low === 0 ? 0 : (ends[low - 1] ?? 0);
  const node = textNodes[low]!;
  return {
    node,
    offset: Math.max(0, Math.min(offset - start, node.length)),
  };
}

/**
 * Splits one rendered markdown block at the last line that fits in the page.
 * The returned wrappers keep the original element (paragraph, heading,
 * blockquote, list item…) so inline styles survive the cut.
 */
function splitNodeToFit(
  node: Element,
  page: Element,
  contentHeightPx: number,
): SplitResult | null {
  const textNodes = collectTextNodes(node);
  if (textNodes.length === 0) return null;

  const flat = textNodes.map((text) => text.nodeValue ?? '').join('');
  if (flat.length < 2) return null;

  const ends: number[] = [];
  let total = 0;
  for (const text of textNodes) {
    total += text.nodeValue?.length ?? 0;
    ends.push(total);
  }

  const range = document.createRange();
  range.setStart(node, 0);
  const pageTop = page.getBoundingClientRect().top;
  const maxBottom = pageTop + contentHeightPx - SAFETY_PX;

  const fits = (offset: number): boolean => {
    const location = locateOffset(textNodes, ends, offset);
    range.setEnd(location.node, location.offset);
    const rect = range.getBoundingClientRect();
    return rect.height <= 0 || rect.bottom <= maxBottom;
  };

  if (!fits(1)) return null;

  let low = 1;
  let high = flat.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle - 1;
  }
  let cut = low;

  if (cut >= flat.length) return null;

  // Do not cut a word in half unless the layout offers no other option.
  if (
    WORD_CHAR.test(flat.charAt(cut - 1)) &&
    WORD_CHAR.test(flat.charAt(cut))
  ) {
    let boundary = cut;
    while (boundary > 0 && WORD_CHAR.test(flat.charAt(boundary - 1))) {
      boundary -= 1;
    }
    cut = boundary;
  }

  // Code blocks should only break between lines.
  if (node.tagName === 'PRE') {
    const newline = flat.lastIndexOf('\n', cut - 1);
    if (newline <= 0) return null;
    cut = newline + 1;
  }

  if (cut <= 0 || cut >= flat.length) return null;

  const location = locateOffset(textNodes, ends, cut);

  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(node);
  beforeRange.setEnd(location.node, location.offset);

  const afterRange = document.createRange();
  afterRange.selectNodeContents(node);
  afterRange.setStart(location.node, location.offset);

  const before = node.cloneNode(false) as Element;
  before.appendChild(beforeRange.cloneContents());
  const after = node.cloneNode(false) as Element;
  after.appendChild(afterRange.cloneContents());

  if (
    before.textContent?.trim().length === 0 &&
    !before.querySelector('img, hr, br')
  ) {
    return null;
  }
  if (
    after.textContent?.trim().length === 0 &&
    !after.querySelector('img, hr, br')
  ) {
    return null;
  }

  return { before, after };
}

/**
 * Splits a list between its items. This keeps the bullets and the ordered-list
 * numbering intact, which a plain text cut would break.
 */
function splitListToFit(
  list: Element,
  page: Element,
  contentHeightPx: number,
): SplitResult | null {
  const items = Array.from(list.children).filter(
    (child) => child.tagName === 'LI',
  );
  if (items.length === 0) return null;

  const ordered = list.tagName === 'OL';
  const parsedStart = Number.parseInt(list.getAttribute('start') ?? '1', 10);
  const firstNumber = Number.isFinite(parsedStart) ? parsedStart : 1;

  const buildList = (count: number): Element => {
    const clone = list.cloneNode(false) as Element;
    for (let index = 0; index < count; index += 1) {
      clone.appendChild(items[index]!.cloneNode(true));
    }
    return clone;
  };

  const fits = (count: number): boolean => {
    const test = buildList(count);
    page.replaceChild(test, list);
    const result = page.scrollHeight <= contentHeightPx + 0.5;
    page.replaceChild(list, test);
    return result;
  };

  // A single item is already taller than the available space. Split that item
  // and mark the continuation so it does not get a second bullet or number.
  if (!fits(1)) {
    const split = splitNodeToFit(items[0]!, page, contentHeightPx);
    if (!split || !split.after) return null;

    const before = list.cloneNode(false) as Element;
    before.appendChild(split.before);

    const after = list.cloneNode(false) as Element;
    after.appendChild(split.after);
    for (let index = 1; index < items.length; index += 1) {
      after.appendChild(items[index]!.cloneNode(true));
    }
    after.firstElementChild?.classList.add('pocket-list-continuation');

    return { before, after };
  }

  let low = 1;
  let high = items.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle - 1;
  }

  if (low >= items.length) return null;

  const before = buildList(low);
  const after = list.cloneNode(false) as Element;
  if (ordered) after.setAttribute('start', String(firstNumber + low));
  for (let index = low; index < items.length; index += 1) {
    after.appendChild(items[index]!.cloneNode(true));
  }

  return { before, after };
}

/**
 * Splits a table between rows and repeats the header in both halves, so the
 * continuation never starts with an orphan cell or a missing column title.
 */
function splitTableToFit(
  table: Element,
  page: Element,
  contentHeightPx: number,
): SplitResult | null {
  const thead = table.querySelector('thead');
  const body = table.querySelector('tbody');
  const rows = body
    ? Array.from(body.children).filter((child) => child.tagName === 'TR')
    : [];
  if (rows.length === 0) return null;

  const buildTable = (
    from: number,
    count: number,
    withHead: boolean,
  ): Element => {
    const clone = table.cloneNode(false) as Element;
    if (withHead && thead) clone.appendChild(thead.cloneNode(true));
    const nextBody = body
      ? (body.cloneNode(false) as Element)
      : document.createElement('tbody');
    for (let index = from; index < from + count; index += 1) {
      nextBody.appendChild(rows[index]!.cloneNode(true));
    }
    clone.appendChild(nextBody);
    return clone;
  };

  const fits = (count: number): boolean => {
    const test = buildTable(0, count, true);
    page.replaceChild(test, table);
    const ok = page.scrollHeight <= contentHeightPx + 0.5;
    page.replaceChild(table, test);
    return ok;
  };

  if (!fits(1)) return null;

  let low = 1;
  let high = rows.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle - 1;
  }

  if (low >= rows.length) return null;

  return {
    before: buildTable(0, low, true),
    after: buildTable(low, rows.length - low, true),
  };
}

function paginateBlocks(
  blocks: readonly Element[],
  settings: Settings,
  fontSizePt: number,
  maxPages: number,
): PaginatedPages {
  const paper = PAPERS[settings.paper];
  const contentWidthPx = Math.max(
    40,
    mmToPx(panelWidthMm(paper) - settings.marginMm * 2) - SAFETY_PX,
  );
  const footerReserve = settings.pageNumbers ? FOOTER_RESERVE_MM : 0;
  const contentHeightPx = Math.max(
    40,
    mmToPx(panelHeightMm(paper) - settings.marginMm * 2 - footerReserve) -
      SAFETY_PX,
  );
  const fontSizePx = fontSizePt * PT_TO_PX;

  const host = createHost();
  const pending: Element[] = blocks.map(
    (block) => block.cloneNode(true) as Element,
  );
  const pages: MeasuredPage[] = [];

  try {
    while (pending.length > 0 && pages.length < maxPages) {
      const page = createPage(
        host,
        settings,
        fontSizePx,
        contentWidthPx,
        contentHeightPx,
      );
      const lineHeightPx = fontSizePx * settings.lineHeight;

      while (pending.length > 0) {
        const node = pending[0]!;
        const isHeading = /^H[1-6]$/.test(node.tagName);

        // Avoid leaving a heading alone at the bottom of a page.
        if (
          isHeading &&
          page.children.length > 0 &&
          contentHeightPx - page.scrollHeight < lineHeightPx * 3
        ) {
          break;
        }

        page.appendChild(node);

        if (page.scrollHeight <= contentHeightPx + 0.5) {
          pending.shift();
          continue;
        }

        const hadContent = page.children.length > 1;

        if (isHeading && hadContent) {
          page.removeChild(node);
          break;
        }

        const split =
          node.tagName === 'UL' || node.tagName === 'OL'
            ? splitListToFit(node, page, contentHeightPx)
            : node.tagName === 'TABLE'
              ? splitTableToFit(node, page, contentHeightPx)
              : splitNodeToFit(node, page, contentHeightPx);

        if (split) {
          page.replaceChild(split.before, node);
          pending.shift();
          if (split.after) pending.unshift(split.after);
          break;
        }

        page.removeChild(node);
        if (hadContent) break;

        // Oversized unbreakable block on an empty page (for example an image).
        // Keeping it guarantees that pagination always advances.
        page.appendChild(node);
        pending.shift();
        break;
      }

      if (page.children.length === 0) {
        page.remove();
        break;
      }

      pages.push({
        html: page.innerHTML,
        fill: Math.min(1, page.scrollHeight / contentHeightPx),
      });
      page.remove();
    }
  } finally {
    host.remove();
  }

  return { pages, overflow: pending.length > 0 };
}

export function paginateText(raw: string, settings: Settings): PaginationResult {
  if (typeof document === 'undefined') return blankResult(settings);

  const source = normalizeMarkdown(raw);
  if (!source) return blankResult(settings);

  const template = document.createElement('template');
  template.innerHTML = renderMarkdown(source);
  const blocks = Array.from(template.content.children);
  if (blocks.length === 0) return blankResult(settings);

  const basePt = Math.min(24, Math.max(MIN_AUTO_FONT_PT, settings.fontSizePt));
  const candidates: number[] = [];
  for (let pt = basePt; pt >= MIN_AUTO_FONT_PT + 0.25; pt -= 0.5) {
    candidates.push(Number(pt.toFixed(2)));
  }
  if (!candidates.includes(MIN_AUTO_FONT_PT)) {
    candidates.push(MIN_AUTO_FONT_PT);
  }

  let usedPt = candidates[0] ?? basePt;
  let chosen: PaginatedPages | null = null;

  for (const pt of candidates) {
    const attempt = paginateBlocks(
      blocks,
      settings,
      pt,
      PAGES_PER_BOOKLET,
    );
    if (!attempt.overflow) {
      chosen = attempt;
      usedPt = pt;
      break;
    }
  }

  if (!chosen) {
    usedPt = MIN_AUTO_FONT_PT;
    chosen = paginateBlocks(blocks, settings, usedPt, MAX_PAGES);
  }

  const pages = chosen.pages;
  const totalTextPages = Math.max(1, pages.length);
  const bookletCount = Math.max(
    1,
    Math.ceil(totalTextPages / PAGES_PER_BOOKLET),
  );

  const booklets: PageData[][] = [];
  for (let booklet = 0; booklet < bookletCount; booklet += 1) {
    const bookletPages: PageData[] = [];
    for (let page = 0; page < PAGES_PER_BOOKLET; page += 1) {
      const index = booklet * PAGES_PER_BOOKLET + page;
      const measured = pages[index];
      bookletPages.push({
        html: measured?.html ?? '',
        pageNumber: page + 1,
        fill: measured?.fill ?? 0,
        empty: !measured || measured.html.trim().length === 0,
      });
    }
    booklets.push(bookletPages);
  }

  return {
    booklets,
    usedFontSizePt: usedPt,
    shrunk: usedPt < settings.fontSizePt - 0.01,
    totalTextPages,
  };
}

export function countWords(text: string): number {
  return markdownWordCount(text);
}
