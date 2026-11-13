import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { actionKeys } from '../../../test/menu-fixtures.js';
import { PlusGlyph } from '../../core/glyphs.js';
import { Button } from '../button/button.js';
import { type MenuEntry, MenuItem, MenuSection } from '../menu/menu.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  CommandPalette,
  type CommandPaletteEntry,
  type CommandPaletteProps,
} from './command-palette.js';

const commands: MenuEntry[] = [
  { id: 'new', label: 'New file', icon: PlusGlyph, shortcut: 'Ctrl+N' },
  { id: 'open', label: 'Open recent', description: 'Report.pdf and 3 more' },
  { id: 'locked', label: 'Lock file', isDisabled: true },
  { type: 'separator', id: 'rule' },
  {
    type: 'section',
    id: 'go',
    title: 'Go to',
    items: [
      { id: 'lima', label: 'Lima' },
      { id: 'sao-paulo', label: 'São Paulo' },
    ],
  },
];

/** Stubs IntersectionObserver, which the loading row of a menu needs. */
function stubIntersections() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

function names(items: HTMLElement[]) {
  return items.map((item) => item.textContent);
}

function pressShortcut(init: KeyboardEventInit = { key: 'k', ctrlKey: true }) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  act(() => {
    document.body.dispatchEvent(event);
  });
  return event;
}

/**
 * Gives every element an animation that runs until `end` is called, as a stylesheet's exit
 * animation would, so a closed palette stays mounted while it leaves.
 */
function stubExitAnimation() {
  let end = () => {};
  const finished = new Promise<void>((resolve) => {
    end = resolve;
  });
  vi.stubGlobal('CSSTransition', class {});
  Element.prototype.getAnimations = () => [
    { playState: 'running', finished } as unknown as Animation,
  ];
  return {
    end: () => end(),
    restore: () => {
      Reflect.deleteProperty(Element.prototype, 'getAnimations');
      vi.unstubAllGlobals();
    },
  };
}

/** A button that opens a controlled palette, with the open state shown beside it. */
function Opener(props: Omit<CommandPaletteProps, 'isOpen' | 'onOpenChange'>) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Commands</Button>
      <output>{isOpen ? 'open' : 'closed'}</output>
      <CommandPalette {...props} isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

describe('CommandPalette', () => {
  it('UIC-COMMAND-PALETTE-1.1 renders nothing while closed and the dialog parts while open', () => {
    const { rerender } = render(<CommandPalette items={commands} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<CommandPalette items={commands} isOpen />);
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(dialog).toHaveClass('ui-command-palette__dialog');
    expect(dialog.closest('.ui-command-palette__panel')?.parentElement).toHaveClass(
      'ui-command-palette',
    );
    rerender(<CommandPalette items={commands} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-1.1 UIC-COMMAND-PALETTE-1.4 opens controlled, closes on a press outside and restores focus', async () => {
    const user = userEvent.setup();
    render(<Opener items={commands} />);
    const button = screen.getByRole('button', { name: 'Commands' });
    await user.click(button);
    // The page, the open state with it, is hidden from assistive technology while the palette is open.
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('open');
    expect(screen.getByRole('searchbox', { name: 'Search commands' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    const overlay = document.querySelector('.ui-command-palette') as HTMLElement;
    await user.pointer({ keys: '[MouseLeft]', target: overlay });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    // React Aria restores focus in the next animation frame.
    await waitFor(() => expect(button).toHaveFocus());
  });

  it('UIC-COMMAND-PALETTE-1.2 covers the viewport on the modal layer and hides the page', () => {
    render(
      <>
        <p>Page text</p>
        <CommandPalette items={commands} defaultOpen />
      </>,
    );
    const overlay = document.querySelector('.ui-command-palette') as HTMLElement;
    expect(overlay).toHaveAttribute('data-layer', 'modal');
    expect(overlay.style.position).toBe('fixed');
    expect(overlay.style.inset).toBe('0px');
    expect(overlay.style.zIndex).toBe('120');
    expect(screen.getByText('Page text').closest('[inert], [aria-hidden="true"]')).not.toBeNull();
  });

  it('UIC-COMMAND-PALETTE-1.3 opens on Ctrl+K anywhere and closes on it from inside', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CommandPalette items={commands} onOpenChange={onOpenChange} />);
    const event = pressShortcut();
    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const search = screen.getByRole('searchbox', { name: 'Search commands' });
    await waitFor(() => expect(search).toHaveFocus());
    await user.keyboard('{Control>}k{/Control}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-1.3 matches only the exact chord, not repeats or handled presses', () => {
    render(<CommandPalette items={commands} />);
    pressShortcut({ key: 'k', ctrlKey: true, shiftKey: true });
    pressShortcut({ key: 'k' });
    pressShortcut({ key: 'k', ctrlKey: true, repeat: true });
    const handled = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    handled.preventDefault();
    act(() => {
      document.body.dispatchEvent(handled);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'K', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-1.3 matches a letter or digit that Shift or Alt turned into another character', () => {
    const { unmount } = render(<CommandPalette items={commands} shortcut="Ctrl+Shift+1" />);
    pressShortcut({ key: '!', code: 'Digit1', ctrlKey: true, shiftKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    unmount();
    render(<CommandPalette items={commands} shortcut="Alt+P" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'π', code: 'KeyP', altKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-1.3 reads a letter the layout types from the typed letter', () => {
    render(<CommandPalette items={commands} shortcut="Ctrl+Q" />);
    pressShortcut({ key: 'a', code: 'KeyQ', ctrlKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'q', code: 'KeyA', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-1.3 takes another chord, none, and removes it on unmount', () => {
    const { rerender, unmount } = render(
      <CommandPalette items={commands} shortcut="Ctrl+Shift+P" />,
    );
    pressShortcut();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    pressShortcut({ key: 'P', ctrlKey: true, shiftKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<CommandPalette items={commands} shortcut={null} isOpen={false} />);
    pressShortcut();
    pressShortcut({ key: 'P', ctrlKey: true, shiftKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const removed = vi.spyOn(document, 'removeEventListener');
    rerender(<CommandPalette items={commands} />);
    unmount();
    expect(removed).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('UIC-COMMAND-PALETTE-1.5 publishes the size and passes it to the commands', () => {
    render(<CommandPalette items={commands} defaultOpen size="lg" />);
    expect(document.querySelector('.ui-command-palette')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByRole('menu')).toHaveAttribute('data-size', 'lg');
  });

  it.each([
    { name: 'during a composition', init: { isComposing: true } },
    { name: 'that confirms a candidate', init: { keyCode: 229 } },
  ])('UIC-COMMAND-PALETTE-2.1 runs no command on an Enter $name', async ({ init }) => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        items={commands}
        defaultOpen
        onAction={onAction}
        onOpenChange={onOpenChange}
      />,
    );
    const search = screen.getByRole('searchbox');
    await user.keyboard('o');
    await waitFor(() => expect(search).toHaveAttribute('aria-activedescendant'));
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
    fireEvent.keyDown(search, { key: 'Enter', ...init });
    expect(onAction).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMMAND-PALETTE-2.1 UIC-COMMAND-PALETTE-2.3 runs the highlighted command by keyboard and closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        items={commands}
        defaultOpen
        onAction={onAction}
        onOpenChange={onOpenChange}
      />,
    );
    const search = screen.getByRole('searchbox');
    await user.keyboard('o');
    await waitFor(() =>
      expect(search).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: /^Open recent/ }).id,
      ),
    );
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'São Paulo' })).toHaveAttribute(
        'data-focused',
        'true',
      ),
    );
    expect(search).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /^Open recent/ })).toHaveAttribute(
        'data-focused',
        'true',
      ),
    );
    await user.keyboard('{Enter}');
    expect(actionKeys(onAction)).toEqual(['open']);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-2.1 runs a pressed command, skips disabled ones and can stay open', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <CommandPalette defaultOpen onAction={onAction}>
        <MenuItem id="stay" shouldCloseOnSelect={false}>
          Toggle sidebar
        </MenuItem>
        <MenuSection title="Files">
          <MenuItem id="rename">Rename</MenuItem>
          <MenuItem id="lock" isDisabled>
            Lock
          </MenuItem>
        </MenuSection>
      </CommandPalette>,
    );
    await user.click(screen.getByRole('menuitem', { name: 'Toggle sidebar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Lock' }));
    expect(screen.getByRole('group', { name: 'Files' })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));
    expect(actionKeys(onAction)).toEqual(['stay', 'rename']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-2.2 keeps matches ignoring case and accents and drops emptied groups', async () => {
    const user = userEvent.setup();
    render(<CommandPalette items={commands} defaultOpen />);
    await user.keyboard('SAO');
    expect(names(screen.getAllByRole('menuitem'))).toEqual(['São Paulo']);
    expect(screen.getByRole('group', { name: 'Go to' })).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.keyboard('file');
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('New file'),
      'Lock file',
    ]);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-2.2 takes a custom filter, or none', async () => {
    const user = userEvent.setup();
    const startsWith = (text: string, input: string) =>
      text.toLowerCase().startsWith(input.toLowerCase());
    const { unmount } = render(<CommandPalette items={commands} defaultOpen filter={startsWith} />);
    await user.keyboard('l');
    expect(names(screen.getAllByRole('menuitem'))).toEqual(['Lock file', 'Lima']);
    unmount();
    render(<CommandPalette items={commands} defaultOpen filter={null} />);
    await user.keyboard('zz');
    expect(screen.getAllByRole('menuitem')).toHaveLength(5);
  });

  it('UIC-COMMAND-PALETTE-2.3 clears the text on Escape, then closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CommandPalette items={commands} defaultOpen onOpenChange={onOpenChange} />);
    const search = screen.getByRole('searchbox');
    await user.keyboard('li');
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-COMMAND-PALETTE-2.4 marks the typed text in data and TextMatch labels', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CommandPalette items={commands} defaultOpen />);
    await user.keyboard('li');
    const lima = screen.getByRole('menuitem', { name: 'Lima' });
    expect(lima.querySelector('mark.ui-text-match')).toHaveTextContent('Li');
    expectHooksMatchSpec(document.body, 'COMMAND-PALETTE');
    unmount();
    render(
      <CommandPalette defaultOpen defaultInputValue="ren">
        <MenuItem id="rename" textValue="Rename">
          <TextMatch>Rename</TextMatch>
        </MenuItem>
      </CommandPalette>,
    );
    expect(
      screen.getByRole('menuitem', { name: 'Rename' }).querySelector('mark'),
    ).toHaveTextContent('Ren');
  });

  it('UIC-COMMAND-PALETTE-2.5 says when nothing matches, in the caller words or the default', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CommandPalette items={commands} defaultOpen />);
    await user.keyboard('zz');
    expect(document.querySelector('.ui-command-palette__empty')).toHaveTextContent('No results');
    expectHooksMatchSpec(document.body, 'COMMAND-PALETTE', { slots: ['empty'] });
    unmount();
    render(
      <CommandPalette
        items={commands}
        defaultOpen
        defaultInputValue="zz"
        renderEmptyState={() => 'No command matches'}
      />,
    );
    expect(document.querySelector('.ui-command-palette__empty')).toHaveTextContent(
      'No command matches',
    );
  });

  it('UIC-COMMAND-PALETTE-2.6 controls the typed text and shows a loading row', async () => {
    stubIntersections();
    const user = userEvent.setup();
    const onInputChange = vi.fn();
    const { rerender } = render(
      <CommandPalette
        items={[]}
        defaultOpen
        inputValue="par"
        onInputChange={onInputChange}
        filter={null}
        isLoading
      />,
    );
    const search = screen.getByRole('searchbox');
    expect(search).toHaveValue('par');
    const menu = screen.getByRole('menu');
    expect(menu.querySelector('.ui-menu__load-more')).toHaveTextContent('Loading');
    expect(document.querySelector('.ui-command-palette__empty')).toBeNull();
    await user.keyboard('i');
    expect(onInputChange).toHaveBeenLastCalledWith('pari');
    expect(search).toHaveValue('par');
    rerender(
      <CommandPalette
        items={[{ id: 'paris', label: 'Paris' }]}
        defaultOpen
        inputValue="pari"
        onInputChange={onInputChange}
        filter={null}
        isLoading={false}
      />,
    );
    expect(names(screen.getAllByRole('menuitem'))).toEqual(['Paris']);
    expect(document.querySelector('.ui-menu__load-more')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('UIC-COMMAND-PALETTE-2.6 starts each uncontrolled opening from defaultInputValue', async () => {
    const user = userEvent.setup();
    render(<Opener items={commands} defaultInputValue="go" />);
    await user.click(screen.getByRole('button', { name: 'Commands' }));
    expect(screen.getByRole('searchbox')).toHaveValue('go');
    await user.keyboard('x');
    await user.keyboard('{Escape}{Escape}');
    await user.click(screen.getByRole('button', { name: 'Commands' }));
    expect(screen.getByRole('searchbox')).toHaveValue('go');
  });

  it.each([
    ['interrupted', false],
    ['finished', true],
  ])('UIC-COMMAND-PALETTE-2.6 starts afresh when reopened after an %s exit', async (_, finish) => {
    const user = userEvent.setup();
    const animation = stubExitAnimation();
    try {
      const palette = (isOpen: boolean, defaultInputValue?: string) => (
        <CommandPalette items={commands} isOpen={isOpen} defaultInputValue={defaultInputValue} />
      );
      const { rerender } = render(palette(true));
      await user.type(screen.getByRole('searchbox'), 'zzz');
      rerender(palette(false));
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      if (finish) await act(async () => animation.end());
      expect(screen.queryAllByRole('dialog', { hidden: true })).toHaveLength(finish ? 0 : 1);
      rerender(palette(true, 'go'));
      expect(screen.getByRole('searchbox')).toHaveValue('go');
      expect(screen.getAllByRole('menuitem').length).toBeGreaterThan(0);
    } finally {
      animation.restore();
    }
  });

  it('UIC-COMMAND-PALETTE-1.3 UIC-COMMAND-PALETTE-2.6 reopens on its chord while it is still leaving', async () => {
    const user = userEvent.setup();
    const animation = stubExitAnimation();
    try {
      const onOpenChange = vi.fn();
      render(<CommandPalette items={commands} onOpenChange={onOpenChange} />);
      pressShortcut();
      const search = screen.getByRole('searchbox');
      await waitFor(() => expect(search).toHaveFocus());
      await user.keyboard('zzz{Control>}k{/Control}');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      await user.keyboard('{Control>}k{/Control}');
      expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
      expect(screen.getByRole('searchbox')).toHaveValue('');
    } finally {
      animation.restore();
    }
  });

  it('UIC-COMMAND-PALETTE-3.1 names the dialog and the field from props or strings', () => {
    const { unmount } = render(<CommandPalette items={commands} defaultOpen />);
    const search = screen.getByRole('searchbox', { name: 'Search commands' });
    expect(search).toHaveAttribute('placeholder', 'Search commands');
    expect(search).toHaveAttribute('aria-controls', screen.getByRole('menu').id);
    expect(document.querySelector('.ui-command-palette__search-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    unmount();
    render(
      <CommandPalette
        items={commands}
        defaultOpen
        aria-label="Go anywhere"
        placeholder="Type a city"
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Go anywhere' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Type a city' })).toHaveAttribute(
      'placeholder',
      'Type a city',
    );
    expect(
      within(screen.getByRole('menu')).getByRole('menuitem', { name: /^New file/ }),
    ).toHaveAccessibleName('New file Control N');
  });

  it('UIC-COMMAND-PALETTE-3.2 carries its hooks and the caller attributes', () => {
    render(
      <CommandPalette
        items={commands}
        defaultOpen
        id="palette"
        className="host-palette"
        data-testid="palette"
        data-layer="caller"
      />,
    );
    const overlay = document.querySelector('.ui-command-palette') as HTMLElement;
    expect(overlay).toHaveClass('ui-command-palette', 'host-palette');
    expect(overlay).toHaveAttribute('data-testid', 'palette');
    expect(overlay).toHaveAttribute('data-layer', 'modal');
    expect(screen.getByRole('dialog')).toHaveAttribute('id', 'palette');
    expectHooksMatchSpec(document.body, 'COMMAND-PALETTE', {
      slots: ['panel', 'dialog', 'search', 'search-icon', 'search-input'],
    });
  });

  describe('aliases and pages', () => {
    const settings: CommandPaletteEntry[] = [
      { id: 'theme', label: 'Change theme', keywords: ['appearance'] },
      { id: 'save', label: 'Save all' },
      {
        id: 'display',
        label: 'Display',
        commands: [
          { id: 'density', label: 'Row density', commands: [{ id: 'compact', label: 'Compact' }] },
          { id: 'zoom', label: 'Zoom in' },
        ],
      },
    ];

    function items() {
      return screen.getAllByRole('menuitem').map((item) => item.textContent);
    }

    it('UIC-COMMAND-PALETTE-2.7 finds a command by its keyword without changing its name', async () => {
      const user = userEvent.setup();
      render(<CommandPalette items={settings} defaultOpen />);
      await user.keyboard('appear');
      const theme = screen.getByRole('menuitem', { name: 'Change theme' });
      expect(items()).toEqual(['Change theme']);
      expect(theme.querySelector('mark')).toBeNull();
      const search = screen.getByRole('searchbox');
      await waitFor(() => expect(search).toHaveAttribute('aria-activedescendant', theme.id));
      await user.clear(search);
      await user.keyboard('sa');
      expect(items()).toEqual(['Save all']);
      expect(
        screen.getByRole('menuitem', { name: 'Save all' }).querySelector('mark'),
      ).toHaveTextContent('Sa');
    });

    it('UIC-COMMAND-PALETTE-2.8 opens a page in place, names it and goes back with its query', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const onPathChange = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <CommandPalette
          items={settings}
          defaultOpen
          onAction={onAction}
          onPathChange={onPathChange}
          onOpenChange={onOpenChange}
        />,
      );
      const search = screen.getByRole('searchbox');
      await user.keyboard('disp');
      await user.keyboard('{Enter}');
      expect(onPathChange).toHaveBeenLastCalledWith(['display']);
      expect(onAction).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('menu', { name: 'Display' })).toBeInTheDocument();
      expect(document.querySelector('.ui-command-palette__page-title')).toHaveTextContent(
        'Display',
      );
      expectHooksMatchSpec(document.body, 'COMMAND-PALETTE', {
        slots: ['page', 'back', 'page-title'],
      });
      expect(search).toHaveValue('');
      expect(search).toHaveFocus();
      expect(items()).toEqual(['Row density', 'Zoom in']);
      await user.keyboard('zoom{Enter}');
      expect(onAction).toHaveBeenCalledWith('zoom');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('UIC-COMMAND-PALETTE-2.8 goes back with Escape, Backspace and the Back button on an empty field', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <CommandPalette
          items={settings}
          defaultOpen
          defaultPath={['display', 'density']}
          onOpenChange={onOpenChange}
        />,
      );
      expect(items()).toEqual(['Compact']);
      const search = screen.getByRole('searchbox');
      await user.keyboard('co{Escape}');
      expect(search).toHaveValue('');
      expect(items()).toEqual(['Compact']);
      await user.keyboard('{Escape}');
      expect(screen.getByRole('menu', { name: 'Display' })).toBeInTheDocument();
      await user.keyboard('{Backspace}');
      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
      expect(items()).toEqual(['Change theme', 'Save all', 'Display']);
      await user.keyboard('di{Enter}');
      await user.click(screen.getByRole('button', { name: 'Back' }));
      expect(search).toHaveValue('di');
      await waitFor(() => expect(search).toHaveFocus());
      expect(onOpenChange).not.toHaveBeenCalled();
      await user.clear(search);
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });
    it('UIC-COMMAND-PALETTE-2.8 goes back one page for a held Backspace', async () => {
      const user = userEvent.setup();
      render(<CommandPalette items={settings} defaultOpen defaultPath={['display']} />);
      await user.keyboard('de{Enter}');
      expect(items()).toEqual(['Compact']);
      const search = screen.getByRole('searchbox');
      await user.keyboard('{Backspace}');
      expect(screen.getByRole('menu', { name: 'Display' })).toBeInTheDocument();
      expect(search).toHaveValue('de');
      // The key stays down: its repeats neither go back again nor delete the restored query.
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set repeat
      expect(fireEvent.keyDown(search, { key: 'Backspace', repeat: true })).toBe(false);
      expect(screen.getByRole('menu', { name: 'Display' })).toBeInTheDocument();
      await user.keyboard('{Backspace}');
      expect(search).toHaveValue('d');
    });

    it('UIC-COMMAND-PALETTE-2.8 leaves composing keys alone, follows a removed page and starts each opening afresh', async () => {
      const user = userEvent.setup();
      function Palette({ entries, isOpen }: { entries: CommandPaletteEntry[]; isOpen: boolean }) {
        return <CommandPalette items={entries} isOpen={isOpen} defaultPath={[]} />;
      }
      const { rerender } = render(<Palette entries={settings} isOpen />);
      await user.keyboard('disp{Enter}');
      const search = screen.getByRole('searchbox');
      // eslint-disable-next-line testing-library/prefer-user-event -- a Backspace an input method sends while it composes
      fireEvent.keyDown(search, { key: 'Backspace', isComposing: true });
      expect(screen.getByRole('menu', { name: 'Display' })).toBeInTheDocument();
      rerender(<Palette entries={settings.slice(0, 2)} isOpen />);
      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
      expect(items()).toEqual(['Change theme', 'Save all']);
      rerender(<Palette entries={settings} isOpen={false} />);
      rerender(<Palette entries={settings} isOpen />);
      expect(await screen.findByRole('searchbox')).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    });
  });
});
