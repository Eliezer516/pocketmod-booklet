'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { PAGES_PER_BOOKLET } from '../../lib/imposition';
import type { PageImage, PageImages } from '../../lib/page-images';
import { PAPERS } from '../../lib/paper';
import {
  countWords,
  paginateText,
  type PaginationResult,
} from '../../lib/pagination';
import { SAMPLE_TEXT } from '../../lib/sample';
import {
  DEFAULT_SETTINGS,
  type Settings,
} from '../../lib/settings';
import { loadSavedState, saveState } from '../../lib/storage';
import { ControlsPanel } from './controls-panel';
import { EditorPanel } from './editor-panel';
import { FoldGuide } from './fold-guide';
import { FoldIcon, LogoIcon, PrinterIcon } from './icons';
import { Preview, type PreviewMode } from './preview';
import { PrintRoot } from './print-root';

const PAGINATION_DELAY_MS = 220;
const MIN_BOOKLETS = 1;

export function App() {
  const [text, setText] = useState('');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [pageImages, setPageImages] = useState<PageImages>({});
  const [result, setResult] = useState<PaginationResult | null>(null);
  const [mode, setMode] = useState<PreviewMode>('pages');
  const [activeBooklet, setActiveBooklet] = useState(0);
  const [foldGuideOpen, setFoldGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const foldButtonRef = useRef<HTMLButtonElement>(null);

  const paper = PAPERS[settings.paper];
  const words = useMemo(() => countWords(text), [text]);
  const hasText = text.trim().length > 0;
  const hasImages = Object.keys(pageImages).length > 0;
  const canPrint = hasText || hasImages;
  const bookletCount = result?.booklets.length ?? MIN_BOOKLETS;

  // Restore the previous session. This happens after mount so the static HTML
  // and the first client render always match.
  useEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      setText(saved.text);
      setSettings(saved.settings);
      setPageImages(saved.pageImages);
    }
    setHydrated(true);
  }, []);

  // Repaginate once per idle change instead of on every keystroke.
  useEffect(() => {
    if (!hydrated) return;

    setBusy(true);
    const timer = window.setTimeout(() => {
      try {
        const next = paginateText(text, settings, pageImages);
        setResult(next);
        setError(null);
      } catch (cause) {
        console.error(cause);
        setError(
          'No se pudo repartir el texto. Prueba con un texto más corto o vuelve a cargar la página.',
        );
      } finally {
        setBusy(false);
      }
    }, PAGINATION_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [text, settings, pageImages, hydrated, fontsReady]);

  // System fonts are available immediately, but waiting for the font set
  // guarantees that a slow custom fallback never changes the line count.
  useEffect(() => {
    let active = true;
    const fonts = document.fonts;
    if (!fonts) {
      setFontsReady(true);
      return;
    }
    Promise.resolve(fonts.ready).then(() => {
      if (active) setFontsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist the session, including an empty text (explicit clear).
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveState({ text, settings, pageImages });
    }, 400);
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [text, settings, pageImages, hydrated]);

  // Keep the selected booklet in range after the text gets shorter.
  useEffect(() => {
    if (activeBooklet >= bookletCount) setActiveBooklet(0);
  }, [activeBooklet, bookletCount]);

  const updateSetting = useCallback(
    <K extends keyof Settings,>(key: K, value: Settings[K]) => {
      setSettings((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const handleSample = useCallback(() => {
    if (
      text.trim().length > 0 &&
      !window.confirm('¿Reemplazar el texto actual por el ejemplo?')
    ) {
      return;
    }
    setText(SAMPLE_TEXT);
  }, [text]);

  const handleClear = useCallback(() => {
    if (
      text.length > 200 &&
      !window.confirm('¿Borrar todo el texto del editor?')
    ) {
      return;
    }
    setText('');
  }, [text]);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const updatePageImage = useCallback(
    (page: number, image: PageImage | null) => {
      setPageImages((previous) => {
        const next: PageImages = { ...previous };
        if (image) next[page] = image;
        else delete next[page];
        return next;
      });
    },
    [],
  );

  const closeFoldGuide = useCallback(() => {
    setFoldGuideOpen(false);
    // Return focus to the control that opened the dialog.
    window.requestAnimationFrame(() => foldButtonRef.current?.focus());
  }, []);

  const handlePrint = useCallback(() => {
    if (!canPrint) return;

    try {
      // Recalculate synchronously so a print started right after a change
      // never uses a stale imposition. flushSync commits the fresh sheet
      // before the browser opens its print dialog.
      const fresh = paginateText(text, settings, pageImages);
      flushSync(() => {
        setResult(fresh);
        setError(null);
      });
    } catch (cause) {
      console.error(cause);
      setError('No se pudo preparar la impresión.');
      return;
    }

    window.print();
  }, [canPrint, pageImages, settings, text]);

  return (
    <>
      <style>{`@page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }`}</style>

      <div className="screen-only min-h-svh bg-paper-100 text-ink-900">
        <header className="sticky top-0 z-30 border-b border-line bg-paper-50">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <LogoIcon className="h-7 w-7 text-ink-900" />
              <div className="flex items-baseline gap-2.5">
                <h1 className="font-display text-[18px] font-semibold leading-none tracking-[-0.01em]">
                  PocketMod
                </h1>
                <p className="hidden text-[11px] leading-none text-ink-500 sm:block">
                  Ocho páginas en una hoja
                </p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <p className="mr-1 hidden items-center gap-2 text-[11px] text-ink-500 md:flex">
                {hasText && result ? (
                  <>
                    <span className="tabular-nums">
                      {result.totalTextPages}{' '}
                      {result.totalTextPages === 1
                        ? 'página con texto'
                        : 'páginas con texto'}
                    </span>
                    <span className="text-ink-400">·</span>
                    <span>
                      {bookletCount}{' '}
                      {bookletCount === 1 ? 'cuadernillo' : 'cuadernillos'}
                    </span>
                  </>
                ) : hasImages ? (
                  <span>Solo imágenes</span>
                ) : (
                  <span>Sin texto</span>
                )}
              </p>

              <button
                ref={foldButtonRef}
                type="button"
                onClick={() => setFoldGuideOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-paper-50 px-3 text-[12px] font-medium text-ink-700 transition-colors hover:border-ink-400 hover:text-ink-900"
              >
                <FoldIcon className="h-4 w-4" />
                Cómo doblar
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!canPrint}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink-900 px-3.5 text-[12px] font-medium text-paper-50 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-paper-200 disabled:text-ink-600 disabled:hover:bg-paper-200"
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:px-8 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[10px] border border-line bg-paper-50">
            <EditorPanel
              text={text}
              onChange={setText}
              words={words}
              characters={text.length}
              onSample={handleSample}
              onClear={handleClear}
              imageAlign={settings.imageAlign}
            />

            <ControlsPanel
              settings={settings}
              onChange={updateSetting}
              pageImages={pageImages}
              onPageImageChange={updatePageImage}
              usedFontSizePt={result?.usedFontSizePt ?? settings.fontSizePt}
              shrunk={result?.shrunk ?? false}
              bookletCount={bookletCount}
              onReset={handleResetSettings}
            />
          </aside>

          <Preview
            result={result}
            settings={settings}
            mode={mode}
            onModeChange={setMode}
            activeBooklet={activeBooklet}
            onBookletChange={setActiveBooklet}
            busy={busy}
            error={error}
            hasText={hasText}
            pageImages={pageImages}
            onPageImageChange={updatePageImage}
          />
        </main>

        <footer className="mx-auto max-w-[1500px] px-4 pb-8 pt-1 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-500 sm:flex-row sm:items-baseline sm:justify-between">
            <p>
              Una hoja, {PAGES_PER_BOOKLET} páginas y un solo corte. Imprime al
              100 % en {paper.label} horizontal.
            </p>
            <p className="text-ink-500">
              El texto se guarda solo en este navegador.
            </p>
          </div>
        </footer>
      </div>

      <PrintRoot
        result={result}
        settings={settings}
        pageImages={pageImages}
      />

      {foldGuideOpen ? <FoldGuide onClose={closeFoldGuide} /> : null}
    </>
  );
}
