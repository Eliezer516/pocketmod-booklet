'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  OverType as OverTypeInstance,
  Theme,
  ToolbarButton,
} from 'overtype';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PLACEHOLDER =
  '# Título del cuadernillo\n\nPega aquí tu texto en **Markdown**: títulos, listas, negritas, enlaces...';

const READING_FONT =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

/**
 * Palette that matches the paper UI. OverType turns these keys into the CSS
 * custom properties its injected stylesheet consumes.
 */
const THEME: Theme = {
  name: 'pocket',
  colors: {
    bgPrimary: '#fdfbf6',
    bgSecondary: '#fdfbf6',
    text: '#1f1c16',
    textPrimary: '#1f1c16',
    textSecondary: '#5d5446',
    placeholder: '#9b9180',
    strong: '#1f1c16',
    em: '#433c30',
    h1: '#1f1c16',
    h2: '#2f2a21',
    h3: '#433c30',
    link: '#8d3822',
    code: '#8d3822',
    codeBg: '#f2ecdf',
    blockquote: '#5d5446',
    hr: '#d8cfbe',
    listMarker: '#786e5d',
    syntaxMarker: 'rgba(93, 84, 70, 0.5)',
    cursor: '#b24a2e',
    selection: 'rgba(178, 74, 46, 0.16)',
    border: '#d8cfbe',
    primary: '#b24a2e',
    toolbarBg: '#f5f0e6',
    toolbarBorder: '#d8cfbe',
    toolbarIcon: '#5d5446',
    toolbarHover: '#e9e1d2',
    toolbarActive: '#e9e1d2',
  },
};

function buildToolbar(
  buttons: typeof import('overtype')['toolbarButtons'],
): ToolbarButton[] {
  return [
    { ...buttons.bold, title: 'Negrita (Ctrl+B)' },
    { ...buttons.italic, title: 'Cursiva (Ctrl+I)' },
    { ...buttons.code, title: 'Código en línea (Ctrl+E)' },
    { ...buttons.link, title: 'Insertar enlace (Ctrl+K)' },
    buttons.separator,
    { ...buttons.h1, title: 'Título 1 (Ctrl+Alt+1)' },
    { ...buttons.h2, title: 'Título 2 (Ctrl+Alt+2)' },
    buttons.separator,
    { ...buttons.bulletList, title: 'Lista con viñetas (Ctrl+Shift+8)' },
    { ...buttons.orderedList, title: 'Lista numerada (Ctrl+Shift+7)' },
    { ...buttons.quote, title: 'Cita (Ctrl+Shift+.)' },
  ];
}

export function MarkdownEditor({
  value,
  onChange,
  className,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<OverTypeInstance | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const [failed, setFailed] = useState(false);

  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let instance: OverTypeInstance | null = null;
    // OverType calls onChange once at the end of init. The app already owns
    // that value, and the callback can arrive before the saved session has
    // been restored, so it must not be forwarded.
    let acceptChanges = false;

    // OverType touches the DOM on import, so it is loaded only in the browser
    // and after mount. This also keeps it out of the initial bundle.
    void import('overtype')
      .then(({ default: OverType, toolbarButtons }) => {
        if (cancelled || !hostRef.current) return;

        const [created] = OverType.init(hostRef.current, {
          value: valueRef.current,
          theme: THEME,
          fontFamily: READING_FONT,
          fontSize: '14.5px',
          lineHeight: 1.65,
          padding: '16px',
          placeholder: PLACEHOLDER,
          spellcheck: true,
          toolbar: true,
          toolbarButtons: buildToolbar(toolbarButtons),
          mobile: {
            fontSize: '16px',
            lineHeight: 1.6,
            padding: '14px',
          },
          textareaProps: { 'aria-label': 'Texto del cuadernillo' },
          onChange: (next) => {
            if (!acceptChanges) return;
            onChangeRef.current(next);
          },
        });

        instance = created ?? null;
        editorRef.current = instance;
        acceptChanges = !cancelled;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('No se pudo cargar el editor Markdown', error);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      acceptChanges = false;
      instance?.destroy();
      if (editorRef.current === instance) editorRef.current = null;
    };
  }, []);

  // Keep the editor in sync when the text comes from outside (ejemplo, limpiar
  // o la copia guardada). The value check avoids resetting the caret on typing.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) editor.setValue(value);
  }, [value]);

  if (failed) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Texto del cuadernillo"
        placeholder={PLACEHOLDER}
        spellCheck
        className={`${className ?? ''} resize-y bg-paper-50 px-4 py-4 text-[14.5px] leading-[1.65] text-ink-900 outline-none placeholder:text-ink-500/80`}
        style={{ fontFamily: 'var(--font-reading)' }}
      />
    );
  }

  return <div ref={hostRef} className={className} />;
}
