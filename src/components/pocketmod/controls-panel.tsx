import {
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { loadImageFromUrl } from '../../lib/images';
import type { PageImage, PageImages } from '../../lib/page-images';
import { PAPERS, type PaperId } from '../../lib/paper';
import {
  DEFAULT_SETTINGS,
  FONT_LABELS,
  IMAGE_ALIGN_LABELS,
  MAX_FONT_PT,
  MIN_FONT_PT,
  type FontId,
  type ImageAlign,
  type Settings,
} from '../../lib/settings';
import { ChevronIcon } from './icons';

interface ControlsPanelProps {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  pageImages: PageImages;
  onPageImageChange: (page: number, image: PageImage | null) => void;
  usedFontSizePt: number;
  shrunk: boolean;
  bookletCount: number;
  onReset: () => void;
}

export function ControlsPanel({
  settings,
  onChange,
  pageImages,
  onPageImageChange,
  usedFontSizePt,
  shrunk,
  bookletCount,
  onReset,
}: ControlsPanelProps) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-5 sm:px-5">
        <h2 className="font-display text-[15px] font-semibold leading-tight">
          Formato
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900"
        >
          Restablecer
        </button>
      </div>

      <div className="space-y-5 px-4 pb-5 sm:px-5">
        <Field label="Papel">
          <Segmented<PaperId>
            value={settings.paper}
            onChange={(value) => onChange('paper', value)}
            options={[
              { value: 'letter', label: PAPERS.letter.label },
              { value: 'a4', label: PAPERS.a4.label },
            ]}
          />
        </Field>

        <Field label="Tipografía">
          <Segmented<FontId>
            value={settings.font}
            onChange={(value) => onChange('font', value)}
            options={[
              { value: 'serif', label: FONT_LABELS.serif },
              { value: 'sans', label: FONT_LABELS.sans },
              { value: 'mono', label: FONT_LABELS.mono },
            ]}
          />
        </Field>

        <Field label="Alineación de imágenes">
          <Segmented<ImageAlign>
            value={settings.imageAlign}
            onChange={(value) => onChange('imageAlign', value)}
            options={[
              { value: 'left', label: IMAGE_ALIGN_LABELS.left },
              { value: 'center', label: IMAGE_ALIGN_LABELS.center },
              { value: 'right', label: IMAGE_ALIGN_LABELS.right },
              { value: 'top', label: IMAGE_ALIGN_LABELS.top },
              { value: 'bottom', label: IMAGE_ALIGN_LABELS.bottom },
            ]}
          />
        </Field>

        <Field label="Imágenes por página">
          <PageImageUrl pageImages={pageImages} onChange={onPageImageChange} />
          <p className="text-[11px] leading-relaxed text-ink-500">
            Usa el botón + bajo cada página del cuadernillo para añadir o cambiar
            su imagen. Ocupa toda la página y la alineación decide cómo se encaja
            cuando su proporción no coincide con la de la hoja.
          </p>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Slider
            label="Tamaño base"
            value={settings.fontSizePt}
            min={MIN_FONT_PT}
            max={MAX_FONT_PT}
            step={0.5}
            suffix="pt"
            onChange={(value) => onChange('fontSizePt', value)}
          />
          <Slider
            label="Márgenes"
            value={settings.marginMm}
            min={3}
            max={10}
            step={0.5}
            suffix="mm"
            onChange={(value) => onChange('marginMm', value)}
          />
        </div>

        <Toggle
          label="Justificar texto"
          description="Alinea ambos lados de cada página."
          checked={settings.justify}
          onChange={(checked) => onChange('justify', checked)}
        />

        {shrunk ? (
          <p className="rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            Letra ajustada a {usedFontSizePt.toFixed(1)} pt{' '}
            {bookletCount > 1
              ? 'para reducir el número de páginas.'
              : 'para caber en las 8 páginas.'}
          </p>
        ) : null}

        <details className="group border-t border-line pt-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-medium text-ink-600 transition-colors hover:text-ink-900 marker:hidden">
            <ChevronIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
            Opciones avanzadas
          </summary>

          <div className="mt-4 space-y-5">
            <Slider
              label="Interlineado"
              value={settings.lineHeight}
              min={1.1}
              max={1.7}
              step={0.05}
              format={(value) => value.toFixed(2)}
              onChange={(value) => onChange('lineHeight', value)}
            />

            <Toggle
              label="Números de página"
              description="Un número discreto al pie de cada página."
              checked={settings.pageNumbers}
              onChange={(checked) => onChange('pageNumbers', checked)}
            />

            <Toggle
              label="Guías de doblez"
              description="Marco exterior de recorte, líneas de doblez y marca del corte."
              checked={settings.guides}
              onChange={(checked) => onChange('guides', checked)}
            />

            <p className="text-[11px] leading-relaxed text-ink-500">
              Valores predeterminados: {DEFAULT_SETTINGS.fontSizePt} pt,{' '}
              {DEFAULT_SETTINGS.marginMm} mm de margen, interlineado{' '}
              {DEFAULT_SETTINGS.lineHeight.toFixed(2)}.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}

const PAGE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function PageImageUrl({
  pageImages,
  onChange,
}: {
  pageImages: PageImages;
  onChange: (page: number, image: PageImage | null) => void;
}) {
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [urlPage, setUrlPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const toggleUrl = () => {
    if (urlOpen) {
      setUrlOpen(false);
      return;
    }
    const firstEmpty = PAGE_NUMBERS.find((page) => !pageImages[page]);
    setUrlPage(firstEmpty ?? 1);
    setUrlError(null);
    setUrlOpen(true);
  };

  const handleUrl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = url.trim();
    if (!value || busy) return;

    setBusy(true);
    setUrlError(null);
    try {
      const imported = await loadImageFromUrl(value);
      onChange(urlPage, imported);
      setUrl('');
      setUrlOpen(false);
    } catch (error) {
      setUrlError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la imagen desde esa URL.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={toggleUrl}
        aria-expanded={urlOpen}
        className="text-[11px] font-medium text-ink-600 underline decoration-line underline-offset-2 transition-colors hover:text-ink-900"
      >
        {urlOpen ? 'Cancelar' : 'Añadir desde una URL'}
      </button>

      {urlOpen ? (
        <form
          onSubmit={handleUrl}
          className="space-y-1.5 rounded-md border border-line bg-paper-50 p-2"
        >
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            aria-label="URL de la imagen"
            className="w-full rounded border border-line bg-white px-2 py-1.5 text-[11px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-400"
          />
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 text-[11px] text-ink-600">
              Página
              <select
                value={urlPage}
                onChange={(event) => setUrlPage(Number(event.target.value))}
                className="rounded border border-line bg-white px-1 py-1 text-[11px] text-ink-900 outline-none focus:border-ink-400"
              >
                {PAGE_NUMBERS.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="ml-auto rounded-md bg-ink-900 px-2.5 py-1.5 text-[11px] font-medium text-paper-50 transition-colors hover:bg-ink-700 disabled:opacity-60"
            >
              {busy ? 'Cargando…' : 'Añadir'}
            </button>
          </div>
          {urlError ? (
            <p role="alert" className="text-[11px] leading-relaxed text-red-700">
              {urlError}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="eyebrow">{label}</p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex flex-wrap rounded-lg border border-line bg-paper-100 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
              active
                ? 'bg-ink-900 text-paper-50'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = '',
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="eyebrow">
          {label}
        </label>
        <span className="text-[11px] tabular-nums text-ink-600">
          {format ? format(value) : value}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-input w-full"
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[12px] font-medium text-ink-800">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked
            ? 'border-ink-900 bg-ink-900'
            : 'border-line bg-paper-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
