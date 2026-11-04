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
      <meta name="theme-color" content="#f5f0e6" />
      <link rel="icon" type="image/png" href="/images/favicon.png" />
      {children}
    </div>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
