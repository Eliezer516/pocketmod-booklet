import type { ImageAlign } from '../../lib/settings';
import { MarkdownEditor } from './markdown-editor';
import { SparkIcon, TrashIcon } from './icons';

interface EditorPanelProps {
  text: string;
  onChange: (value: string) => void;
  words: number;
  characters: number;
  onSample: () => void;
  onClear: () => void;
  imageAlign: ImageAlign;
}

export function EditorPanel({
  text,
  onChange,
  words,
  characters,
  onSample,
  onClear,
  imageAlign,
}: EditorPanelProps) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[15px] font-semibold leading-tight">
            Tu texto
          </h2>
          <span className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] font-medium leading-none text-ink-500 sm:inline">
            Markdown
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSample}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-paper-50 px-2.5 text-[11px] font-medium text-ink-700 transition-colors hover:bg-paper-100 hover:text-ink-900"
          >
            <SparkIcon className="h-3.5 w-3.5" />
            Ejemplo
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={text.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-ink-500 transition-colors hover:bg-paper-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      <MarkdownEditor
        value={text}
        onChange={onChange}
        imageAlign={imageAlign}
        className="h-[320px] w-full bg-paper-50 sm:h-[340px] lg:h-[380px]"
      />

      <div className="flex items-center gap-2 border-t border-line px-4 py-2 text-[11px] text-ink-500">
        <span className="whitespace-nowrap tabular-nums">
          {words.toLocaleString('es')} palabras
        </span>
        <span aria-hidden="true" className="text-ink-400">
          ·
        </span>
        <span className="whitespace-nowrap tabular-nums">
          {characters.toLocaleString('es')} caracteres
        </span>
        <span className="ml-auto hidden whitespace-nowrap text-ink-500 2xl:inline">
          Guardado local
        </span>
      </div>
    </section>
  );
}
