'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { PAGES_PER_BOOKLET } from '../../lib/imposition';
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
  const [result, setResult] = useState<PaginationResult | null>(null);
  const [mode, setMode] = useState<PreviewMode>('pages');
  const [activeBooklet, setActiveBooklet] = useState(0);
  const [foldGuideOpen, setFoldGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const paper = PAPERS[settings.paper];
  const words = useMemo(() => countWords(text), [text]);
  const hasText = text.trim().length > 0;
  const bookletCount = result?.booklets.length ?? MIN_BOOKLETS;

  // Restore the previous session. This happens after mount so the static HTML
  // and the first client render always match.
  useEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      setText(saved.text);
      setSettings(saved.settings);
    }
    setHydrated(true);
  }, []);

  // Repaginate once per idle change instead of on every keystroke.
  useEffect(() => {
    if (!hydrated) return;

    setBusy(true);
    const timer = window.setTimeout(() => {
      try {
        const next = paginateText(text, settings);
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
  }, [text, settings, hydrated, fontsReady]);

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
      saveState({ text, settings });
    }, 400);
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [text, settings, hydrated]);

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

  const handlePrint = useCallback(() => {
    if (!hasText) return;

    try {
      // Recalculate synchronously so a print started right after a change
      // never uses a stale imposition. flushSync commits the fresh sheet
      // before the browser opens its print dialog.
      const fresh = paginateText(text, settings);
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
  }, [hasText, settings, text]);

  return (
    <>
      <style>{`@page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }`}</style>

      <div className="screen-only min-h-svh bg-paper-100 text-ink-900">
        <header className="sticky top-0 z-30 border-b border-line bg-paper-50/95 backdrop-blur supports-[backdrop-filter]:bg-paper-50/80">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-paper-100 text-ink-900">
                <LogoIcon className="h-7 w-7" />
              </span>
              <div>
                <h1 className="font-display text-xl leading-none tracking-tight">
                  PocketMod
                </h1>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
                  Ocho páginas en una hoja
                </p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="mr-1 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500 md:flex">
                {hasText && result ? (
                  <>
                    <span>{result.totalTextPages} pág.</span>
                    <span className="h-3 w-px bg-line" />
                    <span>
                      {bookletCount}{' '}
                      {bookletCount === 1 ? 'cuadernillo' : 'cuadernillos'}
                    </span>
                  </>
                ) : (
                  <span>Sin texto</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFoldGuideOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-50 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-400 hover:bg-paper-100"
              >
                <FoldIcon className="h-4 w-4" />
                Cómo doblar
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!hasText}
                className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-3.5 py-2 text-xs font-semibold text-paper-50 shadow-sm transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PrinterIcon className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[minmax(340px,390px)_minmax(0,1fr)] lg:items-start lg:gap-5">
          <div className="space-y-4 lg:sticky lg:top-[76px]">
            <EditorPanel
              text={text}
              onChange={setText}
              words={words}
              characters={text.length}
              onSample={handleSample}
              onClear={handleClear}
            />

            <ControlsPanel
              settings={settings}
              onChange={updateSetting}
              usedFontSizePt={result?.usedFontSizePt ?? settings.fontSizePt}
              shrunk={result?.shrunk ?? false}
              bookletCount={bookletCount}
              onReset={handleResetSettings}
            />
          </div>

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
          />
        </main>

        <footer className="mx-auto max-w-[1500px] px-4 pb-6 pt-1 sm:px-6">
          <p className="border-t border-line pt-4 text-center text-[11px] leading-relaxed text-ink-500">
            Una hoja, {PAGES_PER_BOOKLET} páginas y un solo corte. Imprime al
            100 % en {paper.label} horizontal; el texto se guarda solo en este
            navegador.
          </p>
        </footer>
      </div>

      <PrintRoot result={result} settings={settings} />

      {foldGuideOpen ? (
        <FoldGuide onClose={() => setFoldGuideOpen(false)} />
      ) : null}
    </>
  );
}
