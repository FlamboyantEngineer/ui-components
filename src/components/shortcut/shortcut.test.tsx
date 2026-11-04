import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button, Menu, MenuItem, Popover, Text } from '../../primitives/index.js';
import { MenuTrigger } from '../menu/menu.js';
import { KeyHints, Shortcut, ShortcutAppearanceContext } from './shortcut.js';
import { getShortcutPlatform } from './shortcut-format.js';

afterEach(() => vi.unstubAllGlobals());

describe('Shortcut', () => {
  it('UIC-SHORTCUT-2.1 draws one keycap per modifier and key in the chosen notation', () => {
    const { container, rerender } = render(<Shortcut chord="Ctrl+Shift+K" platform="mac" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('KBD');
    expect(root).toHaveClass('ui-shortcut');
    expect(root).toHaveAttribute('data-platform', 'mac');
    const keys = root.querySelector('.ui-shortcut__keys') as HTMLElement;
    expect([...keys.querySelectorAll('.ui-shortcut__key')].map((key) => key.tagName)).toEqual([
      'KBD',
      'KBD',
      'KBD',
    ]);
    expect(keys).toHaveTextContent('⇧⌘K');
    expectHooksMatchSpec(container, 'SHORTCUT', { slots: ['keys', 'key', 'text'] });

    rerender(<Shortcut chord="Ctrl+Shift+K" platform="windows" />);
    expect(root).toHaveAttribute('data-platform', 'windows');
    expect(root.querySelector('.ui-shortcut__keys')?.textContent).toBe('Ctrl+Shift+K');
    expect(root.querySelectorAll('.ui-shortcut__key')).toHaveLength(3);
    expectHooksMatchSpec(container, 'SHORTCUT');
  });

  it('UIC-SHORTCUT-2.1 hydrates in the server notation, then draws the detected one', async () => {
    vi.resetModules();
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    const fresh = await import('./shortcut.js');
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToString returns an HTML string, not a render result
    const markup = renderToString(<fresh.Shortcut chord="Ctrl+K" />);
    expect(markup).toContain('data-platform="linux"');
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = markup;
    const errors = vi.spyOn(console, 'error');
    const hydrateErrors: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, <fresh.Shortcut chord="Ctrl+K" />, {
        onRecoverableError: (error) => hydrateErrors.push(error),
      });
    });
    expect(hydrateErrors).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(host.firstElementChild).toHaveAttribute('data-platform', 'mac');
    expect(host.querySelector('.ui-shortcut__keys')).toHaveTextContent('⌘K');
    act(() => app?.unmount());
    host.remove();
  });

  it('UIC-SHORTCUT-2.1 uses the detected platform by default and renders nothing for an empty key', () => {
    const { container, rerender } = render(<Shortcut chord="Ctrl+K" />);
    expect(container.firstElementChild).toHaveAttribute('data-platform', getShortcutPlatform());
    rerender(<Shortcut chord="" platform="mac" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<Shortcut chord={{ key: '', modifiers: ['shift'] }} platform="linux" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-SHORTCUT-2.2 hides the keycaps and supplies readable text unless decorative', () => {
    const { container, rerender } = render(<Shortcut chord="Ctrl+Shift+K" platform="mac" />);
    const keys = container.querySelector('.ui-shortcut__keys');
    expect(keys).toHaveAttribute('aria-hidden', 'true');
    const text = container.querySelector('.ui-shortcut__text') as HTMLElement;
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveTextContent('Shift Command K');
    expect(text).not.toHaveAttribute('aria-hidden');
    expect(text.style.position).toBe('absolute');

    rerender(<Shortcut chord="Ctrl+Shift+K" platform="mac" decorative />);
    expect(container.querySelector('.ui-shortcut__text')).toBeNull();
    expect(container.querySelector('.ui-shortcut__keys')).toHaveTextContent('⇧⌘K');
  });

  it('UIC-SHORTCUT-1.3 UIC-SHORTCUT-2.2 reads key names from the provider strings', () => {
    const shortcutKeyName = '{key, select, control {Contrôle} down {Flèche bas} other {{name}}}';
    render(
      <UiProvider messages={{ shortcutKeyName }}>
        <Shortcut chord="Ctrl+↓" platform="linux" />
      </UiProvider>,
    );
    expect(document.querySelector('.ui-shortcut__text')).toHaveTextContent('Contrôle Flèche bas');
  });

  it('UIC-SHORTCUT-2.2 describes a menu item through its keyboard slot', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Edit</Button>
        <Popover>
          <Menu aria-label="Edit">
            <MenuItem id="copy" textValue="Copy">
              <Text slot="label">Copy</Text>
              <Shortcut chord="Ctrl+C" platform="mac" />
            </MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const item = screen.getByRole('menuitem', { name: 'Copy' });
    expect(item).toHaveAccessibleDescription('Command C');
    expect(within(item).getByText('⌘').closest('.ui-shortcut')).toHaveAttribute('id');
  });

  it('UIC-SHORTCUT-2.4 draws each chord of a sequence in its own slot', () => {
    const { container, rerender } = render(
      <Shortcut chord={['Ctrl+K', 'Ctrl+C']} platform="windows" />,
    );
    const keys = container.querySelector('.ui-shortcut__keys') as HTMLElement;
    const chords = [...keys.querySelectorAll(':scope > .ui-shortcut__chord')];
    expect(chords.map((chord) => chord.textContent)).toEqual(['Ctrl+K', 'Ctrl+C']);
    expect(keys).toHaveTextContent('Ctrl+K Ctrl+C');
    expect(keys.querySelectorAll('.ui-shortcut__key')).toHaveLength(4);
    expect(container.querySelector('.ui-shortcut__text')).toHaveTextContent(
      'Control K, then Control C',
    );
    expectHooksMatchSpec(container, 'SHORTCUT', { slots: ['keys', 'chord', 'key', 'text'] });

    rerender(<Shortcut chord={['G']} platform="mac" />);
    expect(container.querySelector('.ui-shortcut__chord')).toBeNull();
    expect(container.querySelector('.ui-shortcut__keys')).toHaveTextContent('G');
    rerender(<Shortcut chord={['', { key: '' }]} platform="mac" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-SHORTCUT-2.4 joins a sequence with the provider string', () => {
    render(
      <UiProvider messages={{ shortcutThen: '{previous} puis {next}' }}>
        <Shortcut chord={['G', 'I']} platform="linux" />
      </UiProvider>,
    );
    expect(document.querySelector('.ui-shortcut__text')).toHaveTextContent('G puis I');
  });

  it('UIC-SHORTCUT-2.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Shortcut
        chord="Ctrl+S"
        platform="linux"
        className="caller"
        id="save-keys"
        data-testid="probe"
        data-platform="mac"
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-shortcut', 'caller');
    expect(root).toHaveAttribute('id', 'save-keys');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-platform', 'linux');
    expectHooksMatchSpec(container, 'SHORTCUT');
  });
});

describe('KeyHints', () => {
  const hints = [
    { keys: ['↑', '↓'], action: 'move' },
    { keys: ['Enter'], action: 'select' },
  ];

  it('UIC-SHORTCUT-3.1 draws each hint as shortcuts and an action on one metadata line', () => {
    const { container } = render(<KeyHints hints={hints} platform="windows" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-meta-line', 'ui-key-hints');
    expect(root.querySelectorAll('.ui-meta-line__separator')).toHaveLength(1);
    const [move, select] = [...root.querySelectorAll('.ui-key-hints__hint')];
    expect(move?.querySelectorAll('.ui-shortcut')).toHaveLength(2);
    expect(move?.querySelector('.ui-key-hints__action')).toHaveTextContent('move');
    expect(select?.querySelector('.ui-shortcut__text')).toHaveTextContent('Enter');
    expect(root).toHaveTextContent('↑Up Arrow↓Down Arrow move · EnterEnter select');
    expect(
      [...root.querySelectorAll('[aria-hidden="true"]')].map((node) => node.textContent).join(''),
    ).toBe('↑↓·Enter');
    expectHooksMatchSpec(container, 'SHORTCUT', { slots: ['hint', 'action'] });
    expectHooksMatchSpec(container, 'META-LINE', { slots: 'all' });
  });

  it("UIC-SHORTCUT-2.4 accepts sequences among a hint's keys", () => {
    const { container } = render(
      <KeyHints hints={[{ keys: [['G', 'I']], action: 'inbox' }]} platform="linux" />,
    );
    expect(container.querySelector('.ui-key-hints__hint')).toHaveTextContent('G I');
    expect(container.querySelectorAll('.ui-shortcut__chord')).toHaveLength(2);
  });

  it('UIC-SHORTCUT-3.2 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <KeyHints hints={hints} platform="mac" className="caller" id="legend" data-testid="probe" />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-key-hints', 'ui-meta-line', 'caller');
    expect(root).toHaveAttribute('id', 'legend');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root?.querySelectorAll('.ui-shortcut[data-platform="mac"]')).toHaveLength(3);
    expectHooksMatchSpec(container, 'SHORTCUT');
  });

  it('UIC-SHORTCUT-3.3 names a legend as a group', () => {
    render(<KeyHints hints={hints} platform="mac" aria-label="Composer keys" />);
    const legend = screen.getByRole('group', { name: 'Composer keys' });
    expect(legend).toHaveClass('ui-key-hints');
  });
});

describe('Shortcut appearance', () => {
  it('UIC-SHORTCUT-2.5 publishes keycaps by default and text when asked, with the same keys and words', () => {
    const { container, rerender } = render(
      <Shortcut chord={['Ctrl+K', 'Ctrl+C']} platform="mac" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-appearance', 'keycaps');
    const keycaps = root.innerHTML;
    rerender(<Shortcut chord={['Ctrl+K', 'Ctrl+C']} platform="mac" appearance="text" />);
    expect(root).toHaveAttribute('data-appearance', 'text');
    expect(root.innerHTML).toBe(keycaps);
    expect(root.querySelector('.ui-shortcut__keys')).toHaveTextContent('⌘K ⌘C');
    expect(root.querySelector('.ui-shortcut__text')).toHaveTextContent('Command K, then Command C');
    expectHooksMatchSpec(container, 'SHORTCUT');
  });

  it('UIC-SHORTCUT-2.5 takes the appearance of its context unless it sets its own, as key hints and menu items do', async () => {
    const user = userEvent.setup();
    render(
      <ShortcutAppearanceContext value="text">
        <Shortcut chord="Ctrl+S" platform="linux" />
        <Shortcut chord="Ctrl+P" platform="linux" appearance="keycaps" />
        <KeyHints hints={[{ keys: ['Enter'], action: 'select' }]} platform="linux" />
        <KeyHints
          hints={[{ keys: ['Escape'], action: 'close' }]}
          platform="linux"
          appearance="keycaps"
        />
        <MenuTrigger>
          <Button>Actions</Button>
          <Popover>
            <Menu>
              <MenuItem id="save">
                <Text slot="label">Save</Text>
                <Shortcut chord="Ctrl+S" platform="linux" />
              </MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      </ShortcutAppearanceContext>,
    );
    const shortcuts = document.querySelectorAll('.ui-shortcut');
    expect([...shortcuts].map((shortcut) => shortcut.getAttribute('data-appearance'))).toEqual([
      'text',
      'keycaps',
      'text',
      'keycaps',
    ]);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const item = within(await screen.findByRole('menu')).getByRole('menuitem');
    expect(item.querySelector('.ui-shortcut')).toHaveAttribute('data-appearance', 'text');
  });
});

describe('Shortcut root ref', () => {
  it('UIC-SHORTCUT-2.3 forwards ref to its root', () => {
    const ref = { current: null as HTMLElement | null };
    const { container } = render(<Shortcut ref={ref} chord="Ctrl+K" platform="windows" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-shortcut'));
    expect(ref.current?.tagName).toBe('KBD');
  });
});
