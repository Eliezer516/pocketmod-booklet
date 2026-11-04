import { App } from '../components/pocketmod/app';

export default async function HomePage() {
  return (
    <>
      <title>PocketMod — Ocho páginas en una hoja</title>
      <App />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
