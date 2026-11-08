import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon, FoldIcon } from './icons';

export function FoldGuide({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      // Keep keyboard focus inside the dialog while it is open.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fold-guide-title"
        className="max-h-[92svh] w-full max-w-lg overflow-auto rounded-[10px] border border-line bg-paper-50 shadow-[0_24px_48px_-24px_rgb(0_0_0_/_0.4)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex items-start gap-2.5">
            <FoldIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-700" />
            <div>
              <h2
                id="fold-guide-title"
                className="font-display text-xl font-semibold leading-tight"
              >
                Cómo doblar tu PocketMod
              </h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar instrucciones"
            className="-mr-1.5 -mt-1 rounded-md p-1.5 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <FoldDiagram />

          <p className="rounded-lg border border-line bg-paper-100 px-3 py-2.5 text-[12px] leading-relaxed text-ink-600">
            La fila inferior de la hoja aparece girada 180°. Es correcto: al
            doblar, esas páginas quedarán hacia fuera.
          </p>

          <ol className="space-y-3.5">
            <Step number={1}>
              Imprime en una sola cara, horizontal y al 100 %. Desactiva
              “ajustar a la página”, los márgenes y los encabezados del
              navegador.
            </Step>
            <Step number={2}>
              Dobla la hoja por la mitad a lo largo, con la impresión hacia
              fuera.
            </Step>
            <Step number={3}>
              Vuelve a doblar en cuatro y corta una ranura por el pliegue
              central, entre las dos columnas del medio.
            </Step>
            <Step number={4}>
              Despliega y dobla en acordeón hasta formar el cuadernillo. La
              página 1 es la portada y la 8 la contraportada.
            </Step>
          </ol>

          <p className="rounded-lg border border-ink-900/20 bg-paper-50 px-3 py-2.5 text-[12px] leading-relaxed text-ink-600">
            <strong className="font-medium text-ink-900">
              ¿La impresora recorta los bordes?
            </strong>{' '}
            Activa «Guías de doblez», imprime con «ajustar a los márgenes de la
            impresora» y recorta la hoja siguiendo el marco exterior. Después
            dobla con normalidad.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-paper-50 transition-colors hover:bg-ink-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-paper-50 text-[11px] font-medium tabular-nums text-ink-600">
        {number}
      </span>
      <p className="pt-0.5 text-[12px] leading-relaxed text-ink-700">
        {children}
      </p>
    </li>
  );
}

function FoldDiagram() {
  return (
    <svg
      viewBox="0 0 380 220"
      className="w-full rounded-lg border border-line bg-white"
      role="img"
    >
      <title>Esquema de doblez del PocketMod</title>
      <rect
        x="30"
        y="34"
        width="320"
        height="145"
        fill="#ffffff"
        stroke="#0a0a0a"
        strokeWidth="1.4"
      />
      <line
        x1="30"
        y1="106.5"
        x2="350"
        y2="106.5"
        stroke="#b24a2e"
        strokeWidth="1.4"
        strokeDasharray="5 4"
      />
      <line
        x1="110"
        y1="34"
        x2="110"
        y2="179"
        stroke="#8f8f8f"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <line
        x1="190"
        y1="34"
        x2="190"
        y2="179"
        stroke="#8f8f8f"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <line
        x1="270"
        y1="34"
        x2="270"
        y2="179"
        stroke="#8f8f8f"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <line
        x1="120"
        y1="106.5"
        x2="260"
        y2="106.5"
        stroke="#b24a2e"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x="190"
        y="202"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10"
        letterSpacing="0.3"
        fill="#6b6b6b"
      >
        Corte en el pliegue central
      </text>
      <text
        x="190"
        y="24"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10"
        letterSpacing="0.3"
        fill="#6b6b6b"
      >
        Impresión hacia fuera
      </text>
      <path
        d="M344 118c12 0 18 7 18 17"
        fill="none"
        stroke="#b24a2e"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="m357 130 5 6 4-7"
        fill="none"
        stroke="#b24a2e"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
