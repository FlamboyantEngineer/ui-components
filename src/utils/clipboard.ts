// Copying text to the system clipboard: the asynchronous Clipboard API first, then a selection copy
// for pages where that API is missing (insecure origins, older browsers) or refuses.

/** The parts of `navigator.clipboard` the copy helpers use. */
export interface ClipboardWriter {
  writeText?(text: string): Promise<void>;
  write?(items: never[]): Promise<void>;
}

export interface CopyOptions {
  /** The clipboard to write to. Defaults to `navigator.clipboard`; `null` skips the asynchronous API. */
  clipboard?: ClipboardWriter | null | undefined;
  /**
   * Copy through a temporary selection and `document.execCommand('copy')` when the asynchronous API
   * is missing or refuses. Defaults to true.
   */
  fallback?: boolean | undefined;
}

export interface RichCopyOptions extends CopyOptions {
  /** The `ClipboardItem` constructor. Defaults to the global one. */
  ClipboardItem?: (new (items: Record<string, Blob>) => unknown) | undefined;
  /** Copy the plain text when the rich write is refused, instead of reporting the refusal. */
  fallbackOnRichFailure?: boolean | undefined;
}

/** How a rich copy reached the clipboard: both formats, plain text only, or not at all. */
export type RichCopyResult = 'rich' | 'text' | 'failed';

function getDefaultClipboard(options: CopyOptions): ClipboardWriter | null {
  if (options.clipboard !== undefined) return options.clipboard;
  return typeof navigator === 'undefined' ? null : (navigator.clipboard ?? null);
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
function copyWithSelection(formats: Record<string, string>): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
  const body = document.body;
  if (!body) return false;
  const selection = document.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
    : [];
  const focused = document.activeElement;

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
    if (focused instanceof HTMLElement && document.activeElement !== focused) {
      focused.focus({ preventScroll: true });
    }
  }
}

/**
 * Copies plain text, exactly as given. Resolves true once the clipboard holds it and false when
 * there is nothing to copy or every way was refused.
 */
export async function copyText(text: string, options: CopyOptions = {}): Promise<boolean> {
  if (!text) return false;
  if (await writeText(getDefaultClipboard(options), text)) return true;
  return options.fallback === false ? false : copyWithSelection({ 'text/plain': text });
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
    (typeof ClipboardItem === 'undefined'
      ? undefined
      : (ClipboardItem as unknown as RichCopyOptions['ClipboardItem']));

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
  if (options.fallback === false) return 'failed';
  return copyWithSelection({ 'text/plain': text, 'text/html': html }) ? 'rich' : 'failed';
}
