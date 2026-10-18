import { describe, expect, it } from 'vitest';
import { defaultUrlSchemes, isSafeUrl } from './safe-url.js';

describe('isSafeUrl', () => {
  it('UIC-MARKUP-2.1 accepts relative URLs and listed schemes, read as a browser reads them', () => {
    for (const url of [
      'https://example.com',
      'HTTP://example.com',
      'mailto:a@b.c',
      'tel:+15550100',
      '/docs',
      'docs/page?x=1',
      '#top',
      '?q=a:b',
      '//example.com',
      '',
    ]) {
      expect(isSafeUrl(url), url).toBe(true);
    }
    for (const url of [
      'javascript:alert(1)',
      ' JavaScript:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      '\u0000javascript:alert(1)',
      'vbscript:x',
      'data:text/html,x',
      'file:///etc',
    ]) {
      expect(isSafeUrl(url), url).toBe(false);
    }
    expect(isSafeUrl('data:image/png;base64,AA', ['data'])).toBe(true);
    expect(isSafeUrl('mailto:a@b.c', ['https'])).toBe(false);
    expect(defaultUrlSchemes).toEqual(['http', 'https', 'mailto', 'tel']);
  });
});
