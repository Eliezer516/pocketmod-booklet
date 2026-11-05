import { MarkdownEditor } from './markdown-editor';
import { SparkIcon, TrashIcon } from './icons';

interface EditorPanelProps {
  text: string;
  onChange: (value: string) => void;
  words: number;
  characters: number;
  onSample: () => void;
  onClear: () => void;
}

export function EditorPanel({
  text,
  onChange,
  words,
  characters,
  onSample,
  onClear,
}: EditorPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-paper-50 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow">Entrada</p>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl leading-tight">Tu texto</h2>
            <span className="hidden rounded border border-line bg-paper-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-500 sm:inline">
              Markdown
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSample}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper-100 px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:border-ink-400 hover:bg-paper-200"
          >
            <SparkIcon className="h-3.5 w-3.5" />
            Ejemplo
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={text.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-semibold text-ink-500 transition hover:border-line hover:bg-paper-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      <MarkdownEditor
        value={text}
        onChange={onChange}
        className="h-[300px] w-full bg-paper-50 sm:h-[320px] lg:h-[340px]"
      />

      <div className="flex items-center gap-3 border-t border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
        <span className="whitespace-nowrap">
          {words.toLocaleString('es')} palabras
        </span>
        <span className="h-3 w-px shrink-0 bg-line" />
        <span className="whitespace-nowrap">
          {characters.toLocaleString('es')} caracteres
        </span>
        <span className="ml-auto hidden whitespace-nowrap text-ink-500 2xl:inline">
          Guardado local
        </span>
      </div>
    </section>
  );
}
