import { afterEach, describe, expect, it } from 'vitest';
import { isUrl } from './is-url.js';

afterEach(() => document.body.replaceChildren());

describe('isUrl', () => {
  it('UIC-PDF-VIEWER-1.1 recognises URLs of this window and of a same-origin frame', () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const view = frame.contentWindow as Window & typeof globalThis;
    expect(isUrl(new URL('https://example.com/report.pdf'))).toBe(true);
    expect(isUrl(new view.URL('https://example.com/report.pdf'))).toBe(true);
    expect(isUrl('https://example.com/report.pdf')).toBe(false);
    expect(isUrl({ href: 'https://example.com/report.pdf' })).toBe(false);
    expect(isUrl(new Uint8Array(1))).toBe(false);
    expect(isUrl(null)).toBe(false);
  });
});
