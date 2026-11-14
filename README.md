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

## Formato del texto

El editor acepta **Markdown**. Se renderiza tal cual en la vista previa y en la
hoja impresa:

~~~~markdown
# Título
## Sección

Párrafo con **negritas**, *cursivas*, `código` y un [enlace](https://ejemplo.com).

- Lista con viñetas
- Segunda tarea

1. Lista numerada
2. Segundo paso

> Cita o recordatorio

| Hora  | Tarea        |
| ----- | ------------ |
| 09:00 | Revisar notas |

```text
bloque de código
```
~~~~

Los encabezados, listas, tablas, citas, código y reglas horizontales se
reparten entre páginas sin romper palabras ni filas a la mitad. Si una tabla no
cabe completa, continúa en la página siguiente y repite su encabezado.

### Editor

El panel de entrada usa [OverType](https://overtype.dev), un editor Markdown
ligero que deja visible la sintaxis mientras aplica el formato. La barra
superior formatea la selección y los atajos funcionan igual que en cualquier
editor de Markdown:

- `Ctrl/Cmd + B` negrita, `Ctrl/Cmd + I` cursiva.
- `Ctrl/Cmd + K` enlace, `Ctrl/Cmd + E` código en línea.
- `Ctrl/Cmd + Alt + 1` / `2` títulos.
- `Ctrl/Cmd + Shift + 8` lista con viñetas, `Ctrl/Cmd + Shift + 7` numerada.
- `Ctrl/Cmd + Shift + .` cita.

Las marcas (`**`, `#`, `>`…) se ven mientras escribes; la vista previa y la
hoja impresa muestran siempre el resultado ya renderizado.

### Imágenes

Hay dos formas de añadir imágenes:

- **Dentro del texto**: el botón de imagen de la barra del editor abre el
  selector de archivos; también puedes pegar (`Ctrl/Cmd + V`) o arrastrar una
  imagen al texto. Se inserta en el Markdown como `![nombre](data:image/…)`:

  ~~~markdown
  ![Playa al atardecer](data:image/jpeg;base64,…)
  ~~~

- **Una imagen por página**: en **Formato › Imágenes por página** hay ocho
  ranuras, una por cada página del cuadernillo. Cada ranura acepta un archivo o
  una URL. Al asignar una imagen, el paginador reserva su espacio y reparte el
  texto en el área que queda libre.

Bajo la rejilla, **Añadir desde una URL** permite pegar la dirección de una
imagen y elegir la página. Si el servidor permite leerla entre dominios, se
descarga y se guarda incrustada como las subidas; si no, se guarda la dirección
y la imagen se carga desde la red. En el texto también puedes insertar una
imagen remota escribiendo `![pie de foto](https://…)`.

En **Formato › Alineación de imágenes** eliges izquierda, centro o derecha, o
arriba y abajo. En las imágenes de página, arriba/abajo anclan la imagen al
borde superior o inferior del área imprimible; las demás opciones la colocan
arriba con el alineado horizontal elegido.

Cada imagen de página tiene además su propio **tamaño** (25–100 %), con un
deslizador que aparece bajo la rejilla cuando hay imágenes. Al reducirlo, la
imagen ocupa menos y el paginador devuelve ese espacio al texto.

Antes de insertarlas, las imágenes rasterizadas se reducen a 600 px de lado
mayor y se guardan como JPEG, para que el documento quepa en `localStorage`.
Los SVG se conservan vectoriales. Las imágenes subidas, o descargadas desde una
URL accesible, viajan dentro del propio documento, así que no hace falta
conexión al imprimir; las que solo se guardaron como URL necesitan que esa
dirección siga disponible. Si hay varios cuadernillos, cada uno repite las
imágenes de sus páginas 1 a 8.

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
  doblez, la marca del corte y un marco exterior de recorte.
- Si tu impresora recorta los bordes o aplica márgenes que no puedes quitar,
  imprime con la opción «ajustar a los márgenes de la impresora» y recorta la
  hoja siguiendo el marco exterior. Así recuperas el tamaño completo antes de
  doblar.

## Estructura

```
src/pages/                 página estática y layout
src/components/pocketmod/  editor OverType, controles, vista previa, hoja y guía
src/lib/                   papel, ajustes, imposición, paginación y almacenamiento
```
