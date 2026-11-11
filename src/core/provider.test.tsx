import { render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../test/hooks.js';
import { Link, useLocale } from '../primitives/index.js';
import { numberCodec } from '../utils/json-codec.js';
import { requireDefined } from '../utils/require-defined.js';
import {
  AlignMiddleCenterGlyph,
  SuperscriptGlyph,
  TableBorderBottomGlyph,
} from './drawn-glyphs.js';
import { checkPath, xMarkPath } from './glyph-paths.js';
import { CheckGlyph, CloseGlyph, CutGlyph, type GlyphComponentProps } from './glyphs.js';
import { en } from './locales/index.js';
import {
  Glyph,
  UiLink,
  UiProvider,
  useFormatMessage,
  useGlyph,
  usePersistentState,
  useUiStorage,
  useUiStrings,
} from './provider.js';
import { createMemoryStorage, createSafeStorage, type UiStorage } from './storage.js';
import { getDefaultStrings } from './strings.js';

const defaultStrings = getDefaultStrings();

function Probe() {
  const strings = useUiStrings();
  return (
    <button type="button" aria-label={strings.close} data-count={strings.itemCount(2)}>
      <Glyph icon={CloseGlyph} className="ui-probe__close" />
      <Glyph icon={CheckGlyph} className="ui-probe__check" />
    </button>
  );
}

function glyphMarkup(container: HTMLElement, slot: string) {
  return container.querySelector(`.ui-probe__${slot}`)?.outerHTML;
}

/** A default glyph: the Heroicons outline path on a 24px view box with a 1.5 stroke. */
function outlineGlyph(path: string, name: string, slot: string) {
  return renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      className={`ui-glyph ui-probe__${slot}`}
      data-glyph={name}
      focusable="false"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>,
  );
}

function StarGlyph(props: GlyphComponentProps) {
  return <svg {...props} data-glyph="star" />;
}

describe('UiProvider defaults', () => {
  it('UIC-PROVIDER-1.1 works without a provider using the vendored Heroicons glyphs and English strings', () => {
    const { container } = render(<Probe />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('data-count', '2 items');
    expect(glyphMarkup(container, 'close')).toBe(outlineGlyph(xMarkPath, 'close', 'close'));
    expect(glyphMarkup(container, 'check')).toBe(outlineGlyph(checkPath, 'check', 'check'));
  });

  it('UIC-PROVIDER-2.1 draws glyphs as decoration with the glyph hooks', () => {
    const { container } = render(<Glyph icon={CloseGlyph} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('data-glyph', 'close');
    expectHooksMatchSpec(container, 'PROVIDER');
  });

  it('UIC-PROVIDER-2.1 UIC-PROVIDER-3.1 resolves glyph overrides with an explicit fallback', () => {
    expect(CloseGlyph.glyphName).toBe('close');
    expect(defaultStrings.close).toBe('Close');
    const { result } = renderHook(() => useGlyph('check', StarGlyph));
    expect(result.current).toBe(StarGlyph);
  });
});

describe('drawn glyphs', () => {
  it('UIC-PROVIDER-2.1 draws a border glyph as a dotted grid of thin strokes and one solid edge', () => {
    const { container } = render(<Glyph icon={TableBorderBottomGlyph} />);
    const strokes = [...container.querySelectorAll('path')];
    expect(container.querySelector('svg')).toHaveAttribute('data-glyph', 'table-border-bottom');
    expect(strokes).toHaveLength(4);
    for (const dotted of strokes.slice(0, 3)) {
      expect(dotted).toHaveAttribute('stroke-width', '1');
      expect(dotted).toHaveAttribute('stroke-dasharray');
    }
    expect(strokes[3]).toHaveAttribute('d', 'M2.25 19.5h19.5');
    expect(strokes[3]).not.toHaveAttribute('stroke-dasharray');
  });

  it('UIC-PROVIDER-2.2 replaces a document formatting glyph like any other', () => {
    const { container } = render(
      <UiProvider icons={{ superscript: StarGlyph }}>
        <Glyph icon={SuperscriptGlyph} />
      </UiProvider>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('data-glyph', 'star');
  });

  it('UIC-PROVIDER-2.2 replaces a tabular formatting glyph by its key and keeps the caller props', () => {
    const { container } = render(
      <UiProvider icons={{ cut: StarGlyph }}>
        <Glyph icon={CutGlyph} />
        <Glyph icon={AlignMiddleCenterGlyph} className="caller" />
      </UiProvider>,
    );
    const [cut, align] = container.querySelectorAll('svg');
    expect(cut).toHaveAttribute('data-glyph', 'star');
    expect(align).toHaveAttribute('data-glyph', 'align-middle-center');
    expect(align).toHaveAttribute('aria-hidden', 'true');
    expect(align).toHaveClass('caller');
    expect(renderToStaticMarkup(<Glyph icon={CutGlyph} />)).toContain('data-glyph="cut"');
  });
});

describe('glyph replacement', () => {
  it('UIC-PROVIDER-2.2 replacing one glyph changes only that glyph', () => {
    const { container } = render(
      <UiProvider icons={{ close: StarGlyph }}>
        <Probe />
      </UiProvider>,
    );
    const close = container.querySelector('.ui-probe__close');
    expect(close).toHaveAttribute('data-glyph', 'star');
    expect(close).toHaveAttribute('aria-hidden', 'true');
    expect(glyphMarkup(container, 'check')).toBe(outlineGlyph(checkPath, 'check', 'check'));
  });
});

describe('text', () => {
  it('UIC-PROVIDER-3.1 UIC-PROVIDER-3.2 replaces text by key with messages, including counted text', () => {
    render(
      <UiProvider
        messages={{
          close: 'Fermer',
          itemCount: '{count, plural, one {# élément} other {# éléments}}',
        }}
      >
        <Probe />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveAttribute(
      'data-count',
      '2 éléments',
    );
  });

  it('UIC-PROVIDER-3.3 switches every component below to a new language when the props change', () => {
    const { rerender } = render(
      <UiProvider locale="en-US" messages={en}>
        <Probe />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('data-count', '2 items');
    rerender(
      <UiProvider locale="ja-JP" messages={{ close: '閉じる', itemCount: '{count} 件' }}>
        <Probe />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: '閉じる' })).toHaveAttribute('data-count', '2 件');
  });

  it('UIC-PROVIDER-3.3 keeps compiled messages when unrelated provider services change', () => {
    const messages = { close: 'Dismiss' };
    let storage = createMemoryStorage();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UiProvider storage={storage}>
        <UiProvider messages={messages}>{children}</UiProvider>
      </UiProvider>
    );
    const { result, rerender } = renderHook(() => useUiStrings(), { wrapper });
    const strings = result.current;
    storage = createMemoryStorage();
    rerender();
    expect(result.current).toBe(strings);
    expect(result.current.close).toBe('Dismiss');
  });

  it('UIC-PROVIDER-3.4 follows the locale for plurals, numbers and lists', () => {
    function ListProbe() {
      const strings = useUiStrings();
      return (
        <output>
          {[
            strings.itemCount(0),
            strings.itemCount(1200),
            strings.questionChose(['A', 'B', 'C']),
          ].join(' | ')}
        </output>
      );
    }
    const messages = {
      itemCount: '{count, plural, one {# élément} other {# éléments}}',
      questionChose: 'Vous avez choisi {answers}',
    };
    render(
      <UiProvider locale="fr-FR" messages={messages}>
        <ListProbe />
      </UiProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '0 élément | 1\u202f200 éléments | Vous avez choisi A, B et C',
      { normalizeWhitespace: false },
    );
  });

  it('UIC-PROVIDER-3.6 formats host messages with the provider locale', () => {
    function HostProbe() {
      const format = useFormatMessage();
      return (
        <output>
          {format('{count, plural, one {# guest} other {# guests}}: {names}', {
            count: 3,
            names: ['Ana', 'Ben', 'Chloé'],
          })}
        </output>
      );
    }
    const { rerender } = render(<HostProbe />);
    expect(screen.getByRole('status')).toHaveTextContent('3 guests: Ana, Ben, and Chloé');
    rerender(
      <UiProvider locale="es-ES">
        <HostProbe />
      </UiProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('3 guests: Ana, Ben y Chloé');
  });
});

describe('nesting', () => {
  it('UIC-PROVIDER-1.2 merges glyphs and text over the parent provider', () => {
    function CheckStar(props: GlyphComponentProps) {
      return <svg {...props} data-glyph="check-star" />;
    }
    const outerStorage = createMemoryStorage({ shared: '"outer"' });
    function StorageProbe() {
      return <output>{useUiStorage().getItem('shared')}</output>;
    }
    const { container } = render(
      <UiProvider
        icons={{ close: StarGlyph }}
        messages={{ close: 'Fermer' }}
        storage={outerStorage}
      >
        <UiProvider icons={{ check: CheckStar }} messages={{ more: 'Plus' }}>
          <Probe />
          <StorageProbe />
        </UiProvider>
      </UiProvider>,
    );
    expect(container.querySelector('.ui-probe__close')).toHaveAttribute('data-glyph', 'star');
    expect(container.querySelector('.ui-probe__check')).toHaveAttribute('data-glyph', 'check-star');
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('"outer"');
  });
});

describe('locale', () => {
  it('UIC-PROVIDER-4.1 sets the React Aria locale and direction', () => {
    function LocaleProbe() {
      const { locale, direction } = useLocale();
      return <output>{`${locale} ${direction}`}</output>;
    }
    render(
      <UiProvider locale="ar-EG">
        <LocaleProbe />
      </UiProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('ar-EG rtl');
  });
});

describe('links', () => {
  it('UIC-PROVIDER-5.1 renders library links through the link renderer', () => {
    const { rerender } = render(<UiLink href="/docs">Docs</UiLink>);
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');

    rerender(
      <UiProvider
        renderLink={({ href, ...props }) => <a {...props} href={`#${href}`} data-routed="true" />}
      >
        <UiLink href="/docs">Docs</UiLink>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', '#/docs');
    expect(link).toHaveAttribute('data-routed', 'true');
  });

  it('UIC-PROVIDER-5.2 routes React Aria links through navigate', async () => {
    const navigate = vi.fn();
    render(
      <UiProvider navigate={navigate}>
        <Link href="/next">Next</Link>
      </UiProvider>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Next' }));
    expect(navigate).toHaveBeenCalledWith('/next', undefined);
  });

  it('UIC-PROVIDER-5.2 merges navigate and useHref through nested providers', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const useOuterHref = (href: string) => `#outer${href}`;
    render(
      <UiProvider navigate={outer} useHref={useOuterHref}>
        <UiProvider navigate={inner}>
          <Link href="/inner">Inner</Link>
        </UiProvider>
        <UiProvider useHref={(href) => `#app${href}`}>
          <Link href="/hrefed">Hrefed</Link>
        </UiProvider>
      </UiProvider>,
    );
    const innerLink = screen.getByRole('link', { name: 'Inner' });
    expect(innerLink).toHaveAttribute('href', '#outer/inner');
    await userEvent.click(innerLink);
    expect(inner).toHaveBeenCalledWith('/inner', undefined);
    const hrefed = screen.getByRole('link', { name: 'Hrefed' });
    expect(hrefed).toHaveAttribute('href', '#app/hrefed');
    await userEvent.click(hrefed);
    expect(outer).toHaveBeenCalledWith('/hrefed', undefined);
    expect(inner).toHaveBeenCalledTimes(1);
  });
});

describe('storage', () => {
  function Counter({ storageKey }: { storageKey?: string }) {
    const [count, setCount] = usePersistentState(storageKey, 0, { codec: numberCodec });
    return (
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        {`Count ${count}`}
      </button>
    );
  }

  it('UIC-PROVIDER-6.1 persists through the storage adapter under the caller key', async () => {
    const storage = createMemoryStorage();
    const { unmount } = render(
      <UiProvider storage={storage}>
        <Counter storageKey="counter" />
      </UiProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(storage.getItem('counter')).toBe('1');
    unmount();
    render(
      <UiProvider storage={storage}>
        <Counter storageKey="counter" />
      </UiProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Count 1');
  });

  it('UIC-PROVIDER-6.1 keeps plain state without a key and memory storage without a provider', async () => {
    const { unmount } = render(<Counter storageKey="default-store" />);
    await userEvent.click(screen.getByRole('button'));
    unmount();
    render(
      <>
        <Counter storageKey="default-store" />
        <Counter />
      </>,
    );
    const [persisted, plain] = screen.getAllByRole('button');
    expect(persisted).toHaveTextContent('Count 1');
    expect(plain).toHaveTextContent('Count 0');
  });

  it('UIC-PROVIDER-6.2 falls back on unreadable values and survives throwing storage', async () => {
    render(
      <UiProvider storage={createMemoryStorage({ counter: '{not json' })}>
        <Counter storageKey="counter" />
      </UiProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Count 0');

    const throwing: UiStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const safe = createSafeStorage(throwing);
    expect(safe.getItem('x')).toBeNull();
    expect(() => safe.setItem('x', '1')).not.toThrow();
    expect(() => safe.removeItem('x')).not.toThrow();

    render(
      <UiProvider storage={safe}>
        <Counter storageKey="other" />
      </UiProvider>,
    );
    const [, button] = screen.getAllByRole('button');
    await userEvent.click(requireDefined(button));
    expect(button).toHaveTextContent('Count 1');
  });
});
