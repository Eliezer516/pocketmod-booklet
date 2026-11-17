import { PAGES_PER_BOOKLET } from './imposition';
import { PAPERS, mmToPx, panelHeightMm, panelWidthMm } from './paper';
import { FOOTER_RESERVE_MM, type Settings } from './settings';

export interface PageImage {
  /** Embedded data URL, or an http(s) URL when the image was imported by URL. */
  src: string;
  /** Intrinsic size after compression. */
  width: number;
  height: number;
}

/** Images attached to page numbers, 1-8. */
export type PageImages = Partial<Record<number, PageImage>>;

/** Mirrors the safety margin used by the paginator. */
const SAFETY_PX = 1;

export interface PageMetrics {
  widthPx: number;
  heightPx: number;
}

export function pageMetrics(settings: Settings): PageMetrics {
  const paper = PAPERS[settings.paper];
  const footerReserve = settings.pageNumbers ? FOOTER_RESERVE_MM : 0;
  return {
    widthPx: Math.max(
      40,
      mmToPx(panelWidthMm(paper) - settings.marginMm * 2) - SAFETY_PX,
    ),
    heightPx: Math.max(
      40,
      mmToPx(panelHeightMm(paper) - settings.marginMm * 2 - footerReserve) -
        SAFETY_PX,
    ),
  };
}

/** Embedded images and remote http(s) images are the only allowed sources. */
function isAllowedImageSrc(src: string): boolean {
  return src.startsWith('data:image/') || /^https?:\/\//i.test(src);
}

/** Keep only well-formed page images from persisted or untrusted data. */
export function sanitizePageImages(input: unknown): PageImages {
  if (input === null || typeof input !== 'object') return {};

  const result: PageImages = {};
  for (const [key, value] of Object.entries(input)) {
    const page = Number.parseInt(key, 10);
    if (!Number.isInteger(page) || page < 1 || page > PAGES_PER_BOOKLET) {
      continue;
    }
    if (value === null || typeof value !== 'object') continue;

    const entry = value as Partial<PageImage>;
    const src =
      typeof entry.src === 'string' && isAllowedImageSrc(entry.src)
        ? entry.src
        : '';
    const width =
      typeof entry.width === 'number' &&
      Number.isFinite(entry.width) &&
      entry.width > 0
        ? entry.width
        : 0;
    const height =
      typeof entry.height === 'number' &&
      Number.isFinite(entry.height) &&
      entry.height > 0
        ? entry.height
        : 0;

    if (src && width && height) {
      result[page] = { src, width, height };
    }
  }

  return result;
}
