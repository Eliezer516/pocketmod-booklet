import { PAGES_PER_BOOKLET } from './imposition';
import { PAPERS, mmToPx, panelHeightMm, panelWidthMm } from './paper';
import { FOOTER_RESERVE_MM, type Settings } from './settings';

export interface PageImage {
  /** Embedded data URL, or an http(s) URL when the image was imported by URL. */
  src: string;
  /** Intrinsic size after compression, used for layout and pagination. */
  width: number;
  height: number;
  /** Optional size factor (25-100%) applied on top of the fitted box. */
  scale?: number;
}

/** Images attached to page numbers, 1-8. */
export type PageImages = Partial<Record<number, PageImage>>;

/** The image never takes more than this share of the printable text area. */
export const PAGE_IMAGE_MAX_HEIGHT_RATIO = 0.42;

/** Bounds for the user-controlled size of each page image. */
export const PAGE_IMAGE_MIN_SCALE = 0.25;
export const PAGE_IMAGE_MAX_SCALE = 1;

/** Reads the stored size factor, defaulting to 100% when it is missing. */
export function pageImageScale(image: PageImage): number {
  const scale = image.scale;
  if (typeof scale !== 'number' || !Number.isFinite(scale)) return 1;
  return Math.min(PAGE_IMAGE_MAX_SCALE, Math.max(PAGE_IMAGE_MIN_SCALE, scale));
}

/** Separation between the page image and the text. */
export const PAGE_IMAGE_GAP_PX = 5;

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

/**
 * Fits the image inside the page without upscaling it. The returned size is
 * rounded so rendering and pagination always agree on the reserved height.
 */
export function pageImageBox(
  image: PageImage,
  metrics: PageMetrics,
): { width: number; height: number } {
  const ratio =
    image.width > 0 && image.height > 0 ? image.height / image.width : 1;
  const maxHeight = metrics.heightPx * PAGE_IMAGE_MAX_HEIGHT_RATIO;

  let width = Math.min(image.width, metrics.widthPx);
  let height = width * ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = ratio > 0 ? height / ratio : metrics.widthPx;
  }

  const scale = pageImageScale(image);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Space to remove from the text area of each page, in page-number order.
 * Every booklet repeats the same pages, so the paginator indexes this list by
 * page number.
 */
export function pageImageReserves(
  settings: Settings,
  pageImages: PageImages,
): number[] {
  const metrics = pageMetrics(settings);
  return Array.from({ length: PAGES_PER_BOOKLET }, (_, index) => {
    const image = pageImages[index + 1];
    if (!image) return 0;
    return pageImageBox(image, metrics).height + PAGE_IMAGE_GAP_PX;
  });
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
      const image: PageImage = { src, width, height };
      const rawScale = entry.scale;
      if (typeof rawScale === 'number' && Number.isFinite(rawScale)) {
        image.scale = Math.min(
          PAGE_IMAGE_MAX_SCALE,
          Math.max(PAGE_IMAGE_MIN_SCALE, rawScale),
        );
      }
      result[page] = image;
    }
  }

  return result;
}
