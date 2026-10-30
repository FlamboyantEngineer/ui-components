import { CheckGlyph, HandRaisedGlyph, ListTaskGlyph } from '../../core/glyphs.js';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { installComposerRow } from '../../../test/composer-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { useMessageComposerControls } from './composer-controls.js';
import { MessageComposerMenuButton } from './composer-menu.js';
import { MessageComposerSelect } from './composer-select.js';
import { MessageComposerToggle } from './composer-toggle.js';
import {
  MessageComposerAttachButton,
  MessageComposerEmojiButton,
  MessageComposerSendButton,
} from './composer-tools.js';
import { MessageComposer } from './message-composer.js';

const approval = [
  { id: 'ask', label: 'Ask first', icon: HandRaisedGlyph },
  { id: 'auto', label: 'Run on its own', icon: CheckGlyph },
] as const;

const names = (group: Element | null) =>
  within(group as HTMLElement)
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label') ?? button.textContent);

/** A host's own control that drops its label while the composer is compact. */
function TimerControl() {
  const { isCompact, isDisabled } = useMessageComposerControls();
  return (
    <button disabled={isDisabled} aria-label="Timer">
      {isCompact ? '⏱' : '⏱ Timer'}
    </button>
  );
}

describe('MessageComposer controls', () => {
  it('UIC-MESSAGE-COMPOSER-6.1 ships the controls from the package root and the entry point', () => {
    const root = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(root).toContain("export * from './components/message-composer/index.js';");
    const entry = readFileSync(
      join(process.cwd(), 'src/components/message-composer/index.ts'),
      'utf8',
    );
    for (const name of [
      'MessageComposerMenuButton',
      'MessageComposerAttachButton',
      'MessageComposerEmojiButton',
      'MessageComposerSendButton',
      'MessageComposerSelect',
      'MessageComposerToggle',
      'useMessageComposerControls',
    ]) {
      expect(entry).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('UIC-MESSAGE-COMPOSER-6.1 UIC-MESSAGE-COMPOSER-6.2 places any controls in order at the start and the end', () => {
    const { container } = render(
      <MessageComposer
        onAttach={() => undefined}
        startControls={
          <>
            <MessageComposerToggle label="Plan" icon={ListTaskGlyph} />
            <MessageComposerMenuButton sections={[]} className="extra" data-testid="probe" />
            <MessageComposerAttachButton />
          </>
        }
        endControls={
          <>
            <MessageComposerSelect label="Approval" options={approval} />
            <MessageComposerEmojiButton id="emoji" />
          </>
        }
      />,
    );
    expect(names(container.querySelector('.ui-message-composer__start'))).toEqual([
      'Plan',
      'Add and more',
      'Attach files',
    ]);
    expect(names(container.querySelector('.ui-message-composer__end'))).toEqual([
      'Approval: Ask first',
      'Insert emoji',
      'Send',
    ]);
    const menuButton = screen.getByRole('button', { name: 'Add and more' });
    expect(menuButton).toHaveClass('ui-message-composer__menu-button', 'extra');
    expect(menuButton).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('button', { name: 'Insert emoji' })).toHaveAttribute('id', 'emoji');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
      slots: ['footer', 'start', 'end', 'menu-button', 'attach', 'emoji', 'select', 'toggle'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-MESSAGE-COMPOSER-6.2 keeps an empty start group and refuses built-in controls outside a composer', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = render(<MessageComposer />);
    expect(container.querySelector('.ui-message-composer__start')).toBeEmptyDOMElement();
    expect(() => render(<MessageComposerEmojiButton />)).toThrow(
      'MessageComposerEmojiButton must be placed in a message composer',
    );
    expect(() => render(<MessageComposerSendButton />)).toThrow(/MessageComposerSendButton/);
  });

  it('UIC-MESSAGE-COMPOSER-6.3 puts the send button where the host places it, and no other', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container, rerender } = render(
      <MessageComposer
        defaultValue="Hello"
        onSubmit={onSubmit}
        startControls={<MessageComposerSendButton className="lead" />}
        endControls={<MessageComposerToggle label="Plan" icon={ListTaskGlyph} />}
      />,
    );
    expect(names(container.querySelector('.ui-message-composer__start'))).toEqual(['Send']);
    expect(names(container.querySelector('.ui-message-composer__end'))).toEqual(['Plan']);
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveClass('ui-message-composer__action', 'lead');
    await user.click(send);
    expect(onSubmit).toHaveBeenCalledWith('Hello');
    rerender(
      <MessageComposer
        editValue="Edited"
        onCancel={() => undefined}
        startControls={<MessageComposerSendButton />}
      />,
    );
    expect(names(container.querySelector('.ui-message-composer__start'))).toEqual([
      'Cancel',
      'Save',
    ]);
    rerender(<MessageComposer startControls={null} />);
    expect(names(container.querySelector('.ui-message-composer__end'))).toEqual(['Send']);
  });

  it('UIC-MESSAGE-COMPOSER-6.4 turns compact when the controls overflow the row, until the row fits them again', () => {
    const row = installComposerRow();
    const { container } = render(
      <MessageComposer
        startControls={<MessageComposerToggle label="Plan" icon={ListTaskGlyph} />}
        endControls={<MessageComposerSelect label="Approval" options={approval} />}
      />,
    );
    const root = container.querySelector('.ui-message-composer');
    row.resize(container, 400, 380);
    expect(root).not.toHaveAttribute('data-compact');
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveTextContent('Plan');
    row.resize(container, 300, 360);
    expect(root).toHaveAttribute('data-compact', 'true');
    const plan = screen.getByRole('button', { name: 'Plan' });
    expect(plan).toHaveAttribute('data-content', 'icon');
    expect(plan).not.toHaveTextContent('Plan');
    expect(screen.getByRole('button', { name: 'Approval: Ask first' })).toHaveAttribute(
      'data-content',
      'icon',
    );
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['select', 'toggle'] });
    // Without the labels the content fits, but the row stays compact until the labels would.
    row.resize(container, 340, 200);
    expect(root).toHaveAttribute('data-compact', 'true');
    row.resize(container, 360, 200);
    expect(root).not.toHaveAttribute('data-compact');
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveTextContent('Plan');
  });

  it('UIC-MESSAGE-COMPOSER-6.5 tells a host control whether the composer is compact or disabled', () => {
    const row = installComposerRow();
    const { container, rerender } = render(<MessageComposer startControls={<TimerControl />} />);
    const timer = screen.getByRole('button', { name: 'Timer' });
    expect(timer).toHaveTextContent('⏱ Timer');
    row.resize(container, 100, 200);
    expect(timer).toHaveTextContent(/^⏱$/);
    rerender(<MessageComposer isDisabled startControls={<TimerControl />} />);
    expect(timer).toBeDisabled();
    rerender(<TimerControl />);
    expect(screen.getByRole('button', { name: 'Timer' })).toHaveTextContent('⏱ Timer');
    expect(screen.getByRole('button', { name: 'Timer' })).toBeEnabled();
  });
});
