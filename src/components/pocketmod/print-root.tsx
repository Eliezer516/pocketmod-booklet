import { PAPERS } from '../../lib/paper';
import type { PaginationResult } from '../../lib/pagination';
import type { Settings } from '../../lib/settings';
import { Sheet } from './sheet';

interface PrintRootProps {
  result: PaginationResult | null;
  settings: Settings;
}

export function PrintRoot({ result, settings }: PrintRootProps) {
  if (!result) return null;
  const paper = PAPERS[settings.paper];

  return (
    <div className="print-root" aria-hidden="true">
      {result.booklets.map((pages, index) => (
        <div
          key={index}
          className="print-sheet"
          style={{
            width: `${paper.widthMm}mm`,
            height: `${paper.heightMm}mm`,
          }}
        >
          <Sheet
            pages={pages}
            paper={paper}
            settings={settings}
            fontSizePt={result.usedFontSizePt}
            showGuides={settings.guides}
          />
        </div>
      ))}
    </div>
  );
}
