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
          <h2 className="font-display text-xl leading-tight">Tu texto</h2>
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

      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Texto del cuadernillo"
        placeholder={
          'Pega aquí todo el texto. Los párrafos separados por una línea en blanco se conservan.\n\nEjemplo:\nLISTA DE VIAJE\n- Pasaporte\n- Cargador\n- Novela para el tren'
        }
        spellCheck
        className="block min-h-[290px] w-full resize-y bg-transparent px-4 py-4 font-reading text-[14.5px] leading-[1.65] text-ink-900 outline-none placeholder:text-ink-500/80 lg:min-h-[330px]"
        style={{ fontFamily: 'var(--font-reading)' }}
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
