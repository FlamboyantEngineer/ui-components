import { describe, expect, it } from 'vitest';
import {
  createMiniAppDocument,
  createMiniAppPolicy,
  readAllowedOrigins,
} from './mini-app-document.js';

const page = { title: 'Loan calculator', locale: { locale: 'en-US', direction: 'ltr' } } as const;

/** The document a browser would parse from a mini-app's `srcdoc`. */
function parse(markup: string): Document {
  return new DOMParser().parseFromString(markup, 'text/html');
}

describe('createMiniAppDocument', () => {
  it('UIC-MINI-APP-1.1 places the policy, bridge, stylesheet, markup and script in order', () => {
    const document = parse(
      createMiniAppDocument({
        ...page,
        source: {
          html: '<label>Amount <input id="amount"></label>',
          css: 'label { display: block; }',
          script: 'document.getElementById("amount").focus();',
        },
      }),
    );
    const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(policy?.getAttribute('content')).toBe(createMiniAppPolicy([]));
    const scripts = [...document.querySelectorAll('script')];
    expect(scripts).toHaveLength(2);
    expect(scripts[0]?.parentElement).toBe(document.head);
    expect(scripts[0]?.textContent).toContain("Object.defineProperty(window, 'miniApp'");
    expect(document.querySelector('style')?.textContent).toBe('label { display: block; }');
    expect(document.body.querySelector('label')?.textContent).toBe('Amount ');
    expect(document.body.lastElementChild).toBe(scripts[1]);
    expect(scripts[1]?.textContent).toBe('document.getElementById("amount").focus();');
  });

  it('UIC-MINI-APP-1.1 names the document and gives it the host’s language and direction', () => {
    const document = parse(
      createMiniAppDocument({
        source: { html: '' },
        title: 'Rates <&> "fees"',
        locale: { locale: 'ar-EG', direction: 'rtl' },
      }),
    );
    expect(document.title).toBe('Rates <&> "fees"');
    expect(document.documentElement.lang).toBe('ar-EG');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('UIC-MINI-APP-1.1 leaves out an absent stylesheet and script', () => {
    const document = parse(createMiniAppDocument({ ...page, source: { html: '<p>Hello</p>' } }));
    const body = document.body.textContent;
    expect(document.querySelector('style')).toBeNull();
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(body).toBe('Hello');
  });

  it('UIC-MINI-APP-1.1 keeps closing tags in the code from ending its element early', () => {
    const document = parse(
      createMiniAppDocument({
        ...page,
        source: {
          html: '<output></output>',
          css: '.a::after { content: "</STYLE><b>x</b>"; }',
          script: 'const markup = "</script><b>y</b><!-- z";',
        },
      }),
    );
    expect(document.querySelector('b')).toBeNull();
    expect(document.querySelector('style')?.textContent).toBe(
      '.a::after { content: "<\\/STYLE><b>x</b>"; }',
    );
    expect(document.querySelectorAll('script')[1]?.textContent).toBe(
      'const markup = "<\\/script><b>y</b><\\!-- z";',
    );
  });

  it('UIC-MINI-APP-2.3 writes the initial state as JSON the script element cannot end', () => {
    const state = { note: '</script><b>x</b>', rows: [1, 2], open: true };
    const document = parse(
      createMiniAppDocument({ ...page, source: { html: '' }, initialState: state }),
    );
    const bridge = document.querySelector('script')?.textContent ?? '';
    expect(document.querySelector('b')).toBeNull();
    expect(bridge).toContain(`state: ${JSON.stringify(state).replace(/</g, '\\u003c')},`);
    const empty = parse(createMiniAppDocument({ ...page, source: { html: '' } }));
    expect(empty.querySelector('script')?.textContent).toContain('state: null,');
  });
});

describe('mini-app network policy', () => {
  it('UIC-MINI-APP-1.3 blocks every load and connection without allowed origins', () => {
    expect(createMiniAppPolicy([])).toBe(
      [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        'img-src data: blob:',
        'font-src data:',
        'media-src data: blob:',
        "connect-src 'none'",
        "form-action 'none'",
        "base-uri 'none'",
      ].join('; '),
    );
  });

  it('UIC-MINI-APP-1.3 admits the allowed origins to every resource and connection', () => {
    const origins = ['https://cdn.example.org', 'https://data.example.org'];
    const policy = createMiniAppPolicy(origins);
    expect(policy).toContain(`script-src 'unsafe-inline' ${origins.join(' ')}`);
    expect(policy).toContain(`style-src 'unsafe-inline' ${origins.join(' ')}`);
    expect(policy).toContain(`img-src data: blob: ${origins.join(' ')}`);
    expect(policy).toContain(`font-src data: ${origins.join(' ')}`);
    expect(policy).toContain(`connect-src ${origins.join(' ')}`);
    expect(policy).toMatch(/^default-src 'none';/);
  });

  it('UIC-MINI-APP-1.3 keeps only entries that are exactly an https origin', () => {
    expect(
      readAllowedOrigins([
        'https://cdn.example.org',
        'https://cdn.example.org/',
        'https://data.example.org:8443',
        'https://example.org/lib.js',
        'https://example.org?q=1',
        'http://example.org',
        'https://*.example.org',
        "'unsafe-eval'",
        'https://a.example.org; script-src *',
        '*',
        '',
      ]),
    ).toEqual(['https://cdn.example.org', 'https://data.example.org:8443']);
    expect(readAllowedOrigins(undefined)).toEqual([]);
  });

  it('UIC-MINI-APP-1.3 writes the policy into the document from the admitted origins only', () => {
    const document = parse(
      createMiniAppDocument({
        ...page,
        source: { html: '' },
        allowedOrigins: ['https://cdn.example.org', 'https://evil.example.org/x'],
      }),
    );
    expect(
      document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content'),
    ).toBe(createMiniAppPolicy(['https://cdn.example.org']));
  });
});
