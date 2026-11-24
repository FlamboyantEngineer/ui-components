// Copying text to the system clipboard: the asynchronous Clipboard API first, then a selection copy
// for pages where that API is missing (insecure origins, older browsers) or refuses.

import { getDeepActiveElement, isFocused } from './composed-focus.js';
import { isHTMLElement } from './is-element.js';
import { getOwnerDocument } from './owner-window.js';

/** The parts of `navigator.clipboard` the copy helpers use. */
export interface ClipboardWriter {
  writeText?(text: string): Promise<void>;
  write?(items: never[]): Promise<void>;
}

export interface CopyOptions {
  /**
   * The element the copy comes from, such as the pressed button. Its window's clipboard and its
   * document take the copy, so a copy pressed in a popup window or frame writes there. Defaults to
   * the script's own window and document.
   */
  owner?: Node | null | undefined;
  /**
   * The clipboard to write to. Defaults to the owner window's `navigator.clipboard`; `null` skips the
   * asynchronous API.
   */
  clipboard?: ClipboardWriter | null | undefined;
  /**
   * Copy through a temporary selection and `document.execCommand('copy')` when the asynchronous API
   * is missing or refuses. Defaults to true.
   */
  fallback?: boolean | undefined;
  /**
   * Withdraws the copy: once aborted, a copy whose asynchronous write was missing or refused skips
   * the selection fallback and resolves false. A write the browser already took is not undone.
   */
  signal?: AbortSignal | undefined;
}

export interface RichCopyOptions extends CopyOptions {
  /** The `ClipboardItem` constructor. Defaults to the owner window's. */
  ClipboardItem?: (new (items: Record<string, Blob>) => unknown) | undefined;
  /** Copy the plain text when the rich write is refused, instead of reporting the refusal. */
  fallbackOnRichFailure?: boolean | undefined;
}

/** How a rich copy reached the clipboard: both formats, plain text only, or not at all. */
export type RichCopyResult = 'rich' | 'text' | 'failed';

/** The document a copy runs in: the owner's, else the script's, or none on the server. */
function getCopyDocument(owner: Node | null | undefined): Document | null {
  if (owner) return getOwnerDocument(owner);
  return typeof document === 'undefined' ? null : document;
}

/** The window a copy runs in, as `getCopyDocument` picks its document. */
function getCopyWindow(owner: Node | null | undefined): (Window & typeof globalThis) | null {
  return getCopyDocument(owner)?.defaultView ?? null;
}

function getDefaultClipboard(options: CopyOptions): ClipboardWriter | null {
  if (options.clipboard !== undefined) return options.clipboard;
  return getCopyWindow(options.owner)?.navigator.clipboard ?? null;
}

async function writeText(clipboard: ClipboardWriter | null, text: string): Promise<boolean> {
  if (typeof clipboard?.writeText !== 'function') return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies by selecting an off-screen buffer and running the copy command. A copy listener supplies
 * the exact formats, so whitespace and HTML survive. Focus and the previous selection are restored.
 */
function copyWithSelection(
  formats: Record<string, string>,
  owner: Node | null | undefined,
): boolean {
  const document = getCopyDocument(owner);
  if (!document || typeof document.execCommand !== 'function') return false;
  const body = document.body;
  if (!body) return false;
  const selection = document.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
    : [];
  const focused = getDeepActiveElement(document);

  const buffer = document.createElement('pre');
  buffer.textContent = formats['text/plain'] ?? '';
  buffer.setAttribute('aria-hidden', 'true');
  buffer.style.position = 'fixed';
  buffer.style.top = '0';
  buffer.style.left = '-10000px';
  buffer.style.userSelect = 'text';
  buffer.style.pointerEvents = 'none';

  const onCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    for (const [type, value] of Object.entries(formats)) event.clipboardData.setData(type, value);
    event.preventDefault();
  };

  document.addEventListener('copy', onCopy, true);
  body.append(buffer);
  try {
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(buffer);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.removeEventListener('copy', onCopy, true);
    buffer.remove();
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
    }
    if (isHTMLElement(focused) && !isFocused(focused)) {
      focused.focus({ preventScroll: true });
    }
  }
}

/** Whether a copy may still try the selection fallback: it is on and the copy is not withdrawn. */
function mayFallBack(options: CopyOptions): boolean {
  return options.fallback !== false && !options.signal?.aborted;
}

/**
 * Copies plain text, exactly as given. Resolves true once the clipboard holds it and false when
 * there is nothing to copy or every way was refused.
 */
export async function copyText(text: string, options: CopyOptions = {}): Promise<boolean> {
  if (!text) return false;
  if (await writeText(getDefaultClipboard(options), text)) return true;
  return mayFallBack(options) && copyWithSelection({ 'text/plain': text }, options.owner);
}

/**
 * Copies text with an HTML version, so rich editors paste the HTML and plain fields the text.
 * Without `ClipboardItem` support it copies the plain text; a refused rich write is reported as
 * `failed` unless `fallbackOnRichFailure` is set.
 */
export async function copyRichText(
  content: { text: string; html: string },
  options: RichCopyOptions = {},
): Promise<RichCopyResult> {
  const { text, html } = content;
  if (!text && !html) return 'failed';
  const clipboard = getDefaultClipboard(options);
  const Item =
    options.ClipboardItem ??
    (getCopyWindow(options.owner)?.ClipboardItem as unknown as RichCopyOptions['ClipboardItem']);

  if (typeof clipboard?.write === 'function' && Item) {
    try {
      const item = new Item({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      });
      await clipboard.write([item as never]);
      return 'rich';
    } catch {
      if (!options.fallbackOnRichFailure) return 'failed';
    }
  }
  if (text && (await writeText(clipboard, text))) return 'text';
  if (!mayFallBack(options)) return 'failed';
  const formats = { 'text/plain': text, 'text/html': html };
  return copyWithSelection(formats, options.owner) ? 'rich' : 'failed';
}

export interface ImageCopyOptions extends CopyOptions {
  /** The `ClipboardItem` constructor. Defaults to the owner window's. */
  ClipboardItem?: (new (items: Record<string, Blob | Promise<Blob>>) => unknown) | undefined;
  /**
   * The size to show the image at, in CSS pixels. With it, an HTML `<img>` of that size holding the
   * image goes with it, so editors that paste HTML show a high-density image at its size.
   */
  size?: { width: number; height: number } | undefined;
  /** The HTML image's text alternative. */
  alt?: string | undefined;
}

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('The image could not be read.'));
    reader.readAsDataURL(blob);
  });
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The image as an HTML `<img>` shown at `size`. */
async function imageHtml(image: Promise<Blob>, size: { width: number; height: number }, alt = '') {
  const source = await readDataUrl(await image);
  const html = `<img src="${source}" width="${String(Math.round(size.width))}" height="${String(Math.round(size.height))}" alt="${escapeAttribute(alt)}">`;
  return new Blob([html], { type: 'text/html' });
}

/**
 * Copies an image, such as a PNG. The image may still be on its way: the clipboard item is built
 * at once around the promise, so a browser that only takes writes started in the user's press
 * (Safari) still takes it. With `size`, an HTML `<img>` of the image at that size goes with it.
 * Resolves false when there is no asynchronous Clipboard API or
 * `ClipboardItem`, the image fails, or the write is refused; the selection fallback cannot copy
 * images.
 */
export async function copyImage(
  image: Blob | Promise<Blob>,
  options: ImageCopyOptions = {},
): Promise<boolean> {
  const clipboard = getDefaultClipboard(options);
  const Item =
    options.ClipboardItem ??
    (getCopyWindow(options.owner)?.ClipboardItem as unknown as ImageCopyOptions['ClipboardItem']);
  const blob = Promise.resolve(image);
  // A refused image still settles here, so it never surfaces as an unhandled rejection.
  blob.catch(() => undefined);
  if (typeof clipboard?.write !== 'function' || !Item || options.signal?.aborted) return false;
  try {
    const type = image instanceof Blob && image.type ? image.type : 'image/png';
    const formats: Record<string, Promise<Blob>> = { [type]: blob };
    if (options.size) formats['text/html'] = imageHtml(blob, options.size, options.alt);
    await clipboard.write([new Item(formats) as never]);
    return true;
  } catch {
    return false;
  }
}
