import {
  FOOTER_RESERVE_MM,
  FONT_STACKS,
  type Settings,
} from '../../lib/settings';
import { PAPERS, mmToPx, panelHeightMm } from '../../lib/paper';
import type { PageData } from '../../lib/pagination';

interface PageCardProps {
  page: PageData;
  settings: Settings;
  fontSizePt: number;
}

export function PageCard({ page, settings, fontSizePt }: PageCardProps) {
  const footerReserve = settings.pageNumbers ? FOOTER_RESERVE_MM : 0;
  const contentHeightPx = mmToPx(
    panelHeightMm(PAPERS[settings.paper]) -
      settings.marginMm * 2 -
      footerReserve,
  );

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
        color: '#17150f',
        fontFamily: FONT_STACKS[settings.font],
        fontSize: `${fontSizePt}pt`,
        lineHeight: settings.lineHeight,
        textAlign: settings.justify ? 'justify' : 'left',
        overflow: 'hidden',
      }}
    >
      <div
        className="pocket-markdown"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          ['--page-content-height' as string]: `${contentHeightPx}px`,
        }}
        dangerouslySetInnerHTML={{ __html: page.html }}
      />

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
            color: '#8a8172',
          }}
        >
          {page.pageNumber}
        </div>
      ) : null}
    </div>
  );
}
