import { render, screen } from '@testing-library/react';
import { memo } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useNow } from './clock.js';
import { CloseGlyph, PauseGlyph } from './glyphs.js';
import {
  UiLink,
  type UiLinkRenderer,
  UiProvider,
  type UiProviderProps,
  useFormatMessage,
  useGlyph,
  useUiStorage,
  useUiStrings,
} from './provider.js';
import { createMemoryStorage } from './storage.js';

// Memoized consumer probes, one per service, count the renders a provider change causes through
// context alone: their parent never re-renders them (UIC-PROVIDER-1.3).

const renders = {
  glyph: vi.fn(),
  strings: vi.fn(),
  format: vi.fn(),
  link: vi.fn(),
  storage: vi.fn(),
  clock: vi.fn(),
};
type Service = keyof typeof renders;

const GlyphProbe = memo(function GlyphProbe() {
  renders.glyph();
  const Icon = useGlyph('close', CloseGlyph);
  return <output aria-label="Glyph">{Icon === PauseGlyph ? 'pause' : 'close'}</output>;
});
const StringsProbe = memo(function StringsProbe() {
  renders.strings();
  return <output aria-label="Strings">{useUiStrings().close}</output>;
});
const FormatProbe = memo(function FormatProbe() {
  renders.format();
  return <output aria-label="Format">{useFormatMessage()('{n, number}', { n: 1234.5 })}</output>;
});
// The link renderer counts the renders of the provider's link, which reads the renderer.
const countingAnchor: UiLinkRenderer = (props) => {
  renders.link();
  return <a {...props} />;
};
const LinkProbe = memo(function LinkProbe() {
  return <UiLink href="#next">Next</UiLink>;
});
const StorageProbe = memo(function StorageProbe() {
  renders.storage();
  return <output aria-label="Storage">{useUiStorage().getItem('size') ?? 'none'}</output>;
});
const ClockProbe = memo(function ClockProbe() {
  renders.clock();
  return <output aria-label="Clock">{useNow()?.toISOString() ?? 'none'}</output>;
});

function Probes() {
  return (
    <>
      <GlyphProbe />
      <StringsProbe />
      <FormatProbe />
      <LinkProbe />
      <StorageProbe />
      <ClockProbe />
    </>
  );
}

function setup(initial: UiProviderProps) {
  const tree = (props: UiProviderProps) => (
    <UiProvider renderLink={countingAnchor}>
      <UiProvider {...props}>
        <Probes />
      </UiProvider>
    </UiProvider>
  );
  const view = render(tree(initial));
  /** Renders the inner provider with `props`, returning which probes rendered again. */
  const change = (props: UiProviderProps): Service[] => {
    for (const probe of Object.values(renders)) probe.mockClear();
    view.rerender(tree(props));
    return (Object.keys(renders) as Service[]).filter((key) => renders[key].mock.calls.length > 0);
  };
  return { change };
}

const otherAnchor: UiLinkRenderer = (props) => countingAnchor({ ...props, rel: 'next' });
const shown = (name: string) => screen.getByRole('status', { name }).textContent;

describe('UiProvider subscriptions', () => {
  it('UIC-PROVIDER-1.3 re-renders only storage consumers when the storage adapter changes', () => {
    const { change } = setup({ storage: createMemoryStorage() });
    expect(change({ storage: createMemoryStorage({ size: '3' }) })).toEqual(['storage']);
    expect(shown('Storage')).toBe('3');
  });

  it('UIC-PROVIDER-1.3 re-renders only clock consumers when the clock or zone changes', () => {
    const { change } = setup({ getNow: () => new Date('2026-01-01T00:00:00Z') });
    expect(change({ getNow: () => new Date('2026-02-01T00:00:00Z') })).toEqual(['clock']);
    expect(shown('Clock')).toBe('2026-02-01T00:00:00.000Z');
    expect(change({ timeZone: 'Europe/Paris' })).toEqual(['clock']);
  });

  it('UIC-PROVIDER-1.3 re-renders only glyph or link consumers when icons or the renderer change', () => {
    const { change } = setup({});
    expect(change({ icons: { close: PauseGlyph } })).toEqual(['glyph']);
    expect(shown('Glyph')).toBe('pause');
    expect(change({ icons: { close: PauseGlyph }, renderLink: otherAnchor })).toEqual(['link']);
  });

  it('UIC-PROVIDER-1.3 UIC-PROVIDER-3.3 updates every text consumer, and only them, when text changes', () => {
    const { change } = setup({});
    expect(change({ messages: { close: 'Shut' } })).toEqual(['strings', 'format']);
    expect(shown('Strings')).toBe('Shut');
    expect(change({ messages: { close: 'Shut' }, locale: 'fr-FR' })).toEqual(['strings', 'format']);
    expect(shown('Format')).toMatch(/^1\s234,5$/);
  });

  it('UIC-PROVIDER-1.3 re-renders no consumer for a parent render that changes no service', () => {
    const storage = createMemoryStorage();
    const { change } = setup({
      storage,
      messages: { close: 'Shut' },
      icons: { close: PauseGlyph },
    });
    expect(change({ storage, messages: { close: 'Shut' }, icons: { close: PauseGlyph } })).toEqual(
      [],
    );
  });
});
