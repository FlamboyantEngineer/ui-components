// Reads an uploaded or pasted file as an image signature: checks its type and size, reads it as a
// `data:` URL and decodes it for its natural size (specs/SIGNATURE-PAD.md, UIC-SIGNATURE-PAD-4).

import { getOwnerDocument } from '../../utils/owner-window.js';
import type { ImageSignature } from './signature-path.js';

/** The image types a signature pad takes: raster images every browser decodes. */
export const signatureImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

/** Why a file is not taken as a signature image. */
export type SignatureImageProblem = 'type' | 'size' | 'unreadable';

export type SignatureImageResult = { image: ImageSignature } | { problem: SignatureImageProblem };

function readDataUrl(file: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** The natural size of the image at `src`, decoded in `owner`'s document, or `null` if it fails. */
function measureImage(src: string, owner: Node): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = getOwnerDocument(owner).createElement('img');
    image.onload = () =>
      resolve(
        image.naturalWidth > 0 && image.naturalHeight > 0
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : null,
      );
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/**
 * The image signature a file gives, or why it gives none: a type the pad does not take, a size
 * over `maxSize` bytes, or contents the browser cannot read or decode.
 */
export async function readSignatureImage(
  file: Blob,
  { maxSize, owner }: { maxSize: number; owner: Node },
): Promise<SignatureImageResult> {
  if (!(signatureImageTypes as readonly string[]).includes(file.type)) return { problem: 'type' };
  if (file.size > maxSize) return { problem: 'size' };
  const src = await readDataUrl(file);
  const size = src ? await measureImage(src, owner) : null;
  if (!src || !size) return { problem: 'unreadable' };
  return { image: { kind: 'image', src, type: file.type, ...size } };
}

/** The first image among pasted or dropped files, or `null` when none is an image. */
export function findImageFile(files: Iterable<File>): File | null {
  for (const file of files) if (file.type.startsWith('image/')) return file;
  return null;
}

/**
 * The first image the system clipboard holds, read through the asynchronous Clipboard API, or
 * `null` when it holds none, the API is missing or the reader refused access.
 */
export async function readClipboardImage(owner: Node | null): Promise<Blob | null> {
  const clipboard = getOwnerDocument(owner).defaultView?.navigator.clipboard;
  if (!clipboard || typeof clipboard.read !== 'function') return null;
  try {
    for (const item of await clipboard.read()) {
      const type = item.types.find((entry) => entry.startsWith('image/'));
      if (type) return await item.getType(type);
    }
  } catch {
    return null;
  }
  return null;
}
