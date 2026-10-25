import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { createTriggerCompletions, type Completion } from '../completion-list/completion-list.js';
import { MessageComposer, type MessageComposerProps } from './message-composer.js';

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const action = () => screen.getByRole('button');
const root = (container: HTMLElement) => container.querySelector('.ui-message-composer');

const people: Completion[] = [
  { label: 'Maria Santos', insertText: '@Maria ' },
  { label: 'Jon Berg', insertText: '@Jon ' },
];

/** A composer whose text the test controls, recording what it sends. */
function Controlled(props: Omit<MessageComposerProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState('Draft');
  return <MessageComposer {...props} value={value} onChange={setValue} />;
}

describe('MessageComposer', () => {
  it('UIC-MESSAGE-COMPOSER-1.1 UIC-MESSAGE-COMPOSER-2.2 edits its text in a named text area that grows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <MessageComposer
        defaultValue="Hi"
        placeholder="Write a message"
        maxLength={40}
        maxRows={3}
        onChange={onChange}
      />,
    );
    const area = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Message' });
    expect(area).toHaveValue('Hi');
    expect(area).toHaveAttribute('placeholder', 'Write a message');
    expect(area).toHaveAttribute('maxlength', '40');
    expect(area).toHaveAttribute('rows', '1');
    area.style.lineHeight = '20px';
    area.style.padding = '0px';
    Object.defineProperty(area, 'scrollHeight', {
      configurable: true,
      get: () => area.value.split('\n').length * 20,
    });
    await user.type(area, '{Shift>}{Enter}{/Shift}there');
    expect(onChange).toHaveBeenLastCalledWith('Hi\nthere');
    expect(area.style.height).toBe('40px');
    await user.type(area, '{Shift>}{Enter}{Enter}{Enter}{/Shift}');
    expect(area.style.height).toBe('60px');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['input', 'footer', 'action'] });
  });

  it('UIC-MESSAGE-COMPOSER-1.2 sends on Enter or the button and empties, keeping blank text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageComposer onSubmit={onSubmit} />);
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveAttribute('aria-disabled', 'true');
    expect(send).toHaveAttribute('aria-keyshortcuts', 'Enter');
    await user.click(input());
    await user.keyboard('   {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input()).toHaveValue('   ');
    await user.keyboard('Hello{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('   Hello');
    expect(input()).toHaveValue('');
    await user.keyboard('Again');
    await user.click(send);
    expect(onSubmit).toHaveBeenLastCalledWith('Again');
    expect(input()).toHaveValue('');
    expect(input()).toHaveFocus();
  });

  it('UIC-MESSAGE-COMPOSER-1.2 sends on Ctrl+Enter when asked, empties a controlled text and sends blank text when allowed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { unmount } = render(<Controlled submitShortcut="Ctrl+Enter" onSubmit={onSubmit} />);
    expect(action()).toHaveAttribute('aria-keyshortcuts', expect.stringMatching(/Enter$/));
    await user.click(input());
    await user.keyboard('{End}{Enter}line');
    expect(input()).toHaveValue('Draft\nline');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('Draft\nline');
    expect(input()).toHaveValue('');
    unmount();
    render(<MessageComposer allowsEmptySubmit onSubmit={onSubmit} />);
    await user.click(action());
    expect(onSubmit).toHaveBeenLastCalledWith('');
  });

  it('UIC-MESSAGE-COMPOSER-1.3 waits while pending and offers Stop with onStop', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const { container, rerender } = render(
      <MessageComposer defaultValue="Next" isPending onSubmit={onSubmit} onStop={onStop} />,
    );
    expect(root(container)).toHaveAttribute('data-pending', 'true');
    const stop = screen.getByRole('button', { name: 'Stop' });
    await user.click(input());
    await user.keyboard('{End}{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input()).toHaveValue('Next');
    await user.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
    rerender(<MessageComposer defaultValue="Next" onSubmit={onSubmit} onStop={onStop} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBe(stop);
    rerender(<MessageComposer defaultValue="Next" isPending onSubmit={onSubmit} />);
    expect(container.querySelector('.ui-button__spinner')).not.toBeNull();
    expect(root(container)).toHaveAttribute('data-pending', 'true');
  });

  it('UIC-MESSAGE-COMPOSER-1.4 disables the text area and the button', () => {
    const { container } = render(<MessageComposer defaultValue="Hi" isDisabled />);
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(input()).toBeDisabled();
    expect(action()).toBeDisabled();
  });

  it('UIC-MESSAGE-COMPOSER-1.5 shows attachments above and tools before the button', () => {
    const { container } = render(
      <MessageComposer attachments={<span>Report.pdf</span>} toolbar={<button>Attach</button>} />,
    );
    const attachments = container.querySelector('.ui-message-composer__attachments');
    expect(attachments).toHaveTextContent('Report.pdf');
    expect(attachments?.nextElementSibling).toBe(input());
    const footer = container.querySelector('.ui-message-composer__footer');
    expect(footer?.firstElementChild).toHaveClass('ui-message-composer__toolbar');
    expect(footer?.firstElementChild).toHaveTextContent('Attach');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
      slots: ['attachments', 'input', 'footer', 'toolbar', 'action'],
    });
  });

  it('UIC-MESSAGE-COMPOSER-1.6 completes mentions, inserting on Enter instead of sending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const mentions = createTriggerCompletions([{ character: '@', getCompletions: () => people }]);
    render(
      <MessageComposer
        completions={mentions}
        renderCompletion={(person) => `Person: ${person.label}`}
        onSubmit={onSubmit}
      />,
    );
    await user.click(input());
    await user.keyboard('Ask @');
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Person: Maria Santos',
      'Person: Jon Berg',
    ]);
    expect(document.querySelector('.ui-message-composer__completions')).toHaveClass(
      'ui-completion-list',
    );
    expect(input()).toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input()).toHaveValue('Ask @Jon ');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('now{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Ask @Jon now');
  });

  it('UIC-MESSAGE-COMPOSER-2.1 forwards attributes to the root and the ref and handlers to the text area', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLTextAreaElement>();
    const keys: string[] = [];
    const onFocus = vi.fn();
    const { container } = render(
      <>
        <span id="label">Reply</span>
        <MessageComposer
          id="composer"
          className="caller"
          data-testid="probe"
          aria-labelledby="label"
          ref={ref}
          onFocus={onFocus}
          onKeyDown={(event) => keys.push(event.key)}
          onSubmit={() => undefined}
        />
      </>,
    );
    const composer = root(container);
    expect(composer).toHaveAttribute('id', 'composer');
    expect(composer).toHaveClass('ui-message-composer', 'caller');
    expect(composer).toHaveAttribute('data-testid', 'probe');
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Reply' }));
    await user.click(input());
    expect(onFocus).toHaveBeenCalled();
    await user.keyboard('a{Enter}');
    expect(keys).toEqual(['a']);
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { callerAttributes: ['data-testid'] });
  });
});
