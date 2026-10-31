import { fireEvent, render, screen, type RenderResult } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDeferredCompletions,
  expectReplacedSourceDropsCompletions,
  expectReplacedValueDropsCompletions,
} from '../../../test/completion-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { collectPackages } from '../../../test/module-imports.js';
import {
  createTriggerCompletions,
  type Completion,
  type Completions,
} from '../completion-list/completion-list.js';
import { MessageComposerAttachButton, MessageComposerEmojiButton } from './composer-tools.js';
import { MessageComposer, type MessageComposerProps } from './message-composer.js';

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const action = () => screen.getByRole('button');
const root = (container: HTMLElement) => container.querySelector('.ui-message-composer');

/** Makes the primary pointer coarse, as on a touch screen. */
function stubCoarsePointer() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(pointer: coarse)',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

afterEach(() => vi.unstubAllGlobals());

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
  it('UIC-COMPLETION-LIST-2.6 drops completions for a draft the host replaced', async () => {
    const { source, answer } = createDeferredCompletions();
    const changes: string[] = [];
    let view: RenderResult | undefined;
    const show = (value: string) => {
      const composer = (
        <MessageComposer
          value={value}
          onChange={(next) => changes.push(next)}
          completions={source}
        />
      );
      if (view) view.rerender(composer);
      else view = render(composer);
    };
    await expectReplacedValueDropsCompletions({ show, answer, changes: () => changes });
    expect(input()).toHaveValue('other text');
  });

  it('UIC-COMPLETION-LIST-2.7 drops completions from a source the host replaced', async () => {
    const changes: string[] = [];
    let view: RenderResult | undefined;
    const show = (completions: Completions) => {
      const composer = (
        <MessageComposer
          defaultValue="a"
          onChange={(next) => changes.push(next)}
          completions={completions}
        />
      );
      if (view) view.rerender(composer);
      else view = render(composer);
    };
    await expectReplacedSourceDropsCompletions({ show, changes: () => changes });
  });

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
    const { unmount } = render(
      <Controlled shortcuts={{ send: 'Ctrl+Enter' }} onSubmit={onSubmit} />,
    );
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

  it('UIC-MESSAGE-COMPOSER-1.2 sends on Ctrl+Enter with the Enter chord and never during a composition', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageComposer defaultValue="こんにちは" onSubmit={onSubmit} />);
    await user.click(input());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- the Enter some browsers report as a composition ends
    fireEvent.keyDown(input(), { key: 'Enter', keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('こんにちは');
  });

  it('UIC-MESSAGE-COMPOSER-1.2 sends on the host chords, one or several, and breaks the line on any other Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { unmount } = render(
      <MessageComposer shortcuts={{ send: 'Shift+Enter' }} onSubmit={onSubmit} />,
    );
    expect(action()).toHaveAttribute('aria-keyshortcuts', 'Shift+Enter');
    await user.click(input());
    await user.keyboard('One{Enter}Two{Control>}{Enter}{/Control}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSubmit).toHaveBeenCalledWith('One\nTwo');
    unmount();
    render(<MessageComposer shortcuts={{ send: ['Alt+Enter', 'Ctrl+S'] }} onSubmit={onSubmit} />);
    expect(action()).toHaveAttribute('aria-keyshortcuts', 'Alt+Enter');
    await user.click(input());
    await user.keyboard('Three{Alt>}{Enter}{/Alt}Four{Control>}s{/Control}');
    expect(onSubmit.mock.calls.slice(1)).toEqual([['Three'], ['Four']]);
  });

  it('UIC-MESSAGE-COMPOSER-1.7 breaks the line on Enter on a touch screen and sends on Ctrl+Enter', async () => {
    stubCoarsePointer();
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageComposer defaultValue="One" onSubmit={onSubmit} />);
    expect(action()).toHaveAttribute(
      'aria-keyshortcuts',
      expect.stringMatching(/^(Control|Meta)\+Enter$/),
    );
    await user.click(input());
    await user.keyboard('{End}{Enter}Two');
    expect(input()).toHaveValue('One\nTwo');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('One\nTwo');
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

  it('UIC-MESSAGE-COMPOSER-3.8 sends while pending with allowsPendingSubmit, offering Stop when empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const { container, rerender } = render(
      <MessageComposer isPending allowsPendingSubmit onSubmit={onSubmit} onStop={onStop} />,
    );
    expect(root(container)).toHaveAttribute('data-pending', 'true');
    const stop = screen.getByRole('button', { name: 'Stop' });
    await user.click(input());
    await user.keyboard('Then the dessert');
    expect(screen.getByRole('button', { name: 'Send' })).toBe(stop);
    expect(container.querySelector('.ui-button__spinner')).toBeNull();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Then the dessert');
    expect(input()).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    rerender(<MessageComposer isPending allowsPendingSubmit onSubmit={onSubmit} />);
    await user.click(input());
    await user.keyboard('More');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenLastCalledWith('More');
  });

  it('UIC-MESSAGE-COMPOSER-3.10 queues on Enter and sends now on Ctrl+Enter while a reply runs', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onSubmitNow = vi.fn();
    const { rerender } = render(
      <MessageComposer
        isPending
        allowsPendingSubmit
        onSubmit={onSubmit}
        onSubmitNow={onSubmitNow}
      />,
    );
    await user.click(input());
    await user.keyboard('Later{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Later');
    await user.keyboard('Right away{Control>}{Enter}{/Control}');
    expect(onSubmitNow).toHaveBeenCalledWith('Right away');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(input()).toHaveValue('');
    rerender(<MessageComposer onSubmit={onSubmit} onSubmitNow={onSubmitNow} />);
    await user.keyboard('Idle{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenLastCalledWith('Idle');
    expect(onSubmitNow).toHaveBeenCalledTimes(1);
  });

  it('UIC-MESSAGE-COMPOSER-3.10 takes the host chords for each state, and queues on the send-now chord without onSubmitNow', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onSubmitNow = vi.fn();
    const shortcuts = { send: 'Enter', queue: 'Ctrl+Enter', sendNow: 'Ctrl+Shift+Enter' };
    const { rerender } = render(
      <MessageComposer
        isPending
        allowsPendingSubmit
        shortcuts={shortcuts}
        onSubmit={onSubmit}
        onSubmitNow={onSubmitNow}
      />,
    );
    expect(action()).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    await user.click(input());
    await user.keyboard('A{Enter}B{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('A\nB');
    await user.keyboard('C{Control>}{Shift>}{Enter}{/Shift}{/Control}');
    expect(onSubmitNow).toHaveBeenCalledWith('C');
    rerender(<MessageComposer isPending allowsPendingSubmit onSubmit={onSubmit} />);
    await user.keyboard('D{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenLastCalledWith('D');
    rerender(<MessageComposer shortcuts={shortcuts} onSubmit={onSubmit} />);
    expect(action()).toHaveAttribute('aria-keyshortcuts', 'Enter');
    await user.keyboard('E{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('E');
  });

  it('UIC-MESSAGE-COMPOSER-1.7 UIC-MESSAGE-COMPOSER-3.10 breaks the line on Enter on a touch screen while a reply runs', async () => {
    stubCoarsePointer();
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onSubmitNow = vi.fn();
    render(
      <MessageComposer
        isPending
        allowsPendingSubmit
        onSubmit={onSubmit}
        onSubmitNow={onSubmitNow}
      />,
    );
    expect(action()).not.toHaveAttribute('aria-keyshortcuts');
    await user.click(input());
    await user.keyboard('One{Enter}Two');
    expect(input()).toHaveValue('One\nTwo');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmitNow).toHaveBeenCalledWith('One\nTwo');
  });

  it('UIC-MESSAGE-COMPOSER-1.4 UIC-MESSAGE-COMPOSER-2.2 disables the text area and every button', () => {
    const { container } = render(
      <MessageComposer
        defaultValue="Hi"
        isDisabled
        editValue="Hello"
        onAttach={() => undefined}
        startControls={
          <>
            <MessageComposerAttachButton />
            <MessageComposerEmojiButton />
          </>
        }
      />,
    );
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(input()).toBeDisabled();
    for (const name of ['Attach files', 'Insert emoji', 'Cancel', 'Save']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });

  it('UIC-MESSAGE-COMPOSER-1.5 shows attachments above and the row of controls below the input', () => {
    const { container } = render(
      <MessageComposer
        attachments={<span>Report.pdf</span>}
        startControls={<button>Tone</button>}
      />,
    );
    const attachments = container.querySelector('.ui-message-composer__attachments');
    expect(attachments).toHaveTextContent('Report.pdf');
    expect(attachments?.nextElementSibling).toBe(input());
    const footer = container.querySelector('.ui-message-composer__footer');
    expect(footer?.previousElementSibling).toBe(input());
    expect(footer?.firstElementChild).toHaveClass('ui-message-composer__start');
    expect(footer?.firstElementChild).toHaveTextContent('Tone');
    expect(footer?.lastElementChild).toHaveClass('ui-message-composer__end');
    expect(footer?.lastElementChild?.lastElementChild).toHaveAccessibleName('Send');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
      slots: ['attachments', 'input', 'footer', 'start', 'end', 'action'],
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

  it('UIC-MESSAGE-COMPOSER-4.1 keeps the rich engine out of the package root and the plain composer', () => {
    const engine = /^(prosemirror-|@handlewithcare\/)/;
    expect(collectPackages('src/index.ts').filter((name) => engine.test(name))).toEqual([]);
    const rich = collectPackages('src/components/message-composer/rich/index.ts');
    expect(rich.filter((name) => engine.test(name))).toContain('prosemirror-state');
    const entry = readFileSync(
      join(process.cwd(), 'src/components/message-composer/rich/index.ts'),
      'utf8',
    );
    expect(entry).toMatch(/export \{ RichMessageComposer \}/);
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

  it('UIC-MESSAGE-COMPOSER-2.1 keeps the caller ref attached while the reader types', async () => {
    const user = userEvent.setup();
    const ref = vi.fn();
    render(<MessageComposer aria-label="Reply" ref={ref} onSubmit={() => undefined} />);
    await user.type(screen.getByRole('textbox', { name: 'Reply' }), 'Hello');
    expect(ref.mock.calls).toEqual([[screen.getByRole('textbox', { name: 'Reply' })]]);
  });
});
