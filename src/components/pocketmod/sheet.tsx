import { SHEET_SLOTS } from '../../lib/imposition';
import {
  type PaperSpec,
  panelHeightMm,
  panelWidthMm,
} from '../../lib/paper';
import type { PageData } from '../../lib/pagination';
import type { Settings } from '../../lib/settings';
import { PageCard } from './page-card';

interface SheetProps {
  pages: PageData[];
  paper: PaperSpec;
  settings: Settings;
  fontSizePt: number;
  showGuides?: boolean;
}

export function Sheet({
  pages,
  paper,
  settings,
  fontSizePt,
  showGuides = false,
}: SheetProps) {
  const panelW = panelWidthMm(paper);
  const panelH = panelHeightMm(paper);

  return (
    <div
      className="pocket-sheet"
      style={{
        position: 'relative',
        width: `${paper.widthMm}mm`,
        height: `${paper.heightMm}mm`,
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {SHEET_SLOTS.map((slot) => {
        const page = pages[slot.page - 1];
        if (!page) return null;
        return (
          <div
            key={slot.page}
            style={{
              position: 'absolute',
              left: `${slot.column * panelW}mm`,
              top: `${slot.row * panelH}mm`,
              width: `${panelW}mm`,
              height: `${panelH}mm`,
              transform: slot.rotated ? 'rotate(180deg)' : undefined,
            }}
          >
            <PageCard page={page} settings={settings} fontSizePt={fontSizePt} />
          </div>
        );
      })}

      {showGuides ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            color: '#b24a2e',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              borderTop: '0.25mm dashed currentColor',
              opacity: 0.65,
            }}
          />
          {[1, 2, 3].map((column) => (
            <div
              key={column}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${column * panelW}mm`,
                borderLeft: '0.25mm dashed currentColor',
                opacity: 0.4,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: `${panelW}mm`,
              width: `${panelW * 2}mm`,
              top: '50%',
              borderTop: '0.7mm solid currentColor',
              opacity: 0.85,
            }}
          />
          {/*
           * Outer trim frame. Some printers cannot print to the paper edge and
           * apply their own margins, so the sheet has to be scaled down with
           * "fit to printer margins". Cutting along this frame removes those
           * margins and leaves the full PocketMod sheet.
           *
           * 2px is 0.53 mm at print size. Chrome floors fractional border
           * widths to whole pixels, so a mm value would come out thinner.
           */}
          <div
            data-pocket-frame="trim"
            style={{
              position: 'absolute',
              inset: '0.4mm',
              border: '2px solid currentColor',
              opacity: 0.9,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
