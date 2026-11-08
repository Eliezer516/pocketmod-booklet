import '../styles.css';

import type { ReactNode } from 'react';

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-svh bg-paper-100 text-ink-900 antialiased print:bg-white">
      <meta
        name="description"
        content="Convierte un texto largo en un cuadernillo PocketMod de ocho páginas en una sola hoja. Listo para imprimir en casa."
      />
      <meta name="theme-color" content="#f6f6f6" />
      <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
      <link
        rel="icon"
        href="/images/favicon.png"
        sizes="32x32"
        type="image/png"
      />
      <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
      {children}
    </div>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
