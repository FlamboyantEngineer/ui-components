import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ColorField } from './color-field.js';

function input() {
  return screen.getByRole('textbox', { name: 'Accent' });
}

describe('ColorField typing', () => {
  it('UIC-COLOR-FIELD-4.3 draws a swatch button and a text input that carries the field', () => {
    const { container } = render(
      <ColorField
        id="accent"
        label="Accent"
        allowsTyping
        defaultValue="#336699"
        format="rgb"
        description="Brand colour."
      />,
    );
    const group = container.querySelector('.ui-color-field__group');
    expect(group).not.toBeNull();
    expect(input()).toHaveValue('rgb(51, 102, 153)');
    expect(input()).toHaveAttribute('id', 'accent-control');
    expect(input()).toHaveAccessibleDescription('Brand colour.');
    expect(input().closest('.ui-color-field__entry')).not.toBeNull();
    const button = screen.getByRole('button', { name: 'Accent picker' });
    expect(button).toHaveClass('ui-color-field__trigger');
    expect(button.querySelector('.ui-color-field__swatch')).not.toBeNull();
    expect(container.querySelector('.ui-color-field__value')).toBeNull();
    expectHooksMatchSpec(container, 'COLOR-FIELD', {
      slots: ['group', 'trigger', 'swatch', 'entry', 'input'],
    });
  });

  it('UIC-COLOR-FIELD-4.3 commits a typed colour in any form on Enter or blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <ColorField
        label="Accent"
        allowsTyping
        defaultValue="#336699"
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    expect(input()).toHaveValue('#336699');
    await user.clear(input());
    await user.type(input(), 'rgb(255, 0, 0)');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('#ff0000');
    expect(input()).toHaveValue('#FF0000');
    await user.clear(input());
    await user.type(input(), '00aa00');
    // Leaving the input applies the text; leaving the field commits it.
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('#00aa00');
    await user.click(input());
    await user.keyboard('{Control>}z{/Control}');
    expect(input()).toHaveValue('#FF0000');
  });

  it('UIC-COLOR-FIELD-4.3 UIC-FIELD-1.11 reaches the restore button by Tab and commits on leaving the field', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    function Saved() {
      const [value, setValue] = useState<string | null>('#cc3300');
      const [committed, setCommitted] = useState<string | null>('#336699');
      return (
        <ColorField
          label="Accent"
          allowsTyping
          value={value}
          onChange={setValue}
          committedValue={committed}
          onCommit={(next) => {
            onCommit(next);
            setCommitted(next);
          }}
        />
      );
    }
    render(<Saved />);
    expect(screen.getByRole('button', { name: 'Restore Accent' })).toBeInTheDocument();
    await user.clear(input());
    await user.type(input(), '#00aa00');
    await user.tab();
    const restore = screen.getByRole('button', { name: 'Restore Accent' });
    expect(restore).toHaveFocus();
    expect(input()).toHaveValue('#00AA00');
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('#00aa00');
    expect(restore).not.toBeInTheDocument();
  });

  it('UIC-COLOR-FIELD-4.3 UIC-FIELD-1.11 applies typed text when focus moves to the swatch button', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<ColorField label="Accent" allowsTyping defaultValue="#336699" onCommit={onCommit} />);
    await user.clear(input());
    await user.type(input(), 'f00');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Accent picker' })).toHaveFocus();
    expect(input()).toHaveValue('#FF0000');
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Accent' })).toHaveFocus();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('#ff0000');
  });

  it('UIC-COLOR-FIELD-4.3 puts back unreadable text and clears an optional value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { unmount } = render(
      <ColorField
        label="Accent"
        allowsTyping
        defaultValue="#336699"
        placeholder="Pick a colour"
        onCommit={onCommit}
      />,
    );
    await user.clear(input());
    await user.type(input(), 'not a colour{Enter}');
    expect(input()).toHaveValue('#336699');
    await user.type(input(), '0{Escape}');
    expect(input()).toHaveValue('#336699');
    await user.clear(input());
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(input()).toHaveValue('');
    expect(input()).toHaveAttribute('placeholder', 'Pick a colour');
    unmount();

    render(<ColorField label="Accent" allowsTyping isRequired defaultValue="#336699" />);
    await user.clear(input());
    await user.tab();
    expect(input()).toHaveValue('#336699');
  });

  it('UIC-COLOR-FIELD-4.3 opens the picker from the swatch button and locks with the field', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorField label="Accent" allowsTyping defaultValue="#336699" />);
    await user.click(screen.getByRole('button', { name: 'Accent picker' }));
    expect(await screen.findByRole('dialog', { name: 'Accent' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<ColorField label="Accent" allowsTyping value="#336699" isReadOnly />);
    expect(input()).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Accent picker' })).toBeDisabled();
    rerender(<ColorField label="Accent" allowsTyping value="#336699" isDisabled />);
    expect(input()).toBeDisabled();
  });
});
