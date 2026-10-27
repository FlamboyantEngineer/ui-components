import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField, type TextFieldControlProps, type TextFieldElement } from './text-field.js';

/** A caller-owned suggestion list wired to the control through `controlProps`. */
function SuggestingField({ onInput }: { onInput: TextFieldControlProps['onInput'] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <TextField
        label="City"
        controlProps={{
          role: 'combobox',
          'aria-controls': 'city-suggestions',
          'aria-expanded': isOpen,
          'aria-autocomplete': 'list',
          'aria-activedescendant': isOpen ? 'city-oslo' : undefined,
          onInput: (event) => {
            setIsOpen(event.currentTarget.value !== '');
            onInput?.(event);
          },
        }}
      />
      <ul id="city-suggestions" role="listbox" aria-label="Suggestions">
        <li id="city-oslo" role="option" aria-selected="true">
          Oslo
        </li>
      </ul>
    </>
  );
}

describe('TextField control access', () => {
  it('UIC-TEXT-FIELD-6.1 hands the input to an object ref that focuses and selects its text', async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    const { container, unmount } = render(
      <TextField label="Fruit" defaultValue="Apple" inputRef={inputRef} />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(inputRef.current).toBe(input);
    inputRef.current?.focus();
    inputRef.current?.select();
    expect(input).toHaveFocus();
    await user.keyboard('Pear');
    expect(input).toHaveValue('Pear');
    expect(container.querySelector('.ui-field')).not.toHaveAttribute('aria-controls');
    unmount();
    expect(inputRef.current).toBeNull();
  });

  it('UIC-TEXT-FIELD-6.1 swaps the refs when the field turns multiline and keeps a callback attached across renders', () => {
    const calls: Array<string | null> = [];
    const inputRef = createRef<HTMLInputElement>();
    const textAreaRef = (node: HTMLTextAreaElement | null) => {
      calls.push(node ? node.tagName : null);
    };
    const field = (multiline: boolean, description: string) => (
      <TextField
        label="Notes"
        multiline={multiline}
        description={description}
        inputRef={inputRef}
        textAreaRef={textAreaRef}
      />
    );
    const { rerender, unmount } = render(field(false, 'One'));
    expect(inputRef.current?.tagName).toBe('INPUT');
    rerender(field(true, 'One'));
    rerender(field(true, 'Two'));
    expect(inputRef.current).toBeNull();
    expect(calls).toEqual(['TEXTAREA']);
    unmount();
    expect(calls).toEqual(['TEXTAREA', null]);
  });

  it('UIC-TEXT-FIELD-6.2 puts suggestion ARIA and input events on the control after the transform', async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    render(<SuggestingField onInput={(event) => values.push(event.currentTarget.value)} />);
    const input = screen.getByRole('combobox', { name: 'City' });
    expect(input).toHaveAttribute('aria-controls', 'city-suggestions');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await user.type(input, 'Os');
    expect(values).toEqual(['O', 'Os']);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', 'city-oslo');
  });

  it('UIC-TEXT-FIELD-6.2 keeps the transform, Escape and composition beside the caller handlers', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    const record = (name: string) => (event: { currentTarget: TextFieldElement }) => {
      seen.push(`${name}:${event.currentTarget.value}`);
    };
    const onCommit = vi.fn();
    render(
      <TextField
        label="Code"
        multiline
        transformInput={(text) => text.toUpperCase()}
        onCommit={onCommit}
        controlProps={{
          onInput: record('input'),
          onSelect: record('select'),
          onCompositionStart: record('compositionstart'),
          onCompositionEnd: record('compositionend'),
        }}
      />,
    );
    const area = screen.getByRole('textbox', { name: 'Code' });
    await user.type(area, 'ab');
    expect(area).toHaveValue('AB');
    // The input event carries the browser's edit; the transform then rewrites the value.
    expect(seen).toContain('input:a');
    expect(seen.some((entry) => entry.startsWith('select:'))).toBe(true);
    fireEvent.compositionStart(area);
    fireEvent.compositionEnd(area, { data: 'c' });
    expect(seen).toContain('compositionstart:AB');
    expect(seen.at(-1)).toMatch(/^compositionend:/);
    await user.keyboard('{Escape}');
    expect(area).toHaveValue('');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-TEXT-FIELD-6.2 keeps the field completion attributes over the caller ARIA', async () => {
    const user = userEvent.setup();
    render(
      <TextField
        label="Fruit"
        completions={[{ label: 'Apple' }]}
        controlProps={{ 'aria-controls': 'elsewhere', 'aria-autocomplete': 'none' }}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 'Ap');
    await screen.findByRole('listbox');
    expect(input.getAttribute('aria-controls')).not.toBe('elsewhere');
    expect(input).not.toHaveAttribute('aria-autocomplete', 'none');
  });
});
