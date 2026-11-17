'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  encodeImageFile,
  IMAGE_MIME_TYPES,
  loadImageFromUrl,
} from '../../lib/images';
import type { PageImage } from '../../lib/page-images';
import { CloseIcon, LinkIcon, UploadIcon } from './icons';

interface PageImageDialogProps {
  page: number;
  onSave: (image: PageImage) => void;
  onClose: () => void;
}

/**
 * Lets the user pick where the page image comes from: a local file or a URL.
 * Both options stay visible and the URL field opens under its option.
 */
export function PageImageDialog({
  page,
  onSave,
  onClose,
}: PageImageDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const fileOptionRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock the page behind the dialog and start on the file option.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fileOptionRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!busy) onClose();
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
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // Reset the input so choosing the same file again fires a change event.
    event.currentTarget.value = '';
    if (!file || busy) return;

    setBusy(true);
    setError(null);
    try {
      onSave(await encodeImageFile(file));
    } catch (cause) {
      console.error('Error al procesar la imagen', cause);
      setError(
        'No se pudo cargar la imagen. Comprueba que el archivo sea una imagen válida.',
      );
      setBusy(false);
    }
  };

  const handleUrl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = url.trim();
    if (!value || busy) return;

    setBusy(true);
    setError(null);
    try {
      onSave(await loadImageFromUrl(value));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo cargar la imagen desde esa URL.',
      );
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-image-title"
        aria-busy={busy}
        className="w-full max-w-sm overflow-hidden rounded-[10px] border border-line bg-paper-50 shadow-[0_24px_48px_-24px_rgb(0_0_0_/_0.4)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2
              id="page-image-title"
              className="font-display text-lg font-semibold leading-tight"
            >
              Imagen de la página {page}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              Ocupa toda el área imprimible de la página.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="-mr-1.5 -mt-1 rounded-md p-1.5 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900 disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 px-5 py-5">
          <button
            ref={fileOptionRef}
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="flex w-full items-center gap-3 rounded-lg border border-line bg-paper-50 px-3 py-2.5 text-left transition-colors hover:border-ink-400 hover:bg-paper-100 disabled:opacity-60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-paper-100 text-ink-700">
              <UploadIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-ink-900">
                Subir un archivo
              </span>
              <span className="block text-[11px] leading-snug text-ink-500">
                PNG, JPG, GIF, WebP o SVG
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUrlOpen((open) => !open)}
            aria-expanded={urlOpen}
            aria-controls="page-image-url"
            disabled={busy}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
              urlOpen
                ? 'border-ink-400 bg-paper-100'
                : 'border-line bg-paper-50 hover:border-ink-400 hover:bg-paper-100'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-paper-100 text-ink-700">
              <LinkIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-ink-900">
                Usar una URL
              </span>
              <span className="block text-[11px] leading-snug text-ink-500">
                https://ejemplo.com/imagen.jpg
              </span>
            </span>
          </button>

          {urlOpen ? (
            <form
              id="page-image-url"
              onSubmit={handleUrl}
              className="space-y-2 rounded-lg border border-line bg-paper-100 p-3"
            >
              <input
                autoFocus
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={busy}
                placeholder="https://ejemplo.com/imagen.jpg"
                aria-label="URL de la imagen"
                className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-400 disabled:opacity-60"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-ink-500">
                  Se guarda con el documento.
                </span>
                <button
                  type="submit"
                  disabled={busy}
                  className="shrink-0 rounded-md bg-ink-900 px-3 py-1.5 text-[11px] font-medium text-paper-50 transition-colors hover:bg-ink-700 disabled:opacity-60"
                >
                  {busy ? 'Cargando…' : 'Añadir'}
                </button>
              </div>
            </form>
          ) : null}

          {busy && !urlOpen ? (
            <p className="text-[11px] text-ink-500" role="status">
              Procesando la imagen…
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-[11px] leading-relaxed text-red-700">
              {error}
            </p>
          ) : null}

          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_MIME_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              void handleFile(event);
            }}
          />
        </div>
      </div>
    </div>
  );
}
