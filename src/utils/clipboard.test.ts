import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../core/index.js';
import { type ClipboardWriter, copyImage, copyRichText, copyText } from './clipboard.js';

interface CopyCapture {
  data: Record<string, string>;
  selected: string;
  bufferHidden: boolean;
}

/**
 * Installs a copy command like a browser's: it reports the current selection and dispatches a
 * `copy` event whose clipboard data the listeners fill.
 */
function installCopyCommand(result = true): CopyCapture {
  const capture: CopyCapture = { data: {}, selected: '', bufferHidden: false };
  const execCommand = vi.fn((command: string) => {
    if (command !== 'copy') return false;
    const selection = document.getSelection();
    capture.selected = selection?.toString() ?? '';
    const node = selection?.anchorNode;
    const buffer = node instanceof Element ? node : node?.parentElement;
    capture.bufferHidden = buffer?.getAttribute('aria-hidden') === 'true';
    const event = new Event('copy', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: { setData: (type: string, value: string) => (capture.data[type] = value) },
    });
    (document.activeElement ?? document.body).dispatchEvent(event);
    return result;
  });
  Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
  return capture;
}

afterEach(() => {
  Reflect.deleteProperty(document, 'execCommand');
  document.body.replaceChildren();
});

function writer(log: string[], fail = false): ClipboardWriter {
  return {
    async writeText(text) {
      if (fail) throw new Error('denied');
      log.push(text);
    },
  };
}

describe('copyText', () => {
  it('UIC-CLIPBOARD-1.1 resolves only after the clipboard holds the exact text', async () => {
    const log: string[] = [];
    const prompt = '  first line\n\nsecond\tline  ';
    await expect(copyText(prompt, { clipboard: writer(log) })).resolves.toBe(true);
    expect(log).toEqual([prompt]);
    await expect(copyText('', { clipboard: writer(log) })).resolves.toBe(false);
    expect(log).toHaveLength(1);
  });

  it('UIC-CLIPBOARD-1.1 uses navigator.clipboard by default', async () => {
    const log: string[] = [];
    vi.stubGlobal('navigator', { clipboard: writer(log) });
    await expect(copyText('Report.pdf')).resolves.toBe(true);
    expect(log).toEqual(['Report.pdf']);
    vi.unstubAllGlobals();
  });

  it('UIC-CLIPBOARD-1.2 falls back to a hidden selection copy and restores focus and selection', async () => {
    const capture = installCopyCommand();
    const field = document.createElement('input');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Selected before';
    document.body.append(field, paragraph);
    field.focus();
    const before = document.createRange();
    before.selectNodeContents(paragraph);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(before);

    const text = 'Line one\n\tLine two ';
    await expect(copyText(text, { clipboard: writer([], true) })).resolves.toBe(true);
    expect(capture.data).toEqual({ 'text/plain': text });
    expect(capture.selected).toBe(text);
    expect(capture.bufferHidden).toBe(true);
    expect(document.body.children).toHaveLength(2);
    expect(field).toHaveFocus();
    const restored = document.getSelection();
    expect(restored?.rangeCount).toBe(1);
    expect(restored?.getRangeAt(0).startContainer).toBe(paragraph);
    expect(restored?.getRangeAt(0).toString()).toBe('Selected before');

    await expect(copyText('Oslo', { clipboard: null })).resolves.toBe(true);
    expect(capture.data['text/plain']).toBe('Oslo');
  });

  it('UIC-CLIPBOARD-1.2 reports refusal when the fallback is off or the command fails', async () => {
    await expect(copyText('Oslo', { clipboard: null })).resolves.toBe(false);
    installCopyCommand(false);
    await expect(copyText('Oslo', { clipboard: null })).resolves.toBe(false);
    const capture = installCopyCommand(true);
    await expect(copyText('Oslo', { clipboard: null, fallback: false })).resolves.toBe(false);
    expect(capture.data).toEqual({});
  });
});

describe('copy signal', () => {
  it('UIC-CLIPBOARD-1.4 skips the selection fallback of a withdrawn copy', async () => {
    const capture = installCopyCommand(true);
    const controller = new AbortController();
    let refuse: ((error: Error) => void) | undefined;
    const clipboard = {
      writeText: () => new Promise<void>((_resolve, reject) => (refuse = reject)),
    };
    const copy = copyText('Oslo', { clipboard, signal: controller.signal });
    controller.abort();
    refuse?.(new Error('Denied'));
    await expect(copy).resolves.toBe(false);
    expect(capture.data).toEqual({});
    const rich = copyRichText(
      { text: 'Oslo', html: '<b>Oslo</b>' },
      { clipboard: null, signal: controller.signal },
    );
    await expect(rich).resolves.toBe('failed');
    expect(capture.data).toEqual({});
    await expect(
      copyText('Oslo', { clipboard: null, signal: new AbortController().signal }),
    ).resolves.toBe(true);
    expect(capture.data).toEqual({ 'text/plain': 'Oslo' });
  });
});

describe('copyRichText', () => {
  class Item {
    constructor(readonly values: Record<string, Blob>) {}
  }

  it('UIC-CLIPBOARD-1.3 writes both formats, plain text without ClipboardItem, and reports refusal', async () => {
    const writes: Array<Record<string, Blob> | string> = [];
    const clipboard = {
      write: vi.fn(async (items: never[]) => {
        writes.push((items[0] as unknown as Item).values);
      }),
      async writeText(text: string) {
        writes.push(text);
      },
    };
    const content = { text: 'Lisbon', html: '<a href="https://example.com">Lisbon</a>' };

    await expect(copyRichText(content, { clipboard, ClipboardItem: Item })).resolves.toBe('rich');
    const formats = writes[0] as Record<string, Blob>;
    await expect(formats['text/plain']?.text()).resolves.toBe('Lisbon');
    await expect(formats['text/html']?.text()).resolves.toBe(content.html);

    vi.stubGlobal('ClipboardItem', undefined);
    await expect(copyRichText(content, { clipboard })).resolves.toBe('text');
    expect(writes[1]).toBe('Lisbon');
    vi.unstubAllGlobals();

    clipboard.write.mockRejectedValue(new Error('denied'));
    await expect(copyRichText(content, { clipboard, ClipboardItem: Item })).resolves.toBe('failed');
    expect(writes).toHaveLength(2);
    await expect(
      copyRichText(content, { clipboard, ClipboardItem: Item, fallbackOnRichFailure: true }),
    ).resolves.toBe('text');
    expect(writes).toHaveLength(3);
  });

  it('UIC-CLIPBOARD-1.3 supplies both formats through the selection fallback', async () => {
    const capture = installCopyCommand();
    const content = { text: 'Rome', html: '<b>Rome</b>' };
    await expect(copyRichText(content, { clipboard: null })).resolves.toBe('rich');
    expect(capture.data).toEqual({ 'text/plain': 'Rome', 'text/html': '<b>Rome</b>' });
    await expect(copyRichText(content, { clipboard: null, fallback: false })).resolves.toBe(
      'failed',
    );
    await expect(copyRichText({ text: '', html: '' }, { clipboard: null })).resolves.toBe('failed');
  });
});

describe('the owner window', () => {
  /** A same-origin frame: a second window and document, as a popup rendered through a portal. */
  function openFrame() {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const view = frame.contentWindow as Window & typeof globalThis;
    const button = view.document.body.appendChild(view.document.createElement('button'));
    return { view, button };
  }

  it('UIC-CLIPBOARD-1.5 writes through the owner window clipboard', async () => {
    const own: string[] = [];
    const theirs: string[] = [];
    vi.stubGlobal('navigator', { clipboard: writer(own) });
    const { view, button } = openFrame();
    Object.defineProperty(view.navigator, 'clipboard', {
      configurable: true,
      value: writer(theirs),
    });
    try {
      await expect(copyText('Crate 12', { owner: button })).resolves.toBe(true);
      expect(theirs).toEqual(['Crate 12']);
      expect(own).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('UIC-CLIPBOARD-1.5 runs the selection fallback in the owner document', async () => {
    const { view, button } = openFrame();
    const commands: Document[] = [];
    const execCommand = vi.fn(function (this: Document) {
      commands.push(this);
      return true;
    });
    Object.defineProperty(view.document, 'execCommand', { configurable: true, value: execCommand });
    installCopyCommand(false);
    await expect(copyText('Crate 12', { owner: button, clipboard: null })).resolves.toBe(true);
    expect(commands).toEqual([view.document]);
    expect(view.document.body.querySelector('pre')).toBeNull();
  });
});

describe('clipboard entry', () => {
  it('UIC-CLIPBOARD-1.6 is exported from the core entry', () => {
    expect(core.copyText).toBe(copyText);
    expect(core.copyRichText).toBe(copyRichText);
  });
});

describe('copyImage', () => {
  class Item {
    constructor(readonly values: Record<string, Blob | Promise<Blob>>) {}
  }

  it('UIC-CLIPBOARD-1.7 writes a pending image at once, with a sized HTML image', async () => {
    const writes: Array<Record<string, Blob | Promise<Blob>>> = [];
    const clipboard = {
      write: vi.fn(async (items: never[]) => {
        writes.push((items[0] as unknown as Item).values);
      }),
    };
    let finish: (blob: Blob) => void = () => undefined;
    const image = new Promise<Blob>((resolve) => (finish = resolve));
    const copied = copyImage(image, {
      clipboard,
      ClipboardItem: Item,
      size: { width: 24.4, height: 32 },
      alt: 'a "b" <c>',
    });
    expect(clipboard.write).toHaveBeenCalledTimes(1);
    finish(new Blob(['png'], { type: 'image/png' }));
    await expect(copied).resolves.toBe(true);
    const formats = writes[0] ?? {};
    expect(Object.keys(formats)).toEqual(['image/png', 'text/html']);
    await expect((await formats['image/png'])?.text()).resolves.toBe('png');
    await expect((await formats['text/html'])?.text()).resolves.toBe(
      '<img src="data:image/png;base64,cG5n" width="24" height="32" alt="a &quot;b&quot; &lt;c>">',
    );
    expect(core.copyImage).toBe(copyImage);
  });

  it('UIC-CLIPBOARD-1.7 resolves false without the API, once withdrawn, or when refused', async () => {
    const image = new Blob(['png'], { type: 'image/png' });
    await expect(copyImage(image, { clipboard: null, ClipboardItem: Item })).resolves.toBe(false);
    vi.stubGlobal('ClipboardItem', undefined);
    await expect(copyImage(image, { clipboard: { write: vi.fn() } })).resolves.toBe(false);
    vi.unstubAllGlobals();
    const controller = new AbortController();
    controller.abort();
    const write = vi.fn(async () => undefined);
    await expect(
      copyImage(image, { clipboard: { write }, ClipboardItem: Item, signal: controller.signal }),
    ).resolves.toBe(false);
    expect(write).not.toHaveBeenCalled();
    const refused = { write: vi.fn(async () => Promise.reject(new Error('denied'))) };
    await expect(copyImage(image, { clipboard: refused, ClipboardItem: Item })).resolves.toBe(
      false,
    );
    await expect(
      copyImage(Promise.reject(new Error('no image')), { clipboard: refused, ClipboardItem: Item }),
    ).resolves.toBe(false);
  });
});
