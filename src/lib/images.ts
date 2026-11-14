export interface EncodedImage {
  src: string;
  width: number;
  height: number;
}

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
];

const MAX_IMAGE_PX = 600;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return loadImage(url).finally(() => URL.revokeObjectURL(url));
}

function resizeDimensions(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const ratio = Math.min(max / width, max / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Turns an uploaded image into a data URL stored inside the document.
 *
 * Raster images are reduced to 600 px on the longest side and encoded as JPEG.
 * PocketMod pages are small, so that is already more than enough for print
 * quality, and it keeps localStorage healthy. SVGs stay vector.
 */
export async function encodeImageFile(file: File): Promise<EncodedImage> {
  if (file.type === 'image/svg+xml') {
    const src = await readFileAsDataUrl(file);
    const img = await loadImage(src);
    return {
      src,
      width: img.naturalWidth || MAX_IMAGE_PX,
      height: img.naturalHeight || MAX_IMAGE_PX,
    };
  }

  const img = await loadImageFile(file);
  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error('La imagen no tiene dimensiones válidas');
  }

  const { width, height } = resizeDimensions(
    img.naturalWidth,
    img.naturalHeight,
    MAX_IMAGE_PX,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas');

  // JPEG has no alpha channel; fill a white background so transparent images
  // still look right when printed.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return {
    src: canvas.toDataURL('image/jpeg', 0.85),
    width,
    height,
  };
}

function parseImageUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim(), window.location.href);
  } catch {
    throw new Error('La dirección no es una URL válida.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('La URL debe empezar por http:// o https://.');
  }
  if (window.location.protocol === 'https:' && url.protocol === 'http:') {
    throw new Error('En una página segura, la imagen debe usar https://.');
  }

  return url;
}

/**
 * Imports an image from an http(s) URL.
 *
 * When the server allows cross-origin reads, the image is downloaded and
 * embedded just like an uploaded file. Otherwise the URL itself is stored: the
 * browser can still show and print it, but the document then depends on that
 * URL staying reachable.
 */
export async function loadImageFromUrl(input: string): Promise<EncodedImage> {
  const url = parseImageUrl(input);

  try {
    const response = await fetch(url.href, {
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok) {
      throw new Error(`El servidor respondió ${response.status}`);
    }

    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
      throw new Error('La URL no apunta a una imagen');
    }

    const file = new File([blob], 'imagen', { type: blob.type });
    return await encodeImageFile(file);
  } catch {
    // Many sites block cross-origin fetches. Fall back to the remote URL so
    // the browser can display it directly.
    try {
      const img = await loadImage(url.href);
      if (!img.naturalWidth || !img.naturalHeight) {
        throw new Error('La imagen no tiene dimensiones válidas');
      }
      return {
        src: url.href,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    } catch {
      throw new Error(
        'No se pudo cargar la imagen. Revisa la URL o descarga el archivo y súbelo.',
      );
    }
  }
}
