import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider, Link, useLocale } from '../primitives/index.js';
import { UiProvider, useFormatMessage, type UiNavigate } from './provider.js';

// Optional provider options come and go without remounting the children (UIC-PROVIDER-3.3).

interface Options {
  locale?: string | undefined;
  navigate?: UiNavigate | undefined;
}

/** A draft field that counts its mounts and shows React Aria's locale. */
function Draft({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return (
    <>
      <input aria-label="Draft" defaultValue="" />
      <output aria-label="Locale">{useLocale().locale}</output>
      <Link href="#next">Next</Link>
    </>
  );
}

function setup(outer: Options, inner: Options) {
  const onMount = vi.fn();
  const tree = (nextOuter: Options, nextInner: Options) => (
    <UiProvider {...nextOuter}>
      <UiProvider {...nextInner}>
        <Draft onMount={onMount} />
      </UiProvider>
    </UiProvider>
  );
  const view = render(tree(outer, inner));
  const rerender = (nextOuter: Options, nextInner: Options) =>
    view.rerender(tree(nextOuter, nextInner));
  return { onMount, rerender };
}

const draft = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Draft' });
const shownLocale = () => screen.getByRole('status', { name: 'Locale' }).textContent;

describe('UiProvider options', () => {
  it('UIC-PROVIDER-3.3 UIC-PROVIDER-4.1 keeps the children while a locale comes and goes', async () => {
    const user = userEvent.setup();
    const { onMount, rerender } = setup({}, {});
    const browserLocale = shownLocale();
    await user.type(draft(), 'unsaved draft');
    rerender({}, { locale: 'fr-FR' });
    expect(shownLocale()).toBe('fr-FR');
    rerender({ locale: 'de-DE' }, {});
    expect(shownLocale()).toBe('de-DE');
    rerender({}, {});
    expect(shownLocale()).toBe(browserLocale);
    expect(draft()).toHaveValue('unsaved draft');
    expect(draft()).toHaveFocus();
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('UIC-PROVIDER-3.3 UIC-PROVIDER-5.2 keeps the children while navigate comes and goes', async () => {
    const user = userEvent.setup();
    const outerNavigate = vi.fn();
    const innerNavigate = vi.fn();
    const { onMount, rerender } = setup({}, {});
    await user.type(draft(), 'unsaved draft');
    rerender({}, { navigate: innerNavigate });
    await user.click(screen.getByRole('link', { name: 'Next' }));
    expect(innerNavigate).toHaveBeenLastCalledWith('#next', undefined);
    rerender({ navigate: outerNavigate }, {});
    await user.click(screen.getByRole('link', { name: 'Next' }));
    expect(outerNavigate).toHaveBeenLastCalledWith('#next', undefined);
    rerender({}, {});
    window.location.hash = '';
    await user.click(screen.getByRole('link', { name: 'Next' }));
    expect(window.location.hash).toBe('#next');
    expect(innerNavigate).toHaveBeenCalledTimes(1);
    expect(outerNavigate).toHaveBeenCalledTimes(1);
    expect(draft()).toHaveValue('unsaved draft');
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('UIC-PROVIDER-3.4 UIC-PROVIDER-4.1 formats its text in the locale of a host I18nProvider', () => {
    function Count() {
      const format = useFormatMessage();
      return (
        <output aria-label="Count">
          {format('{n, number} {n, plural, one {fichier} other {fichiers}}', { n: 1234.5 })}
        </output>
      );
    }
    render(
      <I18nProvider locale="fr-FR">
        <UiProvider>
          <Count />
        </UiProvider>
      </I18nProvider>,
    );
    expect(screen.getByRole('status', { name: 'Count' })).toHaveTextContent(/^1\s234,5 fichiers$/);
  });
});
