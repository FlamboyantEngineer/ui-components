import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type * as Pdfjs from 'pdfjs-dist';
import { describe, expect, it } from 'vitest';
import {
  isTextItem,
  type PdfEngine,
  type PdfTextContent,
  type PdfViewport,
  toDocumentParams,
} from './pdf-engine.js';

function acceptEngine<V extends PdfViewport, C extends PdfTextContent>(engine: PdfEngine<V, C>) {
  return engine;
}

describe('PDF engine contract', () => {
  it('UIC-PDF-VIEWER-1.1 is satisfied by the engine module itself', () => {
    // Compiles only while the real module satisfies the structural contract.
    const check = (engine: typeof Pdfjs) => acceptEngine(engine);
    expect(check).toBeTypeOf('function');
  });

  it('UIC-PDF-VIEWER-1.1 never imports the engine, an optional peer the host injects', () => {
    const directory = join(process.cwd(), 'src', 'components', 'pdf-viewer');
    const modules = readdirSync(directory).filter((name) => !name.includes('.test.'));
    for (const name of modules) {
      const code = readFileSync(join(directory, name), 'utf8')
        .split('\n')
        .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line));
      expect(code.join('\n')).not.toMatch(/['"]pdfjs-dist/);
    }
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      peerDependenciesMeta: Record<string, { optional: boolean }>;
    };
    expect(manifest.peerDependenciesMeta['pdfjs-dist']?.optional).toBe(true);
  });

  it('UIC-PDF-VIEWER-1.1 opens a URL unchanged and bytes from a copy of their own', () => {
    expect(toDocumentParams('/files/Report.pdf')).toEqual({ url: '/files/Report.pdf' });
    expect(toDocumentParams(new URL('https://example.com/Report.pdf'))).toEqual({
      url: 'https://example.com/Report.pdf',
    });

    const bytes = new TextEncoder().encode('%PDF-1.4\n');
    const params = toDocumentParams(bytes);
    if (!('data' in params)) throw new Error('bytes must open as data');
    expect([...params.data]).toEqual([...bytes]);
    expect(params.data.buffer).not.toBe(bytes.buffer);
    // The engine transfers the buffer to its worker, which detaches it.
    structuredClone(params.data.buffer, { transfer: [params.data.buffer] });
    expect(params.data.byteLength).toBe(0);
    expect(bytes.byteLength).toBe(9);

    const buffer = bytes.buffer.slice(0);
    const fromBuffer = toDocumentParams(buffer);
    if (!('data' in fromBuffer)) throw new Error('an ArrayBuffer must open as data');
    expect(fromBuffer.data.buffer).not.toBe(buffer);
    expect(fromBuffer.data.byteLength).toBe(9);
  });

  it('UIC-PDF-VIEWER-1.1 reads URLs and bytes made in a same-origin frame', () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const view = frame.contentWindow as Window & typeof globalThis;
    expect(toDocumentParams(new view.URL('https://example.com/report.pdf'))).toEqual({
      url: 'https://example.com/report.pdf',
    });
    const bytes = new view.Uint8Array([37, 80, 68, 70]);
    for (const source of [bytes, bytes.buffer]) {
      const params = toDocumentParams(source);
      if (!('data' in params)) throw new Error('bytes must open as data');
      expect(params.data).toBeInstanceOf(Uint8Array);
      expect([...params.data]).toEqual([37, 80, 68, 70]);
      expect(params.data.buffer).not.toBe(bytes.buffer);
    }
    expect(bytes.byteLength).toBe(4);
    frame.remove();
  });

  it('UIC-PDF-VIEWER-1.1 tells text runs from marked-content boundaries', () => {
    expect(isTextItem({ str: 'Pear', hasEOL: false })).toBe(true);
    expect(isTextItem({ type: 'beginMarkedContent' })).toBe(false);
  });
});
