import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { deepActive, inShadow, ShadowHost } from '../../../test/shadow-fixtures.js';
import { Form } from '../form/form.js';
import { PinInput, type PinInputProps } from './pin-input.js';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function cells() {
  return screen.getAllByRole<HTMLInputElement>('textbox');
}

function values() {
  return cells().map((cell) => cell.value);
}

function focusedIndex() {
  return cells().indexOf(document.activeElement as HTMLInputElement);
}

function message(container: HTMLElement) {
  return container.querySelector('.ui-field__message')?.textContent;
}

/** A code whose committed value is the caller's, as when a form saves it. */
function SavedCode(props: Omit<PinInputProps, 'label' | 'length'>) {
  const [saved, setSaved] = useState('1234');
  return (
    <>
      <PinInput label="Code" length={4} committedValue={saved} onCommit={setSaved} {...props} />
      <output>{saved}</output>
    </>
  );
}

describe('PinInput', () => {
  it('UIC-PIN-INPUT-1.1 is a field around a group of cells that starts empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<PinInput label="Code" length={4} onChange={onChange} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-pin-input');
    const group = screen.getByRole('group', { name: 'Code' });
    expect(group).toHaveClass('ui-pin-input__group');
    expect(within(group).getAllByRole('textbox')).toHaveLength(4);
    expect(values()).toEqual(['', '', '', '']);
    expect(root(container)).not.toHaveAttribute('data-complete');
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('12');
    expect(onChange).toHaveBeenLastCalledWith('12');
    expect(cells().map((cell) => cell.hasAttribute('data-filled'))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    await user.keyboard('34');
    expect(root(container)).toHaveAttribute('data-complete', 'true');
    expectHooksMatchSpec(container, 'PIN-INPUT', { slots: 'all' });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-PIN-INPUT-1.2 names the group and each cell and describes the cells', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <PinInput id="code" label="Code" length={3} description="Sent by message." isRequired />,
    );
    expect(cells().map((cell) => cell.getAttribute('aria-label'))).toEqual([
      'Character 1 of 3',
      'Character 2 of 3',
      'Character 3 of 3',
    ]);
    for (const cell of cells()) {
      expect(cell).toHaveAttribute('aria-required', 'true');
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell).toHaveAttribute('aria-errormessage', 'code-message');
      expect(cell).toHaveAccessibleDescription('Sent by message. A value is required.');
    }
    expect(screen.getByRole('group', { name: 'Code' })).toHaveAttribute('data-invalid', 'true');
    await user.click(screen.getByText('Code'));
    expect(focusedIndex()).toBe(0);
    rerender(<PinInput id="code" label="Code" labelLayout="control-only" length={3} isDisabled />);
    expect(screen.getByRole('group', { name: 'Code' })).toHaveAttribute('data-disabled', 'true');
    for (const cell of cells()) expect(cell).toBeDisabled();
    rerender(<PinInput id="code" label="Code" length={3} isReadOnly />);
    expect(screen.getByRole('group', { name: 'Code' })).toHaveAttribute('data-readonly', 'true');
    expectHooksMatchSpec(container, 'PIN-INPUT', { slots: 'all' });
  });

  it('UIC-PIN-INPUT-1.3 takes only the characters of its type', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PinInput label="Code" length={4} />);
    expect(cells()[0]).toHaveAttribute('inputmode', 'numeric');
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('a1-b2');
    expect(values()).toEqual(['1', '2', '', '']);
    unmount();
    const { unmount: next } = render(<PinInput label="Code" length={4} type="alphabetic" />);
    expect(cells()[0]).toHaveAttribute('inputmode', 'text');
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('a1B2');
    expect(values()).toEqual(['a', 'B', '', '']);
    next();
    render(<PinInput label="Code" length={4} type="alphanumeric" />);
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('a1-B');
    expect(values()).toEqual(['a', '1', 'B', '']);
  });

  it('UIC-PIN-INPUT-1.4 masks the characters and shows a placeholder in empty cells', () => {
    const { container } = render(
      <PinInput label="Code" length={3} mask placeholder="○" defaultValue="1" />,
    );
    const masked = [...container.querySelectorAll('.ui-pin-input__cell')];
    expect(masked).toHaveLength(3);
    for (const cell of masked) {
      expect(cell).toHaveAttribute('type', 'password');
      expect(cell).toHaveAttribute('placeholder', '○');
    }
    expect(masked[0]).toHaveValue('1');
  });

  it('UIC-PIN-INPUT-1.5 puts the autocomplete hint on the first cell and spreads autofill', () => {
    const onComplete = vi.fn();
    render(
      <PinInput label="Code" length={4} autoComplete="one-time-code" onComplete={onComplete} />,
    );
    expect(cells().map((cell) => cell.getAttribute('autocomplete'))).toEqual([
      'one-time-code',
      'off',
      'off',
      'off',
    ]);
    // eslint-disable-next-line testing-library/prefer-user-event -- autofill writes the whole value in one change event; user-event types per character and its paste reaches onPaste instead
    fireEvent.change(cells()[0] as HTMLElement, { target: { value: '4821' } });
    expect(values()).toEqual(['4', '8', '2', '1']);
    expect(onComplete).toHaveBeenCalledWith('4821');
  });

  it('UIC-PIN-INPUT-1.5 reads autofill in a filled cell whole and typing beside a character by its data', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onCommit = vi.fn();
    const { rerender } = render(
      <PinInput
        key="a"
        label="Code"
        length={2}
        defaultValue="11"
        onComplete={onComplete}
        onCommit={onCommit}
      />,
    );
    const autofill = (index: number, value: string) =>
      // eslint-disable-next-line testing-library/prefer-user-event -- autofill replaces the cell's text in one input event with no typed data; user-event types per character
      fireEvent.input(cells()[index] as HTMLElement, {
        target: { value },
        inputType: 'insertReplacementText',
      });
    autofill(0, '23');
    expect(values()).toEqual(['2', '3']);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('23');
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('23');
    // Autofill whose text starts or ends with the cell's character still counts whole.
    autofill(0, '21');
    expect(values()).toEqual(['2', '1']);
    autofill(0, '12');
    expect(values()).toEqual(['1', '2']);
    expect(onComplete.mock.calls).toEqual([['23'], ['21'], ['12']]);
    // An empty cell takes autofill whole too.
    rerender(<PinInput key="b" label="Code" length={2} onComplete={onComplete} />);
    autofill(0, '45');
    expect(values()).toEqual(['4', '5']);
    expect(onComplete).toHaveBeenLastCalledWith('45');
    // Typing with the caret before or after a cell's character writes only the typed one.
    rerender(<PinInput key="c" label="Code" length={2} defaultValue="11" />);
    await user.type(cells()[0] as HTMLElement, '7', {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });
    expect(values()).toEqual(['7', '1']);
    await user.type(cells()[0] as HTMLElement, '8', {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });
    expect(values()).toEqual(['8', '1']);
  });

  it('UIC-PIN-INPUT-1.6 submits the joined value under its name, and nothing while disabled', async () => {
    const user = userEvent.setup();
    let submitted: FormDataEntryValue[] = [];
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitted = new FormData(event.currentTarget).getAll('code');
    };
    const { rerender } = render(
      <Form aria-label="Verify" onSubmit={onSubmit}>
        <PinInput label="Code" length={4} name="code" defaultValue="1234" />
        <button type="submit">Verify</button>
      </Form>,
    );
    for (const cell of cells()) expect(cell).not.toHaveAttribute('name');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(submitted).toEqual(['1234']);
    rerender(
      <Form aria-label="Verify" onSubmit={onSubmit}>
        <PinInput label="Code" length={4} name="code" defaultValue="1234" isDisabled />
        <button type="submit">Verify</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(submitted).toEqual([]);
  });

  it('UIC-PIN-INPUT-1.6 UIC-FIELD-2.6 puts the first code back on a native form reset', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Verify">
        <PinInput label="Code" length={4} name="code" defaultValue="1" />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Verify' });
    await user.click(cells()[1] as HTMLElement);
    await user.keyboard('2');
    expect(new FormData(form).get('code')).toBe('12');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(new FormData(form).get('code')).toBe('1'));
    expect(values()).toEqual(['1', '', '', '']);
  });

  it('UIC-PIN-INPUT-1.7 UIC-PIN-INPUT-2.3 refuses edits while read-only but still moves, except on composing keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PinInput label="Code" length={4} defaultValue="123" isReadOnly onChange={onChange} />);
    for (const cell of cells()) expect(cell).toHaveAttribute('readonly');
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('9{Backspace}');
    await user.paste('77');
    expect(values()).toEqual(['1', '2', '3', '']);
    expect(onChange).not.toHaveBeenCalled();
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(cells()[0] as HTMLElement, { key: 'ArrowRight', isComposing: true });
    expect(focusedIndex()).toBe(0);
    await user.keyboard('{ArrowRight}');
    expect(focusedIndex()).toBe(1);
  });

  it('UIC-PIN-INPUT-1.8 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <PinInput id="code" label="Code" length={4} className="wide" data-test="code" />,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-pin-input', 'wide');
    expect(root(container)).toHaveAttribute('data-test', 'code');
    expect(root(container)).toHaveAttribute('id', 'code');
    expect(cells()[0]).toHaveAttribute('id', 'code-control');
    expectHooksMatchSpec(container, 'PIN-INPUT', { callerAttributes: ['data-test'] });
  });

  it('UIC-PIN-INPUT-2.1 advances as characters are typed and replaces a focused character', async () => {
    const user = userEvent.setup();
    render(<PinInput label="Code" length={4} />);
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('1');
    expect(focusedIndex()).toBe(1);
    await user.keyboard('234');
    expect(values()).toEqual(['1', '2', '3', '4']);
    expect(focusedIndex()).toBe(3);
    await user.click(cells()[1] as HTMLElement);
    expect(cells()[1]?.selectionStart).toBe(0);
    expect(cells()[1]?.selectionEnd).toBe(1);
    await user.keyboard('9');
    expect(values()).toEqual(['1', '9', '3', '4']);
    expect(focusedIndex()).toBe(2);
    await user.keyboard('3');
    expect(focusedIndex()).toBe(3);
    cells()[1]?.focus();
    cells()[1]?.setSelectionRange(1, 1);
    await user.keyboard('5');
    expect(values()).toEqual(['1', '5', '3', '4']);
  });

  it('UIC-PIN-INPUT-2.1 advances inside a shadow root', () => {
    render(
      <ShadowHost name="page">
        <PinInput label="Code" length={4} />
      </ShadowHost>,
    );
    const [first, second] = inShadow('page').getAllByRole('textbox');
    act(() => first?.focus());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event's typing does not reach a React input inside a shadow root
    fireEvent.change(first as HTMLElement, { target: { value: '1' } });
    expect(deepActive()).toBe(second);
  });

  it('UIC-PIN-INPUT-2.1 follows a value the caller changes and stays put when it refuses one', async () => {
    const user = userEvent.setup();
    function Upper() {
      const [code, setCode] = useState('');
      return (
        <PinInput
          label="Code"
          length={3}
          type="alphabetic"
          value={code}
          onChange={(next) => setCode(next.toUpperCase())}
        />
      );
    }
    const { unmount } = render(<Upper />);
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('ab');
    expect(values()).toEqual(['A', 'B', '']);
    expect(focusedIndex()).toBe(2);
    unmount();
    const { rerender } = render(<PinInput label="Code" length={3} value="" onChange={() => {}} />);
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('1');
    expect(values()).toEqual(['', '', '']);
    expect(focusedIndex()).toBe(0);
    await user.tab();
    rerender(<PinInput label="Code" length={3} value="12" onChange={() => {}} />);
    expect(document.body).toHaveFocus();
  });

  it('UIC-PIN-INPUT-2.1 keeps composed text in its cell until the composition ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(
      <PinInput
        label="Code"
        length={2}
        type="alphabetic"
        onChange={onChange}
        onComplete={onComplete}
      />,
    );
    const first = cells()[0] as HTMLElement;
    await user.click(first);

    fireEvent.compositionStart(first);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot compose with an input method
    fireEvent.input(first, { target: { value: 'k' }, isComposing: true });
    expect(values()).toEqual(['k', '']);
    expect(focusedIndex()).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
    // A cancelled composition puts the cell's character back.

    fireEvent.compositionEnd(first, { data: '' });
    expect(values()).toEqual(['', '']);
    expect(onChange).not.toHaveBeenCalled();
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot compose with an input method
    fireEvent.input(first, { target: { value: 'k' }, isComposing: true });

    fireEvent.compositionEnd(first, { data: 'k' });
    expect(values()).toEqual(['k', '']);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('k');
    expect(focusedIndex()).toBe(1);
    await user.keyboard('m');
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('km');
  });

  it('UIC-PIN-INPUT-2.2 erases and moves back with Backspace, closing gaps', async () => {
    const user = userEvent.setup();
    render(<PinInput label="Code" length={4} defaultValue="12" />);
    await user.click(cells()[2] as HTMLElement);
    await user.keyboard('{Backspace}');
    expect(values()).toEqual(['1', '', '', '']);
    expect(focusedIndex()).toBe(1);
    await user.keyboard('234');
    await user.click(cells()[1] as HTMLElement);
    await user.keyboard('{Backspace}');
    expect(values()).toEqual(['1', '3', '4', '']);
    expect(focusedIndex()).toBe(0);
    await user.keyboard('{Backspace}{Backspace}');
    expect(values()).toEqual(['4', '', '', '']);
    expect(focusedIndex()).toBe(0);
  });

  it('UIC-PIN-INPUT-2.8 removes a character deleted or cut natively and keeps focus on its cell', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(
      <form aria-label="Verify">
        <PinInput
          label="Code"
          length={4}
          name="code"
          defaultValue="1234"
          onChange={onChange}
          onComplete={onComplete}
        />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Verify' });
    await user.click(cells()[1] as HTMLElement);
    await user.keyboard('{Delete}');
    expect(values()).toEqual(['1', '3', '4', '']);
    expect(onChange).toHaveBeenLastCalledWith('134');
    expect(new FormData(form).get('code')).toBe('134');
    expect(focusedIndex()).toBe(1);
    await user.click(cells()[0] as HTMLElement);
    await user.cut();
    expect(values()).toEqual(['3', '4', '', '']);
    expect(focusedIndex()).toBe(0);
    await user.click(cells()[2] as HTMLElement);
    expect(focusedIndex()).toBe(2);
    await user.keyboard('{Delete}');
    expect(values()).toEqual(['3', '4', '', '']);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('UIC-PIN-INPUT-2.8 deletes from masked cells, erases once with Backspace and refuses while read-only', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PinInput label="Code" length={4} defaultValue="1234" mask />);
    const masked = () => [...document.querySelectorAll<HTMLInputElement>('.ui-pin-input__cell')];
    await user.click(masked()[3] as HTMLElement);
    await user.keyboard('{Delete}');
    expect(masked().map((cell) => cell.value)).toEqual(['1', '2', '3', '']);
    await user.click(masked()[1] as HTMLElement);
    await user.keyboard('{Backspace}');
    expect(masked().map((cell) => cell.value)).toEqual(['1', '3', '', '']);
    rerender(<PinInput label="Code" length={4} defaultValue="1234" mask isReadOnly />);
    await user.click(masked()[0] as HTMLElement);
    await user.keyboard('{Delete}');
    expect(masked().map((cell) => cell.value)).toEqual(['1', '3', '', '']);
  });

  it('UIC-PIN-INPUT-2.3 moves with the arrows, Home and End and keeps one cell in the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <PinInput label="Code" length={4} defaultValue="12" />
        <button type="button">After</button>
      </>,
    );
    expect(cells().map((cell) => cell.tabIndex)).toEqual([-1, -1, 0, -1]);
    await user.click(cells()[3] as HTMLElement);
    expect(focusedIndex()).toBe(2);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(focusedIndex()).toBe(0);
    await user.keyboard('{ArrowLeft}');
    expect(focusedIndex()).toBe(0);
    await user.keyboard('{End}');
    expect(focusedIndex()).toBe(2);
    await user.keyboard('{ArrowRight}');
    expect(focusedIndex()).toBe(2);
    await user.keyboard('{Home}{ArrowRight}');
    expect(focusedIndex()).toBe(1);
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(focusedIndex()).toBe(2);
  });

  it('UIC-PIN-INPUT-2.3 mirrors the arrow keys in a right-to-left locale', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="he-IL">
        <PinInput label="Code" length={4} defaultValue="123" />
      </I18nProvider>,
    );
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('{ArrowLeft}');
    expect(focusedIndex()).toBe(1);
    await user.keyboard('{ArrowRight}');
    expect(focusedIndex()).toBe(0);
  });

  it('UIC-PIN-INPUT-2.4 fills the cells from the focused one with pasted characters', async () => {
    const user = userEvent.setup();
    render(<PinInput label="Code" length={6} defaultValue="123456" />);
    await user.click(cells()[2] as HTMLElement);
    await user.paste('9 9');
    expect(values()).toEqual(['1', '2', '9', '9', '5', '6']);
    expect(focusedIndex()).toBe(4);
    await user.paste('87654');
    expect(values()).toEqual(['1', '2', '9', '9', '8', '7']);
    expect(focusedIndex()).toBe(5);
    await user.paste('--');
    expect(values()).toEqual(['1', '2', '9', '9', '8', '7']);
  });

  it('UIC-PIN-INPUT-2.5 commits and calls onComplete once per complete code', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onCommit = vi.fn();
    render(
      <>
        <PinInput label="Code" length={4} onComplete={onComplete} onCommit={onCommit} />
        <button type="button">After</button>
      </>,
    );
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('123');
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('4');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(onCommit).toHaveBeenLastCalledWith('1234');
    await user.keyboard('4');
    await user.paste('4');
    expect(onComplete).toHaveBeenCalledTimes(1);
    await user.keyboard('5');
    expect(onComplete).toHaveBeenLastCalledWith('1235');
    await user.keyboard('{Backspace}{Backspace}');
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(onCommit).toHaveBeenLastCalledWith('12');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('UIC-PIN-INPUT-2.5 commits and completes with the code a caller changes', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onCommit = vi.fn();
    function Upper() {
      const [value, setValue] = useState('');
      return (
        <PinInput
          label="Code"
          length={2}
          type="alphanumeric"
          value={value}
          onChange={(next) => setValue(next.toUpperCase())}
          onComplete={onComplete}
          onCommit={onCommit}
        />
      );
    }
    const { container } = render(<Upper />);
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('ab');
    expect(values()).toEqual(['A', 'B']);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('AB');
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('AB');
    expect(root(container)).not.toHaveAttribute('data-dirty');
  });

  it('UIC-PIN-INPUT-2.5 completes from the code the caller renders, once per edit', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onCommit = vi.fn();
    function Owned({ accept }: { accept: (next: string) => string | null }) {
      const [value, setValue] = useState('');
      return (
        <>
          <PinInput
            label="Code"
            length={4}
            value={value}
            onChange={(next) => {
              const accepted = accept(next);
              if (accepted !== null) setValue(accepted);
            }}
            onComplete={onComplete}
            onCommit={onCommit}
          />
          <button type="button" onClick={() => setValue('9876')}>
            Fill
          </button>
        </>
      );
    }
    const { rerender } = render(<Owned key="cut" accept={(next) => next.slice(0, 3)} />);
    await user.click(cells()[0] as HTMLElement);
    await user.paste('1234');
    expect(values()).toEqual(['1', '2', '3', '']);
    expect(focusedIndex()).toBe(3);
    expect(onCommit).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    // A value the caller sets itself is not an edit: it neither completes nor commits.
    await user.click(screen.getByRole('button', { name: 'Fill' }));
    expect(values()).toEqual(['9', '8', '7', '6']);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('123');

    rerender(<Owned key="ignore" accept={() => null} />);
    await user.click(cells()[0] as HTMLElement);
    await user.paste('1234');
    expect(values()).toEqual(['', '', '', '']);
    expect(focusedIndex()).toBe(0);
    rerender(<Owned key="drop" accept={(next) => next.replace(/[0-9]/g, '')} />);
    await user.click(cells()[0] as HTMLElement);
    await user.paste('1234');
    expect(values()).toEqual(['', '', '', '']);
    expect(onComplete).not.toHaveBeenCalled();

    rerender(<Owned key="pad" accept={(next) => next.padEnd(4, '0')} />);
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('5');
    expect(values()).toEqual(['5', '0', '0', '0']);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('5000');
    expect(onCommit).toHaveBeenLastCalledWith('5000');
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('UIC-PIN-INPUT-2.5 UIC-FIELD-1.11 keeps an edited code until focus leaves the field', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <>
        <PinInput label="Code" length={4} onCommit={onCommit} />
        <button type="button">After</button>
      </>,
    );
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('12');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Code' })).toHaveFocus();
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('12');
  });

  it('UIC-PIN-INPUT-2.6 reports a partly filled code', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PinInput
        label="Code"
        length={4}
        validate={(value) =>
          value === '0000' ? { severity: 'error', message: 'Try another code.' } : null
        }
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    await user.click(cells()[0] as HTMLElement);
    await user.keyboard('00');
    expect(message(container)).toBe('Use at least 4 characters.');
    await user.keyboard('00');
    expect(message(container)).toBe('Try another code.');
    await user.keyboard('{Backspace}{ArrowRight}5');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-PIN-INPUT-2.6 reports a supplied code of the wrong length or characters and blocks its form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
    function Verify(props: Omit<PinInputProps, 'label'>) {
      return (
        <Form aria-label="Verify" onSubmit={onSubmit}>
          <PinInput label="Code" name="code" validationMode="immediate" {...props} />
          <button type="submit">Verify</button>
        </Form>
      );
    }
    const { container, rerender } = render(<Verify length={4} value="12x456" />);
    expect(values()).toEqual(['1', '2', 'x', '4']);
    expect(message(container)).toBe('Enter a value in the expected format.');
    expect(root(container)).not.toHaveAttribute('data-complete');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(<Verify length={4} value="1234" />);
    expect(root(container)).toHaveAttribute('data-complete', 'true');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    rerender(<Verify length={2} value="1234" />);
    expect(values()).toEqual(['1', '2']);
    expect(message(container)).toBe('Use 2 characters or fewer.');
    expect(root(container)).not.toHaveAttribute('data-complete');
    rerender(<Verify length={6} value="1234" />);
    expect(message(container)).toBe('Use at least 6 characters.');
    rerender(<Verify length={4} type="alphabetic" value="1234" />);
    expect(message(container)).toBe('Enter a value in the expected format.');
    rerender(<Verify length={4} type="alphabetic" value="abcd" />);
    expect(root(container)).toHaveAttribute('data-complete', 'true');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(<Verify length={4} value="" />);
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    rerender(<Verify length={4} value="" isRequired />);
    expect(message(container)).toBe('A value is required.');
  });

  it('UIC-PIN-INPUT-2.7 shows dirty state, restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    const { container } = render(<SavedCode />);
    await user.click(cells()[3] as HTMLElement);
    await user.keyboard('9');
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('1239');
    await user.keyboard('{Backspace}');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Code' }));
    expect(values()).toEqual(['1', '2', '3', '9']);
    expect(focusedIndex()).toBe(0);
    await user.keyboard('{Control>}z{/Control}');
    expect(values()).toEqual(['1', '2', '3', '']);
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(values()).toEqual(['1', '2', '3', '9']);
    await chooseFieldMenuItem(user, cells()[0] as HTMLElement, 'Clear');
    expect(values()).toEqual(['', '', '', '']);
  });
});
