import {
  FOOTER_RESERVE_MM,
  FONT_STACKS,
  type Settings,
} from '../../lib/settings';
import type { PageData } from '../../lib/pagination';

interface PageCardProps {
  page: PageData;
  settings: Settings;
  fontSizePt: number;
}

/**
 * Renders the page text one logical line at a time so that a wrapped heading
 * (usually all caps) is never stretched by justification. Every non-empty line
 * stays a single block, and blank lines become spacers of exactly one line
 * height. The total height therefore matches the measurement made by the
 * paginator.
 */
function renderBlocks(text: string, justify: boolean, lineHeight: number) {
  return text.split('\n').map((line, index) => {
    if (line.trim().length === 0) {
      return (
        <div
          key={`s-${index}`}
          aria-hidden="true"
          style={{ height: `${lineHeight}em` }}
        />
      );
    }

    const letters = line.replace(/[^\p{L}]/gu, '');
    const allCaps = letters.length > 0 && letters === letters.toUpperCase();

    return (
      <div
        key={`l-${index}`}
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          textAlign: justify && !allCaps ? 'justify' : 'left',
        }}
      >
        {line}
      </div>
    );
  });
}

export function PageCard({ page, settings, fontSizePt }: PageCardProps) {
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
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
        }}
      >
        {renderBlocks(page.text, settings.justify, settings.lineHeight)}
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
            color: '#8a8172',
          }}
        >
          {page.pageNumber}
        </div>
      ) : null}
    </div>
  );
}
