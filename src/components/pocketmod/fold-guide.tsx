import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon, FoldIcon } from './icons';

export function FoldGuide({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fold-guide-title"
        className="max-h-[92svh] w-full max-w-lg overflow-auto rounded-xl border border-line bg-paper-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600/10 text-accent-700">
              <FoldIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">Instrucciones</p>
              <h2 id="fold-guide-title" className="font-display text-2xl">
                Cómo doblar tu PocketMod
              </h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar instrucciones"
            className="rounded-md p-1.5 text-ink-500 transition hover:bg-paper-100 hover:text-ink-900"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <FoldDiagram />

          <p className="rounded-lg border border-line bg-paper-100 px-3 py-2.5 text-xs leading-relaxed text-ink-600">
            La fila inferior de la hoja aparece girada 180°. Es correcto: al
            doblar, esas páginas quedarán hacia fuera.
          </p>

          <ol className="space-y-4">
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

          <p className="rounded-lg border border-accent-600/25 bg-accent-600/5 px-3 py-2.5 text-xs leading-relaxed text-ink-700">
            <strong className="font-semibold text-ink-900">
              ¿La impresora recorta los bordes?
            </strong>{' '}
            Activa «Guías de doblez», imprime con «ajustar a los márgenes de la
            impresora» y recorta la hoja siguiendo el marco exterior. Después
            dobla con normalidad.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-paper-50 transition hover:bg-ink-800"
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent-600/30 bg-accent-600/10 font-mono text-[11px] font-semibold text-accent-700">
        {number}
      </span>
      <p className="pt-0.5 text-[13px] leading-relaxed text-ink-700">
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
        fill="#fffdf8"
        stroke="#211e18"
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
        stroke="#9a917f"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <line
        x1="190"
        y1="34"
        x2="190"
        y2="179"
        stroke="#9a917f"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <line
        x1="270"
        y1="34"
        x2="270"
        y2="179"
        stroke="#9a917f"
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
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="1.4"
        fill="#6d6558"
      >
        CORTE EN EL PLIEGUE CENTRAL
      </text>
      <text
        x="190"
        y="24"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="1.4"
        fill="#6d6558"
      >
        IMPRESIÓN HACIA FUERA
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
