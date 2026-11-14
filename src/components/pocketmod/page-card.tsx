import {
  PAGE_IMAGE_GAP_PX,
  pageImageBox,
  pageMetrics,
  type PageImage,
  type PageImages,
} from '../../lib/page-images';
import type { PageData } from '../../lib/pagination';
import {
  FONT_STACKS,
  FOOTER_RESERVE_MM,
  type Settings,
} from '../../lib/settings';

interface PageCardProps {
  page: PageData;
  settings: Settings;
  fontSizePt: number;
  pageImages: PageImages;
}

export function PageCard({
  page,
  settings,
  fontSizePt,
  pageImages,
}: PageCardProps) {
  const metrics = pageMetrics(settings);
  const image = pageImages[page.pageNumber];
  const box = image ? pageImageBox(image, metrics) : null;
  const imageSpacePx = box ? box.height + PAGE_IMAGE_GAP_PX : 0;
  const markdownHeightPx = Math.max(24, metrics.heightPx - imageSpacePx);
  // "Abajo" anchors the image below the text; every other option puts it above.
  const imageAtBottom = settings.imageAlign === 'bottom';
  const imageAlignment =
    settings.imageAlign === 'left'
      ? 'left'
      : settings.imageAlign === 'right'
        ? 'right'
        : 'center';

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
      {image && box && !imageAtBottom ? (
        <PageImageBlock
          image={image}
          box={box}
          align={imageAlignment}
          atBottom={false}
        />
      ) : null}

      <div
        className="pocket-markdown"
        data-image-align={settings.imageAlign}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          ['--page-content-height' as string]: `${markdownHeightPx}px`,
        }}
        dangerouslySetInnerHTML={{ __html: page.html }}
      />

      {image && box && imageAtBottom ? (
        <PageImageBlock
          image={image}
          box={box}
          align={imageAlignment}
          atBottom
        />
      ) : null}

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

function PageImageBlock({
  image,
  box,
  align,
  atBottom,
}: {
  image: PageImage;
  box: { width: number; height: number };
  align: 'left' | 'center' | 'right';
  atBottom: boolean;
}) {
  return (
    <div
      style={{
        flex: '0 0 auto',
        marginTop: atBottom ? `${PAGE_IMAGE_GAP_PX}px` : 0,
        marginBottom: atBottom ? 0 : `${PAGE_IMAGE_GAP_PX}px`,
      }}
    >
      <img
        src={image.src}
        alt=""
        data-page-image=""
        style={{
          display: 'block',
          width: box.width,
          height: box.height,
          marginLeft: align === 'left' ? 0 : 'auto',
          marginRight: align === 'right' ? 0 : 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
