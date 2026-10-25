import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { MessageComposer, type MessageComposerProps } from './message-composer.js';

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const root = (container: HTMLElement) => container.querySelector('.ui-message-composer');

/** A composer that edits `Lunch at noon?` while the test says so, recording what it saves. */
function Editing(props: Partial<MessageComposerProps>) {
  const [editValue, setEditValue] = useState<string | undefined>(props.editValue);
  return (
    <>
      <button onClick={() => setEditValue('Lunch at noon?')}>Edit</button>
      <MessageComposer
        {...props}
        editValue={editValue}
        onCancel={() => setEditValue(undefined)}
        onEditLast={() => setEditValue('Lunch at noon?')}
        onSubmit={(value) => {
          props.onSubmit?.(value);
          setEditValue(undefined);
        }}
      />
    </>
  );
}

describe('MessageComposer conversations', () => {
  it('UIC-MESSAGE-COMPOSER-3.3 edits a message with Save and Cancel and leaves the draft alone', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <Editing defaultValue="My draft" onSubmit={onSubmit} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(root(container)).toHaveAttribute('data-editing', 'true');
    expect(input()).toHaveValue('Lunch at noon?');
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveClass('ui-message-composer__action');
    expect(save).toHaveAttribute('aria-keyshortcuts', 'Enter');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['cancel', 'action'] });
    await user.click(input());
    await user.keyboard('{End} Or one?{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Lunch at noon? Or one?');
    expect(onChange).not.toHaveBeenCalled();
    expect(input()).toHaveValue('My draft');
    expect(root(container)).not.toHaveAttribute('data-editing');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(input()).toHaveValue('My draft');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(input());
    await user.keyboard('{Escape}');
    expect(input()).toHaveValue('My draft');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-MESSAGE-COMPOSER-3.4 edits the last message on Up in an empty composer only', async () => {
    const user = userEvent.setup();
    const keys: string[] = [];
    render(<Editing onKeyDown={(event) => keys.push(event.key)} />);
    await user.click(input());
    await user.keyboard('x{ArrowUp}');
    expect(input()).toHaveValue('x');
    expect(keys).toEqual(['x', 'ArrowUp']);
    await user.keyboard('{Backspace}{Shift>}{ArrowUp}{/Shift}');
    expect(input()).toHaveValue('');
    await user.keyboard('{ArrowUp}');
    expect(input()).toHaveValue('Lunch at noon?');
    await user.keyboard('{ArrowUp}');
    expect(input()).toHaveValue('Lunch at noon?');
  });

  it('UIC-MESSAGE-COMPOSER-3.5 recalls earlier messages until the reader edits one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MessageComposer history={['First', 'Second\nline']} onChange={onChange} />);
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveValue('');
    await user.keyboard('{ArrowUp}');
    expect(input()).toHaveValue('Second\nline');
    expect(onChange).toHaveBeenLastCalledWith('Second\nline');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(input()).toHaveValue('First');
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveValue('Second\nline');
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveValue('');
    await user.keyboard('{ArrowUp}{ArrowUp}!');
    expect(input()).toHaveValue('First!');
    await user.keyboard('{ArrowUp}{ArrowDown}');
    expect(input()).toHaveValue('First!');
  });

  it('UIC-MESSAGE-COMPOSER-3.6 keeps the draft in the provider storage per key', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ 'draft:b': '{"text":"Stored","tokens":[]}' });
    const onSubmit = vi.fn();
    function Conversation({ draftKey }: { draftKey: string }) {
      return (
        <UiProvider storage={storage}>
          <MessageComposer persistKey={draftKey} defaultValue="Hello" onSubmit={onSubmit} />
        </UiProvider>
      );
    }
    const { rerender, unmount } = render(<Conversation draftKey="draft:a" />);
    expect(input()).toHaveValue('Hello');
    await user.click(input());
    await user.keyboard(' there');
    expect(storage.getItem('draft:a')).toBe('{"text":"Hello there","tokens":[]}');
    rerender(<Conversation draftKey="draft:b" />);
    expect(input()).toHaveValue('Stored');
    rerender(<Conversation draftKey="draft:a" />);
    expect(input()).toHaveValue('Hello there');
    await user.click(input());
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Hello there');
    expect(storage.getItem('draft:a')).toBe('{"text":"","tokens":[]}');
    unmount();
    storage.setItem('draft:c', '{"text":3}');
    render(<Conversation draftKey="draft:c" />);
    expect(input()).toHaveValue('Hello');
  });
});
