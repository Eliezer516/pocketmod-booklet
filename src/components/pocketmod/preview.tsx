import type { CSSProperties, ReactNode } from 'react';
import {
  PAPERS,
  mmToPx,
  panelHeightMm,
  panelWidthMm,
  type PaperSpec,
} from '../../lib/paper';
import type { PageData, PaginationResult } from '../../lib/pagination';
import type { Settings } from '../../lib/settings';
import { PageCard } from './page-card';
import { Sheet } from './sheet';
import { useElementWidth } from './use-element-width';

export type PreviewMode = 'pages' | 'sheet';

interface PreviewProps {
  result: PaginationResult | null;
  settings: Settings;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  activeBooklet: number;
  onBookletChange: (index: number) => void;
  busy: boolean;
  error: string | null;
  hasText: boolean;
}

const blankPage = (pageNumber: number): PageData => ({
  html: '',
  pageNumber,
  fill: 0,
  empty: true,
});

export function Preview({
  result,
  settings,
  mode,
  onModeChange,
  activeBooklet,
  onBookletChange,
  busy,
  error,
  hasText,
}: PreviewProps) {
  const paper = PAPERS[settings.paper];
  const pages =
    result?.booklets[activeBooklet] ??
    Array.from({ length: 8 }, (_, index) => blankPage(index + 1));
  const fontSizePt = result?.usedFontSizePt ?? settings.fontSizePt;
  const bookletCount = result?.booklets.length ?? 1;

  return (
    <section className="flex min-h-[640px] flex-col overflow-hidden rounded-xl border border-line bg-paper-50 shadow-[0_18px_45px_-30px_rgba(31,28,22,0.45)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="inline-flex rounded-lg border border-line bg-paper-100 p-1">
          <ModeButton
            active={mode === 'pages'}
            onClick={() => onModeChange('pages')}
          >
            Cuadernillo
          </ModeButton>
          <ModeButton
            active={mode === 'sheet'}
            onClick={() => onModeChange('sheet')}
          >
            Hoja de impresión
          </ModeButton>
        </div>

        {bookletCount > 1 ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
              Cuadernillo
            </span>
            {Array.from({ length: bookletCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={index === activeBooklet}
                onClick={() => onBookletChange(index)}
                className={`h-7 min-w-7 rounded-md border px-1.5 font-mono text-[11px] transition ${
                  index === activeBooklet
                    ? 'border-ink-900 bg-ink-900 text-paper-50'
                    : 'border-line bg-paper-50 text-ink-600 hover:border-ink-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
          {busy ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-600" />
              Calculando
            </>
          ) : (
            <>
              <span>{paper.shortLabel} horizontal</span>
              <span className="h-3 w-px bg-line" />
              <span>{fontSizePt.toFixed(1)} pt</span>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!error && result?.shrunk ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-relaxed text-amber-900">
          El texto no cabía a {settings.fontSizePt.toFixed(1)} pt. Se ajustó
          automáticamente a {result.usedFontSizePt.toFixed(1)} pt para{' '}
          {bookletCount > 1
            ? 'reducir el número de páginas.'
            : 'aprovechar las 8 páginas.'}
        </div>
      ) : null}

      {!error && bookletCount > 1 ? (
        <div className="border-b border-line bg-paper-100 px-4 py-2.5 text-xs leading-relaxed text-ink-600">
          El texto ocupa{' '}
          <strong className="font-semibold text-ink-900">
            {bookletCount} cuadernillos
          </strong>
          . Al imprimir saldrán todas las hojas en orden.
        </div>
      ) : null}

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {!hasText ? (
          <p className="mb-4 rounded-lg border border-dashed border-line bg-paper-100/60 px-4 py-3 text-sm text-ink-600">
            Escribe o pega tu texto en el editor. El cuadernillo se actualiza
            solo, página a página.
          </p>
        ) : null}

        {mode === 'pages' ? (
          <PagesView
            paper={paper}
            pages={pages}
            settings={settings}
            fontSizePt={fontSizePt}
          />
        ) : (
          <SheetView
            paper={paper}
            pages={pages}
            settings={settings}
            fontSizePt={fontSizePt}
          />
        )}
      </div>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-ink-900 text-paper-50 shadow-sm'
          : 'text-ink-600 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}

function PagesView({
  paper,
  pages,
  settings,
  fontSizePt,
}: {
  paper: PaperSpec;
  pages: PageData[];
  settings: Settings;
  fontSizePt: number;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const pageWidthPx = mmToPx(panelWidthMm(paper));
  const pageHeightPx = mmToPx(panelHeightMm(paper));
  const columns = width >= 880 ? 4 : width >= 620 ? 3 : 2;
  const gap = width >= 620 ? 20 : 12;
  const available = Math.max(0, width - gap * (columns - 1));
  const scale = width
    ? Math.max(0.18, Math.min(1.1, available / columns / pageWidthPx))
    : 0.45;
  const cardWidth = pageWidthPx * scale;
  const cardHeight = pageHeightPx * scale;

  return (
    <div ref={ref} className="w-full">
      <div
        className="grid justify-center"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)`,
          columnGap: gap,
          rowGap: 22,
        }}
      >
        {pages.map((page, index) => (
          <figure key={index} className="m-0 min-w-0">
            <div
              className="paper-shadow overflow-hidden bg-white"
              style={{ width: cardWidth, height: cardHeight }}
            >
              <div
                style={{
                  width: `${panelWidthMm(paper)}mm`,
                  height: `${panelHeightMm(paper)}mm`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <PageCard
                  page={page}
                  settings={settings}
                  fontSizePt={fontSizePt}
                />
              </div>
            </div>
            <figcaption className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
                Página {index + 1}
              </span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-paper-200">
                <span
                  className="block h-full rounded-full bg-accent-600/70 transition-[width] duration-300"
                  style={{ width: `${Math.round(page.fill * 100)}%` }}
                />
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-500">
        La página 1 es la portada y la 8 la contraportada. Las líneas se cortan
        en límites de palabra para que nada se parta al doblar.
      </p>
    </div>
  );
}

function SheetView({
  paper,
  pages,
  settings,
  fontSizePt,
}: {
  paper: PaperSpec;
  pages: PageData[];
  settings: Settings;
  fontSizePt: number;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const sheetWidthPx = mmToPx(paper.widthMm);
  const sheetHeightPx = mmToPx(paper.heightMm);
  const scale = width ? Math.min(1, width / sheetWidthPx) : 0.45;

  const style: CSSProperties = {
    width: sheetWidthPx * scale,
    height: sheetHeightPx * scale,
  };

  return (
    <div ref={ref} className="w-full">
      <div className="mx-auto" style={style}>
        <div
          className="paper-shadow origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          <Sheet
            pages={pages}
            paper={paper}
            settings={settings}
            fontSizePt={fontSizePt}
            showGuides={settings.guides}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-relaxed text-ink-500">
        Esta es la hoja que se imprime: una cara, {paper.label} horizontal y
        escala 100 %. La fila inferior se ve girada a propósito.
      </p>
    </div>
  );
}
