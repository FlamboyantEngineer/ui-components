import { CheckGlyph, CloseGlyph, type GlyphComponentProps } from './glyphs.js';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { userEvent } from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { Link, useLocale } from '../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../test/hooks.js';
import { requireDefined } from '../utils/require-defined.js';
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
import { en } from './locales/index.js';
import { defaultStrings } from './strings.js';

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

function heroicon(Component: typeof XMarkIcon, name: string, slot: string) {
  return renderToStaticMarkup(
    <Component
      className={`ui-glyph ui-probe__${slot}`}
      data-glyph={name}
      aria-hidden="true"
      focusable="false"
    />,
  );
}

function StarGlyph(props: GlyphComponentProps) {
  return <svg {...props} data-glyph="star" />;
}

describe('UiProvider defaults', () => {
  it('UIC-PROVIDER-1.1 works without a provider using Heroicons and English strings', () => {
    const { container } = render(<Probe />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('data-count', '2 items');
    expect(glyphMarkup(container, 'close')).toBe(heroicon(XMarkIcon, 'close', 'close'));
    expect(glyphMarkup(container, 'check')).toBe(heroicon(CheckIcon, 'check', 'check'));
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
    let drawn: unknown;
    function Reader() {
      drawn = useGlyph('check', CheckIcon);
      return null;
    }
    render(<Reader />);
    expect(drawn).toBe(CheckIcon);
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
    expect(glyphMarkup(container, 'check')).toBe(heroicon(CheckIcon, 'check', 'check'));
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
});

describe('storage', () => {
  function Counter({ storageKey }: { storageKey?: string }) {
    const [count, setCount] = usePersistentState(storageKey, 0);
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
