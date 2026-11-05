import { useId, type ReactNode } from 'react';
import { PAPERS, type PaperId } from '../../lib/paper';
import {
  DEFAULT_SETTINGS,
  FONT_LABELS,
  MAX_FONT_PT,
  MIN_FONT_PT,
  type FontId,
  type Settings,
} from '../../lib/settings';
import { ChevronIcon } from './icons';

interface ControlsPanelProps {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  usedFontSizePt: number;
  shrunk: boolean;
  bookletCount: number;
  onReset: () => void;
}

export function ControlsPanel({
  settings,
  onChange,
  usedFontSizePt,
  shrunk,
  bookletCount,
  onReset,
}: ControlsPanelProps) {
  return (
    <section className="rounded-xl border border-line bg-paper-50 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow">Ajustes</p>
          <h2 className="font-display text-xl leading-tight">Formato</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-ink-500 transition hover:bg-paper-100 hover:text-ink-900"
        >
          Restablecer
        </button>
      </div>

      <div className="space-y-5 px-4 py-4">
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
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            Letra ajustada a {usedFontSizePt.toFixed(1)} pt{' '}
            {bookletCount > 1
              ? 'para reducir el número de páginas.'
              : 'para caber en las 8 páginas.'}
          </p>
        ) : null}

        <details className="group border-t border-line pt-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-semibold text-ink-700 marker:hidden">
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
    <div className="flex rounded-lg border border-line bg-paper-100 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
              active
                ? 'bg-ink-900 text-paper-50 shadow-sm'
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
        <span className="font-mono text-[10px] text-ink-700">
          {format ? format(value) : value}
          {suffix}
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
        <p className="text-[12px] font-semibold text-ink-800">{label}</p>
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
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition ${
          checked
            ? 'border-accent-600 bg-accent-600'
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
