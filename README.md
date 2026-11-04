# PocketMod

Convierte un texto largo en un cuadernillo PocketMod de 8 páginas en una sola
hoja de papel. Pega el texto, revisa la vista previa e imprime.

Hecho con [Waku](https://waku.gg) (React 19), Tailwind CSS 4 y TypeScript.
Todo ocurre en el navegador: no hay backend ni cuentas.

## Uso

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # sitio estático en dist/public
```

## Cómo funciona

- El texto se mide en un contenedor oculto y se corta por líneas completas.
- Si no cabe a la letra elegida, se reduce hasta 6 pt.
- Si aun así no cabe en 8 páginas, se generan varios cuadernillos y se imprimen
  todas las hojas en orden.
- La hoja se impone con el reparto verificado de `pocketmod.sty`: la fila
  superior lleva las páginas 2-5 y la inferior las páginas 1, 8, 7 y 6 giradas
  180°.
- Las preferencias y el texto se guardan en `localStorage`.

## Al imprimir

- Una sola cara, horizontal, escala 100 %.
- Desactiva «ajustar a la página», los márgenes y los encabezados del navegador.
- La fila inferior girada es correcta: quedará hacia fuera al doblar.
- La opción **Guías de doblez** (en Opciones avanzadas) añade las líneas de
  doblez y la marca del corte para una hoja de prueba.

## Estructura

```
src/pages/                 página estática y layout
src/components/pocketmod/  editor, controles, vista previa, hoja y guía
src/lib/                   papel, ajustes, imposición, paginación y almacenamiento
```
