import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { ShortcutChord, ShortcutSequence } from './shortcut-format.js';
import { type ShortcutOptions, ShortcutScope, useShortcut } from './shortcut-scope.js';

interface ActionProps extends ShortcutOptions {
  name: string;
  shortcut: ShortcutChord | ShortcutSequence | null;
  onPress: (name: string) => void;
}

/** A button that runs on its shortcut and publishes it as `aria-keyshortcuts`. */
function Action({ name, shortcut, onPress, ...options }: ActionProps) {
  const { ariaKeyShortcuts } = useShortcut(shortcut, () => onPress(name), options);
  return (
    <button type="button" aria-keyshortcuts={ariaKeyShortcuts}>
      {name}
    </button>
  );
}

function press(init: KeyboardEventInit, target: EventTarget = document.body) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ShortcutScope and useShortcut', () => {
  it('UIC-SHORTCUT-4.1 answers in the innermost focused scope once, then outer scopes, then the document', async () => {
    const user = userEvent.setup();
    const ran = vi.fn();
    render(
      <>
        <Action name="Document" shortcut="N" onPress={ran} />
        <ShortcutScope aria-label="Outer">
          <Action name="Outer" shortcut="N" onPress={ran} />
          <ShortcutScope>
            <Action name="Inner" shortcut="N" onPress={ran} />
          </ShortcutScope>
        </ShortcutScope>
      </>,
    );
    screen.getByRole('button', { name: 'Inner' }).focus();
    await user.keyboard('n');
    expect(ran.mock.calls).toEqual([['Inner']]);
    screen.getByRole('button', { name: 'Outer' }).focus();
    await user.keyboard('n');
    screen.getByRole('button', { name: 'Document' }).focus();
    await user.keyboard('n');
    expect(ran.mock.calls).toEqual([['Inner'], ['Outer'], ['Document']]);
    expectHooksMatchSpec(document.body, 'SHORTCUT');
  });

  it('UIC-SHORTCUT-4.1 lets the latest of one scope claim, and a disabled scope or shortcut stay silent', async () => {
    const user = userEvent.setup();
    const ran = vi.fn();
    const { rerender } = render(
      <ShortcutScope>
        <Action name="First" shortcut="Ctrl+J" onPress={ran} />
        <Action name="Second" shortcut="Ctrl+J" onPress={ran} />
      </ShortcutScope>,
    );
    screen.getByRole('button', { name: 'First' }).focus();
    await user.keyboard('{Control>}j{/Control}');
    expect(ran.mock.calls).toEqual([['Second']]);
    rerender(
      <ShortcutScope isDisabled>
        <Action name="First" shortcut="Ctrl+J" onPress={ran} />
        <Action name="Second" shortcut="Ctrl+J" onPress={ran} />
      </ShortcutScope>,
    );
    expect(document.querySelector('.ui-shortcut-scope')).toHaveAttribute('data-disabled', 'true');
    await user.keyboard('{Control>}j{/Control}');
    rerender(
      <ShortcutScope>
        <Action name="First" shortcut="Ctrl+J" onPress={ran} />
        <Action name="Second" shortcut="Ctrl+J" onPress={ran} isDisabled />
      </ShortcutScope>,
    );
    await user.keyboard('{Control>}j{/Control}');
    expect(ran.mock.calls).toEqual([['Second'], ['First']]);
  });

  it('UIC-SHORTCUT-4.2 leaves a press in a modal to the scopes within it, and a handled press alone', () => {
    const ran = vi.fn();
    render(
      <>
        <Action name="Document" shortcut="Ctrl+J" onPress={ran} />
        <div role="dialog" aria-modal="true" aria-label="Settings">
          <ShortcutScope>
            <Action name="Dialog" shortcut="Ctrl+J" onPress={ran} />
          </ShortcutScope>
          <button type="button">Plain</button>
        </div>
      </>,
    );
    press({ key: 'j', ctrlKey: true }, screen.getByRole('button', { name: 'Plain' }));
    expect(ran).not.toHaveBeenCalled();
    const event = press(
      { key: 'j', ctrlKey: true },
      screen.getByRole('button', { name: 'Dialog' }),
    );
    expect(ran.mock.calls).toEqual([['Dialog']]);
    expect(event.defaultPrevented).toBe(true);
    const handled = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    act(() => {
      document.body.dispatchEvent(handled);
    });
    expect(ran).toHaveBeenCalledTimes(1);
  });

  it('UIC-SHORTCUT-4.3 runs a sequence, and expires or cancels it predictably', () => {
    vi.useFakeTimers();
    const ran = vi.fn();
    render(<Action name="Inbox" shortcut={['G', 'I']} onPress={ran} sequenceTimeout={500} />);
    expect(screen.getByRole('button', { name: 'Inbox' })).not.toHaveAttribute('aria-keyshortcuts');
    expect(press({ key: 'g' }).defaultPrevented).toBe(true);
    press({ key: 'Shift' });
    press({ key: 'i' });
    expect(ran).toHaveBeenCalledTimes(1);
    press({ key: 'g' });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(press({ key: 'i' }).defaultPrevented).toBe(false);
    press({ key: 'g' });
    press({ key: 'x' });
    press({ key: 'i' });
    expect(ran).toHaveBeenCalledTimes(1);
    press({ key: 'g' });
    press({ key: 'g' });
    press({ key: 'i' });
    expect(ran).toHaveBeenCalledTimes(2);
  });

  it('UIC-SHORTCUT-4.3 lets the first shortcut a chord matches decide between a chord and a sequence', () => {
    const ran = vi.fn();
    render(
      <>
        <Action name="Go" shortcut="G" onPress={ran} />
        <ShortcutScope>
          <Action name="Inbox" shortcut={['G', 'I']} onPress={ran} />
        </ShortcutScope>
      </>,
    );
    const inbox = screen.getByRole('button', { name: 'Inbox' });
    press({ key: 'g' }, inbox);
    press({ key: 'i' }, inbox);
    press({ key: 'g' });
    expect(ran.mock.calls).toEqual([['Inbox'], ['Go']]);
  });

  it('UIC-SHORTCUT-4.4 leaves fields, repeats, compositions and browser chords alone unless allowed', () => {
    const ran = vi.fn();
    render(
      <>
        <input aria-label="Name" />
        <Action name="Plain" shortcut="Ctrl+J" onPress={ran} />
        <Action name="Close" shortcut="Ctrl+W" onPress={ran} />
      </>,
    );
    const field = screen.getByRole('textbox', { name: 'Name' });
    press({ key: 'j', ctrlKey: true }, field);
    press({ key: 'j', ctrlKey: true, repeat: true });
    press({ key: 'j', ctrlKey: true, isComposing: true });
    press({ key: 'w', ctrlKey: true });
    expect(ran).not.toHaveBeenCalled();
    render(
      <>
        <Action name="Anywhere" shortcut="Ctrl+M" onPress={ran} allowsEditable allowsRepeat />
        <Action name="Owned close" shortcut="Ctrl+W" onPress={ran} allowsReserved />
      </>,
    );
    press({ key: 'm', ctrlKey: true, repeat: true }, field);
    press({ key: 'w', ctrlKey: true });
    expect(ran.mock.calls).toEqual([['Anywhere'], ['Owned close']]);
  });

  it('UIC-SHORTCUT-4.4 rechecks a shortcut against the reserved chords when its chord changes', () => {
    const ran = vi.fn();
    const { rerender } = render(<Action name="Close" shortcut="Ctrl+W" onPress={ran} />);
    for (let count = 0; count < 3; count += 1) press({ key: 'w', ctrlKey: true });
    expect(ran).not.toHaveBeenCalled();
    rerender(<Action name="Close" shortcut="Ctrl+E" onPress={ran} />);
    press({ key: 'e', ctrlKey: true });
    expect(ran.mock.calls).toEqual([['Close']]);
    rerender(<Action name="Close" shortcut="Ctrl+W" onPress={ran} />);
    press({ key: 'w', ctrlKey: true });
    expect(ran).toHaveBeenCalledOnce();
  });

  it('UIC-SHORTCUT-4.5 calls the latest callback, publishes its chord and goes with its owner', () => {
    const calls: string[] = [];
    function Counter() {
      const [count, setCount] = useState(0);
      const { ariaKeyShortcuts } = useShortcut('Ctrl+J', () => {
        calls.push(`press ${count}`);
        setCount(count + 1);
      });
      return <output aria-keyshortcuts={ariaKeyShortcuts}>{count}</output>;
    }
    const { unmount } = render(<Counter />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-keyshortcuts', 'Control+J');
    press({ key: 'j', ctrlKey: true });
    press({ key: 'j', ctrlKey: true });
    expect(calls).toEqual(['press 0', 'press 1']);
    unmount();
    press({ key: 'j', ctrlKey: true });
    expect(calls).toHaveLength(2);
  });

  it('UIC-SHORTCUT-4.5 keeps a scope in another document to that document', () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const inner = frame.contentDocument;
    if (!inner) throw new Error('No frame document');
    const ran = vi.fn();
    const { unmount } = render(
      <ShortcutScope>
        <Action name="Framed" shortcut="Ctrl+J" onPress={ran} />
      </ShortcutScope>,
      { container: inner.body },
    );
    press({ key: 'j', ctrlKey: true });
    expect(ran).not.toHaveBeenCalled();
    const button = inner.querySelector('button');
    if (!button) throw new Error('No framed button');
    press({ key: 'j', ctrlKey: true }, button);
    expect(ran.mock.calls).toEqual([['Framed']]);
    unmount();
    frame.remove();
  });
});
