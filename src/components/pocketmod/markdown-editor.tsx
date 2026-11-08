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

const PLACEHOLDER = 'Escribe o pega tu texto en Markdown…';

const READING_FONT =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

/**
 * Neutral palette for the editor chrome. The document text keeps the serif
 * reading face, while links and the caret carry the product's one accent.
 * OverType turns these keys into the CSS custom properties its injected
 * stylesheet consumes.
 */
const THEME: Theme = {
  name: 'pocket',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#ffffff',
    text: '#0a0a0a',
    textPrimary: '#0a0a0a',
    textSecondary: '#4f4f4f',
    placeholder: '#6b6b6b',
    strong: '#0a0a0a',
    em: '#333333',
    h1: '#0a0a0a',
    h2: '#0a0a0a',
    h3: '#1a1a1a',
    link: '#8d3822',
    code: '#333333',
    codeBg: '#f2f2f2',
    blockquote: '#4f4f4f',
    hr: '#d9d9d9',
    listMarker: '#6b6b6b',
    syntaxMarker: 'rgba(0, 0, 0, 0.4)',
    cursor: '#b24a2e',
    selection: 'rgba(178, 74, 46, 0.16)',
    border: '#e0e0e0',
    primary: '#0a0a0a',
    toolbarBg: '#f6f6f6',
    toolbarBorder: '#e0e0e0',
    toolbarIcon: '#4f4f4f',
    toolbarHover: '#ececec',
    toolbarActive: '#e0e0e0',
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
        className={`${className ?? ''} resize-y bg-paper-50 px-4 py-4 text-[14.5px] leading-[1.65] text-ink-900 outline-none placeholder:text-ink-500`}
        style={{ fontFamily: 'var(--font-reading)' }}
      />
    );
  }

  return <div ref={hostRef} className={className} />;
}
