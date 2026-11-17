import { pageMetrics, type PageImages } from '../../lib/page-images';
import type { PageData } from '../../lib/pagination';
import {
  FONT_STACKS,
  FOOTER_RESERVE_MM,
  type ImageAlign,
  type Settings,
} from '../../lib/settings';

interface PageCardProps {
  page: PageData;
  settings: Settings;
  fontSizePt: number;
  pageImages: PageImages;
}

/**
 * Where the page image sits inside the printable area. With `object-fit:
 * contain`, the image always keeps its proportions; these values choose which
 * edge of the page it hugs when the proportions do not match the page.
 */
const IMAGE_POSITION: Record<ImageAlign, string> = {
  left: '0% 50%',
  center: '50% 50%',
  right: '100% 50%',
  top: '50% 0%',
  bottom: '50% 100%',
};

export function PageCard({
  page,
  settings,
  fontSizePt,
  pageImages,
}: PageCardProps) {
  const metrics = pageMetrics(settings);
  const image = pageImages[page.pageNumber];
  const hasText = page.html.trim().length > 0;
  // With all eight pages taken by an image the text has nowhere else to go, so
  // it is drawn over the picture. A white wash behind the text keeps it legible
  // while the image still fills the page around it.
  const textOverImage = Boolean(image) && hasText;

  return (
    <div
      className="pocket-page"
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: `${settings.marginMm}mm`,
        background: '#ffffff',
        color: '#0a0a0a',
        fontFamily: FONT_STACKS[settings.font],
        fontSize: `${fontSizePt}pt`,
        lineHeight: settings.lineHeight,
        textAlign: settings.justify ? 'justify' : 'left',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        {image ? (
          <img
            src={image.src}
            alt=""
            data-page-image=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: IMAGE_POSITION[settings.imageAlign],
              display: 'block',
            }}
          />
        ) : null}

        <div
          className="pocket-markdown"
          data-image-align={settings.imageAlign}
          style={{
            position: 'relative',
            zIndex: 1,
            height: textOverImage ? 'auto' : '100%',
            maxHeight: '100%',
            minHeight: 0,
            overflow: 'hidden',
            background: textOverImage
              ? 'rgba(255, 255, 255, 0.88)'
              : undefined,
            ['--page-content-height' as string]: `${metrics.heightPx}px`,
          }}
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
      </div>

      {settings.pageNumbers ? (
        <div
          aria-hidden="true"
          style={{
            flex: '0 0 auto',
            height: `${FOOTER_RESERVE_MM}mm`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            fontFamily: FONT_STACKS.sans,
            fontSize: '6.5pt',
            lineHeight: 1,
            letterSpacing: '0.14em',
            color: '#767676',
          }}
        >
          {page.pageNumber}
        </div>
      ) : null}
    </div>
  );
}
