import {
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { PageImage, PageImages } from "../../lib/page-images";
import {
  PAPERS,
  mmToPx,
  panelHeightMm,
  panelWidthMm,
  type PaperSpec,
} from "../../lib/paper";
import type { PageData, PaginationResult } from "../../lib/pagination";
import type { Settings } from "../../lib/settings";
import { PageCard } from "./page-card";
import { PageImageDialog } from "./page-image-dialog";
import { Sheet } from "./sheet";
import { useElementWidth } from "./use-element-width";

export type PreviewMode = "pages" | "sheet";

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
  pageImages: PageImages;
  onPageImageChange: (page: number, image: PageImage | null) => void;
}

const blankPage = (pageNumber: number): PageData => ({
  html: "",
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
  pageImages,
  onPageImageChange,
}: PreviewProps) {
  const paper = PAPERS[settings.paper];
  const pages =
    result?.booklets[activeBooklet] ??
    Array.from({ length: 8 }, (_, index) => blankPage(index + 1));
  const fontSizePt = result?.usedFontSizePt ?? settings.fontSizePt;
  const bookletCount = result?.booklets.length ?? 1;
  const hasImages = Object.keys(pageImages).length > 0;

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-[10px] border border-line bg-paper-50 sm:min-h-[640px]">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="inline-flex rounded-lg border border-line bg-paper-100 p-1">
          <ModeButton
            active={mode === "pages"}
            onClick={() => onModeChange("pages")}
          >
            Cuadernillo
          </ModeButton>
          <ModeButton
            active={mode === "sheet"}
            onClick={() => onModeChange("sheet")}
          >
            Hoja de impresión
          </ModeButton>
        </div>

        {bookletCount > 1 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-500">Cuadernillo</span>
            {Array.from({ length: bookletCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={index === activeBooklet}
                onClick={() => onBookletChange(index)}
                className={`h-7 min-w-7 rounded-md border px-1.5 text-[11px] font-medium tabular-nums transition-colors ${
                  index === activeBooklet
                    ? "border-ink-900 bg-ink-900 text-paper-50"
                    : "border-line bg-paper-50 text-ink-600 hover:border-ink-400 hover:text-ink-900"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={`ml-auto items-center gap-2 text-[11px] text-ink-500 ${
            busy ? "flex" : "hidden sm:flex"
          }`}
        >
          {busy ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400" />
              Calculando
            </>
          ) : (
            <>
              <span>{paper.shortLabel} horizontal</span>
              <span className="text-ink-400">·</span>
              <span className="tabular-nums">{fontSizePt.toFixed(1)} pt</span>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-[12px] text-red-800">
          {error}
        </div>
      ) : null}

      {!error && result?.shrunk ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] leading-relaxed text-amber-900">
          El texto no cabía a {settings.fontSizePt.toFixed(1)} pt. Se ajustó
          automáticamente a {result.usedFontSizePt.toFixed(1)} pt para{" "}
          {bookletCount > 1
            ? "reducir el número de páginas."
            : "aprovechar las 8 páginas."}
        </div>
      ) : null}

      {!error && bookletCount > 1 ? (
        <div className="border-b border-line bg-paper-100 px-4 py-2.5 text-[12px] leading-relaxed text-ink-600">
          El texto ocupa{" "}
          <strong className="font-medium text-ink-900">
            {bookletCount} cuadernillos
          </strong>
          . Al imprimir saldrán todas las hojas en orden.
        </div>
      ) : null}

      <div className="flex-1 overflow-auto bg-paper-100 p-4 lg:p-6">
        {!hasText && !hasImages ? (
          <p className="mb-4 rounded-lg border border-dashed border-line bg-paper-50 px-4 py-3 text-[12px] text-ink-600">
            Escribe o pega tu texto en el editor. El cuadernillo se actualiza
            solo, página a página.
          </p>
        ) : null}

        {mode === "pages" ? (
          <PagesView
            paper={paper}
            pages={pages}
            settings={settings}
            fontSizePt={fontSizePt}
            pageImages={pageImages}
            onPageImageChange={onPageImageChange}
          />
        ) : (
          <SheetView
            paper={paper}
            pages={pages}
            settings={settings}
            fontSizePt={fontSizePt}
            pageImages={pageImages}
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
      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active ? "bg-ink-900 text-paper-50" : "text-ink-600 hover:text-ink-900"
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
  pageImages,
  onPageImageChange,
}: {
  paper: PaperSpec;
  pages: PageData[];
  settings: Settings;
  fontSizePt: number;
  pageImages: PageImages;
  onPageImageChange: (page: number, image: PageImage | null) => void;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const pageWidthPx = mmToPx(panelWidthMm(paper));
  const pageHeightPx = mmToPx(panelHeightMm(paper));
  const columns = width >= 880 ? 4 : width >= 440 ? 2 : 1;
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
                  transformOrigin: "top left",
                }}
              >
                <PageCard
                  page={page}
                  settings={settings}
                  fontSizePt={fontSizePt}
                  pageImages={pageImages}
                />
              </div>
            </div>

            <PageImageSlot
              page={index + 1}
              image={pageImages[index + 1]}
              onChange={onPageImageChange}
            />

            <figcaption className="mt-2 flex items-center gap-2">
              <span className="text-[11px] tabular-nums text-ink-500">
                Página {index + 1}
              </span>
              <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-paper-200">
                <span
                  className="block h-full rounded-full bg-ink-900/60 transition-[width] duration-300"
                  style={{ width: `${Math.round(page.fill * 100)}%` }}
                />
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-500">
        La página 1 es la portada y la 8 la contraportada. Las líneas se cortan
        en límites de palabra para que nada se parta al doblar.
      </p>
    </div>
  );
}

/**
 * Add-image control under a page preview. Empty pages show a "+" bar; pages
 * with an image let the user replace it or remove it.
 */
function PageImageSlot({
  page,
  image,
  onChange,
}: {
  page: number;
  image: PageImage | undefined;
  onChange: (page: number, image: PageImage | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = () => {
    setOpen(false);
    // Give focus back to the bar that opened the dialog.
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const save = (next: PageImage) => {
    onChange(page, next);
    close();
  };

  return (
    <>
      <div className="mt-2.5 flex items-stretch overflow-hidden rounded-md border border-line bg-paper-50">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={
            image
              ? `Cambiar imagen de la página ${page}`
              : `Añadir imagen a la página ${page}`
          }
          className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2 py-1.5 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900"
        >
          {image ? (
            <>
              <img
                src={image.src}
                alt=""
                className="h-5 w-8 shrink-0 rounded-[2px] object-contain"
              />
              <span className="text-[11px] font-medium">Cambiar</span>
            </>
          ) : (
            <span
              aria-hidden="true"
              className="text-[16px] font-light leading-none"
            >
              +
            </span>
          )}
        </button>

        {image ? (
          <button
            type="button"
            onClick={() => onChange(page, null)}
            aria-label={`Quitar imagen de la página ${page}`}
            className="flex items-center border-l border-line px-2.5 text-[14px] leading-none text-ink-500 transition-colors hover:bg-paper-100 hover:text-red-700"
          >
            ×
          </button>
        ) : null}
      </div>

      {open ? (
        <PageImageDialog page={page} onSave={save} onClose={close} />
      ) : null}
    </>
  );
}

function SheetView({
  paper,
  pages,
  settings,
  fontSizePt,
  pageImages,
}: {
  paper: PaperSpec;
  pages: PageData[];
  settings: Settings;
  fontSizePt: number;
  pageImages: PageImages;
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
            pageImages={pageImages}
            showGuides={settings.guides}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-500">
        Esta es la hoja que se imprime: una cara, {paper.label} horizontal y
        escala 100 %. La fila inferior se ve girada a propósito.
      </p>
      {settings.guides ? (
        <p className="mx-auto mt-2 max-w-xl text-center text-[11px] leading-relaxed text-ink-600">
          <strong className="font-medium text-ink-900">
            Marco exterior activo.
          </strong>{" "}
          Si tu impresora no imprime hasta el borde, activa «ajustar a los
          márgenes de la impresora» y recorta siguiendo la línea exterior antes
          de doblar.
        </p>
      ) : null}
    </div>
  );
}
