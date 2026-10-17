import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOWNLOAD_URL_LIFETIME, downloadBlob, downloadUrl } from './download.js';

const clicks: Array<{ href: string; download: string; hidden: boolean; attached: boolean }> = [];

beforeEach(() => {
  vi.useFakeTimers();
  clicks.length = 0;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function record(
    this: HTMLAnchorElement,
  ) {
    clicks.push({
      href: this.href,
      download: this.download,
      hidden: this.hidden === true,
      attached: this.isConnected,
    });
  });
  let created = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => `blob:${location.origin}/file-${++created}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('downloadBlob', () => {
  it('UIC-DOWNLOAD-1.1 clicks one hidden link once, then revokes the object URL', () => {
    expect(downloadBlob(new Blob(['a,b']), 'Budget – Q1.csv')).toBe(true);
    expect(clicks).toEqual([
      {
        href: `blob:${location.origin}/file-1`,
        download: 'Budget – Q1.csv',
        hidden: true,
        attached: true,
      },
    ]);
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DOWNLOAD_URL_LIFETIME);
    expect(DOWNLOAD_URL_LIFETIME).toBe(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(`blob:${location.origin}/file-1`);
  });
});

describe('downloadUrl', () => {
  it('UIC-DOWNLOAD-1.2 downloads same-origin and data URLs without an object URL or navigation', () => {
    const page = location.href;
    expect(downloadUrl('/exports/Report.pdf', 'Report.pdf')).toBe(true);
    expect(downloadUrl(new URL('/exports/Notes.txt', location.href))).toBe(true);
    expect(downloadUrl('data:text/plain,hello', 'hello.txt')).toBe(true);
    expect(clicks.map(({ href, download }) => ({ href, download }))).toEqual([
      { href: new URL('/exports/Report.pdf', page).href, download: 'Report.pdf' },
      { href: new URL('/exports/Notes.txt', page).href, download: '' },
      { href: 'data:text/plain,hello', download: 'hello.txt' },
    ]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DOWNLOAD_URL_LIFETIME);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(location.href).toBe(page);
    expect(document.querySelector('a')).toBeNull();
  });

  it('UIC-DOWNLOAD-1.2 refuses cross-origin URLs', () => {
    expect(() => downloadUrl('https://elsewhere.example/Report.pdf', 'Report.pdf')).toThrow(
      'same origin',
    );
    expect(clicks).toEqual([]);
  });
});
