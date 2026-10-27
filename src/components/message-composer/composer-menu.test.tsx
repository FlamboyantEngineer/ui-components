import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MessageComposerMenuButton, type MessageComposerMenuItem } from './composer-menu.js';
import { MessageComposerEmojiButton } from './composer-tools.js';
import { MessageComposer, type MessageComposerProps } from './message-composer.js';

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const trigger = () => screen.getByRole('button', { name: 'Add and more' });

/** A + button whose menu has two categories: things to add, then sources with icons, notes and a submenu. */
function createMenu(add: MessageComposerMenuItem[], filterable = false) {
  return (
    <MessageComposerMenuButton
      filterable={filterable}
      sections={[
        { id: 'add', title: 'Add', items: add },
        {
          id: 'sources',
          title: 'Sources',
          items: [
            {
              id: 'calendar',
              label: 'Calendar',
              description: 'Shared schedule',
              icon: 'calendar',
              shortcut: 'Ctrl+Shift+K',
            },
            {
              id: 'people',
              label: 'People',
              description: 'Mention someone',
              icon: 'users',
              items: [
                {
                  id: 'maria',
                  label: 'Maria Santos',
                  onAction: (composer) =>
                    composer.insertPill({ kind: 'mention', id: 'maria', label: 'Maria Santos' }),
                },
              ],
            },
          ],
        },
      ]}
    />
  );
}

/** Renders a plain composer with the menu and opens it; returns the open menu. */
async function openComposerMenu(props: MessageComposerProps) {
  const user = userEvent.setup();
  const view = render(<MessageComposer {...props} />);
  await user.click(trigger());
  const menu = await screen.findByRole('menu', { name: 'Add and more' });
  return { ...view, user, menu };
}

describe('MessageComposer menu', () => {
  it('UIC-MESSAGE-COMPOSER-5.1 UIC-MESSAGE-COMPOSER-2.2 shows the + button where the host places it and opens the categories', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MessageComposer
        onAttach={() => undefined}
        startControls={
          <>
            <button>Tone</button>
            {createMenu([{ id: 'note', label: 'Add a note' }])}
            <MessageComposerEmojiButton />
          </>
        }
      />,
    );
    const start = container.querySelector('.ui-message-composer__start') as HTMLElement;
    const names = within(start)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(names).toEqual(['Tone', 'Add and more', 'Insert emoji']);
    expect(trigger()).toHaveClass('ui-button', 'ui-message-composer__menu-button');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'true');
    await user.click(trigger());
    const menu = await screen.findByRole('menu', { name: 'Add and more' });
    expect(menu).toHaveClass('ui-menu', 'ui-message-composer__menu');
    const headings = within(menu)
      .getAllByRole('group')
      .map((group) => group.querySelector('.ui-menu-section__header')?.textContent);
    expect(headings).toEqual(['Add', 'Sources']);
    expect(within(menu).getByRole('group', { name: 'Add' })).toContainElement(
      within(menu).getByRole('menuitem', { name: 'Add a note' }),
    );
    expect(menu.closest('.ui-menu-popover')).toHaveAttribute('data-trigger', 'MenuTrigger');
    expectHooksMatchSpec(document.body, 'MESSAGE-COMPOSER', {
      slots: ['start', 'end', 'menu-button', 'menu', 'emoji'],
    });
  });

  it('UIC-MESSAGE-COMPOSER-5.2 draws items with icons, notes, shortcut hints, a disabled reason and a submenu', async () => {
    const onRecord = vi.fn();
    const { user, menu } = await openComposerMenu({
      startControls: createMenu([
        {
          id: 'record',
          label: 'Record a voice note',
          description: 'Up to two minutes',
          icon: 'audio',
          isDisabled: true,
          disabledReason: 'Allow the microphone first',
          onAction: onRecord,
        },
      ]),
    });
    const calendar = within(menu).getByRole('menuitem', { name: /^Calendar/ });
    expect(calendar).toHaveAccessibleName('Calendar Shared schedule Control Shift K');
    expect(calendar.querySelector('.ui-menu-item__icon [data-glyph="calendar"]')).not.toBeNull();
    expect(calendar.querySelector('.ui-menu-item__description')).toHaveTextContent(
      'Shared schedule',
    );
    expect(calendar.querySelector('.ui-menu-item__shortcut')).not.toBeNull();
    const record = within(menu).getByRole('menuitem', {
      name: 'Record a voice note Allow the microphone first',
    });
    expect(record).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(record).toHaveFocus());
    await user.keyboard('{Enter}');
    await user.click(record);
    expect(onRecord).not.toHaveBeenCalled();
    expect(menu).toBeInTheDocument();
    const people = within(menu).getByRole('menuitem', { name: 'People Mention someone' });
    expect(people).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(people);
    const submenu = await screen.findByRole('menu', { name: /^People/ });
    expect(submenu).toHaveClass('ui-menu', 'ui-message-composer__menu');
    await user.click(within(submenu).getByRole('menuitem', { name: 'Maria Santos' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(input()).toHaveValue('@Maria Santos ');
  });

  it('UIC-MESSAGE-COMPOSER-5.3 inserts text at the caret and gives focus back to the input after it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MessageComposer
        defaultValue="Plan the  trip"
        onChange={onChange}
        startControls={createMenu([
          {
            id: 'goal',
            label: 'Insert a goal prompt',
            onAction: (composer) => composer.insertText('weekend'),
          },
        ])}
      />,
    );
    await user.click(input());
    input().setSelectionRange(9, 9);
    await user.click(trigger());
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Insert a goal prompt' }));
    expect(onChange).toHaveBeenLastCalledWith('Plan the weekend trip');
    await waitFor(() => expect(input()).toHaveFocus());
    expect(input().selectionStart).toBe(16);
  });

  it('UIC-MESSAGE-COMPOSER-5.3 inserts a mention or command as its text in the plain composer', async () => {
    const user = userEvent.setup();
    render(
      <MessageComposer
        startControls={createMenu([
          {
            id: 'summarize',
            label: 'Summarize',
            onAction: (composer) =>
              composer.insertPill({ kind: 'command', id: 'summarize', label: 'summarize' }),
          },
        ])}
      />,
    );
    await user.type(input(), 'Ask ');
    await user.click(trigger());
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Summarize' }));
    expect(input()).toHaveValue('Ask /summarize ');
    await waitFor(() => expect(input()).toHaveFocus());
    expect(input().selectionStart).toBe(15);
  });

  it('UIC-MESSAGE-COMPOSER-5.3 UIC-MESSAGE-COMPOSER-3.2 attaches files from a menu item through the chooser, and drops and pastes still attach', async () => {
    const onAttach = vi.fn();
    const click = vi.spyOn(HTMLInputElement.prototype, 'click');
    const { user, menu, container } = await openComposerMenu({
      onAttach,
      startControls: createMenu([
        { id: 'files', label: 'Attach files', onAction: (composer) => composer.attachFiles() },
      ]),
    });
    const chooser = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!chooser) throw new Error('no chooser');
    expect(chooser).toHaveAttribute('multiple');
    await user.click(within(menu).getByRole('menuitem', { name: 'Attach files' }));
    expect(click.mock.contexts).toContain(chooser);
    const notes = new File(['x'], 'Notes.txt', { type: 'text/plain' });
    await user.upload(chooser, notes);
    expect(onAttach).toHaveBeenLastCalledWith([notes]);
    await user.click(input());
    const photo = new File(['x'], 'Photo.png', { type: 'image/png' });
    const clipboard = { types: ['Files'], files: [photo], items: [], getData: () => '' };
    await user.paste(clipboard as unknown as DataTransfer);
    expect(onAttach).toHaveBeenLastCalledWith([photo]);
  });

  it('UIC-MESSAGE-COMPOSER-5.3 moves focus to the input once the menu closes', async () => {
    const { user, menu } = await openComposerMenu({
      startControls: createMenu([
        { id: 'focus', label: 'Write', onAction: (composer) => composer.focusInput() },
      ]),
    });
    await user.click(within(menu).getByRole('menuitem', { name: 'Write' }));
    await waitFor(() => expect(input()).toHaveFocus());
  });

  it('UIC-MESSAGE-COMPOSER-5.4 flips a toggle, reports its state and keeps the menu open', async () => {
    const onSelectedChange = vi.fn();
    const onAction = vi.fn();
    function Composer() {
      const [isPlanning, setPlanning] = useState(false);
      return (
        <MessageComposer
          startControls={createMenu([
            { id: 'note', label: 'Add a note' },
            {
              id: 'plan',
              label: 'Plan mode',
              description: 'Outline before answering',
              isSelected: isPlanning,
              onSelectedChange: (next) => {
                onSelectedChange(next);
                setPlanning(next);
              },
              onAction,
            },
          ])}
        />
      );
    }
    const user = userEvent.setup();
    render(<Composer />);
    await user.click(trigger());
    const menu = await screen.findByRole('menu');
    const plan = within(menu).getByRole('menuitemcheckbox', {
      name: 'Plan mode Outline before answering',
    });
    expect(plan).not.toBeChecked();
    expect(within(menu).getByRole('menuitem', { name: 'Add a note' })).toBeInTheDocument();
    await user.click(plan);
    expect(onSelectedChange).toHaveBeenLastCalledWith(true);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(plan).toBeChecked();
    expect(menu).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
    expect(plan).not.toBeChecked();
    expect(menu).toBeInTheDocument();
  });

  it('UIC-MESSAGE-COMPOSER-5.5 narrows the items by label and note from an opt-in search field', async () => {
    const { user, menu } = await openComposerMenu({
      startControls: createMenu(
        [{ id: 'note', label: 'Add a note', description: 'Shown to everyone' }],
        true,
      ),
    });
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await waitFor(() => expect(search).toHaveFocus());
    await user.keyboard('schedule');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual([expect.stringMatching(/^Calendar/)]);
    expect(within(menu).queryByRole('group', { name: 'Add' })).not.toBeInTheDocument();
    await user.clear(search);
    await user.keyboard('note');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(1);
    expect(
      within(menu).getByRole('menuitem', { name: 'Add a note Shown to everyone' }),
    ).toBeVisible();
  });

  it('UIC-MESSAGE-COMPOSER-5.5 shows no search field unless asked', async () => {
    await openComposerMenu({ startControls: createMenu([{ id: 'note', label: 'Add a note' }]) });
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('UIC-MESSAGE-COMPOSER-5.1 UIC-MESSAGE-COMPOSER-1.4 disables the + button with the composer', async () => {
    const user = userEvent.setup();
    render(
      <MessageComposer
        isDisabled
        startControls={createMenu([{ id: 'note', label: 'Add a note' }])}
      />,
    );
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
